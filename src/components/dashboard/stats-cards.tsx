'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Leaf, 
  TrendingUp, 
  Award, 
  ShoppingCart,
  TrendingDown,
  Activity
} from 'lucide-react';

interface StatsData {
  totalEmissions: number;
  offsetCredits: number;
  certificates: number;
  marketplaceTransactions: number;
  emissionsChange: number;
  offsetsChange: number;
}

interface StatsCardsProps {
  data?: StatsData;
}

export function StatsCards({ data }: StatsCardsProps) {
  const stats = data || {
    totalEmissions: 2450,
    offsetCredits: 1850,
    certificates: 12,
    marketplaceTransactions: 8,
    emissionsChange: -12.5,
    offsetsChange: 23.8,
  };

  const cards = [
    {
      title: 'Total Emissions',
      value: `${stats.totalEmissions.toLocaleString()} kg`,
      description: 'CO₂e this year',
      icon: Activity,
      change: stats.emissionsChange,
      changeLabel: 'vs last month',
    },
    {
      title: 'Offset Credits',
      value: `${stats.offsetCredits.toLocaleString()} kg`,
      description: 'CO₂e offset',
      icon: Leaf,
      change: stats.offsetsChange,
      changeLabel: 'vs last month',
    },
    {
      title: 'Certificates',
      value: stats.certificates.toString(),
      description: 'Verified certificates',
      icon: Award,
      change: null,
      changeLabel: 'Total issued',
    },
    {
      title: 'Marketplace',
      value: stats.marketplaceTransactions.toString(),
      description: 'Transactions',
      icon: ShoppingCart,
      change: null,
      changeLabel: 'This month',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.change && card.change > 0;
        const isNegative = card.change && card.change < 0;
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
                {card.change !== null && (
                  <Badge 
                    variant={isPositive ? "default" : isNegative ? "secondary" : "outline"}
                    className={`text-xs ${
                      isPositive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      isNegative ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      ''
                    }`}
                  >
                    {isPositive && <TrendingUp className="h-3 w-3 mr-1" />}
                    {isNegative && <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(card.change)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.changeLabel}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}