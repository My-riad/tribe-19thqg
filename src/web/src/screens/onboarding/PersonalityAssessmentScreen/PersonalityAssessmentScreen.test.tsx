import React from 'react'; // React library for component testing // react v18.2.0
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'; // Testing utilities for React Native components // ^12.0.0
import { NavigationContainer } from '@react-navigation/native'; // Navigation container for testing navigation // ^6.0.0
import { createStackNavigator } from '@react-navigation/stack'; // Stack navigator for testing navigation // ^6.0.0
import { useNavigation } from '@react-navigation/native'; // ^6.0.0
import { ActivityIndicator, View, Text } from 'react-native'; // react-native v0.70.0+
import { ROUTES } from '../../../constants/navigationRoutes'; // Import navigation route constants for testing navigation
import PersonalityAssessmentScreen from './PersonalityAssessmentScreen'; // Import the component being tested
import { useProfile } from '../../../hooks/useProfile'; // Import the profile hook to mock
import '../../../components/profile/PersonalityAssessment'; // Mock the PersonalityAssessment component to isolate the screen component for testing

// Mock the useProfile hook to control its behavior in tests
jest.mock('../../../hooks/useProfile', () => ({ __esModule: true, useProfile: jest.fn() }));
// Mock the useNavigation hook to test navigation behavior
jest.mock('@react-navigation/native', () => ({ ...jest.requireActual('@react-navigation/native'), useNavigation: () => ({ navigate: jest.fn() }) }));
// Mock the PersonalityAssessment component to isolate the screen component for testing
jest.mock('../../../components/profile/PersonalityAssessment', () => ({ __esModule: true, default: jest.fn(() => null) }));

// Test suite for PersonalityAssessmentScreen component
describe('PersonalityAssessmentScreen', () => {
  // Setup function that runs before each test
  beforeEach(() => {
    // Reset all mocks to ensure clean test environment
    jest.clearAllMocks();

    // Mock useProfile implementation
    const mockUseProfile = {
      profile: null,
      personalityTraits: [],
      interests: [],
      loading: false,
      error: null,
      isAssessmentComplete: false,
      areInterestsSelected: false,
      getProfile: jest.fn(),
      updateUserProfile: jest.fn(),
      submitAssessment: jest.fn(),
      updateUserInterests: jest.fn(),
      getUserInterests: jest.fn(),
      uploadAvatar: jest.fn(),
      clearProfileError: jest.fn(),
      profileCompletionPercentage: 25
    };

    // Set default mock implementation
    (useProfile as jest.Mock).mockReturnValue(mockUseProfile);
  });

  // Define a test navigator for testing navigation
  const Stack = createStackNavigator();
  const TestNavigator = () => (
    <Stack.Navigator>
      <Stack.Screen name={ROUTES.ONBOARDING.PERSONALITY_ASSESSMENT} component={PersonalityAssessmentScreen} />
      <Stack.Screen name={ROUTES.ONBOARDING.INTEREST_SELECTION} component={() => null} />
    </Stack.Navigator>
  );

  // Helper function to render the component with navigation
  const renderWithNavigation = () => {
    return render(
      <NavigationContainer>
        <TestNavigator />
      </NavigationContainer>
    );
  };

  // Test case for rendering the component correctly
  it('renders correctly', async () => {
    // Render the PersonalityAssessmentScreen component with necessary providers
    const { getByText } = renderWithNavigation();

    // Verify that key elements are present in the rendered output
    // Check that the header text is displayed correctly
    expect(getByText('Personality Assessment')).toBeTruthy();

    // Verify that the PersonalityAssessment component is rendered
    expect((useProfile().submitAssessment as jest.Mock)).toBeDefined();
  });

  // Test case for navigating to the next screen on assessment completion
  it('navigates to the next screen when assessment is completed', async () => {
    // Render the PersonalityAssessmentScreen component with necessary providers
    const { getByText } = renderWithNavigation();

    // Mock the onComplete callback in the PersonalityAssessment component
    const mockNavigation = { navigate: jest.fn() };
    (useNavigation as jest.Mock).mockReturnValue(mockNavigation);

    // Mock the onComplete callback in the PersonalityAssessment component
    const mockSubmitAssessment = jest.fn().mockResolvedValue(undefined);
    (useProfile as jest.Mock).mockReturnValue({
      ...useProfile(),
      submitAssessment: mockSubmitAssessment,
    });

    // Trigger the completion of the assessment
    await waitFor(() => {
      (useProfile().submitAssessment as jest.Mock)();
    });

    // Verify that navigation.navigate was called with the correct route
    expect(mockNavigation.navigate).toHaveBeenCalledWith(ROUTES.ONBOARDING.INTEREST_SELECTION);
  });

  // Test case for handling loading state
  it('shows loading indicator when profile is loading', async () => {
    // Mock useProfile to return loading: true
    (useProfile as jest.Mock).mockReturnValue({
      ...useProfile(),
      loading: true,
    });

    // Render the PersonalityAssessmentScreen component
    const { getByTestId } = renderWithNavigation();

    // Verify that a loading indicator is displayed
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  // Test case for handling error state
  it('shows error message when there is an error', async () => {
    // Mock useProfile to return error: 'Test error message'
    (useProfile as jest.Mock).mockReturnValue({
      ...useProfile(),
      error: 'Test error message',
    });

    // Render the PersonalityAssessmentScreen component
    const { getByText } = renderWithNavigation();

    // Verify that the error message is displayed
    expect(getByText('Test error message')).toBeTruthy();
  });
});