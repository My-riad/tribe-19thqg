/**
 * Spacing system for the Tribe application.
 * Provides consistent spacing values for margins, paddings, and layout throughout the application.
 */

// Define the type for spacing sizes
type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

// Define the interface for inset spacing
interface InsetSpacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Define the interface for the complete spacing system
interface SpacingSystem {
  base: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  gutter: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
  };
  inset: {
    xs: InsetSpacing;
    sm: InsetSpacing;
    md: InsetSpacing;
    lg: InsetSpacing;
  };
  stack: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

// The base spacing unit in pixels
const BASE_SPACING = 8;

/**
 * Spacing system for the Tribe application.
 * Based on an 8-point grid system for visual consistency.
 */
const spacing: SpacingSystem = {
  // Base value
  base: BASE_SPACING,
  
  // Standard spacing values
  xs: BASE_SPACING / 2,     // 4px
  sm: BASE_SPACING,         // 8px
  md: BASE_SPACING * 2,     // 16px
  lg: BASE_SPACING * 3,     // 24px
  xl: BASE_SPACING * 4,     // 32px
  xxl: BASE_SPACING * 6,    // 48px
  
  // Gutters between elements (horizontal spacing in layouts)
  gutter: {
    xs: BASE_SPACING,       // 8px
    sm: BASE_SPACING * 2,   // 16px
    md: BASE_SPACING * 3,   // 24px
    lg: BASE_SPACING * 4,   // 32px
  },
  
  // Insets (padding inside components)
  inset: {
    xs: {
      top: BASE_SPACING / 2,
      right: BASE_SPACING / 2,
      bottom: BASE_SPACING / 2,
      left: BASE_SPACING / 2,
    },
    sm: {
      top: BASE_SPACING,
      right: BASE_SPACING,
      bottom: BASE_SPACING,
      left: BASE_SPACING,
    },
    md: {
      top: BASE_SPACING * 2,
      right: BASE_SPACING * 2,
      bottom: BASE_SPACING * 2,
      left: BASE_SPACING * 2,
    },
    lg: {
      top: BASE_SPACING * 3,
      right: BASE_SPACING * 3,
      bottom: BASE_SPACING * 3,
      left: BASE_SPACING * 3,
    },
  },
  
  // Vertical spacing between stacked elements
  stack: {
    xs: BASE_SPACING / 2,   // 4px
    sm: BASE_SPACING,       // 8px
    md: BASE_SPACING * 2,   // 16px
    lg: BASE_SPACING * 3,   // 24px
    xl: BASE_SPACING * 4,   // 32px
  },
};

export { spacing };
export type { SpacingSize, InsetSpacing, SpacingSystem };