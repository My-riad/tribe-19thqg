import Joi from 'joi'; // ^17.9.2
import { PersonalityTrait, CommunicationStyle } from '../../../shared/src/types/profile.types';
import { validateBody, validateParams } from '../../../shared/src/middlewares/validation.middleware';
import { idSchema } from '../../../shared/src/validation/common.validation';
import { ValidationError } from '../../../shared/src/errors/validation.error';

/**
 * Validation schema for an individual personality trait
 */
export const personalityTraitSchema = Joi.object({
  profileId: idSchema,
  trait: Joi.string().valid(...Object.values(PersonalityTrait)).required().messages({
    'any.only': `Trait must be one of: ${Object.values(PersonalityTrait).join(', ')}`,
    'any.required': 'Personality trait is required'
  }),
  score: Joi.number().min(0).max(10).required().messages({
    'number.min': 'Score must be between 0 and 10',
    'number.max': 'Score must be between 0 and 10',
    'any.required': 'Trait score is required'
  }),
  assessedAt: Joi.date().default(Date.now)
});

/**
 * Validation schema for a complete personality assessment
 */
export const personalityAssessmentSchema = Joi.object({
  profileId: idSchema,
  traits: Joi.array().items(Joi.object({
    trait: Joi.string().valid(...Object.values(PersonalityTrait)).required(),
    score: Joi.number().min(0).max(10).required()
  })).min(5).required().messages({
    'array.min': 'At least 5 personality traits must be provided',
    'any.required': 'Personality traits array is required'
  }),
  communicationStyle: Joi.string().valid(...Object.values(CommunicationStyle)).required().messages({
    'any.only': `Communication style must be one of: ${Object.values(CommunicationStyle).join(', ')}`,
    'any.required': 'Communication style is required'
  }),
  assessmentSource: Joi.string().max(100).default('user_input')
});

/**
 * Route parameter validation for personality trait ID
 */
export const personalityTraitParamsSchema = Joi.object({
  id: idSchema
});

/**
 * Route parameter validation for profile personality
 */
export const profilePersonalityParamsSchema = Joi.object({
  profileId: idSchema
});

/**
 * Route parameter validation for personality compatibility calculation
 */
export const compatibilityParamsSchema = Joi.object({
  profileId1: idSchema,
  profileId2: idSchema
});

/**
 * Middleware for validating personality trait route parameters
 */
export const validatePersonalityTraitParams = validateParams(personalityTraitParamsSchema);

/**
 * Middleware for validating profile personality route parameters
 */
export const validateProfilePersonalityParams = validateParams(profilePersonalityParamsSchema);

/**
 * Middleware for validating personality trait request body
 */
export const validatePersonalityTraitBody = validateBody(personalityTraitSchema);

/**
 * Middleware for validating personality assessment request body
 */
export const validatePersonalityAssessmentBody = validateBody(personalityAssessmentSchema);

/**
 * Middleware for validating personality compatibility calculation parameters
 */
export const validatePersonalityCompatibilityParams = validateParams(compatibilityParamsSchema);

/**
 * Validates a personality trait object
 * 
 * @param trait - The personality trait object to validate
 * @returns The validated trait if validation passes
 * @throws ValidationError if validation fails
 */
export function validatePersonalityTrait(trait: any): any {
  const { error, value } = personalityTraitSchema.validate(trait, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates a complete personality assessment
 * 
 * @param assessment - The personality assessment to validate
 * @returns The validated assessment if validation passes
 * @throws ValidationError if validation fails
 */
export function validatePersonalityAssessment(assessment: any): any {
  const { error, value } = personalityAssessmentSchema.validate(assessment, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}