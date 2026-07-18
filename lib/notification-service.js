import { getSetting } from '@/lib/settings';
import nodemailer from 'nodemailer';
import { decrypt } from '@/lib/encryption';

// ============================================================
// EXPORTED HELPER FUNCTIONS
// ============================================================

/**
 * Get site name from database or fallback to env
 */
export async function getSiteName() {
  try {
    const siteName = await getSetting('siteName');
    if (siteName) return siteName;
  } catch (error) {
    // Database not available, use fallback
  }
  return process.env.SITE_NAME || 'Nemo Auth';
}

/**
 * Get site description from database or fallback
 */
export async function getSiteDescription() {
  try {
    const siteDescription = await getSetting('siteDescription');
    if (siteDescription) return siteDescription;
  } catch (error) {
    // Database not available, use fallback
  }
  return process.env.SITE_DESCRIPTION || 'Enterprise Authentication System';
}

/**
 * Get site URL from database or fallback
 */
export async function getSiteUrl() {
  try {
    const siteUrl = await getSetting('siteUrl');
    if (siteUrl) return siteUrl;
  } catch (error) {
    // Database not available, use fallback
  }
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

/**
 * Get the sender email address
 */
export async function getSender() {
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const siteName = await getSiteName();
  return `"${siteName}" <${fromEmail || 'noreply@nemo-auth.com'}>`;
}

/**
 * Get or create the email transporter
 */
export async function getTransporter() {
  const smtpHost = await getSetting('smtpHost');
  const smtpPort = await getSetting('smtpPort');
  let smtpUser = await getSetting('smtpUser');
  let smtpPass = await getSetting('smtpPass');
  
  // Check if we have SMTP settings in database or use environment variables
  const host = smtpHost || process.env.SMTP_HOST;
  const port = smtpPort || parseInt(process.env.SMTP_PORT || '587');
  const user = smtpUser || process.env.SMTP_USER;
  let pass = smtpPass || process.env.SMTP_PASS;
  
  // If no SMTP configuration exists, use mock mode
  if (!host || !user || !pass) {
    console.log('[EMAIL] No SMTP configuration found. Using mock email service.');
    return {
      sendMail: async (options) => {
        console.log('\n📧 ========== MOCK EMAIL ==========');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        // Extract OTP from HTML if present
        const otpMatch = options.html?.match(/<div class="otp-code">(.*?)<\/div>/);
        if (otpMatch) {
          console.log(`🔐 OTP CODE: ${otpMatch[1]}`);
        }
        // Extract reset link if present
        const resetLinkMatch = options.html?.match(/<a href="(.*?)" class="button">Reset Password<\/a>/);
        if (resetLinkMatch) {
          console.log(`🔗 Reset Link: ${resetLinkMatch[1]}`);
        }
        // Extract verification link if present
        const verifyLinkMatch = options.html?.match(/<a href="(.*?)" class="button">(Verify Email|Confirm New Email)<\/a>/);
        if (verifyLinkMatch) {
          console.log(`✅ Verification Link: ${verifyLinkMatch[1]}`);
        }
        console.log('===================================\n');
        return { messageId: `mock-${Date.now()}` };
      }
    };
  }
  
  // Decrypt password if needed
  if (pass && pass.includes(':')) {
    try {
      pass = decrypt(pass);
    } catch (err) {
      console.error('[EMAIL] Failed to decrypt password:', err);
    }
  }
  
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    pool: true,
    maxConnections: 5,
  });
}

// ============================================================
// EMAIL NOTIFICATION TOGGLE CHECKS
// ============================================================

/**
 * Check if email notifications are enabled (master toggle)
 */
export async function areEmailNotificationsEnabled() {
  try {
    const enabled = await getSetting('emailNotifications');
    // If setting doesn't exist yet, default to true
    return enabled !== false;
  } catch (error) {
    console.log('[Notification] Using default email notification setting: true');
    return true;
  }
}

/**
 * Check if security alerts are enabled
 */
export async function areSecurityAlertsEnabled() {
  const masterEnabled = await areEmailNotificationsEnabled();
  const securityAlerts = await getSetting('securityAlerts');
  return masterEnabled === true && securityAlerts === true;
}

/**
 * Check if login alerts are enabled
 */
export async function areLoginAlertsEnabled() {
  const masterEnabled = await areEmailNotificationsEnabled();
  const loginAlerts = await getSetting('loginAlerts');
  return masterEnabled === true && loginAlerts === true;
}

/**
 * Check if password change alerts are enabled
 */
export async function arePasswordChangeAlertsEnabled() {
  const masterEnabled = await areEmailNotificationsEnabled();
  const passwordChangeAlerts = await getSetting('passwordChangeAlerts');
  return masterEnabled === true && passwordChangeAlerts === true;
}

