import { httpClient } from './httpClient';
import { API_PATHS } from '../constants/apiPaths';
import { 
  Notification, 
  NotificationPreference, 
  NotificationFilter, 
  NotificationResponse 
} from '../types/notification.types';
import { PaginationParams } from '../types/api.types';

/**
 * Fetches notifications for the current user with optional filtering and pagination
 * @param filter Optional filters to apply to the notification query
 * @param pagination Optional pagination parameters
 * @returns Promise resolving to notification data including notifications array and counts
 */
const getNotifications = async (
  filter?: NotificationFilter,
  pagination?: PaginationParams
): Promise<NotificationResponse> => {
  const response = await httpClient.get<NotificationResponse>(
    API_PATHS.NOTIFICATION.GET_ALL,
    { ...filter, ...pagination }
  );
  return response.data;
};

/**
 * Fetches a specific notification by its ID
 * @param id Notification ID
 * @returns Promise resolving to the requested notification
 */
const getNotificationById = async (id: string): Promise<{ notification: Notification }> => {
  const url = API_PATHS.NOTIFICATION.GET_BY_ID.replace(':id', id);
  const response = await httpClient.get<{ notification: Notification }>(url);
  return response.data;
};

/**
 * Marks a specific notification as read
 * @param id Notification ID
 * @returns Promise resolving to success status
 */
const markAsRead = async (id: string): Promise<{ success: boolean }> => {
  const url = API_PATHS.NOTIFICATION.MARK_READ.replace(':id', id);
  const response = await httpClient.put<{ success: boolean }>(url, {});
  return response.data;
};

/**
 * Marks all notifications as read for the current user
 * @returns Promise resolving to success status and count of updated notifications
 */
const markAllAsRead = async (): Promise<{ success: boolean; count: number }> => {
  const url = API_PATHS.NOTIFICATION.MARK_READ.replace(':id', 'all');
  const response = await httpClient.put<{ success: boolean; count: number }>(url, {});
  return response.data;
};

/**
 * Fetches the current user's notification preferences
 * @returns Promise resolving to notification preferences
 */
const getNotificationPreferences = async (): Promise<{ preferences: NotificationPreference[] }> => {
  const response = await httpClient.get<{ preferences: NotificationPreference[] }>(
    API_PATHS.NOTIFICATION.PREFERENCES
  );
  return response.data;
};

/**
 * Updates the current user's notification preferences
 * @param preferences Array of notification preference settings
 * @returns Promise resolving to success status and updated preferences
 */
const updateNotificationPreferences = async (
  preferences: NotificationPreference[]
): Promise<{ success: boolean; preferences: NotificationPreference[] }> => {
  const response = await httpClient.put<{ success: boolean; preferences: NotificationPreference[] }>(
    API_PATHS.NOTIFICATION.PREFERENCES,
    { preferences }
  );
  return response.data;
};

/**
 * Subscribes the current device to push notifications
 * @param subscription Subscription object with device token and platform information
 * @returns Promise resolving to success status
 */
const subscribeToPushNotifications = async (
  subscription: object
): Promise<{ success: boolean }> => {
  const response = await httpClient.post<{ success: boolean }>(
    API_PATHS.NOTIFICATION.SUBSCRIBE,
    subscription
  );
  return response.data;
};

/**
 * Unsubscribes the current device from push notifications
 * @param deviceId Device identifier to unsubscribe
 * @returns Promise resolving to success status
 */
const unsubscribeFromPushNotifications = async (
  deviceId: string
): Promise<{ success: boolean }> => {
  const response = await httpClient.delete<{ success: boolean }>(
    API_PATHS.NOTIFICATION.UNSUBSCRIBE,
    { params: { deviceId } }
  );
  return response.data;
};

/**
 * Deletes a specific notification
 * @param id Notification ID
 * @returns Promise resolving to success status
 */
const deleteNotification = async (id: string): Promise<{ success: boolean }> => {
  const url = API_PATHS.NOTIFICATION.GET_BY_ID.replace(':id', id);
  const response = await httpClient.delete<{ success: boolean }>(url);
  return response.data;
};

export const notificationApi = {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  deleteNotification
};