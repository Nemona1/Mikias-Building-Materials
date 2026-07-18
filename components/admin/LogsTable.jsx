'use client';

import { User, Eye, CheckCircle, XCircle, Activity, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const getActionBadge = (action, success = true) => {
  const badges = {
    'LOGIN_SUCCESS': { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    'LOGIN_FAILED': { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
    'USER_REGISTERED': { icon: Activity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    'EMAIL_VERIFIED': { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    '2FA_ENABLED': { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    '2FA_DISABLED': { icon: XCircle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    'PASSWORD_CHANGED_SUCCESSFULLY': { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    'ROLE_CREATED': { icon: Activity, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    'ROLE_ASSIGNED': { icon: Activity, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    'PERMISSION_GRANTED': { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    'PERMISSION_REVOKED': { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
    'SESSION_REVOKED': { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
    'LOGOUT': { icon: Activity, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10' }
  };
  
  const badge = badges[action] || { icon: Activity, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10' };
  const Icon = badge.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.color}`}>
      <Icon className="h-3 w-3" />
      {action?.replace(/_/g, ' ')}
    </span>
  );
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

export default function LogsTable({ logs, loading, onViewDetails }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted mt-2">Loading logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted mx-auto mb-3" />
        <p className="text-muted">No logs found</p>
        <p className="text-sm text-muted/70 mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <table className="min-w-full divide-y divide-border">
      <thead className="bg-muted/30">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Time</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">User</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Action</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">IP Address</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
          <th className="px-6 py-4 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-card divide-y divide-border">
        {logs.map((log) => (
          <tr key={log.id} className="hover:bg-muted/5 transition-colors group">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-foreground">
                {formatTimestamp(log.createdAt)}
              </div>
              <div className="text-xs text-muted">
                {new Date(log.createdAt).toLocaleTimeString()}
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {log.user?.firstName} {log.user?.lastName}
                  </div>
                  <div className="text-xs text-muted">{log.user?.email || 'System'}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {getActionBadge(log.action, log.success)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <code className="text-xs text-muted bg-muted/20 px-2 py-1 rounded">
                {log.ipAddress || 'Unknown'}
              </code>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {log.success !== undefined ? (
                log.success ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-3 w-3" />
                    Success
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                    <XCircle className="h-3 w-3" />
                    Failed
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Activity className="h-3 w-3" />
                  Info
                </span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(log)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Eye className="h-4 w-4 mr-1" />
                Details
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}