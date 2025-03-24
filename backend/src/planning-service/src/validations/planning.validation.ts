import Joi from 'joi'; // v17.6.0
import { ValidationError } from '../../../shared/src/errors/validation.error';
import { idSchema, dateSchema, timeRangeSchema, coordinatesSchema } from '../../../shared/src/validation/common.validation';
import { PlanningStatus, IPlanningSessionCreate, IPlanningSessionUpdate, IPlanningPreferences, IEventPlanFinalize, VoteType } from '../models/planning.model';

/**
 * Validation schema for creating a new planning session
 */
export const planningSessionCreateSchema = Joi.object({
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
  createdBy: idSchema.required().messages({
    'any.required': 'Creator ID is required'
  }),
  availabilityDeadline: Joi.date().iso().min('now').required().messages({
    'date.base': 'Availability deadline must be a valid date',
    'date.format': 'Availability deadline must be in ISO format',
    'date.min': 'Availability deadline must be in the future',
    'any.required': 'Availability deadline is required'
  }),
  preferences: Joi.object().optional()
}).custom((value, helpers) => {
  if (!value.eventId && !value.tribeId) {
    return helpers.error('object.missing', {
      message: 'Either eventId or tribeId must be provided'
    });
  }
  return value;
});

/**
 * Validation schema for updating an existing planning session
 */
export const planningSessionUpdateSchema = Joi.object({
  status: Joi.string().valid(...Object.values(PlanningStatus)).optional().messages({
    'any.only': `Status must be one of: ${Object.values(PlanningStatus).join(', ')}`
  }),
  availabilityDeadline: Joi.date().iso().min('now').optional().messages({
    'date.base': 'Availability deadline must be a valid date',
    'date.format': 'Availability deadline must be in ISO format',
    'date.min': 'Availability deadline must be in the future'
  }),
  votingDeadline: Joi.date().iso().min('now').optional().messages({
    'date.base': 'Voting deadline must be a valid date',
    'date.format': 'Voting deadline must be in ISO format',
    'date.min': 'Voting deadline must be in the future'
  }),
  preferences: Joi.object().optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
}).custom((value, helpers) => {
  if (value.availabilityDeadline && value.votingDeadline && new Date(value.availabilityDeadline) >= new Date(value.votingDeadline)) {
    return helpers.error('date.greater', {
      message: 'Voting deadline must be after availability deadline'
    });
  }
  return value;
});

/**
 * Validation schema for planning preferences
 */
export const planningPreferencesSchema = Joi.object({
  durationMinutes: Joi.number().integer().min(15).max(480).required().messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be an integer',
    'number.min': 'Duration must be at least 15 minutes',
    'number.max': 'Duration cannot exceed 8 hours (480 minutes)',
    'any.required': 'Duration is required'
  }),
  preferredDays: Joi.array().items(Joi.number().integer().min(0).max(6)).optional().messages({
    'array.base': 'Preferred days must be an array',
    'number.min': 'Day values must be between 0 (Sunday) and 6 (Saturday)',
    'number.max': 'Day values must be between 0 (Sunday) and 6 (Saturday)'
  }),
  preferredTimeRanges: Joi.array().items(Joi.object({
    start: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
      'string.pattern.base': 'Start time must be in 24-hour format (HH:MM)',
      'any.required': 'Start time is required'
    }),
    end: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
      'string.pattern.base': 'End time must be in 24-hour format (HH:MM)',
      'any.required': 'End time is required'
    })
  })).optional().messages({
    'array.base': 'Preferred time ranges must be an array'
  }),
  preferredLocation: coordinatesSchema.optional(),
  maxDistance: Joi.number().min(0.1).max(50).optional().messages({
    'number.min': 'Maximum distance must be at least 0.1 miles',
    'number.max': 'Maximum distance cannot exceed 50 miles'
  }),
  budgetRange: Joi.object({
    min: Joi.number().min(0).required().messages({
      'number.min': 'Minimum budget cannot be negative',
      'any.required': 'Minimum budget is required'
    }),
    max: Joi.number().greater(Joi.ref('min')).required().messages({
      'number.greater': 'Maximum budget must be greater than minimum budget',
      'any.required': 'Maximum budget is required'
    })
  }).optional(),
  venueTypes: Joi.array().items(Joi.string()).optional(),
  accessibilityRequirements: Joi.array().items(Joi.string()).optional(),
  prioritizeAttendance: Joi.boolean().default(true)
}).custom((value, helpers) => {
  if (value.preferredTimeRanges) {
    for (const range of value.preferredTimeRanges) {
      const [startHour, startMinute] = range.start.split(':').map(Number);
      const [endHour, endMinute] = range.end.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      if (startMinutes >= endMinutes) {
        return helpers.error('custom.timeRange', {
          message: 'End time must be after start time in each time range'
        });
      }
    }
  }
  return value;
});

