import { Platform, PermissionsAndroid } from 'react-native'; // react-native v0.72+
import { Coordinates } from '../types/profile.types';
import { CONFIG } from '../constants/config';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { storageService } from './storageService';
import {
  requestLocationPermission as requestPermission,
  getCurrentPosition,
  watchPosition,
  clearWatch,
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  isWithinRadius
} from '../utils/location';

/**
 * Service that provides location-related functionality for the Tribe application.
 * Handles device location retrieval, location tracking, geocoding, permission
 * management, and location preferences.
 */
const locationService = {
  /**
   * Initializes the location service and checks for existing permissions
   * @returns Promise resolving to true if location services are enabled
   */
  initLocationService: async (): Promise<boolean> => {
    try {
      // Check if location tracking is enabled in app configuration
      if (!CONFIG.FEATURES.ENABLE_LOCATION_TRACKING) {
        return false;
      }

      // Retrieve stored permission status
      const permissionStatus = await storageService.getData<boolean>(
        STORAGE_KEYS.LOCATION_PERMISSION,
        false
      );

      // If no stored status, request permission
      if (!permissionStatus) {
        const granted = await locationService.requestLocationPermission();
        return granted;
      }

      return permissionStatus;
    } catch (error) {
      console.error('Failed to initialize location service:', error);
      return false;
    }
  },

  /**
   * Requests location permission from the user
   * @returns Promise resolving to true if permission granted
   */
  requestLocationPermission: async (): Promise<boolean> => {
    try {
      const granted = await requestPermission();
      // Store the permission result
      await storageService.storeData(STORAGE_KEYS.LOCATION_PERMISSION, granted);
      return granted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  },

  /**
   * Gets the current user location
   * @param options Optional configuration options for location retrieval
   * @returns Promise resolving to user coordinates
   */
  getUserLocation: async (
    options?: Partial<{
      enableHighAccuracy: boolean;
      timeout: number;
      maximumAge: number;
    }>
  ): Promise<Coordinates> => {
    // Check if location tracking is enabled
    if (!CONFIG.FEATURES.ENABLE_LOCATION_TRACKING) {
      throw new Error('Location tracking is disabled in app configuration');
    }

    // Check if permission has been granted
    const hasPermission = await storageService.getData<boolean>(
      STORAGE_KEYS.LOCATION_PERMISSION,
      false
    );

    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    try {
      const coordinates = await getCurrentPosition(options);
      
      // Store as last known location
      await storageService.storeData(STORAGE_KEYS.LAST_KNOWN_LOCATION, coordinates);
      
      return coordinates;
    } catch (error) {
      console.error('Error getting user location:', error);
      throw new Error(`Failed to get user location: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Retrieves the last known location from storage
   * @returns Promise resolving to coordinates or null if not available
   */
  getLastKnownLocation: async (): Promise<Coordinates | null> => {
    try {
      const location = await storageService.getData<Coordinates>(
        STORAGE_KEYS.LAST_KNOWN_LOCATION
      );
      
      return location || null;
    } catch (error) {
      console.error('Error retrieving last known location:', error);
      return null;
    }
  },

  /**
   * Starts tracking user location with a callback for updates
   * @param callback Function to call when location updates
   * @param options Optional configuration options for tracking
   * @returns Promise resolving to watch ID that can be used to stop tracking
   */
  startLocationTracking: async (
    callback: (coordinates: Coordinates) => void,
    options?: Partial<{
      enableHighAccuracy: boolean;
      timeout: number;
      maximumAge: number;
      distanceFilter: number;
    }>
  ): Promise<number> => {
    // Check if location tracking is enabled
    if (!CONFIG.FEATURES.ENABLE_LOCATION_TRACKING) {
      throw new Error('Location tracking is disabled in app configuration');
    }

    // Check if permission has been granted
    const hasPermission = await storageService.getData<boolean>(
      STORAGE_KEYS.LOCATION_PERMISSION,
      false
    );

    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    // Set default options if none provided
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: CONFIG.TIMEOUTS.LOCATION_UPDATE_INTERVAL,
      maximumAge: 0,
      distanceFilter: 100, // meters
      ...options,
    };

    // Create a wrapped callback that stores location and calls the original callback
    const wrappedCallback = async (coordinates: Coordinates) => {
      try {
        await storageService.storeData(STORAGE_KEYS.LAST_KNOWN_LOCATION, coordinates);
        callback(coordinates);
      } catch (error) {
        console.error('Error in location tracking callback:', error);
      }
    };

    return watchPosition(wrappedCallback, defaultOptions);
  },

  /**
   * Stops tracking user location
   * @param watchId Watch ID returned by startLocationTracking
   */
  stopLocationTracking: (watchId: number): void => {
    clearWatch(watchId);
  },

  /**
   * Searches for a location by address string
   * @param address Address string to search for
   * @returns Promise resolving to coordinates
   */
  searchLocationByAddress: async (address: string): Promise<Coordinates> => {
    try {
      return await geocodeAddress(address);
    } catch (error) {
      console.error('Error searching location by address:', error);
      throw new Error(`Failed to search location: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Gets a formatted address from coordinates
   * @param coordinates Coordinates to get address for
   * @returns Promise resolving to formatted address
   */
  getAddressFromCoordinates: async (coordinates: Coordinates): Promise<string> => {
    try {
      return await reverseGeocode(coordinates);
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      throw new Error(`Failed to get address: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Calculates the distance between two locations
   * @param coords1 First coordinates
   * @param coords2 Second coordinates
   * @returns Distance in kilometers
   */
  calculateDistanceBetween: (coords1: Coordinates, coords2: Coordinates): number => {
    return calculateDistance(coords1, coords2);
  },

  /**
   * Checks if a location is within a specified radius of another location
   * @param centerCoords Center coordinates
   * @param targetCoords Target coordinates to check
   * @param radiusKm Radius in kilometers
   * @returns True if location is within radius
   */
  isLocationWithinRadius: (
    centerCoords: Coordinates,
    targetCoords: Coordinates,
    radiusKm: number
  ): boolean => {
    return isWithinRadius(centerCoords, targetCoords, radiusKm);
  },

  /**
   * Finds locations within a specified radius of a center point
   * @param centerCoords Center coordinates
   * @param locationsList List of locations to check
   * @param radiusKm Radius in kilometers
   * @returns Array of locations within the radius
   */
  getNearbyLocations: (
    centerCoords: Coordinates,
    locationsList: Coordinates[],
    radiusKm: number
  ): Coordinates[] => {
    return locationsList.filter(location => 
      locationService.isLocationWithinRadius(centerCoords, location, radiusKm)
    );
  },

  /**
   * Saves user location preference
   * @param preference Location preference object to save
   * @returns Promise that resolves when preference is saved
   */
  saveLocationPreference: async (preference: object): Promise<void> => {
    try {
      await storageService.storeData(STORAGE_KEYS.LOCATION_PREFERENCE, preference);
    } catch (error) {
      console.error('Error saving location preference:', error);
      throw new Error(`Failed to save location preference: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Retrieves user location preference
   * @returns Promise resolving to location preference or null
   */
  getLocationPreference: async (): Promise<object | null> => {
    try {
      return await storageService.getData(STORAGE_KEYS.LOCATION_PREFERENCE);
    } catch (error) {
      console.error('Error retrieving location preference:', error);
      return null;
    }
  },

  /**
   * Clears all stored location data
   * @returns Promise that resolves when data is cleared
   */
  clearLocationData: async (): Promise<void> => {
    try {
      await storageService.removeData(STORAGE_KEYS.LAST_KNOWN_LOCATION);
      await storageService.removeData(STORAGE_KEYS.LOCATION_PERMISSION);
      await storageService.removeData(STORAGE_KEYS.LOCATION_PREFERENCE);
    } catch (error) {
      console.error('Error clearing location data:', error);
      throw new Error(`Failed to clear location data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

export { locationService };