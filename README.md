🏗️ Mikias Building Materials - Enterprise Web Application
📋 Project Overview
This is a comprehensive enterprise-grade web application for Mikias Building Materials, a trusted supplier of building materials, hardware, sanitary, and electrical supplies in Addis Ababa, Ethiopia. The system provides a complete authentication and authorization solution with role-based access control, 2FA, session management, and business management features.

🎯 Features
Authentication & Security
✅ JWT Authentication with Refresh Token Rotation

✅ Two-Factor Authentication (2FA) with Email OTP and backup codes

✅ Brute Force Protection - 3 failed attempts = 30-second lockout

✅ Email Verification required for account activation

✅ Password Reset Flow with OTP-based security

✅ Session Management with inactivity timeout

✅ Production Anti-Tamper - Disables DevTools shortcuts

Authorization System (RBAC + PBAC)
5 System Roles:

👑 super_admin - Full system control

⚙️ admin - Administrative access

📊 manager - Operations management

🛠️ staff - Quote processing

👤 customer - View products & quotes

Granular Permissions:

Product Management (create, read, update, delete)

Quote Management (create, read, update, delete)

User Management (read, create, update, delete)

Role Management (read, create, update, delete)

Dashboard access

Reports & Analytics

Settings Management

Business Features
📦 Product Catalog - Categories, inventory, pricing

📄 Quote Request System - Customer quotes with status tracking

👥 Customer Management - Customer profiles and history

📊 Reports & Analytics - Business insights

📧 Email Notifications - Quote confirmations, updates

Admin Dashboard
👥 User Management - Add, edit, delete users

🎭 Role Management - Configure roles and permissions

🔑 Permission Management - Direct user permissions

📋 Security Logs - Complete audit trail

💾 System Backup - Database backups and restore

⚙️ System Settings - Configure application settings

🛠️ Tech Stack
Category	Technology
Framework	Next.js 16.2.10 (App Router)
Language	JavaScript
Database	PostgreSQL (Neon)
ORM	Prisma 7.8.0
Authentication	JWT with refresh rotation
Styling	Tailwind CSS 4
UI Components	Lucide React + Radix UI
Email	Nodemailer
Deployment	Vercel / Neon Console
🚀 Quick Start
Prerequisites
Node.js 18+

PostgreSQL 14+

npm or yarn

SMTP server (Gmail, SendGrid, etc.)

Installation
bash
# Clone the repository
git clone https://github.com/Nemona1/mikias-building-materials.git
cd mikias-building-materials

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and credentials

# Initialize database
npx prisma db push
npx prisma generate

# Seed database with demo data
node prisma/seed.js

# Start development server
npm run dev
Environment Variables
env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mikias_db"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars-different"

# Encryption Key
ENCRYPTION_KEY="your-32-character-encryption-key-here!!!"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@yourapp.com"

# Application URL
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
📂 Project Structure
text
mikias-building-materials/
├── app/
│   ├── admin/                 # Admin pages
│   │   ├── backup/           # Backup management
│   │   ├── permissions/      # Permission management
│   │   ├── roles/            # Role management
│   │   ├── security-logs/    # Security logs viewer
│   │   ├── settings/         # System settings
│   │   └── users/            # User management
│   ├── api/                   # API routes
│   │   ├── admin/            # Admin API endpoints
│   │   ├── auth/             # Authentication API
│   │   └── user/             # User API endpoints
│   ├── dashboard/             # Role-based dashboards
│   │   ├── admin/            # Admin dashboard
│   │   ├── customer/         # Customer dashboard
│   │   ├── manager/          # Manager dashboard
│   │   ├── staff/            # Staff dashboard
│   │   └── super-admin/      # Super admin dashboard
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   └── profile/              # User profile
├── components/
│   ├── admin/                # Admin components
│   ├── layout/               # Layout components
│   ├── profile/              # Profile components
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── auth/                 # Authentication utilities
│   ├── email/                # Email services
│   └── prisma.js             # Prisma client
├── hooks/                    # Custom React hooks
├── prisma/                   # Database schema
└── middleware.js             # Next.js middleware
🔐 Demo Accounts
Role	Email	Password	Dashboard
👑 Super Admin	superadmin@mikias.com	SuperAdmin@123	/dashboard/super-admin
⚙️ Admin	admin@mikias.com	Admin@123	/dashboard/admin
📊 Manager	manager@mikias.com	Manager@123	/dashboard/manager
🛠️ Staff	staff@mikias.com	Staff@123	/dashboard/staff
👤 Customer	customer@mikias.com	Customer@123	/dashboard/customer
🧪 Testing
bash
# Run database seed
node prisma/seed.js

# Start development server
npm run dev

