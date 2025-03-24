import Constants from 'expo-constants'; // expo-constants v14.0.2
import { Platform } from 'react-native'; // react-native v0.72.3

/**
 * Retrieves environment variables with type safety and default values
 * @param key The environment variable key
 * @param defaultValue The default value to return if the environment variable is not found
 * @returns The environment variable value or the default value if not found
 */
function getEnvironmentVariable<T>(key: string, defaultValue: T): T {
  try {
    const expoConfig = Constants.expoConfig?.extra || {};
    const value = expoConfig[key];
    
    if (value !== undefined) {
      // Type conversions based on defaultValue type
      if (typeof defaultValue === 'boolean') {
        return (value === 'true' || value === true) as unknown as T;
      }
      
      if (typeof defaultValue === 'number') {
        return Number(value) as unknown as T;
      }
      
      return value as T;
    }
    
    return defaultValue;
  } catch (error) {
    console.warn(`Error retrieving environment variable ${key}:`, error);
    return defaultValue;
  }
}

// Environment detection constants
export const ENV = getEnvironmentVariable<string>('NODE_ENV', 'development');
export const IS_DEV = ENV === 'development';
export const IS_STAGING = ENV === 'staging';
export const IS_PROD = ENV === 'production';
export const IS_TEST = ENV === 'test';

// Platform detection constants
export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';

/**
 * Centralized configuration for the Tribe application
 * Provides settings for APIs, authentication, features, timeouts, storage,
 * limits, and environment-specific variables
 */
