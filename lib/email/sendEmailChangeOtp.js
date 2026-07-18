// Email Change OTP Email Service
// Now uses the unified notification service for consistent email handling

import { areEmailNotificationsEnabled, getTransporter, getSender, getSiteName, getSiteDescription, getSiteUrl } from '@/lib/notification-service';

/**
 * Send email change verification OTP
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} firstName - User's first name
 * @returns {Promise<boolean>} - True if sent successfully
 */
export async function sendEmailChangeOtp(email, otp, firstName) {
  const enabled = await areEmailNotificationsEnabled();
  if (!enabled) {
    console.log('[Notification] Email notifications disabled, skipping email change OTP email to:', email);
    console.log(`[EMAIL CHANGE] Your OTP would be: ${otp} (email disabled)`);
    return true;
  }
  
  try {
    const siteName = await getSiteName();
    const siteDescription = await getSiteDescription();
    const siteUrl = await getSiteUrl();
    const transporter = await getTransporter();
    const sender = await getSender();
    
    if (!transporter) {
      console.error('[EMAIL CHANGE OTP] No transporter available. Skipping email to:', email);
      return false;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Change Verification - ${siteName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
          .otp-code {
            background: #f1f5f9;
            padding: 20px;
            text-align: center;
            font-size: 36px;
            font-family: 'Courier New', monospace;
            letter-spacing: 10px;
            font-weight: bold;
            color: #0ea5e9;
            border-radius: 12px;
            margin: 20px 0;
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${siteName}</h1>
            <p>Email Change Verification</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            <p>You have requested to change your email address. To proceed, please use the following verification code:</p>
            
            <div class="otp-code">
              ${otp}
            </div>
            
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice</strong><br>
              If you did not request this email change, please ignore this email or contact support immediately.
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
              For security reasons, never share this code with anyone.
            </p>
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
      Email Change Verification - ${siteName}
      
      Hello ${firstName},
      
      You have requested to change your email address. Use the verification code below:
      
      ${otp}
      
      This code will expire in 10 minutes.
      
      If you did not request this email change, please ignore this email.
      
      ---
      ${siteName} - ${siteDescription}
      This is an automated message.
    `;
    
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: `Email Change Verification Code - ${siteName}`,
      html: htmlContent,
      text: textContent,
    });
    console.log('[EMAIL CHANGE OTP] Sent to:', email);
    return true;
  } catch (error) {
    console.error('[EMAIL CHANGE OTP] Error:', error);
    console.log(`[EMAIL CHANGE] Fallback - Your OTP is: ${otp}`);
    return false;
  }
}