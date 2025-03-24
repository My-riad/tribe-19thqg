import Joi from 'joi'; // v17.9.2
import { 
  IProfileCreate, 
  IProfileUpdate, 
  IProfileSearchParams, 
  CommunicationStyle,
  ICoordinates
} from '../../../shared/src/types/profile.types';
import { 
  validateBody, 
  validateParams, 
  validateQuery 
} from '../../../shared/src/middlewares/validation.middleware';
import { 
  idSchema, 
  coordinatesSchema 
} from '../../../shared/src/validation/common.validation';
import { ValidationError } from '../../../shared/src/errors/validation.error';
import { 
  EMAIL_REGEX, 
  PHONE_REGEX 
} from '../../../shared/src/constants/regex.constants';

/**
 * Validation schema for creating a new profile
 */
export const profileCreateSchema = Joi.object({
  userId: idSchema,
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required'
  }),
  bio: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Bio cannot exceed 500 characters'
  }),
  location: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Location must be at least 2 characters',
    'string.max': 'Location cannot exceed 100 characters',
    'any.required': 'Location is required'
  }),
  coordinates: coordinatesSchema.required().messages({
    'any.required': 'Coordinates are required'
  }),
  birthdate: Joi.date().max('now').required().messages({
    'date.max': 'Birthdate cannot be in the future',
    'any.required': 'Birthdate is required'
  }),
  phoneNumber: Joi.string().pattern(PHONE_REGEX).allow('').optional().messages({
    'string.pattern.base': 'Invalid phone number format'
  }),
  avatarUrl: Joi.string().uri().allow('').optional().messages({
    'string.uri': 'Avatar URL must be a valid URI'
  }),
  communicationStyle: Joi.string().valid(...Object.values(CommunicationStyle)).required().messages({
    'any.only': `Communication style must be one of: ${Object.values(CommunicationStyle).join(', ')}`,
    'any.required': 'Communication style is required'
  }),
  maxTravelDistance: Joi.number().min(1).max(100).default(15).messages({
    'number.min': 'Maximum travel distance must be at least 1 mile',
    'number.max': 'Maximum travel distance cannot exceed 100 miles'
  })
});

/**
 * Validation schema for updating an existing profile
 */
export const profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters'
  }),
  bio: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Bio cannot exceed 500 characters'
  }),
  location: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Location must be at least 2 characters',
    'string.max': 'Location cannot exceed 100 characters'
  }),
  coordinates: coordinatesSchema.optional(),
  birthdate: Joi.date().max('now').optional().messages({
    'date.max': 'Birthdate cannot be in the future'
  }),
  phoneNumber: Joi.string().pattern(PHONE_REGEX).allow('').optional().messages({
    'string.pattern.base': 'Invalid phone number format'
  }),
  avatarUrl: Joi.string().uri().allow('').optional().messages({
    'string.uri': 'Avatar URL must be a valid URI'
  }),
  communicationStyle: Joi.string().valid(...Object.values(CommunicationStyle)).optional().messages({
    'any.only': `Communication style must be one of: ${Object.values(CommunicationStyle).join(', ')}`,
  }),
  maxTravelDistance: Joi.number().min(1).max(100).optional().messages({
    'number.min': 'Maximum travel distance must be at least 1 mile',
    'number.max': 'Maximum travel distance cannot exceed 100 miles'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Validation schema for profile route parameters
 */
export const profileParamsSchema = Joi.object({
  id: idSchema
});

/**
 * Validation schema for profile search parameters
 */
export const profileSearchSchema = Joi.object({
  query: Joi.string().max(100).optional(),
  location: coordinatesSchema.optional(),
  maxDistance: Joi.number().min(1).max(100).default(15),
  interests: Joi.array().items(Joi.string()).optional(),
  communicationStyles: Joi.array().items(Joi.string().valid(...Object.values(CommunicationStyle))).optional(),
  personalityTraits: Joi.array().items(
    Joi.object({
      trait: Joi.string().required(),
      minScore: Joi.number().min(0).max(10).optional(),
      maxScore: Joi.number().min(0).max(10).optional()
    })
  ).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

/**
 * Validation schema for updating profile location
 */
export const locationUpdateSchema = Joi.object({
  location: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Location must be at least 2 characters',
    'string.max': 'Location cannot exceed 100 characters',
    'any.required': 'Location is required'
  }),
  coordinates: coordinatesSchema.required().messages({
    'any.required': 'Coordinates are required'
  })
});

/**
 * Validation schema for updating maximum travel distance
 */
export const maxTravelDistanceSchema = Joi.object({
  maxTravelDistance: Joi.number().min(1).max(100).required().messages({
    'number.min': 'Maximum travel distance must be at least 1 mile',
    'number.max': 'Maximum travel distance cannot exceed 100 miles',
    'any.required': 'Maximum travel distance is required'
  })
});

/**
 * Validates a profile creation request
 * 
 * @param profileData - The profile creation data to validate
 * @returns The validated profile data if validation passes
 * @throws ValidationError if validation fails
 */
export function validateProfileCreate(profileData: any): IProfileCreate {
  const { error, value } = profileCreateSchema.validate(profileData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates a profile update request
 * 
 * @param profileData - The profile update data to validate
 * @returns The validated profile data if validation passes
 * @throws ValidationError if validation fails
 */
export function validateProfileUpdate(profileData: any): IProfileUpdate {
  const { error, value } = profileUpdateSchema.validate(profileData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates geographic coordinates
 * 
 * @param coordinates - The coordinates to validate
 * @returns The validated coordinates if validation passes
 * @throws ValidationError if validation fails
 */
export function validateCoordinates(coordinates: any): ICoordinates {
  const { error, value } = coordinatesSchema.validate(coordinates, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates profile search parameters
 * 
 * @param searchParams - The search parameters to validate
 * @returns The validated search parameters if validation passes
 * @throws ValidationError if validation fails
 */
export function validateProfileSearchParams(searchParams: any): IProfileSearchParams {
  const { error, value } = profileSearchSchema.validate(searchParams, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Middleware for validating profile route parameters
 */
export const validateProfileParams = validateParams(profileParamsSchema);

/**
 * Middleware for validating profile creation request body
 */
export const validateProfileCreateBody = validateBody(profileCreateSchema);

/**
 * Middleware for validating profile update request body
 */
export const validateProfileUpdateBody = validateBody(profileUpdateSchema);

/**
 * Middleware for validating profile search query parameters
 */
export const validateProfileSearchQuery = validateQuery(profileSearchSchema);

/**
 * Middleware for validating location update request body
 */
export const validateLocationUpdateBody = validateBody(locationUpdateSchema);

/**
 * Middleware for validating maximum travel distance update request body
 */
export const validateMaxTravelDistanceBody = validateBody(maxTravelDistanceSchema);