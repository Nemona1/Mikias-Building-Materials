// components/admin/permissions/PermissionList.jsx
'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Mail, Shield, Key, Plus, XCircle, Users } from 'lucide-react';
import { useState } from 'react';

const PermissionBadge = ({ permission, isGranted, onRevoke }) => {
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
      isGranted 
        ? 'bg-success/10 text-success' 
        : 'bg-error/10 text-error line-through'
    }`}>
      <Key className="h-3 w-3" />
      <span>{permission?.name || 'Unknown'}</span>
      {onRevoke && (
        <button
          onClick={onRevoke}
          className="ml-1 hover:opacity-70"
          title="Revoke permission"
        >
          <XCircle className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default function PermissionList({ users = [], permissions = [], onGrantClick }) {
  const [expandedUser, setExpandedUser] = useState(null);

  // Ensure users is an array
  const userArray = Array.isArray(users) ? users : [];

  if (userArray.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="h-12 w-12 text-muted mx-auto mb-4" />
        <p className="text-muted">No users found</p>
        <p className="text-sm text-muted/70 mt-1">Try adjusting your search</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {userArray.map((user) => {
        const isExpanded = expandedUser === user.id;
        const grantedPerms = user.directPermissions?.filter(p => p.isGranted) || [];
        const revokedPerms = user.directPermissions?.filter(p => !p.isGranted) || [];
        
        return (
          <Card key={user.id} className="overflow-hidden hover:shadow-md transition-all duration-200">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-foreground">
                        {user.firstName || 'Unknown'} {user.lastName || ''}
                      </h3>
                      <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                        {user.role?.name || 'No Role'}
                      </span>
                      {user.directPermissions?.length > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-warning/10 text-warning rounded-full">
                          {user.directPermissions.length} custom override(s)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted mt-1">
                      <Mail className="h-3 w-3" />
                      {user.email || 'No email'}
                    </div>
                    
                    {/* Summary of permissions */}
                    {grantedPerms.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {grantedPerms.slice(0, 3).map((up) => (
                          <PermissionBadge 
                            key={up.permissionId} 
                            permission={up.permission} 
                            isGranted={true}
                          />
                        ))}
                        {grantedPerms.length > 3 && (
                          <span className="text-xs text-muted">
                            +{grantedPerms.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      {isExpanded ? 'Show less' : `View all permissions (${user.directPermissions?.length || 0})`}
                    </button>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onGrantClick(user)}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Grant Permission
                </Button>
              </div>

              {/* Expanded Permissions Section */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border">
                  {user.directPermissions?.length === 0 ? (
                    <p className="text-sm text-muted text-center py-4">
                      No custom permissions assigned. Click "Grant Permission" to add.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {grantedPerms.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-success" />
                            <span className="text-sm font-medium text-foreground">Granted Permissions</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {grantedPerms.map((up) => (
                              <PermissionBadge 
                                key={up.permissionId} 
                                permission={up.permission} 
                                isGranted={true}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {revokedPerms.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="h-4 w-4 text-error" />
                            <span className="text-sm font-medium text-foreground">Revoked Permissions</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {revokedPerms.map((up) => (
                              <PermissionBadge 
                                key={up.permissionId} 
                                permission={up.permission} 
                                isGranted={false}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}