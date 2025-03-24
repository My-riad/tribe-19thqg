/**
 * TypeScript type definitions for notification-related data structures in the Tribe application.
 * This file defines interfaces and enums for notifications, notification preferences, and
 * notification state management to support reliable delivery of system and AI-generated
 * communications to users.
 */

import { User } from './auth.types';
import { Tribe } from './tribe.types';
import { Event } from './event.types';

/**
 * Enum defining different types of notifications in the application
 */
export enum NotificationType {
  // Tribe-related notifications
  TRIBE_MATCH = 'TRIBE_MATCH',         // AI has matched user with a compatible tribe
  TRIBE_INVITATION = 'TRIBE_INVITATION', // User invited to join a tribe
  TRIBE_UPDATE = 'TRIBE_UPDATE',       // Updates to tribe information or status
  
  // Event-related notifications
  EVENT_REMINDER = 'EVENT_REMINDER',   // Reminder for upcoming event
  EVENT_INVITATION = 'EVENT_INVITATION', // Invitation to an event
  EVENT_UPDATE = 'EVENT_UPDATE',       // Changes to event details
  
  // Communication notifications
  CHAT_MESSAGE = 'CHAT_MESSAGE',       // New message in tribe chat
  
  // AI-driven engagement notifications
  AI_SUGGESTION = 'AI_SUGGESTION',     // AI-generated conversation prompts, challenges, or activity suggestions
  
  // Achievement notifications
  ACHIEVEMENT = 'ACHIEVEMENT',         // User earned an achievement
  
  // System notifications
  SYSTEM = 'SYSTEM'                    // General system notifications
}

/**
 * Enum defining different channels through which notifications can be delivered
 */
export enum NotificationChannel {
  PUSH = 'PUSH',     // Mobile push notifications
  EMAIL = 'EMAIL',   // Email notifications
  IN_APP = 'IN_APP'  // In-app notifications
}

/**
 * Enum defining priority levels for notifications
 */
export enum NotificationPriority {
  HIGH = 'HIGH',     // Urgent, time-sensitive notifications
  MEDIUM = 'MEDIUM', // Standard priority notifications
  LOW = 'LOW'        // Informational notifications
}

/**
 * Interface defining the structure of a notification object
 */
export interface Notification {
  id: string;                      // Unique identifier
  type: NotificationType;          // Type of notification
  title: string;                   // Notification title
  message: string;                 // Notification message
  isRead: boolean;                 // Whether the notification has been read
  createdAt: Date;                 // When the notification was created
  sender: User | null;             // User who triggered the notification (null for system/AI)
  priority: NotificationPriority;  // Notification priority
  payload: NotificationPayload;    // Additional data related to the notification
  actionUrl: string | null;        // Deep link URL for the notification action
  imageUrl: string | null;         // Optional image to display with notification
}

/**
 * Type defining the possible payload structures for different notification types
 * Each notification type can include different data in its payload
 */
export type NotificationPayload = {
  // Properties selected based on notification type
  tribeId?: string;        // For tribe-related notifications
  tribe?: Tribe;           // Denormalized tribe data
  eventId?: string;        // For event-related notifications
  event?: Event;           // Denormalized event data
  achievementId?: string;  // For achievement notifications
  suggestionType?: string; // For AI suggestion notifications (e.g., "conversation", "activity")
  data?: any;              // Flexible field for additional data
};

/**
 * Interface defining user preferences for notification delivery
 */
export interface NotificationPreference {
  type: NotificationType;          // Notification type
  enabled: boolean;                // Whether this type is enabled
  channels: {                      // Delivery channels for this notification type
    push: boolean;                 // Enable push notifications
    email: boolean;                // Enable email notifications
    inApp: boolean;                // Enable in-app notifications
  };
}

/**
 * Interface defining filter options for querying notifications
 */
export interface NotificationFilter {
  type?: NotificationType | NotificationType[];  // Filter by notification type(s)
  isRead?: boolean;                             // Filter by read status
  startDate?: Date;                             // Filter by date range (start)
  endDate?: Date;                               // Filter by date range (end)
  priority?: NotificationPriority;              // Filter by priority
}

/**
 * Interface defining the structure of notification API responses
 */
export interface NotificationResponse {
  notifications: Notification[];   // Array of notifications
  totalCount: number;              // Total number of notifications (for pagination)
  unreadCount: number;             // Number of unread notifications
}

/**
 * Interface defining the structure of notification state in the Redux store
 */
export interface NotificationState {
  notifications: Notification[];           // List of user's notifications
  unreadCount: number;                     // Count of unread notifications
  preferences: NotificationPreference[];   // User's notification preferences
  loading: boolean;                        // Loading state for notification operations
  error: string | null;                    // Error message if any
}