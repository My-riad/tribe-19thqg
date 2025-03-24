import mongoose from 'mongoose'; // v6.9.0
import { 
  Notification, 
  INotificationDocument 
} from '../models/notification.model';
import { 
  NotificationType, 
  NotificationPriority,
  NotificationStatus,
  DeliveryChannel,
  ICreateNotificationDto,
  INotificationQueryOptions
} from '../../../shared/src/types/notification.types';
import { validateCreateNotification } from '../validations/notification.validation';
import { preferenceService } from './preference.service';
import { deliveryService } from './delivery.service';
import { fcmProvider } from '../providers/fcm.provider';
import { emailProvider } from '../providers/email.provider';
import { notificationTemplates } from '../templates';
import { notificationConfig } from '../config';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Service class for managing notifications in the Tribe platform
 */
export class NotificationService {

  /**
   * Initializes the notification service
   */
  constructor() {
    // Initialize service with default configuration
    logger.info('Notification service initialized');
  }

  /**
   * Creates a new notification
   * @param notificationData - The notification data to create
   * @returns Newly created notification document
   */
  async create(notificationData: ICreateNotificationDto): Promise<INotificationDocument> {
    return createNotification(notificationData);
  }

  /**
   * Finds a notification by ID
   * @param notificationId - The ID of the notification
   * @returns Notification document if found, null otherwise
   */
  async findById(notificationId: string): Promise<INotificationDocument | null> {
    return findById(notificationId);
  }

  /**
   * Finds notifications for a user
   * @param userId - The user's ID
   * @param options - Query options
   * @returns Paginated notifications with metadata
   */
  async findByUser(userId: string, options: INotificationQueryOptions): Promise<{ notifications: INotificationDocument[], total: number, page: number, limit: number }> {
    return findByUser(userId, options);
  }

  /**
   * Finds unread notifications for a user
   * @param userId - The user's ID
   * @param options - Query options
   * @returns Paginated unread notifications with metadata
   */
  async findUnreadByUser(userId: string, options: INotificationQueryOptions): Promise<{ notifications: INotificationDocument[], total: number, page: number, limit: number }> {
    return findUnreadByUser(userId, options);
  }

  /**
   * Counts unread notifications for a user
   * @param userId - The user's ID
   * @returns Count of unread notifications
   */
  async countUnreadByUser(userId: string): Promise<number> {
    return countUnreadByUser(userId);
  }

  /**
   * Finds notifications related to a tribe
   * @param tribeId - The tribe's ID
   * @param options - Query options
   * @returns Paginated tribe-related notifications with metadata
   */
  async findByTribe(tribeId: string, options: INotificationQueryOptions): Promise<{ notifications: INotificationDocument[], total: number, page: number, limit: number }> {
    return findByTribe(tribeId, options);
  }

  /**
   * Finds notifications related to an event
   * @param eventId - The event's ID
   * @param options - Query options
   * @returns Paginated event-related notifications with metadata
   */
  async findByEvent(eventId: string, options: INotificationQueryOptions): Promise<{ notifications: INotificationDocument[], total: number, page: number, limit: number }> {
    return findByEvent(eventId, options);
  }

  /**
   * Marks a notification as read
   * @param notificationId - The ID of the notification
   * @returns Updated notification document
   */
  async markAsRead(notificationId: string): Promise<INotificationDocument> {
    return markAsRead(notificationId);
  }

  /**
   * Marks all notifications as read for a user
   * @param userId - The user's ID
   * @param type - The notification type to mark as read
   * @returns Number of notifications marked as read
   */
  async markAllAsRead(userId: string, type?: NotificationType): Promise<number> {
    return markAllAsRead(userId, type);
  }

  /**
   * Deletes a notification
   * @param notificationId - The ID of the notification
   * @returns Whether the deletion was successful
   */
  async delete(notificationId: string): Promise<boolean> {
    return deleteNotification(notificationId);
  }

  /**
   * Deletes expired notifications
   * @returns Number of notifications deleted
   */
  async deleteExpired(): Promise<number> {
    return deleteExpiredNotifications();
  }

  /**
   * Sends a notification through appropriate channels
   * @param notification - The notification document
   * @returns Updated notification document
   */
  async send(notification: INotificationDocument): Promise<INotificationDocument> {
    return sendNotification(notification);
  }

  /**
   * Sends multiple notifications in bulk
   * @param notificationsData - Array of notification data
   * @returns Bulk sending statistics
   */
  async sendBulk(notificationsData: ICreateNotificationDto[]): Promise<{ created: number, sent: number, failed: number }> {
    return sendBulkNotifications(notificationsData);
  }

