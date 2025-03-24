import mongoose from 'mongoose'; // ^6.0.0
import axios from 'axios'; // ^1.3.4
import {
  Engagement,
  IEngagementDocument,
  IEngagementCreate,
  IEngagementUpdate,
  IEngagementResponse,
  IEngagementResponseCreate,
  IEngagementMetricsResponse,
  IEngagementSearchParams,
  EngagementType,
  EngagementStatus,
  EngagementTrigger,
} from '../models/engagement.model';
import PromptService from './prompt.service';
import ChallengeService from './challenge.service';
import { logger } from '../../../shared/src/utils/logger.util';
import { ApiError } from '../../../shared/src/errors/api.error';
import metrics from '../../../config/metrics';

/**
 * Service class for managing engagement activities in the Tribe platform
 */
export class EngagementService {
  private promptService: PromptService;
  private challengeService: ChallengeService;
  private tribeServiceUrl: string;
  private aiOrchestrationUrl: string;

  /**
   * Initializes the engagement service
   */
  constructor() {
    // Initialize service dependencies
    this.promptService = PromptService;
    this.challengeService = ChallengeService;

    // Set up tribe service URL from configuration
    this.tribeServiceUrl = process.env.TRIBE_SERVICE_URL || 'http://tribe-service:3000/api/tribes';

    // Set up AI orchestration service URL from configuration
    this.aiOrchestrationUrl = process.env.AI_ORCHESTRATION_URL || 'http://ai-orchestration-service:3000/api/orchestrate';
  }

  /**
   * Creates a new engagement
   * @param engagementData - The engagement data for creation
   * @returns The created engagement
   */
  async createEngagement(engagementData: IEngagementCreate): Promise<IEngagementResponse> {
    try {
      // Call the createEngagement function
      const engagement = await createEngagement(engagementData);

      // Return the engagement response
      return engagement;
    } catch (error) {
      logger.error('Error creating engagement in EngagementService', error);
      throw error;
    }
  }

  /**
   * Gets an engagement by ID
   * @param engagementId - The ID of the engagement
   * @param userId - The ID of the user
   * @returns The engagement
   */
  async getEngagement(engagementId: string, userId: string): Promise<IEngagementResponse> {
    try {
      // Call the getEngagement function
      const engagement = await getEngagement(engagementId, userId);

      // Return the engagement response
      return engagement;
    } catch (error) {
      logger.error('Error getting engagement in EngagementService', error);
      throw error;
    }
  }

  /**
   * Updates an engagement
   * @param engagementId - The ID of the engagement
   * @param updateData - The data to update the engagement with
   * @returns The updated engagement
   */
  async updateEngagement(engagementId: string, updateData: IEngagementUpdate): Promise<IEngagementResponse> {
    try {
      // Call the updateEngagement function
      const engagement = await updateEngagement(engagementId, updateData);

      // Return the updated engagement response
      return engagement;
    } catch (error) {
      logger.error('Error updating engagement in EngagementService', error);
      throw error;
    }
  }

  /**
   * Deletes an engagement
   * @param engagementId - The ID of the engagement
   */
  async deleteEngagement(engagementId: string): Promise<void> {
    try {
      // Call the deleteEngagement function
      await deleteEngagement(engagementId);
    } catch (error) {
      logger.error('Error deleting engagement in EngagementService', error);
      throw error;
    }
  }

  /**
   * Lists engagements with filtering
   * @param filters - The filters to apply
   * @param pagination - The pagination parameters
   * @param userId - The ID of the user
   * @returns List of engagements and total count
   */
  async listEngagements(
    filters: IEngagementSearchParams,
    pagination: any,
    userId: string
  ): Promise<{ engagements: IEngagementResponse[]; total: number }> {
    try {
      // Call the listEngagements function
      const result = await listEngagements(filters, pagination, userId);

      // Return the engagements and total count
      return result;
    } catch (error) {
      logger.error('Error listing engagements in EngagementService', error);
      throw error;
    }
  }

