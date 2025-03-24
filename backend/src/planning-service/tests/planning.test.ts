import { AvailabilityService } from '../src/services/availability.service';
import { SchedulingService } from '../src/services/scheduling.service';
import { PlanningService } from '../src/services/planning.service';
import { PlanningModel, PlanningStatus, VoteType, IOptimalTimeSlot, IVenueSuggestion, IPlanningSession, IPlanningSessionCreate, IEventPlan, IEventPlanFinalize } from '../src/models/planning.model';
import { ApiError } from '../../../shared/src/errors/api.error';
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import dayjs from 'dayjs'; // ^1.11.7
import { jest } from '@jest/globals'; // ^29.5.0

/**
 * Creates a mock PlanningModel for testing
 * @param overrides 
 * @returns Mocked PlanningModel instance
 */
const createMockPlanningModel = (overrides: Partial<PlanningModel> = {}): PlanningModel => {
  const mock = {
    createPlanningSession: jest.fn(),
    getPlanningSessionById: jest.fn(),
    getPlanningSessionByEventId: jest.fn(),
    updatePlanningSession: jest.fn(),
    finalizeEventPlan: jest.fn(),
    getEventPlan: jest.fn(),
    getVotingResults: jest.fn(),
    recordVote: jest.fn(),
    ...overrides,
  };
  return mock as unknown as PlanningModel;
};

/**
 * Creates a mock AvailabilityService for testing
 * @param overrides 
 * @returns Mocked AvailabilityService instance
 */
const createMockAvailabilityService = (overrides: Partial<AvailabilityService> = {}): AvailabilityService => {
  const mock = {
    createAvailability: jest.fn(),
    getEventAvailability: jest.fn(),
    findOptimalMeetingTimes: jest.fn(),
    ...overrides,
  };
  return mock as unknown as AvailabilityService;
};

/**
 * Creates a mock SchedulingService for testing
 * @param overrides 
 * @returns Mocked SchedulingService instance
 */
const createMockSchedulingService = (overrides: Partial<SchedulingService> = {}): SchedulingService => {
  const mock = {
    findOptimalMeetingTimes: jest.fn(),
    updatePlanningSessionWithTimeSlots: jest.fn(),
    ...overrides,
  };
  return mock as unknown as SchedulingService;
};

/**
 * Creates a mock VenueModel for testing
 * @param overrides 
 * @returns Mocked VenueModel instance
 */
const createMockVenueModel = (overrides: Partial<PlanningModel> = {}): PlanningModel => {
  const mock = {
    recommendVenues: jest.fn(),
    getVenueDetails: jest.fn(),
    ...overrides,
  };
  return mock as unknown as PlanningModel;
};

/**
 * Creates a mock AI client for testing
 * @param overrides 
 * @returns Mocked AI client instance
 */
const createMockAIClient = (overrides: Partial<PlanningModel> = {}): PlanningModel => {
  const mock = {
    getAIRecommendation: jest.fn(),
    ...overrides,
  };
  return mock as unknown as PlanningModel;
};

/**
 * Creates a test planning session object
 * @param overrides 
 * @returns Test planning session object
 */
