import { Request, Response, NextFunction, Router } from 'express'; // ^4.18.2
import engagementService from '../services/engagement.service';
import {
  validateCreateEngagement,
  validateUpdateEngagement,
  validateGetEngagement,
  validateListEngagements,
  validateRespondToEngagement,
  validateGenerateEngagement,
  validateGetEngagementMetrics
} from '../validations/engagement.validation';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Handles requests to create a new engagement
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns Promise<void> - Sends HTTP response with created engagement
 */
const createEngagementHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // LD1: Log the incoming request to create an engagement
  logger.info('Received request to create a new engagement', { body: req.body });

  try {
    // LD1: Extract engagement data from request body
    const engagementData = req.body;

    // LD1: Call engagementService.createEngagement with the data
    const engagement = await engagementService.createEngagement(engagementData);

    // LD1: Return HTTP 201 with the created engagement
    res.status(201).json(engagement);
  } catch (error) {
    // LD1: Catch and forward any errors to the error middleware
    logger.error('Error creating engagement', { error: error.message });
    next(error);
  }
};

/**
 * Handles requests to retrieve an engagement by ID
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns Promise<void> - Sends HTTP response with engagement details
 */
const getEngagementHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // LD1: Log the incoming request to get an engagement
  logger.info('Received request to get an engagement', { params: req.params, query: req.query });

  try {
    // LD1: Extract engagement ID from request parameters
    const { id: engagementId } = req.params;

    // LD1: Extract optional userId from query parameters
    const { userId } = req.query;

    // LD1: Call engagementService.getEngagement with the ID and userId
    const engagement = await engagementService.getEngagement(engagementId, userId as string);

    // LD1: Return HTTP 200 with the engagement data
    res.status(200).json(engagement);
  } catch (error) {
    // LD1: Catch and forward any errors to the error middleware
    logger.error('Error getting engagement', { error: error.message });
    next(error);
  }
};

/**
 * Handles requests to update an existing engagement
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns Promise<void> - Sends HTTP response with updated engagement
 */
const updateEngagementHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // LD1: Log the incoming request to update an engagement
  logger.info('Received request to update an engagement', { params: req.params, body: req.body });

  try {
    // LD1: Extract engagement ID from request parameters
    const { id: engagementId } = req.params;

    // LD1: Extract update data from request body
    const updateData = req.body;

    // LD1: Call engagementService.updateEngagement with the ID and update data
    const engagement = await engagementService.updateEngagement(engagementId, updateData);

    // LD1: Return HTTP 200 with the updated engagement
    res.status(200).json(engagement);
  } catch (error) {
    // LD1: Catch and forward any errors to the error middleware
    logger.error('Error updating engagement', { error: error.message });
    next(error);
  }
};

/**
 * Handles requests to delete an engagement
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns Promise<void> - Sends HTTP response confirming deletion
 */
const deleteEngagementHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // LD1: Log the incoming request to delete an engagement
  logger.info('Received request to delete an engagement', { params: req.params });

  try {
    // LD1: Extract engagement ID from request parameters
    const { id: engagementId } = req.params;

    // LD1: Call engagementService.deleteEngagement with the ID
    await engagementService.deleteEngagement(engagementId);

    // LD1: Return HTTP 204 with no content
    res.status(204).send();
  } catch (error) {
    // LD1: Catch and forward any errors to the error middleware
    logger.error('Error deleting engagement', { error: error.message });
    next(error);
  }
};

/**
 * Handles requests to list engagements with filtering and pagination
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns Promise<void> - Sends HTTP response with list of engagements
 */
const listEngagementsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // LD1: Log the incoming request to list engagements
  logger.info('Received request to list engagements', { query: req.query });

  try {
    // LD1: Extract filter parameters from request query
    const filters = req.query;

    // LD1: Extract pagination parameters (page, limit) from request query
    const { page, limit } = req.query;

    // LD1: Extract optional userId from query parameters
    const { userId } = req.query;

    // LD1: Call engagementService.listEngagements with filters, pagination, and userId
    const result = await engagementService.listEngagements(filters, { page, limit }, userId as string);

    // LD1: Return HTTP 200 with engagements array and pagination metadata
    res.status(200).json(result);
  } catch (error) {
    // LD1: Catch and forward any errors to the error middleware
    logger.error('Error listing engagements', { error: error.message });
    next(error);
  }
};

/**
 * Handles requests to add a user response to an engagement
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns Promise<void> - Sends HTTP response with updated engagement
 */
const respondToEngagementHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // LD1: Log the incoming request to respond to an engagement
  logger.info('Received request to respond to an engagement', { params: req.params, body: req.body });

  try {
    // LD1: Extract engagement ID from request parameters
    const { id: engagementId } = req.params;

    // LD1: Extract response data from request body
    const responseData = req.body;

    // LD1: Call engagementService.addEngagementResponse with the ID and response data
    const engagement = await engagementService.addEngagementResponse(engagementId, responseData);

    // LD1: Return HTTP 200 with the updated engagement
    res.status(200).json(engagement);
  } catch (error) {
    // LD1: Catch and forward any errors to the error middleware
    logger.error('Error responding to engagement', { error: error.message });
    next(error);
  }
};

/**
 * Handles requests to mark an engagement as delivered
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns Promise<void> - Sends HTTP response with updated engagement
 */
const deliverEngagementHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // LD1: Log the incoming request to deliver an engagement
  logger.info('Received request to deliver an engagement', { params: req.params });

  try {
    // LD1: Extract engagement ID from request parameters
    const { id: engagementId } = req.params;

    // LD1: Call engagementService.deliverEngagement with the ID
    const engagement = await engagementService.deliverEngagement(engagementId);

    // LD1: Return HTTP 200 with the updated engagement
    res.status(200).json(engagement);
  } catch (error) {
    // LD1: Catch and forward any errors to the error middleware
    logger.error('Error delivering engagement', { error: error.message });
    next(error);
  }
};

/**
 * Handles requests to mark an engagement as completed
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns Promise<void> - Sends HTTP response with updated engagement
 */
const completeEngagementHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // LD1: Log the incoming request to complete an engagement
  logger.info('Received request to complete an engagement', { params: req.params });

  try {
    // LD1: Extract engagement ID from request parameters
    const { id: engagementId } = req.params;

    // LD1: Call engagementService.completeEngagement with the ID
    const engagement = await engagementService.completeEngagement(engagementId);

    // LD1: Return HTTP 200 with the updated engagement
    res.status(200).json(engagement);
  } catch (error) {
    // LD1: Catch and forward any errors to the error middleware
    logger.error('Error completing engagement', { error: error.message });
    next(error);
  }
};

/**
 * Handles requests to generate a new AI-powered engagement
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns Promise<void> - Sends HTTP response with generated engagement
 */
const generateEngagementHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // LD1: Log the incoming request to generate an engagement
  logger.info('Received request to generate an engagement', { body: req.body });

  try {
    // LD1: Extract tribeId, type, and trigger from request body
    const { tribeId, type, trigger } = req.body;

    // LD1: Call engagementService.generateEngagement with the parameters
    const engagement = await engagementService.generateEngagement(tribeId, type, trigger);

    // LD1: Return HTTP 201 with the generated engagement
    res.status(201).json(engagement);
  } catch (error) {
    // LD1: Catch and forward any errors to the error middleware
    logger.error('Error generating engagement', { error: error.message });
    next(error);
  }
};

/**
 * Handles requests to get engagement metrics for a tribe
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns Promise<void> - Sends HTTP response with engagement metrics
 */
const getEngagementMetricsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // LD1: Log the incoming request to get engagement metrics
  logger.info('Received request to get engagement metrics', { params: req.params, query: req.query });

  try {
    // LD1: Extract tribeId from request parameters
    const { id: tribeId } = req.params;

    // LD1: Extract time range parameters (startDate, endDate) from request query
    const { startDate, endDate } = req.query;

    // LD1: Call engagementService.getEngagementMetrics with tribeId and time range
    const metrics = await engagementService.getEngagementMetrics(tribeId, { startDate, endDate });

    // LD1: Return HTTP 200 with the engagement metrics
    res.status(200).json(metrics);
  } catch (error) {
    // LD1: Catch and forward any errors to the error middleware
    logger.error('Error getting engagement metrics', { error: error.message });
    next(error);
  }
};

// LD1: Create a new Express Router instance
const router = Router();

// LD1: Define routes for engagement-related operations
router.post('/', validateCreateEngagement, createEngagementHandler);
router.get('/:id', validateGetEngagement, getEngagementHandler);
router.put('/:id', validateUpdateEngagement, updateEngagementHandler);
router.delete('/:id', deleteEngagementHandler);
router.get('/', validateListEngagements, listEngagementsHandler);
router.post('/:id/respond', validateRespondToEngagement, respondToEngagementHandler);
router.post('/:id/deliver', deliverEngagementHandler);
router.post('/:id/complete', completeEngagementHandler);
router.post('/generate', validateGenerateEngagement, generateEngagementHandler);
router.get('/:id/metrics', validateGetEngagementMetrics, getEngagementMetricsHandler);

// LD1: Export the configured router
export default router;