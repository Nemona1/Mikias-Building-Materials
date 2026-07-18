import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';
import { parseDeviceInfo, getLocationFromIP } from '@/lib/device-info';
import { getSetting } from '@/lib/settings';

export async function POST(request) {
  try {
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) token = request.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ success: true, note: 'No token provided' });

    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) return NextResponse.json({ success: true, note: 'Invalid token' });

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { lastActivityAt: new Date() }
    });

    let sessionToken = request.cookies.get('sessionToken')?.value;
    if (!sessionToken) {
      sessionToken = `session_${decoded.userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    // Parse device info for new/updated sessions
    const deviceInfo = parseDeviceInfo(userAgent);
    const location = await getLocationFromIP(ipAddress);
    const sessionTimeoutSeconds = await getSetting('sessionTimeout') || 3600;
    const expiresAt = new Date(Date.now() + sessionTimeoutSeconds * 1000);

    await prisma.session.upsert({
      where: { sessionToken },
      update: {
        lastActivity: new Date(),
        expiresAt,
        ipAddress,
        userAgent,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        location,
      },
      create: {
        userId: decoded.userId,
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

    const response = NextResponse.json({ success: true });
    response.cookies.set('sessionToken', sessionToken, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: sessionTimeoutSeconds
    });

    return response;
  } catch (error) {
    console.error('Activity update error:', error);
    return NextResponse.json({ success: true });
  }
}

export async function GET(request) {
  try {
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) token = request.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    let currentSessionToken = request.cookies.get('sessionToken')?.value;
    const sessionTimeoutSeconds = await getSetting('sessionTimeout') || 3600;

    // Fetch all sessions for this user
    let allSessions = await prisma.session.findMany({
      where: { userId: decoded.userId },
      select: {
        sessionToken: true,
        lastActivity: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true,
        deviceName: true,
        deviceType: true,
        browser: true,
        os: true,
        location: true,
      },
      orderBy: { lastActivity: 'desc' }
    });

    const now = new Date();
    let activeSessions = allSessions.filter(s => new Date(s.expiresAt) > now);
    let expiredSessions = allSessions.filter(s => new Date(s.expiresAt) <= now);

    // If we have a current session token but it's not in activeSessions, try to reactivate it
    if (currentSessionToken) {
      const foundInExpired = expiredSessions.find(s => s.sessionToken === currentSessionToken);
      const foundInActive = activeSessions.find(s => s.sessionToken === currentSessionToken);

      if (!foundInActive && foundInExpired) {
        // Reactivate the expired session
        console.log('[ACTIVITY] Reactivating expired current session');
        const newExpiry = new Date(now.getTime() + sessionTimeoutSeconds * 1000);
        await prisma.session.update({
          where: { sessionToken: currentSessionToken },
          data: {
            expiresAt: newExpiry,
            lastActivity: now,
            ipAddress,
            userAgent,
          }
        });
        // Update the in‑memory representation
        foundInExpired.expiresAt = newExpiry;
        foundInExpired.lastActivity = now;
        // Move from expired to active
        expiredSessions = expiredSessions.filter(s => s.sessionToken !== currentSessionToken);
        activeSessions.unshift(foundInExpired);
      } else if (!foundInActive && !foundInExpired) {
        // Session token not found at all – create a new session
        console.log('[ACTIVITY] Current session token not found, creating new session');
        const deviceInfo = parseDeviceInfo(userAgent);
        const location = await getLocationFromIP(ipAddress);
        const newSessionToken = `session_${decoded.userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const newExpiry = new Date(now.getTime() + sessionTimeoutSeconds * 1000);
        await prisma.session.create({
          data: {
            userId: decoded.userId,
            sessionToken: newSessionToken,
            lastActivity: now,
            expiresAt: newExpiry,
            ipAddress,
            userAgent,
            deviceName: deviceInfo.deviceName,
            deviceType: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            location,
          }
        });
        // Update the cookie token for the response
        currentSessionToken = newSessionToken;
        // Refetch sessions to include the new one
        allSessions = await prisma.session.findMany({
          where: { userId: decoded.userId },
          select: {
            sessionToken: true,
            lastActivity: true,
            expiresAt: true,
            ipAddress: true,
            userAgent: true,
            deviceName: true,
            deviceType: true,
            browser: true,
            os: true,
            location: true,
          },
          orderBy: { lastActivity: 'desc' }
        });
        // Recompute active/expired
        activeSessions = allSessions.filter(s => new Date(s.expiresAt) > now);
        expiredSessions = allSessions.filter(s => new Date(s.expiresAt) <= now);
      }
    }

    // Mark current session in the active list
    const sessionsWithStatus = activeSessions.map(session => ({
      ...session,
      isCurrent: session.sessionToken === currentSessionToken,
      status: session.sessionToken === currentSessionToken ? 'current' : 'active'
    }));

    // Fallback: if no session marked current but there are active sessions, mark the most recent
    if (!sessionsWithStatus.some(s => s.isCurrent) && sessionsWithStatus.length > 0) {
      sessionsWithStatus[0].isCurrent = true;
      sessionsWithStatus[0].status = 'current';
    }

    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.SESSIONS_VIEWED,
      resourceType: 'session',
      ipAddress,
      userAgent,
      details: {
        activeSessionCount: activeSessions.length,
        expiredSessionCount: expiredSessions.length
      },
      success: true
    });

    const response = NextResponse.json({
      lastActivityAt: new Date().toISOString(),
      activeSessions: activeSessions.length,
      expiredSessions: expiredSessions.length,
      currentSessionToken,
      sessions: sessionsWithStatus,
      expiredSessions
    });

    // If we created a new session token, update the cookie
    if (currentSessionToken !== request.cookies.get('sessionToken')?.value) {
      response.cookies.set('sessionToken', currentSessionToken, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: sessionTimeoutSeconds
      });
    }

    return response;
  } catch (error) {
    console.error('[Activity API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}