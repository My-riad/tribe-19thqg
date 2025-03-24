/**
 * TabBar component entry point
 * 
 * This file exports the TabBar component and its associated TypeScript
 * interfaces for use throughout the application. The TabBar provides 
 * navigation patterns for both top and bottom tab layouts.
 */

// Re-export the TabBar component as the default export
export { default } from './TabBar';

// Re-export the TabItem and TabBarProps interfaces for type checking
export type { TabItem, TabBarProps } from './TabBar';