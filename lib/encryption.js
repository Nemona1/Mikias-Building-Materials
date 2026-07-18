// Encryption module - works in both Edge and Server runtimes

// Detect if we're in Edge Runtime
const isEdgeRuntime = typeof crypto === 'undefined' || !crypto.randomBytes;

// For Edge Runtime - stub functions
export function encrypt(text) {
  if (!text) return '';
  if (isEdgeRuntime) {
    console.log('[Encryption] Edge runtime - returning as-is');
    return text;
  }
  
  // Server-side encryption using Node.js crypto
  try {
    const crypto = require('crypto');
    const ALGORITHM = 'aes-256-cbc';
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars-long!!!';
    const IV_LENGTH = 16;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('[Encryption] Error:', error.message);
    return text;
  }
}

export function decrypt(text) {
  if (!text) return '';
  if (isEdgeRuntime) {
    console.log('[Encryption] Edge runtime - returning as-is');
    return text;
  }
  
  // Server-side decryption using Node.js crypto
  try {
    const crypto = require('crypto');
    const ALGORITHM = 'aes-256-cbc';
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars-long!!!';
    
    const textParts = text.split(':');
    if (textParts.length !== 2) return text;
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Error:', error.message);
    return text;
  }
}

export function isEncryptionAvailable() {
  return !isEdgeRuntime;
}
