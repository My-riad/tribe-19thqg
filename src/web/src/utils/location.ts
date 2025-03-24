import { Geolocation, PermissionsAndroid, Platform } from 'react-native'; // react-native v0.72+
import { Coordinates } from '../types/profile.types';
import { CONFIG } from '../constants/config';

/**
 * Requests location permission from the user
 * @returns Promise resolving to true if permission granted, false otherwise
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      // On iOS, permission is requested when Geolocation is used
      return true;
    }

    // For Android, request permission explicitly
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'Tribe needs access to your location to connect you with local Tribes and events.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Gets the current device location
 * @param options Optional Geolocation options
 * @returns Promise resolving to coordinates
 */
export const getCurrentPosition = (
  options?: Partial<{
    enableHighAccuracy: boolean;
    timeout: number;
    maximumAge: number;
  }>
): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: CONFIG.TIMEOUTS.LOCATION_UPDATE_INTERVAL,
      maximumAge: 10000, // 10 seconds
      ...options,
    };

    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(`Error getting current position: ${error.message}`);
      },
      defaultOptions
    );
  });
};

/**
 * Sets up continuous location tracking
 * @param callback Function to call when location updates
 * @param options Optional Geolocation options
 * @returns Watch ID that can be used to clear the watch
 */
export const watchPosition = (
  callback: (coordinates: Coordinates) => void,
  options?: Partial<{
    enableHighAccuracy: boolean;
    timeout: number;
    maximumAge: number;
    distanceFilter: number;
  }>
): number => {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: CONFIG.TIMEOUTS.LOCATION_UPDATE_INTERVAL,
    maximumAge: 0,
    distanceFilter: 100, // meters
    ...options,
  };

  return Geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      console.error('Error watching position:', error);
    },
    defaultOptions
  );
};

/**
 * Stops location tracking
 * @param watchId Watch ID returned by watchPosition
 */
export const clearWatch = (watchId: number): void => {
  Geolocation.clearWatch(watchId);
};

/**
 * Converts an address string to coordinates using Google Geocoding API
 * @param address Address string to geocode
 * @returns Promise resolving to coordinates
 */
export const geocodeAddress = async (address: string): Promise<Coordinates> => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const apiKey = CONFIG.EXTERNAL_SERVICES.GOOGLE_PLACES_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Geocoding error: ${data.status}`);
    }

    const { lat, lng } = data.results[0].geometry.location;
    return { latitude: lat, longitude: lng };
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw new Error(`Failed to geocode address: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Converts coordinates to an address string using Google Reverse Geocoding API
 * @param coordinates Coordinates to reverse geocode
 * @returns Promise resolving to formatted address
 */
export const reverseGeocode = async (coordinates: Coordinates): Promise<string> => {
  try {
    const { latitude, longitude } = coordinates;
    const apiKey = CONFIG.EXTERNAL_SERVICES.GOOGLE_PLACES_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Reverse geocoding error: ${data.status}`);
    }

    return data.results[0].formatted_address;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw new Error(`Failed to reverse geocode: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Calculates the distance between two coordinates using the Haversine formula
 * @param coords1 First coordinates
 * @param coords2 Second coordinates
 * @returns Distance in kilometers
 */
export const calculateDistance = (coords1: Coordinates, coords2: Coordinates): number => {
  // Handle edge cases
  if (!coords1 || !coords2) {
    return -1;
  }

  // Earth radius in kilometers
  const R = 6371;

  // Convert latitude and longitude from degrees to radians
  const lat1Rad = (coords1.latitude * Math.PI) / 180;
  const lat2Rad = (coords2.latitude * Math.PI) / 180;
  const lon1Rad = (coords1.longitude * Math.PI) / 180;
  const lon2Rad = (coords2.longitude * Math.PI) / 180;

  // Differences in coordinates
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Checks if a location is within a specified radius of another location
 * @param centerCoords Center coordinates
 * @param targetCoords Target coordinates to check
 * @param radiusKm Radius in kilometers
 * @returns True if location is within radius, false otherwise
 */
export const isWithinRadius = (
  centerCoords: Coordinates,
  targetCoords: Coordinates,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(centerCoords, targetCoords);
  return distance >= 0 && distance <= radiusKm;
};

/**
 * Formats an address object into a readable string
 * @param addressComponents Address components from Google Geocoding API
 * @returns Formatted address string
 */
export const formatAddress = (
  addressComponents: {
    long_name: string;
    short_name: string;
    types: string[];
  }[]
): string => {
  if (!addressComponents || !Array.isArray(addressComponents)) {
    return '';
  }

  // Extract components
  const getComponent = (types: string[]): string | undefined => {
    const component = addressComponents.find((c) =>
      types.some((type) => c.types.includes(type))
    );
    return component?.long_name;
  };

  const streetNumber = getComponent(['street_number']);
  const street = getComponent(['route']);
  const city = getComponent(['locality', 'administrative_area_level_3']);
  const state = getComponent(['administrative_area_level_1']);
  const postalCode = getComponent(['postal_code']);
  const country = getComponent(['country']);

  // Build address string
  const addressParts: string[] = [];

  // Street address
  if (streetNumber && street) {
    addressParts.push(`${streetNumber} ${street}`);
  } else if (street) {
    addressParts.push(street);
  }

  // City, State
  if (city && state) {
    addressParts.push(`${city}, ${state}`);
  } else if (city) {
    addressParts.push(city);
  } else if (state) {
    addressParts.push(state);
  }

  // Postal code
  if (postalCode) {
    // If we already have city/state, append the postal code to it
    if (addressParts.length > 0) {
      const lastIndex = addressParts.length - 1;
      addressParts[lastIndex] = `${addressParts[lastIndex]} ${postalCode}`;
    } else {
      addressParts.push(postalCode);
    }
  }

  // Country
  if (country) {
    addressParts.push(country);
  }

  return addressParts.join(', ');
};