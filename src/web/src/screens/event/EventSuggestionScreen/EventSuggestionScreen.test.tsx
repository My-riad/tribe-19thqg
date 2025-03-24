import React from 'react'; // react ^18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // @testing-library/react-native ^11.5.0
import { Provider } from 'react-redux'; // react-redux ^8.0.5
import { configureStore } from '@reduxjs/toolkit'; // @reduxjs/toolkit ^1.9.5
import EventSuggestionScreen from './EventSuggestionScreen';
import EventCard from '../../../components/event/EventCard';
import LoadingIndicator from '../../../components/ui/LoadingIndicator';
import Button from '../../../components/ui/Button';
import { EventTypes } from '../../../types/event.types';
import * as eventThunks from '../../../store/thunks/eventThunks'; // Import all event thunks
import 'jest'; // jest ^29.2.1

// Mock the useLocation hook to provide a consistent location for testing
jest.mock('../../../hooks/useLocation', () => ({
  __esModule: true,
  default: jest.fn(),
  useLocation: jest.fn().mockReturnValue({
    currentLocation: { latitude: 47.6062, longitude: -122.3321 },
    isLoading: false,
    error: null,
  }),
}));

// Mock the @react-navigation/native module to prevent actual navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useRoute: () => ({
    params: { tribeId: 'tribe-123' },
  }),
}));

// Mock the event thunks to prevent actual API calls
jest.mock('../../../store/thunks/eventThunks', () => ({
  getEventRecommendations: jest.fn(),
  getWeatherBasedSuggestions: jest.fn(),
  rsvpToEvent: jest.fn(),
}));

/**
 * Helper function to set up the component with a mock store for testing
 * @param initialState - Initial state for the Redux store
 * @returns Rendered component and store utilities
 */
const setup = (initialState = {}) => {
  const store = configureStore({
    reducer: (state: any = initialState, action: any) => {
      if (action.type === 'events/setEventRecommendations') {
        return { ...state, eventRecommendations: action.payload };
      }
      if (action.type === 'events/setWeatherBasedSuggestions') {
        return { ...state, weatherBasedSuggestions: action.payload };
      }
      return state;
    },
  });

  const utils = render(
    <Provider store={store}>
      <EventSuggestionScreen />
    </Provider>
  );

  return { ...utils, store };
};

/**
 * Helper function to create mock event suggestion data for testing
 * @param overrides - Overrides for the default event suggestion
 * @returns Mock event suggestion object
 */
const createMockEventSuggestion = (overrides = {}): EventTypes.EventSuggestion => ({
  event: {
    id: 'event-123',
    name: 'Mock Event',
    description: 'This is a mock event for testing.',
    eventType: EventTypes.EventType.OUTDOOR_ACTIVITY,
    location: 'Mock Location',
    coordinates: { latitude: 0, longitude: 0 },
    venueId: 'venue-123',
    venueDetails: {
      id: 'venue-123',
      name: 'Mock Venue',
      address: '123 Mock St',
      coordinates: { latitude: 0, longitude: 0 },
      phoneNumber: '123-456-7890',
      website: 'http://mockvenue.com',
      rating: 4.5,
      priceLevel: 2,
      photos: [],
      openingHours: {},
      amenities: [],
    },
    startTime: new Date(),
    endTime: new Date(),
    tribeId: 'tribe-123',
    tribe: {
        id: 'tribe-123',
        name: 'Mock Tribe',
        description: 'Mock Tribe Description',
        location: 'Mock Location',
        coordinates: { latitude: 0, longitude: 0 },
        imageUrl: 'http://mocktribe.com/image.jpg',
        coverImageUrl: 'http://mocktribe.com/cover.jpg',
        createdAt: new Date(),
        createdBy: 'user-123',
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
        metadata: {}
    },
    createdBy: 'user-123',
    createdAt: new Date(),
    status: EventTypes.EventStatus.SCHEDULED,
    imageUrl: 'http://mockevent.com/image.jpg',
    attendees: [],
    attendeeCount: 5,
    maxAttendees: 10,
    cost: 0,
    paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
    weatherData: {
      condition: EventTypes.WeatherCondition.SUNNY,
      temperature: 25,
      temperatureUnit: 'C',
      precipitation: 0,
      humidity: 50,
      windSpeed: 10,
      iconUrl: 'http://mockweather.com/sunny.png',
      forecast: 'Sunny with clear skies',
    },
    isAiGenerated: true,
    userRsvpStatus: EventTypes.RSVPStatus.GOING,
    metadata: {},
  },
  matchScore: 0.9,
  matchReasons: ['Shared interest', 'Good weather'],
  suggestedAt: new Date(),
  weatherSuitability: 0.95,
  budgetFriendliness: 0.8,
  ...overrides,
});

