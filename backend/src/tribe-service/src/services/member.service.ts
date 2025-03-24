import {
  ITribeMembership,
  IMembershipCreate,
  IMembershipUpdate,
  MemberRole,
  MembershipStatus,
  ActivityType,
} from '@shared/types';
import {
  MAX_MEMBERS_PER_TRIBE,
  MAX_TRIBES_PER_USER,
} from '@shared/constants/app.constants';
import { ApiError } from '@shared/errors';
import { logger } from '@shared/utils';
import { notificationService } from '@notification-service'; // Assuming version 1.0.0 or compatible
import {
  validateCreateMembership,
  validateUpdateMembership,
  validateMembershipId,
  validateMembershipQuery,
} from '../validations/member.validation';
import MemberModel from '../models/member.model';
import TribeModel from '../models/tribe.model';
import ActivityModel from '../models/activity.model';

/**
 * Service class for managing tribe memberships in the Tribe platform
 */
export class MemberService {
  /**
   * Initialize the member service with required models
   * @param memberModel - The member model for database operations
   * @param tribeModel - The tribe model for tribe operations
   * @param activityModel - The activity model for recording tribe activities
   */
  constructor(
    private memberModel: MemberModel,
    private tribeModel: TribeModel,
    private activityModel: ActivityModel
  ) {
    // Store model instances for database operations
  }

  /**
   * Add a new member to a tribe
   * @param membershipData - The membership data to create
   * @returns The created membership record
   */
  async addMember(membershipData: IMembershipCreate): Promise<ITribeMembership> {
    // Validate membership data using validateCreateMembership
    const validatedData = validateCreateMembership(membershipData);

    // Check if tribe exists using tribeModel.findById
    const tribe = await this.tribeModel.findById(validatedData.tribeId);
    if (!tribe) {
      throw ApiError.notFound('Tribe not found');
    }

    // Check if user is already a member using memberModel.findByTribeAndUser
    const existingMembership = await this.memberModel.findByTribeAndUser(
      validatedData.tribeId,
      validatedData.userId
    );
    if (existingMembership) {
      throw ApiError.conflict('User is already a member of this tribe');
    }

    // Check if tribe has reached maximum members (TRIBE_LIMITS.MAX_MEMBERS_PER_TRIBE)
    const tribeMemberCount = await this.memberModel.countByTribeId(
      validatedData.tribeId,
      { status: MembershipStatus.ACTIVE }
    );
    if (tribeMemberCount >= MAX_MEMBERS_PER_TRIBE) {
      throw ApiError.badRequest('Tribe has reached maximum members');
    }

    // Check if user has reached maximum tribes (TRIBE_LIMITS.MAX_TRIBES_PER_USER)
    const userTribeCount = await this.memberModel.countByUserId(
      validatedData.userId,
      { status: MembershipStatus.ACTIVE }
    );
    if (userTribeCount >= MAX_TRIBES_PER_USER) {
      throw ApiError.badRequest('User has reached maximum tribes');
    }

    // Create membership record using memberModel.create
    const membership = await this.memberModel.create(
      validatedData as IMembershipCreate
    );

    // Record activity using activityModel.create with ActivityType.MEMBER_JOINED
    await this.activityModel.create({
      tribeId: validatedData.tribeId,
      userId: validatedData.userId,
      activityType: ActivityType.MEMBER_JOINED,
      description: `User joined the tribe`,
      metadata: {
        membershipId: membership.id,
      },
    });

    // Update tribe's lastActive timestamp using tribeModel.updateLastActive
    await this.tribeModel.updateLastActive(validatedData.tribeId);

    // Send notification to tribe members about new member
    try {
      await notificationService.createFromTemplate(
        'tribe_join_notification',
        {
          tribeId: validatedData.tribeId,
          userId: validatedData.userId,
        },
        validatedData.userId
      );
    } catch (error) {
      logger.error(
        'Error sending tribe join notification',
        error as Error,
        { tribeId: validatedData.tribeId, userId: validatedData.userId }
      );
    }

    // Log member addition
    logger.info('Added member to tribe', {
      tribeId: validatedData.tribeId,
      userId: validatedData.userId,
      membershipId: membership.id,
    });

    // Return the created membership record
    return membership;
  }

