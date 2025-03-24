import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError } from '../errors/api.error';
import { ValidationError } from '../errors/validation.error';
import { DatabaseError } from '../errors/database.error';
import { AuthError } from '../errors/auth.error';
import { HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES } from '../constants/error.constants';
import { logger } from '../utils/logger.util';

/**
 * Express middleware for handling 404 Not Found errors for non-existent routes
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const error = ApiError.notFound(`Route not found: ${req.originalUrl || req.url}`);
  next(error);
};

/**
 * Express middleware for centralized error handling across the application
 * Processes errors and sends standardized API responses
 * 
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorMiddleware: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: ApiError;

  // Determine the appropriate error type
  if (err instanceof ApiError) {
    // Already an ApiError instance, use as is
    error = err;
  } 
  // Check for specific error types to provide better error handling
  else if (err instanceof ValidationError) {
    error = err;
  }
  else if (err instanceof DatabaseError) {
    error = err;
  }
  else if (err instanceof AuthError) {
    error = err;
  }
  // Convert generic Error to ApiError
  else {
    error = ApiError.fromError(err);
  }

  // Log the error with contextual information
  const correlationId = req.headers['x-correlation-id'] || 'unknown';
  logger.error(`Error processing request: ${error.message}`, error, {
    correlationId,
    path: req.originalUrl || req.url,
    method: req.method,
    statusCode: error.statusCode,
    errorCode: error.code,
    ip: req.ip,
    userId: (req as any).user?.id
  });

  // Send the standardized error response
  res.status(error.statusCode).json(error.toJSON());
};