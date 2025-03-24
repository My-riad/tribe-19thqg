import mongoose from 'mongoose';
import { 
  Delivery, 
  IDeliveryDocument
} from '../models/delivery.model';
import { 
  Notification,
  INotificationDocument 
} from '../models/notification.model';
import { 
  DeliveryChannel, 
  NotificationStatus,
  IDeliveryStats,
  IChannelDeliveryStats
} from '../../../shared/src/types/notification.types';
import { fcmProvider } from '../providers/fcm.provider';
import { emailProvider } from '../providers/email.provider';
import { notificationConfig } from '../config';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Creates a new delivery record for a notification and channel
 * 
 * @param notificationId - ID of the notification being delivered
 * @param channel - Channel through which notification is delivered
 * @param metadata - Additional metadata for the delivery
 * @returns Newly created delivery document
 */
async function createDelivery(
  notificationId: string,
  channel: DeliveryChannel,
  metadata: Record<string, any> = {}
): Promise<IDeliveryDocument> {
  try {
    // Check if delivery already exists for this notification and channel
    const existingDelivery = await Delivery.findByNotificationAndChannel(notificationId, channel);
    
    if (existingDelivery) {
      logger.debug(`Delivery record already exists for notification ${notificationId} on channel ${channel}`, {
        notificationId,
        channel
      });
      return existingDelivery;
    }
    
    // Create new delivery record
    const delivery = new Delivery({
      notificationId,
      channel,
      status: NotificationStatus.PENDING,
      metadata,
      retryCount: 0
    });
    
    await delivery.save();
    
    logger.debug(`Created delivery record for notification ${notificationId} on channel ${channel}`, {
      notificationId,
      channel,
      deliveryId: delivery.id
    });
    
    return delivery;
  } catch (error) {
    logger.error(`Error creating delivery record for notification ${notificationId}`, error as Error, {
      notificationId,
      channel
    });
    throw error;
  }
}

/**
 * Updates the status of a delivery record
 * 
 * @param deliveryId - ID of the delivery record
 * @param status - New status to set
 * @param errorMessage - Optional error message for failed deliveries
 * @param metadata - Optional additional metadata to update
 * @returns Updated delivery document
 */
async function updateStatus(
  deliveryId: string,
  status: NotificationStatus,
  errorMessage?: string,
  metadata?: Record<string, any>
): Promise<IDeliveryDocument> {
  try {
    const delivery = await Delivery.findById(deliveryId);
    
    if (!delivery) {
      throw new Error(`Delivery record with ID ${deliveryId} not found`);
    }
    
    // Update status
    delivery.status = status;
    
    // Update timestamps based on status
    if (status === NotificationStatus.SENT) {
      delivery.sentAt = new Date();
    } else if (status === NotificationStatus.DELIVERED) {
      delivery.deliveredAt = new Date();
    } else if (status === NotificationStatus.READ) {
      delivery.readAt = new Date();
    } else if (status === NotificationStatus.FAILED && errorMessage) {
      delivery.errorMessage = errorMessage;
    }
    
    // Update metadata if provided
    if (metadata) {
      delivery.metadata = {
        ...delivery.metadata,
        ...metadata
      };
    }
    
    await delivery.save();
    
    logger.debug(`Updated delivery ${deliveryId} status to ${status}`, { 
      deliveryId,
      status,
      notificationId: delivery.notificationId 
    });
    
    return delivery;
  } catch (error) {
    logger.error(`Error updating delivery status for ${deliveryId}`, error as Error, {
      deliveryId,
      status
    });
    throw error;
  }
}

/**
 * Finds all delivery records for a notification
 * 
 * @param notificationId - ID of the notification
 * @returns Array of delivery records
 */
async function findByNotification(notificationId: string): Promise<IDeliveryDocument[]> {
  return Delivery.findByNotification(notificationId);
}

/**
 * Finds a delivery record for a notification and channel
 * 
 * @param notificationId - ID of the notification
 * @param channel - Delivery channel
 * @returns Delivery record if found, null otherwise
 */
async function findByNotificationAndChannel(
  notificationId: string,
  channel: DeliveryChannel
): Promise<IDeliveryDocument | null> {
  return Delivery.findByNotificationAndChannel(notificationId, channel);
}

/**
 * Marks delivery records for a notification as read
 * 
 * @param notificationId - ID of the notification
 * @returns Number of delivery records updated
 */
async function markAsRead(notificationId: string): Promise<number> {
  try {
    // Find all deliveries for this notification
    const deliveries = await findByNotification(notificationId);
    let updatedCount = 0;
    
    // Mark each delivery as read
    for (const delivery of deliveries) {
      if (delivery.status !== NotificationStatus.READ) {
        delivery.status = NotificationStatus.READ;
        delivery.readAt = new Date();
        await delivery.save();
        updatedCount++;
      }
    }
    
    logger.debug(`Marked ${updatedCount} deliveries as read for notification ${notificationId}`, {
      notificationId,
      updatedCount
    });
    
    return updatedCount;
  } catch (error) {
    logger.error(`Error marking deliveries as read for notification ${notificationId}`, error as Error, {
      notificationId
    });
    throw error;
  }
}

/**
 * Retries failed delivery attempts for notifications
 * 
 * @param batchSize - Maximum number of failed deliveries to process in this batch
 * @returns Statistics about retry operation
 */
