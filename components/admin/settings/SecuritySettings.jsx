'use client';

import { Card } from '@/components/ui/Card';

export default function SecuritySettings({ settings, onUpdate }) {
  return (
    <div className="space-y-6">
      {/* Login Security */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Login Security</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Max Login Attempts
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.maxLoginAttempts || 3}
              onChange={(e) => onUpdate('maxLoginAttempts', parseInt(e.target.value))}
              className="input-field max-w-xs"
            />
            <p className="text-xs text-muted mt-1">Failed attempts before account lockout</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Lockout Duration (seconds)
            </label>
            <input
              type="number"
              min="10"
              max="3600"
              value={settings.lockoutDuration || 30}
              onChange={(e) => onUpdate('lockoutDuration', parseInt(e.target.value))}
              className="input-field max-w-xs"
            />
            <p className="text-xs text-muted mt-1">How long to lock account after max attempts</p>
          </div>
        </div>
      </Card>

      {/* Password Policy */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Password Policy</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Minimum Password Length
            </label>
            <input
              type="number"
              min="6"
              max="20"
              value={settings.passwordMinLength || 8}
              onChange={(e) => onUpdate('passwordMinLength', parseInt(e.target.value))}
              className="input-field max-w-xs"
            />
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Require Uppercase Letters</p>
              <p className="text-xs text-muted">Password must contain at least one uppercase letter</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.passwordRequireUppercase === true}
                onChange={(e) => onUpdate('passwordRequireUppercase', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Require Lowercase Letters</p>
              <p className="text-xs text-muted">Password must contain at least one lowercase letter</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.passwordRequireLowercase === true}
                onChange={(e) => onUpdate('passwordRequireLowercase', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Require Numbers</p>
              <p className="text-xs text-muted">Password must contain at least one number</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.passwordRequireNumbers === true}
                onChange={(e) => onUpdate('passwordRequireNumbers', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Require Special Characters</p>
              <p className="text-xs text-muted">Password must contain at least one special character (!@#$%^&*)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.passwordRequireSpecial === true}
                onChange={(e) => onUpdate('passwordRequireSpecial', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Rate Limiting */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Rate Limiting</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">Enable Rate Limiting</p>
              <p className="text-xs text-muted">Protect API endpoints from abuse</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.rateLimitEnabled === true}
                onChange={(e) => onUpdate('rateLimitEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {settings.rateLimitEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Rate Limit Window (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="3600"
                  value={settings.rateLimitWindow || 60}
                  onChange={(e) => onUpdate('rateLimitWindow', parseInt(e.target.value))}
                  className="input-field max-w-xs"
                />
                <p className="text-xs text-muted mt-1">Time window for rate limiting</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Max Requests per Window
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={settings.rateLimitMaxRequests || 100}
                  onChange={(e) => onUpdate('rateLimitMaxRequests', parseInt(e.target.value))}
                  className="input-field max-w-xs"
                />
                <p className="text-xs text-muted mt-1">Maximum requests allowed within the window</p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}