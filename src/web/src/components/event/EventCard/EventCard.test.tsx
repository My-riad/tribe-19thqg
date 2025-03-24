import React from 'react'; // react ^18.2.0
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native'; // @testing-library/react-native ^12.0.0

import EventCard from './EventCard'; // src/web/src/components/event/EventCard/EventCard.tsx
import { EventTypes } from '../../../types/event.types'; // src/web/src/types/event.types.ts

// Define mock function for onPress callback
const mockOnPress = jest.fn();

// Helper function to create a mock event object for testing
const createMockEvent = (overrides = {}) => ({
  id: 'event-123',
  name: 'Trail Hike @ Discovery Park',
  description: "Let's explore the new lighthouse trail and have a picnic after. Bring water and snacks!",
  eventType: EventTypes.EventType.OUTDOOR_ACTIVITY,
  location: 'Discovery Park, Seattle',
  coordinates: { latitude: 47.6615, longitude: -122.4151 },
  startTime: new Date('2023-07-15T10:00:00'),
  endTime: new Date('2023-07-15T13:00:00'),
  tribeId: 'tribe-456',
  tribe: {
    id: 'tribe-456',
    name: 'Weekend Explorers',
    description: 'We explore hiking trails, parks, and outdoor activities every weekend.',
    memberCount: 6,
  },
  status: EventTypes.EventStatus.SCHEDULED,
  imageUrl: 'https://example.com/event-image.jpg',
  attendeeCount: 4,
  maxAttendees: 6,
  isAiGenerated: false,
  weatherData: {
    condition: 'SUNNY' as EventTypes.WeatherCondition,
    temperature: 75,
    temperatureUnit: 'F',
    precipitation: 0,
    humidity: 45,
    windSpeed: 5,
  },
  userRsvpStatus: EventTypes.RSVPStatus.GOING,
  ...overrides,
});

// Default mock event object for testing
const mockEvent = createMockEvent();

// Reset mocks before each test
beforeEach(() => {
  mockOnPress.mockClear();
});

