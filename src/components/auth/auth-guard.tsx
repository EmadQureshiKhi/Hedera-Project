'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from './auth-modal';
import { EmailPromptModal } from './email-prompt-modal';
import { supabase } from '@/lib/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasAuthSession, setHasAuthSession] = useState(false);

  // Check if user has active auth.uid() session
  useEffect(() => {
    const checkAuthSession = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setHasAuthSession(!!authUser);
    };
    
    checkAuthSession();
  }, [isAuthenticated]);

  // Check if user needs to link email
  useEffect(() => {
    if (isAuthenticated && user) {
      if (!hasAuthSession && user.email) {
        // User has email but no auth session - needs to sign in
        setShowAuthModal(true);
      } else if (!hasAuthSession && !user.email) {
        // User has no email and no auth session - needs to sign up or sign in
        setShowAuthModal(true);
      } else if (!user.email) {
        // Has auth session but no email - should not happen with new flow
        setShowEmailPrompt(true);
      }
    }
  }, [isAuthenticated, user, hasAuthSession]);

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

  return (
    <>
      {children}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultTab="signin"
      />
      <EmailPromptModal 
        isOpen={showEmailPrompt} 
        onClose={() => setShowEmailPrompt(false)}
        onSuccess={() => setShowEmailPrompt(false)}
      />
    </>
  );
}