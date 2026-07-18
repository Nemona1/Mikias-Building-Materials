// app/admin/settings/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import { useAntiTamper } from '@/hooks/useAntiTamper';
import toast from 'react-hot-toast';
import { Settings } from 'lucide-react';
import SettingsTabs from '@/components/admin/settings/SettingsTabs';
import SettingsActions from '@/components/admin/settings/SettingsActions';
import GeneralSettings from '@/components/admin/settings/GeneralSettings';
import SecuritySettings from '@/components/admin/settings/SecuritySettings';
import TwoFactorSettings from '@/components/admin/settings/TwoFactorSettings';
import SessionSettings from '@/components/admin/settings/SessionSettings';
import NotificationSettings from '@/components/admin/settings/NotificationSettings';
import EmailSettings from '@/components/admin/settings/EmailSettings';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { collapsed } = useSidebar();
  useAntiTamper();
  
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    general: {},
    security: {},
    '2fa': {},
    session: {},
    notification: {},
    email: {}
  });
  const [originalSettings, setOriginalSettings] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Track if there are unsaved changes
  const hasChanges = JSON.stringify(settings[activeTab]) !== JSON.stringify(originalSettings[activeTab]);

  const checkPermission = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const user = await res.json();
        console.log('[Settings] User data:', user);
        
        const roleName = user.role?.name || 'customer';
        // Check for admin or super_admin (case insensitive)
        const hasAdminAccess = roleName.toLowerCase() === 'admin' || roleName.toLowerCase() === 'super_admin';
        
        if (!hasAdminAccess) {
          toast.error('Access denied. Admin privileges required.');
          router.push('/dashboard');
          return;
        }
        
        setIsAdmin(true);
        setIsSuperAdmin(roleName.toLowerCase() === 'super_admin');
        await fetchSettings();
      } else {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      }
    } catch (error) {
      console.error('Permission check error:', error);
      toast.error('Failed to verify permissions');
      router.push('/login');
    }
  }, [router]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/settings', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('[Settings] Raw API response:', data);
        
        // The API returns { settings: { ... } }
        const settingsData = data.settings || data;
        
        // Ensure all categories exist
        const defaultCategories = {
          general: {},
          security: {},
          '2fa': {},
          session: {},
          notification: {},
          email: {}
        };
        
        // Merge with defaults
        const finalSettings = { ...defaultCategories, ...settingsData };
        
        console.log('[Settings] Final settings object:', finalSettings);
        console.log('[Settings] 2FA settings:', finalSettings['2fa']);
        console.log('[Settings] twoFactorEnabled value:', finalSettings['2fa']?.twoFactorEnabled);
        
        setSettings(finalSettings);
        setOriginalSettings(JSON.parse(JSON.stringify(finalSettings)));
      } else if (res.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('[Settings] Fetch error:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const currentSettings = settings[activeTab];
      
      // Convert boolean values to proper format
      const processedSettings = {};
      for (const [key, value] of Object.entries(currentSettings)) {
        processedSettings[key] = value;
      }
      
      console.log('[Settings] Saving settings for tab:', activeTab);
      console.log('[Settings] Settings to save:', processedSettings);
      
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ updates: processedSettings })
      });
      
      if (res.ok) {
        toast.success('Settings saved successfully');
        // Refresh all settings to get the latest from database
        await fetchSettings();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('[Settings] Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Reset current tab settings to original values
    setSettings(prev => ({
      ...prev,
      [activeTab]: { ...originalSettings[activeTab] }
    }));
    toast.success('Changes reverted');
  };

  const handleRefresh = async () => {
    await fetchSettings();
    toast.success('Settings refreshed');
  };

  const updateSetting = (key, value) => {
    console.log(`[Settings] Updating ${activeTab}.${key} =`, value);
    setSettings(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [key]: value
      }
    }));
  };

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  const renderTabContent = () => {
    const currentSettings = settings[activeTab] || {};
    console.log(`[Settings] Rendering ${activeTab} tab with settings:`, currentSettings);
    
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings 
            settings={currentSettings} 
            onUpdate={updateSetting} 
          />
        );
      case 'security':
        return (
          <SecuritySettings 
            settings={currentSettings} 
            onUpdate={updateSetting} 
          />
        );
      case '2fa':
        return (
          <TwoFactorSettings 
            settings={currentSettings} 
            onUpdate={updateSetting} 
          />
        );
      case 'session':
        return (
          <SessionSettings 
            settings={currentSettings} 
            onUpdate={updateSetting} 
          />
        );
      case 'notification':
        return (
          <NotificationSettings 
            settings={currentSettings} 
            onUpdate={updateSetting} 
          />
        );
      case 'email':
        return (
          <EmailSettings 
            settings={currentSettings} 
            onUpdate={updateSetting} 
          />
        );
      default:
        return null;
    }
  };

  // Don't show save button for tabs that have their own save mechanisms
  const showSaveButton = activeTab !== '2fa';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
            <p className="text-muted mt-1">
              Configure application behavior and security policies
              {isSuperAdmin && ' 👑 Super Admin'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full">
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>

      {/* Settings Actions */}
      {showSaveButton && (
        <SettingsActions
          onSave={handleSaveSettings}
          onReset={handleReset}
          onRefresh={handleRefresh}
          isSaving={saving}
          hasChanges={hasChanges}
          showReset={hasChanges}
          showRefresh={true}
          saveText="Save Changes"
          savingText="Saving..."
          className="mt-8"
        />
      )}

      {/* Custom Spinner Styles */}
      <style jsx>{`
        .spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}