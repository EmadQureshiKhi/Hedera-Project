'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from './auth-modal';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Authentication Required</h2>
          <p className="text-muted-foreground">
            Please sign in to access this page
          </p>
          <AuthModal isOpen={true} onClose={() => {}} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}