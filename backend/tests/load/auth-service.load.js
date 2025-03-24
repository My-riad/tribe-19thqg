import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Base URL for the authentication service
const BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Load test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users over 30 seconds
    { duration: '1m', target: 50 },    // Ramp up to 50 users over 1 minute
    { duration: '30s', target: 100 },  // Ramp up to 100 users over 30 seconds
    { duration: '1m', target: 50 },    // Ramp down to 50 users over 1 minute
    { duration: '30s', target: 0 },    // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should complete within 500ms
    'http_req_failed': ['rate<0.01'],   // Less than 1% of requests should fail
    'checks': ['rate>0.95'],            // 95% of our checks should pass
  },
};

// Custom metrics for tracking different authentication operations
const registerTrend = new Trend('register_duration');
const loginTrend = new Trend('login_duration');
const refreshTokenTrend = new Trend('refresh_token_duration');
const validateTokenTrend = new Trend('validate_token_duration');
const logoutTrend = new Trend('logout_duration');
const socialAuthTrend = new Trend('social_auth_duration');
const requestPasswordResetTrend = new Trend('request_password_reset_duration');
const resetPasswordTrend = new Trend('reset_password_duration');

/**
 * Generates random user data for testing
 * @returns {object} Random user data with email, password, and name
 */
function generateRandomUser() {
  const randomString = Math.random().toString(36).substring(2, 15);
  return {
    email: `test_${randomString}@example.com`,
    password: `Test${randomString}!123`,  // Ensures password complexity requirements
    name: `Test User ${randomString}`
  };
}

/**
 * Generates random social authentication data for testing
 * @returns {object} Random social auth data with provider and token
 */
function generateSocialAuthData() {
  const providers = ['GOOGLE', 'APPLE', 'FACEBOOK'];
  const randomProvider = providers[Math.floor(Math.random() * providers.length)];
  return {
    provider: randomProvider,
    token: `mock_token_${Math.random().toString(36).substring(2, 15)}`
  };
}

/**
 * Performs a user registration request
 * @param {object} userData - User data for registration
 * @returns {object} Response object from the registration request
 */
