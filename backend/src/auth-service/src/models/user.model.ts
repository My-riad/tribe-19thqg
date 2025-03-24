import { Prisma } from '@prisma/client'; // ^4.16.0
import database from '../../../config/database';
import { hashPassword } from '../utils/password.util';
import { 
  IUser, 
  IUserCreate, 
  UserRole, 
  UserStatus, 
  AuthProvider 
} from '../../../shared/src/types/user.types';

/**
 * Data access layer for user management in the Tribe authentication service.
 * Provides methods for creating, retrieving, updating, and managing user accounts.
 */
const UserModel = {
  /**
   * Creates a new user in the database
   * 
   * @param userData - User creation data
   * @returns The created user
   */
  async create(userData: IUserCreate): Promise<IUser> {
    // Validate required user data
    if (!userData.email) {
      throw new Error('Email is required');
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (userData.password) {
      passwordHash = await hashPassword(userData.password);
    } else if (userData.provider === AuthProvider.LOCAL) {
      // Local authentication requires a password
      throw new Error('Password is required for local authentication');
    }

    // Set default values if not provided
    const role = userData.role || UserRole.USER;
    const status = userData.status || UserStatus.PENDING;
    const provider = userData.provider || AuthProvider.LOCAL;

    // Create user record in database
    const user = await database.prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        role,
        status,
        isVerified: userData.isVerified || false,
        provider,
        providerId: userData.providerId || null,
        failedLoginAttempts: 0,
      },
    });

    return user as IUser;
  },

  /**
   * Finds a user by their ID
   * 
   * @param id - User ID
   * @returns The found user or null if not found
   */
  async findById(id: string): Promise<IUser | null> {
    const user = await database.prisma.user.findUnique({
      where: { id },
    });
    
    return user as IUser | null;
  },

  /**
   * Finds a user by their email address
   * 
   * @param email - User email address
   * @returns The found user or null if not found
   */
  async findByEmail(email: string): Promise<IUser | null> {
    const user = await database.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive', // Case insensitive search
        },
      },
    });
    
    return user as IUser | null;
  },

  /**
   * Finds a user by their social provider ID
   * 
   * @param providerId - External provider's user ID
   * @param provider - Authentication provider type
   * @returns The found user or null if not found
   */
  async findByProviderId(providerId: string, provider: AuthProvider): Promise<IUser | null> {
    const user = await database.prisma.user.findFirst({
      where: {
        providerId,
        provider,
      },
    });
    
    return user as IUser | null;
  },

  /**
   * Updates a user's last login timestamp
   * 
   * @param id - User ID
   * @returns The updated user
   */
  async updateLastLogin(id: string): Promise<IUser> {
    const user = await database.prisma.user.update({
      where: { id },
      data: {
        lastLogin: new Date(),
        failedLoginAttempts: 0, // Reset failed login attempts
        lockUntil: null, // Clear account lock if present
      },
    });
    
    return user as IUser;
  },

  /**
   * Increments a user's failed login attempts counter
   * 
   * @param id - User ID
   * @returns The updated user
   */
  async incrementFailedLogin(id: string): Promise<IUser> {
    // Get current user to check failed login attempts
    const currentUser = await database.prisma.user.findUnique({
      where: { id },
    });
    
    if (!currentUser) {
      throw new Error('User not found');
    }
    
    // Increment failed login attempts
    const failedLoginAttempts = (currentUser.failedLoginAttempts || 0) + 1;
    
    // Set lockUntil if threshold exceeded (5 attempts)
    let lockUntil: Date | null = null;
    if (failedLoginAttempts >= 5) {
      // Lock account for 15 minutes
      lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    
    // Update user record
    const user = await database.prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts,
        lockUntil,
      },
    });
    
    return user as IUser;
  },

  /**
   * Updates a user's password
   * 
   * @param id - User ID
   * @param newPassword - New password (plain text)
   * @returns The updated user
   */
  async updatePassword(id: string, newPassword: string): Promise<IUser> {
    // Hash the new password
    const passwordHash = await hashPassword(newPassword);
    
    // Update user record
    const user = await database.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        resetPasswordToken: null, // Clear reset token
        resetPasswordExpires: null, // Clear token expiration
      },
    });
    
    return user as IUser;
  },

  /**
   * Sets a password reset token for a user
   * 
   * @param id - User ID
   * @param token - Reset token
   * @param expires - Token expiration date
   * @returns The updated user
   */
  async setResetPasswordToken(id: string, token: string, expires: Date): Promise<IUser> {
    const user = await database.prisma.user.update({
      where: { id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });
    
    return user as IUser;
  },

  /**
   * Finds a user by their password reset token
   * 
   * @param token - Reset token
   * @returns The found user or null if not found
   */
  async findByResetToken(token: string): Promise<IUser | null> {
    const user = await database.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });
    
    return user as IUser | null;
  },

  /**
   * Sets an email verification token for a user
   * 
   * @param id - User ID
   * @param token - Verification token
   * @returns The updated user
   */
  async setVerificationToken(id: string, token: string): Promise<IUser> {
    const user = await database.prisma.user.update({
      where: { id },
      data: {
        verificationToken: token,
      },
    });
    
    return user as IUser;
  },

  /**
   * Finds a user by their email verification token
   * 
   * @param token - Verification token
   * @returns The found user or null if not found
   */
  async findByVerificationToken(token: string): Promise<IUser | null> {
    const user = await database.prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });
    
    return user as IUser | null;
  },

  /**
   * Updates a user's email verification status
   * 
   * @param id - User ID
   * @param isVerified - Verification status
   * @returns The updated user
   */
  async updateVerification(id: string, isVerified: boolean): Promise<IUser> {
    const currentUser = await database.prisma.user.findUnique({
      where: { id },
    });
    
    if (!currentUser) {
      throw new Error('User not found');
    }
    
    // Update user verification status
    const updateData: any = {
      isVerified,
    };
    
    // Clear verification token if verified
    if (isVerified) {
      updateData.verificationToken = null;
      
      // Update status from PENDING to ACTIVE if verified
      if (currentUser.status === UserStatus.PENDING) {
        updateData.status = UserStatus.ACTIVE;
      }
    }
    
    const user = await database.prisma.user.update({
      where: { id },
      data: updateData,
    });
    
    return user as IUser;
  },

  /**
   * Updates a user's account status
   * 
   * @param id - User ID
   * @param status - New account status
   * @returns The updated user
   */
  async updateStatus(id: string, status: UserStatus): Promise<IUser> {
    const user = await database.prisma.user.update({
      where: { id },
      data: { status },
    });
    
    return user as IUser;
  },

  /**
   * Soft deletes a user by setting their status to DELETED
   * 
   * @param id - User ID
   * @returns The updated user
   */
  async delete(id: string): Promise<IUser> {
    const user = await database.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.DELETED,
      },
    });
    
    return user as IUser;
  },

  /**
   * Permanently deletes a user from the database
   * 
   * @param id - User ID
   * @returns The deleted user
   */
  async hardDelete(id: string): Promise<IUser> {
    const user = await database.prisma.user.delete({
      where: { id },
    });
    
    return user as IUser;
  },
};

export { UserModel };