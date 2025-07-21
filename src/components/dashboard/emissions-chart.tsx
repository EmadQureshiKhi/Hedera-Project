'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Activity } from 'lucide-react';

interface EmissionsData {
  month: string;
  emissions: number;
  offsets: number;
  net: number;
}

interface EmissionsChartProps {
  data?: EmissionsData[];
}

export function EmissionsChart({ data }: EmissionsChartProps) {
  const chartData = data || [
    { month: 'Jan', emissions: 2400, offsets: 1200, net: 1200 },
    { month: 'Feb', emissions: 2100, offsets: 1400, net: 700 },
    { month: 'Mar', emissions: 2800, offsets: 1600, net: 1200 },
    { month: 'Apr', emissions: 2200, offsets: 1800, net: 400 },
    { month: 'May', emissions: 2600, offsets: 2000, net: 600 },
    { month: 'Jun', emissions: 2450, offsets: 1850, net: 600 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Emissions Overview
        </CardTitle>
        <CardDescription>
          Monthly emissions vs offset credits (kg CO₂e)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs fill-muted-foreground"
              />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="emissions"
                stackId="1"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.6}
                name="Emissions"
              />
              <Area
                type="monotone"
                dataKey="offsets"
                stackId="2"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
                name="Offsets"
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--foreground))', strokeWidth: 2, r: 4 }}
                name="Net Emissions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-destructive rounded-full"></div>
            <span>Emissions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Offsets</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-foreground rounded-full"></div>
            <span>Net</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}