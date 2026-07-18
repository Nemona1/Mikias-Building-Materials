import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasAdminAccess } from '@/lib/auth/permissions';
import { getAllSettings, updateSettings, getSettings } from '@/lib/settings';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';

export async function GET(request) {
  try {
    // Verify admin access
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) token = request.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Check if user has admin access using the new helper
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const category = request.nextUrl.searchParams.get('category');
    const settings = category ? await getSettings(category) : await getAllSettings();
    
    // Log security event for settings access
    await logSecurityEvent({
      userId: decoded.userId,
      action: 'ADMIN_SETTINGS_ACCESSED',
      resourceType: 'system',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { category: category || 'all' },
      success: true
    });
    
    return NextResponse.json({ settings, success: true });
  } catch (error) {
    console.error('[Settings GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) token = request.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Check if user has admin access using the new helper
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { updates } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }
    
    const results = await updateSettings(updates, decoded.userId, ipAddress, userAgent);
    
    await logSecurityEvent({
      userId: decoded.userId,
      action: 'ADMIN_SETTINGS_UPDATED',
      resourceType: 'system',
      ipAddress,
      userAgent,
      details: { 
        updatedKeys: Object.keys(updates),
        count: Object.keys(updates).length
      },
      success: true
    });
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[Settings PUT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}