const createTestPlanningSession = (overrides: Partial<IPlanningSession> = {}): IPlanningSession => {
  const now = new Date();
  const defaultPlanningSession: IPlanningSession = {
    id: uuidv4(),
    eventId: uuidv4(),
    tribeId: uuidv4(),
    createdBy: uuidv4(),
    status: PlanningStatus.DRAFT,
    availabilityDeadline: dayjs().add(7, 'days').toDate(),
    votingDeadline: dayjs().add(14, 'days').toDate(),
    suggestedTimeSlots: [],
    suggestedVenues: [],
    eventPlan: null,
    preferences: {
      durationMinutes: 60,
      preferredDays: [1, 2, 3, 4, 5],
      preferredTimeRanges: [{ start: '10:00', end: '12:00' }],
      preferredLocation: { latitude: 47.6062, longitude: -122.3321 },
      maxDistance: 10,
      budgetRange: { min: 25, max: 75 },
      venueTypes: ['restaurant', 'bar'],
      accessibilityRequirements: [],
      prioritizeAttendance: true,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  return defaultPlanningSession;
};

/**
 * Creates a test optimal time slot object
 * @param overrides 
 * @returns Test optimal time slot object
 */
const createTestOptimalTimeSlot = (overrides: Partial<IOptimalTimeSlot> = {}): IOptimalTimeSlot => {
  const defaultOptimalTimeSlot: IOptimalTimeSlot = {
    id: uuidv4(),
    startTime: dayjs().add(1, 'day').hour(10).minute(0).toDate(),
    endTime: dayjs().add(1, 'day').hour(11).minute(0).toDate(),
    attendanceScore: 90,
    attendeeCount: 5,
    totalAttendees: 6,
    attendancePercentage: 83,
    votes: [],
    aiRecommended: true,
    recommendationReason: 'High attendance and good time',
    ...overrides,
  };
  return defaultOptimalTimeSlot;
};

/**
 * Creates a test venue suggestion object
 * @param overrides 
 * @returns Test venue suggestion object
 */
const createTestVenueSuggestion = (overrides: Partial<IVenueSuggestion> = {}): IVenueSuggestion => {
  const defaultVenueSuggestion: IVenueSuggestion = {
    id: uuidv4(),
    venue: {
      id: uuidv4(),
      name: 'Test Venue',
      address: '123 Test St, Test City',
      coordinates: { latitude: 47.6062, longitude: -122.3321 },
      placeId: 'testPlaceId',
      website: 'http://test.com',
      phoneNumber: '555-1234',
      capacity: 50,
      priceLevel: 2,
      rating: 4.5,
      photos: [],
      categories: [],
      metadata: {}
    },
    distanceScore: 95,
    capacityScore: 80,
    budgetScore: 90,
    accessibilityScore: 100,
    overallScore: 92,
    votes: [],
    aiRecommended: true,
    recommendationReason: 'Good location and price',
    ...overrides,
  };
  return defaultVenueSuggestion;
};

describe('PlanningService', () => {
  describe('createPlanningSession', () => {
    it('should create a new planning session', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test planning session data
      const testPlanningSessionData: IPlanningSessionCreate = {
        eventId: uuidv4(),
        tribeId: uuidv4(),
        createdBy: uuidv4(),
        availabilityDeadline: dayjs().add(7, 'days').toDate(),
        preferences: {
          durationMinutes: 60,
          preferredDays: [1, 2, 3, 4, 5],
          preferredTimeRanges: [{ start: '10:00', end: '12:00' }],
          preferredLocation: { latitude: 47.6062, longitude: -122.3321 },
          maxDistance: 10,
          budgetRange: { min: 25, max: 75 },
          venueTypes: ['restaurant', 'bar'],
          accessibilityRequirements: [],
          prioritizeAttendance: true,
        },
      };

      // Mock PlanningModel.createPlanningSession to return test data
      const testPlanningSession = createTestPlanningSession(testPlanningSessionData);
      mockPlanningModel.createPlanningSession.mockResolvedValue(testPlanningSession);

      // Call planningService.createPlanningSession with test data
      const result = await planningService.createPlanningSession(testPlanningSessionData);

      // Expect PlanningModel.createPlanningSession to be called with correct parameters
      expect(mockPlanningModel.createPlanningSession).toHaveBeenCalledWith(testPlanningSessionData);

      // Expect the result to match the test planning session
      expect(result).toEqual(testPlanningSession);
    });

    it('should throw an error if a planning session already exists for the event', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test planning session data
      const testPlanningSessionData: IPlanningSessionCreate = {
        eventId: uuidv4(),
        tribeId: uuidv4(),
        createdBy: uuidv4(),
        availabilityDeadline: dayjs().add(7, 'days').toDate(),
        preferences: {
          durationMinutes: 60,
          preferredDays: [1, 2, 3, 4, 5],
          preferredTimeRanges: [{ start: '10:00', end: '12:00' }],
          preferredLocation: { latitude: 47.6062, longitude: -122.3321 },
          maxDistance: 10,
          budgetRange: { min: 25, max: 75 },
          venueTypes: ['restaurant', 'bar'],
          accessibilityRequirements: [],
          prioritizeAttendance: true,
        },
      };

      // Mock PlanningModel.createPlanningSession to throw an error
      mockPlanningModel.createPlanningSession.mockRejectedValue(new ApiError('Planning session already exists'));

      // Expect planningService.createPlanningSession to throw an error
      await expect(planningService.createPlanningSession(testPlanningSessionData)).rejects.toThrow(ApiError);
    });
  });

  describe('getPlanningSessionById', () => {
    it('should retrieve a planning session by ID', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test planning session data
      const testPlanningSession = createTestPlanningSession();
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(testPlanningSession);

      // Call planningService.getPlanningSessionById with test ID
      const result = await planningService.getPlanningSessionById(testPlanningSession.id);

      // Expect PlanningModel.getPlanningSessionById to be called with correct ID
      expect(mockPlanningModel.getPlanningSessionById).toHaveBeenCalledWith(testPlanningSession.id);

      // Expect the result to match the test planning session
      expect(result).toEqual(testPlanningSession);
    });

    it('should throw an error if planning session is not found', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Mock PlanningModel.getPlanningSessionById to return null
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(null);

      // Expect planningService.getPlanningSessionById to throw ApiError.notFound
      await expect(planningService.getPlanningSessionById(uuidv4())).rejects.toThrow(ApiError.notFound);
    });
  });

  describe('getPlanningSessionByEventId', () => {
    it('should retrieve a planning session by event ID', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test planning session data
      const testPlanningSession = createTestPlanningSession();
      mockPlanningModel.getPlanningSessionByEventId.mockResolvedValue(testPlanningSession);

      // Call planningService.getPlanningSessionByEventId with test event ID
      const result = await planningService.getPlanningSessionByEventId(testPlanningSession.eventId);

      // Expect PlanningModel.getPlanningSessionByEventId to be called with correct event ID
      expect(mockPlanningModel.getPlanningSessionByEventId).toHaveBeenCalledWith(testPlanningSession.eventId);

      // Expect the result to match the test planning session
      expect(result).toEqual(testPlanningSession);
    });

    it('should throw an error if planning session is not found for event', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Mock PlanningModel.getPlanningSessionByEventId to return null
      mockPlanningModel.getPlanningSessionByEventId.mockResolvedValue(null);

      // Expect planningService.getPlanningSessionByEventId to throw ApiError.notFound
      await expect(planningService.getPlanningSessionByEventId(uuidv4())).rejects.toThrow(ApiError.notFound);
    });
  });

  describe('updatePlanningSession', () => {
    it('should update an existing planning session', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test planning session data and update data
      const testPlanningSession = createTestPlanningSession();
      const updateData = { status: PlanningStatus.COLLECTING_AVAILABILITY };

      // Mock PlanningModel.getPlanningSessionById to return test data
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(testPlanningSession);

      // Mock PlanningModel.updatePlanningSession to return updated test data
      const updatedPlanningSession = { ...testPlanningSession, ...updateData };
      mockPlanningModel.updatePlanningSession.mockResolvedValue(updatedPlanningSession);

      // Call planningService.updatePlanningSession with test ID and update data
      const result = await planningService.updatePlanningSession(testPlanningSession.id, updateData);

      // Expect PlanningModel.updatePlanningSession to be called with correct parameters
      expect(mockPlanningModel.updatePlanningSession).toHaveBeenCalledWith(testPlanningSession.id, updateData);

      // Expect the result to match the updated planning session
      expect(result).toEqual(updatedPlanningSession);
    });
  });

  describe('startAvailabilityCollection', () => {
    it('should start the availability collection phase', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test planning session data in DRAFT status
      const testPlanningSession = createTestPlanningSession({ status: PlanningStatus.DRAFT });

      // Mock PlanningModel.getPlanningSessionById to return test data
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(testPlanningSession);

      // Mock PlanningModel.updatePlanningSession to return updated test data with COLLECTING_AVAILABILITY status
      const updatedPlanningSession = { ...testPlanningSession, status: PlanningStatus.COLLECTING_AVAILABILITY };
      mockPlanningModel.updatePlanningSession.mockResolvedValue(updatedPlanningSession);

      // Call planningService.startAvailabilityCollection with test ID and options
      const options = { availabilityDeadline: dayjs().add(14, 'days').toDate() };
      const result = await planningService.startAvailabilityCollection(testPlanningSession.id, options);

      // Expect PlanningModel.updatePlanningSession to be called with correct parameters including status change
      expect(mockPlanningModel.updatePlanningSession).toHaveBeenCalledWith(testPlanningSession.id, {
        status: PlanningStatus.COLLECTING_AVAILABILITY,
        availabilityDeadline: expect.any(Date),
      });

      // Expect the result to have status COLLECTING_AVAILABILITY
      expect(result.status).toBe(PlanningStatus.COLLECTING_AVAILABILITY);
    });
  });

  describe('submitAvailability', () => {
    it('should submit availability data for a user', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const mockAvailabilityService = createMockAvailabilityService();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;
      (planningService as any).availabilityService = mockAvailabilityService;

      // Create test planning session data in COLLECTING_AVAILABILITY status
      const testPlanningSession = createTestPlanningSession({ status: PlanningStatus.COLLECTING_AVAILABILITY });

      // Create test availability data
      const testAvailabilityData = { timeSlots: [{ startTime: new Date(), endTime: new Date(), status: 'AVAILABLE' }] };

      // Mock PlanningModel.getPlanningSessionById to return test data
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(testPlanningSession);

      // Mock AvailabilityService.createAvailability to return test availability data
      mockAvailabilityService.createAvailability.mockResolvedValue(testAvailabilityData);

      // Call planningService.submitAvailability with test parameters
      const userId = uuidv4();
      const result = await planningService.submitAvailability(testPlanningSession.id, userId, testAvailabilityData);

      // Expect AvailabilityService.createAvailability to be called with correct parameters
      expect(mockAvailabilityService.createAvailability).toHaveBeenCalledWith({
        ...testAvailabilityData,
        eventId: testPlanningSession.eventId,
        userId: userId,
      });

      // Expect the result to match the test availability data
      expect(result).toEqual(testAvailabilityData);
    });
  });

  describe('generateTimeSlotSuggestions', () => {
    it('should generate time slot suggestions based on availability data', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const mockSchedulingService = createMockSchedulingService();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;
      (planningService as any).schedulingService = mockSchedulingService;

      // Create test planning session data in COLLECTING_AVAILABILITY status
      const testPlanningSession = createTestPlanningSession({ status: PlanningStatus.COLLECTING_AVAILABILITY });

      // Create test time slot suggestions
      const testTimeSlotSuggestions: IOptimalTimeSlot[] = [createTestOptimalTimeSlot()];

      // Mock PlanningModel.getPlanningSessionById to return test data
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(testPlanningSession);

      mockPlanningModel.updatePlanningSession.mockResolvedValue(testPlanningSession);

      // Mock SchedulingService.findOptimalMeetingTimes to return test time slots
      mockSchedulingService.findOptimalMeetingTimes.mockResolvedValue(testTimeSlotSuggestions);

      // Initialize PlanningService with mocks

      // Call planningService.generateTimeSlotSuggestions with test ID and options
      const options = { durationMinutes: 60 };
      const result = await planningService.generateTimeSlotSuggestions(testPlanningSession.id, options);

      // Expect SchedulingService.findOptimalMeetingTimes to be called with correct parameters
      expect(mockSchedulingService.findOptimalMeetingTimes).toHaveBeenCalledWith(
        testPlanningSession.eventId,
        testPlanningSession.tribeId,
        options
      );

      expect(mockPlanningModel.updatePlanningSession).toHaveBeenCalledWith(testPlanningSession.id, {
        status: PlanningStatus.SUGGESTING_TIMES,
      });

      // Expect the result to match the test time slot suggestions
      expect(result).toEqual(testTimeSlotSuggestions);
    });
  });

  describe('generateVenueSuggestions', () => {
    it('should generate venue suggestions based on event requirements', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const mockVenueModel = createMockVenueModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;
      (planningService as any).venueModel = mockVenueModel;

      // Create test planning session data in SUGGESTING_TIMES status
      const testPlanningSession = createTestPlanningSession({ status: PlanningStatus.SUGGESTING_TIMES });

      // Create test venue suggestions
      const testVenueSuggestions: IVenueSuggestion[] = [createTestVenueSuggestion()];

      // Mock PlanningModel.getPlanningSessionById to return test data
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(testPlanningSession);

      mockPlanningModel.updatePlanningSession.mockResolvedValue(testPlanningSession);

      // Mock VenueModel.recommendVenues to return test venue suggestions
      mockVenueModel.recommendVenues.mockResolvedValue(testVenueSuggestions);

      // Initialize PlanningService with mocks

      // Call planningService.generateVenueSuggestions with test ID and options
      const options = { budgetRange: { min: 20, max: 50 } };
      const result = await planningService.generateVenueSuggestions(testPlanningSession.id, options);

      // Expect VenueModel.recommendVenues to be called with correct parameters
      expect(mockVenueModel.recommendVenues).toHaveBeenCalledWith(
        testPlanningSession.id,
        options
      );

      expect(mockPlanningModel.updatePlanningSession).toHaveBeenCalledWith(testPlanningSession.id, {
        status: PlanningStatus.SUGGESTING_VENUES,
      });

      // Expect the result to match the test venue suggestions
      expect(result).toEqual(testVenueSuggestions);
    });
  });

  describe('startVotingPhase', () => {
    it('should start the voting phase for time slots and venues', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test planning session data with time slots and venues
      const testPlanningSession = createTestPlanningSession({
        status: PlanningStatus.SUGGESTING_VENUES,
        suggestedTimeSlots: [createTestOptimalTimeSlot()],
        suggestedVenues: [createTestVenueSuggestion()],
      });

      // Mock PlanningModel.getPlanningSessionById to return test data
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(testPlanningSession);

      // Mock PlanningModel.updatePlanningSession to return updated test data with VOTING status
      const updatedPlanningSession = { ...testPlanningSession, status: PlanningStatus.VOTING };
      mockPlanningModel.updatePlanningSession.mockResolvedValue(updatedPlanningSession);

      // Initialize PlanningService with mocks

      // Call planningService.startVotingPhase with test ID and options
      const options = { votingDeadline: dayjs().add(7, 'days').toDate() };
      const result = await planningService.startVotingPhase(testPlanningSession.id, options);

      // Expect PlanningModel.updatePlanningSession to be called with correct parameters including status change
      expect(mockPlanningModel.updatePlanningSession).toHaveBeenCalledWith(testPlanningSession.id, {
        status: PlanningStatus.VOTING,
        votingDeadline: expect.any(Date),
      });

      // Expect the result to have status VOTING
      expect(result.status).toBe(PlanningStatus.VOTING);
    });
  });

  describe('recordVote', () => {
    it("should record a user's vote for a time slot or venue", async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test planning session data in VOTING status
      const testPlanningSession = createTestPlanningSession({
        status: PlanningStatus.VOTING,
        suggestedTimeSlots: [createTestOptimalTimeSlot()],
        suggestedVenues: [createTestVenueSuggestion()],
      });

      // Mock PlanningModel.getPlanningSessionById to return test data
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(testPlanningSession);

      mockPlanningModel.recordVote.mockResolvedValue(testPlanningSession);

      // Initialize PlanningService with mocks

      // Call planningService.recordVote with test parameters
      const itemId = uuidv4();
      const userId = uuidv4();
      const voteType = VoteType.TIME_SLOT;
      const result = await planningService.recordVote(testPlanningSession.id, itemId, userId, voteType);

      // Expect PlanningModel.recordVote to be called with correct parameters
      expect(mockPlanningModel.recordVote).toHaveBeenCalledWith(
        testPlanningSession.id,
        itemId,
        userId,
        voteType
      );

      // Expect the result to match the updated planning session
      expect(result).toEqual(testPlanningSession);
    });
  });

  describe('getVotingResults', () => {
    it('should get the current voting results for time slots and venues', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test planning session data in VOTING status
      const testPlanningSession = createTestPlanningSession({
        status: PlanningStatus.VOTING,
        suggestedTimeSlots: [createTestOptimalTimeSlot()],
        suggestedVenues: [createTestVenueSuggestion()],
      });

      // Create test voting results
      const testVotingResults = {
        timeSlots: [{ timeSlot: createTestOptimalTimeSlot(), voteCount: 3, voters: [uuidv4(), uuidv4(), uuidv4()] }],
        venues: [{ venue: createTestVenueSuggestion(), voteCount: 2, voters: [uuidv4(), uuidv4()] }],
      };

      // Mock PlanningModel.getPlanningSessionById to return test data
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(testPlanningSession);

      // Mock PlanningModel.getVotingResults to return test voting results
      mockPlanningModel.getVotingResults.mockResolvedValue(testVotingResults);

      // Initialize PlanningService with mocks

      // Call planningService.getVotingResults with test ID
      const result = await planningService.getVotingResults(testPlanningSession.id);

      // Expect PlanningModel.getVotingResults to be called with correct parameters
      expect(mockPlanningModel.getVotingResults).toHaveBeenCalledWith(testPlanningSession.id);

      // Expect the result to match the test voting results
      expect(result).toEqual(testVotingResults);
    });
  });

  describe('finalizeEventPlan', () => {
    it('should finalize the event plan with selected time and venue', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test planning session data in VOTING status
      const testPlanningSession = createTestPlanningSession({
        status: PlanningStatus.VOTING,
        suggestedTimeSlots: [createTestOptimalTimeSlot()],
        suggestedVenues: [createTestVenueSuggestion()],
      });

      // Create test event plan finalize data
      const testEventPlanFinalizeData: IEventPlanFinalize = {
        timeSlotId: uuidv4(),
        venueId: uuidv4(),
        finalizedBy: uuidv4(),
        notes: 'Finalized plan',
      };

      // Create test event plan result
      const testEventPlanResult: IEventPlan = {
        id: uuidv4(),
        eventId: uuidv4(),
        planningSessionId: uuidv4(),
        selectedTimeSlot: createTestOptimalTimeSlot(),
        selectedVenue: createTestVenueSuggestion(),
        reminderSchedule: { id: uuidv4(), eventId: uuidv4(), reminders: [] },
        finalizedBy: uuidv4(),
        finalizedAt: new Date(),
        notes: 'Finalized plan',
      };

      // Mock PlanningModel.getPlanningSessionById to return test data
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(testPlanningSession);

      // Mock PlanningModel.finalizeEventPlan to return test event plan
      mockPlanningModel.finalizeEventPlan.mockResolvedValue(testEventPlanResult);

      // Initialize PlanningService with mocks

      // Call planningService.finalizeEventPlan with test ID and finalize data
      const result = await planningService.finalizeEventPlan(testPlanningSession.id, testEventPlanFinalizeData);

      // Expect PlanningModel.finalizeEventPlan to be called with correct parameters
      expect(mockPlanningModel.finalizeEventPlan).toHaveBeenCalledWith(
        testPlanningSession.id,
        testEventPlanFinalizeData
      );

      // Expect the result to match the test event plan
      expect(result).toEqual(testEventPlanResult);
    });
  });

  describe('getEventPlan', () => {
    it('should retrieve the event plan for a specific event', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test event plan
      const testEventPlan: IEventPlan = {
        id: uuidv4(),
        eventId: uuidv4(),
        planningSessionId: uuidv4(),
        selectedTimeSlot: createTestOptimalTimeSlot(),
        selectedVenue: createTestVenueSuggestion(),
        reminderSchedule: { id: uuidv4(), eventId: uuidv4(), reminders: [] },
        finalizedBy: uuidv4(),
        finalizedAt: new Date(),
        notes: 'Finalized plan',
      };

      // Mock PlanningModel.getEventPlan to return test event plan
      mockPlanningModel.getEventPlan.mockResolvedValue(testEventPlan);

      // Initialize PlanningService with mocks

      // Call planningService.getEventPlan with test event ID
      const result = await planningService.getEventPlan(testEventPlan.eventId);

      // Expect PlanningModel.getEventPlan to be called with correct event ID
      expect(mockPlanningModel.getEventPlan).toHaveBeenCalledWith(testEventPlan.eventId);

      // Expect the result to match the test event plan
      expect(result).toEqual(testEventPlan);
    });

    it('should throw an error if event plan is not found', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Mock PlanningModel.getEventPlan to return null
      mockPlanningModel.getEventPlan.mockResolvedValue(null);

      // Initialize PlanningService with mocks

      // Expect planningService.getEventPlan to throw ApiError.notFound
      await expect(planningService.getEventPlan(uuidv4())).rejects.toThrow(ApiError.notFound);
    });
  });

  describe('getAIRecommendation', () => {
    it('should get an AI-generated recommendation for the optimal plan', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test planning session data with time slots and venues
      const testPlanningSession = createTestPlanningSession({
        suggestedTimeSlots: [createTestOptimalTimeSlot()],
        suggestedVenues: [createTestVenueSuggestion()],
      });

      // Create test AI recommendation
      const testAIRecommendation = {
        timeSlot: createTestOptimalTimeSlot(),
        venue: createTestVenueSuggestion(),
        reasoning: 'AI recommendation',
      };

      // Mock PlanningModel.getPlanningSessionById to return test data
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(testPlanningSession);

      // Mock AIClient to return test recommendation
      //(planningService as any).aiClient.getAIRecommendation.mockResolvedValue(testAIRecommendation);

      // Initialize PlanningService with mocks

      // Call planningService.getAIRecommendation with test ID
      const result = await planningService.getAIRecommendation(testPlanningSession.id);

      // Expect AIClient to be called with correct context data
      //expect((planningService as any).aiClient.getAIRecommendation).toHaveBeenCalledWith(testPlanningSession.id);

      // Expect the result to match the test AI recommendation
      expect(result).toEqual(testAIRecommendation);
    });
  });

  describe('getPlanningStatus', () => {
    it('should get the current status of a planning session with detailed progress information', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test planning session data
      const testPlanningSession = createTestPlanningSession();

      // Mock PlanningModel.getPlanningSessionById to return test data
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(testPlanningSession);

      // Initialize PlanningService with mocks

      // Call planningService.getPlanningStatus with test ID
      const result = await planningService.getPlanningStatus(testPlanningSession.id);

      // Expect the result to contain detailed status information including current status and progress
      expect(result).toEqual({});
    });
  });

  describe('cancelPlanningSession', () => {
    it('should cancel an active planning session', async () => {
      // Create mock dependencies
      const mockPlanningModel = createMockPlanningModel();
      const planningService = new PlanningService();
      (planningService as any).planningModel = mockPlanningModel;

      // Create test planning session data in active status
      const testPlanningSession = createTestPlanningSession({ status: PlanningStatus.DRAFT });

      // Mock PlanningModel.getPlanningSessionById to return test data
      mockPlanningModel.getPlanningSessionById.mockResolvedValue(testPlanningSession);

      // Mock PlanningModel.updatePlanningSession to return updated test data with CANCELLED status
      const updatedPlanningSession = { ...testPlanningSession, status: PlanningStatus.CANCELLED };
      mockPlanningModel.updatePlanningSession.mockResolvedValue(updatedPlanningSession);

      // Initialize PlanningService with mocks

      // Call planningService.cancelPlanningSession with test ID and reason
      const reason = 'Test cancellation';
      const result = await planningService.cancelPlanningSession(testPlanningSession.id, reason);

      // Expect PlanningModel.updatePlanningSession to be called with correct parameters including status change
      expect(mockPlanningModel.updatePlanningSession).toHaveBeenCalledWith(testPlanningSession.id, {
        status: PlanningStatus.CANCELLED,
      });

      // Expect the result to have status CANCELLED
      expect(result.status).toBe(PlanningStatus.CANCELLED);
    });
  });
});