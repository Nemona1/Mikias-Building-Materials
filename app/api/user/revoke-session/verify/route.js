import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';

export async function POST(request) {
  try {
    const { sessionToken, otp } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    if (!sessionToken || !otp) {
      return NextResponse.json({ error: 'Session token and OTP required' }, { status: 400 });
    }
    
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) token = request.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    
    // Verify OTP
    const otpKey = `revoke_otp_${decoded.userId}_${sessionToken}`;
    const stored = global.revokeOtpStore?.get(otpKey);
    
    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
    
    // Get the session to revoke
    const targetSession = await prisma.session.findFirst({
      where: { sessionToken, userId: decoded.userId }
    });
    
    if (!targetSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Delete the session
    await prisma.session.delete({ where: { sessionToken } });
    
    // Clean up OTP
    global.revokeOtpStore.delete(otpKey);
    
    const currentSessionToken = request.cookies.get('sessionToken')?.value;
    const isCurrentSession = sessionToken === currentSessionToken;
    
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.SESSION_REVOKED,
      resourceType: 'session',
      resourceId: sessionToken,
      ipAddress,
      userAgent,
      details: { 
        sessionToken, 
        deviceInfo: targetSession.deviceName,
        wasCurrentSession: isCurrentSession
      },
      success: true
    });
    
    const response = NextResponse.json({ 
      success: true, 
      message: isCurrentSession ? 'Current session revoked. You will be logged out.' : 'Session revoked successfully'
    });
    
    if (isCurrentSession) {
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      response.cookies.delete('sessionToken');
      response.cookies.delete('lastActivity');
    }
    
    return response;
    
  } catch (error) {
    console.error('Verify revoke OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}