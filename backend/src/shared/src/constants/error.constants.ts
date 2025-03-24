/**
 * Defines standardized error constants used across the Tribe platform's microservices.
 * This module ensures consistent error handling and response formats throughout the application.
 */

/**
 * Standard HTTP status codes used in API responses
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Application-specific error codes for different error scenarios
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INVALID_OPERATION: 'INVALID_OPERATION',
  TRIBE_ERROR: 'TRIBE_ERROR',
  EVENT_ERROR: 'EVENT_ERROR',
  MATCHING_ERROR: 'MATCHING_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR'
};

/**
 * User-friendly error messages for different error scenarios
 */
export const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'The provided data is invalid or incomplete.',
  AUTHENTICATION_REQUIRED: 'Authentication is required to access this resource.',
  INVALID_CREDENTIALS: 'The provided credentials are invalid.',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  INVALID_TOKEN: 'Invalid authentication token.',
  ACCOUNT_LOCKED: 'Your account has been temporarily locked due to too many failed attempts.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  RESOURCE_NOT_FOUND: 'The requested resource was not found.',
  USER_NOT_FOUND: 'The specified user was not found.',
  TRIBE_NOT_FOUND: 'The specified Tribe was not found.',
  EVENT_NOT_FOUND: 'The specified event was not found.',
  PROFILE_NOT_FOUND: 'The specified profile was not found.',
  RESOURCE_ALREADY_EXISTS: 'The resource already exists.',
  EMAIL_ALREADY_EXISTS: 'A user with this email already exists.',
  USERNAME_ALREADY_EXISTS: 'A user with this username already exists.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
  DATABASE_ERROR: 'A database error occurred. Please try again later.',
  EXTERNAL_SERVICE_ERROR: 'An error occurred with an external service. Please try again later.',
  TRIBE_MEMBERSHIP_LIMIT: 'You have reached the maximum number of Tribes you can join.',
  TRIBE_SIZE_LIMIT: 'This Tribe has reached its maximum membership capacity.',
  INVALID_OPERATION: 'This operation cannot be performed.',
  PAYMENT_FAILED: 'The payment could not be processed. Please try again or use a different payment method.',
  AI_SERVICE_ERROR: 'Our recommendation service is temporarily unavailable. Please try again later.'
};

/**
 * Maps error codes to HTTP status codes for consistent error responses
 */
export const ERROR_STATUS_MAP: Record<string, number> = {
  [ERROR_CODES.VALIDATION_ERROR]: HTTP_STATUS.BAD_REQUEST,
  [ERROR_CODES.AUTHENTICATION_ERROR]: HTTP_STATUS.UNAUTHORIZED,
  [ERROR_CODES.AUTHORIZATION_ERROR]: HTTP_STATUS.FORBIDDEN,
  [ERROR_CODES.RESOURCE_NOT_FOUND]: HTTP_STATUS.NOT_FOUND,
  [ERROR_CODES.RESOURCE_CONFLICT]: HTTP_STATUS.CONFLICT,
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: HTTP_STATUS.TOO_MANY_REQUESTS,
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: HTTP_STATUS.SERVICE_UNAVAILABLE,
  [ERROR_CODES.DATABASE_ERROR]: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  [ERROR_CODES.INVALID_OPERATION]: HTTP_STATUS.UNPROCESSABLE_ENTITY,
  [ERROR_CODES.TRIBE_ERROR]: HTTP_STATUS.BAD_REQUEST,
  [ERROR_CODES.EVENT_ERROR]: HTTP_STATUS.BAD_REQUEST,
  [ERROR_CODES.MATCHING_ERROR]: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  [ERROR_CODES.PAYMENT_ERROR]: HTTP_STATUS.BAD_REQUEST,
  [ERROR_CODES.AI_SERVICE_ERROR]: HTTP_STATUS.SERVICE_UNAVAILABLE
};

/**
 * Default error message used when no specific message is provided
 */
export const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again later.';