import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  fetchProfile, 
  updateProfile, 
  submitPersonalityAssessment, 
  updateInterests, 
  fetchInterests, 
  uploadProfileImage 
} from '../store/thunks/profileThunks';
import { 
  profileActions,
  selectProfile, 
  selectProfileLoading, 
  selectProfileError,
  selectAssessmentComplete,
  selectInterestsSelected
} from '../store/slices/profileSlice';
import { 
  Profile, 
  ProfileUpdateRequest, 
  PersonalityAssessmentSubmission, 
  InterestSelectionRequest, 
  PersonalityTrait, 
  Interest 
} from '../types/profile.types';

/**
 * Interface defining the shape of the profile context returned by useProfile hook
 */
export interface ProfileContextType {
  profile: Profile | null;
  personalityTraits: PersonalityTrait[];
  interests: Interest[];
  loading: boolean;
  error: string | null;
  isAssessmentComplete: boolean;
  areInterestsSelected: boolean;
  profileCompletionPercentage: number;
  getProfile: (userId?: string) => Promise<Profile>;
  updateUserProfile: (profileData: ProfileUpdateRequest) => Promise<Profile>;
  submitAssessment: (assessmentData: PersonalityAssessmentSubmission) => Promise<PersonalityTrait[]>;
  updateUserInterests: (interestsData: InterestSelectionRequest) => Promise<Interest[]>;
  getUserInterests: (userId?: string) => Promise<Interest[]>;
  uploadAvatar: (imageData: FormData) => Promise<{ mediaUrl: string }>;
  clearProfileError: () => void;
}

/**
 * Custom hook that provides profile management functionality throughout the application
 * @returns Profile context object with profile state and management methods
 */
export const useProfile = (): ProfileContextType => {
  const dispatch = useAppDispatch();
  
  // Select profile state from Redux store
  const profile = useAppSelector(selectProfile);
  const loading = useAppSelector(selectProfileLoading);
  const error = useAppSelector(selectProfileError);
  const isAssessmentComplete = useAppSelector(selectAssessmentComplete);
  const areInterestsSelected = useAppSelector(selectInterestsSelected);
  
  // Get personality traits and interests from profile for easier access
  const personalityTraits = profile?.personalityTraits || [];
  const interests = profile?.interests || [];
  
  // Memoized function to fetch profile data
  const getProfile = useCallback(
    async (userId?: string): Promise<Profile> => {
      const result = await dispatch(fetchProfile(userId));
      return result.payload as Profile;
    }, 
    [dispatch]
  );
  
  // Memoized function to update user profile
  const updateUserProfile = useCallback(
    async (profileData: ProfileUpdateRequest): Promise<Profile> => {
      const result = await dispatch(updateProfile(profileData));
      return result.payload as Profile;
    },
    [dispatch]
  );
  
  // Memoized function to submit personality assessment
  const submitAssessment = useCallback(
    async (assessmentData: PersonalityAssessmentSubmission): Promise<PersonalityTrait[]> => {
      const result = await dispatch(submitPersonalityAssessment(assessmentData));
      return result.payload as PersonalityTrait[];
    },
    [dispatch]
  );
  
  // Memoized function to update user interests
  const updateUserInterests = useCallback(
    async (interestsData: InterestSelectionRequest): Promise<Interest[]> => {
      const result = await dispatch(updateInterests(interestsData));
      return result.payload as Interest[];
    },
    [dispatch]
  );
  
  // Memoized function to fetch user interests
  const getUserInterests = useCallback(
    async (userId?: string): Promise<Interest[]> => {
      const result = await dispatch(fetchInterests(userId));
      return result.payload as Interest[];
    },
    [dispatch]
  );
  
  // Memoized function to upload profile image
  const uploadAvatar = useCallback(
    async (imageData: FormData): Promise<{ mediaUrl: string }> => {
      const result = await dispatch(uploadProfileImage({ imageData, imageType: 'avatar' }));
      return result.payload as { mediaUrl: string };
    },
    [dispatch]
  );
  
  // Memoized function to clear profile error
  const clearProfileError = useCallback(
    () => {
      dispatch(profileActions.clearError());
    },
    [dispatch]
  );
  
  // Calculate profile completion percentage
  const profileCompletionPercentage = profile?.completionPercentage || 0;
  
  // Fetch profile data if not already loaded
  useEffect(() => {
    if (!profile && !loading) {
      getProfile().catch(error => {
        console.error('Error fetching profile:', error);
      });
    }
  }, [profile, loading, getProfile]);
  
  return {
    profile,
    personalityTraits,
    interests,
    loading,
    error,
    isAssessmentComplete,
    areInterestsSelected,
    profileCompletionPercentage,
    getProfile,
    updateUserProfile,
    submitAssessment,
    updateUserInterests,
    getUserInterests,
    uploadAvatar,
    clearProfileError
  };
};