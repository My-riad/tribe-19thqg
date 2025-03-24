/**
 * Barrel file that exports all validation schemas and validation functions 
 * from the auth-service validation modules.
 * 
 * This file centralizes exports from auth.validation.ts and user.validation.ts 
 * to provide a single import point for all authentication and user validation utilities.
 */

// Re-export all authentication validation schemas and functions
export * from './auth.validation';

// Re-export all user validation schemas and functions
export * from './user.validation';