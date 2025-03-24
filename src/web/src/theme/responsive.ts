import { Dimensions, PixelRatio, Platform } from 'react-native';

/**
 * Screen width breakpoints in pixels for different device categories
 */
export const breakpoints = {
  small: 375, // small phones (width < 375px)
  medium: 414, // standard phones (width >= 375px and < 576px)
  large: 576, // large phones (width >= 576px and < 768px)
  tablet: 768, // tablets (width >= 768px)
};

/**
 * Generic interface for responsive value options based on device size
 */
export interface ResponsiveOptions<T> {
  default: T;
  small?: T;
  tablet?: T;
}

/**
 * Defines the possible device orientations
 */
export type Orientation = 'portrait' | 'landscape';

/**
 * Determines if the current device is a small phone (width < 375px)
 * @returns True if the device is a small phone, false otherwise
 */
export const isSmallDevice = (): boolean => {
  const { width } = Dimensions.get('window');
  return width < breakpoints.small;
};

/**
 * Determines if the current device is a tablet (width >= 768px)
 * @returns True if the device is a tablet, false otherwise
 */
export const isTablet = (): boolean => {
  const { width } = Dimensions.get('window');
  return width >= breakpoints.tablet;
};

/**
 * Returns the appropriate value based on the current device size
 * @param options Object containing values for different device sizes
 * @returns The appropriate value for the current device size
 */
export const getResponsiveValue = <T>(options: ResponsiveOptions<T>): T => {
  if (isTablet() && options.tablet !== undefined) {
    return options.tablet;
  }
  
  if (isSmallDevice() && options.small !== undefined) {
    return options.small;
  }
  
  return options.default;
};

/**
 * Determines the current device orientation (portrait or landscape)
 * @returns The current orientation: 'portrait' or 'landscape'
 */
export const getOrientation = (): Orientation => {
  const { width, height } = Dimensions.get('window');
  return width > height ? 'landscape' : 'portrait';
};

/**
 * Calculates appropriate spacing value based on device size
 * @param baseSpacing Base spacing value
 * @returns Adjusted spacing value for current device
 */
export const getResponsiveSpacing = (baseSpacing: number): number => {
  if (isSmallDevice()) {
    return baseSpacing * 0.8; // Reduce spacing for small devices
  }
  
  if (isTablet()) {
    return baseSpacing * 1.2; // Increase spacing for tablets
  }
  
  return baseSpacing; // Default spacing for standard devices
};

/**
 * Gets the scale factor for font sizes based on device pixel density
 * Useful for adjusting text sizes across different devices
 * @returns Scale factor for font sizing
 */
export const getFontScale = (): number => {
  const pixelRatio = PixelRatio.getFontScale();
  
  // Normalize font scale to prevent extremely large or small text
  if (pixelRatio > 1.3) {
    return 1.3;
  } else if (pixelRatio < 0.8) {
    return 0.8;
  }
  
  return pixelRatio;
};

/**
 * Listens for dimension changes (like rotation)
 * @param callback Function to execute when dimensions change
 * @returns Function to remove the event listener
 */
export const addDimensionListener = (
  callback: (dimensions: { window: { width: number; height: number }; screen: { width: number; height: number } }) => void
): (() => void) => {
  const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
    callback({ window, screen });
  });
  
  return () => subscription.remove();
};