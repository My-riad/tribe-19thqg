import { ApiError } from './api.error';
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from '../constants/error.constants';
import { Prisma } from '@prisma/client';

/**
 * Specialized error class for handling database-related errors in the Tribe platform.
 * Extends the base ApiError class with database-specific error handling methods.
 */
export class DatabaseError extends ApiError {
  /**
   * Creates a new DatabaseError instance with the specified error details
   * 
   * @param message - The error message
   * @param code - The error code
   * @param data - Additional error data
   */
  constructor(
    message: string,
    code: string = ERROR_CODES.DATABASE_ERROR,
    data?: any
  ) {
    super(message, code, HTTP_STATUS.INTERNAL_SERVER_ERROR, data);
    this.name = 'DatabaseError';
  }

  /**
   * Creates a new DatabaseError instance for database connection failures
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new DatabaseError instance for connection errors
   */
  static connectionError(message: string = ERROR_MESSAGES.DATABASE_ERROR, data?: any): DatabaseError {
    return new DatabaseError(
      message,
      ERROR_CODES.DATABASE_ERROR,
      data
    );
  }

  /**
   * Creates a new DatabaseError instance for database query failures
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new DatabaseError instance for query errors
   */
  static queryError(message: string = 'Database query failed', data?: any): DatabaseError {
    return new DatabaseError(
      message,
      ERROR_CODES.DATABASE_ERROR,
      data
    );
  }

  /**
   * Creates a new DatabaseError instance for database transaction failures
   * 
   * @param message - The error message
   * @param data - Additional error data
   * @returns A new DatabaseError instance for transaction errors
   */
  static transactionError(message: string = 'Database transaction failed', data?: any): DatabaseError {
    return new DatabaseError(
      message,
      ERROR_CODES.DATABASE_ERROR,
      data
    );
  }

  /**
   * Creates a new DatabaseError instance for unique constraint violations
   * 
   * @param field - The field that caused the constraint violation
   * @param data - Additional error data
   * @returns A new DatabaseError instance for unique constraint errors
   */
  static uniqueConstraintError(field: string, data?: any): DatabaseError {
    const message = `Unique constraint violation on field: ${field}`;
    return new ApiError(
      message,
      ERROR_CODES.RESOURCE_CONFLICT,
      HTTP_STATUS.CONFLICT,
      data
    ) as DatabaseError;
  }

  /**
   * Creates a new DatabaseError instance for foreign key constraint violations
   * 
   * @param field - The field that caused the constraint violation
   * @param data - Additional error data
   * @returns A new DatabaseError instance for foreign key errors
   */
  static foreignKeyError(field: string, data?: any): DatabaseError {
    const message = `Foreign key constraint violation on field: ${field}`;
    return new ApiError(
      message,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
      data
    ) as DatabaseError;
  }

  /**
   * Creates a new DatabaseError instance for record not found errors
   * 
   * @param entity - The entity type that was not found
   * @param data - Additional error data
   * @returns A new DatabaseError instance for not found errors
   */
  static notFoundError(entity: string, data?: any): DatabaseError {
    const message = `${entity} not found`;
    return new ApiError(
      message,
      ERROR_CODES.RESOURCE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
      data
    ) as DatabaseError;
  }

  /**
   * Creates a new DatabaseError instance from a Prisma ORM error
   * 
   * @param error - The Prisma error object
   * @param data - Additional error data
   * @returns A new DatabaseError instance based on the Prisma error type
   */
  static fromPrismaError(error: Error, data?: any): DatabaseError {
    const errorData = {
      originalError: error,
      ...data
    };

    // Handle Prisma-specific error types
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle unique constraint violations (P2002)
      if (error.code === 'P2002') {
        const field = (error.meta?.target as string[])?.join(', ') || 'unknown field';
        return DatabaseError.uniqueConstraintError(field, errorData);
      }
      
      // Handle foreign key constraint violations (P2003)
      if (error.code === 'P2003') {
        const field = (error.meta?.field_name as string) || 'unknown field';
        return DatabaseError.foreignKeyError(field, errorData);
      }
      
      // Handle not found errors (P2001, P2018, P2025)
      if (['P2001', 'P2018', 'P2025'].includes(error.code)) {
        return DatabaseError.notFoundError('Record', errorData);
      }
    }
    
    // Handle Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      return new ApiError(
        'Database validation error',
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
        errorData
      ) as DatabaseError;
    }
    
    // Handle Prisma connection errors
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return DatabaseError.connectionError('Database connection error', errorData);
    }
    
    // Default to general query error for other cases
    return DatabaseError.queryError(error.message, errorData);
  }
}