  /**
   * Adds a user response to an engagement
   * @param engagementId - The ID of the engagement
   * @param responseData - The response data
   * @returns The updated engagement
   */
  async addEngagementResponse(engagementId: string, responseData: IEngagementResponseCreate): Promise<IEngagementResponse> {
    try {
      // Call the addEngagementResponse function
      const engagement = await addEngagementResponse(engagementId, responseData);

      // Return the updated engagement response
      return engagement;
    } catch (error) {
      logger.error('Error adding engagement response in EngagementService', error);
      throw error;
    }
  }

  /**
   * Marks an engagement as delivered
   * @param engagementId - The ID of the engagement
   * @returns The updated engagement
   */
  async deliverEngagement(engagementId: string): Promise<IEngagementResponse> {
    try {
      // Call the deliverEngagement function
      const engagement = await deliverEngagement(engagementId);

      // Return the updated engagement response
      return engagement;
    } catch (error) {
      logger.error('Error delivering engagement in EngagementService', error);
      throw error;
    }
  }

  /**
   * Marks an engagement as completed
   * @param engagementId - The ID of the engagement
   * @returns The updated engagement
   */
  async completeEngagement(engagementId: string): Promise<IEngagementResponse> {
    try {
      // Call the completeEngagement function
      const engagement = await completeEngagement(engagementId);

      // Return the updated engagement response
      return engagement;
    } catch (error) {
      logger.error('Error completing engagement in EngagementService', error);
      throw error;
    }
  }

  /**
   * Generates an AI-powered engagement
   * @param tribeId - The ID of the tribe
   * @param type - The type of engagement
   * @param trigger - The trigger for the engagement
   * @returns The generated engagement
   */
  async generateEngagement(tribeId: string, type: EngagementType, trigger: EngagementTrigger): Promise<IEngagementResponse> {
    try {
      // Call the generateEngagement function
      const engagement = await generateEngagement(tribeId, type, trigger);

      // Return the generated engagement response
      return engagement;
    } catch (error) {
      logger.error('Error generating engagement in EngagementService', error);
      throw error;
    }
  }

  /**
   * Checks and updates engagement statuses
   */
  async checkEngagementStatus(): Promise<void> {
    try {
      // Call the checkEngagementStatus function
      await checkEngagementStatus();
    } catch (error) {
      logger.error('Error checking engagement status in EngagementService', error);
      throw error;
    }
  }

  /**
   * Gets engagement metrics for a tribe
   * @param tribeId - The ID of the tribe
   * @param timeRange - The time range
   * @returns Engagement metrics
   */
  async getEngagementMetrics(tribeId: string, timeRange: any): Promise<IEngagementMetricsResponse> {
    try {
      // Call the getEngagementMetrics function
      const metrics = await getEngagementMetrics(tribeId, timeRange);

      // Return the metrics response
      return metrics;
    } catch (error) {
      logger.error('Error getting engagement metrics in EngagementService', error);
      throw error;
    }
  }

  /**
   * Detects tribes with low activity
   * @param daysThreshold - The days threshold
   * @param limit - The limit
   * @returns Array of tribe IDs with low activity
   */
  async detectLowActivity(daysThreshold: number, limit: number): Promise<string[]> {
    try {
      // Call the detectLowActivity function
      const tribeIds = await detectLowActivity(daysThreshold, limit);

      // Return the array of tribe IDs
      return tribeIds;
    } catch (error) {
      logger.error('Error detecting low activity tribes in EngagementService', error);
      throw error;
    }
  }

  /**
   * Generates automatic engagements for tribes with low activity
   */
  async generateAutomaticEngagements(daysThreshold: number, limit: number): Promise<number> {
    try {
      // Detect tribes with low activity using detectLowActivity
      const tribeIds = await this.detectLowActivity(daysThreshold, limit);
      let engagementCount = 0;

      // For each tribe, fetch tribe data from tribe service
      for (const tribeId of tribeIds) {
        try {
          const tribeData = await this.getTribeData(tribeId);

          // Determine appropriate engagement type based on tribe context
          const engagementType = EngagementType.CONVERSATION_PROMPT; // Default type

          // Generate engagement for each tribe using generateEngagement
          await this.generateEngagement(tribeId, engagementType, EngagementTrigger.LOW_ACTIVITY);
          engagementCount++;
        } catch (innerError) {
          logger.warn(`Failed to generate automatic engagement for tribe ${tribeId}`, innerError);
          // Continue to the next tribe even if one fails
        }
      }

      // Track metrics for automatic engagement generation
      logger.info(`Generated ${engagementCount} automatic engagements for low activity tribes`);

      // Return count of engagements generated
      return engagementCount;
    } catch (error) {
      logger.error('Error generating automatic engagements in EngagementService', error);
      throw ApiError.internal('Failed to generate automatic engagements', { error: (error as Error).message });
    }
  }

