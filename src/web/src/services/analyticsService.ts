import Mixpanel from 'mixpanel-react-native'; // ^2.3.1
import NetInfo from '@react-native-community/netinfo'; // ^9.3.10
import { CONFIG } from '../constants/config';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { storageService } from './storageService';
import { offlineService } from './offlineService';
import { 
  getPlatform, 
  getDeviceModel, 
  getOSVersion, 
  getUniqueDeviceId 
} from '../utils/deviceInfo';

/**
 * Interface defining the structure of an analytics event
 */
interface AnalyticsEvent {
  eventName: string;
  properties: Record<string, any>;
  timestamp: number;
}

// Global variables
let mixpanel: Mixpanel | null = null;
let isInitialized: boolean = false;
let analyticsEnabled: boolean = false;
let userId: string | null = null;
let offlineEvents: AnalyticsEvent[] = [];

/**
 * Initializes the analytics service with the appropriate configuration
 * @returns Promise that resolves when initialization is complete
 */
const initialize = async (): Promise<void> => {
  // Check if already initialized
  if (isInitialized) {
    return;
  }

  try {
    // Check if analytics is enabled in configuration
    analyticsEnabled = CONFIG.ENVIRONMENT.ANALYTICS_ENABLED;

    if (!analyticsEnabled) {
      console.log('Analytics is disabled by configuration');
      return;
    }

    // Determine the appropriate token based on environment
    let token = '';
    if (CONFIG.IS_PROD) {
      token = 'PRODUCTION_MIXPANEL_TOKEN'; // Replace with actual token in real implementation
    } else if (CONFIG.IS_STAGING) {
      token = 'STAGING_MIXPANEL_TOKEN'; // Replace with actual token in real implementation
    } else {
      token = 'DEVELOPMENT_MIXPANEL_TOKEN'; // Replace with actual token in real implementation
    }

    // Initialize Mixpanel with the token
    mixpanel = new Mixpanel(token);
    await mixpanel.init();

    // Set up network connectivity listeners for offline handling
    NetInfo.addEventListener(state => {
      handleConnectivityChange(!!state.isConnected);
    });

    // Load any cached offline events
    await loadOfflineEvents();

    isInitialized = true;
    console.log('Analytics initialized successfully');
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
    analyticsEnabled = false;
  }
};

/**
 * Identifies a user in the analytics system
 * @param id The user ID
 * @param traits Additional user traits or properties
 */
const identifyUser = (id: string, traits: Record<string, any> = {}): void => {
  if (!isInitialized || !analyticsEnabled || !mixpanel) {
    return;
  }

  try {
    userId = id;
    mixpanel.identify(id);
    
    // Set user properties
    mixpanel.getPeople().set(traits);
    
    console.log(`User identified: ${id}`);
  } catch (error) {
    console.error('Error identifying user:', error);
  }
};

/**
 * Resets the current user in the analytics system
 */
const resetUser = (): void => {
  if (!isInitialized || !analyticsEnabled || !mixpanel) {
    return;
  }

  try {
    userId = null;
    mixpanel.reset();
    console.log('User reset');
  } catch (error) {
    console.error('Error resetting user:', error);
  }
};

/**
 * Tracks a generic event in the analytics system
 * @param eventName The name of the event
 * @param properties Additional properties for the event
 * @returns Promise that resolves when tracking is complete
 */
const trackEvent = async (
  eventName: string,
  properties: Record<string, any> = {}
): Promise<void> => {
  if (!isInitialized || !analyticsEnabled) {
    return;
  }

  try {
    // Add common properties
    const commonProps = await getCommonProperties();
    const eventProperties = {
      ...commonProps,
      ...properties,
    };

    // Check if device is offline
    if (offlineService.isOffline()) {
      // Store the event in our offlineEvents array
      const event: AnalyticsEvent = {
        eventName,
        properties: eventProperties,
        timestamp: Date.now(),
      };
      
      offlineEvents.push(event);
      await storageService.storeData(STORAGE_KEYS.OFFLINE_ACTIONS_QUEUE, offlineEvents);
      console.log(`Event "${eventName}" queued for offline processing`);
      return;
    }

    // If online, track the event with Mixpanel
    if (mixpanel) {
      await mixpanel.track(eventName, eventProperties);
      console.log(`Event tracked: ${eventName}`);
    }
  } catch (error) {
    console.error(`Error tracking event "${eventName}":`, error);
  }
};

/**
 * Tracks when a user views a specific screen
 * @param screenName The name of the screen
 * @param properties Additional properties for the event
 * @returns Promise that resolves when tracking is complete
 */
const trackScreenView = async (
  screenName: string,
  properties: Record<string, any> = {}
): Promise<void> => {
  await trackEvent('Screen View', {
    screen_name: screenName,
    ...properties,
  });
};

/**
 * Tracks user actions like button clicks or interactions
 * @param actionName The action name
 * @param properties Additional properties for the event
 * @returns Promise that resolves when tracking is complete
 */
const trackUserAction = async (
  actionName: string,
  properties: Record<string, any> = {}
): Promise<void> => {
  await trackEvent('User Action', {
    action_name: actionName,
    ...properties,
  });
};

