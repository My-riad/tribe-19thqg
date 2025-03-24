/**
 * Utility functions for event-related operations in the Tribe platform.
 * Provides helper methods for event validation, formatting, calculations, and transformations
 * that are used across the event service.
 */

import {
  IEvent,
  IEventCreate,
  IEventUpdate,
  EventStatus,
  EventType,
  EventVisibility,
  RSVPStatus,
  IWeatherData
} from '../../../shared/src/types/event.types';
import { ICoordinates, InterestCategory } from '../../../shared/src/types/profile.types';
import { logger } from '../../../shared/src/utils/logger.util';
import {
  format,
  addDays,
  isAfter,
  isBefore,
  isWithinInterval,
  differenceInHours,
  differenceInDays
} from 'date-fns'; // ^2.29.3

/**
 * Calculates the duration of an event in hours
 * 
 * @param startTime - The start time of the event
 * @param endTime - The end time of the event
 * @returns Duration in hours
 */
export function calculateEventDuration(startTime: Date, endTime: Date): number {
  // Validate input dates
  if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
    throw new Error('Invalid date objects provided for duration calculation');
  }
  
  // Ensure endTime is after startTime
  if (isBefore(endTime, startTime)) {
    throw new Error('End time must be after start time');
  }
  
  // Calculate duration in hours (can be decimal)
  return differenceInHours(endTime, startTime);
}

/**
 * Formats the start and end time of an event into a human-readable string
 * 
 * @param startTime - The start time of the event
 * @param endTime - The end time of the event
 * @param formatString - Optional custom format string
 * @returns Formatted time range string
 */
