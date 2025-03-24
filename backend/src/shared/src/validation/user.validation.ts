import * as Joi from 'joi';
import { ValidationError } from '../errors/validation.error';
import { EMAIL_REGEX, PASSWORD_REGEX, USERNAME_REGEX } from '../constants/regex.constants';
import { UserRole, UserStatus, AuthProvider } from '../types/user.types';
import { TRIBE_LIMITS } from '../constants/app.constants';

// Schema for validating user login credentials
export const userCredentialsSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_REGEX).required().messages({
    'string.pattern.base': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

// Schema for validating user creation
export const userCreateSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_REGEX).required().messages({
    'string.pattern.base': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().pattern(PASSWORD_REGEX).required().messages({
    'string.pattern.base': 'Password must be at least 10 characters and include uppercase, lowercase, number, and special character',
    'any.required': 'Password is required'
  }),
  username: Joi.string().pattern(USERNAME_REGEX).min(3).max(30).messages({
    'string.pattern.base': 'Username can only contain letters, numbers, dots, underscores, and hyphens',
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username cannot exceed 30 characters'
  }),
  role: Joi.string().valid(...Object.values(UserRole)).default(UserRole.USER).messages({
    'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`
  }),
  status: Joi.string().valid(...Object.values(UserStatus)).default(UserStatus.PENDING).messages({
    'any.only': `Status must be one of: ${Object.values(UserStatus).join(', ')}`
  }),
  provider: Joi.string().valid(...Object.values(AuthProvider)).default(AuthProvider.LOCAL).messages({
    'any.only': `Provider must be one of: ${Object.values(AuthProvider).join(', ')}`
  }),
  providerId: Joi.string().when('provider', {
    is: AuthProvider.LOCAL,
    then: Joi.string().optional(),
    otherwise: Joi.string().required().messages({
      'any.required': 'Provider ID is required for social authentication'
    })
  })
});

// Schema for validating user updates
export const userUpdateSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_REGEX).messages({
    'string.pattern.base': 'Invalid email format'
  }),
  password: Joi.string().pattern(PASSWORD_REGEX).messages({
    'string.pattern.base': 'Password must be at least 10 characters and include uppercase, lowercase, number, and special character'
  }),
  username: Joi.string().pattern(USERNAME_REGEX).min(3).max(30).messages({
    'string.pattern.base': 'Username can only contain letters, numbers, dots, underscores, and hyphens',
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username cannot exceed 30 characters'
  }),
  role: Joi.string().valid(...Object.values(UserRole)).messages({
    'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`
  }),
  status: Joi.string().valid(...Object.values(UserStatus)).messages({
    'any.only': `Status must be one of: ${Object.values(UserStatus).join(', ')}`
  }),
  provider: Joi.string().valid(...Object.values(AuthProvider)).messages({
    'any.only': `Provider must be one of: ${Object.values(AuthProvider).join(', ')}`
  }),
  providerId: Joi.string()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Schema for validating passwords
export const passwordSchema = Joi.string().pattern(PASSWORD_REGEX).required().messages({
  'string.pattern.base': 'Password must be at least 10 characters and include uppercase, lowercase, number, and special character',
  'any.required': 'Password is required'
});

// Schema for validating emails
export const emailSchema = Joi.string().pattern(EMAIL_REGEX).required().messages({
  'string.pattern.base': 'Invalid email format',
  'any.required': 'Email is required'
});

// Schema for validating usernames
export const usernameSchema = Joi.string().pattern(USERNAME_REGEX).min(3).max(30).required().messages({
  'string.pattern.base': 'Username can only contain letters, numbers, dots, underscores, and hyphens',
  'string.min': 'Username must be at least 3 characters',
  'string.max': 'Username cannot exceed 30 characters',
  'any.required': 'Username is required'
});

// Schema for validating user roles
export const userRoleSchema = Joi.string().valid(...Object.values(UserRole)).required().messages({
  'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`,
  'any.required': 'Role is required'
});

// Schema for validating user statuses
export const userStatusSchema = Joi.string().valid(...Object.values(UserStatus)).required().messages({
  'any.only': `Status must be one of: ${Object.values(UserStatus).join(', ')}`,
  'any.required': 'Status is required'
});

// Schema for validating social authentication data
export const socialAuthSchema = Joi.object({
  provider: Joi.string().valid(AuthProvider.GOOGLE, AuthProvider.APPLE, AuthProvider.FACEBOOK).required().messages({
    'any.required': 'Provider is required',
    'any.only': 'Provider must be one of: Google, Apple, Facebook'
  }),
  token: Joi.string().required().messages({
    'any.required': 'Authentication token is required'
  }),
  email: Joi.string().pattern(EMAIL_REGEX).messages({
    'string.pattern.base': 'Invalid email format'
  })
});

// Schema for validating password reset requests
export const passwordResetSchema = Joi.object({
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

/**
 * Validates user login credentials against the userCredentialsSchema
 * 
 * @param credentials - The credentials to validate
 * @returns The validated credentials if validation passes
 * @throws ValidationError if validation fails
 */
export const validateUserCredentials = (credentials: any): any => {
  const { error, value } = userCredentialsSchema.validate(credentials, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};

/**
 * Validates user creation data against the userCreateSchema
 * 
 * @param userData - The user data to validate
 * @returns The validated user data if validation passes
 * @throws ValidationError if validation fails
 */
export const validateUserCreate = (userData: any): any => {
  const { error, value } = userCreateSchema.validate(userData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};

/**
 * Validates user update data against the userUpdateSchema
 * 
 * @param updateData - The update data to validate
 * @returns The validated update data if validation passes
 * @throws ValidationError if validation fails
 */
export const validateUserUpdate = (updateData: any): any => {
  const { error, value } = userUpdateSchema.validate(updateData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};

/**
 * Validates a password against the passwordSchema
 * 
 * @param password - The password to validate
 * @returns The validated password if validation passes
 * @throws ValidationError if validation fails
 */
export const validatePassword = (password: string): string => {
  const { error, value } = passwordSchema.validate(password, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};

/**
 * Validates an email address against the emailSchema
 * 
 * @param email - The email to validate
 * @returns The validated email if validation passes
 * @throws ValidationError if validation fails
 */
export const validateEmail = (email: string): string => {
  const { error, value } = emailSchema.validate(email, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};

/**
 * Validates a username against the usernameSchema
 * 
 * @param username - The username to validate
 * @returns The validated username if validation passes
 * @throws ValidationError if validation fails
 */
export const validateUsername = (username: string): string => {
  const { error, value } = usernameSchema.validate(username, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};

/**
 * Validates a user role against the userRoleSchema
 * 
 * @param role - The role to validate
 * @returns The validated role if validation passes
 * @throws ValidationError if validation fails
 */
export const validateUserRole = (role: string): string => {
  const { error, value } = userRoleSchema.validate(role, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};

/**
 * Validates a user status against the userStatusSchema
 * 
 * @param status - The status to validate
 * @returns The validated status if validation passes
 * @throws ValidationError if validation fails
 */
export const validateUserStatus = (status: string): string => {
  const { error, value } = userStatusSchema.validate(status, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};