import { Request, Response, NextFunction, Router } from 'express'; // ^4.18.2
import { PrismaClient } from '@prisma/client'; // ^4.16.0
import Redis from 'ioredis'; // ^5.3.0

import MatchingService from '../services/matching.service';
import {
  IAutoMatchingRequest,
  IManualMatchingRequest,
  IBatchMatchingRequest,
  IMatchingPreferences,
  IMatchingResponse
} from '../models/matching.model';

import {
  validateGetMatchingRequest,
  validateGetMatchResult,
  validateCreateMatchingRequest,
  validateCreateBatchMatchingRequest,
  validateUpdateMatchingPreferences,
  validateCreateAutoMatchingJob
} from '../validations/matching.validation';

import { ApiError } from '../../shared/src/errors/api.error';
import { logger } from '../../shared/src/utils/logger.util';

/**
 * Controller for handling AI-powered matchmaking HTTP requests
 * Provides endpoints for matching operations, retrieving results, and managing user preferences
 */
class MatchingController {
  private matchingService: MatchingService;
  private router: Router;

  /**
   * Initializes the matching controller with required dependencies
   * 
   * @param prisma - PrismaClient instance for database access
   * @param redisClient - Redis client for caching
   */
  constructor(prisma: PrismaClient, redisClient: Redis) {
    this.matchingService = new MatchingService(prisma, redisClient);
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Handles requests to get a matching operation by ID
   * 
   * @param req - Express request object containing operationId
   * @param res - Express response object
   * @param next - Express next function
   */
  async getMatchingOperation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      logger.info('Getting matching operation', { operationId: id });
      
      const operation = await this.matchingService.getMatchingOperation(id);
      
      if (!operation) {
        throw ApiError.notFound(`Matching operation with ID ${id} not found`);
      }
      
      res.json(operation);
    } catch (error) {
      logger.error('Error getting matching operation', error as Error, { operationId: req.params.id });
      next(error);
    }
  }

  /**
   * Handles requests to get matching results for an operation
   * 
   * @param req - Express request object containing operationId
   * @param res - Express response object
   * @param next - Express next function
   */
  async getMatchingResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { includeDetails } = req.query;
      
      logger.info('Getting matching results', { 
        operationId: id,
        includeDetails: !!includeDetails
      });
      
      const matchingResponse = await this.matchingService.getMatchingResponse(id);
      
      if (!matchingResponse) {
        throw ApiError.notFound(`Results for matching operation with ID ${id} not found`);
      }
      
      res.json(matchingResponse);
    } catch (error) {
      logger.error('Error getting matching results', error as Error, { operationId: req.params.id });
      next(error);
    }
  }

  /**
   * Handles requests to get a user's matching preferences
   * 
   * @param req - Express request object containing userId
   * @param res - Express response object
   * @param next - Express next function
   */
  async getUserMatchingPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      logger.info('Getting user matching preferences', { userId });
      
      const preferences = await this.matchingService.getUserMatchingPreferences(userId);
      
      // If no preferences exist yet, return an empty object instead of 404
      res.json(preferences || {});
    } catch (error) {
      logger.error('Error getting user matching preferences', error as Error, { userId: req.params.userId });
      next(error);
    }
  }

  /**
   * Handles requests to update a user's matching preferences
   * 
   * @param req - Express request object containing userId and preference data
   * @param res - Express response object
   * @param next - Express next function
   */
  async updateUserMatchingPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const preferencesData = req.body as Partial<IMatchingPreferences>;
      
      logger.info('Updating user matching preferences', { userId });
      logger.debug('Preference update data', { userId, preferences: preferencesData });
      
      const updatedPreferences = await this.matchingService.updateUserMatchingPreferences(
        userId,
        preferencesData
      );
      
      res.json(updatedPreferences);
    } catch (error) {
      logger.error('Error updating user matching preferences', error as Error, { userId: req.params.userId });
      next(error);
    }
  }

  /**
   * Handles requests to opt in for automatic matching
   * 
   * @param req - Express request object containing user ID and matching criteria
   * @param res - Express response object
   * @param next - Express next function
   */
  async optInForAutoMatching(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, criteria } = req.body as IAutoMatchingRequest;
      
      logger.info('User opting in for auto-matching', { userId });
      
      const request: IAutoMatchingRequest = {
        userId,
        criteria
      };
      
      const result = await this.matchingService.optInForAutoMatching(request);
      
      res.status(200).json({
        success: true,
        message: 'Successfully opted in for auto-matching',
        data: result
      });
    } catch (error) {
      logger.error('Error opting in for auto-matching', error as Error, { userId: (req.body as any).userId });
      next(error);
    }
  }

  /**
   * Handles requests to opt out from automatic matching
   * 
   * @param req - Express request object containing userId
   * @param res - Express response object
   * @param next - Express next function
   */
  async optOutFromAutoMatching(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      
      logger.info('User opting out from auto-matching', { userId });
      
      await this.matchingService.optOutFromAutoMatching(userId);
      
      res.status(200).json({
        success: true,
        message: 'Successfully opted out from auto-matching'
      });
    } catch (error) {
      logger.error('Error opting out from auto-matching', error as Error, { userId: req.params.userId });
      next(error);
    }
  }

  /**
   * Handles requests for immediate manual matching
   * 
   * @param req - Express request object containing user data and matching criteria
   * @param res - Express response object
   * @param next - Express next function
   */
  async requestManualMatching(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, criteria, preferExistingTribes = true } = req.body as IManualMatchingRequest;
      
      logger.info('Requesting manual matching', { userId });
      
      const request: IManualMatchingRequest = {
        userId,
        criteria,
        preferExistingTribes
      };
      
      const matchingResponse = await this.matchingService.requestManualMatching(request);
      
      res.json(matchingResponse);
    } catch (error) {
      logger.error('Error requesting manual matching', error as Error, { userId: (req.body as any).userId });
      next(error);
    }
  }

  /**
   * Handles requests for batch matching of multiple users
   * 
   * @param req - Express request object containing user IDs and matching criteria
   * @param res - Express response object
   * @param next - Express next function
   */
  async requestBatchMatching(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userIds, criteria, preferExistingTribes = true } = req.body as IBatchMatchingRequest;
      
      logger.info('Requesting batch matching', { userCount: userIds.length });
      
      const request: IBatchMatchingRequest = {
        userIds,
        criteria,
        preferExistingTribes
      };
      
      const operationId = await this.matchingService.requestBatchMatching(request);
      
      res.status(202).json({
        success: true,
        message: 'Batch matching operation initiated',
        operationId,
        userCount: userIds.length
      });
    } catch (error) {
      logger.error('Error requesting batch matching', error as Error, { userCount: (req.body as any).userIds?.length });
      next(error);
    }
  }

  /**
   * Handles requests to run scheduled matching for users who opted in
   * 
   * @param req - Express request object containing matchingFrequency
   * @param res - Express response object
   * @param next - Express next function
   */
  async runScheduledMatching(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { matchingFrequency } = req.body as { matchingFrequency: 'weekly' | 'biweekly' | 'monthly' };
      
      logger.info('Running scheduled matching', { matchingFrequency });
      
      const result = await this.matchingService.runScheduledMatching(matchingFrequency);
      
      res.status(202).json({
        success: true,
        message: `Scheduled matching initiated for ${matchingFrequency} frequency`,
        operationId: result.operationId,
        userCount: result.userCount
      });
    } catch (error) {
      logger.error('Error running scheduled matching', error as Error, { matchingFrequency: (req.body as any).matchingFrequency });
      next(error);
    }
  }

  /**
   * Returns the Express router with configured routes
   * 
   * @returns Express router with matching routes
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Sets up the routes for the matching controller
   */
  private setupRoutes(): void {
    // Get matching operation by ID
    this.router.get(
      '/matching/operations/:id',
      validateGetMatchingRequest(),
      this.getMatchingOperation.bind(this)
    );
    
    // Get matching results by operation ID
    this.router.get(
      '/matching/results/:id',
      validateGetMatchResult(),
      this.getMatchingResults.bind(this)
    );
    
    // Get user matching preferences
    this.router.get(
      '/matching/preferences/:userId',
      this.getUserMatchingPreferences.bind(this)
    );
    
    // Update user matching preferences
    this.router.put(
      '/matching/preferences/:userId',
      validateUpdateMatchingPreferences(),
      this.updateUserMatchingPreferences.bind(this)
    );
    
    // Opt in for auto-matching
    this.router.post(
      '/matching/opt-in',
      validateCreateMatchingRequest(),
      this.optInForAutoMatching.bind(this)
    );
    
    // Opt out from auto-matching
    this.router.post(
      '/matching/opt-out/:userId',
      this.optOutFromAutoMatching.bind(this)
    );
    
    // Request manual matching
    this.router.post(
      '/matching/manual',
      validateCreateMatchingRequest(),
      this.requestManualMatching.bind(this)
    );
    
    // Request batch matching
    this.router.post(
      '/matching/batch',
      validateCreateBatchMatchingRequest(),
      this.requestBatchMatching.bind(this)
    );
    
    // Run scheduled matching
    this.router.post(
      '/matching/scheduled',
      validateCreateAutoMatchingJob(),
      this.runScheduledMatching.bind(this)
    );
  }
}

export default MatchingController;