// ============================================================
// EMAIL SENDING FUNCTIONS
// ============================================================

/**
 * Send 2FA OTP email (respects master email toggle)
 */
export async function send2faOtpWithSettings(email, otp, firstName) {
  const enabled = await areEmailNotificationsEnabled();
  if (!enabled) {
    console.log('[Notification] Email notifications disabled, skipping 2FA OTP email to:', email);
    console.log(`[2FA] Your OTP would be: ${otp} (email disabled)`);
    return true;
  }
  
  try {
    const transporter = await getTransporter();
    const sender = await getSender();
    const siteName = await getSiteName();
    const siteDescription = await getSiteDescription();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Two-Factor Authentication - ${siteName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0ea5e9, #3b82f6); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .otp-code { background: #f1f5f9; padding: 20px; text-align: center; font-size: 36px; font-family: monospace; letter-spacing: 10px; font-weight: bold; color: #0ea5e9; border-radius: 12px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; font-size: 13px; border-radius: 8px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${siteName}</h1><p>Two-Factor Authentication</p></div>
          <div class="content">
            <h2>Hello ${firstName || 'User'},</h2>
            <p>Use the verification code below to complete your login:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <div class="warning"><strong>🔒 Security Notice</strong><br>If you didn't request this, please change your password immediately.</div>
          </div>
          <div class="footer"><strong>${siteName}</strong> - ${siteDescription}</div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: `Your Two-Factor Authentication Code - ${siteName}`,
      html: htmlContent,
    });
    console.log('[2FA EMAIL] Sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('[2FA EMAIL] Error:', error);
    console.log(`[2FA] Fallback - Your OTP is: ${otp}`);
    return false;
  }
}

/**
 * Send backup codes email (respects master email toggle)
 */
export async function sendBackupCodesWithSettings(email, backupCodes, firstName) {
  const enabled = await areEmailNotificationsEnabled();
  if (!enabled) {
    console.log('[Notification] Email notifications disabled, skipping backup codes email to:', email);
    return true;
  }
  
  try {
    const transporter = await getTransporter();
    const sender = await getSender();
    const siteName = await getSiteName();
    const siteDescription = await getSiteDescription();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Backup Codes - ${siteName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .codes-box { background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
          .code-item { display: inline-block; background: white; padding: 8px 12px; margin: 5px; border-radius: 6px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; font-size: 13px; border-radius: 8px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${siteName}</h1><p>Your Backup Codes</p></div>
          <div class="content">
            <h2>Hello ${firstName || 'User'},</h2>
            <p>You have enabled Two-Factor Authentication. Please save these backup codes.</p>
            <div class="codes-box">${backupCodes.map(code => `<div class="code-item">${code}</div>`).join('')}</div>
            <div class="warning"><strong>⚠️ Important</strong><br>• Each code can only be used once<br>• Keep these codes safe<br>• Use these codes if you lose access to your email</div>
          </div>
          <div class="footer"><strong>${siteName}</strong> - ${siteDescription}</div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: `Your 2FA Backup Codes - ${siteName}`,
      html: htmlContent,
    });
    console.log('[BACKUP CODES] Sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('[BACKUP CODES EMAIL] Error:', error);
    return false;
  }
}

/**
 * Send verification email (respects master email toggle)
 */
export async function sendVerificationWithSettings(email, token, firstName, type = 'registration') {
  const enabled = await areEmailNotificationsEnabled();
  if (!enabled) {
    console.log('[Notification] Email notifications disabled, skipping verification email to:', email);
    return true;
  }
  
  try {
    const transporter = await getTransporter();
    const sender = await getSender();
    const siteName = await getSiteName();
    const siteDescription = await getSiteDescription();
    let siteUrl = await getSiteUrl();
    
    // Ensure site URL is clean
    if (siteUrl.includes(':3000') && siteUrl.includes('.app.github.dev')) {
      siteUrl = siteUrl.replace(':3000', '');
    }
    siteUrl = siteUrl.replace(/\/$/, '');
    
    const verificationUrl = `${siteUrl}/api/auth/verify/${token}`;
    
    const title = type === 'email-change' ? 'Confirm Your New Email Address' : 'Verify Your Email Address';
    const message = type === 'email-change' 
      ? 'Please confirm your new email address by clicking the button below.'
      : 'Please verify your email address by clicking the button below to complete your registration.';
    const buttonText = type === 'email-change' ? 'Confirm New Email' : 'Verify Email';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title} - ${siteName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0ea5e9, #3b82f6); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${siteName}</h1></div>
          <div class="content">
            <h2>${title}</h2>
            <p>Hello ${firstName || 'User'},</p>
            <p>${message}</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">${buttonText}</a>
            </div>
            <p style="font-size: 12px; color: #666;">This link expires in 24 hours.</p>
          </div>
          <div class="footer"><strong>${siteName}</strong> - ${siteDescription}</div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: `${title} - ${siteName}`,
      html: htmlContent,
    });
    console.log('[VERIFICATION EMAIL] Sent to:', email);
    return true;
  } catch (error) {
    console.error('[VERIFICATION EMAIL] Error:', error);
    return false;
  }
}

