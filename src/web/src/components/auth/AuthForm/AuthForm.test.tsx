import React from 'react'; // react ^18.2.0
import { render, fireEvent, waitFor } from '@testing-library/react-native'; // @testing-library/react-native ^12.0.0
import { act } from 'react-test-renderer'; // react-test-renderer ^18.2.0

import AuthForm from './AuthForm';
import { useAuth } from '../../../hooks/useAuth';

// Mock the useAuth hook to control authentication behavior in tests
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the SocialAuthButtons component to test social authentication
jest.mock('../SocialAuthButtons', () => {
  return {
    __esModule: true,
    default: () => <></>, // Mock implementation
  };
});

describe('AuthForm', () => {
  beforeEach(() => {
    // Clear all mocks to ensure clean test environment
    jest.clearAllMocks();
    // Reset any mock implementations to default behavior
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      mfaRequired: false,
      mfaChallenge: null,
      login: jest.fn(),
      register: jest.fn(),
      socialLogin: jest.fn(),
      logout: jest.fn(),
      verifyMFA: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      checkAuthStatus: jest.fn(),
    });
  });

  test('renders login form', () => {
    // Render the AuthForm component with formType='login'
    const { getByPlaceholderText, getByText } = render(<AuthForm formType="login" />);
    // Verify that email input is present
    expect(getByPlaceholderText('Enter email')).toBeTruthy();
    // Verify that password input is present
    expect(getByPlaceholderText('Enter password')).toBeTruthy();
    // Verify that login button is present with correct text
    expect(getByText('Sign In')).toBeTruthy();
    // Verify that social authentication buttons are present
    expect(getByText('OR')).toBeTruthy();
  });

  test('renders registration form', () => {
    // Render the AuthForm component with formType='register'
    const { getByPlaceholderText, getByText } = render(<AuthForm formType="register" />);
    // Verify that name input is present
    expect(getByPlaceholderText('Enter name')).toBeTruthy();
    // Verify that email input is present
    expect(getByPlaceholderText('Enter email')).toBeTruthy();
    // Verify that password input is present
    expect(getByPlaceholderText('Enter password')).toBeTruthy();
    // Verify that confirm password input is present
    expect(getByPlaceholderText('Confirm password')).toBeTruthy();
    // Verify that register button is present with correct text
    expect(getByText('Sign Up')).toBeTruthy();
    // Verify that social authentication buttons are present
    expect(getByText('OR')).toBeTruthy();
  });

  test('handles login submission', async () => {
    // Mock the login function to resolve successfully
    const loginMock = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      ...((useAuth as jest.Mock).mock.results[0]?.value || {}),
      login: loginMock,
      loading: false,
      error: null,
    });
    // Render the AuthForm component with formType='login'
    const { getByPlaceholderText, getByText } = render(<AuthForm formType="login" />);
    // Fill in the email input with valid email
    fireEvent.changeText(getByPlaceholderText('Enter email'), 'test@example.com');
    // Fill in the password input with valid password
    fireEvent.changeText(getByPlaceholderText('Enter password'), 'Password123!');
    // Press the login button
    fireEvent.press(getByText('Sign In'));
    // Verify that login function was called with correct credentials
    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: false,
      });
    });
  });

  test('handles registration submission', async () => {
    // Mock the register function to resolve successfully
    const registerMock = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      ...((useAuth as jest.Mock).mock.results[0]?.value || {}),
      register: registerMock,
      loading: false,
      error: null,
    });
    // Render the AuthForm component with formType='register'
    const { getByPlaceholderText, getByText } = render(<AuthForm formType="register" />);
    // Fill in the name input with valid name
    fireEvent.changeText(getByPlaceholderText('Enter name'), 'Test User');
    // Fill in the email input with valid email
    fireEvent.changeText(getByPlaceholderText('Enter email'), 'test@example.com');
    // Fill in the password input with valid password
    fireEvent.changeText(getByPlaceholderText('Enter password'), 'Password123!');
    // Fill in the confirm password input with matching password
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'Password123!');
    // Press the register button
    fireEvent.press(getByText('Sign Up'));
    // Verify that register function was called with correct data
    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
        acceptedTerms: false,
      });
    });
  });

  test('validates login form', async () => {
    // Render the AuthForm component with formType='login'
    const { getByText, findByText, getByPlaceholderText } = render(<AuthForm formType="login" />);
    // Press the login button without filling inputs
    fireEvent.press(getByText('Sign In'));
    // Verify that validation error messages are displayed
    expect(await findByText('This field is required.')).toBeTruthy();
    // Fill in the email input with invalid email
    fireEvent.changeText(getByPlaceholderText('Enter email'), 'invalid-email');
    // Verify that email validation error is displayed
    expect(await findByText('Please enter a valid email address.')).toBeTruthy();
    // Fill in the password input with invalid password
    fireEvent.changeText(getByPlaceholderText('Enter password'), 'short');
    // Verify that password validation error is displayed
    expect(await findByText('Password must be at least 10 characters long and include uppercase, lowercase, number, and special character.')).toBeTruthy();
  });

  test('validates registration form', async () => {
    // Render the AuthForm component with formType='register'
    const { getByText, findByText, getByPlaceholderText } = render(<AuthForm formType="register" />);
    // Press the register button without filling inputs
    fireEvent.press(getByText('Sign Up'));
    // Verify that validation error messages are displayed
    expect(await findByText('This field is required.')).toBeTruthy();
    // Fill in the email input with invalid email
    fireEvent.changeText(getByPlaceholderText('Enter email'), 'invalid-email');
    // Verify that email validation error is displayed
    expect(await findByText('Please enter a valid email address.')).toBeTruthy();
    // Fill in the password input with invalid password
    fireEvent.changeText(getByPlaceholderText('Enter password'), 'short');
    // Verify that password validation error is displayed
    expect(await findByText('Password must be at least 10 characters long and include uppercase, lowercase, number, and special character.')).toBeTruthy();
    // Fill in the confirm password with non-matching password
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'notmatching');
    // Verify that password match validation error is displayed
    expect(await findByText('Passwords do not match.')).toBeTruthy();
  });

  test('displays authentication errors', () => {
    // Mock the useAuth hook to return an error state
    (useAuth as jest.Mock).mockReturnValue({
      ...((useAuth as jest.Mock).mock.results[0]?.value || {}),
      error: 'Invalid credentials',
    });
    // Render the AuthForm component
    const { getByText } = render(<AuthForm formType="login" />);
    // Verify that the error message is displayed
    expect(getByText('Invalid credentials')).toBeTruthy();
  });

  test('handles MFA verification', async () => {
    // Mock the useAuth hook to return mfaRequired=true and mfaChallenge
    const verifyMFAMock = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      ...((useAuth as jest.Mock).mock.results[0]?.value || {}),
      mfaRequired: true,
      mfaChallenge: { challengeId: '123', method: 'email', destination: 'test@example.com', expiresAt: Date.now() + 300000 },
      verifyMFA: verifyMFAMock,
      loading: false,
      error: null,
    });
    // Render the AuthForm component
    const { getByPlaceholderText, getByText } = render(<AuthForm formType="login" />);
    // Verify that MFA verification form is displayed
    expect(getByText('Verify MFA')).toBeTruthy();
    // Fill in the MFA code input
    fireEvent.changeText(getByPlaceholderText('Enter code'), '123456');
    // Press the verify button
    fireEvent.press(getByText('Verify'));
    // Verify that verifyMFA function was called with correct data
    await waitFor(() => {
      expect(verifyMFAMock).toHaveBeenCalledWith({ challengeId: '123', code: '123456' });
    });
  });

  test('toggles between login and registration', () => {
    // Create a mock function for onToggleForm callback
    const onToggleFormMock = jest.fn();
    // Render the AuthForm component with formType='login' and onToggleForm prop
    const { getByText } = render(<AuthForm formType="login" onToggleForm={onToggleFormMock} />);
    // Press the toggle link (e.g., 'Create an account')
    fireEvent.press(getByText('Don\'t have an account? Create one'));
    // Verify that onToggleForm callback was called
    expect(onToggleFormMock).toHaveBeenCalled();
  });

  test('handles social authentication', async () => {
    // Mock the SocialAuthButtons component to simulate successful social authentication
    const onSuccessMock = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      ...((useAuth as jest.Mock).mock.results[0]?.value || {}),
      socialLogin: jest.fn().mockResolvedValue(undefined),
      loading: false,
      error: null,
    });
    // Render the AuthForm component
    const { getByText } = render(<AuthForm formType="login" onSuccess={onSuccessMock} />);
    // Simulate successful social authentication
    await act(async () => {
      fireEvent.press(getByText('OR'));
    });
    // Verify that onSuccess callback was called if provided
    expect(onSuccessMock).toHaveBeenCalled();
  });
});