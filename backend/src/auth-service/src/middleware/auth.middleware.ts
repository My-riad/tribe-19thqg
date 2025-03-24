/**
 * Authentication Middleware
 * 
 * Provides middleware functions for authenticating and authorizing requests
 * in the Tribe authentication service. This module implements JWT-based
 * authentication and role-based access control.
 */

import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { verifyToken, isTokenBlacklisted } from '../utils/token.util';
import { AuthError } from '../../../shared/src/errors/auth.error';
import { UserRole } from '../../../shared/src/types/user.types';
import { logger } from '../../../shared/src/utils/logger.util';
import config from '../config';

/**
 * Extends Express Request interface to include authenticated user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Middleware that authenticates requests by validating JWT tokens
 * 
 * Extracts JWT token from the Authorization header, verifies its validity,
 * and attaches the authenticated user to the request object.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw AuthError.invalidToken('Authorization header is missing');
    }

    // Extract the token from the header
    const token = extractTokenFromHeader(authHeader);

    // Check if token has been blacklisted (logged out)
    if (await isTokenBlacklisted(token)) {
      logger.debug(`Rejected blacklisted token: ${token.substring(0, 10)}...`);
      throw AuthError.invalidToken('Token has been revoked');
    }

    // Verify the token and extract payload
    const decodedToken = verifyToken(token);

    // Check token type to ensure it's an access token
    if (decodedToken.type !== 'ACCESS') {
      throw AuthError.invalidToken('Invalid token type');
    }

    // Attach user information to the request
    req.user = {
      id: decodedToken.id,
      email: decodedToken.email,
      role: decodedToken.role
    };

    logger.debug(`User authenticated: ${req.user.id}, role: ${req.user.role}`);
    next();
  } catch (error) {
    // Handle known token errors
    if (error instanceof AuthError) {
      next(error);
    } else {
      // Convert unknown errors to AuthError
      logger.error('Authentication error', error as Error);
      next(AuthError.invalidToken());
    }
  }
};

/**
 * Middleware factory for role-based access control
 * 
 * Returns a middleware function that checks if the authenticated user's role
 * is included in the allowed roles array.
 * 
 * @param allowedRoles - Array of user roles that are permitted to access the route
 * @returns Middleware function that enforces role-based access control
 */
export const roleAuthMiddleware = (allowedRoles: UserRole[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure the user is authenticated (authMiddleware should run first)
      if (!req.user) {
        throw AuthError.invalidToken('Authentication required');
      }

      // Check if the user's role is included in the allowed roles
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }

      // If role not allowed, throw forbidden error
      logger.debug(`Access denied for user ${req.user.id} with role ${req.user.role}. Required roles: ${allowedRoles.join(', ')}`);
      throw AuthError.forbidden(`Role ${req.user.role} is not authorized to access this resource`);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Convenience middleware that restricts access to admin users only
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const adminOnly = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return roleAuthMiddleware([UserRole.ADMIN])(req, res, next);
};

/**
 * Extracts the JWT token from the Authorization header
 * 
 * @param authHeader - The Authorization header string
 * @returns The extracted JWT token
 * @throws AuthError if the header format is invalid
 */
export const extractTokenFromHeader = (authHeader: string): string => {
  // Check if the header exists
  if (!authHeader) {
    throw AuthError.invalidToken('Authorization header is missing');
  }

  // Split the header to separate 'Bearer' from the token
  const parts = authHeader.split(' ');

  // Verify the header follows the 'Bearer TOKEN' format
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw AuthError.invalidToken('Authorization header must use Bearer scheme');
  }

  return parts[1];
};