/**
 * Tracks tribe-related activities
 * @param activityType The type of tribe activity
 * @param tribeId The ID of the tribe
 * @param properties Additional properties for the event
 * @returns Promise that resolves when tracking is complete
 */
const trackTribeActivity = async (
  activityType: string,
  tribeId: string,
  properties: Record<string, any> = {}
): Promise<void> => {
  await trackEvent('Tribe Activity', {
    activity_type: activityType,
    tribe_id: tribeId,
    ...properties,
  });
};

/**
 * Tracks event-related activities
 * @param activityType The type of event activity
 * @param eventId The ID of the event
 * @param properties Additional properties for the event
 * @returns Promise that resolves when tracking is complete
 */
const trackEventActivity = async (
  activityType: string,
  eventId: string,
  properties: Record<string, any> = {}
): Promise<void> => {
  await trackEvent('Event Activity', {
    activity_type: activityType,
    event_id: eventId,
    ...properties,
  });
};

/**
 * Tracks interactions with AI features
 * @param interactionType The type of AI interaction
 * @param properties Additional properties for the event
 * @returns Promise that resolves when tracking is complete
 */
const trackAIInteraction = async (
  interactionType: string,
  properties: Record<string, any> = {}
): Promise<void> => {
  await trackEvent('AI Interaction', {
    interaction_type: interactionType,
    ...properties,
  });
};

/**
 * Tracks conversions from digital to physical interactions
 * @param conversionType The type of conversion
 * @param sourceId The ID of the source (event, tribe, etc.)
 * @param properties Additional properties for the event
 * @returns Promise that resolves when tracking is complete
 */
const trackConversion = async (
  conversionType: string,
  sourceId: string,
  properties: Record<string, any> = {}
): Promise<void> => {
  await trackEvent('Conversion', {
    conversion_type: conversionType,
    source_id: sourceId,
    ...properties,
  });
};

/**
 * Tracks application errors
 * @param error The error object
 * @param context The context in which the error occurred
 * @param additionalData Any additional data about the error
 * @returns Promise that resolves when tracking is complete
 */
const trackError = async (
  error: Error,
  context: string,
  additionalData: Record<string, any> = {}
): Promise<void> => {
  await trackEvent('Error', {
    error_message: error.message,
    error_stack: error.stack,
    error_context: context,
    ...additionalData,
  });
};

/**
 * Load offline events from storage
 */
const loadOfflineEvents = async (): Promise<void> => {
  try {
    const events = await storageService.getData<AnalyticsEvent[]>(
      STORAGE_KEYS.OFFLINE_ACTIONS_QUEUE, 
      []
    );
    offlineEvents = events || [];
  } catch (error) {
    console.error('Error loading offline events:', error);
    offlineEvents = [];
  }
};

/**
 * Processes analytics events that were captured while offline
 * @returns Promise that resolves when all offline events are processed
 */
const processOfflineEvents = async (): Promise<void> => {
  if (!isInitialized || !analyticsEnabled || !mixpanel || offlineEvents.length === 0) {
    return;
  }

  console.log(`Processing ${offlineEvents.length} offline events`);

  try {
    // Process each event in the queue
    for (const event of offlineEvents) {
      try {
        await mixpanel.track(event.eventName, event.properties);
        console.log(`Processed offline event: ${event.eventName}`);
      } catch (error) {
        console.error(`Error processing offline event ${event.eventName}:`, error);
      }
    }

    // Clear the offline events queue after processing
    offlineEvents = [];
    await storageService.storeData(STORAGE_KEYS.OFFLINE_ACTIONS_QUEUE, offlineEvents);
  } catch (error) {
    console.error('Error processing offline events:', error);
  }
};

/**
 * Checks if analytics tracking is currently enabled
 * @returns True if analytics is enabled, false otherwise
 */
const isAnalyticsEnabled = (): boolean => {
  return analyticsEnabled;
};

/**
 * Handles changes in network connectivity
 * @param isConnected Whether the device is connected to the internet
 */
const handleConnectivityChange = (isConnected: boolean): void => {
  if (isConnected) {
    processOfflineEvents()
      .catch(error => {
        console.error('Error processing offline events after connectivity change:', error);
      });
  }
  
  console.log(`Network connectivity changed: ${isConnected ? 'online' : 'offline'}`);
};

/**
 * Gets common properties to include with all analytics events
 * @returns Common properties object
 */
const getCommonProperties = async (): Promise<Record<string, any>> => {
  let deviceId = '';
  try {
    deviceId = await getUniqueDeviceId();
  } catch (error) {
    console.error('Error getting device ID for analytics:', error);
  }

  return {
    timestamp: Date.now(),
    app_version: CONFIG.ENVIRONMENT.APP_VERSION,
    platform: getPlatform(),
    os_version: getOSVersion(),
    device_model: getDeviceModel(),
    device_id: deviceId,
    user_id: userId,
  };
};

// Export the analytics service as an object
export const analyticsService = {
  initialize,
  identifyUser,
  resetUser,
  trackEvent,
  trackScreenView,
  trackUserAction,
  trackTribeActivity,
  trackEventActivity,
  trackAIInteraction,
  trackConversion,
  trackError,
  processOfflineEvents,
  isAnalyticsEnabled,
};