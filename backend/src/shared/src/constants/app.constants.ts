/**
 * Core application constants for the Tribe platform.
 * 
 * These constants are used across all microservices to ensure consistent 
 * behavior throughout the application.
 */

// Application metadata
export const APP_NAME = 'Tribe';
export const API_VERSION = 'v1';
export const DEFAULT_TIMEZONE = 'UTC';
export const DEFAULT_LOCALE = 'en-US';
export const SUPPORTED_LOCALES = ['en-US']; // Only English for MVP

// Tribe membership limits
// As specified in Technical Specifications/1.2 SYSTEM OVERVIEW/1.2.1 Project Context
// and Technical Specifications/2.1 FEATURE CATALOG/2.1.3 User-Driven Tribe Creation & Search
export const TRIBE_LIMITS = {
  MIN_MEMBERS: 4, // Minimum members for a viable Tribe
  MAX_MEMBERS: 8, // Maximum members per Tribe
  MAX_TRIBES_PER_USER: 3 // Maximum number of Tribes a user can join
};

// Individual exports from TRIBE_LIMITS
export const { MIN_MEMBERS, MAX_MEMBERS, MAX_TRIBES_PER_USER } = TRIBE_LIMITS;

// Event creation limits
export const EVENT_LIMITS = {
  MAX_EVENTS_PER_TRIBE: 10, // Maximum number of upcoming events per Tribe
  MAX_EVENTS_PER_USER: 5 // Maximum number of events a user can create
};

// Individual exports from EVENT_LIMITS
export const { MAX_EVENTS_PER_TRIBE, MAX_EVENTS_PER_USER } = EVENT_LIMITS;

// Authentication configuration
// Based on Technical Specifications/6.4 SECURITY ARCHITECTURE/6.4.1 AUTHENTICATION FRAMEWORK
export const AUTH_CONFIG = {
  ACCESS_TOKEN_EXPIRY: 15 * 60, // 15 minutes in seconds
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days in seconds
  VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60, // 24 hours in seconds
  PASSWORD_RESET_EXPIRY: 1 * 60 * 60, // 1 hour in seconds
  MAX_LOGIN_ATTEMPTS: 5, // Maximum failed login attempts before lockout
  LOCKOUT_DURATION: 15 * 60 // 15 minutes lockout duration in seconds
};

// Individual exports from AUTH_CONFIG
export const { 
  ACCESS_TOKEN_EXPIRY, 
  REFRESH_TOKEN_EXPIRY, 
  VERIFICATION_TOKEN_EXPIRY, 
  PASSWORD_RESET_EXPIRY, 
  MAX_LOGIN_ATTEMPTS, 
  LOCKOUT_DURATION 
} = AUTH_CONFIG;

// API rate limiting configuration
// Based on Technical Specifications/6.3 INTEGRATION ARCHITECTURE/6.3.1 API DESIGN
export const RATE_LIMITS = {
  PUBLIC_API: 60, // 60 requests per minute for public endpoints
  AUTHENTICATED_API: 300, // 300 requests per minute for authenticated users
  CRITICAL_OPERATIONS: 10, // 10 requests per minute for sensitive operations
  AI_OPERATIONS: 30 // 30 requests per minute for AI-powered endpoints
};

// Individual exports from RATE_LIMITS
export const { 
  PUBLIC_API, 
  AUTHENTICATED_API, 
  CRITICAL_OPERATIONS, 
  AI_OPERATIONS 
} = RATE_LIMITS;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20, // Default number of items per page
  MAX_PAGE_SIZE: 100 // Maximum number of items per page
};

// Individual exports from PAGINATION
export const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = PAGINATION;

// Location-based search parameters
export const LOCATION = {
  DEFAULT_RADIUS_MILES: 10, // Default radius for location-based searches
  MAX_RADIUS_MILES: 25 // Maximum allowed radius for searches
};

// Individual exports from LOCATION
export const { DEFAULT_RADIUS_MILES, MAX_RADIUS_MILES } = LOCATION;

// AI matchmaking configuration
export const MATCHING = {
  MIN_COMPATIBILITY_SCORE: 70, // Minimum percentage for compatibility matching
  MATCHING_BATCH_SIZE: 1000, // Number of users processed in each matching batch
  MATCHING_FREQUENCY_DAYS: 1 // How often matching runs (daily)
};

// Individual exports from MATCHING
export const { 
  MIN_COMPATIBILITY_SCORE, 
  MATCHING_BATCH_SIZE, 
  MATCHING_FREQUENCY_DAYS 
} = MATCHING;

// Cache time-to-live settings (in seconds)
export const CACHE_TTL = {
  USER_PROFILE: 24 * 60 * 60, // 24 hours
  TRIBE_DATA: 60 * 60, // 1 hour
  EVENT_LISTINGS: 15 * 60, // 15 minutes
  RECOMMENDATIONS: 30 * 60 // 30 minutes
};

// Individual exports from CACHE_TTL
export const { 
  USER_PROFILE, 
  TRIBE_DATA, 
  EVENT_LISTINGS, 
  RECOMMENDATIONS 
} = CACHE_TTL;

// Feature flags for enabling/disabling features
export const FEATURE_FLAGS = {
  ENABLE_AI_MATCHING: true, // Enable AI-powered matchmaking
  ENABLE_AI_ENGAGEMENT: true, // Enable AI-generated engagement prompts
  ENABLE_PAYMENT_SPLITTING: false, // Disable payment splitting for MVP
  ENABLE_GAMIFICATION: false // Disable gamification for MVP
};

// Individual exports from FEATURE_FLAGS
export const { 
  ENABLE_AI_MATCHING, 
  ENABLE_AI_ENGAGEMENT, 
  ENABLE_PAYMENT_SPLITTING, 
  ENABLE_GAMIFICATION 
} = FEATURE_FLAGS;