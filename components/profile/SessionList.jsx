'use client';

import SessionCard from './SessionCard';

export default function SessionList({ sessions, currentSessionToken, onRevoke, revokingId }) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/5 rounded-lg">
        <p className="text-sm text-muted">No active sessions</p>
        <p className="text-xs text-muted/70 mt-1">Your current session will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const isCurrent = session.isCurrent === true || session.sessionToken === currentSessionToken;
        const isRevoking = revokingId === session.sessionToken;
        return (
          <SessionCard
            key={session.sessionToken}
            session={session}
            isCurrent={isCurrent}
            onRevoke={onRevoke}
            isRevoking={isRevoking}
          />
        );
      })}
    </div>
  );
}