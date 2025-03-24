/**
 * Central export file for all Notification Service models
 * 
 * This file aggregates all model exports to provide a centralized 
 * import point for other parts of the notification service.
 */

// Import and re-export the Notification model and its interface
import { Notification, INotificationDocument } from './notification.model';

// Import and re-export the Delivery model and its interface
import { Delivery, IDeliveryDocument } from './delivery.model';

// Import and re-export the Preference model and its interface
import { Preference, IPreferenceDocument } from './preference.model';

// Export all models and interfaces
export {
  // Notification model for CRUD operations on notifications
  Notification,
  INotificationDocument,
  
  // Delivery model for tracking notification delivery status
  Delivery,
  IDeliveryDocument,
  
  // Preference model for user notification preferences
  Preference,
  IPreferenceDocument
};