# Run tests (if configured)
npm test
🚀 Deployment
Deploy to Vercel
bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
Deploy with Database (Neon)
Create a Neon PostgreSQL database

Update DATABASE_URL in production environment

Push schema: npx prisma db push

Seed database: node prisma/seed.js

🤝 Contributing
Fork the repository

Create your feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add some amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

📄 License
MIT © Nemona Hirko

📞 Support
Issues: GitHub Issues

Email: nemona2025hirko@gmail.com

Telegram: @zimita2025

🔴 CURRENT ISSUES & SOLUTIONS
CRITICAL ISSUE 1: Users Redirected to Login After Authentication
Problem Description
After successful login, all users are being redirected back to the login page instead of their respective dashboards.

Error Log:

text
[Middleware] User role: super_admin
[Middleware] Super admin - granting full access
POST /api/auth/login 200
GET /dashboard/super-admin 200
GET /login 200  ← User redirected back to login
Root Cause Analysis
Token Storage Issue: The JWT token might not be properly stored in cookies after login

Token Verification Fails: The middleware's verifyAccessToken function might be failing

Middleware Configuration: The middleware might not be correctly handling the authenticated state

Route Protection: Protected routes might be redirecting to login due to missing or invalid token

Files Involved:

middleware.js - Main authentication guard

app/api/auth/login/route.js - Login handler

lib/auth/jwt.js - JWT verification

app/dashboard/layout.js - Dashboard layout

🛠️ Solution
Step 1: Add Debugging to Middleware
javascript
// middleware.js
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Log all cookies for debugging
  console.log('[Middleware] All cookies:', request.cookies.getAll());
  
  // Get token from cookie
  let token = request.cookies.get('accessToken')?.value;
  console.log('[Middleware] Token found:', !!token);
  
  // If no token, check Authorization header
  if (!token) {
    token = request.headers.get('authorization')?.replace('Bearer ', '');
    console.log('[Middleware] Token from header:', !!token);
  }
  
  // If token exists, verify it
  if (token) {
    const { valid, decoded } = await verifyAccessToken(token);
    console.log('[Middleware] Token valid:', valid);
    if (valid) {
      console.log('[Middleware] User role:', decoded?.role);
    }
  }
  
  // ... rest of middleware
}
Step 2: Fix Login Route Token Setting
javascript
// app/api/auth/login/route.js
// Ensure tokens are properly set in cookies
const response = NextResponse.json({
  success: true,
  accessToken,
  refreshToken,
  sessionToken,
  redirectUrl,
  user: { ... }
});

// Set cookies with proper options
response.cookies.set('accessToken', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 15 * 60 // 15 minutes
});

response.cookies.set('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 // 7 days
});

response.cookies.set('sessionToken', sessionToken, {
  httpOnly: false,
  secure: false,
  sameSite: 'lax',
  path: '/',
  maxAge: 3600 // 1 hour
});
Step 3: Update JWT Verification
javascript
// lib/auth/jwt.js
export async function verifyAccessToken(token) {
  try {
    console.log('[JWT] Verifying token, length:', token?.length);
    
    if (!token) {
      console.log('[JWT] No token provided');
      return { valid: false, error: 'No token provided' };
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[JWT] Token verified successfully');
    console.log('[JWT] Decoded:', { 
      userId: decoded.userId, 
      role: decoded.role,
      type: decoded.type 
    });
    
    return { valid: true, decoded };
    
  } catch (error) {
    console.error('[JWT] Verification failed:', error.message);
    return { valid: false, error: error.message };
  }
}
Step 4: Fix Dashboard Layout
javascript
// app/dashboard/layout.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    console.log('[Dashboard Layout] User:', user);
    console.log('[Dashboard Layout] Loading:', isLoading);
    
    if (!isLoading && !user) {
      console.log('[Dashboard Layout] No user, redirecting to login');
      router.push('/login');
    }
  }, [user, isLoading, router]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard layout */}
      {children}
    </div>
  );
}
CRITICAL ISSUE 2: SettingsInitializer 401 Unauthorized Error
Problem Description
The SettingsInitializer component is receiving a 401 Unauthorized error when trying to initialize system settings.

Error Log:

text
POST http://localhost:3000/api/admin/settings/init 401 (Unauthorized)
[Settings] Initialization failed
Root Cause Analysis
SettingsInitializer is called on every page load (including the landing page)

It attempts to call /api/admin/settings/init to initialize default settings

The endpoint currently requires authentication (admin access)

On the landing page, the user is not logged in, causing 401 error

This prevents settings from being initialized on first run

🛠️ Solution
Step 1: Make Settings Init Public
javascript
// app/api/admin/settings/init/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initializeSettings } from '@/lib/settings';

