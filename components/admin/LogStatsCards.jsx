'use client';

import { Card } from '@/components/ui/Card';
import { Shield, Activity, Users, TrendingUp } from 'lucide-react';

export default function LogStatsCards({ totalCount, uniqueActions, uniqueUsers }) {
  const stats = [
    {
      title: 'Total Security Events',
      value: totalCount.toLocaleString(),
      icon: Shield,
      color: 'text-primary',
      bg: 'bg-primary/10',
      trend: '+12%'
    },
    {
      title: 'Unique Actions',
      value: uniqueActions,
      icon: Activity,
      color: 'text-success',
      bg: 'bg-success/10',
      trend: '+5%'
    },
    {
      title: 'Active Users',
      value: uniqueUsers,
      icon: Users,
      color: 'text-warning',
      bg: 'bg-warning/10',
      trend: '+8%'
    },
    {
      title: 'Event Frequency',
      value: totalCount > 0 ? Math.round(totalCount / 30) : 0,
      suffix: '/day',
      icon: TrendingUp,
      color: 'text-info',
      bg: 'bg-info/10',
      trend: '+3%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-4 hover:shadow-lg transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                  {stat.suffix && <span className="text-sm text-muted ml-1">{stat.suffix}</span>}
                </p>
                {stat.trend && (
                  <p className="text-xs text-success mt-1">
                    {stat.trend} from last period
                  </p>
                )}
              </div>
              <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}