'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Shield, Users, Key, RefreshCw } from 'lucide-react';
import RoleList from './RoleList';
import RoleFormModal from './RoleFormModal';
import toast from 'react-hot-toast';

export default function RoleManagement({ 
  roles, 
  permissions, 
  onCreateRole, 
  onUpdateRole, 
  onDeleteRole,
  onRefresh 
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const handleEdit = (role) => {
    setEditingRole(role);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingRole(null);
  };

  const stats = [
    {
      label: 'Total Roles',
      value: roles.length,
      icon: Shield,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      label: 'System Roles',
      value: roles.filter(r => r.isSystem).length,
      icon: Shield,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-500/10'
    },
    {
      label: 'Custom Roles',
      value: roles.filter(r => !r.isSystem).length,
      icon: Users,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      label: 'Total Permissions',
      value: permissions.length,
      icon: Key,
      color: 'text-warning',
      bg: 'bg-warning/10'
    }
  ];

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-4 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Header with Create Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">System Roles</h2>
          <p className="text-sm text-muted">Manage roles and their associated permissions</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Role
          </Button>
        </div>
      </div>

      {/* Role List */}
      <RoleList
        roles={roles}
        permissions={permissions}
        onEdit={handleEdit}
        onDelete={onDeleteRole}
      />

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <RoleFormModal
          role={editingRole}
          permissions={permissions}
          onConfirm={editingRole ? onUpdateRole : onCreateRole}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}