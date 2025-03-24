import { Request, Response, NextFunction, Router } from 'express'; // ^4.18.2
import { PrismaClient } from '@prisma/client'; // ^4.16.0
import Redis from 'ioredis'; // ^5.3.0
import CompatibilityService from '../services/compatibility.service';
import {
  ICompatibilityRequest,
  ICompatibilityBatchRequest,
  CompatibilityFactor
} from '../models/compatibility.model';
import {
  validateGetCompatibility,
  validateCalculateCompatibility,
  validateCalculateBatchCompatibility
} from '../validations/compatibility.validation';
import { ApiError } from '../../shared/src/errors/api.error';
import { logger } from '../../shared/src/utils/logger.util';

// Default compatibility threshold (70%)
const DEFAULT_COMPATIBILITY_THRESHOLD = 0.7;

// Default limit for paginated results
const DEFAULT_LIMIT = 10;

/**
 * Controller for handling compatibility-related HTTP requests
 */
export class CompatibilityController {
  private compatibilityService: CompatibilityService;
  private router: Router;

  /**
   * Initializes the compatibility controller with required dependencies
   * @param prisma Database client for data access
   * @param redisClient Redis client for caching
   */
  constructor(prisma: PrismaClient, redisClient: Redis) {
    this.compatibilityService = new CompatibilityService(prisma, redisClient);
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Handles requests to get compatibility between two users
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getUserCompatibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, targetId } = req.params;
      const { targetType, includeDetails = false } = req.query;
      
      // Verify that targetType is 'user'
      if (targetType !== 'user') {
        throw ApiError.badRequest('Invalid targetType parameter. Expected "user".');
      }

      // Call the service to get compatibility between users
      const result = await this.compatibilityService.getUserCompatibility(
        userId,
        targetId,
        undefined, // use default factor weights
        includeDetails === 'true' || includeDetails === true
      );

      res.json(result);
    } catch (error) {
      logger.error('Error in getUserCompatibility controller', error as Error);
      next(error);
    }
  }

  /**
   * Handles requests to get compatibility between a user and a tribe
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getTribeCompatibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, targetId } = req.params;
      const { targetType, includeDetails = false } = req.query;
      
      // Verify that targetType is 'tribe'
      if (targetType !== 'tribe') {
        throw ApiError.badRequest('Invalid targetType parameter. Expected "tribe".');
      }

      // Call the service to get compatibility between user and tribe
      const result = await this.compatibilityService.getTribeCompatibility(
        userId,
        targetId,
        undefined, // use default factor weights
        includeDetails === 'true' || includeDetails === true
      );

      res.json(result);
    } catch (error) {
      logger.error('Error in getTribeCompatibility controller', error as Error);
      next(error);
    }
  }

  /**
   * Handles requests to calculate compatibility between a user and another user or tribe
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async calculateCompatibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const compatibilityRequest: ICompatibilityRequest = req.body;

      // Call the service to calculate compatibility
      const result = await this.compatibilityService.processCompatibilityRequest(compatibilityRequest);

      res.json(result);
    } catch (error) {
      logger.error('Error in calculateCompatibility controller', error as Error);
      next(error);
    }
  }

  /**
   * Handles requests to calculate compatibility between a user and multiple users or tribes
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async calculateBatchCompatibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batchRequest: ICompatibilityBatchRequest = req.body;

      // Call the service to calculate batch compatibility
      const result = await this.compatibilityService.processBatchCompatibilityRequest(batchRequest);

      res.json(result);
    } catch (error) {
      logger.error('Error in calculateBatchCompatibility controller', error as Error);
      next(error);
    }
  }

  /**
   * Handles requests to find the most compatible tribes for a user
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async findMostCompatibleTribes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      
      // Parse query parameters with appropriate defaults
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : DEFAULT_LIMIT;
      const threshold = req.query.threshold ? parseFloat(req.query.threshold as string) : DEFAULT_COMPATIBILITY_THRESHOLD * 100;
      const includeDetails = req.query.includeDetails === 'true' || req.query.includeDetails === true;
      
      // Extract factorWeights from request body if provided
      const factorWeights = req.body?.factorWeights;

      logger.debug('Finding most compatible tribes', {
        userId,
        limit,
        threshold,
        includeDetails,
        hasFactorWeights: !!factorWeights
      });

      // Call the service to find compatible tribes
      const result = await this.compatibilityService.findMostCompatibleTribes(
        userId,
        factorWeights,
        limit,
        threshold,
        includeDetails
      );

      res.json(result);
    } catch (error) {
      logger.error('Error in findMostCompatibleTribes controller', error as Error);
      next(error);
    }
  }

  /**
   * Handles requests to find the most compatible users for a given user
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async findMostCompatibleUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      
      // Parse query parameters with appropriate defaults
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : DEFAULT_LIMIT;
      const threshold = req.query.threshold ? parseFloat(req.query.threshold as string) : DEFAULT_COMPATIBILITY_THRESHOLD * 100;
      const includeDetails = req.query.includeDetails === 'true' || req.query.includeDetails === true;
      
      // Extract factorWeights from request body if provided
      const factorWeights = req.body?.factorWeights;

      logger.debug('Finding most compatible users', {
        userId,
        limit,
        threshold,
        includeDetails,
        hasFactorWeights: !!factorWeights
      });

      // Call the service to find compatible users
      const result = await this.compatibilityService.findMostCompatibleUsers(
        userId,
        factorWeights,
        limit,
        threshold,
        includeDetails
      );

      res.json(result);
    } catch (error) {
      logger.error('Error in findMostCompatibleUsers controller', error as Error);
      next(error);
    }
  }

  /**
   * Returns the Express router with configured routes
   * @returns Express router with compatibility routes
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Sets up the routes for the compatibility controller
   */
  private setupRoutes(): void {
    // Get compatibility between users
    this.router.get('/users/:userId/:targetId', validateGetCompatibility(), this.getUserCompatibility.bind(this));
    
    // Get compatibility between user and tribe
    this.router.get('/tribes/:userId/:targetId', validateGetCompatibility(), this.getTribeCompatibility.bind(this));
    
    // Calculate compatibility with custom weights
    this.router.post('/calculate', validateCalculateCompatibility(), this.calculateCompatibility.bind(this));
    
    // Calculate batch compatibility
    this.router.post('/calculate-batch', validateCalculateBatchCompatibility(), this.calculateBatchCompatibility.bind(this));
    
    // Find compatible tribes for a user
    this.router.get('/users/:userId/compatible-tribes', this.findMostCompatibleTribes.bind(this));
    
    // Find compatible users for a user
    this.router.get('/users/:userId/compatible-users', this.findMostCompatibleUsers.bind(this));
  }
}