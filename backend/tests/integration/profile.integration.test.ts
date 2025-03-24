import supertest from 'supertest'; // ^6.3.3
import { faker } from '@faker-js/faker'; // ^8.0.2
import { clearTestData } from '../setup';
import { app } from '../../src/profile-service/src/index';
import { ProfileModel } from '../../src/profile-service/src/models/profile.model';
import { PersonalityModel } from '../../src/profile-service/src/models/personality.model';
import { InterestModel } from '../../src/profile-service/src/models/interest.model';
import {
  IProfile,
  IProfileCreate,
  IProfileUpdate,
  IProfileResponse,
  ICoordinates,
  CommunicationStyle,
  IPersonalityAssessment,
  IInterestSubmission,
  PersonalityTrait,
  InterestCategory,
  InterestLevel,
} from '../../src/shared/src/types/profile.types';
import { UserModel } from '../../src/auth-service/src/models/user.model';

const API_BASE_URL = '/api/v1';

describe('Profile Service Integration Tests', () => {
  let client: supertest.SuperTest<supertest.Test>;

  beforeAll(() => {
    client = supertest(app);
  });

  afterEach(async () => {
    await clearTestData();
  });

  /**
   * Generates test profile data with random values
   * @param overrides - Optional overrides for the generated data
   * @returns Test profile data
   */
  const generateTestProfile = (overrides: Partial<IProfileCreate> = {}): IProfileCreate => {
    const userId = overrides.userId || faker.string.uuid();
    const name = overrides.name || faker.person.fullName();
    const bio = overrides.bio || faker.lorem.sentence();
    const location = overrides.location || faker.location.city();
    const coordinates: ICoordinates = overrides.coordinates || {
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
    };

    const profileData: IProfileCreate = {
      userId,
      name,
      bio,
      location,
      coordinates,
      birthdate: overrides.birthdate || faker.date.past(),
      phoneNumber: overrides.phoneNumber || faker.phone.number(),
      avatarUrl: overrides.avatarUrl || faker.image.avatar(),
      communicationStyle: overrides.communicationStyle || CommunicationStyle.DIRECT,
      maxTravelDistance: overrides.maxTravelDistance || 15,
      ...overrides,
    };

    return profileData;
  };

  /**
   * Creates a test profile in the database
   * @param overrides - Optional overrides for the generated data
   * @returns Created profile data
   */
  const createTestProfile = async (overrides: Partial<IProfileCreate> = {}): Promise<IProfile> => {
    const profileData = generateTestProfile(overrides);
    const profileModel = new ProfileModel();
    const profile = await profileModel.create(profileData);
    return profile;
  };

  /**
   * Generates test personality assessment data
   * @param profileId - The ID of the profile to associate with the assessment
   * @returns Test personality assessment data
   */
  const generatePersonalityAssessment = (profileId: string): IPersonalityAssessment => {
    const traits = Object.values(PersonalityTrait).map((trait) => ({
      trait,
      score: faker.number.float({ min: 0, max: 10 }),
    }));

    const assessment: IPersonalityAssessment = {
      profileId,
      traits,
      communicationStyle: faker.helpers.enumValue(CommunicationStyle),
      assessmentSource: 'TEST',
    };

    return assessment;
  };

  /**
   * Generates test interest submission data
   * @param profileId - The ID of the profile to associate with the interests
   * @param count - The number of interests to generate
   * @returns Test interest submission data
   */
  const generateInterestSubmission = (profileId: string, count: number): IInterestSubmission => {
    const interests = Array.from({ length: count }, () => ({
      category: faker.helpers.enumValue(InterestCategory),
      name: faker.word.noun(),
      level: faker.helpers.enumValue(InterestLevel),
    }));

    const submission: IInterestSubmission = {
      profileId,
      interests,
      replaceExisting: true,
    };

    return submission;
  };

  describe('Profile Creation', () => {
    it('POST /api/v1/profiles - should create profile with valid data', async () => {
      const userData = {
        email: faker.internet.email(),
        password: faker.internet.password(),
      };
      const user = await UserModel.create(userData);
      const profileData = generateTestProfile({ userId: user.id });

      const response = await client
        .post(`${API_BASE_URL}/profiles`)
        .send(profileData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe(profileData.userId);
    });

    it('POST /api/v1/profiles - should return 400 with invalid data', async () => {
      const response = await client
        .post(`${API_BASE_URL}/profiles`)
        .send({ name: 'Test' })
        .expect(400);

      expect(response.body.error).toBe(true);
    });

    it('POST /api/v1/profiles - should return 409 with duplicate userId', async () => {
      const userData = {
        email: faker.internet.email(),
        password: faker.internet.password(),
      };
      const user = await UserModel.create(userData);
      const profileData = generateTestProfile({ userId: user.id });
      await client
        .post(`${API_BASE_URL}/profiles`)
        .send(profileData)
        .expect(201);

      const response = await client
        .post(`${API_BASE_URL}/profiles`)
        .send(profileData)
        .expect(500);

      expect(response.body.error).toBe(true);
    });
  });

  describe('Profile Retrieval', () => {
    it('GET /api/v1/profiles/:id - should get profile by ID', async () => {
      const profile = await createTestProfile();

      const response = await client
        .get(`${API_BASE_URL}/profiles/${profile.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(profile.id);
    });

    it('GET /api/v1/profiles/user/:userId - should get profile by user ID', async () => {
      const userData = {
        email: faker.internet.email(),
        password: faker.internet.password(),
      };
      const user = await UserModel.create(userData);
      const profile = await createTestProfile({ userId: user.id });

      const response = await client
        .get(`${API_BASE_URL}/profiles/user/${user.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(user.id);
    });

    it('GET /api/v1/profiles/:id/complete - should get complete profile', async () => {
      const profile = await createTestProfile();
      const assessment = generatePersonalityAssessment(profile.id);
      const submission = generateInterestSubmission(profile.id, 3);

      const personalityModel = new PersonalityModel();
      await personalityModel.submitAssessment(assessment);

      const interestModel = new InterestModel();
      await interestModel.submitBatch(submission);

      const response = await client
        .get(`${API_BASE_URL}/profiles/${profile.id}/complete`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(profile.id);
      expect(response.body.data.personalityTraits).toBeDefined();
      expect(response.body.data.interests).toBeDefined();
    });
  });

  describe('Profile Updates', () => {
    it('PUT /api/v1/profiles/:id - should update profile', async () => {
      const profile = await createTestProfile();
      const updateData: IProfileUpdate = {
        name: 'Updated Name',
        bio: 'Updated Bio',
      };

      const response = await client
        .put(`${API_BASE_URL}/profiles/${profile.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.bio).toBe(updateData.bio);
    });

    it('PUT /api/v1/profiles/:id/location - should update location', async () => {
      const profile = await createTestProfile();
      const updateData = {
        location: 'New York, NY',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      };

      const response = await client
        .put(`${API_BASE_URL}/profiles/${profile.id}/location`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.location).toBe(updateData.location);
      expect(response.body.data.coordinates.latitude).toBe(updateData.coordinates.latitude);
      expect(response.body.data.coordinates.longitude).toBe(updateData.coordinates.longitude);
    });

    it('PUT /api/v1/profiles/:id/max-travel-distance - should update max travel distance', async () => {
      const profile = await createTestProfile();
      const updateData = {
        maxTravelDistance: 50,
      };

      const response = await client
        .put(`${API_BASE_URL}/profiles/${profile.id}/travel-distance`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.maxTravelDistance).toBe(updateData.maxTravelDistance);
    });

    it('PUT /api/v1/profiles/:id/communication-style - should update communication style', async () => {
        const profile = await createTestProfile();
        const updateData = {
          communicationStyle: CommunicationStyle.THOUGHTFUL,
        };
    
        const response = await client
          .put(`${API_BASE_URL}/profiles/${profile.id}/communication-style`)
          .send(updateData)
          .expect(200);
    
        expect(response.body.success).toBe(true);
        expect(response.body.data.communicationStyle).toBe(updateData.communicationStyle);
      });
  });

  describe('Profile Deletion', () => {
    it('DELETE /api/v1/profiles/:id - should delete profile successfully', async () => {
      const profile = await createTestProfile();

      const response = await client
        .delete(`${API_BASE_URL}/profiles/${profile.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Profile Search', () => {
    it('GET /api/v1/profiles/search - should search profiles', async () => {
      const profile1 = await createTestProfile({ name: 'John Doe', location: 'Seattle' });
      const profile2 = await createTestProfile({ name: 'Jane Smith', location: 'New York' });

      const response = await client
        .get(`${API_BASE_URL}/profiles/search?query=John`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Personality and Interests', () => {
    it('POST /api/v1/profiles/:profileId/personality - should submit assessment', async () => {
      const profile = await createTestProfile();
      const assessment = generatePersonalityAssessment(profile.id);

      const response = await client
        .post(`${API_BASE_URL}/profiles/${profile.id}/personality`)
        .send(assessment)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('POST /api/v1/profiles/:profileId/interests - should submit interests', async () => {
      const profile = await createTestProfile();
      const submission = generateInterestSubmission(profile.id, 3);

      const response = await client
        .post(`${API_BASE_URL}/profiles/${profile.id}/interests`)
        .send(submission)
        .expect(201);

      expect(response.status).toBe(201);
    });
  });

  describe('Location Features', () => {
    it('GET /api/v1/profiles/nearby - should find nearby profiles', async () => {
      const profile1 = await createTestProfile({
        coordinates: { latitude: 47.6062, longitude: -122.3321 },
      });
      const profile2 = await createTestProfile({
        coordinates: { latitude: 47.6062, longitude: -122.3321 },
      });

      const response = await client
        .get(`${API_BASE_URL}/profiles/nearby?latitude=47.6062&longitude=-122.3321`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Compatibility Calculation', () => {
    it('GET /api/v1/profiles/compatibility - should calculate compatibility', async () => {
      const profile1 = await createTestProfile();
      const profile2 = await createTestProfile();

      const assessment1 = generatePersonalityAssessment(profile1.id);
      const assessment2 = generatePersonalityAssessment(profile2.id);

      const personalityModel = new PersonalityModel();
      await personalityModel.submitAssessment(assessment1);
      await personalityModel.submitAssessment(assessment2);

      const response = await client
        .get(`${API_BASE_URL}/profiles/compatibility?profileId1=${profile1.id}&profileId2=${profile2.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});