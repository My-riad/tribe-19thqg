import supertest from 'supertest';
import { faker } from '@faker-js/faker'; // ^8.0.2
import dayjs from 'dayjs'; // ^1.11.7
import nock from 'nock'; // ^13.3.1

import prisma from '../../src/config/database';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  setupMockExternalAPIs 
} from '../setup';

import { 
  IUserCreate, 
  IUserCredentials, 
  UserStatus, 
  UserRole,
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
  IEventCreate, 
  EventStatus, 
  EventType, 
  EventVisibility, 
  RSVPStatus 
} from '../../src/shared/src/types/event.types';

import { IMatchingPreferences } from '../../src/matching-service/src/models/matching.model';
import { 
  IPlanningSessionCreate, 
  IEventPlanFinalize, 
  PlanningStatus 
} from '../../src/planning-service/src/models/planning.model';

// Global constants
const API_BASE_URL = '/api/v1';
const TEST_TIMEOUT = 60000; // 60 seconds for long-running tests

// Create a supertest request object
const request = supertest(process.env.TEST_API_URL || 'http://localhost:3000');

/**
 * Creates a test user with random data for testing
 * @param index Number to ensure unique data
 * @returns Test user data
 */
function generateTestUser(index: number): IUserCreate {
  const email = `test.user${index}@tribe-test.com`;
  return {
    email,
    password: 'TestPassword123!',
    provider: AuthProvider.LOCAL
  };
}

/**
 * Creates a test profile with random data for testing
 * @param userId The ID of the user the profile belongs to
 * @param index Number to ensure unique data
 * @returns Test profile data
 */
function generateTestProfile(userId: string, index: number): IProfileCreate {
  return {
    userId,
    name: `Test User ${index}`,
    bio: faker.lorem.paragraph(),
    location: `${faker.location.city()}, ${faker.location.state()}`,
    coordinates: {
      latitude: parseFloat(faker.location.latitude()),
      longitude: parseFloat(faker.location.longitude())
    },
    birthdate: dayjs().subtract(20 + index, 'year').toDate(),
    phoneNumber: faker.phone.number(),
    avatarUrl: faker.image.avatar(),
    communicationStyle: CommunicationStyle.DIRECT,
    maxTravelDistance: 15
  };
}

/**
 * Creates a personality assessment with random trait scores
 * @param profileId The ID of the profile the assessment belongs to
 * @returns Test personality assessment data
 */
function generatePersonalityAssessment(profileId: string): IPersonalityAssessment {
  return {
    profileId,
    traits: [
      {
        trait: PersonalityTrait.OPENNESS,
        score: faker.number.int({ min: 50, max: 95 })
      },
      {
        trait: PersonalityTrait.CONSCIENTIOUSNESS,
        score: faker.number.int({ min: 50, max: 95 })
      },
      {
        trait: PersonalityTrait.EXTRAVERSION,
        score: faker.number.int({ min: 50, max: 95 })
      },
      {
        trait: PersonalityTrait.AGREEABLENESS,
        score: faker.number.int({ min: 50, max: 95 })
      },
      {
        trait: PersonalityTrait.NEUROTICISM,
        score: faker.number.int({ min: 50, max: 95 })
      }
    ],
    communicationStyle: CommunicationStyle.DIRECT,
    assessmentSource: 'questionnaire'
  };
}

/**
 * Creates a set of interests for a user profile
 * @param profileId The ID of the profile the interests belong to
 * @returns Test interests data
 */
function generateInterests(profileId: string): IInterestSubmission {
  return {
    profileId,
    interests: [
      {
        category: InterestCategory.OUTDOOR_ADVENTURES,
        name: 'Hiking',
        level: InterestLevel.HIGH
      },
      {
        category: InterestCategory.ARTS_CULTURE,
        name: 'Museums',
        level: InterestLevel.MEDIUM
      },
      {
        category: InterestCategory.FOOD_DINING,
        name: 'Restaurants',
        level: InterestLevel.HIGH
      },
      {
        category: InterestCategory.SPORTS_FITNESS,
        name: 'Running',
        level: InterestLevel.MEDIUM
      },
      {
        category: InterestCategory.GAMES_ENTERTAINMENT,
        name: 'Board Games',
        level: InterestLevel.HIGH
      }
    ],
    replaceExisting: true
  };
}

/**
 * Creates matching preferences for a user
 * @param userId The ID of the user the preferences belong to
 * @returns Test matching preferences
 */
