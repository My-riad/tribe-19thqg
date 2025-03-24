import crypto from 'crypto'; // built-in
import env from './env';
import { ValidationError } from '../shared/src/errors/validation.error';
import { logger } from '../shared/src/utils/logger.util';

/**
 * Enum of available secret keys for type-safe access
 */
export enum SecretKeys {
  JWT_SECRET = 'JWT_SECRET',
  MASTER_ENCRYPTION_KEY = 'MASTER_ENCRYPTION_KEY',
  OPENROUTER_API_KEY = 'OPENROUTER_API_KEY',
  STRIPE_API_KEY = 'STRIPE_API_KEY',
  VENMO_API_KEY = 'VENMO_API_KEY',
  GOOGLE_PLACES_API_KEY = 'GOOGLE_PLACES_API_KEY',
  EVENTBRITE_API_KEY = 'EVENTBRITE_API_KEY',
  MEETUP_API_KEY = 'MEETUP_API_KEY',
  OPENWEATHERMAP_API_KEY = 'OPENWEATHERMAP_API_KEY',
  FIREBASE_API_KEY = 'FIREBASE_API_KEY',
  DATABASE_ENCRYPTION_KEY = 'DATABASE_ENCRYPTION_KEY'
}

/**
 * Enum of available encryption key types
 */
export enum KeyType {
  MASTER = 'MASTER',
  DATABASE = 'DATABASE'
}

// Define constants for encryption
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM auth tag
const KEY_LENGTH = 32; // 32 bytes (256 bits) for AES-256

/**
 * Retrieves a secret value with optional decryption
 * 
 * @param key - The secret key to retrieve
 * @param decrypt - Whether to decrypt the value (defaults to false)
 * @returns The secret value, optionally decrypted
 * @throws ValidationError if the secret key doesn't exist
 */
function getSecret(key: string, decrypt: boolean = false): string {
  const value = process.env[key];
  
  if (!value) {
    throw ValidationError.invalidInput(`Secret key "${key}" not found in environment variables`);
  }
  
  if (decrypt) {
    try {
      return decryptValue(value, KeyType.MASTER);
    } catch (error) {
      logger.error(`Failed to decrypt secret ${key}`, error as Error);
      throw ValidationError.invalidInput(`Failed to decrypt secret "${key}". The encryption key may be incorrect.`);
    }
  }
  
  return value;
}

/**
 * Encrypts a value using AES-256-GCM with the specified encryption key
 * 
 * @param value - The value to encrypt
 * @param keyType - The type of encryption key to use (MASTER or DATABASE)
 * @returns The encrypted value as a base64 string
 * @throws ValidationError if the encryption key is not available or encryption fails
 */
function encryptValue(value: string, keyType: KeyType = KeyType.MASTER): string {
  try {
    // Determine which encryption key to use
    let encryptionKeyString: string;
    
    switch (keyType) {
      case KeyType.MASTER:
        encryptionKeyString = env.MASTER_ENCRYPTION_KEY;
        break;
      case KeyType.DATABASE:
        encryptionKeyString = env.DATABASE_ENCRYPTION_KEY;
        break;
      default:
        throw ValidationError.invalidInput(`Invalid encryption key type: ${keyType}`);
    }
    
    if (!encryptionKeyString) {
      throw ValidationError.invalidInput(`${keyType} encryption key is not configured`);
    }
    
    // Process the encryption key
    let encryptionKey: Buffer;
    try {
      encryptionKey = Buffer.from(encryptionKeyString, 'base64');
      
      // If the key is not exactly 32 bytes, derive a 32-byte key using SHA-256
      if (encryptionKey.length !== KEY_LENGTH) {
        logger.warn(`${keyType} encryption key is not exactly ${KEY_LENGTH} bytes. Using derived key.`);
        encryptionKey = crypto.createHash('sha256').update(encryptionKeyString).digest();
      }
    } catch (error) {
      logger.error(`Invalid encryption key format for ${keyType}`, error as Error);
      throw new Error(`Invalid encryption key format for ${keyType}`);
    }
    
    // Generate a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create a cipher with AES-256-GCM algorithm
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
    
    // Encrypt the value
    let encrypted = cipher.update(value, 'utf8', 'buffer');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted data, and authentication tag for storage
    // Format: IV (16 bytes) + Encrypted Data (variable) + Auth Tag (16 bytes)
    const combined = Buffer.concat([iv, encrypted, authTag]);
    
    // Return the result as a base64-encoded string for safe storage
    return combined.toString('base64');
  } catch (error) {
    logger.error('Encryption failed', error as Error);
    throw ValidationError.invalidInput(`Failed to encrypt value: ${(error as Error).message}`);
  }
}

/**
 * Decrypts a value that was encrypted with encryptValue
 * 
 * @param encryptedValue - The encrypted value to decrypt
 * @param keyType - The type of encryption key to use (MASTER or DATABASE)
 * @returns The decrypted value
 * @throws ValidationError if decryption fails
 */
