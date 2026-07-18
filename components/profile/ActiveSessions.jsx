'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Shield, RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import SessionList from './SessionList';
import ExpiredSessionsList from './ExpiredSessionsList';
import OTPModal from './OTPModal';
import ConfirmationModal from './ConfirmationModal';
import SessionDebugInfo from './SessionDebugInfo';

export default function ActiveSessions() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [expiredSessions, setExpiredSessions] = useState([]);
  const [currentSessionToken, setCurrentSessionToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);

  // OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const getCurrentSessionToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    let token = localStorage.getItem('sessionToken');
    if (!token) {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('sessionToken='));
      if (sessionCookie) {
        token = sessionCookie.split('=')[1];
        localStorage.setItem('sessionToken', token);
      }
    }
    return token;
  }, []);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch('/api/user/activity', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSessions(data.sessions || []);
        setExpiredSessions(data.expiredSessions || []);
        setCurrentSessionToken(getCurrentSessionToken());
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('[Sessions] Fetch error:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [getCurrentSessionToken]);

  // ✅ Auto-refresh REMOVED - only fetch on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeClick = async (session) => {
    setRevokingId(session.sessionToken);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/user/revoke-session/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionToken: session.sessionToken })
      });
      const data = await res.json();
      if (res.ok) {
        setPendingRevoke({ type: 'single', session });
        setShowOtpModal(true);
        toast.success('Verification code sent to your email');
      } else {
        toast.error(data.error || 'Failed to request verification');
      }
    } catch (error) {
      console.error('Request OTP error:', error);
      toast.error('Network error');
    } finally {
      setRevokingId(null);
    }
  };

  const handleBulkRevokeClick = () => {
    setShowConfirmModal(true);
  };

  const confirmBulkRevoke = async () => {
    setIsBulkLoading(true);
    setShowConfirmModal(false);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/user/revoke-all-sessions/request-otp', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPendingRevoke({ type: 'bulk' });
        setShowOtpModal(true);
        toast.success('Verification code sent to your email');
      } else {
        toast.error(data.error || 'Failed to request bulk revocation');
      }
    } catch (error) {
      console.error('Bulk request OTP error:', error);
      toast.error('Network error');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleOtpVerify = async (otpCode) => {
    if (!pendingRevoke) return;
    try {
      const token = localStorage.getItem('accessToken');
      let endpoint = '';
      let body = {};

      if (pendingRevoke.type === 'single') {
        endpoint = '/api/user/revoke-session';
        body = { sessionToken: pendingRevoke.session.sessionToken, otp: otpCode };
      } else {
        endpoint = '/api/user/revoke-all-sessions';
        body = { otp: otpCode };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setShowOtpModal(false);
        setPendingRevoke(null);
        fetchSessions();

        if (pendingRevoke.type === 'single' && data.message.includes('Current session revoked')) {
          setTimeout(() => window.location.href = '/login', 2000);
        }
      } else {
        toast.error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Network error');
    }
  };

  const getOtpDeviceInfo = () => {
    if (pendingRevoke?.type === 'single' && pendingRevoke.session) {
      const s = pendingRevoke.session;
      return {
        deviceName: s.deviceName || s.userAgent?.split(' ')[0] || 'Unknown',
        location: s.location || 'Unknown',
        ipAddress: s.ipAddress || 'Unknown',
      };
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="spinner"></div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Session Management</h2>
          </div>
          <div className="flex gap-2">
            {activeSessions.length > 1 && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkRevokeClick}
                disabled={isBulkLoading}
                className="gap-1"
              >
                <Shield className="h-4 w-4" />
                {isBulkLoading ? 'Requesting...' : 'Revoke All Others'}
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1" onClick={fetchSessions}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted">
              🔐 Your current session is highlighted in <span className="text-green-600 font-semibold">GREEN</span>. 
              Revoking a session requires a one‑time code sent to your email for security.
            </p>
          </div>
        </div>

        <SessionDebugInfo
          activeSessions={activeSessions}
          currentSessionToken={currentSessionToken}
          expiredSessions={expiredSessions}
        />

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-semibold text-foreground">Active Sessions</h3>
            <span className="text-xs text-muted bg-muted/20 px-2 py-0.5 rounded-full">
              ({activeSessions.length})
            </span>
          </div>
          <SessionList
            sessions={activeSessions}
            currentSessionToken={currentSessionToken}
            onRevoke={handleRevokeClick}
            revokingId={revokingId}
          />
        </div>

        {expiredSessions.length > 0 && (
          <ExpiredSessionsList expiredSessions={expiredSessions} />
        )}

        <div className="mt-6 p-3 bg-yellow-500/10 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted">
              <p className="font-medium text-foreground mb-1">📌 Session Management Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="text-green-600 font-medium">Green highlighted</span> session = Your current device (use navbar logout to end)</li>
                <li>Revoking a session requires email OTP verification</li>
                <li>Sessions automatically expire after 1 hour of inactivity</li>
                <li>Revoked/expired sessions are kept for audit purposes</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      <OTPModal
        isOpen={showOtpModal}
        onClose={() => {
          setShowOtpModal(false);
          setPendingRevoke(null);
        }}
        onVerify={handleOtpVerify}
        title={pendingRevoke?.type === 'single' ? 'Revoke Session' : 'Revoke All Other Sessions'}
        description={
          pendingRevoke?.type === 'single'
            ? 'To revoke this session, enter the verification code sent to your email.'
            : 'You are about to revoke all other active sessions. Enter the verification code sent to your email to confirm.'
        }
        deviceInfo={getOtpDeviceInfo()}
      />

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmBulkRevoke}
        title="Revoke All Other Sessions"
        message="Are you sure you want to revoke all other active sessions? You will be logged out from all other devices. Your current session will remain active."
        confirmText="Yes, Revoke All"
        cancelText="Cancel"
        variant="danger"
        isLoading={isBulkLoading}
      />
    </>
  );
}