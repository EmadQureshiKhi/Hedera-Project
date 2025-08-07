'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useWalletAvailability } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { 
  Mail, 
  Lock, 
  User, 
  Wallet,
  Chrome,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup' | 'wallet' | 'link-email';
}

// WalletConnect Logo Component (using your provided SVG)
const WalletConnectLogo = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M4.913 7.519c3.915-3.831 10.26-3.831 14.174 0l.471.461a.483.483 0 0 1 0 .694l-1.611 1.577a.252.252 0 0 1-.354 0l-.649-.634c-2.73-2.673-7.157-2.673-9.887 0l-.694.68a.255.255 0 0 1-.355 0L4.397 8.719a.482.482 0 0 1 0-.693l.516-.507Zm17.506 3.263l1.434 1.404a.483.483 0 0 1 0 .694l-6.466 6.331a.508.508 0 0 1-.709 0l-4.588-4.493a.126.126 0 0 0-.178 0l-4.589 4.493a.508.508 0 0 1-.709 0L.147 12.88a.483.483 0 0 1 0-.694l1.434-1.404a.508.508 0 0 1 .709 0l4.589 4.493c.05.048.129.048.178 0l4.589-4.493a.508.508 0 0 1 .709 0l4.589 4.493c.05.048.128.048.178 0l4.589-4.493a.507.507 0 0 1 .708 0Z"/>
  </svg>
);

