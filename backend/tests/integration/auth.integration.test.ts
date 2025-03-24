import supertest from 'supertest'; // ^6.3.3
import { faker } from '@faker-js/faker'; // ^8.0.2
import nock from 'nock'; // ^13.3.1
import jwt_decode from 'jwt-decode'; // ^3.1.2

import app from '../../src/auth-service/src/index';
import { UserModel } from '../../src/auth-service/src/models/user.model';
import { TokenModel, TokenType } from '../../src/auth-service/src/models/token.model';
import {
    IUserCreate,
    IUserCredentials,
    ISocialAuthCredentials,
    IUserResponse,
    IAuthResponse,
    UserRole,
    UserStatus,
    AuthProvider
} from '../../src/shared/src/types/user.types';
import { clearTestData } from '../setup';
import { verifyToken } from '../../src/auth-service/src/utils/token.util';
import { comparePasswords } from '../../src/auth-service/src/utils/password.util';

const API_BASE_URL = '/api/v1';

// Generate test user data with random values
const generateTestUser = (overrides: Partial<IUserCreate> = {}): IUserCreate => {
    // Generate random email using faker
    const email = faker.internet.email();

    // Generate random password using faker
    const password = faker.internet.password({ length: 12 });

    // Set default values for other fields
    const defaults: IUserCreate = {
        email,
        password,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        isVerified: true,
        provider: AuthProvider.LOCAL
    };

    // Override defaults with any provided values
    return {
        ...defaults,
        ...overrides
    };
};

// Creates a test user in the database
const createTestUser = async (overrides: Partial<IUserCreate> = {}): Promise<IUserResponse> => {
    // Generate test user data using generateTestUser
    const userData = generateTestUser(overrides);

    // Create user in database using UserModel.create
    const user = await UserModel.create(userData);

    // Format user data to match IUserResponse structure
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

    // Return the formatted user data
    return userResponse;
};

// Extracts access and refresh tokens from authentication response
const extractTokens = (response: any): { accessToken: string; refreshToken: string } => {
    // Extract tokens from response body
    const accessToken = response.body.tokens.access;
    const refreshToken = response.body.tokens.refresh;

    // Return object with accessToken and refreshToken
    return { accessToken, refreshToken };
};

