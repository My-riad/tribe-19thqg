import { Router, Request, Response, NextFunction } from 'express'; // Express framework for handling HTTP requests and responses ^4.18.2
import { tribeService, memberService } from '../services'; // Import the tribe service for handling tribe operations
import { createTribeSchema, updateTribeSchema, tribeSearchSchema, tribeInterestSchema, tribeStatusSchema } from '../validations/tribe.validation'; // Import validation schemas for tribe operations
import { validateBody, validateQuery, validateParams } from '@shared/middlewares/validation.middleware'; // Import validation middleware for request validation
import { ITribeCreate, ITribeUpdate, ITribeSearchParams, ITribeResponse, ITribeDetailResponse, TribeStatus, InterestCategory } from '@shared/types'; // Import tribe-related interfaces and enums for type consistency
import { logger } from '@shared/utils'; // Import logger utility for controller logging

const router = Router();

/**
 * Create a new tribe
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.post('/', validateBody(createTribeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract tribe creation data from request body
    const tribeData: ITribeCreate = req.body;

    // Set createdBy to the authenticated user ID from request
    tribeData.createdBy = req.auth.userId;

    // Call tribeService.createTribe with the tribe data
    const tribe = await tribeService.createTribe(tribeData);

    // Log successful tribe creation
    logger.info('Tribe created successfully', { tribeId: tribe.id, tribeName: tribe.name, createdBy: tribeData.createdBy });

    // Return 201 Created response with the created tribe
    res.status(201).json(tribe);
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Get a tribe by ID
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.get('/:tribeId', validateParams({ tribeId: 'string' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract tribe ID from request parameters
    const { tribeId } = req.params;

    // Call tribeService.getTribe with the tribe ID
    const tribe = await tribeService.getTribe(tribeId);

    // Return 200 OK response with the tribe data
    res.status(200).json(tribe);
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Get detailed information about a tribe
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.get('/:tribeId/details', validateParams({ tribeId: 'string' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract tribe ID from request parameters
    const { tribeId } = req.params;

    // Extract user ID from authenticated user in request
    const userId = req.auth.userId;

    // Call tribeService.getTribeDetails with tribe ID and user ID
    const tribeDetails = await tribeService.getTribeDetails(tribeId, userId);

    // Return 200 OK response with the detailed tribe data
    res.status(200).json(tribeDetails);
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Get all tribes a user is a member of
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.get('/user', validateQuery(paginationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract user ID from authenticated user in request
    const userId = req.auth.userId;

    // Extract pagination options from query parameters
    const { limit, offset } = req.query;

    // Call tribeService.getUserTribes with user ID and pagination options
    const { tribes, total } = await tribeService.getUserTribes(userId, { limit: Number(limit), offset: Number(offset) });

    // Return 200 OK response with the user's tribes and total count
    res.status(200).json({ tribes, total });
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Search for tribes based on various criteria
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.get('/', validateQuery(tribeSearchSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract search parameters from query parameters
    const searchParams: ITribeSearchParams = req.query;

    // Extract user ID from authenticated user in request (if available)
    const userId = req.auth.userId;

    // Call tribeService.searchTribes with search parameters and user ID
    const { tribes, total } = await tribeService.searchTribes(searchParams, userId);

    // Return 200 OK response with matching tribes and total count
    res.status(200).json({ tribes, total });
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Update a tribe's information
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.put('/:tribeId', validateParams({ tribeId: 'string' }), validateBody(updateTribeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract tribe ID from request parameters
    const { tribeId } = req.params;

    // Extract update data from request body
    const updateData: ITribeUpdate = req.body;

    // Extract user ID from authenticated user in request
    const userId = req.auth.userId;

    // Call tribeService.updateTribe with tribe ID, update data, and user ID
    const updatedTribe = await tribeService.updateTribe(tribeId, updateData, userId);

    // Return 200 OK response with the updated tribe
    res.status(200).json(updatedTribe);
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Update a tribe's status
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.patch('/:tribeId/status', validateParams({ tribeId: 'string' }), validateBody(tribeStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract tribe ID from request parameters
    const { tribeId } = req.params;

    // Extract status from request body
    const status: TribeStatus = req.body.status;

    // Extract user ID from authenticated user in request
    const userId = req.auth.userId;

    // Call tribeService.updateTribeStatus with tribe ID, status, and user ID
    const updatedTribe = await tribeService.updateTribeStatus(tribeId, status, userId);

    // Return 200 OK response with the updated tribe
    res.status(200).json(updatedTribe);
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Add an interest to a tribe
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.post('/:tribeId/interests', validateParams({ tribeId: 'string' }), validateBody(tribeInterestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract tribe ID from request parameters
    const { tribeId } = req.params;

    // Extract interest data from request body
    const interestData: { category: InterestCategory; name: string; isPrimary: boolean } = req.body;

    // Extract user ID from authenticated user in request
    const userId = req.auth.userId;

    // Call tribeService.addTribeInterest with tribe ID, interest data, and user ID
    const createdInterest = await tribeService.addTribeInterest(tribeId, interestData, userId);

    // Return 201 Created response with the created interest
    res.status(201).json(createdInterest);
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Remove an interest from a tribe
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.delete('/:tribeId/interests/:interestId', validateParams({ tribeId: 'string', interestId: 'string' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract tribe ID from request parameters
    const { tribeId, interestId } = req.params;

    // Extract user ID from authenticated user in request
    const userId = req.auth.userId;

    // Call tribeService.removeTribeInterest with interest ID, tribe ID, and user ID
    const removed = await tribeService.removeTribeInterest(interestId, tribeId, userId);

    // Return 200 OK response with success message
    res.status(200).json({ success: removed });
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Delete a tribe
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.delete('/:tribeId', validateParams({ tribeId: 'string' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract tribe ID from request parameters
    const { tribeId } = req.params;

    // Extract user ID from authenticated user in request
    const userId = req.auth.userId;

    // Call tribeService.deleteTribe with tribe ID and user ID
    const deleted = await tribeService.deleteTribe(tribeId, userId);

    // Return 200 OK response with success message
    res.status(200).json({ success: deleted });
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Get all members of a tribe
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.get('/:tribeId/members', validateParams({ tribeId: 'string' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract tribe ID from request parameters
    const { tribeId } = req.params;

    // Extract filter and pagination options from query parameters
    const { limit, offset } = req.query;

    // Call memberService.getTribeMembers with tribe ID and options
    const { members, total } = await tribeService.getTribeMembers(tribeId, { limit: Number(limit), offset: Number(offset) });

    // Return 200 OK response with tribe members and total count
    res.status(200).json({ members, total });
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Get tribe recommendations for a user
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.get('/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract user ID from authenticated user in request
    const userId = req.auth.userId;

    // Extract interests, location, and pagination options from query parameters
    const { interests, location, maxDistance, limit, offset } = req.query;

    // Call tribeService.getTribeRecommendations with user ID and parameters
    const recommendedTribes = await tribeService.getTribeRecommendations(
      userId,
      interests as InterestCategory[],
      location as any,
      Number(maxDistance),
      Number(limit),
      Number(offset)
    );

    // Return 200 OK response with recommended tribes
    res.status(200).json(recommendedTribes);
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Get AI-powered tribe recommendations for a user
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.get('/ai-recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract user ID from authenticated user in request
    const userId = req.auth.userId;

    // Extract pagination options from query parameters
    const { limit, offset } = req.query;

    // Call tribeService.getAITribeRecommendations with user ID and options
    const aiRecommendedTribes = await tribeService.getAITribeRecommendations(userId, { limit: Number(limit), offset: Number(offset) });

    // Return 200 OK response with AI-recommended tribes
    res.status(200).json(aiRecommendedTribes);
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Check if a user can join a tribe
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.get('/:tribeId/join-eligibility', validateParams({ tribeId: 'string' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract tribe ID from request parameters
    const { tribeId } = req.params;

    // Extract user ID from authenticated user in request
    const userId = req.auth.userId;

    // Call memberService.canUserJoinTribe with tribe ID and user ID
    const eligibility = await tribeService.checkTribeJoinEligibility(tribeId, userId);

    // Return 200 OK response with eligibility result
    res.status(200).json(eligibility);
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

/**
 * Get engagement metrics for a tribe
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
router.get('/:tribeId/engagement-metrics', validateParams({ tribeId: 'string' }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract tribe ID from request parameters
    const { tribeId } = req.params;

    // Extract time frame parameters from query parameters
    const { period, count } = req.query;

    // Call tribeService.getTribeEngagementMetrics with tribe ID and time frame
    const engagementMetrics = await tribeService.getTribeEngagementMetrics(tribeId, { period: period as 'day' | 'week' | 'month', count: Number(count) });

    // Return 200 OK response with engagement metrics
    res.status(200).json(engagementMetrics);
  } catch (error) {
    // Catch and forward any errors to the error handling middleware
    next(error);
  }
});

export const router = router;