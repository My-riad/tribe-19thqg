/**
 * Configuration Index Module
 * 
 * This module centralizes and exports all configuration settings for the Tribe platform.
 * It aggregates and re-exports configuration from various specialized configuration modules,
 * providing a single entry point for accessing all application configuration.
 */

import database from './database';
import env, { EnvironmentType } from './env';
import logging from './logging';
import metrics from './metrics';
import secrets, { SecretKeys } from './secrets';
import { logger } from '../shared/src/utils/logger.util';

/**
 * Validates all configuration components to ensure the application can start properly
 * 
 * @returns True if all configuration is valid
 * @throws Error if any configuration validation fails
 */
function validateConfiguration(): boolean {
  try {
    // Validate required environment variables
    env.validateRequiredEnvVariables();
    
    // Validate required secrets
    secrets.validateRequiredSecrets();
    
    logger.info('All configuration validated successfully');
    return true;
  } catch (error) {
    logger.error('Configuration validation failed', error as Error);
    throw error;
  }
}

/**
 * Initializes all configuration components and prepares them for use
 * 
 * @returns Promise that resolves when configuration is initialized
 */
async function initializeConfiguration(): Promise<void> {
  try {
    // First, validate the configuration
    validateConfiguration();
    
    // Initialize metrics collection if enabled
    if (metrics.collectDefaultMetrics) {
      metrics.initializeMetrics();
      logger.info('Metrics collection initialized');
    }
    
    // Connect to the database if required
    // This can be disabled via environment variable for scenarios where
    // database connection should be handled separately (e.g., migrations)
    if (process.env.CONNECT_DATABASE !== 'false') {
      await database.connectDatabase();
    }
    
    logger.info('Configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize configuration', error as Error);
    throw error;
  }
}

// Export all configuration components and utilities
export default {
  env,
  database,
  logging,
  metrics,
  secrets,
  validateConfiguration,
  initializeConfiguration
};

// Re-export important types and enums for use throughout the application
export { EnvironmentType } from './env';
export { SecretKeys } from './secrets';