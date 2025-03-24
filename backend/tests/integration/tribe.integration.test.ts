import supertest from 'supertest'; // HTTP testing utility for API tests // ^6.3.3
import { faker } from '@faker-js/faker'; // Generate realistic test data for tribes and users // ^8.0.2
import nock from 'nock'; // Mock HTTP requests to external services // ^13.3.1

import { app } from '../../src/tribe-service/src/index';
import { TribeModel } from '../../src/tribe-service/src/models/tribe.model';
import { MemberModel } from '../../src/tribe-service/src/models/member.model';
import { ActivityModel } from '../../src/tribe-service/src/models/activity.model';
import {
  ITribe,
  ITribeCreate,
  ITribeUpdate,
  ITribeSearchParams,
  ITribeResponse,
  ITribeDetailResponse,
  TribeStatus,
  TribePrivacy,
  InterestCategory,
  ActivityType,
  MemberRole,
  MembershipStatus,
} from '../../src/shared/src/types';
import { clearTestData } from '../setup';
import { TRIBE_LIMITS } from '../../src/shared/src/constants/app.constants';

const API_BASE_URL = '/api/v1';

// Mock the AI Recommendation API
nock('https://openrouter.ai/api')
  .post('/api/v1/ai-orchestration/process')
  .reply(200, {
    status: 200,
    message: 'Success',
    data: {
      recommendedTribes: ['tribe-id-1', 'tribe-id-2', 'tribe-id-3'],
    },
  });

// Mock the Notification Service
nock('http://localhost:3000')
  .post('/api/v1/notifications')
  .reply(200, {
    status: 200,
    message: 'Notification sent',
    data: {
      notificationId: 'notification-id-1',
    },
  });

