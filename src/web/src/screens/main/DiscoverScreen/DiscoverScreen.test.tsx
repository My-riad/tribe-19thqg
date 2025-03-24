import React from 'react'; // React v18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'; // @testing-library/react-native v12.1.2
import { DiscoverScreen } from './DiscoverScreen';
import useTribes from '../../../hooks/useTribes';
import useLocation from '../../../hooks/useLocation';
import { NavigationService } from '../../../navigation/NavigationService';
import { mockTribes, mockTribeSuggestions } from '../../../mocks/data/tribes';
import { TribeTypes } from '../../../types/tribe.types';
import { Coordinates } from '../../../types/profile.types';
import { LoadingIndicator } from '../../../components/ui/LoadingIndicator/LoadingIndicator';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import { SectionTitle } from './DiscoverScreen.styles';

// Mock the useTribes hook to control its behavior in tests
jest.mock('../../../hooks/useTribes', () => {
  const originalModule = jest.requireActual('../../../hooks/useTribes');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(),
  };
});

// Mock the useLocation hook to control its behavior in tests
jest.mock('../../../hooks/useLocation', () => {
  const originalModule = jest.requireActual('../../../hooks/useLocation');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(),
  };
});

// Mock the NavigationService to verify navigation calls
jest.mock('../../../navigation/NavigationService', () => ({
  NavigationService: {
    navigateToTribe: jest.fn(),
    navigateToCreateTribe: jest.fn(),
  },
}));

