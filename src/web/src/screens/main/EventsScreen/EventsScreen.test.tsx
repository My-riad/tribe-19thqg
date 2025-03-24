import React from 'react'; // react ^18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // @testing-library/react-native ^11.5.0
import { EventsScreen } from './EventsScreen'; // Import the component being tested
import EventCard from '../../../components/event/EventCard'; // Import the EventCard component for testing event rendering
import { useEvents } from '../../../hooks/useEvents'; // Import the useEvents hook for mocking
import { useLocation } from '../../../hooks/useLocation'; // Import the useLocation hook for mocking
import { useAuth } from '../../../hooks/useAuth'; // Import the useAuth hook for mocking
import { ROUTES } from '../../../constants/navigationRoutes'; // Import navigation routes for testing navigation
import { EventTypes } from '../../../types/event.types'; // Import event type definitions for test data
import { View, Text } from 'react-native';
import { MockedFunction } from 'jest-mock';

// Sample event data for testing the events list rendering
const mockEvents: EventTypes.Event[] = [
  {
    id: '1',
    name: 'Sample Event 1',
    description: 'Description for Sample Event 1',
    eventType: EventTypes.EventType.OUTDOOR_ACTIVITY,
    location: 'Sample Location 1',
    coordinates: { latitude: 0, longitude: 0 },
    venueId: 'venue1',
    venueDetails: {
      id: 'venue1',
      name: 'Venue 1',
      address: '123 Main St',
      coordinates: { latitude: 0, longitude: 0 },
      phoneNumber: '123-456-7890',
      website: 'http://example.com',
      rating: 4.5,
      priceLevel: 2,
      photos: [],
      openingHours: {},
      amenities: [],
    },
    startTime: new Date('2024-07-20T10:00:00.000Z'),
    endTime: new Date('2024-07-20T12:00:00.000Z'),
    tribeId: 'tribe1',
    tribe: {
      id: 'tribe1',
      name: 'Sample Tribe',
      description: 'Description for Sample Tribe',
      location: 'Sample Location 1',
      coordinates: { latitude: 0, longitude: 0 },
      imageUrl: 'http://example.com/image.jpg',
      coverImageUrl: 'http://example.com/cover.jpg',
      createdAt: new Date(),
      createdBy: 'user1',
      status: 'ACTIVE',
      privacy: 'PUBLIC',
      maxMembers: 8,
      memberCount: 5,
      members: [],
      activities: [],
      goals: [],
      primaryInterests: [],
      secondaryInterests: [],
      compatibilityScore: 0.8,
      lastActivity: new Date(),
      upcomingEventCount: 2,
      isAiGenerated: false,
      metadata: {},
    },
    createdBy: 'user1',
    createdAt: new Date(),
    status: EventTypes.EventStatus.SCHEDULED,
    imageUrl: 'http://example.com/image.jpg',
    attendees: [],
    attendeeCount: 3,
    maxAttendees: 10,
    cost: 25,
    paymentStatus: EventTypes.PaymentStatus.COMPLETED,
    weatherData: {
      condition: 'Sunny',
      temperature: 25,
      temperatureUnit: 'C',
      precipitation: 0,
      humidity: 60,
      windSpeed: 15,
      iconUrl: 'http://example.com/weather.png',
      forecast: 'Sunny with clear skies',
    },
    isAiGenerated: true,
    userRsvpStatus: EventTypes.RSVPStatus.GOING,
    metadata: {},
  },
  {
    id: '2',
    name: 'Sample Event 2',
    description: 'Description for Sample Event 2',
    eventType: EventTypes.EventType.INDOOR_ACTIVITY,
    location: 'Sample Location 2',
    coordinates: { latitude: 0, longitude: 0 },
    venueId: 'venue2',
    venueDetails: {
      id: 'venue2',
      name: 'Venue 2',
      address: '456 Elm St',
      coordinates: { latitude: 0, longitude: 0 },
      phoneNumber: '987-654-3210',
      website: 'http://example2.com',
      rating: 4.0,
      priceLevel: 1,
      photos: [],
      openingHours: {},
      amenities: [],
    },
    startTime: new Date('2023-07-22T14:00:00.000Z'),
    endTime: new Date('2023-07-22T16:00:00.000Z'),
    tribeId: 'tribe2',
    tribe: {
      id: 'tribe2',
      name: 'Sample Tribe 2',
      description: 'Description for Sample Tribe 2',
      location: 'Sample Location 2',
      coordinates: { latitude: 0, longitude: 0 },
      imageUrl: 'http://example2.com/image.jpg',
      coverImageUrl: 'http://example2.com/cover.jpg',
      createdAt: new Date(),
      createdBy: 'user2',
      status: 'ACTIVE',
      privacy: 'PUBLIC',
      maxMembers: 8,
      memberCount: 6,
      members: [],
      activities: [],
      goals: [],
      primaryInterests: [],
      secondaryInterests: [],
      compatibilityScore: 0.9,
      lastActivity: new Date(),
      upcomingEventCount: 1,
      isAiGenerated: false,
      metadata: {},
    },
    createdBy: 'user2',
    createdAt: new Date(),
    status: EventTypes.EventStatus.SCHEDULED,
    imageUrl: 'http://example2.com/image.jpg',
    attendees: [],
    attendeeCount: 5,
    maxAttendees: 12,
    cost: 15,
    paymentStatus: EventTypes.PaymentStatus.COMPLETED,
    weatherData: {
      condition: 'Cloudy',
      temperature: 20,
      temperatureUnit: 'C',
      precipitation: 10,
      humidity: 75,
      windSpeed: 8,
      iconUrl: 'http://example.com/cloudy.png',
      forecast: 'Cloudy with a chance of rain',
    },
    isAiGenerated: true,
    userRsvpStatus: EventTypes.RSVPStatus.MAYBE,
    metadata: {},
  },
];

