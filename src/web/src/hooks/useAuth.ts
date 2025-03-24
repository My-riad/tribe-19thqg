import { useEffect, useCallback } from 'react'; // react ^18.2.0
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  login as loginThunk,
  register as registerThunk,
  socialLogin as socialLoginThunk,
  logout as logoutThunk,
  verifyMFA as verifyMFAThunk,
  resetPassword as resetPasswordThunk,
  updatePassword as updatePasswordThunk,
  initAuth as initAuthThunk
} from '../store/thunks/authThunks';
import { authActions } from '../store/slices/authSlice';
import {
  LoginCredentials,
  RegistrationData,
  SocialAuthData,
  MFAResponse,
  PasswordResetRequest,
  PasswordUpdateRequest,
  AuthContextType
} from '../types/auth.types';

/**
 * Custom hook that provides authentication functionality throughout the application
 * 
 * This hook abstracts the Redux authentication state and actions, offering a simplified
 * interface for components to handle user authentication, registration, social login,
 * and session management.
 * 
 * @returns Authentication context object with user state and authentication methods
 */
export const useAuth = (): AuthContextType => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading, error, mfaRequired, mfaChallenge } = useAppSelector(
    (state) => state.auth
  );

  // Login function
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      await dispatch(loginThunk(credentials));
    },
    [dispatch]
  );

  // Register function
  const register = useCallback(
    async (data: RegistrationData): Promise<void> => {
      await dispatch(registerThunk(data));
    },
    [dispatch]
  );

  // Social login function
  const socialLogin = useCallback(
    async (data: SocialAuthData): Promise<void> => {
      await dispatch(socialLoginThunk(data));
    },
    [dispatch]
  );

  // Logout function
  const logout = useCallback(
    async (): Promise<void> => {
      await dispatch(logoutThunk());
    },
    [dispatch]
  );

  // Verify MFA function
  const verifyMFA = useCallback(
    async (response: MFAResponse): Promise<void> => {
      await dispatch(verifyMFAThunk(response));
    },
    [dispatch]
  );

  // Reset password function
  const resetPassword = useCallback(
    async (data: PasswordResetRequest): Promise<boolean> => {
      try {
        await dispatch(resetPasswordThunk(data));
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch]
  );

  // Update password function
  const updatePassword = useCallback(
    async (data: PasswordUpdateRequest): Promise<boolean> => {
      try {
        await dispatch(updatePasswordThunk(data));
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch]
  );

  // Clear error function (for internal use)
  const clearError = useCallback(() => {
    dispatch(authActions.clearError());
  }, [dispatch]);

  // Check authentication status
  const checkAuthStatus = useCallback(
    async (): Promise<void> => {
      await dispatch(initAuthThunk());
    },
    [dispatch]
  );

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    mfaRequired,
    mfaChallenge,
    login,
    register,
    socialLogin,
    logout,
    verifyMFA,
    resetPassword,
    updatePassword,
    checkAuthStatus
  };
};