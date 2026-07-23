// middleware.js - Optimized with enhanced caching and granular access control
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
  '/api/auth/password-reset',
  '/api/settings' // Public settings API
]);

// ============================================
// BUSINESS MANAGEMENT ROUTES - Accessible by staff, manager, admin, super_admin
// ============================================
const BUSINESS_ROUTES = new Set([
  // Admin paths (for admin and super_admin)
  '/admin/products', '/api/admin/products',
  '/admin/quotes', '/api/admin/quotes',
  '/admin/customers', '/api/admin/customers',
  '/admin/reports', '/api/admin/reports',
  
  // Manager paths
  '/manager/products',
  '/manager/quotes',
  '/manager/customers',
  '/manager/reports',
  
  // Staff paths
  '/staff/products',
  '/staff/quotes',
  '/manager/customers', '/manager/customers/*',
  '/staff/customers', '/staff/customers/*',
]);

// ============================================
// ADMIN ONLY ROUTES - Only super_admin and admin
// ============================================
const ADMIN_ONLY_ROUTES = new Set([
  '/admin/users', '/api/admin/users',
  '/admin/roles', '/api/admin/roles',
  '/admin/permissions', '/api/admin/permissions',
  '/admin/security-logs', '/api/admin/security-logs',
  '/admin/backup', '/api/admin/backup',
  '/admin/settings', '/api/admin/settings'
]);

// ============================================
// MANAGER ONLY ROUTES - Only super_admin, admin, manager
// ============================================
const MANAGER_ROUTES = new Set([
  '/manager/staff', '/api/manager/users',
  '/manager/staff/add',
  '/dashboard/manager'
]);

// Check if path matches any route in a set
function matchesRoute(pathname, routeSet) {
  for (const route of routeSet) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return true;
    }
  }
  return false;
}

// Enhanced cache with LRU-like behavior
const tokenCache = new Map();
const CACHE_TTL = 5000; // 5 seconds
const MAX_CACHE_SIZE = 200;

function isPublicRoute(pathname) {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  for (const route of PUBLIC_ROUTES) {
    if (pathname.startsWith(route + '/')) return true;
  }
  for (const prefix of PUBLIC_API_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return true;
    }
  }
  return false;
}

// Enhanced JWT verification with better error handling
async function verifyTokenEdge(token) {
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
    
    const expBuffer = 5;
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

    tokenCache.set(token, { result, timestamp: Date.now() });
    
    if (tokenCache.size > MAX_CACHE_SIZE) {
      const now = Date.now();
      const entries = Array.from(tokenCache.entries());
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
  '.ttf', '.eot', '.mp4', '.webm', '.mp3', '.jfif'
]);

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();
  
  // Fast path: Skip static files immediately
  if (pathname.startsWith('/_next') || pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  // Fast path: Skip files with extensions
  const ext = pathname.split('.').pop();
  if (ext && STATIC_EXTENSIONS.has('.' + ext)) {
    return NextResponse.next();
  }
  
  // Fast path: Check public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Get token
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
  
  // Verify token
  const { valid, decoded } = await verifyTokenEdge(token);
  
  if (!valid) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('sessionToken');
    return response;
  }
  
  const userRole = getRoleFromDecoded(decoded);

  // ============================================
  // SUPER ADMIN - Full access to everything
  // ============================================
  if (userRole === 'super_admin') {
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      response.headers.set('x-user-id', decoded?.userId || '');
      response.headers.set('x-user-role', userRole);
      response.headers.set('x-response-time', `${Date.now() - startTime}ms`);
      return response;
    }
    return NextResponse.next();
  }

  // ============================================
  // ADMIN ONLY ROUTES - Only super_admin and admin
  // ============================================
  if (matchesRoute(pathname, ADMIN_ONLY_ROUTES)) {
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
      const dashboard = ROLE_DASHBOARDS[userRole] || '/dashboard/customer';
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    // Allow access for admin
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      response.headers.set('x-user-id', decoded?.userId || '');
      response.headers.set('x-user-role', userRole);
      response.headers.set('x-response-time', `${Date.now() - startTime}ms`);
      return response;
    }
    return NextResponse.next();
  }

  // ============================================
  // BUSINESS MANAGEMENT ROUTES - staff, manager, admin, super_admin
  // Includes both admin paths and role-specific paths
  // ============================================
  if (matchesRoute(pathname, BUSINESS_ROUTES)) {
    const hasBusinessAccess = ['staff', 'manager', 'admin', 'super_admin'].includes(userRole);
    
    if (!hasBusinessAccess) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden - Business management access required' }, { status: 403 });
      }
      const dashboard = ROLE_DASHBOARDS[userRole] || '/dashboard/customer';
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    
    // Allow access for authorized users
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      response.headers.set('x-user-id', decoded?.userId || '');
      response.headers.set('x-user-role', userRole);
      response.headers.set('x-response-time', `${Date.now() - startTime}ms`);
      return response;
    }
    return NextResponse.next();
  }

  // ============================================
  // MANAGER ONLY ROUTES - manager, admin, super_admin
  // ============================================
  if (matchesRoute(pathname, MANAGER_ROUTES) || pathname.startsWith('/manager/')) {
    const hasManagerAccess = ['manager', 'admin', 'super_admin'].includes(userRole);
    
    if (!hasManagerAccess) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 });
      }
      const dashboard = ROLE_DASHBOARDS[userRole] || '/dashboard/customer';
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      response.headers.set('x-user-id', decoded?.userId || '');
      response.headers.set('x-user-role', userRole);
      response.headers.set('x-response-time', `${Date.now() - startTime}ms`);
      return response;
    }
    return NextResponse.next();
  }

  // ============================================
  // STAFF SPECIFIC ROUTES
  // ============================================
  if (pathname.startsWith('/staff/')) {
    const hasStaffAccess = ['staff', 'manager', 'admin', 'super_admin'].includes(userRole);
    
    if (!hasStaffAccess) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden - Staff access required' }, { status: 403 });
      }
      const dashboard = ROLE_DASHBOARDS[userRole] || '/dashboard/customer';
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      response.headers.set('x-user-id', decoded?.userId || '');
      response.headers.set('x-user-role', userRole);
      response.headers.set('x-response-time', `${Date.now() - startTime}ms`);
      return response;
    }
    return NextResponse.next();
  }

  // ============================================
  // DASHBOARD ACCESS CHECK
  // ============================================
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