export async function POST(request) {
  try {
    // PUBLIC endpoint - no auth required
    // Only creates default settings if they don't exist
    
    console.log('[Settings Init] Checking if settings exist...');
    const existingSettings = await prisma.systemSetting.count();
    
    if (existingSettings === 0) {
      console.log('[Settings Init] No settings found, initializing...');
      await initializeSettings();
      return NextResponse.json({ 
        success: true, 
        message: 'Settings initialized successfully',
        initialized: true 
      });
    }
    
    console.log('[Settings Init] Settings already exist, count:', existingSettings);
    return NextResponse.json({ 
      success: true, 
      message: 'Settings already exist',
      initialized: false,
      count: existingSettings
    });
  } catch (error) {
    console.error('[Settings Init] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
Step 2: Update SettingsInitializer Component
javascript
// components/SettingsInitializer.jsx
'use client';

import { useEffect, useState } from 'react';

export function SettingsInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initSettings = async () => {
      if (initialized) return;
      
      try {
        const response = await fetch('/api/admin/settings/init', {
          method: 'POST',
          // No auth headers - this is public
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.initialized) {
            console.log('[Settings] ✅ Initialized successfully');
          } else {
            console.log('[Settings] ℹ️ Settings already exist');
          }
          setInitialized(true);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.warn('[Settings] ⚠️ Initialization failed:', errorData.error || 'Unknown error');
          setInitialized(true);
        }
      } catch (error) {
        console.error('[Settings] ❌ Error:', error);
        setInitialized(true);
      }
    };

    initSettings();
  }, [initialized]);

  return null;
}
🟡 Secondary Issues
Issue 3: Navbar Site Name Fetch
Problem: Navbar tries to fetch site name from /api/admin/settings which requires auth

Solution: Add fallback to default name when not authenticated

javascript
// In Navbar.jsx
const fetchSiteName = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    setSiteName('Mikias Building Materials');
    return;
  }
  
  try {
    const res = await fetch('/api/admin/settings?category=general', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setSiteName(data.settings?.siteName || 'Mikias Building Materials');
    } else {
      setSiteName('Mikias Building Materials');
    }
  } catch {
    setSiteName('Mikias Building Materials');
  }
};
Issue 4: Middleware Admin Routes
Problem: Some admin routes are not properly protected

Solution: Update middleware to properly handle role-based access

javascript
// In middleware.js
// Ensure admin routes are protected
if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
  const hasAdminAccess = ['super_admin', 'admin'].includes(userRole);
  if (!hasAdminAccess) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
✅ Verification Steps
Clear browser cookies and localStorage

Restart dev server: npm run dev

Check console for "Settings Initialized successfully" message

Verify navbar shows "Mikias Building Materials"

Login with demo account

Verify redirect to correct dashboard

Test admin routes access

📝 Notes for Next Session
⚡ Priority 1 Tasks
Fix Authentication Redirect Issue

Add debugging to middleware

Fix token storage

Test all roles

Fix SettingsInitializer 401 Error

Make /api/admin/settings/init public

Remove auth check from SettingsInitializer

Test on fresh browser

📋 Priority 2 Tasks
Update Navbar

Add fallback for site name when not authenticated

Test with and without login

Verify Middleware

Test all admin routes with different roles

Ensure proper redirects

Email Configuration

Set up SMTP for production

Test email sending (2FA, verification, quotes)

🧪 Testing Checklist
□ Landing page loads without errors
□ Settings initialize on first load
□ Login works with demo accounts
□ Super Admin redirects to /dashboard/super-admin
□ Admin redirects to /dashboard/admin
□ Manager redirects to /dashboard/manager
□ Staff redirects to /dashboard/staff
□ Customer redirects to /dashboard/customer
□ Session persists after page refresh
□ Logout works correctly
□ Admin routes accessible by super_admin and admin
□ Customer routes accessible by customer
□ 2FA works (email OTP)
□ Password reset works
□ Session management works
📁 Critical Files to Modify
File	Purpose	Priority
middleware.js	Main authentication guard	🔴 Critical
app/api/auth/login/route.js	Login handler	🔴 Critical
lib/auth/jwt.js	JWT verification	🔴 Critical
app/dashboard/layout.js	Dashboard layout	🔴 Critical
hooks/useAuth.js	Auth hook	🔴 Critical
app/api/admin/settings/init/route.js	Settings init	🔴 Critical
components/SettingsInitializer.jsx	Settings init component	🔴 Critical
components/layout/Navbar.jsx	Navigation	🟡 High
lib/auth/permissions.js	Permission system	🟡 High
app/api/auth/me/route.js	User info endpoint	🟡 High