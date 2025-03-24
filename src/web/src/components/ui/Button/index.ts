/**
 * Entry point for the Button component
 * 
 * This file exports the Button component and its related types
 * for consistent usage throughout the application.
 * 
 * The Button component follows the design system specifications
 * with support for multiple variants (primary, secondary, tertiary, icon)
 * and sizes (sm, md, lg).
 */

// Re-export the Button component as the default export
export { default } from './Button';

// Re-export types for type checking and props documentation
export type { ButtonProps } from './Button';
export { ButtonVariant, ButtonSize } from './Button';