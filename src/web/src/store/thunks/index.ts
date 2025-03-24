/**
 * @file Index file that re-exports all Redux thunks from the Tribe application.
 * @description This file serves as a central export point for all asynchronous action creators used throughout the application, including authentication, profile, tribe, chat, event, and notification-related operations.
 */

// Import all authentication-related thunks
import * as authThunks from './authThunks';
// Import all profile-related thunks
import * as profileThunks from './profileThunks';
// Import all tribe-related thunks
import * as tribeThunks from './tribeThunks';
// Import all chat-related thunks
import * as chatThunks from './chatThunks';
// Import all event-related thunks
import * as eventThunks from './eventThunks';
// Import all notification-related thunks
import * as notificationThunks from './notificationThunks';

// Re-export all authentication thunks
export * as auth from './authThunks';
// Re-export all profile thunks
export * as profile from './profileThunks';
// Re-export all tribe thunks
export * as tribe from './tribeThunks';
// Re-export all chat thunks
export * as chat from './chatThunks';
// Re-export all event thunks
export * as event from './eventThunks';
// Re-export all notification thunks
export * as notification from './notificationThunks';