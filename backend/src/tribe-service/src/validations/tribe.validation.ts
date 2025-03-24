import Joi from 'joi'; // v17.9.2
import { 
  TribeStatus, 
  TribePrivacy, 
  ITribeCreate, 
  ITribeUpdate, 
  ITribeSearchParams, 
  ITribeInterest 
} from '@shared/types';
import { 
  InterestCategory, 
  ICoordinates 
} from '@shared/types';
import { 
  TRIBE_LIMITS, 
  LOCATION 
} from '@shared/constants/app.constants';
import { 
  idSchema, 
  coordinatesSchema, 
  paginationSchema 
} from '@shared/validation/common.validation';
import { ValidationError } from '@shared/errors/validation.error';

// Schema for creating a new tribe
export const createTribeSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    'string.min': 'Tribe name must be at least 3 characters',
    'string.max': 'Tribe name cannot exceed 50 characters',
    'any.required': 'Tribe name is required'
  }),
  description: Joi.string().min(10).max(500).required().messages({
    'string.min': 'Tribe description must be at least 10 characters',
    'string.max': 'Tribe description cannot exceed 500 characters',
    'any.required': 'Tribe description is required'
  }),
  location: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Location must be at least 2 characters',
    'string.max': 'Location cannot exceed 100 characters',
    'any.required': 'Location is required'
  }),
  coordinates: coordinatesSchema.required().messages({
    'any.required': 'Coordinates are required'
  }),
  imageUrl: Joi.string().uri().allow('').optional(),
  privacy: Joi.string().valid(...Object.values(TribePrivacy)).default(TribePrivacy.PUBLIC),
  maxMembers: Joi.number().integer().min(TRIBE_LIMITS.MIN_MEMBERS).max(TRIBE_LIMITS.MAX_MEMBERS)
    .default(TRIBE_LIMITS.MAX_MEMBERS).messages({
      'number.min': `Tribe must have at least ${TRIBE_LIMITS.MIN_MEMBERS} members`,
      'number.max': `Tribe cannot exceed ${TRIBE_LIMITS.MAX_MEMBERS} members`
    }),
  createdBy: idSchema.required().messages({
    'any.required': 'Creator ID is required'
  }),
  interests: Joi.array().items(Joi.object({
    category: Joi.string().valid(...Object.values(InterestCategory)).required().messages({
      'any.required': 'Interest category is required',
      'any.only': 'Invalid interest category'
    }),
    name: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Interest name must be at least 2 characters',
      'string.max': 'Interest name cannot exceed 50 characters',
      'any.required': 'Interest name is required'
    }),
    isPrimary: Joi.boolean().default(false)
  })).min(1).max(5).messages({
    'array.min': 'At least one interest is required',
    'array.max': 'Cannot exceed 5 interests'
  })
});

