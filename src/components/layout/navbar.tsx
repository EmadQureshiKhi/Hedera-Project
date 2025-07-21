'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AuthModal } from '@/components/auth/auth-modal';
import { UserMenu } from '@/components/auth/user-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { 
  Menu, 
  Leaf, 
  BarChart3, 
  Upload, 
  Award, 
  ShoppingCart,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Upload Data', href: '/upload', icon: Upload },
  { name: 'Certificates', href: '/certificates', icon: Award },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingCart },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="hidden font-bold sm:inline-block">
                GHG Platform
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
                      pathname === item.href
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              {/* Auth Section */}
              {isLoading ? (
                <div className="w-20 h-9 bg-muted animate-pulse rounded-md"></div>
              ) : isAuthenticated ? (
                <UserMenu />
              ) : (
                <Button onClick={() => setShowAuthModal(true)}>
                  Sign In
                </Button>
              )}
              
              {/* Mobile menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center space-x-3 text-sm font-medium transition-colors hover:text-primary p-2 rounded-md',
                            pathname === item.href
                              ? 'text-primary bg-primary/10'
                              : 'text-muted-foreground'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}