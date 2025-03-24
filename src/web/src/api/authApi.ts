import { httpClient } from './httpClient';
import { API_PATHS } from '../constants/apiPaths';
import {
  LoginCredentials,
  RegistrationData,
  AuthTokens,
  User,
  SocialAuthData,
  MFAResponse,
  MFAChallenge,
  PasswordResetRequest,
  PasswordUpdateRequest
} from '../types/auth.types';

/**
 * Authenticates a user with email and password credentials
 * @param credentials The login credentials
 * @returns Promise resolving to user data and tokens, or MFA challenge if required
 */
const login = async (
  credentials: LoginCredentials
): Promise<{ user: User; tokens: AuthTokens } | { mfaRequired: true; challenge: MFAChallenge }> => {
  const response = await httpClient.post<{ user: User; tokens: AuthTokens } | { mfaRequired: true; challenge: MFAChallenge }>(
    API_PATHS.AUTH.LOGIN, 
    credentials
  );
  return response.data;
};

/**
 * Registers a new user with the provided registration data
 * @param data The registration data
 * @returns Promise resolving to the newly created user data
 */
const register = async (data: RegistrationData): Promise<{ user: User }> => {
  const response = await httpClient.post<{ user: User }>(
    API_PATHS.AUTH.REGISTER, 
    data
  );
  return response.data;
};

/**
 * Authenticates a user using a social authentication provider
 * @param data The social authentication data
 * @returns Promise resolving to user data and tokens, or MFA challenge if required
 */
const socialLogin = async (
  data: SocialAuthData
): Promise<{ user: User; tokens: AuthTokens } | { mfaRequired: true; challenge: MFAChallenge }> => {
  const response = await httpClient.post<{ user: User; tokens: AuthTokens } | { mfaRequired: true; challenge: MFAChallenge }>(
    API_PATHS.AUTH.SOCIAL, 
    data
  );
  return response.data;
};

/**
 * Refreshes the authentication tokens using a refresh token
 * @param refreshToken The refresh token
 * @returns Promise resolving to new authentication tokens
 */
const refreshToken = async (refreshToken: string): Promise<{ tokens: AuthTokens }> => {
  const response = await httpClient.post<{ tokens: AuthTokens }>(
    API_PATHS.AUTH.REFRESH, 
    { refreshToken }
  );
  return response.data;
};

/**
 * Logs out the current user by invalidating their tokens
 * @returns Promise resolving when logout is complete
 */
const logout = async (): Promise<void> => {
  await httpClient.post(API_PATHS.AUTH.LOGOUT, {});
};

/**
 * Verifies a user's email address using a verification token
 * @param token The verification token
 * @returns Promise resolving to success status
 */
const verifyEmail = async (token: string): Promise<{ success: boolean }> => {
  const response = await httpClient.get<{ success: boolean }>(
    API_PATHS.AUTH.VERIFY, 
    { token }
  );
  return response.data;
};

/**
 * Initiates the password reset process for a user
 * @param data The password reset request data
 * @returns Promise resolving to success status
 */
const resetPassword = async (data: PasswordResetRequest): Promise<{ success: boolean }> => {
  const response = await httpClient.post<{ success: boolean }>(
    API_PATHS.AUTH.PASSWORD_RESET, 
    data
  );
  return response.data;
};

/**
 * Updates a user's password using a reset token
 * @param data The password update request data
 * @returns Promise resolving to success status
 */
const updatePassword = async (data: PasswordUpdateRequest): Promise<{ success: boolean }> => {
  const response = await httpClient.post<{ success: boolean }>(
    API_PATHS.AUTH.PASSWORD_UPDATE, 
    data
  );
  return response.data;
};

/**
 * Verifies a multi-factor authentication challenge
 * @param response The MFA challenge response
 * @returns Promise resolving to user data and tokens
 */
const verifyMFA = async (response: MFAResponse): Promise<{ user: User; tokens: AuthTokens }> => {
  const apiResponse = await httpClient.post<{ user: User; tokens: AuthTokens }>(
    API_PATHS.AUTH.MFA, 
    response
  );
  return apiResponse.data;
};

/**
 * Creates a token manager implementation for the HTTP client
 * @returns Token manager implementation
 */
const getAuthTokenManager = () => {
  return {
    // Return null as tokens are managed by authService
    getStoredTokens: async () => null,
    
    // Use the refreshToken function to refresh tokens
    refreshTokens: async () => {
      // This will be implemented by the actual auth service that uses this API
      // The HTTP client will call this when a token needs to be refreshed
      return null;
    }
  };
};

/**
 * Initializes the auth API by setting up the token manager
 */
const initializeAuthApi = (): void => {
  const tokenManager = getAuthTokenManager();
  httpClient.setTokenManager(tokenManager);
};

// Export the auth API functions
export const authApi = {
  login,
  register,
  socialLogin,
  refreshToken,
  logout,
  verifyEmail,
  resetPassword,
  updatePassword,
  verifyMFA,
  initializeAuthApi
};