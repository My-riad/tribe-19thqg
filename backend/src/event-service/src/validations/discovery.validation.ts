/**
 * Defines validation schemas and utility functions for event discovery API endpoints.
 * Ensures that all request parameters for event search, recommendations, and filtering
 * operations are properly validated before processing.
 */

import Joi from 'joi'; // v17.9.2
import { 
  idSchema, 
  coordinatesSchema, 
  dateSchema, 
  paginationSchema, 
  searchQuerySchema 
} from '../../../shared/src/validation/common.validation';
import { 
  EventStatus, 
  EventType, 
  EventVisibility, 
  InterestCategory 
} from '../../../shared/src/types/event.types';
import { ValidationError } from '../../../shared/src/errors/validation.error';

/**
 * Validation schema for event search parameters
 * Validates parameters used when searching for events with various filters
 */
export const eventSearchSchema = Joi.object({
  query: Joi.string().max(100).optional(),
  tribeId: idSchema.optional(),
  userId: idSchema.optional(),
  status: Joi.array().items(Joi.string().valid(...Object.values(EventStatus))).optional(),
  eventType: Joi.array().items(Joi.string().valid(...Object.values(EventType))).optional(),
  categories: Joi.array().items(Joi.string().valid(...Object.values(InterestCategory))).optional(),
  location: coordinatesSchema.optional(),
  maxDistance: Joi.number().min(0).max(100).default(15),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  maxCost: Joi.number().min(0).optional(),
  includeInternal: Joi.boolean().default(true),
  includeExternal: Joi.boolean().default(true),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('relevance', 'date', 'distance', 'cost').default('date')
}).custom((value, helpers) => {
  if (value.startDate && value.endDate && new Date(value.startDate) >= new Date(value.endDate)) {
    return helpers.error('date.invalid', { message: 'End date must be after start date' });
  }
  return value;
});

/**
 * Validation schema for event recommendation parameters
 * Validates parameters used when requesting personalized event recommendations
 */
export const eventRecommendationSchema = Joi.object({
  userId: idSchema.optional(),
  tribeId: idSchema.optional(),
  location: coordinatesSchema.optional(),
  maxDistance: Joi.number().min(0).max(100).default(15),
  maxCost: Joi.number().min(0).optional(),
  preferredCategories: Joi.array().items(Joi.string().valid(...Object.values(InterestCategory))).optional(),
  preferredDays: Joi.array().items(Joi.number().min(0).max(6)).optional(),
  preferredTimeRanges: Joi.array().items(Joi.object({
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
  })).optional(),
  excludeEventIds: Joi.array().items(idSchema).optional(),
  limit: Joi.number().integer().min(1).max(50).default(10)
}).custom((value, helpers) => {
  if (!value.userId && !value.tribeId) {
    return helpers.error('any.required', { message: 'Either userId or tribeId is required' });
  }
  return value;
});

/**
 * Validation schema for weather-based activity parameters
 * Validates parameters used when requesting activities based on weather conditions
 */
export const weatherBasedActivitySchema = Joi.object({
  location: coordinatesSchema.required(),
  date: dateSchema.optional().default(() => new Date().toISOString().split('T')[0]),
  preferIndoor: Joi.boolean().optional(),
  preferOutdoor: Joi.boolean().optional(),
  maxDistance: Joi.number().min(0).max(100).default(15),
  preferredCategories: Joi.array().items(Joi.string().valid(...Object.values(InterestCategory))).optional(),
  maxCost: Joi.number().min(0).optional(),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

/**
 * Validation schema for nearby events search parameters
 * Validates parameters used when searching for events near a specific location
 */
export const nearbyEventsSchema = Joi.object({
  location: coordinatesSchema.required(),
  radius: Joi.number().min(0).max(100).default(15),
  categories: Joi.array().items(Joi.string().valid(...Object.values(InterestCategory))).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  maxCost: Joi.number().min(0).optional(),
  includeInternal: Joi.boolean().default(true),
  includeExternal: Joi.boolean().default(true),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

/**
 * Validation schema for popular events search parameters
 * Validates parameters used when searching for popular events
 */
export const popularEventsSchema = Joi.object({
  location: coordinatesSchema.optional(),
  radius: Joi.number().min(0).max(100).optional().default(15),
  categories: Joi.array().items(Joi.string().valid(...Object.values(InterestCategory))).optional(),
  timeframe: Joi.string().valid('today', 'this-week', 'this-weekend', 'next-week').default('this-week'),
  includeInternal: Joi.boolean().default(true),
  includeExternal: Joi.boolean().default(true),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

/**
 * Validates event search parameters against the schema
 * 
 * @param params - The search parameters to validate
 * @returns Validated and normalized event search parameters
 * @throws ValidationError if parameters fail validation
 */
export function validateEventSearchParams(params: any): any {
  const { error, value } = eventSearchSchema.validate(params, { 
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates event recommendation parameters against the schema
 * 
 * @param params - The recommendation parameters to validate
 * @returns Validated and normalized event recommendation parameters
 * @throws ValidationError if parameters fail validation
 */
export function validateEventRecommendationParams(params: any): any {
  const { error, value } = eventRecommendationSchema.validate(params, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates weather-based activity parameters against the schema
 * 
 * @param params - The weather-based activity parameters to validate
 * @returns Validated and normalized weather-based activity parameters
 * @throws ValidationError if parameters fail validation
 */
export function validateWeatherBasedActivityParams(params: any): any {
  const { error, value } = weatherBasedActivitySchema.validate(params, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates nearby events search parameters against the schema
 * 
 * @param params - The nearby events search parameters to validate
 * @returns Validated and normalized nearby events parameters
 * @throws ValidationError if parameters fail validation
 */
export function validateNearbyEventsParams(params: any): any {
  const { error, value } = nearbyEventsSchema.validate(params, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates popular events search parameters against the schema
 * 
 * @param params - The popular events search parameters to validate
 * @returns Validated and normalized popular events parameters
 * @throws ValidationError if parameters fail validation
 */
export function validatePopularEventsParams(params: any): any {
  const { error, value } = popularEventsSchema.validate(params, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}