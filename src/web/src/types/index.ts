/**
 * Centralized type definitions for the Tribe application.
 * This barrel file re-exports all type definitions from the application's type modules,
 * providing a single entry point for importing types throughout the application.
 * 
 * @example Import specific types directly
 * import { User, Profile, Tribe } from '@/types';
 * 
 * @example Import from a specific namespace
 * import { AuthTypes, ProfileTypes } from '@/types';
 * const user: AuthTypes.User = {...};
 * 
 * @version 1.0.0
 */

// Re-export all types from individual modules
export * from './api.types';
export * from './auth.types';
export * from './chat.types';
export * from './event.types';
export * from './navigation.types';
export * from './notification.types';
export * from './profile.types';
export * from './state.types';
export * from './tribe.types';

// Export namespaces for selective imports
import * as ApiTypes from './api.types';
import * as AuthTypes from './auth.types';
import * as ChatTypes from './chat.types';
import * as EventTypes from './event.types';
import * as NavigationTypes from './navigation.types';
import * as NotificationTypes from './notification.types';
import * as ProfileTypes from './profile.types';
import * as StateTypes from './state.types';
import * as TribeTypes from './tribe.types';

export {
  ApiTypes,
  AuthTypes,
  ChatTypes,
  EventTypes,
  NavigationTypes,
  NotificationTypes,
  ProfileTypes,
  StateTypes,
  TribeTypes
};