describe('Tribe Service Integration Tests', () => {
  let request: supertest.SuperTest<supertest.Test>;
  let tribeModel: TribeModel;
  let memberModel: MemberModel;
  let activityModel: ActivityModel;

  beforeAll(() => {
    request = supertest(app);
    tribeModel = new TribeModel(require('../../src/config/database').prisma);
    memberModel = new MemberModel(require('../../src/config/database').prisma);
    activityModel = new ActivityModel(require('../../src/config/database').prisma);
  });

  afterEach(async () => {
    await clearTestData();
  });

  const generateTestTribe = (overrides: Partial<ITribeCreate> = {}): ITribeCreate => {
    const name = faker.company.name();
    const description = faker.lorem.sentence();
    const location = faker.location.city();

    return {
      name,
      description,
      location,
      coordinates: { latitude: 47.6062, longitude: -122.3321 },
      privacy: TribePrivacy.PUBLIC,
      maxMembers: 8,
      createdBy: 'user-id-1',
      interests: [{ category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking', isPrimary: true }],
      ...overrides,
    };
  };

  const createTestTribe = async (creatorId: string, overrides: Partial<ITribeCreate> = {}): Promise<ITribe> => {
    const tribeData = generateTestTribe(overrides);
    tribeData.createdBy = creatorId;
    return await tribeModel.create(tribeData);
  };

  const createTestUser = async (overrides: Partial<any> = {}): Promise<any> => {
    const email = faker.internet.email();
    const password = faker.internet.password();

    const userData = {
      email,
      password,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };

    return await require('../../src/config/database').prisma.user.create({ data: userData });
  };

  const addTestMember = async (tribeId: string, userId: string, role: MemberRole, status: MembershipStatus): Promise<any> => {
    return await memberModel.create({ tribeId, userId, role, status });
  };

  const createTestInterest = async (tribeId: string, category: InterestCategory, name: string, isPrimary: boolean): Promise<any> => {
    return await require('../../src/config/database').prisma.tribeInterest.create({
      data: {
        tribeId,
        category,
        name,
        isPrimary,
      },
    });
  };

  describe('Tribe Creation', () => {
    it('should create a tribe successfully', async () => {
      const user = await createTestUser();
      const tribeData = generateTestTribe();

      const response = await request
        .post(`${API_BASE_URL}/tribes`)
        .set('Authorization', `Bearer ${user.id}`)
        .send(tribeData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(tribeData.name);
    });

    it('should return 400 when creating with invalid data', async () => {
      const user = await createTestUser();
      const invalidTribeData = { description: 'Missing name' };

      const response = await request
        .post(`${API_BASE_URL}/tribes`)
        .set('Authorization', `Bearer ${user.id}`)
        .send(invalidTribeData);

      expect(response.status).toBe(400);
    });

    it('should return 403 when user has reached maximum tribes', async () => {
      const user = await createTestUser();
      for (let i = 0; i < TRIBE_LIMITS.MAX_TRIBES_PER_USER; i++) {
        await createTestTribe(user.id);
      }

      const tribeData = generateTestTribe();

      const response = await request
        .post(`${API_BASE_URL}/tribes`)
        .set('Authorization', `Bearer ${user.id}`)
        .send(tribeData);

      expect(response.status).toBe(403);
    });

    it('should create a tribe with interests', async () => {
      const user = await createTestUser();
      const tribeData = generateTestTribe({
        interests: [
          { category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking', isPrimary: true },
          { category: InterestCategory.FOOD_DINING, name: 'Restaurants', isPrimary: false },
        ],
      });

      const response = await request
        .post(`${API_BASE_URL}/tribes`)
        .set('Authorization', `Bearer ${user.id}`)
        .send(tribeData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.interests).toHaveLength(2);
    });
  });

  describe('Tribe Retrieval', () => {
    it('should get a tribe by ID', async () => {
      const user = await createTestUser();
      const tribe = await createTestTribe(user.id);

      const response = await request
        .get(`${API_BASE_URL}/tribes/${tribe.id}`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(tribe.id);
    });

    it('should return 404 for non-existent tribe', async () => {
      const user = await createTestUser();
      const response = await request
        .get(`${API_BASE_URL}/tribes/non-existent-id`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(404);
    });

    it('should get detailed tribe information', async () => {
      const user = await createTestUser();
      const tribe = await createTestTribe(user.id);

      const response = await request
        .get(`${API_BASE_URL}/tribes/${tribe.id}/details`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(tribe.id);
    });

    it('should get all tribes for a user', async () => {
      const user = await createTestUser();
      const tribe1 = await createTestTribe(user.id);
      const tribe2 = await createTestTribe(user.id);

      const response = await request
        .get(`${API_BASE_URL}/tribes/user`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.tribes).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });
  });

  describe('Tribe Search', () => {
    it('should search tribes by name', async () => {
      const user = await createTestUser();
      const tribe1 = await createTestTribe(user.id, { name: 'Test Tribe 1' });
      const tribe2 = await createTestTribe(user.id, { name: 'Another Tribe' });

      const response = await request
        .get(`${API_BASE_URL}/tribes?query=Test`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.tribes).toHaveLength(1);
      expect(response.body.tribes[0].id).toBe(tribe1.id);
    });

    it('should search tribes by location', async () => {
      const user = await createTestUser();
      const tribe1 = await createTestTribe(user.id, { location: 'Seattle' });
      const tribe2 = await createTestTribe(user.id, { location: 'New York' });

      const response = await request
        .get(`${API_BASE_URL}/tribes?query=Seattle`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.tribes).toHaveLength(1);
      expect(response.body.tribes[0].id).toBe(tribe1.id);
    });

    it('should search tribes by interest category', async () => {
      const user = await createTestUser();
      const tribe1 = await createTestTribe(user.id);
      await createTestInterest(tribe1.id, InterestCategory.OUTDOOR_ADVENTURES, 'Hiking', true);
      const tribe2 = await createTestTribe(user.id);
      await createTestInterest(tribe2.id, InterestCategory.FOOD_DINING, 'Restaurants', true);

      const response = await request
        .get(`${API_BASE_URL}/tribes?interests=${InterestCategory.OUTDOOR_ADVENTURES}`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.tribes).toHaveLength(1);
      expect(response.body.tribes[0].id).toBe(tribe1.id);
    });

    it('should search tribes with pagination', async () => {
      const user = await createTestUser();
      await createTestTribe(user.id);
      await createTestTribe(user.id);
      await createTestTribe(user.id);

      const response = await request
        .get(`${API_BASE_URL}/tribes?limit=2&page=1`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.tribes).toHaveLength(2);
      expect(response.body.total).toBe(3);
    });

    it('should filter tribes by status and privacy', async () => {
      const user = await createTestUser();
      const tribe1 = await createTestTribe(user.id, { status: TribeStatus.ACTIVE, privacy: TribePrivacy.PUBLIC });
      const tribe2 = await createTestTribe(user.id, { status: TribeStatus.FORMING, privacy: TribePrivacy.PRIVATE });

      const response = await request
        .get(`${API_BASE_URL}/tribes?status=${TribeStatus.ACTIVE}&privacy=${TribePrivacy.PUBLIC}`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.tribes).toHaveLength(1);
      expect(response.body.tribes[0].id).toBe(tribe1.id);
    });
  });

  describe('Tribe Updates', () => {
    it('should update tribe information', async () => {
      const user = await createTestUser();
      const tribe = await createTestTribe(user.id);
      const updateData = { name: 'Updated Name', description: 'Updated description' };

      const response = await request
        .put(`${API_BASE_URL}/tribes/${tribe.id}`)
        .set('Authorization', `Bearer ${user.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
    });

    it('should return 403 when non-creator attempts to update', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const tribe = await createTestTribe(user1.id);
      await addTestMember(tribe.id, user2.id, MemberRole.MEMBER, MembershipStatus.ACTIVE);
      const updateData = { name: 'Updated Name', description: 'Updated description' };

      const response = await request
        .put(`${API_BASE_URL}/tribes/${tribe.id}`)
        .set('Authorization', `Bearer ${user2.id}`)
        .send(updateData);

      expect(response.status).toBe(403);
    });

    it('should update tribe status', async () => {
      const user = await createTestUser();
      const tribe = await createTestTribe(user.id);
      const updateData = { status: TribeStatus.ACTIVE };

      const response = await request
        .patch(`${API_BASE_URL}/tribes/${tribe.id}/status`)
        .set('Authorization', `Bearer ${user.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(updateData.status);
    });

    it('should add interest to tribe', async () => {
      const user = await createTestUser();
      const tribe = await createTestTribe(user.id);
      const interestData = { category: InterestCategory.FOOD_DINING, name: 'Restaurants', isPrimary: true };

      const response = await request
        .post(`${API_BASE_URL}/tribes/${tribe.id}/interests`)
        .set('Authorization', `Bearer ${user.id}`)
        .send(interestData);

      expect(response.status).toBe(201);
      expect(response.body.category).toBe(interestData.category);
      expect(response.body.name).toBe(interestData.name);
    });

    it('should remove interest from tribe', async () => {
      const user = await createTestUser();
      const tribe = await createTestTribe(user.id);
      const interest = await createTestInterest(tribe.id, InterestCategory.OUTDOOR_ADVENTURES, 'Hiking', true);

      const response = await request
        .delete(`${API_BASE_URL}/tribes/${tribe.id}/interests/${interest.id}`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Tribe Membership', () => {
    it('should add member to tribe', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const tribe = await createTestTribe(user1.id);

      const response = await request
        .post(`${API_BASE_URL}/tribes/${tribe.id}/members`)
        .set('Authorization', `Bearer ${user1.id}`)
        .send({ userId: user2.id });

      expect(response.status).toBe(201);
    });

    it('should return 400 when tribe is full', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const tribe = await createTestTribe(user1.id, { maxMembers: 1 });
      await addTestMember(tribe.id, user1.id, MemberRole.CREATOR, MembershipStatus.ACTIVE);

      const response = await request
        .post(`${API_BASE_URL}/tribes/${tribe.id}/members`)
        .set('Authorization', `Bearer ${user1.id}`)
        .send({ userId: user2.id });

      expect(response.status).toBe(400);
    });

    it('should return 400 when user has maximum tribes', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      for (let i = 0; i < TRIBE_LIMITS.MAX_TRIBES_PER_USER; i++) {
        const tribe = await createTestTribe(user1.id);
        await addTestMember(tribe.id, user2.id, MemberRole.MEMBER, MembershipStatus.ACTIVE);
      }
      const tribe = await createTestTribe(user1.id);

      const response = await request
        .post(`${API_BASE_URL}/tribes/${tribe.id}/members`)
        .set('Authorization', `Bearer ${user1.id}`)
        .send({ userId: user2.id });

      expect(response.status).toBe(400);
    });

    it('should get tribe members', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const tribe = await createTestTribe(user1.id);
      await addTestMember(tribe.id, user1.id, MemberRole.CREATOR, MembershipStatus.ACTIVE);
      await addTestMember(tribe.id, user2.id, MemberRole.MEMBER, MembershipStatus.ACTIVE);

      const response = await request
        .get(`${API_BASE_URL}/tribes/${tribe.id}/members`)
        .set('Authorization', `Bearer ${user1.id}`);

      expect(response.status).toBe(200);
      expect(response.body.members).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should update member role', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const tribe = await createTestTribe(user1.id);
      const membership = await addTestMember(tribe.id, user2.id, MemberRole.MEMBER, MembershipStatus.ACTIVE);

      const response = await request
        .put(`${API_BASE_URL}/memberships/${membership.id}`)
        .set('Authorization', `Bearer ${user1.id}`)
        .send({ role: MemberRole.CREATOR });

      expect(response.status).toBe(200);
      expect(response.body.role).toBe(MemberRole.CREATOR);
    });

    it('should remove member from tribe', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const tribe = await createTestTribe(user1.id);
      const membership = await addTestMember(tribe.id, user2.id, MemberRole.MEMBER, MembershipStatus.ACTIVE);

      const response = await request
        .delete(`${API_BASE_URL}/memberships/${membership.id}`)
        .set('Authorization', `Bearer ${user1.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept membership invitation', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const tribe = await createTestTribe(user1.id);
      const membership = await addTestMember(tribe.id, user2.id, MemberRole.MEMBER, MembershipStatus.PENDING);

      const response = await request
        .post(`${API_BASE_URL}/memberships/${membership.id}/accept`)
        .set('Authorization', `Bearer ${user2.id}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(MembershipStatus.ACTIVE);
    });

    it('should reject membership invitation', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const tribe = await createTestTribe(user1.id);
      const membership = await addTestMember(tribe.id, user2.id, MemberRole.MEMBER, MembershipStatus.PENDING);

      const response = await request
        .post(`${API_BASE_URL}/memberships/${membership.id}/reject`)
        .set('Authorization', `Bearer ${user2.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Tribe Recommendations', () => {
    it('should get tribe recommendations based on interests', async () => {
      const user = await createTestUser();
      const tribe1 = await createTestTribe(user.id);
      await createTestInterest(tribe1.id, InterestCategory.OUTDOOR_ADVENTURES, 'Hiking', true);

      const response = await request
        .get(`${API_BASE_URL}/tribes/recommendations?interests=${InterestCategory.OUTDOOR_ADVENTURES}`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should get tribe recommendations based on location', async () => {
      const user = await createTestUser();
      const tribe1 = await createTestTribe(user.id);

      const response = await request
        .get(`${API_BASE_URL}/tribes/recommendations?location[latitude]=47.6062&location[longitude]=-122.3321&maxDistance=10`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should get AI-powered tribe recommendations', async () => {
      const user = await createTestUser();
      const tribe1 = await createTestTribe(user.id);

      const response = await request
        .get(`${API_BASE_URL}/tribes/ai-recommendations`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });

  describe('Tribe Activities', () => {
    it('should record tribe activity on creation', async () => {
      const user = await createTestUser();
      const tribeData = generateTestTribe();

      const response = await request
        .post(`${API_BASE_URL}/tribes`)
        .set('Authorization', `Bearer ${user.id}`)
        .send(tribeData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');

      const activities = await activityModel.findByTribeId(response.body.id);
      expect(activities).toHaveLength(1);
      expect(activities[0].activityType).toBe(ActivityType.TRIBE_CREATED);
    });

    it('should record tribe activity on member join', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const tribe = await createTestTribe(user1.id);

      const response = await request
        .post(`${API_BASE_URL}/tribes/${tribe.id}/members`)
        .set('Authorization', `Bearer ${user1.id}`)
        .send({ userId: user2.id });

      expect(response.status).toBe(201);

      const activities = await activityModel.findByTribeId(tribe.id);
      expect(activities).toHaveLength(2);
      expect(activities[1].activityType).toBe(ActivityType.MEMBER_JOINED);
    });

    it('should get tribe activity feed', async () => {
      const user = await createTestUser();
      const tribe = await createTestTribe(user.id);

      const response = await request
        .get(`${API_BASE_URL}/tribes/${tribe.id}/activities`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should get tribe engagement metrics', async () => {
      const user = await createTestUser();
      const tribe = await createTestTribe(user.id);

      const response = await request
        .get(`${API_BASE_URL}/tribes/${tribe.id}/engagement-metrics?period=week&count=4`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });

  describe('Tribe Deletion', () => {
    it('should delete a tribe', async () => {
      const user = await createTestUser();
      const tribe = await createTestTribe(user.id);

      const response = await request
        .delete(`${API_BASE_URL}/tribes/${tribe.id}`)
        .set('Authorization', `Bearer ${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedTribe = await tribeModel.findById(tribe.id);
      expect(deletedTribe).toBeNull();
    });

    it('should return 403 when non-creator attempts to delete', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const tribe = await createTestTribe(user1.id);
      await addTestMember(tribe.id, user2.id, MemberRole.MEMBER, MembershipStatus.ACTIVE);

      const response = await request
        .delete(`${API_BASE_URL}/tribes/${tribe.id}`)
        .set('Authorization', `Bearer ${user2.id}`);

      expect(response.status).toBe(403);
    });

    it('should cascade delete related data', async () => {
      const user = await createTestUser();
      const tribe = await createTestTribe(user.id);
      await createTestInterest(tribe.id, InterestCategory.OUTDOOR_ADVENTURES, 'Hiking', true);
      await addTestMember(tribe.id, user.id, MemberRole.CREATOR, MembershipStatus.ACTIVE);

      await request
        .delete(`${API_BASE_URL}/tribes/${tribe.id}`)
        .set('Authorization', `Bearer ${user.id}`);

      const deletedTribe = await tribeModel.findById(tribe.id);
      expect(deletedTribe).toBeNull();

      const activities = await activityModel.findByTribeId(tribe.id);
      expect(activities).toHaveLength(0);

      const memberships = await memberModel.findByTribeId(tribe.id);
      expect(memberships).toHaveLength(0);
    });
  });
});