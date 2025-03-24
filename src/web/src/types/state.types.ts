/**
 * Type definitions for Redux state management in the Tribe application.
 * This file defines the structure of the application state, including interfaces
 * for each slice of the Redux store and common state-related types.
 */

import { AuthState } from './auth.types';
import { ProfileState } from './profile.types';
import { Tribe } from './tribe.types';
import { Event, EventSuggestion, OptimalTimeSlot } from './event.types';
import { Notification, NotificationPreference } from './notification.types';
import { ChatMessage } from './chat.types';

/**
 * Enum representing the loading status of async operations
 */
export enum LoadingStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * Interface representing the complete Redux store state
 */
export interface RootState {
  auth: AuthState;
  profile: ProfileState;
  tribes: TribesState;
  events: EventsState;
  notifications: NotificationState;
  chat: ChatState;
}

/**
 * Interface representing the tribes slice of the Redux store
 */
export interface TribesState {
  tribes: Tribe[];
  userTribes: Tribe[];
  suggestedTribes: Tribe[];
  currentTribe: Tribe | null;
  loading: boolean;
  error: string | null;
  tribeCreationStatus: LoadingStatus;
}

/**
 * Interface representing the events slice of the Redux store
 */
export interface EventsState {
  events: Event[];
  userEvents: Event[];
  suggestedEvents: EventSuggestion[];
  currentEvent: Event | null;
  optimalTimeSlots: OptimalTimeSlot[];
  loading: boolean;
  error: string | null;
  eventCreationStatus: LoadingStatus;
}

/**
 * Interface representing the notifications slice of the Redux store
 */
export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreference[];
  loading: boolean;
  error: string | null;
}

/**
 * Interface representing the chat slice of the Redux store
 */
export interface ChatState {
  messages: Record<string, ChatMessage[]>; // Keyed by tribeId
  activeChat: string | null; // Currently active chat tribeId
  typingUsers: Record<string, string[]>; // Mapping of tribeId to array of typing user IDs
  unreadCounts: Record<string, number>; // Unread message counts by tribeId
  loading: boolean;
  error: string | null;
}

/**
 * Generic interface for common async operation state properties
 */
export interface AsyncState {
  loading: boolean;
  error: string | null;
}

/**
 * Generic interface for paginated data state properties
 */
export interface PaginatedState {
  page: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Generic interface for normalized entity state pattern
 */
export interface EntityState<T> {
  ids: string[];
  entities: Record<string, T>;
}