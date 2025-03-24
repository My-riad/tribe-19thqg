import React from 'react'; // React library for component testing // ^18.2.0
import { render, fireEvent, waitFor } from '@testing-library/react-native'; // Testing utilities for React Native components // ^12.0.0
import { act } from 'react-test-renderer'; // Testing utility for batched updates // ^18.2.0
import { Provider } from 'react-redux'; // Redux provider for testing components with Redux // ^8.0.5
import { configureStore } from '@reduxjs/toolkit'; // Create a Redux store for testing // ^1.9.5
import InterestSelectionScreen from './InterestSelectionScreen'; // Component under test
import { ROUTES } from '../../../constants/navigationRoutes'; // Navigation route constants for testing navigation
import { updateInterests } from '../../../store/thunks/profileThunks'; // Redux thunk for updating user interests to mock in tests
import InterestSelection from '../../../components/profile/InterestSelection/InterestSelection'; // Component for selecting user interests

// Mock the useNavigation hook
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
}));

// Mock the updateInterests thunk
jest.mock('../../../store/thunks/profileThunks', () => ({
  updateInterests: jest.fn(),
}));

/**
 * Helper function to set up the component with a mock store and navigation
 * @param customState (optional)
 * @returns Rendered component and utilities
 */
const setup = (customState = {}) => {
  // 1. Create a mock navigation object with navigate function
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  // Mock the useNavigation hook to return the mock navigation object
  (require('@react-navigation/native').useNavigation as jest.Mock).mockReturnValue(mockNavigation);

  // 2. Create a mock Redux store with initial state and optional custom state
  const store = configureStore({
    reducer: {
      profile: (state = {
        profile: null,
        personalityTraits: [],
        interests: [],
        preferences: [],
        achievements: [],
        loading: false,
        error: null,
        assessmentStatus: 'not_started',
        assessmentProgress: 0,
      }, action) => state,
    },
    preloadedState: {
      profile: {
        interests: [],
        loading: false,
        error: null,
        ...customState,
      },
    },
  });

  // 3. Mock the updateInterests thunk
  const mockUpdateInterests = updateInterests as jest.Mock;
  mockUpdateInterests.mockResolvedValue(Promise.resolve());

  // 4. Render the InterestSelectionScreen with the Provider and mocked navigation
  const renderResult = render(
    <Provider store={store}>
      <InterestSelectionScreen />
    </Provider>
  );

  // 5. Return the rendered component, store, and navigation mock
  return {
    ...renderResult,
    store,
    navigation: mockNavigation,
    mockUpdateInterests,
  };
};

/**
 * Mock function for the useNavigation hook
 * @returns Mock navigation object
 */
const mockNavigationHook = () => {
    return {
        navigate: jest.fn(),
        goBack: jest.fn()
    };
};

describe('InterestSelectionScreen', () => {
  it('renders correctly', () => {
    // 1. Render the component with setup function
    const { getByText, getByTestId } = setup();

    // 2. Verify the screen title is present
    expect(getByText('Select Interests')).toBeDefined();

    // 3. Verify the progress bar is present
    expect(getByTestId('progress-bar')).toBeDefined();

    // 4. Verify the InterestSelection component is present
    expect(getByTestId('interest-selection')).toBeDefined();
  });

  it('displays correct progress value', () => {
    // 1. Render the component with setup function
    const { getByTestId } = setup();

    // 2. Find the progress bar component
    const progressBar = getByTestId('progress-bar');

    // 3. Verify the progress prop is set to 0.5 (50%)
    expect(progressBar.props.progress).toBe(0.5);
  });

  it('navigates to location setup screen when interests are submitted', async () => {
    // 1. Render the component with setup function
    const { findByTestId, navigation, mockUpdateInterests } = setup();

    // 2. Find the InterestSelection component
    const interestSelection = await findByTestId('interest-selection');

    // 3. Trigger the onComplete callback
    act(() => {
      interestSelection.props.onComplete();
    });

    // 4. Verify navigation.navigate was called with the correct route (ROUTES.ONBOARDING.LOCATION_SETUP)
    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.ONBOARDING.LOCATION_SETUP);
    });
  });

  it('shows loading state during interest submission', async () => {
    // 1. Render the component with setup function and loading state set to true
    const { findByTestId } = setup({ loading: true });

    // 2. Find the InterestSelection component
    const interestSelection = await findByTestId('interest-selection');

    // 3. Verify the loading prop is passed as true
    expect(interestSelection.props.loading).toBe(true);
  });

  it('passes current interests to InterestSelection component', async () => {
    // 1. Create mock interests data
    const mockInterests = [
      { id: '1', category: 'OUTDOOR_ADVENTURES', name: 'Hiking', level: 5 },
      { id: '2', category: 'FOOD_DINING', name: 'Restaurants', level: 4 },
    ];

    // 2. Render the component with setup function and custom state including the mock interests
    const { findByTestId } = setup({ interests: mockInterests });

    // 3. Find the InterestSelection component
    const interestSelection = await findByTestId('interest-selection');

    // 4. Verify the selectedInterests prop matches the mock interests
    expect(interestSelection.props.selectedInterests).toEqual(mockInterests);
  });
  
  it('handles back button press', () => {
      // 1. Render the component with setup function
      const { getByTestId, navigation } = setup();

      // 2. Find the back button
      const backButton = getByTestId('back-button');

      // 3. Trigger a press event on the back button
      fireEvent.press(backButton);

      // 4. Verify navigation.goBack was called
      expect(navigation.goBack).toHaveBeenCalled();
  });
});