'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, ShieldOff, AlertCircle, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RevokeRoleModal({ user, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onConfirm(user.id, reason || 'Role revoked by admin');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-error/10">
              <ShieldOff className="h-5 w-5 text-error" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Revoke User Role</h3>
              <p className="text-sm text-muted">
                {user.firstName} {user.lastName} ({user.email})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/20 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-xs text-muted">
                <p><strong>Warning: This action will:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Remove the user's current role</li>
                  <li>Set their status to PENDING</li>
                  <li>Require them to submit a new role application</li>
                  <li>The user will be logged out immediately</li>
                  <li>Their data will be preserved</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason for Revocation
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field min-h-[80px]"
              placeholder="Enter reason for role revocation..."
            />
          </div>

          <div className="p-3 rounded-lg bg-error/5 border border-error/20">
            <div className="flex items-center gap-2">
              <LogOut className="h-4 w-4 text-error" />
              <p className="text-xs text-muted">
                The user will be logged out immediately after role revocation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Revoking...' : 'Revoke Role'}
          </Button>
        </div>
      </div>
    </div>
  );
}