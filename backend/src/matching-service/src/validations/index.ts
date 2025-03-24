/**
 * Central export file for validation schemas and middleware functions
 * in the matching service. This index file makes validation components
 * easily importable by other modules in the matching service.
 * 
 * Supports the AI-powered matchmaking process by providing validation
 * for compatibility calculations and matching operations.
 */

// Export all compatibility validation schemas and middleware
export {
  compatibilityParamsSchema,
  compatibilityQuerySchema,
  getCompatibilitySchema,
  calculateCompatibilitySchema,
  calculateBatchCompatibilitySchema,
  validateGetCompatibility,
  validateCalculateCompatibility,
  validateCalculateBatchCompatibility
} from './compatibility.validation';

// Export all matching validation schemas and middleware
export {
  matchingParamsSchema,
  matchingQuerySchema,
  getMatchingRequestSchema,
  getMatchResultSchema,
  createMatchingRequestSchema,
  createBatchMatchingRequestSchema,
  matchingPreferencesSchema,
  respondToMatchSchema,
  autoMatchingJobSchema,
  validateGetMatchingRequest,
  validateGetMatchResult,
  validateCreateMatchingRequest,
  validateCreateBatchMatchingRequest,
  validateUpdateMatchingPreferences,
  validateRespondToMatch,
  validateCreateAutoMatchingJob
} from './matching.validation';