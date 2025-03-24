/**
 * Authentication and Validation Middleware
 * 
 * This module exports all authentication and validation middleware components
 * for the Tribe authentication service. It provides a centralized import point
 * for consumers to access middleware for JWT-based authentication, role-based 
 * access control, and request data validation.
 * 
 * @module middleware
 */

// Import authentication middleware components
import { 
  authMiddleware, 
  roleAuthMiddleware, 
  adminOnly, 
  extractTokenFromHeader,
  AuthenticatedRequest
} from './auth.middleware';

// Import validation middleware components
import {
  validateLogin,
  validateRegistration,
  validateRefreshToken,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validateEmailVerification,
  validateSocialLogin,
  validateLogout,
  validateUserId,
  validateUserCreate,
  validateUserUpdate,
  validateUserStatus,
  validateUserRole,
  validatePasswordChange
} from './validation.middleware';

// Export authentication middleware components
export {
  authMiddleware,
  roleAuthMiddleware,
  adminOnly,
  extractTokenFromHeader,
  AuthenticatedRequest
};

// Export validation middleware components
export {
  validateLogin,
  validateRegistration,
  validateRefreshToken,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validateEmailVerification,
  validateSocialLogin,
  validateLogout,
  validateUserId,
  validateUserCreate,
  validateUserUpdate,
  validateUserStatus,
  validateUserRole,
  validatePasswordChange
};