'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StatsCards } from './stats-cards';
import { EmissionsChart } from './emissions-chart';
import { RecentActivity } from './recent-activity';
import { QuickActions } from './quick-actions';
import { useDashboardStats } from '@/hooks/use-api';
import { Leaf, TrendingDown, Award, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export function Dashboard() {
  const { data: dashboardData, isLoading } = useDashboardStats();

  // Mock emissions data for chart
  const emissionsData = [
    { month: 'Jan', emissions: 2400, offsets: 1200, net: 1200 },
    { month: 'Feb', emissions: 2100, offsets: 1400, net: 700 },
    { month: 'Mar', emissions: 2800, offsets: 1600, net: 1200 },
    { month: 'Apr', emissions: 2200, offsets: 1800, net: 400 },
    { month: 'May', emissions: 2600, offsets: 2000, net: 600 },
    { month: 'Jun', emissions: 2450, offsets: 1850, net: 600 },
  ];

  // Mock recent activity
  const recentActivity = [
    {
      id: '1',
      type: 'certificate',
      title: 'Certificate Minted',
      description: 'Q2 2024 Emissions Certificate',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      amount: 2450,
      txHash: '0x1234...5678',
    },
    {
      id: '2',
      type: 'purchase',
      title: 'Offset Credits Purchased',
      description: 'Renewable Energy Credits',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      amount: 500,
      txHash: '0xabcd...efgh',
    },
  ];

  if (isLoading) {
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to Your Carbon Dashboard
          </h1>
          <p className="text-xl opacity-90 mb-6 max-w-2xl">
            Track, verify, and offset your carbon emissions with blockchain-powered certificates
          </p>
          <div className="flex flex-wrap gap-4">
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
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <div className="h-full w-full bg-gradient-to-l from-white/20 to-transparent"></div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards data={dashboardData} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Emissions Chart */}
        <div className="lg:col-span-2">
          <EmissionsChart data={emissionsData} />
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <QuickActions />
          
          {/* Carbon Offset Progress */}
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
              <Button className="w-full" size="sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Offset Credits
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity data={recentActivity} />
    </div>
  );
}