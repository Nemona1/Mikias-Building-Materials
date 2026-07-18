import { encrypt, decrypt } from '@/lib/encryption';

// Default settings values with .env fallbacks
const DEFAULT_SETTINGS = {
  // General Settings
  siteName: { value: 'Mikias Building Materials', type: 'string', category: 'general', description: 'Application name' },
  siteDescription: { value: 'Quality Building Materials, Hardware, Sanitary & Electrical Supplies', type: 'string', category: 'general', description: 'Site description for SEO' },
  siteUrl: { value: process.env.NEXTAUTH_URL || 'http://localhost:3000', type: 'string', category: 'general' },
  
  // Registration Settings
  allowRegistration: { value: true, type: 'boolean', category: 'general' },
  requireEmailVerification: { value: true, type: 'boolean', category: 'general' },
  defaultUserRole: { value: 'VIEWER', type: 'string', category: 'general' },
  
  // Maintenance
  maintenanceMode: { value: false, type: 'boolean', category: 'general' },
  maintenanceMessage: { value: 'System is under maintenance. Please check back later.', type: 'string', category: 'general' },
  
  // Security Settings
  maxLoginAttempts: { value: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '3'), type: 'number', category: 'security' },
  lockoutDuration: { value: parseInt(process.env.LOCKOUT_DURATION_SECONDS || '30'), type: 'number', category: 'security', description: 'Seconds' },
  passwordMinLength: { value: 8, type: 'number', category: 'security' },
  passwordRequireUppercase: { value: true, type: 'boolean', category: 'security' },
  passwordRequireLowercase: { value: true, type: 'boolean', category: 'security' },
  passwordRequireNumbers: { value: true, type: 'boolean', category: 'security' },
  passwordRequireSpecial: { value: true, type: 'boolean', category: 'security' },
  
  // Session Settings
  sessionTimeout: { value: 3600, type: 'number', category: 'session', description: 'Seconds (1 hour default)' },
  sessionMaxConcurrent: { value: 5, type: 'number', category: 'session', description: 'Maximum concurrent sessions per user' },
  allowSessionRevokeWithoutOTP: { value: false, type: 'boolean', category: 'session', description: 'Require OTP for session revocation' },
  
  // 2FA Settings
  twoFactorEnabled: { value: false, type: 'boolean', category: '2fa', description: 'Enable/disable 2FA for the entire system' },
  twoFactorMethod: { value: 'email', type: 'string', category: '2fa', description: 'email or authenticator' },
  twoFactorRememberDays: { value: 30, type: 'number', category: '2fa' },
  twoFactorBackupCodesCount: { value: 10, type: 'number', category: '2fa' },
  forceAdmin2FA: { value: false, type: 'boolean', category: '2fa', description: 'Force admin accounts to enable 2FA' },
 
  // Notification Settings
  emailNotifications: { value: true, type: 'boolean', category: 'notification' },
  securityAlerts: { value: true, type: 'boolean', category: 'notification' },
  loginAlerts: { value: true, type: 'boolean', category: 'notification' },
  passwordChangeAlerts: { value: true, type: 'boolean', category: 'notification' },
  
  // Rate Limiting
  rateLimitEnabled: { value: true, type: 'boolean', category: 'security' },
  rateLimitWindow: { value: 60, type: 'number', category: 'security', description: 'Seconds' },
  rateLimitMaxRequests: { value: 100, type: 'number', category: 'security' },
  
  // Email Settings (with .env fallbacks)
  smtpHost: { value: process.env.SMTP_HOST || '', type: 'string', category: 'email', isEncrypted: false },
  smtpPort: { value: parseInt(process.env.SMTP_PORT || '587'), type: 'number', category: 'email' },
  smtpUser: { value: process.env.SMTP_USER || '', type: 'string', category: 'email', isEncrypted: false },
  smtpPass: { value: process.env.SMTP_PASS || '', type: 'string', category: 'email', isEncrypted: true },
  emailFrom: { value: process.env.EMAIL_FROM || '', type: 'string', category: 'email' },
  
  // Backup Settings
  autoBackupEnabled: { value: false, type: 'boolean', category: 'backup' },
  backupSchedule: { value: 'daily', type: 'string', category: 'backup', description: 'daily, weekly, monthly' },
  backupRetentionDays: { value: 30, type: 'number', category: 'backup' },
  backupType: { value: 'full', type: 'string', category: 'backup', description: 'full or database' },
};

