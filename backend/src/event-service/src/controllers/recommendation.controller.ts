import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { RecommendationService } from '../services/recommendation.service';
import {
  validateEventRecommendationParams,
  validateWeatherBasedActivityParams,
  validatePopularEventsParams
} from '../validations/discovery.validation';
import {
  IEventRecommendationParams,
  IWeatherBasedActivityParams
} from '../../../shared/src/types/event.types';
import { ICoordinates, InterestCategory } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';

// Initialize the RecommendationService
const recommendationService = new RecommendationService();

/**
 * Handles requests to get personalized event recommendations for a user
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 */
export const getPersonalizedRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId from request parameters
    const userId = req.params.userId;

    // Extract recommendation options from query parameters
    const options = req.query;

    // Validate parameters using validateEventRecommendationParams
    const params: IEventRecommendationParams = {
      userId,
      ...options,
    } as any;

    validateEventRecommendationParams(params);

    // Call recommendationService.getPersonalizedRecommendations with userId and options
    const recommendations = await recommendationService.getPersonalizedRecommendations(userId, options);

    // Return the recommendations with HTTP 200 status
    res.status(200).json(recommendations);
  } catch (error) {
    // Catch validation errors and return 400 Bad Request
    if (error instanceof ApiError && error.statusCode === 400) {
      logger.error(`Bad Request: ${error.message}`, { error });
      return next(error);
    }

    // Catch other errors and pass them to the next middleware
    logger.error('Error getting personalized recommendations', { error });
    next(error);
  }
};

/**
 * Handles requests to get event recommendations for a tribe
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 */
export const getTribeRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract tribeId from request parameters
    const tribeId = req.params.tribeId;

    // Extract recommendation options from query parameters
    const options = req.query;

    // Validate parameters using validateEventRecommendationParams
    const params: IEventRecommendationParams = {
      tribeId,
      ...options,
    } as any;

    validateEventRecommendationParams(params);

    // Call recommendationService.getTribeRecommendations with tribeId and options
    const recommendations = await recommendationService.getTribeRecommendations(tribeId, options);

    // Return the recommendations with HTTP 200 status
    res.status(200).json(recommendations);
  } catch (error) {
    // Catch validation errors and return 400 Bad Request
    if (error instanceof ApiError && error.statusCode === 400) {
      logger.error(`Bad Request: ${error.message}`, { error });
      return next(error);
    }

    // Catch other errors and pass them to the next middleware
    logger.error('Error getting tribe recommendations', { error });
    next(error);
  }
};

/**
 * Handles requests to get weather-based event recommendations
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 */
export const getWeatherBasedRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract coordinates and date from request query parameters
    const { latitude, longitude, date, ...options } = req.query;

    // Validate parameters using validateWeatherBasedActivityParams
    const params: IWeatherBasedActivityParams = {
      location: {
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
      },
      date: date ? new Date(date as string) : new Date(),
      ...options,
    } as any;

    validateWeatherBasedActivityParams(params);

    // Call recommendationService.getWeatherBasedRecommendations with coordinates, date, and options
    const recommendations = await recommendationService.getWeatherBasedRecommendations(
      params.location,
      params.date,
      options
    );

    // Return the recommendations and weather data with HTTP 200 status
    res.status(200).json(recommendations);
  } catch (error) {
    // Catch validation errors and return 400 Bad Request
    if (error instanceof ApiError && error.statusCode === 400) {
      logger.error(`Bad Request: ${error.message}`, { error });
      return next(error);
    }

    // Catch other errors and pass them to the next middleware
    logger.error('Error getting weather-based recommendations', { error });
    next(error);
  }
};

/**
 * Handles requests to get budget-friendly event recommendations
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 */
export const getBudgetFriendlyRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract maxCost from request query parameters
    const maxCost = parseFloat(req.query.maxCost as string);

    // Extract other options from query parameters
    const options = req.query;

    // Call recommendationService.getBudgetFriendlyRecommendations with maxCost and options
    const recommendations = await recommendationService.getBudgetFriendlyRecommendations(maxCost, options);

    // Return the recommendations with HTTP 200 status
    res.status(200).json(recommendations);
  } catch (error) {
    // Catch errors and pass them to the next middleware
    logger.error('Error getting budget-friendly recommendations', { error });
    next(error);
  }
};

