'use client';

import { Card } from '@/components/ui/Card';
import { 
  User, Users, Mail, Shield, 
  CheckCircle, XCircle, AlertCircle, 
  UserCog, KeyRound, Trash2
} from 'lucide-react';

export default function UserTable({ 
  users = [], 
  roles = [], 
  onRoleChange, 
  onRevokeRole,
  onGrantPermission
}) {
  // Ensure users is an array
  const userArray = Array.isArray(users) ? users : [];

  if (userArray.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="h-12 w-12 text-muted mx-auto mb-4" />
        <p className="text-muted">No users found</p>
        <p className="text-sm text-muted/70 mt-1">Try adjusting your search or filters</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-border/50 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">2FA</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Joined</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {userArray.map((user) => (
              <tr key={user.id || Math.random()} className="hover:bg-muted/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {user.firstName || 'Unknown'} {user.lastName || ''}
                      </div>
                      <div className="text-sm text-muted flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email || 'No email'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">
                      {user.role?.name || 'No Role'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.isActive !== false ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-error">
                      <XCircle className="h-3 w-3" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {user.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-warning">
                      <AlertCircle className="h-3 w-3" />
                      Unverified
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {user.twoFactorEnabled ? (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                      <Shield className="h-3 w-3" />
                      Enabled
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Disabled</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-muted">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onRoleChange && onRoleChange(user)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors group"
                      title="Change Role"
                    >
                      <UserCog className="h-4 w-4 text-muted group-hover:text-primary" />
                    </button>
                    {user.role && onRevokeRole && (
                      <button
                        onClick={() => onRevokeRole(user)}
                        className="p-1.5 rounded-lg hover:bg-error/10 transition-colors group"
                        title="Revoke Role"
                      >
                        <Trash2 className="h-4 w-4 text-muted group-hover:text-error" />
                      </button>
                    )}
                    <button
                      onClick={() => onGrantPermission && onGrantPermission(user)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors group"
                      title="Manage Permissions"
                    >
                      <KeyRound className="h-4 w-4 text-muted group-hover:text-primary" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}