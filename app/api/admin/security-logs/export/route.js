import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasPermission, hasAdminAccess } from '@/lib/auth/permissions';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';

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
    
    // Check if user has admin access
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    // Check specific permission for viewing security logs
    const hasAuditAccess = await hasPermission(decoded.userId, 'audit:read');
    if (!hasAuditAccess) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.AUDIT_EXPORT,
      resourceType: 'security',
      ipAddress,
      userAgent,
      details: { format, filters: { action, userId, startDate, endDate, search } },
      success: true
    });
    
    let where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      where.createdAt = { gte: start };
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: end };
    }
    
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const logs = await prisma.securityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const headers = ['ID', 'User Email', 'User Name', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP Address', 'User Agent', 'Success', 'Timestamp'];
    
    const rows = logs.map(log => [
      log.id,
      log.user?.email || 'System',
      log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
      log.action,
      log.resourceType || '',
      log.resourceId || '',
      JSON.stringify(log.details || {}),
      log.ipAddress || 'Unknown',
      log.userAgent || 'Unknown',
      log.success ? 'Yes' : 'No',
      new Date(log.createdAt).toISOString()
    ]);
    
    const csvData = [headers, ...rows];
    const csvContent = csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const filename = `security_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
    
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}