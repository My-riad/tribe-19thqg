import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User, AuthTokens, MFAChallenge } from '../../types/auth.types';

/**
 * Initial state for the authentication slice
 */
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  mfaRequired: false,
  mfaChallenge: null
};

/**
 * Auth slice for managing authentication state
 * Contains reducers for updating user data, tokens, loading state,
 * error messages, and multi-factor authentication status
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Updates the user data and authentication status
     */
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload && !!state.tokens;
    },
    
    /**
     * Updates the authentication tokens and authentication status
     */
    setTokens(state, action: PayloadAction<AuthTokens | null>) {
      state.tokens = action.payload;
      state.isAuthenticated = !!state.user && !!action.payload;
    },
    
    /**
     * Sets an error message in the authentication state
     */
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    
    /**
     * Sets the loading state for authentication operations
     */
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    
    /**
     * Sets the multi-factor authentication required flag
     */
    setMFARequired(state, action: PayloadAction<boolean>) {
      state.mfaRequired = action.payload;
    },
    
    /**
     * Sets the multi-factor authentication challenge data
     */
    setMFAChallenge(state, action: PayloadAction<MFAChallenge | null>) {
      state.mfaChallenge = action.payload;
    },
    
    /**
     * Clears the multi-factor authentication required flag and challenge
     */
    clearMFARequired(state) {
      state.mfaRequired = false;
      state.mfaChallenge = null;
    },
    
    /**
     * Resets the authentication state to initial values
     * Used during logout or session expiration
     */
    resetState(state) {
      Object.assign(state, initialState);
    }
  }
});

// Extract and export the action creators
export const authActions = authSlice.actions;

// Export the reducer as default
export default authSlice.reducer;