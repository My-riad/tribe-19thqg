/**
 * Redux Toolkit slice for managing notification state in the Tribe application.
 * This slice handles notification data, read status, preferences, and asynchronous operations
 * while maintaining a clean architecture that avoids circular dependencies.
 * @packageDocumentation
 * @version 1.9.5
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationState, Notification, NotificationPreference } from '../../types/notification.types';

// Define a type for state that includes notifications without causing circular dependencies
type StateWithNotifications = {
  notifications: NotificationState;
};

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  preferences: [],
  loading: false,
  error: null
};

/**
 * Notification slice - defines state structure, reducers, and actions
 * for notification management in the Tribe application
 */
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Add a new notification
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    
    // Set notifications array
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(notification => !notification.isRead).length;
    },
    
    // Set unread count directly
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    
    // Increment unread count
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    
    // Decrement unread count
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },
    
    // Mark a notification as read
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        if (state.unreadCount > 0) {
          state.unreadCount -= 1;
        }
      }
    },
    
    // Mark all notifications as read
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
    },
    
    // Remove a notification
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        if (state.unreadCount > 0) {
          state.unreadCount -= 1;
        }
      }
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    // Set notification preferences
    setPreferences: (state, action: PayloadAction<NotificationPreference[]>) => {
      state.preferences = action.payload;
    },
    
    // Update a specific notification preference
    updatePreference: (state, action: PayloadAction<NotificationPreference>) => {
      const existingIndex = state.preferences.findIndex(p => p.type === action.payload.type);
      if (existingIndex >= 0) {
        state.preferences[existingIndex] = action.payload;
      } else {
        state.preferences.push(action.payload);
      }
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    }
  },
  
  // Handle async thunk actions using matcher to avoid circular dependencies
  extraReducers: (builder) => {
    // Fetch notifications
    builder.addMatcher(
      (action) => action.type === 'notifications/fetchNotifications/pending',
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );
    builder.addMatcher(
      (action) => action.type === 'notifications/fetchNotifications/fulfilled',
      (state, action) => {
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(notification => !notification.isRead).length;
        state.loading = false;
      }
    );
    builder.addMatcher(
      (action) => action.type === 'notifications/fetchNotifications/rejected',
      (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch notifications';
      }
    );
    
    // Mark notification as read
    builder.addMatcher(
      (action) => action.type === 'notifications/markNotificationAsRead/pending',
      (state) => {
        state.loading = true;
      }
    );
    builder.addMatcher(
      (action) => action.type === 'notifications/markNotificationAsRead/fulfilled',
      (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          if (state.unreadCount > 0) {
            state.unreadCount -= 1;
          }
        }
        state.loading = false;
      }
    );
    builder.addMatcher(
      (action) => action.type === 'notifications/markNotificationAsRead/rejected',
      (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to mark notification as read';
      }
    );
    
    // Mark all notifications as read
    builder.addMatcher(
      (action) => action.type === 'notifications/markAllNotificationsAsRead/pending',
      (state) => {
        state.loading = true;
      }
    );
    builder.addMatcher(
      (action) => action.type === 'notifications/markAllNotificationsAsRead/fulfilled',
      (state) => {
        state.notifications.forEach(notification => {
          notification.isRead = true;
        });
        state.unreadCount = 0;
        state.loading = false;
      }
    );
    builder.addMatcher(
      (action) => action.type === 'notifications/markAllNotificationsAsRead/rejected',
      (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to mark all notifications as read';
      }
    );
    
    // Fetch notification preferences
    builder.addMatcher(
      (action) => action.type === 'notifications/fetchNotificationPreferences/pending',
      (state) => {
        state.loading = true;
      }
    );
    builder.addMatcher(
      (action) => action.type === 'notifications/fetchNotificationPreferences/fulfilled',
      (state, action) => {
        state.preferences = action.payload;
        state.loading = false;
      }
    );
    builder.addMatcher(
      (action) => action.type === 'notifications/fetchNotificationPreferences/rejected',
      (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch notification preferences';
      }
    );
    
    // Update notification preferences
    builder.addMatcher(
      (action) => action.type === 'notifications/updateNotificationPreferences/pending',
      (state) => {
        state.loading = true;
      }
    );
    builder.addMatcher(
      (action) => action.type === 'notifications/updateNotificationPreferences/fulfilled',
      (state, action) => {
        state.preferences = action.payload;
        state.loading = false;
      }
    );
    builder.addMatcher(
      (action) => action.type === 'notifications/updateNotificationPreferences/rejected',
      (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update notification preferences';
      }
    );
    
    // Delete notification
    builder.addMatcher(
      (action) => action.type === 'notifications/deleteNotificationById/pending',
      (state) => {
        state.loading = true;
      }
    );
    builder.addMatcher(
      (action) => action.type === 'notifications/deleteNotificationById/fulfilled',
      (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.isRead) {
          if (state.unreadCount > 0) {
            state.unreadCount -= 1;
          }
        }
        state.notifications = state.notifications.filter(n => n.id !== action.payload);
        state.loading = false;
      }
    );
    builder.addMatcher(
      (action) => action.type === 'notifications/deleteNotificationById/rejected',
      (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete notification';
      }
    );
  }
});

// Export the slice itself
export { notificationSlice };

// Export the reducer and actions
export const notificationReducer = notificationSlice.reducer;
export const notificationActions = notificationSlice.actions;

// Export selectors
export const selectNotifications = (state: StateWithNotifications) => state.notifications.notifications;
export const selectUnreadNotifications = (state: StateWithNotifications) => 
  state.notifications.notifications.filter(notification => !notification.isRead);
export const selectUnreadCount = (state: StateWithNotifications) => state.notifications.unreadCount;
export const selectNotificationPreferences = (state: StateWithNotifications) => state.notifications.preferences;
export const selectNotificationLoading = (state: StateWithNotifications) => state.notifications.loading;
export const selectNotificationError = (state: StateWithNotifications) => state.notifications.error;