/**
 * Validation schema for finalizing event plan
 */
export const eventPlanFinalizeSchema = Joi.object({
  timeSlotId: idSchema.required().messages({
    'any.required': 'Time slot ID is required'
  }),
  venueId: idSchema.required().messages({
    'any.required': 'Venue ID is required'
  }),
  finalizedBy: idSchema.required().messages({
    'any.required': 'Finalizer ID is required'
  }),
  notes: Joi.string().max(500).optional().messages({
    'string.max': 'Notes cannot exceed 500 characters'
  })
});

/**
 * Validation schema for optimal time slots query parameters
 */
export const optimalTimeSlotsQuerySchema = Joi.object({
  planningSessionId: idSchema.required().messages({
    'any.required': 'Planning session ID is required'
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
});

/**
 * Validation schema for vote requests
 */
export const voteRequestSchema = Joi.object({
  planningSessionId: idSchema.required().messages({
    'any.required': 'Planning session ID is required'
  }),
  itemId: idSchema.required().messages({
    'any.required': 'Item ID is required'
  }),
  userId: idSchema.required().messages({
    'any.required': 'User ID is required'
  }),
  voteType: Joi.string().valid(...Object.values(VoteType)).required().messages({
    'any.only': `Vote type must be one of: ${Object.values(VoteType).join(', ')}`,
    'any.required': 'Vote type is required'
  })
});

/**
 * Validation schema for auto-suggest plan requests
 */
export const autoSuggestRequestSchema = Joi.object({
  planningSessionId: idSchema.required().messages({
    'any.required': 'Planning session ID is required'
  }),
  considerVotes: Joi.boolean().default(true),
  prioritizeAttendance: Joi.boolean().default(true),
  considerBudget: Joi.boolean().default(true),
  considerAccessibility: Joi.boolean().default(true)
});

/**
 * Validates data for creating a new planning session
 * 
 * @param sessionData - The planning session data to validate
 * @returns Validated planning session data or throws ValidationError
 */
export function validatePlanningSessionCreate(sessionData: any): IPlanningSessionCreate {
  const { error, value } = planningSessionCreateSchema.validate(sessionData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }

  // If preferences are provided, validate them separately
  if (value.preferences) {
    value.preferences = validatePlanningPreferences(value.preferences);
  }
  
  return value;
}

/**
 * Validates data for updating an existing planning session
 * 
 * @param updateData - The update data to validate
 * @returns Validated update data or throws ValidationError
 */
export function validatePlanningSessionUpdate(updateData: any): IPlanningSessionUpdate {
  const { error, value } = planningSessionUpdateSchema.validate(updateData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }

  // If preferences are provided, validate them separately
  if (value.preferences) {
    value.preferences = validatePlanningPreferences(value.preferences);
  }
  
  return value;
}

/**
 * Validates planning preferences data
 * 
 * @param preferences - The preferences data to validate
 * @returns Validated preferences or throws ValidationError
 */
export function validatePlanningPreferences(preferences: any): IPlanningPreferences {
  const { error, value } = planningPreferencesSchema.validate(preferences, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates data for finalizing an event plan
 * 
 * @param finalizeData - The finalize data to validate
 * @returns Validated finalize data or throws ValidationError
 */
export function validateEventPlanFinalize(finalizeData: any): IEventPlanFinalize {
  const { error, value } = eventPlanFinalizeSchema.validate(finalizeData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates query parameters for finding optimal time slots
 * 
 * @param queryParams - The query parameters to validate
 * @returns Validated query parameters or throws ValidationError
 */
export function validateOptimalTimeSlotsQuery(queryParams: any): any {
  const { error, value } = optimalTimeSlotsQuerySchema.validate(queryParams, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates vote request data
 * 
 * @param voteData - The vote data to validate
 * @returns Validated vote data or throws ValidationError
 */
export function validateVoteRequest(voteData: any): any {
  const { error, value } = voteRequestSchema.validate(voteData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates auto-suggest plan request
 * 
 * @param requestData - The request data to validate
 * @returns Validated request data or throws ValidationError
 */
export function validateAutoSuggestRequest(requestData: any): any {
  const { error, value } = autoSuggestRequestSchema.validate(requestData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}