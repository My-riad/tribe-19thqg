import { PrismaClient } from '@prisma/client'; // ^4.16.0
import NodeCache from 'node-cache'; // ^5.1.2
import EventModel from '../src/models/event.model';
import AttendeeModel from '../src/models/attendee.model';
import {
  EventStatus,
  EventType,
  EventVisibility,
  RSVPStatus,
  IEvent,
  IEventCreate,
  IEventUpdate,
  IEventSearchParams,
  IEventRecommendationParams,
  IWeatherBasedActivityParams
} from '../../../shared/src/types/event.types';
import { ICoordinates, InterestCategory } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';

// Mock external dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn()
}));

jest.mock('node-cache', () => jest.fn());

jest.mock('../src/models/attendee.model', () => ({
  default: jest.fn()
}));

// Helper functions for creating mock objects
const createMockEvent = (overrides = {}): IEvent => {
  return {
    id: 'event-123',
    name: 'Test Event',
    description: 'Test Event Description',
    tribeId: 'tribe-123',
    createdBy: 'user-123',
    eventType: EventType.IN_PERSON,
    status: EventStatus.SCHEDULED,
    visibility: EventVisibility.TRIBE_ONLY,
    startTime: new Date('2023-08-15T10:00:00Z'),
    endTime: new Date('2023-08-15T12:00:00Z'),
    location: 'Test Location',
    coordinates: {
      latitude: 47.6062,
      longitude: -122.3321
    },
    venueId: 'venue-123',
    weatherData: {
      temperature: 75,
      condition: 'Sunny',
      icon: 'sun',
      precipitation: 0,
      forecast: 'Clear skies'
    },
    cost: 0,
    paymentRequired: false,
    maxAttendees: 20,
    categories: [InterestCategory.OUTDOOR_ADVENTURES],
    createdAt: new Date('2023-08-01T00:00:00Z'),
    updatedAt: new Date('2023-08-01T00:00:00Z'),
    metadata: {},
    ...overrides
  };
};

const createMockEventCreate = (overrides = {}): IEventCreate => {
  return {
    name: 'Test Event',
    description: 'Test Event Description',
    tribeId: 'tribe-123',
    createdBy: 'user-123',
    eventType: EventType.IN_PERSON,
    visibility: EventVisibility.TRIBE_ONLY,
    startTime: new Date('2023-08-15T10:00:00Z'),
    endTime: new Date('2023-08-15T12:00:00Z'),
    location: 'Test Location',
    coordinates: {
      latitude: 47.6062,
      longitude: -122.3321
    },
    venueId: 'venue-123',
    cost: 0,
    paymentRequired: false,
    maxAttendees: 20,
    categories: [InterestCategory.OUTDOOR_ADVENTURES],
    ...overrides
  };
};

const createMockEventUpdate = (overrides = {}): IEventUpdate => {
  return {
    name: 'Updated Event',
    description: 'Updated Event Description',
    eventType: EventType.IN_PERSON,
    visibility: EventVisibility.TRIBE_ONLY,
    startTime: new Date('2023-08-15T11:00:00Z'),
    endTime: new Date('2023-08-15T13:00:00Z'),
    location: 'Updated Location',
    coordinates: {
      latitude: 47.6062,
      longitude: -122.3321
    },
    cost: 10,
    paymentRequired: true,
    maxAttendees: 15,
    categories: [InterestCategory.OUTDOOR_ADVENTURES, InterestCategory.SPORTS_FITNESS],
    ...overrides
  };
};

