// app/api/customers/route.js - Complete fix with isActive removed
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasBusinessAccess } from '@/lib/auth/permissions';

// GET - Fetch customers (role-based access)
export async function GET(request) {
  try {
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

    // Get user role to determine access level
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    const userRole = user?.role?.name?.toLowerCase() || 'customer';
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    const isManager = ['manager', 'admin', 'super_admin'].includes(userRole);
    const isStaff = ['staff', 'manager', 'admin', 'super_admin'].includes(userRole);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      role: {
        name: 'customer'
      }
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Select fields based on role - REMOVED isActive
    let selectFields = {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      companyName: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: { id: true, name: true }
      }
    };

    // Admin and Super Admin get additional fields
    if (isAdmin || isManager) {
      selectFields = {
        ...selectFields,
        twoFactorEnabled: true,
        lastLoginAt: true,
        failedLoginAttempts: true,
        lockoutUntil: true,
        _count: {
          select: {
            sessions: true,
            securityLogs: true,
            quoteRequests: true
          }
        }
      };
    }

    // Staff gets limited fields (no sensitive data)
    if (isStaff && !isManager && !isAdmin) {
      selectFields = {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyName: true,
        isVerified: true,
        createdAt: true,
        role: {
          select: { id: true, name: true }
        }
      };
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: selectFields,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.user.count({ where })
    ]);

    // Add role-based access info to response
    const response = {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      accessLevel: {
        canEdit: isAdmin || isManager,
        canDelete: isAdmin,
        canViewSensitive: isAdmin || isManager,
        canViewDetails: isAdmin || isManager || isStaff
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Customers API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers: ' + error.message },
      { status: 500 }
    );
  }
}