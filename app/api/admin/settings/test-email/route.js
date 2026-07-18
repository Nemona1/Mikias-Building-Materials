// app/api/admin/settings/test-email/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasAdminAccess } from '@/lib/auth/permissions';
import nodemailer from 'nodemailer';
import { getSetting } from '@/lib/settings';
import { decrypt } from '@/lib/encryption';

export async function POST(request) {
  try {
    // Verify admin access
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) token = request.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Use the hasAdminAccess helper instead of checking role directly
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }
    
    // Get SMTP settings from database
    const smtpHost = await getSetting('smtpHost');
    const smtpPort = await getSetting('smtpPort');
    const smtpUser = await getSetting('smtpUser');
    let smtpPass = await getSetting('smtpPass');
    const emailFrom = await getSetting('emailFrom');
    
    // Decrypt password if encrypted
    if (smtpPass && smtpPass.includes(':')) {
      smtpPass = decrypt(smtpPass);
    }
    
    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json({ 
        error: 'SMTP configuration is incomplete. Please configure email settings first.' 
      }, { status: 400 });
    }
    
    // Create transporter with current settings
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort || 587,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    
    // Verify connection
    await transporter.verify();
    
    const fromEmail = emailFrom || smtpUser;
    const testSubject = 'Mikias Building Materials - Test Email';
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test Email - Mikias Building Materials</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0ea5e9, #3b82f6); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .success-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 8px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏗️ Mikias Building Materials</h1>
            <p>Email Configuration Test</p>
          </div>
          <div class="content">
            <h2>✅ Test Email Successful!</h2>
            <div class="success-box">
              <p><strong>Your email configuration is working correctly!</strong></p>
              <p>This test email confirms that your SMTP settings are properly configured.</p>
            </div>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>SMTP Host: ${smtpHost}</li>
              <li>SMTP Port: ${smtpPort}</li>
              <li>From Email: ${fromEmail}</li>
            </ul>
            <p>You are now ready to send emails from your Mikias Building Materials system.</p>
          </div>
          <div class="footer">
            <p><strong>Mikias Building Materials</strong> - Quality Building Materials, Hardware, Sanitary & Electrical Supplies</p>
            <p>This is an automated test message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const testText = `
      Mikias Building Materials - Test Email
    
      ✅ Test Email Successful!
      
      Your email configuration is working correctly!
      
      Configuration Details:
      - SMTP Host: ${smtpHost}
      - SMTP Port: ${smtpPort}
      - From Email: ${fromEmail}
      
      You are now ready to send emails from your Mikias Building Materials system.
      
      ---
      Mikias Building Materials - Quality Building Materials, Hardware, Sanitary & Electrical Supplies
      This is an automated test message.
    `;
    
    await transporter.sendMail({
      from: `"Mikias Building Materials" <${fromEmail}>`,
      to: email,
      subject: testSubject,
      html: testHtml,
      text: testText,
    });
    
    // Log the test email sending
    await prisma.securityLog.create({
      data: {
        userId: decoded.userId,
        action: 'TEST_EMAIL_SENT',
        resourceType: 'system',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { email },
        success: true
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully!' 
    });
    
  } catch (error) {
    console.error('[Test Email] Error:', error);
    
    let errorMessage = 'Failed to send test email. Please check your SMTP settings.';
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your SMTP username and password.';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Connection failed. Please check your SMTP host and port.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection refused. Please verify your SMTP settings.';
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}