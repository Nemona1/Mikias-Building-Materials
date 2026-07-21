// app/api/admin/roles/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasPermission, hasAdminAccess, hasManagerAccess } from '@/lib/auth/permissions';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';

export async function GET(request) {
  try {
    console.log('[ROLES API] ========== START ==========');
    
    // Get token from Authorization header or cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }
    
    console.log('[ROLES API] Token exists:', !!token);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { valid, decoded } = await verifyAccessToken(token);
    console.log('[ROLES API] Token valid:', valid);
    
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Check if user has admin access OR manager access
    const isAdmin = await hasAdminAccess(decoded.userId);
    const isManager = await hasManagerAccess(decoded.userId);
    
    console.log('[ROLES API] Is admin:', isAdmin);
    console.log('[ROLES API] Is manager:', isManager);
    
    // Allow if admin OR manager (for reading only)
    if (!isAdmin && !isManager) {
      return NextResponse.json({ error: 'Forbidden - Access required' }, { status: 403 });
    }
    
    // For admins: return ALL roles
    // For managers: only return STAFF role
    let roles = [];
    try {
      if (isAdmin) {
        // Admins see all roles
        roles = await prisma.role.findMany({
          include: {
            permissions: {
              include: {
                permission: true
              }
            },
            _count: {
              select: { users: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        });
        console.log('[ROLES API] Admin - Found all roles:', roles.length);
      } else if (isManager) {
        // Managers only see STAFF role
        roles = await prisma.role.findMany({
          where: { name: 'staff' },
          include: {
            permissions: {
              include: {
                permission: true
              }
            },
            _count: {
              select: { users: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        });
        console.log('[ROLES API] Manager - Found STAFF role:', roles.length);
      } else {
        roles = [];
      }
      
      console.log('[ROLES API] Roles:', roles.map(r => ({ id: r.id, name: r.name })));
    } catch (dbError) {
      console.error('[ROLES API] Database error fetching roles:', dbError);
      roles = [];
    }
    
    // For managers, only return permissions needed for staff
    let permissions = [];
    try {
      if (isManager) {
        // Managers only need basic permissions for staff
        permissions = await prisma.permission.findMany({
          where: {
            OR: [
              { category: 'product' },
              { category: 'quote' },
              { name: 'dashboard:view' }
            ]
          },
          orderBy: { name: 'asc' }
        });
      } else {
        // Admins get all permissions
        try {
          permissions = await prisma.permission.findMany({
            orderBy: [
              { category: 'asc' },
              { name: 'asc' }
            ]
          });
        } catch (categoryError) {
          console.log('[ROLES API] Category field not found, ordering by name');
          permissions = await prisma.permission.findMany({
            orderBy: { name: 'asc' }
          });
        }
      }
      console.log('[ROLES API] Found permissions:', permissions.length);
    } catch (permError) {
      console.error('[ROLES API] Permissions error:', permError);
      permissions = [];
    }
    
    console.log('[ROLES API] ========== END ==========');
    
    return NextResponse.json({ roles, permissions });
    
  } catch (error) {
    console.error('[ROLES API] Fetch error:', error);
    // Return empty arrays instead of 500 error to keep the page working
    return NextResponse.json({ 
      roles: [], 
      permissions: [],
      error: 'Failed to fetch roles' 
    });
  }
}

export async function POST(request) {
  try {
    const { name, description, permissionIds } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Role name is required' },
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
    
    // Check specific permission for creating roles
    const hasCreateAccess = await hasPermission(decoded.userId, 'roles:create');
    if (!hasCreateAccess) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
    
    // Check if role already exists (case insensitive)
    const existingRole = await prisma.role.findFirst({
      where: { 
        name: { 
          equals: name.toUpperCase(),
          mode: 'insensitive'
        }
      }
    });
    
    if (existingRole) {
      return NextResponse.json(
        { error: 'A role with this name already exists' },
        { status: 409 }
      );
    }
    
    const role = await prisma.role.create({
      data: {
        name: name.toUpperCase(),
        description: description || '',
        isSystem: false,
        permissions: {
          create: permissionIds?.map(permissionId => ({
            permissionId,
            grantedBy: decoded.userId
          })) || []
        }
      }
    });
    
    // Log security event for role creation
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.ROLE_CREATED,
      resourceType: 'role',
      resourceId: role.id,
      ipAddress,
      userAgent,
      details: { roleName: name, description, permissionCount: permissionIds?.length || 0 },
      success: true
    });
    
    return NextResponse.json({
      success: true,
      message: 'Role created successfully',
      data: role
    }, { status: 201 });
    
  } catch (error) {
    console.error('[ROLES API] Create error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, name, description, permissionIds } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
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
    
    // Check specific permission for updating roles
    const hasUpdateAccess = await hasPermission(decoded.userId, 'roles:update');
    if (!hasUpdateAccess) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
    
    const existingRole = await prisma.role.findUnique({ where: { id } });
    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }
    
    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: 'Cannot modify system role' },
        { status: 403 }
      );
    }
    
    const role = await prisma.role.update({
      where: { id },
      data: {
        name: name?.toUpperCase(),
        description: description || '',
        permissions: {
          deleteMany: {},
          create: permissionIds?.map(permissionId => ({
            permissionId,
            grantedBy: decoded.userId
          })) || []
        }
      }
    });
    
    // Log security event for role update
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.ROLE_UPDATED,
      resourceType: 'role',
      resourceId: role.id,
      ipAddress,
      userAgent,
      details: { roleId: id, roleName: name, permissionCount: permissionIds?.length || 0 },
      success: true
    });
    
    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      data: role
    });
    
  } catch (error) {
    console.error('[ROLES API] Update error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
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
    
    // Check specific permission for deleting roles
    const hasDeleteAccess = await hasPermission(decoded.userId, 'roles:delete');
    if (!hasDeleteAccess) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
    
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }
    
    if (role.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system role' },
        { status: 403 }
      );
    }
    
    // Check if role has users assigned (primary role)
    const userCount = await prisma.user.count({ where: { roleId: id } });
    // Check if role has users assigned via userRoles
    const userRoleCount = await prisma.userRole.count({ where: { roleId: id } });
    const totalUsers = userCount + userRoleCount;
    
    if (totalUsers > 0) {
      return NextResponse.json(
        { error: `Cannot delete role. It is currently assigned to ${totalUsers} user(s).` },
        { status: 409 }
      );
    }
    
    await prisma.role.delete({ where: { id } });
    
    // Log security event for role deletion
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.ROLE_DELETED,
      resourceType: 'role',
      resourceId: id,
      ipAddress,
      userAgent,
      details: { roleId: id, roleName: role.name, hadUsers: totalUsers > 0 },
      success: true
    });
    
    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });
    
  } catch (error) {
    console.error('[ROLES API] Delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}