# 🏗️ Mikias Building Materials - Enterprise Web Application

## 📋 Project Overview

This is a comprehensive enterprise-grade web application for **Mikias Building Materials**, a trusted supplier of building materials, hardware, sanitary, and electrical supplies in Addis Ababa, Ethiopia. The system provides a complete authentication and authorization solution with role-based access control, 2FA, session management, and business management features.

**Live Demo:** [https://mikias-building-materials.vercel.app](https://mikias-building-materials.vercel.app)

---

## 🎯 Features

### Authentication & Security
- ✅ JWT Authentication with Refresh Token Rotation
- ✅ Two-Factor Authentication (2FA) with Email OTP and backup codes
- ✅ Brute Force Protection - 3 failed attempts = 30-second lockout
- ✅ Email Verification required for account activation
- ✅ Password Reset Flow with OTP-based security
- ✅ Session Management with inactivity timeout
- ✅ Production Anti-Tamper - Disables DevTools shortcuts

### Authorization System (RBAC + PBAC)
**5 System Roles:**
- 👑 **super_admin** - Full system control
- ⚙️ **admin** - Administrative access
- 📊 **manager** - Operations management
- 🛠️ **staff** - Quote processing
- 👤 **customer** - View products & quotes

**Granular Permissions:**
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
- 🖼️ **Image Upload** - Product images with preview

### Admin Dashboard
- 👥 User Management - Add, edit, delete users
- 🎭 Role Management - Configure roles and permissions
- 🔑 Permission Management - Direct user permissions
- 📋 Security Logs - Complete audit trail
- 💾 System Backup - Database backups and restore
- ⚙️ System Settings - Configure application settings

### Performance Optimizations
- ⚡ **API Caching** - In-memory caching with TTL
- 🚀 **Middleware Optimizations** - Token caching, Set-based lookups
- 📦 **Code Splitting** - Dynamic imports for heavy components
- 🖼️ **Image Optimization** - Lazy loading, WebP support
- 🔄 **Smart Refresh** - Content-only refresh without page reload

---

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
| File Upload | Multer / Custom |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or Neon account)
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
│   │   ├── products/         # Product management
│   │   ├── roles/            # Role management
│   │   ├── security-logs/    # Security logs viewer
│   │   ├── settings/         # System settings
│   │   └── users/            # User management
│   ├── api/                   # API routes
│   │   ├── admin/            # Admin API endpoints
│   │   ├── auth/             # Authentication API
│   │   ├── customer/         # Customer API endpoints
│   │   └── products/         # Products API
│   ├── dashboard/             # Role-based dashboards
│   │   ├── admin/            # Admin dashboard
│   │   ├── customer/         # Customer dashboard
│   │   ├── manager/          # Manager dashboard
│   │   ├── staff/            # Staff dashboard
│   │   └── super-admin/      # Super admin dashboard
│   ├── login/                # Login page
│   ├── products/             # Public products page
│   ├── profile/              # User profile
│   └── register/             # Registration page
├── components/
│   ├── admin/                # Admin components
│   ├── layout/               # Layout components
│   ├── products/             # Product components
│   ├── profile/              # Profile components
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── auth/                 # Authentication utilities
│   ├── email/                # Email services
│   └── prisma.js             # Prisma client
├── hooks/                    # Custom React hooks
├── prisma/                   # Database schema
├── public/
│   └── uploads/              # Uploaded images
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
Push code to GitHub

bash
git add .
git commit -m "Ready for deployment"
git push origin main
Import project on Vercel

Go to vercel.com

Click "Add New" → "Project"

Select your GitHub repository

Click "Import"

Add Environment Variables

Add all variables from .env.example

Set NEXTAUTH_URL to your Vercel URL

Set NODE_ENV to production

Deploy

Click "Deploy"

Wait for build to complete

Deploy with Database (Neon)
Create Neon Database

Go to neon.tech

