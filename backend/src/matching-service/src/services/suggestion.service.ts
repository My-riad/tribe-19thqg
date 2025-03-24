import { PrismaClient } from '@prisma/client'; // ^4.16.0
import Redis from 'ioredis'; // ^5.3.0
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0

import CompatibilityService from './compatibility.service';
import MatchingService from './matching.service';
import {
  IMatchingSuggestion,
  ITribeSearchCriteria,
} from '../models/matching.model';
import {
  CompatibilityFactor,
  ICompatibilityDetail
} from '../models/compatibility.model';
import {
  IProfile,
  InterestCategory,
  ICoordinates
} from '../../shared/src/types/profile.types';
import {
  ITribe,
  TribeStatus,
  TribePrivacy
} from '../../shared/src/types/tribe.types';
import { TRIBE_LIMITS } from '../../shared/src/constants/app.constants';
import { ApiError } from '../../shared/src/errors/api.error';
import { logger } from '../../shared/src/utils/logger.util';

// Constants for suggestion configuration
const DEFAULT_SUGGESTION_LIMIT = 10;
const DEFAULT_COMPATIBILITY_THRESHOLD = 0.7;
const SUGGESTION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DEFAULT_FACTOR_WEIGHTS = {
  [CompatibilityFactor.PERSONALITY]: 0.3,
  [CompatibilityFactor.INTERESTS]: 0.3,
  [CompatibilityFactor.COMMUNICATION_STYLE]: 0.2,
  [CompatibilityFactor.LOCATION]: 0.1,
  [CompatibilityFactor.GROUP_BALANCE]: 0.1
};

/**
 * Generates a cache key for user suggestions
 * @param userId User ID
 * @param suggestionType Type of suggestion ('tribes', 'users', 'personalized')
 * @returns Cache key string
 */
function generateSuggestionCacheKey(userId: string, suggestionType: string): string {
  return `suggestion:${userId}:${suggestionType}`;
}

/**
 * Calculates the distance between two geographic coordinates
 * @param coords1 First coordinate point
 * @param coords2 Second coordinate point
 * @returns Distance in miles between the two points
 */
function calculateDistanceFromCoordinates(coords1: ICoordinates, coords2: ICoordinates): number {
  const EARTH_RADIUS_KM = 6371; // Earth radius in kilometers
  
  // Convert latitude and longitude from degrees to radians
  const lat1Rad = (coords1.latitude * Math.PI) / 180;
  const lon1Rad = (coords1.longitude * Math.PI) / 180;
  const lat2Rad = (coords2.latitude * Math.PI) / 180;
  const lon2Rad = (coords2.longitude * Math.PI) / 180;
  
  // Calculate differences between latitudes and longitudes
  const latDiff = lat2Rad - lat1Rad;
  const lonDiff = lon2Rad - lon1Rad;
  
  // Apply Haversine formula to compute great-circle distance
  const a = 
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
    Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Calculate distance in kilometers and convert to miles
  const distanceKm = EARTH_RADIUS_KM * c;
  const distanceMiles = distanceKm * 0.621371;
  
  return distanceMiles;
}

/**
 * Formats tribe data into a suggestion response
 * @param userId User ID
 * @param tribe Tribe data
 * @param compatibilityScore Compatibility score
 * @param details Compatibility details
 * @param userCoordinates User's geographic coordinates
 * @returns Formatted tribe suggestion
 */
function formatTribeSuggestion(
  userId: string,
  tribe: ITribe,
  compatibilityScore: number,
  details: ICompatibilityDetail[],
  userCoordinates: ICoordinates
): IMatchingSuggestion {
  // Extract primary interests from tribe
  const primaryInterests = tribe.interests
    .filter(interest => interest.isPrimary)
    .map(interest => ({
      category: interest.category,
      name: interest.name
    }));
  
  // Calculate distance between user and tribe
  const distance = calculateDistanceFromCoordinates(userCoordinates, tribe.coordinates);
  
  // Set expiration date for the suggestion (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + SUGGESTION_CACHE_TTL);
  
  return {
    userId,
    tribeId: tribe.id,
    tribeName: tribe.name,
    compatibilityScore: Math.round(compatibilityScore * 100) / 100,
    compatibilityDetails: details,
    memberCount: tribe.members.length,
    primaryInterests,
    location: tribe.location,
    distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
    createdAt: new Date(),
    expiresAt
  };
}

/**
 * Formats user data into a suggestion response
 * @param userId User ID
 * @param profile User profile data
 * @param compatibilityScore Compatibility score
 * @param details Compatibility details
 * @param userCoordinates User's geographic coordinates
 * @returns Formatted user suggestion
 */
