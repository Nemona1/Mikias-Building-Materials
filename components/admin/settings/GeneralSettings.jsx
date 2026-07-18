'use client';

import { Card } from '@/components/ui/Card';

export default function GeneralSettings({ settings, onUpdate }) {
  return (
    <div className="space-y-6">
      {/* Site Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Site Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Site Name
            </label>
            <input
              type="text"
              value={settings.siteName || ''}
              onChange={(e) => onUpdate('siteName', e.target.value)}
              className="input-field max-w-md"
              placeholder="Nemo Auth"
            />
            <p className="text-xs text-muted mt-1">Application name displayed in headers and emails</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Site Description
            </label>
            <textarea
              value={settings.siteDescription || ''}
              onChange={(e) => onUpdate('siteDescription', e.target.value)}
              className="input-field max-w-md"
              rows="2"
              placeholder="Enterprise Authentication System"
            />
            <p className="text-xs text-muted mt-1">Used for SEO and email footers</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Site URL
            </label>
            <input
              type="url"
              value={settings.siteUrl || ''}
              onChange={(e) => onUpdate('siteUrl', e.target.value)}
              className="input-field max-w-md"
              placeholder="https://yourdomain.com"
            />
            <p className="text-xs text-muted mt-1">Base URL for the application</p>
          </div>
        </div>
      </Card>

      {/* Registration Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">User Registration</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Allow Registration</p>
              <p className="text-xs text-muted">Enable new user registration</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowRegistration === true}
                onChange={(e) => onUpdate('allowRegistration', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Require Email Verification</p>
              <p className="text-xs text-muted">New users must verify their email address</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireEmailVerification === true}
                onChange={(e) => onUpdate('requireEmailVerification', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Default User Role
            </label>
            <select
              value={settings.defaultUserRole || 'VIEWER'}
              onChange={(e) => onUpdate('defaultUserRole', e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="VIEWER">Viewer</option>
              <option value="EDITOR">Editor</option>
              <option value="MANAGER">Manager</option>
            </select>
            <p className="text-xs text-muted mt-1">Role assigned to new users by default</p>
          </div>
        </div>
      </Card>

      {/* Maintenance Mode */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Maintenance Mode</h2>
            <p className="text-xs text-muted">Put the system in maintenance mode</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenanceMode === true}
              onChange={(e) => onUpdate('maintenanceMode', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        
        {settings.maintenanceMode && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              Maintenance Message
            </label>
            <textarea
              value={settings.maintenanceMessage || ''}
              onChange={(e) => onUpdate('maintenanceMessage', e.target.value)}
              className="input-field w-full"
              rows="2"
              placeholder="System is under maintenance. Please check back later."
            />
          </div>
        )}
      </Card>
    </div>
  );
}