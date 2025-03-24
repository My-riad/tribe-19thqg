import { get, post, put, delete as httpDelete } from './httpClient';
import { API_PATHS } from '../constants/apiPaths';
import { ApiResponse } from '../types/api.types';
import { EventTypes } from '../types/event.types';

/**
 * Submits user availability for event planning
 * @param userId User ID
 * @param availabilityData User's availability data including available time slots
 * @returns Promise resolving to success status
 */
const submitAvailability = async (
  userId: string,
  availabilityData: object
): Promise<ApiResponse<{ success: boolean }>> => {
  return post(`${API_PATHS.PLANNING.AVAILABILITY}`, {
    userId,
    ...availabilityData
  });
};

/**
 * Retrieves availability for a specific user
 * @param userId User ID
 * @param dateRange Date range to get availability for
 * @returns Promise resolving to user's available time slots
 */
const getUserAvailability = async (
  userId: string,
  dateRange: object
): Promise<ApiResponse<{ availableSlots: Array<{ start: Date, end: Date }> }>> => {
  return get(`${API_PATHS.PLANNING.AVAILABILITY}`, {
    userId,
    ...dateRange
  });
};

/**
 * Retrieves aggregated availability for all members of a tribe
 * @param tribeId Tribe ID
 * @param dateRange Date range to get availability for
 * @returns Promise resolving to tribe members' availability
 */
const getTribeAvailability = async (
  tribeId: string,
  dateRange: object
): Promise<ApiResponse<{ memberAvailability: Record<string, Array<{ start: Date, end: Date }>> }>> => {
  return get(`${API_PATHS.PLANNING.AVAILABILITY}/tribe/${tribeId}`, dateRange);
};

/**
 * Finds AI-optimized time slots for a tribe event based on member availability
 * @param tribeId Tribe ID
 * @param eventParams Event parameters including duration, preferred days, etc.
 * @returns Promise resolving to optimal time slots
 */
const findOptimalTimeSlots = async (
  tribeId: string,
  eventParams: object
): Promise<ApiResponse<EventTypes.OptimalTimeSlot[]>> => {
  return get(`${API_PATHS.PLANNING.SCHEDULING}/optimal`, {
    tribeId,
    ...eventParams
  });
};

/**
 * Schedules an event at the specified time and notifies tribe members
 * @param schedulingData Event scheduling data including time, venue, and attendees
 * @returns Promise resolving to scheduled event details
 */
const scheduleEvent = async (
  schedulingData: object
): Promise<ApiResponse<{ eventId: string, scheduledTime: Date }>> => {
  return post(`${API_PATHS.PLANNING.SCHEDULING}`, schedulingData);
};

/**
 * Reschedules an existing event and notifies affected members
 * @param eventId Event ID
 * @param reschedulingData New scheduling data
 * @returns Promise resolving to rescheduling status
 */
const rescheduleEvent = async (
  eventId: string,
  reschedulingData: object
): Promise<ApiResponse<{ success: boolean, newTime: Date }>> => {
  return put(`${API_PATHS.PLANNING.SCHEDULING}/${eventId}`, reschedulingData);
};

/**
 * Searches for venues based on location, type, and other criteria
 * @param venueSearchParams Search parameters for venues
 * @returns Promise resolving to venue search results
 */
const searchVenues = async (
  venueSearchParams: object
): Promise<ApiResponse<EventTypes.VenueDetails[]>> => {
  return get(`${API_PATHS.PLANNING.VENUES}/search`, venueSearchParams);
};

/**
 * Retrieves detailed information about a specific venue
 * @param venueId Venue ID
 * @returns Promise resolving to venue details
 */
const getVenueDetails = async (
  venueId: string
): Promise<ApiResponse<EventTypes.VenueDetails>> => {
  return get(`${API_PATHS.PLANNING.VENUES}/${venueId}`);
};

/**
 * Gets AI-recommended venues based on tribe preferences and event type
 * @param tribeId Tribe ID
 * @param eventType Type of event being planned
 * @returns Promise resolving to recommended venues
 */
const getRecommendedVenues = async (
  tribeId: string,
  eventType: object
): Promise<ApiResponse<EventTypes.VenueDetails[]>> => {
  return get(`${API_PATHS.PLANNING.VENUES}/recommended`, {
    tribeId,
    ...eventType
  });
};

/**
 * Uses AI to optimize an event plan considering time, venue, and attendee preferences
 * @param eventPlanData Event plan data including multiple options
 * @returns Promise resolving to optimized event plan
 */
const optimizeEventPlan = async (
  eventPlanData: object
): Promise<ApiResponse<{ optimizedPlan: object }>> => {
  return post(`${API_PATHS.PLANNING.OPTIMIZE}`, eventPlanData);
};

/**
 * Triggers reminders for an upcoming event to all attendees
 * @param eventId Event ID
 * @param reminderOptions Options for reminders (timing, channels, message)
 * @returns Promise resolving to reminder status
 */
const sendEventReminders = async (
  eventId: string,
  reminderOptions: object
): Promise<ApiResponse<{ success: boolean, sentCount: number }>> => {
  return post(`${API_PATHS.PLANNING.BASE}/reminders`, {
    eventId,
    ...reminderOptions
  });
};

/**
 * Identifies scheduling conflicts for a proposed event time
 * @param tribeId Tribe ID
 * @param proposedTime Proposed event time and duration
 * @returns Promise resolving to scheduling conflicts
 */
const getSchedulingConflicts = async (
  tribeId: string,
  proposedTime: object
): Promise<ApiResponse<{ conflicts: Array<{ userId: string, reason: string }> }>> => {
  return get(`${API_PATHS.PLANNING.SCHEDULING}/conflicts`, {
    tribeId,
    ...proposedTime
  });
};

export const planningApi = {
  submitAvailability,
  getUserAvailability,
  getTribeAvailability,
  findOptimalTimeSlots,
  scheduleEvent,
  rescheduleEvent,
  searchVenues,
  getVenueDetails,
  getRecommendedVenues,
  optimizeEventPlan,
  sendEventReminders,
  getSchedulingConflicts
};