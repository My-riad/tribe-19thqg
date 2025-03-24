/**
 * Request logging middleware for API Gateway
 * 
 * Implements structured logging with correlation IDs for request tracing,
 * timing metrics, and comprehensive log details for API traffic.
 */
import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import onFinished from 'on-finished'; // ^2.4.1
import config, { logging, env } from '../config';
import { logger, createHttpLogger } from '../../../shared/src/utils/logger.util';

/**
 * Extends Express Request interface to include correlation ID
 */
interface RequestWithCorrelation extends Request {
  correlationId: string;
  startTime: number;
}

/**
 * Express middleware that ensures each request has a correlation ID for tracing
 */
export const correlationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = getCorrelationId(req);
  (req as RequestWithCorrelation).correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
};

/**
 * Express middleware that logs HTTP request and response details
 */
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Generate or extract correlation ID from request headers
  const correlationId = getCorrelationId(req);
  (req as RequestWithCorrelation).correlationId = correlationId;
  
  // Set correlation ID in response headers
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Record request start time for duration calculation
  const startTime = Date.now();
  (req as RequestWithCorrelation).startTime = startTime;
  
  // Log incoming request
  logger.info(`Incoming request ${req.method} ${req.path}`, {
    correlationId,
    method: req.method,
    path: req.originalUrl || req.url,
    query: req.query,
    headers: {
      ...req.headers,
      // Mask sensitive headers
      authorization: req.headers.authorization ? '[REDACTED]' : undefined,
      cookie: req.headers.cookie ? '[REDACTED]' : undefined
    },
    ip: req.ip || req.connection.remoteAddress
  });
  
  // Set up response finish handler
  onFinished(res, () => {
    logResponseDetails(req as RequestWithCorrelation, res, startTime);
  });
  
  next();
};

/**
 * Extracts or generates a correlation ID for the request
 */
function getCorrelationId(req: Request): string {
  // Check if request already has X-Correlation-ID header
  const existingCorrelationId = req.header('X-Correlation-ID');
  if (existingCorrelationId) {
    return existingCorrelationId;
  }
  
  // Generate a new UUID v4 as correlation ID
  return uuidv4();
}

/**
 * Logs details about the response after it has been sent
 */
function logResponseDetails(req: RequestWithCorrelation, res: Response, startTime: number): void {
  // Calculate request duration
  const duration = Date.now() - startTime;
  
  // Extract response status code and size
  const statusCode = res.statusCode;
  const contentLength = res.getHeader('content-length');
  
  // Create log entry
  const logEntry = {
    correlationId: req.correlationId,
    method: req.method,
    path: req.originalUrl || req.url,
    statusCode,
    duration: `${duration}ms`,
    contentLength,
    responseTime: duration
  };
  
  // Log at appropriate level based on response status
  if (statusCode >= 500) {
    logger.error(`Request failed: ${req.method} ${req.path} ${statusCode}`, {
      ...logEntry,
      error: (res as any).locals?.error
    });
  } else if (statusCode >= 400) {
    logger.warn(`Request error: ${req.method} ${req.path} ${statusCode}`, logEntry);
  } else {
    logger.info(`Request completed: ${req.method} ${req.path} ${statusCode}`, logEntry);
  }
}

/**
 * Configures and returns the HTTP request logging middleware
 */
export const configureRequestLogging = () => {
  return createHttpLogger({
    // Skip health check and metrics endpoints
    skip: (req, res) => {
      return req.path === '/health' || 
             req.path === '/metrics' || 
             req.path === '/health/live' || 
             req.path === '/health/ready';
    },
    // Format including correlation ID
    format: ':remote-addr :method :url :status :response-time ms - :res[content-length] :correlation-id'
  });
};