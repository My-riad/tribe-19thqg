import { Request, Response, NextFunction, Router } from 'express'; // ^4.18.2
import { AuthService } from '../services/auth.service';
import { 
  validateLogin, 
  validateRegistration, 
  validateRefreshToken, 
  validatePasswordReset, 
  validatePasswordResetConfirm, 
  validateEmailVerification,
  validateSocialLogin,
  validateLogout
} from '../validations/auth.validation';
import { 
  authMiddleware, 
  AuthenticatedRequest, 
  roleAuthMiddleware 
} from '../middleware/auth.middleware';
import { 
  IUserCreate, 
  IUserCredentials, 
  ISocialAuthCredentials, 
  IUserResponse, 
  IAuthResponse,
  UserRole
} from '../../../shared/src/types/user.types';
import { AuthError } from '../../../shared/src/errors/auth.error';
import { logger } from '../../../shared/src/utils/logger.util';
import config from '../config';

// Initialize router
const router = Router();

/**
 * Handles user registration requests
 * 
 * @param req - Express request object containing user registration data
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
async function registerUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body
    const validatedUserData = validateRegistration(req.body);
    
    // Register the user
    const result: IAuthResponse = await AuthService.register(validatedUserData);
    
    // Return success response with user data and tokens
    res.status(201).json(result);
    
    logger.info('User registered successfully', { userId: result.user.id });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles user login requests
 * 
 * @param req - Express request object containing login credentials
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
async function loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body
    const validatedCredentials = validateLogin(req.body);
    
    // Authenticate the user
    const result: IAuthResponse = await AuthService.login(validatedCredentials);
    
    // Return success response with user data and tokens
    res.status(200).json(result);
    
    logger.info('User logged in successfully', { userId: result.user.id });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles social authentication requests
 * 
 * @param req - Express request object containing social auth data
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
async function socialAuthUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body
    const validatedSocialData = validateSocialLogin(req.body);
    
    // Authenticate with social provider
    const result: IAuthResponse = await AuthService.socialAuth(validatedSocialData);
    
    // Return success response with user data and tokens
    res.status(200).json(result);
    
    logger.info('User authenticated via social provider', {
      userId: result.user.id,
      provider: validatedSocialData.provider
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles token refresh requests
 * 
 * @param req - Express request object containing refresh token
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
async function refreshUserToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body
    const { refreshToken } = validateRefreshToken(req.body);
    
    // Refresh the token
    const tokens = await AuthService.refreshToken(refreshToken);
    
    // Return success response with new tokens
    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
    
    logger.info('Token refreshed successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Handles user logout requests
 * 
 * @param req - Express request object containing refresh token
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
async function logoutUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body
    const { refreshToken } = validateLogout(req.body);
    
    // Extract access token from Authorization header if present
    let accessToken: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.split(' ')[1];
    }
    
    // Log out the user
    await AuthService.logout(refreshToken, accessToken);
    
    // Return success response
    res.status(200).json({ message: 'Logged out successfully' });
    
    logger.info('User logged out successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Handles logout from all devices requests
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
async function logoutAllSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Get authenticated user ID from the request
    const userId = (req as AuthenticatedRequest).user?.id;
    
    if (!userId) {
      throw AuthError.invalidToken('User not authenticated');
    }
    
    // Log out from all devices
    await AuthService.logoutAll(userId);
    
    // Return success response
    res.status(200).json({ message: 'Logged out from all devices successfully' });
    
    logger.info('User logged out from all devices', { userId });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles password reset request
 * 
 * @param req - Express request object containing email
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
async function requestPasswordResetEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body
    const validatedData = validatePasswordReset(req.body);
    
    // Request password reset
    const result = await AuthService.requestPasswordReset(validatedData.email);
    
    // Return success response
    res.status(200).json(result);
    
    logger.info('Password reset requested', { email: validatedData.email });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles password reset confirmation
 * 
 * @param req - Express request object containing token and new password
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body
    const validatedData = validatePasswordResetConfirm(req.body);
    
    // Reset password
    const user = await AuthService.resetPassword(validatedData.token, validatedData.newPassword);
    
    // Return success response
    res.status(200).json({ user, message: 'Password reset successfully' });
    
    logger.info('Password reset completed successfully', { userId: user.id });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles email verification requests
 * 
 * @param req - Express request object containing verification token
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
async function verifyUserEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body
    const validatedData = validateEmailVerification(req.body);
    
    // Verify email
    const user = await AuthService.verifyEmail(validatedData.token);
    
    // Return success response
    res.status(200).json({ user, message: 'Email verified successfully' });
    
    logger.info('Email verification completed successfully', { userId: user.id });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles requests to resend verification email
 * 
 * @param req - Express request object containing email
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
async function resendVerificationEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extract email from request body
    const { email } = req.body;
    
    if (!email) {
      throw AuthError.invalidToken('Email is required');
    }
    
    // Resend verification email
    const result = await AuthService.resendVerification(email);
    
    // Return success response
    res.status(200).json(result);
    
    logger.info('Verification email resent', { email });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles password change requests
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
async function changeUserPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Get authenticated user ID from the request
    const userId = (req as AuthenticatedRequest).user?.id;
    
    if (!userId) {
      throw AuthError.invalidToken('User not authenticated');
    }
    
    // Extract current password and new password from request body
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      throw AuthError.invalidToken('Current password and new password are required');
    }
    
    // Change password
    const user = await AuthService.changePassword(userId, currentPassword, newPassword);
    
    // Return success response
    res.status(200).json({ user, message: 'Password changed successfully' });
    
    logger.info('Password changed successfully', { userId });
  } catch (error) {
    next(error);
  }
}

/**
 * Validates a user's token and returns user data
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
async function validateUserToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AuthError.invalidToken('Invalid Authorization header');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Validate token
    const user = await AuthService.validateToken(token);
    
    // Return success response
    res.status(200).json({ user });
    
    logger.info('Token validated successfully', { userId: user.id });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns the current authenticated user's data
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Get authenticated user from the request
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      throw AuthError.invalidToken('User not authenticated');
    }
    
    // Return success response
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

// Define routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/social-auth', socialAuthUser);
router.post('/refresh-token', refreshUserToken);
router.post('/logout', logoutUser);
router.post('/logout-all', authMiddleware, logoutAllSessions);
router.post('/password-reset-request', requestPasswordResetEmail);
router.post('/password-reset', resetPassword);
router.post('/verify-email', verifyUserEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/change-password', authMiddleware, changeUserPassword);
router.get('/validate-token', validateUserToken);
router.get('/me', authMiddleware, getCurrentUser);

// Admin-specific routes could be added with roleAuthMiddleware
router.get('/admin/users', authMiddleware, roleAuthMiddleware([UserRole.ADMIN]), (req, res) => {
  res.status(200).json({ message: 'Admin access granted' });
});

export { router };