async function retryFailedDeliveries(batchSize: number = 50): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  try {
    // Find failed deliveries that haven't exceeded retry limit
    const failedDeliveries = await Delivery.findFailedDeliveries(
      batchSize,
      notificationConfig.maxRetryAttempts
    );
    
    const result = {
      processed: failedDeliveries.length,
      succeeded: 0,
      failed: 0
    };
    
    if (failedDeliveries.length === 0) {
      logger.debug('No failed deliveries found for retry');
      return result;
    }
    
    logger.info(`Retrying ${failedDeliveries.length} failed deliveries`);
    
    // Process each failed delivery
    for (const delivery of failedDeliveries) {
      try {
        // Attempt to retry based on channel
        if (delivery.channel === DeliveryChannel.PUSH) {
          await fcmProvider.retry(delivery);
          result.succeeded++;
        } else if (delivery.channel === DeliveryChannel.EMAIL) {
          await emailProvider.retry(delivery);
          result.succeeded++;
        } else {
          // Unsupported channel for now
          logger.warn(`Retry not implemented for channel ${delivery.channel}`, { 
            deliveryId: delivery.id,
            channel: delivery.channel
          });
          result.failed++;
        }
      } catch (error) {
        logger.error(`Error retrying delivery ${delivery.id}`, error as Error, {
          deliveryId: delivery.id,
          notificationId: delivery.notificationId,
          channel: delivery.channel
        });
        result.failed++;
      }
    }
    
    logger.info(`Retry batch completed: ${result.succeeded} succeeded, ${result.failed} failed`, {
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed
    });
    
    return result;
  } catch (error) {
    logger.error('Error processing failed delivery retries', error as Error);
    return {
      processed: 0,
      succeeded: 0,
      failed: 0
    };
  }
}

/**
 * Gets delivery statistics for a date range
 * 
 * @param startDate - Start date for statistics
 * @param endDate - End date for statistics
 * @returns Aggregated delivery statistics
 */
async function getDeliveryStats(
  startDate: Date,
  endDate: Date
): Promise<IDeliveryStats> {
  return await Delivery.getDeliveryStats(startDate, endDate);
}

/**
 * Gets delivery statistics by channel for a date range
 * 
 * @param startDate - Start date for statistics
 * @param endDate - End date for statistics
 * @returns Array of channel-specific delivery statistics
 */
async function getDeliveryStatsByChannel(
  startDate: Date,
  endDate: Date
): Promise<IChannelDeliveryStats[]> {
  const statsByChannel = await Delivery.getDeliveryStatsByChannel(startDate, endDate);
  
  // Transform the results into the expected format
  return Object.entries(statsByChannel).map(([channel, stats]) => ({
    channel: channel as DeliveryChannel,
    stats: stats as IDeliveryStats
  }));
}

/**
 * Cleans up old delivery records based on retention policy
 * 
 * @param retentionDays - Number of days to retain delivery records
 * @returns Number of delivery records deleted
 */
async function cleanupOldDeliveries(retentionDays: number = 90): Promise<number> {
  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // Delete deliveries older than cutoff date
    const result = await Delivery.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    const deletedCount = result.deletedCount || 0;
    
    logger.info(`Cleaned up ${deletedCount} delivery records older than ${retentionDays} days`, {
      retentionDays,
      deletedCount,
      cutoffDate
    });
    
    return deletedCount;
  } catch (error) {
    logger.error(`Error cleaning up old delivery records`, error as Error, {
      retentionDays
    });
    throw error;
  }
}

/**
 * Service class for managing notification delivery tracking
 */
export class DeliveryService {
  /**
   * Creates a new delivery record
   */
  async createDelivery(
    notificationId: string,
    channel: DeliveryChannel,
    metadata: Record<string, any> = {}
  ): Promise<IDeliveryDocument> {
    return createDelivery(notificationId, channel, metadata);
  }
  
  /**
   * Updates the status of a delivery record
   */
  async updateStatus(
    deliveryId: string,
    status: NotificationStatus,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<IDeliveryDocument> {
    return updateStatus(deliveryId, status, errorMessage, metadata);
  }
  
  /**
   * Finds all delivery records for a notification
   */
  async findByNotification(notificationId: string): Promise<IDeliveryDocument[]> {
    return findByNotification(notificationId);
  }
  
  /**
   * Finds a delivery record for a notification and channel
   */
  async findByNotificationAndChannel(
    notificationId: string,
    channel: DeliveryChannel
  ): Promise<IDeliveryDocument | null> {
    return findByNotificationAndChannel(notificationId, channel);
  }
  
  /**
   * Marks delivery records for a notification as read
   */
  async markAsRead(notificationId: string): Promise<number> {
    return markAsRead(notificationId);
  }
  
  /**
   * Retries failed delivery attempts
   */
  async retryFailedDeliveries(batchSize: number = 50): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    return retryFailedDeliveries(batchSize);
  }
  
  /**
   * Gets delivery statistics
   */
  async getDeliveryStats(
    startDate: Date,
    endDate: Date
  ): Promise<IDeliveryStats> {
    return getDeliveryStats(startDate, endDate);
  }
  
  /**
   * Gets delivery statistics by channel
   */
  async getDeliveryStatsByChannel(
    startDate: Date,
    endDate: Date
  ): Promise<IChannelDeliveryStats[]> {
    return getDeliveryStatsByChannel(startDate, endDate);
  }
  
  /**
   * Cleans up old delivery records
   */
  async cleanupOldDeliveries(retentionDays: number = 90): Promise<number> {
    return cleanupOldDeliveries(retentionDays);
  }
}

// Export singleton instance
export const deliveryService = new DeliveryService();