describe('EventCard', () => {
  it('renders correctly with standard variant', () => {
    // Render the EventCard component with standard variant
    const { getByText } = render(<EventCard event={mockEvent} onPress={mockOnPress} />);

    // Assert that the component renders without crashing
    expect(getByText('Trail Hike @ Discovery Park')).toBeDefined();

    // Assert that the event title is displayed correctly
    expect(getByText('Discovery Park, Seattle')).toBeDefined();

    // Assert that the event location is displayed correctly
    expect(getByText('SAT')).toBeDefined();
    expect(getByText('10:00 AM')).toBeDefined();

    // Assert that the event date and time are displayed correctly
    expect(getByText('Weekend Explorers')).toBeDefined();
    expect(getByText('4 attending')).toBeDefined();

    // Assert that the tribe information is displayed correctly
  });

  it('renders correctly with compact variant', () => {
    // Render the EventCard component with compact variant
    const { getByText, getByTestId } = render(<EventCard event={mockEvent} variant="compact" onPress={mockOnPress} />);

    // Assert that the component renders with compact layout
    expect(getByTestId('event-card-container')).toBeDefined();

    // Assert that the event information is displayed in compact format
    expect(getByText('Trail Hike @ Discovery Park')).toBeDefined();
    expect(getByText('Discovery Park, Seattle')).toBeDefined();
    expect(getByText('SAT')).toBeDefined();
    expect(getByText('10:00 AM')).toBeDefined();
    expect(getByText('Weekend Explorers')).toBeDefined();
    expect(getByText('4 attending')).toBeDefined();

    // Assert that the layout adjusts appropriately for compact variant
  });

  it('renders correctly with featured variant', () => {
    // Render the EventCard component with featured variant
    const { getByText, getByTestId } = render(<EventCard event={mockEvent} variant="featured" onPress={mockOnPress} />);

    // Assert that the component renders with featured layout
    expect(getByTestId('event-card-container')).toBeDefined();

    // Assert that the event information is displayed in featured format
    expect(getByText('Trail Hike @ Discovery Park')).toBeDefined();
    expect(getByText('Discovery Park, Seattle')).toBeDefined();
    expect(getByText('SAT')).toBeDefined();
    expect(getByText('10:00 AM')).toBeDefined();
    expect(getByText('Weekend Explorers')).toBeDefined();
    expect(getByText('4 attending')).toBeDefined();

    // Assert that the layout adjusts appropriately for featured variant
  });

  it('displays AI recommendation badge when isAiGenerated is true', () => {
    // Render the EventCard component with isAiGenerated set to true
    const { getByText } = render(<EventCard event={createMockEvent({ isAiGenerated: true })} onPress={mockOnPress} />);

    // Assert that the AI recommendation badge is displayed when isAiGenerated is true
    expect(getByText('AI Recommended')).toBeDefined();

    // Render the EventCard component with isAiGenerated set to false
    const { queryByText } = render(<EventCard event={createMockEvent({ isAiGenerated: false })} onPress={mockOnPress} />);

    // Assert that the AI recommendation badge is not displayed when isAiGenerated is false
    expect(queryByText('AI Recommended')).toBeNull();
  });

  it('displays weather information when showWeather is true', () => {
    // Render the EventCard component with showWeather set to true
    const { getByText } = render(<EventCard event={mockEvent} showWeather={true} onPress={mockOnPress} />);

    // Assert that the weather widget is rendered when showWeather is true
    expect(getByText('Sunny, 75°F')).toBeDefined();

    // Render the EventCard component with showWeather set to false
    const { queryByText } = render(<EventCard event={mockEvent} showWeather={false} onPress={mockOnPress} />);

    // Assert that the weather widget is not rendered when showWeather is false
    expect(queryByText('Sunny, 75°F')).toBeNull();

    // Assert that the weather data is displayed correctly
  });

  it('displays RSVP buttons when showRSVP is true', () => {
    // Render the EventCard component with showRSVP set to true
    const { getByText } = render(<EventCard event={mockEvent} showRSVP={true} onPress={mockOnPress} />);

    // Assert that the RSVP buttons are rendered when showRSVP is true
    expect(getByText('Going')).toBeDefined();
    expect(getByText('Maybe')).toBeDefined();
    expect(getByText("Can't Go")).toBeDefined();

    // Render the EventCard component with showRSVP set to false
    const { queryByText } = render(<EventCard event={mockEvent} showRSVP={false} onPress={mockOnPress} />);

    // Assert that the RSVP buttons are not rendered when showRSVP is false
    expect(queryByText('Going')).toBeNull();
    expect(queryByText('Maybe')).toBeNull();
    expect(queryByText("Can't Go")).toBeNull();
  });

  it('calls onPress callback when card is pressed', () => {
    // Render the EventCard component with onPress callback
    const { getByTestId } = render(<EventCard event={mockEvent} onPress={mockOnPress} />);

    // Find the container and simulate a press event
    const container = getByTestId('event-card-container');
    fireEvent.press(container);

    // Assert that the onPress callback is called when the card is pressed
    expect(mockOnPress).toHaveBeenCalled();

    // Assert that the onPress callback is called with the correct event ID
    expect(mockOnPress).toHaveBeenCalledWith(mockEvent.id);

    // Render the EventCard component without onPress callback
    render(<EventCard event={mockEvent} />);

    // Assert that the onPress callback is not called when the card is not pressed
  });

  it('displays correct status indicator based on event status', () => {
    // Render the EventCard component with SCHEDULED status
    const { getByText } = render(<EventCard event={createMockEvent({ status: EventTypes.EventStatus.SCHEDULED })} onPress={mockOnPress} />);

    // Assert that the green indicator is displayed for SCHEDULED events
    expect(getByText('SCHEDULED')).toBeDefined();

    // Render the EventCard component with CANCELLED status
    const { queryByText: queryCancelled } = render(<EventCard event={createMockEvent({ status: EventTypes.EventStatus.CANCELLED })} onPress={mockOnPress} />);

    // Assert that the red indicator is displayed for CANCELLED events
    expect(queryCancelled('CANCELLED')).toBeDefined();

    // Render the EventCard component with RESCHEDULED status
    const { queryByText: queryRescheduled } = render(<EventCard event={createMockEvent({ status: EventTypes.EventStatus.RESCHEDULED })} onPress={mockOnPress} />);

    // Assert that the yellow indicator is displayed for RESCHEDULED events
    expect(queryRescheduled('RESCHEDULED')).toBeDefined();
  });

  it('truncates long event titles', () => {
    // Render the EventCard component with a long event title
    const longTitle = 'This is a very long event title that needs to be truncated';
    const { getByText } = render(<EventCard event={createMockEvent({ name: longTitle })} onPress={mockOnPress} />);

    // Assert that long titles are truncated
    expect(getByText('This is a very long event title...')).toBeDefined();

    // Assert that ellipsis is added to truncated titles
  });

  it('displays default image when event has no image', () => {
    // Render the EventCard component with imageUrl set to null
    const { getByTestId } = render(<EventCard event={createMockEvent({ imageUrl: null })} onPress={mockOnPress} />);

    // Assert that the default image is displayed when imageUrl is null or undefined
    expect(getByTestId('event-image')).toBeDefined();

    // Render the EventCard component with imageUrl provided
    const { getByTestId: getByTestIdWithImage } = render(<EventCard event={mockEvent} onPress={mockOnPress} />);

    // Assert that the event image is displayed when imageUrl is provided
    expect(getByTestIdWithImage('event-image')).toBeDefined();
  });
});