function formatUserSuggestion(
  userId: string,
  profile: IProfile,
  compatibilityScore: number,
  details: ICompatibilityDetail[],
  userCoordinates: ICoordinates
): object {
  // Extract interests from user profile
  const interests = profile.interests.map(interest => ({
    category: interest.category,
    name: interest.name
  }));
  
  // Calculate distance between users
  const distance = calculateDistanceFromCoordinates(userCoordinates, profile.coordinates);
  
  // Set expiration date for the suggestion (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + SUGGESTION_CACHE_TTL);
  
  return {
    userId: profile.id,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    compatibilityScore: Math.round(compatibilityScore * 100) / 100,
    details,
    interests,
    location: profile.location,
    distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
    createdAt: new Date(),
    expiresAt
  };
}

/**
 * Service that provides AI-powered tribe and user suggestions
 */
class SuggestionService {
  private prisma: PrismaClient;
  private compatibilityService: CompatibilityService;
  private matchingService: MatchingService;
  private redisClient: Redis;
  private cacheTTL: number;
  
  /**
   * Initializes the suggestion service with required dependencies
   * @param prisma Prisma client for database operations
   * @param compatibilityService Service for finding compatible tribes and users
   * @param matchingService Service for finding compatible tribes
   * @param redisClient Redis client for caching suggestions
   */
  constructor(
    prisma: PrismaClient,
    compatibilityService: CompatibilityService,
    matchingService: MatchingService,
    redisClient: Redis
  ) {
    this.prisma = prisma;
    this.compatibilityService = compatibilityService;
    this.matchingService = matchingService;
    this.redisClient = redisClient;
    this.cacheTTL = SUGGESTION_CACHE_TTL;
  }
  
