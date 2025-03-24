import { PrismaClient } from '@prisma/client'; // Prisma Client v5.x
import {
  ITribe,
  ITribeCreate,
  ITribeUpdate,
  ITribeSearchParams,
  ITribeInterest,
  ITribeResponse,
  ITribeDetailResponse,
  TribeStatus,
  TribePrivacy,
  ActivityType,
  MemberRole,
} from '@shared/types';
import { InterestCategory, ICoordinates } from '@shared/types';
import { TRIBE_LIMITS } from '@shared/constants/app.constants';
import { ApiError } from '@shared/errors';
import { logger } from '@shared/utils';
import { MemberModel } from '../models/member.model';
import { ActivityModel } from '../models/activity.model';
import { MemberService } from './member.service';
import { ActivityService } from './activity.service';
import {
  validateCreateTribe,
  validateUpdateTribe,
  validateTribeId,
  validateTribeSearchParams,
  validateTribeInterest,
  validateTribeStatus,
} from '../validations/tribe.validation';
import { orchestrationService } from '@ai-orchestration-service'; // Assuming version 1.0.0 or compatible

/**
 * Service class for managing tribes in the Tribe platform
 */
export class TribeService {
  /**
   * Initialize the tribe service with required models and services
   * @param tribeModel - The tribe model for database operations
   * @param memberModel - The member model for tribe membership operations
   * @param activityModel - The activity model for tribe activity tracking
   * @param memberService - The member service for tribe membership operations
   * @param activityService - The activity service for tribe activity tracking
   */
  constructor(
    private tribeModel: TribeModel,
    private memberModel: MemberModel,
    private activityModel: ActivityModel,
    private memberService: MemberService,
    private activityService: ActivityService
  ) {
    // LD1: Store model and service instances for operations
    this.tribeModel = tribeModel;
    this.memberModel = memberModel;
    this.activityModel = activityModel;
    this.memberService = memberService;
    this.activityService = activityService;
  }

  /**
   * Create a new tribe and add the creator as the first member
   * @param tribeData - The tribe data to create
   * @returns The created tribe record
   */
  async createTribe(tribeData: ITribeCreate): Promise<ITribe> {
    // LD1: Validate tribe data using validateCreateTribe
    validateCreateTribe(tribeData);

    // LD1: Check if user can create another tribe (max 3 per user)
    const userTribeCount = await this.memberModel.countByUserId(tribeData.createdBy, { status: 'active' });
    if (userTribeCount >= TRIBE_LIMITS.MAX_TRIBES_PER_USER) {
      throw ApiError.forbidden(`User has reached the maximum number of Tribes: ${TRIBE_LIMITS.MAX_TRIBES_PER_USER}`);
    }

    // LD1: Create tribe record using tribeModel.create
    const tribe = await this.tribeModel.create(tribeData);

    // LD1: Add creator as first member with CREATOR role
    await this.memberService.addMember({
      tribeId: tribe.id,
      userId: tribeData.createdBy,
      role: MemberRole.CREATOR,
    });

    // LD1: Record tribe creation activity
    await this.activityService.createActivity({
      tribeId: tribe.id,
      userId: tribeData.createdBy,
      activityType: ActivityType.TRIBE_CREATED,
      description: `Tribe "${tribe.name}" was created`,
      metadata: {
        tribeName: tribe.name,
      },
    });

    // LD1: Log tribe creation
    logger.info('Tribe created', { tribeId: tribe.id, tribeName: tribe.name, createdBy: tribeData.createdBy });

    // LD1: Return the created tribe
    return tribe;
  }

  /**
   * Get a tribe by ID with optional member details
   * @param tribeId - The ID of the tribe to retrieve
   * @param includeMembers - Whether to include tribe members in the result
   * @returns The tribe record
   */
  async getTribe(tribeId: string, includeMembers: boolean = false): Promise<ITribe> {
    // LD1: Validate tribe ID using validateTribeId
    validateTribeId(tribeId);

    // LD1: Find tribe by ID using tribeModel.findById with includeMembers option
    const tribe = await this.tribeModel.findById(tribeId, includeMembers);

    // LD1: If not found, throw ApiError.notFound
    if (!tribe) {
      throw ApiError.notFound(`Tribe with ID "${tribeId}" not found`);
    }

    // LD1: Return the tribe record
    return tribe;
  }

