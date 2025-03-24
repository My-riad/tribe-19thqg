/**
 * Navigation route constants for the Tribe application.
 * This file centralizes all route names to ensure consistency in navigation
 * between screens and prevent typos or inconsistencies when referencing routes.
 */

/**
 * Application navigation routes organized by navigator type.
 */
export const ROUTES = {
  /**
   * Root navigator routes for top-level navigation.
   */
  ROOT: {
    AUTH: 'Auth',
    ONBOARDING: 'Onboarding',
    MAIN: 'Main'
  },

  /**
   * Authentication navigator routes for login, registration, etc.
   */
  AUTH: {
    WELCOME: 'Welcome',
    LOGIN: 'Login',
    REGISTRATION: 'Registration'
  },

  /**
   * Onboarding navigator routes for new user flow.
   */
  ONBOARDING: {
    PERSONALITY_ASSESSMENT: 'PersonalityAssessment',
    INTEREST_SELECTION: 'InterestSelection',
    LOCATION_SETUP: 'LocationSetup',
    PROFILE_CREATION: 'ProfileCreation'
  },

  /**
   * Main app navigator routes for primary app tabs.
   */
  MAIN: {
    HOME: 'Home',
    DISCOVER: 'Discover',
    EVENTS: 'Events',
    CHAT: 'Chat',
    PROFILE: 'Profile'
  },

  /**
   * Tribe-related navigator routes.
   */
  TRIBE: {
    TRIBE_DETAIL: 'TribeDetail',
    TRIBE_CHAT: 'TribeChat',
    MEMBER_LIST: 'MemberList',
    CREATE_TRIBE: 'CreateTribe'
  },

  /**
   * Event-related navigator routes.
   */
  EVENT: {
    EVENT_DETAIL: 'EventDetail',
    EVENT_PLANNING: 'EventPlanning',
    EVENT_SUGGESTION: 'EventSuggestion',
    EVENT_CHECK_IN: 'EventCheckIn'
  },

  /**
   * Settings navigator routes.
   */
  SETTINGS: {
    SETTINGS: 'Settings',
    AUTO_MATCHING_PREFERENCES: 'AutoMatchingPreferences',
    NOTIFICATION_SETTINGS: 'NotificationSettings',
    PRIVACY_SETTINGS: 'PrivacySettings'
  },

  /**
   * Notification navigator routes.
   */
  NOTIFICATION: {
    NOTIFICATION: 'Notification'
  }
};