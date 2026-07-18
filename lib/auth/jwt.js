// lib/auth/jwt.js - Keep for server-side use
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export function generateAccessToken(user) {
  const roleName = user.role?.name || user.role || 'customer';
  
  const payload = {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    role: roleName,
    version: user.refreshTokenVersion || 0,
    type: 'access'
  };
  
  console.log('[JWT] Generating access token for user:', user.id, 'role:', roleName);
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'nemo-auth',
    audience: 'nemo-app'
  });
}

export function generateRefreshToken(user) {
  const payload = {
    userId: user.id,
    version: user.refreshTokenVersion || 0,
    type: 'refresh'
  };
  
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'nemo-auth',
    audience: 'nemo-app'
  });
}

export async function verifyAccessToken(token) {
  try {
    console.log('[JWT] Verifying token...');
    
    if (!token) {
      console.log('[JWT] No token provided');
      return { valid: false, error: 'No token provided' };
    }
    
    // This runs on the server (Node.js runtime)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'nemo-auth',
      audience: 'nemo-app'
    });
    
    console.log('[JWT] Decoded token:', { 
      userId: decoded.userId, 
      type: decoded.type, 
      version: decoded.version,
      role: decoded.role
    });
    
    if (decoded.type !== 'access') {
      console.log('[JWT] Invalid token type:', decoded.type);
      return { valid: false, error: 'Invalid token type' };
    }
    
    // Server-side verification with database
    try {
      const { prisma } = await import('@/lib/prisma');
      
      if (!prisma) {
        return { valid: true, decoded, user: null };
      }
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { 
          refreshTokenVersion: true, 
          isVerified: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });
      
      if (!user) {
        console.log('[JWT] User not found:', decoded.userId);
        return { valid: false, error: 'User not found' };
      }
      
      if (!user.isVerified) {
        console.log('[JWT] Email not verified:', decoded.userId);
        return { valid: false, error: 'Email not verified' };
      }
      
      if (user.refreshTokenVersion !== decoded.version) {
        console.log('[JWT] Version mismatch');
        return { valid: false, error: 'Token version mismatch' };
      }
      
      const roleName = user.role?.name || decoded.role || 'customer';
      decoded.role = roleName;
      
      console.log('[JWT] Token valid for user:', decoded.userId, 'role:', roleName);
      return { valid: true, decoded, user };
      
    } catch (dbError) {
      console.error('[JWT] Database error:', dbError.message);
      return { valid: true, decoded, user: null };
    }
    
  } catch (error) {
    console.error('[JWT] Verification error:', error.message);
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expired' };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' };
    }
    return { valid: false, error: 'Token verification failed' };
  }
}

export async function rotateRefreshToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
      issuer: 'nemo-auth',
      audience: 'nemo-app'
    });
    
    if (decoded.type !== 'refresh') {
      return { success: false, error: 'Invalid token type' };
    }
    
    const { prisma } = await import('@/lib/prisma');
    
    if (!prisma) {
      return { success: false, error: 'Database not available' };
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true
      }
    });
    
    if (!user || user.refreshTokenVersion !== decoded.version) {
      return { success: false, error: 'Invalid refresh token' };
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenVersion: { increment: 1 } }
    });
    
    return {
      success: true,
      accessToken: generateAccessToken(updatedUser),
      refreshToken: generateRefreshToken(updatedUser)
    };
    
  } catch (error) {
    console.error('[JWT] Refresh error:', error.message);
    return { success: false, error: 'Invalid refresh token' };
  }
}

// Edge-compatible token verification (for middleware)
export function verifyTokenEdge(token) {
  try {
    if (!token) {
      return { valid: false, error: 'No token provided' };
    }

    // Simple base64 decode to get payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }

    // Check if it's an access token
    if (payload.type !== 'access') {
      return { valid: false, error: 'Invalid token type' };
    }

    return { 
      valid: true, 
      decoded: {
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
        version: payload.version
      }
    };
  } catch (error) {
    console.error('[JWT Edge] Verification error:', error.message);
    return { valid: false, error: error.message };
  }
}