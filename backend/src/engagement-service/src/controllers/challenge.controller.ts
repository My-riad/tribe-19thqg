import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import challengeService from '../services/challenge.service';
import {
  validateCreateChallenge,
  validateUpdateChallenge,
  validateGetChallenge,
  validateListChallenges,
  validateParticipateChallenge,
  validateCompleteChallenge,
  validateGenerateChallenge,
  validateGetChallengeStats
} from '../validations/challenge.validation';
import { ChallengeType } from '../models/challenge.model';
import { logger } from '../../../shared/src/utils/logger.util';
import { ApiError } from '../../../shared/src/errors/api.error';

/**
 * Creates a new challenge
 */
async function createChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    logger.info('Create challenge request received', { body: req.body });
    
    const challengeData = req.body;
    const challenge = await challengeService.createChallenge(challengeData);
    
    logger.info('Challenge created successfully', { 
      challengeId: challenge.id, 
      tribeId: challenge.tribeId 
    });
    
    res.status(201).json({
      success: true,
      message: 'Challenge created successfully',
      data: challenge
    });
  } catch (error) {
    logger.error('Failed to create challenge', error);
    next(error);
  }
}

/**
 * Retrieves a challenge by ID
 */
async function getChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string;
    
    logger.info('Get challenge request received', { challengeId: id, userId });
    
    const challenge = await challengeService.getChallenge(id, userId);
    
    res.status(200).json({
      success: true,
      data: challenge
    });
  } catch (error) {
    logger.error('Failed to retrieve challenge', error);
    next(error);
  }
}

/**
 * Updates an existing challenge
 */
async function updateChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    logger.info('Update challenge request received', { 
      challengeId: id, 
      updateData 
    });
    
    const updatedChallenge = await challengeService.updateChallenge(id, updateData);
    
    logger.info('Challenge updated successfully', { challengeId: id });
    
    res.status(200).json({
      success: true,
      message: 'Challenge updated successfully',
      data: updatedChallenge
    });
  } catch (error) {
    logger.error('Failed to update challenge', error);
    next(error);
  }
}

/**
 * Deletes a challenge by ID
 */
async function deleteChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    
    logger.info('Delete challenge request received', { challengeId: id });
    
    await challengeService.deleteChallenge(id);
    
    logger.info('Challenge deleted successfully', { challengeId: id });
    
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete challenge', error);
    next(error);
  }
}

/**
 * Lists challenges with filtering and pagination
 */
async function listChallenges(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = {
      tribeId: req.query.tribeId as string,
      type: req.query.type as ChallengeType,
      status: req.query.status as string,
      createdBy: req.query.createdBy as string,
      startDateFrom: req.query.startDateFrom ? new Date(req.query.startDateFrom as string) : undefined,
      startDateTo: req.query.startDateTo ? new Date(req.query.startDateTo as string) : undefined,
      endDateFrom: req.query.endDateFrom ? new Date(req.query.endDateFrom as string) : undefined,
      endDateTo: req.query.endDateTo ? new Date(req.query.endDateTo as string) : undefined,
      userId: req.query.participatedBy as string,
      aiGenerated: req.query.aiGenerated ? req.query.aiGenerated === 'true' : undefined
    };
    
    const pagination = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      sortBy: req.query.sortBy as string,
      sortDirection: req.query.sortDirection as 'asc' | 'desc'
    };
    
    const userId = req.query.userId as string;
    
    logger.info('List challenges request received', { filters, pagination, userId });
    
    const result = await challengeService.listChallenges(filters, pagination, userId);
    
    res.status(200).json({
      success: true,
      data: {
        challenges: result.challenges,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / pagination.limit)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to list challenges', error);
    next(error);
  }
}

/**
 * Adds a user as a participant in a challenge
 */
async function participateInChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    logger.info('Participate in challenge request received', { 
      challengeId: id, 
      userId 
    });
    
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }
    
    const challenge = await challengeService.participateInChallenge(id, userId);
    
    logger.info('User added as participant successfully', { 
      challengeId: id, 
      userId 
    });
    
    res.status(200).json({
      success: true,
      message: 'Successfully joined the challenge',
      data: challenge
    });
  } catch (error) {
    logger.error('Failed to participate in challenge', error);
    next(error);
  }
}

/**
 * Marks a challenge as completed by a user
 */
async function completeChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { userId, evidence } = req.body;
    
    logger.info('Complete challenge request received', { 
      challengeId: id, 
      userId,
      hasEvidence: !!evidence
    });
    
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }
    
    const challenge = await challengeService.completeChallenge(id, userId, { evidence });
    
    logger.info('Challenge marked as completed by user', { 
      challengeId: id, 
      userId 
    });
    
    res.status(200).json({
      success: true,
      message: 'Challenge completed successfully',
      data: challenge
    });
  } catch (error) {
    logger.error('Failed to complete challenge', error);
    next(error);
  }
}

/**
 * Generates a new AI-powered challenge for a tribe
 */
async function generateChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tribeId, type } = req.body;
    
    logger.info('Generate challenge request received', { tribeId, type });
    
    if (!tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }
    
    if (!type || !Object.values(ChallengeType).includes(type as ChallengeType)) {
      throw ApiError.badRequest('Valid challenge type is required');
    }
    
    const challenge = await challengeService.generateChallenge(tribeId, type as ChallengeType);
    
    logger.info('Challenge generated successfully', { 
      challengeId: challenge.id, 
      tribeId,
      type
    });
    
    res.status(201).json({
      success: true,
      message: 'Challenge generated successfully',
      data: challenge
    });
  } catch (error) {
    logger.error('Failed to generate challenge', error);
    next(error);
  }
}

/**
 * Activates a pending challenge
 */
async function activateChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    
    logger.info('Activate challenge request received', { challengeId: id });
    
    const challenge = await challengeService.activateChallenge(id);
    
    logger.info('Challenge activated successfully', { challengeId: id });
    
    res.status(200).json({
      success: true,
      message: 'Challenge activated successfully',
      data: challenge
    });
  } catch (error) {
    logger.error('Failed to activate challenge', error);
    next(error);
  }
}

/**
 * Cancels an active challenge
 */
async function cancelChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    
    logger.info('Cancel challenge request received', { challengeId: id });
    
    const challenge = await challengeService.cancelChallenge(id);
    
    logger.info('Challenge cancelled successfully', { challengeId: id });
    
    res.status(200).json({
      success: true,
      message: 'Challenge cancelled successfully',
      data: challenge
    });
  } catch (error) {
    logger.error('Failed to cancel challenge', error);
    next(error);
  }
}

/**
 * Gets challenge metrics for a tribe
 */
async function getChallengeMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tribeId } = req.params;
    const timeRange = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };
    
    logger.info('Get challenge metrics request received', { tribeId, timeRange });
    
    if (!tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }
    
    const metrics = await challengeService.getChallengeMetrics(tribeId, timeRange);
    
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get challenge metrics', error);
    next(error);
  }
}

export default {
  createChallenge,
  getChallenge,
  updateChallenge,
  deleteChallenge,
  listChallenges,
  participateInChallenge,
  completeChallenge,
  generateChallenge,
  activateChallenge,
  cancelChallenge,
  getChallengeMetrics
};