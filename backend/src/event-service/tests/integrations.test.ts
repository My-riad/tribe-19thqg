// Mock the external dependencies
jest.mock('axios');
jest.mock('node-cache', () => jest.fn(() => ({ get: jest.fn(), set: jest.fn(), flushAll: jest.fn() })));
jest.mock('../config', () => ({ 
  env: {
    EVENTBRITE_API_KEY: 'mock-eventbrite-key',
    MEETUP_API_KEY: 'mock-meetup-key',
    GOOGLE_PLACES_API_KEY: 'mock-google-places-key',
    OPENWEATHERMAP_API_KEY: 'mock-openweathermap-key'
  },
  eventServiceConfig: {
    eventbriteApiUrl: 'https://mock-eventbrite.com/v3',
    meetupApiUrl: 'https://mock-meetup.com/gql',
    googlePlacesApiUrl: 'https://mock-google-places.com/api',
    openWeatherMapApiUrl: 'https://mock-openweathermap.com/data/2.5',
    eventCacheTtl: 3600,
    venueCacheTtl: 3600,
    weatherCacheTtl: 1800
  }
}));

import axios from 'axios';
import { MockInstance } from 'jest';
import NodeCache from 'node-cache';

// Import integration classes
import EventbriteIntegration from '../src/integrations/eventbrite.integration';
import MeetupIntegration from '../src/integrations/meetup.integration';
import GooglePlacesIntegration from '../src/integrations/google-places.integration';
import OpenWeatherMapIntegration from '../src/integrations/openweathermap.integration';

// Import types
import { IEvent, IEventCreate, IVenue, IWeatherData } from '../../../shared/src/types/event.types';
import { ICoordinates, InterestCategory } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { env, eventServiceConfig } from '../config';

/**
 * Creates a mock event object for testing
 */
function generateMockEvent(overrides: Partial<IEvent> = {}): IEvent {
  return {
    id: 'mock-event-id',
    name: 'Mock Event',
    description: 'This is a mock event for testing',
    tribeId: 'mock-tribe-id',
    createdBy: 'mock-user-id',
    eventType: 'in_person',
    status: 'scheduled',
    visibility: 'public',
    startTime: new Date('2023-08-01T18:00:00Z'),
    endTime: new Date('2023-08-01T20:00:00Z'),
    location: 'Mock Venue, Mock City',
    coordinates: {
      latitude: 47.6062,
      longitude: -122.3321
    },
    venueId: 'mock-venue-id',
    weatherData: {
      temperature: 72,
      condition: 'Sunny',
      icon: '01d',
      precipitation: 0,
      forecast: 'Sunny with temperature around 72°F'
    },
    cost: 0,
    paymentRequired: false,
    maxAttendees: 20,
    categories: [InterestCategory.OUTDOOR_ADVENTURES],
    createdAt: new Date('2023-07-15T10:00:00Z'),
    updatedAt: new Date('2023-07-15T10:00:00Z'),
    metadata: {},
    ...overrides
  };
}

/**
 * Creates a mock venue object for testing
 */
function generateMockVenue(overrides: Partial<IVenue> = {}): IVenue {
  return {
    id: 'mock-venue-id',
    name: 'Mock Venue',
    address: '123 Test St, Mock City, MC 12345',
    coordinates: {
      latitude: 47.6062,
      longitude: -122.3321
    },
    placeId: 'mock-place-id',
    website: 'https://mockvenue.example.com',
    phoneNumber: '+1-555-123-4567',
    capacity: 50,
    priceLevel: 2,
    rating: 4.5,
    photos: ['https://example.com/photo1.jpg'],
    categories: [InterestCategory.FOOD_DINING],
    metadata: {},
    ...overrides
  };
}

/**
 * Creates a mock weather data object for testing
 */
function generateMockWeatherData(overrides: Partial<IWeatherData> = {}): IWeatherData {
  return {
    temperature: 72,
    condition: 'Sunny',
    icon: '01d',
    precipitation: 0,
    forecast: 'Sunny with temperature around 72°F',
    ...overrides
  };
}

/**
 * Creates a mock coordinates object for testing
 */
function generateMockCoordinates(overrides: Partial<ICoordinates> = {}): ICoordinates {
  return {
    latitude: 47.6062,
    longitude: -122.3321,
    ...overrides
  };
}

