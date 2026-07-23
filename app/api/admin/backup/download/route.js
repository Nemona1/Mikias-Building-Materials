// app/api/admin/backup/download/route.js - Complete fixed version
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasAdminAccess } from '@/lib/auth/permissions';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    
    if (!fileName) {
      return NextResponse.json({ error: 'File name required' }, { status: 400 });
    }
    
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
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const filePath = path.join(BACKUP_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      await logSecurityEvent({
        userId: decoded.userId,
        action: SecurityActions.BACKUP_ACCESSED,
        resourceType: 'system',
        resourceId: fileName,
        ipAddress,
        userAgent,
        details: { action: 'download_failed', reason: 'File not found' },
        success: false
      });
      
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    const fileContent = fs.readFileSync(filePath);
    
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.BACKUP_DOWNLOADED,
      resourceType: 'system',
      resourceId: fileName,
      ipAddress,
      userAgent,
      details: { 
        fileName,
        fileSize: fileContent.length,
        action: 'download'
      },
      success: true
    });
    
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
    
  } catch (error) {
    console.error('Download backup error:', error);
    
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (token) {
        const { decoded } = await verifyAccessToken(token);
        if (decoded) {
          await logSecurityEvent({
            userId: decoded.userId,
            action: SecurityActions.BACKUP_DOWNLOADED,
            resourceType: 'system',
            resourceId: null,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            details: { action: 'download_failed', error: error.message },
            success: false
          });
        }
      }
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }
    
    return NextResponse.json(
      { error: 'Failed to download backup' },
      { status: 500 }
    );
  }
}