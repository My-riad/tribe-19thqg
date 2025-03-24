import Joi from 'joi'; // ^17.6.0
import { ValidationError } from '../../../shared/src/errors/validation.error';
import { idSchema, coordinatesSchema } from '../../../shared/src/validation/common.validation';
import { 
  IVenueSearchParams, 
  IVenueSuitabilityParams, 
  IVenueRecommendationParams 
} from '../models/venue.model';
import { InterestCategory } from '../../../shared/src/types/profile.types';

/**
 * Validation schema for venue search parameters
 */
export const venueSearchParamsSchema = Joi.object({
  query: Joi.string().max(100).optional().messages({
    'string.max': 'Search query cannot exceed 100 characters'
  }),
  location: coordinatesSchema.optional(),
  radius: Joi.number().min(0.1).max(50).optional().messages({
    'number.min': 'Radius must be at least 0.1 miles',
    'number.max': 'Radius cannot exceed 50 miles'
  }),
  minCapacity: Joi.number().integer().min(1).optional().messages({
    'number.min': 'Minimum capacity must be at least 1'
  }),
  maxCapacity: Joi.number().integer().min(Joi.ref('minCapacity')).optional().messages({
    'number.min': 'Maximum capacity must be greater than or equal to minimum capacity'
  }),
  minPrice: Joi.number().min(0).optional().messages({
    'number.min': 'Minimum price cannot be negative'
  }),
  maxPrice: Joi.number().greater(Joi.ref('minPrice')).optional().messages({
    'number.greater': 'Maximum price must be greater than minimum price'
  }),
  venueTypes: Joi.array().items(Joi.string()).optional(),
  page: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Page number must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  })
}).custom((value, helpers) => {
  if (value.location && !value.radius) {
    return helpers.error('any.required', {
      path: ['radius'],
      message: 'Radius is required when location is provided'
    });
  }
  if (value.radius && !value.location) {
    return helpers.error('any.required', {
      path: ['location'],
      message: 'Location is required when radius is provided'
    });
  }
  return value;
});

/**
 * Validation schema for venue suitability calculation parameters
 */
export const venueSuitabilityParamsSchema = Joi.object({
  groupSize: Joi.number().integer().min(1).required().messages({
    'number.base': 'Group size must be a number',
    'number.integer': 'Group size must be an integer',
    'number.min': 'Group size must be at least 1',
    'any.required': 'Group size is required'
  }),
  preferredLocation: coordinatesSchema.required().messages({
    'any.required': 'Preferred location is required'
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
  }).required().messages({
    'any.required': 'Budget range is required'
  }),
  accessibilityRequirements: Joi.array().items(Joi.string()).optional(),
  weights: Joi.object({
    distance: Joi.number().min(0).max(10).default(1),
    capacity: Joi.number().min(0).max(10).default(1),
    budget: Joi.number().min(0).max(10).default(1),
    accessibility: Joi.number().min(0).max(10).default(1)
  }).optional()
});

/**
 * Validation schema for venue recommendation request parameters
 */
export const venueRecommendationParamsSchema = Joi.object({
  tribeId: Joi.alternatives().conditional('eventId', {
    is: Joi.exist(),
    then: idSchema.optional(),
    otherwise: idSchema.required().messages({
      'any.required': 'Tribe ID is required when Event ID is not provided'
    })
  }),
  eventId: Joi.alternatives().conditional('tribeId', {
    is: Joi.exist(),
    then: idSchema.optional(),
    otherwise: idSchema.required().messages({
      'any.required': 'Event ID is required when Tribe ID is not provided'
    })
  }),
  groupSize: Joi.number().integer().min(1).required().messages({
    'number.base': 'Group size must be a number',
    'number.integer': 'Group size must be an integer',
    'number.min': 'Group size must be at least 1',
    'any.required': 'Group size is required'
  }),
  preferredLocation: coordinatesSchema.required().messages({
    'any.required': 'Preferred location is required'
  }),
  maxDistance: Joi.number().min(0.1).max(50).default(10).messages({
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
  }).required().messages({
    'any.required': 'Budget range is required'
  }),
  venueTypes: Joi.array().items(Joi.string()).optional(),
  accessibilityRequirements: Joi.array().items(Joi.string()).optional(),
  limit: Joi.number().integer().min(1).max(20).default(5).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 20'
  })
}).custom((value, helpers) => {
  if (!value.tribeId && !value.eventId) {
    return helpers.error('object.missing', {
      message: 'Either tribeId or eventId must be provided'
    });
  }
  return value;
});

