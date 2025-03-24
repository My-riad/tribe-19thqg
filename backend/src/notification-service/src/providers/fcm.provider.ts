import * as admin from 'firebase-admin'; // ^11.5.0
import mongoose from 'mongoose'; // ^6.9.0
import { 
  INotification, 
  NotificationType, 
  DeliveryChannel, 
  NotificationStatus 
} from '../../../shared/src/types/notification.types';
import { IDeliveryDocument, Delivery } from '../models/delivery.model';
import { notificationConfig } from '../config';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Retrieves the device tokens for a specific user from the user data in MongoDB
 * @param userId The ID of the user to retrieve tokens for
 * @returns Array of device tokens for the user
 */
async function getUserDeviceTokens(userId: string): Promise<string[]> {
  try {
    // Query for user's device tokens in the users collection
    const result = await mongoose.connection.collection('users').findOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { projection: { deviceTokens: 1 } }
    );
    
    if (!result || !result.deviceTokens || !Array.isArray(result.deviceTokens) || result.deviceTokens.length === 0) {
      logger.warn(`No device tokens found for user ${userId}`, { userId });
      return [];
    }
    
    // Filter out any null, undefined, or empty tokens
    const validTokens = result.deviceTokens.filter((token: string) => token && token.trim() !== '');
    logger.debug(`Retrieved ${validTokens.length} device tokens for user ${userId}`, { userId, tokenCount: validTokens.length });
    
    return validTokens;
  } catch (error) {
    logger.error(`Error retrieving device tokens for user ${userId}`, error as Error, { userId });
    return [];
  }
}

/**
 * Creates the FCM message payload for a notification
 * @param notification The notification to create a payload for
 * @param deviceToken The device token to send to
 * @returns FCM message payload
 */
function createFcmPayload(notification: INotification, deviceToken: string): admin.messaging.Message {
  // Base notification structure
  const payload: admin.messaging.Message = {
    token: deviceToken,
    notification: {
      title: notification.title,
      body: notification.body,
      ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
    },
    data: {
      notificationId: notification.id,
      type: notification.type,
      ...(notification.actionUrl && { actionUrl: notification.actionUrl }),
      ...(notification.metadata && { metadata: JSON.stringify(notification.metadata) }),
    },
    android: {
      priority: 'high',
      ttl: notificationConfig.fcmConfig.ttlSeconds * 1000, // Convert to milliseconds
      notification: {
        channelId: notificationConfig.fcmConfig.androidChannelId,
        clickAction: notification.actionUrl || 'FLUTTER_NOTIFICATION_CLICK',
      },
    },
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default',
          'content-available': 1,
        },
      },
      headers: {
        'apns-priority': '10',
        'apns-topic': notificationConfig.fcmConfig.apnsBundleId,
      },
    },
  };

  // Set notification channel based on type
  switch (notification.type) {
    case NotificationType.EVENT_REMINDER:
      payload.android!.notification!.channelId = 'tribe_event_channel';
      payload.apns!.payload.aps.sound = 'event_notification.wav';
      break;
    case NotificationType.TRIBE_INVITATION:
    case NotificationType.TRIBE_MATCH:
      payload.android!.notification!.channelId = 'tribe_social_channel';
      break;
    case NotificationType.AI_ENGAGEMENT_PROMPT:
      payload.android!.notification!.channelId = 'tribe_engagement_channel';
      payload.apns!.payload.aps.sound = 'engagement_notification.wav';
      break;
    case NotificationType.ACHIEVEMENT_UNLOCKED:
      payload.android!.notification!.channelId = 'tribe_achievement_channel';
      payload.apns!.payload.aps.sound = 'achievement_notification.wav';
      break;
    default:
      // Use default channel
      break;
  }

  return payload;
}

/**
 * Creates or updates delivery tracking record for a push notification
 * @param notificationId ID of the notification
 * @param status Delivery status
 * @param metadata Additional metadata for the delivery
 * @returns Updated delivery document
 */
