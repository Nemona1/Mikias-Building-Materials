'use client';

import { Card } from '@/components/ui/Card';
import { HardDrive, Database, Calendar, Clock } from 'lucide-react';

export default function BackupStatsCards({ backups, totalSize, latestBackup, schedule }) {
  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const stats = [
    {
      label: 'Total Backups',
      value: backups.length,
      icon: HardDrive,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      label: 'Total Size',
      value: formatFileSize(totalSize),
      icon: Database,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      label: 'Schedule',
      value: schedule.enabled ? `${schedule.frequency} at ${schedule.time}` : 'Disabled',
      icon: Calendar,
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    {
      label: 'Latest Backup',
      value: formatDate(latestBackup),
      icon: Clock,
      color: 'text-info',
      bg: 'bg-info/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-4 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}