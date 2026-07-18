// Verification Email Service for Registration and Email Change
// Now uses the unified notification service for consistent email handling

import { areEmailNotificationsEnabled, getTransporter, getSender, getSiteName, getSiteDescription, getSiteUrl } from '@/lib/notification-service';

/**
 * Send verification email for registration or email change
 * @param {string} email - Recipient email address
 * @param {string} token - Verification token
 * @param {string} userId - User ID (unused but kept for compatibility)
 * @param {string} type - Type of verification ('registration' or 'email-change')
 * @returns {Promise<boolean>} - True if sent successfully
 */
export async function sendVerificationEmail(email, token, userId, type = 'registration') {
  const enabled = await areEmailNotificationsEnabled();
  if (!enabled) {
    console.log('[Notification] Email notifications disabled, skipping verification email to:', email);
    return true;
  }
  
  try {
    const siteName = await getSiteName();
    const siteDescription = await getSiteDescription();
    let siteUrl = await getSiteUrl();
    const transporter = await getTransporter();
    const sender = await getSender();
    
    if (!transporter) {
      console.error('[VERIFICATION EMAIL] No transporter available. Skipping email to:', email);
      return false;
    }
    
    // Ensure site URL is clean
    if (siteUrl.includes(':3000') && siteUrl.includes('.app.github.dev')) {
      siteUrl = siteUrl.replace(':3000', '');
    }
    siteUrl = siteUrl.replace(/\/$/, '');
    
    const verificationUrl = `${siteUrl}/api/auth/verify/${token}`;
    
    let title, message, buttonText;
    
    if (type === 'email-change') {
      title = 'Confirm Your New Email Address';
      message = 'Please confirm your new email address by clicking the button below. This will complete the email change process.';
      buttonText = 'Confirm New Email';
    } else {
      title = 'Verify Your Email Address';
      message = 'Please verify your email address by clicking the button below to complete your registration.';
      buttonText = 'Verify Email';
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - ${siteName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #0ea5e9, #3b82f6);
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: rgba(255,255,255,0.9);
            margin: 5px 0 0;
          }
          .content {
            padding: 30px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #0ea5e9, #3b82f6);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: scale(1.02);
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin: 20px 0;
            font-size: 13px;
            border-radius: 8px;
          }
          .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
          .link-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px;
            border-radius: 8px;
            word-break: break-all;
            font-family: monospace;
            font-size: 12px;
            margin: 16px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${siteName}</h1>
            <p>${siteDescription}</p>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <p>${message}</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">${buttonText}</a>
            </div>
            
            <p style="font-size: 12px; color: #666;">This link expires in <strong>24 hours</strong>.</p>
            
            <hr>
            
            <p style="font-size: 11px; color: #999;">Or copy this link:</p>
            <div class="link-box">${verificationUrl}</div>
            
            <div class="warning">
              <strong>⚠️ Security Notice</strong><br>
              If you did not request this, please ignore this email.
            </div>
          </div>
          <div class="footer">
            <p><strong>${siteName}</strong> - ${siteDescription}</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
      ${title} - ${siteName}
      
      Hello,
      
      ${message}
      
      Click the link below to ${type === 'email-change' ? 'confirm your email change' : 'verify your email address'}:
      
      ${verificationUrl}
      
      This link expires in 24 hours.
      
      If you did not request this, please ignore this email.
      
      ---
      ${siteName} - ${siteDescription}
      This is an automated message.
    `;
    
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: type === 'email-change' ? `Confirm Email Change - ${siteName}` : `Verify Your Email - ${siteName}`,
      html: htmlContent,
      text: textContent,
    });
    console.log('[VERIFICATION EMAIL] Sent to:', email);
    return true;
  } catch (error) {
    console.error('[VERIFICATION EMAIL] Error:', error);
    return false;
  }
}