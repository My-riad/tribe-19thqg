import React from 'react'; // react v^18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // @testing-library/react-native v^12.0.0
import { AutoMatchingPreferencesScreen } from '../AutoMatchingPreferencesScreen';
import { useProfile } from '../../../hooks/useProfile';
import { PreferenceCategory } from '../../../types/profile.types';
import { jest } from '@jest/globals'; // jest v^29.2.1
import { Alert } from 'react-native'; // react-native v^0.70.0

// Mock the useNavigation hook for testing navigation interactions
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
  }),
}));

// Mock the Alert module to verify success and error messages
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock the useProfile hook to control profile data and update functions
jest.mock('../../../hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

describe('AutoMatchingPreferencesScreen', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    (useProfile as jest.Mock).mockClear();
    (Alert.alert as jest.Mock).mockClear();

    // Set up default mock values for useProfile hook
    (useProfile as jest.Mock).mockReturnValue({
      profile: {
        id: 'profile1',
        userId: 'user1',
        name: 'Test User',
        bio: 'Test bio',
        location: 'Test location',
        coordinates: { latitude: 0, longitude: 0 },
        birthdate: new Date(),
        phoneNumber: '123-456-7890',
        avatarUrl: 'test.jpg',
        coverImageUrl: 'test_cover.jpg',
        personalityTraits: [],
        interests: [],
        preferences: [],
        achievements: [],
        lastUpdated: new Date(),
        completionPercentage: 100,
        maxTravelDistance: 25,
        availableDays: [],
        availableTimeRanges: [],
      },
      updateUserProfile: jest.fn().mockResolvedValue({}),
      loading: false,
      error: null,
      isAssessmentComplete: true,
      areInterestsSelected: true,
      profileCompletionPercentage: 100,
      getProfile: jest.fn(),
      submitAssessment: jest.fn(),
      updateUserInterests: jest.fn(),
      getUserInterests: jest.fn(),
      uploadAvatar: jest.fn(),
      clearProfileError: jest.fn(),
    });
  });

  it('renders correctly with default values', () => {
    // Render the AutoMatchingPreferencesScreen component
    const { getByText, getByTestId } = render(<AutoMatchingPreferencesScreen />);

    // Verify that all UI elements are rendered correctly
    expect(getByText('Auto-Matching')).toBeTruthy();
    expect(getByText('Matching Criteria')).toBeTruthy();
    expect(getByText('Maximum Distance for Tribes')).toBeTruthy();
    expect(getByText('Preferred Tribe Size')).toBeTruthy();
    expect(getByText('Matching Schedule')).toBeTruthy();
    expect(getByText('Save Preferences')).toBeTruthy();

    // Check that toggle switches, checkboxes, sliders, and radio buttons are present
    expect(getByTestId('auto-matching-toggle')).toBeTruthy();
    expect(getByTestId('personality-checkbox')).toBeTruthy();
    expect(getByTestId('interests-checkbox')).toBeTruthy();
    expect(getByTestId('location-checkbox')).toBeTruthy();
    expect(getByTestId('age-checkbox')).toBeTruthy();
    expect(getByTestId('distance-slider')).toBeTruthy();
    expect(getByTestId('tribe-size-slider')).toBeTruthy();
    expect(getByTestId('weekly-radio')).toBeTruthy();
    expect(getByTestId('bi-weekly-radio')).toBeTruthy();
    expect(getByTestId('monthly-radio')).toBeTruthy();
  });

  it('initializes form values from profile data', () => {
    // Mock profile data with existing preferences
    (useProfile as jest.Mock).mockReturnValue({
      profile: {
        id: 'profile1',
        userId: 'user1',
        name: 'Test User',
        bio: 'Test bio',
        location: 'Test location',
        coordinates: { latitude: 0, longitude: 0 },
        birthdate: new Date(),
        phoneNumber: '123-456-7890',
        avatarUrl: 'test.jpg',
        coverImageUrl: 'test_cover.jpg',
        personalityTraits: [],
        interests: [],
        preferences: [
          {
            id: 'pref1',
            profileId: 'profile1',
            category: PreferenceCategory.MATCHING,
            setting: 'autoMatchingEnabled',
            value: 'true',
          },
        ],
        achievements: [],
        lastUpdated: new Date(),
        completionPercentage: 100,
        maxTravelDistance: 30,
        availableDays: [],
        availableTimeRanges: [],
      },
      updateUserProfile: jest.fn().mockResolvedValue({}),
      loading: false,
      error: null,
      isAssessmentComplete: true,
      areInterestsSelected: true,
      profileCompletionPercentage: 100,
      getProfile: jest.fn(),
      submitAssessment: jest.fn(),
      updateUserInterests: jest.fn(),
      getUserInterests: jest.fn(),
      uploadAvatar: jest.fn(),
      clearProfileError: jest.fn(),
    });

    // Render the AutoMatchingPreferencesScreen component
    const { getByTestId, getByText } = render(<AutoMatchingPreferencesScreen />);

    // Verify that form values are initialized from profile data
    expect(getByTestId('auto-matching-toggle').props.checked).toBe(true);
  });

  it('toggles auto-matching enabled status', () => {
    // Render the AutoMatchingPreferencesScreen component
    const { getByTestId } = render(<AutoMatchingPreferencesScreen />);

    // Find the auto-matching toggle switch
    const toggle = getByTestId('auto-matching-toggle');

    // Simulate toggling the switch
    fireEvent(toggle, 'press');

    // Verify that the toggle state is updated
    expect(toggle.props.checked).toBe(false);
  });

  it('toggles matching criteria checkboxes', () => {
    // Render the AutoMatchingPreferencesScreen component
    const { getByTestId } = render(<AutoMatchingPreferencesScreen />);

    // Find the matching criteria checkboxes
    const personalityCheckbox = getByTestId('personality-checkbox');
    const interestsCheckbox = getByTestId('interests-checkbox');
    const locationCheckbox = getByTestId('location-checkbox');
    const ageCheckbox = getByTestId('age-checkbox');

    // Simulate toggling each checkbox
    fireEvent(personalityCheckbox, 'press');
    fireEvent(interestsCheckbox, 'press');
    fireEvent(locationCheckbox, 'press');
    fireEvent(ageCheckbox, 'press');

    // Verify that the checkbox states are updated
    expect(personalityCheckbox.props.checked).toBe(false);
    expect(interestsCheckbox.props.checked).toBe(false);
    expect(locationCheckbox.props.checked).toBe(false);
    expect(ageCheckbox.props.checked).toBe(false);
  });

  it('updates slider values', () => {
    // Render the AutoMatchingPreferencesScreen component
    const { getByTestId } = render(<AutoMatchingPreferencesScreen />);

    // Find the distance and tribe size sliders
    const distanceSlider = getByTestId('distance-slider');
    const tribeSizeSlider = getByTestId('tribe-size-slider');

    // Simulate changing slider values
    fireEvent(distanceSlider, 'valueChange', 40);
    fireEvent(tribeSizeSlider, 'valueChange', 5);

    // Verify that the slider values are updated
    expect(distanceSlider.props.value).toBe(40);
    expect(tribeSizeSlider.props.value).toBe(5);
  });

  it('selects different matching schedule', () => {
    // Render the AutoMatchingPreferencesScreen component
    const { getByTestId } = render(<AutoMatchingPreferencesScreen />);

    // Find the matching schedule radio buttons
    const weeklyRadio = getByTestId('weekly-radio');
    const biWeeklyRadio = getByTestId('bi-weekly-radio');
    const monthlyRadio = getByTestId('monthly-radio');

    // Simulate selecting different radio buttons
    fireEvent(biWeeklyRadio, 'press');
    fireEvent(monthlyRadio, 'press');

    // Verify that the selected radio button is updated
    expect(biWeeklyRadio.props.selected).toBe(false);
    expect(monthlyRadio.props.selected).toBe(true);
  });

  it('saves preferences when save button is pressed', async () => {
    // Mock the updateUserProfile function
    const updateUserProfileMock = jest.fn().mockResolvedValue({});
    (useProfile as jest.Mock).mockReturnValue({
      profile: {
        id: 'profile1',
        userId: 'user1',
        name: 'Test User',
        bio: 'Test bio',
        location: 'Test location',
        coordinates: { latitude: 0, longitude: 0 },
        birthdate: new Date(),
        phoneNumber: '123-456-7890',
        avatarUrl: 'test.jpg',
        coverImageUrl: 'test_cover.jpg',
        personalityTraits: [],
        interests: [],
        preferences: [],
        achievements: [],
        lastUpdated: new Date(),
        completionPercentage: 100,
        maxTravelDistance: 25,
        availableDays: [],
        availableTimeRanges: [],
      },
      updateUserProfile: updateUserProfileMock,
      loading: false,
      error: null,
      isAssessmentComplete: true,
      areInterestsSelected: true,
      profileCompletionPercentage: 100,
      getProfile: jest.fn(),
      submitAssessment: jest.fn(),
      updateUserInterests: jest.fn(),
      getUserInterests: jest.fn(),
      uploadAvatar: jest.fn(),
      clearProfileError: jest.fn(),
    });

    // Render the AutoMatchingPreferencesScreen component
    const { getByText, getByTestId } = render(<AutoMatchingPreferencesScreen />);

    // Find and press the save button
    const saveButton = getByText('Save Preferences');
    fireEvent.press(saveButton);

    // Verify that updateUserProfile is called with correct parameters
    await waitFor(() => {
      expect(updateUserProfileMock).toHaveBeenCalled();
    });

    // Verify success message is displayed
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Auto-matching preferences saved successfully!'
      );
    });
  });

  it('handles errors when saving preferences', async () => {
    // Mock the updateUserProfile function to throw an error
    const updateUserProfileMock = jest.fn().mockRejectedValue(new Error('Failed to save'));
    (useProfile as jest.Mock).mockReturnValue({
      profile: {
        id: 'profile1',
        userId: 'user1',
        name: 'Test User',
        bio: 'Test bio',
        location: 'Test location',
        coordinates: { latitude: 0, longitude: 0 },
        birthdate: new Date(),
        phoneNumber: '123-456-7890',
        avatarUrl: 'test.jpg',
        coverImageUrl: 'test_cover.jpg',
        personalityTraits: [],
        interests: [],
        preferences: [],
        achievements: [],
        lastUpdated: new Date(),
        completionPercentage: 100,
        maxTravelDistance: 25,
        availableDays: [],
        availableTimeRanges: [],
      },
      updateUserProfile: updateUserProfileMock,
      loading: false,
      error: null,
      isAssessmentComplete: true,
      areInterestsSelected: true,
      profileCompletionPercentage: 100,
      getProfile: jest.fn(),
      submitAssessment: jest.fn(),
      updateUserInterests: jest.fn(),
      getUserInterests: jest.fn(),
      uploadAvatar: jest.fn(),
      clearProfileError: jest.fn(),
    });

    // Render the AutoMatchingPreferencesScreen component
    const { getByText } = render(<AutoMatchingPreferencesScreen />);

    // Find and press the save button
    const saveButton = getByText('Save Preferences');
    fireEvent.press(saveButton);

    // Verify that error handling is triggered
    await waitFor(() => {
      expect(updateUserProfileMock).toHaveBeenCalled();
    });

    // Verify error message is displayed
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to save auto-matching preferences. Please try again.'
      );
    });
  });
});