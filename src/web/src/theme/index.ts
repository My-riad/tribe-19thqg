/**
 * Central theme module for the Tribe application.
 * 
 * This file aggregates and exports all theme-related components including:
 * - colors: Color palette for the application
 * - typography: Font families, sizes, weights, and text styles
 * - spacing: Spacing system for consistent layout
 * - shadows: Shadow definitions for elevations
 * - breakpoints: Screen size breakpoints for responsive design
 * - responsive utilities: Functions for responsive behavior
 * - animations: Animation presets and utilities
 * 
 * The theme can be imported as a unified object:
 * `import { theme } from '../theme'`
 * 
 * Or individual components can be imported directly:
 * `import { colors, typography } from '../theme'`
 */

// Import all theme-related modules
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';
import { 
  breakpoints,
  isSmallDevice,
  isTablet,
  getResponsiveValue,
  getOrientation,
  getResponsiveSpacing
} from './responsive';
import {
  timings,
  easings,
  fadeIn,
  fadeOut,
  scaleIn,
  scaleOut,
  slideInUp,
  slideOutDown,
  buttonPress,
  loadingSpinner,
  createAnimatedStyle,
  checkReducedMotion
} from './animations';

/**
 * Unified theme object that combines all theme elements for easy consumption
 * throughout the application.
 */
const theme = {
  colors,
  typography,
  spacing,
  shadows,
  breakpoints,
  animations: {
    timings,
    easings,
    fadeIn,
    fadeOut,
    scaleIn,
    scaleOut,
    slideInUp,
    slideOutDown,
    buttonPress,
    loadingSpinner,
    createAnimatedStyle,
    checkReducedMotion
  }
};

// Export the unified theme object
export { theme };

// Re-export individual modules for direct access
export { colors };
export { typography };
export { spacing };
export { shadows };
export { breakpoints, isSmallDevice, isTablet, getResponsiveValue, getOrientation, getResponsiveSpacing };
export { 
  timings, 
  easings, 
  fadeIn, 
  fadeOut, 
  scaleIn, 
  scaleOut, 
  slideInUp, 
  slideOutDown, 
  buttonPress, 
  loadingSpinner,
  createAnimatedStyle,
  checkReducedMotion
};

// Export the theme as default
export default theme;