import { Request, Response, NextFunction, Router } from 'express'; // ^4.18.2
import ActivityService from '../services/activity.service';
import {
  createActivitySchema,
  activityIdSchema,
  tribeIdSchema,
  userIdSchema,
  activityFiltersSchema,
  activityStatsSchema,
  aiEngagementActivitySchema
} from '../validations/activity.validation';
import { validateBody, validateParams, validateQuery } from '@shared/middlewares';
import { ApiError } from '@shared/errors';
import { ITribeActivity, ActivityType } from '@shared/types';
import { logger } from '@shared/utils';

/**
 * Create a new tribe activity
 */
const createActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Creating new activity', { tribeId: req.body.tribeId });
    const activityData: Omit<ITribeActivity, 'id' | 'timestamp'> = req.body;
    const activity = await ActivityService.createActivity(activityData);
    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific activity by ID
 */
const getActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Retrieving activity', { activityId: req.params.activityId });
    const activityId = req.params.activityId;
    const activity = await ActivityService.getActivity(activityId);
    res.status(200).json(activity);
  } catch (error) {
    next(error);
  }
};

/**
 * Get activities for a specific tribe
 */
const getTribeActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Retrieving tribe activities', { tribeId: req.params.tribeId });
    const tribeId = req.params.tribeId;
    const { limit, offset, activityTypes } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      activityTypes: activityTypes ? 
        (Array.isArray(activityTypes) ? 
          activityTypes as ActivityType[] : 
          [activityTypes as ActivityType]) : 
        undefined
    };
    
    const activities = await ActivityService.getTribeActivities(tribeId, options);
    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
};

/**
 * Get activities performed by a specific user
 */
const getUserActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Retrieving user activities', { userId: req.params.userId });
    const userId = req.params.userId;
    const { limit, offset, tribeId } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      tribeId: tribeId as string
    };
    
    const activities = await ActivityService.getUserActivities(userId, options);
    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activities across all tribes
 */
const getRecentActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Retrieving recent activities');
    const { limit, offset } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined
    };
    
    const activities = await ActivityService.getRecentActivities(options);
    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
};

/**
 * Count activities for a specific tribe
 */
const countTribeActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Counting tribe activities', { tribeId: req.params.tribeId });
    const tribeId = req.params.tribeId;
    const { activityTypes, startDate, endDate } = req.query;
    
    const options = {
      activityTypes: activityTypes ? 
        (Array.isArray(activityTypes) ? 
          activityTypes as ActivityType[] : 
          [activityTypes as ActivityType]) : 
        undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };
    
    const count = await ActivityService.countTribeActivities(tribeId, options);
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity statistics for a tribe
 */
const getTribeActivityStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Retrieving tribe activity stats', { tribeId: req.params.tribeId });
    const tribeId = req.params.tribeId;
    const { startDate, endDate } = req.query;
    
    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };
    
    const stats = await ActivityService.getTribeActivityStats(tribeId, dateRange);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Create an AI-generated engagement activity
 */
const createAIEngagementActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Creating AI engagement activity', { tribeId: req.params.tribeId });
    const tribeId = req.params.tribeId;
    const { description, metadata } = req.body;
    
    const activity = await ActivityService.createAIEngagementActivity(tribeId, description, metadata);
    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific activity
 */
const deleteActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Deleting activity', { activityId: req.params.activityId });
    const activityId = req.params.activityId;
    const success = await ActivityService.deleteActivity(activityId);
    
    if (!success) {
      throw ApiError.notFound(`Activity with ID ${activityId} not found`);
    }
    
    res.status(200).json({ success });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all activities for a specific tribe
 */
const deleteTribesActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Deleting all tribe activities', { tribeId: req.params.tribeId });
    const tribeId = req.params.tribeId;
    const count = await ActivityService.deleteTribesActivities(tribeId);
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a chronological timeline of tribe activities
 */
const getActivityTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Retrieving activity timeline', { tribeId: req.params.tribeId });
    const tribeId = req.params.tribeId;
    const { limit, offset, startDate, endDate } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };
    
    const timeline = await ActivityService.getActivityTimeline(tribeId, options);
    res.status(200).json(timeline);
  } catch (error) {
    next(error);
  }
};

/**
 * Get engagement metrics based on activities
 */
const getEngagementMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Retrieving engagement metrics', { tribeId: req.params.tribeId });
    const tribeId = req.params.tribeId;
    const { period, count } = req.query;
    
    if (!period || !['day', 'week', 'month'].includes(period as string)) {
      throw ApiError.badRequest('Valid period (day, week, month) is required');
    }
    
    const timeFrame = {
      period: period as 'day' | 'week' | 'month',
      count: count ? parseInt(count as string, 10) : undefined
    };
    
    const metrics = await ActivityService.getEngagementMetrics(tribeId, timeFrame);
    res.status(200).json(metrics);
  } catch (error) {
    next(error);
  }
};

// Create and configure the router
const router = Router();

// Activity creation routes
router.post('/activities', validateBody(createActivitySchema), createActivity);
router.post('/tribes/:tribeId/ai-engagement', 
  validateParams(tribeIdSchema), 
  validateBody(aiEngagementActivitySchema), 
  createAIEngagementActivity);

// Activity retrieval routes
router.get('/activities/:activityId', validateParams(activityIdSchema), getActivity);
router.get('/tribes/:tribeId/activities', 
  validateParams(tribeIdSchema), 
  validateQuery(activityFiltersSchema), 
  getTribeActivities);
router.get('/users/:userId/activities', 
  validateParams(userIdSchema), 
  validateQuery(activityFiltersSchema), 
  getUserActivities);
router.get('/activities/recent', validateQuery(activityFiltersSchema), getRecentActivities);

// Activity statistics routes
router.get('/tribes/:tribeId/activity-count', 
  validateParams(tribeIdSchema), 
  validateQuery(activityFiltersSchema), 
  countTribeActivities);
router.get('/tribes/:tribeId/activity-stats', 
  validateParams(tribeIdSchema), 
  validateQuery(activityStatsSchema), 
  getTribeActivityStats);
router.get('/tribes/:tribeId/activity-timeline', 
  validateParams(tribeIdSchema), 
  validateQuery(activityFiltersSchema), 
  getActivityTimeline);
router.get('/tribes/:tribeId/engagement-metrics', 
  validateParams(tribeIdSchema), 
  getEngagementMetrics);

// Activity deletion routes
router.delete('/activities/:activityId', validateParams(activityIdSchema), deleteActivity);
router.delete('/tribes/:tribeId/activities', validateParams(tribeIdSchema), deleteTribesActivities);

export default router;