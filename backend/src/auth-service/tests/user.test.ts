import { UserService } from '../src/services/user.service';
import { UserModel } from '../src/models/user.model';
import { hashPassword, validatePasswordStrength } from '../src/utils/password.util';
import { 
  IUser, 
  IUserCreate, 
  IUserResponse,
  UserRole, 
  UserStatus, 
  AuthProvider 
} from '../../../shared/src/types/user.types';
import { ValidationError } from '../../../shared/src/errors/validation.error';
import { logger } from '../../../shared/src/utils/logger.util';

// Mock dependencies
jest.mock('../src/models/user.model');
jest.mock('../src/utils/password.util');
jest.mock('../../../shared/src/utils/logger.util');

/**
 * Creates mock user data for testing
 */
const mockUserData = (overrides: Partial<IUserCreate> = {}): IUserCreate => {
  return {
    email: 'test@example.com',
    password: 'StrongPass123!',
    ...overrides
  };
};

/**
 * Creates a mock user object that simulates a database user
 */
const mockUser = (overrides: Partial<IUser> = {}): IUser => {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
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
 * Sets up the test environment for user service tests
 */
const setupUserTests = () => {
  // Mock UserModel methods
  (UserModel.create as jest.Mock).mockImplementation(async (userData) => {
    return mockUser({ email: userData.email });
  });
  
  (UserModel.findById as jest.Mock).mockImplementation(async (id) => {
    return id === '123e4567-e89b-12d3-a456-426614174000' ? mockUser() : null;
  });
  
  (UserModel.findByEmail as jest.Mock).mockImplementation(async (email) => {
    return email === 'test@example.com' ? mockUser({ email }) : null;
  });
  
  (UserModel.updatePassword as jest.Mock).mockImplementation(async (id, newPassword) => {
    return mockUser({ id });
  });
  
  (UserModel.updateVerification as jest.Mock).mockImplementation(async (id, isVerified) => {
    return mockUser({ id, isVerified });
  });
  
  (UserModel.updateStatus as jest.Mock).mockImplementation(async (id, status) => {
    return mockUser({ id, status });
  });
  
  (UserModel.delete as jest.Mock).mockImplementation(async (id) => {
    return mockUser({ id, status: UserStatus.DELETED });
  });
  
  // Mock password utility functions
  (hashPassword as jest.Mock).mockImplementation(async (password) => {
    return 'hashed_' + password;
  });
  
  (validatePasswordStrength as jest.Mock).mockImplementation((password) => {
    return password !== 'WeakPass';
  });
  
  // Mock logger functions
  (logger.info as jest.Mock).mockImplementation(() => {});
  (logger.error as jest.Mock).mockImplementation(() => {});
};

/**
 * Cleans up the test environment after user service tests
 */
const cleanupUserTests = () => {
  jest.resetAllMocks();
};

describe('UserService', () => {
  beforeEach(() => {
    setupUserTests();
  });
  
  afterEach(() => {
    cleanupUserTests();
  });
  
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      // Mock that user doesn't exist yet
      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(null);
      
      const userData = mockUserData();
      const user = await UserService.createUser(userData);
      
      expect(UserModel.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(validatePasswordStrength).toHaveBeenCalledWith(userData.password);
      expect(UserModel.create).toHaveBeenCalled();
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });
    
    it('should throw ValidationError when email is missing', async () => {
      const userData = mockUserData({ email: '' });
      
      await expect(UserService.createUser(userData)).rejects.toThrow(ValidationError);
      expect(UserModel.create).not.toHaveBeenCalled();
    });
    
    it('should throw ValidationError when email format is invalid', async () => {
      // Mock format validation by having findByEmail throw an error
      (UserModel.findByEmail as jest.Mock).mockRejectedValueOnce(
        ValidationError.invalidInput('Invalid email format')
      );
      
      const userData = mockUserData({ email: 'invalid-email' });
      
      await expect(UserService.createUser(userData)).rejects.toThrow(ValidationError);
      expect(UserModel.create).not.toHaveBeenCalled();
    });
    
    it('should throw ValidationError when password is weak', async () => {
      // Mock that user doesn't exist yet
      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(null);
      
      const userData = mockUserData({ password: 'WeakPass' });
      
      await expect(UserService.createUser(userData)).rejects.toThrow(ValidationError);
      expect(UserModel.create).not.toHaveBeenCalled();
    });
    
    it('should set default values for role, status, and provider', async () => {
      // Mock that user doesn't exist yet
      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(null);
      
      const userData = mockUserData();
      await UserService.createUser(userData);
      
      // Check that create was called with default values
      expect(UserModel.create).toHaveBeenCalledWith(expect.objectContaining({
        role: UserRole.USER,
        status: UserStatus.PENDING,
        provider: AuthProvider.LOCAL
      }));
    });
    
    it('should hash the password before storing', async () => {
      // Mock that user doesn't exist yet
      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(null);
      
      const userData = mockUserData();
      await UserService.createUser(userData);
      
      expect(hashPassword).toHaveBeenCalledWith(userData.password);
    });
  });
  
  describe('getUserById', () => {
    it('should return a user when valid ID is provided', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const user = await UserService.getUserById(userId);
      
      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
    });
    
    it('should return null when user is not found', async () => {
      const userId = 'nonexistent-id';
      const user = await UserService.getUserById(userId);
      
      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(user).toBeNull();
    });
    
    it('should throw ValidationError when ID is invalid', async () => {
      await expect(UserService.getUserById('')).rejects.toThrow(ValidationError);
      expect(UserModel.findById).not.toHaveBeenCalled();
    });
  });
  
  describe('getUserByEmail', () => {
    it('should return a user when valid email is provided', async () => {
      const email = 'test@example.com';
      const user = await UserService.getUserByEmail(email);
      
      expect(UserModel.findByEmail).toHaveBeenCalledWith(email);
      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
    });
    
    it('should return null when user is not found', async () => {
      const email = 'nonexistent@example.com';
      const user = await UserService.getUserByEmail(email);
      
      expect(UserModel.findByEmail).toHaveBeenCalledWith(email);
      expect(user).toBeNull();
    });
    
    it('should throw ValidationError when email is invalid', async () => {
      await expect(UserService.getUserByEmail('')).rejects.toThrow(ValidationError);
      expect(UserModel.findByEmail).not.toHaveBeenCalled();
    });
  });
  
  describe('formatUserResponse', () => {
    it('should return a sanitized user object without sensitive fields', () => {
      const user = mockUser();
      const formattedUser = UserService.formatUserResponse(user);
      
      // Should include these fields
      expect(formattedUser.id).toBe(user.id);
      expect(formattedUser.email).toBe(user.email);
      expect(formattedUser.role).toBe(user.role);
      expect(formattedUser.status).toBe(user.status);
      expect(formattedUser.isVerified).toBe(user.isVerified);
      
      // Should not include these fields
      expect(formattedUser).not.toHaveProperty('passwordHash');
      expect(formattedUser).not.toHaveProperty('resetPasswordToken');
      expect(formattedUser).not.toHaveProperty('verificationToken');
    });
    
    it('should include id, email, role, status, and timestamps', () => {
      const user = mockUser();
      const formattedUser = UserService.formatUserResponse(user);
      
      expect(formattedUser).toHaveProperty('id');
      expect(formattedUser).toHaveProperty('email');
      expect(formattedUser).toHaveProperty('role');
      expect(formattedUser).toHaveProperty('status');
      expect(formattedUser).toHaveProperty('isVerified');
      expect(formattedUser).toHaveProperty('lastLogin');
      expect(formattedUser).toHaveProperty('createdAt');
    });
    
    it('should exclude passwordHash, tokens, and internal fields', () => {
      const user = mockUser();
      const formattedUser = UserService.formatUserResponse(user);
      
      expect(formattedUser).not.toHaveProperty('passwordHash');
      expect(formattedUser).not.toHaveProperty('verificationToken');
      expect(formattedUser).not.toHaveProperty('resetPasswordToken');
      expect(formattedUser).not.toHaveProperty('resetPasswordExpires');
      expect(formattedUser).not.toHaveProperty('failedLoginAttempts');
      expect(formattedUser).not.toHaveProperty('lockUntil');
    });
  });
  
  describe('changePassword', () => {
    it('should update user password when valid data is provided', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const newPassword = 'NewStrongPass123!';
      
      const updatedUser = await UserService.changePassword(userId, newPassword);
      
      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(validatePasswordStrength).toHaveBeenCalledWith(newPassword);
      expect(UserModel.updatePassword).toHaveBeenCalledWith(userId, newPassword);
      expect(updatedUser).toBeDefined();
    });
    
    it('should throw ValidationError when password is weak', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const newPassword = 'WeakPass';
      
      await expect(UserService.changePassword(userId, newPassword)).rejects.toThrow(ValidationError);
      expect(UserModel.updatePassword).not.toHaveBeenCalled();
    });
    
    it('should throw ValidationError when user ID is invalid', async () => {
      const userId = '';
      const newPassword = 'StrongPass123!';
      
      await expect(UserService.changePassword(userId, newPassword)).rejects.toThrow(ValidationError);
      expect(UserModel.updatePassword).not.toHaveBeenCalled();
    });
    
    it('should hash the new password before storing', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const newPassword = 'NewStrongPass123!';
      
      await UserService.changePassword(userId, newPassword);
      
      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(UserModel.updatePassword).toHaveBeenCalledWith(userId, newPassword);
    });
  });
  
  describe('verifyUser', () => {
    it('should update user verification status to true', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      const updatedUser = await UserService.verifyUser(userId);
      
      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(UserModel.updateVerification).toHaveBeenCalledWith(userId, true);
      expect(updatedUser).toBeDefined();
      expect(updatedUser.isVerified).toBe(true);
    });
    
    it('should update user status from PENDING to ACTIVE when verified', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      // First mock a pending user
      (UserModel.findById as jest.Mock).mockResolvedValueOnce(mockUser({ 
        status: UserStatus.PENDING 
      }));
      
      // Then mock the update to return an active user
      (UserModel.updateVerification as jest.Mock).mockResolvedValueOnce(mockUser({ 
        isVerified: true, 
        status: UserStatus.ACTIVE 
      }));
      
      const updatedUser = await UserService.verifyUser(userId);
      
      expect(updatedUser.status).toBe(UserStatus.ACTIVE);
    });
    
    it('should throw ValidationError when user ID is invalid', async () => {
      const userId = '';
      
      await expect(UserService.verifyUser(userId)).rejects.toThrow(ValidationError);
      expect(UserModel.updateVerification).not.toHaveBeenCalled();
    });
  });
  
  describe('updateUserStatus', () => {
    it('should update user status when valid data is provided', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const newStatus = UserStatus.SUSPENDED;
      
      const updatedUser = await UserService.updateUserStatus(userId, newStatus);
      
      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(UserModel.updateStatus).toHaveBeenCalledWith(userId, newStatus);
      expect(updatedUser).toBeDefined();
      expect(updatedUser.status).toBe(newStatus);
    });
    
    it('should throw ValidationError when status is invalid', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const invalidStatus = null as unknown as UserStatus;
      
      await expect(UserService.updateUserStatus(userId, invalidStatus)).rejects.toThrow(ValidationError);
      expect(UserModel.updateStatus).not.toHaveBeenCalled();
    });
    
    it('should throw ValidationError when user ID is invalid', async () => {
      const userId = '';
      const newStatus = UserStatus.SUSPENDED;
      
      await expect(UserService.updateUserStatus(userId, newStatus)).rejects.toThrow(ValidationError);
      expect(UserModel.updateStatus).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteUser', () => {
    it('should soft delete a user by setting status to DELETED', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      const deletedUser = await UserService.deleteUser(userId);
      
      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(UserModel.delete).toHaveBeenCalledWith(userId);
      expect(deletedUser).toBeDefined();
      expect(deletedUser.status).toBe(UserStatus.DELETED);
    });
    
    it('should throw ValidationError when user ID is invalid', async () => {
      const userId = '';
      
      await expect(UserService.deleteUser(userId)).rejects.toThrow(ValidationError);
      expect(UserModel.delete).not.toHaveBeenCalled();
    });
  });
});