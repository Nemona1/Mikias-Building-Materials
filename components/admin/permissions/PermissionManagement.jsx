// components/admin/permissions/PermissionManagement.jsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Users, Key, Shield, RefreshCw } from 'lucide-react';
import PermissionList from './PermissionList';
import GrantPermissionModal from './GrantPermissionModal';

export default function PermissionManagement({
  users = [],
  permissions = [],
  onGrantPermission,
  onRefresh
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Ensure users is an array
  const userArray = Array.isArray(users) ? users : [];

  const filteredUsers = userArray.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ensure permissions is an array
  const permsArray = Array.isArray(permissions) ? permissions : [];

  const stats = [
    {
      label: 'Total Permissions',
      value: permsArray.length,
      icon: Key,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      label: 'Permission Categories',
      value: [...new Set(permsArray.map(p => p.category))].length,
      icon: Shield,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-500/10'
    },
    {
      label: 'Users with Overrides',
      value: userArray.filter(u => u.directPermissions?.length > 0).length,
      icon: Users,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      label: 'Total Overrides',
      value: userArray.reduce((acc, u) => acc + (u.directPermissions?.length || 0), 0),
      icon: Shield,
      color: 'text-warning',
      bg: 'bg-warning/10'
    }
  ];

  const handleGrantClick = (user) => {
    setSelectedUser(user);
    setShowGrantModal(true);
  };

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

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">User Permissions</h2>
          <p className="text-sm text-muted">Grant or revoke direct permissions for users</p>
        </div>
        <Button
          variant="outline"
          onClick={onRefresh}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
        />
      </div>

      {/* Permission List */}
      <PermissionList
        users={filteredUsers}
        permissions={permsArray}
        onGrantClick={handleGrantClick}
      />

      {/* Grant Permission Modal */}
      {showGrantModal && selectedUser && (
        <GrantPermissionModal
          user={selectedUser}
          permissions={permsArray}
          onConfirm={onGrantPermission}
          onClose={() => {
            setShowGrantModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </>
  );
}