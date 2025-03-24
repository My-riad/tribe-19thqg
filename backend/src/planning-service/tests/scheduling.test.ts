import { SchedulingService } from '../src/services/scheduling.service';
import PlanningModel, { IOptimalTimeSlot, IPlanningSession } from '../src/models/planning.model';
import Availability, { IAvailability, ITimeSlot, AvailabilityStatus } from '../src/models/availability.model';
import { SchedulingAlgorithm } from '../src/utils/scheduling.util';
import { ApiError } from '../../../shared/src/errors/api.error';
import * as dayjs from 'dayjs'; // ^1.11.7
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import * as jest from 'jest'; // ^29.5.0

// Mock the AIOrchestrationClient
jest.mock('@tribe/ai-orchestration-client', () => {
  return {
    AIOrchestrationClient: jest.fn().mockImplementation(() => ({
      enhanceTimeSlotRecommendations: jest.fn().mockResolvedValue([]),
      analyzeAvailabilityPatterns: jest.fn().mockResolvedValue({}),
    })),
  };
});

// Mock the scheduling utility functions
jest.mock('../src/utils/scheduling.util', () => {
  const originalModule = jest.requireActual('../src/utils/scheduling.util');
  return {
    ...originalModule,
    findOptimalTimeSlots: jest.fn().mockReturnValue([]),
    analyzeUserAvailability: jest.fn().mockReturnValue({}),
    resolveSchedulingConflicts: jest.fn().mockReturnValue([]),
    optimizeForAttendance: jest.fn().mockReturnValue([]),
    optimizeForConvenience: jest.fn().mockReturnValue([]),
    findCommonAvailabilityWindows: jest.fn().mockReturnValue([]),
    applySchedulingConstraints: jest.fn(),
    calculateAttendanceScore: jest.fn(),
  };
});

// Mock the PlanningModel
jest.mock('../src/models/planning.model', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      updatePlanningSession: jest.fn().mockResolvedValue({}),
      getPlanningSessionById: jest.fn().mockResolvedValue({}),
      findOptimalTimeSlots: jest.fn().mockResolvedValue([]),
    })),
  };
});

// Mock the Availability model
jest.mock('../src/models/availability.model', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getEventAvailability: jest.fn().mockResolvedValue([]),
    })),
  };
});