async function trackDelivery(
  notificationId: string,
  status: NotificationStatus,
  metadata: Record<string, any> = {}
): Promise<IDeliveryDocument> {
  try {
    // Find existing delivery record for this notification and channel
    let delivery = await Delivery.findByNotificationAndChannel(
      notificationId,
      DeliveryChannel.PUSH
    );

    if (delivery) {
      // Update existing delivery record based on status
      if (status === NotificationStatus.SENT) {
        await delivery.markAsSent();
      } else if (status === NotificationStatus.DELIVERED) {
        await delivery.markAsDelivered();
      } else if (status === NotificationStatus.FAILED) {
        await delivery.markAsFailed(metadata.errorMessage || 'Unknown error');
      }
      
      // Update metadata
      delivery.metadata = {
        ...delivery.metadata,
        ...metadata,
        updatedAt: new Date()
      };
      
      await delivery.save();
    } else {
      // Create new delivery record
      const newDelivery = {
        notificationId,
        channel: DeliveryChannel.PUSH,
        status,
        metadata: {
          ...metadata,
          createdAt: new Date()
        },
        retryCount: 0
      };
      
      delivery = new Delivery(newDelivery);
      
      // Set appropriate timestamp based on status
      if (status === NotificationStatus.SENT) {
        delivery.sentAt = new Date();
      } else if (status === NotificationStatus.DELIVERED) {
        delivery.deliveredAt = new Date();
      }
      
      await delivery.save();
    }
    
    return delivery;
  } catch (error) {
    logger.error(`Error tracking delivery status for notification ${notificationId}`, error as Error, { notificationId, status });
    throw error;
  }
}

/**
 * Provider class for sending push notifications via Firebase Cloud Messaging
 */
export class FCMProvider {
  private firebaseApp: admin.app.App;
  private fcmConfig: typeof notificationConfig.fcmConfig;

  /**
   * Initializes the FCM provider with Firebase configuration
   */
  constructor() {
    this.fcmConfig = notificationConfig.fcmConfig;
    
    // Initialize Firebase Admin SDK if not already initialized
    try {
      // Check if Firebase Admin SDK is already initialized
      if (admin.apps.length === 0) {
        // Initialize with service account
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(this.fcmConfig.fcmServiceAccountPath),
        });
      } else {
        this.firebaseApp = admin.app();
      }
      
      // Verify connection is working
      this.verifyConnection();
      
