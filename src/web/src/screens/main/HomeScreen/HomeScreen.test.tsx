import React from 'react'; // React v18.2.0
import { render, screen, fireEvent } from '@testing-library/react-native'; // @testing-library/react-native v12.0.0
import HomeScreen from './HomeScreen';
import { NavigationService } from '../../navigation/NavigationService';
import { useAuth } from '../../hooks/useAuth';
import useTribes from '../../hooks/useTribes';
import { useEvents } from '../../hooks/useEvents';
import { useNotifications } from '../../hooks/useNotifications';
import { ROUTES } from '../../constants/navigationRoutes';
import { ActivityIndicator } from 'react-native';
import { Text } from 'react-native';

// Mock the NavigationService
jest.mock('../../navigation/NavigationService', () => ({
  NavigationService: {
    navigateToTribe: jest.fn(),
    navigateToEvent: jest.fn(),
    navigateToNotification: jest.fn(),
  },
}));

// Mock the useAuth hook
jest.mock('../../hooks/useAuth');

// Mock the useTribes hook
jest.mock('../../hooks/useTribes');

// Mock the useEvents hook
jest.mock('../../hooks/useEvents');

// Mock the useNotifications hook
jest.mock('../../hooks/useNotifications');

/**
 * Mock implementation of the useAuth hook
 * @returns Mock auth data and functions
 */
const mockUseAuth = () => {
  (useAuth as jest.Mock).mockReturnValue({
    user: {
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com',
      isEmailVerified: true,
      createdAt: '2023-08-01T00:00:00.000Z',
      lastLogin: '2023-08-01T00:00:00.000Z',
      profileCompleted: true,
      hasCompletedOnboarding: true,
      mfaEnabled: false,
      preferredMfaMethod: null,
    },
    isAuthenticated: true,
    loading: false,
    error: null,
    mfaRequired: false,
    mfaChallenge: null,
    login: jest.fn(),
    register: jest.fn(),
    socialLogin: jest.fn(),
    logout: jest.fn(),
    verifyMFA: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    checkAuthStatus: jest.fn(),
  });
};

/**
 * Mock implementation of the useTribes hook
 * @returns Mock tribe data and functions
 */
const mockUseTribes = () => {
  (useTribes as jest.Mock).mockReturnValue({
    tribes: {
      tribe1: {
        id: 'tribe1',
        name: 'Test Tribe 1',
        description: 'Test Tribe Description 1',
        memberCount: 5,
        location: 'Test Location 1',
        imageUrl: 'https://example.com/tribe1.jpg',
        compatibilityScore: 85,
        status: 'active',
        members: [],
        primaryInterests: [],
        secondaryInterests: [],
        createdBy: 'user1',
        createdAt: new Date(),
        coordinates: { latitude: 0, longitude: 0 },
        privacy: 'public',
        maxMembers: 8,
        lastActivity: new Date(),
        upcomingEventCount: 0,
        isAiGenerated: false,
        metadata: {}
      },
      tribe2: {
        id: 'tribe2',
        name: 'Test Tribe 2',
        description: 'Test Tribe Description 2',
        memberCount: 3,
        location: 'Test Location 2',
        imageUrl: 'https://example.com/tribe2.jpg',
        compatibilityScore: 60,
        status: 'inactive',
        members: [],
        primaryInterests: [],
        secondaryInterests: [],
        createdBy: 'user2',
        createdAt: new Date(),
        coordinates: { latitude: 0, longitude: 0 },
        privacy: 'private',
        maxMembers: 8,
        lastActivity: new Date(),
        upcomingEventCount: 0,
        isAiGenerated: false,
        metadata: {}
      },
    },
    userTribes: ['tribe1'],
    suggestedTribes: ['tribe2'],
    currentTribe: null,
    loading: false,
    error: null,
    tribeCreationStatus: 'IDLE',
    getUserTribes: jest.fn(),
    getTribeById: jest.fn(),
    getTribeMembers: jest.fn(),
    getTribeActivity: jest.fn(),
    getTribeEngagement: jest.fn(),
    createNewTribe: jest.fn(),
    updateExistingTribe: jest.fn(),
    searchForTribes: jest.fn(),
    joinExistingTribe: jest.fn(),
    leaveCurrentTribe: jest.fn(),
    setActiveTribe: jest.fn(),
    clearError: jest.fn(),
    resetCreationStatus: jest.fn(),
  });
};

