/**
 * Central export file for Event Service utility functions.
 * 
 * This file consolidates all utility functions used throughout the event service module,
 * making them available through a single import. Functions handle event time calculations,
 * location services, event status management, weather suitability, and more.
 * 
 * @module utils/index
 */

import {
  calculateEventDuration,
  formatEventTimeRange,
  isEventInProgress,
  isEventUpcoming,
  isEventPast,
  calculateDistanceBetweenCoordinates,
  isLocationWithinRadius,
  getNextValidEventStatus,
  isValidEventStatusTransition,
  calculateEventCapacityStatus,
  categorizeEventsByDate,
  generateEventSummary,
  isOutdoorEvent,
  isWeatherSuitableForEvent,
  suggestAlternateEventTime,
  validateEventDates,
  calculateAttendanceRate
} from './event.util';

// Event time and duration utilities
export { calculateEventDuration };
export { formatEventTimeRange };
export { isEventInProgress };
export { isEventUpcoming };
export { isEventPast };

// Location and distance utilities
export { calculateDistanceBetweenCoordinates };
export { isLocationWithinRadius };

// Event status management utilities
export { getNextValidEventStatus };
export { isValidEventStatusTransition };
export { calculateEventCapacityStatus };

// Event grouping and formatting utilities
export { categorizeEventsByDate };
export { generateEventSummary };

// Weather and outdoor event utilities
export { isOutdoorEvent };
export { isWeatherSuitableForEvent };
export { suggestAlternateEventTime };

// Validation utilities
export { validateEventDates };

// Attendance tracking utilities
export { calculateAttendanceRate };