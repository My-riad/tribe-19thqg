import AsyncStorage from '@react-native-async-storage/async-storage'; // v1.18.1
import * as SecureStore from 'expo-secure-store'; // v12.0.0
import { STORAGE_PREFIX, STORAGE_KEYS, SECURE_STORAGE_KEYS } from '../constants/storageKeys';

/**
 * Service that provides a unified interface for data storage operations in the Tribe application.
 * It handles both regular storage for non-sensitive data and secure storage for sensitive information
 * like authentication tokens. The service abstracts away the underlying storage implementations
 * and provides consistent error handling.
 */
const storageService = {
  /**
   * Stores data in AsyncStorage with proper error handling
   * @param key The storage key
   * @param value The value to store
   * @returns Promise that resolves when data is stored successfully
   */
  storeData: async (key: string, value: any): Promise<void> => {
    if (!key || typeof key !== 'string') {
      throw new Error('Storage key must be a non-empty string');
    }

    try {
      const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
      const prefixedKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
      await AsyncStorage.setItem(prefixedKey, valueToStore);
    } catch (error) {
      console.error('Error storing data:', error);
      throw new Error(`Failed to store data for key: ${key}`);
    }
  },

  /**
   * Retrieves data from AsyncStorage with proper error handling
   * @param key The storage key
   * @param defaultValue Default value to return if no data is found
   * @returns Promise resolving to the stored data or defaultValue if not found
   */
  getData: async <T>(key: string, defaultValue?: T): Promise<T | null> => {
    if (!key || typeof key !== 'string') {
      throw new Error('Storage key must be a non-empty string');
    }

    try {
      const prefixedKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
      const value = await AsyncStorage.getItem(prefixedKey);
      
      if (value !== null) {
        try {
          return JSON.parse(value) as T;
        } catch {
          // If value is not valid JSON, return it as is
          return value as unknown as T;
        }
      }
      
      return defaultValue ?? null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return defaultValue ?? null;
    }
  },

  /**
   * Removes data from AsyncStorage with proper error handling
   * @param key The storage key
   * @returns Promise that resolves when data is removed successfully
   */
  removeData: async (key: string): Promise<void> => {
    if (!key || typeof key !== 'string') {
      throw new Error('Storage key must be a non-empty string');
    }

    try {
      const prefixedKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
      await AsyncStorage.removeItem(prefixedKey);
    } catch (error) {
      console.error('Error removing data:', error);
      throw new Error(`Failed to remove data for key: ${key}`);
    }
  },

  /**
   * Securely stores sensitive data using SecureStore with proper error handling
   * @param key The storage key
   * @param value The string value to store securely
   * @returns Promise that resolves when data is stored securely
   */
  storeSecureData: async (key: string, value: string): Promise<void> => {
    if (!key || typeof key !== 'string') {
      throw new Error('Storage key must be a non-empty string');
    }

    if (typeof value !== 'string') {
      throw new Error('Value must be a string for secure storage');
    }

    try {
      const prefixedKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
      await SecureStore.setItemAsync(prefixedKey, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
      });
    } catch (error) {
      console.error('Error storing secure data:', error);
      throw new Error(`Failed to store secure data for key: ${key}`);
    }
  },

  /**
   * Retrieves sensitive data from SecureStore with proper error handling
   * @param key The storage key
   * @param defaultValue Default value to return if no data is found
   * @returns Promise resolving to the stored secure data or defaultValue if not found
   */
  getSecureData: async (key: string, defaultValue?: string): Promise<string | null> => {
    if (!key || typeof key !== 'string') {
      throw new Error('Storage key must be a non-empty string');
    }

    try {
      const prefixedKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
      const value = await SecureStore.getItemAsync(prefixedKey);
      return value ?? defaultValue ?? null;
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return defaultValue ?? null;
    }
  },

  /**
   * Removes sensitive data from SecureStore with proper error handling
   * @param key The storage key
   * @returns Promise that resolves when secure data is removed successfully
   */
  removeSecureData: async (key: string): Promise<void> => {
    if (!key || typeof key !== 'string') {
      throw new Error('Storage key must be a non-empty string');
    }

    try {
      const prefixedKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
      await SecureStore.deleteItemAsync(prefixedKey);
    } catch (error) {
      console.error('Error removing secure data:', error);
      throw new Error(`Failed to remove secure data for key: ${key}`);
    }
  },

  /**
   * Clears all application data from both AsyncStorage and SecureStore
   * @returns Promise that resolves when all data is cleared
   */
  clearAllData: async (): Promise<void> => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();
      
      // Clear SecureStore (need to remove items individually)
      // Since the keys in SECURE_STORAGE_KEYS already contain the prefix,
      // we don't need to add it again
      const secureKeys = Object.values(SECURE_STORAGE_KEYS);
      for (const key of secureKeys) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error('Failed to clear all application data');
    }
  },

  /**
   * Retrieves all storage keys from AsyncStorage
   * @returns Promise resolving to an array of storage keys
   */
  getAllKeys: async (): Promise<string[]> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .map(key => key.slice(STORAGE_PREFIX.length));
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  },

  /**
   * Retrieves multiple items from AsyncStorage in a single operation
   * @param keys Array of storage keys
   * @returns Promise resolving to an array of key-value pairs
   */
  multiGet: async (keys: string[]): Promise<Array<[string, any]>> => {
    if (!Array.isArray(keys) || keys.some(key => typeof key !== 'string')) {
      throw new Error('Keys must be an array of strings');
    }

    try {
      const prefixedKeys = keys.map(key => 
        key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`
      );
      const keyValuePairs = await AsyncStorage.multiGet(prefixedKeys);
      
      return keyValuePairs.map(([key, value]) => {
        const keyWithoutPrefix = key.startsWith(STORAGE_PREFIX) 
          ? key.slice(STORAGE_PREFIX.length) 
          : key;
        
        if (value === null) {
          return [keyWithoutPrefix, null];
        }
        
        try {
          return [keyWithoutPrefix, JSON.parse(value)];
        } catch {
          return [keyWithoutPrefix, value];
        }
      });
    } catch (error) {
      console.error('Error retrieving multiple items:', error);
      return [];
    }
  },

  /**
   * Stores multiple items in AsyncStorage in a single operation
   * @param keyValuePairs Array of key-value pairs to store
   * @returns Promise that resolves when all items are stored
   */
  multiSet: async (keyValuePairs: Array<[string, any]>): Promise<void> => {
    if (!Array.isArray(keyValuePairs) || 
        keyValuePairs.some(pair => !Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'string')) {
      throw new Error('Invalid format for key-value pairs');
    }

    try {
      const processedPairs = keyValuePairs.map(([key, value]) => [
        key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`,
        typeof value === 'string' ? value : JSON.stringify(value)
      ]);
      
      await AsyncStorage.multiSet(processedPairs as [string, string][]);
    } catch (error) {
      console.error('Error storing multiple items:', error);
      throw new Error('Failed to store multiple items');
    }
  }
};

export { storageService };