/**
 * Send password reset email (respects master email toggle)
 */
export async function sendPasswordResetWithSettings(email, token, firstName) {
  const enabled = await areEmailNotificationsEnabled();
  if (!enabled) {
    console.log('[Notification] Email notifications disabled, skipping password reset email to:', email);
    return true;
  }
  
  try {
    const transporter = await getTransporter();
    const sender = await getSender();
    const siteName = await getSiteName();
    const siteDescription = await getSiteDescription();
    let siteUrl = await getSiteUrl();
    
    if (siteUrl.includes(':3000') && siteUrl.includes('.app.github.dev')) {
      siteUrl = siteUrl.replace(':3000', '');
    }
    siteUrl = siteUrl.replace(/\/$/, '');
    const resetUrl = `${siteUrl}/reset-password/${token}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reset Your Password - ${siteName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0EA5E9, #3B82F6); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #0EA5E9, #3B82F6); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .link-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 12px; margin: 16px 0; }
          .security-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; font-size: 13px; border-radius: 8px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${siteName}</h1><p>Password Reset Request</p></div>
          <div class="content">
            <h2>Hello ${firstName || 'User'},</h2>
            <p>We received a request to reset your password for your <strong>${siteName}</strong> account.</p>
            <div style="text-align: center;"><a href="${resetUrl}" class="button">Reset Password</a></div>
            <p>Or copy and paste this link into your browser:</p>
            <div class="link-box">${resetUrl}</div>
            <div class="security-note"><strong>🔒 Security Note:</strong><br>This link will expire in 60 minutes. If you didn't request this, please ignore this email.</div>
          </div>
          <div class="footer"><strong>${siteName}</strong> - ${siteDescription}</div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: `Reset Your Password - ${siteName}`,
      html: htmlContent,
    });
    console.log('[PASSWORD RESET] Sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('[PASSWORD RESET EMAIL] Error:', error);
    return false;
  }
}

/**
 * Send login alert for new device (respects login alerts setting)
 */
export async function sendLoginAlertWithSettings(email, firstName, deviceInfo, location, ipAddress) {
  const enabled = await areLoginAlertsEnabled();
  if (!enabled) {
    console.log('[Notification] Login alerts disabled, skipping login alert email to:', email);
    return true;
  }
  
  try {
    const transporter = await getTransporter();
    const sender = await getSender();
    const siteName = await getSiteName();
    const siteDescription = await getSiteDescription();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>New Login Detected - ${siteName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0ea5e9, #3b82f6); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .details { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; font-size: 13px; border-radius: 8px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${siteName}</h1></div>
          <div class="content">
            <h2>Hello ${firstName || 'User'},</h2>
            <p>We detected a new login to your account from an unrecognized device.</p>
            <div class="details">
              <strong>Device:</strong> ${deviceInfo}<br>
              <strong>Location:</strong> ${location || 'Unknown'}<br>
              <strong>IP Address:</strong> ${ipAddress}<br>
              <strong>Time:</strong> ${new Date().toLocaleString()}
            </div>
            <div class="warning">
              <strong>⚠️ If this wasn't you</strong><br>Please change your password immediately and contact support.
            </div>
          </div>
          <div class="footer"><strong>${siteName}</strong> - ${siteDescription}</div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: `New Login Detected - ${siteName}`,
      html: htmlContent,
    });
    console.log('[LOGIN ALERT] Sent to:', email);
    return true;
  } catch (error) {
    console.error('[LOGIN ALERT] Error:', error);
    return false;
  }
}

/**
 * Send security alert (respects security alerts setting)
 */
export async function sendSecurityAlertWithSettings(email, firstName, alertType, details) {
  const enabled = await areSecurityAlertsEnabled();
  if (!enabled) {
    console.log('[Notification] Security alerts disabled, skipping security alert email to:', email);
    return true;
  }
  
  try {
    const transporter = await getTransporter();
    const sender = await getSender();
    const siteName = await getSiteName();
    const siteDescription = await getSiteDescription();
    
    let alertTitle = '';
    let alertMessage = '';
    
    switch (alertType) {
      case 'password_change_attempt':
        alertTitle = '⚠️ Multiple Failed Password Change Attempts';
        alertMessage = `We detected ${details.attempts} failed attempts to change your password. Your account has been temporarily locked.`;
        break;
      case 'otp_verification_failed':
        alertTitle = '⚠️ Multiple Failed Verification Code Attempts';
        alertMessage = `We detected ${details.attempts} failed attempts to verify the code. Your account has been temporarily locked.`;
        break;
      default:
        alertTitle = '⚠️ Security Alert';
        alertMessage = 'Suspicious activity detected on your account.';
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Security Alert - ${siteName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #dc2626, #ef4444); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 8px; }
          .details-box { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 13px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${siteName}</h1></div>
          <div class="content">
            <h2>Hello ${firstName || 'User'},</h2>
            <div class="alert-box">
              <p><strong>${alertTitle}</strong></p>
              <p>${alertMessage}</p>
            </div>
            <div class="details-box">
              <strong>📋 Details:</strong><br>
              IP Address: ${details.ipAddress}<br>
              Time: ${new Date().toLocaleString()}<br>
              User Agent: ${details.userAgent?.substring(0, 100) || 'Unknown'}
            </div>
            <p><strong>What you can do:</strong></p>
            <ul>
              <li>If this was you, no action is required.</li>
              <li>If this wasn't you, please change your password immediately.</li>
            </ul>
          </div>
          <div class="footer"><strong>${siteName}</strong> - ${siteDescription}</div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: `Security Alert - ${siteName}`,
      html: htmlContent,
    });
    console.log('[SECURITY ALERT] Sent to:', email);
    return true;
  } catch (error) {
    console.error('[SECURITY ALERT] Error:', error);
    return false;
  }
}

/**
 * Send password changed confirmation email (respects password change alerts setting)
 */
export async function sendPasswordChangedWithSettings(email, firstName, method = 'user_initiated') {
  const enabled = await arePasswordChangeAlertsEnabled();
  if (!enabled) {
    console.log('[Notification] Password change alerts disabled, skipping confirmation email to:', email);
    return true;
  }
  
  try {
    const transporter = await getTransporter();
    const sender = await getSender();
    const siteName = await getSiteName();
    const siteDescription = await getSiteDescription();
    let siteUrl = await getSiteUrl();
    
    if (siteUrl.includes(':3000') && siteUrl.includes('.app.github.dev')) {
      siteUrl = siteUrl.replace(':3000', '');
    }
    siteUrl = siteUrl.replace(/\/$/, '');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Password Changed - ${siteName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .success-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${siteName}</h1></div>
          <div class="content">
            <h2>Hello ${firstName || 'User'},</h2>
            <div class="success-box">
              <p><strong>✅ Your password has been successfully changed.</strong></p>
            </div>
            <ul>
              <li>You have been logged out from all devices</li>
              <li>You will need to log in again with your new password</li>
            </ul>
            <p>If you did NOT change your password, please contact support immediately.</p>
            <div style="text-align: center;">
              <a href="${siteUrl}/login" class="button">Login to Your Account</a>
            </div>
          </div>
          <div class="footer"><strong>${siteName}</strong> - ${siteDescription}</div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: `Password Changed Successfully - ${siteName}`,
      html: htmlContent,
    });
    console.log('[PASSWORD CHANGED] Sent to:', email);
    return true;
  } catch (error) {
    console.error('[PASSWORD CHANGED] Error:', error);
    return false;
  }
}

/**
 * Send OTP for password change (respects master email toggle)
 */
export async function sendPasswordChangeOtpWithSettings(email, otp, firstName) {
  const enabled = await areEmailNotificationsEnabled();
  if (!enabled) {
    console.log('[Notification] Email notifications disabled, skipping password change OTP email to:', email);
    console.log(`[OTP] Your password change OTP is: ${otp}`);
    return true;
  }
  
  try {
    const transporter = await getTransporter();
    const sender = await getSender();
    const siteName = await getSiteName();
    const siteDescription = await getSiteDescription();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Password Change Verification - ${siteName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0ea5e9, #3b82f6); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .otp-code { background: #f1f5f9; padding: 20px; text-align: center; font-size: 36px; font-family: monospace; letter-spacing: 10px; font-weight: bold; color: #0ea5e9; border-radius: 12px; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${siteName}</h1></div>
          <div class="content">
            <h2>Hello ${firstName || 'User'},</h2>
            <p>Use the verification code below to complete your password change:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
          </div>
          <div class="footer"><strong>${siteName}</strong> - ${siteDescription}</div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: `Password Change Verification Code - ${siteName}`,
      html: htmlContent,
    });
    console.log('[PASSWORD CHANGE OTP] Sent to:', email);
    return true;
  } catch (error) {
    console.error('[PASSWORD CHANGE OTP] Error:', error);
    console.log(`[OTP] Fallback - Your password change OTP is: ${otp}`);
    return false;
  }
}