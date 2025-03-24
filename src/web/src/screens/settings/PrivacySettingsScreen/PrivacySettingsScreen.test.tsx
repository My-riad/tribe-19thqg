# src/web/src/screens/settings/PrivacySettingsScreen/PrivacySettingsScreen.test.tsx
```typescript
import React from 'react'; // react v18.2.0
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'; // @testing-library/react-native v12.1.2
import { PrivacySettingsScreen } from './PrivacySettingsScreen';
import { useProfile } from '../../../hooks/useProfile';
import { profileApi } from '../../../api/profileApi';
import { PreferenceCategory } from '../../../types/profile.types';
import { Alert } from 'react-native'; // react-native v0.72.0
import 'jest'; // jest v29.5.0

// Mock the useProfile hook to control its behavior in tests
jest.mock('../../../hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

// Mock the profileApi to control API responses in tests
jest.mock('../../../api/profileApi', () => ({
  profileApi: {
    getPreferences: jest.fn(),
    updatePreference: jest.fn(),
  },
}));

// Mock the react-navigation hooks for testing navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

// Mock the react-native Alert module for testing confirmation dialogs
jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');
  ReactNative.Alert.alert = jest.fn();
  return ReactNative;
});

describe('PrivacySettingsScreen', () => {
  beforeEach(() => {
    (jest.fn(useProfile) as jest.Mock).mockReturnValue({
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
        coverImageUrl: 'test.jpg',
        personalityTraits: [],
        interests: [],
        preferences: [],
        achievements: [],
        lastUpdated: new Date(),
        completionPercentage: 100,
        maxTravelDistance: 50,
        availableDays: [],
        availableTimeRanges: [],
      },
      loading: false,
      error: null,
      isAssessmentComplete: true,
      areInterestsSelected: true,
      profileCompletionPercentage: 100,
      getProfile: jest.fn(),
      updateUserProfile: jest.fn(),
      submitAssessment: jest.fn(),
      updateUserInterests: jest.fn(),
      getUserInterests: jest.fn(),
      uploadAvatar: jest.fn(),
      clearProfileError: jest.fn(),
    });

    (profileApi.getPreferences as jest.Mock).mockResolvedValue({
      success: true,
      data: [
        { category: PreferenceCategory.PRIVACY, setting: 'profileVisibility', value: 'public' },
        { category: PreferenceCategory.PRIVACY, setting: 'locationSharing', value: 'true' },
        { category: PreferenceCategory.PRIVACY, setting: 'dataUsage', value: 'true' },
      ],
      message: 'Preferences fetched successfully',
      timestamp: Date.now(),
    });

    (profileApi.updatePreference as jest.Mock).mockResolvedValue({
      success: true,
      data: {},
      message: 'Preference updated successfully',
      timestamp: Date.now(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    render(<PrivacySettingsScreen />);
    expect(screen.getByText('Profile Visibility')).toBeTruthy();
    expect(screen.getByText('Location Sharing')).toBeTruthy();
    expect(screen.getByText('Data Usage')).toBeTruthy();
    expect(screen.getByText('Download My Data')).toBeTruthy();
    expect(screen.getByText('Delete My Data')).toBeTruthy();
  });

  it('fetches privacy preferences on mount', async () => {
    render(<PrivacySettingsScreen />);
    await waitFor(() => {
      expect(profileApi.getPreferences).toHaveBeenCalled();
    });
  });

  it('toggles privacy settings correctly', async () => {
    render(<PrivacySettingsScreen />);
    const locationSharingSwitch = await screen.findByLabelText('Share your location');
    fireEvent(locationSharingSwitch, 'valueChange', false);
    expect(locationSharingSwitch.props.value).toBe(true);
  });

  it('changes profile visibility option correctly', async () => {
    render(<PrivacySettingsScreen />);
    const publicOption = await screen.findByText('Public');
    fireEvent.press(publicOption);
    expect(screen.getByText('Public').props.style.color).toBeTruthy();
  });

  it('saves privacy settings successfully', async () => {
    render(<PrivacySettingsScreen />);
    const saveButton = await screen.findByText('Save Settings');
    fireEvent.press(saveButton);
    await waitFor(() => {
      expect(profileApi.updatePreference).toHaveBeenCalled();
    });
  });

  it('shows confirmation dialog for data deletion', async () => {
    render(<PrivacySettingsScreen />);
    const deleteButton = await screen.findByText('Delete My Data');
    fireEvent.press(deleteButton);
    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete Your Data",
      "Are you sure you want to delete your data? This action is irreversible.",
      expect.arrayContaining([
        expect.objectContaining({ text: "Cancel", style: "cancel" }),
        expect.objectContaining({ text: "Delete", style: "destructive" })
      ])
    );
  });

  it('handles data download request', async () => {
    render(<PrivacySettingsScreen />);
    const downloadButton = await screen.findByText('Download My Data');
    fireEvent.press(downloadButton);
  });

  it('handles API errors when saving settings', async () => {
    (profileApi.updatePreference as jest.Mock).mockRejectedValue(new Error('API error'));
    render(<PrivacySettingsScreen />);
    const saveButton = await screen.findByText('Save Settings');
    fireEvent.press(saveButton);
  });
});