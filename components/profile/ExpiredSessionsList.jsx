'use client';

import { History, Power, Trash2, Clock } from 'lucide-react';

const formatTimeAgo = (date) => {
  if (!date) return 'Unknown';
  const diffMs = Date.now() - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour ago`;
  return `${diffDays} day ago`;
};

export default function ExpiredSessionsList({ expiredSessions }) {
  return (
    <div className="pt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-muted" />
        <h3 className="text-sm font-semibold text-foreground">Session History (Expired/Revoked)</h3>
        <span className="text-xs text-muted bg-muted/20 px-2 py-0.5 rounded-full">({expiredSessions.length})</span>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {expiredSessions.map((session) => (
          <div key={session.sessionToken} className="p-3 rounded-lg bg-muted/5 border border-border/50 opacity-75">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center">
                  <Power className="h-4 w-4 text-muted" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{session.deviceName || 'Unknown Device'}</p>
                    <span className="px-2 py-0.5 text-xs bg-muted/20 rounded-full">
                      {session.browser} on {session.os}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> Last: {formatTimeAgo(session.lastActivity)}</span>
                    <span>IP: {session.ipAddress || 'Unknown'}</span>
                    <span>📍 {session.location || 'Unknown'}</span>
                    <span className="text-red-500 flex items-center gap-1">
                      <Trash2 className="h-3 w-3" />
                      {session.expiresAt > new Date() ? 'Revoked' : 'Expired'}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted">{new Date(session.expiresAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}