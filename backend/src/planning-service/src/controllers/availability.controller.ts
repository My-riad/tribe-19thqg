import { Router, Request, Response, NextFunction } from 'express'; // version: ^4.18.2
import AvailabilityService from '../services/availability.service';
import {
  validateBody,
  validateQuery,
  validateParams
} from '../../../shared/src/middlewares/validation.middleware';
import {
  availabilityCreateSchema,
  availabilityUpdateSchema,
  availabilityQuerySchema,
  bulkAvailabilitySchema,
  optimalTimeQuerySchema
} from '../validations/availability.validation';
import {
  IAvailability,
  IAvailabilityCreate,
  ITimeSlot
} from '../models/availability.model';
import { IOptimalTimeSlot } from '../models/planning.model';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';

// Create an Express router
const router = Router();

// Initialize AvailabilityService
const availabilityService = new AvailabilityService();

/**
 * Creates a new availability record for a user
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - Sends HTTP response with created availability data
 */
router.post(
  '/',
  validateBody(availabilityCreateSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract validated availability data from request body
      const availabilityData: IAvailabilityCreate = req.body as IAvailabilityCreate;

      // Call availabilityService.createAvailability with the data
      const availability = await availabilityService.createAvailability(availabilityData);

      // Log successful creation of availability record
      logger.info('Availability record created successfully', {
        availabilityId: availability.id,
        userId: availability.userId,
      });

      // Return HTTP 201 response with the created availability record
      res.status(201).json(availability);
    } catch (error) {
      // Log the error
      logger.error('Error creating availability record', { error });
      // Forward any errors to the error handling middleware
      next(error);
    }
  }
);

/**
 * Retrieves an availability record by its ID
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - Sends HTTP response with availability data
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract availability ID from request parameters
      const id: string = req.params.id;

      // Call availabilityService.getAvailabilityById with the ID
      const availability = await availabilityService.getAvailabilityById(id);

      // If availability record is not found, throw ApiError.notFound
      if (!availability) {
        throw ApiError.notFound(`Availability with id '${id}' not found`);
      }

      // Return HTTP 200 response with the availability record
      res.status(200).json(availability);
    } catch (error) {
      // Log the error
      logger.error('Error getting availability record by ID', { error });
      // Forward any errors to the error handling middleware
      next(error);
    }
  }
);

/**
 * Retrieves availability records for a specific user
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - Sends HTTP response with user availability data
 */
router.get(
  '/user/:userId',
  validateQuery(availabilityQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract user ID from request parameters
      const userId: string = req.params.userId;

      // Extract query options from request query parameters
      const options = req.query;

      // Call availabilityService.getUserAvailability with userId and options
      const availabilities = await availabilityService.getUserAvailability(userId, options);

      // Return HTTP 200 response with the array of availability records
      res.status(200).json(availabilities);
    } catch (error) {
      // Log the error
      logger.error('Error getting user availability', { error });
      // Forward any errors to the error handling middleware
      next(error);
    }
  }
);

/**
 * Retrieves availability records for a specific event
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - Sends HTTP response with event availability data
 */
router.get(
  '/event/:eventId',
  validateQuery(availabilityQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract event ID from request parameters
      const eventId: string = req.params.eventId;

      // Extract query options from request query parameters
      const options = req.query;

      // Call availabilityService.getEventAvailability with eventId and options
      const availabilities = await availabilityService.getEventAvailability(eventId, options);

      // Return HTTP 200 response with the array of availability records
      res.status(200).json(availabilities);
    } catch (error) {
      // Log the error
      logger.error('Error getting event availability', { error });
      // Forward any errors to the error handling middleware
      next(error);
    }
  }
);

/**
 * Retrieves availability records for a specific tribe
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - Sends HTTP response with tribe availability data
 */
router.get(
  '/tribe/:tribeId',
  validateQuery(availabilityQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract tribe ID from request parameters
      const tribeId: string = req.params.tribeId;

      // Extract query options from request query parameters
      const options = req.query;

      // Call availabilityService.getTribeAvailability with tribeId and options
      const availabilities = await availabilityService.getTribeAvailability(tribeId, options);

      // Return HTTP 200 response with the array of availability records
      res.status(200).json(availabilities);
    } catch (error) {
      // Log the error
      logger.error('Error getting tribe availability', { error });
      // Forward any errors to the error handling middleware
      next(error);
    }
  }
);

/**
 * Updates an existing availability record
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - Sends HTTP response with updated availability data
 */
