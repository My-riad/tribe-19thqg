import React from 'react'; // react v18.2.0
import { render, fireEvent, waitFor } from '@testing-library/react-native'; // @testing-library/react-native v12.0.0
import { act } from 'react-test-renderer'; // react-test-renderer v18.2.0
import EventCreationForm from './EventCreationForm'; // Component under test
import { eventApi } from '../../../api/eventApi'; // Mock API calls for event operations
import useTribes from '../../../hooks/useTribes'; // Mock tribe data and functionality
import { locationService } from '../../../services/locationService'; // Mock location services
import { EventTypes } from '../../../types/event.types'; // Type definitions for event-related data

// Mock event API calls to test form submission
jest.mock('../../../api/eventApi', () => ({
  eventApi: {
    createEvent: jest.fn().mockResolvedValue({ success: true, data: { id: 'newEventId', name: 'New Event' } }),
    updateEvent: jest.fn().mockResolvedValue({ success: true, data: { id: 'existingEventId', name: 'Updated Event' } }),
    getOptimalTimeSlots: jest.fn().mockResolvedValue({
      success: true,
      data: [
        { startTime: new Date(), endTime: new Date(), availableMembers: 5, totalMembers: 8, availabilityPercentage: 62.5, weatherCondition: EventTypes.WeatherCondition.SUNNY, recommendationScore: 0.8 },
        { startTime: new Date(), endTime: new Date(), availableMembers: 6, totalMembers: 8, availabilityPercentage: 75, weatherCondition: EventTypes.WeatherCondition.CLOUDY, recommendationScore: 0.7 }
      ]
    })
  }
}));

// Mock tribe data for tribe selection in form
jest.mock('../../../hooks/useTribes', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    tribes: [{ id: 'tribe1', name: 'Tribe 1' }],
    userTribes: ['tribe1']
  })
}));

// Mock location services for location selection
jest.mock('../../../services/locationService', () => ({
  locationService: {
    getUserLocation: jest.fn().mockResolvedValue({ latitude: 47.6062, longitude: -122.3321 }),
    searchLocationByAddress: jest.fn().mockResolvedValue({ latitude: 47.6062, longitude: -122.3321 })
  }
}));

