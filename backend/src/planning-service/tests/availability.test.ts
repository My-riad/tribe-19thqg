import { AvailabilityService } from '../src/services/availability.service';
import {
  Availability,
  IAvailability,
  IAvailabilityCreate,
  IAvailabilityUpdate,
  ITimeSlot,
  AvailabilityStatus,
  RecurrenceType,
} from '../src/models/availability.model';
import { SchedulingAlgorithm } from '../src/utils/scheduling.util';
import { IOptimalTimeSlot } from '../src/models/planning.model';
import {
  validateAvailabilityCreate,
  validateAvailabilityUpdate,
  validateAvailabilityQuery,
  validateBulkAvailability,
  validateOptimalTimeQuery,
} from '../src/validations/availability.validation';
import {
  findOptimalTimeSlots,
  findCommonAvailabilityWindows,
  analyzeUserAvailability,
} from '../src/utils/scheduling.util';
import { ApiError } from '../../../shared/src/errors/api.error';
import { ValidationError } from '../../../shared/src/errors/validation.error';
import { mockPrismaClient } from 'jest-mock-extended'; // version: ^3.0.0
import dayjs from 'dayjs'; // version: ^1.11.7

// Mock the Availability class and its methods
jest.mock('../src/models/availability.model', () => {
  const originalModule = jest.requireActual('../src/models/availability.model');
  return {
    ...originalModule,
    Availability: jest.fn().mockImplementation(() => ({
      createAvailability: jest.fn(),
      getAvailabilityById: jest.fn(),
      getUserAvailability: jest.fn(),
      getEventAvailability: jest.fn(),
      updateAvailability: jest.fn(),
      deleteAvailability: jest.fn(),
      bulkCreateAvailability: jest.fn(),
    })),
  };
});

// Mock the validation functions
jest.mock('../src/validations/availability.validation', () => ({
  validateAvailabilityCreate: jest.fn(),
  validateAvailabilityUpdate: jest.fn(),
  validateAvailabilityQuery: jest.fn(),
  validateBulkAvailability: jest.fn(),
  validateOptimalTimeQuery: jest.fn(),
}));

// Mock the scheduling utility functions
jest.mock('../src/utils/scheduling.util', () => ({
  findOptimalTimeSlots: jest.fn(),
  findCommonAvailabilityWindows: jest.fn(),
  analyzeUserAvailability: jest.fn(),
}));

// Define test data
const mockAvailability: IAvailability = {
  id: 'test-availability-id',
  userId: 'test-user-id',
  eventId: 'test-event-id',
  tribeId: null,
  timeSlots: [
    { startTime: '2023-07-15T18:00:00Z', endTime: '2023-07-15T20:00:00Z', status: AvailabilityStatus.AVAILABLE },
    { startTime: '2023-07-16T19:00:00Z', endTime: '2023-07-16T21:00:00Z', status: AvailabilityStatus.AVAILABLE },
    { startTime: '2023-07-17T18:00:00Z', endTime: '2023-07-17T20:00:00Z', status: AvailabilityStatus.UNAVAILABLE },
  ],
  recurrenceType: RecurrenceType.NONE,
  recurrenceEndDate: null,
  preferredDuration: 120,
  notes: 'Prefer evenings',
  createdAt: '2023-07-10T10:00:00Z',
  updatedAt: '2023-07-10T10:00:00Z',
};

const mockAvailabilityCreate: IAvailabilityCreate = {
  userId: 'test-user-id',
  eventId: 'test-event-id',
  tribeId: null,
  timeSlots: [
    { startTime: '2023-07-15T18:00:00Z', endTime: '2023-07-15T20:00:00Z', status: AvailabilityStatus.AVAILABLE },
    { startTime: '2023-07-16T19:00:00Z', endTime: '2023-07-16T21:00:00Z', status: AvailabilityStatus.AVAILABLE },
    { startTime: '2023-07-17T18:00:00Z', endTime: '2023-07-17T20:00:00Z', status: AvailabilityStatus.UNAVAILABLE },
  ],
  recurrenceType: RecurrenceType.NONE,
  recurrenceEndDate: null,
  preferredDuration: 120,
  notes: 'Prefer evenings',
};