  /**
   * Get detailed tribe information including members, activities, and upcoming events
   * @param tribeId - The ID of the tribe to retrieve details for
   * @param userId - The ID of the user requesting the tribe details
   * @returns Detailed tribe information
   */
  async getTribeDetails(tribeId: string, userId?: string): Promise<ITribeDetailResponse> {
    // LD1: Validate tribe ID using validateTribeId
    validateTribeId(tribeId);

    // LD1: Find tribe by ID with all related data (members, interests, activities, goals)
    const tribe = await this.tribeModel.findById(tribeId, true);

    // LD1: If not found, throw ApiError.notFound
    if (!tribe) {
      throw ApiError.notFound(`Tribe with ID "${tribeId}" not found`);
    }

    let userMembership = null;
    if (userId) {
      // LD1: Get user's membership in the tribe if userId provided
      userMembership = await this.memberService.getUserMembershipInTribe(tribeId, userId);
    }

    // TODO: LD1: Get upcoming events for the tribe
    const upcomingEvents = [];

    // TODO: LD1: Get unread message count for the user in the tribe
    const unreadMessageCount = 0;

    // LD1: Format and return detailed tribe response
    return this.formatTribeDetailResponse(tribe, { userMembership, upcomingEvents, unreadMessageCount });
  }

  /**
   * Get all tribes a user is a member of
   * @param userId - The ID of the user to retrieve tribes for
   * @param options - Optional filters and pagination
   * @returns User's tribes with total count
   */
  async getUserTribes(userId: string, options: { limit?: number; offset?: number } = {}): Promise<{ tribes: ITribeResponse[]; total: number }> {
    // LD1: Find tribes by user ID using tribeModel.findByUserId
    const tribes = await this.tribeModel.findByUserId(userId, options);

    // LD1: Format tribe data for response
    const tribeResponses = await Promise.all(tribes.map(tribe => this.formatTribeResponse(tribe, { userId })));

    // LD1: Count total tribes for the user
    const total = await this.memberModel.countByUserId(userId, { status: 'active' });

    // LD1: Return tribes and total count
    return { tribes: tribeResponses, total };
  }

  /**
   * Search for tribes based on various criteria
   * @param searchParams - Search parameters
   * @param userId - The ID of the user performing the search
   * @returns Matching tribes with total count
   */
  async searchTribes(searchParams: ITribeSearchParams, userId?: string): Promise<{ tribes: ITribeResponse[]; total: number }> {
    // LD1: Validate search parameters using validateTribeSearchParams
    validateTribeSearchParams(searchParams);

    // LD1: Search for tribes using tribeModel.search
    const { tribes, total } = await this.tribeModel.search(searchParams);

    // LD1: If userId provided, get user's membership status for each tribe
    const tribeResponses = await Promise.all(tribes.map(tribe => this.formatTribeResponse(tribe, { userId })));

    // LD1: Return matching tribes and total count
    return { tribes: tribeResponses, total };
  }

  /**
   * Update a tribe's information
   * @param tribeId - The ID of the tribe to update
   * @param updateData - The data to update
   * @param userId - The ID of the user performing the update
   * @returns The updated tribe record
   */
  async updateTribe(tribeId: string, updateData: ITribeUpdate, userId: string): Promise<ITribe> {
    // LD1: Validate tribe ID using validateTribeId
    validateTribeId(tribeId);

    // LD1: Validate update data using validateUpdateTribe
    validateUpdateTribe(updateData);

    // LD1: Check if user has permission to update the tribe (must be creator)
    if (!await this.memberService.hasPermission(tribeId, userId, [MemberRole.CREATOR])) {
      throw ApiError.forbidden('User does not have permission to update this tribe');
    }

    // LD1: Update tribe record using tribeModel.update
    const tribe = await this.tribeModel.update(tribeId, updateData);

    // LD1: Record tribe update activity
    await this.activityService.createActivity({
      tribeId: tribe.id,
      userId,
      activityType: ActivityType.TRIBE_UPDATE,
      description: `Tribe "${tribe.name}" was updated`,
      metadata: {
        tribeName: tribe.name,
      },
    });

    // LD1: Log tribe update
    logger.info('Tribe updated', { tribeId: tribe.id, tribeName: tribe.name, updatedBy: userId });

    // LD1: Return the updated tribe
    return tribe;
  }

