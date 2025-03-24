import { analyticsService } from '../services/analyticsService';
import { CONFIG } from '../constants/config';

// Prefix for debug log messages
const DEBUG_PREFIX = '[Analytics]';

/**
 * Logs debug information in development environment only
 * @param message The debug message
 * @param data Optional data to log
 */
const logDebug = (message: string, data?: any): void => {
  if (CONFIG.ENVIRONMENT.ENABLE_CONSOLE_LOGS) {
    if (data) {
      console.log(`${DEBUG_PREFIX} ${message}`, data);
    } else {
      console.log(`${DEBUG_PREFIX} ${message}`);
    }
  }
};

/**
 * Utility object for tracking user behavior, events, and metrics throughout the app
 */
export const analytics = {
  /**
   * Initializes the analytics system for the application
   * @returns Promise that resolves when analytics is initialized
   */
  initialize: async (): Promise<void> => {
    await analyticsService.initialize();
    logDebug('Analytics initialized');
  },

  /**
   * Tracks when a user views a specific screen in the app
   * @param screenName The name of the screen viewed
   * @param properties Additional properties to track with the screen view
   */
  trackScreen: (screenName: string, properties: object = {}): void => {
    analyticsService.trackScreenView(screenName, properties);
    logDebug(`Screen view: ${screenName}`, properties);
  },

  /**
   * Tracks user actions like button clicks or interactions
   * @param actionName The name of the action performed
   * @param properties Additional properties to track with the action
   */
  trackAction: (actionName: string, properties: object = {}): void => {
    analyticsService.trackUserAction(actionName, properties);
    logDebug(`User action: ${actionName}`, properties);
  },

  /**
   * Tracks application errors for monitoring and debugging
   * @param error The error object
   * @param context The context in which the error occurred
   * @param additionalData Any additional data about the error
   */
  trackError: (error: Error, context: string, additionalData: object = {}): void => {
    analyticsService.trackError(error, context, additionalData);
    logDebug(`Error tracked in ${context}: ${error.message}`, { error, additionalData });
  },

  /**
   * Associates analytics events with a specific user identity
   * @param userId The unique identifier for the user
   * @param userProperties Additional properties about the user
   */
  identifyUser: (userId: string, userProperties: object = {}): void => {
    analyticsService.identifyUser(userId, userProperties);
    logDebug(`User identified: ${userId}`, userProperties);
  },

  /**
   * Resets the current user identity when logging out
   */
  resetUserIdentity: (): void => {
    analyticsService.resetUser();
    logDebug('User identity reset');
  },

  /**
   * Tracks tribe-related activities and interactions
   * @param activityType The type of tribe activity
   * @param tribeId The ID of the tribe
   * @param properties Additional properties about the activity
   */
  trackTribe: (activityType: string, tribeId: string, properties: object = {}): void => {
    analyticsService.trackTribeActivity(activityType, tribeId, properties);
    logDebug(`Tribe activity: ${activityType}, Tribe: ${tribeId}`, properties);
  },

  /**
   * Tracks event-related activities and interactions
   * @param activityType The type of event activity
   * @param eventId The ID of the event
   * @param properties Additional properties about the activity
   */
  trackEvent: (activityType: string, eventId: string, properties: object = {}): void => {
    analyticsService.trackEventActivity(activityType, eventId, properties);
    logDebug(`Event activity: ${activityType}, Event: ${eventId}`, properties);
  },

  /**
   * Tracks user interactions with AI features
   * @param interactionType The type of AI interaction
   * @param properties Additional properties about the interaction
   */
  trackAI: (interactionType: string, properties: object = {}): void => {
    analyticsService.trackAIInteraction(interactionType, properties);
    logDebug(`AI interaction: ${interactionType}`, properties);
  },

  /**
   * Tracks conversion from digital interaction to physical meetup
   * @param conversionType The type of conversion
   * @param sourceId The ID of the source (event, tribe, etc.)
   * @param properties Additional properties about the conversion
   */
  trackConversion: (conversionType: string, sourceId: string, properties: object = {}): void => {
    analyticsService.trackConversion(conversionType, sourceId, properties);
    logDebug(`Conversion: ${conversionType}, Source: ${sourceId}`, properties);
  },

  /**
   * Checks if analytics tracking is currently enabled
   * @returns True if analytics is enabled, false otherwise
   */
  isEnabled: (): boolean => {
    return analyticsService.isAnalyticsEnabled();
  }
};