/**
 * Mock implementation of the useEvents hook
 * @returns Mock event data and functions
 */
const mockUseEvents = () => {
  (useEvents as jest.Mock).mockReturnValue({
    events: [
      {
        id: 'event1',
        name: 'Test Event 1',
        description: 'Test Event Description 1',
        location: 'Test Event Location 1',
        startTime: new Date(),
        endTime: new Date(),
        tribeId: 'tribe1',
        status: 'scheduled',
        imageUrl: 'https://example.com/event1.jpg',
        attendeeCount: 4,
        maxAttendees: 10,
        cost: 0,
        isAiGenerated: false,
        userRsvpStatus: 'going',
        coordinates: { latitude: 0, longitude: 0 },
        venueId: 'venue1',
        weatherData: { condition: 'sunny', temperature: 25, temperatureUnit: 'C', precipitation: 0, humidity: 50, windSpeed: 10, iconUrl: '', forecast: '' },
        attendees: [],
        eventType: 'outdoor_activity',
        paymentStatus: 'not_required',
        tribe: { id: 'tribe1', name: 'Test Tribe 1' },
        createdBy: 'user1',
        createdAt: new Date(),
        venueDetails: { id: 'venue1', name: 'Venue 1', address: 'Address 1', coordinates: { latitude: 0, longitude: 0 }, phoneNumber: '', website: '', rating: 0, priceLevel: 0, photos: [], openingHours: {}, amenities: [] },
        metadata: {}
      },
    ],
    userEvents: [],
    suggestedEvents: [],
    currentEvent: null,
    optimalTimeSlots: [],
    loading: false,
    error: null,
    fetchEvents: jest.fn(),
    fetchUserEvents: jest.fn(),
    fetchEvent: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
    rsvpToEvent: jest.fn(),
    checkInToEvent: jest.fn(),
    fetchEventAttendees: jest.fn(),
    discoverEvents: jest.fn(),
    getEventRecommendations: jest.fn(),
    getWeatherBasedSuggestions: jest.fn(),
    getOptimalTimeSlots: jest.fn(),
    clearError: jest.fn(),
    isUserAttending: jest.fn(),
    isUserCreator: jest.fn(),
  });
};

/**
 * Mock implementation of the useNotifications hook
 * @returns Mock notification data and functions
 */
const mockUseNotifications = () => {
  (useNotifications as jest.Mock).mockReturnValue({
    notifications: [],
    unreadCount: 0,
    preferences: [],
    permissionsGranted: true,
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
    updateTypePreference: jest.fn(),
    subscribeToPush: jest.fn(),
    unsubscribeFromPush: jest.fn(),
    requestPermissions: jest.fn(),
    showLocalNotification: jest.fn(),
    handleNotificationOpen: jest.fn(),
    syncNotifications: jest.fn(),
  });
};

/**
 * Setup function to prepare the test environment
 */
const setup = () => {
  mockUseAuth();
  mockUseTribes();
  mockUseEvents();
  mockUseNotifications();

  jest.spyOn(NavigationService, 'navigateToTribe');
  jest.spyOn(NavigationService, 'navigateToEvent');
  jest.spyOn(NavigationService, 'navigateToNotification');
};

