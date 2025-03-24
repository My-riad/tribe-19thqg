/**
 * Token Service
 * 
 * High-level service that provides token management functionality for the Tribe platform's
 * authentication system. This service abstracts token generation, validation, and lifecycle
 * management operations, implementing business logic for JWT access tokens, refresh tokens,
 * and special-purpose tokens like verification and password reset tokens.
 */

import { TokenModel, TokenType, IToken } from '../models/token.model';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken, 
  blacklistToken, 
  generateRandomToken,
  calculateExpirationDate
} from '../utils/token.util';
import { IUser } from '../../../shared/src/types/user.types';
import { AuthError } from '../../../shared/src/errors/auth.error';
import config from '../config';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Generates a pair of access and refresh tokens for a user
 * 
 * @param user - The user to generate tokens for
 * @returns Object containing access and refresh tokens
 */
const generateTokens = async (user: IUser): Promise<{ access: string; refresh: string }> => {
  logger.debug(`Generating tokens for user ${user.id}`);
  
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  return {
    access: accessToken,
    refresh: refreshToken
  };
};

/**
 * Refreshes an access token using a valid refresh token
 * 
 * @param refreshToken - The refresh token to use
 * @returns New access and refresh tokens
 * @throws AuthError if the refresh token is invalid or blacklisted
 */
const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    // Verify the refresh token
    const decoded = verifyToken(refreshToken);
    
    // Check if the token type is correct
    if (decoded.type !== TokenType.REFRESH) {
      logger.warn(`Invalid token type for refresh: ${decoded.type}`);
      throw AuthError.invalidToken();
    }
    
    // Check if the token is blacklisted
    const isBlacklisted = await TokenModel.isBlacklisted(refreshToken);
    if (isBlacklisted) {
      logger.warn(`Refresh token is blacklisted: ${refreshToken.substring(0, 10)}...`);
      throw AuthError.invalidToken();
    }
    
    // Extract user ID from the token
    const userId = decoded.id;
    
    // Blacklist the used refresh token for security (single-use refresh tokens)
    await blacklistToken(refreshToken);
    logger.debug(`Blacklisted used refresh token for user ${userId}`);
    
    // Fetch the user to generate new tokens
    // In a real implementation, you would fetch the full user object
    // from the user service or database
    const user: IUser = { 
      id: userId,
      email: decoded.email || '', // May not be in refresh token
      role: decoded.role // May need to fetch from user service
    };
    
    // Generate new tokens
    const tokens = await generateTokens(user);
    logger.info(`Successfully refreshed tokens for user ${userId}`);
    
    return {
      accessToken: tokens.access,
      refreshToken: tokens.refresh
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    
    logger.error('Failed to refresh access token', error as Error);
    throw AuthError.invalidToken();
  }
};

/**
 * Verifies an access token and returns the decoded payload
 * 
 * @param token - The access token to verify
 * @returns Decoded token payload
 * @throws AuthError if the token is invalid or blacklisted
 */
