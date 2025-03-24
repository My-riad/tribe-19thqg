import { httpClient } from './httpClient';
import { API_PATHS } from '../constants/apiPaths';
import { EventTypes } from '../types/event.types';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api.types';

/**
 * Retrieves events based on optional filters
 * @param filters Optional filters to apply to the event search
 * @returns Promise resolving to the list of events
 */
const getEvents = async (
  filters?: EventTypes.EventFilters
): Promise<ApiResponse<EventTypes.Event[]>> => {
  return httpClient.get<EventTypes.Event[]>(API_PATHS.EVENT.BASE, filters || {});
};

/**
 * Retrieves a specific event by ID
 * @param eventId The ID of the event to retrieve
 * @returns Promise resolving to the event details
 */
const getEvent = async (
  eventId: string
): Promise<ApiResponse<EventTypes.Event>> => {
  const url = API_PATHS.EVENT.GET_BY_ID.replace(':id', eventId);
  return httpClient.get<EventTypes.Event>(url);
};

/**
 * Creates a new event
 * @param eventData The event data to create
 * @returns Promise resolving to the created event
 */
const createEvent = async (
  eventData: EventTypes.CreateEventRequest
): Promise<ApiResponse<EventTypes.Event>> => {
  return httpClient.post<EventTypes.Event>(API_PATHS.EVENT.CREATE, eventData);
};

/**
 * Updates an existing event
 * @param eventId The ID of the event to update
 * @param eventData The updated event data
 * @returns Promise resolving to the updated event
 */
const updateEvent = async (
  eventId: string,
  eventData: EventTypes.UpdateEventRequest
): Promise<ApiResponse<EventTypes.Event>> => {
  const url = API_PATHS.EVENT.UPDATE.replace(':id', eventId);
  return httpClient.put<EventTypes.Event>(url, eventData);
};

/**
 * Deletes an event
 * @param eventId The ID of the event to delete
 * @returns Promise resolving to success status
 */
const deleteEvent = async (
  eventId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const url = API_PATHS.EVENT.GET_BY_ID.replace(':id', eventId);
  return httpClient.delete<{ success: boolean }>(url);
};

/**
 * Discovers events based on location and preferences
 * @param discoveryParams Parameters for event discovery
 * @returns Promise resolving to discovered events
 */
const discoverEvents = async (
  discoveryParams: {
    location?: string;
    coordinates?: { latitude: number; longitude: number };
    radius?: number;
    interests?: string[];
    startDate?: string;
    endDate?: string;
    maxCost?: number;
  }
): Promise<ApiResponse<EventTypes.Event[]>> => {
  return httpClient.get<EventTypes.Event[]>(API_PATHS.EVENT.DISCOVER, discoveryParams);
};

/**
 * Gets AI-powered event recommendations for a user or tribe
 * @param recommendationParams Parameters for event recommendations
 * @returns Promise resolving to event recommendations
 */
const getEventRecommendations = async (
  recommendationParams: {
    userId?: string;
    tribeId?: string;
    location?: string;
    coordinates?: { latitude: number; longitude: number };
    radius?: number;
    limit?: number;
  }
): Promise<ApiResponse<EventTypes.EventSuggestion[]>> => {
  return httpClient.get<EventTypes.EventSuggestion[]>(API_PATHS.EVENT.RECOMMENDATIONS, recommendationParams);
};

/**
 * Gets activity suggestions based on weather forecast
 * @param weatherParams Parameters for weather-based activity suggestions
 * @returns Promise resolving to weather-appropriate activities
 */
const getWeatherBasedActivities = async (
  weatherParams: {
    location?: string;
    coordinates?: { latitude: number; longitude: number };
    date?: string;
    tribeId?: string;
  }
): Promise<ApiResponse<EventTypes.Event[]>> => {
  return httpClient.get<EventTypes.Event[]>(API_PATHS.EVENT.WEATHER, weatherParams);
};

/**
 * Retrieves the attendees of a specific event
 * @param eventId The ID of the event
 * @param pagination Optional pagination parameters
 * @returns Promise resolving to the paginated list of event attendees
 */
