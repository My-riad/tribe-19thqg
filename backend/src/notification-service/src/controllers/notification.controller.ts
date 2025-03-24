import { Request, Response, NextFunction } from 'express'; // version: ^4.18.2
import { notificationService } from '../services/notification.service';
import { deliveryService } from '../services/delivery.service';
import { preferenceService } from '../services/preference.service';
import {
  validateCreateNotification,
  validateGetNotifications,
  validateNotificationId,
  validateBulkCreateNotification,
  validateTribeNotification,
  validateMarkAsRead,
  validateDeliveryStats
} from '../validations/notification.validation';
import { ApiError } from '../../../shared/src/errors/api.error';
import {
  NotificationType,
  ICreateNotificationDto,
  IBulkNotificationCreate,
  ITribeNotificationCreate,
  INotificationResponse
} from '../../../shared/src/types/notification.types';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Controller class for handling notification-related HTTP requests
 */
class NotificationController {
  /**
   * Initializes the notification controller
   */
  constructor() {
    // Initialize controller with default configuration
  }

  /**
   * Creates a new notification
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body using validateCreateNotification
      const validatedData: ICreateNotificationDto = validateCreateNotification(req.body);

      // Call notificationService.create with validated data
      const notification = await notificationService.create(validatedData);

      // If notification is created successfully, send 201 response with the notification data
      if (notification) {
        logger.info('Notification created successfully', { notificationId: notification.id });
        res.status(201).json(notification);
      } else {
        // If notification creation is skipped due to disabled preferences, send 204 No Content
        logger.info('Notification creation skipped due to disabled preferences');
        res.status(204).send();
      }
    } catch (error) {
      // If creation fails, pass error to next middleware
      logger.error('Error creating notification', error as Error);
      next(error);
    }
  }

  /**
   * Retrieves a notification by ID
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getNotificationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request params using validateNotificationId
      const { id: notificationId } = validateNotificationId(req.params);

      // Call notificationService.findById with notificationId
      const notification = await notificationService.findById(notificationId);

      // If notification is found, send 200 response with the notification data
      if (notification) {
        logger.info('Notification retrieved successfully', { notificationId });
        res.status(200).json(notification);
      } else {
        // If notification is not found, throw ApiError.notFound
        logger.warn('Notification not found', { notificationId });
        throw ApiError.notFound('Notification not found');
      }
    } catch (error) {
      // If an error occurs, pass it to next middleware
      logger.error('Error retrieving notification', error as Error);
      next(error);
    }
  }

  /**
   * Retrieves notifications for a specific user
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getUserNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request query using validateGetNotifications
      const validatedQuery = validateGetNotifications(req.query);

      // Extract userId and query options from validated query
      const { userId, ...options } = validatedQuery;

      // Call notificationService.findByUser with userId and options
      const { notifications, total, page, limit } = await notificationService.findByUser(userId, options);

      // Send 200 response with notifications and pagination metadata
      logger.info('User notifications retrieved successfully', { userId, count: notifications.length });
      res.status(200).json({
        notifications,
        total,
        page,
        limit
      });
    } catch (error) {
      // If an error occurs, pass it to next middleware
      logger.error('Error retrieving user notifications', error as Error);
      next(error);
    }
  }

  /**
   * Retrieves unread notifications for a specific user
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getUnreadNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request query using validateGetNotifications
      const validatedQuery = validateGetNotifications(req.query);

      // Extract userId and query options from validated query
      const { userId, ...options } = validatedQuery;

      // Call notificationService.findUnreadByUser with userId and options
      const { notifications, total, page, limit } = await notificationService.findUnreadByUser(userId, options);

      // Send 200 response with unread notifications and pagination metadata
      logger.info('Unread notifications retrieved successfully', { userId, count: notifications.length });
      res.status(200).json({
        notifications,
        total,
        page,
        limit
      });
    } catch (error) {
      // If an error occurs, pass it to next middleware
      logger.error('Error retrieving unread notifications', error as Error);
      next(error);
    }
  }

  /**
   * Counts unread notifications for a specific user
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async countUnreadNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract userId from request query
      const { userId } = req.query;

      // If userId is not provided, throw ApiError.badRequest
      if (!userId || typeof userId !== 'string') {
        logger.warn('User ID is required to count unread notifications');
        throw ApiError.badRequest('User ID is required');
      }

      // Call notificationService.countUnreadByUser with userId
      const count = await notificationService.countUnreadByUser(userId);

      // Send 200 response with the count of unread notifications
      logger.info('Unread notifications count retrieved successfully', { userId, count });
      res.status(200).json({ count });
    } catch (error) {
      // If an error occurs, pass it to next middleware
      logger.error('Error counting unread notifications', error as Error);
      next(error);
    }
  }

  /**
   * Marks a notification as read
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async markNotificationAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request params using validateNotificationId
      const { id: notificationId } = validateNotificationId(req.params);

      // Call notificationService.markAsRead with notificationId
      const notification = await notificationService.markAsRead(notificationId);

      // Send 200 response with the updated notification
      logger.info('Notification marked as read successfully', { notificationId });
      res.status(200).json(notification);
    } catch (error) {
      // If notification is not found, throw ApiError.notFound
      if (error instanceof Error && error.message.includes('not found')) {
        logger.warn('Notification not found', { notificationId: req.params.id });
        return next(ApiError.notFound('Notification not found'));
      }

      // If an error occurs, pass it to next middleware
      logger.error('Error marking notification as read', error as Error);
      next(error);
    }
  }

  /**
   * Marks all notifications as read for a specific user
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async markAllNotificationsAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body using validateMarkAsRead
      const validatedBody = validateMarkAsRead(req.body);

      // Extract userId, notificationIds, and all flag from validated body
      const { userId, notificationIds, all } = validatedBody;

      let count: number;
      // If all flag is true, call notificationService.markAllAsRead with userId
      if (all) {
        count = await notificationService.markAllAsRead(userId);
      } else {
        // If all flag is false, iterate through notificationIds and mark each as read
        count = 0;
        if (notificationIds) {
          for (const notificationId of notificationIds) {
            await notificationService.markAsRead(notificationId);
            count++;
          }
        }
      }

      // Send 200 response with the count of notifications marked as read
      logger.info('All notifications marked as read successfully', { userId, count });
      res.status(200).json({ count });
    } catch (error) {
      // If an error occurs, pass it to next middleware
      logger.error('Error marking all notifications as read', error as Error);
      next(error);
    }
  }

  /**
   * Deletes a notification
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request params using validateNotificationId
      const { id: notificationId } = validateNotificationId(req.params);

      // Call notificationService.delete with notificationId
      const success = await notificationService.delete(notificationId);

      // If deletion is successful, send 204 No Content response
      if (success) {
        logger.info('Notification deleted successfully', { notificationId });
        res.status(204).send();
      } else {
        // If notification is not found, throw ApiError.notFound
        logger.warn('Notification not found for deletion', { notificationId });
        throw ApiError.notFound('Notification not found');
      }
    } catch (error) {
      // If an error occurs, pass it to next middleware
      logger.error('Error deleting notification', error as Error);
      next(error);
    }
  }

  /**
   * Creates multiple notifications in bulk
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async createBulkNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body using validateBulkCreateNotification
      const validatedData: IBulkNotificationCreate = validateBulkCreateNotification(req.body);

      // Extract bulk notification data from validated body
      const bulkNotificationData = validatedData;

      // Call notificationService.sendBulk with bulk notification data
      const stats = await notificationService.sendBulk([bulkNotificationData]);

      // Send 200 response with the bulk creation statistics
      logger.info('Bulk notifications created successfully', { stats });
      res.status(200).json(stats);
    } catch (error) {
      // If an error occurs, pass it to next middleware
      logger.error('Error creating bulk notifications', error as Error);
      next(error);
    }
  }

  /**
   * Creates notifications for all members of a tribe
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async createTribeNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body using validateTribeNotification
      const validatedData: ITribeNotificationCreate = validateTribeNotification(req.body);

      // Extract tribe notification data from validated body
      const tribeNotificationData = validatedData;

      // Call notificationService.sendBulk with bulk notification data
      const stats = await notificationService.sendBulk([{
        userId: 'string',
        type: NotificationType.TRIBE_CHAT,
        title: 'string',
        body: 'string',
        priority: 'MEDIUM',
        expiresAt: null,
        tribeId: 'string',
        eventId: null,
        actionUrl: 'string',
        imageUrl: 'string',
        metadata: {}
      }]);

      // Send 200 response with the bulk creation statistics
      logger.info('Tribe notifications created successfully', { stats });
      res.status(200).json(stats);
    } catch (error) {
      // If an error occurs, pass it to next middleware
      logger.error('Error creating tribe notifications', error as Error);
      next(error);
    }
  }

  /**
   * Creates a notification using a predefined template
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async createTemplatedNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract templateName, templateData, and userId from request body
      const { templateName, templateData, userId } = req.body;

      // Validate that all required fields are present
      if (!templateName || !templateData || !userId) {
        logger.warn('Missing required fields for templated notification');
        throw ApiError.badRequest('Template name, template data, and user ID are required');
      }

      // Call notificationService.createFromTemplate with templateName, templateData, and userId
      const notification = await notificationService.createFromTemplate(templateName, templateData, userId);

      // If notification is created successfully, send 201 response with the notification data
      if (notification) {
        logger.info('Templated notification created successfully', { notificationId: notification.id, templateName });
        res.status(201).json(notification);
      } else {
        // If notification creation is skipped due to disabled preferences, send 204 No Content
        logger.info('Templated notification creation skipped due to disabled preferences', { templateName });
        res.status(204).send();
      }
    } catch (error) {
      // If template is not found or creation fails, throw appropriate error
      logger.error('Error creating templated notification', error as Error);
      next(error);
    }
  }

  /**
   * Retrieves notification delivery statistics
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getDeliveryStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request query using validateDeliveryStats
      const validatedQuery = validateDeliveryStats(req.query);

      // Extract startDate and endDate from validated query
      const { startDate, endDate } = validatedQuery;

      // Call deliveryService.getDeliveryStats with date range
      const stats = await deliveryService.getDeliveryStats(startDate, endDate);

      // Send 200 response with delivery statistics
      logger.info('Delivery statistics retrieved successfully', { startDate, endDate, stats });
      res.status(200).json(stats);
    } catch (error) {
      // If an error occurs, pass it to next middleware
      logger.error('Error retrieving delivery statistics', error as Error);
      next(error);
    }
  }

    /**
   * Retrieves notification preferences for a user
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async getUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract userId from request params
      const { userId } = req.params;

      // Call preferenceService.findByUser with userId
      const preferences = await preferenceService.findByUser(userId);

      // Send 200 response with user preferences
      logger.info('User preferences retrieved successfully', { userId, count: preferences.length });
      res.status(200).json(preferences);
    } catch (error) {
      // If an error occurs, pass it to next middleware
      logger.error('Error retrieving user preferences', error as Error);
      next(error);
    }
  }

  /**
   * Updates a notification preference for a user
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction object
   */
  async updateUserPreference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract userId, notificationType, and preference data from request
      const { userId, notificationType } = req.params;
      const preferenceData = req.body;

      // Validate that all required fields are present
      if (!userId || !notificationType || !preferenceData) {
        logger.warn('Missing required fields for updating user preference');
        throw ApiError.badRequest('User ID, notification type, and preference data are required');
      }

      // Call preferenceService.updatePreference with userId, notificationType, and preference data
      const preference = await preferenceService.updatePreference(userId, preferenceData);

      // Send 200 response with updated preference
      logger.info('User preference updated successfully', { userId, notificationType });
      res.status(200).json(preference);
    } catch (error) {
      // If an error occurs, pass it to next middleware
      logger.error('Error updating user preference', error as Error);
      next(error);
    }
  }
}

// Create and export singleton instance of the NotificationController class for handling notification-related HTTP requests
export const notificationController = new NotificationController();