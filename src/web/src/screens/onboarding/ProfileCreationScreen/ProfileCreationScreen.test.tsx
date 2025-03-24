import React from 'react'; // react v^18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // @testing-library/react-native v^12.0.0
import ProfileCreationScreen from './ProfileCreationScreen';
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native v^6.0.0
import { useProfile } from '../../../hooks/useProfile';
import { Alert } from 'react-native'; // react-native ^0.70.0
import { ROUTES } from '../../../constants/navigationRoutes';

// Mock the useNavigation hook
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn().mockReturnValue({ navigate: jest.fn() }),
}));

// Mock the useProfile hook
jest.mock('../../../hooks/useProfile', () => ({
  useProfile: jest.fn().mockReturnValue({
    profile: null,
    loading: false,
    error: null,
    updateUserProfile: jest.fn().mockResolvedValue({}),
  }),
}));

// Mock the Alert component
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: { alert: jest.fn() },
}));

describe('ProfileCreationScreen', () => {
  beforeEach(() => {
    (useNavigation as jest.Mock).mockClear();
    (useProfile as jest.Mock).mockClear();
    (Alert.alert as jest.Mock).mockClear();
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(<ProfileCreationScreen />);

    expect(getByText('Create Your Profile')).toBeTruthy();
    expect(getByTestId('progress-bar')).toBeTruthy();
    expect(getByText('Complete Profile')).toBeTruthy();
  });

  it('handles profile completion', async () => {
    const mockNavigation = { navigate: jest.fn() };
    (useNavigation as jest.Mock).mockReturnValue(mockNavigation);

    const { getByText } = render(<ProfileCreationScreen />);
    const completeButton = getByText('Complete Profile');

    await act(async () => {
      fireEvent.press(completeButton);
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN.HOME);
  });

  it('displays error message', () => {
    (useProfile as jest.Mock).mockReturnValue({
      profile: null,
      loading: false,
      error: 'Failed to update profile',
      updateUserProfile: jest.fn().mockRejectedValue(new Error('Failed to update profile')),
    });

    const { getByText } = render(<ProfileCreationScreen />);

    expect(getByText('Failed to update profile')).toBeTruthy();
  });

  it('allows skipping profile creation', async () => {
    const mockNavigation = { navigate: jest.fn() };
    (useNavigation as jest.Mock).mockReturnValue(mockNavigation);

    const { getByText } = render(<ProfileCreationScreen />);
    const skipButton = getByText('Skip');

    await act(async () => {
      fireEvent.press(skipButton);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Skip Profile Creation?",
      "Skipping profile creation will limit your matching potential. Are you sure you want to skip?",
      expect.arrayContaining([
        expect.objectContaining({ text: "Skip" }),
      ])
    );

    const confirmSkipButton = (Alert.alert as jest.Mock).mock.calls[0][2].find((button: any) => button.text === 'Skip');

    await act(async () => {
      confirmSkipButton.onPress();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN.HOME);
  });

  it('shows loading indicator', () => {
    (useProfile as jest.Mock).mockReturnValue({
      profile: null,
      loading: true,
      error: null,
      updateUserProfile: jest.fn().mockResolvedValue({}),
    });

    const { getByTestId } = render(<ProfileCreationScreen />);

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});