  /**
   * Processes pending notifications in the queue
   * @param batchSize - The number of notifications to process in a batch
   * @returns Processing statistics
   */
  async processQueue(batchSize: number): Promise<{ processed: number, succeeded: number, failed: number }> {
    return processNotificationQueue(batchSize);
  }

  /**
   * Creates a notification using a predefined template
   * @param templateName - The name of the template to use
   * @param templateData - The data to pass to the template
   * @param userId - The ID of the user to create the notification for
   * @returns Created notification document or null if disabled
   */
  async createFromTemplate(templateName: string, templateData: Record<string, any>, userId: string): Promise<INotificationDocument | null> {
    return createFromTemplate(templateName, templateData, userId);
  }
}

/**
 * Creates a new notification in the database
 * @param notificationData - The notification data to create
 * @returns Newly created notification document
 */
async function createNotification(notificationData: ICreateNotificationDto): Promise<INotificationDocument> {
  // Validate the notification data using validateCreateNotification
  const validatedData = validateCreateNotification(notificationData);

  // Check if user has enabled notifications for this type using preferenceService
  const preference = await preferenceService.findByUserAndType(validatedData.userId, validatedData.type);

  // If notifications are disabled for this type, log and return null
  if (preference && !preference.enabled) {
    logger.info(`Notification creation skipped: User ${validatedData.userId} has disabled ${validatedData.type} notifications`);
    return null;
  }

  // Create a new notification document with the provided data
  const notification = new Notification({
    ...validatedData,
    status: NotificationStatus.PENDING // Set default status to PENDING
  });

  // Save the notification document to the database
  await notification.save();

  // Log notification creation
  logger.info(`Notification created for user ${validatedData.userId} of type ${validatedData.type}`, {
    notificationId: notification.id,
    userId: validatedData.userId,
    type: validatedData.type
  });

  // Return the created notification document
  return notification;
}

/**
 * Finds a notification by its ID
 * @param notificationId - The ID of the notification
 * @returns Notification document if found, null otherwise
 */
async function findById(notificationId: string): Promise<INotificationDocument | null> {
  // Query the database for a notification with matching ID
  const notification = await Notification.findById(notificationId).exec();

  // Return the found notification document or null if not found
  return notification;
}

/**
 * Finds notifications for a specific user with pagination and filtering options
 * @param userId - The ID of the user
 * @param options - Options for pagination, sorting, and filtering
 * @returns Paginated notifications with metadata
 */
async function findByUser(userId: string, options: INotificationQueryOptions): Promise<{ notifications: INotificationDocument[], total: number, page: number, limit: number }> {
  // Set default options if not provided (page, limit, sort)
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  // Call Notification.findByUser with userId and options
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  // Count total notifications matching the criteria
  const total = await Notification.countDocuments({ userId }).exec();

  // Return notifications with pagination metadata
  return {
    notifications,
    total,
    page,
    limit
  };
}

/**
 * Finds unread notifications for a specific user
 * @param userId - The ID of the user
 * @param options - Options for pagination, sorting, and filtering
 * @returns Paginated unread notifications with metadata
 */
