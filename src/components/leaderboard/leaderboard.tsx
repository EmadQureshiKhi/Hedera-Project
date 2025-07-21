'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLeaderboard } from '@/hooks/use-api';
import { 
  Trophy, 
  Medal, 
  Award,
  TrendingUp,
  TrendingDown,
  Leaf,
  Target
} from 'lucide-react';

export function Leaderboard() {
  const { data: leaderboard, isLoading } = useLeaderboard();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'Carbon Negative':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Climate Leader':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Eco Champion':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Carbon Offset Leaderboard</h1>
        </div>
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Carbon Offset Leaderboard</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          See how organizations rank based on their carbon offset achievements and environmental impact
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold">{leaderboard?.length || 0}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Offsets</p>
                <p className="text-2xl font-bold">
                  {leaderboard?.reduce((sum, entry) => sum + entry.offsetCredits, 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">kg CO₂e</p>
              </div>
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Offset Rate</p>
                <p className="text-2xl font-bold">
                  {leaderboard ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.offsetPercentage, 0) / leaderboard.length) : 0}%
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Carbon Negative</p>
                <p className="text-2xl font-bold">
                  {leaderboard?.filter(entry => entry.netEmissions < 0).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">organizations</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
          <CardDescription>
            Organizations ranked by carbon offset percentage and environmental impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard?.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                  entry.rank <= 3 ? 'bg-muted/30' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12">
                    {getRankIcon(entry.rank)}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.avatar} />
                    <AvatarFallback>
                      {entry.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{entry.name}</p>
                      {entry.badge && (
                        <Badge className={getBadgeColor(entry.badge)}>
                          {entry.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{entry.certificates} certificates</span>
                      <span>•</span>
                      <span>{entry.offsetPercentage}% offset</span>
                      {entry.change !== 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            {entry.change > 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span className={entry.change > 0 ? 'text-green-600' : 'text-red-600'}>
                              {Math.abs(entry.change)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {entry.netEmissions < 0 ? '-' : ''}{Math.abs(entry.netEmissions).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">kg CO₂e</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.totalEmissions.toLocaleString()} total • {entry.offsetCredits.toLocaleString()} offset
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Achievement Badges</CardTitle>
          <CardDescription>
            Special recognition for outstanding environmental performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Leaf className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Carbon Negative</p>
                <p className="text-sm text-muted-foreground">Offset more than 100% of emissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Trophy className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Climate Leader</p>
                <p className="text-sm text-muted-foreground">Top 10% in offset percentage</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Eco Champion</p>
                <p className="text-sm text-muted-foreground">Consistent high performance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}