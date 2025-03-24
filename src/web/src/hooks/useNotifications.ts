import { useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  updateNotificationTypePreference,
  deleteNotificationById,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
} from '../store/thunks/notificationThunks';
import {
  selectNotifications,
  selectUnreadCount,
  selectNotificationPreferences
} from '../store/slices/notificationSlice';
import { notificationService } from '../services/notificationService';
import { useOffline } from './useOffline';
import {
  Notification,
  NotificationFilter,
  NotificationPreference,
  NotificationType,
  NotificationContextType
} from '../types/notification.types';

/**
 * Custom hook that provides notification functionality throughout the application
 * 
 * This hook abstracts the Redux notification state and actions, offering a simplified
 * interface for components to handle notification retrieval, management, preferences,
 * and real-time updates. It also handles offline scenarios by using cached data when needed.
 * 
 * @returns Notification context object with notification state and management methods
 */
export const useNotifications = (): NotificationContextType => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const preferences = useAppSelector(selectNotificationPreferences);
  const { isOffline } = useOffline();
  const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(null);

  /**
   * Fetches notifications with optional filtering
   * Falls back to cached notifications when offline
   * 
   * @param filter Optional filter criteria for notifications
   * @returns Promise resolving to an array of notifications
   */
  const getNotifications = useCallback(async (filter?: NotificationFilter): Promise<Notification[]> => {
    try {
      if (isOffline) {
        // Use cached notifications when offline
        return await notificationService.getNotifications(filter, false);
      }
      await dispatch(fetchNotifications({ filter }));
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }, [dispatch, isOffline, notifications]);

  /**
   * Marks a specific notification as read
   * 
   * @param id ID of the notification to mark as read
   * @returns Promise resolving to true if successful, false otherwise
   */
  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (isOffline) {
        return await notificationService.markAsRead(id);
      }
      await dispatch(markNotificationAsRead(id));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, [dispatch, isOffline]);

  /**
   * Marks all notifications as read
   * 
   * @returns Promise resolving to true if successful, false otherwise
   */
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      if (isOffline) {
        return await notificationService.markAllAsRead();
      }
      await dispatch(markAllNotificationsAsRead());
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, [dispatch, isOffline]);

  /**
   * Deletes a specific notification
   * 
   * @param id ID of the notification to delete
   * @returns Promise resolving to true if successful, false otherwise
   */
  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (isOffline) {
        return await notificationService.deleteNotification(id);
      }
      await dispatch(deleteNotificationById(id));
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, [dispatch, isOffline]);

  /**
   * Fetches notification preferences
   * 
   * @returns Promise resolving to an array of notification preferences
   */
  const getPreferences = useCallback(async (): Promise<NotificationPreference[]> => {
    try {
      if (isOffline) {
        return await notificationService.getNotificationPreferences();
      }
      await dispatch(fetchNotificationPreferences());
      return preferences;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return [];
    }
  }, [dispatch, isOffline, preferences]);

  /**
   * Updates all notification preferences
   * 
   * @param newPreferences Array of updated notification preferences
   * @returns Promise resolving to true if successful, false otherwise
   */
  const updatePreferences = useCallback(async (newPreferences: NotificationPreference[]): Promise<boolean> => {
    try {
      if (isOffline) {
        return await notificationService.updateNotificationPreferences(newPreferences);
      }
      await dispatch(updateNotificationPreferences(newPreferences));
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }, [dispatch, isOffline]);

  /**
   * Updates a specific notification type preference
   * 
   * @param preference The notification preference to update
   * @returns Promise resolving to true if successful, false otherwise
   */
  const updateTypePreference = useCallback(async (preference: NotificationPreference): Promise<boolean> => {
    try {
      if (isOffline) {
        const currentPrefs = await notificationService.getNotificationPreferences();
        const updatedPrefs = currentPrefs.map(pref => 
          pref.type === preference.type ? preference : pref
        );
        
        // If the preference doesn't exist, add it
        if (!currentPrefs.some(pref => pref.type === preference.type)) {
          updatedPrefs.push(preference);
        }
        
        return await notificationService.updateNotificationPreferences(updatedPrefs);
      }
      await dispatch(updateNotificationTypePreference(preference));
      return true;
    } catch (error) {
      console.error('Error updating notification type preference:', error);
      return false;
    }
  }, [dispatch, isOffline]);

  /**
   * Subscribes the device to push notifications
   * 
   * @param deviceInfo Object containing device information for registration
   * @returns Promise resolving to true if successful, false otherwise
   */
  const subscribeToPush = useCallback(async (deviceInfo: object): Promise<boolean> => {
    try {
      await dispatch(subscribeToPushNotifications(deviceInfo));
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }, [dispatch]);

  /**
   * Unsubscribes the device from push notifications
   * 
   * @param deviceId Device identifier to unsubscribe
   * @returns Promise resolving to true if successful, false otherwise
   */
  const unsubscribeFromPush = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      await dispatch(unsubscribeFromPushNotifications(deviceId));
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }, [dispatch]);

  /**
   * Requests notification permissions from the user
   * 
   * @returns Promise resolving to true if permissions granted, false otherwise
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await notificationService.requestPermissions();
      setPermissionsGranted(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      setPermissionsGranted(false);
      return false;
    }
  }, []);

  /**
   * Displays a local notification on the device
   * 
   * @param notification Object containing notification details
   * @returns True if notification was displayed successfully, false otherwise
   */
  const showLocalNotification = useCallback((notification: object): boolean => {
    try {
      notificationService.showLocalNotification(notification);
      return true;
    } catch (error) {
      console.error('Error showing local notification:', error);
      return false;
    }
  }, []);

  /**
   * Handles a notification being opened by the user
   * 
   * @param notification The notification that was opened
   * @returns Promise resolving to true if handled successfully, false otherwise
   */
  const handleNotificationOpen = useCallback(async (notification: object): Promise<boolean> => {
    try {
      await notificationService.handleNotificationOpen(notification);
      return true;
    } catch (error) {
      console.error('Error handling notification open:', error);
      return false;
    }
  }, []);

  /**
   * Synchronizes local notifications with the server
   * 
   * @returns Promise resolving to true if sync was successful, false otherwise
   */
  const syncNotifications = useCallback(async (): Promise<boolean> => {
    try {
      return await notificationService.syncNotifications();
    } catch (error) {
      console.error('Error syncing notifications:', error);
      return false;
    }
  }, []);

  // Initialize notification service on component mount
  useEffect(() => {
    const initNotifications = async () => {
      try {
        const success = await notificationService.initialize();
        if (success) {
          // Initial sync
          await syncNotifications();
          
          // Get push notification permission status
          const granted = await notificationService.requestPermissions();
          setPermissionsGranted(granted);
        }
      } catch (error) {
        console.error('Error initializing notification service:', error);
      }
    };
    
    initNotifications();
  }, [syncNotifications]);

  // Sync notifications when coming back online
  useEffect(() => {
    if (!isOffline) {
      syncNotifications().catch(error => {
        console.error('Error syncing notifications after coming online:', error);
      });
    }
  }, [isOffline, syncNotifications]);

  return {
    notifications,
    unreadCount,
    preferences,
    permissionsGranted,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getPreferences,
    updatePreferences,
    updateTypePreference,
    subscribeToPush,
    unsubscribeFromPush,
    requestPermissions,
    showLocalNotification,
    handleNotificationOpen,
    syncNotifications
  };
};