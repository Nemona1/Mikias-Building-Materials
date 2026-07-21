// app/api/admin/users/resend-temp-password/route.js - Updated with audit logging

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasAdminAccess } from '@/lib/auth/permissions';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';
import bcrypt from 'bcryptjs';
import { sendUserCredentialsEmail } from '@/lib/email/sendUserCredentialsEmail';

export async function POST(request) {
  try {
    const { userId } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
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

    // Get the admin user for audit logging
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is super_admin and if current user can modify them
    if (user.role?.name === 'super_admin') {
      const currentUserRoles = await getUserRoles(decoded.userId);
      const isSuperAdmin = currentUserRoles.some(r => r.name === 'super_admin');
      if (!isSuperAdmin) {
        return NextResponse.json({ error: 'Forbidden - Cannot modify super admin' }, { status: 403 });
      }
    }

    // Generate new temporary password
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const tempPasswordExpiry = new Date();
    tempPasswordExpiry.setHours(tempPasswordExpiry.getHours() + 24);

    // Update user with new temporary password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        tempPassword: tempPassword,
        tempPasswordExpiry: tempPasswordExpiry,
        tempPasswordSentAt: new Date(),
        mustChangePassword: true
      }
    });

    // Send email with new temporary password
    const emailSent = await sendUserCredentialsEmail({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tempPassword: tempPassword,
      role: user.role?.name || 'User',
      expiryHours: 24
    });

    // Log security event with all details
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.TEMP_PASSWORD_RESENT,
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
      details: {
        targetUserEmail: user.email,
        targetUserFirstName: user.firstName,
        targetUserLastName: user.lastName,
        targetUserRole: user.role?.name || 'No role assigned',
        resendBy: adminUser?.email || decoded.userId,
        resendByRole: adminUser?.role?.name || 'Unknown',
        emailSent: emailSent,
        newExpiry: tempPasswordExpiry.toISOString(),
        previousExpiry: user.tempPasswordExpiry
      },
      success: true
    });

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Temporary password sent successfully' 
        : 'Temporary password generated but email failed to send. Please try again.'
    });

  } catch (error) {
    console.error('[Resend Temp Password] Error:', error);
    
    // Log the error
    try {
      const { userId } = await request.json().catch(() => ({}));
      await logSecurityEvent({
        userId: decoded?.userId || null,
        action: 'TEMP_PASSWORD_RESEND_FAILED',
        resourceType: 'user',
        resourceId: userId || null,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: {
          error: error.message
        },
        success: false
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return NextResponse.json(
      { error: 'Failed to resend temporary password: ' + error.message },
      { status: 500 }
    );
  }
}

function generateTemporaryPassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}