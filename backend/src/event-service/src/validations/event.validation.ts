import Joi from 'joi'; // v17.9.2
import { idSchema, coordinatesSchema, dateSchema, timeRangeSchema } from '../../../shared/src/validation/common.validation';
import { EventStatus, EventType, EventVisibility, InterestCategory } from '../../../shared/src/types/event.types';
import { ValidationError } from '../../../shared/src/errors/validation.error';

/**
 * Validation schema for event creation parameters
 */
export const eventCreateSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Event name must be at least 3 characters',
    'string.max': 'Event name cannot exceed 100 characters',
    'any.required': 'Event name is required'
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'Event description cannot exceed 1000 characters'
  }),
  tribeId: idSchema.required().messages({
    'any.required': 'Tribe ID is required'
  }),
  createdBy: idSchema.required().messages({
    'any.required': 'Creator ID is required'
  }),
  eventType: Joi.string().valid(...Object.values(EventType)).required().messages({
    'any.only': 'Event type must be one of: ' + Object.values(EventType).join(', '),
    'any.required': 'Event type is required'
  }),
  visibility: Joi.string().valid(...Object.values(EventVisibility)).default(EventVisibility.TRIBE_ONLY).messages({
    'any.only': 'Event visibility must be one of: ' + Object.values(EventVisibility).join(', ')
  }),
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
  }),
  location: Joi.string().max(200).required().messages({
    'string.max': 'Location cannot exceed 200 characters',
    'any.required': 'Location is required'
  }),
  coordinates: coordinatesSchema.required().messages({
    'any.required': 'Coordinates are required'
  }),
  venueId: idSchema.optional(),
  cost: Joi.number().min(0).default(0).messages({
    'number.min': 'Cost cannot be negative'
  }),
  paymentRequired: Joi.boolean().default(false),
  maxAttendees: Joi.number().integer().min(1).max(1000).optional().messages({
    'number.min': 'Maximum attendees must be at least 1',
    'number.max': 'Maximum attendees cannot exceed 1000'
  }),
  categories: Joi.array().items(Joi.string().valid(...Object.values(InterestCategory))).min(1).required().messages({
    'array.min': 'At least one category is required',
    'any.required': 'Categories are required',
    'any.only': 'Categories must be valid interest categories'
  })
});

/**
 * Validation schema for event update parameters
 */
