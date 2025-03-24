/**
 * Redux store slice barrel file
 * 
 * This file provides a centralized access point for importing slice reducers,
 * actions, and selectors throughout the application. By exposing all Redux
 * store components through a single file, we simplify imports in components
 * and maintain a cleaner codebase.
 * 
 * @version 1.0.0
 */

// Auth slice
import authReducer from './authSlice';
import { authActions } from './authSlice';

// Chat slice
import chatReducer from './chatSlice';
import { actions as chatActions } from './chatSlice';

// Event slice
import eventReducer from './eventSlice';
import { eventActions, EventState } from './eventSlice';

// Notification slice
import { 
  notificationReducer, 
  notificationActions,
  selectNotifications,
  selectUnreadNotifications,
  selectUnreadCount
} from './notificationSlice';

// Profile slice
import {
  profileReducer,
  profileActions,
  selectProfile,
  selectPersonalityTraits,
  selectInterests
} from './profileSlice';

// Tribe slice
import tribeReducer from './tribeSlice';
import { tribeActions } from './tribeSlice';

// Export reducers
export {
  authReducer,
  chatReducer,
  eventReducer,
  notificationReducer,
  profileReducer,
  tribeReducer
};

// Export actions
export {
  authActions,
  chatActions,
  eventActions,
  notificationActions,
  profileActions,
  tribeActions
};

// Export types
export { EventState };

// Export selectors
export {
  selectNotifications,
  selectUnreadNotifications,
  selectUnreadCount,
  selectProfile,
  selectPersonalityTraits,
  selectInterests
};