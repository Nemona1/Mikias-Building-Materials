// lib/auth/permissions.js - Complete with business access
import { prisma } from '@/lib/prisma';

// Cache for permission checks
const permissionCache = new Map();
const PERMISSION_CACHE_TTL = 30000; // 30 seconds
const MAX_CACHE_SIZE = 200;

function getCacheKey(userId, permission) {
  return `perm:${userId}:${permission}`;
}

function cachePermission(key, result) {
  if (permissionCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = permissionCache.keys().next().value;
    permissionCache.delete(oldestKey);
  }
  permissionCache.set(key, {
    result,
    timestamp: Date.now()
  });
}

function getCachedPermission(key) {
  const cached = permissionCache.get(key);
  if (cached && Date.now() - cached.timestamp < PERMISSION_CACHE_TTL) {
    return cached.result;
  }
  if (cached) {
    permissionCache.delete(key);
  }
  return null;
}

/**
 * Check if user has admin access (super_admin or admin)
 */
export async function hasAdminAccess(userId) {
  try {
    if (!userId) return false;
    
    const cacheKey = getCacheKey(userId, 'admin');
    const cached = getCachedPermission(cacheKey);
    if (cached !== null) return cached;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: { select: { name: true } }
      }
    });
    
    if (!user) {
      cachePermission(cacheKey, false);
      return false;
    }
    
    const roleName = user.role?.name || 'customer';
    const roleLower = roleName.toLowerCase();
    const isAdmin = roleLower === 'super_admin' || roleLower === 'admin';
    
    cachePermission(cacheKey, isAdmin);
    return isAdmin;
    
  } catch (error) {
    console.error('[hasAdminAccess] Error:', error);
    return false;
  }
}

/**
 * Check if user has manager access or higher (manager, admin, super_admin)
 */
export async function hasManagerAccess(userId) {
  try {
    if (!userId) return false;
    
    const cacheKey = getCacheKey(userId, 'manager');
    const cached = getCachedPermission(cacheKey);
    if (cached !== null) return cached;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: { select: { name: true } }
      }
    });
    
    if (!user) {
      cachePermission(cacheKey, false);
      return false;
    }
    
    const roleName = user.role?.name || 'customer';
    const roleLower = roleName.toLowerCase();
    const isManager = ['manager', 'admin', 'super_admin'].includes(roleLower);
    
    cachePermission(cacheKey, isManager);
    return isManager;
    
  } catch (error) {
    console.error('[hasManagerAccess] Error:', error);
    return false;
  }
}

/**
 * Check if user has business management access (staff, manager, admin, super_admin)
 * This allows access to products, quotes, customers, and reports
 */
export async function hasBusinessAccess(userId) {
  try {
    if (!userId) return false;
    
    const cacheKey = getCacheKey(userId, 'business');
    const cached = getCachedPermission(cacheKey);
    if (cached !== null) return cached;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: { select: { name: true } }
      }
    });
    
    if (!user) {
      cachePermission(cacheKey, false);
      return false;
    }
    
    const roleName = user.role?.name || 'customer';
    const roleLower = roleName.toLowerCase();
    const hasAccess = ['staff', 'manager', 'admin', 'super_admin'].includes(roleLower);
    
    cachePermission(cacheKey, hasAccess);
    return hasAccess;
    
  } catch (error) {
    console.error('[hasBusinessAccess] Error:', error);
    return false;
  }
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(userId) {
  try {
    if (!userId) return false;
    
    const cacheKey = getCacheKey(userId, 'super_admin');
    const cached = getCachedPermission(cacheKey);
    if (cached !== null) return cached;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: { select: { name: true } }
      }
    });
    
    if (!user) {
      cachePermission(cacheKey, false);
      return false;
    }
    
    const roleName = user.role?.name || 'customer';
    const isSuper = roleName.toLowerCase() === 'super_admin';
    
    cachePermission(cacheKey, isSuper);
    return isSuper;
    
  } catch (error) {
    console.error('[isSuperAdmin] Error:', error);
    return false;
  }
}

/**
 * Get user role (primary only)
 */
export async function getUserRole(userId) {
  try {
    if (!userId) return 'customer';
    
    const cacheKey = getCacheKey(userId, 'primary_role');
    const cached = getCachedPermission(cacheKey);
    if (cached !== null && typeof cached === 'string') return cached;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: { select: { name: true } }
      }
    });
    
    const role = user?.role?.name?.toLowerCase() || 'customer';
    cachePermission(cacheKey, role);
    return role;
    
  } catch (error) {
    console.error('[getUserRole] Error:', error);
    return 'customer';
  }
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId) {
  try {
    if (!userId) return [];
    
    const cacheKey = getCacheKey(userId, 'all_roles');
    const cached = getCachedPermission(cacheKey);
    if (cached !== null && Array.isArray(cached)) return cached;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        userRoles: { include: { role: true } }
      }
    });
    
    if (!user) return [];
    
    const roles = [];
    if (user.role) roles.push(user.role);
    if (user.userRoles) {
      for (const ur of user.userRoles) {
        if (ur.role) roles.push(ur.role);
      }
    }
    
    cachePermission(cacheKey, roles);
    return roles;
    
  } catch (error) {
    console.error('[getUserRoles] Error:', error);
    return [];
  }
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(userId, requiredPermission) {
  try {
    if (!userId) return false;
    
    const cacheKey = getCacheKey(userId, `perm_${requiredPermission}`);
    const cached = getCachedPermission(cacheKey);
    if (cached !== null) return cached;
    
    const isAdmin = await hasAdminAccess(userId);
    if (isAdmin) {
      cachePermission(cacheKey, true);
      return true;
    }
    
    cachePermission(cacheKey, false);
    return false;
    
  } catch (error) {
    console.error('[hasPermission] Error:', error);
    return false;
  }
}

// Clear permission cache for a user
export function clearPermissionCache(userId) {
  for (const key of permissionCache.keys()) {
    if (key.startsWith(`perm:${userId}`)) {
      permissionCache.delete(key);
    }
  }
}

// Clear all caches
export function clearAllPermissionCaches() {
  permissionCache.clear();
}