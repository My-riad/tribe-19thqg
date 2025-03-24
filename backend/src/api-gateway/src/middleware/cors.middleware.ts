/**
 * CORS Middleware Module
 * 
 * This module implements Cross-Origin Resource Sharing (CORS) for the API Gateway,
 * enabling secure cross-origin requests based on environment settings and security requirements.
 */

import cors from 'cors'; // ^2.8.5
import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import config, { corsOptions, env } from '../config';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Configures and returns the CORS middleware with appropriate options based on environment
 * 
 * @returns Configured CORS middleware
 */
export const configureCors = () => {
  // Get allowed origins based on environment
  const allowedOrigins = parseAllowedOrigins();

  // Log the CORS configuration
  logger.info('CORS configured with the following options:', {
    allowedOrigins: Array.isArray(allowedOrigins) ? allowedOrigins.join(', ') : allowedOrigins,
    methods: corsOptions.methods?.join(', '),
    allowedHeaders: corsOptions.allowedHeaders?.join(', '),
    exposedHeaders: corsOptions.exposedHeaders?.join(', '),
    credentials: corsOptions.credentials,
    maxAge: corsOptions.maxAge
  });

  // Create CORS options with dynamic origin validation
  const options = { ...corsOptions };
  
  // If origin isn't already a function, create an origin validator function
  if (typeof options.origin !== 'function') {
    options.origin = (origin, callback) => {
      if (validateOrigin(origin as string, allowedOrigins)) {
        callback(null, true);
      } else {
        logger.warn(`CORS request from unauthorized origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    };
  }

  // Return configured CORS middleware
  return cors(options);
};

/**
 * Validates if the request origin is allowed based on configured allowed origins
 * 
 * @param origin - Request origin
 * @param allowedOrigins - Array of allowed origins or '*'
 * @returns True if origin is allowed, false otherwise
 */
const validateOrigin = (origin: string, allowedOrigins: string[] | string): boolean => {
  // Same-origin requests have no origin header
  if (!origin) {
    return true;
  }

  // Allow all origins if wildcard
  if (allowedOrigins === '*') {
    return true;
  }

  // Check if the specific origin is allowed in the array
  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
  }

  return false;
};

/**
 * Parses the allowed origins from environment configuration
 * 
 * @returns Array of allowed origins or '*'
 */
const parseAllowedOrigins = (): string[] | string => {
  // If configured origin is already processed in corsOptions, use that
  if (corsOptions.origin) {
    if (typeof corsOptions.origin === 'string') {
      return corsOptions.origin;
    } else if (Array.isArray(corsOptions.origin)) {
      return corsOptions.origin;
    }
  }

  // Get CORS_ORIGIN from environment
  const corsOrigin = env.CORS_ORIGIN;
  
  if (corsOrigin) {
    // If it's a wildcard, return that
    if (corsOrigin === '*') {
      return '*';
    }
    
    // Otherwise, split by comma and trim each origin
    return corsOrigin.split(',').map(origin => origin.trim());
  }
  
  // Development defaults to permissive, production to restrictive
  return env.NODE_ENV === 'development' ? '*' : [];
};

/**
 * Express middleware that handles CORS preflight requests and applies CORS headers
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Log CORS requests in debug mode
  logger.debug(`CORS request: ${req.method} ${req.path}`, {
    origin: req.headers.origin
  });
  
  // Apply CORS middleware (handles preflight requests automatically)
  const corsHandler = configureCors();
  corsHandler(req, res, next);
};