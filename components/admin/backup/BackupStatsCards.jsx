'use client';

import { Card } from '@/components/ui/Card';
import { HardDrive, Database, Calendar, Clock } from 'lucide-react';

export default function BackupStatsCards({ backups = [], totalSize = 0, latestBackup = null, schedule = { enabled: false, frequency: 'daily', time: '00:00' } }) {
  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Ensure backups is always an array
  const safeBackups = Array.isArray(backups) ? backups : [];
  const safeSchedule = schedule || { enabled: false, frequency: 'daily', time: '00:00' };
  const safeTotalSize = typeof totalSize === 'number' ? totalSize : 0;

  const stats = [
    {
      label: 'Total Backups',
      value: safeBackups.length,
      icon: HardDrive,
      color: 'text-primary',
      bg: 'bg-primary/10',
      description: 'Total backup files'
    },
    {
      label: 'Total Size',
      value: formatFileSize(safeTotalSize),
      icon: Database,
      color: 'text-success',
      bg: 'bg-success/10',
      description: 'Combined backup size'
    },
    {
      label: 'Schedule',
      value: safeSchedule.enabled ? `${safeSchedule.frequency} at ${safeSchedule.time}` : 'Disabled',
      icon: Calendar,
      color: 'text-warning',
      bg: 'bg-warning/10',
      description: safeSchedule.enabled ? 'Automatic backups' : 'Manual only'
    },
    {
      label: 'Latest Backup',
      value: formatDate(latestBackup),
      icon: Clock,
      color: 'text-info',
      bg: 'bg-info/10',
      description: 'Most recent backup'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-4 hover:shadow-lg transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted mt-1">{stat.description}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}