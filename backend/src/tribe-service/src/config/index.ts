/**
 * Configuration Module for Tribe Service
 * 
 * This module centralizes all configuration settings specific to the tribe service,
 * including environment variables, database connections, logging, metrics, and secrets.
 * It serves as a single entry point for accessing configuration throughout the service.
 */

import database from '../../../config/database';
import env, { EnvironmentType } from '../../../config/env';
import logging from '../../../config/logging';
import metrics from '../../../config/metrics';
import secrets from '../../../config/secrets';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Interface defining the structure of tribe-specific configuration
 */
export interface TribeConfig {
  /** Maximum number of tribes a user can join */
  maxTribesPerUser: number;
  /** Maximum number of members allowed in a tribe */
  maxMembersPerTribe: number;
  /** Number of days of inactivity before a tribe is marked as at-risk */
  inactivityThresholdDays: number;
}

/**
 * Returns tribe-specific configuration settings
 * 
 * @returns Tribe configuration object
 */
const getTribeConfig = (): TribeConfig => {
  return {
    maxTribesPerUser: Number(process.env.MAX_TRIBES_PER_USER || '3'),
    maxMembersPerTribe: Number(process.env.MAX_MEMBERS_PER_TRIBE || '8'),
    inactivityThresholdDays: Number(process.env.TRIBE_INACTIVITY_THRESHOLD_DAYS || '30')
  };
};

/**
 * Validates all configuration components specific to the tribe service
 * 
 * @returns True if all configuration is valid
 * @throws Error if validation fails
 */
const validateConfiguration = (): boolean => {
  try {
    // Validate required environment variables
    env.validateRequiredEnvVariables();
    
    // Validate required secrets
    secrets.validateRequiredSecrets();
    
    // Validate tribe-specific configuration
    const tribeConfig = getTribeConfig();
    if (tribeConfig.maxTribesPerUser <= 0) {
      throw new Error('MAX_TRIBES_PER_USER must be a positive number');
    }
    
    if (tribeConfig.maxMembersPerTribe <= 0) {
      throw new Error('MAX_MEMBERS_PER_TRIBE must be a positive number');
    }
    
    if (tribeConfig.inactivityThresholdDays <= 0) {
      throw new Error('TRIBE_INACTIVITY_THRESHOLD_DAYS must be a positive number');
    }
    
    logger.info('Tribe service configuration validated successfully');
    return true;
  } catch (error) {
    logger.error('Configuration validation failed', error as Error);
    throw error;
  }
};

/**
 * Initializes all configuration components for the tribe service
 * 
 * @returns Promise that resolves when configuration is initialized
 */
const initializeConfig = async (): Promise<void> => {
  try {
    // Validate configuration
    validateConfiguration();
    
    // Initialize metrics collection with tribe service specific metrics
    const tribeMetrics = metrics.createServiceMetrics('tribe_service');
    
    // Note: Additional tribe-specific metrics are created during service startup
    // in their respective modules to maintain separation of concerns
    
    logger.info('Tribe service configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize configuration', error as Error);
    throw error;
  }
};

/**
 * Performs cleanup of configuration resources during service shutdown
 * 
 * @returns Promise that resolves when cleanup is complete
 */
const shutdownConfig = async (): Promise<void> => {
  try {
    // Disconnect from database when service is shutting down
    await database.disconnectDatabase();
    
    logger.info('Tribe service configuration shutdown successfully');
  } catch (error) {
    logger.error('Error during configuration shutdown', error as Error);
  }
};

// Re-export EnvironmentType for use throughout the application
export { EnvironmentType };

// Export the configuration object
export default {
  env,
  database,
  logging,
  metrics,
  secrets,
  validateConfiguration,
  initializeConfig,
  shutdownConfig,
  getTribeConfig
};