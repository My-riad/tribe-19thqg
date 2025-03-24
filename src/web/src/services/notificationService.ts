import messaging from '@react-native-firebase/messaging';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';
import { Platform, AppState } from 'react-native';

import { notificationApi } from '../api/notificationApi';
import { storageService } from './storageService';
import { STORAGE_KEYS, SECURE_STORAGE_KEYS } from '../constants/storageKeys';
import { CONFIG } from '../constants/config';
import { 
  Notification,
  NotificationType,
  NotificationPreference,
  NotificationFilter 
} from '../types/notification.types';
import { getUniqueDeviceId } from '../utils/deviceInfo';

/**
 * Notification service that provides a unified interface for managing notifications
 * in the Tribe application. Handles push notification registration, delivery,
 * local notification storage, and notification preferences.
 */
const notificationService = {
  /**
   * Initializes the notification service, configures push notifications, and requests permissions
   * @returns Promise resolving to true if initialization was successful
   */
  async initialize(): Promise<boolean> {
    // Check if push notifications are enabled in CONFIG.FEATURES
    if (!CONFIG.FEATURES.ENABLE_PUSH_NOTIFICATIONS) {
      console.log('Push notifications are disabled in configuration');
      return false;
    }

    try {
      // Configure PushNotification with appropriate settings
      PushNotification.configure({
        // Called when Token is generated
        onRegister: function(token) {
          console.log('FCM Token:', token);
        },
        
        // Called when a remote or local notification is opened
        onNotification: function(notification) {
          console.log('Notification received:', notification);
          notificationService.handleIncomingPushNotification(notification);
          
          // Required on iOS only
          if (Platform.OS === 'ios') {
            notification.finish(PushNotificationIOS.FetchResult.NoData);
          }
        },
        
        // Android only: GCM or FCM Sender ID
        senderID: CONFIG.EXTERNAL_SERVICES.FIREBASE.MESSAGING_SENDER_ID,
        
        // iOS permissions
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },
        
        // Should the initial notification be popped automatically
        popInitialNotification: true,
        
        // Android notification settings
        largeIcon: "ic_launcher",
        smallIcon: "ic_notification",
        
        // The notification will be delayed until specified time
        // useful for scheduling notifications
        userInteraction: false,
        
        // Callback triggered for notification actions
        onAction: function(notification) {
          console.log('Notification action received:', notification.action);
          notificationService.handleNotificationOpen(notification);
        },
        
        // Called when registration token errors
        onRegistrationError: function(err) {
          console.error('Registration error:', err.message, err);
        },
      });

      // Request notification permissions
      const permissionsGranted = await this.requestPermissions();
      if (!permissionsGranted) {
        console.warn('Notification permissions were not granted');
      }

      // Initialize Firebase messaging if available
      if (messaging) {
        // Set up background message handler for FCM
        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
          console.log('Message handled in the background:', remoteMessage);
          await this.handleIncomingPushNotification(remoteMessage);
        });

        // Register for Firebase Cloud Messaging token
        await this.registerForPushNotifications();
      }

      // Load cached notifications from storage
      const cachedNotifications = await storageService.getData(STORAGE_KEYS.NOTIFICATIONS, []);
      console.log(`Loaded ${cachedNotifications.length} cached notifications`);

      return true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return false;
    }
  },

  /**
   * Requests notification permissions from the user
   * @returns Promise resolving to true if permissions were granted
   */
  async requestPermissions(): Promise<boolean> {
    // Check if push notifications are enabled in CONFIG.FEATURES
    if (!CONFIG.FEATURES.ENABLE_PUSH_NOTIFICATIONS) {
      return false;
    }

    try {
      // Request permissions using platform-specific methods
      if (Platform.OS === 'ios') {
        // For iOS, use PushNotificationIOS.requestPermissions
        const authStatus = await PushNotificationIOS.requestPermissions({
          alert: true,
          badge: true,
          sound: true,
        });
        
        // iOS permission format is an object with boolean values
        return Object.values(authStatus).some(Boolean);
      } else {
        // For Android, permissions are granted by default
        // but we still need to check for newer Android versions
        if (messaging) {
          const authStatus = await messaging().requestPermission();
          return authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                 authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        }
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  /**
   * Registers the device for push notifications with the backend
   * @returns Promise resolving to true if registration was successful
   */
  async registerForPushNotifications(): Promise<boolean> {
    // Check if push notifications are enabled in CONFIG.FEATURES
    if (!CONFIG.FEATURES.ENABLE_PUSH_NOTIFICATIONS) {
      return false;
    }

    try {
      // Get the FCM token from Firebase messaging
      const fcmToken = await messaging().getToken();
      
      if (!fcmToken) {
        console.error('Failed to get FCM token');
        return false;
      }
      
      console.log('FCM Token obtained:', fcmToken);
      
      // Store the FCM token in secure storage
      await storageService.storeSecureData(SECURE_STORAGE_KEYS.FCM_TOKEN, fcmToken);
      
      // Get the unique device ID using getUniqueDeviceId()
      const deviceId = await getUniqueDeviceId();
      
      // Call notificationApi.subscribeToPushNotifications with device info
      const subscription = {
        deviceId,
        token: fcmToken,
        platform: Platform.OS,
        deviceName: await getDeviceName(),
        appVersion: CONFIG.ENVIRONMENT.APP_VERSION,
        buildNumber: CONFIG.ENVIRONMENT.BUILD_NUMBER
      };
      
      const result = await notificationApi.subscribeToPushNotifications(subscription);
      console.log('Push notification registration result:', result);
      
      return result.success;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return false;
    }
  },

  /**
   * Unregisters the device from push notifications
   * @returns Promise resolving to true if unregistration was successful
   */
  async unregisterFromPushNotifications(): Promise<boolean> {
    try {
      // Get the unique device ID using getUniqueDeviceId()
      const deviceId = await getUniqueDeviceId();
      
      // Call notificationApi.unsubscribeFromPushNotifications with device ID
      const result = await notificationApi.unsubscribeFromPushNotifications(deviceId);
      
      if (result.success) {
        // Remove the FCM token from secure storage
        await storageService.removeSecureData(SECURE_STORAGE_KEYS.FCM_TOKEN);
        console.log('Successfully unregistered from push notifications');
      }
      
      return result.success;
    } catch (error) {
      console.error('Error unregistering from push notifications:', error);
      return false;
    }
  },

  /**
   * Fetches notifications from the server or local storage
   * @param filter Optional filter criteria for notifications
   * @param forceRefresh Whether to force a refresh from the server
   * @returns Promise resolving to an array of notifications
   */
  async getNotifications(
    filter?: NotificationFilter,
    forceRefresh = false
  ): Promise<Notification[]> {
    try {
      let notifications: Notification[] = [];
      
      // If forceRefresh is true or we're online, fetch from server
      if (forceRefresh) {
        try {
          // Call notificationApi.getNotifications with the provided filter
          const response = await notificationApi.getNotifications(filter);
          notifications = response.notifications;
          
          // Cache the fetched notifications in local storage
          await storageService.storeData(STORAGE_KEYS.NOTIFICATIONS, notifications);
          console.log(`Cached ${notifications.length} notifications from server`);
        } catch (error) {
          console.warn('Failed to fetch notifications from server:', error);
          // If fetch fails, load from local storage
          notifications = await storageService.getData<Notification[]>(
            STORAGE_KEYS.NOTIFICATIONS, 
            []
          );
          console.log(`Loaded ${notifications.length} notifications from cache`);
        }
      } else {
        // Load from local storage
        notifications = await storageService.getData<Notification[]>(
          STORAGE_KEYS.NOTIFICATIONS, 
          []
        );
        console.log(`Loaded ${notifications.length} notifications from cache`);
      }
      
      // Apply filters if provided
      if (filter) {
        return notifications.filter(notification => {
          // Filter by type
          if (filter.type) {
            if (Array.isArray(filter.type)) {
              if (!filter.type.includes(notification.type)) {
                return false;
              }
            } else if (notification.type !== filter.type) {
              return false;
            }
          }
          
          // Filter by read status
          if (filter.isRead !== undefined && notification.isRead !== filter.isRead) {
            return false;
          }
          
          // Filter by date range
          if (filter.startDate && new Date(notification.createdAt) < filter.startDate) {
            return false;
          }
          
          if (filter.endDate && new Date(notification.createdAt) > filter.endDate) {
            return false;
          }
          
          // Filter by priority
          if (filter.priority && notification.priority !== filter.priority) {
            return false;
          }
          
          return true;
        });
      }
      
      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  },

  /**
   * Gets a specific notification by ID from server or local cache
   * @param id Notification ID to retrieve
   * @returns Promise resolving to the notification or null if not found
   */
  async getNotificationById(id: string): Promise<Notification | null> {
    try {
      // Try to fetch the notification from the server
      try {
        const response = await notificationApi.getNotificationById(id);
        return response.notification;
      } catch (error) {
        console.warn('Failed to fetch notification from server:', error);
        
        // If offline or fetch fails, check local storage
        const notifications = await storageService.getData<Notification[]>(
          STORAGE_KEYS.NOTIFICATIONS, 
          []
        );
        
        return notifications.find(notification => notification.id === id) || null;
      }
    } catch (error) {
      console.error('Error getting notification by ID:', error);
      return null;
    }
  },

  /**
   * Marks a notification as read
   * @param id ID of the notification to mark as read
   * @returns Promise resolving to true if successful
   */
  async markAsRead(id: string): Promise<boolean> {
    try {
      // Call notificationApi.markAsRead with the notification ID
      const result = await notificationApi.markAsRead(id);
      
      if (result.success) {
        // Update the notification in local storage
        const notifications = await storageService.getData<Notification[]>(
          STORAGE_KEYS.NOTIFICATIONS, 
          []
        );
        
        const updatedNotifications = notifications.map(notification => {
          if (notification.id === id) {
            return { ...notification, isRead: true };
          }
          return notification;
        });
        
        await storageService.storeData(STORAGE_KEYS.NOTIFICATIONS, updatedNotifications);
        
        // Update badge count
        this.updateBadgeCount();
      }
      
      return result.success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // If offline, queue the action for later sync
      try {
        const notifications = await storageService.getData<Notification[]>(
          STORAGE_KEYS.NOTIFICATIONS, 
          []
        );
        
        const updatedNotifications = notifications.map(notification => {
          if (notification.id === id) {
            return { ...notification, isRead: true };
          }
          return notification;
        });
        
        await storageService.storeData(STORAGE_KEYS.NOTIFICATIONS, updatedNotifications);
        
        // Update badge count
        this.updateBadgeCount();
        
        return true;
      } catch (localError) {
        console.error('Error updating local notification cache:', localError);
        return false;
      }
    }
  },

  /**
   * Marks all notifications as read
   * @returns Promise resolving to true if successful
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      // Call notificationApi.markAllAsRead
      const result = await notificationApi.markAllAsRead();
      
      if (result.success) {
        // Update all notifications in local storage
        const notifications = await storageService.getData<Notification[]>(
          STORAGE_KEYS.NOTIFICATIONS, 
          []
        );
        
        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          isRead: true
        }));
        
        await storageService.storeData(STORAGE_KEYS.NOTIFICATIONS, updatedNotifications);
        
        // Reset badge count
        PushNotification.setApplicationIconBadgeNumber(0);
      }
      
      return result.success;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // If offline, queue the action for later sync
      try {
        const notifications = await storageService.getData<Notification[]>(
          STORAGE_KEYS.NOTIFICATIONS, 
          []
        );
        
        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          isRead: true
        }));
        
        await storageService.storeData(STORAGE_KEYS.NOTIFICATIONS, updatedNotifications);
        
        // Reset badge count
        PushNotification.setApplicationIconBadgeNumber(0);
        
        return true;
      } catch (localError) {
        console.error('Error updating local notification cache:', localError);
        return false;
      }
    }
  },

  /**
   * Deletes a notification
   * @param id ID of the notification to delete
   * @returns Promise resolving to true if successful
   */
  async deleteNotification(id: string): Promise<boolean> {
    try {
      // Call notificationApi.deleteNotification with the notification ID
      const result = await notificationApi.deleteNotification(id);
      
      if (result.success) {
        // Remove the notification from local storage
        const notifications = await storageService.getData<Notification[]>(
          STORAGE_KEYS.NOTIFICATIONS, 
          []
        );
        
        const updatedNotifications = notifications.filter(
          notification => notification.id !== id
        );
        
        await storageService.storeData(STORAGE_KEYS.NOTIFICATIONS, updatedNotifications);
        
        // Update badge count
        this.updateBadgeCount();
      }
      
      return result.success;
    } catch (error) {
      console.error('Error deleting notification:', error);
      
      // If offline, queue the action for later sync
      try {
        const notifications = await storageService.getData<Notification[]>(
          STORAGE_KEYS.NOTIFICATIONS, 
          []
        );
        
        const updatedNotifications = notifications.filter(
          notification => notification.id !== id
        );
        
        await storageService.storeData(STORAGE_KEYS.NOTIFICATIONS, updatedNotifications);
        
        // Update badge count
        this.updateBadgeCount();
        
        return true;
      } catch (localError) {
        console.error('Error updating local notification cache:', localError);
        return false;
      }
    }
  },

  /**
   * Gets the user's notification preferences
   * @returns Promise resolving to notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreference[]> {
    try {
      // Try to fetch preferences from the server
      try {
        const response = await notificationApi.getNotificationPreferences();
        
        // If successful, cache the preferences in local storage
        await storageService.storeData(
          STORAGE_KEYS.NOTIFICATION_SETTINGS,
          response.preferences
        );
        
        return response.preferences;
      } catch (error) {
        console.warn('Failed to fetch notification preferences from server:', error);
        
        // If offline or fetch fails, load from local storage
        const preferences = await storageService.getData<NotificationPreference[]>(
          STORAGE_KEYS.NOTIFICATION_SETTINGS,
          []
        );
        
        return preferences;
      }
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return [];
    }
  },

  /**
   * Updates the user's notification preferences
   * @param preferences Updated notification preferences
   * @returns Promise resolving to true if successful
   */
  async updateNotificationPreferences(
    preferences: NotificationPreference[]
  ): Promise<boolean> {
    try {
      // Call notificationApi.updateNotificationPreferences with the new preferences
      const result = await notificationApi.updateNotificationPreferences(preferences);
      
      if (result.success) {
        // Update preferences in local storage
        await storageService.storeData(
          STORAGE_KEYS.NOTIFICATION_SETTINGS,
          result.preferences
        );
      }
      
      return result.success;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      
      // If offline, queue the action for later sync
      try {
        await storageService.storeData(
          STORAGE_KEYS.NOTIFICATION_SETTINGS,
          preferences
        );
        
        return true;
      } catch (localError) {
        console.error('Error updating local notification preferences cache:', localError);
        return false;
      }
    }
  },

  /**
   * Displays a local notification on the device
   * @param notification Object with notification details
   */
  showLocalNotification(notification: object): void {
    if (!CONFIG.FEATURES.ENABLE_PUSH_NOTIFICATIONS) {
      return;
    }

    // Extract notification properties with defaults
    const {
      title = 'Tribe',
      message,
      payload = {},
      actions = [],
      priority = 'high',
      smallIcon = 'ic_notification',
      largeIcon,
      sound = 'default',
      vibrate = true,
      channelId = 'default',
    } = notification as any;
    
    if (!message) {
      console.error('Notification message is required');
      return;
    }

    // Configure the notification with title, message, and other properties
    const notificationOptions: any = {
      title,
      message,
      data: payload,
      userInfo: payload,
      priority,
      smallIcon,
      largeIcon,
      playSound: !!sound,
      soundName: sound,
      vibrate,
      channelId,
    };
    
    // Add action buttons if applicable
    if (actions.length > 0) {
      notificationOptions.actions = actions;
    }
    
    // Set notification sound and vibration based on preferences
    if (Platform.OS === 'android') {
      notificationOptions.channelId = channelId;
      notificationOptions.importance = 'high';
    }
    
    // Use PushNotification.localNotification to display the notification
    PushNotification.localNotification(notificationOptions);
    
    // Store the notification in local cache
    this.addNotificationToCache({
      id: Date.now().toString(),
      title,
      message,
      isRead: false,
      createdAt: new Date(),
      type: (payload.type as NotificationType) || NotificationType.SYSTEM,
      priority: payload.priority || 'MEDIUM',
      payload,
      sender: null,
      actionUrl: payload.actionUrl || null,
      imageUrl: largeIcon || null,
    } as Notification);
  },

  /**
   * Handles incoming push notifications from Firebase Cloud Messaging
   * @param remoteMessage The push notification message
   */
  async handleIncomingPushNotification(remoteMessage: object): Promise<void> {
    try {
      // Extract notification data from the remote message
      const { notification, data = {}, messageId } = remoteMessage as any;
      
      if (!notification && !data) {
        console.warn('Received empty push notification');
        return;
      }
      
      // Check if the app is in foreground or background
      const appState = AppState.currentState;
      const isBackground = appState !== 'active';
      
      // Create notification object
      const notificationObject: Notification = {
        id: messageId || data.id || Date.now().toString(),
        title: notification?.title || data.title || 'Tribe',
        message: notification?.body || data.message || 'New notification',
        isRead: false,
        createdAt: new Date(),
        type: (data.type as NotificationType) || NotificationType.SYSTEM,
        priority: data.priority || 'MEDIUM',
        payload: data,
        sender: null,
        actionUrl: data.actionUrl || null,
        imageUrl: notification?.android?.imageUrl || notification?.ios?.imageUrl || null,
      };
      
      // If in foreground, show a local notification
      if (!isBackground) {
        this.showLocalNotification({
          title: notificationObject.title,
          message: notificationObject.message,
          payload: data,
          priority: data.priority === 'HIGH' ? 'max' : 'high',
          sound: 'default',
          vibrate: true,
        });
      }
      
      // Store the notification in local cache
      await this.addNotificationToCache(notificationObject);
      
      // Trigger any notification-specific actions
      if (data.actionType && !isBackground) {
        // Handle immediate actions if needed
        console.log('Notification action type:', data.actionType);
      }
    } catch (error) {
      console.error('Error handling incoming push notification:', error);
    }
  },

  /**
   * Handles when a user taps on a notification
   * @param notification The notification that was tapped
   */
  async handleNotificationOpen(notification: object): Promise<void> {
    try {
      // Mark the notification as read
      const { id, data = {} } = notification as any;
      
      if (id) {
        await this.markAsRead(id);
      }
      
      // Extract any action data from the notification
      const type = data.type || NotificationType.SYSTEM;
      const actionUrl = data.actionUrl;
      const payload = data.payload || data;
      
      console.log('Notification opened:', { type, actionUrl, payload });
      
      // Navigate to the appropriate screen based on notification type
      // This would typically integrate with your navigation system
      // Here we're just logging the intended navigation
      
      switch (type) {
        case NotificationType.TRIBE_MATCH:
          console.log('Navigate to tribe details:', payload.tribeId);
          break;
        case NotificationType.TRIBE_INVITATION:
          console.log('Navigate to tribe invitation:', payload.tribeId);
          break;
        case NotificationType.EVENT_REMINDER:
          console.log('Navigate to event details:', payload.eventId);
          break;
        case NotificationType.CHAT_MESSAGE:
          console.log('Navigate to chat:', payload.tribeId);
          break;
        case NotificationType.AI_SUGGESTION:
          console.log('Navigate to AI suggestion:', payload.suggestionType);
          break;
        case NotificationType.ACHIEVEMENT:
          console.log('Navigate to achievement:', payload.achievementId);
          break;
        default:
          console.log('Default notification navigation');
          // Default action would be to open the app to the notifications screen
          break;
      }
      
      // Perform any required actions based on notification payload
      if (payload.requiresAction) {
        console.log('Notification requires action:', payload.requiresAction);
      }
    } catch (error) {
      console.error('Error handling notification open:', error);
    }
  },

  /**
   * Synchronizes local notifications with the server
   * @returns Promise resolving to true if sync was successful
   */
  async syncNotifications(): Promise<boolean> {
    try {
      // Check if there are any pending notification actions
      // This would typically involve checking a queue of pending actions
      
      // Fetch latest notifications from server
      const response = await notificationApi.getNotifications();
      
      if (response) {
        // Update local storage with latest data
        await storageService.storeData(
          STORAGE_KEYS.NOTIFICATIONS, 
          response.notifications
        );
        
        // Update badge count
        const unreadCount = response.notifications.filter(n => !n.isRead).length;
        PushNotification.setApplicationIconBadgeNumber(unreadCount);
        
        console.log(`Synchronized ${response.notifications.length} notifications, ${unreadCount} unread`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error syncing notifications:', error);
      return false;
    }
  },

  /**
   * Gets the count of unread notifications
   * @returns Promise resolving to the unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      // Load notifications from local storage
      const notifications = await storageService.getData<Notification[]>(
        STORAGE_KEYS.NOTIFICATIONS, 
        []
      );
      
      // Count notifications where isRead is false
      const unreadCount = notifications.filter(notification => !notification.isRead).length;
      
      return unreadCount;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  },

  /**
   * Clears all notifications from local storage
   * @returns Promise resolving to true if successful
   */
  async clearNotifications(): Promise<boolean> {
    try {
      // Remove notifications from local storage
      await storageService.storeData(STORAGE_KEYS.NOTIFICATIONS, []);
      
      // Reset badge count on app icon
      PushNotification.setApplicationIconBadgeNumber(0);
      
      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  },

  /**
   * Helper method to add a notification to the local cache
   * @param notification The notification to cache
   */
  async addNotificationToCache(notification: Notification): Promise<void> {
    try {
      const notifications = await storageService.getData<Notification[]>(
        STORAGE_KEYS.NOTIFICATIONS,
        []
      );
      
      // Add to beginning of array (newest first)
      notifications.unshift(notification);
      
      // Limit cache size
      const MAX_CACHED_NOTIFICATIONS = 100;
      if (notifications.length > MAX_CACHED_NOTIFICATIONS) {
        notifications.length = MAX_CACHED_NOTIFICATIONS;
      }
      
      await storageService.storeData(STORAGE_KEYS.NOTIFICATIONS, notifications);
      
      // Update badge count
      this.updateBadgeCount();
    } catch (error) {
      console.error('Error adding notification to cache:', error);
    }
  },

  /**
   * Helper method to update the application badge count
   */
  async updateBadgeCount(): Promise<void> {
    try {
      const unreadCount = await this.getUnreadCount();
      PushNotification.setApplicationIconBadgeNumber(unreadCount);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  }
};

/**
 * Helper function to get device name
 * @returns Promise resolving to the device name
 */
async function getDeviceName(): Promise<string> {
  try {
    // Import DeviceInfo only when needed to avoid issues
    const DeviceInfo = require('react-native-device-info');
    return await DeviceInfo.getDeviceName();
  } catch (error) {
    console.error('Error getting device name:', error);
    return Platform.OS === 'ios' ? 'iOS Device' : 'Android Device';
  }
}

export { notificationService };