import { useState, useEffect } from 'react';
import { authService, AuthUser, AuthMethod } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ethers } from 'ethers';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Initialize MetaMask provider and signer when user connects wallet
  const initializeMetaMaskSigner = async () => {
    if (!window.ethereum || !user?.wallet_address) {
      return null;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const walletSigner = await browserProvider.getSigner();
      
      // Verify the signer address matches the connected wallet
      const signerAddress = await walletSigner.getAddress();
      if (signerAddress.toLowerCase() !== user.wallet_address.toLowerCase()) {
        throw new Error('MetaMask account does not match connected wallet');
      }

      setProvider(browserProvider);
      setSigner(walletSigner);
      return walletSigner;
    } catch (error) {
      console.error('Failed to initialize MetaMask signer:', error);
      return null;
    }
  };

  // Get MetaMask signer (initialize if needed)
  const getMetaMaskSigner = async (): Promise<ethers.Signer | null> => {
    if (signer) {
      return signer;
    }
    
    return await initializeMetaMaskSigner();
  };

  // Initialize signer when user changes
  useEffect(() => {
    if (user?.wallet_address && window.ethereum) {
      initializeMetaMaskSigner();
    } else {
      setProvider(null);
      setSigner(null);
    }
  }, [user?.wallet_address]);

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      const user = await authService.signUpWithEmail(email, password, displayName);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await authService.signInWithEmail(email, password);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const user = await authService.signInWithGoogle();
      return user;
    } catch (error: any) {
      if (error.message === 'Redirecting to Google...') {
        // Don't set loading to false, we're redirecting
        return;
      }
      setIsLoading(false);
      throw error;
    }
  };

  const connectWallet = async (walletType: 'metamask' | 'phantom' | 'walletconnect') => {
    setIsLoading(true);
    try {
      const walletUser = await authService.connectWallet(walletType);
      
      // Check if this is a complete user (has email and is signed in)
      if (walletUser.email) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        // If wallet has email, user should be automatically signed in
        // No need to check auth session for wallet users with linked email
        return walletUser;
      }
      
      // No email linked - return wallet user for email linking flow
      return walletUser;
    } finally {
      setIsLoading(false);
    }
  };

  const linkEmailToUser = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const user = await authService.linkEmailToUser(email, password);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    provider,
    signer,
    getMetaMaskSigner,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    connectWallet,
    linkEmailToUser,
    signOut,
  };
}

// Hook for checking if specific wallet is available
export function useWalletAvailability() {
  const [wallets, setWallets] = useState({
    metamask: false,
    phantom: false,
    walletconnect: true, // Always available (requires setup)
  });

  useEffect(() => {
    const checkWallets = () => {
      setWallets({
        metamask: !!(window.ethereum && window.ethereum.isMetaMask),
        phantom: !!(window.solana && window.solana.isPhantom),
        walletconnect: true,
      });
    };

    checkWallets();

    // Check again after a short delay (wallets might load async)
    const timer = setTimeout(checkWallets, 1000);
    return () => clearTimeout(timer);
  }, []);

  return wallets;
}