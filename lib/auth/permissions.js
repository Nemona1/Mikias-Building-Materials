// lib/auth/permissions.js - Optimized with caching
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
 * This is a simplified version that only checks the primary role
 */
export async function hasAdminAccess(userId) {
  try {
    if (!userId) {
      console.log('[hasAdminAccess] No userId provided');
      return false;
    }
    
    console.log('[hasAdminAccess] Checking for user:', userId);
    
    // Check cache first
    const cacheKey = getCacheKey(userId, 'admin');
    const cached = getCachedPermission(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // First try to get the user with role - optimized select
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (!user) {
      console.log('[hasAdminAccess] User not found:', userId);
      cachePermission(cacheKey, false);
      return false;
    }
    
    const roleName = user.role?.name || 'customer';
    console.log('[hasAdminAccess] User role:', roleName);
    
    // Case-insensitive check
    const roleLower = roleName.toLowerCase();
    const isAdmin = roleLower === 'super_admin' || roleLower === 'admin';
    console.log('[hasAdminAccess] Is admin:', isAdmin);
    
    cachePermission(cacheKey, isAdmin);
    return isAdmin;
    
  } catch (error) {
    console.error('[hasAdminAccess] Error:', error);
    // If database fails, return false for security
    return false;
  }
}

/**
 * Check if user has manager access or higher (manager, admin, super_admin)
 */
export async function hasManagerAccess(userId) {
  try {
    if (!userId) {
      console.log('[hasManagerAccess] No userId provided');
      return false;
    }
    
    console.log('[hasManagerAccess] Checking for user:', userId);
    
    // Check cache first
    const cacheKey = getCacheKey(userId, 'manager');
    const cached = getCachedPermission(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (!user) {
      console.log('[hasManagerAccess] User not found:', userId);
      cachePermission(cacheKey, false);
      return false;
    }
    
    const roleName = user.role?.name || 'customer';
    console.log('[hasManagerAccess] User role:', roleName);
    
    // Case-insensitive check - manager or higher
    const roleLower = roleName.toLowerCase();
    const isManager = roleLower === 'manager' || roleLower === 'admin' || roleLower === 'super_admin';
    console.log('[hasManagerAccess] Is manager or higher:', isManager);
    
    cachePermission(cacheKey, isManager);
    return isManager;
    
  } catch (error) {
    console.error('[hasManagerAccess] Error:', error);
    return false;
  }
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(userId) {
  try {
    if (!userId) return false;
    
    // Check cache first
    const cacheKey = getCacheKey(userId, 'super_admin');
    const cached = getCachedPermission(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            name: true
          }
        }
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
 * Get all roles for a user (primary + additional)
 */
export async function getUserRoles(userId) {
  try {
    if (!userId) return [];
    
    // Check cache first
    const cacheKey = getCacheKey(userId, 'all_roles');
    const cached = getCachedPermission(cacheKey);
    if (cached !== null && Array.isArray(cached)) {
      return cached;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        userRoles: {
          include: {
            role: true
          }
        }
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
 * Get user role (primary only)
 */
export async function getUserRole(userId) {
  try {
    if (!userId) return 'customer';
    
    // Check cache first
    const cacheKey = getCacheKey(userId, 'primary_role');
    const cached = getCachedPermission(cacheKey);
    if (cached !== null && typeof cached === 'string') {
      return cached;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            name: true
          }
        }
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
 * Check if user has a specific permission
 * For super_admin and admin, always return true for admin permissions
 */
export async function hasPermission(userId, requiredPermission) {
  try {
    if (!userId) return false;
    
    // Check cache first
    const cacheKey = getCacheKey(userId, `perm_${requiredPermission}`);
    const cached = getCachedPermission(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    const isAdmin = await hasAdminAccess(userId);
    if (isAdmin) {
      console.log('[hasPermission] Admin user - granting permission:', requiredPermission);
      cachePermission(cacheKey, true);
      return true;
    }
    
    // For non-admin users, check specific permissions
    // This can be expanded based on your needs
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