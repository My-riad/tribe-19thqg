import { ApiError } from './api.error';
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from '../constants/error.constants';

/**
 * Specialized error class for handling data validation errors in the Tribe platform.
 * Extends the base ApiError class to provide more specific validation error handling.
 */
export class ValidationError extends ApiError {
  /**
   * Creates a new ValidationError instance with the specified error details
   * 
   * @param message - The validation error message
   * @param code - The error code
   * @param data - Additional error data
   */
  constructor(
    message: string,
    code: string = ERROR_CODES.VALIDATION_ERROR,
    data?: any
  ) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, data);
    this.name = 'ValidationError';
  }

  /**
   * Creates a new ValidationError instance for a specific field validation failure
   * 
   * @param field - The name of the invalid field
   * @param message - The validation error message
   * @param data - Additional error data
   * @returns A new ValidationError instance for field validation error
   */
  static invalidField(field: string, message: string, data?: any): ValidationError {
    const errorMessage = `Field '${field}' ${message}`;
    return new ValidationError(
      errorMessage,
      ERROR_CODES.VALIDATION_ERROR,
      { field, ...data }
    );
  }

  /**
   * Creates a new ValidationError instance for general input validation failure
   * 
   * @param message - The validation error message
   * @param data - Additional error data
   * @returns A new ValidationError instance for general input validation error
   */
  static invalidInput(message: string = ERROR_MESSAGES.VALIDATION_ERROR, data?: any): ValidationError {
    return new ValidationError(
      message,
      ERROR_CODES.VALIDATION_ERROR,
      data
    );
  }

  /**
   * Creates a new ValidationError instance for schema validation failures
   * 
   * @param errors - Array of schema validation errors
   * @param data - Additional error data
   * @returns A new ValidationError instance for schema validation errors
   */
  static schemaValidation(errors: any[], data?: any): ValidationError {
    const errorMessage = 'Schema validation failed';
    return new ValidationError(
      errorMessage,
      ERROR_CODES.VALIDATION_ERROR,
      { errors, ...data }
    );
  }

  /**
   * Creates a new ValidationError instance from an array of validation error objects
   * 
   * @param errors - Array of validation error objects
   * @param data - Additional error data
   * @returns A new ValidationError instance containing all validation errors
   */
  static fromValidationErrors(errors: any[], data?: any): ValidationError {
    const errorMessage = `Validation failed with ${errors.length} error(s)`;
    return new ValidationError(
      errorMessage,
      ERROR_CODES.VALIDATION_ERROR,
      { errors, ...data }
    );
  }

  /**
   * Creates a new ValidationError instance for a missing required field
   * 
   * @param field - The name of the required field
   * @param data - Additional error data
   * @returns A new ValidationError instance for required field error
   */
  static requiredField(field: string, data?: any): ValidationError {
    return ValidationError.invalidField(field, 'is required', data);
  }

  /**
   * Creates a new ValidationError instance for a field with incorrect data type
   * 
   * @param field - The name of the field with incorrect type
   * @param expectedType - The expected data type
   * @param data - Additional error data
   * @returns A new ValidationError instance for type validation error
   */
  static invalidType(field: string, expectedType: string, data?: any): ValidationError {
    const message = `must be of type ${expectedType}`;
    return ValidationError.invalidField(field, message, data);
  }

  /**
   * Creates a new ValidationError instance for a field with incorrect format
   * 
   * @param field - The name of the field with incorrect format
   * @param format - The expected format description
   * @param data - Additional error data
   * @returns A new ValidationError instance for format validation error
   */
  static invalidFormat(field: string, format: string, data?: any): ValidationError {
    const message = `must be in format: ${format}`;
    return ValidationError.invalidField(field, message, data);
  }

  /**
   * Creates a new ValidationError instance for a field with incorrect length
   * 
   * @param field - The name of the field with incorrect length
   * @param min - The minimum allowed length
   * @param max - The maximum allowed length
   * @param data - Additional error data
   * @returns A new ValidationError instance for length validation error
   */
  static invalidLength(field: string, min: number, max: number, data?: any): ValidationError {
    const message = `must be between ${min} and ${max} characters long`;
    return ValidationError.invalidField(field, message, data);
  }

  /**
   * Creates a new ValidationError instance for a numeric field outside allowed range
   * 
   * @param field - The name of the field with invalid range
   * @param min - The minimum allowed value
   * @param max - The maximum allowed value
   * @param data - Additional error data
   * @returns A new ValidationError instance for range validation error
   */
  static invalidRange(field: string, min: number, max: number, data?: any): ValidationError {
    const message = `must be between ${min} and ${max}`;
    return ValidationError.invalidField(field, message, data);
  }

  /**
   * Creates a new ValidationError instance for a field with value not in allowed enum
   * 
   * @param field - The name of the field with invalid value
   * @param allowedValues - Array of allowed values
   * @param data - Additional error data
   * @returns A new ValidationError instance for enum validation error
   */
  static invalidEnum(field: string, allowedValues: any[], data?: any): ValidationError {
    const valuesString = allowedValues.map(v => `'${v}'`).join(', ');
    const message = `must be one of: ${valuesString}`;
    return ValidationError.invalidField(field, message, data);
  }
}