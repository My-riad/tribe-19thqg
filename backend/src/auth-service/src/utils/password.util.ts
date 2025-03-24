/**
 * Password utility module for the Tribe authentication service.
 * Provides functions for secure password handling including hashing,
 * comparison, validation, and generation.
 */

import * as bcrypt from 'bcrypt'; // v5.1.0
import * as generate from 'generate-password'; // v1.7.0
import { PASSWORD_REGEX } from '../../../shared/src/constants/regex.constants';
import { ValidationError } from '../../../shared/src/errors/validation.error';

/**
 * Number of salt rounds for bcrypt hashing.
 * Higher values increase security but require more processing time.
 * 12 rounds provides a good balance between security and performance.
 */
const SALT_ROUNDS = 12;

/**
 * Hashes a plain text password using bcrypt with a secure salt.
 * 
 * @param password - The plain text password to hash
 * @returns A Promise resolving to the securely hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plain text password with a hashed password to verify if they match.
 * Uses constant-time comparison to prevent timing attacks.
 * 
 * @param plainTextPassword - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns A Promise resolving to true if passwords match, false otherwise
 */
export async function comparePasswords(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hashedPassword);
}

/**
 * Validates a password against complexity requirements defined in PASSWORD_REGEX.
 * Requirements include minimum length, uppercase, lowercase, numbers, and special characters.
 * 
 * @param password - The password to validate
 * @returns True if password meets all requirements, false otherwise
 */
export function validatePasswordStrength(password: string): boolean {
  if (!password) {
    return false;
  }
  
  return PASSWORD_REGEX.test(password);
}

/**
 * Validates a password and throws a ValidationError if it doesn't meet requirements.
 * Used for immediate validation with error handling.
 * 
 * @param password - The password to validate
 * @throws ValidationError if the password doesn't meet complexity requirements
 */
export function validatePasswordWithError(password: string): void {
  if (!validatePasswordStrength(password)) {
    throw new ValidationError(
      'Password must be at least 10 characters long and include uppercase letters, lowercase letters, numbers, and special characters.'
    );
  }
}

/**
 * Generates a secure random password that meets all complexity requirements.
 * 
 * @param length - The desired length of the password (defaults to 16)
 * @returns A randomly generated password that meets complexity requirements
 */
export function generateRandomPassword(length: number = 16): string {
  return generate.generate({
    length: length,
    numbers: true,
    symbols: true,
    uppercase: true,
    lowercase: true,
    strict: true, // Ensure all character types are included
    excludeSimilarCharacters: true // Improve readability by excluding similar characters
  });
}