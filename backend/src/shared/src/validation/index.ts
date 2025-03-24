/**
 * validation/index.ts
 *
 * Centralizes and exports all validation schemas and utility functions from the validation module.
 * This index file serves as the main entry point for importing validation utilities across the
 * Tribe platform's microservices, ensuring consistent validation patterns throughout the application.
 */

// Re-export all common validation schemas and utilities
export * from './common.validation';

// Re-export all user-related validation schemas and utilities
export * from './user.validation';