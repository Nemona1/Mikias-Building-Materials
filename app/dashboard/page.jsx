// app/dashboard/page.jsx - Optimized with refresh functionality
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Shield, Users, FileText, Eye, Loader2, 
  Building2, Package, Truck, UserCog, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, loading, userRole, refreshUser } = useUserRole();
  const [redirecting, setRedirecting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      toast.success('Dashboard refreshed');
      // Re-trigger redirect after refresh
      setRedirecting(true);
      redirectToRoleDashboard();
    } catch (error) {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  const redirectToRoleDashboard = useCallback(() => {
    if (loading) return;
    
    if (!user) {
      router.replace('/');
      return;
    }
    
    const roleName = userRole || 'customer';
    
    const dashboardMap = {
      'super_admin': '/dashboard/super-admin',
      'admin': '/dashboard/admin',
      'manager': '/dashboard/manager',
      'staff': '/dashboard/staff',
      'customer': '/dashboard/customer'
    };
    
    const redirectPath = dashboardMap[roleName] || '/dashboard/customer';
    console.log('[Dashboard] Redirecting to:', redirectPath, 'for role:', roleName);
    router.replace(redirectPath);
    setRedirecting(false);
  }, [router, user, loading, userRole]);

  useEffect(() => {
    redirectToRoleDashboard();
  }, [redirectToRoleDashboard]);

  // Role icons mapping
  const roleIcons = {
    'super_admin': <Shield className="h-12 w-12 text-purple-500" />,
    'admin': <UserCog className="h-12 w-12 text-red-500" />,
    'manager': <Users className="h-12 w-12 text-blue-500" />,
    'staff': <FileText className="h-12 w-12 text-green-500" />,
    'customer': <Building2 className="h-12 w-12 text-primary" />,
  };

  const roleDisplayNames = {
    'super_admin': 'Super Administrator',
    'admin': 'Administrator',
    'manager': 'Manager',
    'staff': 'Staff',
    'customer': 'Customer'
  };

  // Show loading spinner with role-based preview
  if (loading || redirecting) {
    const role = userRole || 'customer';
    const displayName = roleDisplayNames[role] || role;
    const Icon = roleIcons[role] || <Shield className="h-12 w-12 text-primary mx-auto" />;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          {/* Animated logo */}
          <div className="relative mb-8">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
            <div className="relative h-20 w-20 bg-gradient-to-br from-primary to-primary-hover rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          
          {/* Role icon */}
          <div className="mb-4 animate-bounce">
            {Icon}
          </div>
          
          {/* Loading message */}
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Welcome back, {user?.firstName || 'User'}!
          </h2>
          <p className="text-muted mb-4">
            Redirecting you to your {displayName} dashboard...
          </p>
          
          {/* Spinner */}
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    );
  }
  
  return null;
}