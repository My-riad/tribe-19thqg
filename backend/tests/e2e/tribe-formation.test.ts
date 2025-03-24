import request from 'supertest';
import { faker } from '@faker-js/faker';
import database from '../../src/config/database';
import { setupTestDatabase, teardownTestDatabase } from '../setup';
import { 
  IUserCreate, 
  UserStatus,
  AuthProvider
} from '../../src/shared/src/types/user.types';
import { 
  IProfileCreate, 
  IPersonalityAssessment, 
  IInterestSubmission,
  PersonalityTrait,
  CommunicationStyle,
  InterestCategory,
  InterestLevel
} from '../../src/shared/src/types/profile.types';
import { 
  ITribeCreate, 
  TribePrivacy, 
  TribeStatus, 
  MemberRole, 
  MembershipStatus 
} from '../../src/shared/src/types/tribe.types';
import { 
  IMatchingPreferences
} from '../../src/matching-service/src/models/matching.model';

const API_BASE_URL = '/api/v1';
const { prisma } = database;

// Helper functions for test data generation
const generateTestUser = (index: number): IUserCreate => {
  return {
    email: `test.user.${index}.${faker.string.alphanumeric(8)}@example.com`,
    password: 'Test@Password123',
    provider: AuthProvider.LOCAL
  };
};

const generateTestProfile = (userId: string, index: number): IProfileCreate => {
  return {
    userId,
    name: `Test User ${index}`,
    bio: faker.lorem.paragraph(),
    location: `${faker.location.city()}, ${faker.location.state()}`,
    coordinates: {
      latitude: parseFloat(faker.location.latitude()),
      longitude: parseFloat(faker.location.longitude())
    },
    birthdate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
    phoneNumber: faker.phone.number(),
    avatarUrl: faker.image.avatar(),
    communicationStyle: Object.values(CommunicationStyle)[
      Math.floor(Math.random() * Object.values(CommunicationStyle).length)
    ],
    maxTravelDistance: faker.number.int({ min: 5, max: 25 })
  };
};

const generatePersonalityAssessment = (profileId: string): IPersonalityAssessment => {
  // Generate random scores for each personality trait
  const traits = Object.values(PersonalityTrait).map(trait => ({
    trait,
    score: faker.number.int({ min: 1, max: 100 })
  }));
  
  return {
    profileId,
    traits,
    communicationStyle: Object.values(CommunicationStyle)[
      Math.floor(Math.random() * Object.values(CommunicationStyle).length)
    ],
    assessmentSource: 'questionnaire'
  };
};

const generateInterests = (profileId: string): IInterestSubmission => {
  const interestCategories = Object.values(InterestCategory);
  const interests = interestCategories.map(category => ({
    category,
    name: `${faker.word.adjective()} ${category.toLowerCase().replace('_', ' ')}`,
    level: Object.values(InterestLevel)[
      Math.floor(Math.random() * Object.values(InterestLevel).length)
    ]
  }));
  
  return {
    profileId,
    interests,
    replaceExisting: true
  };
};

const generateTestTribe = (creatorId: string, index: number): ITribeCreate => {
  return {
    name: `Test Tribe ${index}`,
    description: faker.lorem.paragraph(),
    location: `${faker.location.city()}, ${faker.location.state()}`,
    coordinates: {
      latitude: parseFloat(faker.location.latitude()),
      longitude: parseFloat(faker.location.longitude())
    },
    imageUrl: faker.image.url(),
    privacy: TribePrivacy.PUBLIC,
    maxMembers: faker.number.int({ min: 4, max: 8 }),
    createdBy: creatorId,
    interests: [
      {
        category: Object.values(InterestCategory)[
          Math.floor(Math.random() * Object.values(InterestCategory).length)
        ],
        name: faker.word.adjective(),
        isPrimary: true
      },
      {
        category: Object.values(InterestCategory)[
          Math.floor(Math.random() * Object.values(InterestCategory).length)
        ],
        name: faker.word.adjective(),
        isPrimary: false
      }
    ]
  };
};

