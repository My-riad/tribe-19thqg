/**
 * Authentication Service Configuration Module
 * 
 * Centralizes all configuration settings and utilities for the auth service.
 * This module integrates and provides access to environment variables, database
 * connections, logging, metrics, and secrets management specific to the
 * authentication service.
 */

import database from '../../../config/database';
import env, { EnvironmentType } from '../../../config/env';
import logging from '../../../config/logging';
import metrics from '../../../config/metrics';
import secrets from '../../../config/secrets';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Interface definition for auth-specific configuration
 */
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
}

// Re-export EnvironmentType for use within auth service
export { EnvironmentType };

/**
 * Validates all configuration components specific to the auth service
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

    // Validate JWT-specific configuration
    if (!env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required for auth service');
    }

    if (!env.JWT_EXPIRES_IN) {
      logger.warn('JWT_EXPIRES_IN not set, using default value of 15m');
    }

    if (!env.JWT_REFRESH_EXPIRES_IN) {
      logger.warn('JWT_REFRESH_EXPIRES_IN not set, using default value of 7d');
    }

    logger.info('Auth service configuration validated successfully');
    return true;
  } catch (error) {
    logger.error('Auth service configuration validation failed', error as Error);
    throw error;
  }
}

/**
 * Initializes all configuration components for the auth service
 * 
 * @returns Promise that resolves when configuration is initialized
 */
async function initializeConfig(): Promise<void> {
  try {
    // Validate configuration
    validateConfiguration();

    // Initialize metrics collection with auth service specific metrics
    const serviceMetrics = metrics.createServiceMetrics('auth');
    
    // Create auth-specific metrics
    const authMetrics = {
      loginAttempts: new metrics.registry.Counter({
        name: 'auth_login_attempts_total',
        help: 'Total number of login attempts',
        labelNames: ['status'],
        registers: [metrics.registry]
      }),
      
      loginSuccess: new metrics.registry.Counter({
        name: 'auth_login_success_total',
        help: 'Total number of successful logins',
        registers: [metrics.registry]
      }),
      
      loginFailure: new metrics.registry.Counter({
        name: 'auth_login_failure_total',
        help: 'Total number of failed logins',
        labelNames: ['reason'],
        registers: [metrics.registry]
      }),
      
      tokenRefresh: new metrics.registry.Counter({
        name: 'auth_token_refresh_total',
        help: 'Total number of token refreshes',
        labelNames: ['status'],
        registers: [metrics.registry]
      })
    };

    logger.info('Auth service configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize auth service configuration', error as Error);
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
    // No specific cleanup needed for auth configuration resources
    logger.info('Auth service configuration shutdown completed');
  } catch (error) {
    logger.error('Error during auth service configuration shutdown', error as Error);
    // Don't rethrow error during shutdown to allow clean process exit
  }
}

/**
 * Returns authentication-specific configuration settings
 * 
 * @returns Authentication configuration object
 */
function getAuthConfig(): AuthConfig {
  // For sensitive information like JWT_SECRET, we could use secrets.getSecret
  // if it's stored in a secure storage service in production
  const jwtSecret = env.NODE_ENV === 'production' 
    ? secrets.getSecret('JWT_SECRET')
    : env.JWT_SECRET;
    
  return {
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN
  };
}

// Export all configuration modules and utilities for the auth service
export default {
  env,
  database,
  logging,
  metrics,
  secrets,
  validateConfiguration,
  initializeConfig,
  shutdownConfig,
  getAuthConfig
};