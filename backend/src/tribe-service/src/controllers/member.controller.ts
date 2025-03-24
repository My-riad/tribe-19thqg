import { Request, Response, NextFunction } from 'express'; //  ^4.18.2
import memberService from '../services/member.service';
import { validateMembershipId, validateMembershipQuery } from '../validations/member.validation';
import { MemberRole, MembershipStatus } from '@shared/types';
import { ApiError } from '@shared/errors';
import { logger } from '@shared/utils';

/**
 * Add a new member to a tribe
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract tribeId and userId from request body
    const { tribeId, userId } = req.body;

    // LD1: Check if user can join tribe using memberService.canUserJoinTribe
    const joinEligibility = await memberService.canUserJoinTribe(tribeId, userId);

    // LD1: If user cannot join, return 400 Bad Request with reason
    if (!joinEligibility.canJoin) {
      throw ApiError.badRequest(joinEligibility.reason || 'Cannot join tribe');
    }

    // LD1: Add member to tribe using memberService.addMember
    const membership = await memberService.addMember({ tribeId, userId, role: MemberRole.MEMBER });

    // LD1: Return 201 Created with the created membership
    res.status(201).json(membership);
  } catch (error) {
    // LD1: Catch and forward any errors to error handling middleware
    logger.error('Error adding member to tribe', error, { tribeId: req.body.tribeId, userId: req.body.userId });
    next(error);
  }
};

/**
 * Get a membership by ID
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const getMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract membershipId from request params
    const { membershipId } = req.params;

    // LD1: Validate membershipId using validateMembershipId
    validateMembershipId(membershipId);

    // LD1: Get membership using memberService.getMember
    const membership = await memberService.getMember(membershipId);

    // LD1: Return 200 OK with the membership data
    res.status(200).json(membership);
  } catch (error) {
    // LD1: Catch and forward any errors to error handling middleware
    logger.error('Error getting membership', error, { membershipId: req.params.membershipId });
    next(error);
  }
};

/**
 * Get all members of a tribe with filtering and pagination
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const getTribeMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract tribeId from request params
    const { tribeId } = req.params;

    // LD1: Extract query parameters (status, role, limit, offset)
    const { status, role, limit, offset } = req.query;

    // LD1: Validate query parameters using validateMembershipQuery
    const validatedQuery = validateMembershipQuery({ status, role, limit, offset });

    // LD1: Get tribe members using memberService.getTribeMembers
    const { members, total } = await memberService.getTribeMembers(tribeId, validatedQuery);

    // LD1: Return 200 OK with members and total count
    res.status(200).json({ members, total });
  } catch (error) {
    // LD1: Catch and forward any errors to error handling middleware
    logger.error('Error getting tribe members', error, { tribeId: req.params.tribeId, query: req.query });
    next(error);
  }
};

/**
 * Get all tribes a user is a member of
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const getUserMemberships = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract userId from request params
    const { userId } = req.params;

    // LD1: Extract query parameters (status, limit, offset)
    const { status, limit, offset } = req.query;

    // LD1: Validate query parameters using validateMembershipQuery
    const validatedQuery = validateMembershipQuery({ status, limit, offset });

    // LD1: Get user memberships using memberService.getUserMemberships
    const { memberships, total } = await memberService.getUserMemberships(userId, validatedQuery);

    // LD1: Return 200 OK with memberships and total count
    res.status(200).json({ memberships, total });
  } catch (error) {
    // LD1: Catch and forward any errors to error handling middleware
    logger.error('Error getting user memberships', error, { userId: req.params.userId, query: req.query });
    next(error);
  }
};

/**
 * Get a user's membership in a specific tribe
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const getUserMembershipInTribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract tribeId and userId from request params
    const { tribeId, userId } = req.params;

    // LD1: Get user's membership in tribe using memberService.getUserMembershipInTribe
    const membership = await memberService.getUserMembershipInTribe(tribeId, userId);

    // LD1: If membership not found, return 404 Not Found
    if (!membership) {
      throw ApiError.notFound('Membership not found');
    }

    // LD1: Return 200 OK with the membership data
    res.status(200).json(membership);
  } catch (error) {
    // LD1: Catch and forward any errors to error handling middleware
    logger.error('Error getting user membership in tribe', error, { tribeId: req.params.tribeId, userId: req.params.userId });
    next(error);
  }
};

/**
 * Update a membership (role or status)
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const updateMembership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract membershipId from request params
    const { membershipId } = req.params;

    // LD1: Extract update data (role, status) from request body
    const { role, status } = req.body;

    // LD1: Validate membershipId using validateMembershipId
    validateMembershipId(membershipId);

    // LD1: Get current membership to check permissions
    const membership = await memberService.getMember(membershipId);
    if (!membership) {
      throw ApiError.notFound('Membership not found');
    }

    // LD1: Verify the requesting user has permission to update the membership
    // For now, only the creator can update the membership
    // TODO: Implement more granular permission checks
    const hasPermission = await memberService.hasPermission(membership.tribeId, req.user.id, [MemberRole.CREATOR]);
    if (!hasPermission) {
      throw ApiError.forbidden('You do not have permission to update this membership');
    }

    // LD1: Update membership using memberService.updateMembership
    const updatedMembership = await memberService.updateMembership(membershipId, { role, status });

    // LD1: Return 200 OK with the updated membership
    res.status(200).json(updatedMembership);
  } catch (error) {
    // LD1: Catch and forward any errors to error handling middleware
    logger.error('Error updating membership', error, { membershipId: req.params.membershipId, updateData: req.body });
    next(error);
  }
};

/**
 * Update the lastActive timestamp for a member
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const updateMemberLastActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract membershipId from request params
    const { membershipId } = req.params;

    // LD1: Validate membershipId using validateMembershipId
    validateMembershipId(membershipId);

    // LD1: Update lastActive timestamp using memberService.updateMemberLastActive
    const updatedMembership = await memberService.updateMemberLastActive(membershipId);

    // LD1: Return 200 OK with the updated membership
    res.status(200).json(updatedMembership);
  } catch (error) {
    // LD1: Catch and forward any errors to error handling middleware
    logger.error('Error updating member last active', error, { membershipId: req.params.membershipId });
    next(error);
  }
};

/**
 * Remove a member from a tribe
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract membershipId from request params
    const { membershipId } = req.params;

    // LD1: Extract isVoluntary flag from request body (defaults to false)
    const { isVoluntary = false } = req.body;

    // LD1: Validate membershipId using validateMembershipId
    validateMembershipId(membershipId);

    // LD1: Get current membership to check permissions
    const membership = await memberService.getMember(membershipId);
     if (!membership) {
      throw ApiError.notFound('Membership not found');
    }

    // LD1: Verify the requesting user has permission to remove the member
    // For now, only the creator can remove members
    // TODO: Implement more granular permission checks
    const hasPermission = await memberService.hasPermission(membership.tribeId, req.user.id, [MemberRole.CREATOR]);
    if (!hasPermission) {
      throw ApiError.forbidden('You do not have permission to remove this member');
    }

    // LD1: Remove member using memberService.removeMember
    await memberService.removeMember(membershipId, isVoluntary);

    // LD1: Return 200 OK with success message
    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    // LD1: Catch and forward any errors to error handling middleware
    logger.error('Error removing member', error, { membershipId: req.params.membershipId, isVoluntary: req.body.isVoluntary });
    next(error);
  }
};

/**
 * Accept a pending tribe membership invitation
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const acceptMembership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract membershipId from request params
    const { membershipId } = req.params;

    // LD1: Validate membershipId using validateMembershipId
    validateMembershipId(membershipId);

    // LD1: Get current membership to verify it belongs to the requesting user
    const membership = await memberService.getMember(membershipId);
    if (membership.userId !== req.user.id) {
      throw ApiError.forbidden('You do not have permission to accept this membership');
    }

    // LD1: Accept membership using memberService.acceptMembership
    const updatedMembership = await memberService.acceptMembership(membershipId);

    // LD1: Return 200 OK with the updated membership
    res.status(200).json(updatedMembership);
  } catch (error) {
    // LD1: Catch and forward any errors to error handling middleware
    logger.error('Error accepting membership', error, { membershipId: req.params.membershipId });
    next(error);
  }
};

/**
 * Reject a pending tribe membership invitation
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const rejectMembership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract membershipId from request params
    const { membershipId } = req.params;

    // LD1: Validate membershipId using validateMembershipId
    validateMembershipId(membershipId);

    // LD1: Get current membership to verify it belongs to the requesting user
    const membership = await memberService.getMember(membershipId);
    if (membership.userId !== req.user.id) {
      throw ApiError.forbidden('You do not have permission to reject this membership');
    }

    // LD1: Reject membership using memberService.rejectMembership
    await memberService.rejectMembership(membershipId);

    // LD1: Return 200 OK with success message
    res.status(200).json({ message: 'Membership rejected successfully' });
  } catch (error) {
    // LD1: Catch and forward any errors to error handling middleware
    logger.error('Error rejecting membership', error, { membershipId: req.params.membershipId });
    next(error);
  }
};

/**
 * Check if a user can join a tribe based on membership limits
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const checkJoinEligibility = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract tribeId and userId from request params
    const { tribeId, userId } = req.params;

    // LD1: Check if user can join tribe using memberService.canUserJoinTribe
    const eligibility = await memberService.canUserJoinTribe(tribeId, userId);

    // LD1: Return 200 OK with eligibility result (canJoin and reason)
    res.status(200).json(eligibility);
  } catch (error) {
    // LD1: Catch and forward any errors to error handling middleware
    logger.error('Error checking join eligibility', error, { tribeId: req.params.tribeId, userId: req.params.userId });
    next(error);
  }
};