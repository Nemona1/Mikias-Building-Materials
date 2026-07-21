// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    console.log('[ME] Request received');
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // If no token in header, check cookies
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
      console.log('[ME] Token from cookie:', !!token);
    } else {
      console.log('[ME] Token from header:', !!token);
    }
    
    // If no token at all, return 401
    if (!token) {
      console.log('[ME] No token found');
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    console.log('[ME] Verifying token...');
    const { valid, decoded } = await verifyAccessToken(token);
    
    if (!valid) {
      console.log('[ME] Token invalid');
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    console.log('[ME] Token valid for user ID:', decoded?.userId);
    
    // Fetch user from database with role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyName: true,
        isVerified: true,
        twoFactorEnabled: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        mustChangePassword: true
      }
    });
    
    if (!user) {
      console.log('[ME] User not found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('[ME] User found:', user.email);
    console.log('[ME] User role:', user.role);
    
    return NextResponse.json(user);
    
  } catch (error) {
    console.error('[ME] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}