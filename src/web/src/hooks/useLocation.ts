import { useState, useEffect, useCallback, useRef } from 'react'; // react v18.2.0
import { locationService } from '../services/locationService';
import { Coordinates } from '../types/profile.types';
import { CONFIG } from '../constants/config';

/**
 * Interface for the object returned by the useLocation hook
 */
export interface LocationHookResult {
  currentLocation: Coordinates | null;
  permissionStatus: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: (options?: object) => Promise<Coordinates>;
  startTracking: (callback: (location: Coordinates) => void, options?: object) => Promise<number>;
  stopTracking: () => void;
  searchByAddress: (address: string) => Promise<Coordinates>;
  getAddressFromCoordinates: (coordinates: Coordinates) => Promise<string>;
  calculateDistance: (coords1: Coordinates, coords2: Coordinates) => number;
  isWithinRadius: (centerCoords: Coordinates, targetCoords: Coordinates, radiusKm: number) => boolean;
  getNearbyLocations: (centerCoords: Coordinates, locationsList: Coordinates[], radiusKm: number) => Coordinates[];
  savePreference: (preference: object) => Promise<void>;
  getPreference: () => Promise<object | null>;
  clearData: () => Promise<void>;
}

/**
 * Custom hook that provides location functionality to React components
 * 
 * @returns Location hook interface with location state and methods
 */
const useLocation = (): LocationHookResult => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to store the watch ID for location tracking
  const watchIdRef = useRef<number | null>(null);
  
  // Initialize location service on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        const hasPermission = await locationService.initLocationService();
        setPermissionStatus(hasPermission);
        
        if (hasPermission) {
          const lastLocation = await locationService.getLastKnownLocation();
          if (lastLocation) {
            setCurrentLocation(lastLocation);
          }
        }
      } catch (err) {
        setError(`Failed to initialize location service: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Check if location tracking is enabled in app configuration
    if (CONFIG.FEATURES.ENABLE_LOCATION_TRACKING) {
      initialize();
    }
  }, []);
  
  // Clean up location tracking on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        locationService.stopLocationTracking(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);
  
  /**
   * Request location permission from the user
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const granted = await locationService.requestLocationPermission();
      setPermissionStatus(granted);
      
      return granted;
    } catch (err) {
      setError(`Failed to request location permission: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Get current location
   */
  const getCurrentLocation = useCallback(async (
    options?: Partial<{
      enableHighAccuracy: boolean;
      timeout: number;
      maximumAge: number;
    }>
  ): Promise<Coordinates> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const location = await locationService.getUserLocation(options);
      setCurrentLocation(location);
      
      return location;
    } catch (err) {
      setError(`Failed to get current location: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Start tracking location with a callback for updates
   */
  const startTracking = useCallback(async (
    callback: (location: Coordinates) => void,
    options?: Partial<{
      enableHighAccuracy: boolean;
      timeout: number;
      maximumAge: number;
      distanceFilter: number;
    }>
  ): Promise<number> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Stop existing tracking if any
      if (watchIdRef.current !== null) {
        locationService.stopLocationTracking(watchIdRef.current);
      }
      
      // Create a wrapped callback that updates state and calls the original callback
      const wrappedCallback = (location: Coordinates) => {
        setCurrentLocation(location);
        callback(location);
      };
      
      const watchId = await locationService.startLocationTracking(wrappedCallback, options);
      watchIdRef.current = watchId;
      
      return watchId;
    } catch (err) {
      setError(`Failed to start location tracking: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Stop tracking location
   */
  const stopTracking = useCallback((): void => {
    if (watchIdRef.current !== null) {
      locationService.stopLocationTracking(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);
  
  /**
   * Search for a location by address
   */
  const searchByAddress = useCallback(async (address: string): Promise<Coordinates> => {
    try {
      setIsLoading(true);
      setError(null);
      
      return await locationService.searchLocationByAddress(address);
    } catch (err) {
      setError(`Failed to search location by address: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Get address from coordinates
   */
  const getAddressFromCoordinates = useCallback(async (coordinates: Coordinates): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      
      return await locationService.getAddressFromCoordinates(coordinates);
    } catch (err) {
      setError(`Failed to get address from coordinates: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Calculate distance between two locations
   */
  const calculateDistance = useCallback((coords1: Coordinates, coords2: Coordinates): number => {
    try {
      return locationService.calculateDistanceBetween(coords1, coords2);
    } catch (err) {
      setError(`Failed to calculate distance: ${err instanceof Error ? err.message : String(err)}`);
      return -1;
    }
  }, []);
  
  /**
   * Check if a location is within a radius of another location
   */
  const isWithinRadius = useCallback((
    centerCoords: Coordinates,
    targetCoords: Coordinates,
    radiusKm: number
  ): boolean => {
    try {
      return locationService.isLocationWithinRadius(centerCoords, targetCoords, radiusKm);
    } catch (err) {
      setError(`Failed to check if location is within radius: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }, []);
  
  /**
   * Get nearby locations within a radius
   */
  const getNearbyLocations = useCallback((
    centerCoords: Coordinates,
    locationsList: Coordinates[],
    radiusKm: number
  ): Coordinates[] => {
    try {
      return locationService.getNearbyLocations(centerCoords, locationsList, radiusKm);
    } catch (err) {
      setError(`Failed to get nearby locations: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }, []);
  
  /**
   * Save location preference
   */
  const savePreference = useCallback(async (preference: object): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await locationService.saveLocationPreference(preference);
    } catch (err) {
      setError(`Failed to save location preference: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Get location preference
   */
  const getPreference = useCallback(async (): Promise<object | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      return await locationService.getLocationPreference();
    } catch (err) {
      setError(`Failed to get location preference: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Clear all location data
   */
  const clearData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await locationService.clearLocationData();
      setCurrentLocation(null);
      setPermissionStatus(false);
      
      if (watchIdRef.current !== null) {
        locationService.stopLocationTracking(watchIdRef.current);
        watchIdRef.current = null;
      }
    } catch (err) {
      setError(`Failed to clear location data: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    currentLocation,
    permissionStatus,
    isLoading,
    error,
    requestPermission,
    getCurrentLocation,
    startTracking,
    stopTracking,
    searchByAddress,
    getAddressFromCoordinates,
    calculateDistance,
    isWithinRadius,
    getNearbyLocations,
    savePreference,
    getPreference,
    clearData
  };
};

export { useLocation };
export default useLocation;