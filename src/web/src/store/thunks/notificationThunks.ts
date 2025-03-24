import { createAsyncThunk } from '@reduxjs/toolkit';
import { notificationApi } from '../../api/notificationApi';
import { 
  Notification, 
  NotificationPreference, 
  NotificationFilter
} from '../../types/notification.types';
import { PaginationParams } from '../../types/api.types';
import { RootState } from '../store';
import { notificationActions } from '../slices/notificationSlice';

/**
 * Fetches notifications for the current user with optional filtering and pagination
 * @param params Optional filter and pagination parameters
 * @returns Promise resolving to notification data including notifications array and counts
 */
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params: { filter?: NotificationFilter; pagination?: PaginationParams } = {}, { rejectWithValue }) => {
    try {
      const { filter, pagination } = params;
      const response = await notificationApi.getNotifications(filter, pagination);
      return {
        notifications: response.notifications,
        totalCount: response.totalCount,
        unreadCount: response.unreadCount
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch notifications');
    }
  }
);

/**
 * Marks a specific notification as read
 * @param id Notification ID
 * @returns Promise resolving to success status
 */
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await notificationApi.markAsRead(id);
      return response.success ? id : rejectWithValue('Failed to mark notification as read');
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error marking notification as read');
    }
  }
);

/**
 * Marks all notifications as read for the current user
 * @returns Promise resolving to success status and count of updated notifications
 */
export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.markAllAsRead();
      return {
        success: response.success,
        count: response.count
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error marking all notifications as read');
    }
  }
);

/**
 * Fetches the current user's notification preferences
 * @returns Promise resolving to notification preferences
 */
export const fetchNotificationPreferences = createAsyncThunk(
  'notifications/fetchNotificationPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getNotificationPreferences();
      return response.preferences;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch notification preferences');
    }
  }
);

/**
 * Updates the current user's notification preferences
 * @param preferences Array of notification preference settings
 * @returns Promise resolving to success status and updated preferences
 */
export const updateNotificationPreferences = createAsyncThunk(
  'notifications/updateNotificationPreferences',
  async (preferences: NotificationPreference[], { rejectWithValue }) => {
    try {
      const response = await notificationApi.updateNotificationPreferences(preferences);
      return response.preferences;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update notification preferences');
    }
  }
);

/**
 * Updates a single notification type preference
 * @param preference The notification preference to update
 * @returns Promise resolving to success status and updated preferences
 */
export const updateNotificationTypePreference = createAsyncThunk(
  'notifications/updateNotificationTypePreference',
  async (preference: NotificationPreference, { getState, rejectWithValue }) => {
    try {
      // Get current preferences
      const state = getState() as RootState;
      const currentPreferences = state.notifications.preferences;
      
      // Find and update the specific preference
      const updatedPreferences = currentPreferences.map(pref => 
        pref.type === preference.type ? preference : pref
      );
      
      // If the preference doesn't exist, add it
      if (!currentPreferences.some(pref => pref.type === preference.type)) {
        updatedPreferences.push(preference);
      }
      
      // Save all preferences
      const response = await notificationApi.updateNotificationPreferences(updatedPreferences);
      return response.preferences;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update notification preference');
    }
  }
);

/**
 * Deletes a specific notification
 * @param id Notification ID
 * @returns Promise resolving to success status
 */
export const deleteNotificationById = createAsyncThunk(
  'notifications/deleteNotificationById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await notificationApi.deleteNotification(id);
      return response.success ? id : rejectWithValue('Failed to delete notification');
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error deleting notification');
    }
  }
);

/**
 * Subscribes the current device to push notifications
 * @param subscription Subscription object with device token and platform information
 * @returns Promise resolving to success status
 */
export const subscribeToPushNotifications = createAsyncThunk(
  'notifications/subscribeToPushNotifications',
  async (subscription: object, { rejectWithValue }) => {
    try {
      const response = await notificationApi.subscribeToPushNotifications(subscription);
      return { success: response.success };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to subscribe to push notifications');
    }
  }
);

/**
 * Unsubscribes the current device from push notifications
 * @param deviceId Device identifier to unsubscribe
 * @returns Promise resolving to success status
 */
export const unsubscribeFromPushNotifications = createAsyncThunk(
  'notifications/unsubscribeFromPushNotifications',
  async (deviceId: string, { rejectWithValue }) => {
    try {
      const response = await notificationApi.unsubscribeFromPushNotifications(deviceId);
      return { success: response.success };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to unsubscribe from push notifications');
    }
  }
);

/**
 * Handles incoming push notifications and updates the store
 * Used to process real-time notifications received through Firebase or other push services
 * @param notification The notification object received from push service
 * @returns Promise that resolves when notification is processed
 */
export const receiveNotification = createAsyncThunk(
  'notifications/receiveNotification',
  async (notification: Notification, { dispatch, rejectWithValue }) => {
    try {
      // Add the notification to the Redux store
      dispatch(notificationActions.addNotification(notification));
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to process incoming notification');
    }
  }
);