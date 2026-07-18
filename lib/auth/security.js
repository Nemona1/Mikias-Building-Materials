// Comprehensive Security Utility Module
// Implements brute-force protection, password security, and audit logging

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';

// Default values (fallback if settings not loaded)
const DEFAULT_BRUTE_FORCE = {
  MAX_ATTEMPTS: 3,
  LOCKOUT_DURATION: 30 * 1000, // 30 seconds
};

const DEFAULT_PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL: true
};

/**
 * Get dynamic brute force settings from database
 */
async function getBruteForceSettings() {
  try {
    const maxAttempts = await getSetting('maxLoginAttempts');
    const lockoutDuration = await getSetting('lockoutDuration');
    
    return {
      MAX_ATTEMPTS: maxAttempts || DEFAULT_BRUTE_FORCE.MAX_ATTEMPTS,
      LOCKOUT_DURATION: (lockoutDuration || DEFAULT_BRUTE_FORCE.LOCKOUT_DURATION / 1000) * 1000,
    };
  } catch (error) {
    console.error('[Security] Failed to load brute force settings:', error);
    return DEFAULT_BRUTE_FORCE;
  }
}

/**
 * Get dynamic password requirements from database
 */
export async function getPasswordRequirements() {
  try {
    const minLength = await getSetting('passwordMinLength');
    const requireUppercase = await getSetting('passwordRequireUppercase');
    const requireLowercase = await getSetting('passwordRequireLowercase');
    const requireNumbers = await getSetting('passwordRequireNumbers');
    const requireSpecial = await getSetting('passwordRequireSpecial');
    
    return {
      MIN_LENGTH: minLength || DEFAULT_PASSWORD_REQUIREMENTS.MIN_LENGTH,
      REQUIRE_UPPERCASE: requireUppercase !== undefined ? requireUppercase : DEFAULT_PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE,
      REQUIRE_LOWERCASE: requireLowercase !== undefined ? requireLowercase : DEFAULT_PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE,
      REQUIRE_NUMBERS: requireNumbers !== undefined ? requireNumbers : DEFAULT_PASSWORD_REQUIREMENTS.REQUIRE_NUMBERS,
      REQUIRE_SPECIAL: requireSpecial !== undefined ? requireSpecial : DEFAULT_PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL,
    };
  } catch (error) {
    console.error('[Security] Failed to load password requirements:', error);
    return DEFAULT_PASSWORD_REQUIREMENTS;
  }
}

/**
 * Check if user is currently locked out due to failed attempts
 * Implements sliding window lockout mechanism
 */
export async function isUserLockedOut(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { lockoutUntil: true, failedLoginAttempts: true }
  });
  
  if (!user) return false;
  
  // Check if lockout period has expired
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    return true;
  }
  
  // Reset lockout if expired
  if (user.lockoutUntil && user.lockoutUntil <= new Date()) {
    await prisma.user.update({
      where: { email },
      data: { 
        lockoutUntil: null,
        failedLoginAttempts: 0 
      }
    });
    return false;
  }
  
  return false;
}

/**
 * Handle failed login attempt with progressive lockout
 * Returns: { locked: boolean, remainingAttempts: number, lockoutTime?: number }
 */
export async function handleFailedLogin(email, ipAddress, userAgent) {
  const bruteForceSettings = await getBruteForceSettings();
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) return { locked: false, remainingAttempts: bruteForceSettings.MAX_ATTEMPTS };
  
  const newAttemptCount = user.failedLoginAttempts + 1;
  const shouldLockout = newAttemptCount >= bruteForceSettings.MAX_ATTEMPTS;
  
  // Log security event
  await prisma.securityLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN_ATTEMPT',
      ipAddress,
      userAgent,
      details: { attemptCount: newAttemptCount, locked: shouldLockout },
      success: false
    }
  });
  
  if (shouldLockout) {
    const lockoutUntil = new Date(Date.now() + bruteForceSettings.LOCKOUT_DURATION);
    
    await prisma.user.update({
      where: { email },
      data: {
        failedLoginAttempts: newAttemptCount,
        lockoutUntil
      }
    });
    
    return {
      locked: true,
      lockoutTime: bruteForceSettings.LOCKOUT_DURATION / 1000,
      remainingAttempts: 0
    };
  }
  
  await prisma.user.update({
    where: { email },
    data: { failedLoginAttempts: newAttemptCount }
  });
  
  return {
    locked: false,
    remainingAttempts: bruteForceSettings.MAX_ATTEMPTS - newAttemptCount
  };
}

/**
 * Reset failed attempts on successful login
 */
export async function resetFailedAttempts(email) {
  await prisma.user.update({
    where: { email },
    data: {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastLoginAt: new Date(),
      lastActivityAt: new Date()
    }
  });
}

/**
 * Validate password strength using OWASP recommendations with dynamic settings
 */
export async function validatePasswordStrengthAsync(password) {
  const requirements = await getPasswordRequirements();
  const errors = [];
  
  if (password.length < requirements.MIN_LENGTH) {
    errors.push(`Password must be at least ${requirements.MIN_LENGTH} characters`);
  }
  
  if (requirements.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requirements.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (requirements.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (requirements.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common patterns
  const commonPatterns = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Password contains common insecure patterns');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate password strength (synchronous version for non-async contexts)
 * Note: This uses default requirements. Use validatePasswordStrengthAsync for dynamic settings.
 */
export function validatePasswordStrength(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common patterns
  const commonPatterns = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Password contains common insecure patterns');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Hash password using bcrypt with appropriate salt rounds
 */
export async function hashPassword(password) {
  const saltRounds = 12; // Industry standard for 2024
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Log security-critical actions for audit trail
 */
export async function logSecurityEvent({ userId, action, details, success, req }) {
  const ipAddress = req?.headers?.get('x-forwarded-for') || 
                    req?.headers?.get('x-real-ip') || 
                    'unknown';
  
  const userAgent = req?.headers?.get('user-agent') || 'unknown';
  
  await prisma.securityLog.create({
    data: {
      userId,
      action,
      ipAddress,
      userAgent,
      details: details || {},
      success
    }
  });
}