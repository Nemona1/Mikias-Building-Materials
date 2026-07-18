'use client';

import { useState } from 'react';

export default function SessionDebugInfo({ activeSessions, currentSessionToken, expiredSessions }) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development environment
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <span className="font-semibold">🐞 Debug Info</span>
        <span>{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-1 text-gray-500 dark:text-gray-400">
          <p>Current Session Token: {currentSessionToken || 'null'}</p>
          <p>Active Sessions: {activeSessions.length}</p>
          <p>Expired Sessions: {expiredSessions.length}</p>
          <details>
            <summary className="cursor-pointer">Active Session Tokens</summary>
            <ul className="ml-4 mt-1 list-disc">
              {activeSessions.map(s => (
                <li key={s.sessionToken}>
                  {s.sessionToken?.substring(0, 30)}... {s.isCurrent ? '✅ CURRENT' : ''}
                </li>
              ))}
            </ul>
          </details>
          <button
            onClick={() => {
              console.log('Active Sessions:', activeSessions);
              console.log('Current Token:', currentSessionToken);
              console.log('Cookies:', document.cookie);
              console.log('localStorage sessionToken:', localStorage.getItem('sessionToken'));
            }}
            className="text-primary underline"
          >
            Log to Console
          </button>
        </div>
      )}
    </div>
  );
}