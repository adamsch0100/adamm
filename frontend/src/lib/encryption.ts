/**
 * AES-256-GCM encryption/decryption utility for API keys
 * SECURE production-ready implementation
 */

import { createCipheriv, createDecipheriv, scryptSync, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.error('CRITICAL: ENCRYPTION_KEY must be at least 32 characters long for AES-256');
  console.error('Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

/**
 * Encrypts text using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Base64 encoded encrypted string with IV and auth tag
 */
export function encrypt(text: string): string {
  try {
    // Generate a random 96-bit IV (12 bytes)
    const iv = randomBytes(12);

    // Derive 256-bit key using scrypt
    const key = scryptSync(ENCRYPTION_KEY, 'salt', 32);

    // Create cipher
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get the authentication tag
    const authTag = cipher.getAuthTag();

    // Combine: IV + Auth Tag + Encrypted Data
    const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

    return result;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts text using AES-256-GCM
 * @param encrypted - Base64 encoded encrypted string with IV and auth tag
 * @returns Decrypted plain text
 */
export function decrypt(encrypted: string): string {
  try {
    // Split the encrypted string: IV:AuthTag:EncryptedData
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const ivHex = parts[0];
    const authTagHex = parts[1];
    const encryptedData = parts[2];

    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Derive the same key
    const key = scryptSync(ENCRYPTION_KEY, 'salt', 32);

    // Create decipher
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - possibly corrupted or wrong key');
  }
}

/**
 * Validates that encryption/decryption works correctly
 * @returns boolean indicating if encryption is working
 */
export function validateEncryption(): boolean {
  try {
    const testText = 'test-api-key-12345';
    const encrypted = encrypt(testText);
    const decrypted = decrypt(encrypted);

    if (decrypted === testText) {
      console.log('✅ Encryption validation passed');
      return true;
    } else {
      console.error('❌ Encryption validation failed - data corruption');
      return false;
    }
  } catch (error) {
    console.error('❌ Encryption validation failed:', error);
    return false;
  }
  }
  
// Validate encryption on module load
if (process.env.NODE_ENV === 'production') {
  const isValid = validateEncryption();
  if (!isValid) {
    console.error('CRITICAL: Encryption system failed validation. Aborting startup.');
    process.exit(1);
  }
}

// Legacy support - if you need to migrate old XOR-encrypted data
export function migrateOldEncryption(oldEncrypted: string): string | null {
  try {
    // Try to decrypt with old XOR method
    const oldKey = ENCRYPTION_KEY;
    const encryptedBuffer = Buffer.from(oldEncrypted, 'base64');
  const decryptedBuffer = Buffer.from(
    Array.from(encryptedBuffer).map((byte, i) => 
        byte ^ oldKey.charCodeAt(i % oldKey.length)
    )
  );
    const migratedText = decryptedBuffer.toString();

    // Re-encrypt with new AES method
    return encrypt(migratedText);
  } catch (error) {
    console.warn('Could not migrate old encrypted data:', error);
    return null;
}
}