  /**
   * Fetches tribe data from the tribe service
   * @param tribeId - The ID of the tribe
   * @returns Tribe data including members, interests, and activity
   */
  async getTribeData(tribeId: string): Promise<object> {
    try {
      // Make HTTP request to tribe service API
      const response = await axios.get(`${this.tribeServiceUrl}/${tribeId}`);

      // Fetch tribe details, members, interests, and recent activity
      const tribeDetails = response.data;

      // Format and return the tribe data for engagement generation
      return {
        id: tribeDetails.id,
        name: tribeDetails.name,
        members: tribeDetails.members,
        interests: tribeDetails.interests,
        recentActivity: tribeDetails.recentActivity,
      };
    } catch (error) {
      logger.error(`Failed to fetch tribe data for tribe ${tribeId}`, error);
      throw ApiError.externalServiceError('Failed to fetch tribe data from tribe service', { tribeId });
    }
  }
}

/**
 * Creates a new engagement activity for a tribe
 * @param engagementData - The engagement data
 * @returns The created engagement
 */
async function createEngagement(engagementData: IEngagementCreate): Promise<IEngagementResponse> {
  try {
    // Validate the engagement data
    if (!engagementData) {
      throw ApiError.badRequest('Engagement data is required');
    }

    // Create a new Engagement document with the provided data
    const engagement = new Engagement(engagementData);

    // Set initial status to PENDING if not provided
    if (!engagement.status) {
      engagement.status = EngagementStatus.PENDING;
    }

    // Save the engagement to the database
    await engagement.save();

    // Format and return the engagement response
    return formatEngagementResponse(engagement);
  } catch (error) {
    logger.error('Error creating engagement', error);
    throw ApiError.internal('Failed to create engagement', { error: (error as Error).message });
  }
}

/**
 * Retrieves an engagement by its ID
 * @param engagementId - The ID of the engagement to retrieve
 * @param userId - The ID of the user
 * @returns The engagement with user response data
 */
async function getEngagement(engagementId: string, userId: string): Promise<IEngagementResponse> {
  try {
    // Validate the engagement ID
    if (!mongoose.Types.ObjectId.isValid(engagementId)) {
      throw ApiError.badRequest('Invalid engagement ID');
    }

    // Find the engagement by ID in the database
    const engagement = await Engagement.findById(engagementId);

    // If not found, throw a NotFoundError
    if (!engagement) {
      throw ApiError.notFound('Engagement not found');
    }

    // If userId is provided, check if the user has responded to the engagement
    const userHasResponded = userId ? engagement.responses.some(response => response.userId === userId) : false;

    // Format and return the engagement response with user response data
    return formatEngagementResponse(engagement, userId);
  } catch (error) {
    logger.error('Error getting engagement', error);
    throw ApiError.internal('Failed to get engagement', { error: (error as Error).message });
  }
}

/**
 * Updates an existing engagement
 * @param engagementId - The ID of the engagement to update
 * @param updateData - The data to update the engagement with
 * @returns The updated engagement
 */
