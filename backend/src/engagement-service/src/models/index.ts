/**
 * Models index file
 * This file centralizes and exports all model-related entities from the engagement service.
 * It serves as the single entry point for importing model-related components.
 */

// Import all model-related components from their respective files
import * as challengeModel from './challenge.model';  // v1.0.0
import * as engagementModel from './engagement.model';  // v1.0.0
import * as promptModel from './prompt.model';  // v1.0.0

// ===== Challenge Exports =====
// Models
export const Challenge = challengeModel.Challenge;

// Enums
export enum ChallengeType {
  PHOTO = challengeModel.ChallengeType.PHOTO,
  CREATIVE = challengeModel.ChallengeType.CREATIVE,
  SOCIAL = challengeModel.ChallengeType.SOCIAL,
  EXPLORATION = challengeModel.ChallengeType.EXPLORATION,
  LEARNING = challengeModel.ChallengeType.LEARNING,
  WELLNESS = challengeModel.ChallengeType.WELLNESS
}

export enum ChallengeStatus {
  PENDING = challengeModel.ChallengeStatus.PENDING,
  ACTIVE = challengeModel.ChallengeStatus.ACTIVE,
  COMPLETED = challengeModel.ChallengeStatus.COMPLETED,
  CANCELLED = challengeModel.ChallengeStatus.CANCELLED
}

// Interfaces
export type IChallengeDocument = challengeModel.IChallengeDocument;
export type IChallengeCreate = challengeModel.IChallengeCreate;
export type IChallengeUpdate = challengeModel.IChallengeUpdate;
export type IChallengeParticipation = challengeModel.IChallengeParticipation;
export type IChallengeResponse = challengeModel.IChallengeResponse;

// ===== Engagement Exports =====
// Models
export const Engagement = engagementModel.Engagement;

// Enums
export enum EngagementType {
  CONVERSATION_PROMPT = engagementModel.EngagementType.CONVERSATION_PROMPT,
  ACTIVITY_SUGGESTION = engagementModel.EngagementType.ACTIVITY_SUGGESTION,
  GROUP_CHALLENGE = engagementModel.EngagementType.GROUP_CHALLENGE,
  MEETUP_SUGGESTION = engagementModel.EngagementType.MEETUP_SUGGESTION,
  POLL_QUESTION = engagementModel.EngagementType.POLL_QUESTION
}

export enum EngagementStatus {
  PENDING = engagementModel.EngagementStatus.PENDING,
  DELIVERED = engagementModel.EngagementStatus.DELIVERED,
  RESPONDED = engagementModel.EngagementStatus.RESPONDED,
  EXPIRED = engagementModel.EngagementStatus.EXPIRED,
  COMPLETED = engagementModel.EngagementStatus.COMPLETED
}

export enum EngagementTrigger {
  SCHEDULED = engagementModel.EngagementTrigger.SCHEDULED,
  LOW_ACTIVITY = engagementModel.EngagementTrigger.LOW_ACTIVITY,
  USER_REQUESTED = engagementModel.EngagementTrigger.USER_REQUESTED,
  EVENT_BASED = engagementModel.EngagementTrigger.EVENT_BASED,
  AI_INITIATED = engagementModel.EngagementTrigger.AI_INITIATED
}

// Interfaces
export type IEngagementDocument = engagementModel.IEngagementDocument;
export type IEngagementCreate = engagementModel.IEngagementCreate;
export type IEngagementUpdate = engagementModel.IEngagementUpdate;
export type IEngagementResponse = engagementModel.IEngagementResponse;
export type IEngagementResponseCreate = engagementModel.IEngagementResponseCreate;
export type IEngagementMetricsResponse = engagementModel.IEngagementMetricsResponse;
export type IEngagementSearchParams = engagementModel.IEngagementSearchParams;

// ===== Prompt Exports =====
// Models
export const Prompt = promptModel.Prompt;

// Enums
export enum PromptType {
  CONVERSATION_STARTER = promptModel.PromptType.CONVERSATION_STARTER,
  ACTIVITY_SUGGESTION = promptModel.PromptType.ACTIVITY_SUGGESTION,
  GROUP_CHALLENGE = promptModel.PromptType.GROUP_CHALLENGE,
  ICE_BREAKER = promptModel.PromptType.ICE_BREAKER,
  POLL_QUESTION = promptModel.PromptType.POLL_QUESTION
}

export enum PromptCategory {
  GENERAL = promptModel.PromptCategory.GENERAL,
  INTEREST_BASED = promptModel.PromptCategory.INTEREST_BASED,
  PERSONALITY_BASED = promptModel.PromptCategory.PERSONALITY_BASED,
  EVENT_RELATED = promptModel.PromptCategory.EVENT_RELATED,
  SEASONAL = promptModel.PromptCategory.SEASONAL,
  WEATHER_BASED = promptModel.PromptCategory.WEATHER_BASED
}

// Interfaces
export type IPromptDocument = promptModel.IPromptDocument;
export type IPromptCreate = promptModel.IPromptCreate;
export type IPromptUpdate = promptModel.IPromptUpdate;
export type IPromptResponse = promptModel.IPromptResponse;
export type IPromptUsageUpdate = promptModel.IPromptUsageUpdate;
export type IPromptSearchParams = promptModel.IPromptSearchParams;