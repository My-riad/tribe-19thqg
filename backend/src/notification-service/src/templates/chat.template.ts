/**
 * Chat notification templates
 * 
 * This file provides standardized templates for generating chat-related notifications
 * in the Tribe platform, including new messages, mentions, AI prompt responses, and
 * reminders for inactive conversations.
 * 
 * @version 1.0.0
 */

import { NotificationType, NotificationPriority, INotificationCreate } from '../../../shared/src/types/notification.types';
import { MessageType } from '../../../shared/src/types/tribe.types';

/**
 * Creates a notification for a new chat message in a tribe
 * 
 * @param userId The ID of the user receiving the notification
 * @param tribeId The ID of the tribe where the message was sent
 * @param senderName The name of the user who sent the message
 * @param tribeName The name of the tribe
 * @param messageContent The content of the message
 * @param metadata Additional metadata for the notification
 * @returns A formatted notification creation payload
 */
export function createNewChatMessageNotification(
  userId: string,
  tribeId: string,
  senderName: string,
  tribeName: string,
  messageContent: string,
  metadata: Record<string, any>
): INotificationCreate {
  const sanitizedContent = sanitizeMessageContent(messageContent);
  const truncatedContent = truncateMessage(sanitizedContent, 100);

  return {
    userId,
    type: NotificationType.TRIBE_CHAT,
    title: `${senderName} in ${tribeName}`,
    body: truncatedContent,
    priority: NotificationPriority.MEDIUM,
    expiresAt: null,
    tribeId,
    eventId: null,
    actionUrl: `/tribes/${tribeId}/chat`,
    imageUrl: null,
    metadata: {
      messageType: MessageType.TEXT,
      senderId: metadata.senderId,
      messageId: metadata.messageId,
      ...metadata
    }
  };
}

/**
 * Creates a notification when a user is mentioned in a chat message
 * 
 * @param userId The ID of the mentioned user
 * @param tribeId The ID of the tribe where the mention occurred
 * @param senderName The name of the user who mentioned
 * @param tribeName The name of the tribe
 * @param messageContent The content of the message
 * @param metadata Additional metadata for the notification
 * @returns A formatted notification creation payload
 */
export function createMentionNotification(
  userId: string,
  tribeId: string,
  senderName: string,
  tribeName: string,
  messageContent: string,
  metadata: Record<string, any>
): INotificationCreate {
  const sanitizedContent = sanitizeMessageContent(messageContent);
  const truncatedContent = truncateMessage(sanitizedContent, 100);

  return {
    userId,
    type: NotificationType.TRIBE_CHAT,
    title: `${senderName} mentioned you in ${tribeName}`,
    body: truncatedContent,
    priority: NotificationPriority.HIGH, // Higher priority for mentions
    expiresAt: null,
    tribeId,
    eventId: null,
    actionUrl: `/tribes/${tribeId}/chat?highlight=${metadata.messageId}`,
    imageUrl: null,
    metadata: {
      messageType: MessageType.TEXT,
      senderId: metadata.senderId,
      messageId: metadata.messageId,
      isMention: true,
      ...metadata
    }
  };
}

/**
 * Creates a notification when all members of a tribe are mentioned
 * 
 * @param userId The ID of the user receiving the notification
 * @param tribeId The ID of the tribe where the group mention occurred
 * @param senderName The name of the user who mentioned the group
 * @param tribeName The name of the tribe
 * @param messageContent The content of the message
 * @param metadata Additional metadata for the notification
 * @returns A formatted notification creation payload
 */