  /**
   * Get a membership by ID
   * @param membershipId - The membership ID
   * @returns The membership record
   */
  async getMember(membershipId: string): Promise<ITribeMembership> {
    // Validate membership ID using validateMembershipId
    const validatedId = validateMembershipId(membershipId);

    // Find membership by ID using memberModel.findById
    const membership = await this.memberModel.findById(validatedId);

    // If not found, throw ApiError.notFound
    if (!membership) {
      throw ApiError.notFound('Membership not found');
    }

    // Return the membership record
    return membership;
  }

  /**
   * Get all members of a tribe with filtering and pagination
   * @param tribeId - The tribe ID
   * @param options - Optional filters for status, role, pagination
   * @returns Tribe members with total count
   */
  async getTribeMembers(
    tribeId: string,
    options: {
      status?: MembershipStatus;
      role?: MemberRole;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ members: ITribeMembership[]; total: number }> {
    // Validate query options using validateMembershipQuery
    const validatedOptions = validateMembershipQuery(options);

    // Check if tribe exists using tribeModel.findById
    const tribe = await this.tribeModel.findById(tribeId);
    if (!tribe) {
      throw ApiError.notFound('Tribe not found');
    }

    // Find members using memberModel.findByTribeId with filters
    const members = await this.memberModel.findByTribeId(
      tribeId,
      validatedOptions
    );

    // Count total members using memberModel.countByTribeId with same filters
    const total = await this.memberModel.countByTribeId(
      tribeId,
      validatedOptions
    );

    // Return members and total count
    return { members, total };
  }

  /**
   * Get all tribes a user is a member of
   * @param userId - The user ID
   * @param options - Optional filters for status, pagination
   * @returns User's memberships with total count
   */
  async getUserMemberships(
    userId: string,
    options: { status?: MembershipStatus; limit?: number; offset?: number }
  ): Promise<{ memberships: ITribeMembership[]; total: number }> {
    // Validate query options using validateMembershipQuery
    const validatedOptions = validateMembershipQuery(options);

    // Find memberships using memberModel.findByUserId with filters
    const memberships = await this.memberModel.findByUserId(
      userId,
      validatedOptions
    );

    // Count total memberships using memberModel.countByUserId with same filters
    const total = await this.memberModel.countByUserId(
      userId,
      validatedOptions
    );

    // Return memberships and total count
    return { memberships, total };
  }

  /**
   * Get a user's membership in a specific tribe
   * @param tribeId - The tribe ID
   * @param userId - The user ID
   * @returns The membership record if found, null otherwise
   */
  async getUserMembershipInTribe(
    tribeId: string,
    userId: string
  ): Promise<ITribeMembership | null> {
    // Find membership using memberModel.findByTribeAndUser
    const membership = await this.memberModel.findByTribeAndUser(tribeId, userId);

    // Return the membership record or null if not found
    return membership;
  }

  /**
   * Update a membership (role or status)
   * @param membershipId - The membership ID
   * @param updateData - The data to update
   * @returns The updated membership record
   */
  async updateMembership(
    membershipId: string,
    updateData: IMembershipUpdate
  ): Promise<ITribeMembership> {
    // Validate membership ID using validateMembershipId
    const validatedId = validateMembershipId(membershipId);

    // Validate update data using validateUpdateMembership
    const validatedData = validateUpdateMembership(updateData);

    // Get current membership to verify it exists
    const membership = await this.getMember(validatedId);

    // Update membership using memberModel.update
    const updatedMembership = await this.memberModel.update(
      validatedId,
      validatedData
    );

    // If status is being updated to ACTIVE, record activity
    if (
      updateData.status === MembershipStatus.ACTIVE &&
      membership.status !== MembershipStatus.ACTIVE
    ) {
      await this.activityModel.create({
        tribeId: membership.tribeId,
        userId: membership.userId,
        activityType: ActivityType.MEMBER_JOINED,
        description: `User's membership was activated`,
        metadata: {
          membershipId: membership.id,
        },
      });
    }

    // If status is being updated to LEFT or REMOVED, record activity
    if (
      updateData.status === MembershipStatus.LEFT ||
      updateData.status === MembershipStatus.REMOVED
    ) {
      await this.activityModel.create({
        tribeId: membership.tribeId,
        userId: membership.userId,
        activityType:
          updateData.status === MembershipStatus.LEFT
            ? ActivityType.MEMBER_LEFT
            : ActivityType.MEMBER_LEFT, // Assuming MEMBER_LEFT covers both LEFT and REMOVED
        description: `User's membership was updated to ${updateData.status}`,
        metadata: {
          membershipId: membership.id,
        },
      });
    }

    // Update tribe's lastActive timestamp
    await this.tribeModel.updateLastActive(membership.tribeId);

    // Log membership update
    logger.info('Updated membership', {
      membershipId: validatedId,
      updateData,
    });

    // Return the updated membership
    return updatedMembership;
  }

  /**
   * Update the lastActive timestamp for a member
   * @param membershipId - The membership ID
   * @returns The updated membership record
   */
  async updateMemberLastActive(membershipId: string): Promise<ITribeMembership> {
    // Validate membership ID using validateMembershipId
    const validatedId = validateMembershipId(membershipId);

    // Update lastActive timestamp using memberModel.updateLastActive
    const updatedMembership = await this.memberModel.updateLastActive(validatedId);

    // Update tribe's lastActive timestamp
    await this.tribeModel.updateLastActive(updatedMembership.tribeId);

    // Return the updated membership
    return updatedMembership;
  }

  /**
   * Remove a member from a tribe
   * @param membershipId - The membership ID
   * @param isVoluntary - Whether the member is voluntarily leaving
   * @returns True if removed, false if not found
   */
  async removeMember(membershipId: string, isVoluntary: boolean): Promise<boolean> {
    // Validate membership ID using validateMembershipId
    const validatedId = validateMembershipId(membershipId);

    // Get membership to verify it exists and get associated tribe and user IDs
    const membership = await this.getMember(validatedId);
    const { tribeId, userId } = membership;

    // Update membership status to LEFT if voluntary, REMOVED if not
    const updateData: IMembershipUpdate = {
      status: isVoluntary ? MembershipStatus.LEFT : MembershipStatus.REMOVED,
      role: membership.role, // Keep the existing role
    };
    await this.updateMembership(membershipId, updateData);

    // Record activity with appropriate ActivityType (MEMBER_LEFT or member removal)
    const activityType = isVoluntary ? ActivityType.MEMBER_LEFT : ActivityType.MEMBER_LEFT; // Assuming MEMBER_LEFT covers both LEFT and REMOVED
    await this.activityModel.create({
      tribeId,
      userId,
      activityType,
      description: `User ${isVoluntary ? 'left' : 'was removed from'} the tribe`,
      metadata: {
        membershipId,
      },
    });

    // Send notification to affected user and tribe members
    try {
      await notificationService.createFromTemplate(
        'member_removal_notification',
        {
          tribeId,
          userId,
          isVoluntary,
        },
        userId
      );
    } catch (error) {
      logger.error(
        'Error sending member removal notification',
        error as Error,
        { tribeId, userId, isVoluntary }
      );
    }

    // Log member removal
    logger.info('Removed member from tribe', {
      membershipId: validatedId,
      tribeId,
      userId,
      isVoluntary,
    });

    // Return true if successful
    return true;
  }

  /**
   * Accept a pending tribe membership invitation
   * @param membershipId - The membership ID
   * @returns The updated membership record
   */
  async acceptMembership(membershipId: string): Promise<ITribeMembership> {
    // Validate membership ID using validateMembershipId
    const validatedId = validateMembershipId(membershipId);

    // Get membership to verify it exists and is in PENDING status
    const membership = await this.getMember(validatedId);
    if (membership.status !== MembershipStatus.PENDING) {
      throw ApiError.badRequest('Membership is not in PENDING status');
    }

    // Update membership status to ACTIVE
    const updateData: IMembershipUpdate = {
      status: MembershipStatus.ACTIVE,
      role: membership.role, // Keep the existing role
    };
    const updatedMembership = await this.updateMembership(membershipId, updateData);

    // Record activity for member joining
    await this.activityModel.create({
      tribeId: membership.tribeId,
      userId: membership.userId,
      activityType: ActivityType.MEMBER_JOINED,
      description: 'User accepted tribe invitation',
      metadata: {
        membershipId,
      },
    });

    // Send notification to tribe members
    try {
      await notificationService.createFromTemplate(
        'tribe_join_notification',
        {
          tribeId: membership.tribeId,
          userId: membership.userId,
        },
        membership.userId
      );
    } catch (error) {
      logger.error(
        'Error sending tribe join notification',
        error as Error,
        { tribeId: membership.tribeId, userId: membership.userId }
      );
    }

    // Log membership acceptance
    logger.info('Accepted membership', {
      membershipId: validatedId,
      tribeId: membership.tribeId,
      userId: membership.userId,
    });

    // Return the updated membership
    return updatedMembership;
  }

  /**
   * Reject a pending tribe membership invitation
   * @param membershipId - The membership ID
   * @returns True if rejected, false if not found
   */
  async rejectMembership(membershipId: string): Promise<boolean> {
    // Validate membership ID using validateMembershipId
    const validatedId = validateMembershipId(membershipId);

    // Get membership to verify it exists and is in PENDING status
    const membership = await this.getMember(validatedId);
    if (membership.status !== MembershipStatus.PENDING) {
      throw ApiError.badRequest('Membership is not in PENDING status');
    }

    // Delete the membership record
    const deleted = await this.memberModel.delete(validatedId);
    if (!deleted) {
      return false;
    }

    // Log membership rejection
    logger.info('Rejected membership', {
      membershipId: validatedId,
      tribeId: membership.tribeId,
      userId: membership.userId,
    });

    // Return true if successful
    return true;
  }

  /**
   * Count members in a tribe with optional status filter
   * @param tribeId - The tribe ID
   * @param options - Optional filters for status, role
   * @returns Count of tribe members
   */
  async countTribeMembers(
    tribeId: string,
    options: { status?: MembershipStatus; role?: MemberRole }
  ): Promise<number> {
    // Count members using memberModel.countByTribeId with filters
    const count = await this.memberModel.countByTribeId(tribeId, options);

    // Return the count
    return count;
  }

  /**
   * Count tribes a user is a member of with optional status filter
   * @param userId - The user ID
   * @param options - Optional filters for status
   * @returns Count of user's memberships
   */
  async countUserMemberships(
    userId: string,
    options: { status?: MembershipStatus }
  ): Promise<number> {
    // Count memberships using memberModel.countByUserId with filters
    const count = await this.memberModel.countByUserId(userId, options);

    // Return the count
    return count;
  }

  /**
   * Check if a user can join a tribe based on membership limits
   * @param tribeId - The tribe ID
   * @param userId - The user ID
   * @returns Join eligibility result
   */
  async canUserJoinTribe(
    tribeId: string,
    userId: string
  ): Promise<{ canJoin: boolean; reason: string | null }> {
    // Check if user is already a member using getUserMembershipInTribe
    const existingMembership = await this.getUserMembershipInTribe(tribeId, userId);
    if (existingMembership) {
      return { canJoin: false, reason: 'Already a member' };
    }

    // Check if tribe has reached maximum members using countTribeMembers
    const tribeMemberCount = await this.countTribeMembers(tribeId, {
      status: MembershipStatus.ACTIVE,
    });
    if (tribeMemberCount >= MAX_MEMBERS_PER_TRIBE) {
      return { canJoin: false, reason: 'Tribe is full' };
    }

    // Check if user has reached maximum tribes using countUserMemberships
    const userTribeCount = await this.countUserMemberships(userId, {
      status: MembershipStatus.ACTIVE,
    });
    if (userTribeCount >= MAX_TRIBES_PER_USER) {
      return { canJoin: false, reason: 'Maximum tribes reached' };
    }

    // If all checks pass, return { canJoin: true, reason: null }
    return { canJoin: true, reason: null };
  }

  /**
   * Check if a user has permission to perform actions in a tribe
   * @param tribeId - The tribe ID
   * @param userId - The user ID
   * @param allowedRoles - Array of allowed MemberRole values
   * @returns Whether the user has permission
   */
  async hasPermission(
    tribeId: string,
    userId: string,
    allowedRoles: MemberRole[]
  ): Promise<boolean> {
    // Get user's membership in the tribe using getUserMembershipInTribe
    const membership = await this.getUserMembershipInTribe(tribeId, userId);

    // If not a member or membership not ACTIVE, return false
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      return false;
    }

    // Check if user's role is in the allowedRoles array
    const hasAllowedRole = allowedRoles.includes(membership.role);

    // Return true if user has an allowed role, false otherwise
    return hasAllowedRole;
  }
}

// Create and export a singleton instance of the MemberService class for managing tribe memberships
const memberService = new MemberService(new MemberModel(require('../../../config/database').prisma), new TribeModel(require('../../../config/database').prisma), new ActivityModel(require('../../../config/database').prisma));
export default memberService;