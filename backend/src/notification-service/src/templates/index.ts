/**
 * Notification Templates Index
 * 
 * This file centralizes and exports all notification template functions used throughout
 * the Tribe platform. Template functions generate standardized notification content
 * for various features including achievements, chat messages, events, and tribe matches.
 * 
 * Each template function takes relevant parameters and returns a properly formatted
 * INotificationCreate object ready to be processed by the notification service.
 * 
 * @version 1.0.0
 */

// Achievement-related notification templates
export {
  createAchievementUnlockedNotification,
  createSocialButterflyNotification,
  createExplorerNotification,
  createConsistentNotification,
  createCommunityBuilderNotification,
  createEventOrganizerNotification,
  createConnectionMakerNotification,
  createFeedbackChampionNotification
} from './achievement.template';

// Chat-related notification templates
export {
  createNewChatMessageNotification,
  createMentionNotification,
  createGroupMentionNotification,
  createAIPromptResponseNotification,
  createChatActivityReminderNotification
} from './chat.template';

// Event-related notification templates
export {
  createEventInvitationNotification,
  createEventReminderNotification,
  createEventRSVPUpdateNotification,
  createEventCancelledNotification,
  createEventUpdatedNotification,
  createEventSuggestionNotification,
  createWeatherUpdateNotification,
  createCheckInReminderNotification
} from './event.template';

// Matching-related notification templates
export {
  createTribeMatchNotification,
  createTribeInvitationNotification,
  createTribeJoinRequestNotification,
  createTribeJoinApprovedNotification,
  createTribeJoinRejectedNotification
} from './match.template';