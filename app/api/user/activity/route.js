// app/api/user/activity/route.js - Optimized with caching and rate limiting
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';
import { parseDeviceInfo, getLocationFromIP } from '@/lib/device-info';
import { getSetting } from '@/lib/settings';

// Cache for user activity to reduce database queries
const activityCache = new Map();
const ACTIVITY_CACHE_TTL = 30000; // 30 seconds
const MAX_CACHE_SIZE = 100;

function getCacheKey(userId) {
  return `activity:${userId}`;
}

function getCachedActivity(userId) {
  const key = getCacheKey(userId);
  const cached = activityCache.get(key);
  if (cached && Date.now() - cached.timestamp < ACTIVITY_CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    activityCache.delete(key);
  }
  return null;
}

function setCachedActivity(userId, data) {
  const key = getCacheKey(userId);
  if (activityCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = activityCache.keys().next().value;
    activityCache.delete(oldestKey);
  }
  activityCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Simple in-memory rate limiter
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(userId) {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  
  // Clean old requests
  const recentRequests = userRequests.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return false;
}

export async function POST(request) {
  try {
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) token = request.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ success: true, note: 'No token provided' });
    }

    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      return NextResponse.json({ success: true, note: 'Invalid token' });
    }

    const userId = decoded.userId;
    
    // Check rate limiting
    if (isRateLimited(userId)) {
      return NextResponse.json({ 
        success: true, 
        note: 'Rate limited',
        cached: true 
      });
    }

    // Check cache first
    const cachedData = getCachedActivity(userId);
    if (cachedData) {
      return NextResponse.json({ 
        success: true, 
        ...cachedData,
        cached: true 
      });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Update last activity (lightweight operation)
    await prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: new Date() }
    });

    let sessionToken = request.cookies.get('sessionToken')?.value;
    if (!sessionToken) {
      sessionToken = `session_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    // Parse device info
    const deviceInfo = parseDeviceInfo(userAgent);
    const location = await getLocationFromIP(ipAddress);
    const sessionTimeoutSeconds = await getSetting('sessionTimeout') || 3600;
    const expiresAt = new Date(Date.now() + sessionTimeoutSeconds * 1000);

    // Upsert session with optimized query
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
        userId: userId,
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

    const responseData = { success: true };
    
    // Cache the response
    setCachedActivity(userId, responseData);

    const response = NextResponse.json(responseData);
    response.cookies.set('sessionToken', sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: sessionTimeoutSeconds
    });

    return response;
  } catch (error) {
    console.error('[Activity API] Error:', error);
    // Return success even on error to avoid breaking the UI
    return NextResponse.json({ success: true });
  }
}

export async function GET(request) {
  try {
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) token = request.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    
    // Check rate limiting for GET requests
    if (isRateLimited(userId)) {
      const cachedData = getCachedActivity(userId);
      if (cachedData) {
        return NextResponse.json({
          ...cachedData,
          cached: true,
          rateLimited: true
        });
      }
    }

    // Check cache first
    const cachedData = getCachedActivity(userId);
    if (cachedData && cachedData.sessions) {
      return NextResponse.json({
        ...cachedData,
        cached: true
      });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    let currentSessionToken = request.cookies.get('sessionToken')?.value;
    const sessionTimeoutSeconds = await getSetting('sessionTimeout') || 3600;
    const now = new Date();

    // Optimized query - only fetch active sessions
    const activeSessions = await prisma.session.findMany({
      where: {
        userId: userId,
        expiresAt: { gt: now }
      },
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

    // Get expired sessions count (lightweight count query)
    const expiredCount = await prisma.session.count({
      where: {
        userId: userId,
        expiresAt: { lte: now }
      }
    });

    // If we have a current session token but it's not in activeSessions, try to reactivate it
    if (currentSessionToken) {
      const foundInActive = activeSessions.find(s => s.sessionToken === currentSessionToken);
      if (!foundInActive) {
        // Check if it exists but is expired
        const expiredSession = await prisma.session.findUnique({
          where: { sessionToken: currentSessionToken },
          select: { expiresAt: true }
        });

        if (expiredSession) {
          // Reactivate the expired session
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
          
          // Fetch updated active sessions
          const updatedSessions = await prisma.session.findMany({
            where: {
              userId: userId,
              expiresAt: { gt: now }
            },
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
          
          // Replace active sessions with updated list
          activeSessions.length = 0;
          activeSessions.push(...updatedSessions);
        } else {
          // Session not found - create new one
          const deviceInfo = parseDeviceInfo(userAgent);
          const location = await getLocationFromIP(ipAddress);
          const newSessionToken = `session_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const newExpiry = new Date(now.getTime() + sessionTimeoutSeconds * 1000);
          
          await prisma.session.create({
            data: {
              userId: userId,
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
          
          currentSessionToken = newSessionToken;
          
          // Refetch active sessions
          const newSessions = await prisma.session.findMany({
            where: {
              userId: userId,
              expiresAt: { gt: now }
            },
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
          
          activeSessions.length = 0;
          activeSessions.push(...newSessions);
        }
      }
    }

    // Mark current session
    const sessionsWithStatus = activeSessions.map(session => ({
      ...session,
      isCurrent: session.sessionToken === currentSessionToken,
      status: session.sessionToken === currentSessionToken ? 'current' : 'active'
    }));

    // Fallback: mark most recent as current if none marked
    if (!sessionsWithStatus.some(s => s.isCurrent) && sessionsWithStatus.length > 0) {
      sessionsWithStatus[0].isCurrent = true;
      sessionsWithStatus[0].status = 'current';
    }

    // Log security event (async, non-blocking)
    logSecurityEvent({
      userId: userId,
      action: SecurityActions.SESSIONS_VIEWED,
      resourceType: 'session',
      ipAddress,
      userAgent,
      details: {
        activeSessionCount: activeSessions.length,
        expiredSessionCount: expiredCount
      },
      success: true
    }).catch(() => {}); // Ignore logging errors

    const responseData = {
      lastActivityAt: new Date().toISOString(),
      activeSessions: activeSessions.length,
      expiredSessions: expiredCount,
      currentSessionToken,
      sessions: sessionsWithStatus
    };

    // Cache the response
    setCachedActivity(userId, responseData);

    const response = NextResponse.json(responseData);

    // Update cookie if needed
    if (currentSessionToken && currentSessionToken !== request.cookies.get('sessionToken')?.value) {
      response.cookies.set('sessionToken', currentSessionToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
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

// Clear cache for a user (call on logout)
export function clearActivityCache(userId) {
  const key = getCacheKey(userId);
  activityCache.delete(key);
  rateLimiter.delete(userId);
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of activityCache) {
    if (now - value.timestamp > ACTIVITY_CACHE_TTL * 2) {
      activityCache.delete(key);
    }
  }
}, 60000); // Clean every minute