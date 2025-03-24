import {
  NotificationType,
  NotificationPriority,
  DeliveryChannel,
  INotification,
  INotificationCreate
} from '../../../shared/src/types/notification.types';
import { Preference, getDefaultChannelsForType } from '../models/preference.model';
import { logger } from '../../../shared/src/utils/logger.util';
import { notificationConfig } from '../config';

/**
 * Determines the appropriate priority level for a notification based on its type
 * 
 * @param type - The notification type
 * @returns The priority level for the notification
 */
export function getNotificationPriority(type: NotificationType): NotificationPriority {
  switch (type) {
    case NotificationType.TRIBE_INVITATION:
    case NotificationType.TRIBE_MATCH:
      return NotificationPriority.HIGH; // Important for user engagement

    case NotificationType.EVENT_REMINDER:
      return NotificationPriority.HIGH; // Time-sensitive

    case NotificationType.PAYMENT_REQUEST:
      return NotificationPriority.HIGH; // Financial implications

    case NotificationType.ACHIEVEMENT_UNLOCKED:
      return NotificationPriority.MEDIUM; // Positive engagement but not urgent
      
    case NotificationType.AI_ENGAGEMENT_PROMPT:
      return NotificationPriority.MEDIUM; // Engagement-oriented but not critical
      
    case NotificationType.SYSTEM_ANNOUNCEMENT:
      return NotificationPriority.MEDIUM; // Important platform information
      
    default:
      return NotificationPriority.MEDIUM; // Default priority for other notification types
  }
}

/**
 * Formats the notification title based on notification type and content
 * 
 * @param type - The notification type
 * @param rawTitle - The raw title (if provided)
 * @param metadata - Additional metadata for title formatting
 * @returns Formatted notification title
 */
export function formatNotificationTitle(
  type: NotificationType,
  rawTitle: string,
  metadata: Record<string, any> = {}
): string {
  // If a title is explicitly provided, use it
  if (rawTitle && rawTitle.trim().length > 0) {
    return rawTitle;
  }

  // Generate default titles based on notification type
  switch (type) {
    case NotificationType.TRIBE_INVITATION:
      return metadata.tribeName 
        ? `Invitation to join "${metadata.tribeName}"`
        : 'New Tribe Invitation';
      
    case NotificationType.TRIBE_MATCH:
      return metadata.tribeName 
        ? `New Tribe Match: ${metadata.tribeName}`
        : 'New Tribe Match Found!';
      
    case NotificationType.EVENT_REMINDER:
      return metadata.eventName 
        ? `Reminder: ${metadata.eventName}`
        : 'Upcoming Event Reminder';
      
    case NotificationType.ACHIEVEMENT_UNLOCKED:
      return metadata.achievementName 
        ? `Achievement Unlocked: ${metadata.achievementName}!`
        : 'Achievement Unlocked!';
      
    case NotificationType.AI_ENGAGEMENT_PROMPT:
      return 'New Activity Suggestion';
      
    case NotificationType.TRIBE_CHAT:
      return metadata.senderName && metadata.tribeName
        ? `${metadata.senderName} in ${metadata.tribeName}`
        : 'New message in your Tribe';

    case NotificationType.PAYMENT_REQUEST:
      return 'Payment Request';

    case NotificationType.PAYMENT_CONFIRMATION:
      return 'Payment Confirmed';

    case NotificationType.SYSTEM_ANNOUNCEMENT:
      return 'Tribe Announcement';
      
    default:
      // Fallback to a generic title with the type
      return `Tribe Notification: ${type.replace(/_/g, ' ').toLowerCase()}`;
  }
}

/**
 * Formats the notification body based on notification type and content
 * 
 * @param type - The notification type
 * @param rawBody - The raw body (if provided)
 * @param metadata - Additional metadata for body formatting
 * @returns Formatted notification body
 */
