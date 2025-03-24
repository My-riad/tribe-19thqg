import {
  validateBody,
  validateParams,
  validateQuery,
  validateRequest
} from '../../../shared/src/middlewares/validation.middleware';
import { CompatibilityFactor } from '../models/compatibility.model';
import {
  PersonalityTrait,
  InterestCategory,
  CommunicationStyle
} from '../../shared/src/types/profile.types';
import {
  TRIBE_LIMITS,
  MATCHING
} from '../../shared/src/constants/app.constants';

// Schema for matching endpoint parameters
export const matchingParamsSchema = {
  id: { type: 'string', format: 'uuid' }
};

// Schema for matching endpoint query parameters
export const matchingQuerySchema = {
  includeDetails: { type: 'boolean', optional: true }
};

// Schema for retrieving a matching request
export const getMatchingRequestSchema = {
  params: matchingParamsSchema,
  query: matchingQuerySchema
};

// Schema for retrieving match results
export const getMatchResultSchema = {
  params: matchingParamsSchema,
  query: matchingQuerySchema
};

// Schema for creating a matching request
export const createMatchingRequestSchema = {
  userId: { type: 'string', format: 'uuid' },
  criteria: {
    type: 'object',
    properties: {
      personalityTraits: {
        type: 'array',
        optional: true,
        items: {
          type: 'object',
          properties: {
            trait: { type: 'string', enum: Object.values(PersonalityTrait) },
            importance: { type: 'number', min: 0, max: 1 }
          }
        }
      },
      interests: {
        type: 'array',
        optional: true,
        items: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: Object.values(InterestCategory) },
            importance: { type: 'number', min: 0, max: 1 }
          }
        }
      },
      communicationStyles: {
        type: 'array',
        optional: true,
        items: { type: 'string', enum: Object.values(CommunicationStyle) }
      },
      location: {
        type: 'object',
        optional: true,
        properties: {
          latitude: { type: 'number', min: -90, max: 90 },
          longitude: { type: 'number', min: -180, max: 180 }
        }
      },
      maxDistance: { type: 'number', min: 1, max: 100, optional: true },
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
    }
  },
  preferExistingTribes: { type: 'boolean', optional: true }
};

// Schema for creating batch matching requests
export const createBatchMatchingRequestSchema = {
  userIds: {
    type: 'array',
    minLength: 1,
    maxLength: MATCHING.MATCHING_BATCH_SIZE,
    items: { type: 'string', format: 'uuid' }
  },
  criteria: {
    type: 'object',
    properties: {
      personalityTraits: {
        type: 'array',
        optional: true,
        items: {
          type: 'object',
          properties: {
            trait: { type: 'string', enum: Object.values(PersonalityTrait) },
            importance: { type: 'number', min: 0, max: 1 }
          }
        }
      },
      interests: {
        type: 'array',
        optional: true,
        items: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: Object.values(InterestCategory) },
            importance: { type: 'number', min: 0, max: 1 }
          }
        }
      },
      communicationStyles: {
        type: 'array',
        optional: true,
        items: { type: 'string', enum: Object.values(CommunicationStyle) }
      },
      location: {
        type: 'object',
        optional: true,
        properties: {
          latitude: { type: 'number', min: -90, max: 90 },
          longitude: { type: 'number', min: -180, max: 180 }
        }
      },
      maxDistance: { type: 'number', min: 1, max: 100, optional: true },
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
    }
  },
  preferExistingTribes: { type: 'boolean', optional: true }
};

// Schema for updating matching preferences
export const matchingPreferencesSchema = {
  autoMatchingEnabled: { type: 'boolean' },
  matchingFrequency: { type: 'string', enum: ['weekly', 'biweekly', 'monthly'] },
  criteria: {
    type: 'object',
    properties: {
      personalityTraits: {
        type: 'array',
        optional: true,
        items: {
          type: 'object',
          properties: {
            trait: { type: 'string', enum: Object.values(PersonalityTrait) },
            importance: { type: 'number', min: 0, max: 1 }
          }
        }
      },
      interests: {
        type: 'array',
        optional: true,
        items: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: Object.values(InterestCategory) },
            importance: { type: 'number', min: 0, max: 1 }
          }
        }
      },
      communicationStyles: {
        type: 'array',
        optional: true,
        items: { type: 'string', enum: Object.values(CommunicationStyle) }
      },
      location: {
        type: 'object',
        optional: true,
        properties: {
          latitude: { type: 'number', min: -90, max: 90 },
          longitude: { type: 'number', min: -180, max: 180 }
        }
      },
      maxDistance: { type: 'number', min: 1, max: 100, optional: true },
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
    }
  }
};

// Schema for responding to a match
export const respondToMatchSchema = {
  userId: { type: 'string', format: 'uuid' },
  matchId: { type: 'string', format: 'uuid' },
  response: { type: 'string', enum: ['accept', 'decline'] },
  feedback: { type: 'string', optional: true }
};

// Schema for automating matching jobs
export const autoMatchingJobSchema = {
  userIds: {
    type: 'array',
    optional: true,
    items: { type: 'string', format: 'uuid' }
  },
  matchingFrequency: { type: 'string', enum: ['weekly', 'biweekly', 'monthly'] },
  runImmediately: { type: 'boolean', optional: true }
};

/**
 * Creates middleware for validating get matching request
 */
export function validateGetMatchingRequest() {
  return validateRequest(getMatchingRequestSchema);
}

/**
 * Creates middleware for validating get match result request
 */
export function validateGetMatchResult() {
  return validateRequest(getMatchResultSchema);
}

/**
 * Creates middleware for validating create matching request
 */
export function validateCreateMatchingRequest() {
  return validateBody(createMatchingRequestSchema);
}

/**
 * Creates middleware for validating create batch matching request
 */
export function validateCreateBatchMatchingRequest() {
  return validateBody(createBatchMatchingRequestSchema);
}

/**
 * Creates middleware for validating update matching preferences request
 */
export function validateUpdateMatchingPreferences() {
  return validateBody(matchingPreferencesSchema);
}

/**
 * Creates middleware for validating respond to match request
 */
export function validateRespondToMatch() {
  return validateBody(respondToMatchSchema);
}

/**
 * Creates middleware for validating create auto matching job request
 */
export function validateCreateAutoMatchingJob() {
  return validateBody(autoMatchingJobSchema);
}