/**
 * API Gateway Configuration Module
 * 
 * This module centralizes all configuration settings for the API Gateway service,
 * including service routing, middleware options, and security settings.
 */

import baseConfig, { env, logging, secrets, validateConfiguration } from '../../../config';
import { CorsOptions } from 'cors'; // ^2.8.5
import { Options as RateLimitOptions } from 'express-rate-limit'; // ^6.7.0
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Service registry defining all microservices accessible through the API Gateway
 * Each entry defines how the API Gateway should route requests to a service
 */
export const serviceRegistry = {
  services: [
    {
      name: 'auth',
      path: '/api/auth',
      url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      requiresAuth: false,
      rateLimitTier: 'auth'
    },
    {
      name: 'profile',
      path: '/api/profile',
      url: process.env.PROFILE_SERVICE_URL || 'http://profile-service:3002',
      requiresAuth: true,
      rateLimitTier: 'standard'
    },
    {
      name: 'tribe',
      path: '/api/tribes',
      url: process.env.TRIBE_SERVICE_URL || 'http://tribe-service:3003',
      requiresAuth: true,
      rateLimitTier: 'standard'
    },
    {
      name: 'matching',
      path: '/api/matching',
      url: process.env.MATCHING_SERVICE_URL || 'http://matching-service:3004',
      requiresAuth: true,
      rateLimitTier: 'standard'
    },
    {
      name: 'event',
      path: '/api/events',
      url: process.env.EVENT_SERVICE_URL || 'http://event-service:3005',
      requiresAuth: true,
      rateLimitTier: 'standard'
    },
    {
      name: 'engagement',
      path: '/api/engagement',
      url: process.env.ENGAGEMENT_SERVICE_URL || 'http://engagement-service:3006',
      requiresAuth: true,
      rateLimitTier: 'standard'
    },
    {
      name: 'planning',
      path: '/api/planning',
      url: process.env.PLANNING_SERVICE_URL || 'http://planning-service:3007',
      requiresAuth: true,
      rateLimitTier: 'standard'
    },
    {
      name: 'payment',
      path: '/api/payments',
      url: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3008',
      requiresAuth: true,
      rateLimitTier: 'critical'
    },
    {
      name: 'notification',
      path: '/api/notifications',
      url: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3009',
      requiresAuth: true,
      rateLimitTier: 'standard'
    },
    {
      name: 'ai-orchestration',
      path: '/api/ai',
      url: process.env.AI_ORCHESTRATION_SERVICE_URL || 'http://ai-orchestration-service:3010',
      requiresAuth: true,
      rateLimitTier: 'standard'
    }
  ]
};

/**
 * CORS configuration for the API Gateway
 * Controls which origins, methods, and headers are allowed
 */
export const corsOptions: CorsOptions = {
  origin: (() => {
    const configuredOrigin = env.CORS_ORIGIN;
    if (configuredOrigin) {
      return configuredOrigin === '*' ? '*' : configuredOrigin.split(',');
    }
    return env.NODE_ENV === 'production' ? false : '*';
  })(),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-ID'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

/**
 * Rate limiting configuration for different API tiers
 * Controls how many requests clients can make in a given time window
 */
export const rateLimitOptions = {
  tiers: {
    // Standard API endpoints
    standard: {
      windowMs: Number(env.API_RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
      max: Number(env.API_RATE_LIMIT) || 100, // 100 requests per minute
      message: 'Too many requests, please try again later'
    },
    // Authentication endpoints (more restricted to prevent brute force)
    auth: {
      windowMs: 60000, // 1 minute
      max: 20, // 20 requests per minute
      message: 'Too many authentication attempts, please try again later'
    },
    // Critical operations like payments
    critical: {
      windowMs: 60000, // 1 minute
      max: 50, // 50 requests per minute
      message: 'Too many requests to critical service, please try again later'
    },
    // Higher limits for premium users
    premium: {
      windowMs: 60000, // 1 minute
      max: 300, // 300 requests per minute
      message: 'Rate limit exceeded for premium tier'
    },
    // Administrative endpoints
    admin: {
      windowMs: 60000, // 1 minute
      max: 600, // 600 requests per minute
      message: 'Rate limit exceeded for admin tier'
    }
  }
};

/**
 * Validates API Gateway specific configuration settings
 * 
 * @returns True if all configuration is valid
 * @throws Error if any configuration validation fails
 */
function validateApiGatewayConfig(): boolean {
  try {
    // Check that required environment variables are set
    if (!env.PORT) {
      logger.warn('PORT environment variable not set, using default port 3000');
    }

    // Validate service registry
    if (!serviceRegistry.services || serviceRegistry.services.length === 0) {
      throw new Error('Service registry must contain at least one service');
    }

    // Validate all service URLs
    for (const service of serviceRegistry.services) {
      try {
        new URL(service.url);
      } catch (e) {
        throw new Error(`Invalid URL for service ${service.name}: ${service.url}`);
      }
    }

    // Validate CORS configuration
    if (!corsOptions) {
      throw new Error('CORS configuration is required');
    }

    // Validate rate limit configuration
    if (!rateLimitOptions || !rateLimitOptions.tiers || !rateLimitOptions.tiers.standard) {
      throw new Error('Rate limit configuration is required');
    }

    logger.info('API Gateway configuration validated successfully');
    return true;
  } catch (error) {
    logger.error('API Gateway configuration validation failed', error as Error);
    throw error;
  }
}

/**
 * Initializes the API Gateway configuration and validates required settings
 * 
 * @returns Promise that resolves to true if configuration is valid
 * @throws Error if any configuration validation fails
 */
async function initializeApiGatewayConfig(): Promise<boolean> {
  try {
    // Validate base configuration
    validateConfiguration();
    
    // Validate API Gateway specific configuration
    validateApiGatewayConfig();
    
    // Initialize any API Gateway specific resources
    
    logger.info('API Gateway configuration initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize API Gateway configuration', error as Error);
    throw error;
  }
}

/**
 * Performs cleanup of any resources initialized by the API Gateway configuration
 * 
 * @returns Promise that resolves when cleanup is complete
 */
async function shutdownApiGatewayConfig(): Promise<void> {
  try {
    // Release any resources held by the API Gateway
    
    logger.info('API Gateway configuration shutdown successfully');
  } catch (error) {
    logger.error('Error during API Gateway configuration shutdown', error as Error);
    // Don't throw during shutdown to prevent crash
  }
}

// Export the configuration
export default {
  // Re-export base configuration
  env,
  logging,
  secrets,
  
  // API Gateway specific configuration
  serviceRegistry,
  corsOptions,
  rateLimitOptions,
  
  // Functions
  initializeApiGatewayConfig,
  shutdownApiGatewayConfig
};