export function formatNotificationBody(
  type: NotificationType,
  rawBody: string,
  metadata: Record<string, any> = {}
): string {
  // If a body is explicitly provided, use it
  if (rawBody && rawBody.trim().length > 0) {
    return rawBody;
  }

  // Generate default bodies based on notification type and metadata
  switch (type) {
    case NotificationType.TRIBE_INVITATION:
      if (metadata.inviterName && metadata.tribeName) {
        return `${metadata.inviterName} has invited you to join "${metadata.tribeName}". Join now to connect with like-minded people!`;
      }
      return 'You have been invited to join a new Tribe. Join now to connect with like-minded people!';
      
    case NotificationType.TRIBE_MATCH:
      if (metadata.tribeName && metadata.matchPercentage) {
        return `We found a great match for you! "${metadata.tribeName}" is ${metadata.matchPercentage}% compatible with your interests and personality.`;
      }
      return 'We found a Tribe that matches your interests and personality. Join now to connect with like-minded people!';
      
    case NotificationType.EVENT_REMINDER:
      if (metadata.eventName && metadata.eventTime && metadata.eventLocation) {
        return `Reminder: "${metadata.eventName}" is happening on ${new Date(metadata.eventTime).toLocaleString()} at ${metadata.eventLocation}.`;
      } else if (metadata.eventName) {
        return `Don't forget about ${metadata.eventName}! Check the event details in the app.`;
      }
      return 'You have an upcoming event. Check the details in the app!';
      
    case NotificationType.ACHIEVEMENT_UNLOCKED:
      if (metadata.achievementName && metadata.achievementDescription) {
        return `Congratulations! You've earned the "${metadata.achievementName}" achievement. ${metadata.achievementDescription}`;
      }
      return 'Congratulations! You\'ve unlocked a new achievement. Check your profile to see your accomplishment!';
      
    case NotificationType.AI_ENGAGEMENT_PROMPT:
      if (metadata.promptText) {
        return metadata.promptText;
      }
      return 'We have a new suggestion for your Tribe that might spark interesting conversations or activities.';
      
    case NotificationType.TRIBE_CHAT:
      if (metadata.senderName && metadata.messagePreview) {
        return `${metadata.senderName}: ${metadata.messagePreview}`;
      }
      return 'You have a new message in your Tribe chat.';

    case NotificationType.PAYMENT_REQUEST:
      if (metadata.amount && metadata.requesterName) {
        return `${metadata.requesterName} has requested a payment of ${metadata.amount} for ${metadata.reason || 'an event'}.`;
      }
      return 'You have a new payment request. Check the app for details.';

    case NotificationType.PAYMENT_CONFIRMATION:
      if (metadata.amount) {
        return `Your payment of ${metadata.amount} has been confirmed.`;
      }
      return 'Your payment has been successfully processed.';

    case NotificationType.SYSTEM_ANNOUNCEMENT:
      return metadata.announcementText || 'There is an important announcement from Tribe. Check the app for details.';
      
    default:
      // Fallback to a generic message
      return 'You have a new notification from Tribe. Open the app to see the details.';
  }
}

/**
 * Generates a deep link URL for the notification action
 * 
 * @param type - The notification type
 * @param metadata - Additional metadata for URL generation
 * @returns Action URL for the notification
 */
