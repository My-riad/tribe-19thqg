import { Platform } from 'react-native'; // react-native v0.70.0+

/**
 * Type definition for font families
 */
export type FontFamily = {
  primary: string;
  secondary: string;
  monospace: string;
};

/**
 * Type definition for font sizes
 */
export type FontSize = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  h1: number;
  h2: number;
  h3: number;
  body: number;
  caption: number;
  button: number;
  small: number;
};

/**
 * Type definition for font weights
 */
export type FontWeight = {
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
};

/**
 * Type definition for line heights
 */
export type LineHeight = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
};

/**
 * Type definition for text styles
 */
export type TextStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  lineHeight: number;
};

/**
 * Type definition for predefined text styles
 */
export type TextStyles = {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  body: TextStyle;
  caption: TextStyle;
  button: TextStyle;
  small: TextStyle;
};

/**
 * Type definition for the complete typography system
 */
export type Typography = {
  fontFamily: FontFamily;
  fontSize: FontSize;
  fontWeight: FontWeight;
  lineHeight: LineHeight;
  textStyles: TextStyles;
};

/**
 * Returns the appropriate font family based on the current platform
 */
const getFontFamily = (): FontFamily => {
  if (Platform.OS === 'ios') {
    return {
      primary: 'San Francisco',
      secondary: 'San Francisco',
      monospace: 'Menlo',
    };
  } else if (Platform.OS === 'android') {
    return {
      primary: 'Roboto',
      secondary: 'Roboto',
      monospace: 'Roboto Mono',
    };
  }
  
  // Fallback for other platforms
  return {
    primary: 'System',
    secondary: 'System',
    monospace: 'monospace',
  };
};

/**
 * Platform-specific font families for the application
 */
export const fontFamily: FontFamily = getFontFamily();

/**
 * Font size scale for the application
 */
export const fontSize: FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  h1: 24,
  h2: 20,
  h3: 18,
  body: 16,
  caption: 14,
  button: 16,
  small: 12,
};

/**
 * Font weight options for the application
 */
export const fontWeight: FontWeight = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

/**
 * Line height scale for the application
 */
export const lineHeight: LineHeight = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 36,
};

/**
 * Predefined text styles for common UI elements
 */
export const textStyles: TextStyles = {
  h1: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.xxl,
  },
  h2: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.xl,
  },
  h3: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.lg,
  },
  body: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.md,
  },
  caption: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.sm,
  },
  button: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.button,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.md,
  },
  small: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.small,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xs,
  },
};

/**
 * Combined typography system for the application
 */
export const typography: Typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textStyles,
};

export default typography;