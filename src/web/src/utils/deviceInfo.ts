/**
 * Device Information Utilities
 * 
 * This module provides functions for retrieving device-specific information such as
 * platform type, device model, screen dimensions, network connectivity status,
 * and other hardware characteristics.
 * 
 * These utilities are used throughout the application for:
 * - Responsive design and layout
 * - Platform-specific behaviors
 * - Analytics and monitoring
 * - Network status detection
 * - Device-specific optimizations
 */

import { Platform, Dimensions, PixelRatio, NativeModules } from 'react-native'; // v0.72+
import NetInfo from '@react-native-community/netinfo'; // v^9.3.10
import DeviceInfo from 'react-native-device-info'; // v^10.0.0

/**
 * Defines the possible device types
 */
export type DeviceType = 'phone' | 'tablet' | 'unknown';

/**
 * Defines the possible network connection types
 */
export type ConnectionType = 'wifi' | 'cellular' | 'bluetooth' | 'ethernet' | 'wimax' | 'vpn' | 'other' | 'none' | 'unknown';

/**
 * Interface for screen dimension information
 */
export interface ScreenDimensions {
  width: number;
  height: number;
}

/**
 * Returns the current platform (iOS or Android)
 * @returns The current platform ('ios' or 'android')
 */
export const getPlatform = (): string => {
  return Platform.OS;
};

/**
 * Checks if the current platform is iOS
 * @returns True if the platform is iOS, false otherwise
 */
export const isIOS = (): boolean => {
  return Platform.OS === 'ios';
};

/**
 * Checks if the current platform is Android
 * @returns True if the platform is Android, false otherwise
 */
export const isAndroid = (): boolean => {
  return Platform.OS === 'android';
};

/**
 * Returns the device model name
 * @returns The device model name
 */
export const getDeviceModel = (): string => {
  try {
    return DeviceInfo.getModel();
  } catch (error) {
    console.error('Error getting device model:', error);
    return 'unknown';
  }
};

/**
 * Returns the operating system version
 * @returns The OS version string
 */
export const getOSVersion = (): string => {
  try {
    return DeviceInfo.getSystemVersion();
  } catch (error) {
    console.error('Error getting OS version:', error);
    return 'unknown';
  }
};

/**
 * Returns the current screen dimensions
 * @returns An object containing width and height of the screen
 */
export const getScreenDimensions = (): ScreenDimensions => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

// Cache device type since it doesn't change during app usage
let cachedDeviceType: DeviceType | null = null;

/**
 * Determines the device type based on screen size and platform characteristics
 * @returns Device type: 'phone', 'tablet', or 'unknown'
 */
export const getDeviceType = (): DeviceType => {
  if (cachedDeviceType !== null) {
    return cachedDeviceType;
  }
  
  // Get screen dimensions
  const { width, height } = Dimensions.get('window');
  const screenSize = Math.min(width, height);
  
  if (isIOS()) {
    // For iOS, check screen dimensions and device type
    // iPad has a minimum screen width of 768 in portrait mode
    const isTablet = Platform.isPad || (screenSize >= 768);
    cachedDeviceType = isTablet ? 'tablet' : 'phone';
  } else if (isAndroid()) {
    // For Android, we can use a combination of screen size and pixel density
    const pixelDensity = PixelRatio.get();
    
    // A common approach is to consider it a tablet if the screen is larger than 6 inches
    // This is approximated by checking if the smaller dimension is >= 600dp
    const isTablet = screenSize / pixelDensity >= 600;
    cachedDeviceType = isTablet ? 'tablet' : 'phone';
  } else {
    cachedDeviceType = 'unknown';
  }
  
  return cachedDeviceType;
};

/**
 * Determines if the device has a notch or display cutout
 * @returns True if the device has a notch, false otherwise
 */
export const hasNotch = (): boolean => {
  try {
    return DeviceInfo.hasNotch();
  } catch (error) {
    console.error('Error checking for notch:', error);
    return false;
  }
};

/**
 * Returns the pixel density of the device screen
 * @returns The pixel density value
 */
export const getPixelDensity = (): number => {
  return PixelRatio.get();
};

/**
 * Checks if the device is currently connected to the internet
 * @returns Promise resolving to true if connected, false otherwise
 */
export const isConnected = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch (error) {
    console.error('Error checking connection status:', error);
    return false;
  }
};

/**
 * Gets the current network connection type
 * @returns Promise resolving to the connection type (wifi, cellular, none, etc.)
 */
export const getConnectionType = async (): Promise<ConnectionType> => {
  try {
    const state = await NetInfo.fetch();
    return state.type as ConnectionType;
  } catch (error) {
    console.error('Error getting connection type:', error);
    return 'unknown';
  }
};

/**
 * Checks if the device is in low power mode
 * @returns Promise resolving to true if in low power mode, false otherwise
 */
export const isLowPowerMode = async (): Promise<boolean> => {
  try {
    return await DeviceInfo.isPowerSaveMode();
  } catch (error) {
    console.error('Error checking low power mode:', error);
    return false;
  }
};

/**
 * Returns a unique identifier for the device
 * @returns Promise resolving to a unique device identifier
 */
export const getUniqueDeviceId = async (): Promise<string> => {
  try {
    return await DeviceInfo.getUniqueId();
  } catch (error) {
    console.error('Error getting unique device ID:', error);
    return '';
  }
};