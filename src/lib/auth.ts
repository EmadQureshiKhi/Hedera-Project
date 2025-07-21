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

  // Email Authentication
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthUser> {
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

    this.setCurrentUser(user);
    return user;
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    if (this.isDemoMode()) {
      // Demo login - find user by email
      const user = this.getDemoUsers().find(u => u.email === email);
      if (!user) throw new Error('User not found');
      this.setCurrentUser(user);
      return user;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Login failed');

    const user = await this.getUserProfile(data.user.id);
    this.setCurrentUser(user);
    return user;
  }

  // Google OAuth
  async signInWithGoogle(): Promise<AuthUser> {
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
      this.setCurrentUser(user);
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
          wallet_address: null,
        });
      }

      this.setCurrentUser(user);
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
      this.setCurrentUser(user);
      return user;
    }

    // Real wallet connection logic
    switch (walletType) {
      case 'metamask':
        return this.connectMetaMask();
      case 'phantom':
        return this.connectPhantom();
      case 'walletconnect':
        return this.connectWalletConnect();
      default:
        throw new Error('Unsupported wallet type');
    }
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
    this.setCurrentUser(updatedUser);
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
      this.setCurrentUser(user);
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
      this.setCurrentUser(user);
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
    // In production, verify the signature on the backend
    // For now, just create/get user by wallet address
    
    let user = await this.getUserByWallet(walletAddress);
    
    if (!user) {
      user = await this.createUserProfile(this.generateUUID(), {
        wallet_address: walletAddress,
        auth_method: 'wallet',
        display_name: `Wallet User`,
      });
    }

    return user;
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
    this.setCurrentUser(profile);
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
    
    this.setCurrentUser(null);
  }

  // Utility methods
  private setCurrentUser(user: AuthUser | null) {
    this.currentUser = user;
    
    if (this.isDemoMode() && user) {
      localStorage.setItem('demo_user', JSON.stringify(user));
    }
    
    this.listeners.forEach(listener => listener(user));
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