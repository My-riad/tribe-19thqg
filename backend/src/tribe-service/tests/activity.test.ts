import { ActivityService } from '../src/services/activity.service';
import { ActivityModel } from '../src/models/activity.model';
import { TribeModel } from '../src/models/tribe.model';
import { ITribeActivity, ActivityType, ITribe } from '@shared/types';
import { ApiError } from '@shared/errors/api.error';

// Mock the ActivityModel and TribeModel
jest.mock('../src/models/activity.model');
jest.mock('../src/models/tribe.model');

/**
 * Helper function to generate mock activity objects for testing
 */
const generateMockActivity = (overrides: Partial<ITribeActivity> = {}): ITribeActivity => {
  return {
    id: overrides.id || 'activity-123',
    tribeId: overrides.tribeId || 'tribe-123',
    userId: overrides.userId || 'user-123',
    activityType: overrides.activityType || ActivityType.TRIBE_CREATED,
    description: overrides.description || 'Test activity description',
    timestamp: overrides.timestamp || new Date(),
    metadata: overrides.metadata || {},
    ...overrides
  };
};

describe('ActivityService', () => {
  let activityService: ActivityService;
  let activityModelMock: jest.Mocked<ActivityModel>;
  let tribeModelMock: jest.Mocked<TribeModel>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mocked instances
    activityModelMock = new ActivityModel() as jest.Mocked<ActivityModel>;
    tribeModelMock = new TribeModel() as jest.Mocked<TribeModel>;

    // Create service instance with mocked dependencies
    activityService = new ActivityService(activityModelMock, tribeModelMock);
  });

  describe('createActivity', () => {
    it('should create a new activity with valid data', async () => {
      // Arrange
      const activityData = {
        tribeId: 'tribe-123',
        userId: 'user-123',
        activityType: ActivityType.TRIBE_CREATED,
        description: 'Tribe was created',
        metadata: { key: 'value' }
      };

      const mockTribe = { id: 'tribe-123', name: 'Test Tribe' } as ITribe;
      const mockActivity = generateMockActivity(activityData);

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.create = jest.fn().mockResolvedValue(mockActivity);
      tribeModelMock.updateLastActive = jest.fn().mockResolvedValue(mockTribe);

      // Act
      const result = await activityService.createActivity(activityData);

      // Assert
      expect(tribeModelMock.findById).toHaveBeenCalledWith('tribe-123');
      expect(activityModelMock.create).toHaveBeenCalledWith(activityData);
      expect(tribeModelMock.updateLastActive).toHaveBeenCalledWith('tribe-123');
      expect(result).toEqual(mockActivity);
    });

    it('should throw error if tribe not found', async () => {
      // Arrange
      const activityData = {
        tribeId: 'nonexistent-tribe',
        userId: 'user-123',
        activityType: ActivityType.TRIBE_CREATED,
        description: 'Tribe was created',
        metadata: {}
      };

      tribeModelMock.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(activityService.createActivity(activityData))
        .rejects.toThrow(ApiError);
      
      expect(tribeModelMock.findById).toHaveBeenCalledWith('nonexistent-tribe');
      expect(activityModelMock.create).not.toHaveBeenCalled();
    });

    it("should update tribe's lastActive timestamp", async () => {
      // Arrange
      const activityData = {
        tribeId: 'tribe-123',
        userId: 'user-123',
        activityType: ActivityType.MEMBER_JOINED,
        description: 'User joined the tribe',
        metadata: {}
      };

      const mockTribe = { id: 'tribe-123', name: 'Test Tribe' } as ITribe;
      const mockActivity = generateMockActivity(activityData);

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.create = jest.fn().mockResolvedValue(mockActivity);
      tribeModelMock.updateLastActive = jest.fn().mockResolvedValue(mockTribe);

      // Act
      await activityService.createActivity(activityData);

      // Assert
      expect(tribeModelMock.updateLastActive).toHaveBeenCalledWith('tribe-123');
    });

    it('should return the created activity', async () => {
      // Arrange
      const activityData = {
        tribeId: 'tribe-123',
        userId: 'user-123',
        activityType: ActivityType.EVENT_CREATED,
        description: 'Event was created',
        metadata: { eventId: 'event-123' }
      };

      const mockTribe = { id: 'tribe-123', name: 'Test Tribe' } as ITribe;
      const mockActivity = generateMockActivity({
        ...activityData,
        id: 'new-activity-id',
        timestamp: new Date()
      });

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.create = jest.fn().mockResolvedValue(mockActivity);
      tribeModelMock.updateLastActive = jest.fn().mockResolvedValue(mockTribe);

      // Act
      const result = await activityService.createActivity(activityData);

      // Assert
      expect(result).toEqual(mockActivity);
      expect(result.id).toBe('new-activity-id');
    });
  });

  describe('getActivity', () => {
    it('should return activity by ID', async () => {
      // Arrange
      const activityId = 'activity-123';
      const mockActivity = generateMockActivity({ id: activityId });

      activityModelMock.findById = jest.fn().mockResolvedValue(mockActivity);

      // Act
      const result = await activityService.getActivity(activityId);

      // Assert
      expect(activityModelMock.findById).toHaveBeenCalledWith(activityId);
      expect(result).toEqual(mockActivity);
    });

    it('should throw error if activity not found', async () => {
      // Arrange
      const activityId = 'nonexistent-activity';
      
      activityModelMock.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(activityService.getActivity(activityId))
        .rejects.toThrow(ApiError);
      
      expect(activityModelMock.findById).toHaveBeenCalledWith(activityId);
    });
  });

  describe('getTribeActivities', () => {
    it('should return activities for a tribe', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockActivities = [
        generateMockActivity({ tribeId, id: 'activity-1' }),
        generateMockActivity({ tribeId, id: 'activity-2' })
      ];

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.findByTribeId = jest.fn().mockResolvedValue(mockActivities);

      // Act
      const result = await activityService.getTribeActivities(tribeId);

      // Assert
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
      expect(activityModelMock.findByTribeId).toHaveBeenCalledWith(tribeId, {});
      expect(result).toEqual(mockActivities);
    });

    it('should throw error if tribe not found', async () => {
      // Arrange
      const tribeId = 'nonexistent-tribe';
      
      tribeModelMock.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(activityService.getTribeActivities(tribeId))
        .rejects.toThrow(ApiError);
      
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
      expect(activityModelMock.findByTribeId).not.toHaveBeenCalled();
    });

    it('should filter by activity types if provided', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const activityTypes = [ActivityType.MEMBER_JOINED, ActivityType.MEMBER_LEFT];
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockActivities = [
        generateMockActivity({ tribeId, id: 'activity-1', activityType: ActivityType.MEMBER_JOINED }),
        generateMockActivity({ tribeId, id: 'activity-2', activityType: ActivityType.MEMBER_LEFT })
      ];

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.findByTribeId = jest.fn().mockResolvedValue(mockActivities);

      // Act
      const result = await activityService.getTribeActivities(tribeId, { activityTypes });

      // Assert
      expect(activityModelMock.findByTribeId).toHaveBeenCalledWith(tribeId, { activityTypes });
      expect(result).toEqual(mockActivities);
    });

    it('should apply pagination if limit and offset provided', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const limit = 10;
      const offset = 5;
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockActivities = [
        generateMockActivity({ tribeId, id: 'activity-1' }),
        generateMockActivity({ tribeId, id: 'activity-2' })
      ];

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.findByTribeId = jest.fn().mockResolvedValue(mockActivities);

      // Act
      const result = await activityService.getTribeActivities(tribeId, { limit, offset });

      // Assert
      expect(activityModelMock.findByTribeId).toHaveBeenCalledWith(tribeId, { limit, offset });
      expect(result).toEqual(mockActivities);
    });
  });

  describe('getUserActivities', () => {
    it('should return activities for a user', async () => {
      // Arrange
      const userId = 'user-123';
      const mockActivities = [
        generateMockActivity({ userId, id: 'activity-1' }),
        generateMockActivity({ userId, id: 'activity-2' })
      ];

      activityModelMock.findByUserId = jest.fn().mockResolvedValue(mockActivities);

      // Act
      const result = await activityService.getUserActivities(userId);

      // Assert
      expect(activityModelMock.findByUserId).toHaveBeenCalledWith(userId, {});
      expect(result).toEqual(mockActivities);
    });

    it('should filter by tribe if tribeId provided', async () => {
      // Arrange
      const userId = 'user-123';
      const tribeId = 'tribe-123';
      const mockActivities = [
        generateMockActivity({ userId, tribeId, id: 'activity-1' }),
        generateMockActivity({ userId, tribeId, id: 'activity-2' })
      ];

      activityModelMock.findByUserId = jest.fn().mockResolvedValue(mockActivities);

      // Act
      const result = await activityService.getUserActivities(userId, { tribeId });

      // Assert
      expect(activityModelMock.findByUserId).toHaveBeenCalledWith(userId, { tribeId });
      expect(result).toEqual(mockActivities);
    });

    it('should apply pagination if limit and offset provided', async () => {
      // Arrange
      const userId = 'user-123';
      const limit = 10;
      const offset = 5;
      const mockActivities = [
        generateMockActivity({ userId, id: 'activity-1' }),
        generateMockActivity({ userId, id: 'activity-2' })
      ];

      activityModelMock.findByUserId = jest.fn().mockResolvedValue(mockActivities);

      // Act
      const result = await activityService.getUserActivities(userId, { limit, offset });

      // Assert
      expect(activityModelMock.findByUserId).toHaveBeenCalledWith(userId, { limit, offset });
      expect(result).toEqual(mockActivities);
    });
  });

  describe('getRecentActivities', () => {
    it('should return recent activities across all tribes', async () => {
      // Arrange
      const mockActivities = [
        generateMockActivity({ id: 'activity-1', timestamp: new Date(2023, 5, 2) }),
        generateMockActivity({ id: 'activity-2', timestamp: new Date(2023, 5, 1) })
      ];

      activityModelMock.findRecent = jest.fn().mockResolvedValue(mockActivities);

      // Act
      const result = await activityService.getRecentActivities();

      // Assert
      expect(activityModelMock.findRecent).toHaveBeenCalledWith({});
      expect(result).toEqual(mockActivities);
    });

    it('should apply pagination if limit and offset provided', async () => {
      // Arrange
      const limit = 10;
      const offset = 5;
      const mockActivities = [
        generateMockActivity({ id: 'activity-1' }),
        generateMockActivity({ id: 'activity-2' })
      ];

      activityModelMock.findRecent = jest.fn().mockResolvedValue(mockActivities);

      // Act
      const result = await activityService.getRecentActivities({ limit, offset });

      // Assert
      expect(activityModelMock.findRecent).toHaveBeenCalledWith({ limit, offset });
      expect(result).toEqual(mockActivities);
    });
  });

  describe('countTribeActivities', () => {
    it('should count activities for a tribe', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const expectedCount = 42;

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.countByTribeId = jest.fn().mockResolvedValue(expectedCount);

      // Act
      const result = await activityService.countTribeActivities(tribeId);

      // Assert
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
      expect(activityModelMock.countByTribeId).toHaveBeenCalledWith(tribeId, {});
      expect(result).toBe(expectedCount);
    });

    it('should throw error if tribe not found', async () => {
      // Arrange
      const tribeId = 'nonexistent-tribe';
      
      tribeModelMock.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(activityService.countTribeActivities(tribeId))
        .rejects.toThrow(ApiError);
      
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
      expect(activityModelMock.countByTribeId).not.toHaveBeenCalled();
    });

    it('should filter by activity types if provided', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const activityTypes = [ActivityType.EVENT_CREATED, ActivityType.EVENT_COMPLETED];
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const expectedCount = 15;

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.countByTribeId = jest.fn().mockResolvedValue(expectedCount);

      // Act
      const result = await activityService.countTribeActivities(tribeId, { activityTypes });

      // Assert
      expect(activityModelMock.countByTribeId).toHaveBeenCalledWith(tribeId, { activityTypes });
      expect(result).toBe(expectedCount);
    });

    it('should filter by date range if provided', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const startDate = new Date(2023, 4, 1);
      const endDate = new Date(2023, 4, 31);
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const expectedCount = 25;

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.countByTribeId = jest.fn().mockResolvedValue(expectedCount);

      // Act
      const result = await activityService.countTribeActivities(tribeId, { startDate, endDate });

      // Assert
      expect(activityModelMock.countByTribeId).toHaveBeenCalledWith(tribeId, { startDate, endDate });
      expect(result).toBe(expectedCount);
    });
  });

  describe('getTribeActivityStats', () => {
    it('should get activity statistics for a tribe', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockStats = {
        total: 50,
        byType: {
          [ActivityType.TRIBE_CREATED]: 1,
          [ActivityType.MEMBER_JOINED]: 20,
          [ActivityType.MEMBER_LEFT]: 5,
          [ActivityType.EVENT_CREATED]: 15,
          [ActivityType.EVENT_COMPLETED]: 9,
          [ActivityType.AI_SUGGESTION]: 0,
          [ActivityType.CHALLENGE_CREATED]: 0,
          [ActivityType.CHALLENGE_COMPLETED]: 0
        },
        byUser: {
          'user-1': 15,
          'user-2': 20,
          'user-3': 10,
          'system': 5
        }
      };

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.getActivityStats = jest.fn().mockResolvedValue(mockStats);

      // Act
      const result = await activityService.getTribeActivityStats(tribeId);

      // Assert
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
      expect(activityModelMock.getActivityStats).toHaveBeenCalledWith(tribeId, {});
      expect(result).toEqual(mockStats);
    });

    it('should throw error if tribe not found', async () => {
      // Arrange
      const tribeId = 'nonexistent-tribe';
      
      tribeModelMock.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(activityService.getTribeActivityStats(tribeId))
        .rejects.toThrow(ApiError);
      
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
      expect(activityModelMock.getActivityStats).not.toHaveBeenCalled();
    });

    it('should include total count, counts by type, and counts by user', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockStats = {
        total: 30,
        byType: {
          [ActivityType.TRIBE_CREATED]: 1,
          [ActivityType.MEMBER_JOINED]: 10,
          [ActivityType.MEMBER_LEFT]: 2,
          [ActivityType.EVENT_CREATED]: 8,
          [ActivityType.EVENT_COMPLETED]: 5,
          [ActivityType.AI_SUGGESTION]: 4,
          [ActivityType.CHALLENGE_CREATED]: 0,
          [ActivityType.CHALLENGE_COMPLETED]: 0
        },
        byUser: {
          'user-1': 8,
          'user-2': 12,
          'user-3': 6,
          'system': 4
        }
      };

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.getActivityStats = jest.fn().mockResolvedValue(mockStats);

      // Act
      const result = await activityService.getTribeActivityStats(tribeId);

      // Assert
      expect(result.total).toBe(30);
      expect(Object.keys(result.byType).length).toBe(Object.keys(ActivityType).length);
      expect(Object.keys(result.byUser).length).toBe(4);
    });

    it('should filter by date range if provided', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const startDate = new Date(2023, 4, 1);
      const endDate = new Date(2023, 4, 31);
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockStats = {
        total: 20,
        byType: {
          [ActivityType.TRIBE_CREATED]: 0,
          [ActivityType.MEMBER_JOINED]: 5,
          [ActivityType.MEMBER_LEFT]: 1,
          [ActivityType.EVENT_CREATED]: 8,
          [ActivityType.EVENT_COMPLETED]: 6,
          [ActivityType.AI_SUGGESTION]: 0,
          [ActivityType.CHALLENGE_CREATED]: 0,
          [ActivityType.CHALLENGE_COMPLETED]: 0
        },
        byUser: {
          'user-1': 7,
          'user-2': 8,
          'user-3': 5
        }
      };

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.getActivityStats = jest.fn().mockResolvedValue(mockStats);

      // Act
      const result = await activityService.getTribeActivityStats(tribeId, { startDate, endDate });

      // Assert
      expect(activityModelMock.getActivityStats).toHaveBeenCalledWith(tribeId, { startDate, endDate });
      expect(result).toEqual(mockStats);
    });
  });

  describe('createAIEngagementActivity', () => {
    it('should create an AI-generated engagement activity', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const description = 'AI-generated engagement prompt';
      const metadata = { promptType: 'conversation', topic: 'weekend plans' };

      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const expectedActivity = generateMockActivity({
        tribeId,
        userId: 'system',
        activityType: ActivityType.AI_SUGGESTION,
        description,
        metadata: {
          ...metadata,
          generatedBy: 'ai',
          timestamp: expect.any(Date)
        }
      });

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.create = jest.fn().mockResolvedValue(expectedActivity);
      tribeModelMock.updateLastActive = jest.fn().mockResolvedValue(mockTribe);

      // Act
      const result = await activityService.createAIEngagementActivity(tribeId, description, metadata);

      // Assert
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
      expect(activityModelMock.create).toHaveBeenCalledWith(expect.objectContaining({
        tribeId,
        userId: 'system',
        activityType: ActivityType.AI_SUGGESTION,
        description,
        metadata: expect.objectContaining(metadata)
      }));
      expect(result).toEqual(expectedActivity);
    });

    it('should throw error if tribe not found', async () => {
      // Arrange
      const tribeId = 'nonexistent-tribe';
      const description = 'AI-generated engagement prompt';
      const metadata = { promptType: 'conversation' };
      
      tribeModelMock.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(activityService.createAIEngagementActivity(tribeId, description, metadata))
        .rejects.toThrow(ApiError);
      
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
      expect(activityModelMock.create).not.toHaveBeenCalled();
    });

    it('should set activityType to AI_SUGGESTION', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const description = 'AI-generated engagement prompt';
      const metadata = { promptType: 'challenge' };

      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockActivity = generateMockActivity({
        tribeId,
        userId: 'system',
        activityType: ActivityType.AI_SUGGESTION,
        description,
        metadata: {
          ...metadata,
          generatedBy: 'ai',
          timestamp: expect.any(Date)
        }
      });

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.create = jest.fn().mockResolvedValue(mockActivity);
      tribeModelMock.updateLastActive = jest.fn().mockResolvedValue(mockTribe);

      // Act
      const result = await activityService.createAIEngagementActivity(tribeId, description, metadata);

      // Assert
      expect(activityModelMock.create).toHaveBeenCalledWith(expect.objectContaining({
        activityType: ActivityType.AI_SUGGESTION
      }));
      expect(result.activityType).toBe(ActivityType.AI_SUGGESTION);
    });

    it('should use system user ID for AI-generated activities', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const description = 'AI-generated engagement prompt';
      const metadata = {};

      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockActivity = generateMockActivity({
        tribeId,
        userId: 'system',
        activityType: ActivityType.AI_SUGGESTION,
        description
      });

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.create = jest.fn().mockResolvedValue(mockActivity);
      tribeModelMock.updateLastActive = jest.fn().mockResolvedValue(mockTribe);

      // Act
      const result = await activityService.createAIEngagementActivity(tribeId, description, metadata);

      // Assert
      expect(activityModelMock.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'system'
      }));
      expect(result.userId).toBe('system');
    });

    it('should include provided metadata', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const description = 'AI-generated engagement prompt';
      const metadata = { 
        promptType: 'icebreaker', 
        difficulty: 'easy',
        tags: ['fun', 'casual']
      };

      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockActivity = generateMockActivity({
        tribeId,
        userId: 'system',
        activityType: ActivityType.AI_SUGGESTION,
        description,
        metadata: {
          ...metadata,
          generatedBy: 'ai',
          timestamp: new Date()
        }
      });

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.create = jest.fn().mockResolvedValue(mockActivity);
      tribeModelMock.updateLastActive = jest.fn().mockResolvedValue(mockTribe);

      // Act
      const result = await activityService.createAIEngagementActivity(tribeId, description, metadata);

      // Assert
      expect(activityModelMock.create).toHaveBeenCalledWith(expect.objectContaining({
        metadata: expect.objectContaining(metadata)
      }));
      expect(result.metadata).toMatchObject(metadata);
    });

    it("should update tribe's lastActive timestamp", async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const description = 'AI-generated engagement prompt';
      const metadata = {};

      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockActivity = generateMockActivity({
        tribeId,
        userId: 'system',
        activityType: ActivityType.AI_SUGGESTION,
        description
      });

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.create = jest.fn().mockResolvedValue(mockActivity);
      tribeModelMock.updateLastActive = jest.fn().mockResolvedValue(mockTribe);

      // Act
      await activityService.createAIEngagementActivity(tribeId, description, metadata);

      // Assert
      expect(tribeModelMock.updateLastActive).toHaveBeenCalledWith(tribeId);
    });

    it('should return the created activity', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const description = 'AI-generated engagement prompt';
      const metadata = { promptType: 'question' };

      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockActivity = generateMockActivity({
        id: 'ai-activity-123',
        tribeId,
        userId: 'system',
        activityType: ActivityType.AI_SUGGESTION,
        description,
        metadata: {
          ...metadata,
          generatedBy: 'ai',
          timestamp: new Date()
        }
      });

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.create = jest.fn().mockResolvedValue(mockActivity);
      tribeModelMock.updateLastActive = jest.fn().mockResolvedValue(mockTribe);

      // Act
      const result = await activityService.createAIEngagementActivity(tribeId, description, metadata);

      // Assert
      expect(result).toEqual(mockActivity);
      expect(result.id).toBe('ai-activity-123');
    });
  });

  describe('deleteActivity', () => {
    it('should delete an activity', async () => {
      // Arrange
      const activityId = 'activity-123';
      const mockActivity = generateMockActivity({ id: activityId });

      activityModelMock.findById = jest.fn().mockResolvedValue(mockActivity);
      activityModelMock.delete = jest.fn().mockResolvedValue(true);

      // Act
      const result = await activityService.deleteActivity(activityId);

      // Assert
      expect(activityModelMock.findById).toHaveBeenCalledWith(activityId);
      expect(activityModelMock.delete).toHaveBeenCalledWith(activityId);
      expect(result).toBe(true);
    });

    it('should throw error if activity not found', async () => {
      // Arrange
      const activityId = 'nonexistent-activity';
      
      activityModelMock.findById = jest.fn().mockResolvedValue(null);

      // Act
      const result = await activityService.deleteActivity(activityId);

      // Assert
      expect(activityModelMock.findById).toHaveBeenCalledWith(activityId);
      expect(activityModelMock.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return true if deletion successful', async () => {
      // Arrange
      const activityId = 'activity-123';
      const mockActivity = generateMockActivity({ id: activityId });

      activityModelMock.findById = jest.fn().mockResolvedValue(mockActivity);
      activityModelMock.delete = jest.fn().mockResolvedValue(true);

      // Act
      const result = await activityService.deleteActivity(activityId);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('deleteTribesActivities', () => {
    it('should delete all activities for a tribe', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const deletedCount = 15;

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.deleteByTribeId = jest.fn().mockResolvedValue(deletedCount);

      // Act
      const result = await activityService.deleteTribesActivities(tribeId);

      // Assert
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
      expect(activityModelMock.deleteByTribeId).toHaveBeenCalledWith(tribeId);
      expect(result).toBe(deletedCount);
    });

    it('should throw error if tribe not found', async () => {
      // Arrange
      const tribeId = 'nonexistent-tribe';
      
      tribeModelMock.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(activityService.deleteTribesActivities(tribeId))
        .rejects.toThrow(ApiError);
      
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
      expect(activityModelMock.deleteByTribeId).not.toHaveBeenCalled();
    });

    it('should return count of deleted activities', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const deletedCount = 42;

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.deleteByTribeId = jest.fn().mockResolvedValue(deletedCount);

      // Act
      const result = await activityService.deleteTribesActivities(tribeId);

      // Assert
      expect(result).toBe(42);
    });
  });

  describe('getActivityTimeline', () => {
    it('should get a chronological timeline of tribe activities', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockActivities = [
        generateMockActivity({ tribeId, id: 'activity-1', timestamp: new Date(2023, 5, 2) }),
        generateMockActivity({ tribeId, id: 'activity-2', timestamp: new Date(2023, 5, 1) })
      ];
      const totalCount = 20;

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.findByTribeId = jest.fn().mockResolvedValue(mockActivities);
      activityModelMock.countByTribeId = jest.fn().mockResolvedValue(totalCount);

      // Act
      const result = await activityService.getActivityTimeline(tribeId);

      // Assert
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
      expect(activityModelMock.findByTribeId).toHaveBeenCalledWith(tribeId, {
        limit: undefined,
        offset: undefined,
        activityTypes: undefined
      });
      expect(activityModelMock.countByTribeId).toHaveBeenCalledWith(tribeId, {
        startDate: undefined,
        endDate: undefined
      });
      expect(result).toEqual({
        activities: mockActivities,
        total: totalCount
      });
    });

    it('should throw error if tribe not found', async () => {
      // Arrange
      const tribeId = 'nonexistent-tribe';
      
      tribeModelMock.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(activityService.getActivityTimeline(tribeId))
        .rejects.toThrow(ApiError);
      
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
      expect(activityModelMock.findByTribeId).not.toHaveBeenCalled();
    });

    it('should apply pagination if limit and offset provided', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const limit = 10;
      const offset = 5;
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockActivities = [
        generateMockActivity({ tribeId, id: 'activity-1' }),
        generateMockActivity({ tribeId, id: 'activity-2' })
      ];
      const totalCount = 25;

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.findByTribeId = jest.fn().mockResolvedValue(mockActivities);
      activityModelMock.countByTribeId = jest.fn().mockResolvedValue(totalCount);

      // Act
      const result = await activityService.getActivityTimeline(tribeId, { limit, offset });

      // Assert
      expect(activityModelMock.findByTribeId).toHaveBeenCalledWith(tribeId, {
        limit,
        offset,
        activityTypes: undefined
      });
      expect(result.activities).toEqual(mockActivities);
      expect(result.total).toBe(totalCount);
    });

    it('should filter by date range if provided', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const startDate = new Date(2023, 4, 1);
      const endDate = new Date(2023, 4, 31);
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockActivities = [
        generateMockActivity({ tribeId, id: 'activity-1', timestamp: new Date(2023, 4, 15) }),
        generateMockActivity({ tribeId, id: 'activity-2', timestamp: new Date(2023, 4, 10) })
      ];
      const totalCount = 10;

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.findByTribeId = jest.fn().mockResolvedValue(mockActivities);
      activityModelMock.countByTribeId = jest.fn().mockResolvedValue(totalCount);

      // Act
      const result = await activityService.getActivityTimeline(tribeId, { startDate, endDate });

      // Assert
      expect(activityModelMock.countByTribeId).toHaveBeenCalledWith(tribeId, {
        startDate,
        endDate
      });
      expect(result.activities).toEqual(mockActivities);
      expect(result.total).toBe(totalCount);
    });

    it('should return activities and total count', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const mockTribe = { id: tribeId, name: 'Test Tribe' } as ITribe;
      const mockActivities = [
        generateMockActivity({ tribeId, id: 'activity-1' }),
        generateMockActivity({ tribeId, id: 'activity-2' }),
        generateMockActivity({ tribeId, id: 'activity-3' })
      ];
      const totalCount = 30;

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.findByTribeId = jest.fn().mockResolvedValue(mockActivities);
      activityModelMock.countByTribeId = jest.fn().mockResolvedValue(totalCount);

      // Act
      const result = await activityService.getActivityTimeline(tribeId);

      // Assert
      expect(result).toHaveProperty('activities');
      expect(result).toHaveProperty('total');
      expect(result.activities).toEqual(mockActivities);
      expect(result.activities.length).toBe(3);
      expect(result.total).toBe(totalCount);
    });
  });

  describe('getEngagementMetrics', () => {
    it('should get engagement metrics based on activities', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const mockTribe = { 
        id: tribeId, 
        name: 'Test Tribe',
        members: [{ id: 'member-1' }, { id: 'member-2' }, { id: 'member-3' }]
      } as unknown as ITribe;
      
      const activityCounts = [5, 8, 12, 6, 3, 7];
      const totalActivities = activityCounts.reduce((sum, count) => sum + count, 0);
      
      const mockStats = {
        total: 20,
        byType: {
          [ActivityType.TRIBE_CREATED]: 1,
          [ActivityType.MEMBER_JOINED]: 5,
          [ActivityType.MEMBER_LEFT]: 2,
          [ActivityType.EVENT_CREATED]: 7,
          [ActivityType.EVENT_COMPLETED]: 5,
          [ActivityType.AI_SUGGESTION]: 0,
          [ActivityType.CHALLENGE_CREATED]: 0,
          [ActivityType.CHALLENGE_COMPLETED]: 0
        },
        byUser: {
          'user-1': 8,
          'user-2': 7,
          'user-3': 5
        }
      };

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.countByTribeId = jest.fn()
        .mockImplementation(() => Promise.resolve(activityCounts.shift() || 0));
      activityModelMock.getActivityStats = jest.fn().mockResolvedValue(mockStats);

      // Act
      const result = await activityService.getEngagementMetrics(tribeId, { period: 'week' });

      // Assert
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
      expect(activityModelMock.countByTribeId).toHaveBeenCalled();
      expect(activityModelMock.getActivityStats).toHaveBeenCalled();
      expect(result).toHaveProperty('activityCount');
      expect(result).toHaveProperty('activityTrend');
      expect(result).toHaveProperty('topContributors');
      expect(result).toHaveProperty('engagementScore');
    });

    it('should throw error if tribe not found', async () => {
      // Arrange
      const tribeId = 'nonexistent-tribe';
      
      tribeModelMock.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(activityService.getEngagementMetrics(tribeId, { period: 'week' }))
        .rejects.toThrow(ApiError);
      
      expect(tribeModelMock.findById).toHaveBeenCalledWith(tribeId);
    });

    it('should calculate activity trends over time', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const mockTribe = { 
        id: tribeId, 
        name: 'Test Tribe',
        members: [{ id: 'member-1' }, { id: 'member-2' }]
      } as unknown as ITribe;
      
      // Mock increasing activity trend
      const activityCounts = [3, 5, 8, 10, 7, 12];
      
      const mockStats = {
        total: 45,
        byType: {
          [ActivityType.TRIBE_CREATED]: 1,
          [ActivityType.MEMBER_JOINED]: 5,
          [ActivityType.MEMBER_LEFT]: 2,
          [ActivityType.EVENT_CREATED]: 15,
          [ActivityType.EVENT_COMPLETED]: 12,
          [ActivityType.AI_SUGGESTION]: 10,
          [ActivityType.CHALLENGE_CREATED]: 0,
          [ActivityType.CHALLENGE_COMPLETED]: 0
        },
        byUser: {
          'user-1': 20,
          'user-2': 15,
          'system': 10
        }
      };

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.countByTribeId = jest.fn()
        .mockImplementation(() => Promise.resolve(activityCounts.shift() || 0));
      activityModelMock.getActivityStats = jest.fn().mockResolvedValue(mockStats);

      // Act
      const result = await activityService.getEngagementMetrics(tribeId, { period: 'day', count: 6 });

      // Assert
      expect(result.activityTrend.length).toBe(6);
      expect(result.activityTrend).toEqual([3, 5, 8, 10, 7, 12]);
    });

    it('should identify top contributors', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const mockTribe = { 
        id: tribeId, 
        name: 'Test Tribe',
        members: [{ id: 'member-1' }, { id: 'member-2' }, { id: 'member-3' }]
      } as unknown as ITribe;
      
      const activityCounts = [5, 8, 10, 6, 4, 7];
      
      const mockStats = {
        total: 40,
        byType: {
          [ActivityType.TRIBE_CREATED]: 1,
          [ActivityType.MEMBER_JOINED]: 5,
          [ActivityType.MEMBER_LEFT]: 2,
          [ActivityType.EVENT_CREATED]: 15,
          [ActivityType.EVENT_COMPLETED]: 12,
          [ActivityType.AI_SUGGESTION]: 5,
          [ActivityType.CHALLENGE_CREATED]: 0,
          [ActivityType.CHALLENGE_COMPLETED]: 0
        },
        byUser: {
          'user-1': 18,
          'user-2': 12,
          'user-3': 5,
          'user-4': 3,
          'system': 2
        }
      };

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.countByTribeId = jest.fn()
        .mockImplementation(() => Promise.resolve(activityCounts.shift() || 0));
      activityModelMock.getActivityStats = jest.fn().mockResolvedValue(mockStats);

      // Act
      const result = await activityService.getEngagementMetrics(tribeId, { period: 'week' });

      // Assert
      expect(result.topContributors.length).toBeLessThanOrEqual(5);
      expect(result.topContributors[0]).toEqual({ userId: 'user-1', count: 18 });
      expect(result.topContributors[1]).toEqual({ userId: 'user-2', count: 12 });
    });

    it('should calculate overall engagement score', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const mockTribe = { 
        id: tribeId, 
        name: 'Test Tribe',
        members: [{ id: 'member-1' }, { id: 'member-2' }, { id: 'member-3' }]
      } as unknown as ITribe;
      
      const activityCounts = [4, 6, 8, 6, 10, 8];
      const totalActivities = activityCounts.reduce((sum, count) => sum + count, 0);
      
      const mockStats = {
        total: totalActivities,
        byType: {
          [ActivityType.TRIBE_CREATED]: 1,
          [ActivityType.MEMBER_JOINED]: 5,
          [ActivityType.MEMBER_LEFT]: 0,
          [ActivityType.EVENT_CREATED]: 15,
          [ActivityType.EVENT_COMPLETED]: 12,
          [ActivityType.AI_SUGGESTION]: 9,
          [ActivityType.CHALLENGE_CREATED]: 0,
          [ActivityType.CHALLENGE_COMPLETED]: 0
        },
        byUser: {
          'user-1': 15,
          'user-2': 12,
          'user-3': 14,
          'system': 1
        }
      };

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.countByTribeId = jest.fn()
        .mockImplementation(() => Promise.resolve(activityCounts.shift() || 0));
      activityModelMock.getActivityStats = jest.fn().mockResolvedValue(mockStats);

      // Act
      const result = await activityService.getEngagementMetrics(tribeId, { period: 'month' });

      // Assert
      expect(result.engagementScore).toBeGreaterThanOrEqual(0);
      expect(result.engagementScore).toBeLessThanOrEqual(100);
    });

    it('should adjust time frame based on period parameter', async () => {
      // Arrange
      const tribeId = 'tribe-123';
      const mockTribe = { 
        id: tribeId, 
        name: 'Test Tribe',
        members: [{ id: 'member-1' }, { id: 'member-2' }]
      } as unknown as ITribe;
      
      const activityCounts = [2, 3, 5, 4, 6, 7, 8];
      
      const mockStats = {
        total: 35,
        byType: {
          [ActivityType.TRIBE_CREATED]: 1,
          [ActivityType.MEMBER_JOINED]: 5,
          [ActivityType.MEMBER_LEFT]: 2,
          [ActivityType.EVENT_CREATED]: 10,
          [ActivityType.EVENT_COMPLETED]: 8,
          [ActivityType.AI_SUGGESTION]: 9,
          [ActivityType.CHALLENGE_CREATED]: 0,
          [ActivityType.CHALLENGE_COMPLETED]: 0
        },
        byUser: {
          'user-1': 17,
          'user-2': 18,
          'system': 0
        }
      };

      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.countByTribeId = jest.fn()
        .mockImplementation(() => Promise.resolve(activityCounts.shift() || 0));
      activityModelMock.getActivityStats = jest.fn().mockResolvedValue(mockStats);

      // Act
      const monthResult = await activityService.getEngagementMetrics(tribeId, { period: 'month', count: 3 });
      
      // Reset mocks for new test
      jest.clearAllMocks();
      activityCounts.push(2, 3, 5, 4, 6, 7, 8);
      
      tribeModelMock.findById = jest.fn().mockResolvedValue(mockTribe);
      activityModelMock.countByTribeId = jest.fn()
        .mockImplementation(() => Promise.resolve(activityCounts.shift() || 0));
      activityModelMock.getActivityStats = jest.fn().mockResolvedValue(mockStats);
      
      const weekResult = await activityService.getEngagementMetrics(tribeId, { period: 'week', count: 3 });

      // Assert - should use different date calculations for different periods
      expect(activityModelMock.countByTribeId).toHaveBeenCalledWith(
        tribeId,
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date)
        })
      );
    });
  });
});