  /**
   * Update a tribe's status
   * @param tribeId - The ID of the tribe to update
   * @param status - The new status to set
   * @param userId - The ID of the user performing the update
   * @returns The updated tribe record
   */
  async updateTribeStatus(tribeId: string, status: TribeStatus, userId: string): Promise<ITribe> {
    // LD1: Validate tribe ID using validateTribeId
    validateTribeId(tribeId);

    // LD1: Validate status using validateTribeStatus
    validateTribeStatus(status);

    // LD1: Check if user has permission to update the tribe status (must be creator)
    if (!await this.memberService.hasPermission(tribeId, userId, [MemberRole.CREATOR])) {
      throw ApiError.forbidden('User does not have permission to update this tribe status');
    }

    // LD1: Update tribe status using tribeModel.updateStatus
    const tribe = await this.tribeModel.updateStatus(tribeId, status);

    // LD1: Record tribe status update activity
    await this.activityService.createActivity({
      tribeId: tribe.id,
      userId,
      activityType: ActivityType.TRIBE_UPDATE,
      description: `Tribe status was updated to "${status}"`,
      metadata: {
        tribeName: tribe.name,
        newStatus: status,
      },
    });

    // LD1: Log tribe status update
    logger.info('Tribe status updated', { tribeId: tribe.id, tribeName: tribe.name, status, updatedBy: userId });

    // LD1: Return the updated tribe
    return tribe;
  }

  /**
   * Add an interest to a tribe
   * @param tribeId - The ID of the tribe to add the interest to
   * @param interestData - The interest data to add
   * @param userId - The ID of the user performing the action
   * @returns The created interest record
   */
  async addTribeInterest(tribeId: string, interestData: { category: InterestCategory; name: string; isPrimary: boolean }, userId: string): Promise<ITribeInterest> {
    // LD1: Validate tribe ID using validateTribeId
    validateTribeId(tribeId);

    // LD1: Validate interest data using validateTribeInterest
    validateTribeInterest(interestData);

    // LD1: Check if user has permission to add interests (must be creator)
    if (!await this.memberService.hasPermission(tribeId, userId, [MemberRole.CREATOR])) {
      throw ApiError.forbidden('User does not have permission to add interests to this tribe');
    }

    // LD1: Add interest using tribeModel.addInterest
    const interest = await this.tribeModel.addInterest(tribeId, interestData);

    // LD1: Record interest addition activity
    await this.activityService.createActivity({
      tribeId: tribe.id,
      userId,
      activityType: ActivityType.TRIBE_UPDATE,
      description: `Interest "${interestData.name}" was added to the tribe`,
      metadata: {
        tribeName: tribe.name,
        interestName: interestData.name,
        interestCategory: interestData.category,
      },
    });

    // LD1: Return the created interest
    return interest;
  }

  /**
   * Remove an interest from a tribe
   * @param interestId - The ID of the interest to remove
   * @param tribeId - The ID of the tribe to remove the interest from
   * @param userId - The ID of the user performing the action
   * @returns True if removed, false if not found
   */
  async removeTribeInterest(interestId: string, tribeId: string, userId: string): Promise<boolean> {
    // LD1: Validate tribe ID using validateTribeId
    validateTribeId(tribeId);

    // LD1: Check if user has permission to remove interests (must be creator)
    if (!await this.memberService.hasPermission(tribeId, userId, [MemberRole.CREATOR])) {
      throw ApiError.forbidden('User does not have permission to remove interests from this tribe');
    }

    // LD1: Remove interest using tribeModel.removeInterest
    const removed = await this.tribeModel.removeInterest(interestId);

    // LD1: Record interest removal activity
    await this.activityService.createActivity({
      tribeId,
      userId,
      activityType: ActivityType.TRIBE_UPDATE,
      description: `Interest with ID "${interestId}" was removed from the tribe`,
      metadata: {
        interestId,
      },
    });

    // LD1: Return removal result
    return removed;
  }

