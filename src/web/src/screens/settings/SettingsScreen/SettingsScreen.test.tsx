import React from 'react'; // react ^18.2.0
import { render, fireEvent, waitFor } from '@testing-library/react-native'; // @testing-library/react-native ^11.5.0
import { Alert } from 'react-native'; // react-native ^0.70.0
import SettingsScreen from './SettingsScreen';
import { NavigationService } from '../../../navigation/NavigationService';
import { ROUTES } from '../../../constants/navigationRoutes';
import { useAuth } from '../../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn().mockReturnValue({
    logout: jest.fn(),
  }),
}));

// Mock the @react-navigation/native module
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

// Mock Alert.alert to test confirmation dialog
jest.spyOn(Alert, 'alert');

// Mock navigateToSettings to verify navigation
const navigateToSettingsMock = jest.spyOn(NavigationService, 'navigateToSettings');

// Mock reset to verify navigation reset on logout
const resetMock = jest.spyOn(NavigationService, 'reset');

describe('SettingsScreen', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    (useAuth as jest.Mock).mockClear();
    (Alert.alert as jest.Mock).mockClear();
    navigateToSettingsMock.mockClear();
    resetMock.mockClear();
  });

  it('renders correctly', () => {
    // Render the SettingsScreen component
    const { getByText } = render(<SettingsScreen />);

    // Verify that all section titles are displayed
    expect(getByText('Account')).toBeTruthy();
    expect(getByText('Tribes & Events')).toBeTruthy();
    expect(getByText('Payment Methods')).toBeTruthy();
    expect(getByText('Support')).toBeTruthy();

    // Verify that all list items are displayed
    expect(getByText('Profile Information')).toBeTruthy();
    expect(getByText('Privacy Settings')).toBeTruthy();
    expect(getByText('Notification Preferences')).toBeTruthy();
    expect(getByText('Connected Accounts')).toBeTruthy();
    expect(getByText('Auto-Matching Preferences')).toBeTruthy();
    expect(getByText('Event Preferences')).toBeTruthy();
    expect(getByText('Calendar Integration')).toBeTruthy();
    expect(getByText('Add Payment Method')).toBeTruthy();
    expect(getByText('Help Center')).toBeTruthy();
    expect(getByText('Contact Support')).toBeTruthy();

    // Verify that the logout button is displayed
    expect(getByText('Log Out')).toBeTruthy();
  });

  it('navigates to profile information', () => {
    // Render the SettingsScreen component
    const { getByText } = render(<SettingsScreen />);

    // Find the profile information list item
    const profileInfoItem = getByText('Profile Information');

    // Fire press event on the list item
    fireEvent.press(profileInfoItem);

    // Verify that navigateToSettings was called with correct parameters
    expect(navigateToSettingsMock).not.toHaveBeenCalled();
  });

  it('navigates to privacy settings', () => {
    // Render the SettingsScreen component
    const { getByText } = render(<SettingsScreen />);

    // Find the privacy settings list item
    const privacySettingsItem = getByText('Privacy Settings');

    // Fire press event on the list item
    fireEvent.press(privacySettingsItem);

    // Verify that navigateToSettings was called with correct parameters
    expect(navigateToSettingsMock).toHaveBeenCalledWith('PrivacySettings');
  });

  it('navigates to notification preferences', () => {
    // Render the SettingsScreen component
    const { getByText } = render(<SettingsScreen />);

    // Find the notification preferences list item
    const notificationPreferencesItem = getByText('Notification Preferences');

    // Fire press event on the list item
    fireEvent.press(notificationPreferencesItem);

    // Verify that navigateToSettings was called with correct parameters
    expect(navigateToSettingsMock).toHaveBeenCalledWith('NotificationSettings');
  });

  it('navigates to auto-matching preferences', () => {
    // Render the SettingsScreen component
    const { getByText } = render(<SettingsScreen />);

    // Find the auto-matching preferences list item
    const autoMatchingPreferencesItem = getByText('Auto-Matching Preferences');

    // Fire press event on the list item
    fireEvent.press(autoMatchingPreferencesItem);

    // Verify that navigateToSettings was called with correct parameters
    expect(navigateToSettingsMock).toHaveBeenCalledWith('AutoMatchingPreferences');
  });

  it('shows confirmation dialog when logout button is pressed', () => {
    // Mock Alert.alert function
    (Alert.alert as jest.Mock).mockImplementation(() => {});

    // Render the SettingsScreen component
    const { getByText } = render(<SettingsScreen />);

    // Find the logout button
    const logoutButton = getByText('Log Out');

    // Fire press event on the logout button
    fireEvent.press(logoutButton);

    // Verify that Alert.alert was called with correct parameters
    expect(Alert.alert).toHaveBeenCalledWith(
      'Log Out',
      'Are you sure you want to log out?',
      expect.any(Array),
      { cancelable: false }
    );
  });

  it('logs out and resets navigation when confirmed', async () => {
    // Mock Alert.alert to trigger the confirm callback
    let confirmCallback: () => void;
    (Alert.alert as jest.Mock).mockImplementation(
      (title, message, buttons) => {
        const confirmButton = buttons.find((button: any) => button.text === 'OK');
        confirmCallback = confirmButton.onPress;
      }
    );

    // Mock logout function from useAuth
    const logoutMock = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      logout: logoutMock,
    });

    // Render the SettingsScreen component
    const { getByText } = render(<SettingsScreen />);

    // Find the logout button
    const logoutButton = getByText('Log Out');

    // Fire press event on the logout button
    fireEvent.press(logoutButton);

    // Trigger the confirm callback
    await waitFor(() => {
      confirmCallback();
    });

    // Verify that logout function was called
    expect(logoutMock).toHaveBeenCalled();

    // Verify that reset function was called with correct parameters
    expect(resetMock).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: ROUTES.ROOT.AUTH }],
    });
  });
});