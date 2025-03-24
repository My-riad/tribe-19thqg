import { VenueService } from '../src/services/venue.service';
import { VenueModel, IVenueSearchParams, IVenueSuitabilityParams, IVenueRecommendationParams, IVenueSuitability } from '../src/models/venue.model';
import { EventService } from '../../event-service/src/services/event.service';
import { ProfileService } from '../../profile-service/src/services/profile.service';
import { IVenue, IVenueDetails, ITransportationOption } from '../../../shared/src/types/event.types';
import { ICoordinates } from '../../../shared/src/types/profile.types';
import { validateVenueSearchParams, validateVenueSuitabilityParams, validateVenueRecommendationParams, validateTransportationRequest, validateOptimalLocationRequest } from '../src/validations/venue.validation';
import { ApiError } from '../../../shared/src/errors/api.error';
import { ValidationError } from '../../../shared/src/errors/validation.error';
import { AIOrchestrationClient } from '@tribe/ai-orchestration-client'; // ^1.0.0
import { jest } from '@jest/globals'; // ^29.0.0

/**
 * Creates a mock VenueModel for testing
 * @param overrides - Optional overrides for the mock implementation
 * @returns Mocked VenueModel instance
 */
const createMockVenueModel = (overrides: any = {}) => {
  return {
    getVenueById: jest.fn(),
    searchVenues: jest.fn(),
    findVenuesByLocation: jest.fn(),
    calculateVenueSuitability: jest.fn(),
    recommendVenues: jest.fn(),
    getVenueDetails: jest.fn(),
    getTransportationOptions: jest.fn(),
    calculateDistance: jest.fn(),
    calculateBoundingBox: jest.fn(),
    ...overrides,
  };
};

/**
 * Creates a mock EventService for testing
 * @param overrides - Optional overrides for the mock implementation
 * @returns Mocked EventService instance
 */
const createMockEventService = (overrides: any = {}) => {
  return {
    getEventById: jest.fn(),
    getEventAttendees: jest.fn(),
    ...overrides,
  };
};

/**
 * Creates a mock ProfileService for testing
 * @param overrides - Optional overrides for the mock implementation
 * @returns Mocked ProfileService instance
 */
const createMockProfileService = (overrides: any = {}) => {
  return {
    getUserProfile: jest.fn(),
    getUserPreferences: jest.fn(),
    ...overrides,
  };
};

/**
 * Creates a mock AI client for testing
 * @param overrides - Optional overrides for the mock implementation
 * @returns Mocked AI client instance
 */
const createMockAIClient = (overrides: any = {}) => {
  return {
    enhanceVenueRecommendations: jest.fn(),
    optimizeLocation: jest.fn(),
    estimateBudget: jest.fn(),
    ...overrides,
  };
};

/**
 * Creates a test venue object
 * @param overrides - Optional overrides for the default venue
 * @returns Test venue object
 */
const createTestVenue = (overrides: any = {}): IVenue => ({
  id: 'venue-123',
  name: 'Test Venue',
  address: '123 Test Street, Seattle, WA 98101',
  coordinates: { latitude: 47.6062, longitude: -122.3321 },
  placeId: 'test-place-id',
  capacity: 50,
  priceLevel: 2,
  rating: 4.5,
  categories: ['FOOD_DINING', 'ARTS_CULTURE'],
  accessibilityFeatures: ['wheelchair_accessible', 'elevator'],
  createdAt: '2023-07-01T00:00:00Z',
  updatedAt: '2023-07-01T00:00:00Z',
  ...overrides,
});

/**
 * Creates a test venue details object
 * @param overrides - Optional overrides for the default venue details
 * @returns Test venue details object
 */