const mockAvailabilityUpdate: IAvailabilityUpdate = {
  timeSlots: [
    { startTime: '2023-07-15T18:00:00Z', endTime: '2023-07-15T20:00:00Z', status: AvailabilityStatus.AVAILABLE },
    { startTime: '2023-07-16T19:00:00Z', endTime: '2023-07-16T21:00:00Z', status: AvailabilityStatus.AVAILABLE },
    { startTime: '2023-07-17T18:00:00Z', endTime: '2023-07-17T20:00:00Z', status: AvailabilityStatus.TENTATIVE },
  ],
  preferredDuration: 90,
  notes: 'Updated preferences',
};

const mockBulkAvailabilityData = {
  eventId: 'test-event-id',
  tribeId: null,
  recurrenceType: RecurrenceType.NONE,
  recurrenceEndDate: null,
  userAvailabilities: [
    {
      userId: 'user-1',
      timeSlots: [{ startTime: '2023-07-15T18:00:00Z', endTime: '2023-07-15T20:00:00Z', status: AvailabilityStatus.AVAILABLE }],
      preferredDuration: 120,
    },
    {
      userId: 'user-2',
      timeSlots: [{ startTime: '2023-07-15T19:00:00Z', endTime: '2023-07-15T21:00:00Z', status: AvailabilityStatus.AVAILABLE }],
      preferredDuration: 90,
    },
  ],
};

const mockOptimalTimeSlots: IOptimalTimeSlot[] = [
  {
    id: 'optimal-time-slot-1',
    startTime: '2023-07-15T19:00:00Z',
    endTime: '2023-07-15T20:00:00Z',
    attendanceScore: 100,
    attendeeCount: 5,
    totalAttendees: 5,
    attendancePercentage: 100,
    votes: [],
    aiRecommended: false,
    recommendationReason: 'Based on availability data',
  },
  {
    id: 'optimal-time-slot-2',
    startTime: '2023-07-16T19:00:00Z',
    endTime: '2023-07-16T21:00:00Z',
    attendanceScore: 80,
    attendeeCount: 4,
    totalAttendees: 5,
    attendancePercentage: 80,
    votes: [],
    aiRecommended: false,
    recommendationReason: 'Based on availability data',
  },
];

const mockCommonAvailabilityWindows = [
  {
    startTime: '2023-07-15T19:00:00Z',
    endTime: '2023-07-15T20:00:00Z',
    availableUsers: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
  },
  {
    startTime: '2023-07-16T19:00:00Z',
    endTime: '2023-07-16T21:00:00Z',
    availableUsers: ['user-1', 'user-2', 'user-3', 'user-4'],
  },
];

const mockAvailabilityAnalysis = {
  peakAvailabilityTimes: [
    { day: 'Saturday', startTime: '19:00', endTime: '20:00', availableUsers: 5, availabilityPercentage: 100 },
    { day: 'Sunday', startTime: '19:00', endTime: '21:00', availableUsers: 4, availabilityPercentage: 80 },
  ],
  userAvailabilityStats: {
    'user-1': { availableHours: 4, preferredTimeOfDay: 'EVENING' },
    'user-2': { availableHours: 3, preferredTimeOfDay: 'EVENING' },
    'user-3': { availableHours: 5, preferredTimeOfDay: 'EVENING' },
    'user-4': { availableHours: 6, preferredTimeOfDay: 'EVENING' },
    'user-5': { availableHours: 2, preferredTimeOfDay: 'EVENING' },
  },
  overallStats: {
    totalUsers: 5,
    averageAvailableHours: 4,
    mostAvailableDay: 'Saturday',
    mostAvailableTimeOfDay: 'EVENING',
  },
  recommendations: {
    optimalDayOfWeek: 'Saturday',
    optimalTimeOfDay: 'EVENING',
    suggestedStartTime: '19:00',
    suggestedDuration: 90,
  },
};

const mockOptimalTimeQuery = {
  eventId: 'test-event-id',
  startDate: '2023-07-15T00:00:00Z',
  endDate: '2023-07-22T23:59:59Z',
  duration: 90,
  minAttendees: 3,
  timeOfDayPreference: 'evening',
  limit: 5,
};

