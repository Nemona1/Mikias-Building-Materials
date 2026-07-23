// components/layout/Navbar.jsx - Updated to use public settings API
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

const roleDisplay = {
  'super_admin': { label: 'Super Admin', icon: Crown, color: 'text-purple-600' },
  'admin': { label: 'Administrator', icon: Shield, color: 'text-red-600' },
  'manager': { label: 'Manager', icon: Users, color: 'text-blue-600' },
  'staff': { label: 'Staff', icon: FileText, color: 'text-green-600' },
  'customer': { label: 'Customer', icon: User, color: 'text-primary' }
};

const dashboardLinks = {
  'super_admin': '/dashboard/super-admin',
  'admin': '/dashboard/admin',
  'manager': '/dashboard/manager',
  'staff': '/dashboard/staff',
  'customer': '/dashboard/customer'
};

// Cache site name
let cachedSiteName = null;
let siteNameCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

export default function Navbar() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [siteName, setSiteName] = useState('Mikias Building Materials');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const dropdownRef = useRef(null);
  const fetchInProgress = useRef(false);

  useEffect(() => {
    const fetchSiteName = async () => {
      // Use cached value if available and fresh
      if (cachedSiteName && Date.now() - siteNameCacheTime < CACHE_TTL) {
        setSiteName(cachedSiteName);
        setSettingsLoaded(true);
        return;
      }

      // Prevent multiple simultaneous fetches
      if (fetchInProgress.current) return;
      fetchInProgress.current = true;

      try {
        // Use PUBLIC settings API - no authentication required
        const res = await fetch('/api/settings?category=general');
        
        if (res.ok) {
          const data = await res.json();
          const settings = data.settings || [];
          
          // Find site name in settings
          const siteNameSetting = settings.find(s => s.key === 'siteName');
          if (siteNameSetting && siteNameSetting.value) {
            cachedSiteName = siteNameSetting.value;
            siteNameCacheTime = Date.now();
            setSiteName(cachedSiteName);
          }
        } else {
          // Fallback to cached or default
          const fallbackName = cachedSiteName || 'Mikias Building Materials';
          setSiteName(fallbackName);
        }
        
        setSettingsLoaded(true);
        
      } catch (error) {
        // Silently fail, use fallback
        setSiteName(cachedSiteName || 'Mikias Building Materials');
        setSettingsLoaded(true);
      } finally {
        fetchInProgress.current = false;
      }
    };
    
    fetchSiteName();
  }, []);

  // ... rest of the component remains the same ...
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showDropdown) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showDropdown]);

  const handleLogout = useCallback(async () => {
    setShowDropdown(false);
    await logout();
    toast.success('Logged out successfully');
  }, [logout]);

  // Handle navigation without page refresh
  const handleNavigation = useCallback((path) => {
    setShowDropdown(false);
    router.push(path);
  }, [router]);

  // Memoize user info for dropdown
  const userInfo = useMemo(() => {
    if (!user) return null;
    const roleName = user.role?.name || 'customer';
    return {
      roleName,
      roleInfo: roleDisplay[roleName] || roleDisplay['customer'],
      fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User',
      email: user?.email || ''
    };
  }, [user]);

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

  if (!user || !userInfo) {
    return null;
  }

  const { roleName, roleInfo, fullName, email } = userInfo;
  const RoleIcon = roleInfo.icon;

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 transition-all duration-200">
      <div className="px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">{siteName}</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <button className="p-2 hover:bg-primary/10 rounded-full transition-colors relative">
            <Bell className="h-5 w-5 text-muted" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full"></span>
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-2 hover:bg-primary/10 rounded-lg transition-colors"
            >
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <RoleIcon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {fullName}
              </span>
              <span className="text-xs text-muted hidden sm:block">
                ({roleInfo.label})
              </span>
              <ChevronDown className={`h-4 w-4 text-muted hidden sm:block transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-card rounded-lg shadow-lg border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-medium text-foreground">{fullName}</p>
                  <p className="text-sm text-muted">{email}</p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {roleInfo.label}
                  </span>
                </div>
                
                {/* Dashboard Link */}
                <button
                  onClick={() => handleNavigation(dashboardLinks[roleName] || '/dashboard/customer')}
                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-primary/10 flex items-center gap-2 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-muted" />
                  Dashboard
                </button>
                
                {/* Profile Link */}
                <button
                  onClick={() => handleNavigation('/profile')}
                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-primary/10 flex items-center gap-2 transition-colors"
                >
                  <UserCircle className="h-4 w-4 text-muted" />
                  My Profile
                </button>
                
                {/* Admin Settings - Only for super_admin and admin */}
                {(roleName === 'super_admin' || roleName === 'admin') && (
                  <button
                    onClick={() => handleNavigation('/admin/settings')}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-primary/10 flex items-center gap-2 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted" />
                    Admin Settings
                  </button>
                )}
                
                <div className="border-t border-border my-1"></div>
                
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