const createTestVenueDetails = (overrides: any = {}): IVenueDetails => ({
  id: 'venue-123',
  name: 'Test Venue',
  address: '123 Test Street, Seattle, WA 98101',
  coordinates: { latitude: 47.6062, longitude: -122.3321 },
  placeId: 'test-place-id',
  website: 'https://testvenue.com',
  phoneNumber: '+12065551234',
  capacity: 50,
  priceLevel: 2,
  rating: 4.5,
  photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  categories: ['FOOD_DINING', 'ARTS_CULTURE'],
  hours: {
    Monday: { open: '09:00', close: '22:00' },
    Tuesday: { open: '09:00', close: '22:00' },
    Wednesday: { open: '09:00', close: '22:00' },
    Thursday: { open: '09:00', close: '22:00' },
    Friday: { open: '09:00', close: '23:00' },
    Saturday: { open: '10:00', close: '23:00' },
    Sunday: { open: '10:00', close: '21:00' },
  },
  amenities: ['wifi', 'parking', 'outdoor_seating'],
  accessibilityFeatures: ['wheelchair_accessible', 'elevator'],
  reviews: [
    { rating: 5, text: 'Great venue for small groups!', author: 'John D.', date: '2023-06-15T00:00:00Z' },
    { rating: 4, text: 'Nice atmosphere, good service.', author: 'Sarah M.', date: '2023-06-10T00:00:00Z' },
  ],
  metadata: { reservationRequired: true, averageStay: 120 },
  ...overrides,
});

/**
 * Creates a test venue suitability object
 * @param overrides - Optional overrides for the default venue suitability
 * @returns Test venue suitability object
 */
const createTestVenueSuitability = (overrides: any = {}): IVenueSuitability => ({
  venue: createTestVenue(),
  distanceScore: 0.85,
  capacityScore: 0.95,
  budgetScore: 0.8,
  accessibilityScore: 1.0,
  overallScore: 0.9,
  aiRecommended: true,
  recommendationReason: 'This venue is highly suitable for your group size and has all required accessibility features.',
  ...overrides,
});

/**
 * Creates a test transportation option object
 * @param overrides - Optional overrides for the default transportation option
 * @returns Test transportation option object
 */
const createTestTransportationOption = (overrides: any = {}): ITransportationOption => ({
  mode: 'driving',
  duration: 15,
  distance: 5.2,
  cost: 10,
  route: [{ latitude: 47.6062, longitude: -122.3321 }, { latitude: 47.6092, longitude: -122.3331 }, { latitude: 47.6152, longitude: -122.3381 }],
  instructions: ['Head north on Test Street', 'Turn right onto Main Avenue', 'Destination will be on your left'],
  ...overrides,
});

