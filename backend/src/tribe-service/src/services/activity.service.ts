import { ActivityModel } from '../models/activity.model';
import { TribeModel } from '../models/tribe.model';
import { 
  validateCreateActivity, 
  validateActivityFilters, 
  validateAIEngagementActivity 
} from '../validations/activity.validation';
import { ITribeActivity, ActivityType } from '@shared/types';
import { ApiError } from '@shared/errors';
import { logger } from '@shared/utils';

/**
 * Service class for managing tribe activities in the Tribe platform
 */
export class ActivityService {
  private activityModel: ActivityModel;
  private tribeModel: TribeModel;

  /**
   * Initialize the activity service with required models
   * 
   * @param activityModel - The activity model for database operations
   * @param tribeModel - The tribe model for tribe-related operations
   */
  constructor(activityModel: ActivityModel, tribeModel: TribeModel) {
    this.activityModel = activityModel;
    this.tribeModel = tribeModel;
  }

  /**
   * Create a new tribe activity record
   * 
   * @param activityData - The activity data to create
   * @returns The created activity record
   */
  async createActivity(activityData: Omit<ITribeActivity, 'id' | 'timestamp'>): Promise<ITribeActivity> {
    try {
      // Validate activity data
      validateCreateActivity(activityData);
      
      // Verify tribe exists
      const tribe = await this.tribeModel.findById(activityData.tribeId);
      if (!tribe) {
        throw ApiError.notFound(`Tribe with ID ${activityData.tribeId} not found`);
      }
      
      // Create activity record
      const activity = await this.activityModel.create(activityData);
      
      // Update tribe's lastActive timestamp
      await this.tribeModel.updateLastActive(activityData.tribeId);
      
      logger.info('Activity created', { activityId: activity.id, tribeId: activity.tribeId, type: activity.activityType });
      
      return activity;
    } catch (error) {
      logger.error('Error creating activity', error as Error, { tribeId: activityData.tribeId });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Get a specific activity by ID
   * 
   * @param activityId - The activity ID
   * @returns The activity record
   */
  async getActivity(activityId: string): Promise<ITribeActivity> {
    try {
      const activity = await this.activityModel.findById(activityId);
      
      if (!activity) {
        throw ApiError.notFound(`Activity with ID ${activityId} not found`);
      }
      
      return activity;
    } catch (error) {
      logger.error('Error getting activity', error as Error, { activityId });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Get activities for a specific tribe
   * 
   * @param tribeId - The tribe ID
   * @param options - Optional filtering and pagination parameters
   * @returns List of tribe activities
   */
  async getTribeActivities(
    tribeId: string,
    options: { limit?: number; offset?: number; activityTypes?: ActivityType[] } = {}
  ): Promise<ITribeActivity[]> {
    try {
      // Validate options
      validateActivityFilters(options);
      
      // Verify tribe exists
      const tribe = await this.tribeModel.findById(tribeId);
      if (!tribe) {
        throw ApiError.notFound(`Tribe with ID ${tribeId} not found`);
      }
      
      // Get activities
      const activities = await this.activityModel.findByTribeId(tribeId, options);
      
      return activities;
    } catch (error) {
      logger.error('Error getting tribe activities', error as Error, { tribeId });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Get activities performed by a specific user
   * 
   * @param userId - The user ID
   * @param options - Optional filtering and pagination parameters
   * @returns List of user's activities
   */
  async getUserActivities(
    userId: string,
    options: { limit?: number; offset?: number; tribeId?: string } = {}
  ): Promise<ITribeActivity[]> {
    try {
      // Validate options
      validateActivityFilters(options);
      
      // Get activities
      const activities = await this.activityModel.findByUserId(userId, options);
      
      return activities;
    } catch (error) {
      logger.error('Error getting user activities', error as Error, { userId });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Get recent activities across all tribes
   * 
   * @param options - Optional pagination parameters
   * @returns List of recent activities
   */
  async getRecentActivities(
    options: { limit?: number; offset?: number } = {}
  ): Promise<ITribeActivity[]> {
    try {
      // Validate options
      validateActivityFilters(options);
      
      // Get recent activities
      const activities = await this.activityModel.findRecent(options);
      
      return activities;
    } catch (error) {
      logger.error('Error getting recent activities', error as Error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Count activities for a specific tribe
   * 
   * @param tribeId - The tribe ID
   * @param options - Optional filtering parameters
   * @returns Count of tribe activities
   */
  async countTribeActivities(
    tribeId: string,
    options: { activityTypes?: ActivityType[]; startDate?: Date; endDate?: Date } = {}
  ): Promise<number> {
    try {
      // Verify tribe exists
      const tribe = await this.tribeModel.findById(tribeId);
      if (!tribe) {
        throw ApiError.notFound(`Tribe with ID ${tribeId} not found`);
      }
      
      // Count activities
      const count = await this.activityModel.countByTribeId(tribeId, options);
      
      return count;
    } catch (error) {
      logger.error('Error counting tribe activities', error as Error, { tribeId });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Get activity statistics for a tribe
   * 
   * @param tribeId - The tribe ID
   * @param dateRange - Optional date range for the statistics
   * @returns Activity statistics
   */
  async getTribeActivityStats(
    tribeId: string,
    dateRange: { startDate?: Date; endDate?: Date } = {}
  ): Promise<{ total: number; byType: Record<ActivityType, number>; byUser: Record<string, number> }> {
    try {
      // Verify tribe exists
      const tribe = await this.tribeModel.findById(tribeId);
      if (!tribe) {
        throw ApiError.notFound(`Tribe with ID ${tribeId} not found`);
      }
      
      // Get activity stats
      const stats = await this.activityModel.getActivityStats(tribeId, dateRange);
      
      return stats;
    } catch (error) {
      logger.error('Error getting tribe activity stats', error as Error, { tribeId });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Create an AI-generated engagement activity
   * 
   * @param tribeId - The tribe ID
   * @param description - The engagement activity description
   * @param metadata - Additional metadata for the engagement
   * @returns The created AI engagement activity
   */
  async createAIEngagementActivity(
    tribeId: string,
    description: string,
    metadata: Record<string, any>
  ): Promise<ITribeActivity> {
    try {
      // Validate AI engagement activity data
      validateAIEngagementActivity({ tribeId, description, metadata });
      
      // Verify tribe exists
      const tribe = await this.tribeModel.findById(tribeId);
      if (!tribe) {
        throw ApiError.notFound(`Tribe with ID ${tribeId} not found`);
      }
      
      // Create activity with AI_SUGGESTION type
      const activityData = {
        tribeId,
        userId: 'system', // System user ID for AI-generated activities
        activityType: ActivityType.AI_SUGGESTION,
        description,
        metadata: {
          ...metadata,
          generatedBy: 'ai',
          timestamp: new Date()
        }
      };
      
      // Create activity record
      const activity = await this.activityModel.create(activityData);
      
      // Update tribe's lastActive timestamp
      await this.tribeModel.updateLastActive(tribeId);
      
      logger.info('AI engagement activity created', { 
        activityId: activity.id, 
        tribeId, 
        type: ActivityType.AI_SUGGESTION 
      });
      
      return activity;
    } catch (error) {
      logger.error('Error creating AI engagement activity', error as Error, { tribeId });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Delete a specific activity
   * 
   * @param activityId - The activity ID
   * @returns True if deleted, false if not found
   */
  async deleteActivity(activityId: string): Promise<boolean> {
    try {
      // Find the activity first to verify it exists
      const activity = await this.activityModel.findById(activityId);
      if (!activity) {
        return false;
      }
      
      // Delete the activity
      const result = await this.activityModel.delete(activityId);
      
      logger.info('Activity deleted', { activityId });
      
      return result;
    } catch (error) {
      logger.error('Error deleting activity', error as Error, { activityId });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Delete all activities for a specific tribe
   * 
   * @param tribeId - The tribe ID
   * @returns Number of activities deleted
   */
  async deleteTribesActivities(tribeId: string): Promise<number> {
    try {
      // Verify tribe exists
      const tribe = await this.tribeModel.findById(tribeId);
      if (!tribe) {
        throw ApiError.notFound(`Tribe with ID ${tribeId} not found`);
      }
      
      // Delete all tribe activities
      const count = await this.activityModel.deleteByTribeId(tribeId);
      
      logger.info('Tribe activities deleted', { tribeId, count });
      
      return count;
    } catch (error) {
      logger.error('Error deleting tribe activities', error as Error, { tribeId });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Get a chronological timeline of tribe activities
   * 
   * @param tribeId - The tribe ID
   * @param options - Optional filtering and pagination parameters
   * @returns Timeline of activities with total count
   */
  async getActivityTimeline(
    tribeId: string,
    options: { limit?: number; offset?: number; startDate?: Date; endDate?: Date } = {}
  ): Promise<{ activities: ITribeActivity[]; total: number }> {
    try {
      // Validate options
      validateActivityFilters(options);
      
      // Verify tribe exists
      const tribe = await this.tribeModel.findById(tribeId);
      if (!tribe) {
        throw ApiError.notFound(`Tribe with ID ${tribeId} not found`);
      }
      
      // Get activities for the timeline
      const activities = await this.activityModel.findByTribeId(tribeId, {
        limit: options.limit,
        offset: options.offset,
        activityTypes: undefined // Include all activity types
      });
      
      // Count total activities matching the criteria
      const total = await this.activityModel.countByTribeId(tribeId, {
        startDate: options.startDate,
        endDate: options.endDate
      });
      
      return { activities, total };
    } catch (error) {
      logger.error('Error getting activity timeline', error as Error, { tribeId });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Get engagement metrics based on activities
   * 
   * @param tribeId - The tribe ID
   * @param timeFrame - Time frame for the metrics
   * @returns Engagement metrics
   */
  async getEngagementMetrics(
    tribeId: string,
    timeFrame: { period: 'day' | 'week' | 'month'; count?: number }
  ): Promise<{
    activityCount: number;
    activityTrend: number[];
    topContributors: Array<{ userId: string; count: number }>;
    engagementScore: number;
  }> {
    try {
      // Verify tribe exists
      const tribe = await this.tribeModel.findById(tribeId);
      if (!tribe) {
        throw ApiError.notFound(`Tribe with ID ${tribeId} not found`);
      }
      
      // Calculate date ranges based on timeFrame
      const now = new Date();
      const count = timeFrame.count || 6; // Default to 6 periods
      const periods: Date[] = [];
      
      // Generate the period boundaries
      for (let i = 0; i <= count; i++) {
        const date = new Date(now);
        
        switch (timeFrame.period) {
          case 'day':
            date.setDate(now.getDate() - i);
            break;
          case 'week':
            date.setDate(now.getDate() - (i * 7));
            break;
          case 'month':
            date.setMonth(now.getMonth() - i);
            break;
        }
        
        periods.unshift(date);
      }
      
      // Calculate activity counts for each period
      const activityTrend: number[] = [];
      for (let i = 0; i < periods.length - 1; i++) {
        const startDate = periods[i];
        const endDate = periods[i + 1];
        
        const periodCount = await this.activityModel.countByTribeId(tribeId, {
          startDate,
          endDate
        });
        
        activityTrend.push(periodCount);
      }
      
      // Get total activity count
      const activityCount = activityTrend.reduce((sum, count) => sum + count, 0);
      
      // Get activity stats to find top contributors
      const stats = await this.activityModel.getActivityStats(tribeId, {
        startDate: periods[0],
        endDate: periods[periods.length - 1]
      });
      
      // Format top contributors
      const topContributors = Object.entries(stats.byUser)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 contributors
      
      // Calculate overall engagement score (simplified version)
      const engagementScore = Math.min(100, Math.round(
        (activityCount / Math.max(1, tribe.members.length * periods.length)) * 100
      ));
      
      return {
        activityCount,
        activityTrend,
        topContributors,
        engagementScore
      };
    } catch (error) {
      logger.error('Error getting engagement metrics', error as Error, { tribeId });
      throw ApiError.fromError(error as Error);
    }
  }
}

// Export the service class for use throughout the application
export default new ActivityService(new ActivityModel(), new TribeModel());