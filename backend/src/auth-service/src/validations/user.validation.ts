import Joi from 'joi';
import { ValidationError } from '../../shared/src/errors/validation.error';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../../shared/src/constants/regex.constants';
import { UserRole, UserStatus, AuthProvider } from '../../shared/src/types/user.types';

/**
 * Validation schema for user creation
 * Enforces email/password requirements and validates against allowed enum values
 */
export const userCreateSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_REGEX).required().messages({
    'string.pattern.base': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().pattern(PASSWORD_REGEX).required().messages({
    'string.pattern.base': 'Password must be at least 10 characters and include uppercase, lowercase, number, and special character',
    'any.required': 'Password is required'
  }),
  role: Joi.string().valid(...Object.values(UserRole)).default(UserRole.USER).messages({
    'any.only': 'Role must be one of: USER, ADMIN, SYSTEM'
  }),
  status: Joi.string().valid(...Object.values(UserStatus)).default(UserStatus.PENDING).messages({
    'any.only': 'Status must be one of: ACTIVE, PENDING, SUSPENDED, LOCKED, DELETED'
  }),
  isVerified: Joi.boolean().default(false),
  provider: Joi.string().valid(...Object.values(AuthProvider)).default(AuthProvider.LOCAL).messages({
    'any.only': 'Provider must be one of: LOCAL, GOOGLE, APPLE, FACEBOOK'
  }),
  providerId: Joi.string().when('provider', {
    is: AuthProvider.LOCAL,
    then: Joi.string().optional(),
    otherwise: Joi.string().required().messages({
      'any.required': 'Provider ID is required for social authentication'
    })
  })
});

/**
 * Validation schema for user updates
 * All fields are optional but at least one must be provided
 */
export const userUpdateSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_REGEX).optional().messages({
    'string.pattern.base': 'Invalid email format'
  }),
  role: Joi.string().valid(...Object.values(UserRole)).optional().messages({
    'any.only': 'Role must be one of: USER, ADMIN, SYSTEM'
  }),
  status: Joi.string().valid(...Object.values(UserStatus)).optional().messages({
    'any.only': 'Status must be one of: ACTIVE, PENDING, SUSPENDED, LOCKED, DELETED'
  }),
  isVerified: Joi.boolean().optional(),
  provider: Joi.string().valid(...Object.values(AuthProvider)).optional().messages({
    'any.only': 'Provider must be one of: LOCAL, GOOGLE, APPLE, FACEBOOK'
  }),
  providerId: Joi.string().optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Validation schema for user status updates
 */
export const userStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(UserStatus)).required().messages({
    'any.required': 'Status is required',
    'any.only': 'Status must be one of: ACTIVE, PENDING, SUSPENDED, LOCKED, DELETED'
  })
});

/**
 * Validation schema for user role updates
 */
export const userRoleSchema = Joi.object({
  role: Joi.string().valid(...Object.values(UserRole)).required().messages({
    'any.required': 'Role is required',
    'any.only': 'Role must be one of: USER, ADMIN, SYSTEM'
  })
});

/**
 * Validation schema for user ID parameters
 */
export const userIdSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'User ID is required'
  })
});

/**
 * Validation schema for password change requests
 * Requires current password, new password, and confirmation
 */
export const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
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
 * Validates user creation request data against the userCreateSchema
 * 
 * @param userData - The user data to validate
 * @returns The validated user data
 * @throws ValidationError if validation fails
 */
export const validateUserCreate = (userData: any) => {
  const { error, value } = userCreateSchema.validate(userData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};

/**
 * Validates user update request data against the userUpdateSchema
 * 
 * @param userData - The user data to validate
 * @returns The validated user data
 * @throws ValidationError if validation fails
 */
export const validateUserUpdate = (userData: any) => {
  const { error, value } = userUpdateSchema.validate(userData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};

/**
 * Validates user status update request data against the userStatusSchema
 * 
 * @param statusData - The status data to validate
 * @returns The validated status data
 * @throws ValidationError if validation fails
 */
export const validateUserStatus = (statusData: any) => {
  const { error, value } = userStatusSchema.validate(statusData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};

/**
 * Validates user role update request data against the userRoleSchema
 * 
 * @param roleData - The role data to validate
 * @returns The validated role data
 * @throws ValidationError if validation fails
 */
export const validateUserRole = (roleData: any) => {
  const { error, value } = userRoleSchema.validate(roleData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};

/**
 * Validates user ID parameter against the userIdSchema
 * 
 * @param params - The parameters containing the user ID
 * @returns The validated parameters
 * @throws ValidationError if validation fails
 */
export const validateUserId = (params: any) => {
  const { error, value } = userIdSchema.validate(params, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};

/**
 * Validates password change request data against the passwordChangeSchema
 * 
 * @param passwordData - The password change data to validate
 * @returns The validated password change data
 * @throws ValidationError if validation fails
 */
export const validatePasswordChange = (passwordData: any) => {
  const { error, value } = passwordChangeSchema.validate(passwordData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
};