// Sample event suggestion data for testing the recommended events section
const mockSuggestedEvents: EventTypes.EventSuggestion[] = [
  {
    event: mockEvents[0],
    matchScore: 0.95,
    matchReasons: ['Shared interest in outdoor activities', 'High compatibility with tribe members'],
    suggestedAt: new Date(),
    weatherSuitability: 0.8,
    budgetFriendliness: 0.7,
  },
];

// Creates a mock navigation object for testing navigation functionality
const mockNavigation = () => ({
  navigate: jest.fn(),
});

// Creates a mock event object for testing
const createMockEvent = (overrides?: Partial<EventTypes.Event>): EventTypes.Event => ({
  id: '1',
  name: 'Mock Event',
  description: 'Mock Event Description',
  eventType: EventTypes.EventType.OUTDOOR_ACTIVITY,
  location: 'Mock Location',
  coordinates: { latitude: 0, longitude: 0 },
  venueId: 'mockVenueId',
  venueDetails: {
    id: 'mockVenueId',
    name: 'Mock Venue',
    address: 'Mock Address',
    coordinates: { latitude: 0, longitude: 0 },
    phoneNumber: '123-456-7890',
    website: 'http://mockvenue.com',
    rating: 4.0,
    priceLevel: 2,
    photos: [],
    openingHours: {},
    amenities: [],
  },
  startTime: new Date(),
  endTime: new Date(),
  tribeId: 'mockTribeId',
  tribe: {
    id: 'mockTribeId',
    name: 'Mock Tribe',
    description: 'Mock Tribe Description',
    location: 'Mock Location',
    coordinates: { latitude: 0, longitude: 0 },
    imageUrl: 'http://mocktribe.com/image.jpg',
    coverImageUrl: 'http://mocktribe.com/cover.jpg',
    createdAt: new Date(),
    createdBy: 'mockUserId',
    status: 'ACTIVE',
    privacy: 'PUBLIC',
    maxMembers: 8,
    memberCount: 5,
    members: [],
    activities: [],
    goals: [],
    primaryInterests: [],
    secondaryInterests: [],
    compatibilityScore: 0.8,
    lastActivity: new Date(),
    upcomingEventCount: 2,
    isAiGenerated: false,
    metadata: {},
  },
  createdBy: 'mockUserId',
  createdAt: new Date(),
  status: EventTypes.EventStatus.SCHEDULED,
  imageUrl: 'http://mockevent.com/image.jpg',
  attendees: [],
  attendeeCount: 3,
  maxAttendees: 10,
  cost: 25,
  paymentStatus: EventTypes.PaymentStatus.COMPLETED,
  weatherData: {
    condition: 'Sunny',
    temperature: 25,
    temperatureUnit: 'C',
    precipitation: 0,
    humidity: 60,
    windSpeed: 15,
    iconUrl: 'http://mockweather.com/weather.png',
    forecast: 'Sunny with clear skies',
  },
  isAiGenerated: true,
  userRsvpStatus: EventTypes.RSVPStatus.GOING,
  metadata: {},
  ...overrides,
});