describe('Auth Service Integration Tests', () => {
    let request: supertest.SuperTest<supertest.Test>;

    // Set up test data cleanup after each test
    beforeEach(() => {
        request = supertest(app);
    });

    describe('User Registration', () => {
        it('should register a new user successfully', async () => {
            const userData = generateTestUser();
            const response = await request
                .post(`${API_BASE_URL}/auth/register`)
                .send(userData)
                .expect(201);

            expect(response.body.user).toBeDefined();
            expect(response.body.tokens).toBeDefined();
            expect(response.body.user.email).toBe(userData.email);

            // Clean up the test user
            await clearTestData([response.body.user.id]);
        });

        it('should return 400 when registering with invalid email', async () => {
            const userData = generateTestUser({ email: 'invalid-email' });
            await request
                .post(`${API_BASE_URL}/auth/register`)
                .send(userData)
                .expect(400);
        });

        it('should return 400 when registering with weak password', async () => {
            const userData = generateTestUser({ password: 'weak' });
            await request
                .post(`${API_BASE_URL}/auth/register`)
                .send(userData)
                .expect(400);
        });

        it('should return 409 when registering with existing email', async () => {
            const existingUser = await createTestUser();
            const userData = generateTestUser({ email: existingUser.email });
            const response = await request
                .post(`${API_BASE_URL}/auth/register`)
                .send(userData)
                .expect(400);

            // Clean up the test user
            await clearTestData([existingUser.id]);
        });
    });

    describe('User Login', () => {
        it('should login successfully with valid credentials', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            const response = await request
                .post(`${API_BASE_URL}/auth/login`)
                .send({ email: testUser.email, password: testUser.password })
                .expect(200);

            expect(response.body.user).toBeDefined();
            expect(response.body.tokens).toBeDefined();
            expect(response.body.user.email).toBe(testUser.email);

            // Clean up the test user
            await clearTestData([user.id]);
        });

        it('should return 401 with invalid credentials', async () => {
            const testUser = generateTestUser();
            await UserModel.create(testUser);

            await request
                .post(`${API_BASE_URL}/auth/login`)
                .send({ email: testUser.email, password: 'wrong-password' })
                .expect(401);

            // Clean up the test user
            const user = await UserModel.findByEmail(testUser.email);
            await clearTestData([user!.id]);
        });

        it('should lock account after multiple failed attempts', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            for (let i = 0; i < 5; i++) {
                await request
                    .post(`${API_BASE_URL}/auth/login`)
                    .send({ email: testUser.email, password: 'wrong-password' })
                    .expect(401);
            }

            const response = await request
                .post(`${API_BASE_URL}/auth/login`)
                .send({ email: testUser.email, password: 'wrong-password' })
                .expect(401);

            expect(response.body.message).toBe('Your account has been temporarily locked due to too many failed attempts.');

            // Clean up the test user
            await clearTestData([user.id]);
        });

        it('should return 403 when account is not verified', async () => {
            const testUser = generateTestUser({ isVerified: false, status: UserStatus.PENDING });
            const user = await UserModel.create(testUser);

            const response = await request
                .post(`${API_BASE_URL}/auth/login`)
                .send({ email: testUser.email, password: testUser.password })
                .expect(401);

            expect(response.body.message).toBe('Account verification required. Please verify your email before proceeding.');

            // Clean up the test user
            await clearTestData([user.id]);
        });
    });

    describe('Token Management', () => {
        it('should refresh tokens successfully', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            const loginResponse = await request
                .post(`${API_BASE_URL}/auth/login`)
                .send({ email: testUser.email, password: testUser.password });

            const { refreshToken } = extractTokens(loginResponse);

            const refreshResponse = await request
                .post(`${API_BASE_URL}/auth/refresh-token`)
                .send({ refreshToken })
                .expect(200);

            expect(refreshResponse.body.accessToken).toBeDefined();
            expect(refreshResponse.body.refreshToken).toBeDefined();

            // Clean up the test user
            await clearTestData([user.id]);
        });

        it('should return 401 with invalid refresh token', async () => {
            await request
                .post(`${API_BASE_URL}/auth/refresh-token`)
                .send({ refreshToken: 'invalid-refresh-token' })
                .expect(401);
        });

        it('should invalidate refresh token after use', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            const loginResponse = await request
                .post(`${API_BASE_URL}/auth/login`)
                .send({ email: testUser.email, password: testUser.password });

            const { refreshToken } = extractTokens(loginResponse);

            await request
                .post(`${API_BASE_URL}/auth/refresh-token`)
                .send({ refreshToken })
                .expect(200);

            await request
                .post(`${API_BASE_URL}/auth/refresh-token`)
                .send({ refreshToken })
                .expect(401);

            // Clean up the test user
            await clearTestData([user.id]);
        });

        it('should logout successfully', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            const loginResponse = await request
                .post(`${API_BASE_URL}/auth/login`)
                .send({ email: testUser.email, password: testUser.password });

            const { refreshToken } = extractTokens(loginResponse);

            await request
                .post(`${API_BASE_URL}/auth/logout`)
                .send({ refreshToken })
                .expect(200);

            // Clean up the test user
            await clearTestData([user.id]);
        });

        it('should logout from all devices', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            const loginResponse = await request
                .post(`${API_BASE_URL}/auth/login`)
                .send({ email: testUser.email, password: testUser.password });

            const { accessToken } = extractTokens(loginResponse);

            await request
                .post(`${API_BASE_URL}/auth/logout-all`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            // Clean up the test user
            await clearTestData([user.id]);
        });
    });

    describe('Password Management', () => {
        it('should request password reset successfully', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            const response = await request
                .post(`${API_BASE_URL}/auth/password-reset-request`)
                .send({ email: testUser.email })
                .expect(200);

            expect(response.body.message).toBe('If an account with that email exists, we have sent a password reset link.');

            // Clean up the test user
            await clearTestData([user.id]);
        });

        it('should reset password with valid token', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            // Request password reset
            const resetRequestResponse = await request
                .post(`${API_BASE_URL}/auth/password-reset-request`)
                .send({ email: testUser.email });

            // Get the reset token from the database
            const resetToken = await TokenModel.findByUserAndType(user.id, TokenType.PASSWORD_RESET);

            const newPassword = faker.internet.password({ length: 12 });

            const response = await request
                .post(`${API_BASE_URL}/auth/password-reset`)
                .send({ token: resetToken!.token, newPassword, confirmPassword: newPassword })
                .expect(200);

            expect(response.body.message).toBe('Password reset successfully');

            // Verify that the password has been changed
            const updatedUser = await UserModel.findByEmail(testUser.email);
            const isPasswordValid = await comparePasswords(newPassword, updatedUser!.passwordHash || '');
            expect(isPasswordValid).toBe(true);

            // Clean up the test user
            await clearTestData([user.id]);
        });

        it('should return 401 with invalid reset token', async () => {
            const newPassword = faker.internet.password({ length: 12 });

            await request
                .post(`${API_BASE_URL}/auth/password-reset`)
                .send({ token: 'invalid-reset-token', newPassword, confirmPassword: newPassword })
                .expect(401);
        });

        it('should change password successfully', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            const loginResponse = await request
                .post(`${API_BASE_URL}/auth/login`)
                .send({ email: testUser.email, password: testUser.password });

            const { accessToken } = extractTokens(loginResponse);

            const newPassword = faker.internet.password({ length: 12 });

            const response = await request
                .post(`${API_BASE_URL}/auth/change-password`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ currentPassword: testUser.password, newPassword, confirmPassword: newPassword })
                .expect(200);

            expect(response.body.message).toBe('Password changed successfully');

            // Verify that the password has been changed
            const updatedUser = await UserModel.findByEmail(testUser.email);
            const isPasswordValid = await comparePasswords(newPassword, updatedUser!.passwordHash || '');
            expect(isPasswordValid).toBe(true);

            // Clean up the test user
            await clearTestData([user.id]);
        });

        it('should return 401 when changing password with invalid current password', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            const loginResponse = await request
                .post(`${API_BASE_URL}/auth/login`)
                .send({ email: testUser.email, password: testUser.password });

            const { accessToken } = extractTokens(loginResponse);

            const newPassword = faker.internet.password({ length: 12 });

            await request
                .post(`${API_BASE_URL}/auth/change-password`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ currentPassword: 'wrong-password', newPassword, confirmPassword: newPassword })
                .expect(401);

            // Clean up the test user
            await clearTestData([user.id]);
        });
    });

    describe('Email Verification', () => {
        it('should verify email with valid token', async () => {
            const testUser = generateTestUser({ isVerified: false, status: UserStatus.PENDING });
            const user = await UserModel.create(testUser);

            // Generate verification token
            const verificationToken = await TokenModel.findByUserAndType(user.id, TokenType.VERIFICATION);

            const response = await request
                .post(`${API_BASE_URL}/auth/verify-email`)
                .send({ token: verificationToken!.token })
                .expect(200);

            expect(response.body.user.isVerified).toBe(true);
            expect(response.body.message).toBe('Email verified successfully');

            // Clean up the test user
            await clearTestData([user.id]);
        });

        it('should return 401 with invalid verification token', async () => {
            await request
                .post(`${API_BASE_URL}/auth/verify-email`)
                .send({ token: 'invalid-verification-token' })
                .expect(401);
        });

        it('should resend verification email successfully', async () => {
            const testUser = generateTestUser({ isVerified: false, status: UserStatus.PENDING });
            const user = await UserModel.create(testUser);

            const response = await request
                .post(`${API_BASE_URL}/auth/resend-verification`)
                .send({ email: testUser.email })
                .expect(200);

            expect(response.body.message).toBe('If an account with that email exists and requires verification, we have sent a verification link.');

            // Clean up the test user
            await clearTestData([user.id]);
        });
    });

    describe('Social Authentication', () => {
        it('should authenticate with valid social token', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            const response = await request
                .post(`${API_BASE_URL}/auth/social-auth`)
                .send({ provider: AuthProvider.GOOGLE, token: 'valid-social-token', email: testUser.email })
                .expect(200);

            expect(response.body.user).toBeDefined();
            expect(response.body.tokens).toBeDefined();
            expect(response.body.user.email).toBe(testUser.email);

            // Clean up the test user
            await clearTestData([user.id]);
        });

        it('should return 401 with invalid social token', async () => {
            await request
                .post(`${API_BASE_URL}/auth/social-auth`)
                .send({ provider: AuthProvider.GOOGLE, token: 'invalid-social-token' })
                .expect(401);
        });

        it('should link accounts when email already exists', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            const response = await request
                .post(`${API_BASE_URL}/auth/social-auth`)
                .send({ provider: AuthProvider.GOOGLE, token: 'valid-social-token', email: testUser.email })
                .expect(200);

            expect(response.body.user).toBeDefined();
            expect(response.body.tokens).toBeDefined();
            expect(response.body.user.email).toBe(testUser.email);

            // Clean up the test user
            await clearTestData([user.id]);
        });
    });

    describe('Protected Routes', () => {
        it('should access protected route with valid token', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            const loginResponse = await request
                .post(`${API_BASE_URL}/auth/login`)
                .send({ email: testUser.email, password: testUser.password });

            const { accessToken } = extractTokens(loginResponse);

            const response = await request
                .get(`${API_BASE_URL}/auth/me`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe(testUser.email);

            // Clean up the test user
            await clearTestData([user.id]);
        });

        it('should return 401 for protected route with invalid token', async () => {
            await request
                .get(`${API_BASE_URL}/auth/me`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return 403 for admin route with non-admin user', async () => {
            const testUser = generateTestUser();
            const user = await UserModel.create(testUser);

            const loginResponse = await request
                .post(`${API_BASE_URL}/auth/login`)
                .send({ email: testUser.email, password: testUser.password });

            const { accessToken } = extractTokens(loginResponse);

            await request
                .get(`${API_BASE_URL}/auth/admin/users`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(403);

            // Clean up the test user
            await clearTestData([user.id]);
        });
    });
});