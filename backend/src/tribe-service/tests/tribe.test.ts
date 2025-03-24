import { TribeService } from '../src/services/tribe.service';
import { TribeModel } from '../src/models/tribe.model';
import { MemberModel } from '../src/models/member.model';
import { ActivityModel } from '../src/models/activity.model';
import { MemberService } from '../src/services/member.service';
import { ActivityService } from '../src/services/activity.service';
import {
  ITribe,
  ITribeCreate,
  ITribeUpdate,
  ITribeSearchParams,
  ITribeInterest,
  ITribeResponse,
  ITribeDetailResponse,
  TribeStatus,
  TribePrivacy,
  ActivityType,
  MemberRole,
} from '@shared/types';
import { InterestCategory, ICoordinates } from '@shared/types';
import { TRIBE_LIMITS } from '@shared/constants/app.constants';
import { ApiError } from '@shared/errors/api.error';
import { orchestrationService } from '@ai-orchestration-service'; // Assuming version 1.0.0 or compatible
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import { jest } from '@jest/globals'; // ^29.5.0

// Mock tribe data for testing
const generateMockTribe = (overrides?: Partial<ITribe>): ITribe => {
  const id = overrides?.id ?? uuidv4();
  const name = overrides?.name ?? 'Test Tribe';
  const description = overrides?.description ?? 'Test description';
  const location = overrides?.location ?? 'Test Location';
  const status = overrides?.status ?? TribeStatus.FORMING;
  const privacy = overrides?.privacy ?? TribePrivacy.PUBLIC;
  const maxMembers = overrides?.maxMembers ?? TRIBE_LIMITS.MAX_MEMBERS_PER_TRIBE;
  const createdAt = overrides?.createdAt ?? new Date();
  const lastActive = overrides?.lastActive ?? new Date();
  const createdBy = overrides?.createdBy ?? uuidv4();

  return {
    id,
    name,
    description,
    location,
    coordinates: { latitude: 0, longitude: 0 },
    imageUrl: '',
    status,
    privacy,
    maxMembers,
    createdBy,
    createdAt,
    lastActive,
    interests: [],
    members: [],
    activities: [],
    goals: [],
    metadata: {},
    ...overrides,
  };
};

// Helper function to set up mocks for the tribe service dependencies
const setupTribeServiceMocks = () => {
  const tribeModelMock = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    search: jest.fn(),
    update: jest.fn(),
    updateLastActive: jest.fn(),
    updateStatus: jest.fn(),
    addInterest: jest.fn(),
    removeInterest: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    getRecommendations: jest.fn(),
  };

  const memberModelMock = {
    create: jest.fn(),
    countByTribeId: jest.fn(),
    countByUserId: jest.fn(),
    findByTribeId: jest.fn(),
    deleteByTribeId: jest.fn(),
  };

  const activityModelMock = {
    create: jest.fn(),
    deleteByTribeId: jest.fn(),
  };

  const memberServiceMock = {
    canUserJoinTribe: jest.fn(),
    hasPermission: jest.fn(),
    getUserMembershipInTribe: jest.fn(),
  };

  const activityServiceMock = {
    createActivity: jest.fn(),
    getEngagementMetrics: jest.fn(),
  };

  orchestrationService.createOrchestrationRequest = jest.fn();
  orchestrationService.processOrchestrationRequest = jest.fn();

  const tribeService = new TribeService(
    tribeModelMock as any,
    memberModelMock as any,
    activityModelMock as any,
    memberServiceMock as any,
    activityServiceMock as any
  );

  return {
    tribeModelMock,
    memberModelMock,
    activityModelMock,
    memberServiceMock,
    activityServiceMock,
    tribeService,
  };
};

