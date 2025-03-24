import NetInfo from '@react-native-community/netinfo'; // v9.3.10
import { storageService } from './storageService';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { CONFIG } from '../constants/config';
import { isConnected } from '../utils/deviceInfo';

// Global state
const isOfflineEnabled = CONFIG.FEATURES.ENABLE_OFFLINE_MODE;
let currentNetworkState = { isConnected: true, lastChecked: Date.now() };
let syncInProgress = false;

// Types for offline actions
interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount?: number;
}

// Types for cached data
interface CachedData<T> {
  data: T;
  timestamp: number;
  expiry?: number;
}

/**
 * Initializes the offline service and sets up network connectivity listeners
 * @returns Promise that resolves when initialization is complete
 */
const initOfflineService = async (): Promise<void> => {
  if (!isOfflineEnabled) {
    return;
  }

  // Set up network connectivity listener
  NetInfo.addEventListener(state => {
    currentNetworkState = {
      isConnected: state.isConnected ?? false,
      lastChecked: Date.now()
    };

    // If we just came online, try to process queued actions
    if (state.isConnected) {
      processQueue().catch(error => {
        console.error('Error processing offline queue:', error);
      });
    }
  });

  // Perform initial connectivity check
  currentNetworkState.isConnected = await isConnected();
  currentNetworkState.lastChecked = Date.now();

  // Process any pending offline actions if we're online
  if (currentNetworkState.isConnected) {
    processQueue().catch(error => {
      console.error('Error processing offline queue:', error);
    });
  }
};

/**
 * Checks if offline mode is enabled in the application
 * @returns True if offline mode is enabled, false otherwise
 */
const isOfflineEnabled = (): boolean => {
  return CONFIG.FEATURES.ENABLE_OFFLINE_MODE;
};

/**
 * Checks if the device is currently offline
 * @returns True if the device is offline, false if online
 */
const isOffline = (): boolean => {
  // If offline mode is disabled, always return false
  if (!isOfflineEnabled()) {
    return false;
  }

  // Use cached status if checked recently (within last 5 seconds)
  const CACHE_DURATION = 5000; // 5 seconds
  if (Date.now() - currentNetworkState.lastChecked < CACHE_DURATION) {
    return !currentNetworkState.isConnected;
  }

  // Otherwise, we'll do a new check next time
  // This is asynchronous but we return the cached state for now
  checkConnectivity().catch(error => {
    console.error('Error checking connectivity:', error);
  });

  return !currentNetworkState.isConnected;
};

/**
 * Performs a real-time check of network connectivity
 * @returns Promise resolving to true if connected, false otherwise
 */
const checkConnectivity = async (): Promise<boolean> => {
  try {
    const connected = await isConnected();
    currentNetworkState = {
      isConnected: connected,
      lastChecked: Date.now()
    };
    return connected;
  } catch (error) {
    console.error('Error checking connectivity:', error);
    return currentNetworkState.isConnected;
  }
};

/**
 * Queues an action to be performed when connectivity is restored
 * @param action The action to queue
 * @returns Promise that resolves when the action is queued
 */
