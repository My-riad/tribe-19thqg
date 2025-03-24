/**
 * Centralized exports for all validation schemas and functions in the planning service.
 * This module serves as a single entry point for importing validation utilities related
 * to availability, planning sessions, and venues.
 */

// Import all validation modules
import * as availabilityValidation from './availability.validation';
import * as planningValidation from './planning.validation';
import * as venueValidation from './venue.validation';

// Export all validation namespaces
export { availabilityValidation, planningValidation, venueValidation };

// Direct exports of commonly used availability validation functions
export const {
  validateAvailabilityCreate,
  validateAvailabilityUpdate,
  validateAvailabilityQuery
} = availabilityValidation;

// Direct exports of commonly used planning validation functions
export const {
  validatePlanningSessionCreate,
  validatePlanningSessionUpdate,
  validateEventPlanFinalize
} = planningValidation;

// Direct exports of commonly used venue validation functions
export const {
  validateVenueSearchParams,
  validateVenueRecommendationParams
} = venueValidation;