async function updateEngagement(engagementId: string, updateData: IEngagementUpdate): Promise<IEngagementResponse> {
  try {
    // Validate the engagement ID and update data
    if (!mongoose.Types.ObjectId.isValid(engagementId)) {
      throw ApiError.badRequest('Invalid engagement ID');
    }

    if (!updateData) {
      throw ApiError.badRequest('Update data is required');
    }

    // Find the engagement by ID in the database
    const engagement = await Engagement.findById(engagementId);

    // If not found, throw a NotFoundError
    if (!engagement) {
      throw ApiError.notFound('Engagement not found');
    }

    // Update the engagement with the provided data
    if (updateData.content) engagement.content = updateData.content;
    if (updateData.status) engagement.status = updateData.status;
    if (updateData.expiresAt) engagement.expiresAt = updateData.expiresAt;
    if (updateData.metadata) engagement.metadata = updateData.metadata;

    // Save the updated engagement to the database
    await engagement.save();

    // Format and return the updated engagement response
    return formatEngagementResponse(engagement);
  } catch (error) {
    logger.error('Error updating engagement', error);
    throw ApiError.internal('Failed to update engagement', { error: (error as Error).message });
  }
}

/**
 * Deletes an engagement by its ID
 * @param engagementId - The ID of the engagement to delete
 */
async function deleteEngagement(engagementId: string): Promise<void> {
  try {
    // Validate the engagement ID
    if (!mongoose.Types.ObjectId.isValid(engagementId)) {
      throw ApiError.badRequest('Invalid engagement ID');
    }

    // Find the engagement by ID in the database
    const engagement = await Engagement.findById(engagementId);

    // If not found, throw a NotFoundError
    if (!engagement) {
      throw ApiError.notFound('Engagement not found');
    }

    // Delete the engagement from the database
    await Engagement.deleteOne({ _id: engagementId });

    // Log the deletion
    logger.info('Engagement deleted successfully', { engagementId });
  } catch (error) {
    logger.error('Error deleting engagement', error);
    throw ApiError.internal('Failed to delete engagement', { error: (error as Error).message });
  }
}

/**
 * Lists engagements based on filter criteria
 * @param filters - The filters to apply
 * @param pagination - The pagination parameters
 * @param userId - The ID of the user
 * @returns List of engagements and total count
 */
async function listEngagements(
  filters: IEngagementSearchParams,
  pagination: any,
  userId: string
): Promise<{ engagements: IEngagementResponse[]; total: number }> {
  try {
    // Build query based on provided filters
    const query: any = {};

    if (filters.tribeId) query.tribeId = filters.tribeId;
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.trigger) query.trigger = filters.trigger;
    if (filters.createdBy) query.createdBy = filters.createdBy;
    if (filters.aiGenerated !== undefined) query.aiGenerated = filters.aiGenerated;

    // Apply pagination parameters
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    // Execute query to get engagements and total count
    const [engagements, total] = await Promise.all([
      Engagement.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Engagement.countDocuments(query).exec()
    ]);

    // Format the engagements
    const formattedEngagements = engagements.map(engagement => formatEngagementResponse(engagement, userId));

    // Return the engagements with pagination metadata
    return {
      engagements: formattedEngagements,
      total
    };
  } catch (error) {
    logger.error('Error listing engagements', error);
    throw ApiError.internal('Failed to list engagements', { error: (error as Error).message });
  }
}

/**
 * Adds a user response to an engagement
 * @param engagementId - The ID of the engagement
 * @param responseData - The response data
 * @returns The updated engagement
 */
