import { PrismaClient } from '@prisma/client'; // ^4.16.0
import Redis from 'ioredis'; // ^5.3.0
import CompatibilityAlgorithm from '../algorithms/compatibility.algorithm';
import {
  ICompatibilityRequest,
  ICompatibilityBatchRequest,
  ICompatibilityResponse,
  ICompatibilityBatchResponse,
  IUserCompatibility,
  ITribeCompatibility,
  ICompatibilityDetail,
  CompatibilityFactor
} from '../models/compatibility.model';
import {
  IProfile,
} from '../../shared/src/types/profile.types';
import {
  ITribe,
} from '../../shared/src/types/tribe.types';
import { ApiError } from '../../shared/src/errors/api.error';
import { logger } from '../../shared/src/utils/logger.util';

// Default weights for different compatibility factors
const DEFAULT_FACTOR_WEIGHTS = { 
  [CompatibilityFactor.PERSONALITY]: 0.3, 
  [CompatibilityFactor.INTERESTS]: 0.3, 
  [CompatibilityFactor.COMMUNICATION_STYLE]: 0.2, 
  [CompatibilityFactor.LOCATION]: 0.1, 
  [CompatibilityFactor.GROUP_BALANCE]: 0.1 
};

// Default threshold for compatibility matching
const DEFAULT_COMPATIBILITY_THRESHOLD = 0.7;

// Default maximum distance for location-based matching
const DEFAULT_MAX_DISTANCE = 25; // miles

// TTL for cached compatibility results (24 hours in milliseconds)
const COMPATIBILITY_CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Generates a cache key for compatibility results
 * @param userId User ID
 * @param targetType Type of target (user or tribe)
 * @param targetId Target ID
 * @returns Cache key string
 */
function generateCacheKey(userId: string, targetType: string, targetId: string): string {
  return `compatibility:${userId}:${targetType}:${targetId}`;
}

/**
 * Generates a cache key for batch compatibility results
 * @param userId User ID
 * @param targetType Type of target (user or tribe)
 * @param targetIdsHash Hash of target IDs
 * @returns Cache key string
 */
function generateBatchCacheKey(userId: string, targetType: string, targetIdsHash: string): string {
  return `compatibility:batch:${userId}:${targetType}:${targetIdsHash}`;
}

/**
 * Generates a hash from an array of target IDs for cache keys
 * @param targetIds Array of target IDs
 * @returns Hash string
 */
function generateTargetIdsHash(targetIds: string[]): string {
  // Sort IDs to ensure consistent hash regardless of array order
  const sortedIds = [...targetIds].sort();
  return sortedIds.join(':');
}

/**
 * Service that provides compatibility calculations between users and tribes
 */
export class CompatibilityService {
  private prisma: PrismaClient;
  private compatibilityAlgorithm: CompatibilityAlgorithm;
  private redisClient: Redis;
  private cacheTTL: number;

  /**
   * Initializes the compatibility service with required dependencies
   * @param prisma Prisma client for database operations
   * @param redisClient Redis client for caching
   */
  constructor(prisma: PrismaClient, redisClient: Redis) {
    this.prisma = prisma;
    this.compatibilityAlgorithm = new CompatibilityAlgorithm();
    this.redisClient = redisClient;
    this.cacheTTL = COMPATIBILITY_CACHE_TTL;
  }

