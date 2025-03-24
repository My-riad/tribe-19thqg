import React from 'react'; // react v18.2.0
import { render, fireEvent, waitFor } from '@testing-library/react-native'; // @testing-library/react-native v12.0.0
import { act } from 'react-test-renderer'; // react-test-renderer v18.2.0

import RegistrationForm from './RegistrationForm';
import { useAuth } from '../../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

describe('RegistrationForm', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    (useAuth as jest.Mock).mockReset();

    // Set up a default mock implementation for useAuth
    (useAuth as jest.Mock).mockReturnValue({
      register: jest.fn(),
      loading: false,
      error: null
    });
  });

  // Helper function to render the component with specific props
  const renderWithProps = (props = {}) => render(<RegistrationForm {...props} />);

  // Helper function to fill the registration form with test data
  const fillForm = (screen: any, { name, email, password, confirmPassword, acceptTerms } = {}) => {
    if (name) {
      const nameInput = screen.getByAccessibilityLabel('Full Name');
      fireEvent.changeText(nameInput, name);
    }
    if (email) {
      const emailInput = screen.getByAccessibilityLabel('Email Address');
      fireEvent.changeText(emailInput, email);
    }
    if (password) {
      const passwordInput = screen.getByAccessibilityLabel('Password');
      fireEvent.changeText(passwordInput, password);
    }
    if (confirmPassword) {
      const confirmPasswordInput = screen.getByAccessibilityLabel('Confirm Password');
      fireEvent.changeText(confirmPasswordInput, confirmPassword);
    }
    if (acceptTerms !== undefined) {
      const termsCheckbox = screen.getByAccessibilityLabel('Accept Terms and Conditions');
      if (acceptTerms) {
        fireEvent.press(termsCheckbox);
      }
    }
  };

  it('renders correctly', () => {
    const { getByAccessibilityLabel } = renderWithProps();

    expect(getByAccessibilityLabel('Full Name')).toBeDefined();
    expect(getByAccessibilityLabel('Email Address')).toBeDefined();
    expect(getByAccessibilityLabel('Password')).toBeDefined();
    expect(getByAccessibilityLabel('Confirm Password')).toBeDefined();
    expect(getByAccessibilityLabel('Accept Terms and Conditions')).toBeDefined();
    expect(getByAccessibilityLabel('Sign Up')).toBeDefined();
  });

  it('validates required fields', async () => {
    const { getByTestId, findByText } = renderWithProps();
    const signupButton = getByTestId('signup-button');

    fireEvent.press(signupButton);

    expect(await findByText('This field is required.')).toBeDefined();
  });

  it('validates email format', async () => {
    const { getByTestId, findByText } = renderWithProps();
    const signupButton = getByTestId('signup-button');

    const { getByAccessibilityLabel } = renderWithProps();
    const emailInput = getByAccessibilityLabel('Email Address');
    fireEvent.changeText(emailInput, 'invalid-email');

    fireEvent.press(signupButton);

    expect(await findByText('Please enter a valid email address.')).toBeDefined();
  });

  it('validates password complexity', async () => {
    const { getByTestId, findByText } = renderWithProps();
    const signupButton = getByTestId('signup-button');

    const { getByAccessibilityLabel } = renderWithProps();
    const passwordInput = getByAccessibilityLabel('Password');
    fireEvent.changeText(passwordInput, 'weak');

    fireEvent.press(signupButton);

    expect(await findByText('Password must be at least 10 characters long and include uppercase, lowercase, number, and special character.')).toBeDefined();
  });

  it('validates password matching', async () => {
    const { getByTestId, findByText } = renderWithProps();
    const signupButton = getByTestId('signup-button');

    const { getByAccessibilityLabel } = renderWithProps();
    const passwordInput = getByAccessibilityLabel('Password');
    fireEvent.changeText(passwordInput, 'P@sswOrd123');
    const confirmPasswordInput = getByAccessibilityLabel('Confirm Password');
    fireEvent.changeText(confirmPasswordInput, 'DifferentP@sswOrd');

    fireEvent.press(signupButton);

    expect(await findByText('Passwords do not match.')).toBeDefined();
  });

  it('validates terms acceptance', async () => {
    const { getByTestId, findByText } = renderWithProps();
    const signupButton = getByTestId('signup-button');

    fillForm(renderWithProps(), {
      name: 'Test User',
      email: 'test@example.com',
      password: 'P@sswOrd123',
      confirmPassword: 'P@sswOrd123',
      acceptTerms: false
    });

    fireEvent.press(signupButton);

    expect(await findByText('You must accept the terms and conditions.')).toBeDefined();
  });

  it('submits form with valid data', async () => {
    const { getByTestId } = renderWithProps();
    const signupButton = getByTestId('signup-button');

    const mockRegister = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      loading: false,
      error: null
    });

    const { getByAccessibilityLabel } = renderWithProps();
    const nameInput = getByAccessibilityLabel('Full Name');
    fireEvent.changeText(nameInput, 'Test User');
    const emailInput = getByAccessibilityLabel('Email Address');
    fireEvent.changeText(emailInput, 'test@example.com');
    const passwordInput = getByAccessibilityLabel('Password');
    fireEvent.changeText(passwordInput, 'P@sswOrd123');
    const confirmPasswordInput = getByAccessibilityLabel('Confirm Password');
    fireEvent.changeText(confirmPasswordInput, 'P@sswOrd123');
    const termsCheckbox = getByAccessibilityLabel('Accept Terms and Conditions');
    fireEvent.press(termsCheckbox);

    fireEvent.press(signupButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'P@sswOrd123',
        acceptedTerms: true,
      });
    });
  });

  it('shows loading state during submission', () => {
    (useAuth as jest.Mock).mockReturnValue({
      register: jest.fn(),
      loading: true,
      error: null
    });

    const { getByTestId } = renderWithProps();
    const signupButton = getByTestId('signup-button');

    expect(signupButton.props.isLoading).toBe(true);
  });

  it('displays API error message', () => {
    (useAuth as jest.Mock).mockReturnValue({
      register: jest.fn(),
      loading: false,
      error: 'API Error Message'
    });

    const { findByText } = renderWithProps();

    waitFor(() => {
      expect(findByText('API Error Message')).toBeDefined();
    });
  });

  it('calls onSuccess callback after successful registration', async () => {
    const onSuccess = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      register: jest.fn().mockImplementation(() => Promise.resolve()),
      loading: false,
      error: null
    });

    const { getByTestId } = renderWithProps({ onSuccess });
    const signupButton = getByTestId('signup-button');

    fillForm(renderWithProps(), {
      name: 'Test User',
      email: 'test@example.com',
      password: 'P@sswOrd123',
      confirmPassword: 'P@sswOrd123',
      acceptTerms: true
    });

    fireEvent.press(signupButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});