async function addEngagementResponse(engagementId: string, responseData: IEngagementResponseCreate): Promise<IEngagementResponse> {
  try {
    // Validate the engagement ID and response data
    if (!mongoose.Types.ObjectId.isValid(engagementId)) {
      throw ApiError.badRequest('Invalid engagement ID');
    }

    if (!responseData) {
      throw ApiError.badRequest('Response data is required');
    }

    // Find the engagement by ID in the database
    const engagement = await Engagement.findById(engagementId);

    // If not found, throw a NotFoundError
    if (!engagement) {
      throw ApiError.notFound('Engagement not found');
    }

    // Check if the engagement is still active (not EXPIRED or COMPLETED)
    if (engagement.status === EngagementStatus.EXPIRED || engagement.status === EngagementStatus.COMPLETED) {
      throw ApiError.badRequest('Cannot respond to an expired or completed engagement');
    }

    // Check if the user has already responded
    const userHasResponded = engagement.responses.some(response => response.userId === responseData.userId);
    if (userHasResponded) {
      throw ApiError.badRequest('User has already responded to this engagement');
    }

    // Add the response to the engagement's responses array
    engagement.responses.push({
      userId: responseData.userId,
      content: responseData.content,
      responseType: responseData.responseType,
      metadata: responseData.metadata || {},
      createdAt: new Date()
    });

    // Update engagement status to RESPONDED if first response
    if (engagement.responses.length === 1) {
      engagement.status = EngagementStatus.RESPONDED;
    }

    // Save the updated engagement to the database
    await engagement.save();

    // Track response metrics
    metrics.requestCounter.inc({ endpoint: 'engagement', method: 'respond' });

    // Update prompt usage statistics if applicable
    if (engagement.aiGenerated) {
      await PromptService.updatePromptUsage(engagement.id, {
        used: true,
        receivedResponse: true,
        engagementId: engagement.id
      });
    }

    // Format and return the updated engagement response
    return formatEngagementResponse(engagement, responseData.userId);
  } catch (error) {
    logger.error('Error adding engagement response', error);
    throw ApiError.internal('Failed to add engagement response', { error: (error as Error).message });
  }
}

/**
 * Marks an engagement as delivered to users
 * @param engagementId - The ID of the engagement
 * @returns The updated engagement
 */
async function deliverEngagement(engagementId: string): Promise<IEngagementResponse> {
  try {
    // Validate the engagement ID
    if (!mongoose.Types.ObjectId.isValid(engagementId)) {
      throw ApiError.badRequest('Invalid engagement ID');
    }

    // Find the engagement by ID in the database
    const engagement = await Engagement.findById(engagementId);

    // If not found, throw a NotFoundError
    if (!engagement) {
      throw ApiError.notFound('Engagement not found');
    }

    // Update the engagement status to DELIVERED
    engagement.status = EngagementStatus.DELIVERED;

    // Set the deliveredAt timestamp to current time
    engagement.deliveredAt = new Date();

    // Save the updated engagement to the database
    await engagement.save();

    // Track delivery metrics
    metrics.requestCounter.inc({ endpoint: 'engagement', method: 'deliver' });

    // Format and return the updated engagement response
    return formatEngagementResponse(engagement);
  } catch (error) {
    logger.error('Error delivering engagement', error);
    throw ApiError.internal('Failed to deliver engagement', { error: (error as Error).message });
  }
}

/**
 * Marks an engagement as completed
 * @param engagementId - The ID of the engagement
 * @returns The updated engagement
 */
async function completeEngagement(engagementId: string): Promise<IEngagementResponse> {
  try {
    // Validate the engagement ID
    if (!mongoose.Types.ObjectId.isValid(engagementId)) {
      throw ApiError.badRequest('Invalid engagement ID');
    }

    // Find the engagement by ID in the database
    const engagement = await Engagement.findById(engagementId);

    // If not found, throw a NotFoundError
    if (!engagement) {
      throw ApiError.notFound('Engagement not found');
    }

    // Update the engagement status to COMPLETED
    engagement.status = EngagementStatus.COMPLETED;

    // Save the updated engagement to the database
    await engagement.save();

    // Track completion metrics
    metrics.requestCounter.inc({ endpoint: 'engagement', method: 'complete' });

    // Format and return the updated engagement response
    return formatEngagementResponse(engagement);
  } catch (error) {
    logger.error('Error completing engagement', error);
    throw ApiError.internal('Failed to complete engagement', { error: (error as Error).message });
  }
}

/**
 * Generates a new AI-powered engagement for a tribe
 * @param tribeId - The ID of the tribe to generate a challenge for
 * @param type - The type of engagement to generate
 * @param trigger - The trigger for the engagement
 * @returns The generated engagement
 */