export function generateActionUrl(
  type: NotificationType,
  metadata: Record<string, any> = {}
): string {
  const baseUrl = notificationConfig.baseUrl || 'https://tribe-app.com';
  let path = '';
  
  switch (type) {
    case NotificationType.TRIBE_INVITATION:
    case NotificationType.TRIBE_MATCH:
      if (metadata.tribeId) {
        path = `/tribes/${metadata.tribeId}`;
      } else {
        path = '/discover';
      }
      break;
      
    case NotificationType.EVENT_REMINDER:
      if (metadata.eventId) {
        path = `/events/${metadata.eventId}`;
      } else {
        path = '/events';
      }
      break;
      
    case NotificationType.ACHIEVEMENT_UNLOCKED:
      path = '/profile/achievements';
      break;
      
    case NotificationType.AI_ENGAGEMENT_PROMPT:
      if (metadata.tribeId) {
        path = `/tribes/${metadata.tribeId}/chat`;
        if (metadata.promptId) {
          path += `?promptId=${metadata.promptId}`;
        }
      } else {
        path = '/home';
      }
      break;
      
    case NotificationType.TRIBE_CHAT:
      if (metadata.tribeId) {
        path = `/tribes/${metadata.tribeId}/chat`;
        if (metadata.messageId) {
          path += `?messageId=${metadata.messageId}`;
        }
      } else {
        path = '/chat';
      }
      break;
      
    case NotificationType.PAYMENT_REQUEST:
    case NotificationType.PAYMENT_CONFIRMATION:
      if (metadata.paymentId) {
        path = `/payments/${metadata.paymentId}`;
      } else {
        path = '/payments';
      }
      break;
      
    case NotificationType.SYSTEM_ANNOUNCEMENT:
      if (metadata.announcementId) {
        path = `/announcements/${metadata.announcementId}`;
      } else {
        path = '/announcements';
      }
      break;
      
    default:
      path = '/notifications';
      break;
  }
  
  // Add any additional query parameters
  if (metadata.queryParams && typeof metadata.queryParams === 'object') {
    const queryString = Object.entries(metadata.queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
      
    if (queryString) {
      path += path.includes('?') ? `&${queryString}` : `?${queryString}`;
    }
  }
  
  return `${baseUrl}${path}`;
}

/**
 * Calculates the expiration date for a notification based on its type
 * 
 * @param type - The notification type
 * @param eventDate - Optional event date for event-related notifications
 * @returns Expiration date for the notification
 */
export function calculateExpirationDate(
  type: NotificationType,
  eventDate?: Date
): Date {
  const now = new Date();
  let expirationDays = notificationConfig.defaultExpirationDays || 30;
  
  switch (type) {
    case NotificationType.EVENT_REMINDER:
      // Event reminders should expire after the event occurs
      if (eventDate && eventDate > now) {
        // If eventDate is provided and is in the future, use it as expiration
        return new Date(eventDate);
      } else {
        // Otherwise expire in 1 day
        expirationDays = 1;
      }
      break;
      
    case NotificationType.TRIBE_INVITATION:
      // Invitations should expire after 7 days
      expirationDays = 7;
      break;
      
    case NotificationType.TRIBE_MATCH:
      // Matches should expire after 14 days if no action taken
      expirationDays = 14;
      break;
      
    case NotificationType.AI_ENGAGEMENT_PROMPT:
      // Engagement prompts should expire after 3 days (time-sensitive)
      expirationDays = 3;
      break;
      
    case NotificationType.ACHIEVEMENT_UNLOCKED:
      // Achievements notifications can stay longer
      expirationDays = 60;
      break;
      
    case NotificationType.PAYMENT_REQUEST:
      // Payment requests expire after 7 days
      expirationDays = 7;
      break;
      
    case NotificationType.TRIBE_CHAT:
      // Chat notifications expire relatively quickly
      expirationDays = 2;
      break;
      
    case NotificationType.SYSTEM_ANNOUNCEMENT:
      // Announcements stay longer
      expirationDays = 30;
      break;
      
    default:
      // Use default expiration for other notification types
      break;
  }
  
  const expirationDate = new Date(now);
  expirationDate.setDate(expirationDate.getDate() + expirationDays);
  
  return expirationDate;
}

/**
 * Retrieves the delivery channels for a user based on notification type and preferences
 * 
 * @param userId - The user ID
 * @param type - The notification type
 * @returns Promise resolving to array of delivery channels for the notification
 */
export async function getUserNotificationChannels(
  userId: string,
  type: NotificationType
): Promise<DeliveryChannel[]> {
  try {
    // Get user's preferred channels from database
    const userChannels = await Preference.getChannelsForUserAndType(userId, type);
    
    // If user has preferences, return them
    if (userChannels && userChannels.length > 0) {
      logger.debug(`Using user-defined channels for user ${userId} and type ${type}`, { 
        channels: userChannels 
      });
      return userChannels;
    }
    
    // Otherwise, fall back to default channels for this notification type
    const defaultChannels = getDefaultChannelsForType(type);
    logger.debug(`Using default channels for user ${userId} and type ${type}`, { 
      channels: defaultChannels 
    });
    
    return defaultChannels;
  } catch (error) {
    logger.error('Error getting user notification channels', error as Error, {
      userId,
      notificationType: type
    });
    
    // Fall back to in-app only in case of error
    return [DeliveryChannel.IN_APP];
  }
}

/**
 * Validates notification data for required fields and formats
 * 
 * @param data - The notification data to validate
 * @returns Whether the notification data is valid
 */
export function validateNotificationData(data: INotificationCreate): boolean {
  // Check that userId is provided
  if (!data.userId || typeof data.userId !== 'string' || data.userId.trim() === '') {
    logger.error('Invalid notification data: userId is required', { data });
    return false;
  }
  
  // Check that type is a valid NotificationType
  if (!data.type || !Object.values(NotificationType).includes(data.type)) {
    logger.error('Invalid notification data: invalid notification type', { 
      data, 
      validTypes: Object.values(NotificationType) 
    });
    return false;
  }
  
  // Check that title or body is provided (at least one is required)
  if ((!data.title || data.title.trim() === '') && 
      (!data.body || data.body.trim() === '')) {
    logger.error('Invalid notification data: title or body is required', { data });
    return false;
  }
  
  // Validate type-specific required fields in metadata
  if (data.type === NotificationType.EVENT_REMINDER) {
    // For event reminders, eventId should be provided
    if (!data.eventId) {
      logger.warn('Event reminder notification missing eventId', { data });
      // Don't fail validation for this, but log a warning
    }
  }
  
  // Add other type-specific validations as needed
  
  return true;
}

/**
 * Enriches notification data with default values and formatted content
 * 
 * @param data - The notification data to enrich
 * @returns Promise resolving to enriched notification data
 */
export async function enrichNotificationData(
  data: INotificationCreate
): Promise<INotificationCreate> {
  // Set default priority if not provided
  if (!data.priority) {
    data.priority = getNotificationPriority(data.type);
  }
  
  // Format title and body if needed
  const metadata = data.metadata || {};
  
  if (!data.title || data.title.trim() === '') {
    data.title = formatNotificationTitle(data.type, '', metadata);
  }
  
  if (!data.body || data.body.trim() === '') {
    data.body = formatNotificationBody(data.type, '', metadata);
  }
  
  // Generate action URL if not provided
  if (!data.actionUrl) {
    data.actionUrl = generateActionUrl(data.type, {
      ...metadata,
      tribeId: data.tribeId,
      eventId: data.eventId
    });
  }
  
  // Calculate expiration date if not provided
  if (!data.expiresAt) {
    data.expiresAt = calculateExpirationDate(
      data.type, 
      metadata.eventDate ? new Date(metadata.eventDate) : undefined
    );
  }
  
  // Update metadata with additional context if needed
  if (!data.metadata) {
    data.metadata = {};
  }
  
  // Add timestamp for tracking
  data.metadata.enrichedAt = new Date().toISOString();
  
  return data;
}