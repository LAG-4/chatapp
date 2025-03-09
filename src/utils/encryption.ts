import { Buffer } from 'buffer';
import { randomBytes, createCipheriv, createDecipheriv, createHash, pbkdf2Sync } from 'crypto';

// Encryption key should be stored securely and derived from user-specific data
// For this implementation, we'll use a combination of userId and a salt
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Generate a deterministic key for a user
export function generateUserKey(userId: string): Buffer {
  // Create a deterministic salt based on userId
  const salt = createHash('sha256').update(userId).digest().slice(0, SALT_LENGTH);
  
  // Derive a key using PBKDF2
  return pbkdf2Sync(
    userId,
    salt,
    100000, // Number of iterations
    KEY_LENGTH,
    'sha256'
  );
}

// Encrypt a message
export function encryptMessage(text: string, userKey: Buffer): string {
  try {
    // Generate a random IV
    const iv = randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, userKey, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get the auth tag
    const tag = cipher.getAuthTag();

    // Combine IV, encrypted text, and auth tag
    const result = Buffer.concat([
      iv,
      Buffer.from(encrypted, 'base64'),
      tag
    ]);

    // Return as base64 string
    return result.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

// Decrypt a message
export function decryptMessage(encryptedData: string, userKey: Buffer): string {
  try {
    // Convert the combined data back to a buffer
    const data = Buffer.from(encryptedData, 'base64');

    // Extract the IV, encrypted text, and auth tag
    const iv = data.slice(0, IV_LENGTH);
    const tag = data.slice(-TAG_LENGTH);
    const encrypted = data.slice(IV_LENGTH, -TAG_LENGTH);

    // Create decipher
    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, userKey, iv);
    decipher.setAuthTag(tag);

    // Decrypt the text
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

// Helper function to check if a string is encrypted
export function isEncrypted(text: string): boolean {
  try {
    const decoded = Buffer.from(text, 'base64');
    // Minimum length check for IV + encrypted data + auth tag
    return decoded.length >= IV_LENGTH + TAG_LENGTH;
  } catch {
    return false;
  }
} 