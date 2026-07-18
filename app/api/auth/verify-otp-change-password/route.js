import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { hashPassword, validatePasswordStrengthAsync } from '@/lib/auth/security';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';
import { sendSecurityAlertWithSettings, sendPasswordChangedWithSettings } from '@/lib/notification-service';

export async function POST(request) {
  try {
    const { otp, newPassword } = await request.json();
    
    if (!otp || !newPassword) {
      return NextResponse.json(
        { error: 'Verification code and new password are required' },
        { status: 400 }
      );
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
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    if (user.passwordChangeOtpLockout && user.passwordChangeOtpLockout > new Date()) {
      const remainingSeconds = Math.ceil((user.passwordChangeOtpLockout - new Date()) / 1000);
      return NextResponse.json({ 
        error: `Too many failed attempts. Account locked for ${remainingSeconds} seconds.`,
        locked: true,
        remainingSeconds
      }, { status: 429 });
    }
    
    if (user.passwordChangeOtpExpiry && user.passwordChangeOtpExpiry < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
    }
    
    if (user.passwordChangeOtp !== otp) {
      const newAttempts = (user.passwordChangeOtpAttempts || 0) + 1;
      let lockoutUntil = null;
      
      if (newAttempts >= 3) {
        lockoutUntil = new Date(Date.now() + 60 * 1000);
        
        await logSecurityEvent({
          userId: user.id,
          action: SecurityActions.ACCOUNT_LOCKED,
          resourceType: 'user',
          resourceId: user.id,
          ipAddress,
          userAgent,
          details: { reason: 'Too many failed OTP attempts', attempts: newAttempts },
          success: false
        });
        
        await sendSecurityAlertWithSettings(user.email, user.firstName, 'otp_verification_failed', {
          attempts: newAttempts,
          ipAddress,
          userAgent
        });
      }
      
      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          passwordChangeOtpAttempts: newAttempts,
          passwordChangeOtpLockout: lockoutUntil
        }
      });
      
      await logSecurityEvent({
        userId: decoded.userId,
        action: SecurityActions.PASSWORD_CHANGE_OTP_FAILED,
        resourceType: 'user',
        resourceId: decoded.userId,
        ipAddress,
        userAgent,
        details: { attempts: newAttempts, locked: !!lockoutUntil },
        success: false
      });
      
      return NextResponse.json({ 
        error: newAttempts >= 3 
          ? 'Too many failed attempts. Account temporarily locked.'
          : `Invalid verification code. ${3 - newAttempts} attempt(s) remaining.`,
        remainingAttempts: newAttempts >= 3 ? 0 : 3 - newAttempts
      }, { status: 400 });
    }
    
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        passwordChangeOtpAttempts: 0,
        passwordChangeOtpLockout: null
      }
    });
    
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.PASSWORD_CHANGE_OTP_VERIFIED,
      resourceType: 'user',
      resourceId: decoded.userId,
      ipAddress,
      userAgent,
      details: { otpVerified: true },
      success: true
    });
    
    const validation = await validatePasswordStrengthAsync(newPassword);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
    }
    
    const newPasswordHash = await hashPassword(newPassword);
    
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        passwordHash: newPasswordHash,
        passwordChangeOtp: null,
        passwordChangeOtpExpiry: null,
        passwordChangeOtpAttempts: 0,
        passwordChangeOtpLockout: null,
        refreshTokenVersion: { increment: 1 }
      }
    });
    
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.PASSWORD_CHANGED_SUCCESSFULLY,
      resourceType: 'user',
      resourceId: decoded.userId,
      ipAddress,
      userAgent,
      details: { method: 'OTP_VERIFIED', allSessionsInvalidated: true },
      success: true
    });
    
    await sendPasswordChangedWithSettings(user.email, user.firstName, 'otp_verified');
    
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully. You will be redirected to login.'
    });
    
  } catch (error) {
    console.error('Verify OTP and change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}