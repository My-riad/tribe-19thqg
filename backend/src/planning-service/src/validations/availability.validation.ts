import Joi from 'joi'; // v17.6.0
import { ValidationError } from '../../../shared/src/errors/validation.error';
import { idSchema, dateSchema, timeRangeSchema } from '../../../shared/src/validation/common.validation';
import { 
  AvailabilityStatus, 
  RecurrenceType, 
  IAvailabilityCreate, 
  IAvailabilityUpdate,
  ITimeSlot
} from '../models/availability.model';

/**
 * Validation schema for a single time slot object
 */
export const timeSlotSchema = Joi.object({
  startTime: Joi.date().iso().required().messages({
    'date.base': 'Start time must be a valid date',
    'date.format': 'Start time must be in ISO format',
    'any.required': 'Start time is required'
  }),
  endTime: Joi.date().iso().required().messages({
    'date.base': 'End time must be a valid date',
    'date.format': 'End time must be in ISO format',
    'any.required': 'End time is required'
  }),
  status: Joi.string().valid(...Object.values(AvailabilityStatus)).required().messages({
    'any.only': 'Status must be one of: AVAILABLE, UNAVAILABLE, TENTATIVE',
    'any.required': 'Status is required'
  })
});

/**
 * Validation schema for creating a new availability record
 */
export const availabilityCreateSchema = Joi.object({
  userId: idSchema.required().messages({
    'any.required': 'User ID is required'
  }),
  eventId: Joi.alternatives().conditional('tribeId', {
    is: Joi.exist(),
    then: idSchema.optional(),
    otherwise: idSchema.required().messages({
      'any.required': 'Event ID is required when Tribe ID is not provided'
    })
  }),
  tribeId: Joi.alternatives().conditional('eventId', {
    is: Joi.exist(),
    then: idSchema.optional(),
    otherwise: idSchema.required().messages({
      'any.required': 'Tribe ID is required when Event ID is not provided'
    })
  }),
  timeSlots: Joi.array().items(timeSlotSchema).min(1).required().messages({
    'array.min': 'At least one time slot is required',
    'any.required': 'Time slots are required'
  }),
  recurrenceType: Joi.string().valid(...Object.values(RecurrenceType)).default(RecurrenceType.NONE).messages({
    'any.only': 'Recurrence type must be one of: NONE, DAILY, WEEKLY, MONTHLY'
  }),
  recurrenceEndDate: Joi.date().iso().when('recurrenceType', {
    is: Joi.valid(RecurrenceType.NONE),
    then: Joi.optional(),
    otherwise: Joi.required().messages({
      'any.required': 'Recurrence end date is required when recurrence type is not NONE'
    })
  }),
  preferredDuration: Joi.number().integer().min(15).max(480).optional().messages({
    'number.min': 'Preferred duration must be at least 15 minutes',
    'number.max': 'Preferred duration cannot exceed 8 hours (480 minutes)'
  }),
  notes: Joi.string().max(500).optional().messages({
    'string.max': 'Notes cannot exceed 500 characters'
  })
}).custom((value, helpers) => {
  if (!value.eventId && !value.tribeId) {
    return helpers.error('object.missing', {
      message: 'Either eventId or tribeId must be provided'
    });
  }
  if (value.recurrenceType !== RecurrenceType.NONE && !value.recurrenceEndDate) {
    return helpers.error('object.dependency', {
      message: 'recurrenceEndDate is required when recurrenceType is not NONE'
    });
  }
  if (value.recurrenceEndDate && new Date(value.recurrenceEndDate) <= new Date()) {
    return helpers.error('date.future', {
      message: 'Recurrence end date must be in the future'
    });
  }
  return value;
});

/**
 * Validation schema for updating an existing availability record
 */
