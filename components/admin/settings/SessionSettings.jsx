'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SessionSettings({ settings, onUpdate }) {
  // Local state for tracking changes
  const [localSettings, setLocalSettings] = useState({
    sessionTimeout: settings.sessionTimeout ?? 3600,
    sessionMaxConcurrent: settings.sessionMaxConcurrent ?? 5,
    allowSessionRevokeWithoutOTP: settings.allowSessionRevokeWithoutOTP ?? false,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Track if there are unsaved changes
  const hasChanges = 
    localSettings.sessionTimeout !== (settings.sessionTimeout ?? 3600) ||
    localSettings.sessionMaxConcurrent !== (settings.sessionMaxConcurrent ?? 5) ||
    localSettings.allowSessionRevokeWithoutOTP !== (settings.allowSessionRevokeWithoutOTP ?? false);
  
  // Helper function for number input (handles empty/NaN)
  const handleNumberChange = (field, value) => {
    if (value === '' || value === undefined) {
      setLocalSettings(prev => ({ ...prev, [field]: '' }));
      return;
    }
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      setLocalSettings(prev => ({ ...prev, [field]: '' }));
      return;
    }
    setLocalSettings(prev => ({ ...prev, [field]: numValue }));
  };
  
  // Handle blur to set default values if empty
  const handleNumberBlur = (field, defaultValue) => {
    setLocalSettings(prev => {
      const currentValue = prev[field];
      if (currentValue === '' || currentValue === undefined || currentValue === null || isNaN(currentValue)) {
        return { ...prev, [field]: defaultValue };
      }
      // Ensure value is within bounds
      let newValue = currentValue;
      if (field === 'sessionTimeout') {
        newValue = Math.min(86400, Math.max(60, currentValue));
      } else if (field === 'sessionMaxConcurrent') {
        newValue = Math.min(20, Math.max(1, currentValue));
      }
      return { ...prev, [field]: newValue };
    });
  };
  
  // Save settings to database
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Validate values
      const sessionTimeout = localSettings.sessionTimeout === '' || isNaN(localSettings.sessionTimeout) 
        ? 3600 
        : Math.min(86400, Math.max(60, localSettings.sessionTimeout));
      
      const sessionMaxConcurrent = localSettings.sessionMaxConcurrent === '' || isNaN(localSettings.sessionMaxConcurrent) 
        ? 5 
        : Math.min(20, Math.max(1, localSettings.sessionMaxConcurrent));
      
      const updates = {
        sessionTimeout,
        sessionMaxConcurrent,
        allowSessionRevokeWithoutOTP: localSettings.allowSessionRevokeWithoutOTP,
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
        // Update parent state
        onUpdate('sessionTimeout', sessionTimeout);
        onUpdate('sessionMaxConcurrent', sessionMaxConcurrent);
        onUpdate('allowSessionRevokeWithoutOTP', localSettings.allowSessionRevokeWithoutOTP);
        
        // Update local state with validated values
        setLocalSettings({
          sessionTimeout,
          sessionMaxConcurrent,
          allowSessionRevokeWithoutOTP: localSettings.allowSessionRevokeWithoutOTP,
        });
        
        toast.success('Session settings saved successfully');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save session settings error:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset to original values
  const resetSettings = () => {
    setLocalSettings({
      sessionTimeout: settings.sessionTimeout ?? 3600,
      sessionMaxConcurrent: settings.sessionMaxConcurrent ?? 5,
      allowSessionRevokeWithoutOTP: settings.allowSessionRevokeWithoutOTP ?? false,
    });
    toast.info('Changes reverted');
  };
  
  // Get display value for inputs
  const getDisplayValue = (value) => {
    if (value === '' || value === undefined || value === null || isNaN(value)) {
      return '';
    }
    return value;
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Session Configuration</h2>
        {hasChanges && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetSettings}
              disabled={isSaving}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={saveSettings}
              disabled={isSaving}
              className="gap-1"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
        {!hasChanges && (
          <div className="text-xs text-success flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            All changes saved
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Session Timeout (seconds)
          </label>
          <input
            type="number"
            min="60"
            max="86400"
            value={getDisplayValue(localSettings.sessionTimeout)}
            onChange={(e) => handleNumberChange('sessionTimeout', e.target.value)}
            onBlur={() => handleNumberBlur('sessionTimeout', 3600)}
            className="input-field max-w-xs"
            placeholder="3600"
          />
          <p className="text-xs text-muted mt-1">
            User session expires after inactivity. Current: {(localSettings.sessionTimeout || 3600) / 60} minutes
          </p>
          <div className="flex gap-4 mt-1">
            <span className="text-xs text-muted">1 min = 60 seconds</span>
            <span className="text-xs text-muted">1 hour = 3600 seconds</span>
            <span className="text-xs text-muted">24 hours = 86400 seconds</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Max Concurrent Sessions
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={getDisplayValue(localSettings.sessionMaxConcurrent)}
            onChange={(e) => handleNumberChange('sessionMaxConcurrent', e.target.value)}
            onBlur={() => handleNumberBlur('sessionMaxConcurrent', 5)}
            className="input-field max-w-xs"
            placeholder="5"
          />
          <p className="text-xs text-muted mt-1">
            Maximum number of simultaneous sessions per user. When exceeded, the oldest session is automatically revoked.
          </p>
        </div>
        
        <div className="flex items-center justify-between py-2 border-t border-border pt-4">
          <div>
            <p className="font-medium text-foreground">Require OTP for Session Revocation</p>
            <p className="text-xs text-muted">Users must verify via email before revoking sessions (security best practice)</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.allowSessionRevokeWithoutOTP === false}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                allowSessionRevokeWithoutOTP: !e.target.checked 
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        
        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-xs text-blue-600 dark:text-blue-400">
              <p className="font-medium">Session Management Notes:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Session timeout applies to all users regardless of role</li>
                <li>Max concurrent sessions helps prevent account sharing</li>
                <li>OTP requirement for session revocation adds an extra security layer</li>
                <li>Changes take effect immediately for new sessions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}