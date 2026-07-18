'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Mail, Send, Save, X, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmailSettings({ settings, onUpdate }) {
  const [localSettings, setLocalSettings] = useState({
    smtpHost: settings.smtpHost || '',
    smtpPort: settings.smtpPort || 587,
    smtpUser: settings.smtpUser || '',
    smtpPass: '',
    emailFrom: settings.emailFrom || '',
  });
  
  const [originalSettings, setOriginalSettings] = useState({
    smtpHost: settings.smtpHost || '',
    smtpPort: settings.smtpPort || 587,
    smtpUser: settings.smtpUser || '',
    smtpPass: '',
    emailFrom: settings.emailFrom || '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  
  // Check if password was previously set (not empty string)
  const hasExistingPassword = settings.smtpPass && settings.smtpPass !== '';
  
  // Track if there are unsaved changes
  const hasChanges = 
    localSettings.smtpHost !== originalSettings.smtpHost ||
    localSettings.smtpPort !== originalSettings.smtpPort ||
    localSettings.smtpUser !== originalSettings.smtpUser ||
    (localSettings.smtpPass && localSettings.smtpPass !== '') ||
    localSettings.emailFrom !== originalSettings.emailFrom;
  
  // Save settings to database
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const updates = {
        smtpHost: localSettings.smtpHost,
        smtpPort: localSettings.smtpPort,
        smtpUser: localSettings.smtpUser,
        emailFrom: localSettings.emailFrom,
      };
      
      // Only include password if it was changed
      if (localSettings.smtpPass && localSettings.smtpPass !== '') {
        updates.smtpPass = localSettings.smtpPass;
      }
      
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
        onUpdate('smtpHost', localSettings.smtpHost);
        onUpdate('smtpPort', localSettings.smtpPort);
        onUpdate('smtpUser', localSettings.smtpUser);
        onUpdate('emailFrom', localSettings.emailFrom);
        
        // Update original settings
        setOriginalSettings({
          smtpHost: localSettings.smtpHost,
          smtpPort: localSettings.smtpPort,
          smtpUser: localSettings.smtpUser,
          smtpPass: '',
          emailFrom: localSettings.emailFrom,
        });
        
        // Clear password field after save
        setLocalSettings(prev => ({ ...prev, smtpPass: '' }));
        
        toast.success('Email settings saved successfully');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save email settings error:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset to original values
  const resetSettings = () => {
    setLocalSettings({
      smtpHost: originalSettings.smtpHost,
      smtpPort: originalSettings.smtpPort,
      smtpUser: originalSettings.smtpUser,
      smtpPass: '',
      emailFrom: originalSettings.emailFrom,
    });
    toast.info('Changes reverted');
  };
  
  // Test email functionality
  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }
    
    setTesting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: testEmail })
      });
      
      if (res.ok) {
        toast.success('Test email sent successfully! Check your inbox.');
        setTestEmail('');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Test email error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">SMTP Configuration</h2>
          </div>
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
              SMTP Host
            </label>
            <input
              type="text"
              value={localSettings.smtpHost}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
              className="input-field w-full"
              placeholder="smtp.gmail.com"
            />
            <p className="text-xs text-muted mt-1">Your email provider's SMTP server address</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              SMTP Port
            </label>
            <input
              type="number"
              value={localSettings.smtpPort}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))}
              className="input-field max-w-xs"
              placeholder="587"
            />
            <p className="text-xs text-muted mt-1">Common ports: 25, 465 (SSL), 587 (TLS)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              SMTP Username
            </label>
            <input
              type="email"
              value={localSettings.smtpUser}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
              className="input-field w-full"
              placeholder="your-email@gmail.com"
            />
            <p className="text-xs text-muted mt-1">Usually your full email address</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              SMTP Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={localSettings.smtpPass}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, smtpPass: e.target.value }))}
                className="input-field w-full pr-10"
                placeholder={hasExistingPassword ? '•••••••• (leave blank to keep current)' : 'Enter SMTP password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="h-4 w-4 text-muted" /> : <Eye className="h-4 w-4 text-muted" />}
              </button>
            </div>
            <p className="text-xs text-muted mt-1">
              {hasExistingPassword 
                ? 'Password is already configured. Leave blank to keep current password.' 
                : 'For Gmail, use an App Password (not your regular password)'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              From Email Address
            </label>
            <input
              type="email"
              value={localSettings.emailFrom}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, emailFrom: e.target.value }))}
              className="input-field w-full"
              placeholder="noreply@yourapp.com"
            />
            <p className="text-xs text-muted mt-1">Sender email address for all system emails</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Test Email Configuration</h2>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Send Test Email To
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="input-field flex-1"
                placeholder="admin@example.com"
              />
              <Button onClick={handleTestEmail} disabled={testing} className="gap-2">
                <Send className="h-4 w-4" />
                {testing ? 'Sending...' : 'Send Test'}
              </Button>
            </div>
            <p className="text-xs text-muted mt-1">Verify your SMTP settings by sending a test email</p>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-xs text-blue-600 dark:text-blue-400">
                <p className="font-medium">SMTP Configuration Tips:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>For Gmail: Use smtp.gmail.com, port 587, and an App Password</li>
                  <li>For Outlook: Use smtp.office365.com, port 587</li>
                  <li>For SendGrid: Use smtp.sendgrid.net, port 587</li>
                  <li>Always save your settings before testing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}