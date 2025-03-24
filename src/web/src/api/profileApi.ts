/**
 * API client module for profile-related operations in the Tribe application.
 * This file provides functions for interacting with the profile service endpoints,
 * including fetching and updating user profiles, managing personality assessments,
 * interests, preferences, and profile media.
 */

import { httpClient } from './httpClient';
import { API_PATHS } from '../constants/apiPaths';
import { ApiResponse } from '../types/api.types';
import {
  Profile,
  PersonalityTrait,
  Interest,
  Preference,
  Achievement,
  ProfileUpdateRequest,
  PersonalityAssessmentQuestion,
  PersonalityAssessmentSubmission,
  InterestSelectionRequest,
  PreferenceUpdateRequest
} from '../types/profile.types';

/**
 * Fetches the user profile data from the API
 * @param userId Optional user ID. If not provided, fetches the authenticated user's profile
 * @returns Promise resolving to the user's profile data
 */
const getProfile = async (userId?: string): Promise<ApiResponse<Profile>> => {
  const endpoint = userId 
    ? `${API_PATHS.PROFILE.GET}/${userId}` 
    : API_PATHS.PROFILE.GET;
  
  return httpClient.get<Profile>(endpoint, {}, {
    offlineQueueable: true
  });
};

/**
 * Updates the user profile with new information
 * @param profileData The profile data to update
 * @returns Promise resolving to the updated profile data
 */
const updateProfile = async (
  profileData: ProfileUpdateRequest
): Promise<ApiResponse<Profile>> => {
  return httpClient.put<Profile>(API_PATHS.PROFILE.UPDATE, profileData, {
    offlineQueueable: true
  });
};

/**
 * Fetches the personality assessment questions
 * @returns Promise resolving to personality assessment questions
 */
const getPersonalityAssessment = async (): Promise<ApiResponse<PersonalityAssessmentQuestion[]>> => {
  return httpClient.get<PersonalityAssessmentQuestion[]>(API_PATHS.PROFILE.ASSESSMENT, {}, {
    offlineQueueable: true
  });
};

/**
 * Submits the user's personality assessment responses
 * @param assessmentData The assessment responses to submit
 * @returns Promise resolving to the personality profile results
 */
const submitPersonalityAssessment = async (
  assessmentData: PersonalityAssessmentSubmission
): Promise<ApiResponse<PersonalityTrait[]>> => {
  return httpClient.post<PersonalityTrait[]>(API_PATHS.PROFILE.ASSESSMENT, assessmentData, {
    offlineQueueable: true
  });
};

/**
 * Fetches the user's interests
 * @param userId Optional user ID. If not provided, fetches the authenticated user's interests
 * @returns Promise resolving to the user's interests
 */
const getInterests = async (userId?: string): Promise<ApiResponse<Interest[]>> => {
  const endpoint = userId 
    ? `${API_PATHS.PROFILE.INTERESTS}/${userId}` 
    : API_PATHS.PROFILE.INTERESTS;
  
  return httpClient.get<Interest[]>(endpoint, {}, {
    offlineQueueable: true
  });
};

/**
 * Updates the user's interests
 * @param interestsData The interests data to update
 * @returns Promise resolving to the updated interests
 */
const updateInterests = async (
  interestsData: InterestSelectionRequest
): Promise<ApiResponse<Interest[]>> => {
  return httpClient.put<Interest[]>(API_PATHS.PROFILE.INTERESTS, interestsData, {
    offlineQueueable: true
  });
};

/**
 * Fetches the user's preferences
 * @returns Promise resolving to the user's preferences
 */
const getPreferences = async (): Promise<ApiResponse<Preference[]>> => {
  return httpClient.get<Preference[]>(API_PATHS.PROFILE.PREFERENCES, {}, {
    offlineQueueable: true
  });
};

/**
 * Updates a specific user preference
 * @param preferenceData The preference data to update
 * @returns Promise resolving to the updated preference
 */
const updatePreference = async (
  preferenceData: PreferenceUpdateRequest
): Promise<ApiResponse<Preference>> => {
  return httpClient.put<Preference>(API_PATHS.PROFILE.PREFERENCES, preferenceData, {
    offlineQueueable: true
  });
};

/**
 * Fetches the user's achievements
 * @returns Promise resolving to the user's achievements
 */
const getAchievements = async (): Promise<ApiResponse<Achievement[]>> => {
  return httpClient.get<Achievement[]>(API_PATHS.PROFILE.ACHIEVEMENTS, {}, {
    offlineQueueable: true
  });
};

/**
 * Fetches compatibility scores between the user and another user or tribe
 * @param targetId ID of the user or tribe to check compatibility with
 * @param targetType Type of target ('user' or 'tribe')
 * @returns Promise resolving to compatibility score and factors
 */
const getCompatibility = async (
  targetId: string,
  targetType: string
): Promise<ApiResponse<{ score: number; factors: Record<string, number> }>> => {
  return httpClient.get<{ score: number; factors: Record<string, number> }>(
    API_PATHS.PROFILE.COMPATIBILITY,
    { targetId, targetType },
    { offlineQueueable: true }
  );
};

/**
 * Uploads profile media (avatar or cover image)
 * @param mediaData FormData containing the media file
 * @param mediaType Type of media ('avatar' or 'cover')
 * @returns Promise resolving to the uploaded media URL
 */
const uploadProfileMedia = async (
  mediaData: FormData,
  mediaType: string
): Promise<ApiResponse<{ mediaUrl: string }>> => {
  return httpClient.post<{ mediaUrl: string }>(
    API_PATHS.PROFILE.MEDIA,
    mediaData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      params: { type: mediaType },
      offlineQueueable: false // Media uploads shouldn't be queued offline
    }
  );
};

export const profileApi = {
  getProfile,
  updateProfile,
  getPersonalityAssessment,
  submitPersonalityAssessment,
  getInterests,
  updateInterests,
  getPreferences,
  updatePreference,
  getAchievements,
  getCompatibility,
  uploadProfileMedia
};