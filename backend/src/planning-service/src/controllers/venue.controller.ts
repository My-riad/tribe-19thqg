import { Request, Response, NextFunction } from 'express'; // version: ^4.18.2
import { VenueService } from '../services/venue.service';
import { 
  validateBody, 
  validateQuery, 
  validateParams 
} from '../../../shared/src/middlewares/validation.middleware';
import { 
  venueSearchParamsSchema, 
  venueRecommendationParamsSchema,
  transportationRequestSchema,
  optimalLocationRequestSchema
} from '../validations/venue.validation';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';
import { 
  IVenueSearchParams, 
  IVenueRecommendationParams 
} from '../models/venue.model';
import { ICoordinates } from '../../../shared/src/types/profile.types';

/**
 * Controller class for handling venue-related HTTP requests
 */
export class VenueController {
  private venueService: VenueService;

  /**
   * Initializes a new instance of the VenueController class
   */
  constructor() {
    this.venueService = new VenueService();
  }

  /**
   * Retrieves a venue by its ID
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   * @returns Sends venue data as JSON response or passes error to next middleware
   */
  getVenueById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract venueId from request parameters
      const { id: venueId } = req.params;

      // Call venueService.getVenueById with the venueId
      const venue = await this.venueService.getVenueById(venueId);

      // If venue not found, throw ApiError.notFound
      if (!venue) {
        throw ApiError.notFound(`Venue with ID ${venueId} not found`);
      }

      // Return venue data as JSON response
      res.json(venue);
    } catch (error) {
      // Catch and pass any errors to next middleware
      next(error);
    }
  };

  /**
   * Searches for venues based on search parameters
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   * @returns Sends search results as JSON response or passes error to next middleware
   */
  searchVenues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract search parameters from request query
      const searchParams = req.query as IVenueSearchParams;

      // Call venueService.searchVenues with the search parameters
      const searchResults = await this.venueService.searchVenues(searchParams);

      // Return search results as JSON response
      res.json(searchResults);
    } catch (error) {
      // Catch and pass any errors to next middleware
      next(error);
    }
  };

  /**
   * Finds venues near a specific location
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   * @returns Sends nearby venues as JSON response or passes error to next middleware
   */
  findVenuesByLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract coordinates, radius, and options from request query
      const { latitude, longitude, radius, ...options } = req.query as any;
      const coordinates: ICoordinates = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
      const searchRadius = parseFloat(radius);

      // Call venueService.findVenuesByLocation with the parameters
      const nearbyVenues = await this.venueService.findVenuesByLocation(coordinates, searchRadius, options);

      // Return nearby venues as JSON response
      res.json(nearbyVenues);
    } catch (error) {
      // Catch and pass any errors to next middleware
      next(error);
    }
  };

  /**
   * Recommends venues based on group preferences and requirements
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   * @returns Sends venue recommendations as JSON response or passes error to next middleware
   */
  recommendVenues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract recommendation parameters from request body
      const recommendationParams = req.body as IVenueRecommendationParams;

      // Call venueService.recommendVenues with the parameters
      const recommendedVenues = await this.venueService.recommendVenues(recommendationParams);

      // Return recommended venues as JSON response
      res.json(recommendedVenues);
    } catch (error) {
      // Catch and pass any errors to next middleware
      next(error);
    }
  };

  /**
   * Recommends venues specifically for an event based on attendee profiles
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   * @returns Sends venue recommendations for the event as JSON response or passes error to next middleware
   */
  recommendVenuesForEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract eventId and options from request parameters and query
      const { eventId } = req.params;
      const options = req.query;

      // Call venueService.recommendVenuesForEvent with the eventId and options
      const recommendedVenues = await this.venueService.recommendVenuesForEvent(eventId, options);

      // Return recommended venues as JSON response
      res.json(recommendedVenues);
    } catch (error) {
      // Catch and pass any errors to next middleware
      next(error);
    }
  };

  /**
   * Gets detailed information about a venue
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   * @returns Sends detailed venue information as JSON response or passes error to next middleware
   */
  getVenueDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract venueId from request parameters
      const { id: venueId } = req.params;

      // Call venueService.getVenueDetails with the venueId
      const venueDetails = await this.venueService.getVenueDetails(venueId);

      // If venue details not found, throw ApiError.notFound
      if (!venueDetails) {
        throw ApiError.notFound(`Venue details for ID ${venueId} not found`);
      }

      // Return venue details as JSON response
      res.json(venueDetails);
    } catch (error) {
      // Catch and pass any errors to next middleware
      next(error);
    }
  };

  /**
   * Gets transportation options to a venue from a location
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   * @returns Sends transportation options as JSON response or passes error to next middleware
   */
  getTransportationOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract venueId and fromLocation from request parameters and body
      const { id: venueId } = req.params;
      const { fromLocation } = req.body;

      // Call venueService.getTransportationOptions with the venueId and fromLocation
      const transportationOptions = await this.venueService.getTransportationOptions(venueId, fromLocation);

      // Return transportation options as JSON response
      res.json(transportationOptions);
    } catch (error) {
      // Catch and pass any errors to next middleware
      next(error);
    }
  };

  /**
   * Calculates travel times for all event attendees to a venue
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   * @returns Sends travel times as JSON response or passes error to next middleware
   */
  calculateTravelTimesForAttendees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract eventId and venueId from request parameters
      const { eventId, venueId } = req.params;

      // Call venueService.calculateTravelTimesForAttendees with the eventId and venueId
      const travelTimes = await this.venueService.calculateTravelTimesForAttendees(eventId, venueId);

      // Return travel times as JSON response
      res.json(travelTimes);
    } catch (error) {
      // Catch and pass any errors to next middleware
      next(error);
    }
  };

  /**
   * Finds the optimal venue location based on attendee locations
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   * @returns Sends optimal location as JSON response or passes error to next middleware
   */
  findOptimalVenueLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract request parameters (eventId or tribeId)
      const { eventId } = req.params;

      // Call venueService.findOptimalVenueLocation with the parameters
      const optimalLocation = await this.venueService.findOptimalVenueLocation(eventId);

      // Return optimal location as JSON response
      res.json(optimalLocation);
    } catch (error) {
      // Catch and pass any errors to next middleware
      next(error);
    }
  };

  /**
   * Estimates the budget required for a venue based on group size and preferences
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   * @returns Sends budget estimation as JSON response or passes error to next middleware
   */
  estimateVenueBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract groupSize and preferences from request body
      const { groupSize, preferences } = req.body;

      // Call venueService.estimateVenueBudget with the parameters
      const budgetEstimation = await this.venueService.estimateVenueBudget(groupSize, preferences);

      // Return budget estimation as JSON response
      res.json(budgetEstimation);
    } catch (error) {
      // Catch and pass any errors to next middleware
      next(error);
    }
  };

  /**
   * Gets accessibility requirements for a tribe or event
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   * @returns Sends accessibility requirements as JSON response or passes error to next middleware
   */
  getAccessibilityRequirements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract tribeId or eventId from request parameters
      const { tribeId, eventId } = req.params;

      // Call venueService.getAccessibilityRequirements with the parameters
      const accessibilityRequirements = await this.venueService.getAccessibilityRequirements(tribeId, eventId);

      // Return accessibility requirements as JSON response
      res.json(accessibilityRequirements);
    } catch (error) {
      // Catch and pass any errors to next middleware
      next(error);
    }
  };
}

