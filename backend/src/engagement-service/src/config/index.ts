/**
 * Configuration Module for the Engagement Service.
 * 
 * This module extends the base configuration with engagement-specific settings
 * and provides a centralized access point for all configuration needed by the
 * Engagement Service.
 */

import * as path from 'path'; // built-in
import baseConfig from '../../../config';
import { logger } from '../../../shared/src/utils/logger.util';

// Extract configuration components from base config
const { env, logging, metrics, secrets, validateConfiguration } = baseConfig;

/**
 * Engagement-specific configuration settings
 */
export const engagement = {
  // URL for the AI orchestration service
  AI_ORCHESTRATION_URL: process.env.AI_ORCHESTRATION_URL || 'http://ai-orchestration-service:3000',
  
  // Number of days until engagement prompts expire
  ENGAGEMENT_EXPIRY_DAYS: parseInt(process.env.ENGAGEMENT_EXPIRY_DAYS || '30', 10),
  
  // Default number of prompts to generate
  DEFAULT_PROMPT_COUNT: parseInt(process.env.DEFAULT_PROMPT_COUNT || '3', 10),
  
  // Maximum batch size for processing engagements
  MAX_ENGAGEMENT_BATCH_SIZE: parseInt(process.env.MAX_ENGAGEMENT_BATCH_SIZE || '50', 10),
  
  // Threshold for low engagement detection (in days)
  LOW_ENGAGEMENT_THRESHOLD_DAYS: parseInt(process.env.LOW_ENGAGEMENT_THRESHOLD_DAYS || '7', 10),
  
  // Toggle for AI-driven engagement features
  ENABLE_AI_GENERATION: process.env.ENABLE_AI_GENERATION !== 'false'
};

/**
 * Validates engagement service specific configuration
 * 
 * @returns True if all engagement configuration is valid
 * @throws Error if any configuration validation fails
 */
export function validateEngagementConfig(): boolean {
  try {
    // First validate base configuration
    validateConfiguration();
    
    // Validate engagement-specific environment variables
    if (engagement.ENGAGEMENT_EXPIRY_DAYS <= 0) {
      throw new Error('ENGAGEMENT_EXPIRY_DAYS must be a positive number');
    }
    
    if (engagement.DEFAULT_PROMPT_COUNT <= 0) {
      throw new Error('DEFAULT_PROMPT_COUNT must be a positive number');
    }
    
    if (engagement.MAX_ENGAGEMENT_BATCH_SIZE <= 0) {
      throw new Error('MAX_ENGAGEMENT_BATCH_SIZE must be a positive number');
    }
    
    if (engagement.LOW_ENGAGEMENT_THRESHOLD_DAYS <= 0) {
      throw new Error('LOW_ENGAGEMENT_THRESHOLD_DAYS must be a positive number');
    }
    
    // If AI generation is enabled, validate AI orchestration URL
    if (engagement.ENABLE_AI_GENERATION && !engagement.AI_ORCHESTRATION_URL) {
      throw new Error('AI_ORCHESTRATION_URL is required when ENABLE_AI_GENERATION is true');
    }
    
    logger.info('Engagement service configuration validated successfully');
    return true;
  } catch (error) {
    logger.error('Engagement service configuration validation failed', error as Error);
    throw error;
  }
}

/**
 * Initializes engagement service configuration
 * 
 * @returns Promise that resolves when configuration is initialized
 */
export async function initializeEngagementConfig(): Promise<void> {
  try {
    // First validate configuration
    validateEngagementConfig();
    
    // Set up service-specific metrics if enabled
    if (metrics.collectDefaultMetrics) {
      const serviceMetrics = metrics.createServiceMetrics('engagement_service');
      logger.info('Engagement service metrics initialized');
    }
    
    // Initialize any service-specific resources here
    
    logger.info('Engagement service configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize engagement service configuration', error as Error);
    throw error;
  }
}

// Export the combined configuration
export default {
  env,
  logging,
  metrics,
  secrets,
  engagement,
  validateEngagementConfig,
  initializeEngagementConfig
};

// Re-export key configuration objects and functions for easier access
export { env, logging, metrics, secrets, engagement };