describe('VenueService', () => {
  describe('getVenueById', () => {
    it('should retrieve a venue by ID', async () => {
      const mockVenue = createTestVenue();
      const mockVenueModel = createMockVenueModel({
        getVenueById: jest.fn().mockResolvedValue(mockVenue),
      });
      const venueService = new VenueService();
      (venueService as any).venueModel = mockVenueModel;

      const venue = await venueService.getVenueById('venue-123');

      expect(mockVenueModel.getVenueById).toHaveBeenCalledWith('venue-123');
      expect(venue).toEqual(mockVenue);
    });

    it('should throw an error if venue is not found', async () => {
      const mockVenueModel = createMockVenueModel({
        getVenueById: jest.fn().mockResolvedValue(null),
      });
      const venueService = new VenueService();
      (venueService as any).venueModel = mockVenueModel;

      await expect(venueService.getVenueById('venue-123')).rejects.toThrow(ApiError.notFound('Venue not found'));
    });
  });

  describe('searchVenues', () => {
    it('should search for venues based on search parameters', async () => {
      const mockSearchParams: IVenueSearchParams = { query: 'Test' };
      const mockSearchResults = { venues: [createTestVenue()], total: 1 };
      const mockVenueModel = createMockVenueModel({
        searchVenues: jest.fn().mockResolvedValue(mockSearchResults),
      });
      (validateVenueSearchParams as jest.Mock) = jest.fn().mockReturnValue(mockSearchParams);
      const venueService = new VenueService();
      (venueService as any).venueModel = mockVenueModel;

      const searchResults = await venueService.searchVenues(mockSearchParams);

      expect(validateVenueSearchParams).toHaveBeenCalledWith(mockSearchParams);
      expect(mockVenueModel.searchVenues).toHaveBeenCalledWith(mockSearchParams);
      expect(searchResults).toEqual(mockSearchResults);
    });

    it('should throw validation error for invalid search parameters', async () => {
      (validateVenueSearchParams as jest.Mock) = jest.fn().mockImplementation(() => {
        throw new ValidationError('Invalid search parameters');
      });
      const venueService = new VenueService();

      await expect(venueService.searchVenues({} as any)).rejects.toThrow(ValidationError);
    });
  });

  describe('findVenuesByLocation', () => {
    it('should find venues near a specific location', async () => {
      const mockCoordinates: ICoordinates = { latitude: 47.6062, longitude: -122.3321 };
      const mockRadius = 10;
      const mockOptions = {};
      const mockSearchResults = { venues: [createTestVenue()], total: 1 };
      const mockVenueModel = createMockVenueModel({
        findVenuesByLocation: jest.fn().mockResolvedValue(mockSearchResults),
      });
      const venueService = new VenueService();
      (venueService as any).venueModel = mockVenueModel;

      const searchResults = await venueService.findVenuesByLocation(mockCoordinates, mockRadius, mockOptions);

      expect(mockVenueModel.findVenuesByLocation).toHaveBeenCalledWith(mockCoordinates, mockRadius, mockOptions);
      expect(searchResults).toEqual(mockSearchResults);
    });
  });

  describe('calculateVenueSuitability', () => {
    it('should calculate suitability score for a venue', async () => {
      const mockVenue = createTestVenue();
      const mockSuitabilityParams: IVenueSuitabilityParams = {
        groupSize: 5,
        preferredLocation: { latitude: 47.6062, longitude: -122.3321 },
        budgetRange: { min: 10, max: 30 },
        accessibilityRequirements: [],
        weights: { distance: 1, capacity: 1, budget: 1, accessibility: 1 },
      };
      const mockSuitabilityResult = createTestVenueSuitability();
      const mockVenueModel = createMockVenueModel({
        calculateVenueSuitability: jest.fn().mockResolvedValue(mockSuitabilityResult),
      });
      (validateVenueSuitabilityParams as jest.Mock) = jest.fn().mockReturnValue(mockSuitabilityParams);
      const venueService = new VenueService();
      (venueService as any).venueModel = mockVenueModel;

      const suitabilityScore = await venueService.calculateVenueSuitability(mockVenue, mockSuitabilityParams);

      expect(validateVenueSuitabilityParams).toHaveBeenCalledWith(mockSuitabilityParams);
      expect(mockVenueModel.calculateVenueSuitability).toHaveBeenCalledWith(mockVenue, mockSuitabilityParams);
      expect(suitabilityScore).toEqual(mockSuitabilityResult);
    });
  });

  describe('recommendVenues', () => {
    it('should recommend venues based on group preferences', async () => {
      const mockRecommendationParams: IVenueRecommendationParams = {
        tribeId: 'tribe-123',
        eventId: 'event-123',
        groupSize: 5,
        preferredLocation: { latitude: 47.6062, longitude: -122.3321 },
        maxDistance: 10,
        budgetRange: { min: 10, max: 30 },
        venueTypes: [],
        accessibilityRequirements: [],
        limit: 5,
      };
      const mockRecommendationResults = [createTestVenueSuitability()];
      const mockVenueModel = createMockVenueModel({
        recommendVenues: jest.fn().mockResolvedValue(mockRecommendationResults),
      });
      (validateVenueRecommendationParams as jest.Mock) = jest.fn().mockReturnValue(mockRecommendationParams);
      const mockAIClient = createMockAIClient({
        enhanceVenueRecommendations: jest.fn().mockResolvedValue(mockRecommendationResults),
      });
      const venueService = new VenueService();
      (venueService as any).venueModel = mockVenueModel;
      (venueService as any).aiClient = mockAIClient;

      const recommendedVenues = await venueService.recommendVenues(mockRecommendationParams);

      expect(validateVenueRecommendationParams).toHaveBeenCalledWith(mockRecommendationParams);
      expect(mockVenueModel.recommendVenues).toHaveBeenCalledWith(mockRecommendationParams);
      expect(mockAIClient.enhanceVenueRecommendations).toHaveBeenCalledWith(mockRecommendationResults, mockRecommendationParams);
      expect(recommendedVenues).toEqual(mockRecommendationResults);
    });
  });

  describe('recommendVenuesForEvent', () => {
    it('should recommend venues for a specific event', async () => {
      const mockEventId = 'event-123';
      const mockEvent = { id: mockEventId, name: 'Test Event' };
      const mockAttendees = [{ userId: 'user-1' }, { userId: 'user-2' }];
      const mockUserProfiles = { 'user-1': { id: 'user-1' }, 'user-2': { id: 'user-2' } };
      const mockRecommendationParams: IVenueRecommendationParams = {
        tribeId: 'tribe-123',
        eventId: 'event-123',
        groupSize: 5,
        preferredLocation: { latitude: 47.6062, longitude: -122.3321 },
        maxDistance: 10,
        budgetRange: { min: 10, max: 30 },
        venueTypes: [],
        accessibilityRequirements: [],
        limit: 5,
      };
      const mockRecommendationResults = [createTestVenueSuitability()];
      const mockEventService = createMockEventService({
        getEventById: jest.fn().mockResolvedValue(mockEvent),
        getEventAttendees: jest.fn().mockResolvedValue(mockAttendees),
      });
      const mockProfileService = createMockProfileService({
        getUserProfile: jest.fn().mockImplementation(userId => mockUserProfiles[userId]),
      });
      const mockVenueService = createMockVenueModel({
        recommendVenues: jest.fn().mockResolvedValue(mockRecommendationResults),
      });
      const venueService = new VenueService();
      (venueService as any).eventService = mockEventService;
      (venueService as any).profileService = mockProfileService;
      (venueService as any).venueModel = mockVenueService;

      const recommendedVenues = await venueService.recommendVenuesForEvent(mockEventId, {});

      expect(mockEventService.getEventById).toHaveBeenCalledWith(mockEventId, true);
      expect(mockEventService.getEventAttendees).toHaveBeenCalledWith(mockEventId);
      expect(mockProfileService.getUserProfile).toHaveBeenCalledTimes(mockAttendees.length);
      expect(mockVenueService.recommendVenues).toHaveBeenCalled();
      expect(recommendedVenues).toEqual(mockRecommendationResults);
    });
  });

  describe('getVenueDetails', () => {
    it('should get detailed information about a venue', async () => {
      const mockVenueDetails = createTestVenueDetails();
      const mockVenueModel = createMockVenueModel({
        getVenueDetails: jest.fn().mockResolvedValue(mockVenueDetails),
      });
      const venueService = new VenueService();
      (venueService as any).venueModel = mockVenueModel;

      const venueDetails = await venueService.getVenueDetails('venue-123');

      expect(mockVenueModel.getVenueDetails).toHaveBeenCalledWith('venue-123');
      expect(venueDetails).toEqual(mockVenueDetails);
    });

    it('should throw an error if venue details are not found', async () => {
      const mockVenueModel = createMockVenueModel({
        getVenueDetails: jest.fn().mockResolvedValue(null),
      });
      const venueService = new VenueService();
      (venueService as any).venueModel = mockVenueModel;

      await expect(venueService.getVenueDetails('venue-123')).rejects.toThrow(ApiError.notFound('Venue not found'));
    });
  });

  describe('getTransportationOptions', () => {
    it('should get transportation options to a venue', async () => {
      const mockCoordinates: ICoordinates = { latitude: 47.6062, longitude: -122.3321 };
      const mockTransportationOptions = [createTestTransportationOption()];
      const mockVenueModel = createMockVenueModel({
        getTransportationOptions: jest.fn().mockResolvedValue(mockTransportationOptions),
      });
      (validateTransportationRequest as jest.Mock) = jest.fn().mockReturnValue({ venueId: 'venue-123', fromLocation: mockCoordinates });
      const venueService = new VenueService();
      (venueService as any).venueModel = mockVenueModel;

      const transportationOptions = await venueService.getTransportationOptions('venue-123', mockCoordinates);

      expect(validateTransportationRequest).toHaveBeenCalledWith({ venueId: 'venue-123', fromLocation: mockCoordinates });
      expect(mockVenueModel.getTransportationOptions).toHaveBeenCalledWith('venue-123', mockCoordinates);
      expect(transportationOptions).toEqual(mockTransportationOptions);
    });
  });

  describe('calculateTravelTimesForAttendees', () => {
    it('should calculate travel times for attendees to a venue', async () => {
      const mockEventId = 'event-123';
      const mockVenueId = 'venue-123';
      const mockAttendees = [{ userId: 'user-1' }, { userId: 'user-2' }];
      const mockUserProfiles = { 'user-1': { id: 'user-1' }, 'user-2': { id: 'user-2' } };
      const mockVenue = createTestVenue();
      const mockDistance = 10;
      const mockEventService = createMockEventService({
        getEventAttendees: jest.fn().mockResolvedValue(mockAttendees),
      });
      const mockProfileService = createMockProfileService({
        getUserProfile: jest.fn().mockImplementation(userId => mockUserProfiles[userId]),
      });
      const mockVenueService = createMockVenueModel({
        getVenueById: jest.fn().mockResolvedValue(mockVenue),
        calculateDistance: jest.fn().mockReturnValue(mockDistance),
      });
      const venueService = new VenueService();
      (venueService as any).eventService = mockEventService;
      (venueService as any).profileService = mockProfileService;
      (venueService as any).venueModel = mockVenueService;

      const travelTimes = await venueService.calculateTravelTimesForAttendees(mockEventId, mockVenueId);

      expect(mockEventService.getEventAttendees).toHaveBeenCalledWith(mockEventId);
      expect(mockVenueService.getVenueById).toHaveBeenCalledWith(mockVenueId);
      expect(mockProfileService.getUserProfile).toHaveBeenCalledTimes(mockAttendees.length);
      expect(mockVenueService.calculateDistance).toHaveBeenCalledTimes(mockAttendees.length);
      expect(travelTimes).toEqual(undefined);
    });
  });

  describe('findOptimalVenueLocation', () => {
    it('should find the optimal venue location based on attendee locations', async () => {
      const mockEventId = 'event-123';
      const mockAttendees = [{ userId: 'user-1' }, { userId: 'user-2' }];
      const mockUserProfiles = { 'user-1': { id: 'user-1' }, 'user-2': { id: 'user-2' } };
      const mockOptimalLocation: ICoordinates = { latitude: 47.6062, longitude: -122.3321 };
      const mockEventService = createMockEventService({
        getEventAttendees: jest.fn().mockResolvedValue(mockAttendees),
      });
      const mockProfileService = createMockProfileService({
        getUserProfile: jest.fn().mockImplementation(userId => mockUserProfiles[userId]),
      });
      const mockAIClient = createMockAIClient({
        optimizeLocation: jest.fn().mockResolvedValue(mockOptimalLocation),
      });
      (validateOptimalLocationRequest as jest.Mock) = jest.fn().mockReturnValue({ eventId: mockEventId });
      const venueService = new VenueService();
      (venueService as any).eventService = mockEventService;
      (venueService as any).profileService = mockProfileService;
      (venueService as any).aiClient = mockAIClient;

      const optimalLocation = await venueService.findOptimalVenueLocation(mockEventId);

      expect(validateOptimalLocationRequest).toHaveBeenCalledWith({ eventId: mockEventId });
      expect(mockEventService.getEventAttendees).toHaveBeenCalledWith(mockEventId);
      expect(mockProfileService.getUserProfile).toHaveBeenCalledTimes(mockAttendees.length);
      expect(mockAIClient.optimizeLocation).toHaveBeenCalled();
      expect(optimalLocation).toEqual(mockOptimalLocation);
    });
  });

  describe('estimateVenueBudget', () => {
    it('should estimate budget for a venue based on group size and preferences', async () => {
      const mockGroupSize = 5;
      const mockPreferences = {};
      const mockBudgetEstimation = { min: 25, max: 45, recommended: 35 };
      const mockAIClient = createMockAIClient({
        estimateBudget: jest.fn().mockResolvedValue(mockBudgetEstimation),
      });
      const venueService = new VenueService();
      (venueService as any).aiClient = mockAIClient;

      const budgetEstimation = await venueService.estimateVenueBudget(mockGroupSize, mockPreferences);

      expect(mockAIClient.estimateBudget).toHaveBeenCalledWith(mockGroupSize, mockPreferences);
      expect(budgetEstimation).toEqual(mockBudgetEstimation);
    });
  });

  describe('getAccessibilityRequirements', () => {
    it('should get accessibility requirements for a tribe or event', async () => {
      const mockEventId = 'event-123';
      const mockAttendees = [{ userId: 'user-1' }, { userId: 'user-2' }];
      const mockUserProfiles = { 'user-1': { id: 'user-1' }, 'user-2': { id: 'user-2' } };
      const mockUserPreferences = { 'user-1': { accessibility: ['wheelchair_accessible'] }, 'user-2': { accessibility: [] } };
      const mockEventService = createMockEventService({
        getEventAttendees: jest.fn().mockResolvedValue(mockAttendees),
      });
      const mockProfileService = createMockProfileService({
        getUserProfile: jest.fn().mockImplementation(userId => mockUserProfiles[userId]),
        getUserPreferences: jest.fn().mockImplementation(userId => mockUserPreferences[userId]),
      });
      const venueService = new VenueService();
      (venueService as any).eventService = mockEventService;
      (venueService as any).profileService = mockProfileService;

      const accessibilityRequirements = await venueService.getAccessibilityRequirements(null, mockEventId);

      expect(mockEventService.getEventAttendees).toHaveBeenCalledWith(mockEventId);
      expect(mockProfileService.getUserProfile).toHaveBeenCalledTimes(mockAttendees.length);
      expect(mockProfileService.getUserPreferences).toHaveBeenCalledTimes(mockAttendees.length);
      expect(accessibilityRequirements).toEqual(undefined);
    });

    it('should throw an error if neither event ID nor tribe ID is provided', async () => {
      const venueService = new VenueService();

      await expect(venueService.getAccessibilityRequirements(null, null)).rejects.toThrow(ApiError.badRequest('Either tribeId or eventId must be provided'));
    });
  });
});