describe('TribeService', () => {
  let tribeModelMock: any;
  let memberModelMock: any;
  let activityModelMock: any;
  let memberServiceMock: any;
  let activityServiceMock: any;
  let tribeService: TribeService;

  beforeEach(() => {
    const mocks = setupTribeServiceMocks();
    tribeModelMock = mocks.tribeModelMock;
    memberModelMock = mocks.memberModelMock;
    activityModelMock = mocks.activityModelMock;
    memberServiceMock = mocks.memberServiceMock;
    activityServiceMock = mocks.activityServiceMock;
    tribeService = mocks.tribeService;
  });

  describe('createTribe', () => {
    it('should create a new tribe with valid data', async () => {
      const mockTribeCreate: ITribeCreate = {
        name: 'Test Tribe',
        description: 'Test description',
        location: 'Test Location',
        coordinates: { latitude: 0, longitude: 0 },
        imageUrl: '',
        privacy: TribePrivacy.PUBLIC,
        maxMembers: 8,
        createdBy: 'user123',
        interests: [{ category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking', isPrimary: true }],
      };
      const mockTribe: ITribe = generateMockTribe(mockTribeCreate);

      tribeModelMock.create.mockResolvedValue(mockTribe);
      memberModelMock.countByUserId.mockResolvedValue(0);
      memberServiceMock.addMember.mockResolvedValue(undefined);
      activityServiceMock.createActivity.mockResolvedValue(undefined);

      const tribe = await tribeService.createTribe(mockTribeCreate);

      expect(tribeModelMock.create).toHaveBeenCalledWith(mockTribeCreate);
      expect(memberModelMock.countByUserId).toHaveBeenCalledWith('user123', { status: 'active' });
      expect(memberServiceMock.addMember).toHaveBeenCalledWith({
        tribeId: mockTribe.id,
        userId: 'user123',
        role: MemberRole.CREATOR,
      });
      expect(activityServiceMock.createActivity).toHaveBeenCalledWith({
        tribeId: mockTribe.id,
        userId: 'user123',
        activityType: ActivityType.TRIBE_CREATED,
        description: `Tribe "Test Tribe" was created`,
        metadata: { tribeName: 'Test Tribe' },
      });
      expect(tribe).toEqual(mockTribe);
    });

    it('should set default values for missing fields', async () => {
      const mockTribeCreate: Omit<ITribeCreate, 'privacy' | 'maxMembers'> = {
        name: 'Test Tribe',
        description: 'Test description',
        location: 'Test Location',
        coordinates: { latitude: 0, longitude: 0 },
        imageUrl: '',
        createdBy: 'user123',
        interests: [{ category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking', isPrimary: true }],
      };
      const mockTribe: ITribe = generateMockTribe({
        ...mockTribeCreate,
        privacy: TribePrivacy.PUBLIC,
        maxMembers: TRIBE_LIMITS.MAX_MEMBERS_PER_TRIBE,
      });

      tribeModelMock.create.mockResolvedValue(mockTribe);
      memberModelMock.countByUserId.mockResolvedValue(0);
      memberServiceMock.addMember.mockResolvedValue(undefined);
      activityServiceMock.createActivity.mockResolvedValue(undefined);

      await tribeService.createTribe(mockTribeCreate as ITribeCreate);

      expect(tribeModelMock.create).toHaveBeenCalledWith(expect.objectContaining({
        privacy: TribePrivacy.PUBLIC,
        maxMembers: TRIBE_LIMITS.MAX_MEMBERS_PER_TRIBE,
      }));
    });

    it('should throw error if user has reached maximum tribes (3)', async () => {
      const mockTribeCreate: ITribeCreate = {
        name: 'Test Tribe',
        description: 'Test description',
        location: 'Test Location',
        coordinates: { latitude: 0, longitude: 0 },
        imageUrl: '',
        privacy: TribePrivacy.PUBLIC,
        maxMembers: 8,
        createdBy: 'user123',
        interests: [{ category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking', isPrimary: true }],
      };

      memberModelMock.countByUserId.mockResolvedValue(TRIBE_LIMITS.MAX_TRIBES_PER_USER);

      await expect(tribeService.createTribe(mockTribeCreate)).rejects.toThrow(ApiError);
      expect(tribeModelMock.create).not.toHaveBeenCalled();
    });

    it('should add creator as first member with CREATOR role', async () => {
      const mockTribeCreate: ITribeCreate = {
        name: 'Test Tribe',
        description: 'Test description',
        location: 'Test Location',
        coordinates: { latitude: 0, longitude: 0 },
        imageUrl: '',
        privacy: TribePrivacy.PUBLIC,
        maxMembers: 8,
        createdBy: 'user123',
        interests: [{ category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking', isPrimary: true }],
      };
      const mockTribe: ITribe = generateMockTribe(mockTribeCreate);

      tribeModelMock.create.mockResolvedValue(mockTribe);
      memberModelMock.countByUserId.mockResolvedValue(0);
      memberServiceMock.addMember.mockResolvedValue(undefined);
      activityServiceMock.createActivity.mockResolvedValue(undefined);

      await tribeService.createTribe(mockTribeCreate);

      expect(memberServiceMock.addMember).toHaveBeenCalledWith({
        tribeId: mockTribe.id,
        userId: 'user123',
        role: MemberRole.CREATOR,
      });
    });

    it('should record tribe creation activity', async () => {
      const mockTribeCreate: ITribeCreate = {
        name: 'Test Tribe',
        description: 'Test description',
        location: 'Test Location',
        coordinates: { latitude: 0, longitude: 0 },
        imageUrl: '',
        privacy: TribePrivacy.PUBLIC,
        maxMembers: 8,
        createdBy: 'user123',
        interests: [{ category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking', isPrimary: true }],
      };
      const mockTribe: ITribe = generateMockTribe(mockTribeCreate);

      tribeModelMock.create.mockResolvedValue(mockTribe);
      memberModelMock.countByUserId.mockResolvedValue(0);
      memberServiceMock.addMember.mockResolvedValue(undefined);
      activityServiceMock.createActivity.mockResolvedValue(undefined);

      await tribeService.createTribe(mockTribeCreate);

      expect(activityServiceMock.createActivity).toHaveBeenCalledWith({
        tribeId: mockTribe.id,
        userId: 'user123',
        activityType: ActivityType.TRIBE_CREATED,
        description: `Tribe "Test Tribe" was created`,
        metadata: { tribeName: 'Test Tribe' },
      });
    });

    it('should return the created tribe', async () => {
      const mockTribeCreate: ITribeCreate = {
        name: 'Test Tribe',
        description: 'Test description',
        location: 'Test Location',
        coordinates: { latitude: 0, longitude: 0 },
        imageUrl: '',
        privacy: TribePrivacy.PUBLIC,
        maxMembers: 8,
        createdBy: 'user123',
        interests: [{ category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking', isPrimary: true }],
      };
      const mockTribe: ITribe = generateMockTribe(mockTribeCreate);

      tribeModelMock.create.mockResolvedValue(mockTribe);
      memberModelMock.countByUserId.mockResolvedValue(0);
      memberServiceMock.addMember.mockResolvedValue(undefined);
      activityServiceMock.createActivity.mockResolvedValue(undefined);

      const tribe = await tribeService.createTribe(mockTribeCreate);

      expect(tribe).toEqual(mockTribe);
    });
  });

  describe('getTribe', () => {
    it('should return tribe by ID', async () => {
      const mockTribe: ITribe = generateMockTribe();
      tribeModelMock.findById.mockResolvedValue(mockTribe);

      const tribe = await tribeService.getTribe(mockTribe.id);

      expect(tribeModelMock.findById).toHaveBeenCalledWith(mockTribe.id, false);
      expect(tribe).toEqual(mockTribe);
    });

    it('should include members if includeMembers is true', async () => {
      const mockTribe: ITribe = generateMockTribe();
      tribeModelMock.findById.mockResolvedValue(mockTribe);

      await tribeService.getTribe(mockTribe.id, true);

      expect(tribeModelMock.findById).toHaveBeenCalledWith(mockTribe.id, true);
    });

    it('should throw error if tribe not found', async () => {
      tribeModelMock.findById.mockResolvedValue(null);

      await expect(tribeService.getTribe('nonexistent-id')).rejects.toThrow(ApiError);
      expect(tribeModelMock.findById).toHaveBeenCalledWith('nonexistent-id', false);
    });
  });

  describe('getTribeDetails', () => {
    it('should return detailed tribe information', async () => {
      const mockTribe: ITribe = generateMockTribe();
      tribeModelMock.findById.mockResolvedValue(mockTribe);
      memberServiceMock.getUserMembershipInTribe.mockResolvedValue(null);

      const tribeDetails = await tribeService.getTribeDetails(mockTribe.id);

      expect(tribeModelMock.findById).toHaveBeenCalledWith(mockTribe.id, true);
      expect(tribeDetails).toBeDefined();
    });

    it("should include user's membership if userId provided", async () => {
      const mockTribe: ITribe = generateMockTribe();
      tribeModelMock.findById.mockResolvedValue(mockTribe);
      memberServiceMock.getUserMembershipInTribe.mockResolvedValue({ id: 'membership123', role: MemberRole.MEMBER, status: 'active' });

      await tribeService.getTribeDetails(mockTribe.id, 'user123');

      expect(memberServiceMock.getUserMembershipInTribe).toHaveBeenCalledWith(mockTribe.id, 'user123');
    });

    it('should include upcoming events', async () => {
      const mockTribe: ITribe = generateMockTribe();
      tribeModelMock.findById.mockResolvedValue(mockTribe);
      memberServiceMock.getUserMembershipInTribe.mockResolvedValue(null);

      const tribeDetails = await tribeService.getTribeDetails(mockTribe.id);

      expect(tribeDetails.upcomingEvents).toEqual([]);
    });

    it('should include unread message count', async () => {
      const mockTribe: ITribe = generateMockTribe();
      tribeModelMock.findById.mockResolvedValue(mockTribe);
      memberServiceMock.getUserMembershipInTribe.mockResolvedValue(null);

      const tribeDetails = await tribeService.getTribeDetails(mockTribe.id);

      expect(tribeDetails.unreadMessageCount).toEqual(0);
    });

    it('should throw error if tribe not found', async () => {
      tribeModelMock.findById.mockResolvedValue(null);

      await expect(tribeService.getTribeDetails('nonexistent-id')).rejects.toThrow(ApiError);
      expect(tribeModelMock.findById).toHaveBeenCalledWith('nonexistent-id', true);
    });
  });

  describe('getUserTribes', () => {
    it('should return all tribes a user is a member of', async () => {
      const mockTribes: ITribe[] = [generateMockTribe(), generateMockTribe()];
      tribeModelMock.findByUserId.mockResolvedValue(mockTribes);
      memberModelMock.countByUserId.mockResolvedValue(mockTribes.length);

      const { tribes, total } = await tribeService.getUserTribes('user123');

      expect(tribeModelMock.findByUserId).toHaveBeenCalledWith('user123', {});
      expect(total).toEqual(mockTribes.length);
      expect(tribes).toBeDefined();
    });

    it('should apply pagination if limit and offset provided', async () => {
      const mockTribes: ITribe[] = [generateMockTribe(), generateMockTribe()];
      tribeModelMock.findByUserId.mockResolvedValue(mockTribes);
      memberModelMock.countByUserId.mockResolvedValue(mockTribes.length);

      await tribeService.getUserTribes('user123', { limit: 10, offset: 20 });

      expect(tribeModelMock.findByUserId).toHaveBeenCalledWith('user123', { limit: 10, offset: 20 });
    });

    it('should format tribe data for response', async () => {
      const mockTribes: ITribe[] = [generateMockTribe(), generateMockTribe()];
      tribeModelMock.findByUserId.mockResolvedValue(mockTribes);
      memberModelMock.countByUserId.mockResolvedValue(mockTribes.length);
      memberModelMock.countByTribeId.mockResolvedValue(5);
      memberServiceMock.getUserMembershipInTribe.mockResolvedValue(null);

      const { tribes } = await tribeService.getUserTribes('user123');

      expect(tribes).toBeDefined();
      expect(memberModelMock.countByTribeId).toHaveBeenCalledTimes(2);
      expect(memberServiceMock.getUserMembershipInTribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('searchTribes', () => {
    it('should search for tribes based on criteria', async () => {
      const mockTribes: ITribe[] = [generateMockTribe(), generateMockTribe()];
      tribeModelMock.search.mockResolvedValue({ tribes: mockTribes, total: mockTribes.length });

      const searchParams: ITribeSearchParams = { query: 'test' };
      const { tribes, total } = await tribeService.searchTribes(searchParams);

      expect(tribeModelMock.search).toHaveBeenCalledWith(searchParams);
      expect(total).toEqual(mockTribes.length);
      expect(tribes).toBeDefined();
    });
  });

  describe('updateTribe', () => {
    it('should update a tribe with valid data', async () => {
      const mockTribe: ITribe = generateMockTribe();
      const updateData: ITribeUpdate = { name: 'Updated Tribe Name' };

      tribeModelMock.update.mockResolvedValue(mockTribe);
      memberServiceMock.hasPermission.mockResolvedValue(true);
      activityServiceMock.createActivity.mockResolvedValue(undefined);

      const updatedTribe = await tribeService.updateTribe(mockTribe.id, updateData, 'user123');

      expect(tribeModelMock.update).toHaveBeenCalledWith(mockTribe.id, updateData);
      expect(updatedTribe).toEqual(mockTribe);
    });
  });

  describe('updateTribeStatus', () => {
    it("should update a tribe's status", async () => {
      const mockTribe: ITribe = generateMockTribe();
      tribeModelMock.updateStatus.mockResolvedValue(mockTribe);
      memberServiceMock.hasPermission.mockResolvedValue(true);
      activityServiceMock.createActivity.mockResolvedValue(undefined);

      const updatedTribe = await tribeService.updateTribeStatus(mockTribe.id, TribeStatus.ACTIVE, 'user123');

      expect(tribeModelMock.updateStatus).toHaveBeenCalledWith(mockTribe.id, TribeStatus.ACTIVE);
      expect(updatedTribe).toEqual(mockTribe);
    });
  });

  describe('addTribeInterest', () => {
    it('should add an interest to a tribe', async () => {
      const mockTribe: ITribe = generateMockTribe();
      const mockInterest: ITribeInterest = { id: 'interest123', tribeId: mockTribe.id, category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking', isPrimary: true };

      tribeModelMock.addInterest.mockResolvedValue(mockInterest);
      memberServiceMock.hasPermission.mockResolvedValue(true);
      activityServiceMock.createActivity.mockResolvedValue(undefined);

      const interest = await tribeService.addTribeInterest(mockTribe.id, { category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking', isPrimary: true }, 'user123');

      expect(tribeModelMock.addInterest).toHaveBeenCalledWith(mockTribe.id, { category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking', isPrimary: true });
      expect(interest).toEqual(mockInterest);
    });
  });

  describe('removeTribeInterest', () => {
    it('should remove an interest from a tribe', async () => {
      const mockTribe: ITribe = generateMockTribe();
      tribeModelMock.removeInterest.mockResolvedValue(true);
      memberServiceMock.hasPermission.mockResolvedValue(true);
      activityServiceMock.createActivity.mockResolvedValue(undefined);

      const result = await tribeService.removeTribeInterest('interest123', mockTribe.id, 'user123');

      expect(tribeModelMock.removeInterest).toHaveBeenCalledWith('interest123');
      expect(result).toBe(true);
    });
  });

  describe('deleteTribe', () => {
    it('should delete a tribe', async () => {
      const mockTribe: ITribe = generateMockTribe();
      tribeModelMock.delete.mockResolvedValue(true);
      memberServiceMock.hasPermission.mockResolvedValue(true);
      memberModelMock.deleteByTribeId.mockResolvedValue(undefined);
      activityModelMock.deleteByTribeId.mockResolvedValue(undefined);

      const result = await tribeService.deleteTribe(mockTribe.id, 'user123');

      expect(tribeModelMock.delete).toHaveBeenCalledWith(mockTribe.id);
      expect(memberModelMock.deleteByTribeId).toHaveBeenCalledWith(mockTribe.id);
      expect(activityModelMock.deleteByTribeId).toHaveBeenCalledWith(mockTribe.id);
      expect(result).toBe(true);
    });
  });

  describe('getTribeRecommendations', () => {
    it('should get tribe recommendations based on interests and location', async () => {
      const mockTribes: ITribe[] = [generateMockTribe(), generateMockTribe()];
      tribeModelMock.getRecommendations.mockResolvedValue(mockTribes);

      const recommendations = await tribeService.getTribeRecommendations('user123', [InterestCategory.OUTDOOR_ADVENTURES], { latitude: 0, longitude: 0 }, 25, 10, 0);

      expect(tribeModelMock.getRecommendations).toHaveBeenCalledWith({
        userId: 'user123',
        interests: [InterestCategory.OUTDOOR_ADVENTURES],
        location: { latitude: 0, longitude: 0 },
        maxDistance: 25,
        limit: 10,
        offset: 0,
      });
      expect(recommendations).toBeDefined();
    });
  });

  describe('getAITribeRecommendations', () => {
    it('should get AI-powered tribe recommendations', async () => {
      const mockTribes: ITribe[] = [generateMockTribe(), generateMockTribe()];
      tribeModelMock.findById.mockResolvedValue(mockTribes[0]);
      (orchestrationService.createOrchestrationRequest as jest.Mock).mockResolvedValue({ id: 'request123' });
      (orchestrationService.processOrchestrationRequest as jest.Mock).mockResolvedValue({ result: { tribeIds: [mockTribes[0].id] } });

      const recommendations = await tribeService.getAITribeRecommendations('user123');

      expect(orchestrationService.createOrchestrationRequest).toHaveBeenCalled();
      expect(orchestrationService.processOrchestrationRequest).toHaveBeenCalledWith('request123');
      expect(tribeModelMock.findById).toHaveBeenCalledWith(mockTribes[0].id, true);
      expect(recommendations).toBeDefined();
    });
  });

  describe('getTribeEngagementMetrics', () => {
    it('should get engagement metrics for a tribe', async () => {
      const mockTribe: ITribe = generateMockTribe();
      tribeModelMock.findById.mockResolvedValue(mockTribe);
      activityServiceMock.getEngagementMetrics.mockResolvedValue({
        activityCount: 10,
        activityTrend: [1, 2, 3],
        topContributors: [],
        engagementScore: 50,
      });

      const metrics = await tribeService.getTribeEngagementMetrics(mockTribe.id, { period: 'week' });

      expect(tribeModelMock.findById).toHaveBeenCalledWith(mockTribe.id);
      expect(activityServiceMock.getEngagementMetrics).toHaveBeenCalledWith(mockTribe.id, { period: 'week' });
      expect(metrics).toBeDefined();
    });

    it('should throw error if tribe not found', async () => {
      tribeModelMock.findById.mockResolvedValue(null);

      await expect(tribeService.getTribeEngagementMetrics('nonexistent-id', { period: 'week' })).rejects.toThrow(ApiError);
      expect(tribeModelMock.findById).toHaveBeenCalledWith('nonexistent-id');
    });
  });

  describe('formatTribeResponse', () => {
    it('should format tribe data for API response', async () => {
      const mockTribe: ITribe = generateMockTribe();
      memberModelMock.countByTribeId.mockResolvedValue(5);
      memberServiceMock.getUserMembershipInTribe.mockResolvedValue(null);

      const tribeResponse = await tribeService.formatTribeResponse(mockTribe);

      expect(tribeResponse).toBeDefined();
      expect(memberModelMock.countByTribeId).toHaveBeenCalledWith(mockTribe.id, { status: 'active' });
      expect(memberServiceMock.getUserMembershipInTribe).toHaveBeenCalledWith(mockTribe.id, undefined);
    });

    it("should include user's membership if userId provided", async () => {
      const mockTribe: ITribe = generateMockTribe();
      memberModelMock.countByTribeId.mockResolvedValue(5);
      memberServiceMock.getUserMembershipInTribe.mockResolvedValue({ id: 'membership123', role: MemberRole.MEMBER, status: 'active' });

      const tribeResponse = await tribeService.formatTribeResponse(mockTribe, { userId: 'user123' });

      expect(tribeResponse.userMembership).toBeDefined();
      expect(memberServiceMock.getUserMembershipInTribe).toHaveBeenCalledWith(mockTribe.id, 'user123');
    });

    it('should calculate compatibility score if requested', async () => {
      const mockTribe: ITribe = generateMockTribe();
      memberModelMock.countByTribeId.mockResolvedValue(5);
      memberServiceMock.getUserMembershipInTribe.mockResolvedValue(null);

      const tribeResponse = await tribeService.formatTribeResponse(mockTribe, { includeCompatibility: true });

      expect(tribeResponse.compatibilityScore).toEqual(0);
    });
  });

  describe('formatTribeDetailResponse', () => {
    it('should format detailed tribe data for API response', () => {
      const mockTribe: ITribe = generateMockTribe();

      const tribeDetailResponse = tribeService.formatTribeDetailResponse(mockTribe);

      expect(tribeDetailResponse).toBeDefined();
    });

    it('should include members data with user information', () => {
      const mockTribe: ITribe = generateMockTribe();

      const tribeDetailResponse = tribeService.formatTribeDetailResponse(mockTribe);

      expect(tribeDetailResponse.members).toEqual([]);
    });

    it('should include activities data with user information', () => {
      const mockTribe: ITribe = generateMockTribe();

      const tribeDetailResponse = tribeService.formatTribeDetailResponse(mockTribe);

      expect(tribeDetailResponse.activities).toEqual([]);
    });

    it('should include goals data', () => {
      const mockTribe: ITribe = generateMockTribe();

      const tribeDetailResponse = tribeService.formatTribeDetailResponse(mockTribe);

      expect(tribeDetailResponse.goals).toEqual([]);
    });

    it('should include additional data (userMembership, upcomingEvents, unreadMessageCount)', () => {
      const mockTribe: ITribe = generateMockTribe();

      const tribeDetailResponse = tribeService.formatTribeDetailResponse(mockTribe, { userMembership: {}, upcomingEvents: [], unreadMessageCount: 0 });

      expect(tribeDetailResponse.userMembership).toEqual({});
      expect(tribeDetailResponse.upcomingEvents).toEqual([]);
      expect(tribeDetailResponse.unreadMessageCount).toEqual(0);
    });
  });
});