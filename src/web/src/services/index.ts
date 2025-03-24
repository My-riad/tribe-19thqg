// Import analytics service for tracking user behavior and app metrics
import { analyticsService } from './analyticsService';
// Import authentication service for user authentication and session management
import { authService } from './authService';
// Import location service for geolocation features
import { locationService } from './locationService';
// Import media service for handling images and other media
import { mediaService } from './mediaService';
// Import notification service for push and in-app notifications
import { notificationService } from './notificationService';
// Import offline service for handling offline functionality
import { offlineService } from './offlineService';
// Import storage service for data persistence
import { storageService } from './storageService';

/**
 * Provide analytics tracking functionality throughout the application
 */
export { analyticsService };

/**
 * Provide authentication functionality for user login, registration, and session management
 */
export { authService };

/**
 * Provide location-related functionality for geolocation features and location-based matching
 */
export { locationService };

/**
 * Provide media handling functionality for images and other media content
 */
export { mediaService };

/**
 * Provide notification management for push and in-app notifications
 */
export { notificationService };

/**
 * Provide offline functionality for the application when network connectivity is unavailable
 */
export { offlineService };

/**
 * Provide data storage functionality for both regular and secure storage needs
 */
export { storageService };