'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AuthModal } from '@/components/auth/auth-modal';
import { StatsCards } from './stats-cards';
import { EmissionsChart } from './emissions-chart';
import { RecentActivity } from './recent-activity';
import { QuickActions } from './quick-actions';
import { TokenBalanceCard } from './token-balance-card';
import { useDashboardStats, useUserEmissions, useUserTransactions, useUserCertificates } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import { Leaf, TrendingDown, Award, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { format, subMonths, startOfMonth } from 'date-fns';

export function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signup');
  
  const { data: dashboardData, isLoading } = useDashboardStats(user?.id);
  const { data: userEmissions } = useUserEmissions(user?.id);
  const { data: userTransactions } = useUserTransactions(user?.id);
  const { data: userCertificates } = useUserCertificates(user?.id);

  // Process real emissions data for chart (logged-in users)
  const emissionsData = useMemo(() => {
    if (!isAuthenticated || !userEmissions || !userTransactions) {
      // Static demo data for logged-out users
      return [
        { month: 'Jan', emissions: 2400, offsets: 1200, net: 1200 },
        { month: 'Feb', emissions: 2100, offsets: 1400, net: 700 },
        { month: 'Mar', emissions: 2800, offsets: 1600, net: 1200 },
        { month: 'Apr', emissions: 2200, offsets: 1800, net: 400 },
        { month: 'May', emissions: 2600, offsets: 2000, net: 600 },
        { month: 'Jun', emissions: 2450, offsets: 1850, net: 600 },
      ];
    }

    // Generate last 6 months of data
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = startOfMonth(subMonths(new Date(), i));
      const monthName = format(date, 'MMM');
      
      // Calculate emissions for this month
      const monthEmissions = userEmissions
        .filter(emission => {
          const emissionDate = new Date(emission.created_at);
          return emissionDate.getMonth() === date.getMonth() && 
                 emissionDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, emission) => sum + emission.total_emissions, 0);
      
      // Calculate offsets for this month
      const monthOffsets = userTransactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.created_at);
          return transactionDate.getMonth() === date.getMonth() && 
                 transactionDate.getFullYear() === date.getFullYear() &&
                 transaction.status === 'completed';
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      
      months.push({
        month: monthName,
        emissions: monthEmissions,
        offsets: monthOffsets,
        net: Math.max(0, monthEmissions - monthOffsets)
      });
    }
    
    return months;
  }, [isAuthenticated, userEmissions, userTransactions]);

  // Process real recent activity data (logged-in users)
  const recentActivity = useMemo(() => {
    if (!isAuthenticated || (!userCertificates && !userTransactions)) {
      // Static demo data for logged-out users
      return [
        {
          id: '1',
          type: 'certificate',
          title: 'Certificate Generated',
          description: 'Emissions Certificate Verified',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          amount: 2450,
          txHash: '0x1234...5678',
        },
        {
          id: '2',
          type: 'purchase',
          title: 'Carbon Credits Purchased',
          description: 'Renewable Energy Project',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          amount: 500,
          txHash: '0xabcd...efgh',
        },
        {
          id: '3',
          type: 'offset',
          title: 'Credits Retired',
          description: 'Forest Conservation Project',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          amount: 1000,
          txHash: '0x9876...5432',
        },
      ];
    }

    const activities: any[] = [];
    
    // Add certificate activities
    if (userCertificates) {
      userCertificates.slice(0, 3).forEach(cert => {
        activities.push({
          id: cert.id,
          type: 'certificate',
          title: 'Certificate Generated',
          description: cert.title,
          timestamp: cert.created_at,
          status: 'completed',
          amount: cert.total_emissions,
          txHash: cert.blockchain_tx,
        });
      });
    }
    
    // Add transaction activities
    if (userTransactions) {
      userTransactions.slice(0, 3).forEach(transaction => {
        activities.push({
          id: transaction.id,
          type: transaction.status === 'completed_retirement' ? 'offset' : 'purchase',
          title: transaction.status === 'completed_retirement' ? 'Credits Retired' : 'Credits Purchased',
          description: transaction.status === 'completed_retirement' ? 'Carbon Credits Retired' : 'Carbon Credits Purchased',
          timestamp: transaction.created_at,
          status: transaction.status,
          amount: transaction.amount,
          txHash: transaction.hedera_tx_id || transaction.blockchain_tx,
        });
      });
    }
    
    // Sort by timestamp and return most recent
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [isAuthenticated, userCertificates, userTransactions]);

  // Static data for logged-out users
  const staticStatsData = {
    totalEmissions: 1200000, // 1.2M kg
    offsetCredits: 850000, // 850K kg
    certificates: 500,
    marketplaceTransactions: 1200,
    emissionsChange: -15.2,
    offsetsChange: 28.5,
  };

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white shadow-2xl">
        {/* Enhanced Background Patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-6 right-20 w-20 h-20 border-2 border-white rounded-full"></div>
          <div className="absolute top-12 right-32 w-12 h-12 border border-white rounded-full"></div>
          <div className="absolute bottom-8 right-24 w-6 h-6 bg-white rounded-full"></div>
          <div className="absolute top-16 right-8 w-8 h-8 border border-white rounded-full"></div>
          <div className="absolute bottom-12 right-40 w-4 h-4 bg-white rounded-full"></div>
          <div className="absolute top-20 left-20 w-16 h-16 border border-white/30 rounded-full"></div>
          <div className="absolute bottom-16 left-32 w-10 h-10 border-2 border-white/40 rounded-full"></div>
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-transparent to-emerald-700/20"></div>
        
        {/* Main Icon */}
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white border-opacity-30">
            <Leaf className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <div className="relative z-10 max-w-4xl">
          {!isAuthenticated ? (
            <>
              <h1 className="text-4xl font-bold mb-4">
                Track, Verify, Offset Your Carbon Footprint
              </h1>
              <p className="text-xl opacity-90 mb-6 max-w-2xl">
                Generate verifiable certificates, explore carbon offset projects, and manage your environmental impact with blockchain-powered transparency
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-4">
                Welcome back, {user?.display_name || user?.email?.split('@')[0] || 'User'}!
              </h1>
              <p className="text-xl opacity-90 mb-6 max-w-2xl">
                Here's your latest carbon footprint overview and sustainability progress
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-4">
            {!isAuthenticated ? (
              <>
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="bg-white text-green-600 hover:bg-gray-100"
                  onClick={() => {
                    setAuthModalTab('signup');
                    setShowAuthModal(true);
                  }}
                >
                  Sign Up for Free
                </Button>
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="bg-white/10 text-white border-white hover:bg-white/20"
                  onClick={() => {
                    setAuthModalTab('signin');
                    setShowAuthModal(true);
                  }}
                >
                  Log In
                </Button>
              </>
            ) : (
              <>
                <Link href="/upload">
                  <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                    Upload Emissions Data
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                    Browse Marketplace
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="space-y-4">
        {!isAuthenticated && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Platform Impact Overview</h2>
            <p className="text-muted-foreground">
              See how organizations worldwide are making a difference
            </p>
          </div>
        )}
        <StatsCards data={isAuthenticated ? (dashboardData ?? staticStatsData) : staticStatsData} />
      </div>

      {/* Token Balance Card */}
      {isAuthenticated && user && user.wallet_address && <TokenBalanceCard />}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Emissions Chart */}
        <div className="lg:col-span-2">
          {!isAuthenticated && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1">Emissions Tracking</h3>
              <p className="text-sm text-muted-foreground">
                See how emissions and offsets are tracked over time
              </p>
            </div>
          )}
          <EmissionsChart data={emissionsData} />
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {isAuthenticated && <QuickActions />}
          
          {/* Carbon Offset Progress */}
          {!isAuthenticated ? (
            <Card className="mt-16">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Get Started Today
                </CardTitle>
                <CardDescription>
                  Join thousands of organizations tracking their impact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">1</span>
                    </div>
                    <span className="text-sm">Upload your emissions data</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">2</span>
                    </div>
                    <span className="text-sm">Generate verified certificates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">3</span>
                    </div>
                    <span className="text-sm">Offset with carbon credits</span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => {
                    setAuthModalTab('signup');
                    setShowAuthModal(true);
                  }}
                >
                  <Award className="h-4 w-4 mr-2" />
                  Start Your Journey
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                  Offset Progress
                </CardTitle>
                <CardDescription>
                  Your journey to carbon neutrality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Emissions</span>
                    <span className="font-medium">{dashboardData?.totalEmissions?.toLocaleString() || '0'} kg CO₂e</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Offset Credits</span>
                    <span className="font-medium text-green-600">{dashboardData?.offsetCredits?.toLocaleString() || '0'} kg CO₂e</span>
                  </div>
                  <Progress 
                    value={dashboardData?.totalEmissions ? (dashboardData.offsetCredits / dashboardData.totalEmissions) * 100 : 0} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.totalEmissions ? 
                      Math.round((dashboardData.offsetCredits / dashboardData.totalEmissions) * 100) : 0}% offset • {' '}
                    {dashboardData?.totalEmissions ? 
                      Math.max(0, dashboardData.totalEmissions - dashboardData.offsetCredits).toLocaleString() : '0'} kg CO₂e remaining
                  </p>
                </div>
                <Button className="w-full" size="sm" asChild>
                  <Link href="/marketplace">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy Carbon Credits
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        {!isAuthenticated && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Platform Activity</h2>
            <p className="text-muted-foreground">
              Recent activities from our community of sustainable organizations
            </p>
          </div>
        )}
        <RecentActivity data={recentActivity} />
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultTab={authModalTab}
      />
    </div>
  );
}