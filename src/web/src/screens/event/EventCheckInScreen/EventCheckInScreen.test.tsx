import React from 'react'; // React v18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'; // @testing-library/react-native v11.5.0
import EventCheckInScreen from '../EventCheckInScreen';
import { mockEvent } from '../../../mocks/data/events';
import jest from 'jest'; // jest v29.2.1

// Mock implementation of useEvents hook
const mockUseEvents = {
  fetchEvent: jest.fn(),
  checkInToEvent: jest.fn(),
  currentEvent: null,
  loading: false,
  error: null,
};

// Mock implementation of useLocation hook
const mockUseLocation = {
  currentLocation: null,
  getCurrentLocation: jest.fn(),
  isWithinRadius: jest.fn(),
  calculateDistance: jest.fn(),
  isLoading: false,
  error: null,
};

// Mock implementation of useNotifications hook
const mockUseNotifications = {
  showNotification: jest.fn()
};

// Mock navigation object
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn()
};

// Mock route object with event ID parameter
const mockRoute = { params: { eventId: '123' } };

// Function to set up default mock implementations
const setupMocks = () => {
  require('../../../hooks/useEvents').default.mockReturnValue(mockUseEvents);
  require('../../../hooks/useLocation').default.mockReturnValue(mockUseLocation);
  require('../../../hooks/useNotifications').default.mockReturnValue(mockUseNotifications);
};

// Mock the hooks
jest.mock('../../../hooks/useEvents', () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock('../../../hooks/useLocation', () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock('../../../hooks/useNotifications', () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute
}));

