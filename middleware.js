// middleware.js - Optimized with enhanced caching and performance
import { NextResponse } from 'next/server';

// Use Sets for O(1) lookups instead of arrays
const PUBLIC_ROUTES = new Set([
  '/', '/login', '/register', '/verify', '/forgot-password',
  '/reset-password', '/verify/success', '/verify/error',
  '/verify/already-verified', '/verify/email-changed',
  '/maintenance', '/products', '/about', '/contact',
  '/quote-request', '/verify-2fa', '/profile',
  // Add uploads path for images - FIX FOR IMAGES
  '/uploads'
]);

// Use Set and prefix matching for API routes
const PUBLIC_API_PREFIXES = new Set([
  '/api/health', '/api/auth/login', '/api/auth/register',
  '/api/auth/verify', '/api/auth/forgot-password',
  '/api/auth/reset-password', '/api/auth/me', '/api/auth/logout',
  '/api/auth/2fa', '/api/auth/resend-verification',
  '/api/products', '/api/quotes', '/api/admin/settings/init',
  '/api/auth/refresh', '/api/auth/request-email-change',
  '/api/auth/request-password-change',
  '/api/auth/resend-email-change-otp',
  '/api/auth/verify-email-change-otp', '/api/auth/verify-otp',
  '/api/auth/verify-otp-change-password', '/api/auth/change-password',
  '/api/auth/password-reset'
]);

// Enhanced cache with LRU-like behavior
const tokenCache = new Map();
const CACHE_TTL = 5000; // 5 seconds
const MAX_CACHE_SIZE = 200;

// Cache for API response times
const apiCache = new Map();
const API_CACHE_TTL = 60000; // 1 minute

function isPublicRoute(pathname) {
  // Check exact matches
  if (PUBLIC_ROUTES.has(pathname)) return true;
  
  // Check if path starts with any public route (for subpaths)
  for (const route of PUBLIC_ROUTES) {
    if (pathname.startsWith(route + '/')) return true;
  }
  
  // Check API prefixes
  for (const prefix of PUBLIC_API_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return true;
    }
  }
  return false;
}

// Enhanced JWT verification with better error handling
async function verifyTokenEdge(token) {
  // Check cache first
  const cached = tokenCache.get(token);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  try {
    if (!token) {
      return { valid: false, error: 'No token provided' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    let payload;
    try {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(base64);
      payload = JSON.parse(decoded);
    } catch (e) {
      try {
        const decoded = Buffer.from(parts[1], 'base64').toString();
        payload = JSON.parse(decoded);
      } catch (e2) {
        return { valid: false, error: 'Failed to decode token' };
      }
    }
    
    // Check expiration with small buffer for clock skew
    const expBuffer = 5; // 5 seconds buffer
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000) - expBuffer) {
      tokenCache.delete(token);
      return { valid: false, error: 'Token expired' };
    }

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

    // Cache the result with LRU cleanup
    tokenCache.set(token, { result, timestamp: Date.now() });
    
    // Clean up old cache entries
    if (tokenCache.size > MAX_CACHE_SIZE) {
      const now = Date.now();
      const entries = Array.from(tokenCache.entries());
      // Sort by timestamp and remove oldest
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 2));
      for (const [key] of toDelete) {
        tokenCache.delete(key);
      }
    }

    return result;
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function getRoleFromDecoded(decoded) {
  if (!decoded) return 'customer';
  if (decoded.role) {
    if (typeof decoded.role === 'string') return decoded.role;
    if (decoded.role.name) return decoded.role.name;
  }
  return 'customer';
}

const ROLE_DASHBOARDS = {
  super_admin: '/dashboard/super-admin',
  admin: '/dashboard/admin',
  manager: '/dashboard/manager',
  staff: '/dashboard/staff',
  customer: '/dashboard/customer',
};

// Fast path check for static assets
const STATIC_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
  '.css', '.js', '.ico', '.json', '.woff', '.woff2',
  '.ttf', '.eot', '.mp4', '.webm', '.mp3', '.jfif' // Added .jfif
]);

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();
  
  // Fast path: Skip static files immediately
  if (pathname.startsWith('/_next') || pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  // Fast path: Skip files with extensions (images, etc.)
  const ext = pathname.split('.').pop();
  if (ext && STATIC_EXTENSIONS.has('.' + ext)) {
    return NextResponse.next();
  }
  
  // Fast path: Check public routes (including /uploads)
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Get token - only if needed (not for public routes)
  let token = request.cookies.get('accessToken')?.value;
  if (!token) {
    token = request.headers.get('authorization')?.replace('Bearer ', '');
  }
  
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Verify token (with caching)
  const { valid, decoded } = await verifyTokenEdge(token);
  
  if (!valid) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('sessionToken');
    return response;
  }
  
  const userRole = getRoleFromDecoded(decoded);
  
  // Role-based access check (fast path for common cases)
  if (userRole === 'super_admin') {
    // Super admin has full access - skip further checks
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      response.headers.set('x-user-id', decoded?.userId || '');
      response.headers.set('x-user-role', userRole);
      // Add performance headers
      response.headers.set('x-response-time', `${Date.now() - startTime}ms`);
      return response;
    }
    return NextResponse.next();
  }
  
  // Check admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const dashboard = ROLE_DASHBOARDS[userRole] || '/dashboard/customer';
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
  }
  
  // Dashboard access check
  if (pathname.startsWith('/dashboard/')) {
    const dashboardType = pathname.split('/')[2];
    if (dashboardType === 'super-admin' && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole] || '/dashboard/customer', request.url));
    }
    if (dashboardType === 'admin' && !['super_admin', 'admin'].includes(userRole)) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole] || '/dashboard/customer', request.url));
    }
    if (dashboardType === 'manager' && !['super_admin', 'admin', 'manager'].includes(userRole)) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole] || '/dashboard/customer', request.url));
    }
    if (dashboardType === 'staff' && !['super_admin', 'admin', 'manager', 'staff'].includes(userRole)) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole] || '/dashboard/customer', request.url));
    }
  }
  
  // Profile route - allow all authenticated users
  if (pathname === '/profile' || pathname.startsWith('/profile/')) {
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      response.headers.set('x-user-id', decoded?.userId || '');
      response.headers.set('x-user-role', userRole);
      return response;
    }
    return NextResponse.next();
  }
  
  // For API routes, add user headers
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    response.headers.set('x-user-id', decoded?.userId || '');
    response.headers.set('x-user-role', userRole);
    response.headers.set('x-response-time', `${Date.now() - startTime}ms`);
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|sw.js|workbox-*.js|.*\\.(?:jpg|jpeg|png|gif|svg|webp|css|js|ico|json|woff|woff2|ttf|eot|mp4|webm|mp3|jfif)).*)',
  ],
};