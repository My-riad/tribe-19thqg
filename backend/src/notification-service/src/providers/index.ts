import { EmailProvider, emailProvider } from './email.provider';
import { FCMProvider, fcmProvider } from './fcm.provider';
import { DeliveryChannel, INotification } from '../../../shared/src/types/notification.types';
import { IDeliveryDocument } from '../models/delivery.model';
import { notificationConfig } from '../config';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Returns the appropriate notification provider for a given delivery channel
 * 
 * @param channel - The delivery channel to get a provider for
 * @returns The provider instance for the specified channel, or null if not supported
 */
export function getProviderForChannel(channel: DeliveryChannel): EmailProvider | FCMProvider | null {
  // Check if the channel is enabled in configuration
  if (!notificationConfig.enabledChannels.includes(channel)) {
    logger.warn(`Notification channel ${channel} is not enabled in configuration`);
    return null;
  }

  switch (channel) {
    case DeliveryChannel.EMAIL:
      return emailProvider;
    case DeliveryChannel.PUSH:
      return fcmProvider;
    case DeliveryChannel.IN_APP:
      logger.warn('In-app notification provider not yet implemented');
      return null;
    case DeliveryChannel.SMS:
      logger.warn('SMS notification provider not yet implemented');
      return null;
    default:
      logger.warn(`Unknown notification channel: ${channel}`);
      return null;
  }
}

/**
 * Sends a notification through the appropriate channel
 * 
 * @param notification - The notification to send
 * @param channel - The channel to send the notification through
 * @returns Promise resolving to the delivery document or null if sending failed
 */
export async function sendNotification(
  notification: INotification,
  channel: DeliveryChannel
): Promise<IDeliveryDocument | null> {
  try {
    const provider = getProviderForChannel(channel);
    
    if (!provider) {
      logger.error(`No provider available for channel ${channel}`);
      return null;
    }
    
    return await provider.send(notification);
  } catch (error) {
    logger.error(`Error sending notification through ${channel}`, error as Error, {
      notificationId: notification.id,
      userId: notification.userId,
      channel
    });
    return null;
  }
}

/**
 * Sends multiple notifications through the appropriate channel
 * 
 * @param notifications - Array of notifications to send
 * @param channel - The channel to send the notifications through
 * @returns Promise resolving to an array of delivery documents
 */
export async function sendBulkNotifications(
  notifications: INotification[],
  channel: DeliveryChannel
): Promise<IDeliveryDocument[]> {
  try {
    const provider = getProviderForChannel(channel);
    
    if (!provider) {
      logger.error(`No provider available for channel ${channel}`);
      return [];
    }
    
    return await provider.sendBulk(notifications);
  } catch (error) {
    logger.error(`Error sending bulk notifications through ${channel}`, error as Error, {
      notificationCount: notifications.length,
      channel
    });
    return [];
  }
}

/**
 * Retries sending a failed notification delivery
 * 
 * @param delivery - The failed delivery document to retry
 * @returns Promise resolving to the updated delivery document or null if retry failed
 */
export async function retryDelivery(
  delivery: IDeliveryDocument
): Promise<IDeliveryDocument | null> {
  try {
    const provider = getProviderForChannel(delivery.channel as DeliveryChannel);
    
    if (!provider) {
      logger.error(`No provider available for channel ${delivery.channel}`);
      return null;
    }
    
    return await provider.retry(delivery);
  } catch (error) {
    logger.error(`Error retrying delivery for notification ${delivery.notificationId}`, error as Error, {
      notificationId: delivery.notificationId,
      channel: delivery.channel,
      retryCount: delivery.retryCount
    });
    return null;
  }
}

/**
 * Verifies that all enabled notification providers are properly configured and working
 * 
 * @returns Promise resolving to an object mapping each channel to its verification status
 */
export async function verifyProviders(): Promise<Record<DeliveryChannel, boolean>> {
  const results: Record<DeliveryChannel, boolean> = {
    [DeliveryChannel.EMAIL]: false,
    [DeliveryChannel.PUSH]: false,
    [DeliveryChannel.IN_APP]: false,
    [DeliveryChannel.SMS]: false
  };
  
  // Check each enabled channel
  for (const channel of notificationConfig.enabledChannels) {
    const provider = getProviderForChannel(channel);
    
    if (provider) {
      try {
        results[channel] = await provider.verifyConnection();
        logger.info(`Provider verification for ${channel}: ${results[channel] ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        logger.error(`Error verifying provider for channel ${channel}`, error as Error);
        results[channel] = false;
      }
    }
  }
  
  return results;
}

// Export providers and utility functions
export { EmailProvider, FCMProvider, emailProvider, fcmProvider };