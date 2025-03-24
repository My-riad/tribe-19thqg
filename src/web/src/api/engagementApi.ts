import { httpClient } from './httpClient';
import { API_PATHS } from '../constants/apiPaths';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api.types';

// ========== Enums ==========

/**
 * Enum defining different types of engagement activities
 */
export enum EngagementType {
  CONVERSATION_PROMPT = 'CONVERSATION_PROMPT',
  ACTIVITY_SUGGESTION = 'ACTIVITY_SUGGESTION',
  GROUP_CHALLENGE = 'GROUP_CHALLENGE',
  ICE_BREAKER = 'ICE_BREAKER',
  POLL = 'POLL'
}

/**
 * Enum defining possible statuses of an engagement activity
 */
export enum EngagementStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  RESPONDED = 'RESPONDED',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  SKIPPED = 'SKIPPED'
}

/**
 * Enum defining what triggered the engagement activity
 */
export enum EngagementTrigger {
  SCHEDULED = 'SCHEDULED',
  LOW_ACTIVITY = 'LOW_ACTIVITY',
  USER_REQUESTED = 'USER_REQUESTED',
  AI_INITIATED = 'AI_INITIATED',
  EVENT_BASED = 'EVENT_BASED'
}

// ========== Interfaces ==========

/**
 * Interface defining the structure of an engagement activity
 */
