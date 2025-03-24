import { PrismaClient } from '@prisma/client';
import {
  ITribe,
  ITribeCreate,
  ITribeUpdate,
  ITribeInterest,
  ITribeSearchParams,
  TribeStatus,
  TribePrivacy
} from '@shared/types';
import { InterestCategory, ICoordinates } from '@shared/types';
import { TRIBE_LIMITS } from '@shared/constants/app.constants';
import { ApiError } from '@shared/errors';
import { logger } from '@shared/utils';

/**
 * Model class for tribe operations using Prisma ORM
 */
export class TribeModel {
  /**
   * Prisma client instance for database operations
   */
  private prisma: PrismaClient;

  /**
   * Initialize the tribe model with Prisma client
   * 
   * @param prisma - Prisma client instance
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new tribe
   * 
   * @param tribeData - Data for tribe creation
   * @returns The created tribe record
   */
  async create(tribeData: ITribeCreate): Promise<ITribe> {
    logger.info('Creating new tribe', { name: tribeData.name, createdBy: tribeData.createdBy });

    // Validate required fields
    if (!tribeData.name || !tribeData.description || !tribeData.location) {
      throw ApiError.badRequest('Tribe name, description, and location are required');
    }

    // Set default values if not provided
    const status = TribeStatus.FORMING;
    const privacy = tribeData.privacy || TribePrivacy.PUBLIC;
    const maxMembers = tribeData.maxMembers || TRIBE_LIMITS.MAX_MEMBERS;

    // Ensure max members doesn't exceed platform limit
    if (maxMembers > TRIBE_LIMITS.MAX_MEMBERS) {
      throw ApiError.badRequest(`Maximum members cannot exceed ${TRIBE_LIMITS.MAX_MEMBERS}`);
    }

    try {
      // Create tribe record
      const tribe = await this.prisma.tribe.create({
        data: {
          name: tribeData.name,
          description: tribeData.description,
          location: tribeData.location,
          coordinates: tribeData.coordinates ? {
            latitude: tribeData.coordinates.latitude,
            longitude: tribeData.coordinates.longitude
          } : undefined,
          imageUrl: tribeData.imageUrl || '',
          status,
          privacy,
          maxMembers,
          createdBy: tribeData.createdBy,
          createdAt: new Date(),
          lastActive: new Date()
        },
        include: {
          interests: true,
          members: true,
          activities: true,
          goals: true
        }
      });

      // Create tribe interests if provided
      if (tribeData.interests && tribeData.interests.length > 0) {
        await Promise.all(tribeData.interests.map(interest => 
          this.prisma.tribeInterest.create({
            data: {
              tribeId: tribe.id,
              category: interest.category,
              name: interest.name,
              isPrimary: interest.isPrimary
            }
          })
        ));

        // Refresh tribe to include the created interests
        return await this.findById(tribe.id, true) as ITribe;
      }

      return tribe as unknown as ITribe;
    } catch (error) {
      logger.error('Error creating tribe', error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Find a tribe by ID
   * 
   * @param id - Tribe ID
   * @param includeMembers - Whether to include tribe members in the result
   * @returns The tribe record if found, null otherwise
   */
  async findById(id: string, includeMembers: boolean = false): Promise<ITribe | null> {
    if (!id) {
      throw ApiError.badRequest('Tribe ID is required');
    }

    try {
      const tribe = await this.prisma.tribe.findUnique({
        where: { id },
        include: {
          interests: true,
          members: includeMembers,
          activities: true,
          goals: true
        }
      });

      return tribe as unknown as ITribe | null;
    } catch (error) {
      logger.error('Error finding tribe by ID', error, { tribeId: id });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Find tribes that a user is a member of
   * 
   * @param userId - User ID
   * @param options - Optional filters and pagination
   * @returns List of user's tribes
   */
  async findByUserId(
    userId: string,
    options: { status?: string; limit?: number; offset?: number } = {}
  ): Promise<ITribe[]> {
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }

    const { status, limit = 10, offset = 0 } = options;

    try {
      const tribeMemberships = await this.prisma.tribeMembership.findMany({
        where: {
          userId,
          ...(status ? { status } : {})
        },
        include: {
          tribe: {
            include: {
              interests: true,
              members: true,
              activities: true,
              goals: true
            }
          }
        },
        skip: offset,
        take: limit
      });

      return tribeMemberships.map(membership => membership.tribe) as unknown as ITribe[];
    } catch (error) {
      logger.error('Error finding tribes by user ID', error, { userId });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Search for tribes based on various criteria
   * 
   * @param searchParams - Search parameters
   * @returns Matching tribes and total count
   */
  async search(searchParams: ITribeSearchParams): Promise<{ tribes: ITribe[]; total: number }> {
    const {
      query = '',
      interests = [],
      location,
      maxDistance,
      status = [],
      privacy,
      hasAvailableSpots = false,
      page = 1,
      limit = 10
    } = searchParams;

    const offset = (page - 1) * limit;

    try {
      // Base query conditions
      const whereClause: any = {
        ...(query ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } }
          ]
        } : {}),
        ...(status.length > 0 ? { status: { in: status } } : {}),
        ...(privacy ? { privacy } : {})
      };

      // Add interest filter if provided
      if (interests.length > 0) {
        whereClause.interests = {
          some: {
            category: { in: interests }
          }
        };
      }

      // Add location proximity filter if coordinates and maxDistance are provided
      if (location && maxDistance) {
        // In a production implementation, we would use a proper geospatial query
        // using PostgreSQL's earthdistance module or PostGIS extension
        // This is a simplification that would need to be replaced with the appropriate
        // database-specific implementation
        const { latitude, longitude } = location;
        
        // Simplified approach using a bounding box
        const latDegrees = maxDistance / 69.0; // Approximate miles to degrees conversion
        const longDegrees = maxDistance / (Math.cos(latitude * Math.PI / 180) * 69.0);
        
        whereClause.coordinates = {
          latitude: {
            gte: latitude - latDegrees,
            lte: latitude + latDegrees
          },
          longitude: {
            gte: longitude - longDegrees,
            lte: longitude + longDegrees
          }
        };
      }

      // Add filter for tribes with available spots
      if (hasAvailableSpots) {
        whereClause.members = {
          _count: {
            lt: this.prisma.raw(`"maxMembers"`)
          }
        };
      }

      // Count total matching tribes
      const total = await this.prisma.tribe.count({ where: whereClause });

      // Execute search query with pagination
      const tribes = await this.prisma.tribe.findMany({
        where: whereClause,
        include: {
          interests: true,
          members: true,
          activities: true,
          goals: true
        },
        skip: offset,
        take: limit,
        orderBy: { lastActive: 'desc' }
      });

      return {
        tribes: tribes as unknown as ITribe[],
        total
      };
    } catch (error) {
      logger.error('Error searching tribes', error, { searchParams });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Update a tribe
   * 
   * @param id - Tribe ID
   * @param updateData - Data to update
   * @returns The updated tribe record
   */
  async update(id: string, updateData: ITribeUpdate): Promise<ITribe> {
    if (!id) {
      throw ApiError.badRequest('Tribe ID is required');
    }

    if (Object.keys(updateData).length === 0) {
      throw ApiError.badRequest('No update data provided');
    }

    // Check if tribe exists
    const existingTribe = await this.findById(id);
    if (!existingTribe) {
      throw ApiError.notFound('Tribe not found');
    }

    // Ensure maxMembers doesn't exceed platform limit
    if (updateData.maxMembers && updateData.maxMembers > TRIBE_LIMITS.MAX_MEMBERS) {
      throw ApiError.badRequest(`Maximum members cannot exceed ${TRIBE_LIMITS.MAX_MEMBERS}`);
    }

    try {
      const updatedTribe = await this.prisma.tribe.update({
        where: { id },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.description && { description: updateData.description }),
          ...(updateData.location && { location: updateData.location }),
          ...(updateData.coordinates && { 
            coordinates: {
              latitude: updateData.coordinates.latitude,
              longitude: updateData.coordinates.longitude
            }
          }),
          ...(updateData.imageUrl && { imageUrl: updateData.imageUrl }),
          ...(updateData.privacy && { privacy: updateData.privacy }),
          ...(updateData.status && { status: updateData.status }),
          ...(updateData.maxMembers && { maxMembers: updateData.maxMembers })
        },
        include: {
          interests: true,
          members: true,
          activities: true,
          goals: true
        }
      });

      return updatedTribe as unknown as ITribe;
    } catch (error) {
      logger.error('Error updating tribe', error, { tribeId: id });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Update the lastActive timestamp for a tribe
   * 
   * @param id - Tribe ID
   * @returns The updated tribe record
   */
  async updateLastActive(id: string): Promise<ITribe> {
    if (!id) {
      throw ApiError.badRequest('Tribe ID is required');
    }

    try {
      const updatedTribe = await this.prisma.tribe.update({
        where: { id },
        data: {
          lastActive: new Date()
        },
        include: {
          interests: true,
          members: true,
          activities: true,
          goals: true
        }
      });

      return updatedTribe as unknown as ITribe;
    } catch (error) {
      logger.error('Error updating tribe lastActive timestamp', error, { tribeId: id });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Update the status of a tribe
   * 
   * @param id - Tribe ID
   * @param status - New tribe status
   * @returns The updated tribe record
   */
  async updateStatus(id: string, status: TribeStatus): Promise<ITribe> {
    if (!id) {
      throw ApiError.badRequest('Tribe ID is required');
    }

    if (!Object.values(TribeStatus).includes(status)) {
      throw ApiError.badRequest('Invalid tribe status');
    }

    try {
      const updatedTribe = await this.prisma.tribe.update({
        where: { id },
        data: { status },
        include: {
          interests: true,
          members: true,
          activities: true,
          goals: true
        }
      });

      return updatedTribe as unknown as ITribe;
    } catch (error) {
      logger.error('Error updating tribe status', error, { tribeId: id, status });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Add an interest to a tribe
   * 
   * @param tribeId - Tribe ID
   * @param interestData - Interest data
   * @returns The created interest record
   */
  async addInterest(
    tribeId: string,
    interestData: { category: InterestCategory; name: string; isPrimary: boolean }
  ): Promise<ITribeInterest> {
    if (!tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }

    if (!interestData.category || !interestData.name) {
      throw ApiError.badRequest('Interest category and name are required');
    }

    // Check if tribe exists
    const existingTribe = await this.findById(tribeId);
    if (!existingTribe) {
      throw ApiError.notFound('Tribe not found');
    }

    try {
      const interest = await this.prisma.tribeInterest.create({
        data: {
          tribeId,
          category: interestData.category,
          name: interestData.name,
          isPrimary: interestData.isPrimary || false
        }
      });

      return interest as unknown as ITribeInterest;
    } catch (error) {
      logger.error('Error adding interest to tribe', error, { tribeId, interestData });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Remove an interest from a tribe
   * 
   * @param interestId - Interest ID
   * @returns True if deleted, false if not found
   */
  async removeInterest(interestId: string): Promise<boolean> {
    if (!interestId) {
      throw ApiError.badRequest('Interest ID is required');
    }

    try {
      await this.prisma.tribeInterest.delete({
        where: { id: interestId }
      });

      return true;
    } catch (error) {
      // If the interest doesn't exist, return false
      if ((error as any).code === 'P2025') { // Prisma "not found" error code
        return false;
      }
      
      logger.error('Error removing interest from tribe', error, { interestId });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Delete a tribe
   * 
   * @param id - Tribe ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    if (!id) {
      throw ApiError.badRequest('Tribe ID is required');
    }

    try {
      await this.prisma.tribe.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      // If the tribe doesn't exist, return false
      if ((error as any).code === 'P2025') { // Prisma "not found" error code
        return false;
      }
      
      logger.error('Error deleting tribe', error, { tribeId: id });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Count tribes based on filters
   * 
   * @param filters - Optional filters
   * @returns Count of matching tribes
   */
  async count(filters: { status?: TribeStatus[] } = {}): Promise<number> {
    const { status } = filters;

    try {
      const count = await this.prisma.tribe.count({
        where: {
          ...(status && status.length > 0 ? { status: { in: status } } : {})
        }
      });

      return count;
    } catch (error) {
      logger.error('Error counting tribes', error, { filters });
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Get tribe recommendations for a user based on interests and location
   * 
   * @param params - Recommendation parameters
   * @returns List of recommended tribes
   */
  async getRecommendations({
    userId,
    interests,
    location,
    maxDistance = 25, // Default to max distance of 25 miles
    limit = 10,
    offset = 0
  }: {
    userId: string;
    interests: InterestCategory[];
    location?: ICoordinates;
    maxDistance?: number;
    limit?: number;
    offset?: number;
  }): Promise<ITribe[]> {
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }

    try {
      // Get user's current tribe memberships to exclude them from recommendations
      const userMemberships = await this.prisma.tribeMembership.findMany({
        where: { userId },
        select: { tribeId: true }
      });

      const userTribeIds = userMemberships.map(membership => membership.tribeId);

      // Base query for active tribes that the user is not already a member of
      const whereClause: any = {
        id: { notIn: userTribeIds },
        status: TribeStatus.ACTIVE,
        // Only include tribes with available spots
        members: {
          _count: {
            lt: this.prisma.raw(`"maxMembers"`)
          }
        }
      };

      // Add interest matching if provided
      if (interests && interests.length > 0) {
        whereClause.interests = {
          some: {
            category: { in: interests }
          }
        };
      }

      // Add location proximity filter if coordinates are provided
      if (location && maxDistance) {
        // In a production implementation, we would use a proper geospatial query
        const { latitude, longitude } = location;
        
        // Simplified approach using a bounding box
        const latDegrees = maxDistance / 69.0; // Approximate miles to degrees conversion
        const longDegrees = maxDistance / (Math.cos(latitude * Math.PI / 180) * 69.0);
        
        whereClause.coordinates = {
          latitude: {
            gte: latitude - latDegrees,
            lte: latitude + latDegrees
          },
          longitude: {
            gte: longitude - longDegrees,
            lte: longitude + longDegrees
          }
        };
      }

      // Execute query to get recommended tribes
      const recommendedTribes = await this.prisma.tribe.findMany({
        where: whereClause,
        include: {
          interests: true,
          members: true,
          activities: true,
          goals: true
        },
        orderBy: [
          // Order by last activity for freshness
          { lastActive: 'desc' }
        ],
        skip: offset,
        take: limit
      });

      return recommendedTribes as unknown as ITribe[];
    } catch (error) {
      logger.error('Error getting tribe recommendations', error, { userId });
      throw ApiError.fromError(error as Error);
    }
  }
}

export default TribeModel;