/**
 * Handles requests to get recommendations for spontaneous activities happening soon
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 */
export const getSpontaneousRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract coordinates from request query parameters
    const { latitude, longitude } = req.query;
    const coordinates: ICoordinates = {
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string),
    };

    // Extract other options from query parameters
    const options = req.query;

    // Call recommendationService.getSpontaneousRecommendations with coordinates and options
    const recommendations = await recommendationService.getSpontaneousRecommendations(coordinates, options);

    // Return the recommendations with HTTP 200 status
    res.status(200).json(recommendations);
  } catch (error) {
    // Catch errors and pass them to the next middleware
    logger.error('Error getting spontaneous recommendations', { error });
    next(error);
  }
};

/**
 * Handles requests to get event recommendations based on specific interests
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 */
export const getRecommendationsByInterest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract interests array from request query parameters
    const interests = req.query.interests as string[];

    // Extract other options from query parameters
    const options = req.query;

    // Validate that interests are valid InterestCategory values
    if (!Array.isArray(interests) || !interests.every(interest => Object.values(InterestCategory).includes(interest as InterestCategory))) {
      throw ApiError.badRequest('Invalid interests provided');
    }

    // Call recommendationService.getRecommendationsByInterest with interests and options
    const recommendations = await recommendationService.getRecommendationsByInterest(interests as InterestCategory[], options);

    // Return the recommendations with HTTP 200 status
    res.status(200).json(recommendations);
  } catch (error) {
    // Catch validation errors and return 400 Bad Request
    if (error instanceof ApiError && error.statusCode === 400) {
      logger.error(`Bad Request: ${error.message}`, { error });
      return next(error);
    }

    // Catch other errors and pass them to the next middleware
    logger.error('Error getting recommendations by interest', { error });
    next(error);
  }
};

/**
 * Handles requests to get recommendations for events similar to a specified event
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 */
export const getSimilarEventRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract eventId from request parameters
    const eventId = req.params.eventId;

    // Extract options from query parameters
    const options = req.query;

    // Call recommendationService.getSimilarEventRecommendations with eventId and options
    const recommendations = await recommendationService.getSimilarEventRecommendations(eventId, options);

    // Return the recommendations with HTTP 200 status
    res.status(200).json(recommendations);
  } catch (error) {
    // Catch errors and pass them to the next middleware
    logger.error('Error getting similar event recommendations', { error });
    next(error);
  }
};

/**
 * Handles requests to get recommendations for trending or popular events
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 */
export const getPopularEventRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract coordinates from request query parameters
    const { latitude, longitude } = req.query;
    const coordinates: ICoordinates = {
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string),
    };

    // Extract other options from query parameters
    const options = req.query;

    // Validate parameters using validatePopularEventsParams
    validatePopularEventsParams({ coordinates, ...options });

    // Call recommendationService.getPopularEventRecommendations with coordinates and options
    const recommendations = await recommendationService.getPopularEventRecommendations(coordinates, options);

    // Return the recommendations with HTTP 200 status
    res.status(200).json(recommendations);
  } catch (error) {
    // Catch validation errors and return 400 Bad Request
    if (error instanceof ApiError && error.statusCode === 400) {
      logger.error(`Bad Request: ${error.message}`, { error });
      return next(error);
    }

    // Catch other errors and pass them to the next middleware
    logger.error('Error getting popular event recommendations', { error });
    next(error);
  }
};

/**
 * Handles requests to clear the recommendation cache
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 */
export const clearRecommendationCache = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Call recommendationService.clearCache()
    recommendationService.clearCache();

    // Return success message with HTTP 200 status
    res.status(200).json({ message: 'Recommendation cache cleared successfully' });
  } catch (error) {
    // Catch errors and pass them to the next middleware
    logger.error('Error clearing recommendation cache', { error });
    next(error);
  }
};