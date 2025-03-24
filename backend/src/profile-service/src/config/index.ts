/**
 * Configuration module for the Profile Service.
 * 
 * This module centralizes access to environment variables, secrets, database connections,
 * and other configuration settings specific to the profile service. It serves as a single
 * entry point for all configuration needs within the profile service.
 */

import database from '../../../config/database';
import env, { EnvironmentType } from '../../../config/env';
import logging from '../../../config/logging';
import metrics from '../../../config/metrics';
import secrets from '../../../config/secrets';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Interface defining the profile service specific configuration
 */
export interface ProfileConfig {
  /**
   * Encryption key for sensitive personality traits data
   */
  personalityTraitsEncryptionKey: string;
  
  /**
   * Maximum distance in miles for location-based profile searches
   */
  maxDistanceSearchRadius: number;
  
  /**
   * Default distance in miles for location-based profile searches
   */
  defaultSearchRadius: number;
}

/**
 * Re-export environment type enum from env module
 */
export { EnvironmentType };

// Define profile-specific environment variables
const REQUIRED_ENV_VARS = [
  'PERSONALITY_TRAITS_ENCRYPTION_KEY',
  'MAX_DISTANCE_SEARCH_RADIUS',
  'DEFAULT_SEARCH_RADIUS'
];

// Define default values for profile-specific environment variables
const DEFAULT_VALUES = {
  MAX_DISTANCE_SEARCH_RADIUS: '25',
  DEFAULT_SEARCH_RADIUS: '10'
};

// Profile service specific metrics
const PROFILE_METRICS = [
  {
    name: 'profile_creation_total',
    help: 'Total number of profiles created',
    type: 'Counter'
  },
  {
    name: 'profile_update_total',
    help: 'Total number of profile updates',
    type: 'Counter'
  },
  {
    name: 'personality_assessment_total',
    help: 'Total number of personality assessments submitted',
    type: 'Counter'
  },
  {
    name: 'profile_search_total',
    help: 'Total number of profile searches performed',
    type: 'Counter'
  },
  {
    name: 'profile_location_search_total',
    help: 'Total number of location-based profile searches',
    type: 'Counter'
  }
];

/**
 * Validates all configuration components specific to the profile service
 * 
 * @returns True if all configuration is valid
 * @throws Error if configuration validation fails
 */
function validateConfiguration(): boolean {
  try {
    // Validate required environment variables
    env.validateRequiredEnvVariables();
    
    // Validate required secrets
    secrets.validateRequiredSecrets();
    
    // Validate profile-specific environment variables
    for (const variable of REQUIRED_ENV_VARS) {
      if (!process.env[variable]) {
        throw new Error(`Required environment variable "${variable}" is missing`);
      }
    }
    
    // Validate numeric values are within acceptable ranges
    const maxDistance = parseInt(process.env.MAX_DISTANCE_SEARCH_RADIUS || DEFAULT_VALUES.MAX_DISTANCE_SEARCH_RADIUS, 10);
    if (isNaN(maxDistance) || maxDistance <= 0 || maxDistance > 100) {
      throw new Error('MAX_DISTANCE_SEARCH_RADIUS must be a positive number between 1 and 100');
    }
    
    const defaultRadius = parseInt(process.env.DEFAULT_SEARCH_RADIUS || DEFAULT_VALUES.DEFAULT_SEARCH_RADIUS, 10);
    if (isNaN(defaultRadius) || defaultRadius <= 0 || defaultRadius > maxDistance) {
      throw new Error(`DEFAULT_SEARCH_RADIUS must be a positive number not exceeding MAX_DISTANCE_SEARCH_RADIUS (${maxDistance})`);
    }
    
    // Validate encryption key has proper format/length if in production
    if (env.NODE_ENV === 'production') {
      const encryptionKey = process.env.PERSONALITY_TRAITS_ENCRYPTION_KEY || '';
      if (!encryptionKey || encryptionKey.length < 32) {
        throw new Error('PERSONALITY_TRAITS_ENCRYPTION_KEY must be at least 32 characters in production');
      }
    }
    
    logger.info('Profile service configuration validated successfully');
    return true;
  } catch (error) {
    logger.error('Profile service configuration validation failed', error as Error);
    throw error;
  }
}

/**
 * Initializes all configuration components for the profile service
 * 
 * @returns Promise that resolves when configuration is initialized
 */
async function initializeConfig(): Promise<void> {
  try {
    // Validate configuration
    validateConfiguration();
    
    // Initialize profile-specific metrics
    const serviceMetrics = metrics.createServiceMetrics('profile_service');
    
    // Register profile-specific metrics
    const registry = metrics.registry;
    
    // Create all profile-specific metrics based on the defined list
    PROFILE_METRICS.forEach(metric => {
      if (metric.type === 'Counter') {
        new registry.Counter({
          name: metric.name,
          help: metric.help
        });
      } else if (metric.type === 'Gauge') {
        new registry.Gauge({
          name: metric.name,
          help: metric.help
        });
      } else if (metric.type === 'Histogram') {
        new registry.Histogram({
          name: metric.name,
          help: metric.help
        });
      }
    });
    
    logger.info('Profile service configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize profile service configuration', error as Error);
    throw error;
  }
}

/**
 * Performs cleanup of configuration resources during service shutdown
 * 
 * @returns Promise that resolves when cleanup is complete
 */
async function shutdownConfig(): Promise<void> {
  try {
    // Any cleanup tasks related to configuration
    
    logger.info('Profile service configuration shutdown successfully');
  } catch (error) {
    logger.error('Error during profile service configuration shutdown', error as Error);
    // Don't throw during shutdown to prevent application crash
  }
}

/**
 * Returns profile-specific configuration settings
 * 
 * @returns Profile configuration object
 */
function getProfileConfig(): ProfileConfig {
  // Get personality traits encryption key - prioritize secrets over env vars for security
  let personalityTraitsEncryptionKey: string;
  
  try {
    // Try to get from secrets first
    personalityTraitsEncryptionKey = secrets.getSecret('PERSONALITY_TRAITS_ENCRYPTION_KEY');
  } catch (error) {
    // Fall back to environment variable
    personalityTraitsEncryptionKey = process.env.PERSONALITY_TRAITS_ENCRYPTION_KEY || '';
    
    // Log a warning if we're in production and using an env var for sensitive data
    if (env.NODE_ENV === 'production') {
      logger.warn('Using environment variable for PERSONALITY_TRAITS_ENCRYPTION_KEY in production');
    }
  }
  
  // Get max distance for search radius with default fallback
  const maxDistanceSearchRadius = parseInt(
    process.env.MAX_DISTANCE_SEARCH_RADIUS || DEFAULT_VALUES.MAX_DISTANCE_SEARCH_RADIUS,
    10
  );
  
  // Get default search radius with default fallback
  const defaultSearchRadius = parseInt(
    process.env.DEFAULT_SEARCH_RADIUS || DEFAULT_VALUES.DEFAULT_SEARCH_RADIUS,
    10
  );
  
  return {
    personalityTraitsEncryptionKey,
    maxDistanceSearchRadius,
    defaultSearchRadius
  };
}

// Export the configuration module
export default {
  env,
  database,
  logging,
  metrics,
  secrets,
  validateConfiguration,
  initializeConfig,
  shutdownConfig,
  getProfileConfig
};