const verifyAccessToken = async (token: string): Promise<any> => {
  try {
    // Verify the token
    const decoded = verifyToken(token);
    
    // Check if the token type is correct
    if (decoded.type !== TokenType.ACCESS) {
      logger.warn(`Invalid token type for access: ${decoded.type}`);
      throw AuthError.invalidToken();
    }
    
    // Check if the token is blacklisted
    const isBlacklisted = await TokenModel.isBlacklisted(token);
    if (isBlacklisted) {
      logger.warn(`Access token is blacklisted: ${token.substring(0, 10)}...`);
      throw AuthError.invalidToken();
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    
    logger.error('Failed to verify access token', error as Error);
    
    if ((error as Error).name === 'TokenExpiredError') {
      throw AuthError.tokenExpired();
    }
    
    throw AuthError.invalidToken();
  }
};

/**
 * Invalidates a token by adding it to the blacklist
 * 
 * @param token - The token to invalidate
 * @returns True if token was successfully invalidated
 */
const invalidateToken = async (token: string): Promise<boolean> => {
  try {
    logger.debug(`Attempting to invalidate token: ${token.substring(0, 10)}...`);
    
    // Blacklist the token
    const result = await blacklistToken(token);
    
    if (result) {
      logger.info(`Token successfully invalidated: ${token.substring(0, 10)}...`);
    } else {
      logger.warn(`Failed to invalidate token: ${token.substring(0, 10)}...`);
    }
    
    return result;
  } catch (error) {
    logger.error('Error during token invalidation', error as Error);
    return false;
  }
};

/**
 * Invalidates all tokens for a specific user
 * 
 * @param userId - ID of the user whose tokens should be invalidated
 * @returns Number of tokens invalidated
 */
const invalidateAllUserTokens = async (userId: string): Promise<number> => {
  logger.debug(`Invalidating all tokens for user: ${userId}`);
  
  try {
    // Delete all access tokens for the user
    const accessTokensDeleted = await TokenModel.deleteByUserAndType(userId, TokenType.ACCESS);
    logger.debug(`Deleted ${accessTokensDeleted} access tokens for user ${userId}`);
    
    // Delete all refresh tokens for the user
    const refreshTokensDeleted = await TokenModel.deleteByUserAndType(userId, TokenType.REFRESH);
    logger.debug(`Deleted ${refreshTokensDeleted} refresh tokens for user ${userId}`);
    
    const totalDeleted = accessTokensDeleted + refreshTokensDeleted;
    logger.info(`Invalidated ${totalDeleted} tokens for user ${userId}`);
    
    return totalDeleted;
  } catch (error) {
    logger.error(`Failed to invalidate tokens for user ${userId}`, error as Error);
    throw error;
  }
};

/**
 * Generates a verification token for email verification
 * 
 * @param userId - ID of the user to generate token for
 * @returns Generated verification token
 */
const generateVerificationToken = async (userId: string): Promise<string> => {
  logger.debug(`Generating verification token for user: ${userId}`);
  
  try {
    // Generate a secure random token
    const token = generateRandomToken();
    
    // Set expiration to 24 hours from now
    const expiresAt = calculateExpirationDate('24h');
    
    // Store the token in the database
    await TokenModel.create({
      userId,
      token,
      type: TokenType.VERIFICATION,
      expiresAt
    });
    
    logger.info(`Verification token generated for user ${userId}, expires at ${expiresAt}`);
    return token;
  } catch (error) {
    logger.error(`Failed to generate verification token for user ${userId}`, error as Error);
    throw error;
  }
};

/**
 * Generates a password reset token
 * 
 * @param userId - ID of the user to generate token for
 * @returns Object containing the generated token and its expiration date
 */
const generatePasswordResetToken = async (userId: string): Promise<{ token: string; expiresAt: Date }> => {
  logger.debug(`Generating password reset token for user: ${userId}`);
  
  try {
    // Generate a secure random token
    const token = generateRandomToken();
    
    // Set expiration to 1 hour from now
    const expiresAt = calculateExpirationDate('1h');
    
    // Delete any existing password reset tokens for this user
    await TokenModel.deleteByUserAndType(userId, TokenType.PASSWORD_RESET);
    
    // Store the token in the database
    await TokenModel.create({
      userId,
      token,
      type: TokenType.PASSWORD_RESET,
      expiresAt
    });
    
    logger.info(`Password reset token generated for user ${userId}, expires at ${expiresAt}`);
    return { token, expiresAt };
  } catch (error) {
    logger.error(`Failed to generate password reset token for user ${userId}`, error as Error);
    throw error;
  }
};

/**
 * Verifies a special-purpose token (verification or password reset)
 * 
 * @param token - The token to verify
 * @param type - The expected token type
 * @returns User ID associated with the token
 * @throws AuthError if the token is invalid or expired
 */
const verifySpecialToken = async (token: string, type: TokenType): Promise<string> => {
  logger.debug(`Verifying ${type} token: ${token.substring(0, 10)}...`);
  
  try {
    // Find the token in the database
    const tokenEntity = await TokenModel.findByToken(token, type);
    
    // Check if token exists
    if (!tokenEntity) {
      logger.warn(`${type} token not found: ${token.substring(0, 10)}...`);
      throw AuthError.invalidToken();
    }
    
    // Check if token is blacklisted
    if (tokenEntity.blacklisted) {
      logger.warn(`${type} token is blacklisted: ${token.substring(0, 10)}...`);
      throw AuthError.invalidToken();
    }
    
    // Check if token is expired
    if (new Date() > tokenEntity.expiresAt) {
      logger.warn(`${type} token expired at ${tokenEntity.expiresAt}`);
      throw AuthError.tokenExpired();
    }
    
    // Blacklist the token to prevent reuse
    await TokenModel.blacklist(token);
    logger.debug(`${type} token blacklisted after successful verification`);
    
    logger.info(`Successfully verified ${type} token for user ${tokenEntity.userId}`);
    return tokenEntity.userId;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    
    logger.error(`Failed to verify ${type} token`, error as Error);
    throw AuthError.invalidToken();
  }
};

/**
 * Removes expired tokens from the database
 * 
 * @returns Number of tokens removed
 */
const cleanupExpiredTokens = async (): Promise<number> => {
  logger.debug('Cleaning up expired tokens');
  
  try {
    // Delete expired tokens
    const count = await TokenModel.deleteExpired();
    logger.info(`Removed ${count} expired tokens`);
    return count;
  } catch (error) {
    logger.error('Failed to clean up expired tokens', error as Error);
    throw error;
  }
};

/**
 * Provides comprehensive token management functionality for the Tribe platform's
 * authentication system.
 */
export const TokenService = {
  generateTokens,
  refreshAccessToken,
  verifyAccessToken,
  invalidateToken,
  invalidateAllUserTokens,
  generateVerificationToken,
  generatePasswordResetToken,
  verifySpecialToken,
  cleanupExpiredTokens
};