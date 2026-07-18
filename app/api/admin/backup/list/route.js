import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasPermission } from '@/lib/auth/permissions';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

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
    
    const hasAdminAccess = await hasPermission(decoded.userId, 'admin:access');
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Log backup list access
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.BACKUP_ACCESSED,
      resourceType: 'system',
      resourceId: null,
      ipAddress,
      userAgent,
      details: { action: 'list_backups' },
      success: true
    });
    
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      return NextResponse.json({ backups: [] });
    }
    
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        
        let backupInfo = { type: 'unknown', recordCount: 0 };
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (content.database) {
            backupInfo.type = 'database';
            backupInfo.recordCount = Object.values(content.database).reduce((sum, arr) => sum + (arr?.length || 0), 0);
          }
          if (content.config) backupInfo.type = 'config';
          if (content.database && content.config) backupInfo.type = 'full';
        } catch (e) {
          // Ignore parsing errors
        }
        
        return {
          name: file,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          type: backupInfo.type,
          recordCount: backupInfo.recordCount
        };
      })
      .sort((a, b) => b.modifiedAt - a.modifiedAt);
    
    return NextResponse.json({ backups });
    
  } catch (error) {
    console.error('List backups error:', error);
    return NextResponse.json(
      { error: 'Failed to list backups' },
      { status: 500 }
    );
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}