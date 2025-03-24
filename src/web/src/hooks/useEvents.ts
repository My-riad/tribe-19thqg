import { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchEvents,
  fetchUserEvents,
  fetchEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpToEvent,
  checkInToEvent,
  getEventAttendees,
  discoverEvents,
  getEventRecommendations,
  getWeatherBasedSuggestions,
  getOptimalTimeSlots,
} from '../store/thunks/eventThunks';
import { eventActions } from '../store/slices/eventSlice';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { useOffline } from './useOffline';
import { EventTypes } from '../types/event.types';

/**
 * Custom hook that provides event management functionality for the application
 *
 * This hook abstracts the Redux event state and actions, offering a simplified
 * interface for components to handle event retrieval, creation, updating, deletion,
 * RSVPs, check-ins, and AI-powered event recommendations.
 *
 * @returns Event state and methods for event operations
 */
export const useEvents = () => {
  // Get the Redux dispatch function using useAppDispatch
  const dispatch = useAppDispatch();

  // Select events state from Redux store using useAppSelector
  const {
    events,
    userEvents,
    eventRecommendations: suggestedEvents,
    currentEvent,
    optimalTimeSlots,
    loading,
    error,
  } = useAppSelector((state) => state.events);

  // Get authentication state from useAuth hook
  const { user, isAuthenticated } = useAuth();

  // Get notification function from useNotifications hook
  const { showNotification } = useNotifications();

  // Get offline state and functions from useOffline hook
  const { isOffline } = useOffline();

  /**
   * Create a memoized function to fetch events with optional filters
   * @param filters Optional filters to apply when fetching events
   */
  const fetchEvents = useCallback(
    async (filters?: EventTypes.EventFilters) => {
      try {
        await dispatch(fetchEvents(filters));
      } catch (error: any) {
        console.error('Error fetching events:', error);
        showNotification({
          message: error.message || 'Failed to fetch events',
          type: 'error',
        });
      }
    },
    [dispatch, showNotification]
  );

  /**
   * Create a memoized function to fetch user's events
   * @param filters Optional filters to apply when fetching user's events
   */
  const fetchUserEvents = useCallback(
    async (filters?: EventTypes.EventFilters) => {
      try {
        await dispatch(fetchUserEvents(filters));
      } catch (error: any) {
        console.error('Error fetching user events:', error);
        showNotification({
          message: error.message || 'Failed to fetch user events',
          type: 'error',
        });
      }
    },
    [dispatch, showNotification]
  );

  /**
   * Create a memoized function to fetch a specific event by ID
   * @param eventId The ID of the event to fetch
   */
  const fetchEvent = useCallback(
    async (eventId: string) => {
      try {
        await dispatch(fetchEventById(eventId));
      } catch (error: any) {
        console.error('Error fetching event:', error);
        showNotification({
          message: error.message || 'Failed to fetch event',
          type: 'error',
        });
      }
    },
    [dispatch, showNotification]
  );

  /**
   * Create a memoized function to create a new event
   * @param eventData The data for the new event
   */
  const createEvent = useCallback(
    async (eventData: EventTypes.CreateEventRequest) => {
      try {
        await dispatch(createEvent(eventData));
        showNotification({
          message: 'Event created successfully!',
          type: 'success',
        });
      } catch (error: any) {
        console.error('Error creating event:', error);
        showNotification({
          message: error.message || 'Failed to create event',
          type: 'error',
        });
      }
    },
    [dispatch, showNotification]
  );

  /**
   * Create a memoized function to update an existing event
   * @param eventId The ID of the event to update
   * @param eventData The updated data for the event
   */
  const updateEvent = useCallback(
    async (eventId: string, eventData: EventTypes.UpdateEventRequest) => {
      try {
        await dispatch(updateEvent({ eventId, eventData }));
        showNotification({
          message: 'Event updated successfully!',
          type: 'success',
        });
      } catch (error: any) {
        console.error('Error updating event:', error);
        showNotification({
          message: error.message || 'Failed to update event',
          type: 'error',
        });
      }
    },
    [dispatch, showNotification]
  );

  /**
   * Create a memoized function to delete an event
   * @param eventId The ID of the event to delete
   */
  const deleteEvent = useCallback(
    async (eventId: string) => {
      try {
        await dispatch(deleteEvent(eventId));
        showNotification({
          message: 'Event deleted successfully!',
          type: 'success',
        });
      } catch (error: any) {
        console.error('Error deleting event:', error);
        showNotification({
          message: error.message || 'Failed to delete event',
          type: 'error',
        });
      }
    },
    [dispatch, showNotification]
  );

  /**
   * Create a memoized function to submit an RSVP for an event
   * @param eventId The ID of the event to RSVP to
   * @param status The RSVP status
   */
  const rsvpToEvent = useCallback(
    async (eventId: string, status: EventTypes.RSVPStatus) => {
      try {
        await dispatch(rsvpToEvent({ eventId, status }));
        showNotification({
          message: 'RSVP updated successfully!',
          type: 'success',
        });
      } catch (error: any) {
        console.error('Error updating RSVP:', error);
        showNotification({
          message: error.message || 'Failed to update RSVP',
          type: 'error',
        });
      }
    },
    [dispatch, showNotification]
  );

  /**
   * Create a memoized function to check in to an event
   * @param eventId The ID of the event to check in to
   * @param checkInData Optional check-in data
   */
  const checkInToEvent = useCallback(
    async (eventId: string, checkInData?: object) => {
      try {
        await dispatch(checkInToEvent({ eventId, checkInData }));
        showNotification({
          message: 'Checked in successfully!',
          type: 'success',
        });
      } catch (error: any) {
        console.error('Error checking in:', error);
        showNotification({
          message: error.message || 'Failed to check in',
          type: 'error',
        });
      }
    },
    [dispatch, showNotification]
  );

  /**
   * Create a memoized function to fetch event attendees
   * @param eventId The ID of the event to fetch attendees for
   */
  const fetchEventAttendees = useCallback(
    async (eventId: string) => {
      try {
        await dispatch(getEventAttendees({ eventId }));
      } catch (error: any) {
        console.error('Error fetching event attendees:', error);
        showNotification({
          message: error.message || 'Failed to fetch event attendees',
          type: 'error',
        });
      }
    },
    [dispatch, showNotification]
  );

  /**
   * Create a memoized function to discover local events
   * @param discoveryParams Parameters for event discovery
   */
  const discoverEvents = useCallback(
    async (discoveryParams: object) => {
      try {
        await dispatch(discoverEvents(discoveryParams));
      } catch (error: any) {
        console.error('Error discovering events:', error);
        showNotification({
          message: error.message || 'Failed to discover events',
          type: 'error',
        });
      }
    },
    [dispatch, showNotification]
  );

  /**
   * Create a memoized function to get AI-powered event recommendations
   * @param recommendationParams Parameters for event recommendations
   */
  const getEventRecommendations = useCallback(
    async (recommendationParams: object) => {
      try {
        await dispatch(getEventRecommendations(recommendationParams));
      } catch (error: any) {
        console.error('Error getting event recommendations:', error);
        showNotification({
          message: error.message || 'Failed to get event recommendations',
          type: 'error',
        });
      }
    },
    [dispatch, showNotification]
  );

  /**
   * Create a memoized function to get weather-based activity suggestions
   * @param weatherParams Parameters for weather-based activity suggestions
   */
  const getWeatherBasedSuggestions = useCallback(
    async (weatherParams: object) => {
      try {
        await dispatch(getWeatherBasedSuggestions(weatherParams));
      } catch (error: any) {
        console.error('Error getting weather-based suggestions:', error);
        showNotification({
          message: error.message || 'Failed to get weather-based suggestions',
          type: 'error',
        });
      }
    },
    [dispatch, showNotification]
  );

  /**
   * Create a memoized function to get AI-suggested optimal time slots
   * @param tribeId The ID of the tribe to get optimal time slots for
   * @param timeSlotParams Parameters for time slot suggestions
   */
  const getOptimalTimeSlots = useCallback(
    async (tribeId: string, timeSlotParams: object) => {
      try {
        await dispatch(getOptimalTimeSlots({ tribeId, timeSlotParams }));
      } catch (error: any) {
        console.error('Error getting optimal time slots:', error);
        showNotification({
          message: error.message || 'Failed to get optimal time slots',
          type: 'error',
        });
      }
    },
    [dispatch, showNotification]
  );

  /**
   * Create a memoized function to clear any event errors
   */
  const clearError = useCallback(() => {
    dispatch(eventActions.setError(null));
  }, [dispatch]);

  /**
   * Create a memoized function to check if user is attending an event
   * @param event The event to check
   */
  const isUserAttending = useCallback(
    (event: EventTypes.Event): boolean => {
      if (!user || !event) return false;
      return event.attendees?.some(attendee => attendee.userId === user.id) || false;
    },
    [user]
  );

  /**
   * Create a memoized function to check if user is the creator of an event
   * @param event The event to check
   */
  const isUserCreator = useCallback(
    (event: EventTypes.Event): boolean => {
      if (!user || !event) return false;
      return event.createdBy === user.id;
    },
    [user]
  );

  // Use useEffect to load initial events data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isOffline) {
      fetchEvents();
      fetchUserEvents();
    }
  }, [isAuthenticated, fetchEvents, fetchUserEvents, isOffline]);

  // Return the events state and methods
  return {
    events,
    userEvents,
    suggestedEvents,
    currentEvent,
    optimalTimeSlots,
    loading,
    error,
    fetchEvents,
    fetchUserEvents,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    rsvpToEvent,
    checkInToEvent,
    fetchEventAttendees,
    discoverEvents,
    getEventRecommendations,
    getWeatherBasedSuggestions,
    getOptimalTimeSlots,
    clearError,
    isUserAttending,
    isUserCreator,
  };
};