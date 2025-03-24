import React from 'react'; // react ^18.2.0
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'; // @testing-library/react-native ^11.5.0
import { act } from 'react-test-renderer'; // react-test-renderer ^18.2.0
import { configureStore } from '@reduxjs/toolkit'; // @reduxjs/toolkit ^1.9.5
import { Provider } from 'react-redux'; // react-redux ^8.0.5
import { Linking } from 'react-native';

import EventDetails from './EventDetails';
import { RSVPStatus } from '../../../types/event.types';
import { fetchEventById, getEventAttendees, rsvpToEvent, checkInToEvent } from '../../../store/thunks/eventThunks';

// Mock data
const mockEvent = {
  id: 'event-123',
  name: 'Weekend Hike',
  description: 'A fun weekend hike at Discovery Park',
  eventType: 'OUTDOOR_ACTIVITY',
  location: 'Discovery Park, Seattle',
  coordinates: { latitude: 47.6615, longitude: -122.4151 },
  startTime: new Date('2023-07-15T10:00:00Z'),
  endTime: new Date('2023-07-15T13:00:00Z'),
  tribeId: 'tribe-123',
  tribe: { id: 'tribe-123', name: 'Weekend Explorers' },
  createdBy: 'user-123',
  createdAt: new Date('2023-06-15T10:00:00Z'),
  status: 'SCHEDULED',
  imageUrl: 'https://example.com/event-image.jpg',
  attendeeCount: 4,
  maxAttendees: 8,
  weatherData: {
    condition: 'SUNNY',
    temperature: 75,
    temperatureUnit: 'F',
    precipitation: 0,
    humidity: 45,
    windSpeed: 5,
    iconUrl: 'https://example.com/weather-icon.png',
    forecast: 'Sunny and clear'
  },
  userRsvpStatus: 'GOING'
};

const mockAttendees = [
  {
    id: 'attendee-1',
    eventId: 'event-123',
    userId: 'user-123',
    profile: {
      id: 'profile-1',
      userId: 'user-123',
      name: 'John Doe',
      avatarUrl: 'https://example.com/avatar1.jpg'
    },
    rsvpStatus: 'GOING',
    rsvpTime: new Date('2023-06-20T10:00:00Z'),
    hasCheckedIn: false,
    checkedInAt: null
  },
  {
    id: 'attendee-2',
    eventId: 'event-123',
    userId: 'user-456',
    profile: {
      id: 'profile-2',
      userId: 'user-456',
      name: 'Jane Smith',
      avatarUrl: 'https://example.com/avatar2.jpg'
    },
    rsvpStatus: 'GOING',
    rsvpTime: new Date('2023-06-21T10:00:00Z'),
    hasCheckedIn: true,
    checkedInAt: new Date('2023-07-15T10:05:00Z')
  },
  {
    id: 'attendee-3',
    eventId: 'event-123',
    userId: 'user-789',
    profile: {
      id: 'profile-3',
      userId: 'user-789',
      name: 'Bob Johnson',
      avatarUrl: 'https://example.com/avatar3.jpg'
    },
    rsvpStatus: 'MAYBE',
    rsvpTime: new Date('2023-06-22T10:00:00Z'),
    hasCheckedIn: false,
    checkedInAt: null
  }
];

const mockInitialState = {
  events: {
    currentEvent: null,
    attendees: [],
    events: [],
    userEvents: [],
    tribeEvents: [],
    recommendations: [],
    loading: {
      fetchEvent: false,
      fetchAttendees: false,
      rsvp: false,
      checkIn: false
    },
    error: null
  }
};

const mockLoadingState = {
  events: {
    currentEvent: null,
    attendees: [],
    events: [],
    userEvents: [],
    tribeEvents: [],
    recommendations: [],
    loading: {
      fetchEvent: true,
      fetchAttendees: true,
      rsvp: false,
      checkIn: false
    },
    error: null
  }
};

const mockErrorState = {
  events: {
    currentEvent: null,
    attendees: [],
    events: [],
    userEvents: [],
    tribeEvents: [],
    recommendations: [],
    loading: {
      fetchEvent: false,
      fetchAttendees: false,
      rsvp: false,
      checkIn: false
    },
    error: 'Failed to load event details'
  }
};

const mockLoadedState = {
  events: {
    currentEvent: mockEvent,
    attendees: mockAttendees,
    events: [],
    userEvents: [],
    tribeEvents: [],
    recommendations: [],
    loading: {
      fetchEvent: false,
      fetchAttendees: false,
      rsvp: false,
      checkIn: false
    },
    error: null
  }
};

