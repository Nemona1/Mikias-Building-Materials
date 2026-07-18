// Password Reset Email Service
// Now uses the unified notification service for consistent email handling

import { sendPasswordResetWithSettings } from '@/lib/notification-service';

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} token - Password reset token
 * @param {string} firstName - User's first name
 * @returns {Promise<boolean>} - True if sent successfully
 */
export async function sendPasswordResetEmail(email, token, firstName) {
  console.log('[PASSWORD RESET EMAIL] ========================================');
  console.log('[PASSWORD RESET EMAIL] Preparing for:', email);
  console.log('[PASSWORD RESET EMAIL] ========================================');
  
  try {
    // Use the unified notification service which handles:
    // - Database email settings
    // - Mock mode when no SMTP configured
    // - Proper error handling with fallbacks
    const result = await sendPasswordResetWithSettings(email, token, firstName);
    
    if (result) {
      console.log('[PASSWORD RESET EMAIL] Sent successfully to:', email);
      return true;
    } else {
      console.error('[PASSWORD RESET EMAIL] Failed to send to:', email);
      return false;
    }
  } catch (error) {
    console.error('[PASSWORD RESET EMAIL] Error:', error);
    return false;
  }
}