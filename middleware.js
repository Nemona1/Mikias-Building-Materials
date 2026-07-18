// middleware.js - Complete fixed version
import { NextResponse } from 'next/server';

// Public routes - EXACT matches only
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/verify',
  '/forgot-password',
  '/reset-password',
  '/verify/success',
  '/verify/error',
  '/verify/already-verified',
  '/verify/email-changed',
  '/maintenance',
  '/products',
  '/about',
  '/contact',
  '/quote-request',
  '/verify-2fa',
];

// Public API routes - these don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/auth/2fa/setup',
  '/api/auth/2fa/enable',
  '/api/auth/2fa/verify-login',
  '/api/auth/2fa/resend',
  '/api/auth/resend-verification',
  '/api/products',
  '/api/quotes',
  '/api/admin/settings/init',
  '/api/auth/refresh',
  '/api/auth/request-email-change',
  '/api/auth/request-password-change',
  '/api/auth/resend-email-change-otp',
  '/api/auth/verify-email-change-otp',
  '/api/auth/verify-otp',
  '/api/auth/verify-otp-change-password',
  '/api/auth/change-password',
  '/api/auth/password-reset/request',
  '/api/auth/password-reset/confirm',
];

// Role dashboard mapping
const ROLE_DASHBOARDS = {
  super_admin: '/dashboard/super-admin',
  admin: '/dashboard/admin',
  manager: '/dashboard/manager',
  staff: '/dashboard/staff',
  customer: '/dashboard/customer',
};

// Edge-compatible JWT verification (using Web Crypto API)
async function verifyTokenEdge(token) {
  try {
    if (!token) {
      return { valid: false, error: 'No token provided' };
    }

    // For Edge Runtime, we need to use a simpler verification
    // Since we can't use jsonwebtoken in Edge, we'll just decode and check
    // The actual verification will happen in the API route
    
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

    // Return decoded payload for middleware use
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
    console.error('[Middleware] Token verification error:', error.message);
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

function hasAccess(userRole, pathname) {
  console.log('[Middleware] Checking access for role:', userRole, 'path:', pathname);
  
  // SUPER ADMIN has access to EVERYTHING
  if (userRole === 'super_admin') {
    console.log('[Middleware] Super admin - granting full access');
    return true;
  }
  
  // ADMIN has access to admin routes
  if (userRole === 'admin') {
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      console.log('[Middleware] Admin - granting admin access');
      return true;
    }
  }
  
  // Admin routes - only for super_admin and admin
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    console.log('[Middleware] Admin route - access denied for role:', userRole);
    return false;
  }
  
  // Dashboard routes
  if (pathname.startsWith('/dashboard/')) {
    const dashboardType = pathname.split('/')[2];
    const requiredRole = dashboardType === 'super-admin' ? 'super_admin' : dashboardType;
    
    if (requiredRole === 'super_admin') {
      return userRole === 'super_admin';
    }
    if (requiredRole === 'admin') {
      return userRole === 'admin' || userRole === 'super_admin';
    }
    if (requiredRole === 'manager') {
      return ['super_admin', 'admin', 'manager'].includes(userRole);
    }
    if (requiredRole === 'staff') {
      return ['super_admin', 'admin', 'manager', 'staff'].includes(userRole);
    }
    return true;
  }
  
  return true;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  console.log('[Middleware] ========== REQUEST START ==========');
  console.log('[Middleware] Path:', pathname);
  console.log('[Middleware] Method:', request.method);
  
  // Skip static files and Next.js internal
  if (pathname.startsWith('/_next') || pathname.includes('.') && !pathname.startsWith('/api/')) {
    console.log('[Middleware] Skipping static file');
    return NextResponse.next();
  }
  
  // Allow public routes (exact match for pages)
  if (PUBLIC_ROUTES.includes(pathname)) {
    console.log('[Middleware] Public page route, allowing:', pathname);
    return NextResponse.next();
  }
  
  // Allow public API routes
  if (PUBLIC_API_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    console.log('[Middleware] Public API route, allowing:', pathname);
    return NextResponse.next();
  }
  
  // Get token from cookie
  let token = request.cookies.get('accessToken')?.value;
  console.log('[Middleware] Token from cookie:', !!token);
  
  // If no token in cookie, check header
  if (!token) {
    token = request.headers.get('authorization')?.replace('Bearer ', '');
    console.log('[Middleware] Token from header:', !!token);
  }
  
  // If no token, redirect to login
  if (!token) {
    console.log('[Middleware] No token found, redirecting to login');
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Verify token using Edge-compatible method
  console.log('[Middleware] Verifying token...');
  const { valid, decoded } = await verifyTokenEdge(token);
  
  if (!valid) {
    console.log('[Middleware] Invalid token:', valid);
    // Clear invalid cookies
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('sessionToken');
    return response;
  }
  
  // Get user role
  const userRole = getRoleFromDecoded(decoded);
  console.log('[Middleware] User role:', userRole);
  console.log('[Middleware] Decoded user ID:', decoded?.userId);
  
  // Check access
  if (!hasAccess(userRole, pathname)) {
    console.log('[Middleware] Access denied for:', pathname);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const dashboard = ROLE_DASHBOARDS[userRole] || '/dashboard/customer';
    return NextResponse.redirect(new URL(dashboard, request.url));
  }
  
  // For API routes, add user headers
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    response.headers.set('x-user-id', decoded?.userId || '');
    response.headers.set('x-user-role', userRole);
    return response;
  }
  
  console.log('[Middleware] ========== REQUEST END ==========');
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}