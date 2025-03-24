/**
 * Constants for storage keys used throughout the Tribe application
 * to ensure consistent access to stored data.
 *
 * This includes:
 * - Regular storage keys for non-sensitive application data
 * - Secure storage keys for sensitive data that requires encryption
 */

// Prefix for all storage keys to avoid conflicts with other applications
export const STORAGE_PREFIX = 'tribe_app_';

// Regular storage keys for non-sensitive application data
export const STORAGE_KEYS = {
  USER_PROFILE: `${STORAGE_PREFIX}user_profile`,
  TRIBES: `${STORAGE_PREFIX}tribes`,
  TRIBE_MEMBERS: `${STORAGE_PREFIX}tribe_members`,
  EVENTS: `${STORAGE_PREFIX}events`,
  CHAT_MESSAGES: `${STORAGE_PREFIX}chat_messages`,
  NOTIFICATIONS: `${STORAGE_PREFIX}notifications`,
  NOTIFICATION_SETTINGS: `${STORAGE_PREFIX}notification_settings`,
  OFFLINE_ACTIONS_QUEUE: `${STORAGE_PREFIX}offline_actions_queue`,
  LAST_SYNC_TIMESTAMP: `${STORAGE_PREFIX}last_sync_timestamp`,
  LAST_KNOWN_LOCATION: `${STORAGE_PREFIX}last_known_location`,
  LOCATION_PERMISSION: `${STORAGE_PREFIX}location_permission`,
  LOCATION_PREFERENCE: `${STORAGE_PREFIX}location_preference`,
  ONBOARDING_PROGRESS: `${STORAGE_PREFIX}onboarding_progress`,
  APP_SETTINGS: `${STORAGE_PREFIX}app_settings`,
  THEME_PREFERENCE: `${STORAGE_PREFIX}theme_preference`,
  CACHED_INTERESTS: `${STORAGE_PREFIX}cached_interests`,
  DEVICE_ID: `${STORAGE_PREFIX}device_id`,
};

// Secure storage keys for sensitive data that requires encryption
export const SECURE_STORAGE_KEYS = {
  AUTH_TOKEN: `${STORAGE_PREFIX}auth_token`,
  REFRESH_TOKEN: `${STORAGE_PREFIX}refresh_token`,
  BIOMETRIC_ENABLED: `${STORAGE_PREFIX}biometric_enabled`,
  PAYMENT_METHODS: `${STORAGE_PREFIX}payment_methods`,
  FCM_TOKEN: `${STORAGE_PREFIX}fcm_token`,
  PIN_CODE: `${STORAGE_PREFIX}pin_code`,
};