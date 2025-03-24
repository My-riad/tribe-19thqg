/**
 * Centralized collection of error messages used throughout the Tribe application.
 * This file provides standardized error messages for API errors, validation errors,
 * authentication issues, and other error scenarios to ensure consistent user feedback.
 */

/**
 * Generic error messages for common error scenarios
 */
export const ERROR_MESSAGES = {
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Network connection error. Please check your internet connection and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error. Our team has been notified and is working on a fix.'
};

/**
 * Authentication-related error messages
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  ACCOUNT_LOCKED: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later or reset your password.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before logging in.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You must be logged in to access this feature.',
  FORBIDDEN: "You don't have permission to access this resource.",
  MFA_REQUIRED: 'Multi-factor authentication is required to continue.',
  MFA_INVALID: 'Invalid verification code. Please try again.',
  PASSWORD_RESET_REQUIRED: 'You need to reset your password before continuing.',
  SOCIAL_AUTH_ERROR: 'There was a problem with social authentication. Please try again or use another method.'
};

/**
 * Profile-related error messages
 */
export const PROFILE_ERRORS = {
  PROFILE_NOT_FOUND: 'Profile not found. Please complete your profile setup.',
  PROFILE_UPDATE_FAILED: 'Failed to update profile. Please try again.',
  ASSESSMENT_INCOMPLETE: 'Please complete the personality assessment to continue.',
  INTERESTS_REQUIRED: 'Please select at least 3 interests to continue.',
  MEDIA_UPLOAD_FAILED: 'Failed to upload media. Please try again.',
  LOCATION_REQUIRED: 'Location information is required to find local Tribes and events.'
};

/**
 * Tribe-related error messages
 */
export const TRIBE_ERRORS = {
  TRIBE_NOT_FOUND: "Tribe not found. It may have been deleted or you don't have access.",
  TRIBE_CREATION_FAILED: 'Failed to create Tribe. Please try again.',
  TRIBE_UPDATE_FAILED: 'Failed to update Tribe. Please try again.',
  TRIBE_FULL: 'This Tribe has reached its maximum capacity of 8 members.',
  ALREADY_MEMBER: 'You are already a member of this Tribe.',
  NOT_MEMBER: 'You are not a member of this Tribe.',
  MAX_TRIBES_REACHED: 'You have reached the maximum limit of 3 Tribes. Please leave a Tribe before joining a new one.',
  INSUFFICIENT_PERMISSIONS: "You don't have permission to perform this action in the Tribe."
};

/**
 * Event-related error messages
 */
export const EVENT_ERRORS = {
  EVENT_NOT_FOUND: "Event not found. It may have been canceled or you don't have access.",
  EVENT_CREATION_FAILED: 'Failed to create event. Please try again.',
  EVENT_UPDATE_FAILED: 'Failed to update event. Please try again.',
  EVENT_FULL: 'This event has reached its maximum capacity.',
  RSVP_FAILED: 'Failed to update your RSVP status. Please try again.',
  CHECK_IN_FAILED: 'Failed to check in to the event. Please try again.',
  EVENT_EXPIRED: 'This event has already ended.',
  VENUE_UNAVAILABLE: 'The selected venue is not available for the chosen time.'
};

/**
 * Matching-related error messages
 */
export const MATCHING_ERRORS = {
  MATCHING_FAILED: 'Failed to find matches. Please try again later.',
  PROFILE_INCOMPLETE: 'Please complete your profile to enable matching.',
  NO_MATCHES_FOUND: 'No suitable matches found at this time. Please try again later.',
  ALREADY_OPTED_IN: 'You have already opted in for automatic matching.',
  NOT_OPTED_IN: 'You have not opted in for automatic matching.'
};

/**
 * Payment-related error messages
 */
export const PAYMENT_ERRORS = {
  PAYMENT_FAILED: 'Payment processing failed. Please try again or use a different payment method.',
  INVALID_PAYMENT_METHOD: 'Invalid payment method. Please update your payment information.',
  INSUFFICIENT_FUNDS: 'Insufficient funds. Please use a different payment method.',
  PAYMENT_EXPIRED: 'Payment session expired. Please try again.',
  SPLIT_PAYMENT_FAILED: 'Failed to split payment. Please try again.'
};

/**
 * Validation-related error messages
 */
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: 'Password must be at least 10 characters long and include uppercase, lowercase, number, and special character.',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_DATE: 'Please enter a valid date in YYYY-MM-DD format.',
  TEXT_TOO_LONG: 'Text exceeds maximum length.',
  INVALID_AGE: 'You must be at least 18 years old to use this app.',
  INVALID_LOCATION: 'Please enter a valid location.'
};

/**
 * Offline mode-related error messages
 */
export const OFFLINE_ERRORS = {
  OFFLINE_MODE: 'You are currently in offline mode. Some features may be limited.',
  SYNC_FAILED: "Failed to synchronize data. Changes will be saved locally until you're back online.",
  REQUIRES_ONLINE: 'This feature requires an internet connection.',
  CONFLICT_DETECTED: 'A conflict was detected while syncing your data. Please review the changes.'
};

/**
 * Retrieves an appropriate error message based on error code or falls back to a generic message
 * @param error - The error object
 * @param fallbackMessage - Optional custom fallback message
 * @returns Appropriate error message for the given error
 */
export const getErrorMessage = (error: any, fallbackMessage?: string): string => {
  // If error has a code property, look for a matching error message
  if (error?.code) {
    // Check in each error category for a matching code
    const errorCategories = [
      AUTH_ERRORS,
      PROFILE_ERRORS,
      TRIBE_ERRORS,
      EVENT_ERRORS,
      MATCHING_ERRORS,
      PAYMENT_ERRORS,
      VALIDATION_ERRORS,
      OFFLINE_ERRORS,
      ERROR_MESSAGES
    ];

    for (const category of errorCategories) {
      if (error.code in category) {
        return category[error.code as keyof typeof category];
      }
    }
  }

  // Return error message if available
  if (error?.message) {
    return error.message;
  }

  // Return fallback message if provided
  if (fallbackMessage) {
    return fallbackMessage;
  }

  // Return generic error as a last resort
  return ERROR_MESSAGES.GENERIC_ERROR;
};