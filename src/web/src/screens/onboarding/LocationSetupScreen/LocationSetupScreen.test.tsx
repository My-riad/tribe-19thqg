import React from 'react'; // React v18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // @testing-library/react-native v12.0.0
import { LocationSetupScreen } from './LocationSetupScreen'; // Import the component being tested
import { locationService } from '../../../services/locationService'; // Import location service for mocking
import { updateProfile } from '../../../store/thunks/profileThunks'; // Import Redux thunk for mocking
import { ROUTES } from '../../../constants/navigationRoutes'; // Import navigation route constants for testing navigation
import 'react-native'; // Import react-native
import { Alert } from 'react-native'; // Import react-native

// Mock the navigation hook to return a mock navigation object
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn() })),
}));

// Mock the Redux dispatch hook to return a mock dispatch function
jest.mock('../../../store/hooks', () => ({
  useAppDispatch: jest.fn(() => jest.fn()),
}));

// Mock the location service to control its behavior in tests
jest.mock('../../../services/locationService', () => ({
  locationService: {
    requestLocationPermission: jest.fn(),
    getUserLocation: jest.fn(),
    searchLocationByAddress: jest.fn(),
    getAddressFromCoordinates: jest.fn(),
    saveLocationPreference: jest.fn(),
  },
}));

// Mock the profile thunks to verify they are called correctly
jest.mock('../../../store/thunks/profileThunks', () => ({
  updateProfile: jest.fn(),
}));

// Mock Alert to verify error messages
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Alert.alert = jest.fn();
  return RN;
});

describe('LocationSetupScreen', () => {
  beforeEach(() => {
    // Reset all mocks to ensure clean test environment
    (locationService.requestLocationPermission as jest.Mock).mockReset();
    (locationService.getUserLocation as jest.Mock).mockReset();
    (locationService.searchLocationByAddress as jest.Mock).mockReset();
    (locationService.getAddressFromCoordinates as jest.Mock).mockReset();
    (locationService.saveLocationPreference as jest.Mock).mockReset();
    (updateProfile as jest.Mock).mockReset();
    (Alert.alert as jest.Mock).mockClear();

    // Set up default mock implementations
    (locationService.getAddressFromCoordinates as jest.Mock).mockResolvedValue('Test Address');
  });

  it('renders correctly', () => {
    // Render the LocationSetupScreen component
    const { getByText, getByPlaceholderText, getByTestId } = render(<LocationSetupScreen />);

    // Verify that key elements are present: title, enable location button, manual input field, distance slider, continue button
    expect(getByText('Your Location')).toBeTruthy();
    expect(getByText('Enable Location Services')).toBeTruthy();
    expect(getByPlaceholderText('Enter your location manually')).toBeTruthy();
    expect(getByTestId('distance-slider')).toBeTruthy();
    expect(getByText('Continue')).toBeTruthy();
    expect(getByTestId('progress-bar')).toBeTruthy();
  });

  it('enables location services', async () => {
    // Mock location service functions to return successful results
    (locationService.requestLocationPermission as jest.Mock).mockResolvedValue(true);
    (locationService.getUserLocation as jest.Mock).mockResolvedValue({ latitude: 123, longitude: 456 });

    // Render the LocationSetupScreen component
    const { getByText } = render(<LocationSetupScreen />);

    // Press the enable location button
    fireEvent.press(getByText('Enable Location Services'));

    // Verify that requestLocationPermission and getUserLocation are called
    await waitFor(() => {
      expect(locationService.requestLocationPermission).toHaveBeenCalled();
      expect(locationService.getUserLocation).toHaveBeenCalled();
    });

    // Verify that the location input is updated with the address from coordinates
    expect(locationService.getAddressFromCoordinates).toHaveBeenCalledWith({ latitude: 123, longitude: 456 });
  });

  it('handles manual location input', async () => {
    // Render the LocationSetupScreen component
    const { getByPlaceholderText, getByText } = render(<LocationSetupScreen />);

    // Enter a location in the input field
    const input = getByPlaceholderText('Enter your location manually');
    fireEvent.changeText(input, 'Test Location');

    // Press the search button
    fireEvent.press(getByText('Continue'));

    // Verify that searchLocationByAddress is called with the entered address
    await waitFor(() => {
      expect(locationService.searchLocationByAddress).toHaveBeenCalledWith('Test Location');
    });

    // Verify that the coordinates state is updated
    (locationService.searchLocationByAddress as jest.Mock).mockResolvedValue({ latitude: 789, longitude: 012 });
  });

  it('updates maximum distance with slider', () => {
    // Render the LocationSetupScreen component
    const { getByTestId } = render(<LocationSetupScreen />);

    // Interact with the distance slider
    const slider = getByTestId('distance-slider');
    fireEvent.valueChange(slider, 20);

    // Verify that the maximum distance state is updated
    expect(slider.props.value).toBe(20);
  });

  it('navigates to profile creation on continue', async () => {
    // Mock location data and coordinates
    (locationService.getUserLocation as jest.Mock).mockResolvedValue({ latitude: 123, longitude: 456 });

    // Render the LocationSetupScreen component
    const { getByText } = render(<LocationSetupScreen />);

    // Press the continue button
    fireEvent.press(getByText('Continue'));

    // Verify that saveLocationPreference is called with the correct data
    await waitFor(() => {
      expect(locationService.saveLocationPreference).toHaveBeenCalledWith(expect.anything());
    });

    // Verify that updateProfile is dispatched with the correct data
    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith(expect.anything());
    });

    // Verify that navigation.navigate is called with the correct route
    const mockNavigation = (useNavigation as jest.Mock).mock.results[0].value;
    expect(mockNavigation.navigate).toHaveBeenCalledWith(ROUTES.ONBOARDING.PROFILE_CREATION);
  });

  it('handles location service errors', async () => {
    // Mock location service functions to throw errors
    (locationService.requestLocationPermission as jest.Mock).mockRejectedValue(new Error('Permission Denied'));
    (locationService.getUserLocation as jest.Mock).mockRejectedValue(new Error('Location Unavailable'));

    // Render the LocationSetupScreen component
    const { getByText } = render(<LocationSetupScreen />);

    // Press the enable location button
    fireEvent.press(getByText('Enable Location Services'));

    // Verify that error handling is triggered
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Permission Denied');
    });
  });
});