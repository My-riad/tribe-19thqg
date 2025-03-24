import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import * as jwt from 'jsonwebtoken'; // ^9.0.0
import { serviceRegistry, env } from '../config';
import { logger } from '../../../shared/src/utils/logger.util';
import { AuthError } from '../../../shared/src/errors/auth.error';
import { UserRole } from '../../../shared/src/types/user.types';

/**
 * Interface extending Express Request to include authenticated user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Express middleware that authenticates requests by validating JWT tokens
 * 
 * This middleware checks if the target service requires authentication,
 * validates the JWT token, and attaches the user object to the request.
 * 
 * @param req - Express request object
 * @param res - Express response object 
 * @param next - Express next function
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Determine which service is being accessed based on the request path
    const targetService = getTargetService(req.path);
    
    // If no service match or service doesn't require authentication, skip
    if (!targetService || !targetService.requiresAuth) {
      logger.debug(`Authentication not required for path: ${req.path}`);
      return next();
    }
    
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.debug('Missing Authorization header');
      throw AuthError.invalidToken();
    }
    
    // Extract token from authorization header
    const token = extractTokenFromHeader(authHeader);
    
    // Verify token
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email: string;
        role: UserRole;
      };
      
      // Attach user information to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      
      logger.debug(`User authenticated: ${decoded.id}, role: ${decoded.role}`);
      next();
    } catch (error) {
      if ((error as Error).name === 'TokenExpiredError') {
        throw AuthError.tokenExpired();
      } else {
        throw AuthError.invalidToken();
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory that creates a role-based authorization middleware
 * 
 * @param allowedRoles - Array of roles allowed to access the resource
 * @returns Express middleware function that checks user roles
 */
export const roleAuthMiddleware = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Authentication middleware should run first, so req.user should exist
      if (!req.user) {
        logger.debug('Role check failed: User not authenticated');
        throw AuthError.invalidToken();
      }

      // Check if the user's role is included in the allowed roles
      if (allowedRoles.includes(req.user.role)) {
        logger.debug(`Role check passed: ${req.user.role} is allowed`);
        return next();
      }

      // If user's role is not allowed, throw forbidden error
      logger.debug(`Role check failed: ${req.user.role} is not allowed. Required: ${allowedRoles.join(', ')}`);
      throw AuthError.forbidden(`Access denied. Required role: ${allowedRoles.join(', ')}`);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Extracts the JWT token from the Authorization header
 * 
 * @param authHeader - The Authorization header value
 * @returns The extracted JWT token
 * @throws AuthError if header format is invalid
 */
function extractTokenFromHeader(authHeader: string): string {
  // Authorization header should be in format "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.debug('Invalid Authorization header format');
    throw AuthError.invalidToken('Invalid Authorization header format. Expected "Bearer <token>"');
  }
  
  return parts[1];
}

/**
 * Determines the target microservice based on the request path
 * 
 * @param path - The request path
 * @returns Service configuration object or null if not found
 */
function getTargetService(path: string): { name: string; requiresAuth: boolean } | null {
  for (const service of serviceRegistry.services) {
    if (path.startsWith(service.path)) {
      logger.debug(`Path ${path} matches service: ${service.name}`);
      return service;
    }
  }
  
  logger.debug(`No service match found for path: ${path}`);
  return null;
}