// In-memory cache for settings
let settingsCache = {};
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 60 seconds

// Helper function to safely parse JSON values
function safeParseValue(value, type) {
  if (!value) return null;
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed;
    } catch (e) {
      return value;
    }
  }
  return value;
}

// Helper function to stringify value for storage
function stringifyForStorage(value, type) {
  if (type === 'boolean' || type === 'number') {
    return JSON.stringify(value);
  }
  return JSON.stringify(value);
}

// Check if we're in Edge Runtime
function isEdgeRuntime() {
  return typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';
}

// Get Prisma instance dynamically (only on server)
async function getPrisma() {
  if (isEdgeRuntime()) {
    return null;
  }
  try {
    const { prisma } = await import('@/lib/prisma');
    return prisma;
  } catch (error) {
    console.error('[Settings] Failed to load prisma:', error.message);
    return null;
  }
}

/**
 * Initialize settings in database (run on app start or seed)
 */
export async function initializeSettings() {
  if (isEdgeRuntime()) {
    console.log('[Settings] Edge runtime - skipping initialization');
    return;
  }
  
  try {
    const prisma = await getPrisma();
    if (!prisma) {
      console.log('[Settings] Prisma not available - skipping initialization');
      return;
    }
    
    for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await prisma.systemSetting.findUnique({ where: { key } });
      if (!existing) {
        let valueToStore = stringifyForStorage(config.value, config.type);
        
        if (key === 'smtpPass' && config.value && config.value !== '') {
          valueToStore = JSON.stringify(encrypt(config.value));
        }
        
        await prisma.systemSetting.create({
          data: {
            key,
            value: valueToStore,
            type: config.type,
            category: config.category,
            description: config.description || null,
            isEncrypted: config.isEncrypted || false,
          }
        });
        console.log(`[Settings] Created setting: ${key} = ${config.value}`);
      }
    }
    console.log('[Settings] Initialization completed');
  } catch (error) {
    console.error('[Settings] Initialization error:', error);
  }
}

/**
 * Get a single setting (prioritizes database, falls back to .env)
 */
export async function getSetting(key) {
  // Check cache first (including Edge Runtime)
  if (Date.now() - cacheTimestamp < CACHE_TTL && settingsCache[key] !== undefined) {
    return settingsCache[key];
  }
  
  // If in Edge Runtime, return default immediately
  if (isEdgeRuntime()) {
    console.log(`[Settings] Edge runtime - using default for ${key}`);
    return DEFAULT_SETTINGS[key]?.value;
  }
  
  try {
    const prisma = await getPrisma();
    if (!prisma) {
      return DEFAULT_SETTINGS[key]?.value;
    }
    
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    
    if (setting) {
      let value = safeParseValue(setting.value, setting.type);
      
      if (key === 'smtpPass' && value && typeof value === 'string' && value.includes(':')) {
        value = decrypt(value);
      }
      
      if (value === '' || value === null || value === undefined) {
        const fallback = DEFAULT_SETTINGS[key]?.value;
        if (fallback !== undefined && fallback !== '') {
          console.log(`[Settings] Using fallback .env value for: ${key}`);
          return fallback;
        }
      }
      
      // Cache the value
      settingsCache[key] = value;
      cacheTimestamp = Date.now();
      
      return value;
    }
    
    console.log(`[Settings] No database record for ${key}, using .env fallback`);
    return DEFAULT_SETTINGS[key]?.value;
  } catch (error) {
    console.error('[Settings] Get setting error:', error);
    return DEFAULT_SETTINGS[key]?.value;
  }
}

/**
 * Get all settings by category (prioritizes database)
 */
export async function getSettings(category = null) {
  if (isEdgeRuntime()) {
    console.log('[Settings] Edge runtime - returning empty settings');
    return {};
  }
  
  try {
    const prisma = await getPrisma();
    if (!prisma) {
      return {};
    }
    
    const where = category ? { category } : {};
    const settings = await prisma.systemSetting.findMany({ where });
    
    const result = {};
    for (const setting of settings) {
      let value = safeParseValue(setting.value, setting.type);
      
      if (setting.key === 'smtpPass' && value && typeof value === 'string' && value.includes(':')) {
        value = decrypt(value);
      }
      
      if (value === '' || value === null || value === undefined) {
        const fallback = DEFAULT_SETTINGS[setting.key]?.value;
        if (fallback !== undefined && fallback !== '') {
          value = fallback;
        }
      }
      
      result[setting.key] = value;
    }
    return result;
  } catch (error) {
    console.error('[Settings] Get settings error:', error);
    return {};
  }
}

