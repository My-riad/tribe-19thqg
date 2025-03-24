/**
 * Event Service Configuration Module
 * 
 * This module centralizes configuration settings for the Event Service,
 * including API endpoints, credentials, cache settings, and service-specific
 * configuration. It extends the main configuration with event-specific settings.
 */

import baseConfig from '../../../config';
import { logger } from '../../../shared/src/utils/logger.util';
import { ValidationError } from '../../../shared/src/errors/validation.error';

/**
 * Required environment variables for the Event Service
 */
export const requiredEnvVariables = [
  'EVENTBRITE_API_KEY',
  'MEETUP_API_KEY',
  'GOOGLE_PLACES_API_KEY',
  'OPENWEATHERMAP_API_KEY'
];

/**
 * Event Service specific configuration
 */
export const eventServiceConfig = {
  // External API endpoints
  eventbriteApiUrl: 'https://www.eventbriteapi.com/v3',
  meetupApiUrl: 'https://api.meetup.com/gql',
  googlePlacesApiUrl: 'https://maps.googleapis.com/maps/api/place',
  openWeatherMapApiUrl: 'https://api.openweathermap.org/data/2.5',
  
  // Cache settings (in seconds)
  eventCacheTtl: baseConfig.env.EVENT_CACHE_TTL || 3600, // 1 hour default
  weatherCacheTtl: 1800, // 30 minutes
  venueCacheTtl: 86400, // 24 hours
  
  // Search parameters
  maxSearchRadius: 50, // miles
  defaultSearchRadius: 15, // miles
  maxEventsPerRequest: 100,
  defaultEventsPerRequest: 20,
};

/**
 * Validates Event Service specific configuration settings
 * 
 * @returns True if all configuration is valid
 * @throws Error if any configuration validation fails
 */
export function validateEventServiceConfig(): boolean {
  try {
    logger.info('Validating Event Service configuration...');
    
    // Check required environment variables in production
    if (baseConfig.env.NODE_ENV === 'production') {
      for (const variable of requiredEnvVariables) {
        if (!process.env[variable]) {
          throw ValidationError.invalidInput(`Required environment variable "${variable}" is missing for Event Service`);
        }
      }
    }
    
    // Validate API endpoint configurations
    if (!eventServiceConfig.eventbriteApiUrl) {
      throw ValidationError.invalidInput('Eventbrite API URL is not configured');
    }
    
    if (!eventServiceConfig.meetupApiUrl) {
      throw ValidationError.invalidInput('Meetup API URL is not configured');
    }
    
    if (!eventServiceConfig.googlePlacesApiUrl) {
      throw ValidationError.invalidInput('Google Places API URL is not configured');
    }
    
    if (!eventServiceConfig.openWeatherMapApiUrl) {
      throw ValidationError.invalidInput('OpenWeatherMap API URL is not configured');
    }
    
    // Validate cache settings
    if (eventServiceConfig.eventCacheTtl <= 0) {
      throw ValidationError.invalidInput('Event cache TTL must be greater than 0');
    }
    
    if (eventServiceConfig.weatherCacheTtl <= 0) {
      throw ValidationError.invalidInput('Weather cache TTL must be greater than 0');
    }
    
    if (eventServiceConfig.venueCacheTtl <= 0) {
      throw ValidationError.invalidInput('Venue cache TTL must be greater than 0');
    }
    
    logger.info('Event Service configuration validated successfully');
    return true;
  } catch (error) {
    logger.error('Event Service configuration validation failed', error as Error);
    throw error;
  }
}

/**
 * Initializes the Event Service configuration
 * 
 * @returns Promise that resolves to true if initialization is successful
 * @throws Error if initialization fails
 */
export async function initializeEventServiceConfig(): Promise<boolean> {
  try {
    // First validate the base configuration
    baseConfig.validateConfiguration();
    
    // Then validate Event Service specific configuration
    validateEventServiceConfig();
    
    // Initialize any Event Service specific resources
    // This could include setting up API clients, connection pools, etc.
    
    logger.info('Event Service configuration initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Event Service configuration', error as Error);
    throw error;
  }
}

/**
 * Performs cleanup of any resources initialized by the Event Service configuration
 * 
 * @returns Promise that resolves when cleanup is complete
 */
export async function shutdownEventServiceConfig(): Promise<void> {
  try {
    // Release any resources held by the Event Service
    // This could include closing connection pools, etc.
    
    logger.info('Event Service configuration shutdown successfully');
  } catch (error) {
    logger.error('Error during Event Service configuration shutdown', error as Error);
    // We don't want to throw during shutdown to ensure clean process exit
  }
}

// Export all configuration settings and utilities for the Event Service
export default {
  // Re-export base configuration
  env: baseConfig.env,
  logging: baseConfig.logging,
  secrets: baseConfig.secrets,
  
  // Export Event Service specific configuration
  eventServiceConfig,
  initializeEventServiceConfig,
  shutdownEventServiceConfig,
  validateEventServiceConfig
};