  /**
   * Gets tribe suggestions for a user based on compatibility
   * @param userId User ID
   * @param limit Maximum number of suggestions to return
   * @param includeDetails Whether to include detailed compatibility breakdowns
   * @param filters Optional filters for the suggestions
   * @returns Array of tribe suggestions
   */
  async getSuggestedTribes(
    userId: string,
    limit: number = DEFAULT_SUGGESTION_LIMIT,
    includeDetails: boolean = false,
    filters: Partial<ITribeSearchCriteria> = {}
  ): Promise<IMatchingSuggestion[]> {
    try {
      // Try to get suggestions from cache first
      const cachedSuggestions = await this.getCachedSuggestions(userId, 'tribes');
      if (cachedSuggestions) {
        logger.debug(`Returning cached tribe suggestions for user ${userId}`);
        return cachedSuggestions;
      }
      
      // Get user profile to use for matching
      const userProfile = await this.prisma.profile.findUnique({
        where: { userId },
        include: {
          personalityTraits: true,
          interests: true
        }
      });
      
      if (!userProfile) {
        throw ApiError.notFound(`User profile not found for user ${userId}`);
      }
      
      // Get tribes the user is already a member of
      const userTribeIds = await this.getUserCurrentTribes(userId);
      
      // Create search criteria for finding compatible tribes
      const searchCriteria: ITribeSearchCriteria = {
        interests: filters.interests || userProfile.interests.map(i => i.category),
        location: filters.location || userProfile.coordinates,
        maxDistance: filters.maxDistance || 25, // Default to 25 miles
        status: filters.status || [TribeStatus.ACTIVE, TribeStatus.FORMING],
        privacy: filters.privacy || TribePrivacy.PUBLIC,
        minCompatibility: filters.minCompatibility || DEFAULT_COMPATIBILITY_THRESHOLD * 100,
        hasAvailableSpots: filters.hasAvailableSpots !== undefined ? filters.hasAvailableSpots : true
      };
      
      // Use compatibility service to find most compatible tribes
      const compatibleTribes = await this.compatibilityService.findMostCompatibleTribes(
        userProfile.id,
        DEFAULT_FACTOR_WEIGHTS,
        limit,
        searchCriteria.minCompatibility,
        includeDetails
      );
      
      if (compatibleTribes.length === 0) {
        return [];
      }
      
      // Get full tribe data for each compatible tribe
      const tribeIds = compatibleTribes.map(t => t.tribeId);
      const tribes = await this.prisma.tribe.findMany({
        where: {
          id: { in: tribeIds },
          id: { notIn: userTribeIds } // Exclude tribes the user is already in
        },
        include: {
          interests: true,
          members: true
        }
      });
      
      // Map tribe data to suggestion format
      const suggestions = tribes.map(tribe => {
        const matchingTribe = compatibleTribes.find(t => t.tribeId === tribe.id);
        if (!matchingTribe) return null;
        
        return formatTribeSuggestion(
          userId,
          tribe as unknown as ITribe,
          matchingTribe.compatibilityScore / 100, // Convert from 0-100 to 0-1 scale
          matchingTribe.details || [],
          userProfile.coordinates
        );
      }).filter(Boolean) as IMatchingSuggestion[];
      
      // Cache suggestions for future requests
      await this.cacheSuggestions(userId, 'tribes', suggestions);
      
      return suggestions;
    } catch (error) {
      logger.error(`Error getting tribe suggestions for user ${userId}`, error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to get tribe suggestions');
    }
  }
  
  /**
   * Gets user suggestions for a user based on compatibility
   * @param userId User ID
   * @param limit Maximum number of suggestions to return
   * @param includeDetails Whether to include detailed compatibility breakdowns
   * @returns Array of user suggestions
   */
  async getSuggestedUsers(
    userId: string,
    limit: number = DEFAULT_SUGGESTION_LIMIT,
    includeDetails: boolean = false
  ): Promise<Array<{userId: string, name: string, avatarUrl: string, compatibilityScore: number, details?: ICompatibilityDetail[], distance: number}>> {
    try {
      // Try to get suggestions from cache first
      const cachedSuggestions = await this.getCachedSuggestions(userId, 'users');
      if (cachedSuggestions) {
        logger.debug(`Returning cached user suggestions for user ${userId}`);
        return cachedSuggestions;
      }
      
      // Get user profile to use for matching
      const userProfile = await this.prisma.profile.findUnique({
        where: { userId },
        include: {
          personalityTraits: true,
          interests: true
        }
      });
      
      if (!userProfile) {
        throw ApiError.notFound(`User profile not found for user ${userId}`);
      }
      
      // Use compatibility service to find most compatible users
      const compatibleUsers = await this.compatibilityService.findMostCompatibleUsers(
        userProfile.id,
        DEFAULT_FACTOR_WEIGHTS,
        limit,
        DEFAULT_COMPATIBILITY_THRESHOLD * 100,
        includeDetails
      );
      
      if (compatibleUsers.length === 0) {
        return [];
      }
      
      // Get full profile data for each compatible user
      const userIds = compatibleUsers.map(u => u.userId);
      const profiles = await this.prisma.profile.findMany({
        where: {
          id: { in: userIds }
        },
        include: {
          interests: true
        }
      });
      
      // Map user data to suggestion format
      const suggestions = profiles.map(profile => {
        const matchingUser = compatibleUsers.find(u => u.userId === profile.id);
        if (!matchingUser) return null;
        
        return {
          userId: profile.id,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
          compatibilityScore: matchingUser.compatibilityScore,
          details: matchingUser.details,
          distance: calculateDistanceFromCoordinates(userProfile.coordinates, profile.coordinates)
        };
      }).filter(Boolean) as Array<{userId: string, name: string, avatarUrl: string, compatibilityScore: number, details?: ICompatibilityDetail[], distance: number}>;
      
      // Cache suggestions for future requests
      await this.cacheSuggestions(userId, 'users', suggestions);
      
      return suggestions;
    } catch (error) {
      logger.error(`Error getting user suggestions for user ${userId}`, error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to get user suggestions');
    }
  }
  
  /**
   * Gets highly personalized tribe suggestions based on user preferences and behavior
   * @param userId User ID
   * @param limit Maximum number of suggestions to return
   * @returns Array of personalized tribe suggestions
   */
  async getPersonalizedTribeSuggestions(
    userId: string,
    limit: number = DEFAULT_SUGGESTION_LIMIT
  ): Promise<IMatchingSuggestion[]> {
    try {
      // Try to get suggestions from cache first
      const cachedSuggestions = await this.getCachedSuggestions(userId, 'personalized');
      if (cachedSuggestions) {
        logger.debug(`Returning cached personalized suggestions for user ${userId}`);
        return cachedSuggestions;
      }
      
      // Get user profile to use for matching
      const userProfile = await this.prisma.profile.findUnique({
        where: { userId },
        include: {
          personalityTraits: true,
          interests: true
        }
      });
      
      if (!userProfile) {
        throw ApiError.notFound(`User profile not found for user ${userId}`);
      }
      
      // Analyze user behavior and preferences to personalize suggestions
      const customFactorWeights = await this.analyzeUserPreferences(userId, userProfile as unknown as IProfile);
      
      // Get tribes the user is already a member of
      const userTribeIds = await this.getUserCurrentTribes(userId);
      
      // Use matching service to find compatible tribes with personalized weights
      const compatibleTribes = await this.matchingService.findCompatibleTribes(
        userId,
        {
          interests: userProfile.interests.map(i => i.category),
          location: userProfile.coordinates,
          maxDistance: 25,
          status: [TribeStatus.ACTIVE, TribeStatus.FORMING],
          privacy: TribePrivacy.PUBLIC,
          minCompatibility: DEFAULT_COMPATIBILITY_THRESHOLD * 100,
          hasAvailableSpots: true
        },
        customFactorWeights,
        limit
      );
      
      if (!compatibleTribes || compatibleTribes.length === 0) {
        return [];
      }
      
      // Get full tribe data for each compatible tribe
      const tribeIds = compatibleTribes.map(t => t.tribeId);
      const tribes = await this.prisma.tribe.findMany({
        where: {
          id: { in: tribeIds },
          id: { notIn: userTribeIds } // Exclude tribes the user is already in
        },
        include: {
          interests: true,
          members: true
        }
      });
      
      // Map tribe data to suggestion format
      const suggestions = tribes.map(tribe => {
        const matchingTribe = compatibleTribes.find(t => t.tribeId === tribe.id);
        if (!matchingTribe) return null;
        
        return formatTribeSuggestion(
          userId,
          tribe as unknown as ITribe,
          matchingTribe.compatibilityScore / 100, // Convert from 0-100 to 0-1 scale
          matchingTribe.compatibilityDetails || [],
          userProfile.coordinates
        );
      }).filter(Boolean) as IMatchingSuggestion[];
      
      // Cache suggestions for future requests
      await this.cacheSuggestions(userId, 'personalized', suggestions);
      
      return suggestions;
    } catch (error) {
      logger.error(`Error getting personalized suggestions for user ${userId}`, error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to get personalized tribe suggestions');
    }
  }
  
  /**
   * Forces a refresh of cached suggestions for a user
   * @param userId User ID
   * @param suggestionType Type of suggestions to refresh ('tribes', 'users', 'personalized', 'all')
   * @returns Result of refresh operation
   */
  async refreshSuggestions(
    userId: string,
    suggestionType: 'tribes' | 'users' | 'personalized' | 'all' = 'all'
  ): Promise<{success: boolean, message: string}> {
    try {
      // Delete cache entries for the specified suggestion type
      if (suggestionType === 'all' || suggestionType === 'tribes') {
        const tribesCacheKey = generateSuggestionCacheKey(userId, 'tribes');
        await this.redisClient.del(tribesCacheKey);
      }
      
      if (suggestionType === 'all' || suggestionType === 'users') {
        const usersCacheKey = generateSuggestionCacheKey(userId, 'users');
        await this.redisClient.del(usersCacheKey);
      }
      
      if (suggestionType === 'all' || suggestionType === 'personalized') {
        const personalizedCacheKey = generateSuggestionCacheKey(userId, 'personalized');
        await this.redisClient.del(personalizedCacheKey);
      }
      
      // Regenerate suggestions
      if (suggestionType === 'all' || suggestionType === 'tribes') {
        await this.getSuggestedTribes(userId);
      }
      
      if (suggestionType === 'all' || suggestionType === 'users') {
        await this.getSuggestedUsers(userId);
      }
      
      if (suggestionType === 'all' || suggestionType === 'personalized') {
        await this.getPersonalizedTribeSuggestions(userId);
      }
      
      return {
        success: true,
        message: `Successfully refreshed ${suggestionType} suggestions for user ${userId}`
      };
    } catch (error) {
      logger.error(`Error refreshing suggestions for user ${userId}`, error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to refresh suggestions');
    }
  }
  
  /**
   * Retrieves cached suggestions if available
   * @param userId User ID
   * @param suggestionType Type of suggestions ('tribes', 'users', 'personalized')
   * @returns Cached suggestions or null
   */
  async getCachedSuggestions(
    userId: string,
    suggestionType: string
  ): Promise<any | null> {
    try {
      const cacheKey = generateSuggestionCacheKey(userId, suggestionType);
      const cachedData = await this.redisClient.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      return null;
    } catch (error) {
      logger.error(`Error retrieving cached suggestions for user ${userId}`, error as Error);
      return null;
    }
  }
  
  /**
   * Caches suggestions for future use
   * @param userId User ID
   * @param suggestionType Type of suggestions ('tribes', 'users', 'personalized')
   * @param suggestions Suggestion data to cache
   */
  async cacheSuggestions(
    userId: string,
    suggestionType: string,
    suggestions: any
  ): Promise<void> {
    try {
      const cacheKey = generateSuggestionCacheKey(userId, suggestionType);
      await this.redisClient.set(
        cacheKey,
        JSON.stringify(suggestions),
        'PX',
        this.cacheTTL
      );
      logger.debug(`Cached ${suggestionType} suggestions for user ${userId}`);
    } catch (error) {
      logger.error(`Error caching suggestions for user ${userId}`, error as Error);
    }
  }
  
  /**
   * Gets the tribes a user is currently a member of
   * @param userId User ID
   * @returns Array of tribe IDs
   */
  async getUserCurrentTribes(userId: string): Promise<string[]> {
    try {
      const memberships = await this.prisma.tribeMembership.findMany({
        where: {
          userId,
          status: {
            in: ['active', 'pending'] // Consider both active and pending memberships
          }
        },
        select: {
          tribeId: true
        }
      });
      
      return memberships.map(membership => membership.tribeId);
    } catch (error) {
      logger.error(`Error getting current tribes for user ${userId}`, error as Error);
      return [];
    }
  }
  
  /**
   * Analyzes user behavior and preferences for personalized suggestions
   * @param userId User ID
   * @param profile User profile
   * @returns Adjusted factor weights based on user behavior
   */
  async analyzeUserPreferences(
    userId: string,
    profile: IProfile
  ): Promise<Record<CompatibilityFactor, number>> {
    try {
      // Retrieve user's activity history
      const userActivity = await this.prisma.userActivity.findMany({
        where: {
          userId
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 100 // Analyze last 100 activities
      });
      
      // Initialize with default weights
      const adjustedWeights = { ...DEFAULT_FACTOR_WEIGHTS };
      
      // Analyze activity patterns to determine which factors matter most to this user
      // This is a simplified implementation - a real system would use more sophisticated analysis
      
      // Check for strong location preferences
      const locationActivities = userActivity.filter(a => 
        a.activityType === 'event_attended' || 
        a.activityType === 'location_search'
      );
      
      if (locationActivities.length > 20) {
        // User shows strong preference for location-based activities
        adjustedWeights[CompatibilityFactor.LOCATION] += 0.1;
        // Reduce other factors proportionally
        adjustedWeights[CompatibilityFactor.PERSONALITY] -= 0.03;
        adjustedWeights[CompatibilityFactor.INTERESTS] -= 0.03;
        adjustedWeights[CompatibilityFactor.COMMUNICATION_STYLE] -= 0.02;
        adjustedWeights[CompatibilityFactor.GROUP_BALANCE] -= 0.02;
      }
      
      // Check for strong interest-based activity
      const interestActivities = userActivity.filter(a => 
        a.activityType === 'interest_added' || 
        a.activityType === 'interest_search'
      );
      
      if (interestActivities.length > 15) {
        // User shows strong preference for interest-based matching
        adjustedWeights[CompatibilityFactor.INTERESTS] += 0.1;
        // Reduce other factors proportionally
        adjustedWeights[CompatibilityFactor.PERSONALITY] -= 0.03;
        adjustedWeights[CompatibilityFactor.LOCATION] -= 0.03;
        adjustedWeights[CompatibilityFactor.COMMUNICATION_STYLE] -= 0.02;
        adjustedWeights[CompatibilityFactor.GROUP_BALANCE] -= 0.02;
      }
      
      // Check for communication style preferences
      const communicationActivities = userActivity.filter(a => 
        a.activityType === 'message_sent' || 
        a.activityType === 'chat_engaged'
      );
      
      if (communicationActivities.length > 30) {
        // User is very communicative
        adjustedWeights[CompatibilityFactor.COMMUNICATION_STYLE] += 0.1;
        // Reduce other factors proportionally
        adjustedWeights[CompatibilityFactor.PERSONALITY] -= 0.03;
        adjustedWeights[CompatibilityFactor.INTERESTS] -= 0.03;
        adjustedWeights[CompatibilityFactor.LOCATION] -= 0.02;
        adjustedWeights[CompatibilityFactor.GROUP_BALANCE] -= 0.02;
      }
      
      // Normalize weights to ensure they sum to 1.0
      const totalWeight = Object.values(adjustedWeights).reduce((sum, weight) => sum + weight, 0);
      
      Object.keys(adjustedWeights).forEach(factor => {
        adjustedWeights[factor as CompatibilityFactor] /= totalWeight;
      });
      
      return adjustedWeights;
    } catch (error) {
      logger.error(`Error analyzing preferences for user ${userId}`, error as Error);
      // Fall back to default weights if analysis fails
      return { ...DEFAULT_FACTOR_WEIGHTS };
    }
  }
}

export default SuggestionService;