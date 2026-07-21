// app/admin/layout.jsx - Admin layout with refresh support
'use client';

import React, { useEffect, Children, isValidElement, cloneElement } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/context/SidebarContext';

export default function AdminLayout({ children, refreshKey = 0 }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, isInitialized } = useAuth();
  const { collapsed } = useSidebar();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && isInitialized) {
      if (!isAuthenticated || !user) {
        console.log('[Admin Layout] Not authenticated, redirecting to login');
        router.replace('/login');
        return;
      }

      const roleName = user.role?.name || 'customer';
      const hasAdminAccess = roleName === 'super_admin' || roleName === 'admin';

      if (!hasAdminAccess) {
        console.log('[Admin Layout] No admin access for role:', roleName);
        const dashboardMap = {
          'super_admin': '/dashboard/super-admin',
          'admin': '/dashboard/admin',
          'manager': '/dashboard/manager',
          'staff': '/dashboard/staff',
          'customer': '/dashboard/customer'
        };
        router.replace(dashboardMap[roleName] || '/dashboard/customer');
      }
    }
  }, [user, isLoading, isAuthenticated, isInitialized, router]);

  // Show loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || !user) {
    return null;
  }

  const roleName = user.role?.name || 'customer';
  const hasAdminAccess = roleName === 'super_admin' || roleName === 'admin';

  if (!hasAdminAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 p-8 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
          {Children.map(children, child => {
            if (isValidElement(child)) {
              return cloneElement(child, { refreshKey });
            }
            return child;
          })}
        </main>
      </div>
    </div>
  );
}