async function findUnreadByUser(userId: string, options: INotificationQueryOptions): Promise<{ notifications: INotificationDocument[], total: number, page: number, limit: number }> {
  // Set default options if not provided (page, limit, sort)
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  // Call Notification.findUnreadByUser with userId and options
  const notifications = await Notification.find({
    userId,
    status: { $ne: NotificationStatus.READ }
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  // Count total unread notifications
  const total = await Notification.countDocuments({
    userId,
    status: { $ne: NotificationStatus.READ }
  }).exec();

  // Return unread notifications with pagination metadata
  return {
    notifications,
    total,
    page,
    limit
  };
}

/**
 * Counts unread notifications for a specific user
 * @param userId - The ID of the user
 * @returns Count of unread notifications
 */
async function countUnreadByUser(userId: string): Promise<number> {
  // Call Notification.countUnreadByUser with userId
  const count = await Notification.countDocuments({
    userId,
    status: { $ne: NotificationStatus.READ }
  }).exec();

  // Return the count of unread notifications
  return count;
}

/**
 * Finds notifications related to a specific tribe
 * @param tribeId - The ID of the tribe
 * @param options - Options for pagination, sorting, and filtering
 * @returns Paginated tribe-related notifications with metadata
 */
async function findByTribe(tribeId: string, options: INotificationQueryOptions): Promise<{ notifications: INotificationDocument[], total: number, page: number, limit: number }> {
  // Set default options if not provided (page, limit, sort)
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  // Call Notification.findByTribe with tribeId and options
  const notifications = await Notification.find({ tribeId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  // Count total tribe-related notifications
  const total = await Notification.countDocuments({ tribeId }).exec();

  // Return tribe-related notifications with pagination metadata
  return {
    notifications,
    total,
    page,
    limit
  };
}

/**
 * Finds notifications related to a specific event
 * @param eventId - The ID of the event
 * @param options - Options for pagination, sorting, and filtering
 * @returns Paginated event-related notifications with metadata
 */
async function findByEvent(eventId: string, options: INotificationQueryOptions): Promise<{ notifications: INotificationDocument[], total: number, page: number, limit: number }> {
  // Set default options if not provided (page, limit, sort)
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  // Call Notification.findByEvent with eventId and options
  const notifications = await Notification.find({ eventId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  // Count total event-related notifications
  const total = await Notification.countDocuments({ eventId }).exec();

  // Return event-related notifications with pagination metadata
  return {
    notifications,
    total,
    page,
    limit
  };
}

/**
 * Marks a notification as read
 * @param notificationId - The ID of the notification
 * @returns Updated notification document
 */
async function markAsRead(notificationId: string): Promise<INotificationDocument> {
  // Find notification by ID
  const notification = await Notification.findById(notificationId).exec();

  // If not found, throw error
  if (!notification) {
    throw new Error(`Notification with ID ${notificationId} not found`);
  }

  // Call notification.markAsRead() method
  await notification.markAsRead();

  // Update delivery records to READ status using deliveryService
  await deliveryService.markAsRead(notificationId);

  // Return updated notification document
  return notification;
}

/**
 * Marks all notifications as read for a specific user
 * @param userId - The ID of the user
 * @param type - The notification type to mark as read
 * @returns Number of notifications marked as read
 */
async function markAllAsRead(userId: string, type?: NotificationType): Promise<number> {
  // Call Notification.markAllAsRead with userId and optional type
  const result = await Notification.markAllAsRead(userId, type);

  // Return the count of updated notifications
  return result;
}

/**
 * Deletes a notification by ID
 * @param notificationId - The ID of the notification
 * @returns Whether the deletion was successful
 */
async function deleteNotification(notificationId: string): Promise<boolean> {
  // Find and delete the notification document by ID
  const result = await Notification.findByIdAndDelete(notificationId).exec();

  // Log notification deletion
  if (result) {
    logger.info(`Notification deleted: ${notificationId}`);
    return true;
  } else {
    logger.warn(`Notification not found for deletion: ${notificationId}`);
    return false;
  }
}

/**
 * Deletes expired notifications based on retention policy
 * @returns Number of notifications deleted
 */
async function deleteExpiredNotifications(): Promise<number> {
  // Calculate cutoff date based on retention days from config
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - notificationConfig.retentionDays);

  // Delete notifications older than cutoff date
  const result = await Notification.deleteMany({ expiresAt: { $lt: cutoffDate } }).exec();

  // Log number of deleted notifications
  logger.info(`Deleted ${result.deletedCount} expired notifications`);

  // Return count of deleted notifications
  return result.deletedCount;
}

/**
 * Sends a notification through appropriate channels based on user preferences
 * @param notification - The notification document
 * @returns Updated notification document
 */
async function sendNotification(notification: INotificationDocument): Promise<INotificationDocument> {
  try {
    // Get user preferences for this notification type
    let channels = await preferenceService.getChannelsForUserAndType(notification.userId, notification.type);

    // If no preferences found, create default preferences
    if (!channels || channels.length === 0) {
      logger.warn(`No notification preferences found for user ${notification.userId} and type ${notification.type}. Using default channels.`);
      await preferenceService.ensureUserPreferences(notification.userId);
      channels = await preferenceService.getChannelsForUserAndType(notification.userId, notification.type);
    }

    // If notifications are disabled, update status to CANCELLED and return
    if (!channels || channels.length === 0) {
      logger.info(`Notification sending cancelled: User ${notification.userId} has disabled ${notification.type} notifications`);
      notification.status = NotificationStatus.FAILED;
      await notification.save();
      return notification;
    }

    // For each enabled channel:
    for (const channel of channels) {
      // Create delivery record using deliveryService
      await deliveryService.createDelivery(notification.id, channel);

      // If PUSH channel enabled, send via fcmProvider
      if (channel === DeliveryChannel.PUSH) {
        try {
          await fcmProvider.send(notification);
        } catch (error) {
          logger.error(`FCM Provider failed to send notification ${notification.id}`, error as Error);
        }
      }

      // If EMAIL channel enabled, send via emailProvider
      if (channel === DeliveryChannel.EMAIL) {
        try {
          await emailProvider.send(notification);
        } catch (error) {
          logger.error(`Email Provider failed to send notification ${notification.id}`, error as Error);
        }
      }

      // If IN_APP channel enabled, mark as delivered for in-app display
      if (channel === DeliveryChannel.IN_APP) {
        try {
          // Mark as delivered for in-app display
          await deliveryService.updateStatus(notification.id, NotificationStatus.DELIVERED);
        } catch (error) {
          logger.error(`In-app delivery update failed for notification ${notification.id}`, error as Error);
        }
      }
    }

    // Update notification status to SENT
    notification.status = NotificationStatus.SENT;
    await notification.save();

    // Log notification sending
    logger.info(`Notification sent through channels ${channels.join(', ')} for user ${notification.userId}`, {
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.type,
      channels
    });

    return notification;
  } catch (error) {
    logger.error(`Error sending notification ${notification.id}`, error as Error, {
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.type
    });
    throw error;
  }
}

/**
 * Sends multiple notifications in bulk
 * @param notificationsData - Array of notification data
 * @returns Bulk sending statistics
 */
async function sendBulkNotifications(notificationsData: ICreateNotificationDto[]): Promise<{ created: number, sent: number, failed: number }> {
  let createdCount = 0;
  let sentCount = 0;
  let failedCount = 0;

  // Process notifications in batches based on configured batch size
  const batchSize = notificationConfig.batchSize;

  for (let i = 0; i < notificationsData.length; i += batchSize) {
    const batch = notificationsData.slice(i, i + batchSize);

    // For each notification in batch:
    for (const notificationData of batch) {
      try {
        // Create notification document
        const notification = await createNotification(notificationData);

        if (notification) {
          createdCount++;

          // Send notification through appropriate channels
          await sendNotification(notification);
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        logger.error(`Error processing bulk notification for user ${notificationData.userId}`, error as Error, {
          userId: notificationData.userId,
          type: notificationData.type
        });
        failedCount++;
      }
    }
  }

  // Log statistics on created, sent, and failed notifications
  logger.info(`Bulk notification send completed: Created ${createdCount}, Sent ${sentCount}, Failed ${failedCount}`);

  // Return statistics on created, sent, and failed notifications
  return {
    created: createdCount,
    sent: sentCount,
    failed: failedCount
  };
}

/**
 * Processes pending notifications in the queue
 * @param batchSize - The number of notifications to process in a batch
 * @returns Processing statistics
 */
async function processNotificationQueue(batchSize: number): Promise<{ processed: number, succeeded: number, failed: number }> {
  let processedCount = 0;
  let succeededCount = 0;
  let failedCount = 0;

  // Find pending notifications up to batch size limit
  const pendingNotifications = await Notification.find({ status: NotificationStatus.PENDING })
    .limit(batchSize)
    .exec();

  processedCount = pendingNotifications.length;

  // For each pending notification:
  for (const notification of pendingNotifications) {
    try {
      // Attempt to send through appropriate channels
      await sendNotification(notification);
      succeededCount++;
    } catch (error) {
      logger.error(`Error processing notification queue for notification ${notification.id}`, error as Error, {
        notificationId: notification.id,
        userId: notification.userId,
        type: notification.type
      });
      failedCount++;
    }
  }

  // Log processing statistics
  logger.info(`Notification queue processed: Processed ${processedCount}, Succeeded ${succeededCount}, Failed ${failedCount}`);

  // Return processing statistics
  return {
    processed: processedCount,
    succeeded: succeededCount,
    failed: failedCount
  };
}

/**
 * Creates a notification using a predefined template
 * @param templateName - The name of the template to use
 * @param templateData - The data to pass to the template
 * @param userId - The ID of the user to create the notification for
 * @returns Created notification document or null if disabled
 */
async function createFromTemplate(templateName: string, templateData: Record<string, any>, userId: string): Promise<INotificationDocument | null> {
  try {
    // Get template function from notificationTemplates
    const templateFunction = (notificationTemplates as any)[templateName];

    if (!templateFunction || typeof templateFunction !== 'function') {
      throw new Error(`Notification template "${templateName}" not found`);
    }

    // Generate notification content using template and provided data
    const notificationData = templateFunction(userId, templateData);

    if (!notificationData) {
      logger.warn(`Notification creation skipped: Template "${templateName}" returned null`);
      return null;
    }

    // Create notification with generated content
    const notification = await createNotification(notificationData);

    // Return created notification document
    return notification;
  } catch (error) {
    logger.error(`Error creating notification from template "${templateName}"`, error as Error, {
      templateName,
      userId
    });
    throw error;
  }
}

// Create and export singleton instance of the NotificationService class for managing notifications
export const notificationService = new NotificationService();