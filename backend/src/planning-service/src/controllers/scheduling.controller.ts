import { Request, Response, NextFunction } from 'express'; //  ^4.18.2
import { SchedulingService } from '../services/scheduling.service';
import { validateOptimalTimeQuery } from '../validations/availability.validation';
import { validateOptimalTimeSlotsQuery } from '../validations/planning.validation';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Controller class for handling scheduling-related HTTP requests
 */
export class SchedulingController {
  private schedulingService: SchedulingService;

  /**
   * Initializes a new instance of the SchedulingController class
   */
  constructor() {
    this.schedulingService = new SchedulingService();
  }

  /**
   * Finds optimal meeting times based on user availability data
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   * @returns Promise<void> - No explicit return, sends HTTP response
   */
  async findOptimalMeetingTimes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract query parameters from req.query
      const queryParams = req.query;

      // Validate query parameters using validateOptimalTimeQuery
      const validatedParams = validateOptimalTimeQuery(queryParams);

      // Call schedulingService.findOptimalMeetingTimes with validated parameters
      const optimalMeetingTimes = await this.schedulingService.findOptimalMeetingTimes(
        validatedParams.eventId,
        validatedParams.tribeId,
        validatedParams
      );

      // Return HTTP 200 with the optimal meeting times
      res.status(200).json(optimalMeetingTimes);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      logger.error('Error finding optimal meeting times', error);
      next(error);
    }
  }

  /**
   * Finds optimal time slots for a specific planning session
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   * @returns Promise<void> - No explicit return, sends HTTP response
   */
  async findOptimalTimeSlotsForPlanningSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract query parameters from req.query
      const queryParams = req.query;

      // Validate query parameters using validateOptimalTimeSlotsQuery
      const validatedParams = validateOptimalTimeSlotsQuery(queryParams);

      // Extract planningSessionId from validated query parameters
      const { planningSessionId } = validatedParams;

      // Call schedulingService.findOptimalMeetingTimes with the planning session ID and options
      const optimalTimeSlots = await this.schedulingService.findOptimalMeetingTimes(planningSessionId, undefined, validatedParams);

      // Update the planning session with the optimal time slots
      await this.schedulingService.updatePlanningSessionWithTimeSlots(planningSessionId, optimalTimeSlots);

      // Return HTTP 200 with the optimal time slots and updated planning session
      res.status(200).json({ optimalTimeSlots, message: 'Planning session updated with optimal time slots' });
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      logger.error('Error finding optimal time slots for planning session', error);
      next(error);
    }
  }

  /**
   * Analyzes availability patterns to identify trends and optimal scheduling windows
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   * @returns Promise<void> - No explicit return, sends HTTP response
   */
  async analyzeAvailabilityPatterns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract eventId and tribeId from req.query
      const { eventId, tribeId } = req.query;

      // Validate that at least one of eventId or tribeId is provided
      if (!eventId && !tribeId) {
        throw ApiError.badRequest('Either eventId or tribeId must be provided');
      }

      // Call schedulingService.analyzeAvailabilityPatterns with eventId and tribeId
      const availabilityAnalysis = await this.schedulingService.analyzeAvailabilityPatterns(
        typeof eventId === 'string' ? eventId : undefined,
        typeof tribeId === 'string' ? tribeId : undefined
      );

      // Return HTTP 200 with the availability analysis
      res.status(200).json(availabilityAnalysis);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      logger.error('Error analyzing availability patterns', error);
      next(error);
    }
  }

  /**
   * Finds common availability windows across multiple users
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   * @returns Promise<void> - No explicit return, sends HTTP response
   */
  async findCommonAvailabilityWindows(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract eventId, tribeId, and options from req.query
      const { eventId, tribeId } = req.query;
      const options = req.query;

      // Validate that at least one of eventId or tribeId is provided
      if (!eventId && !tribeId) {
        throw ApiError.badRequest('Either eventId or tribeId must be provided');
      }

      // Call schedulingService.findCommonAvailabilityWindows with eventId, tribeId, and options
      const commonAvailabilityWindows = await this.schedulingService.findCommonAvailabilityWindows(
        typeof eventId === 'string' ? eventId : undefined,
        typeof tribeId === 'string' ? tribeId : undefined,
        options
      );

      // Return HTTP 200 with the common availability windows
      res.status(200).json(commonAvailabilityWindows);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      logger.error('Error finding common availability windows', error);
      next(error);
    }
  }

  /**
   * Resolves scheduling conflicts by suggesting alternative times
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   * @returns Promise<void> - No explicit return, sends HTTP response
   */
  async resolveSchedulingConflicts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract eventId and proposedTimeSlots from req.body
      const { eventId, proposedTimeSlots } = req.body;

      // Validate that eventId and proposedTimeSlots are provided
      if (!eventId || !proposedTimeSlots) {
        throw ApiError.badRequest('EventId and proposedTimeSlots are required');
      }

      // Extract existingEvents from req.body if provided
      const { existingEvents } = req.body;

      // Call schedulingService.resolveSchedulingConflicts with proposedTimeSlots, existingEvents, and eventId
      const conflictResolutionResults = await this.schedulingService.resolveSchedulingConflicts(
        proposedTimeSlots,
        existingEvents,
        eventId
      );

      // Return HTTP 200 with the conflict resolution results
      res.status(200).json(conflictResolutionResults);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      logger.error('Error resolving scheduling conflicts', error);
      next(error);
    }
  }

  /**
   * Optimizes time slot selection to maximize attendance
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   * @returns Promise<void> - No explicit return, sends HTTP response
   */
  async optimizeForAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract eventId, tribeId, and options from req.query
      const { eventId, tribeId } = req.query;
      const options = req.query;

      // Validate that at least one of eventId or tribeId is provided
      if (!eventId && !tribeId) {
        throw ApiError.badRequest('Either eventId or tribeId must be provided');
      }

      // Call schedulingService.optimizeForAttendance with eventId, tribeId, and options
      const optimizedTimeSlots = await this.schedulingService.optimizeForAttendance(
        typeof eventId === 'string' ? eventId : undefined,
        typeof tribeId === 'string' ? tribeId : undefined,
        options
      );

      // Return HTTP 200 with the optimized time slots
      res.status(200).json(optimizedTimeSlots);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      logger.error('Error optimizing for attendance', error);
      next(error);
    }
  }

  /**
   * Optimizes time slot selection for user convenience based on preferences
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   * @returns Promise<void> - No explicit return, sends HTTP response
   */
  async optimizeForConvenience(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract eventId, tribeId, and userPreferences from req.body
      const { eventId, tribeId, userPreferences } = req.body;

      // Validate that at least one of eventId or tribeId is provided
      if (!eventId && !tribeId) {
        throw ApiError.badRequest('Either eventId or tribeId must be provided');
      }

      // Call schedulingService.optimizeForConvenience with eventId, tribeId, and userPreferences
      const optimizedTimeSlots = await this.schedulingService.optimizeForConvenience(
        typeof eventId === 'string' ? eventId : undefined,
        typeof tribeId === 'string' ? tribeId : undefined,
        userPreferences
      );

      // Return HTTP 200 with the optimized time slots
      res.status(200).json(optimizedTimeSlots);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      logger.error('Error optimizing for convenience', error);
      next(error);
    }
  }

  /**
   * Generates scheduling options based on event context and user preferences
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   * @returns Promise<void> - No explicit return, sends HTTP response
   */
  async generateSchedulingOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract eventId, tribeId, and baseOptions from req.body
      const { eventId, tribeId, baseOptions } = req.body;

      // Validate that at least one of eventId or tribeId is provided
      if (!eventId && !tribeId) {
        throw ApiError.badRequest('Either eventId or tribeId must be provided');
      }

      // Call schedulingService.generateSchedulingOptions with eventId, tribeId, and baseOptions
      const schedulingOptions = await this.schedulingService.generateSchedulingOptions(
        typeof eventId === 'string' ? eventId : undefined,
        typeof tribeId === 'string' ? tribeId : undefined,
        baseOptions
      );

      // Return HTTP 200 with the generated scheduling options
      res.status(200).json(schedulingOptions);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      logger.error('Error generating scheduling options', error);
      next(error);
    }
  }

  /**
   * Gets the current scheduling algorithm options
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   * @returns Promise<void> - No explicit return, sends HTTP response
   */
  async getSchedulingAlgorithmOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Call schedulingService.getSchedulingAlgorithmOptions
      const schedulingAlgorithmOptions = this.schedulingService.getSchedulingAlgorithmOptions();

      // Return HTTP 200 with the current scheduling algorithm options
      res.status(200).json(schedulingAlgorithmOptions);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      logger.error('Error getting scheduling algorithm options', error);
      next(error);
    }
  }

  /**
   * Updates the scheduling algorithm options
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   * @returns Promise<void> - No explicit return, sends HTTP response
   */
  async setSchedulingAlgorithmOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract options from req.body
      const { options } = req.body;

      // Validate that options is an object
      if (!options || typeof options !== 'object') {
        throw ApiError.badRequest('Options must be a valid object');
      }

      // Call schedulingService.setSchedulingAlgorithmOptions with options
      this.schedulingService.setSchedulingAlgorithmOptions(options);

      // Return HTTP 200 with success message
      res.status(200).json({ message: 'Scheduling algorithm options updated successfully' });
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      logger.error('Error setting scheduling algorithm options', error);
      next(error);
    }
  }
}