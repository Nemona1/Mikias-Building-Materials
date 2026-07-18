# 🏗️ Mikias Building Materials - Enterprise Web Application

## 📋 Project Overview

This is a comprehensive enterprise-grade web application for **Mikias Building Materials**, a trusted supplier of building materials, hardware, sanitary, and electrical supplies in Addis Ababa, Ethiopia. The system provides a complete authentication and authorization solution with role-based access control, 2FA, session management, and business management features.

## 🎯 Features

### Authentication & Security
- ✅ **JWT Authentication** with Refresh Token Rotation
- ✅ **Two-Factor Authentication (2FA)** with Email OTP and backup codes
- ✅ **Brute Force Protection** - 3 failed attempts = 30-second lockout
- ✅ **Email Verification** required for account activation
- ✅ **Password Reset Flow** with OTP-based security
- ✅ **Session Management** with inactivity timeout
- ✅ **Production Anti-Tamper** - Disables DevTools shortcuts

### Authorization System (RBAC + PBAC)
- **5 System Roles:**
  - 👑 `super_admin` - Full system control
  - ⚙️ `admin` - Administrative access
  - 📊 `manager` - Operations management
  - 🛠️ `staff` - Quote processing
  - 👤 `customer` - View products & quotes

- **Granular Permissions:**
  - Product Management (create, read, update, delete)
  - Quote Management (create, read, update, delete)
  - User Management (read, create, update, delete)
  - Role Management (read, create, update, delete)
  - Dashboard access
  - Reports & Analytics
  - Settings Management

### Business Features
- 📦 **Product Catalog** - Categories, inventory, pricing
- 📄 **Quote Request System** - Customer quotes with status tracking
- 👥 **Customer Management** - Customer profiles and history
- 📊 **Reports & Analytics** - Business insights
- 📧 **Email Notifications** - Quote confirmations, updates

### Admin Dashboard
- 👥 **User Management** - Add, edit, delete users
- 🎭 **Role Management** - Configure roles and permissions
- 🔑 **Permission Management** - Direct user permissions
- 📋 **Security Logs** - Complete audit trail
- 💾 **System Backup** - Database backups and restore
- ⚙️ **System Settings** - Configure application settings

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.2.10 (App Router) |
| Language | JavaScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7.8.0 |
| Authentication | JWT with refresh rotation |
| Styling | Tailwind CSS 4 |
| UI Components | Lucide React + Radix UI |
| Email | Nodemailer |
| Deployment | Vercel / Neon Console |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- SMTP server (Gmail, SendGrid, etc.)

### Installation

```bash
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

Part 3: Current Issues & Solutions
🔴 CURRENT CRITICAL ISSUE
SettingsInitializer 401 Unauthorized Error
Problem Description
The SettingsInitializer component is receiving a 401 Unauthorized error when trying to initialize system settings.

Error Log:

text
POST http://localhost:3000/api/admin/settings/init 401 (Unauthorized)
[Settings] Initialization failed
File Location:

components/SettingsInitializer.jsx

app/api/admin/settings/init/route.js

Root Cause Analysis
SettingsInitializer is called on every page load (including the landing page)

It attempts to call /api/admin/settings/init to initialize default settings

The endpoint currently requires authentication (admin access)

On the landing page, the user is not logged in, causing 401 error

This prevents settings from being initialized on first run

Why This Is Problematic
System settings (site name, description, etc.) are needed before login

The navbar and landing page need settings to display correctly

New installations will have no settings initialized

🛠️ Solution
Solution 1: Make Settings Init Public (Recommended)
Step 1: Update app/api/admin/settings/init/route.js

javascript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initializeSettings } from '@/lib/settings';

export async function POST(request) {
  try {
    // PUBLIC endpoint - no auth required
    // Only creates default settings if they don't exist
    
    const existingSettings = await prisma.systemSetting.count();
    
    if (existingSettings === 0) {
      await initializeSettings();
      return NextResponse.json({ 
        success: true, 
        message: 'Settings initialized successfully',
        initialized: true 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Settings already exist',
      initialized: false
    });
  } catch (error) {
    console.error('[Settings Init] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
Step 2: Update components/SettingsInitializer.jsx

javascript
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
          }
          setInitialized(true);
        } else {
          console.warn('[Settings] ⚠️ Initialization failed');
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
Issue 2: Navbar Site Name Fetch
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
Issue 3: Middleware Admin Routes
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

Test admin routes access

📝 Notes for Next Session
Priority: Fix SettingsInitializer - This is blocking other features

Update Navbar - Add fallback for site name

Review Middleware - Ensure all admin routes are properly protected

Test 2FA - Verify email sending works

Test Email Service - Configure SMTP for production

Part 4: Next Steps for Development Session
⚡ Immediate Tasks (Priority 1)
Fix SettingsInitializer 401 Error

Make /api/admin/settings/init public

Remove auth check from SettingsInitializer

Test on fresh browser

Update Navbar

Add fallback for site name when not authenticated

Test with and without login

Verify Middleware

Test all admin routes with different roles

Ensure proper redirects

📋 Secondary Tasks (Priority 2)
Email Configuration

Set up SMTP for production

Test email sending (2FA, verification, quotes)

Product Management

Complete CRUD operations

Add image upload support

Quote Management

Complete quote processing flow

Add email notifications for quotes

🧪 Testing Checklist
Landing page loads without errors

Settings initialize on first load

Login works with demo accounts

Admin routes accessible by admin/super_admin

Customer routes accessible by customer

2FA works (email OTP)

Password reset works

Session management works