function decryptValue(encryptedValue: string, keyType: KeyType = KeyType.MASTER): string {
  try {
    // Determine which encryption key to use
    let encryptionKeyString: string;
    
    switch (keyType) {
      case KeyType.MASTER:
        encryptionKeyString = env.MASTER_ENCRYPTION_KEY;
        break;
      case KeyType.DATABASE:
        encryptionKeyString = env.DATABASE_ENCRYPTION_KEY;
        break;
      default:
        throw ValidationError.invalidInput(`Invalid encryption key type: ${keyType}`);
    }
    
    if (!encryptionKeyString) {
      throw ValidationError.invalidInput(`${keyType} encryption key is not configured`);
    }
    
    // Process the encryption key
    let encryptionKey: Buffer;
    try {
      encryptionKey = Buffer.from(encryptionKeyString, 'base64');
      
      // If the key is not exactly 32 bytes, derive a 32-byte key using SHA-256
      if (encryptionKey.length !== KEY_LENGTH) {
        logger.warn(`${keyType} encryption key is not exactly ${KEY_LENGTH} bytes. Using derived key.`);
        encryptionKey = crypto.createHash('sha256').update(encryptionKeyString).digest();
      }
    } catch (error) {
      logger.error(`Invalid encryption key format for ${keyType}`, error as Error);
      throw new Error(`Invalid encryption key format for ${keyType}`);
    }
    
    // Decode the base64 encrypted value
    const combined = Buffer.from(encryptedValue, 'base64');
    
    // Ensure the combined buffer is long enough
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Invalid encrypted value format');
    }
    
    // Extract the IV (first 16 bytes)
    const iv = combined.slice(0, IV_LENGTH);
    
    // Extract the authentication tag (last 16 bytes)
    const authTag = combined.slice(combined.length - AUTH_TAG_LENGTH);
    
    // Extract the encrypted data (everything in between)
    const encryptedData = combined.slice(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);
    
    // Create a decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
    
    // Set the authentication tag
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // Return the decrypted value as a string
    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('Decryption failed', error as Error);
    throw ValidationError.invalidInput(`Failed to decrypt value: ${(error as Error).message}`);
  }
}

/**
 * Validates that all required secrets are present and properly formatted
 * 
 * @returns True if all required secrets are valid
 * @throws ValidationError if any required secret is missing or invalid
 */
function validateRequiredSecrets(): boolean {
  // Define required secrets based on environment
  const requiredSecrets: string[] = [];
  
  // Base secrets required in all environments
  requiredSecrets.push('JWT_SECRET', 'MASTER_ENCRYPTION_KEY');
  
  // Add production-specific required secrets
  if (env.NODE_ENV === 'production') {
    requiredSecrets.push(
      'DATABASE_ENCRYPTION_KEY',
      'OPENROUTER_API_KEY',
      'STRIPE_API_KEY',
      'GOOGLE_PLACES_API_KEY'
    );
  }
  
  const missingSecrets: string[] = [];
  const invalidSecrets: string[] = [];
  
  // Check if each required secret is defined
  for (const secret of requiredSecrets) {
    const value = process.env[secret];
    
    if (!value) {
      missingSecrets.push(secret);
      continue;
    }
    
    // Validate format of specific secrets
    if ((secret === 'MASTER_ENCRYPTION_KEY' || secret === 'DATABASE_ENCRYPTION_KEY')) {
      try {
        const keyBuffer = Buffer.from(value, 'base64');
        if (keyBuffer.length !== KEY_LENGTH) {
          logger.warn(`${secret} is not exactly ${KEY_LENGTH} bytes. A key will be derived from it.`);
        }
      } catch (error) {
        invalidSecrets.push(secret);
      }
    }
  }
  
  // Report any missing or invalid secrets
  if (missingSecrets.length > 0) {
    throw ValidationError.invalidInput(`Missing required secrets: ${missingSecrets.join(', ')}`);
  }
  
  if (invalidSecrets.length > 0) {
    throw ValidationError.invalidInput(`Invalid format for secrets: ${invalidSecrets.join(', ')}`);
  }
  
  logger.info('All required secrets are present and valid');
  return true;
}

/**
 * Generates a secure random encryption key for development purposes
 * 
 * @returns A base64-encoded 32-byte encryption key
 */
function generateEncryptionKey(): string | null {
  if (env.NODE_ENV !== 'development') {
    logger.warn('Encryption key generation is only available in development environment');
    return null;
  }
  
  // Generate 32 random bytes (256 bits)
  const key = crypto.randomBytes(KEY_LENGTH);
  
  // Convert to base64 for storage in environment variables
  return key.toString('base64');
}

export default {
  getSecret,
  encryptValue,
  decryptValue,
  validateRequiredSecrets,
  generateEncryptionKey
};