export const CONFIG = {
  // API configuration settings
  API: {
    BASE_URL: getEnvironmentVariable<string>('API_BASE_URL', 'http://localhost:3000/api'),
    TIMEOUT: getEnvironmentVariable<number>('API_TIMEOUT', 30000), // 30 seconds
    RETRY_ATTEMPTS: getEnvironmentVariable<number>('API_RETRY_ATTEMPTS', 3),
    RETRY_DELAY: 1000, // 1 second between retry attempts
    ENABLE_LOGGING: IS_DEV || IS_STAGING,
    ENABLE_MOCKING: getEnvironmentVariable<boolean>('ENABLE_API_MOCKING', IS_DEV),
  },
  
  // Authentication settings
  AUTH: {
    TOKEN_EXPIRY_BUFFER: getEnvironmentVariable<number>('AUTH_TOKEN_EXPIRY_BUFFER', 300000), // 5 minutes in ms
    SESSION_TIMEOUT: getEnvironmentVariable<number>('AUTH_SESSION_TIMEOUT', 86400000), // 24 hours in ms
    ENABLE_BIOMETRIC: true,
    ENABLE_SOCIAL_LOGIN: true,
    ENABLE_MFA: true,
    AUTH0: {
      CLIENT_ID: getEnvironmentVariable<string>('AUTH0_CLIENT_ID', ''),
      DOMAIN: getEnvironmentVariable<string>('AUTH0_DOMAIN', ''),
    },
  },
  
  // Feature flags
  FEATURES: {
    ENABLE_OFFLINE_MODE: getEnvironmentVariable<boolean>('ENABLE_OFFLINE_MODE', true),
    ENABLE_PUSH_NOTIFICATIONS: getEnvironmentVariable<boolean>('ENABLE_PUSH_NOTIFICATIONS', true),
    ENABLE_AI_ENGAGEMENT: getEnvironmentVariable<boolean>('ENABLE_AI_ENGAGEMENT', true),
    ENABLE_AUTO_MATCHING: getEnvironmentVariable<boolean>('ENABLE_AUTO_MATCHING', true),
    ENABLE_LOCATION_TRACKING: getEnvironmentVariable<boolean>('ENABLE_LOCATION_TRACKING', true),
    ENABLE_PAYMENT_SPLITTING: getEnvironmentVariable<boolean>('ENABLE_PAYMENT_SPLITTING', true),
    ENABLE_ACHIEVEMENTS: getEnvironmentVariable<boolean>('ENABLE_ACHIEVEMENTS', true),
  },
  
  // Timeout configurations
  TIMEOUTS: {
    LOCATION_UPDATE_INTERVAL: getEnvironmentVariable<number>('LOCATION_UPDATE_INTERVAL', 300000), // 5 minutes
    CHAT_TYPING_INDICATOR: getEnvironmentVariable<number>('CHAT_TYPING_INDICATOR_TIMEOUT', 3000), // 3 seconds
    NOTIFICATION_POLLING: getEnvironmentVariable<number>('NOTIFICATION_POLLING_INTERVAL', 60000), // 1 minute
    ACTIVITY_REFRESH: getEnvironmentVariable<number>('ACTIVITY_REFRESH_INTERVAL', 120000), // 2 minutes
    TRIBE_REFRESH: getEnvironmentVariable<number>('TRIBE_REFRESH_INTERVAL', 300000), // 5 minutes
    EVENT_REFRESH: getEnvironmentVariable<number>('EVENT_REFRESH_INTERVAL', 300000), // 5 minutes
  },
  
  // Storage limits and configurations
  STORAGE: {
    CHAT_HISTORY_LIMIT: getEnvironmentVariable<number>('CHAT_HISTORY_LIMIT', 100), // messages per chat
    OFFLINE_STORAGE_LIMIT: getEnvironmentVariable<number>('OFFLINE_STORAGE_LIMIT', 50000000), // 50MB
    MEDIA_CACHE_LIMIT: getEnvironmentVariable<number>('MEDIA_CACHE_LIMIT', 100000000), // 100MB
    CACHE_EXPIRY: getEnvironmentVariable<number>('CACHE_EXPIRY', 86400000), // 24 hours in ms
  },
  
  // Application limits
  LIMITS: {
    MAX_TRIBES_PER_USER: getEnvironmentVariable<number>('MAX_TRIBES_PER_USER', 3),
    MAX_MEMBERS_PER_TRIBE: getEnvironmentVariable<number>('MAX_MEMBERS_PER_TRIBE', 8),
    MIN_MEMBERS_PER_TRIBE: getEnvironmentVariable<number>('MIN_MEMBERS_PER_TRIBE', 4),
    MAX_EVENTS_PER_TRIBE: getEnvironmentVariable<number>('MAX_EVENTS_PER_TRIBE', 10),
    MAX_MESSAGE_LENGTH: getEnvironmentVariable<number>('MAX_MESSAGE_LENGTH', 1000),
    MAX_BIO_LENGTH: getEnvironmentVariable<number>('MAX_BIO_LENGTH', 500),
    MAX_UPLOAD_SIZE: getEnvironmentVariable<number>('MAX_UPLOAD_SIZE', 10000000), // 10MB
  },
  
  // Environment-specific settings
  ENVIRONMENT: {
    APP_VERSION: getEnvironmentVariable<string>('APP_VERSION', '1.0.0'),
    BUILD_NUMBER: getEnvironmentVariable<string>('BUILD_NUMBER', '1'),
    ANALYTICS_ENABLED: getEnvironmentVariable<boolean>('ANALYTICS_ENABLED', !IS_DEV),
    ENABLE_CONSOLE_LOGS: getEnvironmentVariable<boolean>('ENABLE_CONSOLE_LOGS', IS_DEV),
    ENABLE_DEBUG_TOOLS: getEnvironmentVariable<boolean>('ENABLE_DEBUG_TOOLS', IS_DEV),
  },
  
  // External service API keys and configurations
  EXTERNAL_SERVICES: {
    OPENROUTER_API_KEY: getEnvironmentVariable<string>('OPENROUTER_API_KEY', ''),
    STRIPE_PUBLISHABLE_KEY: getEnvironmentVariable<string>('STRIPE_PUBLISHABLE_KEY', ''),
    GOOGLE_PLACES_API_KEY: getEnvironmentVariable<string>('GOOGLE_PLACES_API_KEY', ''),
    
    FIREBASE: {
      API_KEY: getEnvironmentVariable<string>('FIREBASE_API_KEY', ''),
      APP_ID: getEnvironmentVariable<string>('FIREBASE_APP_ID', ''),
      MESSAGING_SENDER_ID: getEnvironmentVariable<string>('FIREBASE_MESSAGING_SENDER_ID', ''),
      PROJECT_ID: getEnvironmentVariable<string>('FIREBASE_PROJECT_ID', ''),
    },
    
    EVENTBRITE_API_KEY: getEnvironmentVariable<string>('EVENTBRITE_API_KEY', ''),
    MEETUP_API_KEY: getEnvironmentVariable<string>('MEETUP_API_KEY', ''),
    OPENWEATHERMAP_API_KEY: getEnvironmentVariable<string>('OPENWEATHERMAP_API_KEY', ''),
    SENTRY_DSN: getEnvironmentVariable<string>('SENTRY_DSN', ''),
  },
};