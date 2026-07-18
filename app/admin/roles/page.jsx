'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import RoleManagement from '@/components/admin/roles/RoleManagement';
import { useAntiTamper } from '@/hooks/useAntiTamper';
import { useSidebar } from '@/context/SidebarContext';
import toast from 'react-hot-toast';

export default function AdminRolesPage() {
  const router = useRouter();
  const { collapsed } = useSidebar();
  useAntiTamper();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
        setPermissions(data.permissions || []);
      } else if (res.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (roleData) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roleData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Role created successfully');
        fetchRolesAndPermissions();
        return true;
      } else {
        toast.error(data.error || 'Failed to create role');
        return false;
      }
    } catch (error) {
      toast.error('Network error');
      return false;
    }
  };

  const handleUpdateRole = async (roleData) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roleData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Role updated successfully');
        fetchRolesAndPermissions();
        return true;
      } else {
        toast.error(data.error || 'Failed to update role');
        return false;
      }
    } catch (error) {
      toast.error('Network error');
      return false;
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/roles?id=${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Role deleted successfully');
        fetchRolesAndPermissions();
      } else {
        toast.error(data.error || 'Failed to delete role');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 p-8 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              Role Management
            </h1>
            <p className="text-muted mt-2">
              Create and manage system roles and their permissions
            </p>
          </div>
          
          <RoleManagement
            roles={roles}
            permissions={permissions}
            onCreateRole={handleCreateRole}
            onUpdateRole={handleUpdateRole}
            onDeleteRole={handleDeleteRole}
            onRefresh={fetchRolesAndPermissions}
          />
        </main>
      </div>
    </div>
  );
}