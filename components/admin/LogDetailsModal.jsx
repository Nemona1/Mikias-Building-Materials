'use client';

import { X, User, FileJson, Calendar, Globe, Monitor, Smartphone, Activity, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const getActionBadge = (action, success = true) => {
  const badges = {
    'LOGIN_SUCCESS': { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    'LOGIN_FAILED': { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
    'USER_REGISTERED': { icon: Activity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    'EMAIL_VERIFIED': { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    '2FA_ENABLED': { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    '2FA_DISABLED': { icon: XCircle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
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

const getDeviceInfo = (userAgent) => {
  if (!userAgent) return { type: 'Unknown', icon: Globe };
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile')) return { type: 'Mobile Device', icon: Smartphone };
  if (ua.includes('tablet')) return { type: 'Tablet', icon: Smartphone };
  return { type: 'Desktop/Laptop', icon: Monitor };
};

export default function LogDetailsModal({ isOpen, onClose, log }) {
  if (!isOpen || !log) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const deviceInfo = getDeviceInfo(log.userAgent);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Security Event Details</h3>
              <p className="text-sm text-muted">Detailed information about this security event</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted/20 transition-colors"
          >
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] space-y-6">
          {/* Event Summary Card */}
          <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-5 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Event Summary</span>
              </div>
              {getActionBadge(log.action, log.success)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted mt-0.5" />
                <div>
                  <p className="text-xs text-muted">Timestamp</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-muted mt-0.5" />
                <div>
                  <p className="text-xs text-muted">IP Address</p>
                  <code className="text-sm bg-muted/20 px-2 py-1 rounded">
                    {log.ipAddress || 'Unknown'}
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <deviceInfo.icon className="h-4 w-4 text-muted mt-0.5" />
                <div>
                  <p className="text-xs text-muted">Device Type</p>
                  <p className="text-sm text-foreground">{deviceInfo.type}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Activity className="h-4 w-4 text-muted mt-0.5" />
                <div>
                  <p className="text-xs text-muted">Event Status</p>
                  <p className="text-sm font-medium">
                    {log.success ? (
                      <span className="text-success">Successful</span>
                    ) : (
                      <span className="text-error">Failed</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Information (if available) */}
          {(log.resourceType || log.resourceId) && (
            <div className="rounded-lg bg-muted/5 p-5 border border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Resource Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {log.resourceType && (
                  <div>
                    <p className="text-xs text-muted">Resource Type</p>
                    <p className="text-sm text-foreground font-mono">{log.resourceType}</p>
                  </div>
                )}
                {log.resourceId && (
                  <div>
                    <p className="text-xs text-muted">Resource ID</p>
                    <code className="text-xs bg-muted/20 px-2 py-1 rounded">
                      {log.resourceId}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Information */}
          {log.user && (
            <div className="rounded-lg bg-gradient-to-r from-primary/5 to-transparent p-5 border border-primary/10">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                User Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted">Full Name</p>
                  <p className="text-sm text-foreground">
                    {log.user.firstName} {log.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Email</p>
                  <p className="text-sm text-foreground">{log.user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">User ID</p>
                  <code className="text-xs bg-muted/20 px-2 py-1 rounded">
                    {log.user.id}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* User Agent Details (if available) */}
          {log.userAgent && (
            <div className="rounded-lg bg-muted/5 p-5 border border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                Browser Information
              </h4>
              <p className="text-xs text-muted break-words font-mono">
                {log.userAgent}
              </p>
            </div>
          )}

          {/* Additional Details */}
          {log.details && Object.keys(log.details).length > 0 && (
            <div className="rounded-lg bg-muted/5 p-5 border border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileJson className="h-4 w-4 text-primary" />
                Additional Details
              </h4>
              <pre className="p-3 bg-muted/10 rounded-lg text-xs overflow-auto max-h-64 font-mono">
                {typeof log.details === 'string' 
                  ? (() => {
                      try {
                        return JSON.stringify(JSON.parse(log.details), null, 2);
                      } catch {
                        return log.details;
                      }
                    })()
                  : JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}