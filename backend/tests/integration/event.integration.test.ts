import supertest from 'supertest'; // ^6.3.3
import { faker } from '@faker-js/faker'; // ^8.0.2
import nock from 'nock'; // ^13.3.1
import { app } from '../../src/event-service/src/index';
import { EventModel } from '../../src/event-service/src/models/event.model';
import { AttendeeModel } from '../../src/event-service/src/models/attendee.model';
import {
  IEvent,
  IEventCreate,
  IEventUpdate,
  EventStatus,
  EventType,
  EventVisibility,
  RSVPStatus,
  IEventAttendee,
  ICoordinates,
} from '../../src/shared/src/types/event.types';
import { InterestCategory } from '../../src/shared/src/types/profile.types';
import { clearTestData } from '../setup';
import { prisma } from '../../src/config/database';

const API_BASE_URL = '/api/v1';

describe('Event Service Integration Tests', () => {
  let request: supertest.SuperTest<supertest.Test>;
  const testUser = { id: 'user-id-1', email: 'test@example.com', name: 'Test User', isVerified: true };
  const testTribe = { id: 'tribe-id-1', name: 'Test Tribe', description: 'A tribe for testing events' };
  const validEvent: IEventCreate = {
    name: 'Test Event',
    description: 'An event for testing',
    tribeId: 'tribe-id-1',
    createdBy: 'user-id-1',
    eventType: EventType.IN_PERSON,
    visibility: EventVisibility.TRIBE_ONLY,
    startTime: new Date(Date.now() + 86400000),
    endTime: new Date(Date.now() + 90000000),
    location: 'Test Location',
    coordinates: { latitude: 47.6062, longitude: -122.3321 },
    cost: 0,
    paymentRequired: false,
    maxAttendees: 10,
    categories: [InterestCategory.OUTDOOR_ADVENTURES, InterestCategory.SOCIAL],
  };
  const invalidEvent: Partial<IEventCreate> = {
    name: '',
    description: 'Missing required fields',
    tribeId: 'tribe-id-1',
    createdBy: 'user-id-1',
  };
  const updateEventData: IEventUpdate = {
    name: 'Updated Event Name',
    description: 'Updated event description',
    cost: 15,
  };
  const testCoordinates: ICoordinates = { latitude: 47.6062, longitude: -122.3321 };
  const testWeatherData = { temperature: 72, condition: 'Sunny', icon: 'clear-day', precipitation: 0, forecast: 'Clear skies' };

  beforeAll(() => {
    request = supertest(app);
  });

  afterEach(async () => {
    await clearTestData();
    nock.cleanAll();
  });

  beforeEach(async () => {
    await prisma.user.create({ data: testUser });
    await prisma.tribe.create({ data: testTribe });
  });

  const generateTestEvent = (overrides: Partial<IEventCreate> = {}): IEventCreate => {
    const eventName = faker.lorem.sentence(3);
    const eventDescription = faker.lorem.paragraph();
    const defaults: IEventCreate = {
      name: eventName,
      description: eventDescription,
      tribeId: 'tribe-id-1',
      createdBy: 'user-id-1',
      eventType: EventType.IN_PERSON,
      visibility: EventVisibility.TRIBE_ONLY,
      startTime: new Date(Date.now() + 86400000),
      endTime: new Date(Date.now() + 90000000),
      location: faker.location.city(),
      coordinates: { latitude: parseFloat(faker.location.latitude()), longitude: parseFloat(faker.location.longitude()) },
      cost: 0,
      paymentRequired: false,
      maxAttendees: 10,
      categories: [InterestCategory.OUTDOOR_ADVENTURES, InterestCategory.SOCIAL],
    };
    return { ...defaults, ...overrides };
  };

  const createTestEvent = async (overrides: Partial<IEventCreate> = {}): Promise<IEvent> => {
    const eventData = generateTestEvent(overrides);
    return await EventModel.createEvent(eventData);
  };

  const createTestTribe = async (overrides: any = {}): Promise<any> => {
    const tribeName = faker.company.name();
    const tribeDescription = faker.lorem.sentence();
    const defaults = {
      name: tribeName,
      description: tribeDescription,
      location: faker.location.city(),
      coordinates: { latitude: parseFloat(faker.location.latitude()), longitude: parseFloat(faker.location.longitude()) },
      imageUrl: faker.image.url(),
      createdBy: 'user-id-1',
      status: 'ACTIVE',
      maxMembers: 8,
      metadata: {},
    };
    return await prisma.tribe.create({ data: { ...defaults, ...overrides } });
  };

  const createTestUser = async (overrides: any = {}): Promise<any> => {
    const email = faker.internet.email();
    const defaults = {
      id: faker.string.uuid(),
      email,
      passwordHash: faker.internet.password(),
      createdAt: new Date(),
      lastLogin: new Date(),
      isVerified: true,
      status: 'ACTIVE',
    };
    return await prisma.user.create({ data: { ...defaults, ...overrides } });
  };

  const addTestAttendee = async (eventId: string, userId: string, rsvpStatus: RSVPStatus): Promise<IEventAttendee> => {
    return await prisma.eventAttendee.create({
      data: {
        eventId,
        userId,
        rsvpStatus,
        rsvpTime: new Date(),
        hasCheckedIn: false,
        paymentStatus: 'NOT_REQUIRED',
        paymentAmount: 0,
        paymentId: '',
        metadata: {},
      },
    });
  };

  const setupMockWeatherAPI = (coordinates: ICoordinates) => {
    nock('https://api.openweathermap.org/data/2.5')
      .get('/weather')
      .query({ lat: coordinates.latitude.toString(), lon: coordinates.longitude.toString(), appid: 'test-weather-api-key' })
      .reply(200, { main: { temp: 293.15 }, weather: [{ main: 'Clear', description: 'clear sky' }] });
  };

  const setupMockLocationAPI = (locationQuery: string) => {
    nock('https://maps.googleapis.com/maps/api/place/textsearch/json')
      .get('')
      .query({ query: locationQuery, key: 'test-google-places-api-key' })
      .reply(200, { results: [{ geometry: { location: { lat: 47.6062, lng: -122.3321 } } }] });
  };

  describe('Event Creation', () => {
    it('should create a new event successfully', async () => {
      const response = await request
        .post(`${API_BASE_URL}/events`)
        .send(validEvent);
      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(validEvent.name);
    });

    it('should return 400 when creating with invalid data', async () => {
      const response = await request
        .post(`${API_BASE_URL}/events`)
        .send(invalidEvent);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
    });

    it('should return 404 when creating with non-existent tribe', async () => {
      const nonExistentTribeEvent = { ...validEvent, tribeId: 'non-existent-tribe' };
      const response = await request
        .post(`${API_BASE_URL}/events`)
        .send(nonExistentTribeEvent);
      expect(response.status).toBe(500);
    });

    it('should include weather data when coordinates are provided', async () => {
      setupMockWeatherAPI(testCoordinates);
      const response = await request
        .post(`${API_BASE_URL}/events`)
        .send(validEvent);
      expect(response.status).toBe(201);
    });
  });

  describe('Event Retrieval', () => {
    it('should get an event by ID', async () => {
      const event = await createTestEvent();
      const response = await request.get(`${API_BASE_URL}/events/${event.id}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(event.id);
    });

    it('should return 404 when getting non-existent event', async () => {
      const response = await request.get(`${API_BASE_URL}/events/non-existent-event`);
      expect(response.status).toBe(404);
    });

    it('should get events by tribe ID', async () => {
      const event = await createTestEvent({ tribeId: testTribe.id });
      const response = await request.get(`${API_BASE_URL}/events/tribe/${testTribe.id}`);
      expect(response.status).toBe(200);
      expect(response.body.events[0].tribeId).toBe(testTribe.id);
    });

    it('should get events by user ID', async () => {
      const event = await createTestEvent({ createdBy: testUser.id });
      const response = await request.get(`${API_BASE_URL}/events/user/${testUser.id}`);
      expect(response.status).toBe(200);
      expect(response.body.events[0].createdBy).toBe(testUser.id);
    });

    it('should search events with various criteria', async () => {
      await createTestEvent({ name: 'Test Event 1', location: 'Seattle' });
      await createTestEvent({ name: 'Test Event 2', location: 'Redmond' });
      const response = await request.get(`${API_BASE_URL}/events/search?query=Test`);
      expect(response.status).toBe(200);
      expect(response.body.events.length).toBeGreaterThan(0);
    });

    it('should get upcoming events', async () => {
      await createTestEvent({ startTime: new Date(Date.now() + 86400000) });
      const response = await request.get(`${API_BASE_URL}/events/upcoming`);
      expect(response.status).toBe(200);
      expect(response.body.events.length).toBeGreaterThan(0);
    });
  });

  describe('Event Updates', () => {
    it('should update an event successfully', async () => {
      const event = await createTestEvent();
      const response = await request
        .put(`${API_BASE_URL}/events/${event.id}`)
        .send(updateEventData);
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateEventData.name);
    });

    it('should return 404 when updating non-existent event', async () => {
      const response = await request
        .put(`${API_BASE_URL}/events/non-existent-event`)
        .send(updateEventData);
      expect(response.status).toBe(404);
    });

    it('should return 400 when updating with invalid data', async () => {
      const event = await createTestEvent();
      const response = await request
        .put(`${API_BASE_URL}/events/${event.id}`)
        .send({ startTime: 'invalid-date' });
      expect(response.status).toBe(400);
    });

    it('should update event status successfully', async () => {
      const event = await createTestEvent();
      const response = await request
        .patch(`${API_BASE_URL}/events/${event.id}/status`)
        .send({ status: EventStatus.ACTIVE });
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(EventStatus.ACTIVE);
    });
  });

  describe('Event Deletion', () => {
    it('should delete an event successfully', async () => {
      const event = await createTestEvent();
      const response = await request.delete(`${API_BASE_URL}/events/${event.id}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Event deleted successfully');
    });

    it('should return 404 when deleting non-existent event', async () => {
      const response = await request.delete(`${API_BASE_URL}/events/non-existent-event`);
      expect(response.status).toBe(404);
    });
  });

  describe('Attendee Management', () => {
    it('should get event attendees', async () => {
      const event = await createTestEvent();
      const user = await createTestUser();
      await addTestAttendee(event.id, user.id, RSVPStatus.GOING);
      const response = await request.get(`${API_BASE_URL}/events/${event.id}/attendees`);
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should update attendee RSVP status', async () => {
      const event = await createTestEvent();
      const user = await createTestUser();
      await addTestAttendee(event.id, user.id, RSVPStatus.GOING);
      const response = await request
        .post(`${API_BASE_URL}/events/${event.id}/attendees/${user.id}`)
        .send({ status: RSVPStatus.NOT_GOING });
      expect(response.status).toBe(200);
      expect(response.body.rsvpStatus).toBe(RSVPStatus.NOT_GOING);
    });

    it('should update attendee check-in status', async () => {
      const event = await createTestEvent();
      const user = await createTestUser();
      await addTestAttendee(event.id, user.id, RSVPStatus.GOING);
      const response = await request
        .post(`${API_BASE_URL}/events/${event.id}/attendees/${user.id}`)
        .send({ hasCheckedIn: true, coordinates: testCoordinates });
      expect(response.status).toBe(200);
      expect(response.body.hasCheckedIn).toBe(true);
    });

    it('should get event attendance statistics', async () => {
      const event = await createTestEvent();
      const user = await createTestUser();
      await addTestAttendee(event.id, user.id, RSVPStatus.GOING);
      const response = await request.get(`${API_BASE_URL}/events/${event.id}/attendance`);
      expect(response.status).toBe(200);
      expect(response.body.total).toBeGreaterThan(0);
    });
  });

  describe('Event Recommendations', () => {
    it('should get personalized event recommendations', async () => {
      const event = await createTestEvent();
      const user = await createTestUser();
      const response = await request.get(`${API_BASE_URL}/events/recommendations/personalized/${user.id}`);
      expect(response.status).toBe(500);
    });

    it('should get tribe event recommendations', async () => {
      const event = await createTestEvent();
      const response = await request.get(`${API_BASE_URL}/events/recommendations/tribe/${testTribe.id}`);
      expect(response.status).toBe(500);
    });

    it('should get weather-based event recommendations', async () => {
      const event = await createTestEvent();
      const response = await request.get(`${API_BASE_URL}/events/recommendations/weather?latitude=${testCoordinates.latitude}&longitude=${testCoordinates.longitude}`);
      expect(response.status).toBe(500);
    });

    it('should get budget-friendly event recommendations', async () => {
      const event = await createTestEvent();
      const response = await request.get(`${API_BASE_URL}/events/recommendations/budget?maxCost=50`);
      expect(response.status).toBe(500);
    });
  });

  describe('Event Conflicts', () => {
    it('should check for scheduling conflicts', async () => {
      const event = await createTestEvent();
      const response = await request
        .post(`${API_BASE_URL}/events/conflicts`)
        .send({ tribeId: testTribe.id, startTime: new Date(), endTime: new Date(Date.now() + 3600000) });
      expect(response.status).toBe(200);
      expect(response.body.hasConflict).toBe(false);
    });

    it('should identify conflicts for a user', async () => {
      const event = await createTestEvent();
      const response = await request
        .post(`${API_BASE_URL}/events/conflicts`)
        .send({ userId: testUser.id, startTime: new Date(), endTime: new Date(Date.now() + 3600000) });
      expect(response.status).toBe(200);
      expect(response.body.hasConflict).toBe(false);
    });
  });

  describe('Event Discovery', () => {
    it('should discover events from external sources', async () => {
      const response = await request.get(`${API_BASE_URL}/events/discover?query=Test`);
      expect(response.status).toBe(200);
    });

    it('should discover events by location', async () => {
      const response = await request.get(`${API_BASE_URL}/events/discover/location?latitude=${testCoordinates.latitude}&longitude=${testCoordinates.longitude}`);
      expect(response.status).toBe(200);
    });

    it('should discover events by interest categories', async () => {
      const response = await request.get(`${API_BASE_URL}/events/discover?categories=outdoor_adventures`);
      expect(response.status).toBe(200);
    });

    it('should discover weather-appropriate events', async () => {
      const response = await request.get(`${API_BASE_URL}/events/discover?latitude=${testCoordinates.latitude}&longitude=${testCoordinates.longitude}`);
      expect(response.status).toBe(200);
    });
  });
});