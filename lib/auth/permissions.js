// Simplified RBAC + PBAC Permission System

import { prisma } from '@/lib/prisma';

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
    
    // First try to get the user with role
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
      return false;
    }
    
    const roleName = user.role?.name || 'customer';
    console.log('[hasAdminAccess] User role:', roleName);
    
    const isAdmin = roleName === 'super_admin' || roleName === 'admin';
    console.log('[hasAdminAccess] Is admin:', isAdmin);
    
    return isAdmin;
    
  } catch (error) {
    console.error('[hasAdminAccess] Error:', error);
    // If database fails, return false for security
    return false;
  }
}

/**
 * Get all roles for a user (primary + additional)
 */
export async function getUserRoles(userId) {
  try {
    if (!userId) return [];
    
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
    
    return user?.role?.name || 'customer';
    
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
    
    const isAdmin = await hasAdminAccess(userId);
    if (isAdmin) {
      console.log('[hasPermission] Admin user - granting permission:', requiredPermission);
      return true;
    }
    
    // For non-admin users, check specific permissions
    // This can be expanded based on your needs
    return false;
    
  } catch (error) {
    console.error('[hasPermission] Error:', error);
    return false;
  }
}
