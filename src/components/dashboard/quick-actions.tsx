'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Award, ShoppingCart, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  const actions = [
    {
      title: 'Upload Data',
      description: 'Submit emissions data',
      icon: Upload,
      href: '/upload',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'View Certificates',
      description: 'Browse your certificates',
      icon: Award,
      href: '/certificates',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Buy Credits',
      description: 'Purchase offset credits',
      icon: ShoppingCart,
      href: '/marketplace',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Analytics',
      description: 'View detailed reports',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}