async function generateEngagement(tribeId: string, type: EngagementType, trigger: EngagementTrigger): Promise<IEngagementResponse> {
  try {
    // Validate the tribe ID, engagement type, and trigger
    if (!mongoose.Types.ObjectId.isValid(tribeId)) {
      throw ApiError.badRequest('Invalid tribe ID');
    }

    if (!Object.values(EngagementType).includes(type)) {
      throw ApiError.badRequest('Invalid engagement type');
    }

    if (!Object.values(EngagementTrigger).includes(trigger)) {
      throw ApiError.badRequest('Invalid engagement trigger');
    }

    // Fetch tribe data including member profiles, interests, and recent activities
    // This would typically involve calling the tribe service
    const tribeData = {
      id: tribeId,
      name: 'Tribe Name', // Replace with actual tribe name
      members: [], // Replace with actual member profiles
      interests: ['Hiking', 'Photography'], // Replace with actual tribe interests
      recentActivities: [] // Replace with actual recent activities
    };

    // Determine the appropriate engagement generation strategy based on type
    let content, metadata;

    switch (type) {
      case EngagementType.CONVERSATION_PROMPT:
        // Use PromptService to find or generate a relevant prompt
        const prompt = await PromptService.getRandomPrompt(type, PromptCategory.GENERAL);
        content = prompt.content;
        metadata = { promptId: prompt.id };
        break;

      case EngagementType.ACTIVITY_SUGGESTION:
        // Generate activity suggestions based on tribe interests and location
        content = 'Suggest a local activity'; // Replace with actual activity suggestion logic
        metadata = { activityType: 'Local Event' };
        break;

      case EngagementType.GROUP_CHALLENGE:
        // Use ChallengeService to generate and activate a challenge
        const challenge = await ChallengeService.generateChallenge(tribeId, 'PHOTO');
        content = challenge.description;
        metadata = { challengeId: challenge.id };
        break;

      case EngagementType.MEETUP_SUGGESTION:
        // Generate meetup suggestions based on location and weather
        content = 'Suggest a meetup location'; // Replace with actual meetup suggestion logic
        metadata = { location: 'Local Park' };
        break;

      case EngagementType.POLL_QUESTION:
        // Generate poll questions relevant to the tribe
        content = 'What should we do this weekend?'; // Replace with actual poll question logic
        metadata = { pollOptions: ['Option 1', 'Option 2'] };
        break;

      default:
        throw ApiError.badRequest('Unsupported engagement type');
    }

    // Create a new engagement with the generated content
    const engagementData: IEngagementCreate = {
      tribeId,
      type,
      content,
      status: EngagementStatus.PENDING,
      trigger,
      createdBy: 'system', // Replace with actual user ID if applicable
      aiGenerated: true,
      metadata
    };

    // Save the engagement to the database
    const engagement = new Engagement(engagementData);
    await engagement.save();

    // Format and return the generated engagement response
    return formatEngagementResponse(engagement);
  } catch (error) {
    logger.error('Error generating engagement', error);
    throw ApiError.internal('Failed to generate engagement', { error: (error as Error).message });
  }
}

/**
 * Checks and updates the status of engagements based on their expiration dates
 */
async function checkEngagementStatus(): Promise<void> {
  try {
    // Find engagements with PENDING or DELIVERED status where expiresAt has passed
    const expiredEngagements = await Engagement.find({
      status: { $in: [EngagementStatus.PENDING, EngagementStatus.DELIVERED] },
      expiresAt: { $lt: new Date() }
    });

    // Update these engagements to EXPIRED status
    await Engagement.updateMany(
      { _id: { $in: expiredEngagements.map(e => e._id) } },
      { $set: { status: EngagementStatus.EXPIRED } }
    );

    // Log the number of engagements updated
    logger.info(`Updated ${expiredEngagements.length} engagements to EXPIRED status`);

    // Track expired engagements in metrics
    metrics.requestCounter.inc({ endpoint: 'engagement', method: 'expire' }, expiredEngagements.length);
  } catch (error) {
    logger.error('Error checking engagement status', error);
    // We don't throw here since this is typically called by a scheduled job
  }
}

/**
 * Gets engagement metrics for a tribe
 * @param tribeId - The ID of the tribe to get metrics for
 * @param timeRange - Optional time range for metrics
 * @returns Engagement metrics for the tribe
 */