  /**
   * Delete a tribe
   * @param tribeId - The ID of the tribe to delete
   * @param userId - The ID of the user performing the deletion
   * @returns True if deleted, false if not found
   */
  async deleteTribe(tribeId: string, userId: string): Promise<boolean> {
    // LD1: Validate tribe ID using validateTribeId
    validateTribeId(tribeId);

    // LD1: Check if user has permission to delete the tribe (must be creator)
    if (!await this.memberService.hasPermission(tribeId, userId, [MemberRole.CREATOR])) {
      throw ApiError.forbidden('User does not have permission to delete this tribe');
    }

    // LD1: Delete all tribe memberships using memberModel.deleteByTribeId
    await this.memberModel.deleteByTribeId(tribeId);

    // LD1: Delete all tribe activities using activityModel.deleteByTribeId
    await this.activityModel.deleteByTribeId(tribeId);

    // LD1: Delete tribe record using tribeModel.delete
    const deleted = await this.tribeModel.delete(tribeId);

    // LD1: Log tribe deletion
    logger.info('Tribe deleted', { tribeId, deletedBy: userId });

    // LD1: Return deletion result
    return deleted;
  }

  /**
   * Get tribe recommendations for a user based on interests and location
   * @param userId - The ID of the user to get recommendations for
   * @param interests - Array of interest categories
   * @param location - User's location coordinates
   * @param maxDistance - Maximum distance to search for tribes
   * @param limit - Maximum number of recommendations to return
   * @param offset - Offset for pagination
   * @returns Recommended tribes for the user
   */
  async getTribeRecommendations(userId: string, interests: InterestCategory[], location: ICoordinates, maxDistance: number, limit: number, offset: number): Promise<ITribeResponse[]> {
    // LD1: Get tribe recommendations using tribeModel.getRecommendations
    const tribes = await this.tribeModel.getRecommendations({ userId, interests, location, maxDistance, limit, offset });

    // LD1: Format tribe data for response
    const tribeResponses = await Promise.all(tribes.map(tribe => this.formatTribeResponse(tribe, { userId })));

    // LD1: Return recommended tribes
    return tribeResponses;
  }

  /**
   * Get AI-powered tribe recommendations for a user
   * @param userId - The ID of the user to get recommendations for
   * @param options - Optional parameters for pagination
   * @returns AI-recommended tribes for the user
   */
  async getAITribeRecommendations(userId: string, options: { limit?: number; offset?: number } = {}): Promise<ITribeResponse[]> {
    // LD1: Create orchestration request for tribe recommendations
    const request = await orchestrationService.createOrchestrationRequest(
      OrchestrationFeature.MATCHING,
      {
        operation: MatchingOperation.USER_TO_TRIBES,
        userId,
        options
      },
      userId,
      null,
      {},
      OrchestrationPriority.MEDIUM
    );

    // LD1: Process the orchestration request
    const response = await orchestrationService.processOrchestrationRequest(request.id);

    // LD1: Get recommended tribe IDs from the response
    const tribeIds = response.result.tribeIds || [];

    // LD1: Fetch full tribe details for each recommendation
    const tribes = await Promise.all(tribeIds.map(async (tribeId: string) => {
      return await this.tribeModel.findById(tribeId, true);
    }));

    // LD1: Format tribe data for response
    const tribeResponses = await Promise.all(tribes.map(tribe => this.formatTribeResponse(tribe, { userId })));

    // LD1: Return AI-recommended tribes
    return tribeResponses;
  }