// Mocks
const mockStore = configureStore({
  reducer: {
    events: (state = mockInitialState.events, action) => state
  },
  preloadedState: mockInitialState
});

const mockFetchEventById = jest.fn().mockResolvedValue(mockEvent);
const mockGetEventAttendees = jest.fn().mockResolvedValue(mockAttendees);
const mockRsvpToEvent = jest.fn().mockResolvedValue({ eventId: 'event-123', status: 'GOING' });
const mockCheckInToEvent = jest.fn().mockResolvedValue('event-123');
const mockLinking = {
  openURL: jest.fn().mockResolvedValue(true)
};

// Helper function to render a component with Redux store
const renderWithRedux = (ui: React.ReactElement, initialState: object) => {
  const store = configureStore({
    reducer: {
      events: (state = initialState, action) => state
    },
    preloadedState: initialState
  });
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
};

describe('EventDetails', () => {
  it('renders loading state initially', () => {
    const { getByTestId } = renderWithRedux(<EventDetails eventId="event-123" />, mockLoadingState);
    expect(getByTestId('activity-indicator')).toBeDefined();
  });

  it('renders event details correctly when data is loaded', () => {
    const { getByText } = renderWithRedux(<EventDetails eventId="event-123" />, mockLoadedState);
    expect(getByText('Weekend Hike')).toBeDefined();
    expect(getByText('Saturday, July 15, 2023 10:00 AM')).toBeDefined();
    expect(getByText('Discovery Park, Seattle')).toBeDefined();
    expect(getByText('A fun weekend hike at Discovery Park')).toBeDefined();
  });

  it('displays weather information when available', () => {
    const { getByText } = renderWithRedux(<EventDetails eventId="event-123" />, mockLoadedState);
    expect(getByText('Sunny')).toBeDefined();
    expect(getByText('75°F')).toBeDefined();
    expect(getByText('45% humidity')).toBeDefined();
    expect(getByText('5 mph wind')).toBeDefined();
  });

  it('displays attendees list correctly', () => {
    const { getByText } = renderWithRedux(<EventDetails eventId="event-123" />, mockLoadedState);
    expect(getByText('John Doe')).toBeDefined();
    expect(getByText('Jane Smith')).toBeDefined();
    expect(getByText('Bob Johnson')).toBeDefined();
  });

  it('handles RSVP status updates', async () => {
    (rsvpToEvent as jest.Mock).mockImplementation(mockRsvpToEvent);
    const { getByText } = renderWithRedux(<EventDetails eventId="event-123" />, mockLoadedState);
    
    await act(async () => {
      fireEvent.press(getByText('Maybe'));
    });
    
    expect(rsvpToEvent).toHaveBeenCalledWith({ eventId: 'event-123', status: 'MAYBE' });
  });

  it('handles check-in functionality for organizers', async () => {
    (checkInToEvent as jest.Mock).mockImplementation(mockCheckInToEvent);
    const { getByText } = renderWithRedux(<EventDetails eventId="event-123" isOrganizer={true} />, mockLoadedState);
    
    await act(async () => {
      fireEvent.press(getByText('Check In'));
    });
    
    expect(checkInToEvent).toHaveBeenCalledWith({ eventId: 'event-123' });
  });

  it('displays error state when event loading fails', () => {
    const { getByText } = renderWithRedux(<EventDetails eventId="event-123" />, mockErrorState);
    expect(getByText('Failed to load event details')).toBeDefined();
  });

  it('calls correct thunks on component mount', () => {
    (fetchEventById as jest.Mock).mockImplementation(mockFetchEventById);
    (getEventAttendees as jest.Mock).mockImplementation(mockGetEventAttendees);
    renderWithRedux(<EventDetails eventId="event-123" />, mockInitialState);
    expect(fetchEventById).toHaveBeenCalledWith('event-123');
    expect(getEventAttendees).toHaveBeenCalledWith({ eventId: 'event-123' });
  });

  it('handles get directions button click', async () => {
    (Linking.openURL as jest.Mock).mockImplementation(mockLinking.openURL);
    const { getByText } = renderWithRedux(<EventDetails eventId="event-123" />, mockLoadedState);
    
    await act(async () => {
      fireEvent.press(getByText('Get Directions'));
    });
    
    expect(Linking.openURL).toHaveBeenCalledWith('maps:0,0?q=47.6615,-122.4151(Weekend Hike)');
  });

  it('handles chat button click', () => {
    const onChatPress = jest.fn();
    const { getByText } = renderWithRedux(<EventDetails eventId="event-123" onChatPress={onChatPress} />, mockLoadedState);
    fireEvent.press(getByText('Chat'));
    expect(onChatPress).toHaveBeenCalled();
  });
});