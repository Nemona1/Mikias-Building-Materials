'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Shield, Edit, Trash2, Users, Key, 
  ChevronDown, ChevronUp, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoleList({ roles, permissions, onEdit, onDelete }) {
  const [expandedRole, setExpandedRole] = useState(null);

  const getPermissionCategoryColor = (category) => {
    const colors = {
      user: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
      admin: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10',
      content: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10',
      system: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
    };
    return colors[category] || 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-500/10';
  };

  const getRoleIcon = (isSystem) => {
    return isSystem ? (
      <Shield className="h-5 w-5 text-primary" />
    ) : (
      <Users className="h-5 w-5 text-success" />
    );
  };

  const handleDelete = (role) => {
    if (role.isSystem) {
      toast.error('Cannot delete system roles');
      return;
    }
    onDelete(role.id);
  };

  if (roles.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Shield className="h-12 w-12 text-muted mx-auto mb-4" />
        <p className="text-muted">No roles found</p>
        <p className="text-sm text-muted/70 mt-1">Click "Create New Role" to add your first role</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {roles.map((role) => {
        const isExpanded = expandedRole === role.id;
        const permissionCount = role.permissions?.length || 0;
        
        // Group permissions by category
        const permissionsByCategory = {};
        (role.permissions || []).forEach(rp => {
          const category = rp.permission?.category || 'general';
          if (!permissionsByCategory[category]) {
            permissionsByCategory[category] = [];
          }
          permissionsByCategory[category].push(rp.permission);
        });

        return (
          <Card key={role.id} className="overflow-hidden hover:shadow-md transition-all duration-200">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    {getRoleIcon(role.isSystem)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-foreground">{role.name}</h3>
                      {role.isSystem && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          System Role
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-xs bg-muted/20 text-muted rounded-full">
                        {role._count?.users || 0} users
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-muted/20 text-muted rounded-full">
                        {permissionCount} permissions
                      </span>
                    </div>
                    {role.description && (
                      <p className="text-sm text-muted mt-1">{role.description}</p>
                    )}
                    {permissionCount > 0 && (
                      <button
                        onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                        className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>Hide permissions <ChevronUp className="h-3 w-3" /></>
                        ) : (
                          <>View {permissionCount} permissions <ChevronDown className="h-3 w-3" /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!role.isSystem && (
                    <>
                      <button
                        onClick={() => onEdit(role)}
                        className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                        title="Edit Role"
                      >
                        <Edit className="h-4 w-4 text-muted hover:text-primary" />
                      </button>
                      <button
                        onClick={() => handleDelete(role)}
                        className="p-2 rounded-lg hover:bg-error/10 transition-colors"
                        title="Delete Role"
                      >
                        <Trash2 className="h-4 w-4 text-muted hover:text-error" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded Permissions Section */}
              {isExpanded && permissionCount > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Assigned Permissions</span>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(permissionsByCategory).map(([category, perms]) => (
                      <div key={category}>
                        <p className="text-xs font-semibold text-muted mb-2 capitalize">{category}</p>
                        <div className="flex flex-wrap gap-2">
                          {perms.map((perm) => (
                            <span
                              key={perm.id}
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getPermissionCategoryColor(perm.category)}`}
                            >
                              <Key className="h-3 w-3" />
                              {perm.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}