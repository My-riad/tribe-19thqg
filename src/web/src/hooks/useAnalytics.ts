import { useState, useEffect, useCallback, useRef } from 'react';
import { analyticsService } from '../services/analyticsService';
import { useOffline } from './useOffline';

/**
 * Custom hook that provides analytics tracking functionality for the Tribe application.
 * Handles analytics initialization, various event tracking, and offline support.
 * 
 * @returns Object containing analytics state and methods for tracking user behavior
 */
export const useAnalytics = () => {
  // State for tracking initialization status and errors
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to track if initialization has been attempted to prevent multiple attempts
  const initAttempted = useRef<boolean>(false);
  
  // Get offline state and queue action function from useOffline hook
  const { isOffline, queueAction } = useOffline();
  
  /**
   * Initializes the analytics service
   * @returns Promise that resolves when initialization is complete
   */
  const initializeAnalytics = useCallback(async (): Promise<void> => {
    // Prevent multiple initialization attempts
    if (initAttempted.current) return;
    
    initAttempted.current = true;
    
    try {
      await analyticsService.initialize();
      setIsInitialized(true);
      setIsEnabled(analyticsService.isAnalyticsEnabled());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize analytics';
      setError(errorMessage);
      console.error('Failed to initialize analytics:', err);
    }
  }, []);
  
  /**
   * Tracks when a user views a specific screen
   * @param screenName Name of the screen being viewed
   * @param properties Additional properties to track with the event
   */
  const trackScreen = useCallback(async (
    screenName: string, 
    properties?: Record<string, any>
  ): Promise<void> => {
    if (!isInitialized || !isEnabled) return;
    
    if (isOffline) {
      // Queue the action for later when back online
      await queueAction({
        type: 'TRACK_SCREEN',
        payload: { screenName, properties }
      });
      return;
    }
    
    try {
      await analyticsService.trackScreenView(screenName, properties);
    } catch (err) {
      console.error('Error tracking screen view:', err);
    }
  }, [isInitialized, isEnabled, isOffline, queueAction]);
  
  /**
   * Tracks user actions like button clicks or interactions
   * @param actionName Name of the action being performed
   * @param properties Additional properties to track with the event
   */
  const trackAction = useCallback(async (
    actionName: string, 
    properties?: Record<string, any>
  ): Promise<void> => {
    if (!isInitialized || !isEnabled) return;
    
    if (isOffline) {
      await queueAction({
        type: 'TRACK_ACTION',
        payload: { actionName, properties }
      });
      return;
    }
    
    try {
      await analyticsService.trackUserAction(actionName, properties);
    } catch (err) {
      console.error('Error tracking user action:', err);
    }
  }, [isInitialized, isEnabled, isOffline, queueAction]);
  
  /**
   * Tracks tribe-related activities
   * @param activityType Type of tribe activity (e.g., 'join', 'leave', 'message')
   * @param tribeId ID of the tribe
   * @param properties Additional properties to track with the event
   */
  const trackTribeActivity = useCallback(async (
    activityType: string,
    tribeId: string,
    properties?: Record<string, any>
  ): Promise<void> => {
    if (!isInitialized || !isEnabled) return;
    
    if (isOffline) {
      await queueAction({
        type: 'TRACK_TRIBE_ACTIVITY',
        payload: { activityType, tribeId, properties }
      });
      return;
    }
    
    try {
      await analyticsService.trackTribeActivity(activityType, tribeId, properties);
    } catch (err) {
      console.error('Error tracking tribe activity:', err);
    }
  }, [isInitialized, isEnabled, isOffline, queueAction]);
  
  /**
   * Tracks event-related activities
   * @param activityType Type of event activity (e.g., 'create', 'rsvp', 'attend')
   * @param eventId ID of the event
   * @param properties Additional properties to track with the event
   */
  const trackEventActivity = useCallback(async (
    activityType: string,
    eventId: string,
    properties?: Record<string, any>
  ): Promise<void> => {
    if (!isInitialized || !isEnabled) return;
    
    if (isOffline) {
      await queueAction({
        type: 'TRACK_EVENT_ACTIVITY',
        payload: { activityType, eventId, properties }
      });
      return;
    }
    
    try {
      await analyticsService.trackEventActivity(activityType, eventId, properties);
    } catch (err) {
      console.error('Error tracking event activity:', err);
    }
  }, [isInitialized, isEnabled, isOffline, queueAction]);
  
  /**
   * Tracks interactions with AI features
   * @param interactionType Type of AI interaction (e.g., 'prompt_response', 'suggestion_accept')
   * @param properties Additional properties to track with the event
   */
  const trackAIInteraction = useCallback(async (
    interactionType: string,
    properties?: Record<string, any>
  ): Promise<void> => {
    if (!isInitialized || !isEnabled) return;
    
    if (isOffline) {
      await queueAction({
        type: 'TRACK_AI_INTERACTION',
        payload: { interactionType, properties }
      });
      return;
    }
    
    try {
      await analyticsService.trackAIInteraction(interactionType, properties);
    } catch (err) {
      console.error('Error tracking AI interaction:', err);
    }
  }, [isInitialized, isEnabled, isOffline, queueAction]);
  
  /**
   * Tracks conversions from digital to physical interactions
   * @param conversionType Type of conversion (e.g., 'digital_to_physical', 'rsvp_to_attendance')
   * @param sourceId ID of the source (event, tribe, etc.)
   * @param properties Additional properties to track with the event
   */
  const trackConversion = useCallback(async (
    conversionType: string,
    sourceId: string,
    properties?: Record<string, any>
  ): Promise<void> => {
    if (!isInitialized || !isEnabled) return;
    
    if (isOffline) {
      await queueAction({
        type: 'TRACK_CONVERSION',
        payload: { conversionType, sourceId, properties }
      });
      return;
    }
    
    try {
      await analyticsService.trackConversion(conversionType, sourceId, properties);
    } catch (err) {
      console.error('Error tracking conversion:', err);
    }
  }, [isInitialized, isEnabled, isOffline, queueAction]);
  
  /**
   * Tracks application errors
   * @param error The error object
   * @param context The context in which the error occurred
   * @param additionalData Any additional data about the error
   */
  const trackError = useCallback(async (
    error: Error,
    context: string,
    additionalData?: Record<string, any>
  ): Promise<void> => {
    if (!isInitialized || !isEnabled) return;
    
    if (isOffline) {
      await queueAction({
        type: 'TRACK_ERROR',
        payload: { 
          error: {
            message: error.message,
            stack: error.stack
          },
          context,
          additionalData
        }
      });
      return;
    }
    
    try {
      await analyticsService.trackError(error, context, additionalData);
    } catch (err) {
      console.error('Error tracking error:', err);
    }
  }, [isInitialized, isEnabled, isOffline, queueAction]);
  
  /**
   * Identifies a user in the analytics system
   * @param id The user ID
   * @param traits Additional user traits or properties
   */
  const identifyUser = useCallback(async (
    id: string,
    traits?: Record<string, any>
  ): Promise<void> => {
    if (!isInitialized || !isEnabled) return;
    
    if (isOffline) {
      await queueAction({
        type: 'IDENTIFY_USER',
        payload: { id, traits }
      });
      return;
    }
    
    try {
      analyticsService.identifyUser(id, traits);
    } catch (err) {
      console.error('Error identifying user:', err);
    }
  }, [isInitialized, isEnabled, isOffline, queueAction]);
  
  /**
   * Resets the current user in the analytics system
   */
  const resetUser = useCallback(async (): Promise<void> => {
    if (!isInitialized || !isEnabled) return;
    
    if (isOffline) {
      await queueAction({
        type: 'RESET_USER',
        payload: {}
      });
      return;
    }
    
    try {
      analyticsService.resetUser();
    } catch (err) {
      console.error('Error resetting user:', err);
    }
  }, [isInitialized, isEnabled, isOffline, queueAction]);
  
  // Initialize analytics on component mount
  useEffect(() => {
    initializeAnalytics();
  }, [initializeAnalytics]);
  
  return {
    isInitialized,
    isEnabled,
    error,
    trackScreen,
    trackAction,
    trackTribeActivity,
    trackEventActivity,
    trackAIInteraction,
    trackConversion,
    trackError,
    identifyUser,
    resetUser,
    initializeAnalytics
  };
};