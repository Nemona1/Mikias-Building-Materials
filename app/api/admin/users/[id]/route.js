// app/api/admin/users/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasAdminAccess } from '@/lib/auth/permissions';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';

// GET - Get single user
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('[User GET] Fetching user with ID:', id);

    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }

    if (!token) {
      console.log('[User GET] No token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      console.log('[User GET] Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      console.log('[User GET] User is not admin:', decoded.userId);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    console.log('[User GET] Fetching user from database...');
    
    // Get user with role and userRoles
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      console.log('[User GET] User not found:', id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get counts separately
    const sessionsCount = await prisma.session.count({
      where: { userId: id }
    });

    const securityLogsCount = await prisma.securityLog.count({
      where: { userId: id }
    });

    console.log('[User GET] User found:', user.email);

    // Build response data
    const responseData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      companyName: user.companyName,
      isVerified: user.isVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      role: user.role,
      userRoles: user.userRoles || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      failedLoginAttempts: user.failedLoginAttempts,
      lockoutUntil: user.lockoutUntil,
      // Calculate isActive based on whether user has active roles
      isActive: user.userRoles.some(ur => ur.isActive === true) || user.role !== null,
      _count: {
        sessions: sessionsCount,
        securityLogs: securityLogsCount
      }
    };

    // Log access
    await logSecurityEvent({
      userId: decoded.userId,
      action: 'USER_VIEWED',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        targetUserEmail: user.email
      },
      success: true
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[User GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('[User PUT] Updating user with ID:', id);

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

    const data = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { 
        role: true,
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent modifying super_admin unless you're super_admin
    if (existingUser.role?.name === 'super_admin') {
      const currentUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true }
      });
      if (currentUser?.role?.name !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden - Cannot modify super admin' }, { status: 403 });
      }
    }

    // Prepare update data (only fields that exist in User model)
    const updateData = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
    if (data.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = data.twoFactorEnabled;
    if (data.roleId !== undefined) updateData.roleId = data.roleId;

    // For isActive, we need to update the UserRole entries
    if (data.isActive !== undefined) {
      // If setting isActive to false, deactivate all UserRole entries
      // If setting to true, activate all UserRole entries
      await prisma.userRole.updateMany({
        where: { userId: id },
        data: { isActive: data.isActive }
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
        userRoles: {
          include: { role: true }
        }
      }
    });

    // Determine if user is active based on UserRole entries
    const hasActiveRole = user.userRoles.some(ur => ur.isActive === true);
    const isActiveFinal = hasActiveRole || (user.role !== null);

    await logSecurityEvent({
      userId: decoded.userId,
      action: 'USER_UPDATED',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        targetUserEmail: user.email,
        updatedFields: Object.keys(updateData)
      },
      success: true
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        ...user,
        isActive: isActiveFinal
      }
    });

  } catch (error) {
    console.error('[User PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update user: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('[User DELETE] Deleting user with ID:', id);

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

    // Prevent deleting yourself
    if (id === decoded.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting super_admin unless you're super_admin
    if (user.role?.name === 'super_admin') {
      const currentUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true }
      });
      if (currentUser?.role?.name !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden - Cannot delete super admin' }, { status: 403 });
      }
    }

    await prisma.user.delete({
      where: { id }
    });

    await logSecurityEvent({
      userId: decoded.userId,
      action: 'USER_DELETED',
      resourceType: 'user',
      resourceId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        targetUserEmail: user.email
      },
      success: true
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('[User DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user: ' + error.message },
      { status: 500 }
    );
  }
}