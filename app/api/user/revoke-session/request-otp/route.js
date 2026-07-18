import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { generateOtp, storeOtp } from '@/lib/auth/2fa';
import { sendSessionRevokeOtp } from '@/lib/email/sendSessionRevokeOtp';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';

export async function POST(request) {
  try {
    const { sessionToken } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 400 });
    }
    
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) token = request.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    
    // Get target session
    const targetSession = await prisma.session.findFirst({
      where: { sessionToken, userId: decoded.userId }
    });
    
    if (!targetSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Generate OTP and store in temporary cache (e.g., using Redis or in-memory with expiry)
    const otp = generateOtp();
    const otpKey = `revoke_otp_${decoded.userId}_${sessionToken}`;
    // Store in a simple in-memory store (for production, use Redis)
    if (!global.revokeOtpStore) global.revokeOtpStore = new Map();
    global.revokeOtpStore.set(otpKey, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    
    // Get user email for sending OTP
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    // Send OTP email
    const emailSent = await sendSessionRevokeOtp(user.email, otp, user.firstName, targetSession);
    
    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
    }
    
    await logSecurityEvent({
      userId: decoded.userId,
      action: 'SESSION_REVOKE_OTP_SENT',
      resourceType: 'session',
      resourceId: sessionToken,
      ipAddress,
      userAgent,
      details: { targetDevice: targetSession.deviceName },
      success: true
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent to your email',
      requiresOtp: true
    });
    
  } catch (error) {
    console.error('Request revoke OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}