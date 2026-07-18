import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';

export async function POST(request) {
  try {
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }
    
    let userId = null;
    let userEmail = null;
    let sessionToken = null;
    
    // Get session token from cookie
    sessionToken = request.cookies.get('sessionToken')?.value;
    
    if (token) {
      const { valid, decoded } = await verifyAccessToken(token);
      if (valid && decoded) {
        userId = decoded.userId;
        userEmail = decoded.email;
      }
    }
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Expire/delete the session from database
    if (sessionToken && userId) {
      // Delete the session completely
      await prisma.session.deleteMany({
        where: { 
          sessionToken: sessionToken,
          userId: userId 
        }
      });
      
      console.log(`[LOGOUT] Session expired for user: ${userEmail}, session: ${sessionToken}`);
    }
    
    // Log security event for logout
    if (userId) {
      await logSecurityEvent({
        userId,
        action: SecurityActions.LOGOUT,
        resourceType: 'session',
        resourceId: sessionToken,
        ipAddress,
        userAgent,
        details: { email: userEmail, sessionRevoked: true },
        success: true
      });
    }
    
    const response = NextResponse.json({ success: true });

    // Clear all auth cookies
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('lastActivity');
    response.cookies.delete('sessionToken');
    response.cookies.delete('temp2faSession');

    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear cookies even if logging fails
    const response = NextResponse.json({ success: true });
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('lastActivity');
    response.cookies.delete('sessionToken');
    response.cookies.delete('temp2faSession');
    
    return response;
  }
}