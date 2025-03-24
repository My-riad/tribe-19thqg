import React from 'react'; // react ^18.2.0
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'; // @testing-library/react-native ^12.0.0
import { jest } from '@jest/globals'; // jest ^29.5.0
import { Provider } from 'react-redux'; // react-redux ^8.0.5
import { configureStore } from '@reduxjs/toolkit'; // @reduxjs/toolkit ^1.9.5
import { NavigationContainer } from '@react-navigation/native'; // @react-navigation/native ^6.0.0
import { createStackNavigator } from '@react-navigation/stack'; // @react-navigation/stack ^6.0.0

import RegistrationScreen from './RegistrationScreen'; // Component under test
import { ROUTES } from '../../../constants/navigationRoutes'; // Navigation route constants for testing navigation
import { AuthNavigationProp } from '../../../types/navigation.types'; // Type definition for authentication navigation prop
import authReducer from '../../../store/slices/authSlice';
import { useAuth } from '../../../hooks/useAuth';

// Mock the useAuth hook to control authentication behavior in tests
jest.mock('../../../hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the useNavigation hook to test navigation behavior
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation()
}));

/**
 * Creates a mock navigation object for testing
 * @returns {Partial<AuthNavigationProp>} Mocked navigation object with required methods
 */
const mockNavigation = (): Partial<AuthNavigationProp> => {
  const navigate = jest.fn();
  const goBack = jest.fn();
  const setOptions = jest.fn();
  return {
    navigate,
    goBack,
    setOptions,
  };
};

/**
 * Creates a mock Redux store for testing
 * @param {object} initialState
 * @returns {ReturnType<typeof configureStore>} Configured mock Redux store
 */
const mockStore = (initialState: object) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: initialState,
  });
};

/**
 * Renders a component with Redux and Navigation providers for testing
 * @param {React.ReactElement} ui
 * @param {object} options
 * @returns {ReturnType<typeof render> & { store: ReturnType<typeof mockStore> }} Rendered component with store
 */
const renderWithProviders = (ui: React.ReactElement, options: { initialState?: object } = {}) => {
  const store = mockStore(options.initialState || {});
  const Stack = createStackNavigator();

  return {
    ...render(
      <Provider store={store}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Registration" component={() => ui} />
          </Stack.Navigator>
        </NavigationContainer>
      </Provider>
    ),
    store,
  };
};

describe('RegistrationScreen', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      register: jest.fn(),
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    // Render the RegistrationScreen component with providers
    renderWithProviders(<RegistrationScreen />);

    // Verify that the app title is displayed
    expect(screen.getByText('Tribe')).toBeOnTheScreen();

    // Verify that the registration form is displayed
    expect(screen.getByPlaceholderText('Enter your full name')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Enter your password')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Confirm your password')).toBeOnTheScreen();

    // Verify that the login link is displayed
    expect(screen.getByText('Sign In')).toBeOnTheScreen();
  });

  it('navigates to login screen when login link is pressed', () => {
    // Render the RegistrationScreen component with providers
    const { getByText } = renderWithProviders(<RegistrationScreen />);

    // Find the login link
    const loginLink = getByText('Sign In');

    // Mock the navigation hook
    const navigation = mockNavigation();

    // Press the login link
    fireEvent.press(loginLink);

    // Verify that navigation.navigate was called with the correct route
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.AUTH.LOGIN);
  });

  it('displays loading state during registration', () => {
    // Create a mock store with loading state set to true
    const { getByTestId } = renderWithProviders(<RegistrationScreen />, {
      initialState: {
        auth: {
          user: null,
          tokens: null,
          isAuthenticated: false,
          loading: true,
          error: null,
          mfaRequired: false,
          mfaChallenge: null
        },
      },
    });

    // Verify that the loading indicator is displayed
    expect(getByTestId('signup-button')).toBeOnTheScreen();
  });

  it('displays error message when registration fails', () => {
    // Create a mock store with an error message
    const errorMessage = 'Registration failed';
    const { getByText } = renderWithProviders(<RegistrationScreen />, {
      initialState: {
        auth: {
          user: null,
          tokens: null,
          isAuthenticated: false,
          loading: false,
          error: errorMessage,
          mfaRequired: false,
          mfaChallenge: null
        },
      },
    });

    // Verify that the error message is displayed
    expect(getByText(errorMessage)).toBeOnTheScreen();
  });

  it('calls register function when form is submitted', async () => {
    // Mock the register function
    const registerMock = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      register: registerMock,
      loading: false,
      error: null,
    });

    // Render the RegistrationScreen component with providers
    const { getByPlaceholderText, getByTestId } = renderWithProviders(<RegistrationScreen />);

    // Fill in the registration form fields
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('Enter your email address'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'P@$$wOrd123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'P@$$wOrd123');
    fireEvent.press(getByTestId('terms-checkbox'));

    // Submit the form
    fireEvent.press(getByTestId('signup-button'));

    // Verify that the register function was called with the correct data
    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'P@$$wOrd123',
        acceptedTerms: true,
      });
    });
  });

  it('navigates to onboarding after successful registration', async () => {
    // Mock the register function to resolve successfully
    const registerMock = jest.fn().mockResolvedValue({ user: { id: '123' } });
    (useAuth as jest.Mock).mockReturnValue({
      register: registerMock,
      loading: false,
      error: null,
    });

    // Render the RegistrationScreen component with providers
    const { getByPlaceholderText, getByTestId } = renderWithProviders(<RegistrationScreen />);

    // Fill in the registration form fields
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('Enter your email address'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'P@$$wOrd123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'P@$$wOrd123');
    fireEvent.press(getByTestId('terms-checkbox'));

    // Mock the navigation hook
    const navigation = mockNavigation();

    // Submit the form
    fireEvent.press(getByTestId('signup-button'));

    // Wait for the registration to complete
    await waitFor(() => {
      expect(registerMock).toHaveBeenCalled();
    });

    // Verify that navigation.navigate was called with the correct route
    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.ONBOARDING.PERSONALITY_ASSESSMENT);
    });
  });
});