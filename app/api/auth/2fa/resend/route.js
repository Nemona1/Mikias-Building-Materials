import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOtp, storeOtp } from '@/lib/auth/2fa';
import { send2faOtpWithSettings } from '@/lib/notification-service';  // Changed this import
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';

export async function POST(request) {
  try {
    const tempSession = request.cookies.get('temp2faSession')?.value;
    
    if (!tempSession) {
      return NextResponse.json({ error: 'Session expired. Please login again.' }, { status: 401 });
    }
    
    let userId;
    try {
      const sessionData = JSON.parse(Buffer.from(tempSession, 'base64').toString());
      userId = sessionData.userId;
      if (sessionData.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Session expired. Please login again.' }, { status: 401 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Generate new OTP
    const otp = generateOtp();
    await storeOtp(user.id, otp);
    
    console.log('[RESEND 2FA] New OTP generated:', otp);
    console.log('[RESEND 2FA] Sending to email:', user.email);
    
    // Use the SAME function that login uses - send2faOtpWithSettings
    const emailSent = await send2faOtpWithSettings(user.email, otp, user.firstName);
    
    if (!emailSent) {
      console.error('[RESEND 2FA] Failed to send email');
      
      await logSecurityEvent({
        userId: user.id,
        action: SecurityActions.TWO_FACTOR_RESEND_CODE,
        resourceType: 'user',
        resourceId: user.id,
        ipAddress,
        userAgent,
        details: { reason: 'Email send failed', otp: otp },
        success: false
      });
      
      // In development, still return success with OTP in response
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'New verification code generated (check console for OTP)',
          devOtp: otp
        });
      }
      
      return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
    }
    
    console.log('[RESEND 2FA] Email sent successfully to:', user.email);
    
    await logSecurityEvent({
      userId: user.id,
      action: SecurityActions.TWO_FACTOR_RESEND_CODE,
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
      details: { 
        emailSent: true,
        timestamp: new Date().toISOString()
      },
      success: true
    });
    
    return NextResponse.json({
      success: true,
      message: 'New verification code sent to your email'
    });
    
  } catch (error) {
    console.error('[RESEND 2FA] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}