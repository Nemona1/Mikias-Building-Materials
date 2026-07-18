// lib/auth.js
import { prisma, disconnectPrisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function generateRefreshToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

export async function createSession(userId, deviceInfo = {}) {
  const sessionToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const session = await prisma.session.create({
    data: {
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt,
      device_info: deviceInfo,
      last_activity: new Date(),
      is_active: true,
    },
  });

  return session;
}

export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token');
    
    if (!token) return null;
    
    const decoded = verifyAccessToken(token.value);
    if (!decoded) return null;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getUserPermissions(user) {
  if (!user) return [];
  
  const permissions = new Set();
  
  // Get user-specific permissions
  user.userPermissions.forEach(up => {
    if (up.is_active) {
      permissions.add(`${up.permission.resource}:${up.permission.action}`);
    }
  });
  
  // Get role-based permissions
  user.userRoles.forEach(ur => {
    if (ur.is_active) {
      ur.role.rolePermissions.forEach(rp => {
        permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
      });
    }
  });
  
  return Array.from(permissions);
}

export async function hasPermission(user, resource, action) {
  if (!user) return false;

  // Super admin has all permissions
  const isSuperAdmin = user.userRoles.some(ur => 
    ur.role.name === 'super_admin' && ur.is_active
  );
  if (isSuperAdmin) return true;

  // Check user-specific permissions
  const hasUserPermission = user.userPermissions.some(
    (up) => up.permission.resource === resource && 
            up.permission.action === action &&
            up.is_active
  );
  
  if (hasUserPermission) return true;

  // Check role-based permissions
  for (const userRole of user.userRoles) {
    if (!userRole.is_active) continue;
    
    const hasRolePermission = userRole.role.rolePermissions.some(
      (rp) => rp.permission.resource === resource && 
              rp.permission.action === action
    );
    
    if (hasRolePermission) return true;
  }

  return false;
}

export async function logoutUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token');
    
    if (token) {
      const decoded = verifyAccessToken(token.value);
      if (decoded) {
        await prisma.session.updateMany({
          where: {
            user_id: decoded.userId,
            is_active: true,
          },
          data: {
            is_active: false,
          },
        });
      }
    }
    
    const response = new Response();
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

export { prisma };