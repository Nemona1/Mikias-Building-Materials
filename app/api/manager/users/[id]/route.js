// app/api/manager/users/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logSecurityEvent } from '@/lib/security-log';
import bcrypt from 'bcryptjs';

// GET - Get single staff member
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('[Manager User GET] Fetching staff member with ID:', id);

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

    // Check if user has manager access
    const manager = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });
    
    const roleName = manager?.role?.name?.toLowerCase() || 'customer';
    const allowedRoles = ['manager', 'admin', 'super_admin'];
    
    if (!allowedRoles.includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 });
    }

    // Get the staff member - must have STAFF role
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
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Verify this is a staff member
    if (user.role?.name?.toLowerCase() !== 'staff') {
      return NextResponse.json({ error: 'User is not a staff member' }, { status: 403 });
    }

    // Get counts
    const sessionsCount = await prisma.session.count({
      where: { userId: id }
    });

    const securityLogsCount = await prisma.securityLog.count({
      where: { userId: id }
    });

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
      isActive: user.isActive !== false,
      _count: {
        sessions: sessionsCount,
        securityLogs: securityLogsCount
      }
    };

    await logSecurityEvent({
      userId: decoded.userId,
      action: 'STAFF_VIEWED',
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
    console.error('[Manager User GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff member: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT - Update staff member
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('[Manager User PUT] Updating staff member with ID:', id);

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

    // Check if user has manager access
    const manager = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });
    
    const roleName = manager?.role?.name?.toLowerCase() || 'customer';
    const allowedRoles = ['manager', 'admin', 'super_admin'];
    
    if (!allowedRoles.includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 });
    }

    const data = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Verify this is a staff member
    if (existingUser.role?.name?.toLowerCase() !== 'staff') {
      return NextResponse.json({ error: 'User is not a staff member' }, { status: 403 });
    }

    // Prepare update data (only allowed fields for manager)
    const updateData = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
    if (data.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = data.twoFactorEnabled;

    // Managers cannot change role or deactivate staff (only admins can)

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

    await logSecurityEvent({
      userId: decoded.userId,
      action: 'STAFF_UPDATED',
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
      message: 'Staff member updated successfully',
      user
    });

  } catch (error) {
    console.error('[Manager User PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete staff member (soft delete or remove from staff)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('[Manager User DELETE] Removing staff member with ID:', id);

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

    // Check if user has manager access
    const manager = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });
    
    const roleName = manager?.role?.name?.toLowerCase() || 'customer';
    const allowedRoles = ['manager', 'admin', 'super_admin'];
    
    if (!allowedRoles.includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Verify this is a staff member
    if (user.role?.name?.toLowerCase() !== 'staff') {
      return NextResponse.json({ error: 'User is not a staff member' }, { status: 403 });
    }

    // Instead of deleting, deactivate the user
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    // Also deactivate all user roles
    await prisma.userRole.updateMany({
      where: { userId: id },
      data: { isActive: false }
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId: id }
    });

    await logSecurityEvent({
      userId: decoded.userId,
      action: 'STAFF_REMOVED',
      resourceType: 'user',
      resourceId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        targetUserEmail: user.email,
        targetUserName: `${user.firstName} ${user.lastName}`
      },
      success: true
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member removed successfully'
    });

  } catch (error) {
    console.error('[Manager User DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove staff member: ' + error.message },
      { status: 500 }
    );
  }
}