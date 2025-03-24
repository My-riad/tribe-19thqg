/**
 * Configuration Module for Planning Service
 * 
 * Centralizes access to environment variables, secrets, database connections,
 * and other configuration settings specific to the planning service.
 * Serves as a single entry point for all configuration needs within the planning service.
 */

// Import internal modules
import database from '../../../config/database';
import env, { EnvironmentType } from '../../../config/env';
import logging from '../../../config/logging';
import metrics from '../../../config/metrics';
import secrets from '../../../config/secrets';
import { logger } from '../../../shared/src/utils/logger.util';

// Import external packages
import NodeCache from 'node-cache'; // ^5.1.2
import moment from 'moment'; // ^2.29.4
import 'moment-timezone'; // ^0.5.43

// Cache instance
let cache: NodeCache;

/**
 * Interface defining planning service specific configuration
 */
export interface PlanningConfig {
  googlePlacesApiKey: string;
  defaultTimezone: string;
  defaultVenueSearchRadius: number;
  availabilityCollectionDeadlineHours: number;
  cacheTTL: number;
}

/**
 * Validates all configuration components specific to the planning service
 * 
 * @returns True if all configuration is valid
 */
function validateConfiguration(): boolean {
  try {
    // Validate required environment variables
    env.validateRequiredEnvVariables();
    
    // Validate required secrets
    secrets.validateRequiredSecrets();
    
    // Validate planning-specific configuration
    const requiredPlanningVars = [
      'GOOGLE_PLACES_API_KEY',
      'TIMEZONE_DEFAULT',
      'VENUE_SEARCH_RADIUS_DEFAULT',
      'AVAILABILITY_COLLECTION_DEADLINE_HOURS'
    ];
    
    for (const varName of requiredPlanningVars) {
      if (!process.env[varName]) {
        throw new Error(`Required planning service environment variable "${varName}" is missing`);
      }
    }
    
    logger.info('Planning service configuration validated successfully');
    return true;
  } catch (error) {
    logger.error('Planning service configuration validation failed', error as Error);
    throw error;
  }
}

/**
 * Initializes all configuration components for the planning service
 * 
 * @returns Promise that resolves when configuration is initialized
 */
async function initializeConfig(): Promise<void> {
  try {
    // Validate configuration first
    validateConfiguration();
    
    // Initialize metrics collection with planning service specific metrics
    metrics.createServiceMetrics('planning');
    
    // Initialize cache
    const cacheTTL = Number(process.env.CACHE_TTL || 3600); // Default 1 hour
    cache = new NodeCache({
      stdTTL: cacheTTL,
      checkperiod: cacheTTL * 0.2, // Check for expired keys at 20% of TTL
      useClones: false
    });
    
    // Set up moment timezone with default timezone
    const defaultTimezone = process.env.TIMEZONE_DEFAULT || 'America/New_York';
    moment.tz.setDefault(defaultTimezone);
    
    logger.info('Planning service configuration initialized successfully');
  } catch (error) {
    logger.error('Planning service configuration initialization failed', error as Error);
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
    // Flush cache if needed
    cache.close();
    
    logger.info('Planning service configuration shut down successfully');
  } catch (error) {
    logger.error('Planning service configuration shutdown failed', error as Error);
  }
}

/**
 * Returns planning-specific configuration settings
 * 
 * @returns Planning configuration object
 */
function getPlanningConfig(): PlanningConfig {
  return {
    googlePlacesApiKey: env.GOOGLE_PLACES_API_KEY || secrets.getSecret('GOOGLE_PLACES_API_KEY'),
    defaultTimezone: process.env.TIMEZONE_DEFAULT || 'America/New_York',
    defaultVenueSearchRadius: Number(process.env.VENUE_SEARCH_RADIUS_DEFAULT || 10000), // Default 10km
    availabilityCollectionDeadlineHours: Number(process.env.AVAILABILITY_COLLECTION_DEADLINE_HOURS || 48), // Default 48 hours
    cacheTTL: Number(process.env.CACHE_TTL || 3600) // Default 1 hour
  };
}

/**
 * Returns the configured cache instance
 * 
 * @returns Configured cache instance
 */
function getCache(): NodeCache {
  return cache;
}

// Export all configuration modules and utilities
export default {
  env,
  database,
  logging,
  metrics,
  secrets,
  validateConfiguration,
  initializeConfig,
  shutdownConfig,
  getPlanningConfig,
  getCache
};

// Re-export environment type enum
export { EnvironmentType } from '../../../config/env';