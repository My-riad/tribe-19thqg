import { authApi } from '../api/authApi';
import { storageService } from './storageService';
import { SECURE_STORAGE_KEYS, STORAGE_KEYS } from '../constants/storageKeys';
import {
  User,
  AuthTokens,
  LoginCredentials,
  RegistrationData,
  SocialAuthData,
  MFAResponse,
  MFAChallenge,
  PasswordResetRequest,
  PasswordUpdateRequest
} from '../types/auth.types';

/**
 * Initializes the authentication service by setting up the auth API
 */
const initialize = (): void => {
  authApi.initializeAuthApi();
};

/**
 * Authenticates a user with email and password credentials
 * @param credentials The login credentials
 * @returns Promise resolving to user data and tokens, or MFA challenge if required
 */
const login = async (
  credentials: LoginCredentials
): Promise<{ user: User; tokens: AuthTokens } | { mfaRequired: true; challenge: MFAChallenge }> => {
  const response = await authApi.login(credentials);
  
  // If MFA is required, return the challenge
  if ('mfaRequired' in response) {
    return response;
  }

  // Store tokens and user data
  await storeTokens(response.tokens);
  await storeUser(response.user);
  
  return response;
};

/**
 * Registers a new user with the provided registration data
 * @param data The registration data
 * @returns Promise resolving to the newly created user data
 */
const register = async (data: RegistrationData): Promise<{ user: User }> => {
  const response = await authApi.register(data);
  
  // Store user data
  await storeUser(response.user);
  
  return response;
};

/**
 * Authenticates a user using a social authentication provider
 * @param data The social authentication data
 * @returns Promise resolving to user data and tokens, or MFA challenge if required
 */
const socialLogin = async (
  data: SocialAuthData
): Promise<{ user: User; tokens: AuthTokens } | { mfaRequired: true; challenge: MFAChallenge }> => {
  const response = await authApi.socialLogin(data);
  
  // If MFA is required, return the challenge
  if ('mfaRequired' in response) {
    return response;
  }

  // Store tokens and user data
  await storeTokens(response.tokens);
  await storeUser(response.user);
  
  return response;
};

/**
 * Logs out the current user by invalidating their tokens and clearing stored data
 * @returns Promise resolving when logout is complete
 */
const logout = async (): Promise<void> => {
  try {
    // Invalidate tokens on the server
    await authApi.logout();
  } catch (error) {
    console.error('Error logging out on server:', error);
    // Continue with local logout even if server logout fails
  } finally {
    // Clear local storage regardless of server response
    await clearTokens();
    await clearUser();
  }
};

/**
 * Verifies a multi-factor authentication challenge
 * @param response The MFA response
 * @returns Promise resolving to user data and tokens
 */
const verifyMFA = async (response: MFAResponse): Promise<{ user: User; tokens: AuthTokens }> => {
  const result = await authApi.verifyMFA(response);
  
  // Store tokens and user data
  await storeTokens(result.tokens);
  await storeUser(result.user);
  
  return result;
};

/**
 * Refreshes the authentication tokens using the stored refresh token
 * @returns Promise resolving to new tokens or null if refresh fails
 */
const refreshTokens = async (): Promise<AuthTokens | null> => {
  // Get stored refresh token
  const storedTokens = await getStoredTokens();
  
  if (!storedTokens || !storedTokens.refreshToken) {
    return null;
  }
  
  try {
    // Attempt to refresh tokens
    const result = await authApi.refreshToken(storedTokens.refreshToken);
    
    // Store new tokens
    await storeTokens(result.tokens);
    
    return result.tokens;
  } catch (error) {
    console.error('Error refreshing tokens:', error);
    return null;
  }
};

/**
 * Retrieves the stored authentication tokens
 * @returns Promise resolving to stored tokens or null if not found
 */
const getStoredTokens = async (): Promise<AuthTokens | null> => {
  try {
    const accessToken = await storageService.getSecureData(SECURE_STORAGE_KEYS.AUTH_TOKEN);
    const refreshToken = await storageService.getSecureData(SECURE_STORAGE_KEYS.REFRESH_TOKEN);
    
    if (accessToken && refreshToken) {
      return {
        accessToken,
        refreshToken,
        expiresIn: 0 // We don't store expiresIn, it's handled by token refresh logic
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving stored tokens:', error);
    return null;
  }
};

/**
 * Securely stores authentication tokens
 * @param tokens The tokens to store
 * @returns Promise resolving when tokens are stored
 */
const storeTokens = async (tokens: AuthTokens): Promise<void> => {
  await storageService.storeSecureData(SECURE_STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
  await storageService.storeSecureData(SECURE_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
};

/**
 * Removes stored authentication tokens
 * @returns Promise resolving when tokens are removed
 */
const clearTokens = async (): Promise<void> => {
  await storageService.removeSecureData(SECURE_STORAGE_KEYS.AUTH_TOKEN);
  await storageService.removeSecureData(SECURE_STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Retrieves the stored user data
 * @returns Promise resolving to stored user data or null if not found
 */
const getStoredUser = async (): Promise<User | null> => {
  return await storageService.getData<User>(STORAGE_KEYS.USER_PROFILE, null);
};

/**
 * Stores user data in local storage
 * @param user The user data to store
 * @returns Promise resolving when user data is stored
 */
const storeUser = async (user: User): Promise<void> => {
  await storageService.storeData(STORAGE_KEYS.USER_PROFILE, user);
};

/**
 * Removes stored user data
 * @returns Promise resolving when user data is removed
 */
const clearUser = async (): Promise<void> => {
  await storageService.removeData(STORAGE_KEYS.USER_PROFILE);
};

/**
 * Checks if the user is currently authenticated
 * @returns Promise resolving to authentication status
 */
const isAuthenticated = async (): Promise<boolean> => {
  const tokens = await getStoredTokens();
  return !!tokens;
};

/**
 * Initiates the password reset process for a user
 * @param data The password reset request data
 * @returns Promise resolving to success status
 */
const resetPassword = async (data: PasswordResetRequest): Promise<{ success: boolean }> => {
  return await authApi.resetPassword(data);
};

/**
 * Updates a user's password using a reset token
 * @param data The password update request data
 * @returns Promise resolving to success status
 */
const updatePassword = async (data: PasswordUpdateRequest): Promise<{ success: boolean }> => {
  return await authApi.updatePassword(data);
};

/**
 * Verifies a user's email address using a verification token
 * @param token The verification token
 * @returns Promise resolving to success status
 */
const verifyEmail = async (token: string): Promise<{ success: boolean }> => {
  const response = await authApi.verifyEmail(token);
  
  // If verification was successful, update the stored user data
  if (response.success) {
    const currentUser = await getStoredUser();
    if (currentUser) {
      await storeUser({
        ...currentUser,
        isEmailVerified: true
      });
    }
  }
  
  return response;
};

/**
 * Authentication service for the Tribe application
 * Handles user authentication, token management, and session persistence
 */
export const authService = {
  initialize,
  login,
  register,
  socialLogin,
  logout,
  verifyMFA,
  refreshTokens,
  getStoredTokens,
  getStoredUser,
  isAuthenticated,
  resetPassword,
  updatePassword,
  verifyEmail
};