router.put(
  '/:id',
  validateBody(availabilityUpdateSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract availability ID from request parameters
      const id: string = req.params.id;

      // Extract validated update data from request body
      const updateData: IAvailabilityCreate = req.body as IAvailabilityCreate;

      // Call availabilityService.updateAvailability with id and update data
      const availability = await availabilityService.updateAvailability(id, updateData);

      // Log successful update of availability record
      logger.info('Availability record updated successfully', {
        availabilityId: availability.id,
      });

      // Return HTTP 200 response with the updated availability record
      res.status(200).json(availability);
    } catch (error) {
      // Log the error
      logger.error('Error updating availability record', { error });
      // Forward any errors to the error handling middleware
      next(error);
    }
  }
);

/**
 * Deletes an availability record
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - Sends HTTP response confirming deletion
 */
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract availability ID from request parameters
      const id: string = req.params.id;

      // Call availabilityService.deleteAvailability with the ID
      const deleted = await availabilityService.deleteAvailability(id);

      // Log successful deletion of availability record
      logger.info('Availability record deleted successfully', {
        availabilityId: id,
      });

      // Return HTTP 204 No Content response
      res.status(204).send();
    } catch (error) {
      // Log the error
      logger.error('Error deleting availability record', { error });
      // Forward any errors to the error handling middleware
      next(error);
    }
  }
);

/**
 * Creates multiple availability records in bulk
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - Sends HTTP response with created availability data
 */
router.post(
  '/bulk',
  validateBody(bulkAvailabilitySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract validated bulk data from request body
      const bulkData = req.body;

      // Call availabilityService.bulkCreateAvailability with the data
      const availabilities = await availabilityService.bulkCreateAvailability(bulkData);

      // Log successful bulk creation of availability records
      logger.info('Bulk availability records created successfully', {
        count: availabilities.length,
      });

      // Return HTTP 201 response with the created availability records
      res.status(201).json(availabilities);
    } catch (error) {
      // Log the error
      logger.error('Error creating bulk availability records', { error });
      // Forward any errors to the error handling middleware
      next(error);
    }
  }
);

/**
 * Finds optimal meeting times based on user availability
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - Sends HTTP response with optimal meeting time suggestions
 */
router.get(
  '/optimal-times',
  validateQuery(optimalTimeQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract event ID and tribe ID from request query parameters
      const { eventId, tribeId } = req.query;

      // Extract validated query options from request query parameters
      const options = req.query;

      // Validate that at least one of eventId or tribeId is provided
      if (!eventId && !tribeId) {
        throw ApiError.badRequest('Either eventId or tribeId must be provided');
      }

      // Call availabilityService.findOptimalMeetingTimes with parameters
      const optimalTimeSlots: IOptimalTimeSlot[] = await availabilityService.findOptimalMeetingTimes(
        String(eventId),
        String(tribeId),
        options
      );

      // Return HTTP 200 response with the optimal meeting time slots
      res.status(200).json(optimalTimeSlots);
    } catch (error) {
      // Log the error
      logger.error('Error finding optimal meeting times', { error });
      // Forward any errors to the error handling middleware
      next(error);
    }
  }
);

/**
 * Finds common availability windows across multiple users
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - Sends HTTP response with common availability windows
 */
router.get(
  '/common-windows',
  validateQuery(availabilityQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract event ID and tribe ID from request query parameters
      const { eventId, tribeId } = req.query;

      // Extract validated query options from request query parameters
      const options = req.query;

      // Validate that at least one of eventId or tribeId is provided
      if (!eventId && !tribeId) {
        throw ApiError.badRequest('Either eventId or tribeId must be provided');
      }

      // Call availabilityService.findCommonAvailabilityWindows with parameters
      const commonWindows = await availabilityService.findCommonAvailabilityWindows(
        String(eventId),
        String(tribeId),
        options
      );

      // Return HTTP 200 response with the common availability windows
      res.status(200).json(commonWindows);
    } catch (error) {
      // Log the error
      logger.error('Error finding common availability windows', { error });
      // Forward any errors to the error handling middleware
      next(error);
    }
  }
);

/**
 * Analyzes availability patterns to identify trends and optimal scheduling windows
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - Sends HTTP response with availability analysis
 */
router.get(
  '/analyze',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract event ID and tribe ID from request query parameters
      const { eventId, tribeId } = req.query;

      // Validate that at least one of eventId or tribeId is provided
      if (!eventId && !tribeId) {
        throw ApiError.badRequest('Either eventId or tribeId must be provided');
      }

      // Call availabilityService.analyzeAvailabilityPatterns with parameters
      const analysis = await availabilityService.analyzeAvailabilityPatterns(
        String(eventId),
        String(tribeId)
      );

      // Return HTTP 200 response with the availability analysis
      res.status(200).json(analysis);
    } catch (error) {
      // Log the error
      logger.error('Error analyzing availability patterns', { error });
      // Forward any errors to the error handling middleware
      next(error);
    }
  }
);

// Export the router
export const router = router;