// app/profile/page.jsx - Updated with refresh button beside header
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAntiTamper } from '@/hooks/useAntiTamper';
import { 
  User, 
  Lock,
  Fingerprint,
  Smartphone,
  Loader2,
  RefreshCw
} from 'lucide-react';
import ProfileInfo from '@/components/profile/ProfileInfo';
import PasswordSettings from '@/components/profile/PasswordSettings';
import TwoFactorAuth from '@/components/profile/TwoFactorAuth';
import ActiveSessions from '@/components/profile/ActiveSessions';
import toast from 'react-hot-toast';

export default function ProfilePage({ refreshKey = 0 }) {
  const router = useRouter();
  useAntiTamper();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.log('[Profile] No token found');
        router.push('/login');
        return;
      }

      const res = await fetch('/api/auth/me', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[Profile] User data fetched:', data);
        setUser(data);
        // Also store in localStorage for other components
        localStorage.setItem('user', JSON.stringify(data));
      } else if (res.status === 401) {
        console.log('[Profile] Token expired, redirecting to login');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('user');
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        console.log('[Profile] Failed to fetch user:', res.status);
        toast.error('Failed to load profile data');
      }
    } catch (error) {
      console.error('[Profile] Error:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  // Initial load and refresh on key change
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData, refreshKey]);

  const handleUserUpdate = useCallback(() => {
    console.log('[Profile] Refreshing user data after update');
    fetchUserData();
  }, [fetchUserData]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUserData();
      toast.success('Profile refreshed');
    } catch (error) {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }, [fetchUserData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-muted">Please login to view your profile</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'two-factor', label: 'Two-Factor Authentication', icon: Fingerprint },
    { id: 'sessions', label: 'Active Sessions', icon: Smartphone },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button Beside Content */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          </div>
          <p className="text-muted">Manage your account information and security settings</p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted">Logged in as:</span>
            <span className="text-sm font-medium text-foreground">{user.email}</span>
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              {user.role?.name || 'User'}
            </span>
          </div>
        </div>
        
        {/* Refresh Button - Beside the header content */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-primary border border-border rounded-lg hover:border-primary/30 transition-all disabled:opacity-50 hover:bg-primary/5 flex-shrink-0 mt-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap
                  ${isActive 
                    ? 'text-primary border-b-2 border-primary bg-primary/5' 
                    : 'text-muted hover:text-foreground hover:bg-muted/5'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'profile' && (
          <ProfileInfo user={user} onUpdate={handleUserUpdate} loading={loading} />
        )}
        
        {activeTab === 'password' && (
          <PasswordSettings user={user} />
        )}
        
        {activeTab === 'two-factor' && (
          <TwoFactorAuth user={user} onUpdate={handleUserUpdate} />
        )}
        
        {activeTab === 'sessions' && (
          <ActiveSessions />
        )}
      </div>
    </div>
  );
}