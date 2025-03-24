/**
 * Barrel file for easy import of all planning service models
 * This file re-exports all models, types, interfaces, and enums from the planning service
 */

// Availability Model
import Availability, { 
  AvailabilityStatus,
  RecurrenceType,
  ITimeSlot,
  IAvailability,
  IAvailabilityCreate,
  IAvailabilityUpdate
} from './availability.model';

// Planning Model
import PlanningModel, {
  PlanningStatus,
  VoteType,
  IOptimalTimeSlot,
  IVenueSuggestion,
  IEventPlan,
  IReminderSchedule,
  IReminder,
  IVotingResults,
  IAutoSuggestedPlan,
  IPlanningSession,
  IPlanningSessionCreate,
  IPlanningSessionUpdate,
  IPlanningPreferences,
  IEventPlanFinalize
} from './planning.model';

// Venue Model
import VenueModel, {
  IVenueSearchParams,
  IVenueSuitabilityParams,
  IVenueSuitability,
  IVenueRecommendationParams,
  IVenueDetails,
  ITransportationOption
} from './venue.model';

// Re-export Availability model and related types
export {
  Availability,
  AvailabilityStatus,
  RecurrenceType,
  ITimeSlot,
  IAvailability,
  IAvailabilityCreate,
  IAvailabilityUpdate
};

// Re-export Planning model and related types
export {
  PlanningModel,
  PlanningStatus,
  VoteType,
  IOptimalTimeSlot,
  IVenueSuggestion,
  IEventPlan,
  IReminderSchedule,
  IReminder,
  IVotingResults,
  IAutoSuggestedPlan,
  IPlanningSession,
  IPlanningSessionCreate,
  IPlanningSessionUpdate,
  IPlanningPreferences,
  IEventPlanFinalize
};

// Re-export Venue model and related types
export {
  VenueModel,
  IVenueSearchParams,
  IVenueSuitabilityParams,
  IVenueSuitability,
  IVenueRecommendationParams,
  IVenueDetails,
  ITransportationOption
};

// Export default models
export default {
  Availability,
  PlanningModel,
  VenueModel
};