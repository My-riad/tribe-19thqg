import { TokenService } from '../src/services/token.service';
import { TokenModel, TokenType, IToken } from '../src/models/token.model';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken, 
  blacklistToken, 
  generateRandomToken,
  calculateExpirationDate
} from '../src/utils/token.util';
import { IUser, UserRole } from '../../../shared/src/types/user.types';
import { AuthError } from '../../../shared/src/errors/auth.error';
import config from '../src/config';
import * as jwt from 'jsonwebtoken'; // v9.0.0

// Mock dependencies
jest.mock('../src/models/token.model');
jest.mock('../src/utils/token.util');
jest.mock('../../../shared/src/errors/auth.error');
jest.mock('../src/config');

/**
 * Creates a mock token object for testing
 */
const mockToken = (overrides: Partial<IToken> = {}): IToken => {
  return {
    id: 'mock-token-id',
    userId: 'mock-user-id',
    token: 'mock-token-string',
    type: TokenType.ACCESS,
    expiresAt: new Date(Date.now() + 900000), // 15 minutes in future
    blacklisted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

/**
 * Creates a mock user object for testing
 */
const mockUser = (overrides: Partial<IUser> = {}): IUser => {
  return {
    id: 'mock-user-id',
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.USER,
    status: 'ACTIVE' as any,
    isVerified: true,
    verificationToken: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    provider: 'LOCAL' as any,
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
 * Sets up the test environment for token tests
 */
const setupTokenTests = () => {
  // Mock TokenModel methods
  (TokenModel.create as jest.Mock).mockImplementation(
    (data) => Promise.resolve({ ...mockToken(), ...data })
  );
  (TokenModel.findById as jest.Mock).mockImplementation(
    (id) => Promise.resolve(id === 'valid-id' ? mockToken({ id }) : null)
  );
  (TokenModel.findByToken as jest.Mock).mockImplementation(
    (token, type) => Promise.resolve(token === 'invalid-token' ? null : mockToken({ token, type }))
  );
  (TokenModel.findByUserAndType as jest.Mock).mockImplementation(
    (userId, type) => Promise.resolve([mockToken({ userId, type })])
  );
  (TokenModel.blacklist as jest.Mock).mockImplementation(
    (token) => Promise.resolve(token === 'invalid-token' ? null : { ...mockToken({ token }), blacklisted: true })
  );
  (TokenModel.deleteByUserAndType as jest.Mock).mockImplementation(
    (userId, type) => {
      if (type === TokenType.ACCESS) return Promise.resolve(2);
      if (type === TokenType.REFRESH) return Promise.resolve(1);
      return Promise.resolve(0);
    }
  );
  (TokenModel.deleteExpired as jest.Mock).mockImplementation(
    () => Promise.resolve(5)
  );
  (TokenModel.isBlacklisted as jest.Mock).mockImplementation(
    (token) => Promise.resolve(token === 'blacklisted-token')
  );
  
  // Mock token utility functions
  (generateAccessToken as jest.Mock).mockImplementation(
    (user) => `access-token-for-${user.id}`
  );
  (generateRefreshToken as jest.Mock).mockImplementation(
    (user) => `refresh-token-for-${user.id}`
  );
  (verifyToken as jest.Mock).mockImplementation(
    (token) => {
      if (token === 'invalid-token') {
        throw new Error('Invalid token');
      }
      if (token === 'expired-token') {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      }
      return {
        id: 'user-id',
        email: 'user@example.com',
        role: UserRole.USER,
        type: token.includes('access') ? TokenType.ACCESS : TokenType.REFRESH
      };
    }
  );
  (blacklistToken as jest.Mock).mockImplementation(
    (token) => Promise.resolve(token !== 'non-blacklistable-token')
  );
  (generateRandomToken as jest.Mock).mockImplementation(
    () => 'random-token-string'
  );
  (calculateExpirationDate as jest.Mock).mockImplementation(
    (expiresIn) => {
      if (expiresIn === '15m') return new Date(Date.now() + 900000); // 15 minutes
      if (expiresIn === '7d') return new Date(Date.now() + 604800000); // 7 days
      if (expiresIn === '24h') return new Date(Date.now() + 86400000); // 24 hours
      if (expiresIn === '1h') return new Date(Date.now() + 3600000); // 1 hour
      return new Date(Date.now() + 3600000); // default 1 hour
    }
  );
  
  // Mock AuthError static methods
  (AuthError.invalidToken as jest.Mock).mockImplementation(
    () => new Error('Invalid token')
  );
  (AuthError.tokenExpired as jest.Mock).mockImplementation(
    () => new Error('Token expired')
  );
  
  // Mock config
  (config.getAuthConfig as jest.Mock).mockReturnValue({
    jwtSecret: 'mock-jwt-secret',
    jwtExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d'
  });
};

describe('TokenService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupTokenTests();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens for a user', async () => {
      const user = mockUser();
      
      const result = await TokenService.generateTokens(user);
      
      expect(result).toEqual({
        access: `access-token-for-${user.id}`,
        refresh: `refresh-token-for-${user.id}`
      });
      expect(generateAccessToken).toHaveBeenCalledWith(user);
      expect(generateRefreshToken).toHaveBeenCalledWith(user);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh tokens with a valid refresh token', async () => {
      const refreshToken = 'refresh-token';
      
      // Setup spy on generateTokens since it's within the same module
      jest.spyOn(TokenService, 'generateTokens').mockResolvedValue({
        access: 'new-access-token',
        refresh: 'new-refresh-token'
      });
      
      const result = await TokenService.refreshAccessToken(refreshToken);
      
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });
      expect(verifyToken).toHaveBeenCalledWith(refreshToken);
      expect(TokenModel.isBlacklisted).toHaveBeenCalledWith(refreshToken);
      expect(blacklistToken).toHaveBeenCalledWith(refreshToken);
      expect(TokenService.generateTokens).toHaveBeenCalled();
    });

    it('should throw an error if token type is not REFRESH', async () => {
      // Mock token with wrong type
      (verifyToken as jest.Mock).mockReturnValueOnce({
        id: 'user-id',
        type: TokenType.ACCESS
      });
      
      await expect(TokenService.refreshAccessToken('access-token'))
        .rejects.toThrow('Invalid token');
      
      expect(AuthError.invalidToken).toHaveBeenCalled();
    });

    it('should throw an error if token is blacklisted', async () => {
      // Force blacklisted token
      (TokenModel.isBlacklisted as jest.Mock).mockResolvedValueOnce(true);
      
      await expect(TokenService.refreshAccessToken('blacklisted-token'))
        .rejects.toThrow('Invalid token');
      
      expect(AuthError.invalidToken).toHaveBeenCalled();
    });

    it('should handle verification errors', async () => {
      await expect(TokenService.refreshAccessToken('invalid-token'))
        .rejects.toThrow('Invalid token');
      
      expect(AuthError.invalidToken).toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', async () => {
      const accessToken = 'access-token';
      const decodedToken = {
        id: 'user-id',
        email: 'user@example.com',
        role: UserRole.USER,
        type: TokenType.ACCESS
      };
      
      (verifyToken as jest.Mock).mockReturnValueOnce(decodedToken);
      
      const result = await TokenService.verifyAccessToken(accessToken);
      
      expect(result).toEqual(decodedToken);
      expect(verifyToken).toHaveBeenCalledWith(accessToken);
      expect(TokenModel.isBlacklisted).toHaveBeenCalledWith(accessToken);
    });

    it('should throw an error if token type is not ACCESS', async () => {
      // Mock token with wrong type
      (verifyToken as jest.Mock).mockReturnValueOnce({
        id: 'user-id',
        type: TokenType.REFRESH
      });
      
      await expect(TokenService.verifyAccessToken('refresh-token'))
        .rejects.toThrow('Invalid token');
      
      expect(AuthError.invalidToken).toHaveBeenCalled();
    });

    it('should throw an error if token is blacklisted', async () => {
      // Force blacklisted token
      (TokenModel.isBlacklisted as jest.Mock).mockResolvedValueOnce(true);
      
      await expect(TokenService.verifyAccessToken('access-token'))
        .rejects.toThrow('Invalid token');
      
      expect(AuthError.invalidToken).toHaveBeenCalled();
    });

    it('should handle token expiration errors', async () => {
      await expect(TokenService.verifyAccessToken('expired-token'))
        .rejects.toThrow('Token expired');
      
      expect(AuthError.tokenExpired).toHaveBeenCalled();
    });

    it('should handle other verification errors', async () => {
      await expect(TokenService.verifyAccessToken('invalid-token'))
        .rejects.toThrow('Invalid token');
      
      expect(AuthError.invalidToken).toHaveBeenCalled();
    });
  });

  describe('invalidateToken', () => {
    it('should invalidate a token successfully', async () => {
      const token = 'valid-token';
      
      const result = await TokenService.invalidateToken(token);
      
      expect(result).toBe(true);
      expect(blacklistToken).toHaveBeenCalledWith(token);
    });

    it('should return false if token invalidation fails', async () => {
      const token = 'non-blacklistable-token';
      
      const result = await TokenService.invalidateToken(token);
      
      expect(result).toBe(false);
      expect(blacklistToken).toHaveBeenCalledWith(token);
    });

    it('should handle errors during invalidation', async () => {
      const token = 'error-token';
      
      // Force error during blacklisting
      (blacklistToken as jest.Mock).mockRejectedValueOnce(new Error('Blacklisting failed'));
      
      const result = await TokenService.invalidateToken(token);
      
      expect(result).toBe(false);
      expect(blacklistToken).toHaveBeenCalledWith(token);
    });
  });

  describe('invalidateAllUserTokens', () => {
    it('should invalidate all tokens for a user', async () => {
      const userId = 'user-id';
      
      const result = await TokenService.invalidateAllUserTokens(userId);
      
      expect(result).toBe(3); // 2 access + 1 refresh
      expect(TokenModel.deleteByUserAndType).toHaveBeenCalledWith(userId, TokenType.ACCESS);
      expect(TokenModel.deleteByUserAndType).toHaveBeenCalledWith(userId, TokenType.REFRESH);
    });

    it('should handle errors during invalidation', async () => {
      const userId = 'error-user-id';
      
      // Force error during deletion
      (TokenModel.deleteByUserAndType as jest.Mock).mockRejectedValueOnce(new Error('Deletion failed'));
      
      await expect(TokenService.invalidateAllUserTokens(userId))
        .rejects.toThrow('Deletion failed');
      
      expect(TokenModel.deleteByUserAndType).toHaveBeenCalledWith(userId, TokenType.ACCESS);
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate a verification token', async () => {
      const userId = 'user-id';
      
      const result = await TokenService.generateVerificationToken(userId);
      
      expect(result).toBe('random-token-string');
      expect(generateRandomToken).toHaveBeenCalled();
      expect(calculateExpirationDate).toHaveBeenCalledWith('24h');
      expect(TokenModel.create).toHaveBeenCalledWith({
        userId,
        token: 'random-token-string',
        type: TokenType.VERIFICATION,
        expiresAt: expect.any(Date)
      });
    });

    it('should handle errors during token generation', async () => {
      const userId = 'error-user-id';
      
      // Force error during creation
      (TokenModel.create as jest.Mock).mockRejectedValueOnce(new Error('Creation failed'));
      
      await expect(TokenService.generateVerificationToken(userId))
        .rejects.toThrow('Creation failed');
      
      expect(generateRandomToken).toHaveBeenCalled();
      expect(calculateExpirationDate).toHaveBeenCalledWith('24h');
      expect(TokenModel.create).toHaveBeenCalled();
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a password reset token', async () => {
      const userId = 'user-id';
      
      const result = await TokenService.generatePasswordResetToken(userId);
      
      expect(result).toEqual({
        token: 'random-token-string',
        expiresAt: expect.any(Date)
      });
      expect(generateRandomToken).toHaveBeenCalled();
      expect(calculateExpirationDate).toHaveBeenCalledWith('1h');
      expect(TokenModel.deleteByUserAndType).toHaveBeenCalledWith(userId, TokenType.PASSWORD_RESET);
      expect(TokenModel.create).toHaveBeenCalledWith({
        userId,
        token: 'random-token-string',
        type: TokenType.PASSWORD_RESET,
        expiresAt: expect.any(Date)
      });
    });

    it('should handle errors during token generation', async () => {
      const userId = 'error-user-id';
      
      // Force error during creation
      (TokenModel.create as jest.Mock).mockRejectedValueOnce(new Error('Creation failed'));
      
      await expect(TokenService.generatePasswordResetToken(userId))
        .rejects.toThrow('Creation failed');
      
      expect(generateRandomToken).toHaveBeenCalled();
      expect(calculateExpirationDate).toHaveBeenCalledWith('1h');
      expect(TokenModel.deleteByUserAndType).toHaveBeenCalledWith(userId, TokenType.PASSWORD_RESET);
      expect(TokenModel.create).toHaveBeenCalled();
    });
  });

  describe('verifySpecialToken', () => {
    it('should verify a valid special token', async () => {
      const token = 'verification-token';
      const type = TokenType.VERIFICATION;
      const mockTokenObj = mockToken({
        token,
        type,
        userId: 'verified-user-id'
      });
      
      (TokenModel.findByToken as jest.Mock).mockResolvedValueOnce(mockTokenObj);
      
      const result = await TokenService.verifySpecialToken(token, type);
      
      expect(result).toBe('verified-user-id');
      expect(TokenModel.findByToken).toHaveBeenCalledWith(token, type);
      expect(TokenModel.blacklist).toHaveBeenCalledWith(token);
    });

    it('should throw an error if token is not found', async () => {
      const token = 'invalid-token';
      const type = TokenType.VERIFICATION;
      
      await expect(TokenService.verifySpecialToken(token, type))
        .rejects.toThrow('Invalid token');
      
      expect(AuthError.invalidToken).toHaveBeenCalled();
    });

    it('should throw an error if token is blacklisted', async () => {
      const token = 'blacklisted-special-token';
      const type = TokenType.VERIFICATION;
      
      // Mock blacklisted token
      (TokenModel.findByToken as jest.Mock).mockResolvedValueOnce({
        ...mockToken({ token, type }),
        blacklisted: true
      });
      
      await expect(TokenService.verifySpecialToken(token, type))
        .rejects.toThrow('Invalid token');
      
      expect(AuthError.invalidToken).toHaveBeenCalled();
    });

    it('should throw an error if token is expired', async () => {
      const token = 'expired-special-token';
      const type = TokenType.VERIFICATION;
      
      // Mock expired token
      (TokenModel.findByToken as jest.Mock).mockResolvedValueOnce({
        ...mockToken({ token, type }),
        expiresAt: new Date(Date.now() - 3600000) // 1 hour in past
      });
      
      await expect(TokenService.verifySpecialToken(token, type))
        .rejects.toThrow('Token expired');
      
      expect(AuthError.tokenExpired).toHaveBeenCalled();
    });

    it('should handle errors during verification', async () => {
      const token = 'error-token';
      const type = TokenType.VERIFICATION;
      
      // Force error during finding
      (TokenModel.findByToken as jest.Mock).mockRejectedValueOnce(new Error('Finding failed'));
      
      await expect(TokenService.verifySpecialToken(token, type))
        .rejects.toThrow('Invalid token');
      
      expect(AuthError.invalidToken).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should clean up expired tokens', async () => {
      const result = await TokenService.cleanupExpiredTokens();
      
      expect(result).toBe(5);
      expect(TokenModel.deleteExpired).toHaveBeenCalled();
    });

    it('should handle errors during cleanup', async () => {
      // Force error during deletion
      (TokenModel.deleteExpired as jest.Mock).mockRejectedValueOnce(new Error('Deletion failed'));
      
      await expect(TokenService.cleanupExpiredTokens())
        .rejects.toThrow('Deletion failed');
      
      expect(TokenModel.deleteExpired).toHaveBeenCalled();
    });
  });
});