describe('AvailabilityService', () => {
  let availabilityService: AvailabilityService;
  let availabilityModel: jest.Mocked<Availability>;

  beforeEach(() => {
    availabilityService = new AvailabilityService();
    availabilityModel = new Availability() as jest.Mocked<Availability>;

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createAvailability', () => {
    it('Should create a new availability record', async () => {
      (validateAvailabilityCreate as jest.Mock).mockReturnValue(mockAvailabilityCreate);
      (availabilityModel.createAvailability as jest.Mock).mockResolvedValue(mockAvailability);

      const availability = await availabilityService.createAvailability(mockAvailabilityCreate);

      expect(availability).toEqual(mockAvailability);
      expect(availabilityModel.createAvailability).toHaveBeenCalledWith(mockAvailabilityCreate);
    });

    it('Should throw ValidationError when creating availability with invalid data', async () => {
      (validateAvailabilityCreate as jest.Mock).mockImplementation(() => {
        throw new ValidationError('Invalid data');
      });

      await expect(availabilityService.createAvailability(mockAvailabilityCreate)).rejects.toThrow(ValidationError);
      expect(availabilityModel.createAvailability).not.toHaveBeenCalled();
    });
  });

  describe('getAvailabilityById', () => {
    it('Should retrieve an availability record by ID', async () => {
      (availabilityModel.getAvailabilityById as jest.Mock).mockResolvedValue(mockAvailability);

      const availability = await availabilityService.getAvailabilityById('test-availability-id');

      expect(availability).toEqual(mockAvailability);
      expect(availabilityModel.getAvailabilityById).toHaveBeenCalledWith('test-availability-id');
    });

    it('Should throw ApiError when retrieving non-existent availability record', async () => {
      (availabilityModel.getAvailabilityById as jest.Mock).mockResolvedValue(null);

      await expect(availabilityService.getAvailabilityById('non-existent-id')).rejects.toThrow(ApiError);
      expect(availabilityModel.getAvailabilityById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('getUserAvailability', () => {
    it('Should retrieve availability records for a specific user', async () => {
      (validateAvailabilityQuery as jest.Mock).mockReturnValue({});
      (availabilityModel.getUserAvailability as jest.Mock).mockResolvedValue([mockAvailability]);

      const availabilities = await availabilityService.getUserAvailability('test-user-id', {});

      expect(availabilities).toEqual([mockAvailability]);
      expect(availabilityModel.getUserAvailability).toHaveBeenCalledWith('test-user-id', {});
    });
  });

  describe('getEventAvailability', () => {
    it('Should retrieve availability records for a specific event', async () => {
      (validateAvailabilityQuery as jest.Mock).mockReturnValue({});
      (availabilityModel.getEventAvailability as jest.Mock).mockResolvedValue([mockAvailability]);

      const availabilities = await availabilityService.getEventAvailability('test-event-id', {});

      expect(availabilities).toEqual([mockAvailability]);
      expect(availabilityModel.getEventAvailability).toHaveBeenCalledWith('test-event-id', {});
    });
  });

  describe('getTribeAvailability', () => {
    it('Should retrieve availability records for a specific tribe', async () => {
      (validateAvailabilityQuery as jest.Mock).mockReturnValue({});
      (availabilityModel.getUserAvailability as jest.Mock).mockResolvedValue([mockAvailability]);

      const availabilities = await availabilityService.getTribeAvailability('test-tribe-id', {});

      expect(availabilities).toEqual([mockAvailability]);
      expect(availabilityModel.getUserAvailability).toHaveBeenCalledWith('test-tribe-id', {});
    });
  });

  describe('updateAvailability', () => {
    it('Should update an existing availability record', async () => {
      (validateAvailabilityUpdate as jest.Mock).mockReturnValue(mockAvailabilityUpdate);
      (availabilityModel.updateAvailability as jest.Mock).mockResolvedValue(mockAvailability);

      const availability = await availabilityService.updateAvailability('test-availability-id', mockAvailabilityUpdate);

      expect(availability).toEqual(mockAvailability);
      expect(availabilityModel.updateAvailability).toHaveBeenCalledWith('test-availability-id', mockAvailabilityUpdate);
    });

    it('Should throw ApiError when updating non-existent availability record', async () => {
      (validateAvailabilityUpdate as jest.Mock).mockReturnValue(mockAvailabilityUpdate);
      (availabilityModel.updateAvailability as jest.Mock).mockImplementation(() => {
        throw ApiError.notFound('Availability not found');
      });

      await expect(availabilityService.updateAvailability('non-existent-id', mockAvailabilityUpdate)).rejects.toThrow(ApiError);
      expect(availabilityModel.updateAvailability).toHaveBeenCalledWith('non-existent-id', mockAvailabilityUpdate);
    });
  });

  describe('deleteAvailability', () => {
    it('Should delete an existing availability record', async () => {
      (availabilityModel.deleteAvailability as jest.Mock).mockResolvedValue(true);

      const result = await availabilityService.deleteAvailability('test-availability-id');

      expect(result).toBe(true);
      expect(availabilityModel.deleteAvailability).toHaveBeenCalledWith('test-availability-id');
    });

    it('Should throw ApiError when deleting non-existent availability record', async () => {
      (availabilityModel.deleteAvailability as jest.Mock).mockImplementation(() => {
        throw ApiError.notFound('Availability not found');
      });

      await expect(availabilityService.deleteAvailability('non-existent-id')).rejects.toThrow(ApiError);
      expect(availabilityModel.deleteAvailability).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('bulkCreateAvailability', () => {
    it('Should create multiple availability records in bulk', async () => {
      (validateBulkAvailability as jest.Mock).mockReturnValue(mockBulkAvailabilityData);
      (availabilityModel.bulkCreateAvailability as jest.Mock).mockResolvedValue([mockAvailability, mockAvailability]);

      const availabilities = await availabilityService.bulkCreateAvailability(mockBulkAvailabilityData);

      expect(availabilities).toEqual([mockAvailability, mockAvailability]);
      expect(availabilityModel.bulkCreateAvailability).toHaveBeenCalledWith(mockBulkAvailabilityData);
    });

    it('Should throw ValidationError when creating bulk availability with invalid data', async () => {
      (validateBulkAvailability as jest.Mock).mockImplementation(() => {
        throw new ValidationError('Invalid data');
      });

      await expect(availabilityService.bulkCreateAvailability(mockBulkAvailabilityData)).rejects.toThrow(ValidationError);
      expect(availabilityModel.bulkCreateAvailability).not.toHaveBeenCalled();
    });
  });

  describe('findOptimalMeetingTimes', () => {
    it('Should find optimal meeting times based on user availability', async () => {
      (validateOptimalTimeQuery as jest.Mock).mockReturnValue(mockOptimalTimeQuery);
      (availabilityModel.getEventAvailability as jest.Mock).mockResolvedValue([mockAvailability]);
      (findOptimalTimeSlots as jest.Mock).mockReturnValue(mockOptimalTimeSlots);

      const optimalTimeSlots = await availabilityService.findOptimalMeetingTimes('test-event-id', null, mockOptimalTimeQuery);

      expect(optimalTimeSlots).toEqual(expect.arrayContaining([
        expect.objectContaining({ startTime: '2023-07-15T19:00:00Z', endTime: '2023-07-15T20:00:00Z' }),
        expect.objectContaining({ startTime: '2023-07-16T19:00:00Z', endTime: '2023-07-16T21:00:00Z' }),
      ]));
      expect(findOptimalTimeSlots).toHaveBeenCalled();
    });

    it('Should throw ApiError when finding optimal times without event or tribe ID', async () => {
      await expect(availabilityService.findOptimalMeetingTimes(null, null, {})).rejects.toThrow(ApiError);
    });
  });

  describe('findCommonAvailabilityWindows', () => {
    it('Should find common availability windows across multiple users', async () => {
      (availabilityModel.getEventAvailability as jest.Mock).mockResolvedValue([mockAvailability]);
      (findCommonAvailabilityWindows as jest.Mock).mockReturnValue(mockCommonAvailabilityWindows);

      const commonWindows = await availabilityService.findCommonAvailabilityWindows('test-event-id', null, {});

      expect(commonWindows).toEqual(mockCommonAvailabilityWindows);
      expect(findCommonAvailabilityWindows).toHaveBeenCalled();
    });

    it('Should throw ApiError when finding common windows without event or tribe ID', async () => {
      await expect(availabilityService.findCommonAvailabilityWindows(null, null, {})).rejects.toThrow(ApiError);
    });
  });

  describe('analyzeAvailabilityPatterns', () => {
    it('Should analyze availability patterns to identify trends', async () => {
      (availabilityModel.getEventAvailability as jest.Mock).mockResolvedValue([mockAvailability]);
      (analyzeUserAvailability as jest.Mock).mockReturnValue(mockAvailabilityAnalysis);

      const analysis = await availabilityService.analyzeAvailabilityPatterns('test-event-id', null);

      expect(analysis).toEqual(mockAvailabilityAnalysis);
      expect(analyzeUserAvailability).toHaveBeenCalled();
    });

    it('Should throw ApiError when analyzing patterns without event or tribe ID', async () => {
      await expect(availabilityService.analyzeAvailabilityPatterns(null, null)).rejects.toThrow(ApiError);
    });
  });
});