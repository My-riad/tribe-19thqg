import { jest } from '@jest/globals';
import axios from 'axios';
import { AuthService } from '../src/services/auth.service';
import { UserService } from '../src/services/user.service';
import { TokenService } from '../src/services/token.service';
import { UserModel } from '../src/models/user.model';
import { TokenModel, TokenType } from '../src/models/token.model';
import { comparePasswords } from '../src/utils/password.util';
import { 
  IUser, 
  IUserCreate, 
  IUserCredentials, 
  ISocialAuthCredentials,
  IUserResponse,
  IAuthResponse,
  UserRole, 
  UserStatus,
  AuthProvider
} from '../../../shared/src/types/user.types';
import { AuthError } from '../../../shared/src/errors/auth.error';
import config from '../src/config';

// Mock dependencies
jest.mock('../src/services/user.service');
jest.mock('../src/services/token.service');
jest.mock('../src/models/user.model');
jest.mock('../src/models/token.model');
jest.mock('../src/utils/password.util');
jest.mock('axios');
jest.mock('../src/config');

/**
 * Creates mock user data for testing
 * 
 * @param overrides - Optional properties to override default values
 * @returns Mock user creation data
 */
const mockUserData = (overrides: Partial<IUserCreate> = {}): IUserCreate => {
  return {
    email: 'test@example.com',
    password: 'Password123!',
    provider: AuthProvider.LOCAL,
    ...overrides
  };
};

/**
 * Creates a mock user object that simulates a database user
 * 
 * @param overrides - Optional properties to override default values
 * @returns Mock user object
 */
