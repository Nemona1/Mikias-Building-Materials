// Bulk Session Revocation OTP Email Service
// Now uses the unified notification service for consistent email handling

import { areEmailNotificationsEnabled, getTransporter, getSender, getSiteName, getSiteDescription } from '@/lib/notification-service';

/**
 * Send OTP to revoke all other sessions (bulk revocation).
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} firstName - User's first name
 * @param {number} sessionCount - Number of other active sessions to revoke
 * @returns {Promise<boolean>}
 */
export async function sendBulkRevokeOtp(email, otp, firstName, sessionCount) {
  const enabled = await areEmailNotificationsEnabled();
  if (!enabled) {
    console.log('[Notification] Email notifications disabled, skipping bulk revoke OTP email to:', email);
    console.log(`[BULK REVOKE] Your OTP would be: ${otp} (email disabled)`);
    return true;
  }
  
  try {
    const transporter = await getTransporter();
    const sender = await getSender();
    const siteName = await getSiteName();
    const siteDescription = await getSiteDescription();
    
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bulk Session Revocation Verification - ${siteName}</title>
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
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 35px -10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: white;
    }
    .header p {
      margin: 8px 0 0;
      color: rgba(255,255,255,0.9);
      font-size: 14px;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .info-box {
      background: #fefce8;
      border-left: 4px solid #eab308;
      padding: 16px;
      border-radius: 12px;
      margin: 20px 0;
    }
    .otp-code {
      background: #f1f5f9;
      font-size: 40px;
      font-family: 'Courier New', monospace;
      letter-spacing: 12px;
      text-align: center;
      padding: 20px;
      border-radius: 16px;
      font-weight: bold;
      margin: 24px 0;
    }
    .warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 14px;
      border-radius: 12px;
      font-size: 13px;
      margin: 24px 0 16px;
    }
    .footer {
      background: #f8fafc;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 ${siteName}</h1>
      <p>Bulk Session Revocation</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${firstName},</div>
      <p>You requested to <strong>revoke all other active sessions</strong> (${sessionCount} session${sessionCount !== 1 ? 's' : ''}) from your account.</p>
      
      <div class="info-box">
        ⚠️ Your current session will remain active. All other devices will be logged out immediately after confirmation.
      </div>
      
      <p>To confirm this action, enter the verification code below:</p>
      <div class="otp-code">${otp}</div>
      
      <p>This code expires in <strong>10 minutes</strong>.</p>
      
      <div class="warning">
        <strong>🔒 Did you not request this?</strong><br>
        If you didn't initiate this action, please <strong>change your password immediately</strong> and contact support.
      </div>
    </div>
    <div class="footer">
      <p>${siteName} – ${siteDescription}</p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: sender,
      to: email,
      subject: `🔐 Verify bulk session revocation - ${siteName}`,
      html: htmlContent,
    });
    console.log(`[BULK REVOKE OTP] Sent to ${email} for ${sessionCount} other sessions`);
    return true;
  } catch (error) {
    console.error('[BULK REVOKE OTP] Failed:', error);
    console.log(`[BULK REVOKE] Fallback - Your OTP is: ${otp}`);
    return false;
  }
}