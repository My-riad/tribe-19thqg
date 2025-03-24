import { PrismaClient } from '@prisma/client';
import { ITribeActivity, ActivityType } from '@shared/types';

/**
 * Model class for tribe activity operations using Prisma ORM
 */
export class ActivityModel {
  private prisma: PrismaClient;

  /**
   * Initialize the activity model with Prisma client
   * @param prisma - The Prisma client instance
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new tribe activity record
   * @param activityData - The activity data to create
   * @returns The created activity record
   */
  async create(activityData: Omit<ITribeActivity, 'id' | 'timestamp'>): Promise<ITribeActivity> {
    // Validate required fields
    if (!activityData.tribeId || !activityData.userId || !activityData.activityType || !activityData.description) {
      throw new Error('Missing required activity data fields');
    }

    // Create the activity record with Prisma, setting the timestamp to now if not provided
    const activity = await this.prisma.tribeActivity.create({
      data: {
        tribeId: activityData.tribeId,
        userId: activityData.userId,
        activityType: activityData.activityType,
        description: activityData.description,
        timestamp: new Date(), // Set to current time
        metadata: activityData.metadata || {},
      },
    });

    // Return the created activity
    return activity as unknown as ITribeActivity;
  }

  /**
   * Find a specific activity by ID
   * @param id - The activity ID
   * @returns The activity record if found, null otherwise
   */
  async findById(id: string): Promise<ITribeActivity | null> {
    if (!id) {
      throw new Error('Activity ID is required');
    }

    const activity = await this.prisma.tribeActivity.findUnique({
      where: { id },
    });

    return activity as unknown as ITribeActivity | null;
  }

  /**
   * Find activities for a specific tribe
   * @param tribeId - The tribe ID
   * @param options - Optional filtering and pagination parameters
   * @returns List of tribe activities
   */
  async findByTribeId(
    tribeId: string,
    options: {
      limit?: number;
      offset?: number;
      activityTypes?: ActivityType[];
    } = {}
  ): Promise<ITribeActivity[]> {
    if (!tribeId) {
      throw new Error('Tribe ID is required');
    }

    const { limit = 20, offset = 0, activityTypes } = options;

    // Build the query with optional filters
    const query: any = {
      where: {
        tribeId,
        ...(activityTypes && activityTypes.length > 0
          ? { activityType: { in: activityTypes } }
          : {}),
      },
      orderBy: {
        timestamp: 'desc', // Newest first
      },
      skip: offset,
      take: limit,
    };

    const activities = await this.prisma.tribeActivity.findMany(query);

    return activities as unknown as ITribeActivity[];
  }

  /**
   * Find activities performed by a specific user
   * @param userId - The user ID
   * @param options - Optional filtering and pagination parameters
   * @returns List of user's activities
   */
  async findByUserId(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      tribeId?: string;
    } = {}
  ): Promise<ITribeActivity[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { limit = 20, offset = 0, tribeId } = options;

    // Build the query with optional tribe filter
    const query: any = {
      where: {
        userId,
        ...(tribeId ? { tribeId } : {}),
      },
      orderBy: {
        timestamp: 'desc', // Newest first
      },
      skip: offset,
      take: limit,
    };

    const activities = await this.prisma.tribeActivity.findMany(query);

    return activities as unknown as ITribeActivity[];
  }

  /**
   * Find recent activities across all tribes
   * @param options - Optional pagination parameters
   * @returns List of recent activities
   */
  async findRecent(
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ITribeActivity[]> {
    const { limit = 20, offset = 0 } = options;

    const activities = await this.prisma.tribeActivity.findMany({
      orderBy: {
        timestamp: 'desc', // Newest first
      },
      skip: offset,
      take: limit,
    });

    return activities as unknown as ITribeActivity[];
  }

  /**
   * Count activities for a specific tribe
   * @param tribeId - The tribe ID
   * @param options - Optional filtering parameters
   * @returns Count of tribe activities
   */
  async countByTribeId(
    tribeId: string,
    options: {
      activityTypes?: ActivityType[];
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<number> {
    if (!tribeId) {
      throw new Error('Tribe ID is required');
    }

    const { activityTypes, startDate, endDate } = options;

    // Build the query with optional filters
    const whereClause: any = {
      tribeId,
      ...(activityTypes && activityTypes.length > 0
        ? { activityType: { in: activityTypes } }
        : {}),
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) {
        whereClause.timestamp.gte = startDate;
      }
      if (endDate) {
        whereClause.timestamp.lte = endDate;
      }
    }

    const count = await this.prisma.tribeActivity.count({
      where: whereClause,
    });

    return count;
  }

  /**
   * Get activity statistics for a tribe
   * @param tribeId - The tribe ID
   * @param dateRange - Optional date range for the statistics
   * @returns Activity statistics
   */
  async getActivityStats(
    tribeId: string,
    dateRange: {
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    total: number;
    byType: Record<ActivityType, number>;
    byUser: Record<string, number>;
  }> {
    if (!tribeId) {
      throw new Error('Tribe ID is required');
    }

    const { startDate, endDate } = dateRange;

    // Build the where clause with date range if provided
    const whereClause: any = { tribeId };
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) {
        whereClause.timestamp.gte = startDate;
      }
      if (endDate) {
        whereClause.timestamp.lte = endDate;
      }
    }

    // Get total count
    const total = await this.prisma.tribeActivity.count({
      where: whereClause,
    });

    // Initialize byType counts
    const byType: Record<ActivityType, number> = {} as Record<ActivityType, number>;
    for (const type of Object.values(ActivityType)) {
      // Count activities of this type
      const typeCount = await this.prisma.tribeActivity.count({
        where: {
          ...whereClause,
          activityType: type,
        },
      });
      byType[type] = typeCount;
    }

    // Get counts by user
    const userCounts = await this.prisma.tribeActivity.groupBy({
      by: ['userId'],
      where: whereClause,
      _count: {
        userId: true,
      },
    });

    // Convert to expected format
    const byUser: Record<string, number> = {};
    userCounts.forEach((item) => {
      byUser[item.userId] = item._count.userId;
    });

    return {
      total,
      byType,
      byUser,
    };
  }

  /**
   * Delete a specific activity
   * @param id - The activity ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Activity ID is required');
    }

    try {
      await this.prisma.tribeActivity.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      // Activity not found
      return false;
    }
  }

  /**
   * Delete all activities for a specific tribe
   * @param tribeId - The tribe ID
   * @returns Number of activities deleted
   */
  async deleteByTribeId(tribeId: string): Promise<number> {
    if (!tribeId) {
      throw new Error('Tribe ID is required');
    }

    const result = await this.prisma.tribeActivity.deleteMany({
      where: { tribeId },
    });

    return result.count;
  }
}

export default ActivityModel;