const queueAction = async (action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void> => {
  if (!isOfflineEnabled()) {
    return;
  }

  // Validate action
  if (!action.type || !action.payload) {
    throw new Error('Invalid action: must include type and payload');
  }

  // Create a full action with ID and timestamp
  const fullAction: OfflineAction = {
    ...action,
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
    retryCount: 0
  };

  try {
    // Get existing queue
    const existingQueue = await storageService.getData<OfflineAction[]>(
      STORAGE_KEYS.OFFLINE_ACTIONS_QUEUE,
      []
    );

    // Add new action to queue
    const updatedQueue = [...existingQueue, fullAction];
    
    // Store updated queue
    await storageService.storeData(STORAGE_KEYS.OFFLINE_ACTIONS_QUEUE, updatedQueue);

    // If we're actually online, try to process the queue immediately
    if (await checkConnectivity()) {
      processQueue().catch(error => {
        console.error('Error processing offline queue:', error);
      });
    }
  } catch (error) {
    console.error('Error queuing offline action:', error);
    throw new Error('Failed to queue action for offline use');
  }
};

/**
 * Processes queued actions when connectivity is available
 * @returns Results of the queue processing
 */
const processQueue = async (): Promise<{ success: boolean; processed: number; failed: number }> => {
  // If offline mode is disabled, just return success
  if (!isOfflineEnabled()) {
    return { success: true, processed: 0, failed: 0 };
  }

  // Prevent multiple simultaneous processing attempts
  if (syncInProgress) {
    return { success: false, processed: 0, failed: 0 };
  }

  // Check if we're actually online
  const connected = await checkConnectivity();
  if (!connected) {
    return { success: false, processed: 0, failed: 0 };
  }

  syncInProgress = true;
  let processed = 0;
  let failed = 0;

  try {
    // Get the queue
    const queue = await storageService.getData<OfflineAction[]>(
      STORAGE_KEYS.OFFLINE_ACTIONS_QUEUE,
      []
    );

    if (queue.length === 0) {
      // No actions to process
      await storageService.storeData(STORAGE_KEYS.LAST_SYNC_TIMESTAMP, Date.now());
      syncInProgress = false;
      return { success: true, processed: 0, failed: 0 };
    }

    // Process each action in order
    const remainingActions: OfflineAction[] = [];

    for (const action of queue) {
      try {
        // Here we would implement the actual processing logic based on action type
        // This would typically involve making API calls to synchronize data
        // For example:
        switch (action.type) {
          case 'CREATE_PROFILE':
            // await apiService.createProfile(action.payload);
            break;
          case 'UPDATE_PROFILE':
            // await apiService.updateProfile(action.payload);
            break;
          case 'JOIN_TRIBE':
            // await apiService.joinTribe(action.payload);
            break;
          case 'LEAVE_TRIBE':
            // await apiService.leaveTribe(action.payload);
            break;
          case 'CREATE_EVENT':
            // await apiService.createEvent(action.payload);
            break;
          case 'UPDATE_EVENT':
            // await apiService.updateEvent(action.payload);
            break;
          case 'SEND_MESSAGE':
            // await apiService.sendMessage(action.payload);
            break;
          case 'UPDATE_RSVP':
            // await apiService.updateRsvp(action.payload);
            break;
          default:
            throw new Error(`Unknown action type: ${action.type}`);
        }
        
        // Mock processing delay for demonstration
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // If we get here, action was processed successfully
        processed++;
      } catch (error) {
        // Action processing failed
        console.error(`Error processing offline action ${action.type}:`, error);
        
        // Increment retry count and keep in queue if under max retries
        const MAX_RETRIES = 3;
        const retryCount = (action.retryCount || 0) + 1;
        
        if (retryCount < MAX_RETRIES) {
          remainingActions.push({
            ...action,
            retryCount
          });
        } else {
          // Action failed too many times
          failed++;
        }
      }
    }

    // Update the queue with only the remaining actions
    await storageService.storeData(STORAGE_KEYS.OFFLINE_ACTIONS_QUEUE, remainingActions);
    
    // Update last sync timestamp
    await storageService.storeData(STORAGE_KEYS.LAST_SYNC_TIMESTAMP, Date.now());

    return { success: true, processed, failed };
  } catch (error) {
    console.error('Error processing offline queue:', error);
    return { success: false, processed, failed };
  } finally {
    syncInProgress = false;
  }
};

/**
 * Clears all queued offline actions
 * @returns Promise that resolves when the queue is cleared
 */
const clearQueue = async (): Promise<void> => {
  try {
    await storageService.removeData(STORAGE_KEYS.OFFLINE_ACTIONS_QUEUE);
  } catch (error) {
    console.error('Error clearing offline queue:', error);
    throw new Error('Failed to clear offline queue');
  }
};

/**
 * Retrieves all currently queued offline actions
 * @returns Promise resolving to array of queued actions
 */
const getQueuedActions = async (): Promise<Array<OfflineAction>> => {
  try {
    return await storageService.getData<OfflineAction[]>(
      STORAGE_KEYS.OFFLINE_ACTIONS_QUEUE,
      []
    );
  } catch (error) {
    console.error('Error getting queued actions:', error);
    return [];
  }
};

/**
 * Gets the timestamp of the last successful synchronization
 * @returns Promise resolving to timestamp of last sync
 */
const getLastSyncTimestamp = async (): Promise<number> => {
  try {
    return await storageService.getData<number>(
      STORAGE_KEYS.LAST_SYNC_TIMESTAMP,
      0
    );
  } catch (error) {
    console.error('Error getting last sync timestamp:', error);
    return 0;
  }
};

/**
 * Caches data for offline access
 * @param key The cache key
 * @param data The data to cache
 * @param options Optional caching options
 * @returns Promise that resolves when data is cached
 */
const cacheData = async (
  key: string,
  data: any,
  options?: { expiry?: number }
): Promise<void> => {
  if (!isOfflineEnabled()) {
    return;
  }

  if (!key || typeof key !== 'string') {
    throw new Error('Cache key must be a non-empty string');
  }

  if (data === undefined || data === null) {
    throw new Error('Cannot cache undefined or null data');
  }

  try {
    // Check data size (rough estimation)
    const dataSize = JSON.stringify(data).length;
    const MAX_CACHE_SIZE = CONFIG.STORAGE.OFFLINE_STORAGE_LIMIT;
    
    if (dataSize > MAX_CACHE_SIZE) {
      throw new Error(`Data too large to cache: ${dataSize} bytes exceeds limit of ${MAX_CACHE_SIZE} bytes`);
    }

    // Create cache entry with metadata
    const cacheEntry: CachedData<any> = {
      data,
      timestamp: Date.now(),
      expiry: options?.expiry || CONFIG.STORAGE.CACHE_EXPIRY
    };

    // Cache key prefix for offline data
    const cacheKey = `offline_cache_${key}`;
    
    // Store in storage
    await storageService.storeData(cacheKey, cacheEntry);
  } catch (error) {
    console.error(`Error caching data for key ${key}:`, error);
    throw new Error(`Failed to cache data for key: ${key}`);
  }
};

/**
 * Retrieves cached data for offline access
 * @param key The cache key
 * @param defaultValue Default value to return if no cached data found
 * @returns Promise resolving to cached data or default value
 */
const getCachedData = async <T>(key: string, defaultValue?: T): Promise<T | null> => {
  if (!isOfflineEnabled()) {
    return defaultValue ?? null;
  }

  if (!key || typeof key !== 'string') {
    throw new Error('Cache key must be a non-empty string');
  }

  try {
    // Cache key prefix for offline data
    const cacheKey = `offline_cache_${key}`;
    
    // Get cached entry
    const cacheEntry = await storageService.getData<CachedData<T>>(cacheKey, null);

    if (!cacheEntry) {
      return defaultValue ?? null;
    }

    // Check if data has expired
    const now = Date.now();
    const expiryTime = cacheEntry.timestamp + (cacheEntry.expiry || CONFIG.STORAGE.CACHE_EXPIRY);
    
    if (now > expiryTime) {
      // Data has expired, remove it
      await storageService.removeData(cacheKey);
      return defaultValue ?? null;
    }

    // Return cached data
    return cacheEntry.data;
  } catch (error) {
    console.error(`Error retrieving cached data for key ${key}:`, error);
    return defaultValue ?? null;
  }
};

/**
 * Removes specific cached data
 * @param key The cache key
 * @returns Promise that resolves when cached data is removed
 */
const removeCachedData = async (key: string): Promise<void> => {
  if (!key || typeof key !== 'string') {
    throw new Error('Cache key must be a non-empty string');
  }

  try {
    // Cache key prefix for offline data
    const cacheKey = `offline_cache_${key}`;
    await storageService.removeData(cacheKey);
  } catch (error) {
    console.error(`Error removing cached data for key ${key}:`, error);
    throw new Error(`Failed to remove cached data for key: ${key}`);
  }
};

/**
 * Clears all cached data used for offline access
 * @returns Promise that resolves when all cached data is cleared
 */
const clearAllCachedData = async (): Promise<void> => {
  try {
    // Get all keys
    const allKeys = await storageService.getAllKeys();
    
    // Filter for offline cache keys
    const cacheKeys = allKeys.filter(key => key.startsWith('offline_cache_'));
    
    // Remove each cached item
    for (const key of cacheKeys) {
      await storageService.removeData(key);
    }
  } catch (error) {
    console.error('Error clearing all cached data:', error);
    throw new Error('Failed to clear cached data');
  }
};

// Export the offline service with all its functions
export const offlineService = {
  initOfflineService,
  isOfflineEnabled,
  isOffline,
  checkConnectivity,
  queueAction,
  processQueue,
  clearQueue,
  getQueuedActions,
  getLastSyncTimestamp,
  cacheData,
  getCachedData,
  removeCachedData,
  clearAllCachedData
};