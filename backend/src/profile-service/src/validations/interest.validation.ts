/**
 * interest.validation.ts
 * 
 * Defines validation schemas and middleware for interest-related requests in the profile service.
 * This module ensures that all interest data submitted to the API meets the required format and
 * constraints before being processed by the service.
 */

import Joi from 'joi'; // ^17.9.2
import { InterestCategory, InterestLevel } from '../../../shared/src/types/profile.types';
import { validateBody, validateParams } from '../../../shared/src/middlewares/validation.middleware';
import { idSchema } from '../../../shared/src/validation/common.validation';

/**
 * Validation schema for a single interest
 * Ensures interest data contains valid category, name, and level fields
 */
export const interestSchema = Joi.object({
  category: Joi.string().valid(...Object.values(InterestCategory)).required().messages({
    'any.only': `Category must be one of: ${Object.values(InterestCategory).join(', ')}`,
    'any.required': 'Interest category is required'
  }),
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Interest name must be at least 2 characters',
    'string.max': 'Interest name cannot exceed 50 characters',
    'any.required': 'Interest name is required'
  }),
  level: Joi.number().valid(...Object.values(InterestLevel)).required().messages({
    'any.only': `Interest level must be one of: ${Object.values(InterestLevel).join(', ')}`,
    'any.required': 'Interest level is required'
  }),
  profileId: idSchema
});

/**
 * Validation schema for submitting multiple interests
 * Supports batch interest submission with option to replace existing interests
 */
export const interestSubmissionSchema = Joi.object({
  profileId: idSchema,
  interests: Joi.array().items(Joi.object({
    category: Joi.string().valid(...Object.values(InterestCategory)).required(),
    name: Joi.string().min(2).max(50).required(),
    level: Joi.number().valid(...Object.values(InterestLevel)).required()
  })).min(1).max(20).required().messages({
    'array.min': 'At least one interest must be provided',
    'array.max': 'Cannot submit more than 20 interests at once',
    'any.required': 'Interests array is required'
  }),
  replaceExisting: Joi.boolean().default(false)
});

/**
 * Validation schema for interest route parameters
 * Used for routes that operate on a specific interest by ID
 */
export const interestParamsSchema = Joi.object({
  id: idSchema
});

/**
 * Validation schema for profile interests route parameters
 * Used for routes that operate on all interests for a specific profile
 */
export const profileInterestsParamsSchema = Joi.object({
  profileId: idSchema
});

/**
 * Validation schema for interest compatibility calculation parameters
 * Used for calculating interest compatibility between two profiles
 */
export const compatibilityParamsSchema = Joi.object({
  profileId1: idSchema,
  profileId2: idSchema
});

/**
 * Middleware for validating interest route parameters
 * Verifies that interest ID is in valid UUID format
 */
export const validateInterestParams = validateParams(interestParamsSchema);

/**
 * Middleware for validating profile interests route parameters
 * Verifies that profile ID is in valid UUID format
 */
export const validateProfileInterestsParams = validateParams(profileInterestsParamsSchema);

/**
 * Middleware for validating a single interest
 * Ensures interest data meets all requirements
 */
export const validateInterest = validateBody(interestSchema);

/**
 * Middleware for validating interest submissions
 * Validates batch submissions of multiple interests
 */
export const validateInterestSubmission = validateBody(interestSubmissionSchema);

/**
 * Middleware for validating interest compatibility calculation parameters
 * Ensures both profile IDs are valid for compatibility calculation
 */
export const validateInterestCompatibilityParams = validateParams(compatibilityParamsSchema);