// Helper function to create a mock PlanningModel
const createMockPlanningModel = (overrides: any = {}) => {
  const mock = {
    updatePlanningSession: jest.fn().mockResolvedValue({}),
    getPlanningSessionById: jest.fn().mockResolvedValue({}),
    findOptimalTimeSlots: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
  return mock as unknown as PlanningModel;
};

// Helper function to create a mock Availability model
const createMockAvailabilityModel = (overrides: any = {}) => {
  const mock = {
    getEventAvailability: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
  return mock as unknown as Availability;
};

// Helper function to create a mock SchedulingAlgorithm
const createMockSchedulingAlgorithm = (overrides: any = {}) => {
    const mock = {
        findOptimalTimeSlots: jest.fn().mockReturnValue([]),
        setOptions: jest.fn(),
        ...overrides,
    };
    return mock as unknown as SchedulingAlgorithm;
};

// Helper function to create a mock AI client
const createMockAIClient = (overrides: any = {}) => {
  const mock = {
    enhanceTimeSlotRecommendations: jest.fn().mockResolvedValue([]),
    analyzeAvailabilityPatterns: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
  return mock;
};

// Helper function to create test availability data
const createTestAvailabilityData = (userCount: number, timeSlotsPerUser: number, options: any = {}): IAvailability[] => {
  const availabilities: IAvailability[] = [];
  const baseDate = options.baseDate ? new Date(options.baseDate) : new Date();

  for (let i = 0; i < userCount; i++) {
    const userId = `user-${i + 1}`;
    const timeSlots: ITimeSlot[] = [];

    for (let j = 0; j < timeSlotsPerUser; j++) {
      const startTime = dayjs(baseDate).add(j * 60, 'minutes').toDate();
      const endTime = dayjs(startTime).add(60, 'minutes').toDate();

      timeSlots.push({
        startTime: startTime,
        endTime: endTime,
        status: AvailabilityStatus.AVAILABLE,
      });
    }

    availabilities.push({
      id: uuidv4(),
      userId: userId,
      timeSlots: timeSlots,
      recurrenceType: 'NONE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return availabilities;
};

// Helper function to create a test optimal time slot object
const createTestOptimalTimeSlot = (overrides: any = {}): IOptimalTimeSlot => {
  const defaultTimeSlot: IOptimalTimeSlot = {
    id: uuidv4(),
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000),
    attendanceScore: 90,
    attendeeCount: 5,
    totalAttendees: 10,
    attendancePercentage: 50,
    votes: [],
    aiRecommended: false,
    recommendationReason: 'High attendance score',
    ...overrides,
  };
  return defaultTimeSlot;
};

// Helper function to create a test planning session object
const createTestPlanningSession = (overrides: any = {}): IPlanningSession => {
  const defaultPlanningSession: IPlanningSession = {
    id: uuidv4(),
    eventId: uuidv4(),
    tribeId: uuidv4(),
    createdBy: uuidv4(),
    status: 'DRAFT',
    availabilityDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    votingDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    suggestedTimeSlots: [],
    suggestedVenues: [],
    eventPlan: null,
    preferences: {
      durationMinutes: 60,
      preferredDays: [1, 2, 3, 4, 5],
      preferredTimeRanges: [{ start: '09:00', end: '17:00' }],
      preferredLocation: { latitude: 47.6062, longitude: -122.3321 },
      maxDistance: 10,
      budgetRange: { min: 20, max: 50 },
      venueTypes: ['restaurant', 'cafe'],
      accessibilityRequirements: [],
      prioritizeAttendance: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return defaultPlanningSession;
};

// Helper function to create test existing events for conflict testing
const createTestExistingEvents = (eventCount: number, options: any = {}) => {
  const events = [];
  const baseDate = options.baseDate ? new Date(options.baseDate) : new Date();

  for (let i = 0; i < eventCount; i++) {
    const startTime = dayjs(baseDate).add(i * 120, 'minutes').toDate();
    const endTime = dayjs(startTime).add(60, 'minutes').toDate();

    events.push({
      startTime: startTime,
      endTime: endTime,
      eventId: uuidv4(),
    });
  }

  return events;
};

describe('SchedulingService', () => {
  let schedulingService: SchedulingService;
  let mockPlanningModel: any;
  let mockAvailabilityModel: any;
  let mockSchedulingAlgorithm: any;
  let mockAIClient: any;

  beforeEach(() => {
    mockPlanningModel = createMockPlanningModel();
    mockAvailabilityModel = createMockAvailabilityModel();
    mockSchedulingAlgorithm = createMockSchedulingAlgorithm();
    mockAIClient = createMockAIClient();

    schedulingService = new SchedulingService();
    (schedulingService as any).planningModel = mockPlanningModel;
    (schedulingService as any).availabilityModel = mockAvailabilityModel;
    (schedulingService as any).schedulingAlgorithm = mockSchedulingAlgorithm;
    (schedulingService as any).aiClient = mockAIClient;
  });

  describe('constructor', () => {
    it('should initialize with default dependencies', () => {
      const service = new SchedulingService();
      expect(service).toBeDefined();
      expect((service as any).planningModel).toBeDefined();
      expect((service as any).availabilityModel).toBeDefined();
    });
  });

  describe('findOptimalMeetingTimes', () => {
    it('should find optimal meeting times based on availability data', async () => {
      const eventId = uuidv4();
      const testAvailabilityData = createTestAvailabilityData(3, 2);
      const testOptimalTimeSlots = [createTestOptimalTimeSlot()];

      mockAvailabilityModel.getEventAvailability.mockResolvedValue(testAvailabilityData);
      (schedulingService as any).schedulingAlgorithm.findOptimalTimeSlots.mockReturnValue(testOptimalTimeSlots);

      const result = await schedulingService.findOptimalMeetingTimes(eventId);

      expect(mockAvailabilityModel.getEventAvailability).toHaveBeenCalledWith(eventId);
      expect((schedulingService as any).schedulingAlgorithm.findOptimalTimeSlots).toHaveBeenCalled();
      expect(result).toEqual(expect.arrayContaining(testOptimalTimeSlots));
    });

    it('should throw an error if no availability data is found', async () => {
      const eventId = uuidv4();
      mockAvailabilityModel.getEventAvailability.mockResolvedValue([]);

      await expect(schedulingService.findOptimalMeetingTimes(eventId))
        .rejects.toThrow(ApiError.notFound('No availability data found for the specified event or tribe'));
    });

    it('should throw an error if neither eventId nor tribeId is provided', async () => {
      await expect(schedulingService.findOptimalMeetingTimes())
        .rejects.toThrow(ApiError.badRequest('Either eventId or tribeId must be provided'));
    });

    it('should enhance time slots with AI recommendations when enabled', async () => {
      const eventId = uuidv4();
      const testAvailabilityData = createTestAvailabilityData(3, 2);
      const testOptimalTimeSlots = [createTestOptimalTimeSlot()];
      const aiEnhancedTimeSlots = [{ ...testOptimalTimeSlots[0], aiRecommended: true, recommendationReason: 'AI enhanced' }];

      mockAvailabilityModel.getEventAvailability.mockResolvedValue(testAvailabilityData);
      (schedulingService as any).schedulingAlgorithm.findOptimalTimeSlots.mockReturnValue(testOptimalTimeSlots);
      mockAIClient.enhanceTimeSlotRecommendations.mockResolvedValue(aiEnhancedTimeSlots);

      const result = await schedulingService.findOptimalMeetingTimes(eventId, undefined, { enhanceWithAI: true });

      expect(mockAIClient.enhanceTimeSlotRecommendations).toHaveBeenCalled();
      expect(result).toEqual(expect.arrayContaining(aiEnhancedTimeSlots));
    });
  });

  describe('resolveSchedulingConflicts', () => {
    it('should resolve scheduling conflicts by suggesting alternatives', async () => {
      const eventId = uuidv4();
      const testAvailabilityData = createTestAvailabilityData(3, 2);
      const testProposedTimeSlots = [createTestOptimalTimeSlot()];
      const testExistingEvents = createTestExistingEvents(1);
      const testConflictResolution = [{
        original: testProposedTimeSlots[0],
        conflicts: [testExistingEvents[0]],
        alternatives: [createTestOptimalTimeSlot({ startTime: new Date(Date.now() + 2 * 60 * 60 * 1000) })],
      }];

      mockAvailabilityModel.getEventAvailability.mockResolvedValue(testAvailabilityData);
      (schedulingService as any).schedulingAlgorithm.resolveSchedulingConflicts.mockReturnValue(testConflictResolution);

      const result = await schedulingService.resolveSchedulingConflicts(testProposedTimeSlots, testExistingEvents, eventId);

      expect(mockAvailabilityModel.getEventAvailability).toHaveBeenCalledWith(eventId);
      expect((schedulingService as any).schedulingAlgorithm.resolveSchedulingConflicts).toHaveBeenCalled();
      expect(result).toEqual(testConflictResolution);
    });
  });

  describe('analyzeAvailabilityPatterns', () => {
    it('should analyze availability patterns to identify trends', async () => {
      const eventId = uuidv4();
      const testAvailabilityData = createTestAvailabilityData(3, 2);
      const testAnalysisResults = { bestDays: [1, 3, 5], bestTimeOfDay: 'AFTERNOON' };

      mockAvailabilityModel.getEventAvailability.mockResolvedValue(testAvailabilityData);
      (schedulingService as any).schedulingAlgorithm.analyzeUserAvailability.mockReturnValue(testAnalysisResults);

      const result = await schedulingService.analyzeAvailabilityPatterns(eventId);

      expect(mockAvailabilityModel.getEventAvailability).toHaveBeenCalledWith(eventId);
      expect((schedulingService as any).schedulingAlgorithm.analyzeUserAvailability).toHaveBeenCalled();
      expect(result).toEqual(testAnalysisResults);
    });
  });

  describe('findCommonAvailabilityWindows', () => {
    it('should find common availability windows across multiple users', async () => {
      const eventId = uuidv4();
      const testAvailabilityData = createTestAvailabilityData(3, 2);
      const testCommonWindows = [{ startTime: new Date(), endTime: new Date(), availableUserIds: ['user-1', 'user-2'], duration: 60 }];

      mockAvailabilityModel.getEventAvailability.mockResolvedValue(testAvailabilityData);
      (schedulingService as any).schedulingAlgorithm.findCommonAvailabilityWindows.mockReturnValue(testCommonWindows);

      const result = await schedulingService.findCommonAvailabilityWindows(eventId);

      expect(mockAvailabilityModel.getEventAvailability).toHaveBeenCalledWith(eventId);
      expect((schedulingService as any).schedulingAlgorithm.findCommonAvailabilityWindows).toHaveBeenCalled();
      expect(result).toEqual(testCommonWindows);
    });
  });

  describe('optimizeForAttendance', () => {
    it('should optimize time slots for maximum attendance', async () => {
      const eventId = uuidv4();
      const testAvailabilityData = createTestAvailabilityData(3, 2);
      const testOptimizedSlots = [{ startTime: new Date(), endTime: new Date(), attendeeIds: ['user-1', 'user-2'], attendancePercentage: 66, score: 80 }];

      mockAvailabilityModel.getEventAvailability.mockResolvedValue(testAvailabilityData);
      (schedulingService as any).schedulingAlgorithm.optimizeForAttendance.mockReturnValue(testOptimizedSlots);

      const result = await schedulingService.optimizeForAttendance(eventId);

      expect(mockAvailabilityModel.getEventAvailability).toHaveBeenCalledWith(eventId);
      expect((schedulingService as any).schedulingAlgorithm.optimizeForAttendance).toHaveBeenCalled();
      expect(result).toEqual(testOptimizedSlots);
    });
  });

  describe('optimizeForConvenience', () => {
    it('should optimize time slots for user convenience based on preferences', async () => {
      const eventId = uuidv4();
      const testAvailabilityData = createTestAvailabilityData(3, 2);
      const testUserPreferences = { preferredTimeOfDay: ['AFTERNOON'] };
      const testOptimizedSlots = [{ startTime: new Date(), endTime: new Date(), attendeeIds: ['user-1', 'user-2'], convenienceScore: 90, factors: {} }];

      mockAvailabilityModel.getEventAvailability.mockResolvedValue(testAvailabilityData);
      (schedulingService as any).schedulingAlgorithm.optimizeForConvenience.mockReturnValue(testOptimizedSlots);

      const result = await schedulingService.optimizeForConvenience(eventId, undefined, testUserPreferences);

      expect(mockAvailabilityModel.getEventAvailability).toHaveBeenCalledWith(eventId);
      expect((schedulingService as any).schedulingAlgorithm.optimizeForConvenience).toHaveBeenCalled();
      expect(result).toEqual(testOptimizedSlots);
    });
  });

  describe('updatePlanningSessionWithTimeSlots', () => {
    it('should update a planning session with optimal time slot suggestions', async () => {
      const planningSessionId = uuidv4();
      const testOptimalTimeSlots = [createTestOptimalTimeSlot()];
      const testUpdatedPlanningSession = createTestPlanningSession({ id: planningSessionId, suggestedTimeSlots: testOptimalTimeSlots });

      mockPlanningModel.updatePlanningSession.mockResolvedValue(testUpdatedPlanningSession);

      const result = await schedulingService.updatePlanningSessionWithTimeSlots(planningSessionId, testOptimalTimeSlots);

      expect(mockPlanningModel.updatePlanningSession).toHaveBeenCalledWith(planningSessionId, {
        suggestedTimeSlots: testOptimalTimeSlots,
        status: 'SUGGESTING_TIMES'
      });
      expect(result).toEqual(testUpdatedPlanningSession);
    });
  });

  describe('generateSchedulingOptions', () => {
    it('should generate scheduling options based on event context', async () => {
      const eventId = uuidv4();
      const tribeId = uuidv4();
      const testBaseOptions = { minAttendees: 3 };
      const testGeneratedOptions = { ...testBaseOptions, eventType: 'in_person', minDurationMinutes: 60 };

      (schedulingService as any).getAvailabilityByTribeId = jest.fn().mockResolvedValue([]);
      const result = await schedulingService.generateSchedulingOptions(eventId, tribeId, testBaseOptions);

      expect(result).toEqual(expect.objectContaining(testGeneratedOptions));
    });
  });

  describe('calculateAttendanceMetrics', () => {
    it('should calculate attendance metrics for time slots', () => {
      const testTimeSlots = [
        createTestOptimalTimeSlot({ attendeeCount: 5 }),
        createTestOptimalTimeSlot({ attendeeCount: 8 }),
      ];
      const totalMembers = 10;

      const result = schedulingService.calculateAttendanceMetrics(testTimeSlots, totalMembers);

      expect(result[0].attendancePercentage).toBe(50);
      expect(result[1].attendancePercentage).toBe(80);
    });
  });

  describe('getSchedulingAlgorithmOptions', () => {
    it('should return the current scheduling algorithm options', () => {
      const testOptions = { minAttendees: 3, minDurationMinutes: 45 };
      (schedulingService as any).schedulingAlgorithm.options = testOptions;

      const result = schedulingService.getSchedulingAlgorithmOptions();

      expect(result).toEqual(testOptions);
    });
  });

  describe('setSchedulingAlgorithmOptions', () => {
    it('should update the scheduling algorithm options', () => {
      const testOptions = { minAttendees: 4, minDurationMinutes: 60 };

      schedulingService.setSchedulingAlgorithmOptions(testOptions);

      expect((schedulingService as any).schedulingAlgorithm.setOptions).toHaveBeenCalledWith(testOptions);
    });
  });

  describe('enhanceWithAI', () => {
    it('should enhance time slots with AI capabilities', async () => {
      const testTimeSlots = [createTestOptimalTimeSlot()];
      const testAvailabilityData = createTestAvailabilityData(3, 2);
      const testContextData = { eventId: uuidv4() };
      const aiEnhancedTimeSlots = [{ ...testTimeSlots[0], aiRecommended: true, recommendationReason: 'AI enhanced' }];

      mockAIClient.enhanceTimeSlotRecommendations.mockResolvedValue(aiEnhancedTimeSlots);

      const result = await (schedulingService as any).enhanceWithAI(testTimeSlots, testAvailabilityData, testContextData);

      expect(mockAIClient.enhanceTimeSlotRecommendations).toHaveBeenCalled();
      expect(result).toEqual(expect.arrayContaining(aiEnhancedTimeSlots));
    });
  });
});

describe('Integration Tests', () => {
  let schedulingService: SchedulingService;
  let mockAvailabilityModel: any;

  beforeEach(() => {
    mockAvailabilityModel = createMockAvailabilityModel();
    schedulingService = new SchedulingService();
    (schedulingService as any).availabilityModel = mockAvailabilityModel;
  });

  it('findOptimalMeetingTimes integration', async () => {
    const eventId = uuidv4();
    const testAvailabilityData = createTestAvailabilityData(5, 3);
    mockAvailabilityModel.getEventAvailability.mockResolvedValue(testAvailabilityData);

    const result = await schedulingService.findOptimalMeetingTimes(eventId);

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    result.forEach(slot => {
      expect(slot.attendanceScore).toBeGreaterThanOrEqual(0);
      expect(slot.attendancePercentage).toBeGreaterThanOrEqual(0);
      expect(slot.attendeeCount).toBeGreaterThanOrEqual(0);
    });
  });

  it('optimizeForAttendance integration', async () => {
    const eventId = uuidv4();
    const testAvailabilityData = createTestAvailabilityData(5, 3);
    mockAvailabilityModel.getEventAvailability.mockResolvedValue(testAvailabilityData);

    const result = await schedulingService.optimizeForAttendance(eventId);

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    result.forEach(slot => {
      expect(slot.attendancePercentage).toBeGreaterThanOrEqual(0);
      expect(slot.score).toBeGreaterThanOrEqual(0);
    });
  });
});