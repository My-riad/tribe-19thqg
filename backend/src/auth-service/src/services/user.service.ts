import { UserModel } from '../models/user.model';
import { hashPassword, validatePasswordStrength } from '../utils/password.util';
import { 
  IUser, 
  IUserCreate, 
  IUserResponse, 
  UserRole, 
  UserStatus, 
  AuthProvider 
} from '../../../shared/src/types/user.types';
import { AuthError } from '../../../shared/src/errors/auth.error';
import { ValidationError } from '../../../shared/src/errors/validation.error';
import { logger } from '../../../shared/src/utils/logger.util';
import config from '../config';

/**
 * Creates a new user in the system
 * 
 * @param userData - User creation data
 * @returns The created user
 * @throws ValidationError if required fields are missing or invalid
 */
async function createUser(userData: IUserCreate): Promise<IUser> {
  // Validate required user data
  if (!userData.email) {
    throw ValidationError.requiredField('email');
  }

  // Check if user with email already exists
  const existingUser = await UserModel.findByEmail(userData.email);
  if (existingUser) {
    logger.info(`User creation failed: Email already exists`, { email: userData.email });
    throw ValidationError.invalidInput('A user with this email already exists');
  }

  // If local auth, password is required and must meet strength requirements
  const provider = userData.provider || AuthProvider.LOCAL;
  if (provider === AuthProvider.LOCAL) {
    if (!userData.password) {
      throw ValidationError.requiredField('password');
    }
    
    // Validate password strength
    if (!validatePasswordStrength(userData.password)) {
      throw ValidationError.invalidInput('Password does not meet complexity requirements');
    }
  }

  // Set default values
  const createData: IUserCreate = {
    ...userData,
    role: userData.role || UserRole.USER,
    status: userData.status || UserStatus.PENDING,
    provider
  };

  try {
    // Create user in database
    const user = await UserModel.create(createData);
    
    logger.info(`User created successfully`, { userId: user.id, email: user.email });
    return user;
  } catch (error) {
    logger.error(`Failed to create user`, error as Error, { email: userData.email });
    throw error;
  }
}

/**
 * Retrieves a user by their ID
 * 
 * @param id - User ID
 * @returns The found user or null if not found
 */
async function getUserById(id: string): Promise<IUser | null> {
  if (!id) {
    throw ValidationError.requiredField('id');
  }

  try {
    const user = await UserModel.findById(id);
    return user;
  } catch (error) {
    logger.error(`Error retrieving user by ID`, error as Error, { userId: id });
    throw error;
  }
}

/**
 * Retrieves a user by their email address
 * 
 * @param email - User email address
 * @returns The found user or null if not found
 */
async function getUserByEmail(email: string): Promise<IUser | null> {
  if (!email) {
    throw ValidationError.requiredField('email');
  }

  try {
    const user = await UserModel.findByEmail(email);
    return user;
  } catch (error) {
    logger.error(`Error retrieving user by email`, error as Error, { email });
    throw error;
  }
}

/**
 * Formats a user object for API responses, removing sensitive data
 * 
 * @param user - The user object to format
 * @returns Sanitized user object for client response
 */
function formatUserResponse(user: IUser): IUserResponse {
  if (!user) {
    throw ValidationError.requiredField('user');
  }

  // Extract only the properties that should be included in the response
  const userResponse: IUserResponse = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    provider: user.provider,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt
  };

  return userResponse;
}

/**
 * Updates a user's password
 * 
 * @param userId - The user ID
 * @param newPassword - The new password
 * @returns The updated user
 * @throws ValidationError if the password doesn't meet requirements
 */
async function changePassword(userId: string, newPassword: string): Promise<IUser> {
  if (!userId) {
    throw ValidationError.requiredField('userId');
  }

  if (!newPassword) {
    throw ValidationError.requiredField('newPassword');
  }

  // Validate password strength
  if (!validatePasswordStrength(newPassword)) {
    throw ValidationError.invalidInput('New password does not meet complexity requirements');
  }

  try {
    // Ensure user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      logger.info(`Change password failed: User not found`, { userId });
      throw ValidationError.invalidInput('User not found');
    }

    // Update the user's password
    const updatedUser = await UserModel.updatePassword(userId, newPassword);
    
    logger.info(`Password changed successfully`, { userId });
    return updatedUser;
  } catch (error) {
    logger.error(`Failed to change password`, error as Error, { userId });
    throw error;
  }
}

/**
 * Updates a user's email verification status
 * 
 * @param userId - The user ID
 * @returns The updated user
 */
async function verifyUser(userId: string): Promise<IUser> {
  if (!userId) {
    throw ValidationError.requiredField('userId');
  }

  try {
    // Ensure user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      logger.info(`Verify user failed: User not found`, { userId });
      throw ValidationError.invalidInput('User not found');
    }

    // Update the user's verification status
    // This method also handles changing status from PENDING to ACTIVE if needed
    const updatedUser = await UserModel.updateVerification(userId, true);
    
    logger.info(`User verified successfully`, { userId });
    return updatedUser;
  } catch (error) {
    logger.error(`Failed to verify user`, error as Error, { userId });
    throw error;
  }
}

/**
 * Updates a user's account status
 * 
 * @param userId - The user ID
 * @param status - The new status
 * @returns The updated user
 */
async function updateUserStatus(userId: string, status: UserStatus): Promise<IUser> {
  if (!userId) {
    throw ValidationError.requiredField('userId');
  }

  if (!status) {
    throw ValidationError.requiredField('status');
  }

  try {
    // Ensure user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      logger.info(`Update status failed: User not found`, { userId });
      throw ValidationError.invalidInput('User not found');
    }

    // Update the user's status
    const updatedUser = await UserModel.updateStatus(userId, status);
    
    logger.info(`User status updated successfully`, { userId, status });
    return updatedUser;
  } catch (error) {
    logger.error(`Failed to update user status`, error as Error, { userId, status });
    throw error;
  }
}

/**
 * Soft deletes a user by setting their status to DELETED
 * 
 * @param userId - The user ID
 * @returns The updated user
 */
async function deleteUser(userId: string): Promise<IUser> {
  if (!userId) {
    throw ValidationError.requiredField('userId');
  }

  try {
    // Ensure user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      logger.info(`Delete user failed: User not found`, { userId });
      throw ValidationError.invalidInput('User not found');
    }

    // Soft delete the user by setting status to DELETED
    const updatedUser = await UserModel.delete(userId);
    
    logger.info(`User deleted successfully`, { userId });
    return updatedUser;
  } catch (error) {
    logger.error(`Failed to delete user`, error as Error, { userId });
    throw error;
  }
}

// Export the service
export const UserService = {
  createUser,
  getUserById,
  getUserByEmail,
  formatUserResponse,
  changePassword,
  verifyUser,
  updateUserStatus,
  deleteUser
};