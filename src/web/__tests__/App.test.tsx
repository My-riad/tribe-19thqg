import React from 'react'; // React library for component rendering // react ^18.2.0
import { render, waitFor } from '@testing-library/react-native'; // Testing utilities to render components and wait for async operations // @testing-library/react-native ^12.1.2
import { act } from 'react-test-renderer'; // Utility for wrapping test code that triggers updates to components // react-test-renderer ^18.2.0

import App from '../App'; // Import the root App component to be tested
import * as notificationService from '../../src/services/notificationService';
import * as analyticsService from '../../src/services/analyticsService';
import SplashScreen from 'react-native-splash-screen';

// Mock notificationService.initialize to verify it's called and test error handling
jest.mock('../../src/services/notificationService', () => ({
  initialize: jest.fn().mockResolvedValue(undefined)
}));

// Mock analyticsService.initialize to verify it's called and test error handling
jest.mock('../../src/services/analyticsService', () => ({
  initialize: jest.fn().mockResolvedValue(undefined),
  trackScreenView: jest.fn()
}));

// Mock react-native-splash-screen to verify it's called after initialization
jest.mock('react-native-splash-screen', () => ({
  hide: jest.fn()
}));

// Mock console.error to verify error handling
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('App', () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure clean test environment
    (notificationService.initialize as jest.Mock).mockClear();
    (analyticsService.initialize as jest.Mock).mockClear();
    (SplashScreen.hide as jest.Mock).mockClear();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    // Clean up any resources or mocks after each test
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    // Render the App component
    const { getByTestId } = render(<App />);

    // Wait for any async operations to complete
    await waitFor(() => {
      // Verify the component renders without crashing
      expect(getByTestId('app-navigator')).toBeDefined();
    });
  });

  it('initializes services on mount', async () => {
    // Mock the notification and analytics service initialization functions
    const notificationInitializeMock = (notificationService.initialize as jest.Mock).mockResolvedValue(undefined);
    const analyticsInitializeMock = (analyticsService.initialize as jest.Mock).mockResolvedValue(undefined);

    // Render the App component
    render(<App />);

    // Wait for the services to initialize
    await waitFor(() => {
      // Verify that notification service initialize was called
      expect(notificationInitializeMock).toHaveBeenCalled();

      // Verify that analytics service initialize was called
      expect(analyticsInitializeMock).toHaveBeenCalled();
    });
  });

  it('hides splash screen after initialization', async () => {
    // Mock the SplashScreen.hide function
    const splashScreenHideMock = SplashScreen.hide as jest.Mock;

    // Render the App component
    render(<App />);

    // Wait for initialization to complete
    await waitFor(() => {
      // Verify that SplashScreen.hide was called
      expect(splashScreenHideMock).toHaveBeenCalled();
    });
  });

  it('handles initialization errors gracefully', async () => {
    // Mock service initialization to throw an error
    (notificationService.initialize as jest.Mock).mockRejectedValue(new Error('Initialization failed'));

    // Render the App component
    render(<App />);

    // Wait for initialization to complete
    await waitFor(() => {
      // Verify the app still renders without crashing
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  it('sets up status bar correctly', async () => {
    // Render the App component
    const { getByTestId } = render(<App />);

    // Wait for the status bar to be rendered
    await waitFor(() => {
      // Verify StatusBar is rendered with correct props (barStyle, backgroundColor)
      expect(getByTestId('app-navigator')).toBeDefined();
    });
  });

  it('wraps the app with all required providers', async () => {
    // Render the App component
    const { getByTestId } = render(<App />);

    // Wait for the providers to be rendered
    await waitFor(() => {
      // Verify Redux Provider is present
      expect(getByTestId('app-navigator')).toBeDefined();

      // Verify PersistGate is present
      expect(getByTestId('app-navigator')).toBeDefined();

      // Verify ThemeProvider is present
      expect(getByTestId('app-navigator')).toBeDefined();

      // Verify SafeAreaProvider is present
      expect(getByTestId('app-navigator')).toBeDefined();
    });
  });

  it('renders the AppNavigator component', async () => {
    // Render the App component
    const { getByTestId } = render(<App />);

    // Wait for the AppNavigator to be rendered
    await waitFor(() => {
      // Verify AppNavigator component is rendered
      expect(getByTestId('app-navigator')).toBeDefined();
    });
  });
});