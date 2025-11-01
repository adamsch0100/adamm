/**
 * Simple encryption/decryption utility for API keys
 * Uses environment ENCRYPTION_KEY
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    console.warn('ENCRYPTION_KEY not set, storing in base64 only');
    return Buffer.from(text).toString('base64');
  }
  
  // Simple XOR encryption with key
  // In production, use a proper encryption library like crypto-js
  const textBuffer = Buffer.from(text);
  const encryptedBuffer = Buffer.from(
    Array.from(textBuffer).map((byte, i) => 
      byte ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    )
  );
  
  return encryptedBuffer.toString('base64');
}

export function decrypt(encrypted: string): string {
  if (!ENCRYPTION_KEY) {
    return Buffer.from(encrypted, 'base64').toString();
  }
  
  // Reverse XOR
  const encryptedBuffer = Buffer.from(encrypted, 'base64');
  const decryptedBuffer = Buffer.from(
    Array.from(encryptedBuffer).map((byte, i) => 
      byte ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    )
  );
  
  return decryptedBuffer.toString();
}

// For production, use this instead:
/*
import CryptoJS from 'crypto-js';

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
*/

