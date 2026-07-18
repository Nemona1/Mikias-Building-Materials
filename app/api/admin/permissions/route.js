import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasPermission, hasAdminAccess } from '@/lib/auth/permissions';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';

export async function GET(request) {
  try {
    console.log('[PERMISSIONS API] ========== START ==========');
    
    // Get token from Authorization header or cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }
    
    console.log('[PERMISSIONS API] Token exists:', !!token);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { valid, decoded } = await verifyAccessToken(token);
    console.log('[PERMISSIONS API] Token valid:', valid);
    
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Check if user has admin access
    const isAdmin = await hasAdminAccess(decoded.userId);
    console.log('[PERMISSIONS API] Is admin:', isAdmin);
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    // Check specific permission for managing permissions
    const hasAccess = await hasPermission(decoded.userId, 'permissions:direct');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
    
    // Fetch permissions - handle both with and without category
    let permissions;
    try {
      permissions = await prisma.permission.findMany({
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });
    } catch (categoryError) {
      // If category doesn't exist, order by name only
      console.log('[PERMISSIONS API] Category field not found, ordering by name');
      permissions = await prisma.permission.findMany({
        orderBy: { name: 'asc' }
      });
    }
    
    console.log('[PERMISSIONS API] Found permissions:', permissions.length);
    console.log('[PERMISSIONS API] ========== END ==========');
    
    return NextResponse.json(permissions);
    
  } catch (error) {
    console.error('[PERMISSIONS API] Fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId, permissionId, isGranted = true, expiresAt } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    if (!userId || !permissionId) {
      return NextResponse.json(
        { error: 'User ID and Permission ID are required' },
        { status: 400 }
      );
    }
    
    // Get token from Authorization header or cookie
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
    
    // Check if user has admin access
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    // Check specific permission for managing permissions
    const hasAccess = await hasPermission(decoded.userId, 'permissions:direct');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
    
    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        email: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      select: { name: true, description: true }
    });
    
    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }
    
    // Check if user already has this permission (direct)
    const existingPermission = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId
        }
      }
    });
    
    // If permission exists and isGranted is the same, return early
    if (existingPermission && existingPermission.isGranted === isGranted) {
      return NextResponse.json({
        success: true,
        message: `Permission already ${isGranted ? 'granted' : 'revoked'} for this user`,
        data: existingPermission
      });
    }
    
    const userPermission = await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId
        }
      },
      update: {
        isGranted,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedBy: decoded.userId,
        grantedAt: new Date()
      },
      create: {
        userId,
        permissionId,
        isGranted,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedBy: decoded.userId
      }
    });
    
    // Log security event for permission change
    await logSecurityEvent({
      userId: decoded.userId,
      action: isGranted ? SecurityActions.PERMISSION_GRANTED : SecurityActions.PERMISSION_REVOKED,
      resourceType: 'permission',
      resourceId: permissionId,
      ipAddress,
      userAgent,
      details: {
        targetUserId: userId,
        targetUserEmail: targetUser.email,
        targetUserRole: targetUser.role?.name || 'No role',
        permissionId,
        permissionName: permission.name,
        isGranted,
        expiresAt: expiresAt || 'Never'
      },
      success: true
    });
    
    return NextResponse.json({
      success: true,
      message: `Permission ${isGranted ? 'granted' : 'revoked'} successfully for ${targetUser.email}`,
      data: userPermission
    });
    
  } catch (error) {
    console.error('[PERMISSIONS API] Grant/Revoke error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const permissionId = searchParams.get('permissionId');
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    if (!userId || !permissionId) {
      return NextResponse.json(
        { error: 'User ID and Permission ID are required' },
        { status: 400 }
      );
    }
    
    // Get token from Authorization header or cookie
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
    
    // Check if user has admin access
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    // Check specific permission for managing permissions
    const hasAccess = await hasPermission(decoded.userId, 'permissions:direct');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
    
    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the direct permission exists
    const existingPermission = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId
        }
      }
    });
    
    if (!existingPermission) {
      return NextResponse.json(
        { error: 'Direct permission not found for this user' },
        { status: 404 }
      );
    }
    
    await prisma.userPermission.delete({
      where: {
        userId_permissionId: {
          userId,
          permissionId
        }
      }
    });
    
    // Log security event for permission removal
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.PERMISSION_REMOVED,
      resourceType: 'permission',
      resourceId: permissionId,
      ipAddress,
      userAgent,
      details: {
        targetUserId: userId,
        targetUserEmail: targetUser.email,
        permissionId,
        removedBy: decoded.userId
      },
      success: true
    });
    
    return NextResponse.json({
      success: true,
      message: `Permission removed successfully for ${targetUser.email}`
    });
    
  } catch (error) {
    console.error('[PERMISSIONS API] Delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}