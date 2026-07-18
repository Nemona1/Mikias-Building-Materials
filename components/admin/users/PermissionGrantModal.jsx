'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Key, Calendar, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PermissionGrantModal({ user, permissions, onConfirm, onClose }) {
  const [selectedPermission, setSelectedPermission] = useState('');
  const [action, setAction] = useState('grant');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...new Set(permissions.map(p => p.category))];
  const filteredPermissions = selectedCategory === 'all' 
    ? permissions 
    : permissions.filter(p => p.category === selectedCategory);

  const handleSubmit = async () => {
    if (!selectedPermission) {
      toast.error('Please select a permission');
      return;
    }

    setLoading(true);
    await onConfirm(user.id, selectedPermission, action === 'grant', expiresAt || null);
    setLoading(false);
  };

  // Get user's current permissions
  const userPermissions = user.directPermissions || [];
  const isGranted = userPermissions.some(p => p.permissionId === selectedPermission && p.isGranted);
  const isRevoked = userPermissions.some(p => p.permissionId === selectedPermission && !p.isGranted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Manage Direct Permissions</h3>
              <p className="text-sm text-muted">
                {user.firstName} {user.lastName} ({user.email})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/20 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Permission Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Action
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAction('grant')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    action === 'grant'
                      ? 'bg-success/20 text-success border border-success/50'
                      : 'bg-muted/10 text-muted hover:bg-muted/20'
                  }`}
                >
                  Grant Permission
                </button>
                <button
                  type="button"
                  onClick={() => setAction('revoke')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    action === 'revoke'
                      ? 'bg-error/20 text-error border border-error/50'
                      : 'bg-muted/10 text-muted hover:bg-muted/20'
                  }`}
                >
                  Revoke Permission
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Permission
            </label>
            <select
              value={selectedPermission}
              onChange={(e) => setSelectedPermission(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
            >
              <option value="">Select a permission...</option>
              {filteredPermissions.map((perm) => {
                const isUserGranted = userPermissions.some(p => p.permissionId === perm.id && p.isGranted);
                const isUserRevoked = userPermissions.some(p => p.permissionId === perm.id && !p.isGranted);
                return (
                  <option key={perm.id} value={perm.id}>
                    {perm.name} - {perm.description || perm.category}
                    {isUserGranted && ' (Currently Granted)'}
                    {isUserRevoked && ' (Currently Revoked)'}
                  </option>
                );
              })}
            </select>
          </div>

          {action === 'grant' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Expiration (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
                />
              </div>
              <p className="text-xs text-muted mt-1">
                Leave empty for permanent permission
              </p>
            </div>
          )}

          {selectedPermission && (
            <div className="p-3 rounded-lg bg-muted/10">
              <div className="flex items-start gap-2">
                {action === 'grant' ? (
                  <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-error mt-0.5" />
                )}
                <div className="text-xs text-muted">
                  <p>
                    You are about to <strong>{action}</strong> permission 
                    <strong> {permissions.find(p => p.id === selectedPermission)?.name}</strong>
                    {action === 'grant' && expiresAt && ` with expiration on ${new Date(expiresAt).toLocaleString()}`}
                  </p>
                  {isGranted && action === 'grant' && (
                    <p className="text-warning mt-1">⚠️ This permission is already granted to this user</p>
                  )}
                  {isRevoked && action === 'revoke' && (
                    <p className="text-warning mt-1">⚠️ This permission is already revoked for this user</p>
                  )}
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
            {loading ? 'Processing...' : `${action === 'grant' ? 'Grant' : 'Revoke'} Permission`}
          </Button>
        </div>
      </div>
    </div>
  );
}