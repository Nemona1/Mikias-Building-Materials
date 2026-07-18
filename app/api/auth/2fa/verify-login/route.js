import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStoredOtp, verifyBackupCode, generateDeviceFingerprint, getDeviceType, getDeviceName } from '@/lib/auth/2fa';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { parseDeviceInfo, getLocationFromIP } from '@/lib/device-info';
import { getSetting } from '@/lib/settings';
import { sendLoginAlertWithSettings } from '@/lib/notification-service';

export async function POST(request) {
  try {
    const { otp, backupCode, rememberDevice } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!otp && !backupCode) {
      return NextResponse.json(
        { error: 'Verification code or backup code is required' },
        { status: 400 }
      );
    }

    const tempSession = request.cookies.get('temp2faSession')?.value;

    if (!tempSession) {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    let userId;
    try {
      const sessionData = JSON.parse(Buffer.from(tempSession, 'base64').toString());
      userId = sessionData.userId;

      if (sessionData.expiresAt < Date.now()) {
        return NextResponse.json(
          { error: 'Session expired. Please login again.' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('[2FA Verify] Session parse error:', error);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const system2FAEnabled = await getSetting('twoFactorEnabled');
    console.log('[2FA Verify] System 2FA Enabled:', system2FAEnabled);
    
    if (!system2FAEnabled) {
      return NextResponse.json(
        { error: '2FA is currently disabled system-wide. Please login again.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account. Please login again.' },
        { status: 400 }
      );
    }

    let isValid = false;
    let verificationMethod = '';

    if (otp) {
      const verification = await verifyStoredOtp(user.id, otp);

      if (verification.valid) {
        isValid = true;
        verificationMethod = 'OTP';
      } else {
        await logSecurityEvent({
          userId: user.id,
          action: SecurityActions.TWO_FACTOR_VERIFICATION_FAILED,
          resourceType: 'user',
          resourceId: user.id,
          ipAddress,
          userAgent,
          details: { reason: verification.error, method: 'OTP', loginAttempt: true },
          success: false
        });

        return NextResponse.json(
          { error: verification.error },
          { status: 401 }
        );
      }
    }

    if (!isValid && backupCode && user.twoFactorBackupCodes) {
      const storedCodes = JSON.parse(user.twoFactorBackupCodes);
      const matchedCode = await verifyBackupCode(backupCode, storedCodes);

      if (matchedCode) {
        isValid = true;
        verificationMethod = 'BACKUP_CODE';

        await logSecurityEvent({
          userId: user.id,
          action: SecurityActions.TWO_FACTOR_BACKUP_CODE_USED,
          resourceType: 'user',
          resourceId: user.id,
          ipAddress,
          userAgent,
          details: { backupCodeUsed: true },
          success: true
        });

        const remainingCodes = storedCodes.filter(c => c.code !== matchedCode);
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: JSON.stringify(remainingCodes) }
        });
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      );
    }

    await logSecurityEvent({
      userId: user.id,
      action: SecurityActions.TWO_FACTOR_VERIFICATION_SUCCESS,
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
      details: { method: verificationMethod, rememberDevice },
      success: true
    });

    if (rememberDevice) {
      const deviceId = generateDeviceFingerprint(userAgent, ipAddress);
      const deviceType = getDeviceType(userAgent);
      const deviceName = getDeviceName(userAgent);
      const rememberDays = await getSetting('twoFactorRememberDays') || 30;

      await prisma.trustedDevice.upsert({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId
          }
        },
        update: {
          lastUsedAt: new Date(),
          expiresAt: new Date(Date.now() + rememberDays * 24 * 60 * 60 * 1000)
        },
        create: {
          userId: user.id,
          deviceId,
          deviceName,
          deviceType,
          ipAddress,
          userAgent,
          expiresAt: new Date(Date.now() + rememberDays * 24 * 60 * 60 * 1000)
        }
      });
    }

    let redirectUrl = '/role-request';
    if (user.applicationStatus === 'APPROVED') {
      if (user.role?.name === 'ADMIN') {
        redirectUrl = '/dashboard/admin';
      } else if (user.role?.name === 'MANAGER') {
        redirectUrl = '/dashboard/manager';
      } else if (user.role?.name === 'EDITOR') {
        redirectUrl = '/dashboard/editor';
      } else if (user.role?.name === 'VIEWER') {
        redirectUrl = '/dashboard/viewer';
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const isProduction = process.env.NODE_ENV === 'production';

    const deviceInfo = parseDeviceInfo(userAgent);
    const location = await getLocationFromIP(ipAddress);
    const sessionToken = `session_${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const sessionTimeoutSeconds = await getSetting('sessionTimeout') || 3600;

    await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + sessionTimeoutSeconds * 1000),
        ipAddress,
        userAgent,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        location,
      }
    });

    console.log('[2FA Verify] Session created:', sessionToken);

    // Send login alert for 2FA login
    await sendLoginAlertWithSettings(user.email, user.firstName, deviceInfo.deviceName, location, ipAddress);

    const response = NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      sessionToken,
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        applicationStatus: user.applicationStatus,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    response.cookies.set('sessionToken', sessionToken, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: sessionTimeoutSeconds
    });

    response.cookies.delete('temp2faSession');

    return response;
  } catch (error) {
    console.error('[2FA Verify] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}