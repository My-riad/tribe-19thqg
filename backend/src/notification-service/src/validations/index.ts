/**
 * Centralized exports for notification service validation modules.
 * This barrel file simplifies imports by providing a single entry point
 * for all validation schemas and middleware used throughout the notification service.
 * 
 * @module validations
 */

// Import all validation schemas and functions from notification validation module
import * as notificationValidation from './notification.validation';

// Import all validation middleware from preference validation module
import * as preferenceValidation from './preference.validation';

// Re-export notification schemas
export const createNotificationSchema = notificationValidation.createNotificationSchema;
export const getNotificationsSchema = notificationValidation.getNotificationsSchema;
export const notificationIdSchema = notificationValidation.notificationIdSchema;
export const bulkCreateNotificationSchema = notificationValidation.bulkCreateNotificationSchema;
export const tribeNotificationSchema = notificationValidation.tribeNotificationSchema;
export const markAsReadSchema = notificationValidation.markAsReadSchema;
export const deliveryStatsSchema = notificationValidation.deliveryStatsSchema;

// Re-export notification validation functions
export const validateCreateNotification = notificationValidation.validateCreateNotification;
export const validateGetNotifications = notificationValidation.validateGetNotifications;
export const validateNotificationId = notificationValidation.validateNotificationId;
export const validateBulkCreateNotification = notificationValidation.validateBulkCreateNotification;
export const validateTribeNotification = notificationValidation.validateTribeNotification;
export const validateMarkAsRead = notificationValidation.validateMarkAsRead;
export const validateDeliveryStats = notificationValidation.validateDeliveryStats;

// Re-export preference validation middleware
export const validateCreatePreference = preferenceValidation.validateCreatePreference;
export const validateUpdatePreference = preferenceValidation.validateUpdatePreference;
export const validateGetPreferences = preferenceValidation.validateGetPreferences;
export const validatePreferenceId = preferenceValidation.validatePreferenceId;
export const validateBulkUpdatePreferences = preferenceValidation.validateBulkUpdatePreferences;
export const validateToggleNotificationType = preferenceValidation.validateToggleNotificationType;
export const validateUpdateChannels = preferenceValidation.validateUpdateChannels;