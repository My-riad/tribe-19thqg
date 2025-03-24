import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import {
  validateBody,
  validateQuery,
  validateParams,
  validateRequest
} from '../../shared/src/middlewares/validation.middleware';

import {
  loginSchema,
  registrationSchema,
  refreshTokenSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  emailVerificationSchema,
  socialLoginSchema,
  logoutSchema
} from '../validations/auth.validation';

import {
  userCreateSchema,
  userUpdateSchema,
  userStatusSchema,
  userRoleSchema,
  userIdSchema,
  passwordChangeSchema
} from '../validations/user.validation';

/**
 * Middleware for validating login requests
 * @returns Express middleware function that validates login request body
 */
export const validateLogin = () => {
  return validateBody(loginSchema);
};

/**
 * Middleware for validating registration requests
 * @returns Express middleware function that validates registration request body
 */
export const validateRegistration = () => {
  return validateBody(registrationSchema);
};

/**
 * Middleware for validating token refresh requests
 * @returns Express middleware function that validates refresh token request body
 */
export const validateRefreshToken = () => {
  return validateBody(refreshTokenSchema);
};

/**
 * Middleware for validating password reset requests
 * @returns Express middleware function that validates password reset request body
 */
export const validatePasswordReset = () => {
  return validateBody(passwordResetRequestSchema);
};

/**
 * Middleware for validating password reset confirmation requests
 * @returns Express middleware function that validates password reset confirmation request body
 */
export const validatePasswordResetConfirm = () => {
  return validateBody(passwordResetConfirmSchema);
};

/**
 * Middleware for validating email verification requests
 * @returns Express middleware function that validates email verification request body
 */
export const validateEmailVerification = () => {
  return validateBody(emailVerificationSchema);
};

/**
 * Middleware for validating social login requests
 * @returns Express middleware function that validates social login request body
 */
export const validateSocialLogin = () => {
  return validateBody(socialLoginSchema);
};

/**
 * Middleware for validating logout requests
 * @returns Express middleware function that validates logout request body
 */
export const validateLogout = () => {
  return validateBody(logoutSchema);
};

/**
 * Middleware for validating user ID parameters
 * @returns Express middleware function that validates user ID in request parameters
 */
export const validateUserId = () => {
  return validateParams(userIdSchema);
};

/**
 * Middleware for validating user creation requests
 * @returns Express middleware function that validates user creation request body
 */
export const validateUserCreate = () => {
  return validateBody(userCreateSchema);
};

/**
 * Middleware for validating user update requests
 * @returns Express middleware function that validates user update request body
 */
export const validateUserUpdate = () => {
  return validateBody(userUpdateSchema);
};

/**
 * Middleware for validating user status update requests
 * @returns Express middleware function that validates user status update request body
 */
export const validateUserStatus = () => {
  return validateBody(userStatusSchema);
};

/**
 * Middleware for validating user role update requests
 * @returns Express middleware function that validates user role update request body
 */
export const validateUserRole = () => {
  return validateBody(userRoleSchema);
};

/**
 * Middleware for validating password change requests
 * @returns Express middleware function that validates password change request body
 */
export const validatePasswordChange = () => {
  return validateBody(passwordChangeSchema);
};