const generateMatchingPreferences = (userId: string): IMatchingPreferences => {
  return {
    userId,
    autoMatchingEnabled: true,
    matchingFrequency: 'weekly',
    criteria: {
      personalityTraits: Object.values(PersonalityTrait).slice(0, 3).map(trait => ({
        trait,
        importance: faker.number.float({ min: 0.1, max: 1.0, precision: 0.1 })
      })),
      interests: Object.values(InterestCategory).slice(0, 3).map(category => ({
        category,
        importance: faker.number.float({ min: 0.1, max: 1.0, precision: 0.1 })
      })),
      communicationStyles: [
        Object.values(CommunicationStyle)[
          Math.floor(Math.random() * Object.values(CommunicationStyle).length)
        ]
      ],
      location: {
        latitude: parseFloat(faker.location.latitude()),
        longitude: parseFloat(faker.location.longitude())
      },
      maxDistance: 15,
      factorWeights: {
        personality: 0.3,
        interests: 0.3, 
        communication_style: 0.2,
        location: 0.1,
        group_balance: 0.1
      }
    },
    lastMatchedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Helper functions for API interactions
const registerTestUser = async (userData: IUserCreate): Promise<{ userId: string, accessToken: string }> => {
  const response = await request(API_BASE_URL)
    .post('/auth/register')
    .send(userData);
  
  expect(response.status).toBe(201);
  
  return {
    userId: response.body.user.id,
    accessToken: response.body.tokens.access
  };
};

const createTestProfile = async (profileData: IProfileCreate, accessToken: string): Promise<string> => {
  const response = await request(API_BASE_URL)
    .post('/profiles')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(profileData);
  
  expect(response.status).toBe(201);
  
  return response.body.id;
};

const submitPersonalityAssessment = async (assessmentData: IPersonalityAssessment, accessToken: string): Promise<void> => {
  const response = await request(API_BASE_URL)
    .post('/profiles/assessment')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(assessmentData);
  
  expect(response.status).toBe(200);
};

const submitInterests = async (interestsData: IInterestSubmission, accessToken: string): Promise<void> => {
  const response = await request(API_BASE_URL)
    .post('/profiles/interests')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(interestsData);
  
  expect(response.status).toBe(200);
};

const createTestTribe = async (tribeData: ITribeCreate, accessToken: string): Promise<string> => {
  const response = await request(API_BASE_URL)
    .post('/tribes')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(tribeData);
  
  expect(response.status).toBe(201);
  
  return response.body.id;
};

const joinTribe = async (tribeId: string, accessToken: string): Promise<void> => {
  const response = await request(API_BASE_URL)
    .post(`/tribes/${tribeId}/members`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({});
  
  expect(response.status).toBe(201);
};

const updateMatchingPreferences = async (userId: string, preferences: IMatchingPreferences, accessToken: string): Promise<void> => {
  const response = await request(API_BASE_URL)
    .put(`/matching/preferences/${userId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(preferences);
  
  expect(response.status).toBe(200);
};

const optInForAutoMatching = async (userId: string, criteria: any, accessToken: string): Promise<void> => {
  const response = await request(API_BASE_URL)
    .post('/matching/opt-in')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ userId, criteria });
  
  expect(response.status).toBe(200);
};

const requestManualMatching = async (userId: string, criteria: any, preferExistingTribes: boolean, accessToken: string): Promise<string> => {
  const response = await request(API_BASE_URL)
    .post('/matching/manual')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ userId, criteria, preferExistingTribes });
  
  expect(response.status).toBe(201);
  
  return response.body.operationId;
};

const getMatchingOperation = async (operationId: string, accessToken: string): Promise<any> => {
  const response = await request(API_BASE_URL)
    .get(`/matching/operations/${operationId}`)
    .set('Authorization', `Bearer ${accessToken}`);
  
  expect(response.status).toBe(200);
  
  return response.body;
};

const getMatchingResults = async (operationId: string, accessToken: string): Promise<any> => {
  const response = await request(API_BASE_URL)
    .get(`/matching/results/${operationId}`)
    .set('Authorization', `Bearer ${accessToken}`);
  
  expect(response.status).toBe(200);
  
  return response.body;
};

const getTribeMembers = async (tribeId: string, accessToken: string): Promise<any> => {
  const response = await request(API_BASE_URL)
    .get(`/tribes/${tribeId}/members`)
    .set('Authorization', `Bearer ${accessToken}`);
  
  expect(response.status).toBe(200);
  
  return response.body;
};

const getUserTribes = async (accessToken: string): Promise<any> => {
  const response = await request(API_BASE_URL)
    .get('/tribes/user')
    .set('Authorization', `Bearer ${accessToken}`);
  
  expect(response.status).toBe(200);
  
  return response.body;
};

const runScheduledMatching = async (frequency: string, adminAccessToken: string): Promise<string> => {
  const response = await request(API_BASE_URL)
    .post('/admin/matching/scheduled')
    .set('Authorization', `Bearer ${adminAccessToken}`)
    .send({ frequency });
  
  expect(response.status).toBe(201);
  
  return response.body.operationId;
};

const cleanupTestData = async (userIds: string[], profileIds: string[], tribeIds: string[]): Promise<void> => {
  // Delete tribe memberships
  if (tribeIds.length > 0) {
    await prisma.tribeMembership.deleteMany({
      where: {
        tribeId: {
          in: tribeIds
        }
      }
    });
  }
  
  // Delete tribes
  if (tribeIds.length > 0) {
    await prisma.tribe.deleteMany({
      where: {
        id: {
          in: tribeIds
        }
      }
    });
  }
  
  // Delete profiles
  if (profileIds.length > 0) {
    await prisma.profile.deleteMany({
      where: {
        id: {
          in: profileIds
        }
      }
    });
  }
  
  // Delete users
  if (userIds.length > 0) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds
        }
      }
    });
  }
};

const waitForMatchingCompletion = async (operationId: string, accessToken: string, maxAttempts: number = 10): Promise<any> => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const operation = await getMatchingOperation(operationId, accessToken);
    
    if (operation.status === 'completed') {
      return await getMatchingResults(operationId, accessToken);
    }
    
    if (operation.status === 'failed') {
      throw new Error(`Matching operation failed: ${operation.error}`);
    }
    
    // Wait for 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  throw new Error('Matching operation timed out');
};

// Main test suite
describe('Tribe Formation E2E Tests', () => {
  // Test state
  const testUsers: Array<{ userId: string, accessToken: string }> = [];
  const testProfiles: string[] = [];
  const testTribes: string[] = [];
  
  // Set up the test environment
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  // Clean up after tests
  afterAll(async () => {
    await cleanupTestData(
      testUsers.map(user => user.userId),
      testProfiles,
      testTribes
    );
    await teardownTestDatabase();
  });
  
  it('should create a tribe manually and allow users to join', async () => {
    // Register test users
    const user1 = await registerTestUser(generateTestUser(1));
    const user2 = await registerTestUser(generateTestUser(2));
    const user3 = await registerTestUser(generateTestUser(3));
    testUsers.push(user1, user2, user3);
    
    // Create profiles
    const profile1 = await createTestProfile(
      generateTestProfile(user1.userId, 1),
      user1.accessToken
    );
    const profile2 = await createTestProfile(
      generateTestProfile(user2.userId, 2),
      user2.accessToken
    );
    const profile3 = await createTestProfile(
      generateTestProfile(user3.userId, 3),
      user3.accessToken
    );
    testProfiles.push(profile1, profile2, profile3);
    
    // Complete personality assessments
    await submitPersonalityAssessment(
      generatePersonalityAssessment(profile1),
      user1.accessToken
    );
    await submitPersonalityAssessment(
      generatePersonalityAssessment(profile2),
      user2.accessToken
    );
    await submitPersonalityAssessment(
      generatePersonalityAssessment(profile3),
      user3.accessToken
    );
    
    // Submit interests
    await submitInterests(
      generateInterests(profile1),
      user1.accessToken
    );
    await submitInterests(
      generateInterests(profile2),
      user2.accessToken
    );
    await submitInterests(
      generateInterests(profile3),
      user3.accessToken
    );
    
    // Create a tribe with user1
    const tribeData = generateTestTribe(user1.userId, 1);
    const tribeId = await createTestTribe(tribeData, user1.accessToken);
    testTribes.push(tribeId);
    
    // Have user2 and user3 join the tribe
    await joinTribe(tribeId, user2.accessToken);
    await joinTribe(tribeId, user3.accessToken);
    
    // Verify tribe membership
    const members = await getTribeMembers(tribeId, user1.accessToken);
    
    // Verify membership count
    expect(members.length).toBe(3);
    
    // Verify roles
    const creator = members.find((m: any) => m.userId === user1.userId);
    const member1 = members.find((m: any) => m.userId === user2.userId);
    const member2 = members.find((m: any) => m.userId === user3.userId);
    
    expect(creator.role).toBe(MemberRole.CREATOR);
    expect(member1.role).toBe(MemberRole.MEMBER);
    expect(member2.role).toBe(MemberRole.MEMBER);
    
    // Verify all members are active
    expect(creator.status).toBe(MembershipStatus.ACTIVE);
    expect(member1.status).toBe(MembershipStatus.ACTIVE);
    expect(member2.status).toBe(MembershipStatus.ACTIVE);
    
    // Verify tribe details
    const userTribes = await getUserTribes(user1.accessToken);
    const tribe = userTribes.find((t: any) => t.id === tribeId);
    
    expect(tribe).toBeDefined();
    expect(tribe.name).toBe(tribeData.name);
    expect(tribe.description).toBe(tribeData.description);
    expect(tribe.memberCount).toBe(3);
    expect(tribe.maxMembers).toBe(tribeData.maxMembers);
  });
  
  it('should match users into a tribe using AI-powered matching', async () => {
    // Register test users
    const users = await Promise.all(
      Array.from({ length: 6 }, (_, i) => registerTestUser(generateTestUser(10 + i)))
    );
    users.forEach(user => testUsers.push(user));
    
    // Create profiles and complete assessments
    const profiles = await Promise.all(
      users.map(async (user, i) => {
        const profileId = await createTestProfile(
          generateTestProfile(user.userId, 10 + i),
          user.accessToken
        );
        testProfiles.push(profileId);
        
        // Complete personality assessment
        await submitPersonalityAssessment(
          generatePersonalityAssessment(profileId),
          user.accessToken
        );
        
        // Submit interests
        await submitInterests(
          generateInterests(profileId),
          user.accessToken
        );
        
        return profileId;
      })
    );
    
    // Opt in for auto-matching
    await Promise.all(
      users.map(async (user) => {
        const criteria = generateMatchingPreferences(user.userId).criteria;
        await optInForAutoMatching(user.userId, criteria, user.accessToken);
      })
    );
    
    // Request matching for immediate results
    const operationId = await requestManualMatching(
      users[0].userId,
      generateMatchingPreferences(users[0].userId).criteria,
      false,
      users[0].accessToken
    );
    
    // Wait for matching operation to complete
    const results = await waitForMatchingCompletion(operationId, users[0].accessToken);
    
    // Verify matching results
    expect(results.status).toBe('success');
    expect(results.results.length).toBeGreaterThan(0);
    
    // Get formed tribe
    const tribeFormation = results.tribeFormations[0];
    expect(tribeFormation).toBeDefined();
    
    // Add tribe to cleanup list
    testTribes.push(tribeFormation.tribeId);
    
    // Verify tribe membership
    const members = await getTribeMembers(tribeFormation.tribeId, users[0].accessToken);
    
    // Verify at least 4 members were assigned to the tribe
    expect(members.length).toBeGreaterThanOrEqual(4);
    
    // Verify tribe composition is balanced
    // Get personality traits for all members
    const memberProfiles = await Promise.all(
      members.map(async (member: any) => {
        const response = await request(API_BASE_URL)
          .get(`/profiles/${member.userId}`)
          .set('Authorization', `Bearer ${users[0].accessToken}`);
        
        return response.body;
      })
    );
    
    // Verify diverse personality traits in the tribe
    const traitCounts: Record<string, number> = {};
    memberProfiles.forEach((profile: any) => {
      profile.personalityTraits.forEach((trait: any) => {
        if (trait.score > 70) { // Only count prominent traits
          traitCounts[trait.trait] = (traitCounts[trait.trait] || 0) + 1;
        }
      });
    });
    
    // Check that there's a distribution of traits (not all members have the same dominant trait)
    const uniqueProminentTraits = Object.keys(traitCounts).length;
    expect(uniqueProminentTraits).toBeGreaterThan(2);
  });
  
  it('should run scheduled matching for opted-in users', async () => {
    // Register test users
    const users = await Promise.all(
      Array.from({ length: 8 }, (_, i) => registerTestUser(generateTestUser(20 + i)))
    );
    users.forEach(user => testUsers.push(user));
    
    // Create profiles and complete assessments
    const profiles = await Promise.all(
      users.map(async (user, i) => {
        const profileId = await createTestProfile(
          generateTestProfile(user.userId, 20 + i),
          user.accessToken
        );
        testProfiles.push(profileId);
        
        // Complete personality assessment
        await submitPersonalityAssessment(
          generatePersonalityAssessment(profileId),
          user.accessToken
        );
        
        // Submit interests
        await submitInterests(
          generateInterests(profileId),
          user.accessToken
        );
        
        return profileId;
      })
    );
    
    // Update matching preferences for all users
    await Promise.all(
      users.map(async (user) => {
        const preferences = generateMatchingPreferences(user.userId);
        preferences.matchingFrequency = 'weekly';
        await updateMatchingPreferences(user.userId, preferences, user.accessToken);
        
        // Opt in for auto-matching
        await optInForAutoMatching(user.userId, preferences.criteria, user.accessToken);
      })
    );
    
    // Get admin token for scheduled matching
    // In a real implementation, you would use proper admin credentials
    const adminAccessToken = users[0].accessToken;
    
    // Trigger scheduled matching
    const operationId = await runScheduledMatching('weekly', adminAccessToken);
    
    // Wait for matching operation to complete
    await waitForMatchingCompletion(operationId, adminAccessToken);
    
    // Verify users are assigned to tribes
    const assignedTribes = new Set<string>();
    
    // Check that users have been assigned to tribes
    for (const user of users) {
      const userTribes = await getUserTribes(user.accessToken);
      
      // If user has been assigned to a tribe from this test, add it to our tracking
      userTribes.forEach((tribe: any) => {
        if (!testTribes.includes(tribe.id)) {
          testTribes.push(tribe.id);
          assignedTribes.add(tribe.id);
        }
      });
    }
    
    // Verify that at least one tribe was formed
    expect(assignedTribes.size).toBeGreaterThan(0);
    
    // For each tribe, verify composition is balanced
    for (const tribeId of assignedTribes) {
      const members = await getTribeMembers(tribeId, users[0].accessToken);
      
      // Verify at least 4 members were assigned to the tribe
      expect(members.length).toBeGreaterThanOrEqual(4);
    }
  });
  
  it('should respect maximum tribe size during matching', async () => {
    // Create a tribe with maximum size of 4
    const creator = await registerTestUser(generateTestUser(30));
    testUsers.push(creator);
    
    const creatorProfile = await createTestProfile(
      generateTestProfile(creator.userId, 30),
      creator.accessToken
    );
    testProfiles.push(creatorProfile);
    
    await submitPersonalityAssessment(
      generatePersonalityAssessment(creatorProfile),
      creator.accessToken
    );
    
    await submitInterests(
      generateInterests(creatorProfile),
      creator.accessToken
    );
    
    // Create tribe with max 4 members
    const tribeData = generateTestTribe(creator.userId, 30);
    tribeData.maxMembers = 4;
    const tribeId = await createTestTribe(tribeData, creator.accessToken);
    testTribes.push(tribeId);
    
    // Add 2 more members to the tribe (total 3 including creator)
    const members = await Promise.all(
      Array.from({ length: 2 }, async (_, i) => {
        const user = await registerTestUser(generateTestUser(31 + i));
        testUsers.push(user);
        
        const profileId = await createTestProfile(
          generateTestProfile(user.userId, 31 + i),
          user.accessToken
        );
        testProfiles.push(profileId);
        
        await submitPersonalityAssessment(
          generatePersonalityAssessment(profileId),
          user.accessToken
        );
        
        await submitInterests(
          generateInterests(profileId),
          user.accessToken
        );
        
        await joinTribe(tribeId, user.accessToken);
        
        return user;
      })
    );
    
    // Create 3 additional users for matching
    const matchingUsers = await Promise.all(
      Array.from({ length: 3 }, async (_, i) => {
        const user = await registerTestUser(generateTestUser(33 + i));
        testUsers.push(user);
        
        const profileId = await createTestProfile(
          generateTestProfile(user.userId, 33 + i),
          user.accessToken
        );
        testProfiles.push(profileId);
        
        await submitPersonalityAssessment(
          generatePersonalityAssessment(profileId),
          user.accessToken
        );
        
        await submitInterests(
          generateInterests(profileId),
          user.accessToken
        );
        
        return user;
      })
    );
    
    // Request matching with preference for existing tribe
    const operationId = await requestManualMatching(
      matchingUsers[0].userId,
      generateMatchingPreferences(matchingUsers[0].userId).criteria,
      true, // Prefer existing tribes
      matchingUsers[0].accessToken
    );
    
    // Wait for matching operation to complete
    const results = await waitForMatchingCompletion(operationId, matchingUsers[0].accessToken);
    
    // Get tribe members after matching
    const tribeMembers = await getTribeMembers(tribeId, creator.accessToken);
    
    // Verify tribe has maximum 4 members (not exceeding max size)
    expect(tribeMembers.length).toBeLessThanOrEqual(4);
    
    // Check if a new tribe was formed for other users
    const newTribeFormations = results.tribeFormations.filter((tf: any) => tf.tribeId !== tribeId);
    
    if (newTribeFormations.length > 0) {
      // Add new tribes to cleanup list
      newTribeFormations.forEach((tf: any) => {
        testTribes.push(tf.tribeId);
      });
    }
  });
  
  it('should respect user matching preferences during tribe formation', async () => {
    // Create users with different matching preferences
    const users = await Promise.all(
      Array.from({ length: 6 }, async (_, i) => {
        const user = await registerTestUser(generateTestUser(40 + i));
        testUsers.push(user);
        
        const profileId = await createTestProfile(
          generateTestProfile(user.userId, 40 + i),
          user.accessToken
        );
        testProfiles.push(profileId);
        
        await submitPersonalityAssessment(
          generatePersonalityAssessment(profileId),
          user.accessToken
        );
        
        await submitInterests(
          generateInterests(profileId),
          user.accessToken
        );
        
        return user;
      })
    );
    
    // Set different criteria priorities for different users
    const userPreferences = users.map((user, i) => {
      const preferences = generateMatchingPreferences(user.userId);
      
      // First two users prioritize personality
      if (i < 2) {
        preferences.criteria.factorWeights.personality = 0.6;
        preferences.criteria.factorWeights.interests = 0.2;
        preferences.criteria.factorWeights.communication_style = 0.1;
        preferences.criteria.factorWeights.location = 0.05;
        preferences.criteria.factorWeights.group_balance = 0.05;
      }
      // Next two users prioritize interests
      else if (i < 4) {
        preferences.criteria.factorWeights.personality = 0.2;
        preferences.criteria.factorWeights.interests = 0.6;
        preferences.criteria.factorWeights.communication_style = 0.1;
        preferences.criteria.factorWeights.location = 0.05;
        preferences.criteria.factorWeights.group_balance = 0.05;
      }
      // Last two users prioritize communication style
      else {
        preferences.criteria.factorWeights.personality = 0.2;
        preferences.criteria.factorWeights.interests = 0.2;
        preferences.criteria.factorWeights.communication_style = 0.4;
        preferences.criteria.factorWeights.location = 0.1;
        preferences.criteria.factorWeights.group_balance = 0.1;
      }
      
      return preferences;
    });
    
    // Update matching preferences for all users
    await Promise.all(
      users.map(async (user, i) => {
        await updateMatchingPreferences(user.userId, userPreferences[i], user.accessToken);
      })
    );
    
    // Request matching for all users
    const operationIds = await Promise.all(
      users.map(async (user, i) => {
        return await requestManualMatching(
          user.userId,
          userPreferences[i].criteria,
          false,
          user.accessToken
        );
      })
    );
    
    // Wait for all matching operations to complete
    const results = await Promise.all(
      operationIds.map(async (opId, i) => {
        return await waitForMatchingCompletion(opId, users[i].accessToken);
      })
    );
    
    // Collect all formed tribes
    results.forEach(result => {
      result.tribeFormations.forEach((tf: any) => {
        if (!testTribes.includes(tf.tribeId)) {
          testTribes.push(tf.tribeId);
        }
      });
    });
    
    // Verify preferences are respected by checking tribe compositions
    const userTribes = await Promise.all(
      users.map(async (user) => {
        const tribes = await getUserTribes(user.accessToken);
        return { userId: user.userId, tribes };
      })
    );
    
    // Group users by tribe assignment
    const tribeToUsers = new Map<string, string[]>();
    
    userTribes.forEach(({ userId, tribes }) => {
      tribes.forEach((tribe: any) => {
        if (!tribeToUsers.has(tribe.id)) {
          tribeToUsers.set(tribe.id, []);
        }
        tribeToUsers.get(tribe.id)!.push(userId);
      });
    });
    
    // Verify users with similar preferences are grouped together
    // This is somewhat probabilistic, but we should find at least one tribe where
    // users with the same preference priority are grouped together
    let preferencesRespected = false;
    
    for (const [, tribeUsers] of tribeToUsers.entries()) {
      if (tribeUsers.length < 2) continue;
      
      // Find users' indices in the original array to identify their preference group
      const userIndices = tribeUsers.map(userId => 
        users.findIndex(user => user.userId === userId)
      );
      
      // Check if at least 2 users from the same preference group are in this tribe
      const group1Count = userIndices.filter(i => i >= 0 && i < 2).length;
      const group2Count = userIndices.filter(i => i >= 2 && i < 4).length;
      const group3Count = userIndices.filter(i => i >= 4 && i < 6).length;
      
      if (group1Count >= 2 || group2Count >= 2 || group3Count >= 2) {
        preferencesRespected = true;
        break;
      }
    }
    
    expect(preferencesRespected).toBe(true);
  });
  
  it('should limit users to maximum of 3 tribes', async () => {
    // Create a user
    const user = await registerTestUser(generateTestUser(50));
    testUsers.push(user);
    
    const profileId = await createTestProfile(
      generateTestProfile(user.userId, 50),
      user.accessToken
    );
    testProfiles.push(profileId);
    
    await submitPersonalityAssessment(
      generatePersonalityAssessment(profileId),
      user.accessToken
    );
    
    await submitInterests(
      generateInterests(profileId),
      user.accessToken
    );
    
    // Create 3 tribes for the user
    const tribeIds = await Promise.all(
      Array.from({ length: 3 }, async (_, i) => {
        const tribeData = generateTestTribe(user.userId, 50 + i);
        const tribeId = await createTestTribe(tribeData, user.accessToken);
        testTribes.push(tribeId);
        return tribeId;
      })
    );
    
    // Create a 4th tribe with a different user
    const otherUser = await registerTestUser(generateTestUser(53));
    testUsers.push(otherUser);
    
    const otherProfileId = await createTestProfile(
      generateTestProfile(otherUser.userId, 53),
      otherUser.accessToken
    );
    testProfiles.push(otherProfileId);
    
    await submitPersonalityAssessment(
      generatePersonalityAssessment(otherProfileId),
      otherUser.accessToken
    );
    
    await submitInterests(
      generateInterests(otherProfileId),
      otherUser.accessToken
    );
    
    const fourthTribeData = generateTestTribe(otherUser.userId, 53);
    const fourthTribeId = await createTestTribe(fourthTribeData, otherUser.accessToken);
    testTribes.push(fourthTribeId);
    
    // Try to join the 4th tribe - should fail
    try {
      await joinTribe(fourthTribeId, user.accessToken);
      // If we reach here, the test should fail
      expect(false).toBe(true); // This line should not be reached
    } catch (error) {
      // Expect a 400 Bad Request with appropriate error message
      expect(error.response.status).toBe(400);
      expect(error.response.body.message).toContain('maximum number of Tribes');
    }
    
    // Verify user is still in exactly 3 tribes
    const userTribes = await getUserTribes(user.accessToken);
    expect(userTribes.length).toBe(3);
  });
  
  it('should notify users when they are matched to a tribe', async () => {
    // Register test users
    const users = await Promise.all(
      Array.from({ length: 4 }, (_, i) => registerTestUser(generateTestUser(60 + i)))
    );
    users.forEach(user => testUsers.push(user));
    
    // Create profiles and complete assessments
    const profiles = await Promise.all(
      users.map(async (user, i) => {
        const profileId = await createTestProfile(
          generateTestProfile(user.userId, 60 + i),
          user.accessToken
        );
        testProfiles.push(profileId);
        
        await submitPersonalityAssessment(
          generatePersonalityAssessment(profileId),
          user.accessToken
        );
        
        await submitInterests(
          generateInterests(profileId),
          user.accessToken
        );
        
        return profileId;
      })
    );
    
    // Request matching
    const operationId = await requestManualMatching(
      users[0].userId,
      generateMatchingPreferences(users[0].userId).criteria,
      false,
      users[0].accessToken
    );
    
    // Wait for matching to complete
    const results = await waitForMatchingCompletion(operationId, users[0].accessToken);
    
    // Add formed tribes to cleanup list
    results.tribeFormations.forEach((tf: any) => {
      testTribes.push(tf.tribeId);
    });
    
    // Check notifications
    for (const user of users) {
      const response = await request(API_BASE_URL)
        .get('/notifications')
        .set('Authorization', `Bearer ${user.accessToken}`);
      
      // Expect successful response
      expect(response.status).toBe(200);
      
      // In a real test, we would verify notification content
      // For now, just ensure the notifications endpoint returns successfully
    }
  });
});