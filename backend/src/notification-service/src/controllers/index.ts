import { notificationController } from './notification.controller';
import {
  getDeliveryById,
  getDeliveriesByNotification,
  getDeliveryByNotificationAndChannel,
  createDelivery,
  updateDeliveryStatus,
  markDeliveryAsRead,
  retryFailedDeliveries,
  getDeliveryStats,
  getDeliveryStatsByChannel,
  cleanupOldDeliveries
} from './delivery.controller';
import {
  getUserPreferences,
  getUserPreferenceByType,
  createPreference,
  updatePreference,
  deletePreference,
  bulkUpdatePreferences,
  toggleNotificationType,
  updateChannels,
  ensureUserPreferences,
  resetToDefaults
} from './preference.controller';

/**
 * Index file that exports all controllers from the notification service.
 * This file serves as a central export point for notification, delivery, and preference controllers
 * to simplify imports in other parts of the application.
 */

export {
  notificationController,
  getDeliveryById,
  getDeliveriesByNotification,
  getDeliveryByNotificationAndChannel,
  createDelivery,
  updateDeliveryStatus,
  markDeliveryAsRead,
  retryFailedDeliveries,
  getDeliveryStats,
  getDeliveryStatsByChannel,
  cleanupOldDeliveries,
  getUserPreferences,
  getUserPreferenceByType,
  createPreference,
  updatePreference,
  deletePreference,
  bulkUpdatePreferences,
  toggleNotificationType,
  updateChannels,
  ensureUserPreferences,
  resetToDefaults
};