'use client';

import { Button } from '@/components/ui/Button';
import { Database, Calendar, RefreshCw, Loader2 } from 'lucide-react';

export default function BackupActionButtons({ creating, onCreateBackup, onOpenSchedule, onRefresh, loading }) {
  return (
    <div className="flex gap-3 flex-wrap">
      <Button
        onClick={() => onCreateBackup('full')}
        disabled={creating}
        className="gap-2"
      >
        {creating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Database className="h-4 w-4" />
            Full Backup
          </>
        )}
      </Button>
      <Button
        variant="secondary"
        onClick={() => onCreateBackup('database')}
        disabled={creating}
        className="gap-2"
      >
        {creating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Database className="h-4 w-4" />
        )}
        Database Only
      </Button>
      <Button
        variant="secondary"
        onClick={onOpenSchedule}
        className="gap-2"
      >
        <Calendar className="h-4 w-4" />
        Schedule Backup
      </Button>
      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={loading}
        className="gap-2 ml-auto"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
}