describe('EventCreationForm', () => {
  beforeEach(() => {
    (eventApi.createEvent as jest.Mock).mockClear();
    (eventApi.updateEvent as jest.Mock).mockClear();
    (eventApi.getOptimalTimeSlots as jest.Mock).mockClear();
    (useTribes as jest.Mock).mockClear();
    (locationService.getUserLocation as jest.Mock).mockClear();
    (locationService.searchLocationByAddress as jest.Mock).mockClear();

    (useTribes as jest.Mock).mockReturnValue({
      tribes: [{ id: 'tribe1', name: 'Tribe 1' }],
      userTribes: ['tribe1']
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByText, getByPlaceholderText } = render(<EventCreationForm />);

    expect(getByText('Create New Event')).toBeTruthy();
    expect(getByPlaceholderText('Enter event name')).toBeTruthy();
    expect(getByPlaceholderText('Enter event description')).toBeTruthy();
    expect(getByText('Event Type')).toBeTruthy();
    expect(getByPlaceholderText('Enter event location')).toBeTruthy();
    expect(getByText('Start Time')).toBeTruthy();
    expect(getByText('End Time')).toBeTruthy();
    expect(getByPlaceholderText('Enter maximum number of attendees')).toBeTruthy();
    expect(getByPlaceholderText('Enter event cost')).toBeTruthy();
  });

  it('renders with initial event data for editing', () => {
    const initialEvent: EventTypes.Event = {
      id: 'existingEventId',
      name: 'Existing Event',
      description: 'Existing Description',
      eventType: EventTypes.EventType.OTHER,
      location: 'Existing Location',
      coordinates: { latitude: 1.0, longitude: 2.0 },
      venueId: 'venue1',
      venueDetails: { id: 'venue1', name: 'Venue', address: 'Address', coordinates: { latitude: 1.0, longitude: 2.0 }, phoneNumber: '123', website: 'http://example.com', rating: 4, priceLevel: 2, photos: [], openingHours: {}, amenities: [] },
      startTime: new Date(),
      endTime: new Date(),
      tribeId: 'tribe1',
      tribe: { id: 'tribe1', name: 'Tribe 1', description: 'Desc', location: 'Loc', coordinates: { latitude: 1.0, longitude: 2.0 }, imageUrl: 'url', coverImageUrl: 'url', createdAt: new Date(), createdBy: 'user1', status: 'ACTIVE', privacy: 'PUBLIC', maxMembers: 8, memberCount: 1, members: [], activities: [], goals: [], primaryInterests: [], secondaryInterests: [], compatibilityScore: 0, lastActivity: new Date(), upcomingEventCount: 0, isAiGenerated: false, metadata: {} },
      createdBy: 'user1',
      createdAt: new Date(),
      status: EventTypes.EventStatus.SCHEDULED,
      imageUrl: 'url',
      attendees: [],
      attendeeCount: 0,
      maxAttendees: 5,
      cost: 10,
      paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
      weatherData: { condition: EventTypes.WeatherCondition.SUNNY, temperature: 25, temperatureUnit: 'C', precipitation: 0, humidity: 50, windSpeed: 10, iconUrl: 'url', forecast: 'Sunny' },
      isAiGenerated: false,
      userRsvpStatus: EventTypes.RSVPStatus.GOING,
      metadata: {}
    };

    const { getByDisplayValue, getByText } = render(<EventCreationForm initialEvent={initialEvent} />);

    expect(getByDisplayValue('Existing Event')).toBeTruthy();
    expect(getByDisplayValue('Existing Description')).toBeTruthy();
    expect(getByText('Edit Event')).toBeTruthy();
  });

  it('submits form with valid data for new event', async () => {
    const { getByPlaceholderText, getByText } = render(<EventCreationForm />);

    fireEvent.changeText(getByPlaceholderText('Enter event name'), 'New Event');
    fireEvent.changeText(getByPlaceholderText('Enter event description'), 'New Description');
    fireEvent.press(getByText('OTHER'));
    fireEvent.changeText(getByPlaceholderText('Enter event location'), 'New Location');
    fireEvent.changeText(getByPlaceholderText('Enter maximum number of attendees'), '5');
    fireEvent.changeText(getByPlaceholderText('Enter event cost'), '10');

    fireEvent.press(getByText('Create Event'));

    await waitFor(() => {
      expect(eventApi.createEvent).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Event',
        description: 'New Description',
        eventType: 'OTHER',
        location: 'New Location',
        maxAttendees: 5,
        cost: 10
      }));
    });
  });

  it('submits form with valid data for event update', async () => {
    const initialEvent: EventTypes.Event = {
      id: 'existingEventId',
      name: 'Existing Event',
      description: 'Existing Description',
      eventType: EventTypes.EventType.OTHER,
      location: 'Existing Location',
      coordinates: { latitude: 1.0, longitude: 2.0 },
      venueId: 'venue1',
      venueDetails: { id: 'venue1', name: 'Venue', address: 'Address', coordinates: { latitude: 1.0, longitude: 2.0 }, phoneNumber: '123', website: 'http://example.com', rating: 4, priceLevel: 2, photos: [], openingHours: {}, amenities: [] },
      startTime: new Date(),
      endTime: new Date(),
      tribeId: 'tribe1',
      tribe: { id: 'tribe1', name: 'Tribe 1', description: 'Desc', location: 'Loc', coordinates: { latitude: 1.0, longitude: 2.0 }, imageUrl: 'url', coverImageUrl: 'url', createdAt: new Date(), createdBy: 'user1', status: 'ACTIVE', privacy: 'PUBLIC', maxMembers: 8, memberCount: 1, members: [], activities: [], goals: [], primaryInterests: [], secondaryInterests: [], compatibilityScore: 0, lastActivity: new Date(), upcomingEventCount: 0, isAiGenerated: false, metadata: {} },
      createdBy: 'user1',
      createdAt: new Date(),
      status: EventTypes.EventStatus.SCHEDULED,
      imageUrl: 'url',
      attendees: [],
      attendeeCount: 0,
      maxAttendees: 5,
      cost: 10,
      paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
      weatherData: { condition: EventTypes.WeatherCondition.SUNNY, temperature: 25, temperatureUnit: 'C', precipitation: 0, humidity: 50, windSpeed: 10, iconUrl: 'url', forecast: 'Sunny' },
      isAiGenerated: false,
      userRsvpStatus: EventTypes.RSVPStatus.GOING,
      metadata: {}
    };

    const { getByDisplayValue, getByText } = render(<EventCreationForm initialEvent={initialEvent} />);

    fireEvent.changeText(getByDisplayValue('Existing Event'), 'Updated Event');
    fireEvent.press(getByText('Update Event'));

    await waitFor(() => {
      expect(eventApi.updateEvent).toHaveBeenCalledWith('existingEventId', expect.objectContaining({
        name: 'Updated Event',
        description: 'Existing Description',
        eventType: 'OTHER',
        location: 'Existing Location',
        maxAttendees: 5,
        cost: 10
      }));
    });
  });
});