/**
 * Utility functions for JWT token generation, verification, and management in the Tribe authentication service.
 * This module provides core token functionality including generating access and refresh tokens, 
 * verifying tokens, and handling token blacklisting.
 */

import * as jwt from 'jsonwebtoken'; // v9.0.0
import * as crypto from 'crypto'; // built-in

import { TokenModel, TokenType, IToken, ITokenCreate } from '../models/token.model';
import { AuthError } from '../../../shared/src/errors/auth.error';
import { IUser } from '../../../shared/src/types/user.types';
import config from '../config';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Generates a JWT access token for a user
 * 
 * @param user - The user to generate a token for
 * @returns JWT access token string
 */
export const generateAccessToken = (user: IUser): string => {
  const authConfig = config.getAuthConfig();
  
  // Create payload with essential user information
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    type: TokenType.ACCESS
  };
  
  // Set expiration based on configuration
  const expiresIn = authConfig.jwtExpiresIn;
  
  // Sign the token with JWT secret
  const token = jwt.sign(payload, authConfig.jwtSecret, { expiresIn });
  
  // Store token in database for tracking and potential revocation
  const expirationDate = calculateExpirationDate(expiresIn);
  
  // Store token in database (async, but we don't need to await it here)
  TokenModel.create({
    userId: user.id,
    token,
    type: TokenType.ACCESS,
    expiresAt: expirationDate
  });
  
  return token;
};

/**
 * Generates a JWT refresh token for a user
 * 
 * @param user - The user to generate a refresh token for
 * @returns JWT refresh token string
 */
export const generateRefreshToken = (user: IUser): string => {
  const authConfig = config.getAuthConfig();
  
  // Create payload with minimal user information
  const payload = {
    id: user.id,
    type: TokenType.REFRESH
  };
  
  // Set expiration based on configuration (longer than access token)
  const expiresIn = authConfig.jwtRefreshExpiresIn;
  
  // Sign the token with JWT secret
  const token = jwt.sign(payload, authConfig.jwtSecret, { expiresIn });
  
  // Store token in database for tracking and potential revocation
  const expirationDate = calculateExpirationDate(expiresIn);
  
  // Store token in database (async, but we don't need to await it here)
  TokenModel.create({
    userId: user.id,
    token,
    type: TokenType.REFRESH,
    expiresAt: expirationDate
  });
  
  return token;
};

/**
 * Verifies a JWT token and returns the decoded payload
 * 
 * @param token - The token to verify
 * @returns Decoded token payload
 * @throws AuthError if token is invalid or expired
 */
export const verifyToken = (token: string): any => {
  const authConfig = config.getAuthConfig();
  
  try {
    // Verify token with JWT secret
    const decoded = jwt.verify(token, authConfig.jwtSecret);
    return decoded;
  } catch (error) {
    logger.debug(`Token verification failed: ${(error as Error).message}`);
    
    // Check if error is due to expiration
    if ((error as Error).name === 'TokenExpiredError') {
      throw AuthError.tokenExpired();
    }
    
    // All other verification errors
    throw AuthError.invalidToken();
  }
};

/**
 * Blacklists a token to prevent its further use
 * 
 * @param token - The token to blacklist
 * @returns Promise resolving to true if token was successfully blacklisted, false otherwise
 */
export const blacklistToken = async (token: string): Promise<boolean> => {
  try {
    // Verify token first to ensure it's valid
    const decoded = verifyToken(token);
    
    // Blacklist the token in the database
    const blacklisted = await TokenModel.blacklist(token);
    
    return !!blacklisted;
  } catch (error) {
    logger.error('Failed to blacklist token', error as Error);
    return false;
  }
};

/**
 * Checks if a token is blacklisted in the database
 * 
 * @param token - The token to check
 * @returns Promise resolving to true if token is blacklisted, false otherwise
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    // Try to find and verify the token as access token
    let tokenEntity = await TokenModel.findByToken(token, TokenType.ACCESS);
    
    // If not found as access token, try as refresh token
    if (!tokenEntity) {
      tokenEntity = await TokenModel.findByToken(token, TokenType.REFRESH);
    }
    
    // Return true if token is found and blacklisted, false otherwise
    return tokenEntity ? tokenEntity.blacklisted : false;
  } catch (error) {
    logger.error('Error checking token blacklist status', error as Error);
    return false;
  }
};

/**
 * Generates a secure random token for verification or password reset
 * 
 * @param length - The length of the token in bytes (default: 32)
 * @returns Secure random token string
 */
export const generateRandomToken = (length: number = 32): string => {
  // Generate random bytes
  const bytes = crypto.randomBytes(length);
  
  // Convert to hexadecimal string
  return bytes.toString('hex');
};

/**
 * Calculates an expiration date based on a time string
 * 
 * @param expiresIn - Expiration time string (e.g., '15m', '7d')
 * @returns Calculated expiration date
 */
export const calculateExpirationDate = (expiresIn: string): Date => {
  const milliseconds = parseTokenExpiration(expiresIn);
  const expirationDate = new Date(Date.now() + milliseconds);
  return expirationDate;
};

/**
 * Parses token expiration string into milliseconds
 * 
 * @param expiresIn - Expiration time string (e.g., '15m', '7d')
 * @returns Expiration time in milliseconds
 */
export const parseTokenExpiration = (expiresIn: string): number => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
      case 's':
        return value * 1000; // seconds to milliseconds
      case 'm':
        return value * 60 * 1000; // minutes to milliseconds
      case 'h':
        return value * 60 * 60 * 1000; // hours to milliseconds
      case 'd':
        return value * 24 * 60 * 60 * 1000; // days to milliseconds
      default:
        logger.warn(`Unknown time unit "${unit}" in expiration string. Defaulting to 15 minutes.`);
        return 15 * 60 * 1000; // default to 15 minutes
    }
  }
  
  logger.warn(`Failed to parse expiration string "${expiresIn}". Defaulting to 15 minutes.`);
  return 15 * 60 * 1000; // default to 15 minutes
};