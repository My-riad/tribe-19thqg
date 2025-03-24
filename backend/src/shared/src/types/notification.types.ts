/**
 * Types of notifications that can be sent to users in the Tribe platform
 */
export enum NotificationType {
  TRIBE_INVITATION = 'TRIBE_INVITATION',
  TRIBE_MATCH = 'TRIBE_MATCH',
  TRIBE_UPDATE = 'TRIBE_UPDATE',
  TRIBE_CHAT = 'TRIBE_CHAT',
  EVENT_INVITATION = 'EVENT_INVITATION',
  EVENT_REMINDER = 'EVENT_REMINDER',
  EVENT_UPDATE = 'EVENT_UPDATE',
  EVENT_RSVP = 'EVENT_RSVP',
  AI_ENGAGEMENT_PROMPT = 'AI_ENGAGEMENT_PROMPT',
  AI_ACTIVITY_SUGGESTION = 'AI_ACTIVITY_SUGGESTION',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  PAYMENT_REQUEST = 'PAYMENT_REQUEST',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT'
}

/**
 * Priority levels for notifications to determine delivery urgency
 */
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/**
 * Possible statuses of a notification through its lifecycle
 */
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

/**
 * Channels through which notifications can be delivered to users
 */
export enum DeliveryChannel {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  SMS = 'SMS'
}

/**
 * Core notification data structure containing all notification details
 */
export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: Date;
  expiresAt: Date | null;
  tribeId: string | null;
  eventId: string | null;
  actionUrl: string | null;
  imageUrl: string | null;
  metadata: Record<string, any> | null;
}

/**
 * Tracks the delivery status of a notification across different channels
 */
export interface INotificationDelivery {
  id: string;
  notificationId: string;
  channel: DeliveryChannel;
  status: NotificationStatus;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  errorMessage: string | null;
  retryCount: number;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User preferences for notification types and delivery channels
 */
export interface INotificationPreference {
  id: string;
  userId: string;
  notificationType: NotificationType;
  enabled: boolean;
  channels: DeliveryChannel[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data structure for creating a new notification
 */
export interface INotificationCreate {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  expiresAt: Date | null;
  tribeId: string | null;
  eventId: string | null;
  actionUrl: string | null;
  imageUrl: string | null;
  metadata: Record<string, any> | null;
}

/**
 * Data structure for updating an existing notification
 */
export interface INotificationUpdate {
  status: NotificationStatus;
  expiresAt: Date | null;
  actionUrl: string | null;
  metadata: Record<string, any> | null;
}

/**
 * Data structure for updating notification preferences
 */
export interface INotificationPreferenceUpdate {
  enabled: boolean;
  channels: DeliveryChannel[];
}

/**
 * Data structure for creating notifications for multiple users simultaneously
 */
export interface IBulkNotificationCreate {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  expiresAt: Date | null;
  tribeId: string | null;
  eventId: string | null;
  actionUrl: string | null;
  imageUrl: string | null;
  metadata: Record<string, any> | null;
}

/**
 * Data structure for creating notifications for all members of a tribe
 */
export interface ITribeNotificationCreate {
  tribeId: string;
  excludeUserIds: string[] | null;
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  expiresAt: Date | null;
  eventId: string | null;
  actionUrl: string | null;
  imageUrl: string | null;
  metadata: Record<string, any> | null;
}

/**
 * Data structure for notification data returned to clients
 */
export interface INotificationResponse {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: Date;
  expiresAt: Date | null;
  tribeId: string | null;
  eventId: string | null;
  actionUrl: string | null;
  imageUrl: string | null;
  metadata: Record<string, any> | null;
  isRead: boolean;
}

/**
 * Summary counts of notifications for a user
 */
export interface INotificationCountResponse {
  total: number;
  unread: number;
}

/**
 * Parameters for searching and filtering notifications
 */
export interface INotificationSearchParams {
  userId: string;
  type: NotificationType | null;
  status: NotificationStatus | null;
  tribeId: string | null;
  eventId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  limit: number;
  offset: number;
}

/**
 * Statistics about notification delivery performance
 */
export interface IDeliveryStats {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  averageDeliveryTime: number; // in milliseconds
}

/**
 * Delivery statistics broken down by channel
 */
export interface IChannelDeliveryStats {
  channel: DeliveryChannel;
  stats: IDeliveryStats;
}