// Schema for updating an existing tribe
export const updateTribeSchema = Joi.object({
  name: Joi.string().min(3).max(50).messages({
    'string.min': 'Tribe name must be at least 3 characters',
    'string.max': 'Tribe name cannot exceed 50 characters'
  }),
  description: Joi.string().min(10).max(500).messages({
    'string.min': 'Tribe description must be at least 10 characters',
    'string.max': 'Tribe description cannot exceed 500 characters'
  }),
  location: Joi.string().min(2).max(100).messages({
    'string.min': 'Location must be at least 2 characters',
    'string.max': 'Location cannot exceed 100 characters'
  }),
  coordinates: coordinatesSchema,
  imageUrl: Joi.string().uri().allow('').optional(),
  privacy: Joi.string().valid(...Object.values(TribePrivacy)),
  status: Joi.string().valid(...Object.values(TribeStatus)),
  maxMembers: Joi.number().integer().min(TRIBE_LIMITS.MIN_MEMBERS).max(TRIBE_LIMITS.MAX_MEMBERS)
    .messages({
      'number.min': `Tribe must have at least ${TRIBE_LIMITS.MIN_MEMBERS} members`,
      'number.max': `Tribe cannot exceed ${TRIBE_LIMITS.MAX_MEMBERS} members`
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Schema for tribe search parameters
export const tribeSearchSchema = Joi.object({
  query: Joi.string().max(100),
  interests: Joi.array().items(Joi.string().valid(...Object.values(InterestCategory))),
  location: coordinatesSchema,
  maxDistance: Joi.number().min(1).max(LOCATION.MAX_RADIUS_MILES)
    .default(LOCATION.DEFAULT_RADIUS_MILES)
    .when('location', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }).messages({
      'number.min': 'Maximum distance must be at least 1 mile',
      'number.max': `Maximum distance cannot exceed ${LOCATION.MAX_RADIUS_MILES} miles`,
      'any.required': 'Maximum distance is required when location is provided',
      'any.forbidden': 'Maximum distance cannot be provided without location'
    }),
  status: Joi.array().items(Joi.string().valid(...Object.values(TribeStatus)))
    .default([TribeStatus.FORMING, TribeStatus.ACTIVE]),
  privacy: Joi.string().valid(...Object.values(TribePrivacy)),
  hasAvailableSpots: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

// Schema for tribe interests
export const tribeInterestSchema = Joi.object({
  tribeId: idSchema.required().messages({
    'any.required': 'Tribe ID is required'
  }),
  category: Joi.string().valid(...Object.values(InterestCategory)).required().messages({
    'any.required': 'Interest category is required',
    'any.only': 'Invalid interest category'
  }),
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Interest name must be at least 2 characters',
    'string.max': 'Interest name cannot exceed 50 characters',
    'any.required': 'Interest name is required'
  }),
  isPrimary: Joi.boolean().default(false)
});

// Schema for tribe status updates
export const tribeStatusSchema = Joi.string().valid(...Object.values(TribeStatus)).required().messages({
  'any.required': 'Tribe status is required',
  'any.only': 'Invalid tribe status'
});

/**
 * Validates data for creating a new tribe
 * 
 * @param tribeData - The tribe data to validate
 * @returns The validated tribe data with default values applied
 * @throws ValidationError if validation fails
 */
export function validateCreateTribe(tribeData: Partial<ITribeCreate>): Partial<ITribeCreate> {
  const { error, value } = createTribeSchema.validate(tribeData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates data for updating an existing tribe
 * 
 * @param updateData - The update data to validate
 * @returns The validated update data
 * @throws ValidationError if validation fails
 */
export function validateUpdateTribe(updateData: Partial<ITribeUpdate>): Partial<ITribeUpdate> {
  const { error, value } = updateTribeSchema.validate(updateData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates a tribe ID
 * 
 * @param id - The ID to validate
 * @returns The validated ID
 * @throws ValidationError if validation fails
 */
export function validateTribeId(id: string): string {
  const { error, value } = idSchema.validate(id, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates search parameters for finding tribes
 * 
 * @param searchParams - The search parameters to validate
 * @returns The validated search parameters with default values applied
 * @throws ValidationError if validation fails
 */
export function validateTribeSearchParams(searchParams: Partial<ITribeSearchParams>): Partial<ITribeSearchParams> {
  const { error, value } = tribeSearchSchema.validate(searchParams, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates tribe interest data
 * 
 * @param interestData - The interest data to validate
 * @returns The validated interest data with default values applied
 * @throws ValidationError if validation fails
 */
export function validateTribeInterest(interestData: Partial<ITribeInterest>): Partial<ITribeInterest> {
  const { error, value } = tribeInterestSchema.validate(interestData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates a tribe status update
 * 
 * @param status - The status to validate
 * @returns The validated status
 * @throws ValidationError if validation fails
 */
export function validateTribeStatus(status: TribeStatus): TribeStatus {
  const { error, value } = tribeStatusSchema.validate(status, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}