export function formatEventTimeRange(
  startTime: Date,
  endTime: Date,
  formatString?: string
): string {
  // Validate input dates
  if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
    throw new Error('Invalid date objects provided for time range formatting');
  }
  
  // Default format string if not provided
  const defaultFormat = 'MMM d, yyyy h:mm a';
  const timeFormat = formatString || defaultFormat;
  
  // Format start and end times
  const formattedStart = format(startTime, timeFormat);
  const formattedEnd = format(endTime, timeFormat);
  
  // If the start and end dates are the same day, use a more concise format
  if (format(startTime, 'yyyy-MM-dd') === format(endTime, 'yyyy-MM-dd')) {
    return `${format(startTime, 'MMM d, yyyy')} ${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
  }
  
  return `${formattedStart} - ${formattedEnd}`;
}

/**
 * Checks if an event is currently in progress
 * 
 * @param event - The event to check
 * @returns True if the event is in progress, false otherwise
 */
export function isEventInProgress(event: IEvent): boolean {
  const now = new Date();
  
  return isWithinInterval(now, {
    start: event.startTime,
    end: event.endTime
  });
}

/**
 * Checks if an event is upcoming (in the future)
 * 
 * @param event - The event to check
 * @param hoursThreshold - Optional threshold in hours to consider an event upcoming
 * @returns True if the event is upcoming, false otherwise
 */
export function isEventUpcoming(event: IEvent, hoursThreshold?: number): boolean {
  const now = new Date();
  
  // Check if the event hasn't started yet
  const isInFuture = isAfter(event.startTime, now);
  
  // If hoursThreshold is provided, check if the event starts within that time window
  if (hoursThreshold !== undefined && isInFuture) {
    const hoursUntilStart = differenceInHours(event.startTime, now);
    return hoursUntilStart <= hoursThreshold;
  }
  
  return isInFuture;
}

/**
 * Checks if an event is in the past (already ended)
 * 
 * @param event - The event to check
 * @returns True if the event is past, false otherwise
 */
export function isEventPast(event: IEvent): boolean {
  const now = new Date();
  return isBefore(event.endTime, now);
}

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * 
 * @param coords1 - First set of coordinates
 * @param coords2 - Second set of coordinates
 * @returns Distance in kilometers
 */
export function calculateDistanceBetweenCoordinates(
  coords1: ICoordinates,
  coords2: ICoordinates
): number {
  // Radius of the Earth in kilometers
  const R = 6371;
  
  // Convert latitude and longitude from degrees to radians
  const lat1Rad = (coords1.latitude * Math.PI) / 180;
  const lon1Rad = (coords1.longitude * Math.PI) / 180;
  const lat2Rad = (coords2.latitude * Math.PI) / 180;
  const lon2Rad = (coords2.longitude * Math.PI) / 180;
  
  // Haversine formula
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

/**
 * Checks if a location is within a specified radius of another location
 * 
 * @param centerCoords - Center coordinates
 * @param targetCoords - Target coordinates to check
 * @param radiusKm - Radius in kilometers
 * @returns True if the target location is within the radius, false otherwise
 */
export function isLocationWithinRadius(
  centerCoords: ICoordinates,
  targetCoords: ICoordinates,
  radiusKm: number
): boolean {
  const distance = calculateDistanceBetweenCoordinates(centerCoords, targetCoords);
  return distance <= radiusKm;
}

/**
 * Determines the next valid status for an event based on its current status
 * 
 * @param currentStatus - Current event status
 * @returns Array of valid next statuses
 */
export function getNextValidEventStatus(currentStatus: EventStatus): EventStatus[] {
  // Define valid status transitions
  const statusTransitions: Record<EventStatus, EventStatus[]> = {
    [EventStatus.DRAFT]: [EventStatus.SCHEDULED, EventStatus.CANCELLED],
    [EventStatus.SCHEDULED]: [EventStatus.ACTIVE, EventStatus.CANCELLED],
    [EventStatus.ACTIVE]: [EventStatus.COMPLETED, EventStatus.CANCELLED],
    [EventStatus.COMPLETED]: [],
    [EventStatus.CANCELLED]: []
  };
  
  return statusTransitions[currentStatus] || [];
}

/**
 * Checks if a status transition is valid for an event
 * 
 * @param currentStatus - Current event status
 * @param newStatus - New event status
 * @returns True if the transition is valid, false otherwise
 */
export function isValidEventStatusTransition(
  currentStatus: EventStatus,
  newStatus: EventStatus
): boolean {
  const validNextStatuses = getNextValidEventStatus(currentStatus);
  return validNextStatuses.includes(newStatus);
}

/**
 * Calculates the capacity status of an event based on attendee count and maximum capacity
 * 
 * @param attendeeCount - Current number of attendees
 * @param maxAttendees - Maximum number of attendees allowed
 * @returns Object containing capacity status information
 */
export function calculateEventCapacityStatus(
  attendeeCount: number,
  maxAttendees: number
): { isFull: boolean; percentFull: number; spotsLeft: number } {
  const isFull = attendeeCount >= maxAttendees;
  const percentFull = maxAttendees > 0 ? Math.min((attendeeCount / maxAttendees) * 100, 100) : 0;
  const spotsLeft = maxAttendees > 0 ? Math.max(maxAttendees - attendeeCount, 0) : 0;
  
  return {
    isFull,
    percentFull,
    spotsLeft
  };
}

/**
 * Categorizes events into groups based on their date (today, tomorrow, this week, etc.)
 * 
 * @param events - Array of events to categorize
 * @returns Object with categorized events
 */
export function categorizeEventsByDate(events: IEvent[]): {
  today: IEvent[];
  tomorrow: IEvent[];
  thisWeek: IEvent[];
  later: IEvent[];
  past: IEvent[];
} {
  // Initialize result object
  const result = {
    today: [] as IEvent[],
    tomorrow: [] as IEvent[],
    thisWeek: [] as IEvent[],
    later: [] as IEvent[],
    past: [] as IEvent[]
  };

  // Get current date (reset time to midnight for date comparison)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calculate tomorrow and end of week dates
  const tomorrow = addDays(today, 1);
  const endOfWeek = addDays(today, 7 - today.getDay());
  
  // Categorize each event
  events.forEach(event => {
    // Create date object with just the date part (no time)
    const eventDate = new Date(
      event.startTime.getFullYear(),
      event.startTime.getMonth(),
      event.startTime.getDate()
    );
    
    if (isEventPast(event)) {
      result.past.push(event);
    } else if (eventDate.getTime() === today.getTime()) {
      result.today.push(event);
    } else if (eventDate.getTime() === tomorrow.getTime()) {
      result.tomorrow.push(event);
    } else if (
      isAfter(eventDate, today) &&
      isBefore(eventDate, endOfWeek) ||
      eventDate.getTime() === endOfWeek.getTime()
    ) {
      result.thisWeek.push(event);
    } else {
      result.later.push(event);
    }
  });
  
  return result;
}

/**
 * Generates a summary of an event with key information
 * 
 * @param event - The event to summarize
 * @returns Event summary string
 */
export function generateEventSummary(event: IEvent): string {
  // Format the date and time
  const timeRange = formatEventTimeRange(event.startTime, event.endTime);
  
  // Calculate duration
  const duration = calculateEventDuration(event.startTime, event.endTime);
  const durationStr = duration === 1 ? '1 hour' : `${duration} hours`;
  
  // Construct the summary
  let summary = `${event.name} - ${timeRange} at ${event.location}`;
  
  // Add status if not scheduled
  if (event.status !== EventStatus.SCHEDULED) {
    summary += ` (${event.status.toUpperCase()})`;
  }
  
  // Add additional details
  summary += `\nDuration: ${durationStr}`;
  
  if (event.categories && event.categories.length > 0) {
    summary += `\nCategories: ${event.categories.join(', ')}`;
  }
  
  return summary;
}

/**
 * Determines if an event is likely to be outdoors based on its categories and metadata
 * 
 * @param event - The event to check
 * @returns True if the event is likely outdoors, false otherwise
 */
export function isOutdoorEvent(event: IEvent): boolean {
  // Check if the event has outdoor-related categories
  const outdoorCategories = [
    InterestCategory.OUTDOOR_ADVENTURES,
    InterestCategory.SPORTS_FITNESS
  ];
  
  const hasOutdoorCategory = event.categories.some(category => 
    outdoorCategories.includes(category)
  );
  
  // Check if event metadata contains outdoor indicators
  const hasOutdoorMetadata = event.metadata && (
    event.metadata.isOutdoor === true ||
    event.metadata.venue?.isOutdoor === true ||
    event.metadata.locationDescription?.toLowerCase().includes('outdoor') ||
    event.metadata.locationDescription?.toLowerCase().includes('outside')
  );
  
  // Check if event name or description contains outdoor indicators
  const nameOrDescriptionIndicatesOutdoor = 
    event.name.toLowerCase().includes('outdoor') ||
    event.name.toLowerCase().includes('outside') ||
    event.description.toLowerCase().includes('outdoor') ||
    event.description.toLowerCase().includes('outside') ||
    event.description.toLowerCase().includes('park') ||
    event.description.toLowerCase().includes('garden') ||
    event.description.toLowerCase().includes('trail');
  
  return hasOutdoorCategory || hasOutdoorMetadata || nameOrDescriptionIndicatesOutdoor;
}

/**
 * Determines if the weather is suitable for an event, especially for outdoor events
 * 
 * @param event - The event to check
 * @param weatherData - Weather data for the event time and location
 * @returns Assessment of weather suitability with reason
 */
export function isWeatherSuitableForEvent(
  event: IEvent,
  weatherData: IWeatherData
): { suitable: boolean; reason: string } {
  // If not an outdoor event, weather is always suitable
  if (!isOutdoorEvent(event)) {
    return { suitable: true, reason: 'Indoor event' };
  }
  
  // Check for severe weather conditions
  const hasHighPrecipitation = weatherData.precipitation > 70;
  const isExtremeCold = weatherData.temperature < 32; // Below freezing
  const isExtremeHot = weatherData.temperature > 95; // Very hot
  
  // Analyze weather suitability
  if (hasHighPrecipitation) {
    return { 
      suitable: false, 
      reason: `High chance of precipitation (${weatherData.precipitation}%)` 
    };
  }
  
  if (isExtremeCold) {
    return { 
      suitable: false, 
      reason: `Very cold temperature (${weatherData.temperature}°F)` 
    };
  }
  
  if (isExtremeHot) {
    return { 
      suitable: false, 
      reason: `Very hot temperature (${weatherData.temperature}°F)` 
    };
  }
  
  // Check for moderate concerns
  if (weatherData.precipitation > 40) {
    return { 
      suitable: true, 
      reason: `Possible precipitation (${weatherData.precipitation}%), consider a backup plan` 
    };
  }
  
  // Weather is suitable
  return { 
    suitable: true, 
    reason: `Good weather conditions expected (${weatherData.condition}, ${weatherData.temperature}°F)` 
  };
}

/**
 * Suggests alternate times for an event based on weather forecast
 * 
 * @param event - The event to find alternates for
 * @param weatherForecast - Array of weather forecasts for different dates
 * @returns Array of suggested alternate times with weather data
 */
export function suggestAlternateEventTime(
  event: IEvent,
  weatherForecast: Array<{date: Date, weather: IWeatherData}>
): Array<{startTime: Date, endTime: Date, weather: IWeatherData}> {
  logger.debug('Suggesting alternate event times', { 
    eventId: event.id,
    forecastDays: weatherForecast.length 
  });
  
  // If not an outdoor event, no need for alternates
  if (!isOutdoorEvent(event)) {
    return [];
  }
  
  // Calculate the event duration in hours
  const eventDuration = calculateEventDuration(event.startTime, event.endTime);
  
  // Initialize array to hold suggestions
  const suggestions: Array<{startTime: Date, endTime: Date, weather: IWeatherData}> = [];
  
  // Analyze the weather forecast to find better time slots
  weatherForecast.forEach(forecast => {
    // Skip if current date is today or past
    const today = new Date();
    if (isBefore(forecast.date, today)) {
      return;
    }
    
    // Check if weather is better than the current event time
    const currentWeatherSuitability = isWeatherSuitableForEvent(event, event.weatherData);
    const forecastWeatherSuitability = isWeatherSuitableForEvent(
      { ...event, startTime: forecast.date, endTime: new Date(forecast.date.getTime() + eventDuration * 60 * 60 * 1000) },
      forecast.weather
    );
    
    // If forecast weather is suitable and current is not, or both are suitable but forecast is better
    if (
      (forecastWeatherSuitability.suitable && !currentWeatherSuitability.suitable) ||
      (forecastWeatherSuitability.suitable && currentWeatherSuitability.suitable && 
        forecast.weather.precipitation < event.weatherData.precipitation)
    ) {
      // Create a new start time at the same time of day
      const newStartTime = new Date(forecast.date);
      newStartTime.setHours(
        event.startTime.getHours(),
        event.startTime.getMinutes(),
        0,
        0
      );
      
      // Calculate new end time based on original duration
      const newEndTime = new Date(newStartTime.getTime() + eventDuration * 60 * 60 * 1000);
      
      // Add to suggestions
      suggestions.push({
        startTime: newStartTime,
        endTime: newEndTime,
        weather: forecast.weather
      });
    }
  });
  
  // Limit to top 3 suggestions, sorted by lowest precipitation probability
  return suggestions
    .sort((a, b) => a.weather.precipitation - b.weather.precipitation)
    .slice(0, 3);
}

/**
 * Validates that event dates are logical and within acceptable ranges
 * 
 * @param startTime - Event start time
 * @param endTime - Event end time
 * @returns Validation result object
 */
export function validateEventDates(
  startTime: Date,
  endTime: Date
): { valid: boolean; message: string } {
  // Check if both dates are valid
  if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
    return { valid: false, message: 'Start time is invalid' };
  }
  
  if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
    return { valid: false, message: 'End time is invalid' };
  }
  
  // Check that end time is after start time
  if (!isAfter(endTime, startTime)) {
    return { valid: false, message: 'End time must be after start time' };
  }
  
  // Check that event duration is reasonable (not too short)
  const durationHours = calculateEventDuration(startTime, endTime);
  if (durationHours < 0.25) { // 15 minutes minimum
    return { valid: false, message: 'Event must be at least 15 minutes long' };
  }
  
  // Check that event duration is not too long (7 days maximum)
  if (durationHours > 168) { // 7 days * 24 hours
    return { valid: false, message: 'Event cannot be longer than 7 days' };
  }
  
  // Check that the event is not scheduled too far in the future (1 year maximum)
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (isAfter(startTime, oneYearFromNow)) {
    return { valid: false, message: 'Event cannot be scheduled more than 1 year in advance' };
  }
  
  // Validation passed
  return { valid: true, message: 'Event dates are valid' };
}

/**
 * Calculates the attendance rate for an event based on RSVPs and check-ins
 * 
 * @param rsvpCount - Number of positive RSVPs
 * @param checkinCount - Number of check-ins
 * @returns Attendance rate as a percentage
 */
export function calculateAttendanceRate(rsvpCount: number, checkinCount: number): number {
  if (rsvpCount === 0) {
    return 0;
  }
  
  const rate = (checkinCount / rsvpCount) * 100;
  return Math.round(rate * 10) / 10; // Round to 1 decimal place
}