'use client';

import { Card } from '@/components/ui/Card';
import { Users, UserCheck, UserX, Shield, Key, Mail } from 'lucide-react';

export default function UserStatsCards({ users = [] }) {
  // Ensure users is an array
  const userArray = Array.isArray(users) ? users : [];
  
  const stats = [
    {
      title: 'Total Users',
      value: userArray.length,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
      description: 'All registered users'
    },
    {
      title: 'Active Users',
      value: userArray.filter(u => u.isActive !== false).length,
      icon: UserCheck,
      color: 'text-success',
      bg: 'bg-success/10',
      description: 'Active accounts'
    },
    {
      title: 'Inactive Users',
      value: userArray.filter(u => u.isActive === false).length,
      icon: UserX,
      color: 'text-error',
      bg: 'bg-error/10',
      description: 'Deactivated accounts'
    },
    {
      title: 'With Custom Permissions',
      value: userArray.filter(u => u.directPermissions?.length > 0).length,
      icon: Key,
      color: 'text-info',
      bg: 'bg-info/10',
      description: 'Users with custom permissions'
    },
    {
      title: 'Email Verified',
      value: userArray.filter(u => u.isVerified).length,
      icon: Mail,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-500/10',
      description: 'Verified email addresses'
    },
    {
      title: '2FA Enabled',
      value: userArray.filter(u => u.twoFactorEnabled).length,
      icon: Shield,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-500/10',
      description: 'Two-factor authentication enabled'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-4 hover:shadow-lg transition-all duration-200 group">
            <div className="flex items-center justify-between mb-2">
              <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
            <p className="text-sm font-medium text-foreground">{stat.title}</p>
            <p className="text-xs text-muted mt-1">{stat.description}</p>
          </Card>
        );
      })}
    </div>
  );
}