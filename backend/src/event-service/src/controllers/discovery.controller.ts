import { Request, Response, NextFunction } from 'express'; // v4.18.2
import DiscoveryService from '../services/discovery.service';
import {
  validateEventSearchParams,
  validateNearbyEventsParams,
  validateWeatherBasedActivityParams,
  validatePopularEventsParams,
} from '../validations/discovery.validation';
import {
  IEventSearchParams,
  IWeatherBasedActivityParams,
  IEvent,
} from '../../../shared/src/types/event.types';
import { InterestCategory } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';

// Initialize DiscoveryService instance
const discoveryService = new DiscoveryService();

/**
 * Handles requests to search for events based on various criteria
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export async function searchEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Log the incoming search request
  logger.info('Handling event search request', { query: req.query });

  try {
    // Validate the query parameters using validateEventSearchParams
    const searchParams = validateEventSearchParams(req.query) as IEventSearchParams;

    // Call discoveryService.discoverEvents with the validated parameters
    const searchResults = await discoveryService.discoverEvents(searchParams);

    // Return the search results with HTTP 200 status
    res.status(200).json(searchResults);
  } catch (error) {
    // If an error occurs, catch it and pass to the next middleware
    logger.error('Error during event search', { error: error.message, stack: error.stack });

    if (error instanceof ApiError) {
      // For validation errors, return a bad request response
      return next(error);
    }

    // For other errors, log the error and return an internal server error
    next(ApiError.internal('Failed to search events'));
  }
}

/**
 * Handles requests to find events near a specific location
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export async function getEventsByLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Log the incoming location-based search request
  logger.info('Handling location-based event search request', { query: req.query });

  try {
    // Validate the query parameters using validateNearbyEventsParams
    const { location, radius, ...options } = validateNearbyEventsParams(req.query);

    // Extract coordinates and radius from the validated parameters
    const { latitude, longitude } = location;

    // Call discoveryService.discoverEventsByLocation with coordinates, radius, and options
    const nearbyEvents = await discoveryService.discoverEventsByLocation(
      { latitude, longitude },
      radius,
      options
    );

    // Return the nearby events with HTTP 200 status
    res.status(200).json(nearbyEvents);
  } catch (error) {
    // If an error occurs, catch it and pass to the next middleware
    logger.error('Error during location-based event search', { error: error.message, stack: error.stack });

    if (error instanceof ApiError) {
      // For validation errors, return a bad request response
      return next(error);
    }

    // For other errors, log the error and return an internal server error
    next(ApiError.internal('Failed to search events by location'));
  }
}

/**
 * Handles requests to find events matching specific interest categories
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export async function getEventsByInterest(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Log the incoming interest-based search request
  logger.info('Handling interest-based event search request', { query: req.query });

  try {
    // Extract categories from query parameters
    const categories = req.query.categories as string[];

    // Validate that categories are valid InterestCategory values
    if (!categories || !Array.isArray(categories)) {
      throw ApiError.badRequest('Categories must be provided as an array');
    }

    // Call discoveryService.discoverEventsByInterest with categories and options
    const interestEvents = await discoveryService.discoverEventsByInterest(
      categories as InterestCategory[],
      req.query
    );

    // Return the interest-based events with HTTP 200 status
    res.status(200).json(interestEvents);
  } catch (error) {
    // If an error occurs, catch it and pass to the next middleware
    logger.error('Error during interest-based event search', { error: error.message, stack: error.stack });

    if (error instanceof ApiError) {
      // For validation errors, return a bad request response
      return next(error);
    }

    // For other errors, log the error and return an internal server error
    next(ApiError.internal('Failed to search events by interest'));
  }
}

/**
 * Handles requests to find events suitable for current or forecasted weather conditions
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export async function getWeatherBasedEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Log the incoming weather-based search request
  logger.info('Handling weather-based event search request', { query: req.query });

  try {
    // Validate the query parameters using validateWeatherBasedActivityParams
    const params = validateWeatherBasedActivityParams(req.query) as IWeatherBasedActivityParams;

    // Call discoveryService.discoverWeatherBasedEvents with the validated parameters
    const weatherEvents = await discoveryService.discoverWeatherBasedEvents(params);

    // Return the weather-appropriate events with HTTP 200 status
    // Include weather data in the response
    res.status(200).json(weatherEvents);
  } catch (error) {
    // If an error occurs, catch it and pass to the next middleware
    logger.error('Error during weather-based event search', { error: error.message, stack: error.stack });

    if (error instanceof ApiError) {
      // For validation errors, return a bad request response
      return next(error);
    }

    // For other errors, log the error and return an internal server error
    next(ApiError.internal('Failed to search events by weather'));
  }
}

/**
 * Handles requests to find trending or popular events
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export async function getPopularEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Log the incoming popular events request
  logger.info('Handling popular events search request', { query: req.query });

  try {
    // Validate the query parameters using validatePopularEventsParams
    const options = validatePopularEventsParams(req.query);

    // Call discoveryService.discoverPopularEvents with the validated parameters
    const popularEvents = await discoveryService.discoverPopularEvents(options);

    // Return the popular events with HTTP 200 status
    res.status(200).json(popularEvents);
  } catch (error) {
    // If an error occurs, catch it and pass to the next middleware
    logger.error('Error during popular events search', { error: error.message, stack: error.stack });

    if (error instanceof ApiError) {
      // For validation errors, return a bad request response
      return next(error);
    }

    // For other errors, log the error and return an internal server error
    next(ApiError.internal('Failed to search popular events'));
  }
}

/**
 * Handles requests to find free or low-cost events
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export async function getBudgetFriendlyEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Log the incoming budget-friendly events request
  logger.info('Handling budget-friendly events search request', { query: req.query });

  try {
    // Extract and validate maxCost parameter from query
    const maxCost = parseFloat(req.query.maxCost as string);
    if (isNaN(maxCost)) {
      throw ApiError.badRequest('maxCost must be a number');
    }

    // Call discoveryService.discoverBudgetFriendlyEvents with maxCost and options
    const budgetEvents = await discoveryService.discoverBudgetFriendlyEvents(maxCost, req.query);

    // Return the budget-friendly events with HTTP 200 status
    res.status(200).json(budgetEvents);
  } catch (error) {
    // If an error occurs, catch it and pass to the next middleware
    logger.error('Error during budget-friendly events search', { error: error.message, stack: error.stack });

    if (error instanceof ApiError) {
      // For validation errors, return a bad request response
      return next(error);
    }

    // For other errors, log the error and return an internal server error
    next(ApiError.internal('Failed to search budget-friendly events'));
  }
}

/**
 * Handles requests to find events within a specific date/time range
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export async function getEventsForTimeframe(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Log the incoming timeframe-based search request
  logger.info('Handling timeframe-based event search request', { query: req.query });

  try {
    // Extract and validate startDate and endDate parameters from query
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw ApiError.badRequest('startDate and endDate must be valid dates');
    }

    // Call discoveryService.discoverEventsForTimeframe with startDate, endDate, and options
    const timeEvents = await discoveryService.discoverEventsForTimeframe(startDate, endDate, req.query);

    // Return the time-based events with HTTP 200 status
    res.status(200).json(timeEvents);
  } catch (error) {
    // If an error occurs, catch it and pass to the next middleware
    logger.error('Error during timeframe-based event search', { error: error.message, stack: error.stack });

    if (error instanceof ApiError) {
      // For validation errors, return a bad request response
      return next(error);
    }

    // For other errors, log the error and return an internal server error
    next(ApiError.internal('Failed to search events by timeframe'));
  }
}

/**
 * Handles requests to clear the discovery cache
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export async function clearDiscoveryCache(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Log the cache clearing request
  logger.info('Handling discovery cache clearing request');

  try {
    // Call discoveryService.clearCache()
    discoveryService.clearCache();

    // Return a success message with HTTP 200 status
    res.status(200).json({ message: 'Discovery cache cleared successfully' });
  } catch (error) {
    // If an error occurs, catch it and pass to the next middleware
    logger.error('Error during discovery cache clearing', { error: error.message, stack: error.stack });

    // Log the error and return an internal server error
    next(ApiError.internal('Failed to clear discovery cache'));
  }
}