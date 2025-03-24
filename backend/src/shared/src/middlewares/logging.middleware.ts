/**
 * Express middleware for request logging and distributed tracing.
 * 
 * Provides:
 * - Correlation ID generation and propagation
 * - Detailed request/response logging
 * - Performance monitoring
 * - PII redaction for sensitive data
 */

import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import morgan from 'morgan'; // ^1.10.0
import { logger, createHttpLogger } from '../utils/logger.util';
import { APP_NAME } from '../constants/app.constants';

/**
 * Header name used for correlation ID propagation across services
 */
export const CORRELATION_ID_HEADER = 'X-Correlation-ID';

/**
 * Extends Express Request interface to include correlation ID and context-aware logger
 */
export interface EnhancedRequest extends Request {
  /**
   * Unique identifier for tracing requests across services
   */
  correlationId?: string;
  
  /**
   * Context-aware logger instance with correlation ID attached
   */
  logger?: typeof logger;
}

/**
 * Middleware that generates and attaches a correlation ID to each request for distributed tracing.
 * If a correlation ID header already exists (from upstream service), it uses that value to
 * maintain the trace across service boundaries.
 */
export function correlationIdMiddleware(req: EnhancedRequest, res: Response, next: NextFunction): void {
  // Check if correlation ID already exists in request headers (from upstream service)
  const existingCorrelationId = req.headers[CORRELATION_ID_HEADER.toLowerCase()];
  
  // Use existing correlation ID or generate a new one
  const correlationId = existingCorrelationId ? 
    existingCorrelationId as string : 
    uuidv4();
  
  // Attach correlation ID to request object for use in handlers
  req.correlationId = correlationId;
  
  // Add correlation ID as response header for client-side tracing
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  
  // Create context-aware logger with correlation ID
  req.logger = logger.withContext({ 
    correlationId,
    service: APP_NAME
  });
  
  next();
}

/**
 * Middleware that logs detailed information about incoming requests and outgoing responses.
 * Includes performance metrics and sanitizes sensitive data.
 */
export function requestLoggingMiddleware(req: EnhancedRequest, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const reqLogger = req.logger || logger;
  const correlationId = req.correlationId || 'unknown';
  const { method, path, query, headers } = req;
  
  // Log incoming request (sanitize headers to remove sensitive information)
  reqLogger.info(`Request received: ${method} ${path}`, {
    type: 'request_start',
    method,
    path,
    query,
    headers: sanitizeHeaders(headers as Record<string, any>),
    correlationId
  });

  // Log request body for non-GET requests (sanitize to remove sensitive data)
  if (method !== 'GET' && req.body) {
    reqLogger.debug('Request body', {
      type: 'request_body',
      body: sanitizeBody(req.body),
      correlationId
    });
  }

  // Capture original response end method
  const originalEnd = res.end;
  
  // Override end method to log response details
  res.end = function(chunk?: any, encoding?: any, callback?: any): Response {
    // Calculate request duration
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Determine log level based on status code
    const logMethod = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    // Log response details with performance metrics
    reqLogger[logMethod](`Response completed: ${method} ${path} ${statusCode}`, {
      type: 'request_completed',
      method,
      path,
      statusCode,
      duration,
      correlationId
    });
    
    // Restore original end method and call it
    res.end = originalEnd;
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
}

/**
 * Middleware that uses Morgan for concise HTTP request logging.
 * Configurable format and skips health check endpoints to reduce noise.
 */
export function httpLoggerMiddleware() {
  return createHttpLogger({
    // Skip health check endpoints to reduce log noise
    skip: (req: Request) => {
      return req.url === '/health' || 
        req.url === '/health/live' || 
        req.url === '/health/ready';
    }
  });
}

/**
 * Removes sensitive information from request headers before logging
 * 
 * @param headers - Request headers object
 * @returns Sanitized headers object
 */
function sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
  // Create a deep copy of the headers object
  const sanitized = { ...headers };
  
  // List of sensitive headers to redact
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'api-key',
    'jwt',
    'token',
    'refresh-token',
    'secret',
    'password'
  ];
  
  // Redact sensitive header values
  for (const header of Object.keys(sanitized)) {
    if (sensitiveHeaders.includes(header.toLowerCase())) {
      sanitized[header] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Removes sensitive information from request bodies before logging
 * 
 * @param body - Request body object
 * @returns Sanitized body object
 */
function sanitizeBody(body: Record<string, any>): Record<string, any> {
  // Create a deep copy of the body
  const sanitized = JSON.parse(JSON.stringify(body));
  
  // List of sensitive field names to redact
  const sensitiveFields = [
    'password',
    'passwordConfirmation',
    'currentPassword',
    'newPassword',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'jwt',
    'refreshToken',
    'refresh_token',
    'creditCard',
    'credit_card',
    'ccNumber',
    'cc_number',
    'cvv',
    'ssn',
    'socialSecurity'
  ];
  
  // Recursive function to sanitize objects at any depth
  function sanitizeObject(obj: Record<string, any>): void {
    for (const key of Object.keys(obj)) {
      // Check if this is a sensitive field
      if (sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        obj[key] = '[REDACTED]';
      } 
      // Recursively sanitize nested objects
      else if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        sanitizeObject(obj[key]);
      }
      // Sanitize objects in arrays
      else if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any) => {
          if (item && typeof item === 'object') {
            sanitizeObject(item);
          }
        });
      }
    }
  }
  
  sanitizeObject(sanitized);
  return sanitized;
}