// app/dashboard/layout.js - Fixed with optional refresh context
'use client';

import React, { useEffect, useState, useCallback, Children, isValidElement, cloneElement, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/context/SidebarContext';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Refresh context for child components
const RefreshContext = createContext(null);

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (!context) {
    // Return a default implementation instead of throwing error
    console.warn('useRefresh used outside of DashboardLayout - returning default');
    return {
      refreshKey: 0,
      refreshing: false,
      handleRefresh: () => {}
    };
  }
  return context;
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, isInitialized, fetchUser } = useAuth();
  const { collapsed } = useSidebar();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Smart refresh - only refreshes content, not page
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh user data
      await fetchUser();
      
      // Increment refresh key to trigger child component re-renders
      setRefreshKey(prev => prev + 1);
      
      toast.success('Content refreshed');
    } catch (error) {
      toast.error('Failed to refresh');
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchUser]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && isInitialized && !isAuthenticated && !user) {
      console.log('[Dashboard Layout] Not authenticated, redirecting to login');
      router.replace('/login');
    }
  }, [isLoading, isInitialized, isAuthenticated, user, router]);

  // Check if user has access to this dashboard based on role
  const hasAccess = useCallback(() => {
    if (typeof window === 'undefined') return true;
    const role = user?.role?.name || 'customer';
    
    if (role === 'super_admin') return true;
    
    if (role === 'admin' && pathname.includes('/dashboard/admin')) return true;
    if (role === 'manager' && pathname.includes('/dashboard/manager')) return true;
    if (role === 'staff' && pathname.includes('/dashboard/staff')) return true;
    if (role === 'customer' && pathname.includes('/dashboard/customer')) return true;
    
    return false;
  }, [user, pathname]);

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
  }, [isLoading, user, router, pathname, hasAccess]);

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
    <RefreshContext.Provider value={{ refreshKey, refreshing, handleRefresh }}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className={`flex-1 p-8 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
            {/* Refresh Button - Positioned at top right of content */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-primary border border-border rounded-lg hover:border-primary/30 transition-all disabled:opacity-50 hover:bg-primary/5"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {/* Pass refreshKey to children to trigger re-renders on refresh */}
            {Children.map(children, child => {
              if (isValidElement(child)) {
                return cloneElement(child, { refreshKey });
              }
              return child;
            })}
          </main>
        </div>
      </div>
    </RefreshContext.Provider>
  );
}