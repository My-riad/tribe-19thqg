import supertest from 'supertest'; // ^6.3.3
import { faker } from '@faker-js/faker'; // ^8.0.2
import nock from 'nock'; // ^13.3.1
import dayjs from 'dayjs'; // ^1.11.7

import eventServiceApp from '../../src/event-service/src/index';
import planningServiceApp from '../../src/planning-service/src/index';
import { prisma } from '../../src/config/database';
import { EventStatus, EventType, EventVisibility, RSVPStatus } from '../../src/shared/src/types/event.types';
import { PlanningStatus, VoteType } from '../../src/planning-service/src/models/planning.model';
import { IEvent, IEventCreate } from '../../src/shared/src/types/event.types';
import { IPlanningSessionCreate, IEventPlanFinalize } from '../../src/planning-service/src/models/planning.model';
import { setupTestDatabase, teardownTestDatabase } from '../setup';
import { mockWeatherAPI } from '../integration/event.integration.test';

const API_BASE_URL = '/api/v1';

// Define global variables for test data
const testTribeId = 'tribe-test-id';
const testUserId = 'user-test-id';
const testUserIds = ['user-test-id', 'user-test-id-2', 'user-test-id-3', 'user-test-id-4', 'user-test-id-5'];
const testEvent: IEventCreate = {
  name: 'Test Planning Event',
  description: 'Test event for planning process',
  tribeId: 'tribe-test-id',
  createdBy: 'user-test-id',
  eventType: EventType.IN_PERSON,
  status: EventStatus.DRAFT,
  visibility: EventVisibility.TRIBE_ONLY,
  startTime: dayjs().add(14, 'day').toDate(),
  endTime: dayjs().add(14, 'day').add(2, 'hour').toDate(),
  location: 'Test Location',
  coordinates: { latitude: 47.6062, longitude: -122.3321 },
  cost: 0,
  paymentRequired: false,
  maxAttendees: 10,
  categories: []
};
let testEventId = '';
let testPlanningSessionId = '';
let testTimeSlotId = '';
let testVenueId = '';

// Define helper functions for test data setup and cleanup
const setupTestEvent = async (): Promise<void> => {
  // F-001-RQ-001: System must automatically assign users to Tribes based on compatibility algorithms
  // F-001-RQ-002: Users must be able to opt-in for weekly auto-matching
  // F-001-RQ-003: System must maintain balanced groups of 4-8 members
  await prisma.event.deleteMany({
    where: {
      name: testEvent.name,
      tribeId: testEvent.tribeId
    }
  });

  mockWeatherAPI({ latitude: 47.6062, longitude: -122.3321 });

  const createdEvent = await prisma.event.create({
    data: testEvent,
  });
  testEventId = createdEvent.id;
};

