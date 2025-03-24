import { EMAIL_REGEX, PASSWORD_REGEX } from '../constants/regex.constants';
import { TRIBE_LIMITS } from '../constants/app.constants';

/**
 * Defines possible user roles in the system for authorization purposes.
 * Used to control access to various parts of the application.
 */
export enum UserRole {
  USER = 'USER',       // Standard user with basic permissions
  ADMIN = 'ADMIN',     // Administrator with elevated privileges
  SYSTEM = 'SYSTEM'    // System-level accounts for automated processes
}

/**
 * Defines possible states for a user account.
 * Used to control account access and lifecycle management.
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',       // Account is active and can be used normally
  PENDING = 'PENDING',     // Account created but not yet verified
  SUSPENDED = 'SUSPENDED', // Account temporarily disabled by administrators
  LOCKED = 'LOCKED',       // Account locked due to security concerns (e.g., multiple failed login attempts)
  DELETED = 'DELETED'      // Account marked for deletion (soft delete)
}

/**
 * Defines supported authentication providers for the platform.
 * Supports both local authentication and social login options.
 */
export enum AuthProvider {
  LOCAL = 'LOCAL',       // Email/password authentication
  GOOGLE = 'GOOGLE',     // Google OAuth authentication
  APPLE = 'APPLE',       // Apple ID authentication
  FACEBOOK = 'FACEBOOK'  // Facebook OAuth authentication
}

/**
 * Complete user entity as stored in the database.
 * Contains all user account and authentication information.
 */
export interface IUser {
  id: string;                          // Unique identifier for the user
  email: string;                       // User's email address (unique)
  passwordHash: string | null;         // Hashed password (null for social auth)
  role: UserRole;                      // User's role in the system
  status: UserStatus;                  // Current account status
  isVerified: boolean;                 // Whether email has been verified
  verificationToken: string | null;    // Token for email verification
  resetPasswordToken: string | null;   // Token for password reset
  resetPasswordExpires: Date | null;   // Expiration for password reset token
  provider: AuthProvider;              // Authentication provider
  providerId: string | null;           // External provider's user ID
  lastLogin: Date | null;              // Timestamp of last successful login
  failedLoginAttempts: number;         // Count of consecutive failed login attempts
  lockUntil: Date | null;              // Timestamp until account remains locked
  createdAt: Date;                     // Account creation timestamp
  updatedAt: Date;                     // Last update timestamp
}

/**
 * Data structure for creating a new user account.
 * Includes only the fields necessary for account creation.
 */
export interface IUserCreate {
  email: string;                 // Required email address
  password?: string;             // Optional for social login
  role?: UserRole;               // Defaults to USER if not specified
  status?: UserStatus;           // Defaults to PENDING if not specified
  isVerified?: boolean;          // Defaults to false if not specified
  provider?: AuthProvider;       // Authentication provider
  providerId?: string;           // External provider's user ID
}

/**
 * Data structure for updating an existing user.
 * All fields are optional since updates may be partial.
 */
export interface IUserUpdate {
  email?: string;                // Updated email address
  password?: string;             // New password (will be hashed)
  role?: UserRole;               // Updated role
  status?: UserStatus;           // Updated status
  isVerified?: boolean;          // Updated verification status
  provider?: AuthProvider;       // Updated auth provider
  providerId?: string;           // Updated provider ID
}

/**
 * Credentials structure for local authentication.
 * Used for login with email and password.
 */
export interface IUserCredentials {
  email: string;     // User's email address
  password: string;  // User's password (plain text for validation)
}

/**
 * Credentials structure for social authentication.
 * Used for login with third-party providers.
 */
export interface ISocialAuthCredentials {
  provider: AuthProvider;  // Social auth provider (GOOGLE, APPLE, FACEBOOK)
  token: string;           // OAuth access token or ID token
  email?: string;          // Optional email from the provider
}

/**
 * Sanitized user data structure for API responses.
 * Excludes sensitive information like password hash and security tokens.
 */
export interface IUserResponse {
  id: string;               // User ID
  email: string;            // Email address
  role: UserRole;           // User role
  status: UserStatus;       // Account status
  isVerified: boolean;      // Verification status
  provider: AuthProvider;   // Authentication provider
  lastLogin: Date | null;   // Last login timestamp
  createdAt: Date;          // Account creation timestamp
}

/**
 * Authentication response structure with user data and tokens.
 * Returned after successful authentication.
 */
export interface IAuthResponse {
  user: IUserResponse;               // Sanitized user information
  tokens: {
    access: string;                  // JWT access token
    refresh: string;                 // JWT refresh token for obtaining new access tokens
  };
}