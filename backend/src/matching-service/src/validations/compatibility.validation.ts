import { 
  validateBody, 
  validateParams, 
  validateQuery, 
  validateRequest 
} from '../../../shared/src/middlewares/validation.middleware';
import { CompatibilityFactor } from '../models/compatibility.model';

/**
 * Validation schema for compatibility route parameters
 * Ensures userId and targetId are valid UUIDs
 */
export const compatibilityParamsSchema = {
  userId: { type: 'string', format: 'uuid' },
  targetId: { type: 'string', format: 'uuid' }
};

/**
 * Validation schema for compatibility query parameters
 * Validates targetType and optional includeDetails flag
 */
export const compatibilityQuerySchema = {
  targetType: { type: 'string', enum: ['user', 'tribe'] },
  includeDetails: { type: 'boolean', optional: true }
};

/**
 * Combined validation schema for getting compatibility between a user and a target
 */
export const getCompatibilitySchema = {
  params: compatibilityParamsSchema,
  query: compatibilityQuerySchema
};

/**
 * Validation schema for calculating compatibility between a user and a target
 * Validates user identifiers, target type, and optional factor weights
 */
export const calculateCompatibilitySchema = {
  userId: { type: 'string', format: 'uuid' },
  targetType: { type: 'string', enum: ['user', 'tribe'] },
  targetId: { type: 'string', format: 'uuid' },
  includeDetails: { type: 'boolean', optional: true },
  factorWeights: {
    type: 'object',
    optional: true,
    properties: {
      [CompatibilityFactor.PERSONALITY]: { type: 'number', min: 0, max: 1, optional: true },
      [CompatibilityFactor.INTERESTS]: { type: 'number', min: 0, max: 1, optional: true },
      [CompatibilityFactor.COMMUNICATION_STYLE]: { type: 'number', min: 0, max: 1, optional: true },
      [CompatibilityFactor.LOCATION]: { type: 'number', min: 0, max: 1, optional: true },
      [CompatibilityFactor.GROUP_BALANCE]: { type: 'number', min: 0, max: 1, optional: true }
    }
  }
};

/**
 * Validation schema for batch calculating compatibility between a user and multiple targets
 * Validates user identifier, array of target IDs, target type, and optional factor weights
 */
export const calculateBatchCompatibilitySchema = {
  userId: { type: 'string', format: 'uuid' },
  targetType: { type: 'string', enum: ['user', 'tribe'] },
  targetIds: { type: 'array', minLength: 1, maxLength: 100, items: { type: 'string', format: 'uuid' } },
  includeDetails: { type: 'boolean', optional: true },
  factorWeights: {
    type: 'object',
    optional: true,
    properties: {
      [CompatibilityFactor.PERSONALITY]: { type: 'number', min: 0, max: 1, optional: true },
      [CompatibilityFactor.INTERESTS]: { type: 'number', min: 0, max: 1, optional: true },
      [CompatibilityFactor.COMMUNICATION_STYLE]: { type: 'number', min: 0, max: 1, optional: true },
      [CompatibilityFactor.LOCATION]: { type: 'number', min: 0, max: 1, optional: true },
      [CompatibilityFactor.GROUP_BALANCE]: { type: 'number', min: 0, max: 1, optional: true }
    }
  }
};

/**
 * Creates middleware for validating get compatibility request
 * Ensures that route parameters and query parameters are valid
 * 
 * @returns Express middleware function
 */
export function validateGetCompatibility() {
  return validateRequest(getCompatibilitySchema);
}

/**
 * Creates middleware for validating calculate compatibility request
 * Ensures that the request body contains valid user ID, target ID, target type,
 * and optional factor weights
 * 
 * @returns Express middleware function
 */
export function validateCalculateCompatibility() {
  return validateBody(calculateCompatibilitySchema);
}

/**
 * Creates middleware for validating batch compatibility calculation request
 * Ensures that the request body contains valid user ID, array of target IDs,
 * target type, and optional factor weights
 * 
 * @returns Express middleware function
 */
export function validateCalculateBatchCompatibility() {
  return validateBody(calculateBatchCompatibilitySchema);
}