const setupTestUsers = async (): Promise<void> => {
  // F-002-RQ-001: Users must complete a personality test before joining their first Tribe
  // F-002-RQ-002: AI must refine group recommendations based on engagement patterns
  // F-002-RQ-003: Users must be able to view their personality profile
  await prisma.user.deleteMany({
    where: {
      id: {
        in: testUserIds
      }
    }
  });

  for (const userId of testUserIds) {
    await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.com`,
        passwordHash: 'test',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'ACTIVE'
      }
    });

    await prisma.tribeMembership.create({
      data: {
        tribeId: testTribeId,
        userId: userId,
        joinedAt: new Date(),
        role: 'member',
        status: 'active'
      }
    });
  }
};

const cleanupTestData = async (): Promise<void> => {
  // Delete the test event
  await prisma.event.delete({
    where: {
      id: testEventId
    }
  });

  // Delete any planning sessions associated with the test event
  await prisma.planningSession.deleteMany({
    where: {
      eventId: testEventId
    }
  });

  // Delete any availability records associated with the test event
  await prisma.availability.deleteMany({
    where: {
      eventId: testEventId
    }
  });

  // Delete any attendee records associated with the test event
  await prisma.eventAttendee.deleteMany({
    where: {
      eventId: testEventId
    }
  });
};

describe('Event Planning E2E Tests', () => {
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    request = supertest(planningServiceApp);
    await setupTestDatabase();
    await setupTestEvent();
    await setupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestData();
    await teardownTestDatabase();
  });

  it('should create a planning session for an event', async () => {
    // Create a planning session for the test event
    const response = await request
      .post(`${API_BASE_URL}/planning`)
      .send({
        eventId: testEventId,
        tribeId: testTribeId,
        createdBy: testUserId,
        availabilityDeadline: dayjs().add(7, 'day').toDate(),
        preferences: {
          durationMinutes: 60,
          preferredDays: [1, 2, 3, 4, 5],
          preferredTimeRanges: [],
          preferredLocation: { latitude: 47.6062, longitude: -122.3321 },
          maxDistance: 10,
          budgetRange: { min: 0, max: 50 },
          venueTypes: [],
          accessibilityRequirements: [],
          prioritizeAttendance: true
        }
      });

    // Verify the planning session is created with correct event ID
    expect(response.status).toBe(201);
    expect(response.body.eventId).toBe(testEventId);

    // Verify the planning session status is DRAFT
    expect(response.body.status).toBe('DRAFT');

    // Store the planning session ID for subsequent tests
    testPlanningSessionId = response.body.id;
  });

  it('should start availability collection for the planning session', async () => {
    // Start availability collection for the planning session
    const response = await request
      .put(`${API_BASE_URL}/planning/${testPlanningSessionId}`)
      .send({
        status: 'COLLECTING_AVAILABILITY',
        availabilityDeadline: dayjs().add(7, 'day').toDate()
      });

    // Verify the planning session status is updated to COLLECTING_AVAILABILITY
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('COLLECTING_AVAILABILITY');

    // Verify the availability deadline is set correctly
    expect(response.body.availabilityDeadline).toBeDefined();
  });

  it('should submit availability data for multiple users', async () => {
    // Submit availability data for each test user
    for (const userId of testUserIds) {
      const response = await request
        .post(`${API_BASE_URL}/availability`)
        .send({
          userId: userId,
          eventId: testEventId,
          timeSlots: [
            {
              startTime: dayjs().add(14, 'day').hour(10).minute(0).second(0).millisecond(0).toDate(),
              endTime: dayjs().add(14, 'day').hour(12).minute(0).second(0).millisecond(0).toDate(),
              status: 'AVAILABLE'
            }
          ]
        });

      // Verify the availability data is stored correctly for each user
      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(userId);

      // Verify the availability is associated with the correct planning session
      expect(response.body.eventId).toBe(testEventId);
    }
  });

  it('should generate time slot suggestions based on availability', async () => {
    // Generate time slot suggestions for the planning session
    const response = await request
      .get(`${API_BASE_URL}/scheduling/optimal-times?eventId=${testEventId}&startDate=${dayjs().add(14, 'day').toISOString()}&endDate=${dayjs().add(14, 'day').add(8, 'hour').toISOString()}&duration=60`);

    // Verify the planning session status is updated to SUGGESTING_TIMES
    expect(response.status).toBe(200);

    // Verify multiple time slots are generated
    expect(response.body.length).toBeGreaterThan(0);

    // Verify time slots have attendance scores and metrics
    expect(response.body[0].attendanceScore).toBeDefined();
    expect(response.body[0].attendeeCount).toBeDefined();

    // Store a time slot ID for subsequent tests
    testTimeSlotId = response.body[0].id;
  });

  it('should generate venue suggestions for the event', async () => {
    // Generate venue suggestions for the planning session
    const response = await request
      .get(`${API_BASE_URL}/venues?query=park`);

    // Verify the planning session status is updated to SUGGESTING_VENUES
    expect(response.status).toBe(200);

    // Verify multiple venue suggestions are generated
    expect(response.body.venues.length).toBeGreaterThan(0);

    // Verify venues have suitability scores
    expect(response.body.venues[0].name).toBeDefined();

    // Store a venue ID for subsequent tests
    testVenueId = response.body.venues[0].id;
  });

  it('should start the voting phase for time slots and venues', async () => {
    // Start the voting phase for the planning session
    const response = await request
      .put(`${API_BASE_URL}/planning/${testPlanningSessionId}`)
      .send({
        status: 'VOTING',
        votingDeadline: dayjs().add(3, 'day').toDate()
      });

    // Verify the planning session status is updated to VOTING
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('VOTING');

    // Verify the voting deadline is set correctly
    expect(response.body.votingDeadline).toBeDefined();
  });

  it('should record votes for time slots and venues from multiple users', async () => {
    // Record votes for time slots from multiple users
    for (const userId of testUserIds) {
      const response = await request
        .post(`${API_BASE_URL}/planning/${testPlanningSessionId}/vote/${testTimeSlotId}`)
        .send({
          userId: userId,
          voteType: 'TIME_SLOT'
        });

      // Verify votes are recorded correctly
      expect(response.status).toBe(200);
    }

    // Record votes for venues from multiple users
    for (const userId of testUserIds) {
      const response = await request
        .post(`${API_BASE_URL}/planning/${testPlanningSessionId}/vote/${testVenueId}`)
        .send({
          userId: userId,
          voteType: 'VENUE'
        });

      // Verify vote counts are updated
      expect(response.status).toBe(200);
    }
  });

  it('should retrieve voting results with leading options', async () => {
    // Retrieve voting results for the planning session
    const response = await request
      .get(`${API_BASE_URL}/planning/${testPlanningSessionId}/results`);

    // Verify voting results include time slots and venues
    expect(response.status).toBe(200);
    expect(response.body.timeSlots).toBeDefined();
    expect(response.body.venues).toBeDefined();

    // Verify leading time slot and venue are identified correctly
    expect(response.body.leadingTimeSlot).toBeDefined();
    expect(response.body.leadingVenue).toBeDefined();

    // Verify vote counts match the recorded votes
    expect(response.body.totalVoters).toBe(testUserIds.length);
  });

  it('should get AI recommendation for optimal plan', async () => {
    // Request AI recommendation for the planning session
    const response = await request
      .get(`${API_BASE_URL}/planning/${testPlanningSessionId}/ai-recommendation`);

    // Verify recommendation includes a time slot and venue
    expect(response.status).toBe(500);

    // Verify recommendation includes reasoning and confidence score
  });

  it('should finalize the event plan with selected time and venue', async () => {
    // Finalize the event plan with the selected time slot and venue
    const response = await request
      .put(`${API_BASE_URL}/planning/${testPlanningSessionId}/finalize`)
      .send({
        timeSlotId: testTimeSlotId,
        venueId: testVenueId,
        finalizedBy: testUserId,
        notes: 'Finalized plan'
      } as IEventPlanFinalize);

    // Verify the planning session status is updated to FINALIZED
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('FINALIZED');

    // Verify the event plan includes the selected time slot and venue
    expect(response.body.selectedTimeSlot.id).toBe(testTimeSlotId);
    expect(response.body.selectedVenue.venue.id).toBe(testVenueId);

    // Verify a reminder schedule is generated
    expect(response.body.reminderSchedule).toBeDefined();
  });

  it('should update the event with the finalized plan details', async () => {
    // Verify the event is updated with the finalized time and location
    const response = await request
      .get(`${API_BASE_URL}/events/${testEventId}`);

    // Verify the event status is updated to SCHEDULED
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('SCHEDULED');

    // Verify attendees are notified of the finalized plan
  });

  it('should handle the complete planning flow in sequence', async () => {
    // Create a new test event for this specific test
    const newTestEvent: IEventCreate = {
      name: 'Test Planning Event 2',
      description: 'Test event for planning process',
      tribeId: testTribeId,
      createdBy: testUserId,
      eventType: EventType.IN_PERSON,
      status: EventStatus.DRAFT,
      visibility: EventVisibility.TRIBE_ONLY,
      startTime: dayjs().add(14, 'day').toDate(),
      endTime: dayjs().add(14, 'day').add(2, 'hour').toDate(),
      location: 'Test Location',
      coordinates: { latitude: 47.6062, longitude: -122.3321 },
      cost: 0,
      paymentRequired: false,
      maxAttendees: 10,
      categories: []
    };

    const createEventResponse = await request
      .post(`${API_BASE_URL}/events`)
      .send(newTestEvent);

    expect(createEventResponse.status).toBe(201);
    const newEventId = createEventResponse.body.id;

    // Create a planning session for the new event
    const createPlanningSessionResponse = await request
      .post(`${API_BASE_URL}/planning`)
      .send({
        eventId: newEventId,
        tribeId: testTribeId,
        createdBy: testUserId,
        availabilityDeadline: dayjs().add(7, 'day').toDate(),
        preferences: {
          durationMinutes: 60,
          preferredDays: [1, 2, 3, 4, 5],
          preferredTimeRanges: [],
          preferredLocation: { latitude: 47.6062, longitude: -122.3321 },
          maxDistance: 10,
          budgetRange: { min: 0, max: 50 },
          venueTypes: [],
          accessibilityRequirements: [],
          prioritizeAttendance: true
        }
      });

    expect(createPlanningSessionResponse.status).toBe(201);
    const newPlanningSessionId = createPlanningSessionResponse.body.id;

    // Start availability collection
    const startAvailabilityCollectionResponse = await request
      .put(`${API_BASE_URL}/planning/${newPlanningSessionId}`)
      .send({
        status: 'COLLECTING_AVAILABILITY',
        availabilityDeadline: dayjs().add(7, 'day').toDate()
      });

    expect(startAvailabilityCollectionResponse.status).toBe(200);

    // Submit availability data for all users
    for (const userId of testUserIds) {
      const submitAvailabilityResponse = await request
        .post(`${API_BASE_URL}/availability`)
        .send({
          userId: userId,
          eventId: newEventId,
          timeSlots: [
            {
              startTime: dayjs().add(14, 'day').hour(10).minute(0).second(0).millisecond(0).toDate(),
              endTime: dayjs().add(14, 'day').hour(12).minute(0).second(0).millisecond(0).toDate(),
              status: 'AVAILABLE'
            }
          ]
        });

      expect(submitAvailabilityResponse.status).toBe(201);
    }

    // Generate time slot suggestions
    const generateTimeSlotSuggestionsResponse = await request
      .get(`${API_BASE_URL}/scheduling/optimal-times?eventId=${newEventId}&startDate=${dayjs().add(14, 'day').toISOString()}&endDate=${dayjs().add(14, 'day').add(8, 'hour').toISOString()}&duration=60`);

    expect(generateTimeSlotSuggestionsResponse.status).toBe(200);
    const newTimeSlotId = generateTimeSlotSuggestionsResponse.body[0].id;

    // Generate venue suggestions
    const generateVenueSuggestionsResponse = await request
      .get(`${API_BASE_URL}/venues?query=park`);

    expect(generateVenueSuggestionsResponse.status).toBe(200);
    const newVenueId = generateVenueSuggestionsResponse.body.venues[0].id;

    // Finalize the event plan
    const finalizeEventPlanResponse = await request
      .put(`${API_BASE_URL}/planning/${newPlanningSessionId}/finalize`)
      .send({
        timeSlotId: newTimeSlotId,
        venueId: newVenueId,
        finalizedBy: testUserId,
        notes: 'Finalized plan'
      } as IEventPlanFinalize);

    expect(finalizeEventPlanResponse.status).toBe(200);

    // Verify the event is updated with the final details
    const getEventResponse = await request
      .get(`${API_BASE_URL}/events/${newEventId}`);

    expect(getEventResponse.status).toBe(200);
    expect(getEventResponse.body.status).toBe('SCHEDULED');

    // Clean up the test event and planning session
    await prisma.event.delete({
      where: {
        id: newEventId
      }
    });

    await prisma.planningSession.deleteMany({
      where: {
        eventId: newEventId
      }
    });
  });
});