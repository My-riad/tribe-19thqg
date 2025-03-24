import {
  HTTP_STATUS,
  ERROR_CODES,
  ERROR_MESSAGES,
  DEFAULT_ERROR_MESSAGE
} from '../constants/error.constants';

/**
 * Base error class for all API errors in the Tribe platform.
 * Extends the native Error class with additional properties for
 * HTTP status codes, error codes, and custom data.
 */
export class ApiError extends Error {
  /**
   * The error code identifying the type of error
   */
  public code: string;

  /**
   * The HTTP status code to be used in the API response
   */
  public statusCode: number;

  /**
   * Additional data related to the error
   */
  public data?: any;

  /**
   * Creates a new ApiError instance with the specified error details
   * 
   * @param message - The error message
   * @param code - The error code
   * @param statusCode - The HTTP status code
   * @param data - Additional error data
   */
  constructor(
    message: string,
    code: string = ERROR_CODES.INTERNAL_SERVER_ERROR,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    data?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;
    
    // Capture stack trace (only works if Error.captureStackTrace is available)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Converts the error to a standardized JSON format for API responses
   * 
   * @returns A structured error response object with error details
   */
  toJSON() {
    const response: Record<string, any> = {
      error: true,
      message: this.message,
      code: this.code
    };

    if (this.data) {
      response.data = this.data;
    }

    // Include stack trace in development environment
    if (process.env.NODE_ENV === 'development') {
      response.stack = this.stack;
    }

    return response;
  }

  /**
   * Creates a new ApiError instance for bad request errors
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new ApiError instance for bad request errors
   */
  static badRequest(message: string = ERROR_MESSAGES.VALIDATION_ERROR, data?: any): ApiError {
    return new ApiError(
      message,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
      data
    );
  }

  /**
   * Creates a new ApiError instance for unauthorized access errors
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new ApiError instance for unauthorized errors
   */
  static unauthorized(message: string = ERROR_MESSAGES.AUTHENTICATION_REQUIRED, data?: any): ApiError {
    return new ApiError(
      message,
      ERROR_CODES.AUTHENTICATION_ERROR,
      HTTP_STATUS.UNAUTHORIZED,
      data
    );
  }

  /**
   * Creates a new ApiError instance for forbidden access errors
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new ApiError instance for forbidden errors
   */
  static forbidden(message: string = ERROR_MESSAGES.PERMISSION_DENIED, data?: any): ApiError {
    return new ApiError(
      message,
      ERROR_CODES.AUTHORIZATION_ERROR,
      HTTP_STATUS.FORBIDDEN,
      data
    );
  }

  /**
   * Creates a new ApiError instance for resource not found errors
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new ApiError instance for not found errors
   */
  static notFound(message: string = ERROR_MESSAGES.RESOURCE_NOT_FOUND, data?: any): ApiError {
    return new ApiError(
      message,
      ERROR_CODES.RESOURCE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
      data
    );
  }

  /**
   * Creates a new ApiError instance for resource conflict errors
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new ApiError instance for conflict errors
   */
  static conflict(message: string = ERROR_MESSAGES.RESOURCE_ALREADY_EXISTS, data?: any): ApiError {
    return new ApiError(
      message,
      ERROR_CODES.RESOURCE_CONFLICT,
      HTTP_STATUS.CONFLICT,
      data
    );
  }

  /**
   * Creates a new ApiError instance for rate limiting errors
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new ApiError instance for rate limit errors
   */
  static tooManyRequests(message: string = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, data?: any): ApiError {
    return new ApiError(
      message,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      data
    );
  }

  /**
   * Creates a new ApiError instance for internal server errors
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new ApiError instance for internal server errors
   */
  static internal(message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR, data?: any): ApiError {
    return new ApiError(
      message,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      data
    );
  }

  /**
   * Creates a new ApiError instance for service unavailable errors
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new ApiError instance for service unavailable errors
   */
  static serviceUnavailable(message: string = ERROR_MESSAGES.SERVICE_UNAVAILABLE, data?: any): ApiError {
    return new ApiError(
      message,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      data
    );
  }

  /**
   * Creates a new ApiError instance for external service integration errors
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new ApiError instance for external service errors
   */
  static externalServiceError(message: string = ERROR_MESSAGES.EXTERNAL_SERVICE_ERROR, data?: any): ApiError {
    return new ApiError(
      message,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      data
    );
  }

  /**
   * Creates a new ApiError instance from a generic Error object
   * 
   * @param error - The original error object
   * @param data - Additional error data
   * @returns A new ApiError instance based on the original error
   */
  static fromError(error: Error, data?: any): ApiError {
    const combinedData = {
      originalError: {
        name: error.name,
        stack: error.stack
      },
      ...data
    };

    return new ApiError(
      error.message || DEFAULT_ERROR_MESSAGE,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      combinedData
    );
  }
}