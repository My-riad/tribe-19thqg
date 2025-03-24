import { createAsyncThunk } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9.5
import { authApi } from '../../api/authApi';
import { authService } from '../../services/authService';
import { authActions } from '../slices/authSlice';
import { 
  LoginCredentials, 
  RegistrationData, 
  SocialAuthData, 
  MFAResponse, 
  PasswordResetRequest, 
  PasswordUpdateRequest 
} from '../../types/auth.types';
import { RootState } from '../store';

/**
 * Initializes the authentication state by checking for stored tokens and user data
 */
export const initAuth = createAsyncThunk(
  'auth/initAuth',
  async (_, { dispatch }) => {
    try {
      dispatch(authActions.setLoading(true));
      
      // Initialize the auth service and API
      authService.initialize();
      
      // Try to retrieve stored tokens and user data
      const tokens = await authService.getStoredTokens();
      const user = await authService.getStoredUser();
      
      if (tokens && user) {
        // If tokens and user exist, update the Redux state with the stored data
        dispatch(authActions.setTokens(tokens));
        dispatch(authActions.setUser(user));
      } else {
        // If no tokens or user exist, reset the authentication state
        dispatch(authActions.resetState());
      }
    } catch (error) {
      // Handle any errors by setting the error state
      const errorMessage = error instanceof Error ? error.message : 'Authentication initialization failed';
      dispatch(authActions.setError(errorMessage));
    } finally {
      // Clear loading state
      dispatch(authActions.setLoading(false));
    }
  }
);

/**
 * Authenticates a user with email and password credentials
 * @param credentials The login credentials
 * @returns Promise resolving to user data and tokens, or MFA challenge if required
 */
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { dispatch }) => {
    try {
      // Dispatch loading state
      dispatch(authActions.setLoading(true));
      // Clear any previous errors
      dispatch(authActions.setError(null));
      
      // Call authApi.login with the provided credentials
      const response = await authApi.login(credentials);
      
      // If MFA is required, set the MFA required state and challenge data
      if ('mfaRequired' in response) {
        dispatch(authActions.setMFARequired(true));
        dispatch(authActions.setMFAChallenge(response.challenge));
        return response;
      }
      
      // If login is successful without MFA, store tokens and user data
      await authService.storeTokens(response.tokens);
      await authService.storeUser(response.user);
      
      // Update Redux state with user and token data
      dispatch(authActions.setTokens(response.tokens));
      dispatch(authActions.setUser(response.user));
      
      return response;
    } catch (error) {
      // Handle any errors by setting the error state
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch(authActions.setError(errorMessage));
      throw error;
    } finally {
      // Clear loading state
      dispatch(authActions.setLoading(false));
    }
  }
);

/**
 * Registers a new user with the provided registration data
 * @param data The registration data
 * @returns Promise resolving to the newly created user data
 */
export const register = createAsyncThunk(
  'auth/register',
  async (data: RegistrationData, { dispatch }) => {
    try {
      // Dispatch loading state
      dispatch(authActions.setLoading(true));
      // Clear any previous errors
      dispatch(authActions.setError(null));
      
      // Call authApi.register with the provided registration data
      const response = await authApi.register(data);
      
      // Store the user data if registration is successful
      await authService.storeUser(response.user);
      
      // Update Redux state with user data
      dispatch(authActions.setUser(response.user));
      
      return response;
    } catch (error) {
      // Handle any errors by setting the error state
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch(authActions.setError(errorMessage));
      throw error;
    } finally {
      // Clear loading state
      dispatch(authActions.setLoading(false));
    }
  }
);

/**
 * Authenticates a user using a social authentication provider
 * @param data The social authentication data
 * @returns Promise resolving to user data and tokens, or MFA challenge if required
 */
