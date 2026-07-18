'use client';

import { Monitor, Smartphone, Tablet, Globe, Clock, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const getDeviceIcon = (userAgent) => {
  if (!userAgent) return <Globe className="h-5 w-5" />;
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return <Smartphone className="h-5 w-5" />;
  if (ua.includes('tablet') || ua.includes('ipad')) return <Tablet className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
};

const getDeviceType = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  const ua = userAgent.toLowerCase();
  if (ua.includes('iphone')) return '📱 iPhone';
  if (ua.includes('ipad')) return '📱 iPad';
  if (ua.includes('android')) return '📱 Android';
  if (ua.includes('mac')) return '💻 Mac';
  if (ua.includes('windows')) return '💻 Windows';
  if (ua.includes('linux')) return '💻 Linux';
  return '💻 Desktop';
};

const formatTimeAgo = (date) => {
  if (!date) return 'Unknown';
  const diffMs = Date.now() - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

export default function SessionCard({ session, isCurrent, onRevoke, isRevoking }) {
  const deviceInfo = {
    deviceName: session.deviceName || session.userAgent?.split(' ')[0] || 'Unknown',
    location: session.location || 'Unknown',
    ipAddress: session.ipAddress || 'Unknown',
    browser: session.browser || 'Unknown',
    os: session.os || 'Unknown',
  };

  return (
    <div className={`p-4 rounded-lg transition-all duration-200 ${
      isCurrent 
        ? 'border-2 border-green-500/50 bg-gradient-to-r from-green-500/10 to-transparent shadow-md' 
        : 'bg-muted/5 border border-border hover:bg-muted/10'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isCurrent ? 'bg-green-500/20' : 'bg-primary/10'
          }`}>
            {getDeviceIcon(session.userAgent)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-foreground">
                {getDeviceType(session.userAgent)}
              </p>
              {isCurrent && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  CURRENT DEVICE
                </span>
              )}
              <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                {deviceInfo.browser} on {deviceInfo.os}
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              {session.deviceName || session.userAgent?.substring(0, 60) || 'Unknown Device'}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              <span className="text-xs text-muted flex items-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0" />
                Last active: {formatTimeAgo(session.lastActivity)}
              </span>
              <span className="text-xs text-muted">IP: {deviceInfo.ipAddress}</span>
              <span className="text-xs text-muted">📍 {deviceInfo.location}</span>
              <span className="text-xs text-muted">
                Expires: {new Date(session.expiresAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
        
        {!isCurrent && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onRevoke(session)}
            disabled={isRevoking}
            className="gap-2 min-w-[120px]"
          >
            {isRevoking ? (
              <div className="spinner h-4 w-4"></div>
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {isRevoking ? 'Revoking...' : 'Revoke Session'}
          </Button>
        )}
      </div>
    </div>
  );
}