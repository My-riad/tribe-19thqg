/**
 * Main entry point for the shared module of the Tribe platform.
 * 
 * This file centralizes and re-exports all common utilities, types, error classes,
 * constants, middlewares, and validation schemas used across the platform's microservices.
 * It provides a clean, unified interface for importing shared functionality, ensuring
 * consistency and reducing duplication across the application.
 * 
 * @module shared
 */

// Re-export all application constants (limits, timeouts, regex patterns, error codes, etc.)
export * from './constants';

// Re-export all error classes (ApiError, AuthError, ValidationError, DatabaseError)
export * from './errors';

// Re-export all shared types, interfaces, and enums
export * from './types';

// Re-export all utility functions (date, string, validation, logging)
export * from './utils';

// Re-export all middleware functions (error handling, logging, validation)
export * from './middlewares';

// Re-export all validation schemas and functions
export * from './validation';