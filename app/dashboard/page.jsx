'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Shield, Users, FileText, Eye, Loader2, 
  Building2, Package, Truck, UserCog 
} from 'lucide-react';

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, loading, userRole } = useUserRole();
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const redirectToRoleDashboard = async () => {
      // If auth is still loading, wait
      if (loading) return;
      
      // If no user, redirect to home
      if (!user) {
        router.replace('/');
        return;
      }
      
      // Redirect based on role (all users are auto-approved)
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
    };
    
    redirectToRoleDashboard();
  }, [router, user, loading, userRole]);

  // Role icons mapping for Mikias Building Materials
  const roleIcons = {
    'super_admin': <Shield className="h-12 w-12 text-purple-500" />,
    'admin': <UserCog className="h-12 w-12 text-red-500" />,
    'manager': <Users className="h-12 w-12 text-blue-500" />,
    'staff': <FileText className="h-12 w-12 text-green-500" />,
    'customer': <Building2 className="h-12 w-12 text-primary" />,
  };

  // Role display names
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
        </div>
      </div>
    );
  }
  
  return null;
}
