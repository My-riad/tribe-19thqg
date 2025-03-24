import Joi from 'joi'; // v17.9.2
import { ValidationError } from '../../shared/src/errors/validation.error';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../../shared/src/constants/regex.constants';
import { AuthProvider } from '../../shared/src/types/user.types';

// Login schema - validates email and password for login requests
export const loginSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_REGEX).required().messages({
    'string.pattern.base': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

// Registration schema - validates user registration data
export const registrationSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_REGEX).required().messages({
    'string.pattern.base': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().pattern(PASSWORD_REGEX).required().messages({
    'string.pattern.base': 'Password must be at least 10 characters and include uppercase, lowercase, number, and special character',
    'any.required': 'Password is required'
  }),
  authProvider: Joi.string().valid(...Object.values(AuthProvider)).default(AuthProvider.LOCAL).messages({
    'any.only': 'Auth provider must be one of: Local, Google, Apple, Facebook'
  }),
  providerId: Joi.string().when('authProvider', {
    is: AuthProvider.LOCAL,
    then: Joi.string().optional(),
    otherwise: Joi.string().required().messages({
      'any.required': 'Provider ID is required for social authentication'
    })
  })
});

// Refresh token schema - validates refresh token requests
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

// Password reset request schema - validates password reset requests
export const passwordResetRequestSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_REGEX).required().messages({
    'string.pattern.base': 'Invalid email format',
    'any.required': 'Email is required'
  })
});

// Password reset confirmation schema - validates password reset confirmations
export const passwordResetConfirmSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  }),
  newPassword: Joi.string().pattern(PASSWORD_REGEX).required().messages({
    'string.pattern.base': 'Password must be at least 10 characters and include uppercase, lowercase, number, and special character',
    'any.required': 'New password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords must match',
    'any.required': 'Password confirmation is required'
  })
});

// Email verification schema - validates email verification requests
export const emailVerificationSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Verification token is required'
  })
});

// Social login schema - validates social login requests
export const socialLoginSchema = Joi.object({
  provider: Joi.string().valid(...Object.values(AuthProvider)).required().messages({
    'any.required': 'Provider is required',
    'any.only': 'Provider must be one of: Local, Google, Apple, Facebook'
  }),
  token: Joi.string().required().messages({
    'any.required': 'Provider token is required'
  }),
  email: Joi.string().pattern(EMAIL_REGEX).optional().messages({
    'string.pattern.base': 'Invalid email format'
  })
});

// Logout schema - validates logout requests
export const logoutSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

/**
 * Validates login request data against the loginSchema
 * 
 * @param credentials - The login credentials to validate
 * @returns Validated login credentials or throws ValidationError
 */
export function validateLogin(credentials: any) {
  const { error, value } = loginSchema.validate(credentials, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates registration request data against the registrationSchema
 * 
 * @param userData - The registration data to validate
 * @returns Validated registration data or throws ValidationError
 */
export function validateRegistration(userData: any) {
  const { error, value } = registrationSchema.validate(userData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates refresh token request data against the refreshTokenSchema
 * 
 * @param tokenData - The token data to validate
 * @returns Validated token data or throws ValidationError
 */
export function validateRefreshToken(tokenData: any) {
  const { error, value } = refreshTokenSchema.validate(tokenData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates password reset request data against the passwordResetRequestSchema
 * 
 * @param resetData - The password reset data to validate
 * @returns Validated reset request data or throws ValidationError
 */
export function validatePasswordReset(resetData: any) {
  const { error, value } = passwordResetRequestSchema.validate(resetData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates password reset confirmation data against the passwordResetConfirmSchema
 * 
 * @param resetData - The password reset confirmation data to validate
 * @returns Validated reset confirmation data or throws ValidationError
 */
export function validatePasswordResetConfirm(resetData: any) {
  const { error, value } = passwordResetConfirmSchema.validate(resetData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates email verification request data against the emailVerificationSchema
 * 
 * @param verificationData - The email verification data to validate
 * @returns Validated verification data or throws ValidationError
 */
export function validateEmailVerification(verificationData: any) {
  const { error, value } = emailVerificationSchema.validate(verificationData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates social login request data against the socialLoginSchema
 * 
 * @param socialData - The social login data to validate
 * @returns Validated social login data or throws ValidationError
 */
export function validateSocialLogin(socialData: any) {
  const { error, value } = socialLoginSchema.validate(socialData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates logout request data against the logoutSchema
 * 
 * @param logoutData - The logout data to validate
 * @returns Validated logout data or throws ValidationError
 */
export function validateLogout(logoutData: any) {
  const { error, value } = logoutSchema.validate(logoutData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}