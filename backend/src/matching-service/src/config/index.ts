/**
 * Configuration module for the Matching Service.
 * 
 * This module centralizes access to environment variables, secrets, database connections,
 * and matching-specific configuration settings. It serves as a single entry point for all
 * configuration needs within the matching service.
 */

import * as prometheus from 'prom-client'; // ^14.0.0
import database from '../../../config/database';
import env, { EnvironmentType } from '../../../config/env';
import logging from '../../../config/logging';
import metrics from '../../../config/metrics';
import secrets from '../../../config/secrets';
import { logger } from '../../../shared/src/utils/logger.util';
import { CompatibilityFactor } from '../models/compatibility.model';

/**
 * Frequency options for automatic matching operations
 */
export enum MatchingFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly'
}

/**
 * Configuration interface for the matching service
 */
export interface IMatchingConfig {
  /** API key for OpenRouter AI service */
  openRouterApiKey: string;

  /** Maximum number of users to process in a batch matching operation */
  maxBatchSize: number;

  /** Minimum compatibility score required for a match (0-1) */
  defaultCompatibilityThreshold: number;

  /** Default maximum distance in miles for location-based matching */
  defaultMaxDistance: number;

  /** Default weights for different compatibility factors */
  defaultFactorWeights: Record<CompatibilityFactor, number>;

  /** Cron expressions for different matching frequencies */
  autoMatchingSchedule: Record<MatchingFrequency, string>;
}

/**
 * Validates all configuration components required for the matching service
 * 
 * @returns True if all configuration is valid
 * @throws Error if configuration is invalid
 */
export function validateConfiguration(): boolean {
  try {
    // Validate required environment variables
    env.validateRequiredEnvVariables();

    // Validate required secrets
    secrets.validateRequiredSecrets();
    
    // Validate matching-specific configuration
    const requiredVars = [
      'OPENROUTER_API_KEY',
      'MAX_BATCH_SIZE',
      'DEFAULT_COMPATIBILITY_THRESHOLD',
      'DEFAULT_MAX_DISTANCE'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables for matching service: ${missingVars.join(', ')}`);
    }
    
    logger.info('Matching service configuration validated successfully');
    return true;
  } catch (error) {
    logger.error('Configuration validation failed', error as Error);
    throw error;
  }
}

/**
 * Initializes all configuration components for the matching service
 * 
 * @returns Promise that resolves when configuration is initialized
 */
export async function initializeConfig(): Promise<void> {
  try {
    // Validate configuration
    validateConfiguration();
    
    // Initialize service metrics
    const serviceMetrics = metrics.createServiceMetrics('matching');
    
    // Register matching-specific metrics
    new prometheus.Counter({
      name: 'matching_requests_total',
      help: 'Total number of matching requests',
      registers: [metrics.registry]
    });
    
    new prometheus.Counter({
      name: 'matching_success_total',
      help: 'Total number of successful matches',
      registers: [metrics.registry]
    });
    
    new prometheus.Counter({
      name: 'matching_failure_total',
      help: 'Total number of failed matching attempts',
      registers: [metrics.registry]
    });
    
    new prometheus.Histogram({
      name: 'batch_matching_duration_seconds',
      help: 'Duration of batch matching operations',
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
      registers: [metrics.registry]
    });
    
    new prometheus.Histogram({
      name: 'compatibility_score_distribution',
      help: 'Distribution of compatibility scores',
      buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      registers: [metrics.registry]
    });
    
    new prometheus.Counter({
      name: 'tribes_created_total',
      help: 'Total number of tribes created through matching',
      registers: [metrics.registry]
    });
    
    // Connect to database
    await database.connectDatabase();
    
    logger.info('Matching service configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize matching service configuration', error as Error);
    throw error;
  }
}

/**
 * Performs cleanup of configuration resources during service shutdown
 * 
 * @returns Promise that resolves when cleanup is complete
 */
export async function shutdownConfig(): Promise<void> {
  try {
    // Disconnect from database
    await database.disconnectDatabase();
    
    logger.info('Matching service configuration shutdown successfully');
  } catch (error) {
    logger.error('Error during configuration shutdown', error as Error);
    // Don't rethrow error during shutdown to avoid crashing the process
  }
}

/**
 * Returns matching-specific configuration settings
 * 
 * @returns Matching configuration object
 */
export function getMatchingConfig(): IMatchingConfig {
  // Get OpenRouter API key (first try environment, then secrets)
  const openRouterApiKey = process.env.OPENROUTER_API_KEY || 
    secrets.getSecret('OPENROUTER_API_KEY');
  
  // Get batch size from environment, default to 1000
  const maxBatchSize = parseInt(process.env.MAX_BATCH_SIZE || '1000', 10);
  
  // Get compatibility threshold from environment, default to 0.7
  const defaultCompatibilityThreshold = parseFloat(
    process.env.DEFAULT_COMPATIBILITY_THRESHOLD || '0.7'
  );
  
  // Get max distance from environment, default to 25 miles
  const defaultMaxDistance = parseFloat(
    process.env.DEFAULT_MAX_DISTANCE || '25'
  );
  
  // Default weights for compatibility factors
  const defaultFactorWeights: Record<CompatibilityFactor, number> = {
    [CompatibilityFactor.PERSONALITY]: 0.3,
    [CompatibilityFactor.INTERESTS]: 0.3,
    [CompatibilityFactor.COMMUNICATION_STYLE]: 0.2,
    [CompatibilityFactor.LOCATION]: 0.1,
    [CompatibilityFactor.GROUP_BALANCE]: 0.1
  };
  
  // Auto matching schedule with cron expressions
  const autoMatchingSchedule: Record<MatchingFrequency, string> = {
    [MatchingFrequency.WEEKLY]: '0 0 * * 1', // Every Monday at midnight
    [MatchingFrequency.BIWEEKLY]: '0 0 1,15 * *', // 1st and 15th of each month
    [MatchingFrequency.MONTHLY]: '0 0 1 * *' // 1st of each month
  };
  
  return {
    openRouterApiKey,
    maxBatchSize,
    defaultCompatibilityThreshold,
    defaultMaxDistance,
    defaultFactorWeights,
    autoMatchingSchedule
  };
}

// Export the environment type enum for convenience
export { EnvironmentType } from '../../../config/env';

// Export the configuration object as default
export default {
  env,
  database,
  logging,
  metrics,
  secrets,
  validateConfiguration,
  initializeConfig,
  shutdownConfig,
  getMatchingConfig
};