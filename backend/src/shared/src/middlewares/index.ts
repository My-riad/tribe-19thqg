/**
 * Centralized export file for middleware components.
 * 
 * This module aggregates all shared middleware functions used across the Tribe platform's
 * microservices, providing a single import point for consistent request handling.
 * 
 * @module middlewares
 */

// Error handling middleware
import { errorMiddleware, notFoundMiddleware } from './error.middleware';

// Logging and tracing middleware
import { 
  correlationIdMiddleware, 
  requestLoggingMiddleware, 
  httpLoggerMiddleware, 
  CORRELATION_ID_HEADER 
} from './logging.middleware';

// Validation middleware
import {
  validateBody,
  validateQuery,
  validateParams,
  validateRequest
} from './validation.middleware';

// Error handling exports
export { 
  errorMiddleware,
  notFoundMiddleware 
};

// Logging and tracing exports
export {
  correlationIdMiddleware,
  requestLoggingMiddleware,
  httpLoggerMiddleware,
  CORRELATION_ID_HEADER
};

// Validation exports
export {
  validateBody,
  validateQuery,
  validateParams,
  validateRequest
};