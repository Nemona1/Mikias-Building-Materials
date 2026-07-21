// app/admin/users/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserManagement from '@/components/admin/users/UserManagement';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      console.log('[AdminUsersPage] Fetching data with token:', !!token);
      
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        fetch('/api/admin/users', { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }),
        fetch('/api/admin/roles', { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }),
        fetch('/api/admin/permissions', { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        })
      ]);
      
      console.log('[AdminUsersPage] API Status - Users:', usersRes.status, 'Roles:', rolesRes.status, 'Perms:', permsRes.status);
      
      if (usersRes.ok && rolesRes.ok && permsRes.ok) {
        const usersData = await usersRes.json();
        const rolesData = await rolesRes.json();
        const permsData = await permsRes.json();
        
        console.log('[AdminUsersPage] Users data received:', usersData);
        console.log('[AdminUsersPage] Users count:', usersData.users?.length || usersData?.length || 0);
        
        // Check if usersData has a users property or is the array directly
        let usersArray = [];
        if (usersData.users && Array.isArray(usersData.users)) {
          usersArray = usersData.users;
        } else if (Array.isArray(usersData)) {
          usersArray = usersData;
        } else {
          console.warn('[AdminUsersPage] Unexpected users data format:', usersData);
          usersArray = [];
        }
        
        console.log('[AdminUsersPage] Setting users array length:', usersArray.length);
        setUsers(usersArray);
        setRoles(rolesData.roles || []);
        setPermissions(permsData.permissions || permsData || []);
      } else if (usersRes.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
      } else if (usersRes.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const errorData = await usersRes.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to load data');
      }
    } catch (error) {
      console.error('[AdminUsersPage] Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted">Loading users...</p>
        </div>
      </div>
    );
  }

  console.log('[AdminUsersPage] Rendering with users count:', users.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted mt-1">
          Manage users, roles, and permissions
        </p>
      </div>

      {/* User Management Component */}
      <UserManagement
        users={users}
        roles={roles}
        permissions={permissions}
        onUserUpdate={fetchData}
        onRefresh={fetchData}
        showHeader={false}
      />
    </div>
  );
}