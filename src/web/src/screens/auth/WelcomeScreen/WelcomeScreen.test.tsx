import React from 'react'; // React library for component rendering // react ^18.2.0
import { render, fireEvent, waitFor } from '@testing-library/react-native'; // Testing utilities for rendering components and simulating user interactions // @testing-library/react-native ^12.1.2
import WelcomeScreen from './WelcomeScreen'; // Import the WelcomeScreen component to be tested
import { ROUTES } from '../../../constants/navigationRoutes'; // Import navigation route constants for testing navigation
import { useNavigation } from '@react-navigation/native'; // Hook for navigation functionality // @react-navigation/native ^6.0.0
import { useAuth } from '../../../hooks/useAuth'; // Hook for authentication state and functionality

// Mock the useNavigation and useAuth hooks for testing
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the navigation object with navigate function
const navigationMock = {
  navigate: jest.fn(),
};

describe('WelcomeScreen', () => { // Test suite for the WelcomeScreen component
  beforeEach(() => { // Setup function that runs before each test
    jest.clearAllMocks(); // Reset all mocks before each test

    (useNavigation as jest.Mock).mockReturnValue(navigationMock); // Setup default mock implementations
    (useAuth as jest.Mock).mockReturnValue({ loading: false });
  });

  it('renders correctly with all elements', () => { // Individual test cases for WelcomeScreen component
    const { getByText, getByTestId, getByAltText } = render(<WelcomeScreen />); // Render WelcomeScreen component

    expect(getByAltText('Tribe App Logo')).toBeDefined(); // Verify app logo is displayed
    expect(getByText('Tribe')).toBeDefined(); // Verify app title 'TRIBE' is displayed
    expect(getByText('Meaningful connections in your local community')).toBeDefined(); // Verify app tagline about meaningful connections is displayed
    expect(getByText('Sign up with Email')).toBeDefined(); // Verify 'Continue with Email' button is displayed
    expect(getByTestId('social-auth-buttons')).toBeDefined(); // Verify social authentication buttons are displayed
    expect(getByText('Already have an account? Sign In')).toBeDefined(); // Verify 'Already have an account? Sign In' text is displayed
  });

  it('navigates to registration screen when email button is pressed', async () => { // Individual test cases for WelcomeScreen component
    const { getByText } = render(<WelcomeScreen />); // Render WelcomeScreen component
    const emailButton = getByText('Sign up with Email'); // Find 'Continue with Email' button

    fireEvent.press(emailButton); // Simulate press on the button

    await waitFor(() => {
      expect(navigationMock.navigate).toHaveBeenCalledWith(ROUTES.AUTH.REGISTRATION); // Verify navigation.navigate was called with ROUTES.AUTH.REGISTRATION
    });
  });

  it('navigates to login screen when sign in link is pressed', async () => { // Individual test cases for WelcomeScreen component
    const { getByText } = render(<WelcomeScreen />); // Render WelcomeScreen component
    const signInLink = getByText('Already have an account? Sign In'); // Find 'Sign In' text

    fireEvent.press(signInLink); // Simulate press on the text

    await waitFor(() => {
      expect(navigationMock.navigate).toHaveBeenCalledWith(ROUTES.AUTH.LOGIN); // Verify navigation.navigate was called with ROUTES.AUTH.LOGIN
    });
  });

  it('displays loading state correctly', () => { // Individual test cases for WelcomeScreen component
    (useAuth as jest.Mock).mockReturnValue({ loading: true }); // Mock useAuth hook to return loading: true
    const { getByText } = render(<WelcomeScreen />); // Render WelcomeScreen component

    expect(getByText('Sign up with Email').props.disabled).toBe(true); // Verify buttons are in loading state or disabled
  });

  it('has correct accessibility properties', () => { // Individual test cases for WelcomeScreen component
    const { getByText } = render(<WelcomeScreen />); // Render WelcomeScreen component
    const emailButton = getByText('Sign up with Email'); // Verify buttons have appropriate accessibility labels
    expect(emailButton.props['accessibilityRole']).toBe('button'); // Verify text elements have appropriate accessibility roles
  });
});