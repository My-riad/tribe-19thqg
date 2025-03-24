import { Request, Response, NextFunction } from 'express'; //  ^4.18.2
import {
  PlanningService,
} from '../services/planning.service';
import {
  AvailabilityService,
} from '../services/availability.service';
import {
  SchedulingService,
} from '../services/scheduling.service';
import {
  validatePlanningSessionCreate,
  validatePlanningSessionUpdate,
  validateEventPlanFinalize,
  validateVoteRequest,
  validateAutoSuggestRequest,
  validateOptimalTimeSlotsQuery,
} from '../validations/planning.validation';
import {
  validateAvailabilityCreate,
} from '../validations/availability.validation';
import {
  IPlanningSession,
  IPlanningSessionCreate,
  IPlanningSessionUpdate,
  IOptimalTimeSlot,
  IVenueSuggestion,
  IEventPlan,
  IEventPlanFinalize,
  PlanningStatus,
  VoteType,
} from '../models/planning.model';
import {
  IAvailabilityCreate,
} from '../models/availability.model';
import {
  ApiError,
} from '../../../shared/src/errors/api.error';
import {
  logger,
} from '../../../shared/src/utils/logger.util';

/**
 * Controller class for handling planning-related HTTP requests
 */
export class PlanningController {
  private planningService: PlanningService;
  private availabilityService: AvailabilityService;
  private schedulingService: SchedulingService;

  /**
   * Initializes a new instance of the PlanningController class
   */
  constructor() {
    // Initialize PlanningService instance
    this.planningService = new PlanningService();
    // Initialize AvailabilityService instance
    this.availabilityService = new AvailabilityService();
    // Initialize SchedulingService instance
    this.schedulingService = new SchedulingService();
  }

