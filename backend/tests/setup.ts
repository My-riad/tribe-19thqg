/**
 * Test Setup Module
 * 
 * This module provides utilities for setting up and tearing down the test environment,
 * managing database connections, providing test data cleanup, and mocking
 * external API services for integration and end-to-end testing.
 */

import nock from 'nock'; // ^13.3.1
import { faker } from '@faker-js/faker'; // ^8.0.2
import * as jest from 'jest'; // ^29.5.0

import database from '../src/config/database';
import env from '../src/config/env';
import { logger } from '../src/shared/src/utils/logger.util';

// Extract necessary functions and objects from imports
const { prisma, connectDatabase, disconnectDatabase } = database;

/**
 * Initializes the test database connection
 * 
 * @returns Promise that resolves when the database is connected
 */
export const setupTestDatabase = async (): Promise<void> => {
  // Set NODE_ENV to 'test' if not already set
  if (process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'test';
  }
  
  logger.info('Setting up test database connection');
  
  // Connect to the test database
  await connectDatabase();
  
  logger.info('Test database connected successfully');
};

/**
 * Closes the test database connection
 * 
 * @returns Promise that resolves when the database is disconnected
 */
export const teardownTestDatabase = async (): Promise<void> => {
  logger.info('Tearing down test database connection');
  
  // Disconnect from the test database
  await disconnectDatabase();
  
  logger.info('Test database disconnected successfully');
};

/**
 * Clears test data from the database
 * 
 * @param userIds - Array of user IDs to delete
 * @param profileIds - Array of profile IDs to delete
 * @param tribeIds - Array of tribe IDs to delete
 * @param eventIds - Array of event IDs to delete
 * @returns Promise that resolves when data is cleared
 */
export const clearTestData = async (
  userIds: string[] = [],
  profileIds: string[] = [],
  tribeIds: string[] = [],
  eventIds: string[] = []
): Promise<void> => {
  logger.info('Clearing test data from database');
  
  try {
    // Delete event attendees related to provided eventIds
    if (eventIds.length > 0) {
      await prisma.eventAttendee.deleteMany({
        where: {
          eventId: {
            in: eventIds
          }
        }
      });
    }
    
    // Delete events related to provided eventIds
    if (eventIds.length > 0) {
      await prisma.event.deleteMany({
        where: {
          id: {
            in: eventIds
          }
        }
      });
    }
    
    // Delete tribe memberships related to provided tribeIds
    if (tribeIds.length > 0) {
      await prisma.tribeMembership.deleteMany({
        where: {
          tribeId: {
            in: tribeIds
          }
        }
      });
    }
    
    // Delete tribes related to provided tribeIds
    if (tribeIds.length > 0) {
      await prisma.tribe.deleteMany({
        where: {
          id: {
            in: tribeIds
          }
        }
      });
    }
    
    // Delete profiles related to provided profileIds
    if (profileIds.length > 0) {
      await prisma.profile.deleteMany({
        where: {
          id: {
            in: profileIds
          }
        }
      });
    }
    
    // Delete users related to provided userIds
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: userIds
          }
        }
      });
    }
    
    logger.info('Test data cleaned up successfully');
  } catch (error) {
    logger.error('Error cleaning up test data', error as Error);
    throw error;
  }
};

/**
 * Sets up mock responses for external APIs used in tests
 * 
 * @returns Object containing nock interceptors for cleanup
 */
