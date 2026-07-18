// lib/security-log.js
import { prisma } from '@/lib/prisma';

/**
 * Log security-critical events (single source of truth for all system events)
 */
export async function logSecurityEvent({
  userId,
  action,
  resourceType,
  resourceId,
  ipAddress,
  userAgent,
  details = {},
  success = true
}) {
  try {
    await prisma.securityLog.create({
      data: {
        userId: userId || null,
        action,
        resourceType: resourceType || null,
        resourceId: resourceId || null,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        details,
        success
      }
    });
  } catch (error) {
    console.error('Failed to create security log:', error);
  }
}

/**
 * Get security logs with filters
 */
export async function getSecurityLogs({
  userId,
  action,
  resourceType,
  limit = 100,
  offset = 0,
  fromDate,
  toDate,
  success
}) {
  const where = {};
  
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resourceType) where.resourceType = resourceType;
  if (success !== undefined) where.success = success;
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }
  
  const [logs, total] = await Promise.all([
    prisma.securityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.securityLog.count({ where })
  ]);
  
  return { logs, total };
}

/**
 * Security Actions - Single source of truth for all system events
 */
export const SecurityActions = {
  // ============================================
  // Product Management Events
  // ============================================
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_DELETED: 'PRODUCT_DELETED',
  PRODUCT_VIEWED: 'PRODUCT_VIEWED',
  PRODUCTS_LISTED: 'PRODUCTS_LISTED',

  // ============================================
  // Quote Management Events
  // ============================================
  QUOTE_CREATED: 'QUOTE_CREATED',
  QUOTE_UPDATED: 'QUOTE_UPDATED',
  QUOTE_DELETED: 'QUOTE_DELETED',
  QUOTE_VIEWED: 'QUOTE_VIEWED',
  QUOTES_LISTED: 'QUOTES_LISTED',
  QUOTE_STATUS_CHANGED: 'QUOTE_STATUS_CHANGED',


  // ============================================
  // Customer Management Events
  // ============================================
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  CUSTOMER_DELETED: 'CUSTOMER_DELETED',
  CUSTOMERS_LISTED: 'CUSTOMERS_LISTED',

  // ============================================
  // Report Events
  // ============================================
  REPORT_GENERATED: 'REPORT_GENERATED',
  REPORT_EXPORTED: 'REPORT_EXPORTED',

  // ============================================
  // 2FA Security Events
  // ============================================
  TWO_FACTOR_SETUP_INITIATED: '2FA_SETUP_INITIATED',
  TWO_FACTOR_ENABLED: '2FA_ENABLED',
  TWO_FACTOR_DISABLED: '2FA_DISABLED',
  TWO_FACTOR_CODE_SENT: '2FA_CODE_SENT',
  TWO_FACTOR_VERIFICATION_SUCCESS: '2FA_VERIFICATION_SUCCESS',
  TWO_FACTOR_VERIFICATION_FAILED: '2FA_VERIFICATION_FAILED',
  TWO_FACTOR_BACKUP_CODE_USED: '2FA_BACKUP_CODE_USED',
  TWO_FACTOR_OTP_REQUEST: '2FA_OTP_REQUEST',
  TWO_FACTOR_RESEND_CODE: '2FA_RESEND_CODE',

  // ============================================
  // Email Events
  // ============================================
  EMAIL_VERIFICATION_RESEND: 'EMAIL_VERIFICATION_RESEND',
  EMAIL_CHANGE_REQUESTED: 'EMAIL_CHANGE_REQUESTED',
  EMAIL_VERIFICATION_FAILED: 'EMAIL_VERIFICATION_FAILED',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  EMAIL_CHANGE_OTP_SENT: 'EMAIL_CHANGE_OTP_SENT',
  EMAIL_CHANGE_OTP_VERIFIED: 'EMAIL_CHANGE_OTP_VERIFIED',
  EMAIL_CHANGE_OTP_FAILED: 'EMAIL_CHANGE_OTP_FAILED',
  EMAIL_CHANGE_OTP_RESENT: 'EMAIL_CHANGE_OTP_RESENT',
  EMAIL_CHANGED: 'EMAIL_CHANGED',

  // ============================================
  // Profile Events
  // ============================================
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  PROFILE_UPDATE_FAILED: 'PROFILE_UPDATE_FAILED',
  PROFILE_UPDATED_EMAIL_CHANGED: 'EMAIL_CHANGE_REQUESTED',

  // ============================================
  // User Management Events
  // ============================================
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_REGISTERED: 'USER_REGISTERED',

  // ============================================
  // Role Management Events
  // ============================================
  ROLE_CREATED: 'ROLE_CREATED',
  ROLE_UPDATED: 'ROLE_UPDATED',
  ROLE_DELETED: 'ROLE_DELETED',
  ROLE_ASSIGNED: 'ROLE_ASSIGNED',
  ROLE_REMOVED: 'ROLE_REMOVED',

  // ============================================
  // Permission Events
  // ============================================
  PERMISSION_GRANTED: 'PERMISSION_GRANTED',
  PERMISSION_REVOKED: 'PERMISSION_REVOKED',
  PERMISSION_REMOVED: 'PERMISSION_REMOVED',

  // ============================================
  // Role Application Events
  // ============================================
  ROLE_APPLICATION_SUBMITTED: 'ROLE_APPLICATION_SUBMITTED',
  ROLE_APPLICATION_APPROVED: 'ROLE_APPLICATION_APPROVED',
  ROLE_APPLICATION_REJECTED: 'ROLE_APPLICATION_REJECTED',
  ROLE_APPLICATION_STATUS_VIEWED: 'ROLE_APPLICATION_STATUS_VIEWED',
  REJECTION_HISTORY_VIEWED: 'REJECTION_HISTORY_VIEWED',

  // ============================================
  // Backup Events
  // ============================================
  BACKUP_STARTED: 'BACKUP_STARTED',
  BACKUP_COMPLETED: 'BACKUP_COMPLETED',
  BACKUP_ACCESSED: 'BACKUP_ACCESSED',
  BACKUP_DOWNLOADED: 'BACKUP_DOWNLOADED', 
  BACKUP_RESTORED: 'BACKUP_RESTORED',
  BACKUP_DELETED: 'BACKUP_DELETED',

  // ============================================
  // SecurityLog Access Events
  // ============================================
  SECURITY_LOG_ACCESS: 'SECURITY_LOG_ACCESS',

  // ============================================
  // Session Events
  // ============================================
  SESSIONS_VIEWED: 'SESSIONS_VIEWED',
  ALL_OTHER_SESSIONS_REVOKED: 'ALL_OTHER_SESSIONS_REVOKED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  SESSION_EXPIRED_INACTIVITY: 'SESSION_EXPIRED_INACTIVITY',

  // ============================================
  // Password Security Events
  // ============================================
  PASSWORD_CHANGE_REQUESTED: 'PASSWORD_CHANGE_REQUESTED',
  PASSWORD_CHANGE_FAILED: 'PASSWORD_CHANGE_FAILED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_CHANGE_OTP_SENT: 'PASSWORD_CHANGE_OTP_SENT',
  PASSWORD_CHANGE_OTP_VERIFIED: 'PASSWORD_CHANGE_OTP_VERIFIED',
  PASSWORD_CHANGE_OTP_FAILED: 'PASSWORD_CHANGE_OTP_FAILED',
  PASSWORD_CHANGED_SUCCESSFULLY: 'PASSWORD_CHANGED_SUCCESSFULLY',
  PASSWORD_CHANGE_FAILED_CURRENT_PASSWORD: 'PASSWORD_CHANGE_FAILED_CURRENT_PASSWORD',

  // ============================================
  // Login/Logout Events
  // ============================================
  LOGIN_ATTEMPT: 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_LOCKOUT: 'LOGIN_LOCKOUT',
  LOGOUT: 'LOGOUT',

  // ============================================
  // Account Security Events
  // ============================================
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED'
};