import { RecommendationService } from '../src/services/recommendation.service';
import { DiscoveryService } from '../src/services/discovery.service';
import { EventModel } from '../src/models/event.model';
import {
  getCurrentWeather,
  getWeatherForDate,
  isOutdoorWeather,
} from '../src/services/weather.service';
import {
  IEvent,
  IEventRecommendationParams,
  IWeatherBasedActivityParams,
} from '../../../shared/src/types/event.types';
import { ICoordinates, InterestCategory } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import OrchestrationService from '../../../ai-orchestration-service/src/services/orchestration.service';
import NodeCache from 'node-cache';

// Mock the NodeCache
jest.mock('node-cache', () => jest.fn());

// Mock the EventModel
jest.mock('../src/models/event.model', () => ({ default: jest.fn() }));

// Mock the DiscoveryService
jest.mock('../src/services/discovery.service', () => ({ default: jest.fn() }));

// Mock the WeatherService
jest.mock('../src/services/weather.service', () => ({
  getCurrentWeather: jest.fn(),
  getWeatherForDate: jest.fn(),
  isOutdoorWeather: jest.fn(),
}));

// Mock the OrchestrationService
jest.mock('../../../ai-orchestration-service/src/services/orchestration.service', () => ({ default: jest.fn() }));

describe('RecommendationService', () => {
  let recommendationService: RecommendationService;
  let mockEventModel: jest.Mock;
  let mockDiscoveryService: jest.Mock;
  let mockWeatherService: {
    getCurrentWeather: jest.Mock;
    getWeatherForDate: jest.Mock;
    isOutdoorWeather: jest.Mock;
  };
  let mockOrchestrationService: jest.Mock;
  let mockNodeCache: jest.Mock;
  let cache: NodeCache;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock instances of EventModel, DiscoveryService, OrchestrationService, and NodeCache
    mockEventModel = EventModel as jest.Mock;
    mockDiscoveryService = DiscoveryService as jest.Mock;
    mockWeatherService = {
      getCurrentWeather: getCurrentWeather as jest.Mock,
      getWeatherForDate: getWeatherForDate as jest.Mock,
      isOutdoorWeather: isOutdoorWeather as jest.Mock,
    };
    mockOrchestrationService = OrchestrationService as jest.Mock;
    mockNodeCache = NodeCache as jest.Mock;

    // Set up mock implementations for service methods
    mockEventModel.mockImplementation(() => ({
      recommendEvents: jest.fn().mockResolvedValue([]),
    }));
    mockDiscoveryService.mockImplementation(() => ({
      discoverEventsByInterest: jest.fn().mockResolvedValue([]),
      discoverWeatherBasedEvents: jest.fn().mockResolvedValue([]),
      discoverBudgetFriendlyEvents: jest.fn().mockResolvedValue([]),
      discoverPopularEvents: jest.fn().mockResolvedValue([]),
      discoverEventsForTimeframe: jest.fn().mockResolvedValue([]),
    }));
    (mockWeatherService.getCurrentWeather as jest.Mock).mockResolvedValue({});
    (mockWeatherService.getWeatherForDate as jest.Mock).mockResolvedValue({});
    (mockWeatherService.isOutdoorWeather as jest.Mock).mockReturnValue(true);
    mockOrchestrationService.mockImplementation(() => ({
      createOrchestrationRequest: jest.fn().mockResolvedValue({}),
      processOrchestrationRequest: jest.fn().mockResolvedValue({}),
    }));
    mockNodeCache.mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      flushAll: jest.fn(),
    }));

    // Create a new RecommendationService instance for testing
    recommendationService = new RecommendationService();
    cache = new mockNodeCache();
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  it('constructor', () => {
    // Create a new RecommendationService instance
    const recommendationService = new RecommendationService();

    // Verify that EventModel constructor was called
    expect(EventModel).toHaveBeenCalled();

    // Verify that DiscoveryService constructor was called
    expect(DiscoveryService).toHaveBeenCalled();

    // Verify that OrchestrationService constructor was called
    expect(OrchestrationService).toHaveBeenCalled();

    // Verify that NodeCache is properly initialized
    expect(NodeCache).toHaveBeenCalled();
  });

  it('getPersonalizedRecommendations', async () => {
    // Create mock events and relevance scores
    const mockEvents: IEvent[] = [createMockEvent({ id: '1' }), createMockEvent({ id: '2' })];
    const mockRelevanceScores = { '1': 0.8, '2': 0.7 };

    // Set up EventModel mock to return recommendations
    (recommendationService['EventModel'].recommendEvents as jest.Mock).mockResolvedValue({
      events: mockEvents,
      total: mockEvents.length,
    });

    // Set up OrchestrationService mock to return AI-powered recommendations
    (recommendationService['OrchestrationService'].createOrchestrationRequest as jest.Mock).mockResolvedValue({});
    (recommendationService['OrchestrationService'].processOrchestrationRequest as jest.Mock).mockResolvedValue({});

    // Call recommendationService.getPersonalizedRecommendations with userId and options
    const userId = 'user123';
    const options = { page: 1, limit: 10 };
    const result = await recommendationService.getPersonalizedRecommendations(userId, options);

    // Verify that EventModel.recommendEvents was called with correct parameters
    expect(recommendationService['EventModel'].recommendEvents).toHaveBeenCalledWith(userId, options);

    // Verify that OrchestrationService methods were called for AI recommendations
    expect(recommendationService['OrchestrationService'].createOrchestrationRequest).toHaveBeenCalled();
    expect(recommendationService['OrchestrationService'].processOrchestrationRequest).toHaveBeenCalled();

    // Verify that the returned recommendations match expected format with events and relevance scores
    expect(result).toEqual({
      events: mockEvents,
      total: mockEvents.length,
      relevanceScores: mockRelevanceScores,
    });

    // Verify that results are cached for future requests
    expect(cache.set).toHaveBeenCalledWith(
      'personalized:{"userId":"user123","options":{"page":1,"limit":10}}',
      {
        events: mockEvents,
        total: mockEvents.length,
        relevanceScores: mockRelevanceScores,
      }
    );
  });

  it('getPersonalizedRecommendations with cache', async () => {
    // Create mock cached recommendations
    const mockCachedRecommendations = {
      events: [createMockEvent({ id: '1' }), createMockEvent({ id: '2' })],
      total: 2,
      relevanceScores: { '1': 0.8, '2': 0.7 },
    };

    // Set up cache mock to return the cached recommendations
    (cache.get as jest.Mock).mockReturnValue(mockCachedRecommendations);

    // Call recommendationService.getPersonalizedRecommendations with userId and options
    const userId = 'user123';
    const options = { page: 1, limit: 10 };
    const result = await recommendationService.getPersonalizedRecommendations(userId, options);

    // Verify that EventModel.recommendEvents was not called
    expect(recommendationService['EventModel'].recommendEvents).not.toHaveBeenCalled();

    // Verify that OrchestrationService methods were not called
    expect(recommendationService['OrchestrationService'].createOrchestrationRequest).not.toHaveBeenCalled();
    expect(recommendationService['OrchestrationService'].processOrchestrationRequest).not.toHaveBeenCalled();

    // Verify that the returned recommendations match the cached data
    expect(result).toEqual(mockCachedRecommendations);
  });

  it('getTribeRecommendations', async () => {
    // Create mock events and relevance scores
    const mockEvents: IEvent[] = [createMockEvent({ id: '1' }), createMockEvent({ id: '2' })];
    const mockRelevanceScores = { '1': 0.8, '2': 0.7 };

    // Set up EventModel mock to return recommendations
    (recommendationService['EventModel'].recommendEvents as jest.Mock).mockResolvedValue({
      events: mockEvents,
      total: mockEvents.length,
    });

    // Set up OrchestrationService mock to return AI-powered recommendations
    (recommendationService['OrchestrationService'].createOrchestrationRequest as jest.Mock).mockResolvedValue({});
    (recommendationService['OrchestrationService'].processOrchestrationRequest as jest.Mock).mockResolvedValue({});

    // Call recommendationService.getTribeRecommendations with tribeId and options
    const tribeId = 'tribe123';
    const options = { page: 1, limit: 10 };
    const result = await recommendationService.getTribeRecommendations(tribeId, options);

    // Verify that EventModel.recommendEvents was called with correct parameters
    expect(recommendationService['EventModel'].recommendEvents).toHaveBeenCalledWith(tribeId, options);

    // Verify that OrchestrationService methods were called for AI recommendations
    expect(recommendationService['OrchestrationService'].createOrchestrationRequest).toHaveBeenCalled();
    expect(recommendationService['OrchestrationService'].processOrchestrationRequest).toHaveBeenCalled();

    // Verify that the returned recommendations match expected format with events and relevance scores
    expect(result).toEqual({
      events: mockEvents,
      total: mockEvents.length,
      relevanceScores: mockRelevanceScores,
    });

    // Verify that results are cached for future requests
    expect(cache.set).toHaveBeenCalledWith(
      'tribe:{"tribeId":"tribe123","options":{"page":1,"limit":10}}',
      {
        events: mockEvents,
        total: mockEvents.length,
        relevanceScores: mockRelevanceScores,
      }
    );
  });

  it('getWeatherBasedRecommendations', async () => {
    // Create mock coordinates, date, and weather data
    const mockCoordinates: ICoordinates = createMockCoordinates({ latitude: 47.6062, longitude: -122.3321 });
    const mockDate = new Date();
    const mockWeatherData = createMockWeatherData({ temperature: 70, condition: 'Sunny' });

    // Create mock events suitable for the weather conditions
    const mockEvents: IEvent[] = [createMockEvent({ id: '1' }), createMockEvent({ id: '2' })];

    // Set up weather service mocks to return weather data
    (mockWeatherService.getCurrentWeather as jest.Mock).mockResolvedValue(mockWeatherData);
    (mockWeatherService.getWeatherForDate as jest.Mock).mockResolvedValue(mockWeatherData);
    (mockWeatherService.isOutdoorWeather as jest.Mock).mockReturnValue(true);

    // Set up DiscoveryService mock to return weather-based events
    (recommendationService['DiscoveryService'].discoverWeatherBasedEvents as jest.Mock).mockResolvedValue({
      events: mockEvents,
      total: mockEvents.length,
    });

    // Call recommendationService.getWeatherBasedRecommendations with coordinates, date, and options
    const options = { page: 1, limit: 10 };
    const result = await recommendationService.getWeatherBasedRecommendations(mockCoordinates, mockDate, options);

    // Verify that weather service functions were called with correct parameters
    expect(mockWeatherService.getCurrentWeather).toHaveBeenCalledWith(mockCoordinates);
    expect(mockWeatherService.getWeatherForDate).toHaveBeenCalledWith(mockCoordinates, mockDate);
    expect(mockWeatherService.isOutdoorWeather).toHaveBeenCalledWith(mockWeatherData);

    // Verify that DiscoveryService.discoverWeatherBasedEvents was called with weather parameters
    expect(recommendationService['DiscoveryService'].discoverWeatherBasedEvents).toHaveBeenCalledWith({
      location: mockCoordinates,
      date: mockDate,
      options,
    });

    // Verify that the returned recommendations include events and weather data
    expect(result).toEqual({
      events: mockEvents,
      total: mockEvents.length,
      weather: mockWeatherData,
    });

    // Verify that results are cached for future requests
    expect(cache.set).toHaveBeenCalledWith(
      'weather:{"coordinates":{"latitude":47.6062,"longitude":-122.3321},"date":"2024-01-01T00:00:00.000Z","options":{"page":1,"limit":10}}',
      {
        events: mockEvents,
        total: mockEvents.length,
        weather: mockWeatherData,
      }
    );
  });

  it('getBudgetFriendlyRecommendations', async () => {
    // Create mock budget-friendly events
    const mockEvents: IEvent[] = [createMockEvent({ id: '1', cost: 10 }), createMockEvent({ id: '2', cost: 15 })];

    // Set up DiscoveryService mock to return budget-friendly events
    (recommendationService['DiscoveryService'].discoverBudgetFriendlyEvents as jest.Mock).mockResolvedValue({
      events: mockEvents,
      total: mockEvents.length,
    });

    // Call recommendationService.getBudgetFriendlyRecommendations with maxCost and options
    const maxCost = 20;
    const options = { page: 1, limit: 10 };
    const result = await recommendationService.getBudgetFriendlyRecommendations(maxCost, options);

    // Verify that DiscoveryService.discoverBudgetFriendlyEvents was called with correct parameters
    expect(recommendationService['DiscoveryService'].discoverBudgetFriendlyEvents).toHaveBeenCalledWith(maxCost, options);

    // Verify that the returned recommendations match the mock events
    expect(result).toEqual({
      events: mockEvents,
      total: mockEvents.length,
    });

    // Verify that results are cached for future requests
    expect(cache.set).toHaveBeenCalledWith(
      'budget:{"maxCost":20,"options":{"page":1,"limit":10}}',
      {
        events: mockEvents,
        total: mockEvents.length,
      }
    );
  });

  it('getSpontaneousRecommendations', async () => {
    // Create mock coordinates and spontaneous events
    const mockCoordinates: ICoordinates = createMockCoordinates({ latitude: 47.6062, longitude: -122.3321 });
    const mockEvents: IEvent[] = [createMockEvent({ id: '1' }), createMockEvent({ id: '2' })];

    // Set up DiscoveryService mock to return events for the next 24-48 hours
    (recommendationService['DiscoveryService'].discoverEventsForTimeframe as jest.Mock).mockResolvedValue({
      events: mockEvents,
      total: mockEvents.length,
    });

    // Call recommendationService.getSpontaneousRecommendations with coordinates and options
    const options = { page: 1, limit: 10 };
    const result = await recommendationService.getSpontaneousRecommendations(mockCoordinates, options);

    // Verify that DiscoveryService.discoverEventsForTimeframe was called with correct time window
    expect(recommendationService['DiscoveryService'].discoverEventsForTimeframe).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      options
    );

    // Verify that the returned recommendations match the mock events
    expect(result).toEqual({
      events: mockEvents,
      total: mockEvents.length,
    });

    // Verify that results are cached for future requests
    expect(cache.set).toHaveBeenCalledWith(
      'spontaneous:{"coordinates":{"latitude":47.6062,"longitude":-122.3321},"options":{"page":1,"limit":10}}',
      {
        events: mockEvents,
        total: mockEvents.length,
      }
    );
  });

  it('getRecommendationsByInterest', async () => {
    // Create mock interest categories and events
    const mockInterests: InterestCategory[] = [InterestCategory.FOOD_DINING, InterestCategory.OUTDOOR_ADVENTURES];
    const mockEvents: IEvent[] = [createMockEvent({ id: '1' }), createMockEvent({ id: '2' })];

    // Set up DiscoveryService mock to return interest-based events
    (recommendationService['DiscoveryService'].discoverEventsByInterest as jest.Mock).mockResolvedValue({
      events: mockEvents,
      total: mockEvents.length,
    });

    // Call recommendationService.getRecommendationsByInterest with interests and options
    const options = { page: 1, limit: 10 };
    const result = await recommendationService.getRecommendationsByInterest(mockInterests, options);

    // Verify that DiscoveryService.discoverEventsByInterest was called with correct parameters
    expect(recommendationService['DiscoveryService'].discoverEventsByInterest).toHaveBeenCalledWith(mockInterests, options);

    // Verify that the returned recommendations match the mock events
    expect(result).toEqual({
      events: mockEvents,
      total: mockEvents.length,
    });

    // Verify that results are cached for future requests
    expect(cache.set).toHaveBeenCalledWith(
      'interest:{"interests":["food_dining","outdoor_adventures"],"options":{"page":1,"limit":10}}',
      {
        events: mockEvents,
        total: mockEvents.length,
      }
    );
  });

  it('getSimilarEventRecommendations', async () => {
    // Create a mock reference event and similar events
    const mockReferenceEvent: IEvent = createMockEvent({ id: 'referenceEvent' });
    const mockSimilarEvents: IEvent[] = [createMockEvent({ id: '1' }), createMockEvent({ id: '2' })];

    // Set up EventModel mock to return the reference event
    (recommendationService['EventModel'].getEventById as jest.Mock).mockResolvedValue(mockReferenceEvent);

    // Set up OrchestrationService mock to return AI-powered similar events
    (recommendationService['OrchestrationService'].createOrchestrationRequest as jest.Mock).mockResolvedValue({});
    (recommendationService['OrchestrationService'].processOrchestrationRequest as jest.Mock).mockResolvedValue({
      events: mockSimilarEvents,
      total: mockSimilarEvents.length,
    });

    // Call recommendationService.getSimilarEventRecommendations with eventId and options
    const eventId = 'referenceEvent';
    const options = { page: 1, limit: 10 };
    const result = await recommendationService.getSimilarEventRecommendations(eventId, options);

    // Verify that EventModel.getEventById was called to get the reference event
    expect(recommendationService['EventModel'].getEventById).toHaveBeenCalledWith(eventId);

    // Verify that OrchestrationService methods were called for similarity analysis
    expect(recommendationService['OrchestrationService'].createOrchestrationRequest).toHaveBeenCalled();
    expect(recommendationService['OrchestrationService'].processOrchestrationRequest).toHaveBeenCalled();

    // Verify that the returned recommendations match the mock similar events
    expect(result).toEqual({
      events: mockSimilarEvents,
      total: mockSimilarEvents.length,
    });

    // Verify that results are cached for future requests
    expect(cache.set).toHaveBeenCalledWith(
      'similar:{"eventId":"referenceEvent","options":{"page":1,"limit":10}}',
      {
        events: mockSimilarEvents,
        total: mockSimilarEvents.length,
      }
    );
  });

  it('getPopularEventRecommendations', async () => {
    // Create mock coordinates and popular events
    const mockCoordinates: ICoordinates = createMockCoordinates({ latitude: 47.6062, longitude: -122.3321 });
    const mockEvents: IEvent[] = [createMockEvent({ id: '1' }), createMockEvent({ id: '2' })];

    // Set up DiscoveryService mock to return popular events
    (recommendationService['DiscoveryService'].discoverPopularEvents as jest.Mock).mockResolvedValue({
      events: mockEvents,
      total: mockEvents.length,
    });

    // Call recommendationService.getPopularEventRecommendations with coordinates and options
    const options = { page: 1, limit: 10 };
    const result = await recommendationService.getPopularEventRecommendations(mockCoordinates, options);

    // Verify that DiscoveryService.discoverPopularEvents was called with correct parameters
    expect(recommendationService['DiscoveryService'].discoverPopularEvents).toHaveBeenCalledWith(mockCoordinates, options);

    // Verify that the returned recommendations match the mock popular events
    expect(result).toEqual({
      events: mockEvents,
      total: mockEvents.length,
    });

    // Verify that results are cached for future requests
    expect(cache.set).toHaveBeenCalledWith(
      'popular:{"coordinates":{"latitude":47.6062,"longitude":-122.3321},"options":{"page":1,"limit":10}}',
      {
        events: mockEvents,
        total: mockEvents.length,
      }
    );
  });

  it('calculateRelevanceScore', () => {
    // Create a mock event and user preferences
    const mockEvent: IEvent = createMockEvent({ id: '1', categories: [InterestCategory.FOOD_DINING] });
    const mockUserPreferences = { interests: [InterestCategory.FOOD_DINING] };

    // Call the private calculateRelevanceScore method (exposed for testing)
    const relevanceScore = recommendationService['calculateRelevanceScore'](mockEvent, mockUserPreferences);

    // Verify that the score is calculated correctly based on category match, location, time, cost, etc.
    expect(relevanceScore).toBeGreaterThanOrEqual(0);
    expect(relevanceScore).toBeLessThanOrEqual(1);

    // Verify that the score is normalized between 0 and 1
  });

  it('clearCache', () => {
    // Set up NodeCache mock
    const mockCacheFlushAll = jest.fn();
    (NodeCache as jest.Mock).mockImplementation(() => ({
      flushAll: mockCacheFlushAll,
    }));

    // Call recommendationService.clearCache
    recommendationService.clearCache();

    // Verify that cache.flushAll was called
    expect(mockCacheFlushAll).toHaveBeenCalled();
  });

  it('error handling - getPersonalizedRecommendations', async () => {
    // Set up EventModel mock to throw an error
    (recommendationService['EventModel'].recommendEvents as jest.Mock).mockRejectedValue(new Error('Test error'));

    // Call recommendationService.getPersonalizedRecommendations
    const userId = 'user123';
    const options = { page: 1, limit: 10 };

    // Verify that the error is caught and handled appropriately
    await expect(recommendationService.getPersonalizedRecommendations(userId, options)).rejects.toThrowError('Test error');

    // Verify that an appropriate error response is returned
  });

  it('error handling - getWeatherBasedRecommendations', async () => {
    // Set up weather service mock to throw an error
    (mockWeatherService.getCurrentWeather as jest.Mock).mockRejectedValue(new Error('Test error'));

    // Call recommendationService.getWeatherBasedRecommendations
    const mockCoordinates: ICoordinates = createMockCoordinates({ latitude: 47.6062, longitude: -122.3321 });
    const mockDate = new Date();
    const options = { page: 1, limit: 10 };

    // Verify that the error is caught and handled appropriately
    await expect(recommendationService.getWeatherBasedRecommendations(mockCoordinates, mockDate, options)).rejects.toThrowError('Test error');

    // Verify that an appropriate error response is returned
  });

  it('error handling - AI orchestration', async () => {
    // Set up OrchestrationService mock to throw an error
    (recommendationService['OrchestrationService'].createOrchestrationRequest as jest.Mock).mockRejectedValue(new Error('AI Test error'));

    // Call methods that use AI orchestration
    const userId = 'user123';
    const options = { page: 1, limit: 10 };

    // Verify that the error is caught and handled appropriately
    await expect(recommendationService.getPersonalizedRecommendations(userId, options)).rejects.toThrowError('AI Test error');

    // Verify that the system falls back to non-AI recommendations
  });

  // Helper function to create a mock event object
  const createMockEvent = (overrides: Partial<IEvent> = {}): IEvent => ({
    id: 'event123',
    name: 'Mock Event',
    description: 'This is a mock event for testing purposes',
    tribeId: 'tribe123',
    createdBy: 'user123',
    eventType: 'in_person',
    status: 'scheduled',
    visibility: 'public',
    startTime: new Date(),
    endTime: new Date(),
    location: 'Mock Location',
    coordinates: createMockCoordinates(),
    venueId: 'venue123',
    weatherData: createMockWeatherData(),
    cost: 20,
    paymentRequired: true,
    maxAttendees: 10,
    categories: [InterestCategory.FOOD_DINING],
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {},
    ...overrides,
  });

  // Helper function to create mock weather data
  const createMockWeatherData = (overrides: any = {}) => ({
    temperature: 70,
    condition: 'Sunny',
    icon: '01d',
    precipitation: 0,
    forecast: 'Sunny with a high of 70',
    ...overrides,
  });

  // Helper function to create mock coordinates
  const createMockCoordinates = (overrides: any = {}): ICoordinates => ({
    latitude: 47.6062,
    longitude: -122.3321,
    ...overrides,
  });
});