export const socialLogin = createAsyncThunk(
  'auth/socialLogin',
  async (data: SocialAuthData, { dispatch }) => {
    try {
      // Dispatch loading state
      dispatch(authActions.setLoading(true));
      // Clear any previous errors
      dispatch(authActions.setError(null));
      
      // Call authApi.socialLogin with the provided social auth data
      const response = await authApi.socialLogin(data);
      
      // If MFA is required, set the MFA required state and challenge data
      if ('mfaRequired' in response) {
        dispatch(authActions.setMFARequired(true));
        dispatch(authActions.setMFAChallenge(response.challenge));
        return response;
      }
      
      // If login is successful without MFA, store tokens and user data
      await authService.storeTokens(response.tokens);
      await authService.storeUser(response.user);
      
      // Update Redux state with user and token data
      dispatch(authActions.setTokens(response.tokens));
      dispatch(authActions.setUser(response.user));
      
      return response;
    } catch (error) {
      // Handle any errors by setting the error state
      const errorMessage = error instanceof Error ? error.message : 'Social login failed';
      dispatch(authActions.setError(errorMessage));
      throw error;
    } finally {
      // Clear loading state
      dispatch(authActions.setLoading(false));
    }
  }
);

/**
 * Logs out the current user by invalidating their tokens and clearing stored data
 */
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      // Dispatch loading state
      dispatch(authActions.setLoading(true));
      
      // Call authApi.logout to invalidate tokens on the server
      await authApi.logout();
      
      // Clear stored tokens and user data
      await authService.clearTokens();
      await authService.clearUser();
      
      // Reset the authentication state in Redux
      dispatch(authActions.resetState());
    } catch (error) {
      // Handle any errors by setting the error state
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      dispatch(authActions.setError(errorMessage));
    } finally {
      // Clear loading state
      dispatch(authActions.setLoading(false));
    }
  }
);

/**
 * Verifies a multi-factor authentication challenge
 * @param response The MFA response
 * @returns Promise resolving to user data and tokens
 */
export const verifyMFA = createAsyncThunk(
  'auth/verifyMFA',
  async (response: MFAResponse, { dispatch }) => {
    try {
      // Dispatch loading state
      dispatch(authActions.setLoading(true));
      // Clear any previous errors
      dispatch(authActions.setError(null));
      
      // Call authApi.verifyMFA with the provided MFA response
      const result = await authApi.verifyMFA(response);
      
      // If verification is successful, store tokens and user data
      await authService.storeTokens(result.tokens);
      await authService.storeUser(result.user);
      
      // Update Redux state with user and token data
      dispatch(authActions.setTokens(result.tokens));
      dispatch(authActions.setUser(result.user));
      
      // Clear MFA required state and challenge data
      dispatch(authActions.clearMFARequired());
      
      return result;
    } catch (error) {
      // Handle any errors by setting the error state
      const errorMessage = error instanceof Error ? error.message : 'MFA verification failed';
      dispatch(authActions.setError(errorMessage));
      throw error;
    } finally {
      // Clear loading state
      dispatch(authActions.setLoading(false));
    }
  }
);

/**
 * Initiates the password reset process for a user
 * @param data The password reset request data
 * @returns Promise resolving to success status
 */
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: PasswordResetRequest, { dispatch }) => {
    try {
      // Dispatch loading state
      dispatch(authActions.setLoading(true));
      // Clear any previous errors
      dispatch(authActions.setError(null));
      
      // Call authApi.resetPassword with the provided email
      const response = await authApi.resetPassword(data);
      
      return response;
    } catch (error) {
      // Handle any errors by setting the error state
      const errorMessage = error instanceof Error ? error.message : 'Password reset request failed';
      dispatch(authActions.setError(errorMessage));
      throw error;
    } finally {
      // Clear loading state
      dispatch(authActions.setLoading(false));
    }
  }
);

/**
 * Updates a user's password using a reset token
 * @param data The password update request data
 * @returns Promise resolving to success status
 */
export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (data: PasswordUpdateRequest, { dispatch }) => {
    try {
      // Dispatch loading state
      dispatch(authActions.setLoading(true));
      // Clear any previous errors
      dispatch(authActions.setError(null));
      
      // Call authApi.updatePassword with the token and new password
      const response = await authApi.updatePassword(data);
      
      return response;
    } catch (error) {
      // Handle any errors by setting the error state
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      dispatch(authActions.setError(errorMessage));
      throw error;
    } finally {
      // Clear loading state
      dispatch(authActions.setLoading(false));
    }
  }
);