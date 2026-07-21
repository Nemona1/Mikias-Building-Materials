// lib/email/sendUserCredentialsEmail.js
import { getTransporter, getSender, getSiteName, getSiteDescription, getSiteUrl } from '@/lib/notification-service';

/**
 * Send user credentials email to newly created users
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.firstName - User's first name
 * @param {string} params.lastName - User's last name
 * @param {string} params.tempPassword - Temporary password
 * @param {string} params.role - User's role
 * @param {number} params.expiryHours - Password expiry in hours
 * @returns {Promise<boolean>} - True if sent successfully
 */
export async function sendUserCredentialsEmail({ 
  email, 
  firstName, 
  lastName, 
  tempPassword, 
  role, 
  expiryHours = 24 
}) {
  try {
    const siteName = await getSiteName();
    const siteDescription = await getSiteDescription();
    const siteUrl = await getSiteUrl();
    const transporter = await getTransporter();
    const sender = await getSender();
    
    // If no transporter, email is disabled (mock mode)
    if (!transporter) {
      console.log('[USER CREDENTIALS] Email service not configured. Would send to:', email);
      console.log('[USER CREDENTIALS] Temp password would be:', tempPassword);
      return true;
    }

    // Clean site URL
    let cleanSiteUrl = siteUrl;
    if (cleanSiteUrl.includes(':3000') && cleanSiteUrl.includes('.app.github.dev')) {
      cleanSiteUrl = cleanSiteUrl.replace(':3000', '');
    }
    cleanSiteUrl = cleanSiteUrl.replace(/\/$/, '');

    const loginUrl = `${cleanSiteUrl}/login`;

    const subject = `Welcome to ${siteName} - Your Account Credentials`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${siteName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: #f1f5f9;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb, #3b82f6);
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
            margin: 8px 0 0;
          }
          .content {
            padding: 30px;
          }
          .info-box {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .warning-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .credentials {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            margin: 15px 0;
          }
          .credentials code {
            display: block;
            padding: 10px;
            background: #1e293b;
            color: #e2e8f0;
            border-radius: 6px;
            font-size: 18px;
            letter-spacing: 2px;
            text-align: center;
            font-family: 'Courier New', monospace;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 15px 0;
          }
          .button:hover {
            background: #1d4ed8;
          }
          .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
          .divider {
            border-top: 1px solid #e2e8f0;
            margin: 20px 0;
          }
          .role-badge {
            display: inline-block;
            padding: 4px 12px;
            background: #dbeafe;
            color: #1e40af;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏗️ ${siteName}</h1>
            <p>Your account has been created</p>
          </div>
          <div class="content">
            <h2>Welcome, ${firstName} ${lastName}!</h2>
            <p>An administrator has created an account for you at <strong>${siteName}</strong>.</p>
            
            <div class="info-box">
              <p style="margin: 0; font-weight: 600; color: #065f46;">
                ✅ Account Created Successfully
              </p>
              <p style="margin: 5px 0 0; color: #065f46; font-size: 14px;">
                Role: <span class="role-badge">${role}</span>
              </p>
            </div>

            <h3>🔑 Your Temporary Credentials</h3>
            <div class="credentials">
              <p style="margin: 0 0 8px; font-weight: 600;">Email</p>
              <code style="background: #f1f5f9; color: #1e293b; font-size: 14px; letter-spacing: normal;">${email}</code>
              <p style="margin: 12px 0 8px; font-weight: 600;">Temporary Password</p>
              <code>${tempPassword}</code>
            </div>

            <div class="warning-box">
              <p style="margin: 0; font-weight: 600; color: #92400e;">
                ⚠️ Important Security Notice
              </p>
              <ul style="margin: 8px 0 0; padding-left: 20px; color: #92400e;">
                <li>This password is <strong>temporary and expires in ${expiryHours} hours</strong></li>
                <li>You will be required to <strong>change your password</strong> on first login</li>
                <li>Do not share this password with anyone</li>
                <li>If you didn't request this account, please contact support immediately</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${loginUrl}" class="button">🔐 Login to Your Account</a>
            </div>

            <div class="divider"></div>
            
            <h4>What's Next?</h4>
            <ol style="color: #475569;">
              <li>Click the login button above</li>
              <li>Use your email and the temporary password provided</li>
              <li>You will be prompted to set a new password</li>
              <li>Complete your profile setup</li>
            </ol>

            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
              If you have any questions, please contact your administrator or support team.
            </p>
          </div>
          <div class="footer">
            <p><strong>${siteName}</strong> - ${siteDescription}</p>
            <p>This email was sent to you as part of the account creation process.</p>
            <p style="margin-top: 8px;">&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Welcome to ${siteName} - Your Account Credentials

      Welcome, ${firstName} ${lastName}!

      An administrator has created an account for you at ${siteName}.

      Account Details:
      - Email: ${email}
      - Role: ${role}
      - Temporary Password: ${tempPassword}

      ⚠️ Important:
      - This password is temporary and expires in ${expiryHours} hours
      - You will be required to change your password on first login
      - Do not share this password with anyone

      Login here: ${loginUrl}

      What's Next?
      1. Click the login link above
      2. Use your email and the temporary password provided
      3. You will be prompted to set a new password
      4. Complete your profile setup

      If you have any questions, please contact your administrator.

      ---
      ${siteName} - ${siteDescription}
      © ${new Date().getFullYear()} ${siteName}. All rights reserved.
    `;

    await transporter.sendMail({
      from: sender,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
    });

    console.log('[USER CREDENTIALS EMAIL] Sent successfully to:', email);
    return true;

  } catch (error) {
    console.error('[USER CREDENTIALS EMAIL] Error:', error);
    return false;
  }
}