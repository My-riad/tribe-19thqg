/**
 * Aggregates and exports all validation schemas and middleware from the profile service validation modules.
 * This index file serves as a central point for importing validation-related functionality throughout the profile service.
 */

// Re-export all validations from the profile service validation modules
export * from './interest.validation';
export * from './personality.validation';
export * from './profile.validation';