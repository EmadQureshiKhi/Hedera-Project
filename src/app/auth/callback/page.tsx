'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast'; 

export default function AuthCallback() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const user = await authService.handleOAuthCallback();
        if (user) {
          router.replace('/');
        } else {
          toast({
            title: 'Authentication failed',
            description: (
              <span>
                Please try again. If you are testing, sign up with Email/Gmail and then link your wallet as described in the <b>Important Testing Note</b>.<br /><br />
                <b>Important Testing Note:</b> If you are going to run or test the project, please first <b>Sign up with Email/Gmail</b> and then <b>link/connect a Hedera testnet wallet (MetaMask)</b> in the settings tab (top right, after logging in with your Google/Email account).<br /><br />
                This is because I am still working on fixing some authentication issues with other routes, and this specific flow ensures full functionality.<br /><br />
                After you sign up with Email/Gmail and link your wallet, you can log out and later log back in simply by connecting your wallet that’s linked to your account.
              </span>
            ),
            variant: 'destructive',
            duration: 30000,
          });
          router.replace('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast({
          title: 'Authentication failed',
          description: (
            <span>
              Please try again. If you are testing, sign up with Email/Gmail and then link your wallet as described in the <b>Important Testing Note</b>.<br /><br />
              <b>Important Testing Note:</b> If you are going to run or test the project, please first <b>Sign up with Email/Gmail</b> and then <b>link/connect a Hedera testnet wallet (MetaMask)</b> in the settings tab (top right, after logging in with your Google/Email account).<br /><br />
              This is because I am still working on fixing some authentication issues with other routes, and this specific flow ensures full functionality.<br /><br />
              After you sign up with Email/Gmail and link your wallet, you can log out and later log back in simply by connecting your wallet that’s linked to your account.
            </span>
          ),
          variant: 'destructive',
          duration: 30000,
        });
        router.replace('/');
      }
    };

    handleCallback();
  }, [router, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}