// app/api/customers/[id]/route.js - Complete fix with isActive removed
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasBusinessAccess } from '@/lib/auth/permissions';

// GET - Fetch single customer (role-based)
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
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

    const hasAccess = await hasBusinessAccess(decoded.userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - Business management access required' }, { status: 403 });
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    const userRole = user?.role?.name?.toLowerCase() || 'customer';
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    const isManager = ['manager', 'admin', 'super_admin'].includes(userRole);

    // Fetch customer
    const customer = await prisma.user.findUnique({
      where: { 
        id,
        role: { name: 'customer' }
      },
      include: {
        role: true,
        quoteRequests: {
          select: {
            id: true,
            trackingId: true,
            subject: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Prepare response - REMOVED isActive
    const response = {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      companyName: customer.companyName,
      isVerified: customer.isVerified,
      createdAt: customer.createdAt,
      role: customer.role,
      recentQuotes: customer.quoteRequests || []
    };

    // Add sensitive data for admin and manager
    if (isAdmin || isManager) {
      response.twoFactorEnabled = customer.twoFactorEnabled;
      response.lastLoginAt = customer.lastLoginAt;
      response.failedLoginAttempts = customer.failedLoginAttempts;
      response.lockoutUntil = customer.lockoutUntil;
      response.updatedAt = customer.updatedAt;
    }

    // Add access level info
    response.accessLevel = {
      canEdit: isAdmin,
      canDelete: isAdmin,
      canViewSensitive: isAdmin || isManager,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Customer Detail API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer: ' + error.message },
      { status: 500 }
    );
  }
}