// Create a new instance of the VenueController
const venueController = new VenueController();

/**
 * Function to set up venue-related routes with the Express router
 * @param router - Express router instance
 */
export const setupVenueRoutes = (router: any) => {
  // Route for getting a venue by ID
  router.get('/venues/:id', venueController.getVenueById);

  // Route for searching venues
  router.get('/venues', validateQuery(venueSearchParamsSchema), venueController.searchVenues);

  // Route for finding venues by location
  router.get('/venues/location', venueController.findVenuesByLocation);

  // Route for recommending venues
  router.post('/venues/recommend', validateBody(venueRecommendationParamsSchema), venueController.recommendVenues);

  // Route for recommending venues for an event
  router.get('/events/:eventId/venues/recommend', venueController.recommendVenuesForEvent);

  // Route for getting detailed information about a venue
  router.get('/venues/:id/details', venueController.getVenueDetails);

  // Route for getting transportation options to a venue
  router.post('/venues/:id/transportation', validateBody(transportationRequestSchema), venueController.getTransportationOptions);

  // Route for calculating travel times for attendees to a venue
  router.get('/events/:eventId/venues/:venueId/travel-times', venueController.calculateTravelTimesForAttendees);

  // Route for finding the optimal venue location
  router.get('/venues/optimal-location', validateQuery(optimalLocationRequestSchema), venueController.findOptimalVenueLocation);

  // Route for estimating the budget required for a venue
  router.post('/venues/budget', venueController.estimateVenueBudget);

  // Route for getting accessibility requirements for a tribe or event
  router.get('/venues/:tribeId/accessibility', venueController.getAccessibilityRequirements);
};

// Export the VenueController class
export { VenueController };