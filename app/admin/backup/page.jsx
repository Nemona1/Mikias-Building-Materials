'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import BackupManager from '@/components/admin/backup/BackupManager';
import { useSidebar } from '@/context/SidebarContext';
import { useAntiTamper } from '@/hooks/useAntiTamper';
import toast from 'react-hot-toast';

export default function AdminBackupPage() {
  const router = useRouter();
  const { collapsed } = useSidebar();
  useAntiTamper();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const user = await res.json();
        if (user.role?.name !== 'ADMIN') {
          toast.error('Access denied. Admin privileges required.');
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Permission check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
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
              Backup Management
            </h1>
            <p className="text-muted mt-2">
              Create, manage, and restore system backups
            </p>
          </div>
          
          <BackupManager />
        </main>
      </div>
    </div>
  );
}