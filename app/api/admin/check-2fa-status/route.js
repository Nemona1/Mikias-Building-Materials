import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getSetting } from '@/lib/settings';

export async function GET(request) {
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
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });
    
    if (user?.role?.name !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const forceAdmin2FA = await getSetting('forceAdmin2FA');
    const system2FAEnabled = await getSetting('twoFactorEnabled');
    
    return NextResponse.json({
      forceAdmin2FA: forceAdmin2FA === true,
      system2FAEnabled: system2FAEnabled === true,
      user2FAEnabled: user.twoFactorEnabled === true,
      requiresAction: forceAdmin2FA === true && system2FAEnabled === true && user.twoFactorEnabled !== true
    });
  } catch (error) {
    console.error('[Check 2FA Status] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}