Create a new project

Copy the pooled connection string

Push Schema

bash
npx prisma db push
Seed Database

bash
node prisma/seed.js
Environment Variables for Production
env
DATABASE_URL="postgresql://user:password@host-pooler.region.aws.neon.tech/db?sslmode=require"
NEXTAUTH_URL="https://your-app.vercel.app"
FRONTEND_URL="https://your-app.vercel.app"
NODE_ENV="production"
📊 Performance Optimizations
Implemented
API Caching: In-memory caching with 1-minute TTL

Middleware Caching: Token caching with 5-second TTL

Image Optimization: Lazy loading, WebP support

Code Splitting: Dynamic imports for heavy components

Memoization: useMemo, useCallback for expensive operations

Prefetching: Link prefetch on hover

Smart Refresh: Content-only refresh without page reload

Performance Metrics
API Response Time: ~50ms (cached)

Page Load Time: ~1.2s (initial)

Time to Interactive: ~1.5s

Lighthouse Score: 95+

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

🔴 Known Issues & Solutions
Issue 1: Images Not Displaying on Public Products Page
Problem: Product images show "No Image" on the public products page.

Solution: Ensure images are in the correct directory:

bash
# Check if images exist
ls -la public/uploads/products/

# If not, upload images through admin panel
# Or copy existing images
cp -r uploads/products/* public/uploads/products/
Issue 2: SettingsInitializer 401 Error
Problem: SettingsInitializer receives 401 Unauthorized error on first load.

Solution: The /api/admin/settings/init endpoint is now public. No action needed.

Issue 3: Session Expiration
Problem: Users are redirected to login after session expires.

Solution: Session timeout is configured in .env:

env
INACTIVITY_TIMEOUT_SECONDS="3600"  # 1 hour
✅ Testing Checklist
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
□ Product images display correctly
□ Image upload works
□ Quote creation works
□ Email notifications work
📁 Critical Files
File	Purpose	Priority
middleware.js	Main authentication guard	🔴 Critical
app/api/auth/login/route.js	Login handler	🔴 Critical
lib/auth/jwt.js	JWT verification	🔴 Critical
app/dashboard/layout.js	Dashboard layout	🔴 Critical
hooks/useAuth.js	Auth hook	🔴 Critical
components/SettingsInitializer.jsx	Settings init component	🔴 Critical
components/layout/Navbar.jsx	Navigation	🟡 High
lib/auth/permissions.js	Permission system	🟡 High
📝 Changelog
v2.0.0 (Current)
✅ Added image upload functionality

✅ Implemented caching for API routes

✅ Added smart refresh for dashboards

✅ Optimized middleware performance

✅ Added code splitting for modals

✅ Fixed image display on public products page

✅ Added deployment documentation

v1.0.0
✅ Initial release

✅ Authentication system

✅ Role-based access control

✅ Product management

✅ Quote management

✅ Admin dashboard



Access Control Summary
Role	Business Management (Products, Quotes, Customers, Reports)	System Admin (Users, Roles, Permissions, Settings)	Staff Management
Super Admin	✅ Full Access	✅ Full Access	✅ Full Access
Admin	✅ Full Access	✅ Full Access	✅ Full Access
Manager	✅ Full Access	❌ No Access	✅ Full Access
Staff	✅ Full Access	❌ No Access	❌ No Access
Customer	❌ No Access	❌ No Access	❌ No Access
Key Changes
Staff now has access to:

Products management (/admin/products)

Quotes management (/admin/quotes)

But NOT customers or reports (only staff dashboard)

Manager now has access to:

All Business Management routes (products, quotes, customers, reports)

Staff Management routes

But NOT System Administration routes (users, roles, permissions, settings)

Admin has access to:

All System Administration routes

All Business Management routes

Super Admin has access to:

Everything

This response is AI-generated, for reference only.


Built with ❤️ for Mikias Building Materials