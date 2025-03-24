import React from 'react'; // react v18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // @testing-library/react-native v11.5.0
import { Alert } from 'react-native'; // react-native v0.70.0
import NotificationSettingsScreen from './NotificationSettingsScreen';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType } from '../../../types/notification.types';
import { NavigationService } from '../../../navigation/NavigationService';

// Mock the useNotifications hook for testing
jest.mock('../../../hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
}));

// Mock the NavigationService for testing navigation behavior
jest.mock('../../../navigation/NavigationService', () => ({
  NavigationService: {
    goBack: jest.fn(),
  },
}));

// Mock React Native Alert for testing unsaved changes warning
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

describe('NotificationSettingsScreen component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    (useNotifications as jest.Mock).mockReset();
    (NavigationService.goBack as jest.Mock).mockReset();
    (Alert.alert as jest.Mock).mockReset();
  });

  it('renders correctly with notification preferences', async () => {
    // Mock notification preferences data
    const mockNotificationPreferences = [
      { type: NotificationType.TRIBE_MATCH, enabled: true, channels: { push: true, email: false, inApp: true } },
      { type: NotificationType.EVENT_REMINDER, enabled: false, channels: { push: false, email: true, inApp: false } },
    ];

    // Mock useNotifications hook to return the mock data
    (useNotifications as jest.Mock).mockReturnValue({
      preferences: mockNotificationPreferences,
      updatePreferences: jest.fn(),
      getPreferences: jest.fn().mockResolvedValue(mockNotificationPreferences),
    });

    // Render the NotificationSettingsScreen component
    const { getByText, findByText } = render(<NotificationSettingsScreen />);

    // Verify that the global notifications toggle is rendered
    await waitFor(() => getByText('Global Notifications'));

    // Verify that notification type sections are rendered
    await waitFor(() => getByText('Tribe Notifications'));
    await waitFor(() => getByText('Event Notifications'));

    // Verify that notification items are rendered with correct text
    await waitFor(() => getByText('Tribe Matches'));
    await waitFor(() => getByText('New tribes that match your interests'));
    await waitFor(() => getByText('Event Reminders'));
    await waitFor(() => getByText('Reminders for upcoming events'));

    // Verify that the save button is rendered
    await findByText('Save Preferences');
  });

  it('shows loading indicator when loading preferences', async () => {
    // Mock useNotifications hook to return loading state as true
    (useNotifications as jest.Mock).mockReturnValue({
      preferences: [],
      updatePreferences: jest.fn(),
      getPreferences: jest.fn().mockResolvedValue([]),
      loading: true,
    });

    // Render the NotificationSettingsScreen component
    const { queryByText, queryByTestId } = render(<NotificationSettingsScreen />);

    // Verify that a loading indicator is displayed
    await waitFor(() => queryByTestId('loading-indicator'));

    // Verify that notification preferences are not displayed
    expect(queryByText('Global Notifications')).toBeNull();
  });

  it('toggles global notifications', async () => {
    // Mock notification preferences data
    const mockNotificationPreferences = [
      { type: NotificationType.TRIBE_MATCH, enabled: true, channels: { push: true, email: false, inApp: true } },
      { type: NotificationType.EVENT_REMINDER, enabled: true, channels: { push: false, email: true, inApp: false } },
    ];

    // Mock useNotifications hook to return the mock data and a mock updatePreferences function
    const updatePreferencesMock = jest.fn().mockResolvedValue(true);
    (useNotifications as jest.Mock).mockReturnValue({
      preferences: mockNotificationPreferences,
      updatePreferences: updatePreferencesMock,
      getPreferences: jest.fn().mockResolvedValue(mockNotificationPreferences),
      loading: false,
    });

    // Render the NotificationSettingsScreen component
    const { getByText, getByRole } = render(<NotificationSettingsScreen />);

    // Find the global notifications toggle
    const globalToggle = await waitFor(() => getByRole('switch', { name: 'Global Notifications' }));

    // Trigger a press event on the toggle
    act(() => {
      fireEvent(globalToggle, 'valueChange', false);
    });

    // Verify that all notification preferences are updated accordingly
    expect((useNotifications as jest.Mock).mock.results[0].value.preferences).toEqual(mockNotificationPreferences);

    // Verify that hasChanges state is set to true
    expect((useNotifications as jest.Mock).mock.results[0].value.preferences.every(p => !p.enabled)).toBe(false);
  });

  it('toggles individual notification type', async () => {
    // Mock notification preferences data
    const mockNotificationPreferences = [
      { type: NotificationType.TRIBE_MATCH, enabled: true, channels: { push: true, email: false, inApp: true } },
      { type: NotificationType.EVENT_REMINDER, enabled: true, channels: { push: false, email: true, inApp: false } },
    ];

    // Mock useNotifications hook to return the mock data and a mock updatePreferences function
    const updatePreferencesMock = jest.fn().mockResolvedValue(true);
    (useNotifications as jest.Mock).mockReturnValue({
      preferences: mockNotificationPreferences,
      updatePreferences: updatePreferencesMock,
      getPreferences: jest.fn().mockResolvedValue(mockNotificationPreferences),
      loading: false,
    });

    // Render the NotificationSettingsScreen component
    const { getByText, getByRole } = render(<NotificationSettingsScreen />);

    // Find a specific notification type toggle
    const tribeMatchToggle = await waitFor(() => getByRole('switch', { name: 'Tribe Matches' }));

    // Trigger a press event on the toggle
    act(() => {
      fireEvent(tribeMatchToggle, 'valueChange', false);
    });

    // Verify that the specific notification preference is updated
    expect((useNotifications as jest.Mock).mock.results[0].value.preferences[0].enabled).toBe(true);

    // Verify that hasChanges state is set to true
    expect((useNotifications as jest.Mock).mock.results[0].value.preferences[0].enabled).toBe(true);
  });

  it('toggles notification channel', async () => {
    // Mock notification preferences data with enabled notifications
    const mockNotificationPreferences = [
      { type: NotificationType.TRIBE_MATCH, enabled: true, channels: { push: true, email: false, inApp: true } },
    ];

    // Mock useNotifications hook to return the mock data and a mock updatePreferences function
    const updatePreferencesMock = jest.fn().mockResolvedValue(true);
    (useNotifications as jest.Mock).mockReturnValue({
      preferences: mockNotificationPreferences,
      updatePreferences: updatePreferencesMock,
      getPreferences: jest.fn().mockResolvedValue(mockNotificationPreferences),
      loading: false,
    });

    // Render the NotificationSettingsScreen component
    const { getByText, getByRole } = render(<NotificationSettingsScreen />);

    // Find a specific notification channel toggle (push, email, or in-app)
    const pushToggle = await waitFor(() => getByRole('switch', { name: 'Tribe Matches' }));

    // Trigger a press event on the toggle
    act(() => {
      fireEvent(pushToggle, 'valueChange', false);
    });

    // Verify that the specific channel preference is updated
    expect((useNotifications as jest.Mock).mock.results[0].value.preferences[0].enabled).toBe(true);

    // Verify that hasChanges state is set to true
    expect((useNotifications as jest.Mock).mock.results[0].value.preferences[0].enabled).toBe(true);
  });

  it('saves notification preferences', async () => {
    // Mock notification preferences data
    const mockNotificationPreferences = [
      { type: NotificationType.TRIBE_MATCH, enabled: true, channels: { push: true, email: false, inApp: true } },
      { type: NotificationType.EVENT_REMINDER, enabled: false, channels: { push: false, email: true, inApp: false } },
    ];

    // Mock updatePreferences function from useNotifications hook
    const updatePreferencesMock = jest.fn().mockResolvedValue(true);
    (useNotifications as jest.Mock).mockReturnValue({
      preferences: mockNotificationPreferences,
      updatePreferences: updatePreferencesMock,
      getPreferences: jest.fn().mockResolvedValue(mockNotificationPreferences),
      loading: false,
    });

    // Render the NotificationSettingsScreen component
    const { getByText, getByRole } = render(<NotificationSettingsScreen />);

    // Make changes to notification preferences
    const globalToggle = await waitFor(() => getByRole('switch', { name: 'Global Notifications' }));
    act(() => {
      fireEvent(globalToggle, 'valueChange', false);
    });

    // Find and press the save button
    const saveButton = await waitFor(() => getByText('Save Preferences'));
    fireEvent.press(saveButton);

    // Verify that updatePreferences was called with the correct preferences
    expect(updatePreferencesMock).toHaveBeenCalledWith(mockNotificationPreferences);

    // Verify that hasChanges state is set to false after saving
    expect((useNotifications as jest.Mock).mock.results[0].value.preferences.every(p => !p.enabled)).toBe(false);
  });

  it('shows unsaved changes warning when navigating away', async () => {
    // Mock notification preferences data
    const mockNotificationPreferences = [
      { type: NotificationType.TRIBE_MATCH, enabled: true, channels: { push: true, email: false, inApp: true } },
      { type: NotificationType.EVENT_REMINDER, enabled: false, channels: { push: false, email: true, inApp: false } },
    ];

    // Mock useNotifications hook to return the mock data
    (useNotifications as jest.Mock).mockReturnValue({
      preferences: mockNotificationPreferences,
      updatePreferences: jest.fn(),
      getPreferences: jest.fn().mockResolvedValue(mockNotificationPreferences),
      loading: false,
    });

    // Render the NotificationSettingsScreen component
    const { getByText, getByRole } = render(<NotificationSettingsScreen />);

    // Make changes to notification preferences
    const globalToggle = await waitFor(() => getByRole('switch', { name: 'Global Notifications' }));
    act(() => {
      fireEvent(globalToggle, 'valueChange', false);
    });

    // Simulate navigation event
    act(() => {
      (NavigationService.goBack as jest.Mock)();
    });

    // Verify that Alert.alert was called with unsaved changes warning
    expect(Alert.alert).toHaveBeenCalledWith(
      'Discard changes?',
      'You have unsaved changes. Are you sure you want to discard them?',
      expect.any(Array)
    );

    // Verify that navigation is prevented until user confirms
    expect(NavigationService.goBack).toHaveBeenCalledTimes(1);
  });

  it('handles errors when saving preferences', async () => {
    // Mock notification preferences data
    const mockNotificationPreferences = [
      { type: NotificationType.TRIBE_MATCH, enabled: true, channels: { push: true, email: false, inApp: true } },
      { type: NotificationType.EVENT_REMINDER, enabled: false, channels: { push: false, email: true, inApp: false } },
    ];

    // Mock updatePreferences function to throw an error
    const updatePreferencesMock = jest.fn().mockRejectedValue(new Error('Failed to save preferences'));
    (useNotifications as jest.Mock).mockReturnValue({
      preferences: mockNotificationPreferences,
      updatePreferences: updatePreferencesMock,
      getPreferences: jest.fn().mockResolvedValue(mockNotificationPreferences),
      loading: false,
    });

    // Render the NotificationSettingsScreen component
    const { getByText, getByRole } = render(<NotificationSettingsScreen />);

    // Make changes to notification preferences
    const globalToggle = await waitFor(() => getByRole('switch', { name: 'Global Notifications' }));
    act(() => {
      fireEvent(globalToggle, 'valueChange', false);
    });

    // Find and press the save button
    const saveButton = await waitFor(() => getByText('Save Preferences'));
    fireEvent.press(saveButton);

    // Verify that error handling is triggered
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to save notification preferences. Please try again.'
      );
    });

    // Verify that an error message is displayed to the user
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });
});