describe('EventCheckInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it('should show loading indicator when fetching event', () => {
    require('../../../hooks/useEvents').default.mockReturnValue({
      ...mockUseEvents,
      loading: true,
    });

    render(<EventCheckInScreen />);
    expect(screen.getByText('Verifying location and event details...')).toBeTruthy();
  });

  it('should display error message when fetch fails', () => {
    require('../../../hooks/useEvents').default.mockReturnValue({
      ...mockUseEvents,
      error: 'Failed to fetch event',
    });

    render(<EventCheckInScreen />);
    expect(screen.getByText('Error: Failed to fetch event')).toBeTruthy();
  });

  it('should render event details when data is loaded', () => {
    require('../../../hooks/useEvents').default.mockReturnValue({
      ...mockUseEvents,
      currentEvent: mockEvent,
    });

    render(<EventCheckInScreen />);
    expect(screen.getByText(mockEvent.name)).toBeTruthy();
    expect(screen.getByText(mockEvent.location)).toBeTruthy();
    expect(screen.getByText(new Date(mockEvent.startTime).toLocaleTimeString())).toBeTruthy();
  });

  it('should show location loading state', () => {
    require('../../../hooks/useEvents').default.mockReturnValue({
      ...mockUseEvents,
      currentEvent: mockEvent,
    });
    require('../../../hooks/useLocation').default.mockReturnValue({
      ...mockUseLocation,
      isLoading: true,
    });

    render(<EventCheckInScreen />);
    expect(screen.getByText('Verifying location and event details...')).toBeTruthy();
  });

  it('should display location error message', () => {
    require('../../../hooks/useEvents').default.mockReturnValue({
      ...mockUseEvents,
      currentEvent: mockEvent,
    });
    require('../../../hooks/useLocation').default.mockReturnValue({
      ...mockUseLocation,
      error: 'Location not available',
    });

    render(<EventCheckInScreen />);
    expect(screen.getByText('Error: Location not available')).toBeTruthy();
  });

  it('should show out of range message when user is too far from venue', () => {
    require('../../../hooks/useEvents').default.mockReturnValue({
      ...mockUseEvents,
      currentEvent: mockEvent,
    });
    require('../../../hooks/useLocation').default.mockReturnValue({
      ...mockUseLocation,
      currentLocation: { latitude: 0, longitude: 0 },
      isWithinRadius: () => false,
    });

    render(<EventCheckInScreen />);
    expect(screen.getByText('Not within proximity')).toBeTruthy();
    expect(screen.getByTestId('check-in-button').props.disabled).toBe(true);
  });

  it('should enable check-in when user is within venue range', () => {
    require('../../../hooks/useEvents').default.mockReturnValue({
      ...mockUseEvents,
      currentEvent: mockEvent,
    });
    require('../../../hooks/useLocation').default.mockReturnValue({
      ...mockUseLocation,
      currentLocation: { latitude: 0, longitude: 0 },
      isWithinRadius: () => true,
    });

    render(<EventCheckInScreen />);
    expect(screen.getByText('Within proximity')).toBeTruthy();
    expect(screen.getByTestId('check-in-button').props.disabled).toBe(false);
  });

  it('should handle check-in button press', async () => {
    require('../../../hooks/useEvents').default.mockReturnValue({
      ...mockUseEvents,
      currentEvent: mockEvent,
      checkInToEvent: jest.fn().mockResolvedValue(undefined),
    });
    require('../../../hooks/useLocation').default.mockReturnValue({
      ...mockUseLocation,
      currentLocation: { latitude: 0, longitude: 0 },
      isWithinRadius: () => true,
    });
    require('../../../hooks/useNotifications').default.mockReturnValue({
      ...mockUseNotifications,
      showNotification: jest.fn(),
    });

    render(<EventCheckInScreen />);
    const button = screen.getByTestId('check-in-button');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockUseEvents.checkInToEvent).toHaveBeenCalledWith('123', {
        coordinates: {
          latitude: 0,
          longitude: 0,
        },
      });
      expect(mockUseNotifications.showNotification).toHaveBeenCalledWith({
        message: 'Check-in successful!',
        type: 'success',
      });
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('should handle check-in error', async () => {
    require('../../../hooks/useEvents').default.mockReturnValue({
      ...mockUseEvents,
      currentEvent: mockEvent,
      checkInToEvent: jest.fn().mockRejectedValue(new Error('Check-in failed')),
    });
    require('../../../hooks/useLocation').default.mockReturnValue({
      ...mockUseLocation,
      currentLocation: { latitude: 0, longitude: 0 },
      isWithinRadius: () => true,
    });
    require('../../../hooks/useNotifications').default.mockReturnValue({
      ...mockUseNotifications,
      showNotification: jest.fn(),
    });

    render(<EventCheckInScreen />);
    const button = screen.getByTestId('check-in-button');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockUseEvents.checkInToEvent).toHaveBeenCalled();
      expect(mockUseNotifications.showNotification).toHaveBeenCalledWith({
        message: 'Check-in failed',
        type: 'error',
      });
    });
  });

  it('should show already checked in message when user has already checked in', () => {
    const mockEventWithCheckIn = {
      ...mockEvent,
      attendees: [
        {
          id: 'attendee-1-1',
          eventId: 'event-1',
          userId: 'user-1',
          profile: getBasicUserInfo('user-1'),
          rsvpStatus: 'GOING',
          rsvpTime: new Date('2023-07-01T16:00:00Z'),
          hasCheckedIn: true,
          checkedInAt: new Date(),
          paymentStatus: 'NOT_REQUIRED',
        },
      ],
    };

    require('../../../hooks/useEvents').default.mockReturnValue({
      ...mockUseEvents,
      currentEvent: mockEventWithCheckIn,
    });
    require('../../../hooks/useLocation').default.mockReturnValue({
      ...mockUseLocation,
      currentLocation: { latitude: 0, longitude: 0 },
      isWithinRadius: () => true,
    });

    render(<EventCheckInScreen />);
    expect(screen.getByText('Already checked in')).toBeTruthy();
    expect(screen.getByTestId('check-in-button').props.disabled).toBe(true);

    function getBasicUserInfo(arg0: string): { id: string; name: string; avatarUrl: string; } {
        throw new Error('Function not implemented.');
    }
  });
});