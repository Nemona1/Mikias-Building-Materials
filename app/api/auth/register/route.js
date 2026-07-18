import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';
import { sendVerificationEmail } from '@/lib/email/sendVerificationEmail';
import { getSetting } from '@/lib/settings';
import crypto from 'crypto';
import { hashPassword, validatePasswordStrengthAsync } from '@/lib/auth/security';

export async function POST(request) {
  try {
    // ============================================================
    // CHECK IF REGISTRATION IS ALLOWED
    // ============================================================
    const allowRegistration = await getSetting('allowRegistration');
    if (!allowRegistration) {
      return NextResponse.json(
        { error: 'Registration is currently disabled. Please contact administrator.' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { firstName, lastName, email, password } = body;
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address (e.g., name@domain.com)' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login instead.' },
        { status: 409 }
      );
    }
    
    // Validate password strength
    const passwordValidation = await validatePasswordStrengthAsync(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      );
    }
    
    // Get CUSTOMER role (default for all new registrations)
    const customerRole = await prisma.role.findUnique({
      where: { name: 'customer' }
    });
    
    if (!customerRole) {
      console.error('[Register] Customer role not found! Please run seed.');
      return NextResponse.json(
        { error: 'System configuration error. Please contact support.' },
        { status: 500 }
      );
    }
    
    // Get email verification requirement
    const requireEmailVerification = await getSetting('requireEmailVerification');
    
    // Generate verification token if required
    let verificationToken = null;
    let verificationExpiry = null;
    
    if (requireEmailVerification) {
      verificationToken = crypto.randomBytes(32).toString('hex');
      verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user with CUSTOMER role (auto-approved)
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        verificationToken,
        verificationExpiry,
        isVerified: !requireEmailVerification,
        roleId: customerRole.id,
        isActive: true,
      }
    });
    
    // Log security event for user registration
    await logSecurityEvent({
      userId: user.id,
      action: SecurityActions.USER_REGISTERED,
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
      details: { email, role: 'customer', requireVerification: requireEmailVerification },
      success: true
    });
    
    // Send verification email if required
    if (requireEmailVerification) {
      const emailSent = await sendVerificationEmail(email, verificationToken, firstName);
      
      if (!emailSent) {
        await logSecurityEvent({
          userId: user.id,
          action: 'EMAIL_SEND_FAILED',
          resourceType: 'user',
          resourceId: user.id,
          ipAddress,
          userAgent,
          details: { email },
          success: false
        });
        
        return NextResponse.json(
          { 
            success: true, 
            warning: 'Account created but verification email could not be sent. Please contact support.',
            requiresVerification: true 
          },
          { status: 201 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: requireEmailVerification 
          ? 'Registration successful! Please check your email for verification link.'
          : 'Registration successful! You can now log in.',
        requiresVerification: requireEmailVerification,
        redirectUrl: '/login'
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
