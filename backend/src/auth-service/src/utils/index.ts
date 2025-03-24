/**
 * Auth Service Utilities
 * 
 * This module serves as a centralized access point for utility functions used in the
 * auth service, particularly focusing on password handling and JWT token management.
 * 
 * By consolidating these utilities, we ensure consistent security practices throughout
 * the authentication system while providing a clean interface for other modules.
 */

// Import password utility functions
import * as passwordUtils from './password.util';

// Import token utility functions
import * as tokenUtils from './token.util';

// Re-export password utility functions
export const {
  hashPassword,
  comparePasswords,
  validatePasswordStrength,
  validatePasswordWithError,
  generateRandomPassword
} = passwordUtils;

// Re-export token utility functions
export const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  blacklistToken,
  isTokenBlacklisted,
  generateRandomToken,
  calculateExpirationDate
} = tokenUtils;