const getEventAttendees = async (
  eventId: string,
  pagination?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<EventTypes.EventAttendee>>> => {
  const url = API_PATHS.EVENT.ATTENDEES.replace(':id', eventId);
  return httpClient.get<PaginatedResponse<EventTypes.EventAttendee>>(url, pagination);
};

/**
 * Updates the RSVP status for the current user for an event
 * @param eventId The ID of the event
 * @param status The new RSVP status
 * @returns Promise resolving to success status
 */
const updateRSVP = async (
  eventId: string,
  status: EventTypes.RSVPStatus
): Promise<ApiResponse<{ success: boolean }>> => {
  const url = API_PATHS.EVENT.RSVP.replace(':id', eventId);
  return httpClient.post<{ success: boolean }>(url, { status });
};

/**
 * Checks in the current user to an event
 * @param eventId The ID of the event
 * @param checkInData Additional check-in data
 * @returns Promise resolving to success status
 */
const checkInToEvent = async (
  eventId: string,
  checkInData?: {
    coordinates?: { latitude: number; longitude: number };
    notes?: string;
  }
): Promise<ApiResponse<{ success: boolean }>> => {
  const url = API_PATHS.EVENT.CHECK_IN.replace(':id', eventId);
  return httpClient.post<{ success: boolean }>(url, checkInData || {});
};

/**
 * Gets AI-suggested optimal time slots for an event based on tribe member availability
 * @param tribeId The ID of the tribe
 * @param timeSlotParams Parameters for time slot suggestions
 * @returns Promise resolving to optimal time slots
 */
const getOptimalTimeSlots = async (
  tribeId: string,
  timeSlotParams: {
    startDate?: string;
    endDate?: string;
    duration?: number;
    eventType?: EventTypes.EventType;
  }
): Promise<ApiResponse<EventTypes.OptimalTimeSlot[]>> => {
  return httpClient.get<EventTypes.OptimalTimeSlot[]>(
    `${API_PATHS.EVENT.BASE}/optimal-times`,
    {
      tribeId,
      ...timeSlotParams
    }
  );
};

/**
 * Submits feedback for an event
 * @param eventId The ID of the event
 * @param feedbackData The feedback data
 * @returns Promise resolving to the submitted feedback
 */
const submitEventFeedback = async (
  eventId: string,
  feedbackData: {
    rating: number;
    comments?: string;
  }
): Promise<ApiResponse<EventTypes.EventFeedback>> => {
  return httpClient.post<EventTypes.EventFeedback>(
    `${API_PATHS.EVENT.BASE}/${eventId}/feedback`,
    feedbackData
  );
};

/**
 * Retrieves feedback for an event
 * @param eventId The ID of the event
 * @returns Promise resolving to the event feedback
 */
const getEventFeedback = async (
  eventId: string
): Promise<ApiResponse<EventTypes.EventFeedback[]>> => {
  return httpClient.get<EventTypes.EventFeedback[]>(
    `${API_PATHS.EVENT.BASE}/${eventId}/feedback`
  );
};

/**
 * Retrieves events for a specific tribe
 * @param tribeId The ID of the tribe
 * @param filters Optional filters to apply
 * @returns Promise resolving to the list of tribe events
 */
const getTribeEvents = async (
  tribeId: string,
  filters?: {
    status?: EventTypes.EventStatus;
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<EventTypes.Event[]>> => {
  return httpClient.get<EventTypes.Event[]>(API_PATHS.EVENT.BASE, {
    tribeId,
    ...filters
  });
};

/**
 * Retrieves events for the current user
 * @param filters Optional filters to apply
 * @returns Promise resolving to the list of user events
 */
const getUserEvents = async (
  filters?: {
    status?: EventTypes.EventStatus;
    startDate?: string;
    endDate?: string;
    rsvpStatus?: EventTypes.RSVPStatus;
  }
): Promise<ApiResponse<EventTypes.Event[]>> => {
  return httpClient.get<EventTypes.Event[]>(`${API_PATHS.EVENT.BASE}/user`, filters);
};

export const eventApi = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  discoverEvents,
  getEventRecommendations,
  getWeatherBasedActivities,
  getEventAttendees,
  updateRSVP,
  checkInToEvent,
  getOptimalTimeSlots,
  submitEventFeedback,
  getEventFeedback,
  getTribeEvents,
  getUserEvents,
};