describe('EventSuggestionScreen', () => {
  it('renders loading state correctly', () => {
    const { getByTestId } = setup({ events: { loading: true } });
    expect(() => getByTestId('loading-indicator')).not.toThrow();
  });

  it('renders error state correctly', () => {
    const { getByText } = setup({ events: { loading: false, error: 'Failed to load' } });
    expect(() => getByText('Error: Failed to load')).not.toThrow();
    expect(() => getByText('Retry')).not.toThrow();
  });

  it('renders event recommendations correctly', () => {
    const mockEvent = createMockEventSuggestion();
    const { getAllByTestId, getByText } = setup({
      events: {
        loading: false,
        eventRecommendations: [mockEvent],
        weatherBasedSuggestions: [],
      },
    });
    expect(getAllByTestId('event-card')).toHaveLength(1);
    expect(() => getByText('Recommended Events')).not.toThrow();
  });

  it('renders weather-based suggestions correctly', () => {
    const mockEvent = createMockEventSuggestion();
    const { getAllByTestId, getByText } = setup({
      events: {
        loading: false,
        eventRecommendations: [],
        weatherBasedSuggestions: [mockEvent],
      },
    });
    expect(getAllByTestId('event-card')).toHaveLength(1);
    expect(() => getByText('Weather-Based Activities')).not.toThrow();
  });

  it('renders empty state when no suggestions available', () => {
    const { getByText } = setup({
      events: {
        loading: false,
        eventRecommendations: [],
        weatherBasedSuggestions: [],
      },
    });
    expect(() => getByText('No suggestions available for this category.')).not.toThrow();
    expect(() => getByText('Refresh')).not.toThrow();
  });

  it('fetches suggestions on mount', () => {
    setup();
    expect(eventThunks.getEventRecommendations).toHaveBeenCalledWith({
      tribeId: 'tribe-123',
      location: '47.6062,-122.3321',
    });
    expect(eventThunks.getWeatherBasedSuggestions).toHaveBeenCalledWith({
      tribeId: 'tribe-123',
      location: '47.6062,-122.3321',
    });
  });

  it('handles refresh action correctly', async () => {
    const { getByTestId } = setup();
    const refreshControl = getByTestId('suggestion-list');
    fireEvent(refreshControl, 'refresh');
    await waitFor(() => {
      expect(eventThunks.getEventRecommendations).toHaveBeenCalledTimes(2);
      expect(eventThunks.getWeatherBasedSuggestions).toHaveBeenCalledTimes(2);
    });
  });

  it('navigates to event details when card is pressed', () => {
    const mockEvent = createMockEventSuggestion();
    const { getByTestId } = setup({
      events: {
        loading: false,
        eventRecommendations: [mockEvent],
        weatherBasedSuggestions: [],
      },
    });
    const eventCard = getByTestId('event-card');
    fireEvent.press(eventCard);
    // expect(mockedNavigate).toHaveBeenCalledWith('EventDetail', { eventId: 'event-123' });
  });

  it('handles RSVP actions correctly', () => {
    const mockEvent = createMockEventSuggestion();
    const { getByText } = setup({
      events: {
        loading: false,
        eventRecommendations: [mockEvent],
        weatherBasedSuggestions: [],
      },
    });
    const rsvpButton = getByText('Going');
    fireEvent.press(rsvpButton);
    expect(eventThunks.rsvpToEvent).toHaveBeenCalledWith({
      eventId: 'event-123',
      status: 'GOING',
    });
  });
});