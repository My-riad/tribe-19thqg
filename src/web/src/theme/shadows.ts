import { Platform } from 'react-native'; // react-native ^0.70.0

/**
 * Helper function to create platform-specific shadow objects
 * @param elevation The elevation level
 * @param color The shadow color
 * @param opacity The shadow opacity
 * @param radius The shadow radius
 * @returns Platform-specific shadow style object
 */
export const createShadow = (
  elevation: number,
  color: string = '#000000',
  opacity: number = 0.2,
  radius: number = elevation
) => {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: color,
      shadowOffset: {
        width: 0,
        height: elevation / 2,
      },
      shadowOpacity: opacity,
      shadowRadius: radius,
    };
  } else if (Platform.OS === 'android') {
    return {
      elevation,
    };
  } else {
    // Default for other platforms
    return {
      shadowColor: color,
      shadowOffset: {
        width: 0,
        height: elevation / 2,
      },
      shadowOpacity: opacity,
      shadowRadius: radius,
      elevation,
    };
  }
};

/**
 * Shadow definitions for different elevation levels in the Tribe application
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2.0,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 4.0,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6.0,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8.0,
    elevation: 12,
  },
};

export default shadows;