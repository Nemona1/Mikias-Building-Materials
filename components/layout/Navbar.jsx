// components/layout/Navbar.jsx - Enhanced version
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LogOut, User, Settings, Bell, ChevronDown, UserCircle, 
  Building2, LayoutDashboard, Crown, Shield, Package, FileText,
  Users, BarChart, Home, Wrench, Droplets, Zap
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

// Role display names and icons
const roleDisplay = {
  'super_admin': { label: 'Super Admin', icon: Crown, color: 'text-purple-600' },
  'admin': { label: 'Administrator', icon: Shield, color: 'text-red-600' },
  'manager': { label: 'Manager', icon: Users, color: 'text-blue-600' },
  'staff': { label: 'Staff', icon: FileText, color: 'text-green-600' },
  'customer': { label: 'Customer', icon: User, color: 'text-primary' }
};

// Dashboard links by role
const dashboardLinks = {
  'super_admin': '/dashboard/super-admin',
  'admin': '/dashboard/admin',
  'manager': '/dashboard/manager',
  'staff': '/dashboard/staff',
  'customer': '/dashboard/customer'
};

export default function Navbar() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [siteName, setSiteName] = useState('Mikias Building Materials');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        // First try to get from API if authenticated
        const token = localStorage.getItem('accessToken');
        
        if (token) {
          try {
            const res = await fetch('/api/admin/settings?category=general', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (res.ok) {
              const data = await res.json();
              if (data.settings?.siteName) {
                setSiteName(data.settings.siteName);
                setSettingsLoaded(true);
                return;
              }
            }
          } catch (apiError) {
            console.warn('[Navbar] Failed to fetch settings via API:', apiError);
          }
        }
        
        // Fallback: try to get from localStorage
        const cachedSettings = localStorage.getItem('siteSettings');
        if (cachedSettings) {
          try {
            const settings = JSON.parse(cachedSettings);
            if (settings.siteName) {
              setSiteName(settings.siteName);
              setSettingsLoaded(true);
              return;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        
        // Default fallback
        setSiteName('Mikias Building Materials');
        setSettingsLoaded(true);
        
      } catch (error) {
        console.error('[Navbar] Error fetching site name:', error);
        setSiteName('Mikias Building Materials');
        setSettingsLoaded(true);
      }
    };
    
    fetchSiteName();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showDropdown) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
    toast.success('Logged out successfully');
  };

  // Show loading state
  if (isLoading || !settingsLoaded) {
    return (
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">{siteName}</span>
          </div>
          <div className="w-32 h-8 bg-muted/20 rounded animate-pulse"></div>
        </div>
      </nav>
    );
  }

  // Don't show navbar if not authenticated
  if (!user) {
    return null;
  }

  const roleName = user.role?.name || 'customer';
  const roleInfo = roleDisplay[roleName] || roleDisplay['customer'];
  const RoleIcon = roleInfo.icon;

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 transition-all duration-200">
      <div className="px-8 py-4 flex justify-between items-center">
        {/* Logo / Site Name */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">{siteName}</span>
        </Link>
        
        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {/* Notifications Bell */}
          <button className="p-2 hover:bg-primary/10 rounded-full transition-colors relative">
            <Bell className="h-5 w-5 text-muted" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full"></span>
          </button>
          
          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-2 hover:bg-primary/10 rounded-lg transition-colors"
            >
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <RoleIcon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-muted hidden sm:block">
                ({roleInfo.label})
              </span>
              <ChevronDown className={`h-4 w-4 text-muted hidden sm:block transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-card rounded-lg shadow-lg border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-medium text-foreground">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-muted">{user?.email}</p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {roleInfo.label}
                  </span>
                </div>
                
                {/* Dashboard Link */}
                <Link
                  href={dashboardLinks[roleName] || '/dashboard/customer'}
                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-primary/10 flex items-center gap-2 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <LayoutDashboard className="h-4 w-4 text-muted" />
                  Dashboard
                </Link>
                
                {/* Profile Link */}
                <Link
                  href="/profile"
                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-primary/10 flex items-center gap-2 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <UserCircle className="h-4 w-4 text-muted" />
                  My Profile
                </Link>
                
                {/* Admin Settings - For super_admin and admin only */}
                {(roleName === 'super_admin' || roleName === 'admin') && (
                  <Link
                    href="/admin/settings"
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-primary/10 flex items-center gap-2 transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Settings className="h-4 w-4 text-muted" />
                    Admin Settings
                  </Link>
                )}
                
                {/* Divider */}
                <div className="border-t border-border my-1"></div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error/10 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}