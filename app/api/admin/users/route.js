// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasAdminAccess, getUserRoles, hasPermission } from '@/lib/auth/permissions';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';
import bcrypt from 'bcryptjs';
import { sendUserCredentialsEmail } from '@/lib/email/sendUserCredentialsEmail';


export async function GET(request) {
  try {
    console.log('[Admin Users API] GET request received');
    
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }
    
    if (!token) {
      console.log('[Admin Users API] No token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[Admin Users API] Token found, verifying...');
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      console.log('[Admin Users API] Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    console.log('[Admin Users API] User ID:', decoded.userId);
    
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      console.log('[Admin Users API] User is not admin');
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    console.log('[Admin Users API] Admin access granted');
    
    const currentUserRoles = await getUserRoles(decoded.userId);
    const isSuperAdmin = currentUserRoles.some(r => r.name === 'super_admin');
    
    console.log('[Admin Users API] Is Super Admin:', isSuperAdmin);
    
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const page = parseInt(url.searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (!isSuperAdmin) {
      where.role = {
        name: { not: 'super_admin' }
      };
    }
    
    const total = await prisma.user.count({ where });
    
    const users = await prisma.user.findMany({
      where,
      include: {
        role: true,
        userRoles: {
          include: {
            role: true
          }
        },
        directPermissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip
    });
    
    console.log('[Admin Users API] Found users:', users.length);
    
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      companyName: user.companyName,
      isVerified: user.isVerified,
      role: user.role,
      userRoles: user.userRoles,
      directPermissions: user.directPermissions,
      twoFactorEnabled: user.twoFactorEnabled,
      isActive: user.isActive !== false,
      mustChangePassword: user.mustChangePassword || false,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    return NextResponse.json({
      users: sanitizedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('[Admin Users API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { userId, roleId, action, reason } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    console.log('[Admin Users API] PUT request:', { userId, roleId, action, reason });
    
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const hasUpdatePermission = await hasPermission(decoded.userId, 'users:update');
    if (!hasUpdatePermission) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
    
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });
    
    const adminRoles = await getUserRoles(decoded.userId);
    const isSuperAdmin = adminRoles.some(r => r.name === 'super_admin');
    
    const targetUser = await prisma.user.findUnique({
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
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const targetRoles = [];
    if (targetUser.role) targetRoles.push(targetUser.role.name);
    if (targetUser.userRoles) {
      targetUser.userRoles.forEach(ur => {
        if (ur.role) targetRoles.push(ur.role.name);
      });
    }
    const isTargetSuperAdmin = targetRoles.includes('super_admin');
    
    if (isTargetSuperAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden - Cannot modify super admin' }, { status: 403 });
    }
    
    if (roleId !== undefined) {
      if (roleId) {
        const newRole = await prisma.role.findUnique({
          where: { id: roleId }
        });
        if (newRole?.name === 'super_admin' && !isSuperAdmin) {
          return NextResponse.json({ error: 'Forbidden - Only super admin can assign super admin role' }, { status: 403 });
        }
      }
      
      const previousRole = await prisma.user.findUnique({
        where: { id: userId },
        select: { roleId: true, role: true }
      });
      
      await prisma.user.update({
        where: { id: userId },
        data: { 
          roleId: roleId || null
        }
      });
      
      await logSecurityEvent({
        userId: decoded.userId,
        action: roleId ? SecurityActions.ROLE_ASSIGNED : SecurityActions.ROLE_REMOVED,
        resourceType: 'user',
        resourceId: userId,
        ipAddress,
        userAgent,
        details: {
          targetUserId: userId,
          targetUserEmail: targetUser.email,
          oldRoleId: previousRole?.roleId,
          newRoleId: roleId,
          assignedBy: adminUser?.email,
          reason: reason || 'Admin action'
        },
        success: true
      });
      
      if (roleId === null) {
        await prisma.session.deleteMany({
          where: { userId }
        });
      }
    }
    
    if (action === 'deactivate') {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      });
      
      await prisma.session.deleteMany({
        where: { userId }
      });
      
      await logSecurityEvent({
        userId: decoded.userId,
        action: 'USER_DEACTIVATED',
        resourceType: 'user',
        resourceId: userId,
        ipAddress,
        userAgent,
        details: {
          targetUserId: userId,
          targetUserEmail: targetUser.email,
          adminEmail: adminUser?.email,
          reason: reason || 'Admin action'
        },
        success: true
      });
    }
    
    if (action === 'activate') {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true }
      });
      
      await logSecurityEvent({
        userId: decoded.userId,
        action: 'USER_ACTIVATED',
        resourceType: 'user',
        resourceId: userId,
        ipAddress,
        userAgent,
        details: {
          targetUserId: userId,
          targetUserEmail: targetUser.email,
          adminEmail: adminUser?.email,
          reason: reason || 'Admin action'
        },
        success: true
      });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[Admin Users API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

// app/api/admin/users/route.js - Fixed POST method

export async function POST(request) {
  try {
    const { 
      email, 
      firstName, 
      lastName, 
      phone, 
      companyName, 
      roleId, 
      twoFactorEnabled,
      sendWelcomeEmail = true 
    } = await request.json();
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    console.log('[Admin Users API] POST request:', { email, firstName, lastName, roleId });
    
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const hasCreatePermission = await hasPermission(decoded.userId, 'users:create');
    if (!hasCreatePermission) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
    
    const adminRoles = await getUserRoles(decoded.userId);
    const isSuperAdmin = adminRoles.some(r => r.name === 'super_admin');
    
    // Get the admin user for audit logging
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });
    
    // Check if trying to create super_admin - only super_admin can do this
    if (roleId) {
      const newRole = await prisma.role.findUnique({
        where: { id: roleId }
      });
      if (newRole?.name === 'super_admin' && !isSuperAdmin) {
        return NextResponse.json({ error: 'Forbidden - Only super admin can create super admin users' }, { status: 403 });
      }
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }
    
    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const tempPasswordExpiry = new Date();
    tempPasswordExpiry.setHours(tempPasswordExpiry.getHours() + 24);
    
    // Create user with temporary password
    // FIX: Set isVerified to true for admin-created users
    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone: phone || '',
        companyName: companyName || '',
        passwordHash: hashedPassword,
        role: roleId ? { connect: { id: roleId } } : undefined,
        isVerified: true, // Admin-created users are pre-verified
        twoFactorEnabled: twoFactorEnabled || false,
        tempPassword: tempPassword,
        tempPasswordExpiry: tempPasswordExpiry,
        tempPasswordSentAt: new Date(),
        mustChangePassword: true,
        createdByAdmin: true
      },
      include: {
        role: true
      }
    });
    
    // Send welcome email with credentials
    let emailSent = false;
    if (sendWelcomeEmail) {
      try {
        emailSent = await sendUserCredentialsEmail({
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          tempPassword: tempPassword,
          role: newUser.role?.name || 'User',
          expiryHours: 24
        });
        console.log('[Admin Users API] Welcome email sent:', emailSent);
      } catch (emailError) {
        console.error('[Admin Users API] Failed to send welcome email:', emailError);
      }
    }
    
    // Log security event for user creation with all details
    await logSecurityEvent({
      userId: decoded.userId,
      action: 'USER_CREATED_BY_ADMIN',
      resourceType: 'user',
      resourceId: newUser.id,
      ipAddress,
      userAgent,
      details: {
        targetUserEmail: newUser.email,
        targetUserFirstName: newUser.firstName,
        targetUserLastName: newUser.lastName,
        targetUserRole: newUser.role?.name || 'No role assigned',
        targetUserRoleId: roleId || null,
        createdBy: adminUser?.email || decoded.userId,
        createdByRole: adminUser?.role?.name || 'Unknown',
        emailSent: emailSent,
        tempPasswordExpiry: tempPasswordExpiry.toISOString(),
        twoFactorEnabled: twoFactorEnabled || false,
        createdByAdmin: true,
        isVerified: true // Log that user was pre-verified
      },
      success: true
    });
    
    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'User created successfully. Welcome email sent with credentials.'
        : 'User created successfully. Could not send welcome email. Please resend credentials.',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        tempPassword: tempPassword,
        tempPasswordExpiry: tempPasswordExpiry,
        mustChangePassword: true,
        isVerified: true
      }
    });
    
  } catch (error) {
    console.error('[Admin Users API] Error:', error);
    
    // Log the error for security
    try {
      await logSecurityEvent({
        userId: decoded?.userId || null,
        action: 'USER_CREATION_FAILED',
        resourceType: 'user',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: {
          email: email || 'unknown',
          error: error.message
        },
        success: false
      });
    } catch (logError) {
      console.error('Failed to log user creation error:', logError);
    }
    
    return NextResponse.json(
      { error: 'Failed to create user: ' + error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate temporary password
function generateTemporaryPassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    console.log('[Admin Users API] DELETE request:', { userId });
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const hasDeletePermission = await hasPermission(decoded.userId, 'users:delete');
    if (!hasDeletePermission) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
    
    const adminRoles = await getUserRoles(decoded.userId);
    const isSuperAdmin = adminRoles.some(r => r.name === 'super_admin');
    
    const targetUser = await prisma.user.findUnique({
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
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (targetUser.id === decoded.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 });
    }
    
    const targetRoles = [];
    if (targetUser.role) targetRoles.push(targetUser.role.name);
    if (targetUser.userRoles) {
      targetUser.userRoles.forEach(ur => {
        if (ur.role) targetRoles.push(ur.role.name);
      });
    }
    const isTargetSuperAdmin = targetRoles.includes('super_admin');
    
    if (isTargetSuperAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden - Cannot delete super admin' }, { status: 403 });
    }
    
    await prisma.user.delete({
      where: { id: userId }
    });
    
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.USER_DELETED,
      resourceType: 'user',
      resourceId: userId,
      ipAddress,
      userAgent,
      details: {
        targetUserEmail: targetUser.email,
        targetUserRole: targetUser.role?.name,
        deletedBy: decoded.userId
      },
      success: true
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[Admin Users API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}