describe('EventModel', () => {
  let mockPrisma: any;
  let mockCache: any;
  let mockAttendeeModel: any;
  let eventModel: EventModel;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up mock implementations
    mockPrisma = {
      event: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn()
      },
      eventAttendee: {
        findMany: jest.fn(),
        deleteMany: jest.fn()
      },
      user: {
        findUnique: jest.fn()
      },
      $transaction: jest.fn(callback => callback(mockPrisma))
    };
    
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      flushAll: jest.fn()
    };
    
    mockAttendeeModel = {
      getAttendeesByEventId: jest.fn()
    };
    
    // Mock the constructor implementations
    (PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);
    (NodeCache as jest.Mock).mockImplementation(() => mockCache);
    (AttendeeModel as jest.Mock).mockImplementation(() => mockAttendeeModel);
    
    // Create an instance of EventModel
    eventModel = new EventModel();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should initialize with Prisma client, cache, and AttendeeModel', () => {
    expect(PrismaClient).toHaveBeenCalled();
    expect(NodeCache).toHaveBeenCalled();
    expect(AttendeeModel).toHaveBeenCalled();
  });
  
  describe('getEventById', () => {
    it('should retrieve an event by ID', async () => {
      const mockEvent = createMockEvent();
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      
      const result = await eventModel.getEventById('event-123');
      
      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-123' }
      });
      expect(result).toEqual(mockEvent);
    });
    
    it('should return cached event if available', async () => {
      const mockEvent = createMockEvent();
      mockCache.get.mockReturnValue(mockEvent);
      
      const result = await eventModel.getEventById('event-123');
      
      expect(mockCache.get).toHaveBeenCalledWith('event:event-123');
      expect(mockPrisma.event.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });
    
    it('should include attendees when requested', async () => {
      const mockEvent = createMockEvent();
      const mockAttendees = [{ id: 'attendee-1', userId: 'user-1', eventId: 'event-123' }];
      
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockAttendeeModel.getAttendeesByEventId.mockResolvedValue(mockAttendees);
      
      const result = await eventModel.getEventById('event-123', true);
      
      expect(mockAttendeeModel.getAttendeesByEventId).toHaveBeenCalledWith('event-123');
      expect(result).toEqual({
        ...mockEvent,
        attendees: mockAttendees
      });
    });
    
    it('should return null if event not found', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);
      
      const result = await eventModel.getEventById('non-existent');
      
      expect(result).toBeNull();
    });
  });
  
  describe('getEventsByTribeId', () => {
    it('should retrieve events for a tribe', async () => {
      const mockEvents = [createMockEvent(), createMockEvent({ id: 'event-456' })];
      mockPrisma.event.count.mockResolvedValue(2);
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      
      const result = await eventModel.getEventsByTribeId('tribe-123', {
        status: [EventStatus.SCHEDULED],
        page: 1,
        limit: 10
      });
      
      expect(mockPrisma.event.count).toHaveBeenCalled();
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tribeId: 'tribe-123',
            status: {
              in: [EventStatus.SCHEDULED]
            }
          },
          orderBy: {
            startTime: 'asc'
          },
          skip: 0,
          take: 10
        })
      );
      
      expect(result).toEqual({
        events: mockEvents,
        total: 2
      });
    });
    
    it('should apply date filters when provided', async () => {
      const startDate = new Date('2023-08-01');
      const endDate = new Date('2023-08-31');
      
      mockPrisma.event.count.mockResolvedValue(1);
      mockPrisma.event.findMany.mockResolvedValue([createMockEvent()]);
      
      await eventModel.getEventsByTribeId('tribe-123', {
        startDate,
        endDate
      });
      
      expect(mockPrisma.event.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tribeId: 'tribe-123',
          startTime: {
            gte: startDate,
            lte: endDate
          }
        })
      });
    });
  });
  
  describe('getEventsByUserId', () => {
    it('should retrieve events for a user', async () => {
      const mockEvents = [createMockEvent(), createMockEvent({ id: 'event-456' })];
      
      mockPrisma.event.count.mockResolvedValueOnce(1); // Created events
      mockPrisma.event.count.mockResolvedValueOnce(1); // Attending events
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      
      const result = await eventModel.getEventsByUserId('user-123', {
        status: [EventStatus.SCHEDULED],
        page: 1,
        limit: 10
      });
      
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.arrayContaining([
              expect.objectContaining({
                createdBy: 'user-123',
                status: {
                  in: [EventStatus.SCHEDULED]
                }
              }),
              expect.objectContaining({
                EventAttendee: {
                  some: {
                    userId: 'user-123',
                    rsvpStatus: 'going'
                  }
                },
                status: {
                  in: [EventStatus.SCHEDULED]
                }
              })
            ])
          },
          orderBy: {
            startTime: 'asc'
          },
          skip: 0,
          take: 10,
          distinct: ['id']
        })
      );
      
      expect(result).toEqual({
        events: mockEvents,
        total: 2 // Sum of created and attending events
      });
    });
    
    it('should apply date filters when provided', async () => {
      const startDate = new Date('2023-08-01');
      const endDate = new Date('2023-08-31');
      
      mockPrisma.event.count.mockResolvedValueOnce(0);
      mockPrisma.event.count.mockResolvedValueOnce(0);
      mockPrisma.event.findMany.mockResolvedValue([]);
      
      await eventModel.getEventsByUserId('user-123', {
        startDate,
        endDate
      });
      
      // Check that both filter objects have the date constraints
      expect(mockPrisma.event.count).toHaveBeenCalledTimes(2);
      const firstCall = mockPrisma.event.count.mock.calls[0][0];
      expect(firstCall.where.startTime.gte).toEqual(startDate);
      expect(firstCall.where.startTime.lte).toEqual(endDate);
    });
  });
  
  describe('searchEvents', () => {
    it('should search for events based on criteria', async () => {
      const mockEvents = [createMockEvent(), createMockEvent({ id: 'event-456' })];
      mockPrisma.event.count.mockResolvedValue(2);
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      
      const searchParams: IEventSearchParams = {
        query: 'test',
        tribeId: 'tribe-123',
        status: [EventStatus.SCHEDULED],
        location: { latitude: 47.6062, longitude: -122.3321 },
        maxDistance: 10,
        page: 1,
        limit: 10
      };
      
      const result = await eventModel.searchEvents(searchParams);
      
      expect(mockPrisma.event.findMany).toHaveBeenCalled();
      // We won't check the exact query structure as it's complex,
      // but we can ensure the function was called
      
      expect(result).toEqual({
        events: mockEvents,
        total: 2
      });
    });
  });
  
  describe('createEvent', () => {
    it('should create a new event', async () => {
      const eventData = createMockEventCreate();
      const createdEvent = createMockEvent();
      
      mockPrisma.event.create.mockResolvedValue(createdEvent);
      
      const result = await eventModel.createEvent(eventData);
      
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: eventData.name,
          description: eventData.description,
          tribeId: eventData.tribeId,
          status: EventStatus.DRAFT // Default status
        })
      });
      
      expect(mockCache.set).toHaveBeenCalledWith(`event:${createdEvent.id}`, createdEvent);
      expect(result).toEqual(createdEvent);
    });
    
    it('should throw an error if required fields are missing', async () => {
      const invalidEventData = {
        name: 'Test Event'
        // Missing required fields
      } as IEventCreate;
      
      await expect(eventModel.createEvent(invalidEventData)).rejects.toThrow();
    });
    
    it('should throw an error if end time is before start time', async () => {
      const invalidEventData = createMockEventCreate({
        startTime: new Date('2023-08-15T12:00:00Z'),
        endTime: new Date('2023-08-15T10:00:00Z')
      });
      
      await expect(eventModel.createEvent(invalidEventData)).rejects.toThrow();
    });
  });
  
  describe('updateEvent', () => {
    it('should update an existing event', async () => {
      const mockEvent = createMockEvent();
      const updateData = createMockEventUpdate();
      const updatedEvent = { ...mockEvent, ...updateData };
      
      mockCache.get.mockReturnValue(mockEvent); // For the existingEvent check
      mockPrisma.event.update.mockResolvedValue(updatedEvent);
      
      const result = await eventModel.updateEvent('event-123', updateData);
      
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: updateData
      });
      
      expect(mockCache.set).toHaveBeenCalledWith('event:event-123', updatedEvent);
      expect(result).toEqual(updatedEvent);
    });
    
    it('should throw an error if event does not exist', async () => {
      mockCache.get.mockReturnValue(null);
      mockPrisma.event.findUnique.mockResolvedValue(null);
      
      await expect(eventModel.updateEvent('non-existent', createMockEventUpdate())).rejects.toThrow();
    });
    
    it('should throw an error if updated times would result in invalid time range', async () => {
      const mockEvent = createMockEvent();
      mockCache.get.mockReturnValue(mockEvent);
      
      // Start time after end time
      const invalidUpdate = createMockEventUpdate({
        startTime: new Date('2023-08-15T14:00:00Z'),
        endTime: new Date('2023-08-15T13:00:00Z')
      });
      
      await expect(eventModel.updateEvent('event-123', invalidUpdate)).rejects.toThrow();
    });
  });
  
  describe('updateEventStatus', () => {
    it('should update an event\'s status', async () => {
      const mockEvent = createMockEvent();
      const updatedEvent = { ...mockEvent, status: EventStatus.ACTIVE };
      
      mockCache.get.mockReturnValue(mockEvent);
      mockPrisma.event.update.mockResolvedValue(updatedEvent);
      
      const result = await eventModel.updateEventStatus('event-123', EventStatus.ACTIVE);
      
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: { status: EventStatus.ACTIVE }
      });
      
      expect(mockCache.set).toHaveBeenCalledWith('event:event-123', updatedEvent);
      expect(result).toEqual(updatedEvent);
    });
    
    it('should throw an error if event does not exist', async () => {
      mockCache.get.mockReturnValue(null);
      mockPrisma.event.findUnique.mockResolvedValue(null);
      
      await expect(eventModel.updateEventStatus('non-existent', EventStatus.ACTIVE)).rejects.toThrow();
    });
    
    it('should throw an error for invalid status transitions', async () => {
      const mockEvent = createMockEvent({ status: EventStatus.COMPLETED });
      mockCache.get.mockReturnValue(mockEvent);
      
      // Can't transition from COMPLETED to ACTIVE
      await expect(eventModel.updateEventStatus('event-123', EventStatus.ACTIVE)).rejects.toThrow();
    });
  });
  
  describe('updateEventWeather', () => {
    it('should update an event\'s weather data', async () => {
      const mockEvent = createMockEvent();
      const weatherData = {
        temperature: 80,
        condition: 'Partly Cloudy',
        icon: 'cloud-sun',
        precipitation: 10,
        forecast: 'Partly cloudy with a small chance of rain'
      };
      const updatedEvent = { ...mockEvent, weatherData };
      
      mockCache.get.mockReturnValue(mockEvent);
      mockPrisma.event.update.mockResolvedValue(updatedEvent);
      
      const result = await eventModel.updateEventWeather('event-123', weatherData);
      
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: { weatherData }
      });
      
      expect(mockCache.set).toHaveBeenCalledWith('event:event-123', updatedEvent);
      expect(result).toEqual(updatedEvent);
    });
    
    it('should throw an error if event does not exist', async () => {
      mockCache.get.mockReturnValue(null);
      mockPrisma.event.findUnique.mockResolvedValue(null);
      
      await expect(eventModel.updateEventWeather('non-existent', {
        temperature: 80,
        condition: 'Partly Cloudy',
        icon: 'cloud-sun',
        precipitation: 10,
        forecast: 'Partly cloudy with a small chance of rain'
      })).rejects.toThrow();
    });
  });
  
  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      const mockEvent = createMockEvent();
      mockCache.get.mockReturnValue(mockEvent);
      mockPrisma.event.delete.mockResolvedValue(mockEvent);
      
      const result = await eventModel.deleteEvent('event-123');
      
      expect(mockPrisma.eventAttendee.deleteMany).toHaveBeenCalledWith({
        where: { eventId: 'event-123' }
      });
      expect(mockPrisma.event.delete).toHaveBeenCalledWith({
        where: { id: 'event-123' }
      });
      expect(mockCache.del).toHaveBeenCalledWith('event:event-123');
      expect(result).toBe(true);
    });
    
    it('should return false if event does not exist', async () => {
      mockCache.get.mockReturnValue(null);
      mockPrisma.event.findUnique.mockResolvedValue(null);
      
      const result = await eventModel.deleteEvent('non-existent');
      
      expect(mockPrisma.event.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
  
  describe('getUpcomingEvents', () => {
    it('should retrieve upcoming events', async () => {
      const mockEvents = [createMockEvent(), createMockEvent({ id: 'event-456' })];
      mockPrisma.event.count.mockResolvedValue(2);
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      
      const result = await eventModel.getUpcomingEvents({
        tribeId: 'tribe-123',
        page: 1,
        limit: 10
      });
      
      expect(mockPrisma.event.findMany).toHaveBeenCalled();
      const findManyCall = mockPrisma.event.findMany.mock.calls[0][0];
      expect(findManyCall.where.startTime.gte).toBeDefined(); // Should have a start time filter
      expect(findManyCall.where.status.in).toEqual([EventStatus.SCHEDULED, EventStatus.ACTIVE]);
      expect(findManyCall.where.tribeId).toEqual('tribe-123');
      
      expect(result).toEqual({
        events: mockEvents,
        total: 2
      });
    });
    
    it('should apply date range filters when provided', async () => {
      const startDate = new Date('2023-08-01');
      const endDate = new Date('2023-08-31');
      
      mockPrisma.event.count.mockResolvedValue(0);
      mockPrisma.event.findMany.mockResolvedValue([]);
      
      await eventModel.getUpcomingEvents({
        startDate,
        endDate
      });
      
      const countCall = mockPrisma.event.count.mock.calls[0][0];
      expect(countCall.where.startTime.gte).toEqual(startDate);
      expect(countCall.where.startTime.lte).toEqual(endDate);
    });
  });
  
  describe('getEventAttendees', () => {
    it('should retrieve attendees for an event', async () => {
      const mockEvent = createMockEvent();
      const mockAttendees = [
        {
          id: 'attendee-1',
          eventId: 'event-123',
          userId: 'user-1',
          user: {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            profile: {
              avatarUrl: 'https://example.com/avatar1.jpg'
            }
          }
        },
        {
          id: 'attendee-2',
          eventId: 'event-123',
          userId: 'user-2',
          user: {
            id: 'user-2',
            name: 'User Two',
            email: 'user2@example.com',
            profile: null // Test null profile handling
          }
        }
      ];
      
      mockCache.get.mockReturnValue(mockEvent);
      mockPrisma.eventAttendee.findMany.mockResolvedValue(mockAttendees);
      
      const result = await eventModel.getEventAttendees('event-123');
      
      expect(mockPrisma.eventAttendee.findMany).toHaveBeenCalledWith({
        where: { eventId: 'event-123' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: {
                select: {
                  avatarUrl: true
                }
              }
            }
          }
        },
        orderBy: {
          rsvpTime: 'desc'
        }
      });
      
      // Check that avatarUrl is extracted from profile
      expect(result[0].user.avatarUrl).toBe('https://example.com/avatar1.jpg');
      expect(result[1].user.avatarUrl).toBeNull();
    });
    
    it('should throw an error if event does not exist', async () => {
      mockCache.get.mockReturnValue(null);
      mockPrisma.event.findUnique.mockResolvedValue(null);
      
      await expect(eventModel.getEventAttendees('non-existent')).rejects.toThrow();
    });
  });
  
  describe('checkEventConflicts', () => {
    it('should check for scheduling conflicts', async () => {
      const startTime = new Date('2023-08-15T10:00:00Z');
      const endTime = new Date('2023-08-15T12:00:00Z');
      const mockConflictingEvents = [createMockEvent()];
      
      mockPrisma.event.findMany.mockResolvedValue(mockConflictingEvents);
      
      const result = await eventModel.checkEventConflicts(
        'tribe-123', // tribeId
        null, // userId
        startTime,
        endTime
      );
      
      expect(mockPrisma.event.findMany).toHaveBeenCalled();
      const findManyCall = mockPrisma.event.findMany.mock.calls[0][0];
      expect(findManyCall.where.tribeId).toEqual('tribe-123');
      expect(findManyCall.where.status.in).toEqual([EventStatus.SCHEDULED, EventStatus.ACTIVE]);
      expect(findManyCall.where.OR).toBeDefined(); // Time overlap conditions
      
      expect(result).toEqual({
        hasConflict: true,
        conflictingEvents: mockConflictingEvents
      });
    });
    
    it('should require either tribeId or userId', async () => {
      const startTime = new Date('2023-08-15T10:00:00Z');
      const endTime = new Date('2023-08-15T12:00:00Z');
      
      await expect(eventModel.checkEventConflicts(
        null, // No tribeId
        null, // No userId
        startTime,
        endTime
      )).rejects.toThrow();
    });
    
    it('should exclude the specified event when checking conflicts', async () => {
      const startTime = new Date('2023-08-15T10:00:00Z');
      const endTime = new Date('2023-08-15T12:00:00Z');
      
      mockPrisma.event.findMany.mockResolvedValue([]);
      
      await eventModel.checkEventConflicts(
        'tribe-123',
        null,
        startTime,
        endTime,
        'event-to-exclude'
      );
      
      const findManyCall = mockPrisma.event.findMany.mock.calls[0][0];
      expect(findManyCall.where.id).toEqual({
        not: 'event-to-exclude'
      });
    });
  });
  
  describe('getEventsByCategory', () => {
    it('should retrieve events by category', async () => {
      const mockEvents = [createMockEvent(), createMockEvent({ id: 'event-456' })];
      mockPrisma.event.count.mockResolvedValue(2);
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      
      const result = await eventModel.getEventsByCategory(
        InterestCategory.OUTDOOR_ADVENTURES,
        {
          tribeId: 'tribe-123',
          page: 1,
          limit: 10
        }
      );
      
      expect(mockPrisma.event.findMany).toHaveBeenCalled();
      const findManyCall = mockPrisma.event.findMany.mock.calls[0][0];
      expect(findManyCall.where.categories.has).toEqual(InterestCategory.OUTDOOR_ADVENTURES);
      expect(findManyCall.where.tribeId).toEqual('tribe-123');
      
      expect(result).toEqual({
        events: mockEvents,
        total: 2
      });
    });
  });
  
  describe('getEventsByLocation', () => {
    it('should retrieve events near a location', async () => {
      const mockEvents = [createMockEvent(), createMockEvent({ id: 'event-456' })];
      mockPrisma.event.count.mockResolvedValue(2);
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      
      const coordinates: ICoordinates = {
        latitude: 47.6062,
        longitude: -122.3321
      };
      
      const result = await eventModel.getEventsByLocation(
        coordinates,
        10, // 10 mile radius
        {
          page: 1,
          limit: 10
        }
      );
      
      expect(mockPrisma.event.findMany).toHaveBeenCalled();
      const findManyCall = mockPrisma.event.findMany.mock.calls[0][0];
      expect(findManyCall.where.coordinates).toBeDefined();
      expect(findManyCall.where.coordinates.latitude).toBeDefined();
      expect(findManyCall.where.coordinates.longitude).toBeDefined();
      
      expect(result).toEqual({
        events: mockEvents,
        total: 2
      });
    });
  });
  
  describe('getPopularEvents', () => {
    it('should retrieve popular events based on attendance', async () => {
      const mockEventsWithAttendeeCount = [
        {
          ...createMockEvent(),
          _count: { EventAttendee: 10 }
        },
        {
          ...createMockEvent({ id: 'event-456' }),
          _count: { EventAttendee: 5 }
        }
      ];
      
      mockPrisma.event.count.mockResolvedValue(2);
      mockPrisma.event.findMany.mockResolvedValue(mockEventsWithAttendeeCount);
      
      const result = await eventModel.getPopularEvents({
        page: 1,
        limit: 10
      });
      
      expect(mockPrisma.event.findMany).toHaveBeenCalled();
      const findManyCall = mockPrisma.event.findMany.mock.calls[0][0];
      expect(findManyCall.include._count).toBeDefined();
      expect(findManyCall.orderBy.EventAttendee).toBeDefined();
      
      // Check that the result transforms the data correctly
      expect(result.events[0].attendeeCount).toBe(10);
      expect(result.events[1].attendeeCount).toBe(5);
      expect(result.total).toBe(2);
    });
  });
  
  describe('recommendEvents', () => {
    it('should recommend events based on user preferences', async () => {
      const mockUser = {
        id: 'user-123',
        profile: {
          interests: [
            { category: InterestCategory.OUTDOOR_ADVENTURES },
            { category: InterestCategory.SPORTS_FITNESS }
          ]
        },
        EventAttendee: []
      };
      
      const mockEvents = [
        {
          ...createMockEvent(),
          _count: { EventAttendee: 8 }
        },
        {
          ...createMockEvent({ id: 'event-456', categories: [InterestCategory.SPORTS_FITNESS] }),
          _count: { EventAttendee: 5 }
        }
      ];
      
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      
      const params: IEventRecommendationParams = {
        userId: 'user-123',
        location: {
          latitude: 47.6062,
          longitude: -122.3321
        },
        maxDistance: 10
      };
      
      const result = await eventModel.recommendEvents(params);
      
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: expect.anything()
      });
      
      expect(mockPrisma.event.findMany).toHaveBeenCalled();
      
      // Check that events are returned with relevance scores
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events[0].relevanceScore).toBeDefined();
    });
    
    it('should throw an error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      const params: IEventRecommendationParams = {
        userId: 'non-existent',
        location: {
          latitude: 47.6062,
          longitude: -122.3321
        },
        maxDistance: 10
      };
      
      await expect(eventModel.recommendEvents(params)).rejects.toThrow();
    });
  });
  
  describe('recommendWeatherBasedEvents', () => {
    it('should recommend events based on weather conditions', async () => {
      const mockEvents = [
        {
          ...createMockEvent({
            weatherData: {
              temperature: 75,
              condition: 'Sunny',
              icon: 'sun',
              precipitation: 0,
              forecast: 'Clear skies'
            }
          }),
          _count: { EventAttendee: 8 }
        },
        {
          ...createMockEvent({
            id: 'event-456',
            weatherData: {
              temperature: 65,
              condition: 'Partly Cloudy',
              icon: 'cloud-sun',
              precipitation: 10,
              forecast: 'Partly cloudy'
            }
          }),
          _count: { EventAttendee: 5 }
        }
      ];
      
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      
      const params: IWeatherBasedActivityParams = {
        location: {
          latitude: 47.6062,
          longitude: -122.3321
        },
        date: new Date('2023-08-15'),
        preferIndoor: false,
        preferOutdoor: true,
        maxDistance: 10
      };
      
      const result = await eventModel.recommendWeatherBasedEvents(params);
      
      expect(mockPrisma.event.findMany).toHaveBeenCalled();
      
      // Check that events are returned with relevance scores
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events[0].relevanceScore).toBeDefined();
    });
  });
  
  describe('clearCache', () => {
    it('should clear the event cache', () => {
      eventModel.clearCache();
      
      expect(mockCache.flushAll).toHaveBeenCalled();
    });
  });
  
  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockCache.get.mockReturnValue(null);
      mockPrisma.event.findUnique.mockRejectedValue(new Error('Database error'));
      
      await expect(eventModel.getEventById('event-123')).rejects.toThrow('Database error');
      
      // Test error handling in another method
      const eventData = createMockEventCreate();
      mockPrisma.event.create.mockRejectedValue(new Error('Database error'));
      
      await expect(eventModel.createEvent(eventData)).rejects.toThrow('Database error');
    });
  });
});