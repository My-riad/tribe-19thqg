import { ApiError } from './api.error';
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from '../constants/error.constants';

/**
 * Specialized error class for handling authentication-related errors in the Tribe platform.
 * Extends the base ApiError class to provide specific error types and messages for
 * authentication failures.
 */
export class AuthError extends ApiError {
  /**
   * Creates a new AuthError instance with the specified error details
   * 
   * @param message - The error message
   * @param code - The error code
   * @param data - Additional error data
   */
  constructor(
    message: string,
    code: string = ERROR_CODES.AUTHENTICATION_ERROR,
    data?: any
  ) {
    super(message, code, HTTP_STATUS.UNAUTHORIZED, data);
    this.name = 'AuthError';
  }

  /**
   * Creates a new AuthError instance for invalid login credentials
   * 
   * @param data - Additional error data
   * @returns A new AuthError instance for invalid credentials
   */
  static invalidCredentials(data?: any): AuthError {
    return new AuthError(
      ERROR_MESSAGES.INVALID_CREDENTIALS,
      ERROR_CODES.AUTHENTICATION_ERROR,
      data
    );
  }

  /**
   * Creates a new AuthError instance for expired authentication tokens
   * 
   * @param data - Additional error data
   * @returns A new AuthError instance for token expiration
   */
  static tokenExpired(data?: any): AuthError {
    return new AuthError(
      ERROR_MESSAGES.TOKEN_EXPIRED,
      ERROR_CODES.AUTHENTICATION_ERROR,
      data
    );
  }

  /**
   * Creates a new AuthError instance for invalid or malformed tokens
   * 
   * @param data - Additional error data
   * @returns A new AuthError instance for invalid tokens
   */
  static invalidToken(data?: any): AuthError {
    return new AuthError(
      ERROR_MESSAGES.INVALID_TOKEN,
      ERROR_CODES.AUTHENTICATION_ERROR,
      data
    );
  }

  /**
   * Creates a new AuthError instance for locked user accounts
   * 
   * @param data - Additional error data
   * @returns A new AuthError instance for account lockouts
   */
  static accountLocked(data?: any): AuthError {
    return new AuthError(
      ERROR_MESSAGES.ACCOUNT_LOCKED,
      ERROR_CODES.AUTHENTICATION_ERROR,
      data
    );
  }

  /**
   * Creates a new AuthError instance for unverified user accounts
   * 
   * @param data - Additional error data
   * @returns A new AuthError instance for unverified accounts
   */
  static accountNotVerified(data?: any): AuthError {
    return new AuthError(
      'Account verification required. Please verify your email before proceeding.',
      ERROR_CODES.AUTHENTICATION_ERROR,
      data
    );
  }

  /**
   * Creates a new AuthError instance for expired user sessions
   * 
   * @param data - Additional error data
   * @returns A new AuthError instance for session expiration
   */
  static sessionExpired(data?: any): AuthError {
    return new AuthError(
      'Your session has expired. Please sign in again to continue.',
      ERROR_CODES.AUTHENTICATION_ERROR,
      data
    );
  }

  /**
   * Creates a new AuthError instance for social authentication failures
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new AuthError instance for social auth errors
   */
  static socialAuthError(message: string, data?: any): AuthError {
    return new AuthError(
      message,
      ERROR_CODES.AUTHENTICATION_ERROR,
      data
    );
  }

  /**
   * Creates a new AuthError instance for password reset failures
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new AuthError instance for password reset errors
   */
  static passwordResetError(message: string, data?: any): AuthError {
    return new AuthError(
      message,
      ERROR_CODES.AUTHENTICATION_ERROR,
      data
    );
  }

  /**
   * Creates a new AuthError instance for too many failed authentication attempts
   * 
   * @param data - Additional error data
   * @returns A new AuthError instance for rate limiting
   */
  static tooManyAttempts(data?: any): AuthError {
    const error = new AuthError(
      'Too many failed authentication attempts. Please try again later.',
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      data
    );
    error.statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
    return error;
  }
}