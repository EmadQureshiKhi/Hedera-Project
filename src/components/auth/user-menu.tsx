'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { 
  User, 
  Wallet, 
  Copy, 
  ExternalLink, 
  LogOut,
  ChevronDown,
  Settings,
  CreditCard,
  Plus
} from 'lucide-react';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const copyWalletAddress = () => {
    if (user.wallet_address) {
      navigator.clipboard.writeText(user.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return user.email?.charAt(0).toUpperCase() || 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAuthMethodBadge = () => {
    switch (user.auth_method) {
      case 'email':
        return <Badge variant="secondary" className="text-xs">Email</Badge>;
      case 'google':
        return <Badge variant="secondary" className="text-xs">Google</Badge>;
      case 'wallet':
        return <Badge variant="secondary" className="text-xs">Wallet</Badge>;
      default:
        return null;
    }
  };

  const formatWalletAddress = (address: string | null) => {
    if (!address) return null;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="text-xs">
                {getInitials(user.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium">
                {user.display_name || user.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-xs text-muted-foreground">
                {user.wallet_address ? (
                  formatWalletAddress(user.wallet_address)
                ) : (
                  'No wallet connected'
                )}
              </div>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          {/* User Info */}
          <div className="px-2 py-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>
                  {getInitials(user.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {user.display_name || 'User'}
                  </p>
                  {getAuthMethodBadge()}
                </div>
                {user.email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Wallet Info */}
          <div className="px-2 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Wallet</span>
              </div>
              {user.wallet_address ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyWalletAddress}
                  className="h-6 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Connect
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {user.wallet_address ? (
                `${user.wallet_address.substring(0, 16)}...`
              ) : (
                'No wallet connected'
              )}
            </p>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Menu Items */}
          <DropdownMenuItem>
            <User className="h-4 w-4 mr-2" />
            Profile Settings
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <CreditCard className="h-4 w-4 mr-2" />
            Billing & Usage
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </DropdownMenuItem>
          
          {user.wallet_address && (
            <DropdownMenuItem>
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={signOut} className="text-red-600">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Wallet address copied!
        </div>
      )}
    </>
  );
}