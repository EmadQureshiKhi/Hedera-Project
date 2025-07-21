'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Award, 
  ShoppingCart, 
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'upload' | 'certificate' | 'purchase' | 'offset';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  amount?: number;
  txHash?: string;
}

interface RecentActivityProps {
  data?: ActivityItem[];
}

export function RecentActivity({ data }: RecentActivityProps) {
  const activities = data || [
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
    {
      id: '3',
      type: 'upload',
      title: 'Data Upload',
      description: 'Monthly emissions report uploaded',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    },
    {
      id: '4',
      type: 'offset',
      title: 'Credits Retired',
      description: 'Forest Conservation Project',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      amount: 1000,
      txHash: '0x9876...5432',
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return Upload;
      case 'certificate':
        return Award;
      case 'purchase':
        return ShoppingCart;
      case 'offset':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Your latest transactions and updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getIcon(activity.type);
            return (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{activity.title}</p>
                      {getStatusIcon(activity.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                      {activity.amount && (
                        <>
                          <span>•</span>
                          <span>{activity.amount.toLocaleString()} kg CO₂e</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                  {activity.txHash && (
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 text-center">
          <Button variant="outline">View All Activity</Button>
        </div>
      </CardContent>
    </Card>
  );
}