describe('EventbriteIntegration', () => {
  let mockAxios: jest.Mocked<typeof axios>;
  let eventbriteIntegration: EventbriteIntegration;
  let mockCache: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios = axios as jest.Mocked<typeof axios>;
    mockCache = new NodeCache();
    eventbriteIntegration = new EventbriteIntegration();
    // @ts-ignore - accessing private property for test
    eventbriteIntegration.cache = mockCache;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('constructor should initialize with API key and base URL', () => {
    const integration = new EventbriteIntegration();
    // @ts-ignore - accessing private properties for test
    expect(integration.apiKey).toBe('mock-eventbrite-key');
    // @ts-ignore - accessing private properties for test
    expect(integration.baseUrl).toBe('https://mock-eventbrite.com/v3');
    // @ts-ignore - accessing private properties for test
    expect(integration.cache).toBeDefined();
  });

  test('searchEvents should make a request to the Eventbrite API with search parameters', async () => {
    // Arrange
    const searchParams = {
      query: 'test event',
      location: generateMockCoordinates(),
      radius: 10,
      categories: [InterestCategory.ARTS_CULTURE],
      startDate: new Date('2023-08-01'),
      endDate: new Date('2023-08-31'),
      page: 1,
      limit: 10
    };

    const mockResponseData = {
      pagination: {
        object_count: 2,
        page_number: 1,
        page_size: 10,
        page_count: 1,
        has_more_items: false
      },
      events: [
        {
          id: 'event1',
          name: { text: 'Test Event 1', html: '<p>Test Event 1</p>' },
          description: { text: 'Description 1', html: '<p>Description 1</p>' },
          url: 'https://eventbrite.com/event1',
          start: {
            timezone: 'UTC',
            local: '2023-08-15T18:00:00',
            utc: '2023-08-15T18:00:00Z'
          },
          end: {
            timezone: 'UTC',
            local: '2023-08-15T20:00:00',
            utc: '2023-08-15T20:00:00Z'
          },
          organization_id: 'org1',
          venue: {
            id: 'venue1',
            name: 'Test Venue',
            address: {
              address_1: '123 Test St',
              address_2: '',
              city: 'Test City',
              region: 'TC',
              postal_code: '12345',
              country: 'US',
              latitude: 47.6062,
              longitude: -122.3321
            }
          },
          online_event: false,
          is_free: true,
          ticket_availability: {
            has_available_tickets: true,
            minimum_ticket_price: {
              currency: 'USD',
              value: 0
            },
            maximum_ticket_price: {
              currency: 'USD',
              value: 0
            }
          },
          capacity: 100,
          category_id: '103',
          logo: {
            url: 'https://example.com/event1-logo.jpg',
            original: {
              url: 'https://example.com/event1-logo-original.jpg'
            }
          },
          summary: 'Test Event 1 Summary'
        },
        {
          id: 'event2',
          name: { text: 'Test Event 2', html: '<p>Test Event 2</p>' },
          description: { text: 'Description 2', html: '<p>Description 2</p>' },
          url: 'https://eventbrite.com/event2',
          start: {
            timezone: 'UTC',
            local: '2023-08-20T18:00:00',
            utc: '2023-08-20T18:00:00Z'
          },
          end: {
            timezone: 'UTC',
            local: '2023-08-20T20:00:00',
            utc: '2023-08-20T20:00:00Z'
          },
          organization_id: 'org1',
          venue: {
            id: 'venue2',
            name: 'Test Venue 2',
            address: {
              address_1: '456 Test St',
              address_2: '',
              city: 'Test City',
              region: 'TC',
              postal_code: '12345',
              country: 'US',
              latitude: 47.6062,
              longitude: -122.3321
            }
          },
          online_event: false,
          is_free: false,
          ticket_availability: {
            has_available_tickets: true,
            minimum_ticket_price: {
              currency: 'USD',
              value: 10
            },
            maximum_ticket_price: {
              currency: 'USD',
              value: 20
            }
          },
          capacity: 50,
          category_id: '103',
          logo: {
            url: 'https://example.com/event2-logo.jpg',
            original: {
              url: 'https://example.com/event2-logo-original.jpg'
            }
          },
          summary: 'Test Event 2 Summary'
        }
      ]
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await eventbriteIntegration.searchEvents(searchParams);

    // Assert
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/events/search/'),
      expect.objectContaining({
        params: expect.objectContaining({
          q: 'test event',
          'location.latitude': searchParams.location.latitude,
          'location.longitude': searchParams.location.longitude,
          'location.within': '10mi',
          'start_date.range_start': searchParams.startDate.toISOString(),
          'start_date.range_end': searchParams.endDate.toISOString(),
          page: 1,
          page_size: 10
        }),
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-eventbrite-key'
        })
      })
    );
    expect(result.events).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('searchEvents should return cached events if available', async () => {
    // Arrange
    const searchParams = {
      query: 'test event',
      location: generateMockCoordinates()
    };

    const cachedEvents = {
      events: [generateMockEvent(), generateMockEvent()],
      total: 2
    };

    mockCache.get.mockReturnValueOnce(cachedEvents);

    // Act
    const result = await eventbriteIntegration.searchEvents(searchParams);

    // Assert
    expect(mockAxios.get).not.toHaveBeenCalled();
    expect(result).toBe(cachedEvents);
  });

  test('getEventById should retrieve a specific event by ID', async () => {
    // Arrange
    const eventId = 'mock-event-id';
    const mockResponseData = {
      id: eventId,
      name: { text: 'Test Event', html: '<p>Test Event</p>' },
      description: { text: 'Description', html: '<p>Description</p>' },
      url: 'https://eventbrite.com/event',
      start: {
        timezone: 'UTC',
        local: '2023-08-15T18:00:00',
        utc: '2023-08-15T18:00:00Z'
      },
      end: {
        timezone: 'UTC',
        local: '2023-08-15T20:00:00',
        utc: '2023-08-15T20:00:00Z'
      },
      organization_id: 'org1',
      venue: {
        id: 'venue1',
        name: 'Test Venue',
        address: {
          address_1: '123 Test St',
          address_2: '',
          city: 'Test City',
          region: 'TC',
          postal_code: '12345',
          country: 'US',
          latitude: 47.6062,
          longitude: -122.3321
        }
      },
      online_event: false,
      is_free: true,
      ticket_availability: {
        has_available_tickets: true,
        minimum_ticket_price: {
          currency: 'USD',
          value: 0
        },
        maximum_ticket_price: {
          currency: 'USD',
          value: 0
        }
      },
      capacity: 100,
      category_id: '103',
      logo: {
        url: 'https://example.com/event-logo.jpg',
        original: {
          url: 'https://example.com/event-logo-original.jpg'
        }
      },
      summary: 'Test Event Summary'
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await eventbriteIntegration.getEventById(eventId);

    // Assert
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining(`/events/${eventId}/`),
      expect.any(Object)
    );
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Test Event');
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('getEventsByLocation should retrieve events near a specific location', async () => {
    // Arrange
    const coordinates = generateMockCoordinates();
    const radius = 15;
    const mockResponseData = {
      pagination: {
        object_count: 2,
        page_number: 1,
        page_size: 20,
        page_count: 1,
        has_more_items: false
      },
      events: [
        {
          id: 'event1',
          name: { text: 'Test Event 1', html: '<p>Test Event 1</p>' },
          description: { text: 'Description 1', html: '<p>Description 1</p>' },
          url: 'https://eventbrite.com/event1',
          start: {
            timezone: 'UTC',
            local: '2023-08-15T18:00:00',
            utc: '2023-08-15T18:00:00Z'
          },
          end: {
            timezone: 'UTC',
            local: '2023-08-15T20:00:00',
            utc: '2023-08-15T20:00:00Z'
          },
          organization_id: 'org1',
          venue: {
            id: 'venue1',
            name: 'Test Venue',
            address: {
              address_1: '123 Test St',
              address_2: '',
              city: 'Test City',
              region: 'TC',
              postal_code: '12345',
              country: 'US',
              latitude: 47.6062,
              longitude: -122.3321
            }
          },
          online_event: false,
          is_free: true,
          category_id: '103',
          summary: 'Test Event 1 Summary'
        },
        {
          id: 'event2',
          name: { text: 'Test Event 2', html: '<p>Test Event 2</p>' },
          description: { text: 'Description 2', html: '<p>Description 2</p>' },
          url: 'https://eventbrite.com/event2',
          start: {
            timezone: 'UTC',
            local: '2023-08-20T18:00:00',
            utc: '2023-08-20T18:00:00Z'
          },
          end: {
            timezone: 'UTC',
            local: '2023-08-20T20:00:00',
            utc: '2023-08-20T20:00:00Z'
          },
          organization_id: 'org1',
          venue: {
            id: 'venue2',
            name: 'Test Venue 2',
            address: {
              address_1: '456 Test St',
              address_2: '',
              city: 'Test City',
              region: 'TC',
              postal_code: '12345',
              country: 'US',
              latitude: 47.6062,
              longitude: -122.3321
            }
          },
          online_event: false,
          is_free: false,
          category_id: '103',
          summary: 'Test Event 2 Summary'
        }
      ]
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await eventbriteIntegration.getEventsByLocation(coordinates, radius);

    // Assert
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/events/search/'),
      expect.objectContaining({
        params: expect.objectContaining({
          'location.latitude': coordinates.latitude,
          'location.longitude': coordinates.longitude,
          'location.within': '15mi'
        })
      })
    );
    expect(result.events).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('getEventsByCategory should retrieve events for a specific category', async () => {
    // Arrange
    const category = InterestCategory.ARTS_CULTURE;
    const mockResponseData = {
      pagination: {
        object_count: 2,
        page_number: 1,
        page_size: 20,
        page_count: 1,
        has_more_items: false
      },
      events: [
        {
          id: 'event1',
          name: { text: 'Test Event 1', html: '<p>Test Event 1</p>' },
          description: { text: 'Description 1', html: '<p>Description 1</p>' },
          url: 'https://eventbrite.com/event1',
          start: {
            timezone: 'UTC',
            local: '2023-08-15T18:00:00',
            utc: '2023-08-15T18:00:00Z'
          },
          end: {
            timezone: 'UTC',
            local: '2023-08-15T20:00:00',
            utc: '2023-08-15T20:00:00Z'
          },
          organization_id: 'org1',
          venue: {
            id: 'venue1',
            name: 'Test Venue',
            address: {
              address_1: '123 Test St',
              address_2: '',
              city: 'Test City',
              region: 'TC',
              postal_code: '12345',
              country: 'US',
              latitude: 47.6062,
              longitude: -122.3321
            }
          },
          online_event: false,
          is_free: true,
          category_id: '103',
          summary: 'Test Event 1 Summary'
        },
        {
          id: 'event2',
          name: { text: 'Test Event 2', html: '<p>Test Event 2</p>' },
          description: { text: 'Description 2', html: '<p>Description 2</p>' },
          url: 'https://eventbrite.com/event2',
          start: {
            timezone: 'UTC',
            local: '2023-08-20T18:00:00',
            utc: '2023-08-20T18:00:00Z'
          },
          end: {
            timezone: 'UTC',
            local: '2023-08-20T20:00:00',
            utc: '2023-08-20T20:00:00Z'
          },
          organization_id: 'org1',
          venue: {
            id: 'venue2',
            name: 'Test Venue 2',
            address: {
              address_1: '456 Test St',
              address_2: '',
              city: 'Test City',
              region: 'TC',
              postal_code: '12345',
              country: 'US',
              latitude: 47.6062,
              longitude: -122.3321
            }
          },
          online_event: false,
          is_free: false,
          category_id: '103',
          summary: 'Test Event 2 Summary'
        }
      ]
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await eventbriteIntegration.getEventsByCategory(category);

    // Assert
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/events/search/'),
      expect.objectContaining({
        params: expect.objectContaining({
          categories: expect.stringContaining('103')
        })
      })
    );
    expect(result.events).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('getPopularEvents should retrieve popular events', async () => {
    // Arrange
    const options = {
      location: generateMockCoordinates(),
      radius: 10
    };

    const mockResponseData = {
      pagination: {
        object_count: 2,
        page_number: 1,
        page_size: 20,
        page_count: 1,
        has_more_items: false
      },
      events: [
        {
          id: 'event1',
          name: { text: 'Popular Event 1', html: '<p>Popular Event 1</p>' },
          description: { text: 'Description 1', html: '<p>Description 1</p>' },
          url: 'https://eventbrite.com/event1',
          start: {
            timezone: 'UTC',
            local: '2023-08-15T18:00:00',
            utc: '2023-08-15T18:00:00Z'
          },
          end: {
            timezone: 'UTC',
            local: '2023-08-15T20:00:00',
            utc: '2023-08-15T20:00:00Z'
          },
          organization_id: 'org1',
          venue: {
            id: 'venue1',
            name: 'Test Venue',
            address: {
              address_1: '123 Test St',
              address_2: '',
              city: 'Test City',
              region: 'TC',
              postal_code: '12345',
              country: 'US',
              latitude: 47.6062,
              longitude: -122.3321
            }
          },
          online_event: false,
          is_free: true,
          category_id: '103',
          summary: 'Popular Event 1 Summary'
        },
        {
          id: 'event2',
          name: { text: 'Popular Event 2', html: '<p>Popular Event 2</p>' },
          description: { text: 'Description 2', html: '<p>Description 2</p>' },
          url: 'https://eventbrite.com/event2',
          start: {
            timezone: 'UTC',
            local: '2023-08-20T18:00:00',
            utc: '2023-08-20T18:00:00Z'
          },
          end: {
            timezone: 'UTC',
            local: '2023-08-20T20:00:00',
            utc: '2023-08-20T20:00:00Z'
          },
          organization_id: 'org1',
          venue: {
            id: 'venue2',
            name: 'Test Venue 2',
            address: {
              address_1: '456 Test St',
              address_2: '',
              city: 'Test City',
              region: 'TC',
              postal_code: '12345',
              country: 'US',
              latitude: 47.6062,
              longitude: -122.3321
            }
          },
          online_event: false,
          is_free: false,
          category_id: '103',
          summary: 'Popular Event 2 Summary'
        }
      ]
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await eventbriteIntegration.getPopularEvents(options);

    // Assert
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/events/search/'),
      expect.objectContaining({
        params: expect.objectContaining({
          'location.latitude': options.location.latitude,
          'location.longitude': options.location.longitude,
          'location.within': '10mi',
          sort_by: 'best'
        })
      })
    );
    expect(result.events).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('error handling should handle API errors gracefully', async () => {
    // Arrange
    const searchParams = {
      query: 'test event'
    };

    const errorResponse = {
      response: {
        status: 429,
        data: {
          error_description: 'Rate limit exceeded'
        }
      }
    };

    mockAxios.get.mockRejectedValueOnce(errorResponse);
    mockCache.get.mockReturnValueOnce(null);

    // Act & Assert
    await expect(eventbriteIntegration.searchEvents(searchParams)).rejects.toThrow(ApiError);
    await expect(eventbriteIntegration.searchEvents(searchParams)).rejects.toThrow('Eventbrite rate limit exceeded');
  });

  test('mapEventbriteEventToInternalEvent should correctly map Eventbrite event format to internal format', async () => {
    // Arrange
    const eventId = 'test-event-id';
    const mockResponseData = {
      id: eventId,
      name: { text: 'Test Event', html: '<p>Test Event</p>' },
      description: { text: 'Test Description', html: '<p>Test Description</p>' },
      url: 'https://eventbrite.com/event',
      start: {
        timezone: 'UTC',
        local: '2023-08-15T18:00:00',
        utc: '2023-08-15T18:00:00Z'
      },
      end: {
        timezone: 'UTC',
        local: '2023-08-15T20:00:00',
        utc: '2023-08-15T20:00:00Z'
      },
      organization_id: 'org1',
      venue: {
        id: 'venue1',
        name: 'Test Venue',
        address: {
          address_1: '123 Test St',
          address_2: '',
          city: 'Test City',
          region: 'TC',
          postal_code: '12345',
          country: 'US',
          latitude: 47.6062,
          longitude: -122.3321
        }
      },
      online_event: false,
      is_free: true,
      category_id: '103',
      summary: 'Test Event Summary'
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await eventbriteIntegration.getEventById(eventId);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Test Event');
    expect(result?.description).toBe('Test Description');
    expect(result?.eventType).toBe('in_person');
    expect(result?.location).toBe('Test Venue, Test City');
    expect(result?.coordinates).toEqual({
      latitude: 47.6062,
      longitude: -122.3321
    });
    expect(result?.categories).toContain(InterestCategory.ARTS_CULTURE);
    // @ts-ignore - accessing metadata
    expect(result?.metadata.eventbriteId).toBe(eventId);
    // @ts-ignore - accessing metadata
    expect(result?.metadata.source).toBe('eventbrite');
  });
});

describe('MeetupIntegration', () => {
  let mockAxios: jest.Mocked<typeof axios>;
  let meetupIntegration: MeetupIntegration;
  let mockCache: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios = axios as jest.Mocked<typeof axios>;
    mockCache = new NodeCache();
    meetupIntegration = new MeetupIntegration();
    // @ts-ignore - accessing private property for test
    meetupIntegration.cache = mockCache;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('constructor should initialize with API key and base URL', () => {
    const integration = new MeetupIntegration();
    // @ts-ignore - accessing private properties for test
    expect(integration.apiKey).toBe('mock-meetup-key');
    // @ts-ignore - accessing private properties for test
    expect(integration.baseUrl).toBe('https://mock-meetup.com/gql');
    // @ts-ignore - accessing private properties for test
    expect(integration.cache).toBeDefined();
  });

  test('searchEvents should make a GraphQL request to the Meetup API with search parameters', async () => {
    // Arrange
    const searchParams = {
      query: 'test event',
      lat: 47.6062,
      lon: -122.3321,
      radius: 10,
      page: 1,
      limit: 10
    };

    const mockResponseData = {
      data: {
        searchEvents: {
          count: 2,
          pageInfo: {
            hasNextPage: false,
            endCursor: 'cursor123'
          },
          edges: [
            {
              node: {
                id: 'event1',
                title: 'Test Event 1',
                description: 'Description 1',
                eventUrl: 'https://meetup.com/event1',
                startTime: '2023-08-15T18:00:00Z',
                endTime: '2023-08-15T20:00:00Z',
                group: {
                  id: 'group1',
                  name: 'Test Group',
                  urlname: 'test-group',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US'
                },
                venue: {
                  id: 'venue1',
                  name: 'Test Venue',
                  address: '123 Test St',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US',
                  lat: 47.6062,
                  lng: -122.3321
                },
                isOnline: false,
                fee: null,
                maxAttendees: 50,
                attendeeCount: 20,
                category: {
                  id: '1',
                  name: 'Arts & Culture',
                  shortName: 'Arts'
                },
                imageUrl: 'https://example.com/event1-image.jpg'
              }
            },
            {
              node: {
                id: 'event2',
                title: 'Test Event 2',
                description: 'Description 2',
                eventUrl: 'https://meetup.com/event2',
                startTime: '2023-08-20T18:00:00Z',
                endTime: '2023-08-20T20:00:00Z',
                group: {
                  id: 'group1',
                  name: 'Test Group',
                  urlname: 'test-group',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US'
                },
                venue: {
                  id: 'venue2',
                  name: 'Test Venue 2',
                  address: '456 Test St',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US',
                  lat: 47.6062,
                  lng: -122.3321
                },
                isOnline: false,
                fee: {
                  amount: 10,
                  currency: 'USD'
                },
                maxAttendees: 30,
                attendeeCount: 15,
                category: {
                  id: '1',
                  name: 'Arts & Culture',
                  shortName: 'Arts'
                },
                imageUrl: 'https://example.com/event2-image.jpg'
              }
            }
          ]
        }
      }
    };

    mockAxios.post.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await meetupIntegration.searchEvents(searchParams);

    // Assert
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://mock-meetup.com/gql',
      expect.objectContaining({
        query: expect.stringContaining('searchEvents'),
        variables: expect.objectContaining({
          input: expect.objectContaining({
            query: 'test event',
            location: {
              lat: 47.6062,
              lon: -122.3321,
              radius: 10
            }
          })
        })
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-meetup-key'
        })
      })
    );
    expect(result.events).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('searchEvents with cache should return cached events if available', async () => {
    // Arrange
    const searchParams = {
      query: 'test event'
    };

    const cachedEvents = {
      events: [generateMockEvent(), generateMockEvent()],
      total: 2
    };

    mockCache.get.mockReturnValueOnce(cachedEvents);

    // Act
    const result = await meetupIntegration.searchEvents(searchParams);

    // Assert
    expect(mockAxios.post).not.toHaveBeenCalled();
    expect(result).toBe(cachedEvents);
  });

  test('getEventById should retrieve a specific event by ID', async () => {
    // Arrange
    const eventId = 'mock-event-id';
    const mockResponseData = {
      data: {
        event: {
          id: eventId,
          title: 'Test Event',
          description: 'Test Event Description',
          eventUrl: 'https://meetup.com/test-event',
          startTime: '2023-08-15T18:00:00Z',
          endTime: '2023-08-15T20:00:00Z',
          group: {
            id: 'group1',
            name: 'Test Group',
            urlname: 'test-group',
            city: 'Test City',
            state: 'TC',
            country: 'US'
          },
          venue: {
            id: 'venue1',
            name: 'Test Venue',
            address: '123 Test St',
            city: 'Test City',
            state: 'TC',
            country: 'US',
            lat: 47.6062,
            lng: -122.3321
          },
          isOnline: false,
          fee: null,
          maxAttendees: 50,
          attendeeCount: 20,
          category: {
            id: '1',
            name: 'Arts & Culture',
            shortName: 'Arts'
          },
          imageUrl: 'https://example.com/event-image.jpg'
        }
      }
    };

    mockAxios.post.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await meetupIntegration.getEventById(eventId);

    // Assert
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://mock-meetup.com/gql',
      expect.objectContaining({
        query: expect.stringContaining('event(id: $eventId)'),
        variables: expect.objectContaining({
          eventId
        })
      }),
      expect.any(Object)
    );
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Test Event');
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('getEventsByLocation should retrieve events near a specific location', async () => {
    // Arrange
    const coordinates = generateMockCoordinates();
    const radius = 15;
    const mockResponseData = {
      data: {
        searchEvents: {
          count: 2,
          pageInfo: {
            hasNextPage: false,
            endCursor: 'cursor123'
          },
          edges: [
            {
              node: {
                id: 'event1',
                title: 'Test Event 1',
                description: 'Description 1',
                eventUrl: 'https://meetup.com/event1',
                startTime: '2023-08-15T18:00:00Z',
                endTime: '2023-08-15T20:00:00Z',
                group: {
                  id: 'group1',
                  name: 'Test Group',
                  urlname: 'test-group',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US'
                },
                venue: {
                  id: 'venue1',
                  name: 'Test Venue',
                  address: '123 Test St',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US',
                  lat: 47.6062,
                  lng: -122.3321
                },
                isOnline: false,
                fee: null,
                maxAttendees: 50,
                attendeeCount: 20,
                category: {
                  id: '1',
                  name: 'Arts & Culture',
                  shortName: 'Arts'
                },
                imageUrl: 'https://example.com/event1-image.jpg'
              }
            },
            {
              node: {
                id: 'event2',
                title: 'Test Event 2',
                description: 'Description 2',
                eventUrl: 'https://meetup.com/event2',
                startTime: '2023-08-20T18:00:00Z',
                endTime: '2023-08-20T20:00:00Z',
                group: {
                  id: 'group1',
                  name: 'Test Group',
                  urlname: 'test-group',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US'
                },
                venue: {
                  id: 'venue2',
                  name: 'Test Venue 2',
                  address: '456 Test St',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US',
                  lat: 47.6062,
                  lng: -122.3321
                },
                isOnline: false,
                fee: null,
                maxAttendees: 30,
                attendeeCount: 15,
                category: {
                  id: '1',
                  name: 'Arts & Culture',
                  shortName: 'Arts'
                },
                imageUrl: 'https://example.com/event2-image.jpg'
              }
            }
          ]
        }
      }
    };

    mockAxios.post.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await meetupIntegration.getEventsByLocation(coordinates, radius);

    // Assert
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://mock-meetup.com/gql',
      expect.objectContaining({
        query: expect.stringContaining('searchEvents'),
        variables: expect.objectContaining({
          input: expect.objectContaining({
            location: {
              lat: coordinates.latitude,
              lon: coordinates.longitude,
              radius
            }
          })
        })
      }),
      expect.any(Object)
    );
    expect(result.events).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('getEventsByCategory should retrieve events for a specific category', async () => {
    // Arrange
    const category = InterestCategory.ARTS_CULTURE;
    const mockResponseData = {
      data: {
        searchEvents: {
          count: 2,
          pageInfo: {
            hasNextPage: false,
            endCursor: 'cursor123'
          },
          edges: [
            {
              node: {
                id: 'event1',
                title: 'Test Event 1',
                description: 'Description 1',
                eventUrl: 'https://meetup.com/event1',
                startTime: '2023-08-15T18:00:00Z',
                endTime: '2023-08-15T20:00:00Z',
                group: {
                  id: 'group1',
                  name: 'Test Group',
                  urlname: 'test-group',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US'
                },
                venue: {
                  id: 'venue1',
                  name: 'Test Venue',
                  address: '123 Test St',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US',
                  lat: 47.6062,
                  lng: -122.3321
                },
                isOnline: false,
                fee: null,
                maxAttendees: 50,
                attendeeCount: 20,
                category: {
                  id: '1',
                  name: 'Arts & Culture',
                  shortName: 'Arts'
                },
                imageUrl: 'https://example.com/event1-image.jpg'
              }
            },
            {
              node: {
                id: 'event2',
                title: 'Test Event 2',
                description: 'Description 2',
                eventUrl: 'https://meetup.com/event2',
                startTime: '2023-08-20T18:00:00Z',
                endTime: '2023-08-20T20:00:00Z',
                group: {
                  id: 'group1',
                  name: 'Test Group',
                  urlname: 'test-group',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US'
                },
                venue: {
                  id: 'venue2',
                  name: 'Test Venue 2',
                  address: '456 Test St',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US',
                  lat: 47.6062,
                  lng: -122.3321
                },
                isOnline: false,
                fee: null,
                maxAttendees: 30,
                attendeeCount: 15,
                category: {
                  id: '1',
                  name: 'Arts & Culture',
                  shortName: 'Arts'
                },
                imageUrl: 'https://example.com/event2-image.jpg'
              }
            }
          ]
        }
      }
    };

    mockAxios.post.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await meetupIntegration.getEventsByCategory(category);

    // Assert
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://mock-meetup.com/gql',
      expect.objectContaining({
        query: expect.stringContaining('searchEvents'),
        variables: expect.objectContaining({
          input: expect.objectContaining({
            categoryId: '1'
          })
        })
      }),
      expect.any(Object)
    );
    expect(result.events).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('getUpcomingEvents should retrieve upcoming events', async () => {
    // Arrange
    const options = {
      location: generateMockCoordinates(),
      radius: 10,
      days: 7
    };

    const mockResponseData = {
      data: {
        searchEvents: {
          count: 2,
          pageInfo: {
            hasNextPage: false,
            endCursor: 'cursor123'
          },
          edges: [
            {
              node: {
                id: 'event1',
                title: 'Upcoming Event 1',
                description: 'Description 1',
                eventUrl: 'https://meetup.com/event1',
                startTime: '2023-08-15T18:00:00Z',
                endTime: '2023-08-15T20:00:00Z',
                group: {
                  id: 'group1',
                  name: 'Test Group',
                  urlname: 'test-group',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US'
                },
                venue: {
                  id: 'venue1',
                  name: 'Test Venue',
                  address: '123 Test St',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US',
                  lat: 47.6062,
                  lng: -122.3321
                },
                isOnline: false,
                fee: null,
                maxAttendees: 50,
                attendeeCount: 20,
                category: {
                  id: '1',
                  name: 'Arts & Culture',
                  shortName: 'Arts'
                },
                imageUrl: 'https://example.com/event1-image.jpg'
              }
            },
            {
              node: {
                id: 'event2',
                title: 'Upcoming Event 2',
                description: 'Description 2',
                eventUrl: 'https://meetup.com/event2',
                startTime: '2023-08-20T18:00:00Z',
                endTime: '2023-08-20T20:00:00Z',
                group: {
                  id: 'group1',
                  name: 'Test Group',
                  urlname: 'test-group',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US'
                },
                venue: {
                  id: 'venue2',
                  name: 'Test Venue 2',
                  address: '456 Test St',
                  city: 'Test City',
                  state: 'TC',
                  country: 'US',
                  lat: 47.6062,
                  lng: -122.3321
                },
                isOnline: false,
                fee: null,
                maxAttendees: 30,
                attendeeCount: 15,
                category: {
                  id: '1',
                  name: 'Arts & Culture',
                  shortName: 'Arts'
                },
                imageUrl: 'https://example.com/event2-image.jpg'
              }
            }
          ]
        }
      }
    };

    mockAxios.post.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await meetupIntegration.getUpcomingEvents(options);

    // Assert
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
    expect(mockAxios.post).toHaveBeenCalledWith(
      'https://mock-meetup.com/gql',
      expect.objectContaining({
        query: expect.stringContaining('searchEvents'),
        variables: expect.objectContaining({
          input: expect.objectContaining({
            location: {
              lat: options.location.latitude,
              lon: options.location.longitude,
              radius: options.radius
            },
            startDate: expect.any(String),
            endDate: expect.any(String)
          })
        })
      }),
      expect.any(Object)
    );
    expect(result.events).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('error handling should handle API errors gracefully', async () => {
    // Arrange
    const searchParams = {
      query: 'test event'
    };

    const errorResponse = {
      response: {
        status: 429,
        data: {
          errors: [{
            message: 'Rate limit exceeded',
            extensions: {
              code: 'RATE_LIMIT_EXCEEDED'
            }
          }]
        }
      }
    };

    mockAxios.post.mockRejectedValueOnce(errorResponse);
    mockCache.get.mockReturnValueOnce(null);

    // Act & Assert
    await expect(meetupIntegration.searchEvents(searchParams)).rejects.toThrow(ApiError);
    await expect(meetupIntegration.searchEvents(searchParams)).rejects.toThrow(/rate limit exceeded/i);
  });

  test('mapMeetupEventToInternalEvent should correctly map Meetup event format to internal format', async () => {
    // Arrange
    const eventId = 'mock-event-id';
    const mockResponseData = {
      data: {
        event: {
          id: eventId,
          title: 'Test Event',
          description: 'Test Event Description',
          eventUrl: 'https://meetup.com/test-event',
          startTime: '2023-08-15T18:00:00Z',
          endTime: '2023-08-15T20:00:00Z',
          group: {
            id: 'group1',
            name: 'Test Group',
            urlname: 'test-group',
            city: 'Test City',
            state: 'TC',
            country: 'US'
          },
          venue: {
            id: 'venue1',
            name: 'Test Venue',
            address: '123 Test St',
            city: 'Test City',
            state: 'TC',
            country: 'US',
            lat: 47.6062,
            lng: -122.3321
          },
          isOnline: false,
          fee: {
            amount: 15,
            currency: 'USD'
          },
          maxAttendees: 50,
          attendeeCount: 20,
          category: {
            id: '1',
            name: 'Arts & Culture',
            shortName: 'Arts'
          },
          imageUrl: 'https://example.com/event-image.jpg'
        }
      }
    };

    mockAxios.post.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await meetupIntegration.getEventById(eventId);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Test Event');
    expect(result?.description).toBe('Test Event Description');
    expect(result?.eventType).toBe('in_person');
    expect(result?.cost).toBe(15);
    expect(result?.paymentRequired).toBe(true);
    expect(result?.location).toContain('Test Venue');
    expect(result?.coordinates).toEqual({
      latitude: 47.6062,
      longitude: -122.3321
    });
    expect(result?.categories).toContain(InterestCategory.ARTS_CULTURE);
    expect(result?.maxAttendees).toBe(50);
  });
});

describe('GooglePlacesIntegration', () => {
  let mockAxios: jest.Mocked<typeof axios>;
  let googlePlacesIntegration: GooglePlacesIntegration;
  let mockCache: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios = axios as jest.Mocked<typeof axios>;
    mockCache = new NodeCache();
    googlePlacesIntegration = new GooglePlacesIntegration();
    // @ts-ignore - accessing private property for test
    googlePlacesIntegration.cache = mockCache;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('constructor should initialize with API key and base URL', () => {
    const integration = new GooglePlacesIntegration();
    // @ts-ignore - accessing private properties for test
    expect(integration.apiKey).toBe('mock-google-places-key');
    // @ts-ignore - accessing private properties for test
    expect(integration.baseUrl).toBe('https://mock-google-places.com/api');
    // @ts-ignore - accessing private properties for test
    expect(integration.cache).toBeDefined();
  });

  test('searchNearby should make a request to the Google Places API for nearby venues', async () => {
    // Arrange
    const coordinates = generateMockCoordinates();
    const options = {
      radius: 1000,
      type: 'restaurant'
    };

    const mockResponseData = {
      status: 'OK',
      results: [
        {
          place_id: 'place1',
          name: 'Test Restaurant 1',
          vicinity: '123 Test St, Test City',
          geometry: {
            location: {
              lat: 47.6062,
              lng: -122.3321
            }
          },
          types: ['restaurant', 'food', 'point_of_interest', 'establishment'],
          rating: 4.5,
          price_level: 2,
          photos: [
            {
              photo_reference: 'photo_ref_1',
              width: 800,
              height: 600
            }
          ]
        },
        {
          place_id: 'place2',
          name: 'Test Restaurant 2',
          vicinity: '456 Test St, Test City',
          geometry: {
            location: {
              lat: 47.6062,
              lng: -122.3321
            }
          },
          types: ['restaurant', 'cafe', 'food', 'point_of_interest', 'establishment'],
          rating: 4.0,
          price_level: 1,
          photos: [
            {
              photo_reference: 'photo_ref_2',
              width: 800,
              height: 600
            }
          ]
        }
      ]
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await googlePlacesIntegration.searchNearby(coordinates, options);

    // Assert
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/nearbysearch/json'),
      expect.objectContaining({
        params: expect.objectContaining({
          location: `${coordinates.latitude},${coordinates.longitude}`,
          radius: options.radius,
          type: options.type,
          key: 'mock-google-places-key'
        })
      })
    );
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Test Restaurant 1');
    expect(result[0].categories).toContain(InterestCategory.FOOD_DINING);
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('searchNearby with cache should return cached venues if available', async () => {
    // Arrange
    const coordinates = generateMockCoordinates();
    const options = {
      radius: 1000
    };

    const cachedVenues = [
      generateMockVenue({ name: 'Cached Venue 1' }),
      generateMockVenue({ name: 'Cached Venue 2' })
    ];

    mockCache.get.mockReturnValueOnce(cachedVenues);

    // Act
    const result = await googlePlacesIntegration.searchNearby(coordinates, options);

    // Assert
    expect(mockAxios.get).not.toHaveBeenCalled();
    expect(result).toBe(cachedVenues);
    expect(result[0].name).toBe('Cached Venue 1');
  });

  test('searchText should make a request to the Google Places API with text search', async () => {
    // Arrange
    const query = 'coffee shop';
    const options = {
      coordinates: generateMockCoordinates(),
      radius: 1000
    };

    const mockResponseData = {
      status: 'OK',
      results: [
        {
          place_id: 'place1',
          name: 'Test Coffee Shop 1',
          formatted_address: '123 Test St, Test City, TC 12345',
          geometry: {
            location: {
              lat: 47.6062,
              lng: -122.3321
            }
          },
          types: ['cafe', 'food', 'point_of_interest', 'establishment'],
          rating: 4.5,
          price_level: 2,
          photos: [
            {
              photo_reference: 'photo_ref_1',
              width: 800,
              height: 600
            }
          ]
        },
        {
          place_id: 'place2',
          name: 'Test Coffee Shop 2',
          formatted_address: '456 Test St, Test City, TC 12345',
          geometry: {
            location: {
              lat: 47.6062,
              lng: -122.3321
            }
          },
          types: ['cafe', 'food', 'point_of_interest', 'establishment'],
          rating: 4.0,
          price_level: 1,
          photos: [
            {
              photo_reference: 'photo_ref_2',
              width: 800,
              height: 600
            }
          ]
        }
      ]
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await googlePlacesIntegration.searchText(query, options);

    // Assert
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/textsearch/json'),
      expect.objectContaining({
        params: expect.objectContaining({
          query,
          location: `${options.coordinates.latitude},${options.coordinates.longitude}`,
          radius: options.radius,
          key: 'mock-google-places-key'
        })
      })
    );
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Test Coffee Shop 1');
    expect(result[0].categories).toContain(InterestCategory.FOOD_DINING);
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('getPlaceDetails should retrieve details for a specific place', async () => {
    // Arrange
    const placeId = 'place1';

    const mockResponseData = {
      status: 'OK',
      result: {
        place_id: placeId,
        name: 'Test Place',
        formatted_address: '123 Test St, Test City, TC 12345',
        geometry: {
          location: {
            lat: 47.6062,
            lng: -122.3321
          }
        },
        website: 'https://testplace.example.com',
        international_phone_number: '+1 555-123-4567',
        types: ['restaurant', 'food', 'point_of_interest', 'establishment'],
        rating: 4.5,
        price_level: 2,
        photos: [
          {
            photo_reference: 'photo_ref_1',
            width: 800,
            height: 600
          }
        ],
        url: 'https://maps.google.com/?cid=12345'
      }
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await googlePlacesIntegration.getPlaceDetails(placeId);

    // Assert
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/details/json'),
      expect.objectContaining({
        params: expect.objectContaining({
          place_id: placeId,
          key: 'mock-google-places-key'
        })
      })
    );
    expect(result.id).toBe(placeId);
    expect(result.name).toBe('Test Place');
    expect(result.website).toBe('https://testplace.example.com');
    expect(result.phoneNumber).toBe('+1 555-123-4567');
    expect(result.categories).toContain(InterestCategory.FOOD_DINING);
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('autocomplete should retrieve autocomplete suggestions for a query', async () => {
    // Arrange
    const input = 'coffee';
    const options = {
      coordinates: generateMockCoordinates(),
      radius: 1000
    };

    const mockResponseData = {
      status: 'OK',
      predictions: [
        {
          place_id: 'place1',
          description: 'Coffee Shop 1, Test City'
        },
        {
          place_id: 'place2',
          description: 'Coffee Shop 2, Test City'
        }
      ]
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await googlePlacesIntegration.autocomplete(input, options);

    // Assert
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/autocomplete/json'),
      expect.objectContaining({
        params: expect.objectContaining({
          input,
          location: `${options.coordinates.latitude},${options.coordinates.longitude}`,
          radius: options.radius,
          key: 'mock-google-places-key'
        })
      })
    );
    expect(result).toHaveLength(2);
    expect(result[0].placeId).toBe('place1');
    expect(result[0].description).toBe('Coffee Shop 1, Test City');
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('getPhotoUrl should generate a photo URL from a photo reference', () => {
    // Arrange
    const photoReference = 'photo_ref_1';
    const maxWidth = 400;

    // Act
    const result = googlePlacesIntegration.getPhotoUrl(photoReference, maxWidth);

    // Assert
    expect(result).toBe(
      `https://mock-google-places.com/api/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=mock-google-places-key`
    );
  });

  test('clearCache should clear the venue cache', () => {
    // Act
    googlePlacesIntegration.clearCache();

    // Assert
    expect(mockCache.flushAll).toHaveBeenCalledTimes(1);
  });

  test('error handling should handle API errors gracefully', async () => {
    // Arrange
    const coordinates = generateMockCoordinates();

    const errorResponse = {
      response: {
        status: 400,
        data: {
          status: 'INVALID_REQUEST',
          error_message: 'Invalid request parameters'
        }
      }
    };

    mockAxios.get.mockRejectedValueOnce(errorResponse);
    mockCache.get.mockReturnValueOnce(null);

    // Act & Assert
    await expect(googlePlacesIntegration.searchNearby(coordinates)).rejects.toThrow(ApiError);
    await expect(googlePlacesIntegration.searchNearby(coordinates)).rejects.toThrow(/Failed to connect to Google Places API/i);
  });

  test('transformPlaceToVenue should correctly map Google Places format to internal venue format', async () => {
    // Arrange
    const placeId = 'place1';

    const mockResponseData = {
      status: 'OK',
      result: {
        place_id: placeId,
        name: 'Test Restaurant',
        formatted_address: '123 Test St, Test City, TC 12345',
        geometry: {
          location: {
            lat: 47.6062,
            lng: -122.3321
          }
        },
        website: 'https://testrestaurant.example.com',
        international_phone_number: '+1 555-123-4567',
        types: ['restaurant', 'food', 'point_of_interest', 'establishment'],
        rating: 4.5,
        price_level: 2,
        photos: [
          {
            photo_reference: 'photo_ref_1',
            width: 800,
            height: 600
          }
        ],
        url: 'https://maps.google.com/?cid=12345'
      }
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await googlePlacesIntegration.getPlaceDetails(placeId);

    // Assert
    expect(result.id).toBe(placeId);
    expect(result.name).toBe('Test Restaurant');
    expect(result.address).toBe('123 Test St, Test City, TC 12345');
    expect(result.coordinates).toEqual({
      latitude: 47.6062,
      longitude: -122.3321
    });
    expect(result.placeId).toBe(placeId);
    expect(result.website).toBe('https://testrestaurant.example.com');
    expect(result.phoneNumber).toBe('+1 555-123-4567');
    expect(result.rating).toBe(4.5);
    expect(result.priceLevel).toBe(2);
    expect(result.photos).toHaveLength(1);
    expect(result.photos[0]).toContain('photo_ref_1');
    expect(result.categories).toContain(InterestCategory.FOOD_DINING);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.google_maps_url).toBe('https://maps.google.com/?cid=12345');
  });
});

describe('OpenWeatherMapIntegration', () => {
  let mockAxios: jest.Mocked<typeof axios>;
  let openWeatherMapIntegration: OpenWeatherMapIntegration;
  let mockCache: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios = axios as jest.Mocked<typeof axios>;
    mockCache = new NodeCache();
    openWeatherMapIntegration = new OpenWeatherMapIntegration();
    // @ts-ignore - accessing private property for test
    openWeatherMapIntegration.cache = mockCache;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('constructor should initialize with API key and base URL', () => {
    const integration = new OpenWeatherMapIntegration();
    // @ts-ignore - accessing private properties for test
    expect(integration.apiKey).toBe('mock-openweathermap-key');
    // @ts-ignore - accessing private properties for test
    expect(integration.baseUrl).toBe('https://mock-openweathermap.com/data/2.5');
    // @ts-ignore - accessing private properties for test
    expect(integration.cache).toBeDefined();
  });

  test('getCurrentWeather should make a request to the OpenWeatherMap API for current weather', async () => {
    // Arrange
    const coordinates = generateMockCoordinates();

    const mockResponseData = {
      weather: [
        {
          id: 800,
          main: 'Clear',
          description: 'clear sky',
          icon: '01d'
        }
      ],
      main: {
        temp: 293.15, // 20°C or 68°F
        feels_like: 293.15,
        temp_min: 290.15,
        temp_max: 295.15,
        pressure: 1013,
        humidity: 64
      },
      wind: {
        speed: 3.6,
        deg: 160
      },
      clouds: {
        all: 0
      },
      dt: 1628258400,
      sys: {
        country: 'US',
        sunrise: 1628226000,
        sunset: 1628278800
      },
      timezone: -25200,
      id: 5809844,
      name: 'Seattle',
      cod: 200
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await openWeatherMapIntegration.getCurrentWeather(coordinates);

    // Assert
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining(`/weather?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=mock-openweathermap-key`)
    );
    expect(result.condition).toBe('Clear');
    expect(result.temperature).toBeCloseTo(68, 1); // ~68°F, allowing for small rounding differences
    expect(result.icon).toBe('01d');
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('getCurrentWeather with cache should return cached weather data if available', async () => {
    // Arrange
    const coordinates = generateMockCoordinates();
    const cachedWeatherData = generateMockWeatherData({
      temperature: 75,
      condition: 'Partly Cloudy',
      icon: '02d'
    });

    mockCache.get.mockReturnValueOnce(cachedWeatherData);

    // Act
    const result = await openWeatherMapIntegration.getCurrentWeather(coordinates);

    // Assert
    expect(mockAxios.get).not.toHaveBeenCalled();
    expect(result).toBe(cachedWeatherData);
    expect(result.temperature).toBe(75);
    expect(result.condition).toBe('Partly Cloudy');
    expect(result.icon).toBe('02d');
  });

  test('getWeatherForecast should make a request to the OpenWeatherMap API for forecast data', async () => {
    // Arrange
    const coordinates = generateMockCoordinates();

    const mockResponseData = {
      list: [
        {
          dt: 1628258400, // Day 1
          main: {
            temp: 293.15, // 20°C or 68°F
            feels_like: 293.15,
            temp_min: 290.15,
            temp_max: 295.15,
            pressure: 1013,
            humidity: 64
          },
          weather: [
            {
              id: 800,
              main: 'Clear',
              description: 'clear sky',
              icon: '01d'
            }
          ],
          wind: {
            speed: 3.6,
            deg: 160
          },
          clouds: {
            all: 0
          },
          pop: 0.2 // 20% chance of precipitation
        },
        {
          dt: 1628344800, // Day 2
          main: {
            temp: 295.15, // 22°C or ~72°F
            feels_like: 295.15,
            temp_min: 292.15,
            temp_max: 298.15,
            pressure: 1013,
            humidity: 60
          },
          weather: [
            {
              id: 801,
              main: 'Clouds',
              description: 'few clouds',
              icon: '02d'
            }
          ],
          wind: {
            speed: 4.1,
            deg: 180
          },
          clouds: {
            all: 20
          },
          pop: 0.1 // 10% chance of precipitation
        }
      ],
      city: {
        id: 5809844,
        name: 'Seattle',
        country: 'US',
        timezone: -25200
      }
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await openWeatherMapIntegration.getWeatherForecast(coordinates);

    // Assert
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining(`/forecast?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=mock-openweathermap-key`)
    );
    expect(result).toHaveLength(2);
    expect(result[0].weather.condition).toBe('Clear');
    expect(result[0].weather.temperature).toBeCloseTo(68, 1); // ~68°F, allowing for small rounding differences
    expect(result[1].weather.condition).toBe('Cloudy');
    expect(result[1].weather.temperature).toBeCloseTo(72, 1); // ~72°F, allowing for small rounding differences
    expect(mockCache.set).toHaveBeenCalledTimes(1);
  });

  test('getWeatherForDate should retrieve weather data for a specific date', async () => {
    // Arrange
    const coordinates = generateMockCoordinates();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Mock getCurrentWeather for today's date
    const mockCurrentWeather = generateMockWeatherData({
      temperature: 68,
      condition: 'Clear',
      icon: '01d'
    });

    // Mock getWeatherForecast for future dates
    const mockForecast = [
      {
        date: today,
        weather: generateMockWeatherData({
          temperature: 68,
          condition: 'Clear',
          icon: '01d'
        })
      },
      {
        date: tomorrow,
        weather: generateMockWeatherData({
          temperature: 72,
          condition: 'Cloudy',
          icon: '02d'
        })
      }
    ];

    // Use jest spyOn to mock the methods of our class instance
    jest.spyOn(openWeatherMapIntegration, 'getCurrentWeather').mockResolvedValue(mockCurrentWeather);
    jest.spyOn(openWeatherMapIntegration, 'getWeatherForecast').mockResolvedValue(mockForecast);

    // Act - Test for today
    const todayResult = await openWeatherMapIntegration.getWeatherForDate(coordinates, today);

    // Assert for today
    expect(openWeatherMapIntegration.getCurrentWeather).toHaveBeenCalledWith(coordinates);
    expect(todayResult).toBe(mockCurrentWeather);

    // Reset mocks
    jest.clearAllMocks();

    // Act - Test for tomorrow
    const tomorrowResult = await openWeatherMapIntegration.getWeatherForDate(coordinates, tomorrow);

    // Assert for tomorrow
    expect(openWeatherMapIntegration.getWeatherForecast).toHaveBeenCalledWith(coordinates);
    expect(tomorrowResult).toBe(mockForecast[1].weather);
  });

  test('clearCache should clear the weather cache', () => {
    // Act
    openWeatherMapIntegration.clearCache();

    // Assert
    expect(mockCache.flushAll).toHaveBeenCalledTimes(1);
  });

  test('error handling should handle API errors gracefully', async () => {
    // Arrange
    const coordinates = generateMockCoordinates();

    const errorResponse = {
      response: {
        status: 401,
        data: {
          cod: 401,
          message: 'Invalid API key'
        }
      }
    };

    mockAxios.get.mockRejectedValueOnce(errorResponse);
    mockCache.get.mockReturnValueOnce(null);

    // Act & Assert
    await expect(openWeatherMapIntegration.getCurrentWeather(coordinates)).rejects.toThrow(ApiError);
    await expect(openWeatherMapIntegration.getCurrentWeather(coordinates)).rejects.toThrow('Unauthorized access to weather service');
  });

  test('transformWeatherData should correctly map OpenWeatherMap format to internal weather format', async () => {
    // Arrange
    const coordinates = generateMockCoordinates();

    const mockResponseData = {
      weather: [
        {
          id: 500,
          main: 'Rain',
          description: 'light rain',
          icon: '10d'
        }
      ],
      main: {
        temp: 288.15, // 15°C or 59°F
        feels_like: 287.15,
        temp_min: 286.15,
        temp_max: 290.15,
        pressure: 1010,
        humidity: 75
      },
      wind: {
        speed: 5.1,
        deg: 200
      },
      clouds: {
        all: 75
      },
      dt: 1628258400,
      sys: {
        country: 'US',
        sunrise: 1628226000,
        sunset: 1628278800
      },
      timezone: -25200,
      id: 5809844,
      name: 'Seattle',
      cod: 200
    };

    mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
    mockCache.get.mockReturnValueOnce(null);

    // Act
    const result = await openWeatherMapIntegration.getCurrentWeather(coordinates);

    // Assert
    expect(result.condition).toBe('Rainy');
    expect(result.temperature).toBeCloseTo(59, 1); // ~59°F
    expect(result.icon).toBe('10d');
    expect(result.precipitation).toBe(0); // current weather doesn't have precipitation probability
    expect(result.forecast).toContain('Rainy');
    expect(result.forecast).toContain('59°F');
  });

  test('temperature conversion should correctly convert temperatures between units', async () => {
    // Arrange
    const coordinates = generateMockCoordinates();

    // Test different temperatures: 0K, 273.15K (0°C/32°F), 293.15K (20°C/68°F), 310.15K (37°C/98.6°F)
    const temperatures = [
      { kelvin: 0, expectedF: -459.4 },
      { kelvin: 273.15, expectedF: 32 },
      { kelvin: 293.15, expectedF: 68 },
      { kelvin: 310.15, expectedF: 98.6 }
    ];

    for (const temp of temperatures) {
      const mockResponseData = {
        weather: [
          {
            id: 800,
            main: 'Clear',
            description: 'clear sky',
            icon: '01d'
          }
        ],
        main: {
          temp: temp.kelvin,
          feels_like: temp.kelvin,
          temp_min: temp.kelvin,
          temp_max: temp.kelvin,
          pressure: 1013,
          humidity: 50
        },
        wind: {
          speed: 1.0,
          deg: 0
        },
        clouds: {
          all: 0
        }
      };

      mockAxios.get.mockResolvedValueOnce({ data: mockResponseData });
      mockCache.get.mockReturnValueOnce(null);

      // Act
      const result = await openWeatherMapIntegration.getCurrentWeather(coordinates);

      // Assert - allow small rounding differences
      expect(result.temperature).toBeCloseTo(temp.expectedF, 1);
    }
  });
});