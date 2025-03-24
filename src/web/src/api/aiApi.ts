import { httpClient } from './httpClient';
import { API_PATHS } from '../constants/apiPaths';
import { ApiResponse } from '../types/api.types';

/**
 * Interface representing a user's personality profile generated by AI analysis
 */
export interface PersonalityProfile {
  /** Mapped personality traits with scores (0-100) */
  traits: Record<string, number>;
  /** Identified communication style (e.g., "Direct", "Collaborative", "Analytical") */
  communicationStyle: string;
  /** Mapped interests with enthusiasm levels (0-100) */
  interests: Record<string, number>;
  /** Additional compatibility factors used in tribe matching */
  compatibilityFactors: Record<string, any>;
}

/**
 * Interface representing AI-generated tribe matching recommendations
 */
export interface MatchingRecommendations {
  /** List of tribes recommended for the user */
  recommendedTribes: Array<{
    tribeId: string;
    name: string;
    description: string;
    memberCount: number;
    compatibilityScore: number;
    matchReasons: string[];
    primaryInterests: string[];
  }>;
  /** Compatibility scores with different tribes */
  compatibilityScores: Record<string, number>;
  /** Reasons for recommending these tribes */
  matchingReasons: string[];
}

/**
 * Interface representing AI-generated conversation prompts and challenges
 */
export interface EngagementPrompts {
  /** Conversation starters for the tribe */
  conversationStarters: Array<{
    prompt: string;
    context: string;
    type: string;
  }>;
  /** Group challenges to increase engagement */
  groupChallenges: Array<{
    title: string;
    description: string;
    difficulty: string;
  }>;
  /** Activity suggestions for the tribe */
  activitySuggestions: Array<{
    activity: string;
    description: string;
    suitable: string[];
  }>;
}

/**
 * Interface representing AI-generated activity and event recommendations
 */
export interface ActivityRecommendations {
  /** Local events that match the tribe's interests */
  localEvents: Array<{
    eventId: string;
    name: string;
    description: string;
    matchScore: number;
    reasons: string[];
  }>;
  /** Custom activities tailored to the tribe */
  customActivities: Array<{
    title: string;
    description: string;
    matchScore: number;
    suitable: string[];
  }>;
  /** Activity suggestions based on weather forecast */
  weatherBasedSuggestions: {
    condition: string;
    activities: Array<{
      title: string;
      description: string;
    }>;
  };
  /** Venue recommendations for meetups */
  venueRecommendations: Array<{
    venueId: string;
    name: string;
    type: string;
    matchScore: number;
  }>;
}

/**
 * Interface representing AI-generated optimal meeting time recommendations
 */
export interface OptimalTimeRecommendation {
  /** List of recommended time slots in order of preference */
  recommendedTimes: Array<{
    startTime: string;
    endTime: string;
    availableMembers: number;
    totalMembers: number;
    score: number;
  }>;
  /** Projected attendance for different time slots */
  attendanceProjections: Record<string, number>;
  /** Alternative options if recommended times don't work */
  alternativeOptions: Array<{
    startTime: string;
    endTime: string;
    availableMembers: number;
    totalMembers: number;
    score: number;
  }>;
}

/**
 * Interface representing AI-generated personalized challenges for a tribe
 */
export interface PersonalizedChallenges {
  /** List of personalized challenges for the tribe */
  challenges: Array<{
    title: string;
    description: string;
    difficulty: string;
    expectedOutcome: string;
  }>;
  /** Description of difficulty levels */
  difficultyLevels: Record<string, string>;
  /** Description of expected outcomes */
  expectedOutcomes: Record<string, string>;
}

/**
 * Analyzes user responses to personality assessment questions and generates a personality profile
 * @param assessmentResponses Object containing user responses to personality assessment questions
 * @returns Promise resolving to personality profile analysis
 */
const analyzePersonality = async (
  assessmentResponses: object
): Promise<ApiResponse<PersonalityProfile>> => {
  return httpClient.post<PersonalityProfile>(
    `${API_PATHS.AI.BASE}${API_PATHS.AI.PERSONALITY}`,
    assessmentResponses
  );
};

/**
 * Retrieves AI-powered tribe matching recommendations for a user
 * @param userId The ID of the user to get recommendations for
 * @param preferences Optional matching preferences
 * @returns Promise resolving to tribe matching recommendations
 */
const getMatchingRecommendations = async (
  userId: string,
  preferences: object = {}
): Promise<ApiResponse<MatchingRecommendations>> => {
  return httpClient.get<MatchingRecommendations>(
    `${API_PATHS.AI.BASE}${API_PATHS.AI.MATCHING}`,
    { userId, ...preferences }
  );
};

/**
 * Retrieves AI-generated conversation prompts and challenges for a tribe
 * @param tribeId The ID of the tribe to get prompts for
 * @param options Optional configuration for the types of prompts to generate
 * @returns Promise resolving to engagement prompts and challenges
 */
const getEngagementPrompts = async (
  tribeId: string,
  options: object = {}
): Promise<ApiResponse<EngagementPrompts>> => {
  return httpClient.get<EngagementPrompts>(
    `${API_PATHS.AI.BASE}${API_PATHS.AI.ENGAGEMENT}`,
    { tribeId, ...options }
  );
};

/**
 * Retrieves AI-powered activity and event recommendations for a tribe
 * @param tribeId The ID of the tribe to get recommendations for
 * @param preferences Optional activity preferences
 * @returns Promise resolving to activity recommendations
 */
const getActivityRecommendations = async (
  tribeId: string,
  preferences: object = {}
): Promise<ApiResponse<ActivityRecommendations>> => {
  return httpClient.get<ActivityRecommendations>(
    `${API_PATHS.AI.BASE}${API_PATHS.AI.RECOMMENDATIONS}`,
    { tribeId, ...preferences }
  );
};

/**
 * Uses AI to determine the optimal meeting time based on member availability
 * @param tribeId The ID of the tribe
 * @param availabilityData Object containing member availability data
 * @returns Promise resolving to optimal meeting time recommendations
 */
const generateOptimalMeetupTime = async (
  tribeId: string,
  availabilityData: object
): Promise<ApiResponse<OptimalTimeRecommendation>> => {
  return httpClient.post<OptimalTimeRecommendation>(
    `${API_PATHS.AI.BASE}${API_PATHS.AI.RECOMMENDATIONS}/optimal-time`,
    { tribeId, availabilityData }
  );
};

/**
 * Retrieves AI-generated personalized challenges for a tribe to increase engagement
 * @param tribeId The ID of the tribe to get challenges for
 * @param options Optional configuration for the types of challenges to generate
 * @returns Promise resolving to personalized challenges
 */
const getPersonalizedChallenges = async (
  tribeId: string,
  options: object = {}
): Promise<ApiResponse<PersonalizedChallenges>> => {
  return httpClient.get<PersonalizedChallenges>(
    `${API_PATHS.AI.BASE}${API_PATHS.AI.ENGAGEMENT}/challenges`,
    { tribeId, ...options }
  );
};

/**
 * API client module for interacting with AI services of the Tribe platform
 */
export const aiApi = {
  analyzePersonality,
  getMatchingRecommendations,
  getEngagementPrompts,
  getActivityRecommendations,
  generateOptimalMeetupTime,
  getPersonalizedChallenges
};