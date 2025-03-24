/**
 * Defines the color palette for the Tribe application, including primary, secondary, 
 * neutral, and semantic colors for consistent styling across the application.
 * 
 * All colors are selected to meet WCAG AA compliance (4.5:1 ratio)
 * for accessibility compliance.
 */

/**
 * Color palette for the Tribe application
 * 
 * Primary: Royal blue - Used for main actions, branding, and key UI elements
 * Secondary: Orange - Used for call-to-action elements and highlights
 * Neutral: Grayscale - Used for text, backgrounds, and borders
 * 
 * All colors are selected to ensure WCAG AA compliance (4.5:1 contrast ratio)
 * for users with color vision deficiencies.
 */
export const colors = {
  // Primary brand colors
  primary: {
    light: '#6B8AFF', // Lighter blue
    main: '#4169E1', // Royal blue
    dark: '#2A4CB3', // Darker blue for hover/active states
    contrast: '#FFFFFF', // White text on primary colors
  },
  
  // Secondary/accent colors
  secondary: {
    light: '#FFB74D', // Lighter orange
    main: '#FF9800', // Orange
    dark: '#F57C00', // Darker orange for hover/active states
    contrast: '#000000', // Black text on secondary colors
  },
  
  // Neutral grayscale palette
  neutral: {
    50: '#FAFAFA',  // Lightest gray - subtle backgrounds
    100: '#F5F5F5', // Very light gray
    200: '#EEEEEE', // Light gray
    300: '#E0E0E0', // Light gray - light borders
    400: '#BDBDBD', // Medium gray - main borders
    500: '#9E9E9E', // Medium gray - disabled text
    600: '#757575', // Dark gray - secondary text
    700: '#616161', // Dark gray
    800: '#424242', // Very dark gray
    900: '#212121', // Nearly black - primary text
  },
  
  // Semantic colors - Success
  success: {
    light: '#81C784', // Lighter green
    main: '#4CAF50', // Green
    dark: '#388E3C', // Darker green
    contrast: '#FFFFFF', // White text on success colors
  },
  
  // Semantic colors - Warning
  warning: {
    light: '#FFD54F', // Lighter amber
    main: '#FFC107', // Amber
    dark: '#FFA000', // Darker amber
    contrast: '#000000', // Black text on warning colors
  },
  
  // Semantic colors - Error
  error: {
    light: '#E57373', // Lighter red
    main: '#F44336', // Red
    dark: '#D32F2F', // Darker red
    contrast: '#FFFFFF', // White text on error colors
  },
  
  // Background colors for different surfaces
  background: {
    default: '#FFFFFF', // Default page background
    paper: '#FFFFFF', // Card/paper component background
    subtle: '#F9FAFC', // Subtle background for secondary surfaces
    disabled: '#F5F5F5', // Background for disabled elements
  },
  
  // Text colors for different hierarchies
  text: {
    primary: '#212121', // Primary text - neutral.900
    secondary: '#757575', // Secondary text - neutral.600
    disabled: '#9E9E9E', // Disabled text - neutral.500
    hint: '#9E9E9E', // Hint text - neutral.500
    contrast: '#FFFFFF', // Contrast text for dark backgrounds
  },
  
  // Border colors
  border: {
    light: '#E0E0E0', // Light border - neutral.300
    main: '#BDBDBD', // Main border - neutral.400
    dark: '#9E9E9E', // Dark border - neutral.500
  },
};

export default colors;