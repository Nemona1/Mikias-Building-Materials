// app/api/manager/users/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logSecurityEvent } from '@/lib/security-log';
import bcrypt from 'bcryptjs';
import { sendUserCredentialsEmail } from '@/lib/email/sendUserCredentialsEmail';

// GET - Get staff members (only staff role)
export async function GET(request) {
  try {
    console.log('[Manager Users API] GET request received');
    
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Check if user has manager access or higher
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });
    
    const roleName = user?.role?.name?.toLowerCase() || 'customer';
    const allowedRoles = ['manager', 'admin', 'super_admin'];
    
    if (!allowedRoles.includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 });
    }
    
    // Get query params for pagination
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const page = parseInt(url.searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;
    const search = url.searchParams.get('search') || '';
    
    // Build where clause - ONLY STAFF
    const where = {
      role: {
        name: 'staff'
      }
    };
    
    // Add search filter
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count
    const total = await prisma.user.count({ where });
    
    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      include: {
        role: true,
        userRoles: {
          include: {
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip
    });
    
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      companyName: user.companyName,
      isVerified: user.isVerified,
      role: user.role,
      userRoles: user.userRoles,
      twoFactorEnabled: user.twoFactorEnabled,
      isActive: user.isActive !== false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    return NextResponse.json({
      users: sanitizedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('[Manager Users API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff: ' + error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new staff member
export async function POST(request) {
  try {
    const { 
      email, 
      firstName, 
      lastName, 
      phone, 
      companyName, 
      sendWelcomeEmail = true 
    } = await request.json();
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    console.log('[Manager Users API] POST request:', { email, firstName, lastName });
    
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Check if user has manager access or higher
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });
    
    const roleName = adminUser?.role?.name?.toLowerCase() || 'customer';
    const allowedRoles = ['manager', 'admin', 'super_admin'];
    
    if (!allowedRoles.includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }
    
    // Get the STAFF role ID
    const staffRole = await prisma.role.findFirst({
      where: { name: { equals: 'staff', mode: 'insensitive' } }
    });
    
    if (!staffRole) {
      return NextResponse.json({ error: 'Staff role not found' }, { status: 404 });
    }
    
    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const tempPasswordExpiry = new Date();
    tempPasswordExpiry.setHours(tempPasswordExpiry.getHours() + 24);
    
    // Create user with STAFF role only
    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone: phone || '',
        companyName: companyName || '',
        passwordHash: hashedPassword,
        roleId: staffRole.id,
        isVerified: true,
        twoFactorEnabled: false,
        tempPassword: tempPassword,
        tempPasswordExpiry: tempPasswordExpiry,
        tempPasswordSentAt: new Date(),
        mustChangePassword: true,
        createdByAdmin: true
      },
      include: {
        role: true
      }
    });
    
    // Send welcome email with credentials
    let emailSent = false;
    if (sendWelcomeEmail) {
      try {
        emailSent = await sendUserCredentialsEmail({
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          tempPassword: tempPassword,
          role: newUser.role?.name || 'Staff',
          expiryHours: 24
        });
        console.log('[Manager Users API] Welcome email sent:', emailSent);
      } catch (emailError) {
        console.error('[Manager Users API] Failed to send welcome email:', emailError);
      }
    }
    
    // Log security event
    await logSecurityEvent({
      userId: decoded.userId,
      action: 'STAFF_CREATED_BY_MANAGER',
      resourceType: 'user',
      resourceId: newUser.id,
      ipAddress,
      userAgent,
      details: {
        targetUserEmail: newUser.email,
        targetUserFirstName: newUser.firstName,
        targetUserLastName: newUser.lastName,
        createdBy: adminUser?.email || decoded.userId,
        createdByRole: adminUser?.role?.name || 'Unknown',
        emailSent: emailSent
      },
      success: true
    });
    
    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Staff member created successfully. Welcome email sent with credentials.'
        : 'Staff member created successfully. Could not send welcome email. Please resend credentials.',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        tempPassword: tempPassword,
        tempPasswordExpiry: tempPasswordExpiry,
        mustChangePassword: true,
        isVerified: true
      }
    });
    
  } catch (error) {
    console.error('[Manager Users API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create staff member: ' + error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate temporary password
function generateTemporaryPassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}