import { Request, Response, NextFunction } from 'express'; // express
import SuggestionService from '../services/suggestion.service';
import { validateBody, validateQuery, validateParams } from '../../../shared/src/middlewares/validation.middleware';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';
import { IMatchingSuggestion } from '../models/matching.model';

const DEFAULT_SUGGESTION_LIMIT = 10;

/**
 * Controller for handling tribe and user suggestion endpoints
 */
export default class SuggestionController {
  private suggestionService: SuggestionService;

  /**
   * Initializes the suggestion controller with required dependencies
   * @param suggestionService Suggestion service for generating suggestions
   */
  constructor(suggestionService: SuggestionService) {
    this.suggestionService = suggestionService;
  }

  /**
   * Gets tribe suggestions for a user based on compatibility
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise<void> No return value, sends HTTP response
   */
  async getTribeSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract userId from request parameters
      const { userId } = req.params;
      if (!userId) {
        throw ApiError.badRequest('User ID is required in parameters');
      }

      // Extract limit and includeDetails from query parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : DEFAULT_SUGGESTION_LIMIT;
      const includeDetails = req.query.includeDetails === 'true';

      // Extract optional filters from query parameters
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

      // Log the request details
      logger.info(`Getting tribe suggestions for user ${userId} with limit ${limit} and includeDetails ${includeDetails}`, { userId, limit, includeDetails, filters });

      // Call suggestionService.getSuggestedTribes with parameters
      const suggestions = await this.suggestionService.getSuggestedTribes(userId, limit, includeDetails, filters);

      // Return suggestions as JSON response
      res.json(suggestions);
    } catch (error) {
      // Log the error
      logger.error('Error getting tribe suggestions', { error });

      // Pass the error to the next middleware for error handling
      next(error);
    }
  }

  /**
   * Gets user suggestions for a user based on compatibility
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise<void> No return value, sends HTTP response
   */
  async getUserSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract userId from request parameters
      const { userId } = req.params;
       if (!userId) {
        throw ApiError.badRequest('User ID is required in parameters');
      }

      // Extract limit and includeDetails from query parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : DEFAULT_SUGGESTION_LIMIT;
      const includeDetails = req.query.includeDetails === 'true';

      // Log the request details
      logger.info(`Getting user suggestions for user ${userId} with limit ${limit} and includeDetails ${includeDetails}`, { userId, limit, includeDetails });

      // Call suggestionService.getSuggestedUsers with parameters
      const suggestions = await this.suggestionService.getSuggestedUsers(userId, limit, includeDetails);

      // Return suggestions as JSON response
      res.json(suggestions);
    } catch (error) {
      // Log the error
      logger.error('Error getting user suggestions', { error });

      // Pass the error to the next middleware for error handling
      next(error);
    }
  }

  /**
   * Gets highly personalized tribe suggestions based on user preferences and behavior
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise<void> No return value, sends HTTP response
   */
  async getPersonalizedSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract userId from request parameters
      const { userId } = req.params;
       if (!userId) {
        throw ApiError.badRequest('User ID is required in parameters');
      }

      // Extract limit from query parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : DEFAULT_SUGGESTION_LIMIT;

      // Log the request details
      logger.info(`Getting personalized tribe suggestions for user ${userId} with limit ${limit}`, { userId, limit });

      // Call suggestionService.getPersonalizedTribeSuggestions with parameters
      const suggestions = await this.suggestionService.getPersonalizedTribeSuggestions(userId, limit);

      // Return personalized suggestions as JSON response
      res.json(suggestions);
    } catch (error) {
      // Log the error
      logger.error('Error getting personalized tribe suggestions', { error });

      // Pass the error to the next middleware for error handling
      next(error);
    }
  }

  /**
   * Forces a refresh of cached suggestions for a user
   * @param req Express Request
   * @param res Express Response
   * @param next Express NextFunction
   * @returns Promise<void> No return value, sends HTTP response
   */
  async refreshSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract userId from request parameters
      const { userId } = req.params;
       if (!userId) {
        throw ApiError.badRequest('User ID is required in parameters');
      }

      // Extract suggestionType from request body
      const { suggestionType } = req.body;

      // Log the request details
      logger.info(`Refreshing suggestions for user ${userId} with suggestionType ${suggestionType}`, { userId, suggestionType });

      // Call suggestionService.refreshSuggestions with parameters
      const result = await this.suggestionService.refreshSuggestions(userId, suggestionType);

      // Return success response
      res.json(result);
    } catch (error) {
      // Log the error
      logger.error('Error refreshing suggestions', { error });

      // Pass the error to the next middleware for error handling
      next(error);
    }
  }
}