export function AuthModal({ isOpen, onClose, defaultTab = 'signin' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'wallet' | 'link-email'>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });

  const { user, signUpWithEmail, signInWithEmail, signInWithGoogle, connectWallet, linkEmailToUser, isLoading } = useAuth();
  const wallets = useWalletAvailability();

  // If defaultTab is 'link-email', we want to show only that interface
  const showOnlyLinkEmail = defaultTab === 'link-email';

  // Format wallet address for display
  const formatWalletAddress = (address: string | null) => {
    if (!address) return 'Wallet User';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  const handleEmailAuth = async (isSignUp: boolean) => {
    setError(null);
    
    try {
      if (isSignUp) {
        await signUpWithEmail(formData.email, formData.password, formData.displayName);
      } else {
        await signInWithEmail(formData.email, formData.password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      if (err.message !== 'Redirecting to Google...') {
        setError(err.message || 'Google authentication failed');
      }
    }
  };

  const handleWalletConnect = async (walletType: 'metamask' | 'phantom' | 'walletconnect') => {
    setError(null);
    
    try {
      const walletUser = await connectWallet(walletType);
      
      // Check if this is a complete user account (wallet + email)
      if (walletUser.email) {
        // Wallet is linked to email and user is signed in - close modal
        onClose();
        return;
      }
      
      // No email linked - need email authentication
      setError(`Wallet ${walletUser.wallet_address?.substring(0, 6)}...${walletUser.wallet_address?.substring(walletUser.wallet_address.length - 4)} connected! Please sign in or sign up with email to complete authentication.`);
      setActiveTab('signin');
    } catch (err: any) {
      setError(err.message || 'Wallet connection failed');
    }
  };

  const handleLinkEmail = async () => {
    setError(null);
    
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    try {
      await linkEmailToUser(formData.email, formData.password || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to link email');
    }
  };

  const handleCloseModal = () => {
    // Clear any pending wallet connections when modal is closed
    if (typeof window !== 'undefined') {
      const authService = require('@/lib/auth').authService;
      authService.clearPendingWalletConnection();
    }
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', displayName: '' });
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-md">
        {!showOnlyLinkEmail && (
          <DialogHeader>
            <DialogTitle>Welcome to GHG Platform</DialogTitle>
            <DialogDescription>
              Sign in to track your carbon emissions and generate certificates
            </DialogDescription>
          </DialogHeader>
        )}

        {showOnlyLinkEmail && (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Link Email to Your Account
            </DialogTitle>
            <DialogDescription>
              Currently signed in as: {formatWalletAddress(user?.wallet_address)}
            </DialogDescription>
          </DialogHeader>
        )}

        {showOnlyLinkEmail ? (
          // Show only the link email interface
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="link-email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-password">Password (Optional)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="link-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (optional)"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adding a password allows you to sign in with email in the future
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Why link an email?</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Required for certificate generation</li>
                  <li>• Secure account recovery options</li>
                  <li>• Important notifications and updates</li>
                  <li>• Enhanced platform security</li>
                </ul>
              </div>

              <Button 
                onClick={handleLinkEmail} 
                className="w-full"
                disabled={isLoading || !formData.email}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Linking Email...
                  </>
                ) : (
                  'Link Email Address'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value as any);
            resetForm();
          }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
            </TabsList>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Sign In */}
          <TabsContent value="signin" className="space-y-4">
            {error && error.includes('Wallet') && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Wallet Connection Pending</p>
                    <p className="text-sm">
                      Your wallet is ready to be linked. Sign in with your existing email account or create a new one to complete the connection.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={() => handleEmailAuth(false)} 
                className="w-full"
                disabled={isLoading || !formData.email || !formData.password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={handleGoogleAuth}
                className="w-full"
                disabled={isLoading}
              >
                <Chrome className="h-4 w-4 mr-2" />
                Google
              </Button>
            </div>
          </TabsContent>

          {/* Email Sign Up */}
          <TabsContent value="signup" className="space-y-4">
            {error && error.includes('Wallet') && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Wallet Connection Pending</p>
                    <p className="text-sm">
                      Your wallet is ready to be linked. Create a new account and your wallet will be automatically connected.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={() => handleEmailAuth(true)} 
                className="w-full"
                disabled={isLoading || !formData.email || !formData.password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={handleGoogleAuth}
                className="w-full"
                disabled={isLoading}
              >
                <Chrome className="h-4 w-4 mr-2" />
                Google
              </Button>
            </div>
          </TabsContent>

          {/* Wallet Connection */}
          <TabsContent value="wallet" className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Connect your crypto wallet to get started
              </p>

              {/* MetaMask - Using your custom image */}
              <Button
                variant="outline"
                onClick={() => handleWalletConnect('metamask')}
                disabled={isLoading || !wallets.metamask}
                className="w-full justify-start h-14"
              >
                <div className="w-8 h-8 mr-3 flex items-center justify-center">
                  <img 
                    src="https://i.ibb.co/8ns7tY2H/metamask-icon.png" 
                    alt="MetaMask" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">MetaMask</div>
                  <div className="text-xs text-muted-foreground">
                    {wallets.metamask ? 'Connect to MetaMask' : 'Install MetaMask'}
                  </div>
                </div>
              </Button>

              {/* Phantom - Using your custom image */}
              <Button
                variant="outline"
                onClick={() => handleWalletConnect('phantom')}
                disabled={isLoading || !wallets.phantom}
                className="w-full justify-start h-14"
              >
                <div className="w-8 h-8 mr-3 flex items-center justify-center">
                  <img 
                    src="https://i.ibb.co/vxScYK74/Phantom-Icon-App-60x60.png" 
                    alt="Phantom" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">Phantom</div>
                  <div className="text-xs text-muted-foreground">
                    {wallets.phantom ? 'Connect to Phantom' : 'Install Phantom'}
                  </div>
                </div>
              </Button>

              {/* WalletConnect - Using your provided SVG */}
              <Button
                variant="outline"
                onClick={() => handleWalletConnect('walletconnect')}
                disabled={isLoading}
                className="w-full justify-start h-14"
              >
                <div className="w-8 h-8 mr-3 flex items-center justify-center">
                  <WalletConnectLogo className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">WalletConnect</div>
                  <div className="text-xs text-muted-foreground">
                    Connect with QR code
                  </div>
                </div>
              </Button>

              <div className="text-xs text-muted-foreground text-center mt-4">
                Don't have a wallet? create an account and connect one later.
              </div>
            </div>
          </TabsContent>

          {/* Link Email Tab */}
          <TabsContent value="link-email" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Link Email to Your Account
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Currently signed in as: {user?.display_name || 'Wallet User'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="link-email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-password">Password (Optional)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="link-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (optional)"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adding a password allows you to sign in with email in the future
                </p>
              </div>

              <Button 
                onClick={handleLinkEmail} 
                className="w-full"
                disabled={isLoading || !formData.email}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Linking Email...
                  </>
                ) : (
                  'Link Email Address'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Link Email Tab */}
          <TabsContent value="link-email" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Link Email to Your Account
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Currently signed in as: {user?.display_name || 'Wallet User'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="link-email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-password">Password (Optional)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="link-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (optional)"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adding a password allows you to sign in with email in the future
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Why link an email?</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Secure account recovery options</li>
                  <li>• Important notifications and updates</li>
                  <li>• Enhanced platform security</li>
                  <li>• Access to all platform features</li>
                </ul>
              </div>

              <Button 
                onClick={handleLinkEmail} 
                className="w-full"
                disabled={isLoading || !formData.email}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Linking Email...
                  </>
                ) : (
                  'Link Email Address'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}