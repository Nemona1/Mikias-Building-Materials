'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Mail, Smartphone, AlertCircle, CheckCircle, Globe, Users, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TwoFactorSettings({ settings, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showForceAdminConfirmModal, setShowForceAdminConfirmModal] = useState(false);
  const [pendingValue, setPendingValue] = useState(null);
  const [pendingForceAdminValue, setPendingForceAdminValue] = useState(null);
  
  // Local state for configuration settings (to track changes before saving)
  const [configSettings, setConfigSettings] = useState({
    twoFactorRememberDays: settings.twoFactorRememberDays ?? 30,
    twoFactorBackupCodesCount: settings.twoFactorBackupCodesCount ?? 10,
  });
  
  // Track if config has unsaved changes
  const hasConfigChanges = 
    configSettings.twoFactorRememberDays !== (settings.twoFactorRememberDays ?? 30) ||
    configSettings.twoFactorBackupCodesCount !== (settings.twoFactorBackupCodesCount ?? 10);
  
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Helper function to handle number input changes
  const handleNumberChange = (field, value) => {
    // If empty string or NaN, set to empty string (will be handled on blur)
    if (value === '' || value === undefined) {
      setConfigSettings(prev => ({ ...prev, [field]: '' }));
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      setConfigSettings(prev => ({ ...prev, [field]: '' }));
      return;
    }
    
    setConfigSettings(prev => ({ ...prev, [field]: numValue }));
  };

  // Handle blur to set default values if empty
  const handleNumberBlur = (field, defaultValue) => {
    setConfigSettings(prev => {
      const currentValue = prev[field];
      if (currentValue === '' || currentValue === undefined || currentValue === null || isNaN(currentValue)) {
        return { ...prev, [field]: defaultValue };
      }
      // Ensure value is within min/max bounds
      let newValue = currentValue;
      if (field === 'twoFactorRememberDays') {
        newValue = Math.min(90, Math.max(1, currentValue));
      } else if (field === 'twoFactorBackupCodesCount') {
        newValue = Math.min(20, Math.max(5, currentValue));
      }
      return { ...prev, [field]: newValue };
    });
  };

  // Direct API save function for toggles
  const saveToDatabase = async (key, value) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const updates = { [key]: value };
      
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ updates })
      });
      
      if (res.ok) {
        onUpdate(key, value);
        toast.success(key === 'twoFactorEnabled' 
          ? (value ? '2FA enabled for all users' : '2FA disabled for all users')
          : (value ? 'Admin 2FA enforcement enabled' : 'Admin 2FA enforcement disabled')
        );
        return true;
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save setting');
        return false;
      }
    } catch (error) {
      console.error('Save setting error:', error);
      toast.error('Failed to save setting');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Save configuration settings (Trust Device Duration & Backup Codes)
  const saveConfigSettings = async () => {
    setIsSavingConfig(true);
    try {
      // Ensure values are valid before saving
      const rememberDays = configSettings.twoFactorRememberDays === '' || isNaN(configSettings.twoFactorRememberDays) 
        ? 30 
        : Math.min(90, Math.max(1, configSettings.twoFactorRememberDays));
      
      const backupCodesCount = configSettings.twoFactorBackupCodesCount === '' || isNaN(configSettings.twoFactorBackupCodesCount) 
        ? 10 
        : Math.min(20, Math.max(5, configSettings.twoFactorBackupCodesCount));
      
      const token = localStorage.getItem('accessToken');
      const updates = {
        twoFactorRememberDays: rememberDays,
        twoFactorBackupCodesCount: backupCodesCount,
      };
      
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ updates })
      });
      
      if (res.ok) {
        // Update parent state and local config state with validated values
        onUpdate('twoFactorRememberDays', rememberDays);
        onUpdate('twoFactorBackupCodesCount', backupCodesCount);
        setConfigSettings({
          twoFactorRememberDays: rememberDays,
          twoFactorBackupCodesCount: backupCodesCount,
        });
        toast.success('2FA configuration saved successfully');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Save config error:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Reset configuration settings to original values
  const resetConfigSettings = () => {
    setConfigSettings({
      twoFactorRememberDays: settings.twoFactorRememberDays ?? 30,
      twoFactorBackupCodesCount: settings.twoFactorBackupCodesCount ?? 10,
    });
    toast('Changes reverted');
  };

  const handleSystem2FAToggle = (newValue) => {
    setPendingValue(newValue);
    setShowConfirmModal(true);
  };

  const confirmToggle = async () => {
    setShowConfirmModal(false);
    await saveToDatabase('twoFactorEnabled', pendingValue);
    setPendingValue(null);
  };

  const handleForceAdminToggle = (newValue) => {
    setPendingForceAdminValue(newValue);
    setShowForceAdminConfirmModal(true);
  };

  const confirmForceAdminToggle = async () => {
    setShowForceAdminConfirmModal(false);
    await saveToDatabase('forceAdmin2FA', pendingForceAdminValue);
    setPendingForceAdminValue(null);
  };

  // Get display values for inputs (handle empty/NaN cases)
  const getDisplayValue = (value) => {
    if (value === '' || value === undefined || value === null || isNaN(value)) {
      return '';
    }
    return value;
  };

  return (
    <div className="space-y-6">
      {/* System-Wide 2FA Toggle */}
      <Card className="p-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">System-Wide Two-Factor Authentication</h2>
            </div>
            <p className="text-sm text-muted">
              Control whether 2FA is required for all users or disabled system-wide
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${!settings.twoFactorEnabled ? 'text-success' : 'text-muted'}`}>
              Disabled
            </span>
            <button
              onClick={() => handleSystem2FAToggle(!settings.twoFactorEnabled)}
              disabled={saving}
              className={`
                relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300
                ${settings.twoFactorEnabled ? 'bg-success' : 'bg-muted'}
                ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
              `}
            >
              <span
                className={`
                  inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md
                  ${settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
            <span className={`text-sm font-medium ${settings.twoFactorEnabled ? 'text-success' : 'text-muted'}`}>
              Enabled
            </span>
          </div>
        </div>

        {settings.twoFactorEnabled ? (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="font-medium text-success">2FA is ENABLED for the entire system</p>
                <p className="text-xs text-success/80 mt-1">
                  All users with 2FA enabled will be required to verify during login. 
                  Users can enable/disable 2FA from their profile settings.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <div>
                <p className="font-medium text-yellow-600 dark:text-yellow-500">2FA is DISABLED for the entire system</p>
                <p className="text-xs text-yellow-600/80 dark:text-yellow-500/80 mt-1">
                  Two-factor authentication is currently turned off. Users will log in without 2FA verification,
                  even if they have previously enabled it on their accounts.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Force 2FA for Admin Users - Coming Soon */}
        <Card className="p-6 opacity-75">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-muted" />
                <h3 className="text-lg font-semibold text-foreground">Force 2FA for Admin Users</h3>
                <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 rounded-full ml-2">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-muted">Require all administrator accounts to enable 2FA (Coming in next release)</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">Off</span>
              <div className="relative inline-flex h-7 w-12 items-center rounded-full bg-muted opacity-50 cursor-not-allowed">
                <span className="inline-block h-5 w-5 transform rounded-full bg-white translate-x-1 shadow-md"></span>
              </div>
              <span className="text-sm text-muted">On</span>
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-2">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                🚧 This feature is currently under development. Soon you'll be able to force all admin accounts to enable two-factor authentication for enhanced security.
              </p>
            </div>
          </div>
        </Card>

      {/* 2FA Configuration Settings with Save/Cancel */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">2FA Configuration</h3>
          {hasConfigChanges && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetConfigSettings}
                disabled={isSavingConfig}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={saveConfigSettings}
                disabled={isSavingConfig}
                className="gap-1"
              >
                <Save className="h-4 w-4" />
                {isSavingConfig ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
          {!hasConfigChanges && (
            <div className="text-xs text-success flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              All changes saved
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              2FA Method
            </label>
            <select
              value={settings.twoFactorMethod || 'email'}
              onChange={(e) => onUpdate('twoFactorMethod', e.target.value)}
              className="input-field max-w-xs"
              disabled
              title="Currently only Email OTP is supported"
            >
              <option value="email">Email OTP (Active)</option>
              <option value="authenticator" disabled>Authenticator App (Coming Soon)</option>
              <option value="both" disabled>Both (Coming Soon)</option>
            </select>
            <p className="text-xs text-muted mt-1">Currently only Email-based OTP is available</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Trust Device Duration (days)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={getDisplayValue(configSettings.twoFactorRememberDays)}
              onChange={(e) => handleNumberChange('twoFactorRememberDays', e.target.value)}
              onBlur={() => handleNumberBlur('twoFactorRememberDays', 30)}
              className="input-field max-w-xs"
              placeholder="30"
            />
            <p className="text-xs text-muted mt-1">How long to remember trusted devices (users can skip 2FA on trusted devices)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Number of Backup Codes
            </label>
            <input
              type="number"
              min="5"
              max="20"
              value={getDisplayValue(configSettings.twoFactorBackupCodesCount)}
              onChange={(e) => handleNumberChange('twoFactorBackupCodesCount', e.target.value)}
              onBlur={() => handleNumberBlur('twoFactorBackupCodesCount', 10)}
              className="input-field max-w-xs"
              placeholder="10"
            />
            <p className="text-xs text-muted mt-1">Backup codes generated when users enable 2FA</p>
          </div>
        </div>
      </Card>

      {/* Available 2FA Methods */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Available 2FA Methods</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Email OTP</p>
              <p className="text-xs text-muted">Send verification code to email</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-success/20 text-success rounded-full">Active</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/5 rounded-lg border border-border opacity-60">
            <Smartphone className="h-5 w-5 text-muted" />
            <div>
              <p className="font-medium text-foreground">Authenticator App</p>
              <p className="text-xs text-muted">Google Authenticator, Authy, etc.</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-muted/20 text-muted rounded-full">Coming Soon</span>
            </div>
          </div>
        </div>
      </Card>

      {/* System-Wide 2FA Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {pendingValue ? 'Enable System-Wide 2FA?' : 'Disable System-Wide 2FA?'}
                </h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300">
                {pendingValue 
                  ? 'Are you sure you want to enable two-factor authentication for all users? Users with 2FA enabled will need to verify during login.'
                  : 'Are you sure you want to disable two-factor authentication for the entire system? Users will no longer be required to use 2FA, even if they had it enabled previously.'}
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button variant={pendingValue ? 'primary' : 'danger'} onClick={confirmToggle} disabled={saving}>
                {saving ? 'Saving...' : (pendingValue ? 'Enable 2FA' : 'Disable 2FA')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Force Admin 2FA Confirmation Modal */}
      {showForceAdminConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {pendingForceAdminValue ? 'Enable Force Admin 2FA?' : 'Disable Force Admin 2FA?'}
                </h3>
              </div>
              <button
                onClick={() => setShowForceAdminConfirmModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300">
                {pendingForceAdminValue 
                  ? 'Are you sure you want to force all admin accounts to enable Two-Factor Authentication? Admins without 2FA will be redirected to enable it before accessing admin features.'
                  : 'Are you sure you want to disable the admin 2FA requirement? Admin accounts will no longer be forced to enable 2FA.'}
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowForceAdminConfirmModal(false)}>
                Cancel
              </Button>
              <Button variant={pendingForceAdminValue ? 'primary' : 'danger'} onClick={confirmForceAdminToggle} disabled={saving}>
                {saving ? 'Saving...' : (pendingForceAdminValue ? 'Enable Force Admin 2FA' : 'Disable Force Admin 2FA')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}