'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Shield, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoleChangeModal({ user, roles, onConfirm, onClose }) {
  const [selectedRoleId, setSelectedRoleId] = useState(user.role?.id || '');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRoleId) {
      toast.error('Please select a role');
      return;
    }

    setLoading(true);
    await onConfirm(user.id, selectedRoleId, reason || 'Role assigned by admin');
    setLoading(false);
  };

  // Filter roles - exclude system roles that shouldn't be manually assigned
  const availableRoles = roles.filter(r => !r.isSystem || r.name === 'admin');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Change User Role</h3>
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
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select New Role
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
            >
              <option value="">Select a role...</option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} - {role.description || 'No description'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason for Change (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground min-h-[80px]"
              placeholder="Enter reason for role change..."
            />
          </div>

          {user.role && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                <div className="text-xs text-muted">
                  <p>Current role: <strong>{user.role.name}</strong></p>
                  <p className="mt-1">Changing the role will update the user's permissions immediately.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Updating...' : 'Change Role'}
          </Button>
        </div>
      </div>
    </div>
  );
}