function registerUser(userData) {
  const response = http.post(`${BASE_URL}/auth/register`, JSON.stringify(userData), {
    headers: { 'Content-Type': 'application/json' },
  });
  registerTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a user login request
 * @param {object} credentials - Login credentials
 * @returns {object} Response object from the login request
 */
function loginUser(credentials) {
  const response = http.post(`${BASE_URL}/auth/login`, JSON.stringify(credentials), {
    headers: { 'Content-Type': 'application/json' },
  });
  loginTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a token refresh request
 * @param {string} refreshToken - Refresh token to use
 * @returns {object} Response object from the token refresh request
 */
function refreshToken(refreshToken) {
  const response = http.post(`${BASE_URL}/auth/refresh`, JSON.stringify({ refreshToken }), {
    headers: { 'Content-Type': 'application/json' },
  });
  refreshTokenTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a token validation request
 * @param {string} accessToken - Access token to validate
 * @returns {object} Response object from the token validation request
 */
function validateToken(accessToken) {
  const response = http.get(`${BASE_URL}/auth/verify`, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}` 
    },
  });
  validateTokenTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a user logout request
 * @param {string} refreshToken - Refresh token to invalidate
 * @param {string} accessToken - Access token for authorization
 * @returns {object} Response object from the logout request
 */
function logoutUser(refreshToken, accessToken) {
  const response = http.post(`${BASE_URL}/auth/logout`, JSON.stringify({ refreshToken }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}` 
    },
  });
  logoutTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a social authentication request
 * @param {object} socialAuthData - Social auth provider and token
 * @returns {object} Response object from the social auth request
 */
function socialAuth(socialAuthData) {
  const response = http.post(`${BASE_URL}/auth/social`, JSON.stringify(socialAuthData), {
    headers: { 'Content-Type': 'application/json' },
  });
  socialAuthTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a password reset request
 * @param {string} email - Email address for password reset
 * @returns {object} Response object from the password reset request
 */
function requestPasswordReset(email) {
  const response = http.post(`${BASE_URL}/auth/password/reset`, JSON.stringify({ email }), {
    headers: { 'Content-Type': 'application/json' },
  });
  requestPasswordResetTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a password reset confirmation request
 * @param {string} token - Reset token from email
 * @param {string} newPassword - New password to set
 * @returns {object} Response object from the password reset confirmation request
 */
function resetPassword(token, newPassword) {
  const response = http.post(`${BASE_URL}/auth/password/update`, JSON.stringify({ token, newPassword }), {
    headers: { 'Content-Type': 'application/json' },
  });
  resetPasswordTrend.add(response.timings.duration);
  return response;
}

/**
 * Test scenario for user registration and login
 */
function registrationScenario() {
  // Generate random user data
  const userData = generateRandomUser();
  
  // Register a new user
  const registerResponse = registerUser(userData);
  check(registerResponse, {
    'register status is 200': (r) => r.status === 200,
    'register has access token': (r) => JSON.parse(r.body).accessToken !== undefined,
    'register has refresh token': (r) => JSON.parse(r.body).refreshToken !== undefined,
  });
  
  // Extract tokens from registration response
  let tokens = {};
  try {
    tokens = JSON.parse(registerResponse.body);
  } catch (e) {
    console.error('Failed to parse registration response');
    return;
  }
  
  // Login with the created user
  const loginResponse = loginUser({
    email: userData.email,
    password: userData.password,
  });
  check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login has access token': (r) => JSON.parse(r.body).accessToken !== undefined,
    'login has refresh token': (r) => JSON.parse(r.body).refreshToken !== undefined,
  });
  
  // Extract tokens from login response
  try {
    tokens = JSON.parse(loginResponse.body);
  } catch (e) {
    console.error('Failed to parse login response');
    return;
  }
  
  // Validate the access token
  const validateResponse = validateToken(tokens.accessToken);
  check(validateResponse, {
    'validate token status is 200': (r) => r.status === 200,
  });
  
  // Refresh the token
  const refreshResponse = refreshToken(tokens.refreshToken);
  check(refreshResponse, {
    'refresh token status is 200': (r) => r.status === 200,
    'refresh provides new access token': (r) => JSON.parse(r.body).accessToken !== undefined,
    'refresh provides new refresh token': (r) => JSON.parse(r.body).refreshToken !== undefined,
  });
  
  // Extract new tokens from refresh response
  try {
    tokens = JSON.parse(refreshResponse.body);
  } catch (e) {
    console.error('Failed to parse refresh response');
    return;
  }
  
  // Logout the user
  const logoutResponse = logoutUser(tokens.refreshToken, tokens.accessToken);
  check(logoutResponse, {
    'logout status is 200': (r) => r.status === 200,
  });
  
  // Add a small delay to simulate user behavior
  sleep(1);
}

/**
 * Test scenario for user login with predefined test accounts
 */
function loginScenario() {
  // Use predefined test account
  const testCredentials = {
    email: 'test_user@example.com',
    password: 'Test1234!'
  };
  
  // Login with test credentials
  const loginResponse = loginUser(testCredentials);
  check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login has access token': (r) => JSON.parse(r.body).accessToken !== undefined,
    'login has refresh token': (r) => JSON.parse(r.body).refreshToken !== undefined,
  });
  
  // Extract tokens from login response
  let tokens = {};
  try {
    tokens = JSON.parse(loginResponse.body);
  } catch (e) {
    console.error('Failed to parse login response');
    return;
  }
  
  // Validate the access token
  const validateResponse = validateToken(tokens.accessToken);
  check(validateResponse, {
    'validate token status is 200': (r) => r.status === 200,
  });
  
  // Refresh the token
  const refreshResponse = refreshToken(tokens.refreshToken);
  check(refreshResponse, {
    'refresh token status is 200': (r) => r.status === 200,
    'refresh provides new access token': (r) => JSON.parse(r.body).accessToken !== undefined,
    'refresh provides new refresh token': (r) => JSON.parse(r.body).refreshToken !== undefined,
  });
  
  // Extract new tokens from refresh response
  try {
    tokens = JSON.parse(refreshResponse.body);
  } catch (e) {
    console.error('Failed to parse refresh response');
    return;
  }
  
  // Logout the user
  const logoutResponse = logoutUser(tokens.refreshToken, tokens.accessToken);
  check(logoutResponse, {
    'logout status is 200': (r) => r.status === 200,
  });
  
  // Add a small delay to simulate user behavior
  sleep(1);
}