/**
 * Validation schema for transportation options request parameters
 */
export const transportationRequestSchema = Joi.object({
  venueId: idSchema.required().messages({
    'any.required': 'Venue ID is required'
  }),
  fromLocation: coordinatesSchema.required().messages({
    'any.required': 'From location is required'
  }),
  transportModes: Joi.array().items(
    Joi.string().valid('driving', 'walking', 'bicycling', 'transit', 'rideshare')
  ).optional(),
  departureTime: Joi.date().iso().optional().messages({
    'date.base': 'Departure time must be a valid date',
    'date.format': 'Departure time must be in ISO format'
  }),
  returnOptions: Joi.boolean().default(false)
});

/**
 * Validation schema for optimal venue location request parameters
 */
export const optimalLocationRequestSchema = Joi.object({
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
  attendeeIds: Joi.array().items(idSchema).optional(),
  weightByRsvpStatus: Joi.boolean().default(true),
  considerTransportationMode: Joi.boolean().default(true),
  maxTravelTime: Joi.number().integer().min(5).max(120).default(30).messages({
    'number.min': 'Maximum travel time must be at least 5 minutes',
    'number.max': 'Maximum travel time cannot exceed 120 minutes'
  }),
  venueTypes: Joi.array().items(Joi.string()).optional()
}).custom((value, helpers) => {
  if (!value.tribeId && !value.eventId) {
    return helpers.error('object.missing', {
      message: 'Either tribeId or eventId must be provided'
    });
  }
  return value;
});

/**
 * Validates venue search parameters
 * 
 * @param searchParams - Parameters to validate
 * @returns Validated search parameters
 * @throws ValidationError if validation fails
 */
export function validateVenueSearchParams(searchParams: IVenueSearchParams): IVenueSearchParams {
  const { error, value } = venueSearchParamsSchema.validate(searchParams, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates venue suitability calculation parameters
 * 
 * @param suitabilityParams - Parameters to validate
 * @returns Validated suitability parameters
 * @throws ValidationError if validation fails
 */
export function validateVenueSuitabilityParams(suitabilityParams: IVenueSuitabilityParams): IVenueSuitabilityParams {
  const { error, value } = venueSuitabilityParamsSchema.validate(suitabilityParams, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates venue recommendation request parameters
 * 
 * @param recommendationParams - Parameters to validate
 * @returns Validated recommendation parameters
 * @throws ValidationError if validation fails
 */
export function validateVenueRecommendationParams(recommendationParams: IVenueRecommendationParams): IVenueRecommendationParams {
  const { error, value } = venueRecommendationParamsSchema.validate(recommendationParams, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates transportation options request parameters
 * 
 * @param requestParams - Parameters to validate
 * @returns Validated request parameters
 * @throws ValidationError if validation fails
 */
export function validateTransportationRequest(requestParams: any): any {
  const { error, value } = transportationRequestSchema.validate(requestParams, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates optimal venue location request parameters
 * 
 * @param requestParams - Parameters to validate
 * @returns Validated request parameters
 * @throws ValidationError if validation fails
 */
export function validateOptimalLocationRequest(requestParams: any): any {
  const { error, value } = optimalLocationRequestSchema.validate(requestParams, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}