export const availabilityUpdateSchema = Joi.object({
  timeSlots: Joi.array().items(timeSlotSchema).min(1).optional().messages({
    'array.min': 'At least one time slot is required'
  }),
  recurrenceType: Joi.string().valid(...Object.values(RecurrenceType)).optional().messages({
    'any.only': 'Recurrence type must be one of: NONE, DAILY, WEEKLY, MONTHLY'
  }),
  recurrenceEndDate: Joi.date().iso().when('recurrenceType', {
    is: Joi.valid(RecurrenceType.NONE),
    then: Joi.optional(),
    otherwise: Joi.required().messages({
      'any.required': 'Recurrence end date is required when recurrence type is not NONE'
    })
  }),
  preferredDuration: Joi.number().integer().min(15).max(480).optional().messages({
    'number.min': 'Preferred duration must be at least 15 minutes',
    'number.max': 'Preferred duration cannot exceed 8 hours (480 minutes)'
  }),
  notes: Joi.string().max(500).optional().messages({
    'string.max': 'Notes cannot exceed 500 characters'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
}).custom((value, helpers) => {
  if (value.recurrenceType !== RecurrenceType.NONE && !value.recurrenceEndDate) {
    return helpers.error('object.dependency', {
      message: 'recurrenceEndDate is required when recurrenceType is not NONE'
    });
  }
  if (value.recurrenceEndDate && new Date(value.recurrenceEndDate) <= new Date()) {
    return helpers.error('date.future', {
      message: 'Recurrence end date must be in the future'
    });
  }
  return value;
});

/**
 * Validation schema for availability query parameters
 */
export const availabilityQuerySchema = Joi.object({
  userId: idSchema.optional(),
  eventId: idSchema.optional(),
  tribeId: idSchema.optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  status: Joi.string().valid(...Object.values(AvailabilityStatus)).optional(),
  recurrenceType: Joi.string().valid(...Object.values(RecurrenceType)).optional()
}).custom((value, helpers) => {
  if (value.startDate && value.endDate && new Date(value.startDate) > new Date(value.endDate)) {
    return helpers.error('date.greater', {
      message: 'Start date must be before or equal to end date'
    });
  }
  return value;
});

/**
 * Validation schema for bulk availability creation
 */
export const bulkAvailabilitySchema = Joi.object({
  eventId: Joi.alternatives().conditional('tribeId', {
    is: Joi.exist(),
    then: idSchema.optional(),
    otherwise: idSchema.required().messages({
      'any.required': 'Event ID is required when Tribe ID is not provided'
    })
  }),
  tribeId: Joi.alternatives().conditional('eventId', {
    is: Joi.exist(),
    then: idSchema.optional(),
    otherwise: idSchema.required().messages({
      'any.required': 'Tribe ID is required when Event ID is not provided'
    })
  }),
  recurrenceType: Joi.string().valid(...Object.values(RecurrenceType)).default(RecurrenceType.NONE).messages({
    'any.only': 'Recurrence type must be one of: NONE, DAILY, WEEKLY, MONTHLY'
  }),
  recurrenceEndDate: Joi.date().iso().when('recurrenceType', {
    is: Joi.valid(RecurrenceType.NONE),
    then: Joi.optional(),
    otherwise: Joi.required().messages({
      'any.required': 'Recurrence end date is required when recurrence type is not NONE'
    })
  }),
  userAvailabilities: Joi.array().items(
    Joi.object({
      userId: idSchema.required(),
      timeSlots: Joi.array().items(timeSlotSchema).min(1).required(),
      preferredDuration: Joi.number().integer().min(15).max(480).optional(),
      notes: Joi.string().max(500).optional()
    })
  ).min(1).required().messages({
    'array.min': 'At least one user availability is required',
    'any.required': 'User availabilities are required'
  })
}).custom((value, helpers) => {
  if (!value.eventId && !value.tribeId) {
    return helpers.error('object.missing', {
      message: 'Either eventId or tribeId must be provided'
    });
  }
  if (value.recurrenceType !== RecurrenceType.NONE && !value.recurrenceEndDate) {
    return helpers.error('object.dependency', {
      message: 'recurrenceEndDate is required when recurrenceType is not NONE'
    });
  }
  if (value.recurrenceEndDate && new Date(value.recurrenceEndDate) <= new Date()) {
    return helpers.error('date.future', {
      message: 'Recurrence end date must be in the future'
    });
  }
  return value;
});

/**
 * Validation schema for optimal time query parameters
 */
export const optimalTimeQuerySchema = Joi.object({
  eventId: idSchema.optional(),
  tribeId: idSchema.optional(),
  startDate: Joi.date().iso().required().messages({
    'any.required': 'Start date is required'
  }),
  endDate: Joi.date().iso().required().messages({
    'any.required': 'End date is required'
  }),
  duration: Joi.number().integer().min(15).max(480).required().messages({
    'any.required': 'Duration is required',
    'number.min': 'Duration must be at least 15 minutes',
    'number.max': 'Duration cannot exceed 8 hours (480 minutes)'
  }),
  minAttendees: Joi.number().integer().min(2).optional().messages({
    'number.min': 'Minimum attendees must be at least 2'
  }),
  minAttendancePercentage: Joi.number().min(0).max(100).optional().messages({
    'number.min': 'Minimum attendance percentage cannot be negative',
    'number.max': 'Minimum attendance percentage cannot exceed 100'
  }),
  timeOfDayPreference: Joi.string().valid('morning', 'afternoon', 'evening', 'any').default('any'),
  daysOfWeekPreference: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
  limit: Joi.number().integer().min(1).max(20).default(5).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 20'
  })
}).custom((value, helpers) => {
  if (!value.eventId && !value.tribeId) {
    return helpers.error('object.missing', {
      message: 'Either eventId or tribeId must be provided'
    });
  }
  if (new Date(value.startDate) >= new Date(value.endDate)) {
    return helpers.error('date.greater', {
      message: 'Start date must be before end date'
    });
  }
  return value;
});

