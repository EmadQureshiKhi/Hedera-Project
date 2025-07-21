import { useState, useEffect } from 'react';
import { authService, AuthUser, AuthMethod } from '@/lib/auth';

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
      const user = await authService.connectWallet(walletType);
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