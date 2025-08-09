'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast'; 

export default function AuthCallback() {
  const router = useRouter();
  // const { toast } = useToast(); // No longer needed

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await authService.handleOAuthCallback();
        router.replace('/');
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}