      logger.info('FCM Provider initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize FCM Provider', error as Error);
      throw error;
    }
  }

  /**
   * Sends a push notification to a user's devices
   * @param notification The notification to send
   * @returns Delivery tracking document
   */
  async send(notification: INotification): Promise<IDeliveryDocument> {
    try {
      // Get user's device tokens
      const deviceTokens = await getUserDeviceTokens(notification.userId);
      
      if (!deviceTokens || deviceTokens.length === 0) {
        logger.warn(`No device tokens found for user ${notification.userId}, cannot send push notification`, { userId: notification.userId });
        return await trackDelivery(
          notification.id,
          NotificationStatus.FAILED,
          { errorMessage: 'No device tokens available' }
        );
      }
      
      // Create delivery tracking record
      const delivery = await trackDelivery(
        notification.id,
        NotificationStatus.PENDING,
        { deviceCount: deviceTokens.length }
      );
      
      // Send notification to all user devices
      const messages = deviceTokens.map(token => createFcmPayload(notification, token));
      
      // Use Firebase Admin SDK to send messages
      const response = await admin.messaging().sendAll(messages);
      
      // Process response
      const successCount = response.successCount;
      const failureCount = response.failureCount;
      
      logger.info(`FCM Notification sent to user ${notification.userId}: ${successCount} success, ${failureCount} failure`, {
        userId: notification.userId,
        notificationId: notification.id,
        type: notification.type,
        successCount,
        failureCount
      });
      
      if (failureCount === messages.length) {
        // All sends failed
        const errorMessages = response.responses
          .filter(resp => resp.error)
          .map(resp => resp.error?.message)
          .join(', ');
          
        await delivery.markAsFailed(`All FCM sends failed: ${errorMessages}`);
        return delivery;
      } else if (successCount > 0) {
        // At least some sends succeeded
        await delivery.markAsSent();
        
        // Update metadata with detailed results
        delivery.metadata = {
          ...delivery.metadata,
          successCount,
          failureCount,
          results: response.responses.map((resp, index) => ({
            deviceTokenPrefix: deviceTokens[index].substring(0, 6) + '...', // Truncate token for security
            success: !resp.error,
            error: resp.error ? resp.error.message : null,
            messageId: resp.messageId || null,
          })),
        };
        
        await delivery.save();
      }
      
      return delivery;
    } catch (error) {
      logger.error(`Error sending FCM notification to user ${notification.userId}`, error as Error, {
        userId: notification.userId,
        notificationId: notification.id,
        type: notification.type
      });
      
      // Track failed delivery
      return await trackDelivery(
        notification.id,
        NotificationStatus.FAILED,
        { errorMessage: (error as Error).message }
      );
    }
  }

  /**
   * Sends push notifications to multiple users
   * @param notifications Array of notifications to send
   * @returns Array of delivery tracking documents
   */
  async sendBulk(notifications: INotification[]): Promise<IDeliveryDocument[]> {
    // Process notifications in batches to avoid overwhelming FCM
    const batchSize = 100; // Maximum batch size recommended by Firebase
    const results: IDeliveryDocument[] = [];
    
    logger.info(`Processing bulk notification send for ${notifications.length} notifications`);
    
    // Process in batches
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      logger.debug(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(notifications.length/batchSize)}`);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(notification => this.send(notification))
      );
      
      results.push(...batchResults);
    }
    
    const successCount = results.filter(r => r.status === NotificationStatus.SENT || r.status === NotificationStatus.DELIVERED).length;
    const failureCount = results.filter(r => r.status === NotificationStatus.FAILED).length;
    
    logger.info(`Bulk notification send completed: ${successCount} success, ${failureCount} failure`);
    
    return results;
  }

  /**
   * Retries sending failed push notifications
   * @param delivery The failed delivery to retry
   * @returns Updated delivery document
   */
  async retry(delivery: IDeliveryDocument): Promise<IDeliveryDocument> {
    try {
      // Check if maximum retry attempts have been reached
      if (delivery.retryCount >= notificationConfig.maxRetryAttempts) {
        logger.warn(`Maximum retry attempts (${notificationConfig.maxRetryAttempts}) reached for notification ${delivery.notificationId}`, {
          notificationId: delivery.notificationId,
          retryCount: delivery.retryCount
        });
        return delivery;
      }
      
      // Increment retry count
      await delivery.incrementRetryCount();
      
      // Query for the original notification
      const notification = await mongoose.connection.collection('notifications').findOne(
        { _id: new mongoose.Types.ObjectId(delivery.notificationId) }
      ) as unknown as INotification;
      
      if (!notification) {
        logger.error(`Original notification ${delivery.notificationId} not found for retry`);
        await delivery.markAsFailed('Original notification not found');
        return delivery;
      }
      
      logger.info(`Retrying FCM notification ${delivery.notificationId}, attempt ${delivery.retryCount}`);
      
      // Retry sending the notification
      return await this.send(notification);
    } catch (error) {
      logger.error(`Error retrying FCM notification ${delivery.notificationId}`, error as Error, {
        notificationId: delivery.notificationId,
        retryCount: delivery.retryCount
      });
      
      await delivery.markAsFailed(`Retry failed: ${(error as Error).message}`);
      return delivery;
    }
  }

  /**
   * Verifies the Firebase connection is working
   * @returns True if connection is successful
   */
  async verifyConnection(): Promise<boolean> {
    try {
      // Try to access Firebase project settings to verify connection
      const app = this.firebaseApp;
      const projectId = (await app.options.credential.getAccessToken()).access_token ? true : false;
      
      logger.info('FCM connection verified successfully');
      return true;
    } catch (error) {
      logger.error('FCM connection verification failed', error as Error);
      return false;
    }
  }
}

// Export singleton instance
export const fcmProvider = new FCMProvider();