/**
 * Barrel file that exports all validation schemas and utility functions 
 * from the event service validation modules.
 * 
 * This file centralizes access to validation functionality for:
 * - Event creation and management
 * - Event discovery and recommendations
 * - RSVP and check-in management
 * - Scheduling and conflict checking
 * 
 * By using this barrel file, other modules can import validation utilities
 * from a single source rather than multiple individual files.
 */

// Import event management validation utilities
import {
  eventCreateSchema,
  eventUpdateSchema,
  eventStatusUpdateSchema,
  rsvpUpdateSchema,
  checkInUpdateSchema,
  eventConflictCheckSchema,
  validateEventCreate,
  validateEventUpdate,
  validateEventStatusUpdate,
  validateRSVPUpdate,
  validateCheckInUpdate,
  validateEventConflictCheck
} from './event.validation';

// Import event discovery validation utilities
import {
  eventSearchSchema,
  eventRecommendationSchema,
  weatherBasedActivitySchema,
  nearbyEventsSchema,
  popularEventsSchema,
  validateEventSearchParams,
  validateEventRecommendationParams,
  validateWeatherBasedActivityParams,
  validateNearbyEventsParams,
  validatePopularEventsParams
} from './discovery.validation';

// Re-export all validation schemas
export {
  // Event management schemas
  eventCreateSchema,
  eventUpdateSchema,
  eventStatusUpdateSchema,
  rsvpUpdateSchema,
  checkInUpdateSchema,
  eventConflictCheckSchema,

  // Event discovery schemas
  eventSearchSchema,
  eventRecommendationSchema,
  weatherBasedActivitySchema,
  nearbyEventsSchema,
  popularEventsSchema,

  // Event management validation functions
  validateEventCreate,
  validateEventUpdate,
  validateEventStatusUpdate,
  validateRSVPUpdate,
  validateCheckInUpdate,
  validateEventConflictCheck,

  // Event discovery validation functions
  validateEventSearchParams,
  validateEventRecommendationParams,
  validateWeatherBasedActivityParams,
  validateNearbyEventsParams,
  validatePopularEventsParams
};