function generateMatchingPreferences(userId: string): IMatchingPreferences {
  return {
    userId,
    autoMatchingEnabled: true,
    matchingFrequency: 'weekly',
    criteria: {
      personalityTraits: [
        { trait: PersonalityTrait.OPENNESS, importance: 0.7 },
        { trait: PersonalityTrait.EXTRAVERSION, importance: 0.5 }
      ],
      interests: [
        { category: InterestCategory.OUTDOOR_ADVENTURES, importance: 0.8 },
        { category: InterestCategory.FOOD_DINING, importance: 0.6 }
      ],
      communicationStyles: [CommunicationStyle.DIRECT, CommunicationStyle.EXPRESSIVE],
      location: {
        latitude: 47.6062,
        longitude: -122.3321
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
}

/**
 * Creates a test event with random data
 * @param tribeId The ID of the tribe the event belongs to
 * @param creatorId The ID of the user creating the event
 * @param index Number to ensure unique data
 * @returns Test event data
 */
function generateTestEvent(tribeId: string, creatorId: string, index: number): IEventCreate {
  const startTime = dayjs().add(7, 'day').add(index, 'hour').toDate();
  return {
    name: `Test Event ${index}`,
    description: faker.lorem.paragraph(),
    tribeId,
    createdBy: creatorId,
    eventType: EventType.IN_PERSON,
    visibility: EventVisibility.TRIBE_ONLY,
    startTime,
    endTime: dayjs(startTime).add(2, 'hour').toDate(),
    location: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
    coordinates: {
      latitude: parseFloat(faker.location.latitude()),
      longitude: parseFloat(faker.location.longitude())
    },
    venueId: faker.string.uuid(),
    cost: 0,
    paymentRequired: false,
    maxAttendees: 8,
    categories: [InterestCategory.OUTDOOR_ADVENTURES, InterestCategory.FOOD_DINING]
  };
}

/**
 * Registers a test user and returns the auth tokens
 * @param userData The user data to register
 * @returns The user ID and auth tokens
 */
async function registerTestUser(userData: IUserCreate): Promise<{ userId: string, accessToken: string, refreshToken: string }> {
  const res = await request
    .post(`${API_BASE_URL}/auth/register`)
    .send(userData)
    .expect(201);
  
  return {
    userId: res.body.user.id,
    accessToken: res.body.tokens.access,
    refreshToken: res.body.tokens.refresh
  };
}

/**
 * Logs in a test user and returns the auth tokens
 * @param credentials The login credentials
 * @returns The user ID and auth tokens
 */
async function loginTestUser(credentials: IUserCredentials): Promise<{ userId: string, accessToken: string, refreshToken: string }> {
  const res = await request
    .post(`${API_BASE_URL}/auth/login`)
    .send(credentials)
    .expect(200);
  
  return {
    userId: res.body.user.id,
    accessToken: res.body.tokens.access,
    refreshToken: res.body.tokens.refresh
  };
}

/**
 * Creates a profile for a test user
 * @param profileData The profile data to create
 * @param accessToken The access token for authentication
 * @returns The created profile ID
 */
async function createTestProfile(profileData: IProfileCreate, accessToken: string): Promise<string> {
  const res = await request
    .post(`${API_BASE_URL}/profiles`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(profileData)
    .expect(201);
  
  return res.body.id;
}

/**
 * Submits a personality assessment for a test user
 * @param assessmentData The assessment data to submit
 * @param accessToken The access token for authentication
 */
async function submitPersonalityAssessment(
  assessmentData: IPersonalityAssessment, 
  accessToken: string
): Promise<void> {
  await request
    .post(`${API_BASE_URL}/profiles/assessment`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(assessmentData)
    .expect(200);
}

/**
 * Submits interests for a test user
 * @param interestsData The interests data to submit
 * @param accessToken The access token for authentication
 */
async function submitInterests(
  interestsData: IInterestSubmission, 
  accessToken: string
): Promise<void> {
  await request
    .post(`${API_BASE_URL}/profiles/interests`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(interestsData)
    .expect(200);
}

/**
 * Updates matching preferences for a user
 * @param userId The user ID
 * @param preferences The matching preferences to update
 * @param accessToken The access token for authentication
 */
async function updateMatchingPreferences(
  userId: string, 
  preferences: IMatchingPreferences, 
  accessToken: string
): Promise<void> {
  await request
    .put(`${API_BASE_URL}/matching/preferences/${userId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(preferences)
    .expect(200);
}

/**
 * Requests immediate manual matching for a user
 * @param userId The user ID
 * @param criteria The matching criteria
 * @param preferExistingTribes Whether to prefer existing tribes
 * @param accessToken The access token for authentication
 * @returns The matching operation ID
 */
async function requestManualMatching(
  userId: string, 
  criteria: any,
  preferExistingTribes: boolean,
  accessToken: string
): Promise<string> {
  const res = await request
    .post(`${API_BASE_URL}/matching/manual`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      userId,
      criteria,
      preferExistingTribes
    })
    .expect(201);
  
  return res.body.operationId;
}

/**
 * Waits for a matching operation to complete
 * @param operationId The matching operation ID
 * @param accessToken The access token for authentication
 * @param maxAttempts Maximum number of attempts to check status
 * @returns The matching results
 */
async function waitForMatchingCompletion(
  operationId: string, 
  accessToken: string,
  maxAttempts: number = 10
): Promise<any> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const res = await request
      .get(`${API_BASE_URL}/matching/operations/${operationId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    
    if (res.body.status === 'success') {
      return res.body.results;
    } else if (res.body.status === 'failed') {
      throw new Error(`Matching operation failed: ${res.body.message}`);
    }
    
    // Wait for 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  throw new Error(`Matching operation timed out after ${maxAttempts} attempts`);
}

/**
 * Creates an event for testing
 * @param eventData The event data to create
 * @param accessToken The access token for authentication
 * @returns The created event ID
 */
async function createTestEvent(
  eventData: IEventCreate, 
  accessToken: string
): Promise<string> {
  const res = await request
    .post(`${API_BASE_URL}/events`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(eventData)
    .expect(201);
  
  return res.body.id;
}

/**
 * Creates a planning session for an event
 * @param planningData The planning session data to create
 * @param accessToken The access token for authentication
 * @returns The created planning session ID
 */
async function createPlanningSession(
  planningData: IPlanningSessionCreate, 
  accessToken: string
): Promise<string> {
  const res = await request
    .post(`${API_BASE_URL}/planning`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(planningData)
    .expect(201);
  
  return res.body.id;
}

/**
 * Updates the RSVP status for an event attendee
 * @param eventId The event ID
 * @param userId The user ID
 * @param status The RSVP status
 * @param accessToken The access token for authentication
 */
async function updateAttendeeRSVP(
  eventId: string, 
  userId: string, 
  status: RSVPStatus, 
  accessToken: string
): Promise<void> {
  await request
    .put(`${API_BASE_URL}/events/${eventId}/attendees/${userId}/rsvp`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ status })
    .expect(200);
}

/**
 * Updates the check-in status for an event attendee
 * @param eventId The event ID
 * @param userId The user ID
 * @param hasCheckedIn Whether the user has checked in
 * @param coordinates The check-in location coordinates
 * @param accessToken The access token for authentication
 */
async function updateAttendeeCheckIn(
  eventId: string, 
  userId: string, 
  hasCheckedIn: boolean, 
  coordinates: { latitude: number, longitude: number }, 
  accessToken: string
): Promise<void> {
  await request
    .put(`${API_BASE_URL}/events/${eventId}/attendees/${userId}/check-in`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ hasCheckedIn, coordinates })
    .expect(200);
}

/**
 * Cleans up test data after tests
 * @param userIds Array of user IDs to clean up
 * @param profileIds Array of profile IDs to clean up
 * @param tribeIds Array of tribe IDs to clean up
 * @param eventIds Array of event IDs to clean up
 */
async function cleanupTestData(
  userIds: string[] = [],
  profileIds: string[] = [],
  tribeIds: string[] = [],
  eventIds: string[] = []
): Promise<void> {
  // Delete event attendees
  if (eventIds.length > 0) {
    await prisma.eventAttendee.deleteMany({
      where: {
        eventId: {
          in: eventIds
        }
      }
    });
  }
  
  // Delete planning sessions
  if (eventIds.length > 0) {
    await prisma.planningSession.deleteMany({
      where: {
        eventId: {
          in: eventIds
        }
      }
    });
  }
  
  // Delete events
  if (eventIds.length > 0) {
    await prisma.event.deleteMany({
      where: {
        id: {
          in: eventIds
        }
      }
    });
  }
  
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
}

// Test Suites
describe('User Journey E2E Tests', () => {
  // Test data references
  const testUsers: Array<{ id: string; email: string; password: string; accessToken: string }> = [];
  const testProfiles: string[] = [];
  const testTribes: string[] = [];
  const testEvents: string[] = [];
  
  // Set up the test environment before all tests
  beforeAll(async () => {
    jest.setTimeout(TEST_TIMEOUT);
    await setupTestDatabase();
    setupMockExternalAPIs();
  });
  
  // Clean up after all tests
  afterAll(async () => {
    await cleanupTestData(
      testUsers.map(u => u.id),
      testProfiles,
      testTribes,
      testEvents
    );
    await teardownTestDatabase();
  });
  
  // Main test case: complete user journey
  it('should complete the full user journey from registration to event attendance', async () => {
    // Register multiple test users
    for (let i = 0; i < 6; i++) {
      const userData = generateTestUser(i);
      const { userId, accessToken } = await registerTestUser(userData);
      
      testUsers.push({
        id: userId,
        email: userData.email,
        password: userData.password as string,
        accessToken
      });
    }
    
    // Create profiles for each user
    for (let i = 0; i < testUsers.length; i++) {
      const profileData = generateTestProfile(testUsers[i].id, i);
      const profileId = await createTestProfile(profileData, testUsers[i].accessToken);
      testProfiles.push(profileId);
    }
    
    // Complete personality assessments for each user
    for (let i = 0; i < testProfiles.length; i++) {
      const assessmentData = generatePersonalityAssessment(testProfiles[i]);
      await submitPersonalityAssessment(assessmentData, testUsers[i].accessToken);
    }
    
    // Submit interests for each user
    for (let i = 0; i < testProfiles.length; i++) {
      const interestsData = generateInterests(testProfiles[i]);
      await submitInterests(interestsData, testUsers[i].accessToken);
    }
    
    // Update matching preferences for users
    for (let i = 0; i < testUsers.length; i++) {
      const preferences = generateMatchingPreferences(testUsers[i].id);
      await updateMatchingPreferences(testUsers[i].id, preferences, testUsers[i].accessToken);
    }
    
    // Request manual matching for immediate results
    const operationId = await requestManualMatching(
      testUsers[0].id,
      {
        personalityTraits: [
          { trait: PersonalityTrait.OPENNESS, importance: 0.7 },
          { trait: PersonalityTrait.EXTRAVERSION, importance: 0.5 }
        ],
        interests: [
          { category: InterestCategory.OUTDOOR_ADVENTURES, importance: 0.8 },
          { category: InterestCategory.FOOD_DINING, importance: 0.6 }
        ],
        communicationStyles: [CommunicationStyle.DIRECT, CommunicationStyle.EXPRESSIVE],
        location: {
          latitude: 47.6062,
          longitude: -122.3321
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
      true, // prefer existing tribes
      testUsers[0].accessToken
    );
    
    // Wait for matching operation to complete
    const matchingResults = await waitForMatchingCompletion(operationId, testUsers[0].accessToken);
    
    // Get the tribe that was created or joined
    const tribeResult = matchingResults.find(
      (result: any) => result.userId === testUsers[0].id
    );
    
    expect(tribeResult).toBeTruthy();
    expect(tribeResult.tribeId).toBeTruthy();
    
    const tribeId = tribeResult.tribeId;
    testTribes.push(tribeId);
    
    // Verify users are assigned to tribes
    const tribe = await request
      .get(`${API_BASE_URL}/tribes/${tribeId}`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .expect(200);
    
    expect(tribe.body.members.length).toBeGreaterThan(0);
    
    // Create an event for the tribe
    const eventData = generateTestEvent(tribeId, testUsers[0].id, 1);
    const eventId = await createTestEvent(eventData, testUsers[0].accessToken);
    testEvents.push(eventId);
    
    // Create a planning session for the event
    const planningData: IPlanningSessionCreate = {
      eventId,
      tribeId,
      createdBy: testUsers[0].id,
      availabilityDeadline: dayjs().add(2, 'day').toDate(),
      preferences: {
        durationMinutes: 120,
        preferredDays: [0, 6], // Weekend
        preferredTimeRanges: [{ start: '10:00', end: '16:00' }],
        preferredLocation: {
          latitude: 47.6062,
          longitude: -122.3321
        },
        maxDistance: 15,
        budgetRange: { min: 0, max: 50 },
        venueTypes: ['restaurant', 'park'],
        accessibilityRequirements: [],
        prioritizeAttendance: true
      }
    };
    
    const planningSessionId = await createPlanningSession(planningData, testUsers[0].accessToken);
    
    // Generate time slot suggestions (normally done by scheduler)
    await request
      .post(`${API_BASE_URL}/planning/${planningSessionId}/time-slots/generate`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .expect(200);
    
    // Vote on time slots (simplified for test)
    await request
      .post(`${API_BASE_URL}/planning/${planningSessionId}/vote`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .send({
        itemId: 'ts-1', // First time slot
        voteType: 'TIME_SLOT'
      })
      .expect(200);
    
    // Finalize the event plan
    const finalizeData: IEventPlanFinalize = {
      timeSlotId: 'ts-1',
      venueId: 'vs-1', // First venue suggestion
      finalizedBy: testUsers[0].id,
      notes: 'Looking forward to meeting everyone!'
    };
    
    await request
      .post(`${API_BASE_URL}/planning/${planningSessionId}/finalize`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .send(finalizeData)
      .expect(200);
    
    // Update event with finalized details (normally done automatically)
    await request
      .get(`${API_BASE_URL}/events/${eventId}`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .expect(200)
      .expect(res => {
        expect(res.body.status).toBe(EventStatus.SCHEDULED);
      });
    
    // Have users RSVP to the event
    for (let i = 0; i < 4; i++) { // First 4 users RSVP as going
      await updateAttendeeRSVP(
        eventId,
        testUsers[i].id,
        RSVPStatus.GOING,
        testUsers[i].accessToken
      );
    }
    
    // Simulate the event date arriving
    // This would normally involve changing the system date, but we'll skip that for the test
    
    // Have users check in to the event
    for (let i = 0; i < 4; i++) {
      await updateAttendeeCheckIn(
        eventId,
        testUsers[i].id,
        true,
        {
          latitude: parseFloat(faker.location.latitude()),
          longitude: parseFloat(faker.location.longitude())
        },
        testUsers[i].accessToken
      );
    }
    
    // Verify attendance statistics
    const eventStatistics = await request
      .get(`${API_BASE_URL}/events/${eventId}/statistics`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .expect(200);
    
    expect(eventStatistics.body.rsvpStats.going).toBe(4);
    expect(eventStatistics.body.checkInStats.checkedIn).toBe(4);
    
    // Verify engagement metrics are updated
    const tribeDetails = await request
      .get(`${API_BASE_URL}/tribes/${tribeId}`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .expect(200);
    
    // Should have at least one activity related to the event
    expect(tribeDetails.body.activities.some((activity: any) => 
      activity.activityType === 'EVENT_COMPLETED'
    )).toBe(true);
  });
});

// Sub-tests for specific parts of the journey
describe('User Registration and Profile Creation', () => {
  it('should register a new user successfully', async () => {
    const userData = generateTestUser(100); // Use a different index to avoid conflicts
    const { userId, accessToken } = await registerTestUser(userData);
    
    // Verify the user exists in the database
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user).toBeTruthy();
    expect(user?.email).toBe(userData.email);
    
    // Clean up
    await prisma.user.delete({ where: { id: userId } });
  });
  
  it('should create a user profile successfully', async () => {
    // First register a user
    const userData = generateTestUser(101);
    const { userId, accessToken } = await registerTestUser(userData);
    
    // Create a profile
    const profileData = generateTestProfile(userId, 101);
    const profileId = await createTestProfile(profileData, accessToken);
    
    // Verify the profile exists in the database
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    expect(profile).toBeTruthy();
    expect(profile?.userId).toBe(userId);
    
    // Clean up
    await prisma.profile.delete({ where: { id: profileId } });
    await prisma.user.delete({ where: { id: userId } });
  });
  
  it('should submit personality assessment successfully', async () => {
    // First register a user and create a profile
    const userData = generateTestUser(102);
    const { userId, accessToken } = await registerTestUser(userData);
    const profileData = generateTestProfile(userId, 102);
    const profileId = await createTestProfile(profileData, accessToken);
    
    // Submit personality assessment
    const assessmentData = generatePersonalityAssessment(profileId);
    await submitPersonalityAssessment(assessmentData, accessToken);
    
    // Verify the traits exist in the database
    const traits = await prisma.personalityTrait.findMany({ where: { profileId } });
    expect(traits.length).toBeGreaterThan(0);
    expect(traits.map(t => t.trait)).toContain(PersonalityTrait.OPENNESS);
    
    // Clean up
    await prisma.personalityTrait.deleteMany({ where: { profileId } });
    await prisma.profile.delete({ where: { id: profileId } });
    await prisma.user.delete({ where: { id: userId } });
  });
  
  it('should submit user interests successfully', async () => {
    // First register a user and create a profile
    const userData = generateTestUser(103);
    const { userId, accessToken } = await registerTestUser(userData);
    const profileData = generateTestProfile(userId, 103);
    const profileId = await createTestProfile(profileData, accessToken);
    
    // Submit interests
    const interestsData = generateInterests(profileId);
    await submitInterests(interestsData, accessToken);
    
    // Verify the interests exist in the database
    const interests = await prisma.interest.findMany({ where: { profileId } });
    expect(interests.length).toBeGreaterThan(0);
    expect(interests.map(i => i.category)).toContain(InterestCategory.OUTDOOR_ADVENTURES);
    
    // Clean up
    await prisma.interest.deleteMany({ where: { profileId } });
    await prisma.profile.delete({ where: { id: profileId } });
    await prisma.user.delete({ where: { id: userId } });
  });
});

describe('Tribe Formation and Matching', () => {
  let testUser: { id: string; email: string; password: string; accessToken: string };
  let profileId: string;
  
  beforeEach(async () => {
    // Create a user and profile for testing
    const userData = generateTestUser(200);
    const { userId, accessToken } = await registerTestUser(userData);
    testUser = {
      id: userId,
      email: userData.email,
      password: userData.password as string,
      accessToken
    };
    
    const profileData = generateTestProfile(userId, 200);
    profileId = await createTestProfile(profileData, accessToken);
    
    // Complete the profile with assessment and interests
    const assessmentData = generatePersonalityAssessment(profileId);
    await submitPersonalityAssessment(assessmentData, accessToken);
    
    const interestsData = generateInterests(profileId);
    await submitInterests(interestsData, accessToken);
  });
  
  afterEach(async () => {
    // Clean up
    await prisma.interest.deleteMany({ where: { profileId } });
    await prisma.personalityTrait.deleteMany({ where: { profileId } });
    await prisma.profile.delete({ where: { id: profileId } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });
  
  it('should update matching preferences successfully', async () => {
    // Update matching preferences
    const preferences = generateMatchingPreferences(testUser.id);
    await updateMatchingPreferences(testUser.id, preferences, testUser.accessToken);
    
    // Verify the preferences were updated
    const userPreferences = await prisma.matchingPreferences.findUnique({
      where: { userId: testUser.id }
    });
    
    expect(userPreferences).toBeTruthy();
    expect(userPreferences?.autoMatchingEnabled).toBe(true);
  });
  
  it('should request manual matching successfully', async () => {
    // First create more test users for matching
    const additionalUsers = [];
    for (let i = 201; i < 206; i++) {
      const userData = generateTestUser(i);
      const { userId, accessToken } = await registerTestUser(userData);
      
      const profileData = generateTestProfile(userId, i);
      const otherProfileId = await createTestProfile(profileData, accessToken);
      
      const assessmentData = generatePersonalityAssessment(otherProfileId);
      await submitPersonalityAssessment(assessmentData, accessToken);
      
      const interestsData = generateInterests(otherProfileId);
      await submitInterests(interestsData, accessToken);
      
      additionalUsers.push({ userId, profileId: otherProfileId });
    }
    
    // Request manual matching
    const operationId = await requestManualMatching(
      testUser.id,
      {
        personalityTraits: [
          { trait: PersonalityTrait.OPENNESS, importance: 0.7 },
          { trait: PersonalityTrait.EXTRAVERSION, importance: 0.5 }
        ],
        interests: [
          { category: InterestCategory.OUTDOOR_ADVENTURES, importance: 0.8 },
          { category: InterestCategory.FOOD_DINING, importance: 0.6 }
        ],
        communicationStyles: [CommunicationStyle.DIRECT, CommunicationStyle.EXPRESSIVE],
        location: {
          latitude: 47.6062,
          longitude: -122.3321
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
      true,
      testUser.accessToken
    );
    
    // Wait for matching to complete
    const matchingResults = await waitForMatchingCompletion(operationId, testUser.accessToken);
    
    // Verify matching results contain tribe assignments
    expect(matchingResults).toBeTruthy();
    expect(matchingResults.length).toBeGreaterThan(0);
    expect(matchingResults.find((r: any) => r.userId === testUser.id).tribeId).toBeTruthy();
    
    // Clean up the additional users and any created tribes
    const createdTribeId = matchingResults.find((r: any) => r.userId === testUser.id).tribeId;
    
    // Clean up tribes and memberships
    if (createdTribeId) {
      await prisma.tribeMembership.deleteMany({ where: { tribeId: createdTribeId } });
      await prisma.tribe.delete({ where: { id: createdTribeId } });
    }
    
    // Clean up additional users
    for (const user of additionalUsers) {
      await prisma.interest.deleteMany({ where: { profileId: user.profileId } });
      await prisma.personalityTrait.deleteMany({ where: { profileId: user.profileId } });
      await prisma.profile.delete({ where: { id: user.profileId } });
      await prisma.user.delete({ where: { id: user.userId } });
    }
  });
  
  it('should assign users to appropriate tribes', async () => {
    // Create additional test users for matching
    const additionalUsers = [];
    for (let i = 210; i < 215; i++) {
      const userData = generateTestUser(i);
      const { userId, accessToken } = await registerTestUser(userData);
      
      const profileData = generateTestProfile(userId, i);
      const otherProfileId = await createTestProfile(profileData, accessToken);
      
      const assessmentData = generatePersonalityAssessment(otherProfileId);
      await submitPersonalityAssessment(assessmentData, accessToken);
      
      const interestsData = generateInterests(otherProfileId);
      await submitInterests(interestsData, accessToken);
      
      additionalUsers.push({ userId, profileId: otherProfileId, accessToken });
    }
    
    // Request manual matching
    const operationId = await requestManualMatching(
      testUser.id,
      {
        personalityTraits: [
          { trait: PersonalityTrait.OPENNESS, importance: 0.7 }
        ],
        interests: [
          { category: InterestCategory.OUTDOOR_ADVENTURES, importance: 0.8 }
        ],
        communicationStyles: [CommunicationStyle.DIRECT],
        location: {
          latitude: 47.6062,
          longitude: -122.3321
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
      false, // Create a new tribe
      testUser.accessToken
    );
    
    // Wait for matching to complete
    const matchingResults = await waitForMatchingCompletion(operationId, testUser.accessToken);
    
    // Get the tribe that was created
    const tribeResult = matchingResults.find(
      (result: any) => result.userId === testUser.id
    );
    expect(tribeResult).toBeTruthy();
    expect(tribeResult.tribeId).toBeTruthy();
    
    const tribeId = tribeResult.tribeId;
    
    // Verify tribe composition and membership
    const tribeDetails = await request
      .get(`${API_BASE_URL}/tribes/${tribeId}`)
      .set('Authorization', `Bearer ${testUser.accessToken}`)
      .expect(200);
    
    // Verify tribe has between 4-8 members
    expect(tribeDetails.body.members.length).toBeGreaterThanOrEqual(4);
    expect(tribeDetails.body.members.length).toBeLessThanOrEqual(8);
    
    // Verify tribe has the test user as a member
    const testUserMembership = tribeDetails.body.members.find(
      (member: any) => member.userId === testUser.id
    );
    expect(testUserMembership).toBeTruthy();
    
    // Clean up the created tribe and memberships
    await prisma.tribeMembership.deleteMany({ where: { tribeId } });
    await prisma.tribe.delete({ where: { id: tribeId } });
    
    // Clean up additional users
    for (const user of additionalUsers) {
      await prisma.interest.deleteMany({ where: { profileId: user.profileId } });
      await prisma.personalityTrait.deleteMany({ where: { profileId: user.profileId } });
      await prisma.profile.delete({ where: { id: user.profileId } });
      await prisma.user.delete({ where: { id: user.userId } });
    }
  });
});

describe('Event Planning and Attendance', () => {
  // Create users, profiles, and a tribe for testing events
  let testUsers: Array<{ id: string; email: string; password: string; accessToken: string }> = [];
  let profileIds: string[] = [];
  let tribeId: string;
  let eventId: string;
  
  beforeAll(async () => {
    // Create users and profiles
    for (let i = 300; i < 305; i++) {
      const userData = generateTestUser(i);
      const { userId, accessToken } = await registerTestUser(userData);
      
      testUsers.push({
        id: userId,
        email: userData.email,
        password: userData.password as string,
        accessToken
      });
      
      const profileData = generateTestProfile(userId, i);
      const profileId = await createTestProfile(profileData, accessToken);
      profileIds.push(profileId);
      
      // Complete the profile
      const assessmentData = generatePersonalityAssessment(profileId);
      await submitPersonalityAssessment(assessmentData, accessToken);
      
      const interestsData = generateInterests(profileId);
      await submitInterests(interestsData, accessToken);
    }
    
    // Create a tribe (manually for simplicity)
    const tribeCreateResult = await request
      .post(`${API_BASE_URL}/tribes`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .send({
        name: 'Test Tribe',
        description: 'A tribe for testing events',
        location: 'Seattle, WA',
        coordinates: {
          latitude: 47.6062,
          longitude: -122.3321
        },
        privacy: TribePrivacy.PUBLIC,
        maxMembers: 8,
        imageUrl: faker.image.url(),
        interests: [
          {
            category: InterestCategory.OUTDOOR_ADVENTURES,
            name: 'Hiking',
            isPrimary: true
          },
          {
            category: InterestCategory.FOOD_DINING,
            name: 'Restaurants',
            isPrimary: false
          }
        ]
      })
      .expect(201);
    
    tribeId = tribeCreateResult.body.id;
    
    // Add users to the tribe
    for (let i = 1; i < testUsers.length; i++) {
      await request
        .post(`${API_BASE_URL}/tribes/${tribeId}/members`)
        .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
        .send({
          userId: testUsers[i].id,
          role: MemberRole.MEMBER
        })
        .expect(201);
    }
  });
  
  afterAll(async () => {
    // Clean up
    if (eventId) {
      await prisma.eventAttendee.deleteMany({ where: { eventId } });
      await prisma.planningSession.deleteMany({ where: { eventId } });
      await prisma.event.delete({ where: { id: eventId } });
    }
    
    if (tribeId) {
      await prisma.tribeMembership.deleteMany({ where: { tribeId } });
      await prisma.tribe.delete({ where: { id: tribeId } });
    }
    
    for (let i = 0; i < profileIds.length; i++) {
      await prisma.interest.deleteMany({ where: { profileId: profileIds[i] } });
      await prisma.personalityTrait.deleteMany({ where: { profileId: profileIds[i] } });
      await prisma.profile.delete({ where: { id: profileIds[i] } });
      await prisma.user.delete({ where: { id: testUsers[i].id } });
    }
  });
  
  it('should create an event successfully', async () => {
    // Create an event
    const eventData = generateTestEvent(tribeId, testUsers[0].id, 1);
    const createEventResult = await request
      .post(`${API_BASE_URL}/events`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .send(eventData)
      .expect(201);
    
    eventId = createEventResult.body.id;
    
    // Verify the event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    expect(event).toBeTruthy();
    expect(event?.tribeId).toBe(tribeId);
  });
  
  it('should create a planning session successfully', async () => {
    // Create a planning session
    const planningData: IPlanningSessionCreate = {
      eventId,
      tribeId,
      createdBy: testUsers[0].id,
      availabilityDeadline: dayjs().add(2, 'day').toDate(),
      preferences: {
        durationMinutes: 120,
        preferredDays: [0, 6], // Weekend
        preferredTimeRanges: [{ start: '10:00', end: '16:00' }],
        preferredLocation: {
          latitude: 47.6062,
          longitude: -122.3321
        },
        maxDistance: 15,
        budgetRange: { min: 0, max: 50 },
        venueTypes: ['restaurant', 'park'],
        accessibilityRequirements: [],
        prioritizeAttendance: true
      }
    };
    
    const createPlanningResult = await request
      .post(`${API_BASE_URL}/planning`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .send(planningData)
      .expect(201);
    
    const planningSessionId = createPlanningResult.body.id;
    
    // Verify the planning session exists
    const planningSession = await prisma.planningSession.findUnique({
      where: { id: planningSessionId }
    });
    expect(planningSession).toBeTruthy();
    expect(planningSession?.eventId).toBe(eventId);
  });
  
  it('should finalize event plan successfully', async () => {
    // Get the planning session ID
    const planningSessionResult = await request
      .get(`${API_BASE_URL}/planning/event/${eventId}`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .expect(200);
    
    const planningSessionId = planningSessionResult.body.id;
    
    // Generate time slots (simplified for test)
    await request
      .post(`${API_BASE_URL}/planning/${planningSessionId}/time-slots/generate`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .expect(200);
    
    // Suggest venues (simplified for test)
    await request
      .post(`${API_BASE_URL}/planning/${planningSessionId}/venues/suggest`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .expect(200);
    
    // Finalize the event plan
    const finalizeData: IEventPlanFinalize = {
      timeSlotId: 'ts-1', // Assume first time slot
      venueId: 'vs-1', // Assume first venue
      finalizedBy: testUsers[0].id,
      notes: 'Looking forward to meeting everyone!'
    };
    
    await request
      .post(`${API_BASE_URL}/planning/${planningSessionId}/finalize`)
      .set('Authorization', `Bearer ${testUsers[0].accessToken}`)
      .send(finalizeData)
      .expect(200);
    
    // Verify the event status is updated
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    expect(event?.status).toBe(EventStatus.SCHEDULED);
  });
  
  it('should update RSVP status successfully', async () => {
    // Update RSVP status
    await updateAttendeeRSVP(
      eventId,
      testUsers[0].id,
      RSVPStatus.GOING,
      testUsers[0].accessToken
    );
    
    // Verify the RSVP status
    const attendee = await prisma.eventAttendee.findFirst({
      where: {
        eventId,
        userId: testUsers[0].id
      }
    });
    
    expect(attendee).toBeTruthy();
    expect(attendee?.rsvpStatus).toBe(RSVPStatus.GOING);
  });
  
  it('should check in to event successfully', async () => {
    // Update check-in status
    await updateAttendeeCheckIn(
      eventId,
      testUsers[0].id,
      true,
      {
        latitude: 47.6062,
        longitude: -122.3321
      },
      testUsers[0].accessToken
    );
    
    // Verify the check-in status
    const attendee = await prisma.eventAttendee.findFirst({
      where: {
        eventId,
        userId: testUsers[0].id
      }
    });
    
    expect(attendee).toBeTruthy();
    expect(attendee?.hasCheckedIn).toBe(true);
  });
});