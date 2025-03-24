/**
 * Central export file for all AI-driven prompt collections used in the engagement service
 * 
 * This file aggregates and exports conversation starters, activity suggestions, and group
 * challenges from their respective modules to provide a unified access point for generating
 * contextually relevant content to facilitate tribe interactions.
 * 
 * @module prompts
 */

// Import activity-related prompt collections
import {
  OUTDOOR_ACTIVITY_PROMPTS,
  INDOOR_ACTIVITY_PROMPTS,
  FOOD_ACTIVITY_PROMPTS,
  CULTURAL_ACTIVITY_PROMPTS,
  SEASONAL_ACTIVITY_PROMPTS,
  LOW_COST_ACTIVITY_PROMPTS,
  WEATHER_BASED_ACTIVITY_PROMPTS,
  SPONTANEOUS_ACTIVITY_PROMPTS,
  activityPrompts
} from './activity.prompts';

// Import conversation-related prompt collections
import {
  GENERAL_CONVERSATION_STARTERS,
  INTEREST_BASED_CONVERSATION_STARTERS,
  PERSONALITY_BASED_CONVERSATION_STARTERS,
  EVENT_RELATED_CONVERSATION_STARTERS,
  ICE_BREAKER_PROMPTS,
  DEEP_CONVERSATION_STARTERS,
  LIGHT_CONVERSATION_STARTERS,
  conversationPrompts
} from './conversation.prompts';

// Import challenge-related prompt collections
import {
  PHOTO_CHALLENGE_PROMPTS,
  CREATIVE_CHALLENGE_PROMPTS,
  SOCIAL_CHALLENGE_PROMPTS,
  EXPLORATION_CHALLENGE_PROMPTS,
  LEARNING_CHALLENGE_PROMPTS,
  WELLNESS_CHALLENGE_PROMPTS,
  challengePrompts
} from './challenge.prompts';

/**
 * Combined array of all prompts for comprehensive access
 * Includes activity suggestions, conversation starters, and group challenges
 */
export const allPrompts = activityPrompts.concat(conversationPrompts, challengePrompts);

// Re-export all individual prompt collections for specific access
export {
  // Activity prompt collections
  OUTDOOR_ACTIVITY_PROMPTS,
  INDOOR_ACTIVITY_PROMPTS,
  FOOD_ACTIVITY_PROMPTS,
  CULTURAL_ACTIVITY_PROMPTS,
  SEASONAL_ACTIVITY_PROMPTS,
  LOW_COST_ACTIVITY_PROMPTS,
  WEATHER_BASED_ACTIVITY_PROMPTS,
  SPONTANEOUS_ACTIVITY_PROMPTS,
  activityPrompts,
  
  // Conversation prompt collections
  GENERAL_CONVERSATION_STARTERS,
  INTEREST_BASED_CONVERSATION_STARTERS,
  PERSONALITY_BASED_CONVERSATION_STARTERS,
  EVENT_RELATED_CONVERSATION_STARTERS,
  ICE_BREAKER_PROMPTS,
  DEEP_CONVERSATION_STARTERS,
  LIGHT_CONVERSATION_STARTERS,
  conversationPrompts,
  
  // Challenge prompt collections
  PHOTO_CHALLENGE_PROMPTS,
  CREATIVE_CHALLENGE_PROMPTS,
  SOCIAL_CHALLENGE_PROMPTS,
  EXPLORATION_CHALLENGE_PROMPTS,
  LEARNING_CHALLENGE_PROMPTS,
  WELLNESS_CHALLENGE_PROMPTS,
  challengePrompts
};