import { notificationService } from './notification.service'; // Provides functionality for creating, sending, and managing notifications
import { deliveryService } from './delivery.service'; // Provides functionality for tracking and managing notification delivery across different channels
import { preferenceService } from './preference.service'; // Provides functionality for managing user notification preferences

/**
 * Exports all service instances from the notification service module, providing a centralized access point for notification-related functionality including notification management, delivery tracking, and user preferences.
 */
export {
  notificationService, // Provides functionality for creating, sending, and managing notifications
  deliveryService, // Provides functionality for tracking and managing notification delivery across different channels
  preferenceService // Provides functionality for managing user notification preferences
};