export interface Engagement {
  id: string;
  tribeId: string;
  type: EngagementType;
  content: string;
  status: EngagementStatus;
  trigger: EngagementTrigger;
  deliveredAt: Date;
  expiresAt: Date;
  responseCount: number;
  responses: EngagementResponse[];
  hasUserResponded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface defining a user response to an engagement activity
 */
export interface EngagementResponse {
  userId: string;
  content: string;
  responseType: string;
  timestamp: Date;
}

/**
 * Interface defining the request payload for generating a new engagement
 */
export interface EngagementGenerateRequest {
  type: EngagementType;
  trigger: EngagementTrigger;
  context: object;
}

/**
 * Interface defining engagement metrics for a tribe
 */
export interface EngagementMetrics {
  tribeId: string;
  totalEngagements: number;
  responseRate: number;
  engagementsByType: Record<string, number>;
  topResponders: Array<{userId: string, responseCount: number}>;
  recentEngagements: Engagement[];
}

/**
 * Interface defining feedback on an engagement activity
 */
export interface EngagementFeedback {
  rating: number;
  comments: string;
  isRelevant: boolean;
  isHelpful: boolean;
}

/**
 * Interface defining an engagement prompt
 */
export interface Prompt {
  id: string;
  content: string;
  type: PromptType;
  category: PromptCategory;
  tags: string[];
  usageCount: number;
  responseRate: number;
  aiGenerated: boolean;
  createdAt: Date;
}

/**
 * Enum defining different types of prompts
 */
export enum PromptType {
  CONVERSATION_STARTER = 'CONVERSATION_STARTER',
  ICE_BREAKER = 'ICE_BREAKER',
  ACTIVITY_SUGGESTION = 'ACTIVITY_SUGGESTION',
  DISCUSSION_TOPIC = 'DISCUSSION_TOPIC',
  POLL_QUESTION = 'POLL_QUESTION'
}

/**
 * Enum defining categories of prompts
 */
export enum PromptCategory {
  GENERAL = 'GENERAL',
  INTEREST_BASED = 'INTEREST_BASED',
  PERSONALITY_BASED = 'PERSONALITY_BASED',
  EVENT_RELATED = 'EVENT_RELATED',
  LOCATION_BASED = 'LOCATION_BASED',
  SEASONAL = 'SEASONAL'
}

/**
 * Interface defining search parameters for prompts
 */
export interface PromptSearchParams {
  type: PromptType;
  category: PromptCategory;
  tags: string[];
  interestCategories: string[];
  personalityTraits: string[];
  isActive: boolean;
  aiGenerated: boolean;
}

/**
 * Interface defining a group challenge
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  tribeId: string;
  status: ChallengeStatus;
  startDate: Date;
  endDate: Date;
  participantCount: number;
  completionCount: number;
  userParticipation: ChallengeParticipation;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Enum defining different types of challenges
 */
export enum ChallengeType {
  PHYSICAL_ACTIVITY = 'PHYSICAL_ACTIVITY',
  SOCIAL_ACTIVITY = 'SOCIAL_ACTIVITY',
  CREATIVE_ACTIVITY = 'CREATIVE_ACTIVITY',
  LEARNING_ACTIVITY = 'LEARNING_ACTIVITY',
  COMMUNITY_ACTIVITY = 'COMMUNITY_ACTIVITY'
}

/**
 * Enum defining possible statuses of a challenge
 */
export enum ChallengeStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Interface defining user participation in a challenge
 */
export interface ChallengeParticipation {
  userId: string;
  status: string;
  completedAt: Date;
}

// ========== API Functions ==========

/**
 * Retrieves a list of engagement activities for a tribe
 * @param tribeId - The ID of the tribe
 * @param pagination - Pagination parameters
 * @param filters - Additional filters for the query
 * @returns Promise resolving to paginated list of engagements
 */
const getEngagements = async (
  tribeId: string,
  pagination: PaginationParams,
  filters?: object
): Promise<ApiResponse<PaginatedResponse<Engagement>>> => {
  const params = {
    tribeId,
    ...pagination,
    ...filters
  };

  return httpClient.get<PaginatedResponse<Engagement>>(
    API_PATHS.ENGAGEMENT.BASE,
    params
  );
};

/**
 * Retrieves a specific engagement activity by ID
 * @param engagementId - The ID of the engagement
 * @returns Promise resolving to the engagement details
 */
const getEngagement = async (
  engagementId: string
): Promise<ApiResponse<Engagement>> => {
  return httpClient.get<Engagement>(
    `${API_PATHS.ENGAGEMENT.BASE}/${engagementId}`
  );
};

/**
 * Records a user's response to an engagement activity
 * @param engagementId - The ID of the engagement
 * @param responseData - The response data to submit
 * @returns Promise resolving to the updated engagement
 */
const respondToEngagement = async (
  engagementId: string,
  responseData: EngagementResponse
): Promise<ApiResponse<Engagement>> => {
  return httpClient.post<Engagement>(
    `${API_PATHS.ENGAGEMENT.BASE}/${engagementId}/respond`,
    responseData
  );
};

/**
 * Requests the generation of a new AI-powered engagement activity for a tribe
 * @param tribeId - The ID of the tribe
 * @param requestData - Generation request parameters
 * @returns Promise resolving to the generated engagement
 */
const generateEngagement = async (
  tribeId: string,
  requestData: EngagementGenerateRequest
): Promise<ApiResponse<Engagement>> => {
  const payload = {
    tribeId,
    ...requestData
  };

  return httpClient.post<Engagement>(
    `${API_PATHS.ENGAGEMENT.BASE}/generate`,
    payload
  );
};

/**
 * Retrieves a list of engagement prompts
 * @param searchParams - Parameters to filter prompts
 * @param pagination - Pagination parameters
 * @returns Promise resolving to paginated list of prompts
 */
const getPrompts = async (
  searchParams: PromptSearchParams,
  pagination: PaginationParams
): Promise<ApiResponse<PaginatedResponse<Prompt>>> => {
  const params = {
    ...searchParams,
    ...pagination
  };

  return httpClient.get<PaginatedResponse<Prompt>>(
    API_PATHS.ENGAGEMENT.PROMPTS,
    params
  );
};

/**
 * Retrieves a list of challenges for a tribe
 * @param tribeId - The ID of the tribe
 * @param pagination - Pagination parameters
 * @param filters - Additional filters for the query
 * @returns Promise resolving to paginated list of challenges
 */
const getChallenges = async (
  tribeId: string,
  pagination: PaginationParams,
  filters?: object
): Promise<ApiResponse<PaginatedResponse<Challenge>>> => {
  const params = {
    tribeId,
    ...pagination,
    ...filters
  };

  return httpClient.get<PaginatedResponse<Challenge>>(
    API_PATHS.ENGAGEMENT.CHALLENGES,
    params
  );
};

/**
 * Retrieves a specific challenge by ID
 * @param challengeId - The ID of the challenge
 * @returns Promise resolving to the challenge details
 */
const getChallenge = async (
  challengeId: string
): Promise<ApiResponse<Challenge>> => {
  return httpClient.get<Challenge>(
    `${API_PATHS.ENGAGEMENT.CHALLENGES}/${challengeId}`
  );
};

/**
 * Records a user's participation in a challenge
 * @param challengeId - The ID of the challenge
 * @param participationData - The participation data to submit
 * @returns Promise resolving to the updated challenge
 */
const participateInChallenge = async (
  challengeId: string,
  participationData: ChallengeParticipation
): Promise<ApiResponse<Challenge>> => {
  return httpClient.post<Challenge>(
    `${API_PATHS.ENGAGEMENT.CHALLENGES}/${challengeId}/participate`,
    participationData
  );
};

/**
 * Marks a challenge as completed by the user
 * @param challengeId - The ID of the challenge
 * @param completionData - Data about the completion
 * @returns Promise resolving to the updated challenge
 */
const completeChallenge = async (
  challengeId: string,
  completionData: object
): Promise<ApiResponse<Challenge>> => {
  return httpClient.post<Challenge>(
    `${API_PATHS.ENGAGEMENT.CHALLENGES}/${challengeId}/complete`,
    completionData
  );
};

/**
 * Retrieves engagement metrics for a tribe
 * @param tribeId - The ID of the tribe
 * @param timeRange - Time range for the metrics
 * @returns Promise resolving to the engagement metrics
 */
const getEngagementMetrics = async (
  tribeId: string,
  timeRange?: object
): Promise<ApiResponse<EngagementMetrics>> => {
  const params = {
    tribeId,
    ...timeRange
  };

  return httpClient.get<EngagementMetrics>(
    API_PATHS.ENGAGEMENT.METRICS,
    params
  );
};

/**
 * Provides feedback on an engagement activity
 * @param engagementId - The ID of the engagement
 * @param feedbackData - Feedback data to submit
 * @returns Promise resolving to feedback submission status
 */
const provideFeedback = async (
  engagementId: string,
  feedbackData: EngagementFeedback
): Promise<ApiResponse<{ success: boolean }>> => {
  const payload = {
    engagementId,
    ...feedbackData
  };

  return httpClient.post<{ success: boolean }>(
    API_PATHS.ENGAGEMENT.FEEDBACK,
    payload
  );
};

// Export all engagement API functions
export const engagementApi = {
  getEngagements,
  getEngagement,
  respondToEngagement,
  generateEngagement,
  getPrompts,
  getChallenges,
  getChallenge,
  participateInChallenge,
  completeChallenge,
  getEngagementMetrics,
  provideFeedback
};