  /**
   * Get engagement metrics for a tribe
   * @param tribeId - The ID of the tribe to get metrics for
   * @param timeFrame - Time frame for the metrics
   * @returns Tribe engagement metrics
   */
  async getTribeEngagementMetrics(tribeId: string, timeFrame: { period: 'day' | 'week' | 'month'; count?: number }): Promise<{ activityCount: number; activityTrend: number[]; topContributors: Array<{ userId: string; count: number }>; engagementScore: number }> {
    // LD1: Validate tribe ID using validateTribeId
    validateTribeId(tribeId);

    // LD1: Get engagement metrics using activityService.getEngagementMetrics
    const metrics = await this.activityService.getEngagementMetrics(tribeId, timeFrame);

    // LD1: Return engagement metrics
    return metrics;
  }

  /**
   * Format tribe data for API response
   * @param tribe - The tribe record to format
   * @param options - Optional parameters for formatting
   * @returns Formatted tribe response
   */
  async formatTribeResponse(tribe: ITribe, options: { userId?: string; includeCompatibility?: boolean } = {}): Promise<ITribeResponse> {
    // LD1: Extract relevant tribe data for response
    const { id, name, description, location, imageUrl, status, privacy, maxMembers, createdAt, lastActive, interests } = tribe;

    // LD1: Count active members in the tribe
    const memberCount = await this.memberModel.countByTribeId(id, { status: 'active' });

    let userMembership = null;
    if (options.userId) {
      // LD1: Get user's membership in the tribe if userId provided
      userMembership = await this.memberService.getUserMembershipInTribe(id, options.userId);
    }

    const compatibilityScore = 0; // TODO: Implement compatibility score calculation

    // LD1: Return formatted tribe response
    return {
      id,
      name,
      description,
      location,
      imageUrl,
      status,
      privacy,
      memberCount,
      maxMembers,
      interests,
      userMembership,
      createdAt,
      lastActive,
      compatibilityScore
    };
  }

  /**
   * Format detailed tribe data for API response
   * @param tribe - The tribe record to format
   * @param additionalData - Additional data to include in the response
   * @returns Formatted detailed tribe response
   */
  formatTribeDetailResponse(tribe: ITribe, additionalData: { userMembership?: any; upcomingEvents?: any[]; unreadMessageCount?: number } = {}): ITribeDetailResponse {
    // LD1: Extract all tribe data including related entities
    const { id, name, description, location, coordinates, imageUrl, status, privacy, maxMembers, createdBy, createdAt, lastActive, interests, members, activities, goals } = tribe;
    const { userMembership, upcomingEvents, unreadMessageCount } = additionalData;

    // LD1: Format members data with user information
    const formattedMembers = members.map(member => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
      user: {
        id: member.userId,
        name: 'TODO: Get user name', // TODO: Implement user name retrieval
        avatarUrl: 'TODO: Get user avatar', // TODO: Implement user avatar retrieval
      },
    }));

    // LD1: Format activities data with user information
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      activityType: activity.activityType,
      description: activity.description,
      timestamp: activity.timestamp,
      user: {
        id: activity.userId,
        name: 'TODO: Get user name', // TODO: Implement user name retrieval
      },
    }));

    // TODO: LD1: Format goals data
    const formattedGoals = goals.map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      targetDate: goal.targetDate,
      isCompleted: goal.isCompleted,
      completedAt: goal.completedAt,
    }));

    // LD1: Include additional data (userMembership, upcomingEvents, unreadMessageCount)
    const creatorName = 'TODO: Get creator name'; // TODO: Implement creator name retrieval

    // LD1: Return formatted detailed tribe response
    return {
      id,
      name,
      description,
      location,
      coordinates,
      imageUrl,
      status,
      privacy,
      maxMembers,
      createdBy,
      creatorName,
      interests,
      members: formattedMembers,
      activities: formattedActivities,
      goals: formattedGoals,
      upcomingEvents,
      userMembership,
      unreadMessageCount,
      createdAt,
      lastActive,
    };
  }
}