export const setupMockExternalAPIs = () => {
  // Set up mock for OpenRouter API (AI capabilities)
  const openRouterMock = nock('https://openrouter.ai/api')
    .post('/chat/completions')
    .reply(200, {
      id: 'mock-completion-id',
      choices: [
        {
          message: {
            content: 'Mock AI response for testing'
          }
        }
      ]
    });
  
  // Set up mock for Auth0 API (authentication)
  const auth0Mock = nock('https://tribe-dev.auth0.com')
    .post('/oauth/token')
    .reply(200, {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 86400
    })
    .get('/userinfo')
    .reply(200, {
      sub: 'auth0|123456',
      email: 'test@example.com',
      email_verified: true
    });
  
  // Set up mock for Stripe API (payment processing)
  const stripeMock = nock('https://api.stripe.com/v1')
    .post('/payment_intents')
    .reply(200, {
      id: 'pi_mock_123456',
      status: 'succeeded',
      amount: 1000,
      currency: 'usd'
    });
  
  // Set up mock for Eventbrite/Meetup APIs (event discovery)
  const eventbriteMock = nock('https://www.eventbriteapi.com/v3')
    .get('/events/search')
    .query(true)
    .reply(200, {
      events: [
        {
          id: 'mock-event-1',
          name: { text: 'Mock Event 1' },
          description: { text: 'Mock event description' },
          start: { local: '2023-12-01T19:00:00' },
          end: { local: '2023-12-01T22:00:00' },
          venue_id: 'mock-venue-1'
        }
      ]
    });
  
  const meetupMock = nock('https://api.meetup.com/gql')
    .post('/')
    .reply(200, {
      data: {
        events: [
          {
            id: 'mock-meetup-1',
            title: 'Mock Meetup 1',
            description: 'Mock meetup description',
            dateTime: '2023-12-02T18:00:00'
          }
        ]
      }
    });
  
  // Set up mock for Google Places API (location services)
  const googlePlacesMock = nock('https://maps.googleapis.com/maps/api')
    .get('/place/nearbysearch/json')
    .query(true)
    .reply(200, {
      results: [
        {
          place_id: 'mock-place-1',
          name: 'Mock Venue 1',
          vicinity: '123 Test St, Seattle, WA',
          geometry: {
            location: {
              lat: 47.6062,
              lng: -122.3321
            }
          }
        }
      ]
    });
  
  // Set up mock for OpenWeatherMap API (weather data)
  const weatherMock = nock('https://api.openweathermap.org/data/2.5')
    .get('/forecast')
    .query(true)
    .reply(200, {
      list: [
        {
          dt: 1638360000,
          main: {
            temp: 293.15,
            feels_like: 292.15
          },
          weather: [
            {
              id: 800,
              main: 'Clear',
              description: 'clear sky'
            }
          ]
        }
      ]
    });
  
  // Set up mock for Firebase Cloud Messaging (push notifications)
  const firebaseMock = nock('https://fcm.googleapis.com/fcm')
    .post('/send')
    .reply(200, {
      success: true,
      message_id: 'mock-message-id'
    });
  
  // Return object with all mock interceptors for later cleanup
  return {
    openRouterMock,
    auth0Mock,
    stripeMock,
    eventbriteMock,
    meetupMock,
    googlePlacesMock,
    weatherMock,
    firebaseMock
  };
};

/**
 * Cleans up mock external API interceptors
 * 
 * @param mockInterceptors - Object containing nock interceptors
 */
export const cleanupMockExternalAPIs = (mockInterceptors: object): void => {
  // Clean up all nock interceptors
  nock.cleanAll();
  
  // Ensure nock is not intercepting any unexpected requests
  nock.restore();
};

/**
 * Generates test user data with random values
 * 
 * @param overrides - Optional overrides for the generated data
 * @returns Test user data
 */
export const generateTestUser = (overrides = {}): object => {
  // Generate random email using faker
  const email = faker.internet.email();
  
  // Generate random password using faker
  const password = faker.internet.password({ length: 12 });
  
  // Set default values for other fields
  const defaults = {
    email,
    password,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Override defaults with any provided values
  return {
    ...defaults,
    ...overrides
  };
};

/**
 * Generates test profile data with random values
 * 
 * @param userId - User ID to associate with the profile
 * @returns Test profile data
 */
export const generateTestProfile = (userId: string): object => {
  // Generate random name using faker
  const name = faker.person.fullName();
  
  // Generate random bio using faker
  const bio = faker.lorem.paragraph();
  
  // Generate random location using faker
  const location = `${faker.location.city()}, ${faker.location.state()}`;
  
  // Set userId from parameter
  return {
    userId,
    name,
    bio,
    location,
    coordinates: {
      latitude: parseFloat(faker.location.latitude()),
      longitude: parseFloat(faker.location.longitude())
    },
    avatarUrl: faker.image.avatar(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

/**
 * Sets up global Jest configuration for tests
 */
export const setupJestGlobals = (): void => {
  // Set default test timeout to 30000ms
  jest.setTimeout(30000);
  
  // Configure Jest to detect open handles
  jest.retryTimes(0);
  
  // Set up global beforeAll hook to connect to test database
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  // Set up global afterAll hook to disconnect from test database
  afterAll(async () => {
    await teardownTestDatabase();
  });
};