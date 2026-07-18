// app/dashboard/layout.js
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/context/SidebarContext';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, isInitialized } = useAuth();
  const { collapsed } = useSidebar();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && isInitialized && !isAuthenticated && !user) {
      console.log('[Dashboard Layout] Not authenticated, redirecting to login');
      router.replace('/login');
    }
  }, [isLoading, isInitialized, isAuthenticated, user, router]);

  // Check if user has access to this dashboard based on role
  const hasAccess = () => {
    if (typeof window === 'undefined') return true;
    const role = user?.role?.name || 'customer';
    
    // Super Admin has access to all dashboards
    if (role === 'super_admin') return true;
    
    // Check role-specific dashboard access
    if (role === 'admin' && pathname.includes('/dashboard/admin')) return true;
    if (role === 'manager' && pathname.includes('/dashboard/manager')) return true;
    if (role === 'staff' && pathname.includes('/dashboard/staff')) return true;
    if (role === 'customer' && pathname.includes('/dashboard/customer')) return true;
    
    return false;
  };

  // Redirect to correct dashboard if user doesn't have access
  useEffect(() => {
    if (!isLoading && user && !hasAccess()) {
      const role = user?.role?.name || 'customer';
      const dashboardMap = {
        'super_admin': '/dashboard/super-admin',
        'admin': '/dashboard/admin',
        'manager': '/dashboard/manager',
        'staff': '/dashboard/staff',
        'customer': '/dashboard/customer'
      };
      const correctDashboard = dashboardMap[role] || '/dashboard/customer';
      console.log('[Dashboard Layout] Redirecting to correct dashboard:', correctDashboard);
      router.replace(correctDashboard);
    }
  }, [isLoading, user, router, pathname]);

  // Show loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 p-8 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}