import { createAsyncThunk } from '@reduxjs/toolkit';
import { eventApi } from '../../api/eventApi';
import { EventTypes } from '../../types/event.types';
import { RootState, AppDispatch } from '../store';
import { PaginationParams } from '../../types/api.types';

/**
 * Fetches events based on optional filters
 */
export const fetchEvents = createAsyncThunk<
  EventTypes.Event[],
  EventTypes.EventFilters | undefined,
  { state: RootState }
>('events/fetchEvents', async (filters, { rejectWithValue }) => {
  try {
    const response = await eventApi.getEvents(filters);
    return response.data;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch events');
  }
});

/**
 * Fetches events for the current user
 */
export const fetchUserEvents = createAsyncThunk<
  EventTypes.Event[],
  EventTypes.EventFilters | undefined,
  { state: RootState }
>('events/fetchUserEvents', async (filters, { rejectWithValue }) => {
  try {
    const response = await eventApi.getUserEvents(filters);
    return response.data;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch user events');
  }
});

/**
 * Fetches events for a specific tribe
 */
export const fetchTribeEvents = createAsyncThunk<
  EventTypes.Event[],
  { tribeId: string; filters?: EventTypes.EventFilters },
  { state: RootState }
>('events/fetchTribeEvents', async ({ tribeId, filters }, { rejectWithValue }) => {
  try {
    const response = await eventApi.getTribeEvents(tribeId, filters);
    return response.data;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch tribe events');
  }
});

/**
 * Fetches a specific event by ID
 */
export const fetchEventById = createAsyncThunk<
  EventTypes.Event,
  string,
  { state: RootState }
>('events/fetchEventById', async (eventId, { rejectWithValue }) => {
  try {
    const response = await eventApi.getEvent(eventId);
    return response.data;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch event');
  }
});

/**
 * Creates a new event
 */
export const createEvent = createAsyncThunk<
  EventTypes.Event,
  EventTypes.CreateEventRequest,
  { state: RootState }
>('events/createEvent', async (eventData, { rejectWithValue }) => {
  try {
    const response = await eventApi.createEvent(eventData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to create event');
  }
});

/**
 * Updates an existing event
 */
export const updateEvent = createAsyncThunk<
  EventTypes.Event,
  { eventId: string; eventData: EventTypes.UpdateEventRequest },
  { state: RootState }
>('events/updateEvent', async ({ eventId, eventData }, { rejectWithValue }) => {
  try {
    const response = await eventApi.updateEvent(eventId, eventData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to update event');
  }
});

/**
 * Deletes an event
 */
export const deleteEvent = createAsyncThunk<
  string,
  string,
  { state: RootState }
>('events/deleteEvent', async (eventId, { rejectWithValue }) => {
  try {
    await eventApi.deleteEvent(eventId);
    return eventId;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete event');
  }
});

/**
 * Updates the RSVP status for the current user for an event
 */
export const rsvpToEvent = createAsyncThunk<
  { eventId: string; status: EventTypes.RSVPStatus },
  { eventId: string; status: EventTypes.RSVPStatus },
  { state: RootState }
>('events/rsvpToEvent', async ({ eventId, status }, { rejectWithValue }) => {
  try {
    await eventApi.updateRSVP(eventId, status);
    return { eventId, status };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to update RSVP');
  }
});

/**
 * Checks in the current user to an event
 */
export const checkInToEvent = createAsyncThunk<
  string,
  { eventId: string; checkInData?: object },
  { state: RootState }
>('events/checkInToEvent', async ({ eventId, checkInData }, { rejectWithValue }) => {
  try {
    await eventApi.checkInToEvent(eventId, checkInData);
    return eventId;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to check in to event');
  }
});

/**
 * Retrieves the attendees of a specific event
 */
export const getEventAttendees = createAsyncThunk<
  EventTypes.EventAttendee[],
  { eventId: string; pagination?: PaginationParams },
  { state: RootState }
>('events/getEventAttendees', async ({ eventId, pagination }, { rejectWithValue }) => {
  try {
    const response = await eventApi.getEventAttendees(eventId, pagination);
    return response.data.items;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to get event attendees');
  }
});

/**
 * Discovers events based on location and preferences
 */
export const discoverEvents = createAsyncThunk<
  EventTypes.Event[],
  object,
  { state: RootState }
>('events/discoverEvents', async (discoveryParams, { rejectWithValue }) => {
  try {
    const response = await eventApi.discoverEvents(discoveryParams);
    return response.data;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to discover events');
  }
});

/**
 * Gets AI-powered event recommendations for a user or tribe
 */
export const getEventRecommendations = createAsyncThunk<
  EventTypes.EventSuggestion[],
  object,
  { state: RootState }
>('events/getEventRecommendations', async (recommendationParams, { rejectWithValue }) => {
  try {
    const response = await eventApi.getEventRecommendations(recommendationParams);
    return response.data;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to get event recommendations');
  }
});

/**
 * Gets activity suggestions based on weather forecast
 */
export const getWeatherBasedSuggestions = createAsyncThunk<
  EventTypes.EventSuggestion[],
  object,
  { state: RootState }
>('events/getWeatherBasedSuggestions', async (weatherParams, { rejectWithValue }) => {
  try {
    const response = await eventApi.getWeatherBasedActivities(weatherParams);
    
    // Transform response into EventSuggestion format
    const suggestions: EventTypes.EventSuggestion[] = response.data.map(event => ({
      event,
      matchScore: 0.9, // Default high score for weather-appropriate suggestions
      matchReasons: ['Weather appropriate', 'Within your preferred distance'],
      suggestedAt: new Date(),
      weatherSuitability: 0.95,
      budgetFriendliness: 0.8
    }));
    
    return suggestions;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to get weather-based suggestions');
  }
});

/**
 * Gets AI-suggested optimal time slots for an event based on tribe member availability
 */
export const getOptimalTimeSlots = createAsyncThunk<
  EventTypes.OptimalTimeSlot[],
  { tribeId: string; timeSlotParams: object },
  { state: RootState }
>('events/getOptimalTimeSlots', async ({ tribeId, timeSlotParams }, { rejectWithValue }) => {
  try {
    const response = await eventApi.getOptimalTimeSlots(tribeId, timeSlotParams);
    return response.data;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to get optimal time slots');
  }
});