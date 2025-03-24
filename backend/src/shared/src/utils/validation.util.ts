/**
 * validation.util.ts
 * 
 * Provides utility functions for data validation across the Tribe platform's microservices.
 * This module centralizes validation logic to ensure consistent data validation, schema validation,
 * and error handling throughout the application.
 */

import Joi from 'joi'; // ^17.9.2
import { ValidationError } from '../errors/validation.error';
import { isValidDate } from './date.util';
import {
  EMAIL_REGEX,
  URL_REGEX,
  PHONE_REGEX,
  UUID_REGEX
} from '../constants/regex.constants';

/**
 * Validates data against a Joi schema and throws a ValidationError if validation fails
 * 
 * @param data - The data to validate
 * @param schema - The Joi schema to validate against
 * @param options - Optional Joi validation options
 * @returns Validated and transformed data if validation succeeds
 * @throws ValidationError if validation fails
 */
export const validateSchema = (data: any, schema: Joi.Schema, options?: Joi.ValidationOptions): any => {
  if (!schema || typeof schema.validate !== 'function') {
    throw new Error('Invalid schema provided for validation');
  }

  const validationOptions = {
    abortEarly: false,
    allowUnknown: true,
    ...options
  };

  const { error, value } = schema.validate(data, validationOptions);

  if (error) {
    const details = error.details.map(detail => ({
      path: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }));

    throw ValidationError.schemaValidation(details);
  }

  return value;
};

/**
 * Validates an object against a schema and returns the validated object or throws a ValidationError
 * 
 * @param obj - The object to validate
 * @param schema - The Joi schema to validate against
 * @param options - Optional Joi validation options
 * @returns Validated and transformed object if validation succeeds
 * @throws ValidationError if validation fails
 */
export const validateObject = (obj: any, schema: Joi.Schema, options?: Joi.ValidationOptions): object => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw ValidationError.invalidInput('Input must be an object');
  }

  return validateSchema(obj, schema, options);
};

/**
 * Validates an array against a schema and returns the validated array or throws a ValidationError
 * 
 * @param arr - The array to validate
 * @param schema - The Joi schema to validate against
 * @param options - Optional Joi validation options
 * @returns Validated and transformed array if validation succeeds
 * @throws ValidationError if validation fails
 */
export const validateArray = (arr: any, schema: Joi.Schema, options?: Joi.ValidationOptions): any[] => {
  if (!Array.isArray(arr)) {
    throw ValidationError.invalidInput('Input must be an array');
  }

  return validateSchema(arr, schema, options);
};

/**
 * Validates a string against a schema or regex pattern and returns the validated string or throws a ValidationError
 * 
 * @param str - The string to validate
 * @param schemaOrPattern - Joi schema or RegExp pattern to validate against
 * @param options - Optional Joi validation options (when using schema)
 * @returns Validated and transformed string if validation succeeds
 * @throws ValidationError if validation fails
 */
export const validateString = (
  str: any,
  schemaOrPattern?: Joi.Schema | RegExp,
  options?: Joi.ValidationOptions
): string => {
  if (typeof str !== 'string') {
    throw ValidationError.invalidInput('Input must be a string');
  }

  if (schemaOrPattern instanceof RegExp) {
    if (!schemaOrPattern.test(str)) {
      throw ValidationError.invalidInput('String does not match the required pattern');
    }
    return str;
  }

  if (schemaOrPattern) {
    return validateSchema(str, schemaOrPattern, options);
  }

  return str;
};

/**
 * Validates a number against a schema or range and returns the validated number or throws a ValidationError
 * 
 * @param num - The number to validate
 * @param schemaOrRange - Joi schema or {min, max} range object to validate against
 * @param options - Optional Joi validation options (when using schema)
 * @returns Validated and transformed number if validation succeeds
 * @throws ValidationError if validation fails
 */
export const validateNumber = (
  num: any,
  schemaOrRange?: Joi.Schema | { min?: number; max?: number },
  options?: Joi.ValidationOptions
): number => {
  if (typeof num !== 'number' || isNaN(num)) {
    throw ValidationError.invalidInput('Input must be a valid number');
  }

  if (schemaOrRange && ('min' in schemaOrRange || 'max' in schemaOrRange)) {
    const { min, max } = schemaOrRange as { min?: number; max?: number };
    
    if (min !== undefined && num < min) {
      throw ValidationError.invalidInput(`Number must be greater than or equal to ${min}`);
    }
    
    if (max !== undefined && num > max) {
      throw ValidationError.invalidInput(`Number must be less than or equal to ${max}`);
    }
    
    return num;
  }

  if (schemaOrRange) {
    return validateSchema(num, schemaOrRange as Joi.Schema, options);
  }

  return num;
};

