import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  ProfileState, 
  Profile, 
  PersonalityTrait, 
  Interest, 
  Preference, 
  Achievement 
} from '../../types/profile.types';

/**
 * Initial state for the profile slice
 */
const initialState: ProfileState = {
  profile: null,
  personalityTraits: [],
  interests: [],
  preferences: [],
  achievements: [],
  loading: false,
  error: null,
  assessmentStatus: 'not_started',
  assessmentProgress: 0
};

/**
 * Redux slice for managing user profile state
 */
export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    /**
     * Updates the profile state with a new profile object
     */
    setProfile: (state, action: PayloadAction<Profile>) => {
      state.profile = action.payload;
      state.personalityTraits = action.payload.personalityTraits || [];
      state.interests = action.payload.interests || [];
      state.preferences = action.payload.preferences || [];
      state.achievements = action.payload.achievements || [];
    },
    
    /**
     * Updates the personality traits in the state
     */
    updatePersonalityTraits: (state, action: PayloadAction<PersonalityTrait[]>) => {
      state.personalityTraits = action.payload;
      if (state.profile) {
        state.profile.personalityTraits = action.payload;
      }
    },
    
    /**
     * Updates the interests in the state
     */
    updateInterests: (state, action: PayloadAction<Interest[]>) => {
      state.interests = action.payload;
      if (state.profile) {
        state.profile.interests = action.payload;
      }
    },
    
    /**
     * Updates the preferences in the state
     */
    updatePreferences: (state, action: PayloadAction<Preference[]>) => {
      state.preferences = action.payload;
      if (state.profile) {
        state.profile.preferences = action.payload;
      }
    },
    
    /**
     * Updates the achievements in the state
     */
    updateAchievements: (state, action: PayloadAction<Achievement[]>) => {
      state.achievements = action.payload;
      if (state.profile) {
        state.profile.achievements = action.payload;
      }
    },
    
    /**
     * Sets the loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    /**
     * Sets the error state
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    /**
     * Sets the assessment status
     */
    setAssessmentStatus: (state, action: PayloadAction<string>) => {
      state.assessmentStatus = action.payload;
    },
    
    /**
     * Sets the assessment progress percentage
     */
    setAssessmentProgress: (state, action: PayloadAction<number>) => {
      state.assessmentProgress = action.payload;
    },
    
    /**
     * Marks the personality assessment as complete
     */
    setAssessmentComplete: (state, action: PayloadAction<boolean>) => {
      state.assessmentStatus = action.payload ? 'completed' : 'not_started';
      state.assessmentProgress = action.payload ? 100 : 0;
    },
    
    /**
     * Marks the interests as selected
     */
    setInterestsSelected: (state, action: PayloadAction<boolean>) => {
      // Since ProfileState doesn't have a dedicated field for tracking if interests
      // are selected, we can use the assessment status to track onboarding progress
      if (action.payload && state.interests.length > 0) {
        // Update state to reflect that interests have been selected
        // This could be part of the overall profile completion process
        if (state.profile) {
          state.profile.completionPercentage = Math.min(
            100, 
            (state.profile.completionPercentage || 0) + 20
          );
        }
      }
    },
    
    /**
     * Resets the profile state to initial values
     */
    resetProfile: (state) => {
      return initialState;
    }
  }
});

// Export the reducer
export const profileReducer = profileSlice.reducer;

// Export the actions
export const profileActions = profileSlice.actions;

// Selectors for accessing profile state
export const selectProfile = (state: { profile: ProfileState }) => state.profile.profile;
export const selectPersonalityTraits = (state: { profile: ProfileState }) => state.profile.personalityTraits;
export const selectInterests = (state: { profile: ProfileState }) => state.profile.interests;
export const selectPreferences = (state: { profile: ProfileState }) => state.profile.preferences;
export const selectAchievements = (state: { profile: ProfileState }) => state.profile.achievements;
export const selectProfileLoading = (state: { profile: ProfileState }) => state.profile.loading;
export const selectProfileError = (state: { profile: ProfileState }) => state.profile.error;
export const selectAssessmentStatus = (state: { profile: ProfileState }) => state.profile.assessmentStatus;
export const selectAssessmentProgress = (state: { profile: ProfileState }) => state.profile.assessmentProgress;

// Default export
export default profileSlice.reducer;