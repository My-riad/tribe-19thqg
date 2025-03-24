/**
 * common.validation.ts
 * 
 * Provides common validation schemas and utility functions used across the Tribe platform's microservices.
 * This module centralizes validation logic for common data types such as IDs, pagination parameters,
 * coordinates, emails, and other frequently validated data structures to ensure consistent validation
 * throughout the application.
 */

import Joi from 'joi'; // v17.9.2
import { ValidationError } from '../errors/validation.error';
import {
  EMAIL_REGEX,
  PHONE_REGEX,
  URL_REGEX,
  UUID_REGEX,
  DATE_REGEX,
  LATITUDE_REGEX,
  LONGITUDE_REGEX
} from '../constants/regex.constants';

/**
 * Validation schema for UUID identifiers
 */
export const idSchema = Joi.string().pattern(UUID_REGEX).required().messages({
  'string.pattern.base': 'Invalid ID format',
  'any.required': 'ID is required'
});

/**
 * Validation schema for pagination parameters
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0)
}).oxor('page', 'offset');

/**
 * Validation schema for geographic coordinates
 */
export const coordinatesSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required().messages({
    'number.min': 'Latitude must be between -90 and 90',
    'number.max': 'Latitude must be between -90 and 90',
    'any.required': 'Latitude is required'
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    'number.min': 'Longitude must be between -180 and 180',
    'number.max': 'Longitude must be between -180 and 180',
    'any.required': 'Longitude is required'
  })
});

/**
 * Validation schema for email addresses
 */
export const emailSchema = Joi.string().pattern(EMAIL_REGEX).required().messages({
  'string.pattern.base': 'Invalid email format',
  'any.required': 'Email is required'
});

/**
 * Validation schema for phone numbers
 */
export const phoneSchema = Joi.string().pattern(PHONE_REGEX).required().messages({
  'string.pattern.base': 'Invalid phone number format',
  'any.required': 'Phone number is required'
});

/**
 * Validation schema for URLs
 */
export const urlSchema = Joi.string().pattern(URL_REGEX).required().messages({
  'string.pattern.base': 'Invalid URL format',
  'any.required': 'URL is required'
});

/**
 * Validation schema for date strings
 */
export const dateSchema = Joi.string().pattern(DATE_REGEX).required().messages({
  'string.pattern.base': 'Invalid date format (YYYY-MM-DD)',
  'any.required': 'Date is required'
});

/**
 * Validation schema for time ranges
 */
export const timeRangeSchema = Joi.object({
  startTime: Joi.date().iso().required().messages({
    'date.base': 'Start time must be a valid date',
    'date.format': 'Start time must be in ISO format',
    'any.required': 'Start time is required'
  }),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required().messages({
    'date.base': 'End time must be a valid date',
    'date.format': 'End time must be in ISO format',
    'date.greater': 'End time must be after start time',
    'any.required': 'End time is required'
  })
});

/**
 * Validation schema for search query parameters
 */
export const searchQuerySchema = Joi.object({
  query: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Search query must be at least 1 character',
    'string.max': 'Search query cannot exceed 100 characters',
    'any.required': 'Search query is required'
  }),
  fields: Joi.array().items(Joi.string()).default(['name', 'description'])
});

/**
 * Validation schema for sorting parameters
 */
export const sortSchema = Joi.object({
  field: Joi.string().required().messages({
    'any.required': 'Sort field is required'
  }),
  order: Joi.string().valid('asc', 'desc').default('asc')
});

/**
 * Validation schema for filtering parameters
 */
export const filterSchema = Joi.object({
  field: Joi.string().required().messages({
    'any.required': 'Filter field is required'
  }),
  operator: Joi.string().valid('eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains').default('eq'),
  value: Joi.alternatives().try(
    Joi.string(),
    Joi.number(),
    Joi.boolean(),
    Joi.array().items(Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()))
  ).required().messages({
    'any.required': 'Filter value is required'
  })
});

/**
 * Validates a UUID identifier against the idSchema
 * 
 * @param id - The ID to validate
 * @returns The validated ID if validation passes
 * @throws ValidationError if validation fails
 */
export function validateId(id: string): string {
  const { error, value } = idSchema.validate(id, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates geographic coordinates against the coordinatesSchema
 * 
 * @param coordinates - The coordinates object to validate
 * @returns The validated coordinates if validation passes
 * @throws ValidationError if validation fails
 */
export function validateCoordinates(coordinates: { latitude: number; longitude: number }): { latitude: number; longitude: number } {
  const { error, value } = coordinatesSchema.validate(coordinates, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates pagination parameters against the paginationSchema
 * 
 * @param pagination - The pagination parameters to validate
 * @returns The validated pagination parameters if validation passes
 * @throws ValidationError if validation fails
 */
export function validatePagination(pagination: { page?: number; limit?: number; offset?: number }): { page?: number; limit?: number; offset?: number } {
  const { error, value } = paginationSchema.validate(pagination, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates a time range against the timeRangeSchema
 * 
 * @param timeRange - The time range to validate
 * @returns The validated time range if validation passes
 * @throws ValidationError if validation fails
 */
export function validateTimeRange(timeRange: { startTime: Date | string; endTime: Date | string }): { startTime: Date; endTime: Date } {
  const { error, value } = timeRangeSchema.validate(timeRange, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}