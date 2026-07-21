// app/profile/layout.jsx
'use client';

import React, { Children, isValidElement, cloneElement } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/context/SidebarContext';

export default function ProfileLayout({ children, refreshKey = 0 }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, isInitialized } = useAuth();
  const { collapsed } = useSidebar();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isLoading && isInitialized) {
      if (!isAuthenticated || !user) {
        console.log('[Profile Layout] Not authenticated, redirecting to login');
        router.replace('/login');
        return;
      }
    }
  }, [user, isLoading, isAuthenticated, isInitialized, router]);

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

  if (!isAuthenticated || !user) {
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