describe('DiscoverScreen', () => {
  beforeEach(() => {
    // Reset all mocks to ensure clean test environment
    (useTribes as jest.Mock).mockClear();
    (useLocation as jest.Mock).mockClear();
    (NavigationService.navigateToTribe as jest.Mock).mockClear();
    (NavigationService.navigateToCreateTribe as jest.Mock).mockClear();

    // Setup default mock implementations for hooks and services
    (useTribes as jest.Mock).mockReturnValue({
      suggestedTribes: [],
      tribes: {},
      searchForTribes: jest.fn(),
      loading: false,
      searchLoading: false,
      setActiveTribe: jest.fn(),
      resetCreationStatus: jest.fn(),
      getUserTribes: jest.fn(),
      getTribeById: jest.fn(),
      getTribeMembers: jest.fn(),
      getTribeActivity: jest.fn(),
      getTribeEngagement: jest.fn(),
      createNewTribe: jest.fn(),
      updateExistingTribe: jest.fn(),
      joinExistingTribe: jest.fn(),
      leaveCurrentTribe: jest.fn(),
      clearError: jest.fn(),
    });

    (useLocation as jest.Mock).mockReturnValue({
      currentLocation: null,
      permissionStatus: true,
      isLoading: false,
      error: null,
      requestPermission: jest.fn(),
      getCurrentLocation: jest.fn(),
      startTracking: jest.fn(),
      stopTracking: jest.fn(),
      searchByAddress: jest.fn(),
      getAddressFromCoordinates: jest.fn(),
      calculateDistance: jest.fn(),
      isWithinRadius: jest.fn(),
      getNearbyLocations: jest.fn(),
      savePreference: jest.fn(),
      getPreference: jest.fn(),
      clearData: jest.fn(),
    });
  });

  test('renders loading state correctly', () => {
    // Mock useTribes to return loading state
    (useTribes as jest.Mock).mockReturnValue({
      ...((useTribes as jest.Mock).getMockImplementation() as any),
      loading: true,
    });

    // Render the DiscoverScreen component
    render(<DiscoverScreen />);

    // Verify that loading indicators are displayed
    expect(screen.getByTestId('loading-indicator')).toBeVisible();

    // Verify that other content is not displayed while loading
    expect(screen.queryByText('Recommended Tribes')).toBeNull();
  });

  test('renders suggested tribes correctly', () => {
    // Mock useTribes to return suggested tribes
    const mockTribesData: Record<string, TribeTypes.Tribe> = {};
    mockTribes.forEach(tribe => mockTribesData[tribe.id] = tribe);

    (useTribes as jest.Mock).mockReturnValue({
      ...((useTribes as jest.Mock).getMockImplementation() as any),
      suggestedTribes: mockTribes.map(tribe => tribe.id),
      tribes: mockTribesData,
      loading: false,
    });

    // Render the DiscoverScreen component
    render(<DiscoverScreen />);

    // Verify that suggested tribes section is displayed
    expect(screen.getByText('Recommended Tribes')).toBeVisible();

    // Verify that tribe cards are rendered with correct data
    mockTribes.forEach(tribe => {
      expect(screen.getByText(tribe.name)).toBeVisible();
      // Verify that compatibility scores are displayed
      if (tribe.compatibilityScore !== null) {
        expect(screen.getByText(`${tribe.compatibilityScore}% Match`)).toBeVisible();
      }
    });
  });

  test('renders nearby tribes correctly', () => {
    // Mock useTribes to return nearby tribes
    const mockTribesData: Record<string, TribeTypes.Tribe> = {};
    mockTribes.forEach(tribe => mockTribesData[tribe.id] = tribe);

    (useTribes as jest.Mock).mockReturnValue({
      ...((useTribes as jest.Mock).getMockImplementation() as any),
      suggestedTribes: mockTribes.map(tribe => tribe.id),
      tribes: mockTribesData,
      loading: false,
    });

    // Mock useLocation to return current location
    const mockLocation: Coordinates = { latitude: 47.6062, longitude: -122.3321 };
    (useLocation as jest.Mock).mockReturnValue({
      ...((useLocation as jest.Mock).getMockImplementation() as any),
      currentLocation: mockLocation,
    });

    // Render the DiscoverScreen component
    render(<DiscoverScreen />);

    // Verify that nearby tribes section is displayed when location is available
    expect(screen.getByText('Recommended Tribes')).toBeVisible();

    // Verify that tribe cards are rendered with correct data
    mockTribes.forEach(tribe => {
      expect(screen.getByText(tribe.name)).toBeVisible();
    });
  });

  test('handles search input correctly', async () => {
    const searchForTribesMock = jest.fn();
    (useTribes as jest.Mock).mockReturnValue({
      ...((useTribes as jest.Mock).getMockImplementation() as any),
      suggestedTribes: [],
      tribes: {},
      searchForTribes: searchForTribesMock,
      loading: false,
      searchLoading: false,
      setActiveTribe: jest.fn(),
      resetCreationStatus: jest.fn(),
      getUserTribes: jest.fn(),
      getTribeById: jest.fn(),
      getTribeMembers: jest.fn(),
      getTribeActivity: jest.fn(),
      getTribeEngagement: jest.fn(),
      createNewTribe: jest.fn(),
      updateExistingTribe: jest.fn(),
      joinExistingTribe: jest.fn(),
      leaveCurrentTribe: jest.fn(),
      clearError: jest.fn(),
    });

    render(<DiscoverScreen />);

    const searchInput = screen.getByPlaceholderText('Search for Tribes, interests...') as TextInput;
    fireEvent.changeText(searchInput, 'test search');

    // Wait for the debounced search to be called
    await waitFor(() => {
      expect(searchForTribesMock).toHaveBeenCalledWith({ query: 'test search', location: '', coordinates: { latitude: 0, longitude: 0 }, radius: 10 });
    });
  });

  test('handles filter selection correctly', () => {
    const searchForTribesMock = jest.fn();
    (useTribes as jest.Mock).mockReturnValue({
      ...((useTribes as jest.Mock).getMockImplementation() as any),
      suggestedTribes: [],
      tribes: {},
      searchForTribes: searchForTribesMock,
      loading: false,
      searchLoading: false,
      setActiveTribe: jest.fn(),
      resetCreationStatus: jest.fn(),
      getUserTribes: jest.fn(),
      getTribeById: jest.fn(),
      getTribeMembers: jest.fn(),
      getTribeActivity: jest.fn(),
      getTribeEngagement: jest.fn(),
      createNewTribe: jest.fn(),
      updateExistingTribe: jest.fn(),
      joinExistingTribe: jest.fn(),
      leaveCurrentTribe: jest.fn(),
      clearError: jest.fn(),
    });

    const mockLocation: Coordinates = { latitude: 47.6062, longitude: -122.3321 };
    (useLocation as jest.Mock).mockReturnValue({
      ...((useLocation as jest.Mock).getMockImplementation() as any),
      currentLocation: mockLocation,
    });

    render(<DiscoverScreen />);

    const nearbyFilterButton = screen.getByText('Nearby') as TouchableOpacity;
    fireEvent.press(nearbyFilterButton);

    expect(searchForTribesMock).toHaveBeenCalledWith({ query: '', location: 'Seattle, WA', coordinates: { latitude: 47.6062, longitude: -122.3321 }, radius: 10 });
  });

  test('navigates to tribe detail on tribe card press', () => {
    const mockTribesData: Record<string, TribeTypes.Tribe> = {};
    mockTribes.forEach(tribe => mockTribesData[tribe.id] = tribe);

    (useTribes as jest.Mock).mockReturnValue({
      ...((useTribes as jest.Mock).getMockImplementation() as any),
      suggestedTribes: mockTribes.map(tribe => tribe.id),
      tribes: mockTribesData,
      loading: false,
    });

    render(<DiscoverScreen />);

    const tribeCard = screen.getByText(mockTribes[0].name);
    fireEvent.press(tribeCard);

    expect(NavigationService.navigateToTribe).toHaveBeenCalledWith('TribeDetail', { tribeId: mockTribes[0].id });
  });

  test('navigates to create tribe screen on button press', () => {
    render(<DiscoverScreen />);

    const createTribeButton = screen.getByText('Create a New Tribe');
    fireEvent.press(createTribeButton);

    expect(NavigationService.navigateToCreateTribe).toHaveBeenCalled();
  });

  test('renders empty state when no tribes found', () => {
    (useTribes as jest.Mock).mockReturnValue({
      ...((useTribes as jest.Mock).getMockImplementation() as any),
      suggestedTribes: [],
      tribes: {},
      loading: false,
    });

    render(<DiscoverScreen />);

    expect(screen.getByText('No recommended tribes found')).toBeVisible();
    expect(screen.getByText('Create a New Tribe')).toBeVisible();
  });

  test('handles refresh correctly', () => {
    const getSuggestedTribesMock = jest.fn();
    (useTribes as jest.Mock).mockReturnValue({
      ...((useTribes as jest.Mock).getMockImplementation() as any),
      suggestedTribes: [],
      tribes: {},
      loading: false,
      getSuggestedTribes: getSuggestedTribesMock,
    });

    render(<DiscoverScreen />);

    const refreshControl = screen.getByTestId('tribe-list-flatlist');
    fireEvent(refreshControl, 'refresh');

    expect(getSuggestedTribesMock).toHaveBeenCalled();
  });
});