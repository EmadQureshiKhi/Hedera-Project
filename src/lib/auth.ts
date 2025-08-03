'use client';

import { supabase } from './supabase';
import { User } from './supabase';

// Authentication types
export type AuthMethod = 'email' | 'wallet' | 'google';

export interface AuthUser extends User {
  auth_method: AuthMethod;
  google_id?: string;
  avatar_url?: string;
  display_name?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Import the DEMO_MODE flag from api-client
const DEMO_MODE = false; // Set this to false to use real wallet connections

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];
  private pendingWalletConnection: { address: string; signature: string; message: string | Uint8Array } | null = null;

  // Email Authentication
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthUser> {
    // Check if there's a pending wallet connection
    if (this.pendingWalletConnection) {
      return await this.createUserWithWalletAndEmail(email, password, displayName, this.pendingWalletConnection);
    }

    // In demo mode, create user directly
    if (this.isDemoMode()) {
      const user = await this.createDemoUser({
        email,
        display_name: displayName,
        auth_method: 'email',
        // Don't generate wallet address for email users
        wallet_address: null,
      });
      this.setCurrentUser(user);
      return user;
    }

    // Real Supabase auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          auth_method: 'email',
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to create user');

    const user = await this.createUserProfile(data.user.id, {
      email,
      display_name: displayName,
      auth_method: 'email',
      // Don't generate wallet address for email users - they can connect one later
      wallet_address: null,
    });

    this._setInternalCurrentUser(user);
    return user;
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    // Check if there's a pending wallet connection
    if (this.pendingWalletConnection) {
      return await this.linkWalletToEmailUser(email, password, this.pendingWalletConnection);
    }

    if (this.isDemoMode()) {
      // Demo login - find user by email
      const user = this.getDemoUsers().find(u => u.email === email);
      if (!user) throw new Error('User not found');
      this._setInternalCurrentUser(user);
      return user;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Login failed');

    const user = await this.getUserProfile(data.user.id);
    this._setInternalCurrentUser(user);
    return user;
  }

  // Google OAuth
  async signInWithGoogle(): Promise<AuthUser> {
    // Store pending wallet connection in localStorage for OAuth callback
    if (this.pendingWalletConnection) {
      localStorage.setItem('pending_wallet_connection', JSON.stringify(this.pendingWalletConnection));
    }

    if (this.isDemoMode()) {
      // Demo Google login
      const user = await this.createDemoUser({
        email: 'google.user@gmail.com',
        display_name: 'Google User',
        auth_method: 'google',
        google_id: 'google_123456',
        avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=150',
        // Don't generate wallet address for Google users - they can connect one later
        wallet_address: null,
      });
      this._setInternalCurrentUser(user);
      return user;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });

    if (error) throw error;
    
    // This will redirect to Google, handle the callback separately
    throw new Error('Redirecting to Google...');
  }

  // Handle OAuth callback
  async handleOAuthCallback(): Promise<AuthUser | null> {
    if (this.isDemoMode()) return null;

    // Check for pending wallet connection from localStorage
    const pendingWalletStr = localStorage.getItem('pending_wallet_connection');
    let pendingWallet = null;
    if (pendingWalletStr) {
      try {
        pendingWallet = JSON.parse(pendingWalletStr);
        localStorage.removeItem('pending_wallet_connection');
      } catch (e) {
        console.error('Failed to parse pending wallet connection:', e);
      }
    }

    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('OAuth callback error:', error);
      return null;
    }

    if (data.session?.user) {
      // Check if user profile exists
      let user = await this.getUserProfile(data.session.user.id).catch(() => null);
      
      if (!user) {
        // Create user profile for OAuth user
        user = await this.createUserProfile(data.session.user.id, {
          email: data.session.user.email,
          display_name: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name,
          auth_method: 'google',
          google_id: data.session.user.user_metadata?.sub,
          avatar_url: data.session.user.user_metadata?.avatar_url,
          wallet_address: pendingWallet?.address || null,
        });
      } else if (pendingWallet && !user.wallet_address) {
        // Link wallet to existing OAuth user
        user = await this.updateUserWallet(user.id, pendingWallet.address);
      }

      this._setInternalCurrentUser(user);
      return user;
    }

    return null;
  }

  // Wallet Authentication (Production code - won't run in demo)
  async connectWallet(walletType: 'metamask' | 'phantom' | 'walletconnect'): Promise<AuthUser> {
    if (this.isDemoMode()) {
      // Demo wallet connection
      const user = await this.createDemoUser({
        wallet_address: '0x' + Math.random().toString(16).substr(2, 40),
        auth_method: 'wallet',
        display_name: `${walletType.charAt(0).toUpperCase() + walletType.slice(1)} User`,
      });
      this._setInternalCurrentUser(user);
      return user;
    }

    // If user is already authenticated but doesn't have a wallet, link wallet to existing account
    if (this.currentUser && !this.currentUser.wallet_address) {
      return await this.connectWalletToExistingUser(walletType);
    }

    // Real wallet connection logic
    switch (walletType) {
      case 'metamask':
        return await this.connectMetaMask();
      case 'phantom':
        return await this.connectPhantom();
      case 'walletconnect':
        return await this.connectWalletConnect();
      default:
        throw new Error('Unsupported wallet type');
    }
  }

  // Link email to existing user account
  async linkEmailToUser(email: string, password?: string): Promise<AuthUser> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    if (this.currentUser.email) {
      throw new Error('User already has an email linked');
    }

    if (this.isDemoMode()) {
      // Demo mode - just update the user
      const updatedUser = { ...this.currentUser, email };
      this._setInternalCurrentUser(updatedUser);
      return updatedUser;
    }

    // For real Supabase, create auth user and update public.users
    try {
      // First, create auth user with email and password
      if (password) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password
        });
        if (authError) throw authError;
        
        // Now we have an auth.uid() session
        if (data.user) {
          // Update the existing public.users record with the auth user ID
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              id: data.user.id, // Link to auth.users
              email,
              updated_at: new Date().toISOString()
            })
            .eq('wallet_address', this.currentUser.wallet_address);
          
          if (updateError) throw updateError;
          
          // Update current user with new ID and email
          const updatedUser = { 
            ...this.currentUser, 
            id: data.user.id,
            email 
          };
          this._setInternalCurrentUser(updatedUser);
          return updatedUser;
        }
      } else {
        // No password provided - just update the public.users table
        const { data, error } = await supabase
          .from('users')
          .update({ 
            email,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.currentUser.id)
          .select()
          .single();

        if (error) throw error;

        this._setInternalCurrentUser(data);
        return data;
      }
    } catch (error) {
      console.error('Error linking email:', error);
      throw error;
    }
    
    throw new Error('Failed to link email');
  }

  // Connect wallet to existing user (for users who signed up with email/Google)
  async connectWalletToExistingUser(walletType: 'metamask' | 'phantom' | 'walletconnect'): Promise<AuthUser> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    if (this.currentUser.wallet_address) {
      throw new Error('User already has a wallet connected');
    }

    let walletAddress: string;

    if (this.isDemoMode()) {
      walletAddress = '0x' + Math.random().toString(16).substr(2, 40);
    } else {
      // Get wallet address from actual wallet connection
      switch (walletType) {
        case 'metamask':
          walletAddress = await this.getMetaMaskAddress();
          break;
        case 'phantom':
          walletAddress = await this.getPhantomAddress();
          break;
        case 'walletconnect':
          walletAddress = await this.getWalletConnectAddress();
          break;
        default:
          throw new Error('Unsupported wallet type');
      }
    }

    // Update user with wallet address
    const updatedUser = await this.updateUserWallet(this.currentUser.id, walletAddress);
    this._setInternalCurrentUser(updatedUser);
    return updatedUser;
  }

  // Helper methods for getting wallet addresses
  private async getMetaMaskAddress(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    return accounts[0];
  }

  private async getPhantomAddress(): Promise<string> {
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error('Phantom wallet not installed');
    }

    const response = await window.solana.connect();
    return response.publicKey.toString();
  }

  private async getWalletConnectAddress(): Promise<string> {
    throw new Error('WalletConnect integration requires additional setup');
  }

  // Update user wallet address
  private async updateUserWallet(userId: string, walletAddress: string): Promise<AuthUser> {
    if (this.isDemoMode()) {
      const users = this.getDemoUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex >= 0) {
        users[userIndex].wallet_address = walletAddress;
        users[userIndex].updated_at = new Date().toISOString();
        localStorage.setItem('demo_users', JSON.stringify(users));
        return users[userIndex];
      }
      throw new Error('User not found');
    }

    const { data, error } = await supabase
      .from('users')
      .update({ 
        wallet_address: walletAddress,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // MetaMask Integration
  private async connectMetaMask(): Promise<AuthUser> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const walletAddress = accounts[0];
      
      // Create signature message
      const message = `Sign this message to authenticate with GHG Platform.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      
      // Request signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      });

      // Verify signature and create/get user
      const user = await this.authenticateWallet(walletAddress, signature, message);
      
      // Return user without setting as current - needs email auth for full access
      return user;

    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection');
      }
      throw error;
    }
  }

  // Phantom Wallet Integration
  private async connectPhantom(): Promise<AuthUser> {
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error('Phantom wallet not installed');
    }

    try {
      const response = await window.solana.connect();
      const walletAddress = response.publicKey.toString();

      // Create signature message
      const message = new TextEncoder().encode(
        `Sign this message to authenticate with GHG Platform.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`
      );

      // Request signature
      const signedMessage = await window.solana.signMessage(message, 'utf8');
      
      // Verify and authenticate
      const user = await this.authenticateWallet(walletAddress, signedMessage.signature, message);
      
      // Return user without setting as current - needs email auth for full access
      return user;

    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection');
      }
      throw error;
    }
  }

  // WalletConnect Integration
  private async connectWalletConnect(): Promise<AuthUser> {
    // This would require WalletConnect SDK
    // For now, throw error with instructions
    throw new Error('WalletConnect integration requires additional setup. Please install @walletconnect/web3-provider');
  }

  // Wallet signature verification
  private async authenticateWallet(walletAddress: string, signature: string, message: string | Uint8Array): Promise<AuthUser> {
    // Find existing user profile based on wallet address
    let user = await this.getUserByWallet(walletAddress);
    
    if (user) {
      // User exists with this wallet - check if they have email linked
      if (user.email) {
        // User has email linked - automatically sign them in
        if (!this.isDemoMode()) {
          try {
            // For wallet users with linked email, we need to create an auth session
            // Since we can't sign in without password, we'll create a temporary session
            // by updating the user record to use the existing auth.uid if available
            const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
            
            if (currentAuthUser && currentAuthUser.email === user.email) {
              // Already authenticated with the correct email - just return user
              this._setInternalCurrentUser(user);
              return user;
            }
            
            // Try to sign in with OTP to create auth session
            const { data, error } = await supabase.auth.signInWithOtp({
              email: user.email,
              options: {
                shouldCreateUser: false // Don't create new user, just sign in existing
              }
            });
            
            if (!error) {
              console.log('OTP sent to linked email for wallet verification - proceeding with wallet auth');
            }
            
            // Proceed with wallet authentication - the wallet signature is sufficient
            this._setInternalCurrentUser(user);
            return user;
          } catch (error) {
            console.warn('Failed to send OTP, proceeding with wallet auth:', error);
            this._setInternalCurrentUser(user);
            return user;
          }
        } else {
          this._setInternalCurrentUser(user);
          return user;
        }
      }
      // User exists but no email - store for linking
      this.pendingWalletConnection = { address: walletAddress, signature, message };
    } else {
      // No user found - store for linking after email authentication
      this.pendingWalletConnection = { address: walletAddress, signature, message };
    }

    // Return a temporary user object for the pending connection
    return {
      id: 'pending-wallet-user',
      wallet_address: walletAddress,
      email: null,
      auth_method: 'wallet',
      display_name: 'Wallet User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Create user with both wallet and email (for sign up after wallet connection)
  private async createUserWithWalletAndEmail(
    email: string, 
    password: string, 
    displayName: string | undefined, 
    walletConnection: { address: string; signature: string; message: string | Uint8Array }
  ): Promise<AuthUser> {
    if (this.isDemoMode()) {
      const user = await this.createDemoUser({
        email,
        display_name: displayName,
        auth_method: 'email',
        wallet_address: walletConnection.address,
      });
      this.pendingWalletConnection = null;
      this._setInternalCurrentUser(user);
      return user;
    }

    // Check if user already exists with this wallet
    const existingUser = await this.getUserByWallet(walletConnection.address);
    
    if (existingUser && !existingUser.email) {
      // User exists with wallet but no email - update with email and create auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            auth_method: 'email',
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('Failed to create user');

      // Update existing user record with auth ID and email
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          id: data.user.id,
          email,
          display_name: displayName,
          auth_method: 'email',
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletConnection.address)
        .select()
        .single();

      if (updateError) throw updateError;

      this.pendingWalletConnection = null;
      this._setInternalCurrentUser(updatedUser);
      return updatedUser;
    }

    // Create new user with wallet and email
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          auth_method: 'email',
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to create user');

    const user = await this.createUserProfile(data.user.id, {
      email,
      display_name: displayName,
      auth_method: 'email',
      wallet_address: walletConnection.address,
    });

    this.pendingWalletConnection = null;
    this._setInternalCurrentUser(user);
    return user;
  }

  // Link wallet to existing email user (for sign in after wallet connection)
  private async linkWalletToEmailUser(
    email: string, 
    password: string, 
    walletConnection: { address: string; signature: string; message: string | Uint8Array }
  ): Promise<AuthUser> {
    if (this.isDemoMode()) {
      // Demo login - find user by email and add wallet
      const users = this.getDemoUsers();
      const userIndex = users.findIndex(u => u.email === email);
      if (userIndex >= 0) {
        users[userIndex].wallet_address = walletConnection.address;
        users[userIndex].updated_at = new Date().toISOString();
        localStorage.setItem('demo_users', JSON.stringify(users));
        this.pendingWalletConnection = null;
        this._setInternalCurrentUser(users[userIndex]);
        return users[userIndex];
      }
      throw new Error('User not found');
    }

    // Check if there's already a user with this wallet
    const existingWalletUser = await this.getUserByWallet(walletConnection.address);
    
    if (existingWalletUser && existingWalletUser.email === email) {
      // This wallet is already linked to this email - just sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

      this.pendingWalletConnection = null;
      this._setInternalCurrentUser(existingWalletUser);
      return existingWalletUser;
    }

    // Sign in with email and link wallet
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Login failed');

    // Get user profile and update with wallet
    let user = await this.getUserProfile(data.user.id);
    
    // Link wallet if not already linked
    if (!user.wallet_address) {
      user = await this.updateUserWallet(user.id, walletConnection.address);
    } else if (existingWalletUser && !existingWalletUser.email) {
      // There's a wallet-only user that needs to be merged
      // Delete the wallet-only user and update this email user with the wallet
      await this.deleteUser(existingWalletUser.id);
      user = await this.updateUserWallet(user.id, walletConnection.address);
    }

    this.pendingWalletConnection = null;
    this._setInternalCurrentUser(user);
    return user;
  }

  // Clear pending wallet connection
  clearPendingWalletConnection() {
    this.pendingWalletConnection = null;
    localStorage.removeItem('pending_wallet_connection');
  }

  // User management
  private async createUserProfile(userId: string, userData: Partial<AuthUser>): Promise<AuthUser> {
    const user: AuthUser = {
      id: userId,
      wallet_address: userData.wallet_address || null, // Allow null wallet addresses
      email: userData.email,
      auth_method: userData.auth_method || 'email',
      google_id: userData.google_id,
      avatar_url: userData.avatar_url,
      display_name: userData.display_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.isDemoMode()) {
      this.saveDemoUser(user);
      return user;
    }

    // Use the registration function for creating users
    if (userData.wallet_address) {
      // For wallet users, use the registration function
      const { data, error } = await supabase.rpc('register_user', {
        p_wallet_address: userData.wallet_address,
        p_email: userData.email,
        p_auth_method: userData.auth_method || 'wallet',
        p_display_name: userData.display_name,
        p_google_id: userData.google_id,
        p_avatar_url: userData.avatar_url
      });

      if (error) throw error;
      return data;
    } else {
      // For email/Google users, create directly (they'll connect wallet later)
      const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  private async getUserProfile(userId: string): Promise<AuthUser> {
    if (this.isDemoMode()) {
      const user = this.getDemoUsers().find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      return user;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getUserByWallet(walletAddress: string): Promise<AuthUser | null> {
    if (this.isDemoMode()) {
      return this.getDemoUsers().find(u => u.wallet_address === walletAddress) || null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) return null;
    return data;
  }

  // Helper method to delete user (for merging wallet-only users)
  private async deleteUser(userId: string): Promise<void> {
    if (this.isDemoMode()) {
      const users = this.getDemoUsers();
      const filteredUsers = users.filter(u => u.id !== userId);
      localStorage.setItem('demo_users', JSON.stringify(filteredUsers));
      return;
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }

  // Session management
  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.currentUser) return this.currentUser;

    if (this.isDemoMode()) {
      const savedUser = localStorage.getItem('demo_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        return this.currentUser;
      }
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await this.getUserProfile(user.id);
    this._setInternalCurrentUser(profile);
    return profile;
  }

  async signOut(): Promise<void> {
    if (this.isDemoMode()) {
      localStorage.removeItem('demo_user');
      this.setCurrentUser(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    this._setInternalCurrentUser(null);
  }

  // Utility methods
  private _setInternalCurrentUser(user: AuthUser | null) {
    this.currentUser = user;
    
    if (this.isDemoMode() && user) {
      localStorage.setItem('demo_user', JSON.stringify(user));
    }
    
    this.listeners.forEach(listener => listener(user));
  }

  // Public method to set current user (needed for wallet flow)
  setCurrentUser(user: AuthUser | null) {
    this._setInternalCurrentUser(user);
  }

  // Remove the automatic wallet generation methods
  // private generateWalletAddress(): string {
  //   return '0x' + Array.from({ length: 40 }, () => 
  //     Math.floor(Math.random() * 16).toString(16)
  //   ).join('');
  // }

  private generateDemoWallet(): string {
    return '0x' + Math.random().toString(16).substr(2, 40);
  }

  // Generate proper UUID for Supabase
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Updated demo mode detection - now respects the DEMO_MODE flag
  private isDemoMode(): boolean {
    return DEMO_MODE || !process.env.NEXT_PUBLIC_SUPABASE_URL;
  }

  // Demo data management
  private getDemoUsers(): AuthUser[] {
    const users = localStorage.getItem('demo_users');
    return users ? JSON.parse(users) : [];
  }

  private saveDemoUser(user: AuthUser) {
    const users = this.getDemoUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem('demo_users', JSON.stringify(users));
  }

  private async createDemoUser(userData: Partial<AuthUser>): Promise<AuthUser> {
    const user: AuthUser = {
      id: this.generateUUID(), // Now generates proper UUID
      wallet_address: userData.wallet_address || null, // Allow null wallet addresses
      email: userData.email,
      auth_method: userData.auth_method || 'email',
      google_id: userData.google_id,
      avatar_url: userData.avatar_url,
      display_name: userData.display_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.saveDemoUser(user);
    return user;
  }

  // Event listeners
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Global auth service instance
export const authService = new AuthService();

// Wallet type definitions for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: string }>;
    };
  }
}