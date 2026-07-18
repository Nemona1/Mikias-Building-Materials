import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { verifyPassword, hashPassword, validatePasswordStrengthAsync } from '@/lib/auth/security';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';
import { sendPasswordChangedWithSettings } from '@/lib/notification-service';

export async function POST(request) {
  try {
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
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
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      await logSecurityEvent({
        userId: user.id,
        action: SecurityActions.PASSWORD_CHANGE_FAILED_CURRENT_PASSWORD,
        resourceType: 'user',
        resourceId: user.id,
        ipAddress,
        userAgent,
        details: { reason: 'Invalid current password' },
        success: false
      });
      
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }
    
    const validation = await validatePasswordStrengthAsync(newPassword);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
    }
    
    const newPasswordHash = await hashPassword(newPassword);
    
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        passwordHash: newPasswordHash,
        refreshTokenVersion: { increment: 1 }
      }
    });
    
    await logSecurityEvent({
      userId: user.id,
      action: SecurityActions.PASSWORD_CHANGED_SUCCESSFULLY,
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
      details: { 
        passwordChanged: true,
        allSessionsInvalidated: true
      },
      success: true
    });
    
    // Send password change confirmation email (respects settings)
    await sendPasswordChangedWithSettings(user.email, user.firstName, 'user_initiated');
    
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully. You have been logged out from all devices.'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}