import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasPermission } from '@/lib/auth/permissions';

// This should be shared with the main backup route
const activeRestores = new Map();

export async function GET(request) {
  try {
    const restoreId = request.headers.get('X-Restore-Id');
    
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
    
    const hasAdminAccess = await hasPermission(decoded.userId, 'admin:access');
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const restoreInfo = activeRestores.get(restoreId);
    
    if (!restoreInfo) {
      return NextResponse.json({ status: 'not_found' });
    }
    
    return NextResponse.json(restoreInfo);
    
  } catch (error) {
    console.error('Restore status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}