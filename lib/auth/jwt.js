// lib/auth/jwt.js - Optimized with caching and performance improvements
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Cache for user lookups to reduce database queries
const userCache = new Map();
const USER_CACHE_TTL = 60000; // 1 minute
const MAX_USER_CACHE_SIZE = 100;

function getUserCacheKey(userId) {
  return `user:${userId}`;
}

function cacheUser(key, data) {
  if (userCache.size >= MAX_USER_CACHE_SIZE) {
    const oldestKey = userCache.keys().next().value;
    userCache.delete(oldestKey);
  }
  userCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function getCachedUser(key) {
  const cached = userCache.get(key);
  if (cached && Date.now() - cached.timestamp < USER_CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    userCache.delete(key);
  }
  return null;
}

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
      
      // Check cache first
      const cacheKey = getUserCacheKey(decoded.userId);
      let user = getCachedUser(cacheKey);
      
      if (!user) {
        // Fetch from database with optimized select
        user = await prisma.user.findUnique({
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
        
        if (user) {
          cacheUser(cacheKey, user);
        }
      }
      
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
    
    // Check cache first
    const cacheKey = getUserCacheKey(decoded.userId);
    let user = getCachedUser(cacheKey);
    
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          role: true
        }
      });
    }
    
    if (!user || user.refreshTokenVersion !== decoded.version) {
      return { success: false, error: 'Invalid refresh token' };
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenVersion: { increment: 1 } }
    });
    
    // Clear cache for this user
    userCache.delete(cacheKey);
    
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

// Edge-compatible token verification (for middleware) - Optimized with caching
const edgeTokenCache = new Map();
const EDGE_CACHE_TTL = 5000; // 5 seconds

export function verifyTokenEdge(token) {
  try {
    if (!token) {
      return { valid: false, error: 'No token provided' };
    }

    // Check cache first
    const cached = edgeTokenCache.get(token);
    if (cached && Date.now() - cached.timestamp < EDGE_CACHE_TTL) {
      return cached.result;
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
      edgeTokenCache.delete(token);
      return { valid: false, error: 'Token expired' };
    }

    // Check if it's an access token
    if (payload.type !== 'access') {
      return { valid: false, error: 'Invalid token type' };
    }

    const result = { 
      valid: true, 
      decoded: {
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
        version: payload.version
      }
    };

    // Cache the result
    edgeTokenCache.set(token, { result, timestamp: Date.now() });
    
    // Clean up old cache entries
    if (edgeTokenCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of edgeTokenCache) {
        if (now - value.timestamp > EDGE_CACHE_TTL * 2) {
          edgeTokenCache.delete(key);
        }
      }
    }

    return result;
  } catch (error) {
    console.error('[JWT Edge] Verification error:', error.message);
    return { valid: false, error: error.message };
  }
}

// Clear cache for a specific user
export function clearUserCache(userId) {
  const cacheKey = getUserCacheKey(userId);
  userCache.delete(cacheKey);
}

// Clear all caches (for testing or admin)
export function clearAllCaches() {
  userCache.clear();
  edgeTokenCache.clear();
}