/**
 * Get all settings grouped (prioritizes database)
 */
export async function getAllSettings() {
  if (isEdgeRuntime()) {
    console.log('[Settings] Edge runtime - returning empty settings');
    return {};
  }
  
  try {
    const prisma = await getPrisma();
    if (!prisma) {
      return {};
    }
    
    const settings = await prisma.systemSetting.findMany();
    
    const grouped = {};
    for (const setting of settings) {
      let value = safeParseValue(setting.value, setting.type);
      
      if (setting.key === 'smtpPass' && value && typeof value === 'string' && value.includes(':')) {
        value = decrypt(value);
      }
      
      if (value === '' || value === null || value === undefined) {
        const fallback = DEFAULT_SETTINGS[setting.key]?.value;
        if (fallback !== undefined && fallback !== '') {
          value = fallback;
        }
      }
      
      if (!grouped[setting.category]) grouped[setting.category] = {};
      grouped[setting.category][setting.key] = value;
    }
    
    const categories = ['general', 'security', '2fa', 'session', 'notification', 'email', 'backup'];
    for (const category of categories) {
      if (!grouped[category]) grouped[category] = {};
    }
    
    return grouped;
  } catch (error) {
    console.error('[Settings] Get all settings error:', error);
    return {};
  }
}

/**
 * Update settings (saves to database only)
 */
export async function updateSettings(updates, userId, ipAddress, userAgent) {
  if (isEdgeRuntime()) {
    console.log('[Settings] Edge runtime - cannot update settings');
    return { error: 'Cannot update settings in Edge Runtime' };
  }
  
  const results = [];
  const changes = [];
  
  try {
    const prisma = await getPrisma();
    if (!prisma) {
      return { error: 'Database not available' };
    }
    
    for (const [key, newValue] of Object.entries(updates)) {
      let valueToStore = stringifyForStorage(newValue, typeof newValue);
      
      if (key === 'smtpPass' && newValue && newValue !== '') {
        valueToStore = JSON.stringify(encrypt(newValue));
      }
      
      const existing = await prisma.systemSetting.findUnique({ where: { key } });
      if (existing) {
        let oldValue = safeParseValue(existing.value, existing.type);
        
        if (key === 'smtpPass' && oldValue && typeof oldValue === 'string' && oldValue.includes(':')) {
          oldValue = decrypt(oldValue);
        }
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          await prisma.systemSetting.update({
            where: { key },
            data: { 
              value: valueToStore,
              updatedBy: userId,
              updatedAt: new Date()
            }
          });
          changes.push({ key, oldValue, newValue: newValue });
          results.push({ key, success: true });
        }
      } else {
        const config = DEFAULT_SETTINGS[key];
        if (config) {
          await prisma.systemSetting.create({
            data: {
              key,
              value: valueToStore,
              type: config.type,
              category: config.category,
              description: config.description || null,
              isEncrypted: config.isEncrypted || false,
              updatedBy: userId,
            }
          });
          changes.push({ key, oldValue: null, newValue: newValue });
          results.push({ key, success: true });
        }
      }
    }
    
    // Log to system audit log
    if (changes.length > 0 && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      await prisma.systemAuditLog.create({
        data: {
          adminId: userId,
          adminEmail: user?.email || 'unknown',
          action: 'SETTINGS_UPDATED',
          category: 'system',
          changes: changes,
          ipAddress,
          userAgent,
        }
      });
    }
    
    // Clear cache on update
    settingsCache = {};
    cacheTimestamp = 0;
    
    return results;
  } catch (error) {
    console.error('[Settings] Update settings error:', error);
    throw error;
  }
}

/**
 * Debug settings (server only)
 */
export async function debugSettings() {
  if (isEdgeRuntime()) {
    console.log('[Settings] Edge runtime - debug not available');
    return [];
  }
  
  try {
    const prisma = await getPrisma();
    if (!prisma) {
      return [];
    }
    
    const settings = await prisma.systemSetting.findMany();
    console.log('[Settings Debug] All settings from DB:');
    for (const setting of settings) {
      const parsed = safeParseValue(setting.value, setting.type);
      console.log(`  ${setting.key}: ${setting.value} -> ${parsed} (${setting.type})`);
    }
    return settings;
  } catch (error) {
    console.error('[Settings Debug] Error:', error);
    return [];
  }
}
