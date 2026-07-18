'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, RefreshCw, Search, Filter, 
  UserPlus, Shield, Key, Clock, CheckCircle, XCircle 
} from 'lucide-react';
import UserStatsCards from './UserStatsCards';
import UserFilters from './UserFilters';
import UserTable from './UserTable';
import RoleChangeModal from './RoleChangeModal';
import RevokeRoleModal from './RevokeRoleModal';  // Keep this
import PermissionGrantModal from './PermissionGrantModal';
import toast from 'react-hot-toast';

export default function UserManagement({ 
  users: initialUsers,
  roles,
  permissions,
  onUserUpdate,
  onRefresh,
  showHeader = true,
  compact = false
}) {
  const [users, setUsers] = useState(initialUsers || []);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);  // Keep this
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    setUsers(initialUsers || []);
  }, [initialUsers]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const filterUsers = () => {
    let filtered = [...users];
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId, roleId, reason) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, roleId, reason })
      });
      
      if (res.ok) {
        toast.success('User role updated successfully');
        if (onUserUpdate) onUserUpdate();
        if (onRefresh) onRefresh();
        setShowRoleModal(false);
        setSelectedUser(null);
        return true;
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update user role');
        return false;
      }
    } catch (error) {
      toast.error('Network error');
      return false;
    }
  };

  // UPDATED: Removed applicationStatus reference
  const handleRevokeRole = async (userId, reason) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId, 
          roleId: null,
          reason: reason || 'Role revoked by admin'
        })
      });
      
      if (res.ok) {
        toast.success('Role revoked successfully.');
        if (onUserUpdate) onUserUpdate();
        if (onRefresh) onRefresh();
        setShowRevokeModal(false);
        setSelectedUser(null);
        return true;
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to revoke role');
        return false;
      }
    } catch (error) {
      toast.error('Network error');
      return false;
    }
  };

  const handleGrantPermission = async (userId, permissionId, isGranted, expiresAt) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, permissionId, isGranted, expiresAt })
      });
      
      if (res.ok) {
        toast.success(`Permission ${isGranted ? 'granted' : 'revoked'} successfully`);
        if (onUserUpdate) onUserUpdate();
        if (onRefresh) onRefresh();
        setShowPermissionModal(false);
        setSelectedUser(null);
        return true;
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update permission');
        return false;
      }
    } catch (error) {
      toast.error('Network error');
      return false;
    }
  };

  return (
    <>
      {/* Header */}
      {showHeader && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">User Management</h2>
            <p className="text-sm text-muted">Manage users, roles, and permissions</p>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              onClick={onRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      )}

      {/* Stats Cards */}
      {!compact && <UserStatsCards users={users} />}

      {/* Filters */}
      <UserFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* User Table */}
      <UserTable
        users={filteredUsers}
        roles={roles}
        onRoleChange={(user) => {
          setSelectedUser(user);
          setShowRoleModal(true);
        }}
        onRevokeRole={(user) => {
          setSelectedUser(user);
          setShowRevokeModal(true);
        }}
        onGrantPermission={(user) => {
          setSelectedUser(user);
          setShowPermissionModal(true);
        }}
      />

      {/* Modals */}
      {showRoleModal && selectedUser && (
        <RoleChangeModal
          user={selectedUser}
          roles={roles}
          onConfirm={handleRoleChange}
          onClose={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showRevokeModal && selectedUser && (
        <RevokeRoleModal
          user={selectedUser}
          onConfirm={handleRevokeRole}
          onClose={() => {
            setShowRevokeModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showPermissionModal && selectedUser && (
        <PermissionGrantModal
          user={selectedUser}
          permissions={permissions}
          onConfirm={handleGrantPermission}
          onClose={() => {
            setShowPermissionModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </>
  );
}