export const eventUpdateSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'Event name must be at least 3 characters',
    'string.max': 'Event name cannot exceed 100 characters'
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'Event description cannot exceed 1000 characters'
  }),
  eventType: Joi.string().valid(...Object.values(EventType)).optional().messages({
    'any.only': 'Event type must be one of: ' + Object.values(EventType).join(', ')
  }),
  visibility: Joi.string().valid(...Object.values(EventVisibility)).optional().messages({
    'any.only': 'Event visibility must be one of: ' + Object.values(EventVisibility).join(', ')
  }),
  startTime: Joi.date().iso().optional().messages({
    'date.base': 'Start time must be a valid date',
    'date.format': 'Start time must be in ISO format'
  }),
  endTime: Joi.date().iso().when('startTime', {
    is: Joi.exist(),
    then: Joi.date().iso().greater(Joi.ref('startTime')).required().messages({
      'date.greater': 'End time must be after start time',
      'any.required': 'End time is required when start time is provided'
    }),
    otherwise: Joi.date().iso().optional()
  }),
  location: Joi.string().max(200).optional().messages({
    'string.max': 'Location cannot exceed 200 characters'
  }),
  coordinates: coordinatesSchema.optional(),
  venueId: idSchema.optional(),
  weatherData: Joi.object({
    temperature: Joi.number().required(),
    condition: Joi.string().required(),
    icon: Joi.string().optional(),
    precipitation: Joi.number().min(0).max(100).optional(),
    forecast: Joi.string().optional()
  }).optional(),
  cost: Joi.number().min(0).optional().messages({
    'number.min': 'Cost cannot be negative'
  }),
  paymentRequired: Joi.boolean().optional(),
  maxAttendees: Joi.number().integer().min(1).max(1000).optional().messages({
    'number.min': 'Maximum attendees must be at least 1',
    'number.max': 'Maximum attendees cannot exceed 1000'
  }),
  categories: Joi.array().items(Joi.string().valid(...Object.values(InterestCategory))).min(1).optional().messages({
    'array.min': 'At least one category is required',
    'any.only': 'Categories must be valid interest categories'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Validation schema for event status update parameters
 */
export const eventStatusUpdateSchema = Joi.object({
  status: Joi.string().valid(...Object.values(EventStatus)).required().messages({
    'any.only': 'Status must be one of: ' + Object.values(EventStatus).join(', '),
    'any.required': 'Status is required'
  })
});

/**
 * Validation schema for RSVP update parameters
 */
export const rsvpUpdateSchema = Joi.object({
  eventId: idSchema.required().messages({
    'any.required': 'Event ID is required'
  }),
  userId: idSchema.required().messages({
    'any.required': 'User ID is required'
  }),
  status: Joi.string().valid('GOING', 'MAYBE', 'NOT_GOING').required().messages({
    'any.only': 'Status must be one of: GOING, MAYBE, NOT_GOING',
    'any.required': 'Status is required'
  })
});

/**
 * Validation schema for check-in update parameters
 */
export const checkInUpdateSchema = Joi.object({
  eventId: idSchema.required().messages({
    'any.required': 'Event ID is required'
  }),
  userId: idSchema.required().messages({
    'any.required': 'User ID is required'
  }),
  hasCheckedIn: Joi.boolean().required().messages({
    'any.required': 'Check-in status is required'
  }),
  coordinates: coordinatesSchema.optional()
});

/**
 * Validation schema for event conflict check parameters
 */
export const eventConflictCheckSchema = Joi.object({
  tribeId: idSchema.optional(),
  userId: idSchema.optional(),
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
  }),
  excludeEventId: idSchema.optional()
}).custom((value, helpers) => {
  if (!value.tribeId && !value.userId) {
    return helpers.error('any.required', { message: 'Either tribeId or userId is required' });
  }
  return value;
});

/**
 * Validates event creation parameters against the schema
 * 
 * @param eventData - The event creation parameters to validate
 * @returns The validated and normalized event creation parameters
 * @throws ValidationError if validation fails
 */
export function validateEventCreate(eventData: any): any {
  const { error, value } = eventCreateSchema.validate(eventData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates event update parameters against the schema
 * 
 * @param eventData - The event update parameters to validate
 * @returns The validated and normalized event update parameters
 * @throws ValidationError if validation fails
 */
export function validateEventUpdate(eventData: any): any {
  const { error, value } = eventUpdateSchema.validate(eventData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates event status update parameters against the schema
 * 
 * @param statusData - The status update parameters to validate
 * @returns The validated and normalized event status update parameters
 * @throws ValidationError if validation fails
 */
export function validateEventStatusUpdate(statusData: any): any {
  const { error, value } = eventStatusUpdateSchema.validate(statusData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates RSVP update parameters against the schema
 * 
 * @param rsvpData - The RSVP update parameters to validate
 * @returns The validated and normalized RSVP update parameters
 * @throws ValidationError if validation fails
 */
export function validateRSVPUpdate(rsvpData: any): any {
  const { error, value } = rsvpUpdateSchema.validate(rsvpData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates check-in update parameters against the schema
 * 
 * @param checkInData - The check-in update parameters to validate
 * @returns The validated and normalized check-in update parameters
 * @throws ValidationError if validation fails
 */
export function validateCheckInUpdate(checkInData: any): any {
  const { error, value } = checkInUpdateSchema.validate(checkInData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates event conflict check parameters against the schema
 * 
 * @param conflictParams - The conflict check parameters to validate
 * @returns The validated and normalized conflict check parameters
 * @throws ValidationError if validation fails
 */
export function validateEventConflictCheck(conflictParams: any): any {
  const { error, value } = eventConflictCheckSchema.validate(conflictParams, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}