import { createAsyncThunk } from '@reduxjs/toolkit'; // v^1.9.5
import { 
  profileApi,
  profileActions,
  ProfileUpdateRequest,
  PersonalityAssessmentSubmission,
  InterestSelectionRequest
} from '../slices/profileSlice';
import {
  profileApi,
  ProfileUpdateRequest,
  PersonalityAssessmentSubmission,
  InterestSelectionRequest
} from '../../types/profile.types';

/**
 * Async thunk for fetching the user profile from the API
 */
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (userId: string | undefined, { dispatch }) => {
    dispatch(profileActions.setLoading(true));
    try {
      const response = await profileApi.getProfile(userId);
      if (response.success) {
        dispatch(profileActions.setProfile(response.data));
      }
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile';
      dispatch(profileActions.setError(errorMessage));
      throw error;
    } finally {
      dispatch(profileActions.setLoading(false));
    }
  }
);

/**
 * Async thunk for updating the user profile
 */
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (profileData: ProfileUpdateRequest, { dispatch }) => {
    dispatch(profileActions.setLoading(true));
    try {
      const response = await profileApi.updateProfile(profileData);
      if (response.success) {
        dispatch(profileActions.setProfile(response.data));
      }
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      dispatch(profileActions.setError(errorMessage));
      throw error;
    } finally {
      dispatch(profileActions.setLoading(false));
    }
  }
);

/**
 * Async thunk for fetching personality assessment questions
 */
export const fetchPersonalityAssessment = createAsyncThunk(
  'profile/fetchPersonalityAssessment',
  async (_, { dispatch }) => {
    dispatch(profileActions.setLoading(true));
    try {
      const response = await profileApi.getPersonalityAssessment();
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch personality assessment';
      dispatch(profileActions.setError(errorMessage));
      throw error;
    } finally {
      dispatch(profileActions.setLoading(false));
    }
  }
);

/**
 * Async thunk for submitting personality assessment responses
 */
export const submitPersonalityAssessment = createAsyncThunk(
  'profile/submitPersonalityAssessment',
  async (assessmentData: PersonalityAssessmentSubmission, { dispatch }) => {
    dispatch(profileActions.setLoading(true));
    dispatch(profileActions.setAssessmentStatus('submitting'));
    try {
      const response = await profileApi.submitPersonalityAssessment(assessmentData);
      if (response.success) {
        dispatch(profileActions.updatePersonalityTraits(response.data));
        dispatch(profileActions.setAssessmentComplete(true));
      }
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit personality assessment';
      dispatch(profileActions.setError(errorMessage));
      throw error;
    } finally {
      dispatch(profileActions.setLoading(false));
    }
  }
);

/**
 * Async thunk for fetching user interests
 */
export const fetchInterests = createAsyncThunk(
  'profile/fetchInterests',
  async (userId: string | undefined, { dispatch }) => {
    dispatch(profileActions.setLoading(true));
    try {
      const response = await profileApi.getInterests(userId);
      if (response.success) {
        dispatch(profileActions.updateInterests(response.data));
      }
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch interests';
      dispatch(profileActions.setError(errorMessage));
      throw error;
    } finally {
      dispatch(profileActions.setLoading(false));
    }
  }
);

/**
 * Async thunk for updating user interests
 */
export const updateInterests = createAsyncThunk(
  'profile/updateInterests',
  async (interestsData: InterestSelectionRequest, { dispatch }) => {
    dispatch(profileActions.setLoading(true));
    try {
      const response = await profileApi.updateInterests(interestsData);
      if (response.success) {
        dispatch(profileActions.updateInterests(response.data));
        dispatch(profileActions.setInterestsSelected(true));
      }
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update interests';
      dispatch(profileActions.setError(errorMessage));
      throw error;
    } finally {
      dispatch(profileActions.setLoading(false));
    }
  }
);

/**
 * Async thunk for uploading profile image (avatar or cover)
 */
export const uploadProfileImage = createAsyncThunk(
  'profile/uploadProfileImage',
  async ({ imageData, imageType }: { imageData: FormData, imageType: 'avatar' | 'cover' }, { dispatch }) => {
    dispatch(profileActions.setLoading(true));
    try {
      const response = await profileApi.uploadProfileMedia(imageData, imageType);
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload profile image';
      dispatch(profileActions.setError(errorMessage));
      throw error;
    } finally {
      dispatch(profileActions.setLoading(false));
    }
  }
);

/**
 * Async thunk for updating the personality assessment progress
 */
export const updateAssessmentProgress = createAsyncThunk(
  'profile/updateAssessmentProgress',
  async (progress: number, { dispatch }) => {
    dispatch(profileActions.setAssessmentProgress(progress));
    return Promise.resolve();
  }
);