/**
 * Test scenario for social authentication
 */
function socialAuthScenario() {
  // Generate random social authentication data
  const socialAuthData = generateSocialAuthData();
  
  // Perform social authentication
  const authResponse = socialAuth(socialAuthData);
  check(authResponse, {
    'social auth status is 200': (r) => r.status === 200,
    'social auth has access token': (r) => JSON.parse(r.body).accessToken !== undefined,
    'social auth has refresh token': (r) => JSON.parse(r.body).refreshToken !== undefined,
  });
  
  // Extract tokens from social auth response
  let tokens = {};
  try {
    tokens = JSON.parse(authResponse.body);
  } catch (e) {
    console.error('Failed to parse social auth response');
    return;
  }
  
  // Validate the access token
  const validateResponse = validateToken(tokens.accessToken);
  check(validateResponse, {
    'validate token status is 200': (r) => r.status === 200,
  });
  
  // Refresh the token
  const refreshResponse = refreshToken(tokens.refreshToken);
  check(refreshResponse, {
    'refresh token status is 200': (r) => r.status === 200,
    'refresh provides new access token': (r) => JSON.parse(r.body).accessToken !== undefined,
    'refresh provides new refresh token': (r) => JSON.parse(r.body).refreshToken !== undefined,
  });
  
  // Extract new tokens from refresh response
  try {
    tokens = JSON.parse(refreshResponse.body);
  } catch (e) {
    console.error('Failed to parse refresh response');
    return;
  }
  
  // Logout the user
  const logoutResponse = logoutUser(tokens.refreshToken, tokens.accessToken);
  check(logoutResponse, {
    'logout status is 200': (r) => r.status === 200,
  });
  
  // Add a small delay to simulate user behavior
  sleep(1);
}

/**
 * Test scenario for password reset flow
 */
function passwordResetScenario() {
  // Use predefined test account email
  const testEmail = 'test_user@example.com';
  
  // Request password reset
  const resetRequestResponse = requestPasswordReset(testEmail);
  check(resetRequestResponse, {
    'password reset request status is 200': (r) => r.status === 200,
  });
  
  // Use a mock reset token for testing
  // In a real scenario, this would be sent via email
  const mockResetToken = 'mock_reset_token_for_testing';
  const newPassword = `NewPass${Math.random().toString(36).substring(2, 8)}!123`;
  
  // Reset password with the token
  const resetResponse = resetPassword(mockResetToken, newPassword);
  check(resetResponse, {
    'password reset status is 200': (r) => r.status === 200,
  });
  
  // Try to login with the new password
  // Note: In a real load test, this would likely fail as we're using a mock token
  // This is included for completeness of the flow
  const loginResponse = loginUser({
    email: testEmail,
    password: newPassword,
  });
  
  // Add a small delay to simulate user behavior
  sleep(1);
}

/**
 * Main test function that randomly selects and executes one of the test scenarios
 */
export default function() {
  // Randomly select a scenario to execute
  const scenarioSelector = Math.random();
  
  if (scenarioSelector < 0.4) {
    // 40% chance to run registration scenario
    registrationScenario();
  } else if (scenarioSelector < 0.7) {
    // 30% chance to run login scenario
    loginScenario();
  } else if (scenarioSelector < 0.9) {
    // 20% chance to run social auth scenario
    socialAuthScenario();
  } else {
    // 10% chance to run password reset scenario
    passwordResetScenario();
  }
}