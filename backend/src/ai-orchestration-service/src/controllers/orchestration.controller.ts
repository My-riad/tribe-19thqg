import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { z } from 'zod'; // ^3.21.4

import {
  OrchestrationService
} from '../services/orchestration.service';
import {
  OrchestrationFeature,
  OrchestrationRequest,
  OrchestrationResponse,
  OrchestrationStatus,
  OrchestrationPriority,
  MatchingOperation,
  PersonalityOperation,
  EngagementOperation,
  RecommendationOperation,
  MatchingOrchestrationInput,
  PersonalityOrchestrationInput,
  EngagementOrchestrationInput,
  RecommendationOrchestrationInput,
  ConversationOrchestrationInput
} from '../models/orchestration.model';
import { ModelParameters } from '../models/model.model';
import {
  validateBody,
  validateParams,
  validateQuery
} from '../../../shared/src/middlewares/validation.middleware';
import {
  createOrchestrationRequestValidation,
  matchingInputValidation,
  personalityInputValidation,
  engagementInputValidation,
  recommendationInputValidation,
  conversationInputValidation
} from '../validations/orchestration.validation';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../config/logging';

/**
 * Controller class for handling AI orchestration-related HTTP requests
 */
export class OrchestrationController {
  private orchestrationService: OrchestrationService;

  /**
   * Initialize the orchestration controller with required services
   * @param orchestrationService - Orchestration service instance
   */
  constructor(orchestrationService: OrchestrationService) {
    // LD1: Store the orchestration service instance
    this.orchestrationService = orchestrationService;
    // LD1: Initialize the orchestration service
    orchestrationService.initialize();
  }