describe('HomeScreen', () => {
  beforeEach(() => {
    setup();
  });

  it('renders correctly with user data', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Good morning, Test User')).toBeTruthy();
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('displays user tribes correctly', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Your Tribes')).toBeTruthy();
    expect(screen.getByText('Test Tribe 1')).toBeTruthy();
    expect(screen.getByText('5 members')).toBeTruthy();
  });

  it('displays suggested tribes correctly', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Suggested Tribes')).toBeTruthy();
    expect(screen.getByText('Test Tribe 2')).toBeTruthy();
    expect(screen.getByText('3 members')).toBeTruthy();
  });

  it('displays upcoming events correctly', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Upcoming Events')).toBeTruthy();
    expect(screen.getByText('Test Event 1')).toBeTruthy();
    expect(screen.getByText('4 attending')).toBeTruthy();
  });

  it('displays AI prompt when available', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications(),
      notifications: [{
        id: 'notification1',
        type: 'AI_SUGGESTION',
        title: 'AI Suggestion',
        message: 'Test AI Prompt',
        isRead: false,
        createdAt: new Date(),
        sender: null,
        priority: 'medium',
        payload: {},
        actionUrl: null,
        imageUrl: null,
      }],
    });
    render(<HomeScreen />);
    expect(screen.getByText('Test AI Prompt')).toBeTruthy();
  });

  it('navigates to tribe details when tribe card is pressed', () => {
    render(<HomeScreen />);
    const tribeCard = screen.getByText('Test Tribe 1');
    fireEvent.press(tribeCard);
    expect(NavigationService.navigateToTribe).toHaveBeenCalledWith(ROUTES.TRIBE.TRIBE_DETAIL, { tribeId: 'tribe1' });
  });

  it('navigates to event details when event card is pressed', () => {
    render(<HomeScreen />);
    const eventCard = screen.getByText('Test Event 1');
    fireEvent.press(eventCard);
    expect(NavigationService.navigateToEvent).toHaveBeenCalledWith(ROUTES.EVENT.EVENT_DETAIL, { eventId: 'event1' });
  });

  it('navigates to notifications when notification button is pressed', () => {
    render(<HomeScreen />);
    const notificationButton = screen.getByRole('button');
    fireEvent.press(notificationButton);
    expect(NavigationService.navigateToNotification).toHaveBeenCalled();
  });

  it('displays loading indicators when data is being fetched', () => {
    (useTribes as jest.Mock).mockReturnValue({
      ...mockUseTribes(),
      loading: true,
    });
    (useEvents as jest.Mock).mockReturnValue({
      ...mockUseEvents(),
      loading: true,
    });
    render(<HomeScreen />);
    expect(screen.getAllByType(ActivityIndicator).length).toBeGreaterThanOrEqual(1);
  });

  it('displays empty state when no tribes or events are available', () => {
    (useTribes as jest.Mock).mockReturnValue({
      ...mockUseTribes(),
      userTribes: [],
      suggestedTribes: [],
    });
    (useEvents as jest.Mock).mockReturnValue({
      ...mockUseEvents(),
      events: [],
    });
    render(<HomeScreen />);
    expect(screen.getByText('No tribes yet. Create or join one!')).toBeTruthy();
    expect(screen.getByText('No upcoming events. Plan one now!')).toBeTruthy();
  });

  it('refreshes data when pull-to-refresh is triggered', () => {
    const fetchTribesMock = jest.fn();
    const fetchEventsMock = jest.fn();
    (useTribes as jest.Mock).mockReturnValue({
      ...mockUseTribes(),
      getUserTribes: fetchTribesMock,
    });
    (useEvents as jest.Mock).mockReturnValue({
      ...mockUseEvents(),
      fetchEvents: fetchEventsMock,
    });
    render(<HomeScreen />);
    const scrollView = screen.getByTestId('home-screen-scrollview');
    fireEvent(scrollView, 'refresh');
    expect(fetchTribesMock).toHaveBeenCalled();
    expect(fetchEventsMock).toHaveBeenCalled();
  });
});