const mockUser = (overrides: Partial<IUser> = {}): IUser => {
  return {
    id: '123456',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    isVerified: true,
    verificationToken: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    provider: AuthProvider.LOCAL,
    providerId: null,
    lastLogin: new Date(),
    failedLoginAttempts: 0,
    lockUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

/**
 * Creates a mock social profile response for testing social authentication
 * 
 * @param provider - The authentication provider type
 * @param overrides - Optional properties to override default values
 * @returns Mock social profile object
 */
const mockSocialProfile = (provider: AuthProvider, overrides: any = {}) => {
  const defaults = {
    id: 'social123',
    email: 'social@example.com',
    name: 'Social User'
  };

  if (provider === AuthProvider.GOOGLE) {
    return {
      ...defaults,
      ...overrides
    };
  } else if (provider === AuthProvider.FACEBOOK) {
    return {
      ...defaults,
      ...overrides
    };
  } else if (provider === AuthProvider.APPLE) {
    return {
      sub: defaults.id,
      email: defaults.email,
      ...overrides
    };
  }

  return defaults;
};

/**
 * Sets up the test environment for authentication tests
 */
const setupAuthTests = async () => {
  // Mock config
  (config.getAuthConfig as jest.Mock).mockReturnValue({
    jwtSecret: 'test_jwt_secret',
    jwtExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d'
  });

  // Mock UserService
  (UserService.createUser as jest.Mock).mockImplementation(async (userData) => {
    return mockUser({ email: userData.email });
  });
  
  (UserService.getUserById as jest.Mock).mockImplementation(async (id) => {
    return mockUser({ id });
  });
  
  (UserService.getUserByEmail as jest.Mock).mockImplementation(async (email) => {
    return mockUser({ email });
  });
  
  (UserService.formatUserResponse as jest.Mock).mockImplementation((user) => {
    const { id, email, role, status, isVerified, provider, lastLogin, createdAt } = user;
    return { id, email, role, status, isVerified, provider, lastLogin, createdAt };
  });

  // Mock TokenService
  (TokenService.generateTokens as jest.Mock).mockImplementation(async () => {
    return {
      access: 'mock_access_token',
      refresh: 'mock_refresh_token'
    };
  });
  
  (TokenService.verifyAccessToken as jest.Mock).mockImplementation(async (token) => {
    if (token === 'invalid_token') {
      throw AuthError.invalidToken();
    }
    return { id: '123456', email: 'test@example.com', role: UserRole.USER };
  });
  
  (TokenService.generateVerificationToken as jest.Mock).mockResolvedValue('mock_verification_token');
  (TokenService.generatePasswordResetToken as jest.Mock).mockResolvedValue({
    token: 'mock_reset_token',
    expiresAt: new Date(Date.now() + 3600000)
  });
  
  (TokenService.verifySpecialToken as jest.Mock).mockImplementation(async (token, type) => {
    if (token === 'invalid_token') {
      throw AuthError.invalidToken();
    }
    return '123456';
  });

  // Mock UserModel
  (UserModel.findByEmail as jest.Mock).mockImplementation(async (email) => {
    if (email === 'existing@example.com') {
      return mockUser({ email });
    }
    return null;
  });
  
  (UserModel.findById as jest.Mock).mockImplementation(async (id) => {
    return mockUser({ id });
  });
  
  (UserModel.updateLastLogin as jest.Mock).mockImplementation(async (id) => {
    return mockUser({ id, lastLogin: new Date() });
  });
  
  (UserModel.incrementFailedLogin as jest.Mock).mockImplementation(async (id) => {
    return mockUser({ id, failedLoginAttempts: 1 });
  });

  // Mock TokenModel
  (TokenModel.blacklist as jest.Mock).mockResolvedValue(true);
  (TokenModel.findByToken as jest.Mock).mockImplementation(async (token, type) => {
    if (token === 'blacklisted_token') {
      return { blacklisted: true };
    }
    return { blacklisted: false };
  });

  // Mock password util
  (comparePasswords as jest.Mock).mockImplementation(async (plainText, hash) => {
    return plainText === 'correct_password';
  });

  // Mock axios for social auth
  (axios.get as jest.Mock).mockImplementation(async (url) => {
    if (url.includes('google')) {
      return { status: 200, data: mockSocialProfile(AuthProvider.GOOGLE) };
    } else if (url.includes('facebook')) {
      return { status: 200, data: mockSocialProfile(AuthProvider.FACEBOOK) };
    } else if (url.includes('apple')) {
      return { status: 200, data: mockSocialProfile(AuthProvider.APPLE) };
    }
    throw new Error('Invalid URL');
  });
};

/**
 * Cleans up the test environment after authentication tests
 */
const cleanupAuthTests = async () => {
  jest.clearAllMocks();
};

describe('AuthService', () => {
  beforeEach(setupAuthTests);
  afterEach(cleanupAuthTests);

  describe('register', () => {
    it('should register a new user with valid data', async () => {
      const userData = mockUserData();
      const result = await AuthService.register(userData);

      expect(UserModel.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(UserService.createUser).toHaveBeenCalledWith(userData);
      expect(TokenService.generateTokens).toHaveBeenCalled();
      expect(result).toEqual({
        user: expect.any(Object),
        tokens: {
          access: 'mock_access_token',
          refresh: 'mock_refresh_token'
        }
      });
    });

    it('should throw an error if email is invalid', async () => {
      const userData = mockUserData({ email: 'invalid-email' });
      
      await expect(AuthService.register(userData)).rejects.toThrow();
    });

    it('should throw an error if user already exists', async () => {
      const userData = mockUserData({ email: 'existing@example.com' });
      
      await expect(AuthService.register(userData)).rejects.toThrow();
    });

    it('should throw an error if password is missing for local auth', async () => {
      const userData = mockUserData({ password: undefined });
      
      await expect(AuthService.register(userData)).rejects.toThrow();
    });

    it('should send a verification email if account requires verification', async () => {
      // Mock user that needs verification
      (UserService.createUser as jest.Mock).mockResolvedValueOnce({
        ...mockUser(),
        status: UserStatus.PENDING,
        isVerified: false
      });

      const userData = mockUserData();
      await AuthService.register(userData);

      expect(TokenService.generateVerificationToken).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully authenticate a user with valid credentials', async () => {
      const credentials: IUserCredentials = {
        email: 'test@example.com',
        password: 'correct_password'
      };

      const result = await AuthService.login(credentials);

      expect(UserModel.findByEmail).toHaveBeenCalledWith(credentials.email);
      expect(comparePasswords).toHaveBeenCalled();
      expect(UserModel.updateLastLogin).toHaveBeenCalled();
      expect(TokenService.generateTokens).toHaveBeenCalled();
      expect(result).toEqual({
        user: expect.any(Object),
        tokens: {
          access: 'mock_access_token',
          refresh: 'mock_refresh_token'
        }
      });
    });

    it('should throw an error if user does not exist', async () => {
      const credentials: IUserCredentials = {
        email: 'nonexistent@example.com',
        password: 'password'
      };

      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(null);

      await expect(AuthService.login(credentials)).rejects.toThrow(AuthError);
    });

    it('should throw an error if password is incorrect', async () => {
      const credentials: IUserCredentials = {
        email: 'test@example.com',
        password: 'wrong_password'
      };

      await expect(AuthService.login(credentials)).rejects.toThrow(AuthError);
      expect(UserModel.incrementFailedLogin).toHaveBeenCalled();
    });

    it('should throw an error if account is locked', async () => {
      const credentials: IUserCredentials = {
        email: 'locked@example.com',
        password: 'password'
      };

      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce({
        ...mockUser({ email: 'locked@example.com' }),
        status: UserStatus.LOCKED,
        lockUntil: new Date(Date.now() + 3600000) // Locked for 1 hour
      });

      await expect(AuthService.login(credentials)).rejects.toThrow(AuthError);
    });

    it('should throw an error if account is not verified', async () => {
      const credentials: IUserCredentials = {
        email: 'unverified@example.com',
        password: 'correct_password'
      };

      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce({
        ...mockUser({ email: 'unverified@example.com' }),
        status: UserStatus.PENDING,
        isVerified: false
      });

      await expect(AuthService.login(credentials)).rejects.toThrow(AuthError);
    });
  });

  describe('socialAuth', () => {
    it('should authenticate a user with valid social credentials', async () => {
      const credentials: ISocialAuthCredentials = {
        provider: AuthProvider.GOOGLE,
        token: 'valid_google_token'
      };

      const result = await AuthService.socialAuth(credentials);

      expect(axios.get).toHaveBeenCalled();
      expect(UserModel.findByProviderId).toHaveBeenCalled();
      expect(UserModel.findByEmail).toHaveBeenCalled();
      expect(TokenService.generateTokens).toHaveBeenCalled();
      expect(result).toEqual({
        user: expect.any(Object),
        tokens: {
          access: 'mock_access_token',
          refresh: 'mock_refresh_token'
        }
      });
    });

    it('should create a new user if no existing user found', async () => {
      const credentials: ISocialAuthCredentials = {
        provider: AuthProvider.GOOGLE,
        token: 'valid_google_token'
      };

      // Mock user lookups to return null (user doesn't exist)
      (UserModel.findByProviderId as jest.Mock).mockResolvedValueOnce(null);
      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(null);

      await AuthService.socialAuth(credentials);

      expect(UserService.createUser).toHaveBeenCalledWith(expect.objectContaining({
        provider: AuthProvider.GOOGLE,
        isVerified: true, // Social logins are pre-verified
        status: UserStatus.ACTIVE
      }));
    });

    it('should throw an error if provider is not provided', async () => {
      const credentials: ISocialAuthCredentials = {
        provider: undefined as any,
        token: 'valid_token'
      };

      await expect(AuthService.socialAuth(credentials)).rejects.toThrow();
    });

    it('should throw an error if token is not provided', async () => {
      const credentials: ISocialAuthCredentials = {
        provider: AuthProvider.GOOGLE,
        token: undefined as any
      };

      await expect(AuthService.socialAuth(credentials)).rejects.toThrow();
    });

    it('should throw an error if token verification fails', async () => {
      const credentials: ISocialAuthCredentials = {
        provider: AuthProvider.GOOGLE,
        token: 'invalid_token'
      };

      (axios.get as jest.Mock).mockRejectedValueOnce(new Error('Token verification failed'));

      await expect(AuthService.socialAuth(credentials)).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens with a valid refresh token', async () => {
      (TokenService.refreshAccessToken as jest.Mock).mockResolvedValueOnce({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token'
      });

      const result = await AuthService.refreshToken('valid_refresh_token');

      expect(TokenService.refreshAccessToken).toHaveBeenCalledWith('valid_refresh_token');
      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token'
      });
    });

    it('should throw an error if refresh token is not provided', async () => {
      await expect(AuthService.refreshToken('')).rejects.toThrow();
    });

    it('should throw an error if refresh token is invalid', async () => {
      (TokenService.refreshAccessToken as jest.Mock).mockRejectedValueOnce(AuthError.invalidToken());

      await expect(AuthService.refreshToken('invalid_refresh_token')).rejects.toThrow(AuthError);
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', async () => {
      await AuthService.logout('valid_refresh_token', 'valid_access_token');

      expect(TokenService.invalidateToken).toHaveBeenCalledWith('valid_refresh_token');
      expect(TokenService.invalidateToken).toHaveBeenCalledWith('valid_access_token');
    });

    it('should throw an error if refresh token is not provided', async () => {
      await expect(AuthService.logout('')).rejects.toThrow();
    });

    it('should still succeed if access token is not provided', async () => {
      await expect(AuthService.logout('valid_refresh_token')).resolves.not.toThrow();
      expect(TokenService.invalidateToken).toHaveBeenCalledWith('valid_refresh_token');
      expect(TokenService.invalidateToken).not.toHaveBeenCalledWith(undefined);
    });
  });

  describe('logoutAll', () => {
    it('should logout a user from all devices', async () => {
      await AuthService.logoutAll('123456');

      expect(TokenService.invalidateAllUserTokens).toHaveBeenCalledWith('123456');
    });

    it('should throw an error if user ID is not provided', async () => {
      await expect(AuthService.logoutAll('')).rejects.toThrow();
    });

    it('should propagate any errors from token service', async () => {
      (TokenService.invalidateAllUserTokens as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      await expect(AuthService.logoutAll('123456')).rejects.toThrow();
    });
  });

  describe('requestPasswordReset', () => {
    it('should generate a reset token for an existing user', async () => {
      const email = 'test@example.com';
      
      const result = await AuthService.requestPasswordReset(email);

      expect(UserService.getUserByEmail).toHaveBeenCalledWith(email);
      expect(TokenService.generatePasswordResetToken).toHaveBeenCalled();
      expect(result).toEqual({
        message: expect.stringContaining('sent a password reset link')
      });
    });

    it('should not reveal if an email does not exist', async () => {
      const email = 'nonexistent@example.com';
      (UserService.getUserByEmail as jest.Mock).mockResolvedValueOnce(null);
      
      const result = await AuthService.requestPasswordReset(email);

      expect(TokenService.generatePasswordResetToken).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: expect.stringContaining('sent a password reset link')
      });
    });

    it('should throw an error if email is not provided', async () => {
      await expect(AuthService.requestPasswordReset('')).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with a valid token', async () => {
      const token = 'valid_reset_token';
      const newPassword = 'NewPassword123!';
      
      const result = await AuthService.resetPassword(token, newPassword);

      expect(TokenService.verifySpecialToken).toHaveBeenCalledWith(token, 'PASSWORD_RESET');
      expect(UserService.getUserById).toHaveBeenCalledWith('123456');
      expect(UserService.changePassword).toHaveBeenCalledWith('123456', newPassword);
      expect(TokenService.invalidateAllUserTokens).toHaveBeenCalled();
      expect(result).toEqual(expect.any(Object));
    });

    it('should throw an error if token is not provided', async () => {
      await expect(AuthService.resetPassword('', 'NewPassword123!')).rejects.toThrow();
    });

    it('should throw an error if new password is not provided', async () => {
      await expect(AuthService.resetPassword('valid_token', '')).rejects.toThrow();
    });

    it('should throw an error if token is invalid', async () => {
      (TokenService.verifySpecialToken as jest.Mock).mockRejectedValueOnce(AuthError.invalidToken());

      await expect(AuthService.resetPassword('invalid_token', 'NewPassword123!')).rejects.toThrow(AuthError);
    });

    it('should throw an error if password does not meet requirements', async () => {
      await expect(AuthService.resetPassword('valid_token', 'weak')).rejects.toThrow();
    });
  });

  describe('verifyEmail', () => {
    it('should verify a user email with a valid token', async () => {
      const token = 'valid_verification_token';
      
      const result = await AuthService.verifyEmail(token);

      expect(TokenService.verifySpecialToken).toHaveBeenCalledWith(token, 'VERIFICATION');
      expect(UserService.verifyUser).toHaveBeenCalledWith('123456');
      expect(result).toEqual(expect.any(Object));
    });

    it('should throw an error if token is not provided', async () => {
      await expect(AuthService.verifyEmail('')).rejects.toThrow();
    });

    it('should throw an error if token is invalid', async () => {
      (TokenService.verifySpecialToken as jest.Mock).mockRejectedValueOnce(AuthError.invalidToken());

      await expect(AuthService.verifyEmail('invalid_token')).rejects.toThrow(AuthError);
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email to an unverified user', async () => {
      const email = 'unverified@example.com';
      
      (UserService.getUserByEmail as jest.Mock).mockResolvedValueOnce({
        ...mockUser({ email }),
        isVerified: false
      });
      
      const result = await AuthService.resendVerification(email);

      expect(UserService.getUserByEmail).toHaveBeenCalledWith(email);
      expect(TokenService.generateVerificationToken).toHaveBeenCalled();
      expect(result).toEqual({
        message: expect.stringContaining('verification')
      });
    });

    it('should not send verification email to an already verified user', async () => {
      const email = 'verified@example.com';
      
      (UserService.getUserByEmail as jest.Mock).mockResolvedValueOnce({
        ...mockUser({ email }),
        isVerified: true
      });
      
      const result = await AuthService.resendVerification(email);

      expect(TokenService.generateVerificationToken).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: expect.stringContaining('verification')
      });
    });

    it('should not reveal if an email does not exist', async () => {
      const email = 'nonexistent@example.com';
      (UserService.getUserByEmail as jest.Mock).mockResolvedValueOnce(null);
      
      const result = await AuthService.resendVerification(email);

      expect(TokenService.generateVerificationToken).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: expect.stringContaining('verification')
      });
    });

    it('should throw an error if email is not provided', async () => {
      await expect(AuthService.resendVerification('')).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password with valid current password', async () => {
      const userId = '123456';
      const currentPassword = 'correct_password';
      const newPassword = 'NewPassword123!';
      
      const result = await AuthService.changePassword(userId, currentPassword, newPassword);

      expect(UserService.getUserById).toHaveBeenCalledWith(userId);
      expect(comparePasswords).toHaveBeenCalled();
      expect(UserService.changePassword).toHaveBeenCalledWith(userId, newPassword);
      expect(result).toEqual(expect.any(Object));
    });

    it('should throw an error if user ID is not provided', async () => {
      await expect(AuthService.changePassword('', 'current', 'new')).rejects.toThrow();
    });

    it('should throw an error if current password is not provided', async () => {
      await expect(AuthService.changePassword('123456', '', 'new')).rejects.toThrow();
    });

    it('should throw an error if new password is not provided', async () => {
      await expect(AuthService.changePassword('123456', 'current', '')).rejects.toThrow();
    });

    it('should throw an error if current password is incorrect', async () => {
      await expect(AuthService.changePassword('123456', 'wrong_password', 'NewPassword123!')).rejects.toThrow(AuthError);
    });

    it('should throw an error if new password does not meet requirements', async () => {
      await expect(AuthService.changePassword('123456', 'correct_password', 'weak')).rejects.toThrow();
    });
  });

  describe('validateToken', () => {
    it('should validate a valid access token', async () => {
      const token = 'valid_access_token';
      
      const result = await AuthService.validateToken(token);

      expect(TokenService.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(UserService.getUserById).toHaveBeenCalledWith('123456');
      expect(result).toEqual(expect.any(Object));
    });

    it('should throw an error if token is not provided', async () => {
      await expect(AuthService.validateToken('')).rejects.toThrow();
    });

    it('should throw an error if token is invalid', async () => {
      await expect(AuthService.validateToken('invalid_token')).rejects.toThrow(AuthError);
    });

    it('should throw an error if user does not exist', async () => {
      (UserService.getUserById as jest.Mock).mockResolvedValueOnce(null);

      await expect(AuthService.validateToken('valid_access_token')).rejects.toThrow(AuthError);
    });
  });
});