async function getEngagementMetrics(tribeId: string, timeRange?: any): Promise<IEngagementMetricsResponse> {
  try {
    // Validate the tribe ID
    if (!mongoose.Types.ObjectId.isValid(tribeId)) {
      throw ApiError.badRequest('Invalid tribe ID');
    }

    // Build query based on tribe ID and time range
    const query: any = { tribeId };

    if (timeRange && timeRange.startDate && timeRange.endDate) {
      query.createdAt = {
        $gte: timeRange.startDate,
        $lte: timeRange.endDate
      };
    }

    // Retrieve engagements for the tribe
    const engagements = await Engagement.find(query);

    // Calculate metrics including total engagements, response rate, engagements by type
    const totalEngagements = engagements.length;
    const responseRate = totalEngagements > 0 ? engagements.filter(e => e.responses.length > 0).length / totalEngagements : 0;
    const engagementsByType: { [key: string]: number } = {};
    engagements.forEach(e => {
      engagementsByType[e.type] = (engagementsByType[e.type] || 0) + 1;
    });

    // Identify top responders in the tribe
    const topResponders = engagements.reduce((acc, e) => {
      e.responses.forEach(r => {
        acc[r.userId] = (acc[r.userId] || 0) + 1;
      });
      return acc;
    }, {});

    // Get recent engagements for context
    const recentEngagements = engagements.slice(0, 5).map(e => formatEngagementResponse(e));

    // Return the compiled metrics
    return {
      totalEngagements,
      responseRate,
      engagementsByType,
      topResponders,
      recentEngagements,
      timeRange: {
        startDate: timeRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to 30 days ago
        endDate: timeRange?.endDate || new Date()
      }
    };
  } catch (error) {
    logger.error('Error getting engagement metrics', error);
    throw ApiError.internal('Failed to get engagement metrics', { error: (error as Error).message });
  }
}

/**
 * Detects tribes with low activity that may need engagement
 * @param daysThreshold - The number of days since the last activity to consider a tribe inactive
 * @param limit - The maximum number of tribe IDs to return
 * @returns An array of tribe IDs with low activity
 */
async function detectLowActivity(daysThreshold: number, limit: number): Promise<string[]> {
  try {
    // Calculate the date threshold based on daysThreshold
    const thresholdDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);

    // Query tribes with no recent activity since the threshold date
    const tribes = await Engagement.aggregate([
      {
        $match: {
          createdAt: { $lt: thresholdDate }
        }
      },
      {
        $group: {
          _id: '$tribeId',
          lastActivity: { $max: '$createdAt' }
        }
      },
      {
        $sort: { lastActivity: 1 }
      },
      {
        $limit: limit
      }
    ]);

    // Return array of tribe IDs that need engagement
    return tribes.map(tribe => tribe._id);
  } catch (error) {
    logger.error('Error detecting low activity tribes', error);
    throw ApiError.internal('Failed to detect low activity tribes', { error: (error as Error).message });
  }
}

/**
 * Formats an engagement document into a response object
 * @param engagement - The engagement document to format
 * @param userId - The ID of the user
 * @returns Formatted engagement response
 */
function formatEngagementResponse(engagement: IEngagementDocument, userId?: string): IEngagementResponse {
  // Extract relevant fields from the engagement document
  const { _id, tribeId, type, content, status, trigger, createdBy, deliveredAt, expiresAt, responses, aiGenerated, metadata, createdAt, updatedAt } = engagement;

  // Calculate response count
  const responseCount = responses.length;

  // Check if the specified user has responded if userId is provided
  const userHasResponded = userId ? responses.some(response => response.userId === userId) : false;

  // Format dates and other fields as needed
  const formattedEngagement: IEngagementResponse = {
    id: _id.toString(),
    tribeId,
    type,
    content,
    status,
    trigger,
    createdBy,
    deliveredAt,
    expiresAt,
    responseCount,
    userHasResponded,
    responses: responses.map(r => ({
      userId: r.userId,
      content: r.content,
      responseType: r.responseType,
      metadata: r.metadata,
      createdAt: r.createdAt
    })),
    aiGenerated,
    metadata,
    createdAt,
    updatedAt
  };

  // Return the formatted engagement response object
  return formattedEngagement;
}

// Export the engagement service for use in controllers and other services
export default new EngagementService();