/**
 * Validates a single time slot object
 * 
 * @param timeSlot - The time slot to validate
 * @returns The validated time slot
 * @throws ValidationError if validation fails
 */
export function validateTimeSlot(timeSlot: any): ITimeSlot {
  const { error, value } = timeSlotSchema.validate(timeSlot, { abortEarly: false });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  // Additional validation: startTime must be before endTime
  if (new Date(value.startTime) >= new Date(value.endTime)) {
    throw ValidationError.invalidField('timeSlot', 'Start time must be before end time');
  }
  
  return value;
}

/**
 * Validates data for creating a new availability record
 * 
 * @param availabilityData - The availability data to validate
 * @returns The validated availability data
 * @throws ValidationError if validation fails
 */
export function validateAvailabilityCreate(availabilityData: any): IAvailabilityCreate {
  const { error, value } = availabilityCreateSchema.validate(availabilityData, { abortEarly: false });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  // Validate each time slot
  if (value.timeSlots) {
    value.timeSlots.forEach((slot: any) => validateTimeSlot(slot));
  }
  
  return value;
}

/**
 * Validates data for updating an existing availability record
 * 
 * @param updateData - The update data to validate
 * @returns The validated update data
 * @throws ValidationError if validation fails
 */
export function validateAvailabilityUpdate(updateData: any): IAvailabilityUpdate {
  const { error, value } = availabilityUpdateSchema.validate(updateData, { abortEarly: false });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  // Validate each time slot if provided
  if (value.timeSlots) {
    value.timeSlots.forEach((slot: any) => validateTimeSlot(slot));
  }
  
  return value;
}

/**
 * Validates query parameters for retrieving availability records
 * 
 * @param queryParams - The query parameters to validate
 * @returns The validated query parameters
 * @throws ValidationError if validation fails
 */
export function validateAvailabilityQuery(queryParams: any): any {
  const { error, value } = availabilityQuerySchema.validate(queryParams, { abortEarly: false });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates data for bulk creation of availability records
 * 
 * @param bulkData - The bulk data to validate
 * @returns The validated bulk data
 * @throws ValidationError if validation fails
 */
export function validateBulkAvailability(bulkData: any): any {
  const { error, value } = bulkAvailabilitySchema.validate(bulkData, { abortEarly: false });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  // Validate time slots for each user availability
  if (value.userAvailabilities) {
    value.userAvailabilities.forEach((userAvail: any) => {
      userAvail.timeSlots.forEach((slot: any) => validateTimeSlot(slot));
    });
  }
  
  return value;
}

/**
 * Validates query parameters for finding optimal meeting times
 * 
 * @param queryParams - The query parameters to validate
 * @returns The validated query parameters
 * @throws ValidationError if validation fails
 */
export function validateOptimalTimeQuery(queryParams: any): any {
  const { error, value } = optimalTimeQuerySchema.validate(queryParams, { abortEarly: false });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}