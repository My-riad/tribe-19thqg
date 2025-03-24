import { useState, useEffect, useCallback } from 'react';
import { Dimensions } from 'react-native';
import {
  breakpoints,
  isSmallDevice,
  isTablet,
  getResponsiveValue,
  getOrientation,
  getResponsiveSpacing,
  ResponsiveOptions,
  Orientation,
} from '../theme/responsive';

/**
 * Interface defining the return type of the useResponsive hook
 */
interface ResponsiveInfo {
  width: number;
  height: number;
  isSmall: boolean;
  isTablet: boolean;
  orientation: Orientation;
  getResponsiveValue: <T>(options: ResponsiveOptions<T>) => T;
  getResponsiveSpacing: (baseSpacing: number) => number;
}

/**
 * Custom hook that provides responsive design utilities with reactive updates on dimension changes
 * @returns Object containing responsive utilities and current device information
 */
const useResponsive = (): ResponsiveInfo => {
  // Initialize state for current dimensions
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  // Initialize state for current orientation
  const [orientation, setOrientation] = useState<Orientation>(() => getOrientation());

  // Create a memoized handler for dimension changes
  const handleDimensionChange = useCallback(({ window }) => {
    setDimensions(window);
    setOrientation(getOrientation());
  }, []);

  // Set up an effect to listen for dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', handleDimensionChange);
    
    // Clean up the event listener when the component unmounts
    return () => subscription.remove();
  }, [handleDimensionChange]);

  // Calculate derived values based on current dimensions
  const { width, height } = dimensions;
  const currentIsSmall = width < breakpoints.small;
  const currentIsTablet = width >= breakpoints.tablet;

  // Return an object with all responsive utilities and current device information
  return {
    width,
    height,
    isSmall: currentIsSmall,
    isTablet: currentIsTablet,
    orientation,
    getResponsiveValue: <T>(options: ResponsiveOptions<T>): T => {
      if (currentIsTablet && options.tablet !== undefined) {
        return options.tablet;
      }
      
      if (currentIsSmall && options.small !== undefined) {
        return options.small;
      }
      
      return options.default;
    },
    getResponsiveSpacing: (baseSpacing: number): number => {
      if (currentIsSmall) {
        return baseSpacing * 0.8; // Reduce spacing for small devices
      }
      
      if (currentIsTablet) {
        return baseSpacing * 1.2; // Increase spacing for tablets
      }
      
      return baseSpacing; // Default spacing for standard devices
    },
  };
};

export { useResponsive };