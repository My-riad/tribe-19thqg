import { PrismaClient } from '@prisma/client';
import {
  ITribeMembership,
  IMembershipCreate,
  IMembershipUpdate,
  MemberRole,
  MembershipStatus
} from '@shared/types';
import { TRIBE_LIMITS } from '@shared/constants/app.constants';

/**
 * Model class for tribe membership operations using Prisma ORM
 */
export class MemberModel {
  private prisma: PrismaClient;

  /**
   * Initialize the member model with Prisma client
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new tribe membership
   * @param membershipData The membership data to create
   * @returns The created membership record
   */
  async create(membershipData: IMembershipCreate): Promise<ITribeMembership> {
    // Validate required fields
    if (!membershipData.tribeId || !membershipData.userId) {
      throw new Error('Tribe ID and User ID are required for membership creation');
    }

    // Set default values if not provided
    const role = membershipData.role || MemberRole.MEMBER;
    const status = MembershipStatus.PENDING; // New members always start as pending
    const now = new Date();

    // Create the membership
    const membership = await this.prisma.tribeMembership.create({
      data: {
        tribeId: membershipData.tribeId,
        userId: membershipData.userId,
        role,
        status,
        joinedAt: now,
        lastActive: now
      }
    });

    return membership as ITribeMembership;
  }

  /**
   * Find a membership by ID
   * @param id The membership ID
   * @returns The membership record if found, null otherwise
   */
  async findById(id: string): Promise<ITribeMembership | null> {
    if (!id) {
      throw new Error('Membership ID is required');
    }

    const membership = await this.prisma.tribeMembership.findUnique({
      where: { id }
    });

    return membership as ITribeMembership | null;
  }

  /**
   * Find all memberships for a specific tribe
   * @param tribeId The tribe ID
   * @param options Optional filters for status, role, pagination
   * @returns List of tribe memberships
   */
  async findByTribeId(
    tribeId: string,
    options: { 
      status?: MembershipStatus; 
      role?: MemberRole; 
      limit?: number; 
      offset?: number 
    } = {}
  ): Promise<ITribeMembership[]> {
    if (!tribeId) {
      throw new Error('Tribe ID is required');
    }

    const { status, role, limit, offset } = options;

    // Build the where condition
    const where: any = { tribeId };
    if (status) {
      where.status = status;
    }
    if (role) {
      where.role = role;
    }

    // Query with optional pagination
    const memberships = await this.prisma.tribeMembership.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { joinedAt: 'asc' } // Order by join date, earliest first
    });

    return memberships as ITribeMembership[];
  }

  /**
   * Find all tribes a user is a member of
   * @param userId The user ID
   * @param options Optional filters for status, pagination
   * @returns List of user's tribe memberships
   */
  async findByUserId(
    userId: string,
    options: { 
      status?: MembershipStatus; 
      limit?: number; 
      offset?: number 
    } = {}
  ): Promise<ITribeMembership[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { status, limit, offset } = options;

    // Build the where condition
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    // Query with optional pagination
    const memberships = await this.prisma.tribeMembership.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { joinedAt: 'desc' } // Order by join date, most recent first
    });

    return memberships as ITribeMembership[];
  }

  /**
   * Find a specific membership by tribe and user IDs
   * @param tribeId The tribe ID
   * @param userId The user ID
   * @returns The membership record if found, null otherwise
   */
  async findByTribeAndUser(tribeId: string, userId: string): Promise<ITribeMembership | null> {
    if (!tribeId || !userId) {
      throw new Error('Tribe ID and User ID are required');
    }

    const membership = await this.prisma.tribeMembership.findFirst({
      where: {
        tribeId,
        userId
      }
    });

    return membership as ITribeMembership | null;
  }

  /**
   * Update a membership
   * @param id The membership ID
   * @param updateData The data to update
   * @returns The updated membership record
   */
  async update(id: string, updateData: IMembershipUpdate): Promise<ITribeMembership> {
    if (!id) {
      throw new Error('Membership ID is required');
    }

    // Check if membership exists
    const existingMembership = await this.prisma.tribeMembership.findUnique({
      where: { id }
    });

    if (!existingMembership) {
      throw new Error(`Membership with ID ${id} not found`);
    }

    // Update the membership
    const updatedMembership = await this.prisma.tribeMembership.update({
      where: { id },
      data: updateData
    });

    return updatedMembership as ITribeMembership;
  }

  /**
   * Update the lastActive timestamp for a membership
   * @param id The membership ID
   * @returns The updated membership record
   */
  async updateLastActive(id: string): Promise<ITribeMembership> {
    if (!id) {
      throw new Error('Membership ID is required');
    }

    const updatedMembership = await this.prisma.tribeMembership.update({
      where: { id },
      data: {
        lastActive: new Date()
      }
    });

    return updatedMembership as ITribeMembership;
  }

  /**
   * Count memberships for a specific tribe
   * @param tribeId The tribe ID
   * @param options Optional filters for status, role
   * @returns Count of tribe memberships
   */
  async countByTribeId(
    tribeId: string,
    options: { status?: MembershipStatus; role?: MemberRole } = {}
  ): Promise<number> {
    if (!tribeId) {
      throw new Error('Tribe ID is required');
    }

    const { status, role } = options;

    // Build the where condition
    const where: any = { tribeId };
    if (status) {
      where.status = status;
    }
    if (role) {
      where.role = role;
    }

    // Count memberships
    const count = await this.prisma.tribeMembership.count({ where });

    return count;
  }

  /**
   * Count tribes a user is a member of
   * @param userId The user ID
   * @param options Optional filters for status
   * @returns Count of user's tribe memberships
   */
  async countByUserId(
    userId: string,
    options: { status?: MembershipStatus } = {}
  ): Promise<number> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { status } = options;

    // Build the where condition
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    // Count memberships
    const count = await this.prisma.tribeMembership.count({ where });

    return count;
  }

  /**
   * Delete a membership
   * @param id The membership ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Membership ID is required');
    }

    try {
      await this.prisma.tribeMembership.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      // If the membership doesn't exist, Prisma will throw an error
      if ((error as any).code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete all memberships for a specific tribe
   * @param tribeId The tribe ID
   * @returns Number of memberships deleted
   */
  async deleteByTribeId(tribeId: string): Promise<number> {
    if (!tribeId) {
      throw new Error('Tribe ID is required');
    }

    const result = await this.prisma.tribeMembership.deleteMany({
      where: { tribeId }
    });

    return result.count;
  }

  /**
   * Delete all memberships for a specific user
   * @param userId The user ID
   * @returns Number of memberships deleted
   */
  async deleteByUserId(userId: string): Promise<number> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const result = await this.prisma.tribeMembership.deleteMany({
      where: { userId }
    });

    return result.count;
  }
}

export default MemberModel;