  /**
   * Calculates compatibility between two users
   * @param userId First user ID
   * @param targetUserId Second user ID
   * @param factorWeights Weights for different compatibility factors
   * @param includeDetails Whether to include detailed factor breakdowns
   * @returns User compatibility result
   */
  async getUserCompatibility(
    userId: string,
    targetUserId: string,
    factorWeights: Record<CompatibilityFactor, number> = DEFAULT_FACTOR_WEIGHTS,
    includeDetails: boolean = false
  ): Promise<IUserCompatibility> {
    try {
      // Check if compatibility result is cached
      const cachedResult = await this.getCachedCompatibility(userId, 'user', targetUserId);
      if (cachedResult) {
        return cachedResult as IUserCompatibility;
      }

      // Retrieve user profiles
      const [user, targetUser] = await Promise.all([
        this.prisma.profile.findUnique({
          where: { id: userId },
          include: {
            personalityTraits: true,
            interests: true
          }
        }),
        this.prisma.profile.findUnique({
          where: { id: targetUserId },
          include: {
            personalityTraits: true,
            interests: true
          }
        })
      ]);

      if (!user || !targetUser) {
        throw ApiError.notFound('One or both users not found');
      }

      // Calculate compatibility
      const compatibility = await this.compatibilityAlgorithm.calculateUserCompatibility(
        user as unknown as IProfile,
        targetUser as unknown as IProfile,
        factorWeights,
        includeDetails
      );

      // Cache the result
      await this.cacheCompatibility(userId, 'user', targetUserId, compatibility);

      return compatibility;
    } catch (error) {
      logger.error('Error calculating user compatibility', error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to calculate user compatibility');
    }
  }

  /**
   * Calculates compatibility between a user and a tribe
   * @param userId User ID
   * @param tribeId Tribe ID
   * @param factorWeights Weights for different compatibility factors
   * @param includeDetails Whether to include detailed factor breakdowns
   * @returns Tribe compatibility result
   */
  async getTribeCompatibility(
    userId: string,
    tribeId: string,
    factorWeights: Record<CompatibilityFactor, number> = DEFAULT_FACTOR_WEIGHTS,
    includeDetails: boolean = false
  ): Promise<ITribeCompatibility> {
    try {
      // Check if compatibility result is cached
      const cachedResult = await this.getCachedCompatibility(userId, 'tribe', tribeId);
      if (cachedResult) {
        return cachedResult as ITribeCompatibility;
      }

      // Retrieve user profile
      const user = await this.prisma.profile.findUnique({
        where: { id: userId },
        include: {
          personalityTraits: true,
          interests: true
        }
      });

      if (!user) {
        throw ApiError.notFound(`User with ID ${userId} not found`);
      }

      // Retrieve tribe data
      const tribe = await this.prisma.tribe.findUnique({
        where: { id: tribeId },
        include: {
          interests: true,
          members: true
        }
      });

      if (!tribe) {
        throw ApiError.notFound(`Tribe with ID ${tribeId} not found`);
      }

      // Retrieve tribe members' profiles
      const memberIds = tribe.members.map(member => member.userId);
      const memberProfiles = await this.prisma.profile.findMany({
        where: {
          id: {
            in: memberIds
          }
        },
        include: {
          personalityTraits: true,
          interests: true
        }
      });

      // Calculate compatibility
      const compatibility = await this.compatibilityAlgorithm.calculateTribeCompatibility(
        user as unknown as IProfile,
        tribe as unknown as ITribe,
        memberProfiles as unknown as IProfile[],
        factorWeights,
        includeDetails
      );

      // Cache the result
      await this.cacheCompatibility(userId, 'tribe', tribeId, compatibility);

      return compatibility;
    } catch (error) {
      logger.error('Error calculating tribe compatibility', error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to calculate tribe compatibility');
    }
  }

  /**
   * Processes a compatibility request between a user and another user or tribe
   * @param request Compatibility request parameters
   * @returns Compatibility response
   */
  async processCompatibilityRequest(
    request: ICompatibilityRequest
  ): Promise<ICompatibilityResponse> {
    const { userId, targetType, targetId, includeDetails, factorWeights } = request;

    try {
      let result;
      if (targetType === 'user') {
        result = await this.getUserCompatibility(
          userId,
          targetId,
          factorWeights,
          includeDetails
        );
      } else if (targetType === 'tribe') {
        result = await this.getTribeCompatibility(
          userId,
          targetId,
          factorWeights,
          includeDetails
        );
      } else {
        throw ApiError.badRequest(`Invalid target type: ${targetType}`);
      }

      return {
        userId,
        targetType,
        targetId,
        overallScore: result.overallScore,
        details: includeDetails ? result.details : [],
        calculatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error processing compatibility request', error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to process compatibility request');
    }
  }

  /**
   * Processes a batch compatibility request between a user and multiple users or tribes
   * @param request Batch compatibility request parameters
   * @returns Batch compatibility response
   */
  async processBatchCompatibilityRequest(
    request: ICompatibilityBatchRequest
  ): Promise<ICompatibilityBatchResponse> {
    const { userId, targetType, targetIds, includeDetails, factorWeights } = request;

    try {
      // Check cache for batch result
      const cachedBatchResult = await this.getCachedBatchCompatibility(userId, targetType, targetIds);
      if (cachedBatchResult) {
        return cachedBatchResult;
      }

      // Retrieve user profile
      const user = await this.prisma.profile.findUnique({
        where: { id: userId },
        include: {
          personalityTraits: true,
          interests: true
        }
      });

      if (!user) {
        throw ApiError.notFound(`User with ID ${userId} not found`);
      }

      let results = [];
      if (targetType === 'user') {
        // Retrieve target user profiles
        const targetUsers = await this.prisma.profile.findMany({
          where: {
            id: {
              in: targetIds
            }
          },
          include: {
            personalityTraits: true,
            interests: true
          }
        });

        // Create user profile map
        const userProfiles = new Map<string, IProfile>();
        userProfiles.set(userId, user as unknown as IProfile);
        for (const targetUser of targetUsers) {
          userProfiles.set(targetUser.id, targetUser as unknown as IProfile);
        }

        // Calculate compatibility for each target user
        const compatibilityResults = await Promise.all(
          targetIds.map(async (targetId) => {
            const targetUser = userProfiles.get(targetId);
            if (!targetUser) {
              return {
                targetId,
                overallScore: 0,
                details: includeDetails ? [] : undefined
              };
            }

            const compatibility = await this.compatibilityAlgorithm.calculateUserCompatibility(
              user as unknown as IProfile,
              targetUser,
              factorWeights,
              includeDetails
            );

            return {
              targetId,
              overallScore: compatibility.overallScore,
              details: includeDetails ? compatibility.details : undefined
            };
          })
        );

        results = compatibilityResults;
      } else if (targetType === 'tribe') {
        // Retrieve tribes
        const tribes = await this.prisma.tribe.findMany({
          where: {
            id: {
              in: targetIds
            }
          },
          include: {
            interests: true,
            members: true
          }
        });

        // Gather all member IDs
        const memberIds = new Set<string>();
        for (const tribe of tribes) {
          for (const member of tribe.members) {
            memberIds.add(member.userId);
          }
        }

        // Retrieve member profiles
        const memberProfiles = await this.prisma.profile.findMany({
          where: {
            id: {
              in: Array.from(memberIds)
            }
          },
          include: {
            personalityTraits: true,
            interests: true
          }
        });

        // Create maps for quick lookups
        const memberProfileMap = new Map<string, IProfile>();
        for (const profile of memberProfiles) {
          memberProfileMap.set(profile.id, profile as unknown as IProfile);
        }

        const tribeMap = new Map<string, ITribe>();
        for (const tribe of tribes) {
          tribeMap.set(tribe.id, tribe as unknown as ITribe);
        }

        // Calculate compatibility for each tribe
        const compatibilityResults = await Promise.all(
          targetIds.map(async (targetId) => {
            const tribe = tribeMap.get(targetId);
            if (!tribe) {
              return {
                targetId,
                overallScore: 0,
                details: includeDetails ? [] : undefined
              };
            }

            const tribeMembers = tribe.members
              .map(member => memberProfileMap.get(member.userId))
              .filter(Boolean) as IProfile[];

            const compatibility = await this.compatibilityAlgorithm.calculateTribeCompatibility(
              user as unknown as IProfile,
              tribe,
              tribeMembers,
              factorWeights,
              includeDetails
            );

            return {
              targetId,
              overallScore: compatibility.overallScore,
              details: includeDetails ? compatibility.details : undefined
            };
          })
        );

        results = compatibilityResults;
      } else {
        throw ApiError.badRequest(`Invalid target type: ${targetType}`);
      }

      const response: ICompatibilityBatchResponse = {
        userId,
        targetType,
        results,
        calculatedAt: new Date()
      };

      // Cache the batch result
      await this.cacheBatchCompatibility(userId, targetType, targetIds, response);

      return response;
    } catch (error) {
      logger.error('Error processing batch compatibility request', error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to process batch compatibility request');
    }
  }

  /**
   * Finds the most compatible tribes for a user
   * @param userId User ID
   * @param factorWeights Weights for different compatibility factors
   * @param limit Maximum number of results to return
   * @param threshold Minimum compatibility score to consider (0-100)
   * @param includeDetails Whether to include detailed factor breakdowns
   * @returns Array of compatible tribes with scores
   */
  async findMostCompatibleTribes(
    userId: string,
    factorWeights: Record<CompatibilityFactor, number> = DEFAULT_FACTOR_WEIGHTS,
    limit: number = 10,
    threshold: number = DEFAULT_COMPATIBILITY_THRESHOLD * 100,
    includeDetails: boolean = false
  ): Promise<Array<{tribeId: string, compatibilityScore: number, details?: ICompatibilityDetail[]}>> {
    try {
      // Retrieve user profile
      const user = await this.prisma.profile.findUnique({
        where: { id: userId },
        include: {
          personalityTraits: true,
          interests: true
        }
      });

      if (!user) {
        throw ApiError.notFound(`User with ID ${userId} not found`);
      }

      // Find tribes the user is not already part of
      const userMemberships = await this.prisma.tribeMembership.findMany({
        where: {
          userId
        },
        select: {
          tribeId: true
        }
      });

      const userTribeIds = userMemberships.map(membership => membership.tribeId);

      // Retrieve eligible tribes (not full, user not already a member)
      const eligibleTribes = await this.prisma.tribe.findMany({
        where: {
          id: {
            notIn: userTribeIds
          },
          // Only consider tribes that are not at capacity
          members: {
            none: {
              userId
            }
          }
        },
        include: {
          interests: true,
          members: true
        }
      });

      // Filter for tribes that have available capacity
      const tribesWithCapacity = eligibleTribes.filter(tribe => 
        tribe.members.length < (tribe.maxMembers || 8)
      );

      // If no eligible tribes, return empty array
      if (tribesWithCapacity.length === 0) {
        return [];
      }

      // Gather all member IDs for efficient profile retrieval
      const memberIds = new Set<string>();
      for (const tribe of tribesWithCapacity) {
        for (const member of tribe.members) {
          memberIds.add(member.userId);
        }
      }

      // Retrieve member profiles
      const memberProfiles = await this.prisma.profile.findMany({
        where: {
          id: {
            in: Array.from(memberIds)
          }
        },
        include: {
          personalityTraits: true,
          interests: true
        }
      });

      // Create map for quick profile lookups
      const memberProfileMap = new Map<string, IProfile>();
      for (const profile of memberProfiles) {
        memberProfileMap.set(profile.id, profile as unknown as IProfile);
      }

      // Use compatibility algorithm to find most compatible tribes
      return this.compatibilityAlgorithm.findMostCompatibleTribes(
        user as unknown as IProfile,
        tribesWithCapacity as unknown as ITribe[],
        memberProfileMap,
        factorWeights,
        limit,
        threshold
      );
    } catch (error) {
      logger.error('Error finding most compatible tribes', error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to find compatible tribes');
    }
  }

  /**
   * Finds the most compatible users for a given user
   * @param userId User ID
   * @param factorWeights Weights for different compatibility factors
   * @param limit Maximum number of results to return
   * @param threshold Minimum compatibility score to consider (0-100)
   * @param includeDetails Whether to include detailed factor breakdowns
   * @returns Array of compatible users with scores
   */
  async findMostCompatibleUsers(
    userId: string,
    factorWeights: Record<CompatibilityFactor, number> = DEFAULT_FACTOR_WEIGHTS,
    limit: number = 10,
    threshold: number = DEFAULT_COMPATIBILITY_THRESHOLD * 100,
    includeDetails: boolean = false
  ): Promise<Array<{userId: string, compatibilityScore: number, details?: ICompatibilityDetail[]}>> {
    try {
      // Retrieve user profile
      const user = await this.prisma.profile.findUnique({
        where: { id: userId },
        include: {
          personalityTraits: true,
          interests: true
        }
      });

      if (!user) {
        throw ApiError.notFound(`User with ID ${userId} not found`);
      }

      // Retrieve other user profiles
      const otherUsers = await this.prisma.profile.findMany({
        where: {
          id: {
            not: userId
          }
        },
        include: {
          personalityTraits: true,
          interests: true
        }
      });

      // Use compatibility algorithm to find most compatible users
      return this.compatibilityAlgorithm.findMostCompatibleUsers(
        user as unknown as IProfile,
        otherUsers as unknown as IProfile[],
        factorWeights,
        limit,
        threshold
      );
    } catch (error) {
      logger.error('Error finding most compatible users', error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to find compatible users');
    }
  }

  /**
   * Retrieves cached compatibility result if available
   * @param userId User ID
   * @param targetType Type of target (user or tribe)
   * @param targetId Target ID
   * @returns Cached compatibility result or null
   */
  async getCachedCompatibility(
    userId: string,
    targetType: string,
    targetId: string
  ): Promise<IUserCompatibility | ITribeCompatibility | null> {
    try {
      const cacheKey = generateCacheKey(userId, targetType, targetId);
      const cachedData = await this.redisClient.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      return null;
    } catch (error) {
      logger.error('Error retrieving cached compatibility', error as Error);
      return null;
    }
  }

  /**
   * Retrieves cached batch compatibility result if available
   * @param userId User ID
   * @param targetType Type of target (user or tribe)
   * @param targetIds Target IDs
   * @returns Cached batch compatibility result or null
   */
  async getCachedBatchCompatibility(
    userId: string,
    targetType: string,
    targetIds: string[]
  ): Promise<ICompatibilityBatchResponse | null> {
    try {
      const targetIdsHash = generateTargetIdsHash(targetIds);
      const cacheKey = generateBatchCacheKey(userId, targetType, targetIdsHash);
      const cachedData = await this.redisClient.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      return null;
    } catch (error) {
      logger.error('Error retrieving cached batch compatibility', error as Error);
      return null;
    }
  }

  /**
   * Caches compatibility result for future use
   * @param userId User ID
   * @param targetType Type of target (user or tribe)
   * @param targetId Target ID
   * @param result Compatibility result
   */
  async cacheCompatibility(
    userId: string,
    targetType: string,
    targetId: string,
    result: IUserCompatibility | ITribeCompatibility
  ): Promise<void> {
    try {
      const cacheKey = generateCacheKey(userId, targetType, targetId);
      await this.redisClient.set(
        cacheKey,
        JSON.stringify(result),
        'PX',
        this.cacheTTL
      );
      logger.debug(`Cached compatibility result: ${cacheKey}`);
    } catch (error) {
      logger.error('Error caching compatibility result', error as Error);
    }
  }

  /**
   * Caches batch compatibility result for future use
   * @param userId User ID
   * @param targetType Type of target (user or tribe)
   * @param targetIds Target IDs
   * @param result Batch compatibility result
   */
  async cacheBatchCompatibility(
    userId: string,
    targetType: string,
    targetIds: string[],
    result: ICompatibilityBatchResponse
  ): Promise<void> {
    try {
      const targetIdsHash = generateTargetIdsHash(targetIds);
      const cacheKey = generateBatchCacheKey(userId, targetType, targetIdsHash);
      await this.redisClient.set(
        cacheKey,
        JSON.stringify(result),
        'PX',
        this.cacheTTL
      );
      logger.debug(`Cached batch compatibility result: ${cacheKey}`);
    } catch (error) {
      logger.error('Error caching batch compatibility result', error as Error);
    }
  }

  /**
   * Clears compatibility cache for a user
   * @param userId User ID
   * @param targetType Type of target (user or tribe)
   * @param targetId Target ID
   */
  async clearCompatibilityCache(
    userId: string,
    targetType: string,
    targetId: string
  ): Promise<void> {
    try {
      const cacheKey = generateCacheKey(userId, targetType, targetId);
      await this.redisClient.del(cacheKey);
      logger.debug(`Cleared compatibility cache: ${cacheKey}`);
    } catch (error) {
      logger.error('Error clearing compatibility cache', error as Error);
    }
  }

  /**
   * Clears all compatibility cache entries for a user
   * @param userId User ID
   */
  async clearAllUserCompatibilityCache(userId: string): Promise<void> {
    try {
      const pattern = `compatibility:${userId}:*`;
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        logger.debug(`Cleared ${keys.length} compatibility cache entries for user ${userId}`);
      }
    } catch (error) {
      logger.error('Error clearing all user compatibility cache', error as Error);
    }
  }
}