/**
 * Validates a boolean value against a schema and returns the validated boolean or throws a ValidationError
 * 
 * @param bool - The boolean to validate
 * @param schema - Optional Joi schema to validate against
 * @param options - Optional Joi validation options
 * @returns Validated boolean if validation succeeds
 * @throws ValidationError if validation fails
 */
export const validateBoolean = (
  bool: any,
  schema?: Joi.Schema,
  options?: Joi.ValidationOptions
): boolean => {
  if (typeof bool !== 'boolean') {
    throw ValidationError.invalidInput('Input must be a boolean');
  }

  if (schema) {
    return validateSchema(bool, schema, options);
  }

  return bool;
};

/**
 * Validates a date value against a schema or range and returns the validated date or throws a ValidationError
 * 
 * @param date - The date to validate (Date object or ISO string)
 * @param schemaOrRange - Joi schema or {min, max} date range object to validate against
 * @param options - Optional Joi validation options (when using schema)
 * @returns Validated date if validation succeeds
 * @throws ValidationError if validation fails
 */
export const validateDate = (
  date: any,
  schemaOrRange?: Joi.Schema | { min?: Date | string; max?: Date | string },
  options?: Joi.ValidationOptions
): Date => {
  if (!isValidDate(date)) {
    throw ValidationError.invalidInput('Input must be a valid date');
  }

  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (schemaOrRange && ('min' in schemaOrRange || 'max' in schemaOrRange)) {
    const { min, max } = schemaOrRange as { min?: Date | string; max?: Date | string };
    
    if (min !== undefined) {
      const minDate = typeof min === 'string' ? new Date(min) : min;
      if (dateObj < minDate) {
        throw ValidationError.invalidInput(`Date must be on or after ${minDate.toISOString()}`);
      }
    }
    
    if (max !== undefined) {
      const maxDate = typeof max === 'string' ? new Date(max) : max;
      if (dateObj > maxDate) {
        throw ValidationError.invalidInput(`Date must be on or before ${maxDate.toISOString()}`);
      }
    }
    
    return dateObj;
  }

  if (schemaOrRange) {
    return validateSchema(dateObj, schemaOrRange as Joi.Schema, options);
  }

  return dateObj;
};

/**
 * Validates an email string against the email regex pattern and returns the validated email or throws a ValidationError
 * 
 * @param email - The email string to validate
 * @returns Validated email if validation succeeds
 * @throws ValidationError if validation fails
 */
export const validateEmail = (email: any): string => {
  if (typeof email !== 'string') {
    throw ValidationError.invalidInput('Email must be a string');
  }

  if (!EMAIL_REGEX.test(email)) {
    throw ValidationError.invalidInput('Invalid email format');
  }

  return email;
};

/**
 * Validates a URL string against the URL regex pattern and returns the validated URL or throws a ValidationError
 * 
 * @param url - The URL string to validate
 * @returns Validated URL if validation succeeds
 * @throws ValidationError if validation fails
 */
export const validateUrl = (url: any): string => {
  if (typeof url !== 'string') {
    throw ValidationError.invalidInput('URL must be a string');
  }

  if (!URL_REGEX.test(url)) {
    throw ValidationError.invalidInput('Invalid URL format');
  }

  return url;
};

/**
 * Validates a phone number string against the phone regex pattern and returns the validated phone number or throws a ValidationError
 * 
 * @param phone - The phone number string to validate
 * @returns Validated phone number if validation succeeds
 * @throws ValidationError if validation fails
 */
export const validatePhone = (phone: any): string => {
  if (typeof phone !== 'string') {
    throw ValidationError.invalidInput('Phone number must be a string');
  }

  if (!PHONE_REGEX.test(phone)) {
    throw ValidationError.invalidInput('Invalid phone number format');
  }

  return phone;
};

/**
 * Validates a UUID string against the UUID regex pattern and returns the validated UUID or throws a ValidationError
 * 
 * @param uuid - The UUID string to validate
 * @returns Validated UUID if validation succeeds
 * @throws ValidationError if validation fails
 */
export const validateUuid = (uuid: any): string => {
  if (typeof uuid !== 'string') {
    throw ValidationError.invalidInput('UUID must be a string');
  }

  if (!UUID_REGEX.test(uuid)) {
    throw ValidationError.invalidInput('Invalid UUID format');
  }

  return uuid;
};

/**
 * Creates a validator function for a specific schema that can be reused
 * 
 * @param schema - The Joi schema to validate against
 * @param options - Optional Joi validation options
 * @returns Validator function that validates data against the schema
 */
export const createValidator = <T = any>(
  schema: Joi.Schema,
  options?: Joi.ValidationOptions
): (data: any) => T => {
  return (data: any): T => {
    return validateSchema(data, schema, options);
  };
};