  /**
   * Creates a new planning session for an event
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  createPlanningSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session data from request body
      const sessionData: IPlanningSessionCreate = req.body;

      // Validate planning session data using validatePlanningSessionCreate
      validatePlanningSessionCreate(sessionData);

      // Call planningService.createPlanningSession with validated data
      const planningSession: IPlanningSession = await this.planningService.createPlanningSession(sessionData);

      // Log successful creation of planning session
      logger.info('Created planning session', { planningSessionId: planningSession.id });

      // Return HTTP 201 with the created planning session
      res.status(201).json(planningSession);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Retrieves a planning session by its ID
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  getPlanningSessionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Call planningService.getPlanningSessionById with the ID
      const planningSession: IPlanningSession = await this.planningService.getPlanningSessionById(id);

      // Return HTTP 200 with the planning session
      res.status(200).json(planningSession);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Retrieves a planning session by its associated event ID
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  getPlanningSessionByEventId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract event ID from request parameters
      const { eventId } = req.params;

      // Call planningService.getPlanningSessionByEventId with the event ID
      const planningSession: IPlanningSession = await this.planningService.getPlanningSessionByEventId(eventId);

      // Return HTTP 200 with the planning session
      res.status(200).json(planningSession);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Updates an existing planning session
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  updatePlanningSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Extract update data from request body
      const updateData: IPlanningSessionUpdate = req.body;

      // Validate update data using validatePlanningSessionUpdate
      validatePlanningSessionUpdate(updateData);

      // Call planningService.updatePlanningSession with ID and validated data
      const planningSession: IPlanningSession = await this.planningService.updatePlanningSession(id, updateData);

      // Log successful update of planning session
      logger.info('Updated planning session', { planningSessionId: planningSession.id });

      // Return HTTP 200 with the updated planning session
      res.status(200).json(planningSession);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Starts the availability collection phase for a planning session
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  startAvailabilityCollection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Extract options from request body
      const options = req.body;

      // Call planningService.startAvailabilityCollection with ID and options
      const planningSession: IPlanningSession = await this.planningService.startAvailabilityCollection(id, options);

      // Log successful start of availability collection
      logger.info('Started availability collection', { planningSessionId: planningSession.id });

      // Return HTTP 200 with the updated planning session
      res.status(200).json(planningSession);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Submits availability data for a user in a planning session
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  submitAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Extract user ID from request parameters or authenticated user
      const userId = req.params.userId || req.user?.id;

      // Extract availability data from request body
      const availabilityData: IAvailabilityCreate = req.body;

      // Validate availability data using validateAvailabilityCreate
      validateAvailabilityCreate(availabilityData);

      // Call planningService.submitAvailability with planning session ID, user ID, and validated data
      const availabilityRecord = await this.planningService.submitAvailability(id, userId, availabilityData);

      // Log successful submission of availability data
      logger.info('Submitted availability data', { planningSessionId: id, userId });

      // Return HTTP 200 with the created availability record
      res.status(200).json(availabilityRecord);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Generates time slot suggestions based on collected availability data
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  generateTimeSlotSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Extract options from request query parameters
      const options = req.query;

      // Validate options using validateOptimalTimeSlotsQuery
      validateOptimalTimeSlotsQuery(options);

      // Call planningService.generateTimeSlotSuggestions with ID and validated options
      const timeSlots: IOptimalTimeSlot[] = await this.planningService.generateTimeSlotSuggestions(id, options);

      // Log successful generation of time slot suggestions
      logger.info('Generated time slot suggestions', { planningSessionId: id, timeSlotCount: timeSlots.length });

      // Return HTTP 200 with the generated time slots
      res.status(200).json(timeSlots);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Generates venue suggestions based on event requirements and preferences
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  generateVenueSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Extract options from request body
      const options = req.body;

      // Call planningService.generateVenueSuggestions with ID and options
      const venueSuggestions: IVenueSuggestion[] = await this.planningService.generateVenueSuggestions(id, options);

      // Log successful generation of venue suggestions
      logger.info('Generated venue suggestions', { planningSessionId: id, venueCount: venueSuggestions.length });

      // Return HTTP 200 with the generated venue suggestions
      res.status(200).json(venueSuggestions);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Starts the voting phase for time slots and venues
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  startVotingPhase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Extract options from request body
      const options = req.body;

      // Call planningService.startVotingPhase with ID and options
      const planningSession: IPlanningSession = await this.planningService.startVotingPhase(id, options);

      // Log successful start of voting phase
      logger.info('Started voting phase', { planningSessionId: planningSession.id });

      // Return HTTP 200 with the updated planning session
      res.status(200).json(planningSession);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Records a user's vote for a time slot or venue
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  recordVote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Extract item ID from request parameters
      const { itemId } = req.params;

      // Extract user ID from request parameters or authenticated user
      const userId = req.params.userId || req.user?.id;

      // Extract vote type from request body
      const voteType: VoteType = req.body.voteType;

      // Validate vote data using validateVoteRequest
      validateVoteRequest({ planningSessionId: id, itemId, userId, voteType });

      // Call planningService.recordVote with planning session ID, item ID, user ID, and vote type
      const planningSession: IPlanningSession = await this.planningService.recordVote(id, itemId, userId, voteType);

      // Log successful recording of vote
      logger.info('Recorded vote', { planningSessionId: planningSession.id, itemId, userId, voteType });

      // Return HTTP 200 with the updated planning session
      res.status(200).json(planningSession);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Gets the current voting results for time slots and venues
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  getVotingResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Call planningService.getVotingResults with the planning session ID
      const votingResults = await this.planningService.getVotingResults(id);

      // Return HTTP 200 with the voting results
      res.status(200).json(votingResults);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Finalizes the event plan with selected time and venue
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  finalizeEventPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Extract finalize data from request body
      const finalizeData: IEventPlanFinalize = req.body;

      // Validate finalize data using validateEventPlanFinalize
      validateEventPlanFinalize(finalizeData);

      // Call planningService.finalizeEventPlan with planning session ID and validated data
      const eventPlan: IEventPlan = await this.planningService.finalizeEventPlan(id, finalizeData);

      // Log successful finalization of event plan
      logger.info('Finalized event plan', { planningSessionId: id, eventPlanId: eventPlan.id });

      // Return HTTP 200 with the finalized event plan
      res.status(200).json(eventPlan);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Retrieves the event plan for a specific event
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  getEventPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract event ID from request parameters
      const { eventId } = req.params;

      // Call planningService.getEventPlan with the event ID
      const eventPlan: IEventPlan = await this.planningService.getEventPlan(eventId);

      // Return HTTP 200 with the event plan
      res.status(200).json(eventPlan);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Gets an AI-generated recommendation for the optimal plan
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  getAIRecommendation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Extract options from request body
      const options = req.body;

      // Validate options using validateAutoSuggestRequest
      validateAutoSuggestRequest(options);

      // Call planningService.getAIRecommendation with planning session ID and options
      const aiRecommendation = await this.planningService.getAIRecommendation(id);

      // Return HTTP 200 with the AI recommendation
      res.status(200).json(aiRecommendation);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Gets the current status of a planning session with detailed progress information
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  getPlanningStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Call planningService.getPlanningStatus with the planning session ID
      const planningStatus = await this.planningService.getPlanningStatus(id);

      // Return HTTP 200 with the planning status information
      res.status(200).json(planningStatus);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Cancels an active planning session
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  cancelPlanningSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Extract reason from request body
      const { reason } = req.body;

      // Call planningService.cancelPlanningSession with planning session ID and reason
      const cancelledSession: IPlanningSession = await this.planningService.cancelPlanningSession(id, reason);

      // Log successful cancellation of planning session
      logger.info('Cancelled planning session', { planningSessionId: cancelledSession.id, reason });

      // Return HTTP 200 with the cancelled planning session
      res.status(200).json(cancelledSession);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

    /**
   * Analyzes availability patterns to identify trends and optimal scheduling windows
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  analyzeAvailabilityPatterns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract event ID from request parameters or query
      const { eventId } = req.params;
      const { tribeId } = req.query;

      // Call availabilityService.analyzeAvailabilityPatterns with event ID and tribe ID
      const availabilityAnalysis = await this.planningService.analyzeAvailabilityPatterns(eventId, String(tribeId));

      // Return HTTP 200 with the availability analysis
      res.status(200).json(availabilityAnalysis);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };

  /**
   * Resolves scheduling conflicts by suggesting alternative times
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  resolveSchedulingConflicts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract planning session ID from request parameters
      const { id } = req.params;

      // Extract existing events from request body
      const existingEvents = req.body.existingEvents;

      // Extract event ID from request parameters or body
      const { eventId } = req.params || req.body;

      // Call schedulingService.resolveSchedulingConflicts with proposed time slots, existing events, and event ID
      const conflictResolution = await this.schedulingService.resolveSchedulingConflicts(id, existingEvents, eventId);

      // Return HTTP 200 with the conflict resolution and alternative suggestions
      res.status(200).json(conflictResolution);
    } catch (error) {
      // Catch any errors and pass them to the next middleware
      next(error);
    }
  };
}