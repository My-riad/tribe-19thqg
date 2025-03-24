import { store, persistor, RootState, AppDispatch, AppThunk, registerReducer } from './store';
import { useAppDispatch, useAppSelector } from './hooks';
import * as slices from './slices';
import * as thunks from './thunks';

/**
 * Exports the configured Redux store instance for use throughout the application.
 * This store manages the global application state and enables state updates via dispatched actions.
 */
export { store };

/**
 * Exports the Redux Persist persistor for managing the persistence and rehydration of the Redux store.
 * This persistor is used to save the store's state to local storage and rehydrate it on app startup,
 * enabling offline capabilities and maintaining state across sessions.
 */
export { persistor };

/**
 * Exports the RootState interface, which defines the structure of the entire Redux store state.
 * This interface is used for type-safe access to the store's state in selectors and components.
 */
export type { RootState };

/**
 * Exports the AppDispatch type, which represents the dispatch function of the Redux store.
 * This type is used for type-safe dispatching of actions in components and thunks.
 */
export type { AppDispatch };

/**
 * Exports the AppThunk type, which represents the type for asynchronous Redux actions (thunks).
 * This type is used for defining thunks that can perform asynchronous operations and dispatch other actions.
 */
export type { AppThunk };

/**
 * Exports the registerReducer function, which allows for dynamically registering reducers to the store after it has been created.
 * This is useful for code splitting and loading reducers on demand.
 */
export { registerReducer };

/**
 * Exports the useAppDispatch hook, which is a typed version of the useDispatch hook from react-redux.
 * This hook provides type-safe access to the dispatch function for components.
 */
export { useAppDispatch };

/**
 * Exports the useAppSelector hook, which is a typed version of the useSelector hook from react-redux.
 * This hook provides type-safe access to the Redux store's state in components.
 */
export { useAppSelector };

/**
 * Exports the authReducer from the authSlice for use in the root reducer.
 * This reducer manages the authentication-related state in the application.
 */
export const authReducer = slices.authReducer;

/**
 * Exports the profileReducer from the profileSlice for use in the root reducer.
 * This reducer manages the user profile-related state in the application.
 */
export const profileReducer = slices.profileReducer;

/**
 * Exports the tribeReducer from the tribeSlice for use in the root reducer.
 * This reducer manages the tribe-related state in the application.
 */
export const tribeReducer = slices.tribeReducer;

/**
 * Exports the chatReducer from the chatSlice for use in the root reducer.
 * This reducer manages the chat-related state in the application.
 */
export const chatReducer = slices.chatReducer;

/**
 * Exports the eventReducer from the eventSlice for use in the root reducer.
 * This reducer manages the event-related state in the application.
 */
export const eventReducer = slices.eventReducer;

/**
 * Exports the notificationReducer from the notificationSlice for use in the root reducer.
 * This reducer manages the notification-related state in the application.
 */
export const notificationReducer = slices.notificationReducer;

/**
 * Exports the authActions from the authSlice for use in components and thunks.
 * These actions are used to update the authentication-related state in the application.
 */
export const authActions = slices.authActions;

/**
 * Exports the profileActions from the profileSlice for use in components and thunks.
 * These actions are used to update the user profile-related state in the application.
 */
export const profileActions = slices.profileActions;

/**
 * Exports the tribeActions from the tribeSlice for use in components and thunks.
 * These actions are used to update the tribe-related state in the application.
 */
export const tribeActions = slices.tribeActions;

/**
 * Exports the chatActions from the chatSlice for use in components and thunks.
 * These actions are used to update the chat-related state in the application.
 */
export const chatActions = slices.chatActions;

/**
 * Exports the eventActions from the eventSlice for use in components and thunks.
 * These actions are used to update the event-related state in the application.
 */
export const eventActions = slices.eventActions;

/**
 * Exports the notificationActions from the notificationSlice for use in components and thunks.
 * These actions are used to update the notification-related state in the application.
 */
export const notificationActions = slices.notificationActions;

/**
 * Re-exports all thunk action creators from the thunks module.
 * This allows for easy access to all thunks from a single import.
 */
export * from './thunks';