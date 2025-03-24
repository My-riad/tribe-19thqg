import { httpClient } from './httpClient';
import { API_PATHS } from '../constants/apiPaths';
import { ApiResponse, PaginatedResponse } from '../types/api.types';
import { TribeTypes } from '../types/tribe.types';

/**
 * Enum representing the frequency of matching attempts
 */
export enum MatchFrequency {
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY'
}

/**
 * Interface representing the user's matching preferences
 */
export interface MatchingPreferences {
  usePersonalityMatching: boolean;
  useInterestMatching: boolean;
  useLocationMatching: boolean;
  useAgeMatching: boolean;
  maxDistance: number;
  preferredTribeSize: number;
  matchFrequency: MatchFrequency;
}

/**
 * Interface representing the user's current matching status
 */
export interface MatchingStatus {
  isOptedIn: boolean;
  lastMatchAttempt: Date;
  nextScheduledMatch: Date;
  preferences: MatchingPreferences;
}

/**
 * Interface representing detailed compatibility information
 */
export interface CompatibilityDetails {
  strengths: string[];
  complementaryTraits: string[];
  sharedInterests: string[];
  potentialChallenges: string[];
}

/**
 * Interface representing compatibility scores between users or a user and a tribe
 */
export interface CompatibilityScore {
  overall: number;
  personality: number;
  interests: number;
  communication: number;
  details: CompatibilityDetails;
}

/**
 * Opts the user in for weekly AI-powered auto-matching
 * @param preferences User's matching preferences
 * @returns Response indicating whether the opt-in was successful
 */
const optInForMatching = async (preferences: MatchingPreferences): Promise<ApiResponse<{ success: boolean }>> => {
  return httpClient.post<{ success: boolean }>(API_PATHS.MATCHING.OPT_IN, preferences);
};

/**
 * Opts the user out from weekly AI-powered auto-matching
 * @returns Response indicating whether the opt-out was successful
 */
const optOutFromMatching = async (): Promise<ApiResponse<{ success: boolean }>> => {
  return httpClient.post<{ success: boolean }>(API_PATHS.MATCHING.OPT_OUT, {});
};

/**
 * Gets the current matching status and preferences for the user
 * @returns Response containing the user's matching status and preferences
 */
const getMatchingStatus = async (): Promise<ApiResponse<MatchingStatus>> => {
  return httpClient.get<MatchingStatus>(API_PATHS.MATCHING.STATUS);
};

/**
 * Gets the compatibility score between the user and a tribe or another user
 * @param params Object containing either tribeId or userId
 * @returns Response containing compatibility score and details
 */
const getCompatibilityScore = async (params: { tribeId?: string; userId?: string }): Promise<ApiResponse<CompatibilityScore>> => {
  return httpClient.get<CompatibilityScore>(API_PATHS.MATCHING.COMPATIBILITY, params);
};

/**
 * Gets AI-powered tribe suggestions for the user based on their profile and preferences
 * @param filters Optional filters to refine suggestions
 * @returns Response containing paginated tribe suggestions
 */
const getTribeSuggestions = async (filters: TribeTypes.TribeSearchFilters): Promise<ApiResponse<PaginatedResponse<TribeTypes.Tribe>>> => {
  return httpClient.get<PaginatedResponse<TribeTypes.Tribe>>(API_PATHS.MATCHING.SUGGESTIONS, filters);
};

/**
 * Triggers a batch matching process (admin only)
 * @param params Optional parameters to configure the batch matching process
 * @returns Response containing the ID of the batch matching job
 */
const runBatchMatching = async (params: { 
  userIds?: string[]; 
  maxMatches?: number; 
  prioritizeNew?: boolean;
}): Promise<ApiResponse<{ jobId: string }>> => {
  return httpClient.post<{ jobId: string }>(API_PATHS.MATCHING.BATCH, params);
};

/**
 * Export all matching API functions as a single object
 */
export const matchingApi = {
  optInForMatching,
  optOutFromMatching,
  getMatchingStatus,
  getCompatibilityScore,
  getTribeSuggestions,
  runBatchMatching
};