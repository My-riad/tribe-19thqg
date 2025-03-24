import { 
  configureStore, 
  combineReducers, 
  Middleware, 
  ReducersMapObject, 
  Reducer, 
  Action, 
  ThunkAction,
  getDefaultMiddleware
} from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer, 
  FLUSH, 
  REHYDRATE, 
  PAUSE, 
  PERSIST, 
  PURGE, 
  REGISTER,
  PersistConfig 
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import reducers from slices
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import chatReducer from './slices/chatSlice';
import eventReducer from './slices/eventSlice';
import notificationReducer from './slices/notificationSlice';

/**
 * Define the root state type, which combines all slice states
 */
export interface RootState {
  auth: ReturnType<typeof authReducer>;
  profile: ReturnType<typeof profileReducer>;
  tribes: object; // Placeholder for dynamically loaded tribes reducer
  chat: ReturnType<typeof chatReducer>;
  events: ReturnType<typeof eventReducer>;
  notifications: ReturnType<typeof notificationReducer>;
}

/**
 * Configuration for Redux Persist
 * Specifies which parts of the state to persist and where to store them
 */
const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'profile', 'tribes'], // Only persist these reducers
  blacklist: [] // Don't persist these reducers
};

/**
 * Core reducers that are loaded at startup
 */
const coreReducers: ReducersMapObject<Partial<RootState>> = {
  auth: authReducer,
  profile: profileReducer,
  chat: chatReducer,
  events: eventReducer,
  notifications: notificationReducer
};

/**
 * Object to store dynamically loaded reducers
 */
const asyncReducers: ReducersMapObject = {};

/**
 * Initial placeholder reducer for tribes slice to avoid circular dependency
 */
const initialTribesReducer: Reducer = (state = {}, action) => state;

/**
 * Configure middleware with serialization check ignoring Redux Persist actions
 */
const middleware = getDefaultMiddleware({
  serializableCheck: {
    ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
  }
});

/**
 * Create the combined root reducer with persistence
 */
const rootReducer: Reducer<RootState> = persistReducer(
  persistConfig,
  combineReducers({
    ...coreReducers,
    tribes: initialTribesReducer,
    ...asyncReducers
  })
);

/**
 * Configure and create the Redux store
 */
export const store = configureStore({
  reducer: rootReducer,
  middleware,
  devTools: true
});

/**
 * Create the Redux Persist persistor
 */
export const persistor = persistStore(store);

/**
 * Function to dynamically register additional reducers
 * 
 * @param key - The state key for the reducer
 * @param reducer - The reducer function to register
 */
export const registerReducer = (key: string, reducer: Reducer): void => {
  // Add the reducer to the asyncReducers object
  asyncReducers[key] = reducer;
  
  // Create a new combined reducer with all reducers
  const newRootReducer = persistReducer(
    persistConfig, 
    combineReducers({
      ...coreReducers,
      tribes: initialTribesReducer,
      ...asyncReducers
    })
  );
  
  // Replace the store's reducer with the new one
  store.replaceReducer(newRootReducer);
};

/**
 * Type for the store dispatch function
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Type for thunk actions
 */
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;