export function createGroupMentionNotification(
  userId: string,
  tribeId: string,
  senderName: string,
  tribeName: string,
  messageContent: string,
  metadata: Record<string, any>
): INotificationCreate {
  const sanitizedContent = sanitizeMessageContent(messageContent);
  const truncatedContent = truncateMessage(sanitizedContent, 100);

  return {
    userId,
    type: NotificationType.TRIBE_CHAT,
    title: `${senderName} mentioned everyone in ${tribeName}`,
    body: truncatedContent,
    priority: NotificationPriority.MEDIUM,
    expiresAt: null,
    tribeId,
    eventId: null,
    actionUrl: `/tribes/${tribeId}/chat?highlight=${metadata.messageId}`,
    imageUrl: null,
    metadata: {
      messageType: MessageType.TEXT,
      senderId: metadata.senderId,
      messageId: metadata.messageId,
      isGroupMention: true,
      ...metadata
    }
  };
}

/**
 * Creates a notification when an AI prompt receives responses in a chat
 * 
 * @param userId The ID of the user receiving the notification
 * @param tribeId The ID of the tribe
 * @param tribeName The name of the tribe
 * @param promptContent The content of the AI prompt
 * @param responseCount The number of responses to the prompt
 * @param metadata Additional metadata for the notification
 * @returns A formatted notification creation payload
 */
export function createAIPromptResponseNotification(
  userId: string,
  tribeId: string,
  tribeName: string,
  promptContent: string,
  responseCount: number,
  metadata: Record<string, any>
): INotificationCreate {
  const sanitizedContent = sanitizeMessageContent(promptContent);
  const truncatedContent = truncateMessage(sanitizedContent, 75);

  return {
    userId,
    type: NotificationType.TRIBE_CHAT,
    title: `Responses to AI prompt in ${tribeName}`,
    body: `"${truncatedContent}" has received ${responseCount} response${responseCount !== 1 ? 's' : ''}`,
    priority: NotificationPriority.MEDIUM,
    expiresAt: null,
    tribeId,
    eventId: null,
    actionUrl: `/tribes/${tribeId}/chat?highlight=${metadata.promptMessageId}`,
    imageUrl: null,
    metadata: {
      messageType: MessageType.AI_PROMPT,
      promptMessageId: metadata.promptMessageId,
      responseCount,
      ...metadata
    }
  };
}

/**
 * Creates a reminder notification for inactive chat conversations
 * 
 * @param userId The ID of the user receiving the notification
 * @param tribeId The ID of the tribe with the inactive chat
 * @param tribeName The name of the tribe
 * @param inactiveDays Number of days the chat has been inactive
 * @param metadata Additional metadata for the notification
 * @returns A formatted notification creation payload
 */
export function createChatActivityReminderNotification(
  userId: string,
  tribeId: string,
  tribeName: string,
  inactiveDays: number,
  metadata: Record<string, any>
): INotificationCreate {
  return {
    userId,
    type: NotificationType.TRIBE_CHAT,
    title: `It's been quiet in ${tribeName}`,
    body: `The conversation has been inactive for ${inactiveDays} day${inactiveDays !== 1 ? 's' : ''}. How about reconnecting with your tribe?`,
    priority: NotificationPriority.LOW, // Lower priority for reminders
    expiresAt: null,
    tribeId,
    eventId: null,
    actionUrl: `/tribes/${tribeId}/chat`,
    imageUrl: null,
    metadata: {
      reminderType: 'chat_activity',
      inactiveDays,
      ...metadata
    }
  };
}

/**
 * Helper function to truncate message content to a specified length
 * 
 * @param message The message to truncate
 * @param maxLength The maximum length
 * @returns Truncated message with ellipsis if needed
 */
function truncateMessage(message: string, maxLength: number): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength - 3) + '...';
}

/**
 * Helper function to sanitize message content for notifications
 * 
 * @param content The content to sanitize
 * @returns Sanitized message content
 */
function sanitizeMessageContent(content: string): string {
  // Remove HTML tags if present
  let sanitized = content.replace(/<[^>]*>/g, '');
  
  // Replace multiple spaces with a single space
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Trim whitespace from beginning and end
  sanitized = sanitized.trim();
  
  return sanitized;
}