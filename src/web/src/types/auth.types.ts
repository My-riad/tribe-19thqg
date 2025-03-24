/**
 * TypeScript type definitions for authentication-related entities and operations
 * in the Tribe application. This file defines interfaces for user data, authentication tokens,
 * login credentials, registration data, social authentication, multi-factor authentication,
 * and authentication state management.
 */

/**
 * Interface representing a user account in the system
 */
export interface User {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  createdAt: string;
  lastLogin: string;
  profileCompleted: boolean;
  hasCompletedOnboarding: boolean;
  mfaEnabled: boolean;
  preferredMfaMethod: MFAMethod | null;
}

/**
 * Interface representing authentication tokens for user sessions
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Interface for user login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Interface for user registration data
 */
export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  acceptedTerms: boolean;
}

/**
 * Enum of supported social authentication providers
 */
export enum SocialAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple'
}

/**
 * Interface for social authentication data
 */
export interface SocialAuthData {
  provider: SocialAuthProvider;
  token: string;
  userData: Record<string, any>;
}

/**
 * Enum of supported multi-factor authentication methods
 */
export enum MFAMethod {
  SMS = 'sms',
  EMAIL = 'email',
  AUTHENTICATOR = 'authenticator'
}

/**
 * Interface for multi-factor authentication challenge
 */
export interface MFAChallenge {
  challengeId: string;
  method: MFAMethod;
  destination: string; // Masked phone number or email
  expiresAt: number; // Unix timestamp
}

/**
 * Interface for multi-factor authentication response
 */
export interface MFAResponse {
  challengeId: string;
  code: string;
}

/**
 * Interface for password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Interface for password update request
 */
export interface PasswordUpdateRequest {
  token: string;
  newPassword: string;
}

/**
 * Interface for authentication state in Redux store
 */
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  mfaRequired: boolean;
  mfaChallenge: MFAChallenge | null;
}

/**
 * Interface for authentication context provided by useAuth hook
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  mfaRequired: boolean;
  mfaChallenge: MFAChallenge | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  socialLogin: (data: SocialAuthData) => Promise<void>;
  logout: () => Promise<void>;
  verifyMFA: (response: MFAResponse) => Promise<void>;
  resetPassword: (data: PasswordResetRequest) => Promise<boolean>;
  updatePassword: (data: PasswordUpdateRequest) => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
}