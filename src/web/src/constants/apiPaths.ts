/**
 * API Paths for the Tribe application.
 * 
 * This file centralizes all API route definitions to ensure consistency
 * and maintainability when making API requests to backend services.
 * It serves as a single source of truth for API endpoints across the application.
 */

export const API_PATHS = {
  BASE: '/api',
  
  AUTH: {
    BASE: '/api/auth',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    SOCIAL: '/api/auth/social',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    VERIFY: '/api/auth/verify',
    PASSWORD_RESET: '/api/auth/password/reset',
    PASSWORD_UPDATE: '/api/auth/password/update',
    MFA: '/api/auth/mfa'
  },
  
  PROFILE: {
    BASE: '/api/profile',
    GET: '/api/profile',
    UPDATE: '/api/profile',
    ASSESSMENT: '/api/profile/assessment',
    PERSONALITY: '/api/profile/personality',
    INTERESTS: '/api/profile/interests',
    PREFERENCES: '/api/profile/preferences',
    COMPATIBILITY: '/api/profile/compatibility',
    MEDIA: '/api/profile/media',
    ACHIEVEMENTS: '/api/profile/achievements'
  },
  
  TRIBE: {
    BASE: '/api/tribes',
    GET_ALL: '/api/tribes',
    GET_BY_ID: '/api/tribes/:id',
    CREATE: '/api/tribes',
    UPDATE: '/api/tribes/:id',
    DELETE: '/api/tribes/:id',
    MEMBERS: '/api/tribes/:id/members',
    MEMBER: '/api/tribes/:id/members/:userId',
    CHAT: '/api/tribes/:id/chat',
    ACTIVITY: '/api/tribes/:id/activity'
  },
  
  MATCHING: {
    BASE: '/api/matching',
    OPT_IN: '/api/matching/opt-in',
    OPT_OUT: '/api/matching/opt-out',
    STATUS: '/api/matching/status',
    COMPATIBILITY: '/api/matching/compatibility',
    SUGGESTIONS: '/api/matching/suggestions',
    BATCH: '/api/matching/batch'
  },
  
  EVENT: {
    BASE: '/api/events',
    DISCOVER: '/api/events/discover',
    RECOMMENDATIONS: '/api/events/recommendations',
    WEATHER: '/api/events/weather',
    CREATE: '/api/events',
    GET_BY_ID: '/api/events/:id',
    UPDATE: '/api/events/:id',
    RSVP: '/api/events/:id/rsvp',
    ATTENDEES: '/api/events/:id/attendees',
    CHECK_IN: '/api/events/:id/check-in'
  },
  
  ENGAGEMENT: {
    BASE: '/api/engagement',
    PROMPTS: '/api/engagement/prompts',
    CHALLENGES: '/api/engagement/challenges',
    METRICS: '/api/engagement/metrics',
    FEEDBACK: '/api/engagement/feedback'
  },
  
  PLANNING: {
    BASE: '/api/planning',
    AVAILABILITY: '/api/planning/availability',
    SCHEDULING: '/api/planning/scheduling',
    VENUES: '/api/planning/venues',
    OPTIMIZE: '/api/planning/optimize'
  },
  
  PAYMENT: {
    BASE: '/api/payments',
    METHODS: '/api/payments/methods',
    TRANSACTIONS: '/api/payments/transactions',
    SPLIT: '/api/payments/split',
    PROCESS: '/api/payments/process'
  },
  
  NOTIFICATION: {
    BASE: '/api/notifications',
    GET_ALL: '/api/notifications',
    GET_BY_ID: '/api/notifications/:id',
    MARK_READ: '/api/notifications/:id/read',
    PREFERENCES: '/api/notifications/preferences',
    SUBSCRIBE: '/api/notifications/subscribe',
    UNSUBSCRIBE: '/api/notifications/unsubscribe'
  },
  
  AI: {
    BASE: '/api/ai',
    MATCHING: '/api/ai/matching',
    ENGAGEMENT: '/api/ai/engagement',
    RECOMMENDATIONS: '/api/ai/recommendations',
    PERSONALITY: '/api/ai/personality'
  }
};