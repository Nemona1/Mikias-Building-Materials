// app/api/manager/roles/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request) {
  try {
    console.log('[Manager Roles API] ========== START ==========');
    
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
    
    // Check if user has manager access or higher
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });
    
    const roleName = user?.role?.name?.toLowerCase() || 'customer';
    const allowedRoles = ['manager', 'admin', 'super_admin'];
    
    if (!allowedRoles.includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 });
    }
    
    // Fetch ALL roles (managers can see all roles for selection)
    // Or specifically look for 'staff' (lowercase)
    const roles = await prisma.role.findMany({
      where: { 
        // Look for staff role specifically (case insensitive)
        name: {
          equals: 'staff',
          mode: 'insensitive' // This makes it case insensitive
        }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });
    
    console.log('[Manager Roles API] Found roles:', roles.length);
    console.log('[Manager Roles API] Roles found:', roles.map(r => ({ name: r.name, id: r.id })));
    
    return NextResponse.json({ 
      roles, 
      permissions: [],
      success: true 
    });
    
  } catch (error) {
    console.error('[Manager Roles API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles: ' + error.message },
      { status: 500 }
    );
  }
}