  /**
   * Create a new orchestration request
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  createRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // LD1: Log the start of the request processing
    logger.info('Creating new orchestration request', { body: req.body });
    try {
      // LD1: Extract request data from request body (feature, input, userId, modelId, parameters, priority)
      const {
        feature,
        input,
        userId,
        modelId,
        parameters,
        priority
      } = req.body;

      // LD1: Try to create an orchestration request using the orchestration service
      const request = await this.orchestrationService.createOrchestrationRequest(
        feature,
        input,
        userId,
        modelId,
        parameters,
        priority
      );

      // LD1: Return the created request as JSON response with 201 status code
      res.status(201).json(request);
      logger.info(`Orchestration request created successfully with id: ${request.id}`);
    } catch (error) {
      // LD1: Log the error
      logger.error('Error creating orchestration request', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Get an orchestration request by ID
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Getting orchestration request by ID', { params: req.params });
    try {
      // LD1: Extract request ID from request parameters
      const { id } = req.params;

      // LD1: Try to get the orchestration request from the orchestration service
      const request = await this.orchestrationService.getOrchestrationRequest(id);

      // LD1: If request not found, throw ApiError.notFound
      if (!request) {
        throw ApiError.notFound(`Orchestration request not found with id: ${id}`);
      }

      // LD1: Return request as JSON response with 200 status code
      res.status(200).json(request);
      logger.info(`Orchestration request retrieved successfully with id: ${id}`);
    } catch (error) {
      // LD1: Log the error
      logger.error('Error getting orchestration request', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Process an orchestration request synchronously
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  processRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Processing orchestration request', { params: req.params });
    try {
      // LD1: Extract request ID from request parameters
      const { id } = req.params;

      // LD1: Try to process the orchestration request using the orchestration service
      const response = await this.orchestrationService.processOrchestrationRequest(id);

      // LD1: Return the orchestration response as JSON response with 200 status code
      res.status(200).json(response);
      logger.info(`Orchestration request processed successfully with id: ${id}`);
    } catch (error) {
      // LD1: Log the error
      logger.error('Error processing orchestration request', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Queue an orchestration request for asynchronous processing
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  queueRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Queueing orchestration request', { params: req.params });
    try {
      // LD1: Extract request ID from request parameters
      const { id } = req.params;

      // LD1: Try to queue the orchestration request using the orchestration service
      const requestId = await this.orchestrationService.queueOrchestrationRequest(id);

      // LD1: Return a success response with the request ID and 202 status code
      res.status(202).json({ message: 'Request queued successfully', requestId });
      logger.info(`Orchestration request queued successfully with id: ${id}`);
    } catch (error) {
      // LD1: Log the error
      logger.error('Error queueing orchestration request', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Get an orchestration response by request ID
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getResponse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Getting orchestration response', { params: req.params });
    try {
      // LD1: Extract request ID from request parameters
      const { id } = req.params;

      // LD1: Try to get the orchestration response from the orchestration service
      const response = await this.orchestrationService.getOrchestrationResponse(id);

      // LD1: If response not found, throw ApiError.notFound
      if (!response) {
        throw ApiError.notFound(`Orchestration response not found for request id: ${id}`);
      }

      // LD1: Return response as JSON response with 200 status code
      res.status(200).json(response);
      logger.info(`Orchestration response retrieved successfully for request id: ${id}`);
    } catch (error) {
      // LD1: Log the error
      logger.error('Error getting orchestration response', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Cancel a pending orchestration request
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  cancelRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Cancelling orchestration request', { params: req.params });
    try {
      // LD1: Extract request ID from request parameters
      const { id } = req.params;

      // LD1: Try to cancel the orchestration request using the orchestration service
      await this.orchestrationService.cancelOrchestrationRequest(id);

      // LD1: Return a success response with 200 status code
      res.status(200).json({ message: 'Request cancelled successfully' });
      logger.info(`Orchestration request cancelled successfully with id: ${id}`);
    } catch (error) {
      // LD1: Log the error
      logger.error('Error cancelling orchestration request', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Create and immediately process an orchestration request
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  createAndProcessRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Creating and processing orchestration request', { body: req.body });
    try {
      // LD1: Extract request data from request body (feature, input, userId, modelId, parameters)
      const {
        feature,
        input,
        userId,
        modelId,
        parameters
      } = req.body;

      // LD1: Try to create an orchestration request using the orchestration service
      const request = await this.orchestrationService.createOrchestrationRequest(
        feature,
        input,
        userId,
        modelId,
        parameters,
        OrchestrationPriority.MEDIUM // Default priority
      );

      // LD1: Immediately process the created request
      const response = await this.orchestrationService.processOrchestrationRequest(request.id);

      // LD1: Return the orchestration response as JSON response with 200 status code
      res.status(200).json(response);
      logger.info(`Orchestration request created and processed successfully with id: ${request.id}`);
    } catch (error) {
      // LD1: Log the error
      logger.error('Error creating and processing orchestration request', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Create and queue an orchestration request for asynchronous processing
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  createAndQueueRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Creating and queueing orchestration request', { body: req.body });
    try {
      // LD1: Extract request data from request body (feature, input, userId, modelId, parameters, priority)
      const {
        feature,
        input,
        userId,
        modelId,
        parameters,
        priority
      } = req.body;

      // LD1: Try to create an orchestration request using the orchestration service
      const request = await this.orchestrationService.createOrchestrationRequest(
        feature,
        input,
        userId,
        modelId,
        parameters,
        priority
      );

      // LD1: Queue the created request for asynchronous processing
      const requestId = await this.orchestrationService.queueOrchestrationRequest(request.id);

      // LD1: Return a success response with the request ID and 202 status code
      res.status(202).json({ message: 'Request queued successfully', requestId });
      logger.info(`Orchestration request created and queued successfully with id: ${request.id}`);
    } catch (error) {
      // LD1: Log the error
      logger.error('Error creating and queueing orchestration request', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Create and process a matching feature orchestration request
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  processMatchingRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Processing matching request', { body: req.body });
    try {
      // LD1: Extract matching input data from request body
      const { input } = req.body;

      // LD1: Extract optional parameters (userId, modelId, parameters)
      const { userId, modelId, parameters } = req.body;

      // LD1: Create an orchestration request with feature=MATCHING
      const request = await this.orchestrationService.createOrchestrationRequest(
        OrchestrationFeature.MATCHING,
        input,
        userId,
        modelId,
        parameters,
        OrchestrationPriority.MEDIUM // Default priority
      );

      // LD1: Process the request immediately
      const response = await this.orchestrationService.processOrchestrationRequest(request.id);

      // LD1: Return the orchestration response as JSON response with 200 status code
      res.status(200).json(response);
      logger.info(`Matching request processed successfully with id: ${request.id}`);
    } catch (error) {
      // LD1: Log the error
      logger.error('Error processing matching request', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Create and process a personality analysis feature orchestration request
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  processPersonalityRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Processing personality request', { body: req.body });
    try {
      // LD1: Extract personality input data from request body
      const { input } = req.body;

      // LD1: Extract optional parameters (userId, modelId, parameters)
      const { userId, modelId, parameters } = req.body;

      // LD1: Create an orchestration request with feature=PERSONALITY_ANALYSIS
      const request = await this.orchestrationService.createOrchestrationRequest(
        OrchestrationFeature.PERSONALITY_ANALYSIS,
        input,
        userId,
        modelId,
        parameters,
        OrchestrationPriority.MEDIUM // Default priority
      );

      // LD1: Process the request immediately
      const response = await this.orchestrationService.processOrchestrationRequest(request.id);

      // LD1: Return the orchestration response as JSON response with 200 status code
      res.status(200).json(response);
      logger.info(`Personality request processed successfully with id: ${request.id}`);
    } catch (error) {
      // LD1: Log the error
      logger.error('Error processing personality request', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Create and process an engagement feature orchestration request
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  processEngagementRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Processing engagement request', { body: req.body });
    try {
      // LD1: Extract engagement input data from request body
      const { input } = req.body;

      // LD1: Extract optional parameters (userId, modelId, parameters)
      const { userId, modelId, parameters } = req.body;

      // LD1: Create an orchestration request with feature=ENGAGEMENT
      const request = await this.orchestrationService.createOrchestrationRequest(
        OrchestrationFeature.ENGAGEMENT,
        input,
        userId,
        modelId,
        parameters,
        OrchestrationPriority.MEDIUM // Default priority
      );

      // LD1: Process the request immediately
      const response = await this.orchestrationService.processOrchestrationRequest(request.id);

      // LD1: Return the orchestration response as JSON response with 200 status code
      res.status(200).json(response);
      logger.info(`Engagement request processed successfully with id: ${request.id}`);
    } catch (error) {
      // LD1: Log the error
      logger.error('Error processing engagement request', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Create and process a recommendation feature orchestration request
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  processRecommendationRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Processing recommendation request', { body: req.body });
    try {
      // LD1: Extract recommendation input data from request body
      const { input } = req.body;

      // LD1: Extract optional parameters (userId, modelId, parameters)
      const { userId, modelId, parameters } = req.body;

      // LD1: Create an orchestration request with feature=RECOMMENDATION
      const request = await this.orchestrationService.createOrchestrationRequest(
        OrchestrationFeature.RECOMMENDATION,
        input,
        userId,
        modelId,
        parameters,
        OrchestrationPriority.MEDIUM // Default priority
      );

      // LD1: Process the request immediately
      const response = await this.orchestrationService.processOrchestrationRequest(request.id);

      // LD1: Return the orchestration response as JSON response with 200 status code
      res.status(200).json(response);
      logger.info(`Recommendation request processed successfully with id: ${request.id}`);
    } catch (error) {
      // LD1: Log the error
      logger.error('Error processing recommendation request', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Create and process a conversation feature orchestration request
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  processConversationRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Processing conversation request', { body: req.body });
    try {
      // LD1: Extract conversation input data from request body
      const { input } = req.body;

      // LD1: Extract optional parameters (userId, modelId, parameters)
      const { userId, modelId, parameters } = req.body;

      // LD1: Create an orchestration request with feature=CONVERSATION
      const request = await this.orchestrationService.createOrchestrationRequest(
        OrchestrationFeature.CONVERSATION,
        input,
        userId,
        modelId,
        parameters,
        OrchestrationPriority.MEDIUM // Default priority
      );

      // LD1: Process the request immediately
      const response = await this.orchestrationService.processOrchestrationRequest(request.id);

      // LD1: Return the orchestration response as JSON response with 200 status code
      res.status(200).json(response);
      logger.info(`Conversation request processed successfully with id: ${request.id}`);
    } catch (error) {
      // LD1: Log the error
      logger.error('Error processing conversation request', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Clear the orchestration service cache
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  clearCache = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Clearing orchestration service cache');
    try {
      // LD1: Try to clear the orchestration service cache
      this.orchestrationService.clearCache();

      // LD1: Return success response with 200 status code
      res.status(200).json({ message: 'Cache cleared successfully' });
      logger.info('Orchestration service cache cleared successfully');
    } catch (error) {
      // LD1: Log the error
      logger.error('Error clearing orchestration service cache', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };

  /**
   * Check the health status of the orchestration service
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  getHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Checking orchestration service health');
    try {
      // LD1: Try to check orchestration service health status
      const health = await this.orchestrationService.getHealth();

      // LD1: Return health status as JSON response
      res.status(200).json(health);
      logger.info('Orchestration service health check completed successfully');
    } catch (error) {
      // LD1: Log the error
      logger.error('Error checking orchestration service health', { error });
      // LD1: Catch and forward any errors to the error handling middleware
      next(error);
    }
  };
}

/**
 * Validation schema for request ID parameters
 */
export const requestIdParamSchema = z.object({
  id: z.string().uuid()
});

/**
 * Middleware for validating request ID parameters
 */
export const validateRequestIdParam = validateParams(requestIdParamSchema);

/**
 * Validation schema for creating orchestration requests
 */
export const createOrchestrationRequestSchema = z.object({
  feature: z.nativeEnum(OrchestrationFeature),
  input: z.record(z.any()),
  userId: z.string().uuid(),
  modelId: z.string().uuid().optional(),
  parameters: z.record(z.any()).optional(),
  priority: z.nativeEnum(OrchestrationPriority).optional()
});

/**
 * Middleware for validating orchestration request creation
 */
export const validateCreateOrchestrationRequest = validateBody(createOrchestrationRequestSchema);