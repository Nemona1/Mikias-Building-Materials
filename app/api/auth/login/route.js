import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, handleFailedLogin, resetFailedAttempts } from '@/lib/auth/security';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';
import { generateOtp, storeOtp, generateDeviceFingerprint } from '@/lib/auth/2fa';
import { send2faOtpWithSettings } from '@/lib/notification-service';
import { parseDeviceInfo, getLocationFromIP } from '@/lib/device-info';
import { getSetting } from '@/lib/settings';
import { sendLoginAlertWithSettings } from '@/lib/notification-service';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    console.log('[LOGIN] Attempt for email:', email);
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });
    
    if (!user) {
      await logSecurityEvent({
        userId: null,
        action: SecurityActions.LOGIN_FAILED,
        ipAddress,
        userAgent,
        details: { email, reason: 'User not found' },
        success: false
      });
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Maintenance mode check
    const maintenanceMode = await getSetting('maintenanceMode');
    if (maintenanceMode && user.role?.name !== 'super_admin' && user.role?.name !== 'admin') {
      await logSecurityEvent({
        userId: user.id,
        action: SecurityActions.LOGIN_FAILED,
        ipAddress,
        userAgent,
        details: { email, reason: 'System under maintenance' },
        success: false
      });
      return NextResponse.json(
        { error: 'System is under maintenance. Please try again later.' },
        { status: 503 }
      );
    }
    
    // Account lockout check
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingSeconds = Math.ceil((user.lockoutUntil - new Date()) / 1000);
      
      await logSecurityEvent({
        userId: user.id,
        action: SecurityActions.LOGIN_FAILED,
        ipAddress,
        userAgent,
        details: { email, reason: 'Account locked', remainingSeconds },
        success: false
      });
      
      return NextResponse.json(
        { error: `Account locked. Try again in ${remainingSeconds} seconds`, locked: true, lockoutTime: remainingSeconds },
        { status: 429 }
      );
    }
    
    // Email verification check
    if (!user.isVerified) {
      await logSecurityEvent({
        userId: user.id,
        action: SecurityActions.LOGIN_FAILED,
        ipAddress,
        userAgent,
        details: { email, reason: 'Email not verified' },
        success: false
      });
      
      return NextResponse.json(
        { error: 'Please verify your email before logging in' },
        { status: 401 }
      );
    }
    
    // Password verification
    const isValid = await verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      const result = await handleFailedLogin(email, ipAddress, userAgent);
      
      await logSecurityEvent({
        userId: user.id,
        action: SecurityActions.LOGIN_FAILED,
        ipAddress,
        userAgent,
        details: { email, reason: 'Invalid password', attempts: result.remainingAttempts },
        success: false
      });
      
      if (result.locked) {
        await logSecurityEvent({
          userId: user.id,
          action: SecurityActions.ACCOUNT_LOCKED,
          ipAddress,
          userAgent,
          details: { reason: 'Too many failed login attempts', lockoutTime: result.lockoutTime },
          success: false
        });
        
        return NextResponse.json(
          { error: `Too many failed attempts. Account locked for ${result.lockoutTime} seconds`, locked: true, lockoutTime: result.lockoutTime },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid credentials', remainingAttempts: result.remainingAttempts },
        { status: 401 }
      );
    }
    
    await resetFailedAttempts(email);
    
    // ============================================================
    // TWO-FACTOR AUTHENTICATION CHECK
    // ============================================================
    
    const system2FAEnabled = await getSetting('twoFactorEnabled');
    console.log('[LOGIN] System 2FA Enabled:', system2FAEnabled);
    console.log('[LOGIN] User 2FA Enabled:', user.twoFactorEnabled);
    
    const shouldRequire2FA = system2FAEnabled === true && user.twoFactorEnabled === true;
    
    if (shouldRequire2FA) {
      console.log('[LOGIN] 2FA REQUIRED for user:', email);
      
      const otp = generateOtp();
      await storeOtp(user.id, otp);
      
      await logSecurityEvent({
        userId: user.id,
        action: SecurityActions.TWO_FACTOR_CODE_SENT,
        resourceType: 'user',
        resourceId: user.id,
        ipAddress,
        userAgent,
        details: { email: user.email, method: 'EMAIL_OTP' },
        success: true
      });
      
      const emailSent = await send2faOtpWithSettings(user.email, otp, user.firstName);
      
      if (!emailSent) {
        await logSecurityEvent({
          userId: user.id,
          action: SecurityActions.TWO_FACTOR_CODE_SENT,
          resourceType: 'user',
          resourceId: user.id,
          ipAddress,
          userAgent,
          details: { email: user.email, reason: 'Email send failed' },
          success: false
        });
        
        return NextResponse.json(
          { error: 'Failed to send verification code. Please try again.' },
          { status: 500 }
        );
      }
      
      let isTrustedDevice = false;
      const deviceId = generateDeviceFingerprint(userAgent, ipAddress);
      
      const trustedDevice = await prisma.trustedDevice.findFirst({
        where: {
          userId: user.id,
          deviceId,
          expiresAt: { gt: new Date() }
        }
      });
      
      if (trustedDevice) {
        isTrustedDevice = true;
        await prisma.trustedDevice.update({
          where: { id: trustedDevice.id },
          data: { lastUsedAt: new Date() }
        });
      }
      
      const tempSession = Buffer.from(JSON.stringify({
        userId: user.id,
        expiresAt: Date.now() + 10 * 60 * 1000
      })).toString('base64');
      
      const isProduction = process.env.NODE_ENV === 'production';
      
      const twoFactorResponse = NextResponse.json({
        requiresTwoFactor: true,
        message: 'Two-factor authentication required. A verification code has been sent to your email.',
        isTrustedDevice
      });
      
      twoFactorResponse.cookies.set('temp2faSession', tempSession, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 10 * 60
      });
      
      return twoFactorResponse;
    }
    
    // Log if 2FA is being bypassed
    if (user.twoFactorEnabled && !system2FAEnabled) {
      console.log(`[LOGIN] 2FA BYPASSED for ${email} - System-wide 2FA is disabled`);
      
      await logSecurityEvent({
        userId: user.id,
        action: 'TWO_FACTOR_BYPASSED_SYSTEM_DISABLED',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress,
        userAgent,
        details: { reason: 'System-wide 2FA disabled by admin', userHad2FAEnabled: true },
        success: true
      });
    }
    
    // ============================================================
    // NORMAL LOGIN - ROLE-BASED REDIRECT
    // ============================================================
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Determine redirect URL based on user role
    const roleName = user.role?.name || 'customer';
    
    // Role-based dashboard routing
    const dashboardMap = {
      'super_admin': '/dashboard/super-admin',
      'admin': '/dashboard/admin',
      'manager': '/dashboard/manager',
      'staff': '/dashboard/staff',
      'customer': '/dashboard/customer'
    };
    
    const redirectUrl = dashboardMap[roleName] || '/dashboard/customer';
    
    await logSecurityEvent({
      userId: user.id,
      action: SecurityActions.LOGIN_SUCCESS,
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
      details: { email, redirectUrl, role: roleName, twoFactorEnabled: user.twoFactorEnabled },
      success: true
    });
    
    // ============================================================
    // SESSION MANAGEMENT
    // ============================================================
    
    console.log('[LOGIN] Creating session for user:', user.id);
    
    const deviceInfo = parseDeviceInfo(userAgent);
    const location = await getLocationFromIP(ipAddress);
    const sessionToken = `session_${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const sessionTimeoutSeconds = await getSetting('sessionTimeout') || 3600;
    const expiresAt = new Date(Date.now() + sessionTimeoutSeconds * 1000);
    
    console.log('[LOGIN] Session timeout:', sessionTimeoutSeconds, 'seconds');
    console.log('[LOGIN] Session expires at:', expiresAt.toISOString());
    
    await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken,
        lastActivity: new Date(),
        expiresAt,
        ipAddress,
        userAgent,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        location,
      }
    });
    
    // ============================================================
    // ENFORCE MAX CONCURRENT SESSIONS
    // ============================================================
    
    const maxConcurrent = await getSetting('sessionMaxConcurrent') || 5;
    console.log('[LOGIN] Max concurrent sessions:', maxConcurrent);
    
    const allActiveSessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastActivity: 'asc' }
    });
    
    console.log('[LOGIN] Total active sessions:', allActiveSessions.length);
    
    if (allActiveSessions.length > maxConcurrent) {
      const sessionsToDelete = allActiveSessions.slice(0, allActiveSessions.length - maxConcurrent);
      const deletedCount = await prisma.session.deleteMany({
        where: {
          sessionToken: { in: sessionsToDelete.map(s => s.sessionToken) }
        }
      });
      console.log('[LOGIN] Removed', deletedCount.count, 'old sessions due to max concurrent limit');
      
      await logSecurityEvent({
        userId: user.id,
        action: 'MAX_CONCURRENT_SESSIONS_ENFORCED',
        resourceType: 'session',
        ipAddress,
        userAgent,
        details: { 
          maxAllowed: maxConcurrent,
          removedCount: deletedCount.count,
          totalSessions: allActiveSessions.length
        },
        success: true
      });
    }
    
    // ============================================================
    // SEND LOGIN ALERT
    // ============================================================
    
    if (allActiveSessions.length <= 1) {
      await sendLoginAlertWithSettings(user.email, user.firstName, deviceInfo.deviceName, location, ipAddress);
    }
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    // ============================================================
    // CREATE RESPONSE WITH PROPER COOKIE SETTINGS
    // ============================================================
    
    // Create response with user data
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
        twoFactorEnabled: user.twoFactorEnabled,
        isVerified: user.isVerified
      }
    });
    
    // Set cookies with proper configuration - CRITICAL FIX
    // Access token - httpOnly for security
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 // 15 minutes
    });
    
    // Refresh token - httpOnly for security
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
    
    // Session token - not httpOnly for client access
    response.cookies.set('sessionToken', sessionToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: sessionTimeoutSeconds
    });
    
    // Also store in localStorage via the response data
    // The client will store these in localStorage from the response body
    
    console.log('[LOGIN] ✅ Login successful for:', email, 'Role:', roleName);
    console.log('[LOGIN] ✅ Redirecting to:', redirectUrl);
    console.log('[LOGIN] ✅ Cookies set: accessToken, refreshToken, sessionToken');
    
    return response;
    
  } catch (error) {
    console.error('[LOGIN] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}