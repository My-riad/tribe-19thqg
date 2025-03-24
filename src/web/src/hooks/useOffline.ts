import { useState, useEffect, useCallback } from 'react'; // ^18.2.0
import NetInfo from '@react-native-community/netinfo'; // ^9.3.10
import { offlineService } from '../services/offlineService';
import { CONFIG } from '../constants/config';
import { STORAGE_KEYS } from '../constants/storageKeys';

/**
 * Interface defining the return value of the useOffline hook
 */
interface OfflineContextType {
  isOffline: boolean;
  isOfflineEnabled: boolean;
  checkConnection: () => Promise<boolean>;
  queueAction: (action: { type: string; payload: any }) => Promise<void>;
  syncOfflineData: () => Promise<{ success: boolean; processed: number; failed: number }>;
  cacheData: <T>(key: string, data: T, options?: { expiry?: number }) => Promise<void>;
  getCachedData: <T>(key: string, defaultValue?: T) => Promise<T | null>;
  removeCachedData: (key: string) => Promise<void>;
  queuedActionsCount: number;
  getQueuedActionsCount: () => Promise<number>;
}

/**
 * Interface defining the structure of actions queued for offline processing
 */
interface OfflineAction {
  type: string;
  payload: any;
  id: string;
  timestamp: number;
}

/**
 * Custom hook that provides offline functionality throughout the application
 * @returns Offline context object with connectivity state and offline utility methods
 */
export const useOffline = (): OfflineContextType => {
  // Check if offline mode is enabled using offlineService
  const offlineEnabled = offlineService.isOfflineEnabled();
  
  // Initialize state for current offline status
  const [offline, setOffline] = useState<boolean>(offlineService.isOffline());
  
  // Initialize state for queued actions count
  const [queuedActionsCount, setQueuedActionsCount] = useState<number>(0);

  // Memoized function to check connection status and update state
  const checkConnection = useCallback(async (): Promise<boolean> => {
    const connected = await offlineService.checkConnectivity();
    setOffline(!connected);
    return connected;
  }, []);

  // Memoized function to queue an action for offline processing
  const queueOfflineAction = useCallback(async (action: { type: string; payload: any }): Promise<void> => {
    if (!offlineEnabled) return;
    
    await offlineService.queueAction(action);
    
    // Update queued actions count after queueing a new action
    const actions = await offlineService.getQueuedActions();
    setQueuedActionsCount(actions.length);
  }, [offlineEnabled]);

  // Memoized function to process the offline action queue
  const syncOfflineData = useCallback(async (): Promise<{ success: boolean; processed: number; failed: number }> => {
    if (!offlineEnabled) {
      return { success: true, processed: 0, failed: 0 };
    }
    
    const result = await offlineService.processQueue();
    
    // Update queued actions count after processing
    const actions = await offlineService.getQueuedActions();
    setQueuedActionsCount(actions.length);
    
    return result;
  }, [offlineEnabled]);

  // Memoized function to cache data for offline access
  const cacheOfflineData = useCallback(async <T>(
    key: string, 
    data: T, 
    options?: { expiry?: number }
  ): Promise<void> => {
    if (!offlineEnabled) return;
    
    await offlineService.cacheData(key, data, options);
  }, [offlineEnabled]);

  // Memoized function to retrieve cached data
  const getCachedOfflineData = useCallback(async <T>(
    key: string, 
    defaultValue?: T
  ): Promise<T | null> => {
    if (!offlineEnabled) return defaultValue ?? null;
    
    return await offlineService.getCachedData<T>(key, defaultValue);
  }, [offlineEnabled]);

  // Memoized function to remove specific cached data
  const removeCachedOfflineData = useCallback(async (key: string): Promise<void> => {
    if (!offlineEnabled) return;
    
    await offlineService.removeCachedData(key);
  }, [offlineEnabled]);

  // Memoized function to get the current count of queued actions
  const getQueuedActionsCount = useCallback(async (): Promise<number> => {
    if (!offlineEnabled) return 0;
    
    const actions = await offlineService.getQueuedActions();
    return actions.length;
  }, [offlineEnabled]);

  // Set up network connectivity listener when component mounts
  useEffect(() => {
    if (!offlineEnabled) return;

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(!(state.isConnected ?? false));
      
      // If we're back online, attempt to sync queued actions
      if (state.isConnected) {
        syncOfflineData().catch(error => {
          console.error('Error syncing offline data:', error);
        });
      }
      
      // Update queued actions count when connectivity changes
      getQueuedActionsCount().then(count => {
        setQueuedActionsCount(count);
      }).catch(error => {
        console.error('Error getting queued actions count:', error);
      });
    });

    // Initial connectivity check on mount
    checkConnection().catch(error => {
      console.error('Error checking connection:', error);
    });

    // Cleanup network listener on unmount
    return () => {
      unsubscribe();
    };
  }, [offlineEnabled, checkConnection, syncOfflineData, getQueuedActionsCount]);

  // Update queued actions count when offline status changes
  useEffect(() => {
    if (!offlineEnabled) return;
    
    getQueuedActionsCount().then(count => {
      setQueuedActionsCount(count);
    }).catch(error => {
      console.error('Error getting queued actions count:', error);
    });
  }, [offlineEnabled, offline, getQueuedActionsCount]);

  // Return an object with offline state and utility methods
  return {
    isOffline: offline,
    isOfflineEnabled: offlineEnabled,
    checkConnection,
    queueAction: queueOfflineAction,
    syncOfflineData,
    cacheData: cacheOfflineData,
    getCachedData: getCachedOfflineData,
    removeCachedData: removeCachedOfflineData,
    queuedActionsCount,
    getQueuedActionsCount
  };
};