describe('VenueModel', () => {
  describe('getVenueById', () => {
    it('should retrieve a venue by ID from the database', async () => {
      const mockVenue = createTestVenue();
      const mockPrisma = {
        venue: {
          findUnique: jest.fn().mockResolvedValue(mockVenue),
        },
      };
      const venueModel = new VenueModel();
      (venueModel as any).prisma = mockPrisma;

      const venue = await venueModel.getVenueById('venue-123');

      expect(mockPrisma.venue.findUnique).toHaveBeenCalledWith({ where: { id: 'venue-123' } });
      expect(venue).toEqual(mockVenue);
    });
  });

  describe('searchVenues', () => {
    it('should search for venues based on search parameters', async () => {
      const mockSearchParams: IVenueSearchParams = { query: 'Test' };
      const mockVenues = [createTestVenue()];
      const mockTotal = 1;
      const mockPrisma = {
        venue: {
          findMany: jest.fn().mockResolvedValue(mockVenues),
          count: jest.fn().mockResolvedValue(mockTotal),
        },
      };
      const venueModel = new VenueModel();
      (venueModel as any).prisma = mockPrisma;

      const searchResults = await venueModel.searchVenues(mockSearchParams);

      expect(mockPrisma.venue.findMany).toHaveBeenCalled();
      expect(mockPrisma.venue.count).toHaveBeenCalled();
      expect(searchResults).toEqual({ venues: mockVenues, total: mockTotal });
    });
  });

  describe('findVenuesByLocation', () => {
    it('should find venues near a specific location', async () => {
      const mockCoordinates: ICoordinates = { latitude: 47.6062, longitude: -122.3321 };
      const mockRadius = 10;
      const mockVenues = [createTestVenue()];
      const mockTotal = 1;
      const mockBoundingBox = { minLat: 47.5, maxLat: 47.7, minLng: -122.4, maxLng: -122.2 };
      const mockPrisma = {
        venue: {
          findMany: jest.fn().mockResolvedValue(mockVenues),
          count: jest.fn().mockResolvedValue(mockTotal),
        },
      };
      const venueModel = new VenueModel();
      (venueModel as any).prisma = mockPrisma;
      (venueModel as any).calculateBoundingBox = jest.fn().mockReturnValue(mockBoundingBox);

      const searchResults = await venueModel.findVenuesByLocation(mockCoordinates, mockRadius);

      expect((venueModel as any).calculateBoundingBox).toHaveBeenCalledWith(mockCoordinates, mockRadius);
      expect(mockPrisma.venue.findMany).toHaveBeenCalled();
      expect(searchResults).toEqual({ venues: mockVenues, total: mockTotal });
    });
  });

  describe('calculateVenueSuitability', () => {
    it('should calculate suitability scores for a venue', async () => {
      const mockVenue = createTestVenue();
      const mockSuitabilityParams: IVenueSuitabilityParams = {
        groupSize: 5,
        preferredLocation: { latitude: 47.6062, longitude: -122.3321 },
        budgetRange: { min: 10, max: 30 },
        accessibilityRequirements: [],
        weights: { distance: 1, capacity: 1, budget: 1, accessibility: 1 },
      };
      const venueModel = new VenueModel();
      (venueModel as any).calculateDistance = jest.fn().mockReturnValue(1);

      const suitability = await venueModel.calculateVenueSuitability(mockVenue, mockSuitabilityParams);

      expect((venueModel as any).calculateDistance).toHaveBeenCalled();
      expect(typeof suitability.distanceScore).toBe('number');
      expect(typeof suitability.capacityScore).toBe('number');
      expect(typeof suitability.budgetScore).toBe('number');
      expect(typeof suitability.accessibilityScore).toBe('number');
      expect(typeof suitability.overallScore).toBe('number');
    });
  });

  describe('recommendVenues', () => {
    it('should recommend venues based on recommendation parameters', async () => {
      const mockRecommendationParams: IVenueRecommendationParams = {
        tribeId: 'tribe-123',
        eventId: 'event-123',
        groupSize: 5,
        preferredLocation: { latitude: 47.6062, longitude: -122.3321 },
        maxDistance: 10,
        budgetRange: { min: 10, max: 30 },
        venueTypes: [],
        accessibilityRequirements: [],
        limit: 5,
      };
      const mockVenues = [createTestVenue()];
      const mockSuitability = createTestVenueSuitability();
      const mockAIClient = createMockAIClient({
        enhanceVenueRecommendations: jest.fn().mockResolvedValue([mockSuitability]),
      });
      const mockPrisma = {
        venue: {
          findMany: jest.fn().mockResolvedValue(mockVenues),
          count: jest.fn().mockResolvedValue(1),
        },
      };
      const venueModel = new VenueModel();
      (venueModel as any).prisma = mockPrisma;
      (venueModel as any).aiClient = mockAIClient;
      (venueModel as any).findVenuesByLocation = jest.fn().mockResolvedValue({ venues: mockVenues, total: 1 });
      (venueModel as any).calculateVenueSuitability = jest.fn().mockResolvedValue(mockSuitability);

      const recommendedVenues = await venueModel.recommendVenues(mockRecommendationParams);

      expect((venueModel as any).findVenuesByLocation).toHaveBeenCalled();
      expect((venueModel as any).calculateVenueSuitability).toHaveBeenCalled();
      expect(mockAIClient.enhanceVenueRecommendations).toHaveBeenCalled();
      expect(recommendedVenues).toEqual([mockSuitability]);
    });
  });

  describe('getVenueDetails', () => {
    it('should get detailed information about a venue', async () => {
      const mockVenueDetails = createTestVenueDetails();
      const mockPrisma = {
        venue: {
          findUnique: jest.fn().mockResolvedValue(mockVenueDetails),
        },
      };
      const venueModel = new VenueModel();
      (venueModel as any).prisma = mockPrisma;

      const venueDetails = await venueModel.getVenueDetails('venue-123');

      expect(mockPrisma.venue.findUnique).toHaveBeenCalledWith({ where: { id: 'venue-123' } });
      expect(venueDetails).toEqual(mockVenueDetails);
    });
  });

  describe('getTransportationOptions', () => {
    it('should get transportation options to a venue from a location', async () => {
      const mockCoordinates: ICoordinates = { latitude: 47.6062, longitude: -122.3321 };
      const mockVenue = createTestVenue();
      const mockTransportationOptions = [createTestTransportationOption()];
      const mockPrisma = {
        venue: {
          findUnique: jest.fn().mockResolvedValue(mockVenue),
        },
      };
      const venueModel = new VenueModel();
      (venueModel as any).prisma = mockPrisma;
      (venueModel as any).generateFallbackTransportationOptions = jest.fn().mockReturnValue(mockTransportationOptions);

      const transportationOptions = await venueModel.getTransportationOptions('venue-123', mockCoordinates);

      expect(mockPrisma.venue.findUnique).toHaveBeenCalledWith({ where: { id: 'venue-123' }, select: { coordinates: true, address: true } });
      expect((venueModel as any).generateFallbackTransportationOptions).toHaveBeenCalled();
      expect(transportationOptions).toEqual(mockTransportationOptions);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two geographic coordinates', () => {
      const mockCoordinates1: ICoordinates = { latitude: 47.6062, longitude: -122.3321 };
      const mockCoordinates2: ICoordinates = { latitude: 34.0522, longitude: -118.2437 };
      const venueModel = new VenueModel();

      const distance = venueModel.calculateDistance(mockCoordinates1, mockCoordinates2);

      expect(typeof distance).toBe('number');
    });
  });

  describe('calculateBoundingBox', () => {
    it('should calculate a bounding box around a point for geographic queries', () => {
      const mockCoordinates: ICoordinates = { latitude: 47.6062, longitude: -122.3321 };
      const mockRadius = 10;
      const venueModel = new VenueModel();

      const boundingBox = venueModel.calculateBoundingBox(mockCoordinates, mockRadius);

      expect(boundingBox).toHaveProperty('minLat');
      expect(boundingBox).toHaveProperty('maxLat');
      expect(boundingBox).toHaveProperty('minLng');
      expect(boundingBox).toHaveProperty('maxLng');
    });
  });
});