// Creates a mock event suggestion object for testing
const createMockEventSuggestion = (overrides?: Partial<EventTypes.EventSuggestion>): EventTypes.EventSuggestion => ({
  event: createMockEvent(),
  matchScore: 0.9,
  matchReasons: ['Shared interest', 'High compatibility'],
  suggestedAt: new Date(),
  weatherSuitability: 0.8,
  budgetFriendliness: 0.7,
  ...overrides,
});

// Sets up all required mocks for the EventsScreen tests
const setupMocks = (mockConfig: {
  events?: EventTypes.Event[];
  userEvents?: EventTypes.Event[];
  suggestedEvents?: EventTypes.EventSuggestion[];
  loading?: boolean;
  currentLocation?: any;
  isAuthenticated?: boolean;
  fetchEvents?: MockedFunction<any>;
  fetchUserEvents?: MockedFunction<any>;
  getEventRecommendations?: MockedFunction<any>;
  getWeatherBasedSuggestions?: MockedFunction<any>;
}) => {
  const {
    events = [],
    userEvents = [],
    suggestedEvents = [],
    loading = false,
    currentLocation = { location: 'Seattle, WA', coordinates: { latitude: 47.6062, longitude: -122.3321 } },
    isAuthenticated = true,
    fetchEvents = jest.fn(),
    fetchUserEvents = jest.fn(),
    getEventRecommendations = jest.fn(),
    getWeatherBasedSuggestions = jest.fn(),
  } = mockConfig;

  jest.mock('../../../hooks/useEvents', () => ({
    useEvents: () => ({
      events,
      userEvents,
      suggestedEvents,
      loading,
      fetchEvents,
      fetchUserEvents,
      getEventRecommendations,
      getWeatherBasedSuggestions,
    }),
  }));

  jest.mock('../../../hooks/useLocation', () => ({
    useLocation: () => ({
      currentLocation,
    }),
  }));

  jest.mock('../../../hooks/useAuth', () => ({
    useAuth: () => ({
      isAuthenticated,
    }),
  }));

  const mockFocusEffect = jest.fn();
  jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: (callback: () => void) => {
      mockFocusEffect.mockImplementation(callback);
    },
  }));

  return {
    fetchEvents,
    fetchUserEvents,
    getEventRecommendations,
    getWeatherBasedSuggestions,
    mockFocusEffect,
  };
};

