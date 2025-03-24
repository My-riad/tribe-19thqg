/**
 * Central exports file for all constants used in the Tribe application
 * 
 * This file re-exports constants from individual modules to provide a single
 * import point for consumers, improving maintainability and reducing import
 * statements throughout the application.
 */

// API Path Constants
import * as apiPaths from './apiPaths';

// Configuration Constants
import * as config from './config';

// Error Message Constants
import * as errorMessages from './errorMessages';

// Navigation Route Constants
import * as navigationRoutes from './navigationRoutes';

// Storage Key Constants
import * as storageKeys from './storageKeys';

// Re-export API Path Constants
export const API_PATHS = apiPaths.API_PATHS;

// Re-export Configuration Constants
export const CONFIG = config.CONFIG;
export const ENV = config.ENV;
export const IS_DEV = config.IS_DEV;
export const IS_STAGING = config.IS_STAGING;
export const IS_PROD = config.IS_PROD;
export const IS_TEST = config.IS_TEST;
export const IS_IOS = config.IS_IOS;
export const IS_ANDROID = config.IS_ANDROID;

// Re-export Error Message Constants
export const ERROR_MESSAGES = errorMessages.ERROR_MESSAGES;
export const AUTH_ERRORS = errorMessages.AUTH_ERRORS;
export const PROFILE_ERRORS = errorMessages.PROFILE_ERRORS;
export const TRIBE_ERRORS = errorMessages.TRIBE_ERRORS;
export const EVENT_ERRORS = errorMessages.EVENT_ERRORS;
export const MATCHING_ERRORS = errorMessages.MATCHING_ERRORS;
export const PAYMENT_ERRORS = errorMessages.PAYMENT_ERRORS;
export const VALIDATION_ERRORS = errorMessages.VALIDATION_ERRORS;
export const OFFLINE_ERRORS = errorMessages.OFFLINE_ERRORS;
export const getErrorMessage = errorMessages.getErrorMessage;

// Re-export Navigation Route Constants
export const ROUTES = navigationRoutes.ROUTES;

// Re-export Storage Key Constants
export const STORAGE_PREFIX = storageKeys.STORAGE_PREFIX;
export const STORAGE_KEYS = storageKeys.STORAGE_KEYS;
export const SECURE_STORAGE_KEYS = storageKeys.SECURE_STORAGE_KEYS;