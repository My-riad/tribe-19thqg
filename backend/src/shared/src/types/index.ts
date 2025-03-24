/**
 * index.ts
 * 
 * This file serves as the central export point for all shared types, interfaces, and enums
 * used across the Tribe platform's microservices. By re-exporting types from individual
 * modules, it provides a single, consistent source of truth for data structures throughout
 * the application.
 * 
 * Using shared types ensures consistent data structures between frontend and backend services,
 * facilitates type-safe communication between microservices, and reduces duplication of type
 * definitions across the codebase.
 */

// Re-export all user-related types
export * from './user.types';

// Re-export all profile-related types
export * from './profile.types';

// Re-export all tribe-related types
export * from './tribe.types';

// Re-export all event-related types
export * from './event.types';

// Re-export all notification-related types
export * from './notification.types';

// Re-export all payment-related types
export * from './payment.types';