describe('EventsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with events data', () => {
    // Arrange
    const { fetchEvents, fetchUserEvents } = setupMocks({ events: mockEvents, userEvents: mockEvents, suggestedEvents: mockSuggestedEvents });
    const navigation = mockNavigation();

    // Act
    const { getByText, getAllByTestId } = render(<EventsScreen navigation={navigation} />);

    // Assert
    expect(getByText('Upcoming Events')).toBeTruthy();
    expect(getByText('This Weekend')).toBeTruthy();
    expect(getByText('Recommended for You')).toBeTruthy();
    expect(getAllByTestId('event-card')).toHaveLength(mockEvents.length + mockSuggestedEvents.length);
    expect(getByText('Create Event')).toBeTruthy();
  });

  it('displays loading indicator when loading', () => {
    // Arrange
    setupMocks({ loading: true });
    const navigation = mockNavigation();

    // Act
    const { getByTestId, queryByTestId } = render(<EventsScreen navigation={navigation} />);

    // Assert
    expect(getByTestId('loading-indicator')).toBeTruthy();
    expect(queryByTestId('event-card')).toBeNull();
  });

  it('displays empty state when no events', () => {
    // Arrange
    setupMocks({ events: [], userEvents: [], suggestedEvents: [] });
    const navigation = mockNavigation();

    // Act
    const { getByText, queryByTestId } = render(<EventsScreen navigation={navigation} />);

    // Assert
    expect(getByText('No events available. Create an event or join a tribe to see events here!')).toBeTruthy();
    expect(queryByTestId('event-card')).toBeNull();
  });

  it('navigates to event details when event card is pressed', () => {
    // Arrange
    const { fetchEvents, fetchUserEvents } = setupMocks({ events: mockEvents, userEvents: mockEvents, suggestedEvents: mockSuggestedEvents });
    const navigation = mockNavigation();
    const { getAllByTestId } = render(<EventsScreen navigation={navigation} />);

    // Act
    const eventCard = getAllByTestId('event-card')[0];
    fireEvent.press(eventCard);

    // Assert
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.EVENT.EVENT_DETAIL, { eventId: '1' });
  });

  it('navigates to event planning when create event button is pressed', () => {
    // Arrange
    setupMocks({ isAuthenticated: true });
    const navigation = mockNavigation();
    const { getByText } = render(<EventsScreen navigation={navigation} />);

    // Act
    fireEvent.press(getByText('Create Event'));

    // Assert
    expect(navigation.navigate).toHaveBeenCalledWith(ROUTES.EVENT.EVENT_PLANNING);
  });

  it('fetches events on focus', () => {
    // Arrange
    const { fetchEvents, fetchUserEvents, mockFocusEffect } = setupMocks({ isAuthenticated: true });
    const navigation = mockNavigation();
    render(<EventsScreen navigation={navigation} />);

    // Act
    act(() => {
      mockFocusEffect();
    });

    // Assert
    expect(fetchEvents).toHaveBeenCalled();
    expect(fetchUserEvents).toHaveBeenCalled();
  });

  it('fetches event recommendations when location changes', () => {
    // Arrange
    const { getEventRecommendations, getWeatherBasedSuggestions } = setupMocks({
      isAuthenticated: true,
      currentLocation: { location: 'New York, NY', coordinates: { latitude: 40.7128, longitude: -74.0060 } },
    });
    const navigation = mockNavigation();

    // Act
    render(<EventsScreen navigation={navigation} />);

    // Assert
    expect(getEventRecommendations).toHaveBeenCalledWith({
      location: 'New York, NY',
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
    });
    expect(getWeatherBasedSuggestions).toHaveBeenCalledWith({
      location: 'New York, NY',
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
    });
  });

  it('handles refresh correctly', () => {
    // Arrange
    const { fetchEvents, fetchUserEvents, getEventRecommendations } = setupMocks({
      events: mockEvents,
      userEvents: mockEvents,
      suggestedEvents: mockSuggestedEvents,
      isAuthenticated: true,
      currentLocation: { location: 'Seattle, WA', coordinates: { latitude: 47.6062, longitude: -122.3321 } },
    });
    const navigation = mockNavigation();
    const { getByTestId } = render(<EventsScreen navigation={navigation} />);

    // Act
    fireEvent(getByTestId('events-screen-container'), 'refresh');

    // Assert
    expect(fetchEvents).toHaveBeenCalled();
    expect(fetchUserEvents).toHaveBeenCalled();
    expect(getEventRecommendations).toHaveBeenCalled();
  });
});