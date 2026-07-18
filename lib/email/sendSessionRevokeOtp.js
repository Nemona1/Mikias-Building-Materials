// Session Revocation OTP Email Service
// Now uses the unified notification service for consistent email handling

import { areEmailNotificationsEnabled, getTransporter, getSender, getSiteName, getSiteDescription } from '@/lib/notification-service';

/**
 * Send a verification OTP to revoke a specific session.
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} firstName - User's first name
 * @param {Object} targetSession - Session object containing device details
 * @returns {Promise<boolean>} - True if sent successfully
 */
export async function sendSessionRevokeOtp(email, otp, firstName, targetSession) {
  const enabled = await areEmailNotificationsEnabled();
  if (!enabled) {
    console.log('[Notification] Email notifications disabled, skipping session revoke OTP email to:', email);
    console.log(`[SESSION REVOKE] Your OTP would be: ${otp} (email disabled)`);
    return true;
  }
  
  try {
    const siteName = await getSiteName();
    const siteDescription = await getSiteDescription();
    const transporter = await getTransporter();
    const sender = await getSender();
    
    if (!transporter) {
      console.error('[SESSION REVOKE OTP] No transporter available. Skipping email to:', email);
      return false;
    }
    
    const deviceName = targetSession.deviceName || 'Unknown Device';
    const location = targetSession.location || 'Unknown location';
    const ipAddress = targetSession.ipAddress || 'Unknown IP';
    const lastActivity = targetSession.lastActivity
      ? new Date(targetSession.lastActivity).toLocaleString()
      : 'Unknown';

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Session Revocation Verification - ${siteName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
      letter-spacing: -0.5px;
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
    .alert-box {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 16px;
      border-radius: 12px;
      margin: 20px 0;
    }
    .device-details {
      background: #f8fafc;
      border-radius: 16px;
      padding: 16px;
      margin: 24px 0;
      border: 1px solid #e2e8f0;
    }
    .device-details p {
      margin: 6px 0;
      font-size: 14px;
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
      color: #0f172a;
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
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    @media (max-width: 480px) {
      .otp-code { font-size: 28px; letter-spacing: 6px; }
      .content { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 ${siteName}</h1>
      <p>Session Revocation Request</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${firstName},</div>
      <p>We received a request to <strong>revoke a session</strong> from your account.</p>
      
      <div class="alert-box">
        ⚠️ <strong>Action required</strong> – If you did not initiate this, ignore this email or change your password immediately.
      </div>
      
      <div class="device-details">
        <strong>📱 Device to be revoked:</strong>
        <p>• Device: ${deviceName}</p>
        <p>• Location: ${location}</p>
        <p>• IP address: ${ipAddress}</p>
        <p>• Last active: ${lastActivity}</p>
      </div>
      
      <p>To confirm revocation, use the one‑time code below:</p>
      <div class="otp-code">${otp}</div>
      
      <p>This code expires in <strong>10 minutes</strong>.</p>
      
      <div class="warning">
        <strong>🔒 Security tip</strong><br>
        Never share this code with anyone. ${siteName} will never ask for it outside this verification screen.
      </div>
    </div>
    <div class="footer">
      <p>${siteName} – ${siteDescription}</p>
      <p><a href="#">Report suspicious activity</a> | <a href="#">Account settings</a></p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: sender,
      to: email,
      subject: `🔐 Action Required: Verify session revocation - ${siteName}`,
      html: htmlContent,
    });
    console.log(`[SESSION REVOKE OTP] Sent to ${email} for session ${targetSession.sessionToken?.slice(0, 8)}`);
    return true;
  } catch (error) {
    console.error('[SESSION REVOKE OTP] Failed:', error);
    console.log(`[SESSION REVOKE] Fallback - Your OTP is: ${otp}`);
    return false;
  }
}