import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';

if (!global.revokeOtpStore) global.revokeOtpStore = new Map();

export async function POST(request) {
  try {
    const { otp } = await request.json();
    if (!otp) return NextResponse.json({ error: 'OTP required' }, { status: 400 });
    
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) token = request.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Verify OTP for bulk revoke
    const otpKey = `revoke_all_${decoded.userId}`;
    const stored = global.revokeOtpStore.get(otpKey);
    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
    
    const currentSessionToken = request.cookies.get('sessionToken')?.value;
    
    const allSessions = await prisma.session.findMany({
      where: { userId: decoded.userId }
    });
    
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        userId: decoded.userId,
        sessionToken: { not: currentSessionToken }
      }
    });
    
    // Clean up OTP
    global.revokeOtpStore.delete(otpKey);
    
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.ALL_OTHER_SESSIONS_REVOKED,
      resourceType: 'session',
      ipAddress,
      userAgent,
      details: { revokedCount: deletedSessions.count, totalSessions: allSessions.length },
      success: true
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully revoked ${deletedSessions.count} other session(s)`,
      revokedCount: deletedSessions.count
    });
    
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}