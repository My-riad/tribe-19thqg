/**
 * Centralized export of all error classes used in the Tribe platform.
 * This module provides a consistent interface for error handling across the application.
 */

// Base API error class
export { ApiError } from './api.error';

// Authentication-specific errors
export { AuthError } from './auth.error';

// Database-related errors
export { DatabaseError } from './database.error';

// Validation-specific errors
export { ValidationError } from './validation.error';