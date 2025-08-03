import { useState, useEffect } from 'react';
import { authService, AuthUser, AuthMethod } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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