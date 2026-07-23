// app/api/admin/backup/status/route.js - Complete fixed version
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasAdminAccess } from '@/lib/auth/permissions';
import { activeRestores } from '../route';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restoreId = searchParams.get('restoreId');
    
    if (!restoreId) {
      return NextResponse.json({ error: 'Restore ID required' }, { status: 400 });
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
    
    const restoreInfo = activeRestores.get(restoreId);
    
    if (!restoreInfo) {
      return NextResponse.json({ 
        status: 'not_found',
        message: 'Restore operation not found'
      });
    }
    
    return NextResponse.json(restoreInfo);
    
  } catch (error) {
    console.error('Restore status error:', error);
    return NextResponse.json(
      { error: 'Failed to get restore status: ' + error.message },
      { status: 500 }
    );
  }
}