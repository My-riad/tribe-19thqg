/**
 * Rate Limiting Middleware for the API Gateway
 * 
 * This middleware implements rate limiting for the API Gateway to prevent abuse and ensure
 * fair usage of the Tribe platform's APIs. It provides different rate limiting tiers based
 * on service criticality and user roles.
 * 
 * @module rate-limit.middleware
 */

import rateLimit from 'express-rate-limit'; // ^6.7.0
import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { RedisStore } from 'rate-limit-redis'; // ^3.0.0
import { createClient } from 'redis'; // ^4.6.6
import { rateLimitOptions, env } from '../config';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Defines the available rate limit tiers
 */
interface RateLimitTier {
  windowMs: number;  // Time window in milliseconds for rate limiting
  max: number;       // Maximum number of requests allowed in the window
  message: string;   // Error message to display when rate limit is exceeded
}

/**
 * Configuration options for rate limiting
 */
interface RateLimitOptions {
  tiers: Record<string, RateLimitTier>;  // Map of tier names to their rate limit configurations
  redisEnabled?: boolean;                // Whether to use Redis for distributed rate limiting
  redisUrl?: string;                     // Redis connection URL for distributed rate limiting
  ipWhitelist?: string[];               // List of IP addresses exempt from rate limiting
}

/**
 * Creates a Redis store for distributed rate limiting
 * 
 * @returns Redis store instance or undefined if Redis is not available
 */
const createRedisStore = (): RedisStore | undefined => {
  // Check if Redis is enabled in the environment
  if (!env.REDIS_ENABLED) {
    logger.debug('Redis store for rate limiting is disabled');
    return undefined;
  }

  try {
    // Create Redis client with connection details from environment
    const client = createClient({
      url: env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    });

    // Handle Redis connection errors
    client.on('error', (err) => {
      logger.warn('Redis client error in rate limiter', { error: err.message });
    });

    // Connect to Redis
    client.connect().catch(err => {
      logger.warn('Failed to connect to Redis for rate limiting', { error: err.message });
    });

    // Configure Redis store with prefix for rate limiting keys
    return new RedisStore({
      prefix: 'tribe-ratelimit:',
      client: client,
      sendCommand: (...args: string[]) => client.sendCommand(args)
    });
  } catch (error) {
    logger.warn('Failed to create Redis store for rate limiting', { error: (error as Error).message });
    return undefined;
  }
};

/**
 * Generates a unique key for rate limiting based on user ID or IP address
 * 
 * @param req - Express request object
 * @returns Unique key for rate limiting
 */
const generateKeyFromRequest = (req: Request): string => {
  // Check if request has authenticated user
  const userId = (req as any).user?.id;
  
  // If user is authenticated, use user ID as part of the key
  if (userId) {
    return `user:${userId}:${req.path}`;
  }
  
  // Otherwise, use IP address as the key
  // Get the IP from X-Forwarded-For header or request.ip
  const ip = (req.headers['x-forwarded-for'] as string || req.ip || '').split(',')[0].trim();
  return `ip:${ip}:${req.path}`;
};

/**
 * Determines if rate limiting should be skipped for certain requests
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @returns True if rate limiting should be skipped, false otherwise
 */
const shouldSkipRateLimit = (req: Request, res: Response): boolean => {
  // Skip rate limiting for health check or metrics endpoints
  if (req.path === '/health' || req.path === '/metrics' || req.path.startsWith('/health/')) {
    return true;
  }
  
  // Skip rate limiting for whitelisted IP addresses
  const ip = (req.headers['x-forwarded-for'] as string || req.ip || '').split(',')[0].trim();
  if (rateLimitOptions.ipWhitelist && rateLimitOptions.ipWhitelist.includes(ip)) {
    return true;
  }
  
  // Skip rate limiting for users with admin role
  if ((req as any).user && (req as any).user.role === 'admin') {
    return true;
  }
  
  return false;
};

/**
 * Custom handler for when rate limit is exceeded
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @param options - Rate limit options
 */
const handleRateLimitExceeded = (req: Request, res: Response, next: NextFunction, options: any): void => {
  // Log rate limit exceeded event with request details
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id
  });
  
  // Set appropriate rate limit headers in response
  res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
  
  // Send 429 Too Many Requests status code
  res.status(429).json({
    error: true,
    code: 'RATE_LIMIT_EXCEEDED',
    message: options.message || 'Too many requests, please try again later',
    retryAfter: Math.ceil(options.windowMs / 1000)
  });
};

/**
 * Configures and returns a rate limiter middleware with the specified options
 * 
 * @param options - Options for the rate limiter
 * @returns Configured rate limiter middleware
 */
const configureRateLimiter = (options: any) => {
  // Merge provided options with default rate limit options
  const mergedOptions = {
    ...options,
    // Configure Redis store if Redis is available in the environment
    store: createRedisStore(),
    // Set up custom key generator based on user ID or IP address
    keyGenerator: generateKeyFromRequest,
    // Configure skip function to bypass rate limiting for certain scenarios
    skip: shouldSkipRateLimit,
    // Set up custom handler for rate limit exceeded events
    handler: handleRateLimitExceeded,
    // Enable standardized headers
    standardHeaders: true,
    // Disable legacy headers
    legacyHeaders: false
  };
  
  // Return configured rate limiter middleware
  return rateLimit(mergedOptions);
};

/**
 * Standard rate limiter for most API endpoints
 * 
 * @returns Express middleware for standard rate limiting
 */
const standardRateLimiter = () => {
  return configureRateLimiter({
    windowMs: rateLimitOptions.tiers.standard.windowMs, // 60000 (1 minute)
    max: rateLimitOptions.tiers.standard.max, // 100 requests per window
    message: rateLimitOptions.tiers.standard.message,
    standardHeaders: true
  });
};

/**
 * Stricter rate limiter for authentication endpoints
 * 
 * @returns Express middleware for authentication rate limiting
 */
const authRateLimiter = () => {
  return configureRateLimiter({
    windowMs: rateLimitOptions.tiers.auth.windowMs, // 60000 (1 minute)
    max: rateLimitOptions.tiers.auth.max, // 20 requests per window
    message: rateLimitOptions.tiers.auth.message,
    standardHeaders: true
  });
};

/**
 * Rate limiter that applies different limits based on service tier
 * 
 * @param tier - The rate limit tier to apply
 * @returns Express middleware for tiered rate limiting
 */
const tieredRateLimiter = (tier: string) => {
  // Validate that the requested tier exists in configuration
  if (!rateLimitOptions.tiers[tier]) {
    logger.warn(`Unknown rate limit tier "${tier}", using standard tier`);
    tier = 'standard';
  }
  
  // Configure rate limiter with the specified tier options
  return configureRateLimiter({
    windowMs: rateLimitOptions.tiers[tier].windowMs,
    max: rateLimitOptions.tiers[tier].max,
    message: rateLimitOptions.tiers[tier].message,
    standardHeaders: true
  });
};

// Export the rate limiter middleware functions
export {
  standardRateLimiter,
  authRateLimiter,
  tieredRateLimiter,
  configureRateLimiter
};