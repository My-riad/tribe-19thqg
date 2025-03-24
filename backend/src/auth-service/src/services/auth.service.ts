import axios from 'axios'; // ^1.4.0
import { UserModel } from '../models/user.model';
import { TokenService } from './token.service';
import { UserService } from './user.service';
import { comparePasswords, validatePasswordStrength } from '../utils/password.util';
import { 
  IUser, 
  IUserCreate, 
  IUserCredentials, 
  IUserResponse, 
  IAuthResponse,
  ISocialAuthCredentials,
  UserStatus,
  AuthProvider
} from '../../../shared/src/types/user.types';
import { AuthError } from '../../../shared/src/errors/auth.error';
import { ValidationError } from '../../../shared/src/errors/validation.error';
import { logger } from '../../../shared/src/utils/logger.util';
import config from '../config';

/**
 * Core authentication service that implements the business logic for user 
 * authentication, registration, and session management in the Tribe platform.
 */
const AuthService = {
  /**
   * Registers a new user in the system
   * 
   * @param userData - User creation data
   * @returns Authentication response with user data and tokens
   * @throws ValidationError if registration data is invalid
   */
  async register(userData: IUserCreate): Promise<IAuthResponse> {
    logger.info('Processing user registration', { email: userData.email });
    
    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!userData.email || !emailRegex.test(userData.email)) {
      throw ValidationError.invalidFormat('email', 'valid email address');
    }
    
    // Validate password strength for local authentication
    if (userData.provider !== AuthProvider.GOOGLE && 
        userData.provider !== AuthProvider.APPLE && 
        userData.provider !== AuthProvider.FACEBOOK) {
      
      if (!userData.password) {
        throw ValidationError.requiredField('password');
      }
      
      if (!validatePasswordStrength(userData.password)) {
        throw ValidationError.invalidInput(
          'Password must be at least 10 characters long and include uppercase letters, lowercase letters, numbers, and special characters.'
        );
      }
    }

    try {
      // Check if user with same email already exists
      const existingUser = await UserModel.findByEmail(userData.email);
      if (existingUser) {
        logger.info('Registration failed: Email already in use', { email: userData.email });
        throw ValidationError.invalidInput('A user with this email already exists');
      }

      // Create new user
      const user = await UserService.createUser(userData);
      
      // Send verification email if account needs verification
      if (user.status === UserStatus.PENDING && !user.isVerified) {
        const verificationToken = await TokenService.generateVerificationToken(user.id);
        await this.sendVerificationEmail(user.id, user.email, verificationToken);
        logger.info('Verification email sent', { userId: user.id });
      }

      // Generate tokens
      const tokens = await TokenService.generateTokens(user);
      
      // Format response
      const userResponse = UserService.formatUserResponse(user);
      
      logger.info('User registered successfully', { userId: user.id });
      
      return {
        user: userResponse,
        tokens: {
          access: tokens.access,
          refresh: tokens.refresh
        }
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthError) {
        throw error;
      }
      
      logger.error('User registration failed', error as Error);
      throw ValidationError.invalidInput('Registration failed. Please try again later.');
    }
  },

  /**
   * Authenticates a user with email and password
   * 
   * @param credentials - User login credentials
   * @returns Authentication response with user data and tokens
   * @throws AuthError if authentication fails
   */
  async login(credentials: IUserCredentials): Promise<IAuthResponse> {
    logger.info('Processing login request', { email: credentials.email });
    
    try {
      // Find user by email
      const user = await UserModel.findByEmail(credentials.email);
      
      // If user not found, throw error
      if (!user) {
        logger.info('Login failed: User not found', { email: credentials.email });
        throw AuthError.invalidCredentials();
      }
      
      // Check if account is locked
      if (user.status === UserStatus.LOCKED) {
        const now = new Date();
        if (user.lockUntil && user.lockUntil > now) {
          logger.info('Login failed: Account locked', { userId: user.id });
          throw AuthError.accountLocked();
        }
      }
      
      // Verify password
      const isPasswordValid = await comparePasswords(credentials.password, user.passwordHash || '');
      
      // If password invalid, increment failed attempts and throw error
      if (!isPasswordValid) {
        await UserModel.incrementFailedLogin(user.id);
        logger.info('Login failed: Invalid password', { userId: user.id });
        throw AuthError.invalidCredentials();
      }
      
      // If account requires verification and is not verified, throw error
      if (user.status === UserStatus.PENDING && !user.isVerified) {
        logger.info('Login failed: Account not verified', { userId: user.id });
        throw AuthError.accountNotVerified();
      }
      
      // Update last login timestamp
      await UserModel.updateLastLogin(user.id);
      
      // Generate tokens
      const tokens = await TokenService.generateTokens(user);
      
      // Format response
      const userResponse = UserService.formatUserResponse(user);
      
      logger.info('User logged in successfully', { userId: user.id });
      
      return {
        user: userResponse,
        tokens: {
          access: tokens.access,
          refresh: tokens.refresh
        }
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      logger.error('Login failed', error as Error);
      throw AuthError.invalidCredentials();
    }
  },

  /**
   * Authenticates or registers a user via social authentication
   * 
   * @param credentials - Social authentication credentials
   * @returns Authentication response with user data and tokens
   * @throws AuthError if social authentication fails
   */
  async socialAuth(credentials: ISocialAuthCredentials): Promise<IAuthResponse> {
    logger.info('Processing social authentication', { provider: credentials.provider });
    
    try {
      // Validate provider and token
      if (!credentials.provider) {
        throw ValidationError.requiredField('provider');
      }
      
      if (!credentials.token) {
        throw ValidationError.requiredField('token');
      }
      
      // Verify token with social provider
      const profile = await this.verifySocialToken(credentials.token, credentials.provider);
      
      if (!profile) {
        logger.error('Social auth failed: Unable to verify token', { provider: credentials.provider });
        throw AuthError.socialAuthError('Failed to authenticate with social provider');
      }
      
      // Extract email and provider ID from profile
      const email = profile.email || credentials.email;
      const providerId = profile.id || profile.sub;
      
      if (!email) {
        logger.error('Social auth failed: No email provided', { provider: credentials.provider });
        throw AuthError.socialAuthError('Email is required for social authentication');
      }
      
      // Find existing user by provider ID or email
      let user = await UserModel.findByProviderId(providerId, credentials.provider);
      
      if (!user) {
        user = await UserModel.findByEmail(email);
      }
      
      // If user exists, update social credentials if needed
      if (user) {
        // If user exists but with different auth method, link accounts
        if (user.provider !== credentials.provider) {
          // TODO: Update user with new provider info
          logger.info('Linking social account to existing user', { userId: user.id, provider: credentials.provider });
        }
      } else {
        // Create new user with social credentials
        user = await UserService.createUser({
          email,
          provider: credentials.provider,
          providerId,
          isVerified: true, // Social logins are pre-verified
          status: UserStatus.ACTIVE
        });
        
        logger.info('New user created from social login', { userId: user.id, provider: credentials.provider });
      }
      
      // Update last login timestamp
      await UserModel.updateLastLogin(user.id);
      
      // Generate tokens
      const tokens = await TokenService.generateTokens(user);
      
      // Format response
      const userResponse = UserService.formatUserResponse(user);
      
      logger.info('Social authentication successful', { userId: user.id, provider: credentials.provider });
      
      return {
        user: userResponse,
        tokens: {
          access: tokens.access,
          refresh: tokens.refresh
        }
      };
    } catch (error) {
      if (error instanceof AuthError || error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Social authentication failed', error as Error);
      throw AuthError.socialAuthError('Authentication with social provider failed');
    }
  },

  /**
   * Refreshes authentication tokens using a valid refresh token
   * 
   * @param refreshToken - Refresh token
   * @returns New access and refresh tokens
   * @throws AuthError if refresh token is invalid
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> {
    logger.debug('Processing token refresh request');
    
    if (!refreshToken) {
      throw ValidationError.requiredField('refreshToken');
    }
    
    try {
      // Use token service to refresh tokens
      const tokens = await TokenService.refreshAccessToken(refreshToken);
      
      logger.debug('Token refresh successful');
      
      return tokens;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      logger.error('Token refresh failed', error as Error);
      throw AuthError.invalidToken();
    }
  },

  /**
   * Logs out a user by invalidating their tokens
   * 
   * @param refreshToken - Refresh token to invalidate
   * @param accessToken - Optional access token to invalidate
   * @returns Promise that resolves when logout is complete
   */
  async logout(refreshToken: string, accessToken?: string): Promise<void> {
    logger.debug('Processing logout request');
    
    if (!refreshToken) {
      throw ValidationError.requiredField('refreshToken');
    }
    
    try {
      // Invalidate refresh token
      await TokenService.invalidateToken(refreshToken);
      
      // If access token provided, invalidate it as well
      if (accessToken) {
        await TokenService.invalidateToken(accessToken);
      }
      
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed', error as Error);
      // Don't throw error for logout failures, just log them
    }
  },

  /**
   * Logs out a user from all devices by invalidating all their tokens
   * 
   * @param userId - User ID
   * @returns Promise that resolves when all sessions are logged out
   */
  async logoutAll(userId: string): Promise<void> {
    logger.info('Processing logout from all devices', { userId });
    
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }
    
    try {
      // Invalidate all user tokens
      await TokenService.invalidateAllUserTokens(userId);
      
      logger.info('User logged out from all devices', { userId });
    } catch (error) {
      logger.error('Logout from all devices failed', error as Error);
      throw error;
    }
  },

  /**
   * Initiates the password reset process for a user
   * 
   * @param email - User email address
   * @returns Success message
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    logger.info('Processing password reset request', { email });
    
    if (!email) {
      throw ValidationError.requiredField('email');
    }
    
    try {
      // Find user by email
      const user = await UserService.getUserByEmail(email);
      
      // If user found, generate reset token and send email
      if (user) {
        // Generate password reset token
        const { token, expiresAt } = await TokenService.generatePasswordResetToken(user.id);
        
        // Send password reset email
        await this.sendPasswordResetEmail(user.id, user.email, token, expiresAt);
        
        logger.info('Password reset email sent', { userId: user.id });
      } else {
        logger.info('Password reset requested for non-existent email', { email });
      }
      
      // Always return success to prevent email enumeration
      return { message: 'If an account with that email exists, we have sent a password reset link.' };
    } catch (error) {
      logger.error('Password reset request failed', error as Error);
      
      // Still return success to prevent email enumeration
      return { message: 'If an account with that email exists, we have sent a password reset link.' };
    }
  },

  /**
   * Resets a user's password using a valid reset token
   * 
   * @param token - Password reset token
   * @param newPassword - New password
   * @returns Updated user data
   * @throws AuthError if token is invalid or expired
   * @throws ValidationError if password doesn't meet requirements
   */
  async resetPassword(token: string, newPassword: string): Promise<IUserResponse> {
    logger.info('Processing password reset');
    
    if (!token) {
      throw ValidationError.requiredField('token');
    }
    
    if (!newPassword) {
      throw ValidationError.requiredField('newPassword');
    }
    
    // Validate password strength
    if (!validatePasswordStrength(newPassword)) {
      throw ValidationError.invalidInput(
        'Password must be at least 10 characters long and include uppercase letters, lowercase letters, numbers, and special characters.'
      );
    }
    
    try {
      // Verify the reset token
      const userId = await TokenService.verifySpecialToken(token, 'PASSWORD_RESET');
      
      // Get user
      const user = await UserService.getUserById(userId);
      if (!user) {
        throw AuthError.passwordResetError('Invalid reset token');
      }
      
      // Update password
      await UserService.changePassword(userId, newPassword);
      
      // Invalidate all user tokens for security
      await TokenService.invalidateAllUserTokens(userId);
      
      logger.info('Password reset successful', { userId });
      
      // Return updated user data
      return UserService.formatUserResponse(user);
    } catch (error) {
      if (error instanceof AuthError || error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Password reset failed', error as Error);
      throw AuthError.passwordResetError('Failed to reset password');
    }
  },

  /**
   * Verifies a user's email address using a verification token
   * 
   * @param token - Verification token
   * @returns Updated user data
   * @throws AuthError if token is invalid
   */
  async verifyEmail(token: string): Promise<IUserResponse> {
    logger.info('Processing email verification');
    
    if (!token) {
      throw ValidationError.requiredField('token');
    }
    
    try {
      // Verify the token
      const userId = await TokenService.verifySpecialToken(token, 'VERIFICATION');
      
      // Update user verification status
      const user = await UserService.verifyUser(userId);
      
      logger.info('Email verification successful', { userId });
      
      // Return updated user data
      return UserService.formatUserResponse(user);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      logger.error('Email verification failed', error as Error);
      throw AuthError.invalidToken();
    }
  },

  /**
   * Resends the email verification token to a user
   * 
   * @param email - User email address
   * @returns Success message
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    logger.info('Processing verification email resend request', { email });
    
    if (!email) {
      throw ValidationError.requiredField('email');
    }
    
    try {
      // Find user by email
      const user = await UserService.getUserByEmail(email);
      
      // If user found and not already verified, send verification email
      if (user && !user.isVerified) {
        // Generate verification token
        const token = await TokenService.generateVerificationToken(user.id);
        
        // Send verification email
        await this.sendVerificationEmail(user.id, user.email, token);
        
        logger.info('Verification email resent', { userId: user.id });
      } else {
        logger.info('Verification email requested for verified or non-existent user', { email });
      }
      
      // Always return success to prevent email enumeration
      return { message: 'If an account with that email exists and requires verification, we have sent a verification link.' };
    } catch (error) {
      logger.error('Resend verification failed', error as Error);
      
      // Still return success to prevent email enumeration
      return { message: 'If an account with that email exists and requires verification, we have sent a verification link.' };
    }
  },

  /**
   * Changes a user's password after verifying their current password
   * 
   * @param userId - User ID
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Updated user data
   * @throws AuthError if current password is incorrect
   * @throws ValidationError if new password doesn't meet requirements
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<IUserResponse> {
    logger.info('Processing password change request', { userId });
    
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }
    
    if (!currentPassword) {
      throw ValidationError.requiredField('currentPassword');
    }
    
    if (!newPassword) {
      throw ValidationError.requiredField('newPassword');
    }
    
    try {
      // Get user
      const user = await UserService.getUserById(userId);
      if (!user) {
        throw ValidationError.invalidInput('User not found');
      }
      
      // Verify current password
      const isPasswordValid = await comparePasswords(currentPassword, user.passwordHash || '');
      if (!isPasswordValid) {
        logger.info('Password change failed: Current password incorrect', { userId });
        throw AuthError.invalidCredentials();
      }
      
      // Validate new password strength
      if (!validatePasswordStrength(newPassword)) {
        throw ValidationError.invalidInput(
          'New password must be at least 10 characters long and include uppercase letters, lowercase letters, numbers, and special characters.'
        );
      }
      
      // Update password
      await UserService.changePassword(userId, newPassword);
      
      logger.info('Password changed successfully', { userId });
      
      // Return updated user data
      return UserService.formatUserResponse(user);
    } catch (error) {
      if (error instanceof AuthError || error instanceof ValidationError) {
        throw error;
      }
      
      logger.error('Password change failed', error as Error);
      throw ValidationError.invalidInput('Failed to change password');
    }
  },

  /**
   * Validates an access token and returns the associated user data
   * 
   * @param token - Access token to validate
   * @returns User data associated with the token
   * @throws AuthError if token is invalid
   */
  async validateToken(token: string): Promise<IUserResponse> {
    logger.debug('Validating access token');
    
    if (!token) {
      throw ValidationError.requiredField('token');
    }
    
    try {
      // Verify access token
      const payload = await TokenService.verifyAccessToken(token);
      
      // Get user ID from token payload
      const userId = payload.id;
      
      // Get user
      const user = await UserService.getUserById(userId);
      if (!user) {
        throw AuthError.invalidToken();
      }
      
      // Return user data
      return UserService.formatUserResponse(user);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      logger.error('Token validation failed', error as Error);
      throw AuthError.invalidToken();
    }
  },

  /**
   * Sends an email verification message to a user
   * 
   * @param userId - User ID
   * @param email - User email address
   * @param token - Verification token
   * @returns Promise that resolves when email is sent
   */
  async sendVerificationEmail(userId: string, email: string, token: string): Promise<void> {
    logger.info('Sending verification email', { userId });
    
    // Generate verification URL
    const authConfig = config.getAuthConfig();
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    // TODO: In a production environment, this would use a proper email service
    // such as SendGrid, AWS SES, or another email provider
    
    // Log the verification URL in development mode
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Verification URL: ${verificationUrl}`, { userId });
    }
    
    // Simulate email sending in development
    logger.info(`Verification email would be sent to ${email}`, { userId });
    
    // In production, this would send an actual email using a service
    // await emailService.sendEmail({
    //   to: email,
    //   subject: 'Verify your Tribe account',
    //   text: `Please verify your email by clicking on this link: ${verificationUrl}`,
    //   html: `<p>Please verify your email by clicking on this link: <a href="${verificationUrl}">${verificationUrl}</a></p>`
    // });
  },

  /**
   * Sends a password reset email to a user
   * 
   * @param userId - User ID
   * @param email - User email address
   * @param token - Password reset token
   * @param expiresAt - Token expiration date
   * @returns Promise that resolves when email is sent
   */
  async sendPasswordResetEmail(userId: string, email: string, token: string, expiresAt: Date): Promise<void> {
    logger.info('Sending password reset email', { userId });
    
    // Generate reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    // Format expiration time
    const expirationTime = expiresAt.toLocaleTimeString();
    
    // TODO: In a production environment, this would use a proper email service
    // such as SendGrid, AWS SES, or another email provider
    
    // Log the reset URL in development mode
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Password reset URL: ${resetUrl}`, { userId });
    }
    
    // Simulate email sending in development
    logger.info(`Password reset email would be sent to ${email}`, { userId });
    
    // In production, this would send an actual email using a service
    // await emailService.sendEmail({
    //   to: email,
    //   subject: 'Reset your Tribe password',
    //   text: `Please reset your password by clicking on this link: ${resetUrl}\nThis link will expire at ${expirationTime}.`,
    //   html: `<p>Please reset your password by clicking on this link: <a href="${resetUrl}">${resetUrl}</a></p><p>This link will expire at ${expirationTime}.</p>`
    // });
  },

  /**
   * Verifies a social authentication token with the provider's API
   * 
   * @param token - Social auth token
   * @param provider - Authentication provider
   * @returns Social profile data if token is valid
   * @throws AuthError if token verification fails
   */
  async verifySocialToken(token: string, provider: AuthProvider): Promise<any> {
    logger.debug('Verifying social token', { provider });
    
    let apiUrl: string;
    let headers: any = {};
    
    try {
      // Configure request based on provider
      switch (provider) {
        case AuthProvider.GOOGLE:
          apiUrl = `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`;
          break;
          
        case AuthProvider.APPLE:
          // Apple requires additional verification steps
          apiUrl = 'https://appleid.apple.com/auth/token';
          headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };
          // Note: Apple token verification is more complex and would need additional logic
          break;
          
        case AuthProvider.FACEBOOK:
          apiUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`;
          break;
          
        default:
          throw AuthError.socialAuthError(`Unsupported authentication provider: ${provider}`);
      }
      
      // Make API request to verify token
      const response = await axios.get(apiUrl, { headers });
      
      // Handle provider-specific response format
      if (response.status === 200) {
        if (provider === AuthProvider.GOOGLE) {
          // Verify token isn't expired
          const expiresAt = response.data.exp * 1000; // Convert to milliseconds
          if (Date.now() > expiresAt) {
            throw AuthError.socialAuthError('Token expired');
          }
        }
        
        return response.data;
      } else {
        throw AuthError.socialAuthError('Token verification failed');
      }
    } catch (error) {
      logger.error('Social token verification failed', error as Error);
      throw AuthError.socialAuthError('Failed to verify social authentication token');
    }
  }
};

export { AuthService };