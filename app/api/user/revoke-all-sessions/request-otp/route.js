import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { generateOtp } from '@/lib/auth/2fa';
import { sendBulkRevokeOtp } from '@/lib/email/sendBulkRevokeOtp';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';

export async function POST(request) {
  try {
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) token = request.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    
    // Count other sessions
    const currentSessionToken = request.cookies.get('sessionToken')?.value;
    const otherSessions = await prisma.session.count({
      where: { userId: decoded.userId, sessionToken: { not: currentSessionToken } }
    });
    
    if (otherSessions === 0) {
      return NextResponse.json({ error: 'No other sessions to revoke' }, { status: 400 });
    }
    
    const otp = generateOtp();
    const otpKey = `revoke_all_otp_${decoded.userId}`;
    if (!global.revokeOtpStore) global.revokeOtpStore = new Map();
    global.revokeOtpStore.set(otpKey, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    const emailSent = await sendBulkRevokeOtp(user.email, otp, user.firstName, otherSessions);
    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
    }
    
    await logSecurityEvent({
      userId: decoded.userId,
      action: 'BULK_REVOKE_OTP_SENT',
      resourceType: 'session',
      ipAddress,
      userAgent,
      details: { otherSessionCount: otherSessions },
      success: true
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent to your email',
      requiresOtp: true
    });
    
  } catch (error) {
    console.error('Request bulk revoke OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}