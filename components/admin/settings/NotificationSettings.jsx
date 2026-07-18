'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save, X, CheckCircle, AlertCircle, Bell, Shield, Mail, Key, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationSettings({ settings, onUpdate }) {
  const [localSettings, setLocalSettings] = useState({
    emailNotifications: settings.emailNotifications ?? true,
    securityAlerts: settings.securityAlerts ?? true,
    loginAlerts: settings.loginAlerts ?? true,
    passwordChangeAlerts: settings.passwordChangeAlerts ?? true,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  const hasChanges = 
    localSettings.emailNotifications !== (settings.emailNotifications ?? true) ||
    localSettings.securityAlerts !== (settings.securityAlerts ?? true) ||
    localSettings.loginAlerts !== (settings.loginAlerts ?? true) ||
    localSettings.passwordChangeAlerts !== (settings.passwordChangeAlerts ?? true);
  
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const updates = {
        emailNotifications: localSettings.emailNotifications,
        securityAlerts: localSettings.securityAlerts,
        loginAlerts: localSettings.loginAlerts,
        passwordChangeAlerts: localSettings.passwordChangeAlerts,
      };
      
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ updates })
      });
      
      if (res.ok) {
        onUpdate('emailNotifications', localSettings.emailNotifications);
        onUpdate('securityAlerts', localSettings.securityAlerts);
        onUpdate('loginAlerts', localSettings.loginAlerts);
        onUpdate('passwordChangeAlerts', localSettings.passwordChangeAlerts);
        toast.success('Notification settings saved successfully');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save notification settings error:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  const resetSettings = () => {
    setLocalSettings({
      emailNotifications: settings.emailNotifications ?? true,
      securityAlerts: settings.securityAlerts ?? true,
      loginAlerts: settings.loginAlerts ?? true,
      passwordChangeAlerts: settings.passwordChangeAlerts ?? true,
    });
    toast.info('Changes reverted');
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetSettings} disabled={isSaving} className="gap-1">
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button size="sm" onClick={saveSettings} disabled={isSaving} className="gap-1">
              <Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
        {!hasChanges && (
          <div className="text-xs text-success flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> All changes saved
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Email Notifications - Master Toggle */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <p className="font-medium text-foreground">Email Notifications</p>
            </div>
            <p className="text-xs text-muted mt-1">Master toggle for all email communications</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.emailNotifications === true}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        
        {/* Security Alerts */}
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <p className="font-medium text-foreground">Security Alerts</p>
            </div>
            <p className="text-xs text-muted mt-1">Suspicious login attempts, account lockouts, and security threats</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.securityAlerts === true}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, securityAlerts: e.target.checked }))}
              disabled={!localSettings.emailNotifications}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 rounded-full peer ${!localSettings.emailNotifications ? 'opacity-50 cursor-not-allowed bg-gray-300' : 'bg-gray-200 peer-checked:bg-primary'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
          </label>
        </div>
        
        {/* Login Alerts */}
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="flex items-center gap-2">
              <LogIn className="h-4 w-4 text-primary" />
              <p className="font-medium text-foreground">Login Alerts</p>
            </div>
            <p className="text-xs text-muted mt-1">Email when a new device or location logs into your account</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.loginAlerts === true}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, loginAlerts: e.target.checked }))}
              disabled={!localSettings.emailNotifications}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 rounded-full peer ${!localSettings.emailNotifications ? 'opacity-50 cursor-not-allowed bg-gray-300' : 'bg-gray-200 peer-checked:bg-primary'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
          </label>
        </div>
        
        {/* Password Change Alerts */}
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <p className="font-medium text-foreground">Password Change Alerts</p>
            </div>
            <p className="text-xs text-muted mt-1">Notify when your password is changed or reset</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.passwordChangeAlerts === true}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, passwordChangeAlerts: e.target.checked }))}
              disabled={!localSettings.emailNotifications}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 rounded-full peer ${!localSettings.emailNotifications ? 'opacity-50 cursor-not-allowed bg-gray-300' : 'bg-gray-200 peer-checked:bg-primary'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
          </label>
        </div>
        
        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-xs text-blue-600 dark:text-blue-400">
              <p className="font-medium">Notification Settings Notes:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Email Notifications must be enabled to receive any emails</li>
                <li>Security Alerts include: suspicious logins, failed attempts, account lockouts</li>
                <li>Login Alerts are sent for new device/geolocation logins</li>
                <li>Password Change Alerts include password changes and resets</li>
                <li>Changes take effect immediately</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}