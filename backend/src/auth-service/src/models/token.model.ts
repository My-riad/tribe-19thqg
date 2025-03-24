/**
 * Token Model
 * 
 * Defines the database model and operations for authentication tokens in the Tribe application.
 * Handles token creation, retrieval, blacklisting, and cleanup operations, serving as
 * the data access layer for token-related functionality in the authentication service.
 */

import database from '../../../config/database';

/**
 * Enum defining the different types of tokens used in the authentication system
 */
export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
  VERIFICATION = 'VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET'
}

/**
 * Interface defining the structure of a token entity
 */
export interface IToken {
  id: string;
  userId: string;
  token: string;
  type: TokenType;
  expiresAt: Date;
  blacklisted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface defining the data required to create a new token
 */
export interface ITokenCreate {
  userId: string;
  token: string;
  type: TokenType;
  expiresAt: Date;
}

/**
 * Creates a new token in the database
 * 
 * @param tokenData - Data for the token to be created
 * @returns The created token
 */
const create = async (tokenData: ITokenCreate): Promise<IToken> => {
  return await database.prisma.token.create({
    data: {
      userId: tokenData.userId,
      token: tokenData.token,
      type: tokenData.type,
      expiresAt: tokenData.expiresAt,
      blacklisted: false
    }
  });
};

/**
 * Finds a token by its ID
 * 
 * @param id - The token ID to find
 * @returns The found token or null if not found
 */
const findById = async (id: string): Promise<IToken | null> => {
  return await database.prisma.token.findUnique({
    where: { id }
  });
};

/**
 * Finds a token by its token string and type
 * 
 * @param token - The token string to find
 * @param type - The type of token
 * @returns The found token or null if not found
 */
const findByToken = async (token: string, type: TokenType): Promise<IToken | null> => {
  return await database.prisma.token.findFirst({
    where: {
      token,
      type
    }
  });
};

/**
 * Finds tokens for a specific user and type
 * 
 * @param userId - The user ID to find tokens for
 * @param type - The type of tokens to find
 * @returns Array of tokens matching the criteria
 */
const findByUserAndType = async (userId: string, type: TokenType): Promise<IToken[]> => {
  return await database.prisma.token.findMany({
    where: {
      userId,
      type
    }
  });
};

/**
 * Blacklists a token to prevent its further use
 * 
 * @param token - The token string to blacklist
 * @returns The updated token or null if not found
 */
const blacklist = async (token: string): Promise<IToken | null> => {
  const existingToken = await database.prisma.token.findFirst({
    where: { token }
  });

  if (!existingToken) {
    return null;
  }

  return await database.prisma.token.update({
    where: { id: existingToken.id },
    data: { blacklisted: true }
  });
};

/**
 * Deletes all tokens for a specific user and type
 * 
 * @param userId - The user ID to delete tokens for
 * @param type - The type of tokens to delete
 * @returns The number of tokens deleted
 */
const deleteByUserAndType = async (userId: string, type: TokenType): Promise<number> => {
  const result = await database.prisma.token.deleteMany({
    where: {
      userId,
      type
    }
  });

  return result.count;
};

/**
 * Deletes all expired tokens from the database
 * 
 * @returns The number of tokens deleted
 */
const deleteExpired = async (): Promise<number> => {
  const result = await database.prisma.token.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });

  return result.count;
};

/**
 * Checks if a token is blacklisted
 * 
 * @param token - The token string to check
 * @returns True if the token is blacklisted, false otherwise
 */
const isBlacklisted = async (token: string): Promise<boolean> => {
  const existingToken = await database.prisma.token.findFirst({
    where: { token }
  });

  return existingToken ? existingToken.blacklisted : false;
};

/**
 * Checks if a token is expired
 * 
 * @param token - The token entity to check
 * @returns True if the token is expired, false otherwise
 */
const isExpired = (token: IToken): boolean => {
  return new Date() > token.expiresAt;
};

/**
 * Provides methods for token CRUD operations and token management
 */
export const TokenModel = {
  create,
  findById,
  findByToken,
  findByUserAndType,
  blacklist,
  deleteByUserAndType,
  deleteExpired,
  isBlacklisted,
  isExpired
};