// app/admin/permissions/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PermissionManagement from '@/components/admin/permissions/PermissionManagement';
import { useAntiTamper } from '@/hooks/useAntiTamper';
import toast from 'react-hot-toast';

export default function AdminPermissionsPage() {
  const router = useRouter();
  useAntiTamper();
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const [usersRes, permsRes] = await Promise.all([
        fetch('/api/admin/users', {
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
      
      if (usersRes.ok && permsRes.ok) {
        const usersData = await usersRes.json();
        const permsData = await permsRes.json();
        
        // FIX: Check if usersData has a users property
        if (usersData.users && Array.isArray(usersData.users)) {
          setUsers(usersData.users);
        } else if (Array.isArray(usersData)) {
          setUsers(usersData);
        } else {
          console.warn('Unexpected users data format:', usersData);
          setUsers([]);
        }
        
        setPermissions(permsData.permissions || permsData || []);
      } else if (usersRes.status === 403 || permsRes.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
      } else if (usersRes.status === 401 || permsRes.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const errorData = await usersRes.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to load data');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
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
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || `Permission ${isGranted ? 'granted' : 'revoked'} successfully`);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update permission');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Permission Management</h1>
        <p className="text-muted mt-1">
          Grant or revoke direct permissions for users
        </p>
      </div>
      
      {/* Permission Management Component */}
      <PermissionManagement
        users={users}
        permissions={permissions}
        onGrantPermission={handleGrantPermission}
        onRefresh={fetchData}
      />
    </div>
  );
}