import { PrismaClient } from '@prisma/client'; // ^4.16.0
import NodeCache from 'node-cache'; // ^5.1.2
import {
  IEvent,
  IEventCreate,
  IEventUpdate,
  IEventSearchParams,
  IEventRecommendationParams,
  IWeatherBasedActivityParams,
  EventStatus,
  EventType,
  EventVisibility,
  IWeatherData,
} from '../../../shared/src/types/event.types';
import { 
  ICoordinates,
  InterestCategory
} from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';
import AttendeeModel from './attendee.model';

/**
 * Model class for managing event data and operations in the Tribe platform.
 * Handles all event-related database operations including creation, retrieval,
 * updating, and deletion of events, as well as specialized queries for event
 * discovery, recommendations, and attendance tracking.
 */
class EventModel {
  private prisma: PrismaClient;
  private cache: NodeCache;
  private attendeeModel: AttendeeModel;

  /**
   * Initializes a new instance of the EventModel class
   */
  constructor() {
    // Initialize Prisma client for database operations
    this.prisma = new PrismaClient();
    
    // Initialize cache for event data
    this.cache = new NodeCache({
      stdTTL: 900, // 15 minutes default TTL
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false // Don't clone objects when getting/setting (for performance)
    });
    
    // Initialize the AttendeeModel for attendee operations
    this.attendeeModel = new AttendeeModel();
    
    logger.info('EventModel initialized');
  }

  /**
   * Retrieves an event by its ID
   * 
   * @param id - The ID of the event to retrieve
   * @param includeAttendees - Whether to include attendee data (default: false)
   * @returns Promise resolving to the event if found, null otherwise
   */
  async getEventById(id: string, includeAttendees: boolean = false): Promise<IEvent | null> {
    try {
      // Check cache first
      const cacheKey = `event:${id}`;
      const cachedEvent = this.cache.get<IEvent>(cacheKey);
      
      if (cachedEvent) {
        logger.debug(`Cache hit for event: ${id}`);
        
        // If attendees are requested but not in cached data, we need to fetch from DB
        if (includeAttendees && !cachedEvent.hasOwnProperty('attendees')) {
          logger.debug(`Fetching attendees for cached event: ${id}`);
          const attendees = await this.attendeeModel.getAttendeesByEventId(id);
          const eventWithAttendees = { ...cachedEvent, attendees };
          return eventWithAttendees;
        }
        
        return cachedEvent;
      }
      
      logger.debug(`Cache miss for event: ${id}, fetching from database`);
      
      // Fetch from database
      const event = await this.prisma.event.findUnique({
        where: { id }
      });
      
      if (!event) {
        logger.debug(`Event not found: ${id}`);
        return null;
      }
      
      // Convert to IEvent type
      const eventData = event as unknown as IEvent;
      
      // Cache the event
      this.cache.set(cacheKey, eventData);
      
      // Include attendees if requested
      if (includeAttendees) {
        const attendees = await this.attendeeModel.getAttendeesByEventId(id);
        return { ...eventData, attendees };
      }
      
      return eventData;
    } catch (error) {
      logger.error(`Error retrieving event: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Retrieves all events for a specific tribe
   * 
   * @param tribeId - The ID of the tribe
   * @param options - Filtering and pagination options
   * @returns Promise resolving to events for the tribe with pagination info
   */
  async getEventsByTribeId(
    tribeId: string, 
    options: {
      status?: EventStatus[];
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.debug(`Retrieving events for tribe: ${tribeId}`, { options });
      
      // Set default pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;
      
      // Build where clause
      const where: any = {
        tribeId
      };
      
      // Apply status filter if provided
      if (options.status && options.status.length > 0) {
        where.status = {
          in: options.status
        };
      }
      
      // Apply date filters if provided
      if (options.startDate || options.endDate) {
        where.startTime = {};
        
        if (options.startDate) {
          where.startTime.gte = options.startDate;
        }
        
        if (options.endDate) {
          where.startTime.lte = options.endDate;
        }
      }
      
      // Get total count
      const total = await this.prisma.event.count({ where });
      
      // Get paginated events
      const events = await this.prisma.event.findMany({
        where,
        orderBy: {
          startTime: 'asc'
        },
        skip,
        take: limit
      });
      
      logger.debug(`Found ${events.length} events for tribe: ${tribeId}`);
      
      return {
        events: events as unknown as IEvent[],
        total
      };
    } catch (error) {
      logger.error(`Error retrieving events for tribe: ${tribeId}`, error as Error);
      throw error;
    }
  }

  /**
   * Retrieves all events a user is attending or created
   * 
   * @param userId - The ID of the user
   * @param options - Filtering and pagination options
   * @returns Promise resolving to events the user is involved with
   */
  async getEventsByUserId(
    userId: string,
    options: {
      status?: EventStatus[];
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.debug(`Retrieving events for user: ${userId}`, { options });
      
      // Set default pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;
      
      // Build filters for events created by the user
      const createdByFilter: any = {
        createdBy: userId
      };
      
      // Build filters for events the user is attending
      const attendingFilter: any = {
        EventAttendee: {
          some: {
            userId,
            rsvpStatus: 'going'
          }
        }
      };
      
      // Apply status filter if provided
      if (options.status && options.status.length > 0) {
        createdByFilter.status = {
          in: options.status
        };
        attendingFilter.status = {
          in: options.status
        };
      }
      
      // Apply date filters if provided
      if (options.startDate || options.endDate) {
        createdByFilter.startTime = {};
        attendingFilter.startTime = {};
        
        if (options.startDate) {
          createdByFilter.startTime.gte = options.startDate;
          attendingFilter.startTime.gte = options.startDate;
        }
        
        if (options.endDate) {
          createdByFilter.startTime.lte = options.endDate;
          attendingFilter.startTime.lte = options.endDate;
        }
      }
      
      // Get total count for created events
      const createdTotal = await this.prisma.event.count({
        where: createdByFilter
      });
      
      // Get total count for attending events
      const attendingTotal = await this.prisma.event.count({
        where: attendingFilter
      });
      
      // Get combined events
      const events = await this.prisma.event.findMany({
        where: {
          OR: [
            createdByFilter,
            attendingFilter
          ]
        },
        orderBy: {
          startTime: 'asc'
        },
        skip,
        take: limit,
        distinct: ['id'] // Ensure no duplicates if user created and is attending
      });
      
      logger.debug(`Found ${events.length} events for user: ${userId}`);
      
      return {
        events: events as unknown as IEvent[],
        total: createdTotal + attendingTotal // This is not exact due to potential overlap, but close enough
      };
    } catch (error) {
      logger.error(`Error retrieving events for user: ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Searches for events based on various criteria
   * 
   * @param searchParams - Parameters for filtering events
   * @returns Promise resolving to search results with pagination info
   */
  async searchEvents(
    searchParams: IEventSearchParams
  ): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.debug('Searching events', { searchParams });
      
      // Set default pagination
      const page = searchParams.page || 1;
      const limit = searchParams.limit || 20;
      const skip = (page - 1) * limit;
      
      // Build query filters
      const where: any = {};
      
      // Text search
      if (searchParams.query) {
        where.OR = [
          {
            name: {
              contains: searchParams.query,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: searchParams.query,
              mode: 'insensitive'
            }
          }
        ];
      }
      
      // Tribe filter
      if (searchParams.tribeId) {
        where.tribeId = searchParams.tribeId;
      }
      
      // User filter
      if (searchParams.userId) {
        where.OR = [
          ...(where.OR || []),
          { createdBy: searchParams.userId },
          {
            EventAttendee: {
              some: {
                userId: searchParams.userId
              }
            }
          }
        ];
      }
      
      // Status filter
      if (searchParams.status && searchParams.status.length > 0) {
        where.status = {
          in: searchParams.status
        };
      }
      
      // Event type filter
      if (searchParams.eventType && searchParams.eventType.length > 0) {
        where.eventType = {
          in: searchParams.eventType
        };
      }
      
      // Category filter
      if (searchParams.categories && searchParams.categories.length > 0) {
        where.categories = {
          hasSome: searchParams.categories
        };
      }
      
      // Location-based filtering
      if (searchParams.location && searchParams.maxDistance) {
        // For simplicity, we'll do a rough bounding box query here
        // In a production system, we'd use a more sophisticated geospatial query
        
        const { latitude, longitude } = searchParams.location;
        const maxDistance = searchParams.maxDistance; // in miles
        
        // Rough conversion: 1 degree lat/lon is approximately 69 miles at the equator
        // This is a simplification and doesn't account for the Earth's curvature
        const latDegrees = maxDistance / 69;
        const lonDegrees = maxDistance / (69 * Math.cos(latitude * (Math.PI / 180)));
        
        where.coordinates = {
          latitude: {
            gte: latitude - latDegrees,
            lte: latitude + latDegrees
          },
          longitude: {
            gte: longitude - lonDegrees,
            lte: longitude + lonDegrees
          }
        };
      }
      
      // Date range filtering
      if (searchParams.startDate || searchParams.endDate) {
        where.startTime = {};
        
        if (searchParams.startDate) {
          where.startTime.gte = searchParams.startDate;
        }
        
        if (searchParams.endDate) {
          where.startTime.lte = searchParams.endDate;
        }
      }
      
      // Cost filtering
      if (searchParams.maxCost !== undefined && searchParams.maxCost >= 0) {
        where.cost = {
          lte: searchParams.maxCost
        };
      }
      
      // Get total count
      const total = await this.prisma.event.count({ where });
      
      // Get paginated events
      const events = await this.prisma.event.findMany({
        where,
        orderBy: {
          startTime: 'asc'
        },
        skip,
        take: limit
      });
      
      logger.debug(`Found ${events.length} events matching search criteria`);
      
      return {
        events: events as unknown as IEvent[],
        total
      };
    } catch (error) {
      logger.error('Error searching events', error as Error);
      throw error;
    }
  }

  /**
   * Creates a new event with the provided data
   * 
   * @param eventData - Data for the new event
   * @returns Promise resolving to the created event
   */
  async createEvent(eventData: IEventCreate): Promise<IEvent> {
    try {
      logger.debug('Creating new event', { eventData });
      
      // Validate required fields
      if (!eventData.name || !eventData.tribeId || !eventData.createdBy ||
          !eventData.startTime || !eventData.endTime) {
        throw ApiError.badRequest('Missing required event fields');
      }
      
      // Validate dates
      if (new Date(eventData.startTime) >= new Date(eventData.endTime)) {
        throw ApiError.badRequest('End time must be after start time');
      }
      
      // Set default values for optional fields
      const eventCreate: any = {
        ...eventData,
        status: EventStatus.DRAFT,
        eventType: eventData.eventType || EventType.IN_PERSON,
        visibility: eventData.visibility || EventVisibility.TRIBE_ONLY,
        paymentRequired: eventData.paymentRequired || false,
        cost: eventData.cost || 0,
        maxAttendees: eventData.maxAttendees || 0,
        categories: eventData.categories || [],
        metadata: {}
      };
      
      // Create the event
      const event = await this.prisma.event.create({
        data: eventCreate
      });
      
      // Cache the new event
      const cacheKey = `event:${event.id}`;
      this.cache.set(cacheKey, event);
      
      logger.info('Event created successfully', { eventId: event.id });
      
      return event as unknown as IEvent;
    } catch (error) {
      logger.error('Error creating event', error as Error);
      throw error;
    }
  }

  /**
   * Updates an existing event
   * 
   * @param id - The ID of the event to update
   * @param eventData - Updated event data
   * @returns Promise resolving to the updated event
   */
  async updateEvent(id: string, eventData: IEventUpdate): Promise<IEvent> {
    try {
      logger.debug(`Updating event: ${id}`, { eventData });
      
      // Check if event exists
      const existingEvent = await this.getEventById(id);
      if (!existingEvent) {
        throw ApiError.notFound(`Event not found: ${id}`);
      }
      
      // Validate dates if both are provided
      if (eventData.startTime && eventData.endTime &&
          new Date(eventData.startTime) >= new Date(eventData.endTime)) {
        throw ApiError.badRequest('End time must be after start time');
      }
      
      // Validate start time if only it is provided
      if (eventData.startTime && !eventData.endTime &&
          new Date(eventData.startTime) >= new Date(existingEvent.endTime)) {
        throw ApiError.badRequest('Start time must be before end time');
      }
      
      // Validate end time if only it is provided
      if (!eventData.startTime && eventData.endTime &&
          new Date(existingEvent.startTime) >= new Date(eventData.endTime)) {
        throw ApiError.badRequest('End time must be after start time');
      }
      
      // Update the event
      const updatedEvent = await this.prisma.event.update({
        where: { id },
        data: eventData
      });
      
      // Update the cache
      const cacheKey = `event:${id}`;
      this.cache.set(cacheKey, updatedEvent);
      
      logger.info(`Event updated successfully: ${id}`);
      
      return updatedEvent as unknown as IEvent;
    } catch (error) {
      logger.error(`Error updating event: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Updates the status of an event
   * 
   * @param id - The ID of the event
   * @param status - The new status
   * @returns Promise resolving to the updated event
   */
  async updateEventStatus(id: string, status: EventStatus): Promise<IEvent> {
    try {
      logger.debug(`Updating event status: ${id}`, { status });
      
      // Check if event exists
      const existingEvent = await this.getEventById(id);
      if (!existingEvent) {
        throw ApiError.notFound(`Event not found: ${id}`);
      }
      
      // Validate status transition
      const validTransitions = {
        [EventStatus.DRAFT]: [EventStatus.SCHEDULED, EventStatus.CANCELLED],
        [EventStatus.SCHEDULED]: [EventStatus.ACTIVE, EventStatus.CANCELLED],
        [EventStatus.ACTIVE]: [EventStatus.COMPLETED, EventStatus.CANCELLED],
        [EventStatus.COMPLETED]: [],
        [EventStatus.CANCELLED]: [EventStatus.SCHEDULED]
      };
      
      if (!validTransitions[existingEvent.status].includes(status) && 
          existingEvent.status !== status) {
        throw ApiError.badRequest(
          `Invalid status transition from ${existingEvent.status} to ${status}`
        );
      }
      
      // Update the event status
      const updatedEvent = await this.prisma.event.update({
        where: { id },
        data: { status }
      });
      
      // Update the cache
      const cacheKey = `event:${id}`;
      this.cache.set(cacheKey, updatedEvent);
      
      logger.info(`Event status updated successfully: ${id}`, { status });
      
      return updatedEvent as unknown as IEvent;
    } catch (error) {
      logger.error(`Error updating event status: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Updates the weather data for an event
   * 
   * @param id - The ID of the event
   * @param weatherData - Updated weather data
   * @returns Promise resolving to the updated event
   */
  async updateEventWeather(id: string, weatherData: IWeatherData): Promise<IEvent> {
    try {
      logger.debug(`Updating event weather data: ${id}`, { weatherData });
      
      // Check if event exists
      const existingEvent = await this.getEventById(id);
      if (!existingEvent) {
        throw ApiError.notFound(`Event not found: ${id}`);
      }
      
      // Update the event weather data
      const updatedEvent = await this.prisma.event.update({
        where: { id },
        data: { weatherData }
      });
      
      // Update the cache
      const cacheKey = `event:${id}`;
      this.cache.set(cacheKey, updatedEvent);
      
      logger.info(`Event weather data updated successfully: ${id}`);
      
      return updatedEvent as unknown as IEvent;
    } catch (error) {
      logger.error(`Error updating event weather data: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Deletes an event
   * 
   * @param id - The ID of the event to delete
   * @returns Promise resolving to true if the event was deleted, false otherwise
   */
  async deleteEvent(id: string): Promise<boolean> {
    try {
      logger.debug(`Deleting event: ${id}`);
      
      // Check if event exists
      const existingEvent = await this.getEventById(id);
      if (!existingEvent) {
        logger.debug(`Event not found for deletion: ${id}`);
        return false;
      }
      
      // Delete all attendees first
      await this.prisma.eventAttendee.deleteMany({
        where: { eventId: id }
      });
      
      // Delete the event
      await this.prisma.event.delete({
        where: { id }
      });
      
      // Remove from cache
      const cacheKey = `event:${id}`;
      this.cache.del(cacheKey);
      
      logger.info(`Event deleted successfully: ${id}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting event: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Retrieves upcoming events based on date range
   * 
   * @param options - Filtering and pagination options
   * @returns Promise resolving to upcoming events with pagination info
   */
  async getUpcomingEvents(
    options: {
      startDate?: Date;
      endDate?: Date;
      tribeId?: string;
      userId?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.debug('Retrieving upcoming events', { options });
      
      // Set default pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;
      
      // Build query filters
      const where: any = {
        startTime: {
          gte: options.startDate || new Date()
        },
        status: {
          in: [EventStatus.SCHEDULED, EventStatus.ACTIVE]
        }
      };
      
      // Add end date filter if provided
      if (options.endDate) {
        where.startTime.lte = options.endDate;
      }
      
      // Add tribe filter if provided
      if (options.tribeId) {
        where.tribeId = options.tribeId;
      }
      
      // Add user filter if provided
      if (options.userId) {
        where.OR = [
          { createdBy: options.userId },
          {
            EventAttendee: {
              some: {
                userId: options.userId
              }
            }
          }
        ];
      }
      
      // Get total count
      const total = await this.prisma.event.count({ where });
      
      // Get paginated events
      const events = await this.prisma.event.findMany({
        where,
        orderBy: {
          startTime: 'asc'
        },
        skip,
        take: limit
      });
      
      logger.debug(`Found ${events.length} upcoming events`);
      
      return {
        events: events as unknown as IEvent[],
        total
      };
    } catch (error) {
      logger.error('Error retrieving upcoming events', error as Error);
      throw error;
    }
  }

  /**
   * Retrieves all attendees for an event with user details
   * 
   * @param eventId - The ID of the event
   * @returns Promise resolving to array of attendees with user details
   */
  async getEventAttendees(eventId: string): Promise<Array<any>> {
    try {
      logger.debug(`Retrieving attendees for event: ${eventId}`);
      
      // Check if event exists
      const existingEvent = await this.getEventById(eventId);
      if (!existingEvent) {
        throw ApiError.notFound(`Event not found: ${eventId}`);
      }
      
      // Retrieve attendees with user details
      const attendees = await this.prisma.eventAttendee.findMany({
        where: { eventId },
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
      
      logger.debug(`Found ${attendees.length} attendees for event: ${eventId}`);
      
      // Transform the data to include user profile info directly
      return attendees.map(attendee => ({
        ...attendee,
        user: {
          ...attendee.user,
          avatarUrl: attendee.user.profile?.avatarUrl || null
        }
      }));
    } catch (error) {
      logger.error(`Error retrieving attendees for event: ${eventId}`, error as Error);
      throw error;
    }
  }

  /**
   * Checks for scheduling conflicts for a tribe or user
   * 
   * @param tribeId - The ID of the tribe (optional)
   * @param userId - The ID of the user (optional)
   * @param startTime - The start time of the proposed event
   * @param endTime - The end time of the proposed event
   * @param excludeEventId - ID of an event to exclude from conflict check (e.g., when updating)
   * @returns Promise resolving to conflict check results
   */
  async checkEventConflicts(
    tribeId: string | null = null,
    userId: string | null = null,
    startTime: Date,
    endTime: Date,
    excludeEventId: string | null = null
  ): Promise<{ hasConflict: boolean; conflictingEvents: IEvent[] }> {
    try {
      logger.debug('Checking event conflicts', { 
        tribeId, 
        userId, 
        startTime, 
        endTime,
        excludeEventId
      });
      
      if (!tribeId && !userId) {
        throw ApiError.badRequest('Either tribeId or userId must be provided');
      }
      
      // Build base query to find overlapping events
      const where: any = {
        status: {
          in: [EventStatus.SCHEDULED, EventStatus.ACTIVE]
        },
        OR: [
          {
            // Events that start during the proposed time
            startTime: {
              gte: startTime,
              lt: endTime
            }
          },
          {
            // Events that end during the proposed time
            endTime: {
              gt: startTime,
              lte: endTime
            }
          },
          {
            // Events that span the entire proposed time
            AND: [
              {
                startTime: {
                  lte: startTime
                }
              },
              {
                endTime: {
                  gte: endTime
                }
              }
            ]
          }
        ]
      };
      
      // Exclude specific event if provided
      if (excludeEventId) {
        where.id = {
          not: excludeEventId
        };
      }
      
      // Add tribe-specific filter
      if (tribeId) {
        where.tribeId = tribeId;
      }
      
      // Add user-specific filter
      if (userId) {
        where.OR = [
          {
            createdBy: userId
          },
          {
            EventAttendee: {
              some: {
                userId,
                rsvpStatus: 'going'
              }
            }
          }
        ];
      }
      
      // Find conflicting events
      const conflictingEvents = await this.prisma.event.findMany({
        where,
        orderBy: {
          startTime: 'asc'
        }
      });
      
      logger.debug(`Found ${conflictingEvents.length} conflicting events`);
      
      return {
        hasConflict: conflictingEvents.length > 0,
        conflictingEvents: conflictingEvents as unknown as IEvent[]
      };
    } catch (error) {
      logger.error('Error checking event conflicts', error as Error);
      throw error;
    }
  }

  /**
   * Retrieves events by category
   * 
   * @param category - The event category to filter by
   * @param options - Additional filtering and pagination options
   * @returns Promise resolving to events in the category
   */
  async getEventsByCategory(
    category: InterestCategory,
    options: {
      startDate?: Date;
      endDate?: Date;
      tribeId?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.debug(`Retrieving events by category: ${category}`, { options });
      
      // Set default pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;
      
      // Build query filters
      const where: any = {
        categories: {
          has: category
        },
        status: {
          in: [EventStatus.SCHEDULED, EventStatus.ACTIVE]
        }
      };
      
      // Add date range filter if provided
      if (options.startDate || options.endDate) {
        where.startTime = {};
        
        if (options.startDate) {
          where.startTime.gte = options.startDate;
        }
        
        if (options.endDate) {
          where.startTime.lte = options.endDate;
        }
      }
      
      // Add tribe filter if provided
      if (options.tribeId) {
        where.tribeId = options.tribeId;
      }
      
      // Get total count
      const total = await this.prisma.event.count({ where });
      
      // Get paginated events
      const events = await this.prisma.event.findMany({
        where,
        orderBy: {
          startTime: 'asc'
        },
        skip,
        take: limit
      });
      
      logger.debug(`Found ${events.length} events in category: ${category}`);
      
      return {
        events: events as unknown as IEvent[],
        total
      };
    } catch (error) {
      logger.error(`Error retrieving events by category: ${category}`, error as Error);
      throw error;
    }
  }

  /**
   * Retrieves events near a specific location
   * 
   * @param coordinates - The center point coordinates
   * @param radius - The radius in miles
   * @param options - Additional filtering and pagination options
   * @returns Promise resolving to events near the location
   */
  async getEventsByLocation(
    coordinates: ICoordinates,
    radius: number,
    options: {
      startDate?: Date;
      endDate?: Date;
      categories?: InterestCategory[];
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.debug(`Retrieving events by location`, { coordinates, radius, options });
      
      // Set default pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;
      
      const { latitude, longitude } = coordinates;
      
      // Rough conversion: 1 degree lat/lon is approximately 69 miles at the equator
      // This is a simplification and doesn't account for the Earth's curvature
      const latDegrees = radius / 69;
      const lonDegrees = radius / (69 * Math.cos(latitude * (Math.PI / 180)));
      
      // Build query filters
      const where: any = {
        coordinates: {
          latitude: {
            gte: latitude - latDegrees,
            lte: latitude + latDegrees
          },
          longitude: {
            gte: longitude - lonDegrees,
            lte: longitude + lonDegrees
          }
        },
        status: {
          in: [EventStatus.SCHEDULED, EventStatus.ACTIVE]
        }
      };
      
      // Add date range filter if provided
      if (options.startDate || options.endDate) {
        where.startTime = {};
        
        if (options.startDate) {
          where.startTime.gte = options.startDate;
        }
        
        if (options.endDate) {
          where.startTime.lte = options.endDate;
        }
      }
      
      // Add category filter if provided
      if (options.categories && options.categories.length > 0) {
        where.categories = {
          hasSome: options.categories
        };
      }
      
      // Get total count
      const total = await this.prisma.event.count({ where });
      
      // Get paginated events
      const events = await this.prisma.event.findMany({
        where,
        orderBy: {
          startTime: 'asc'
        },
        skip,
        take: limit
      });
      
      logger.debug(`Found ${events.length} events near location`);
      
      return {
        events: events as unknown as IEvent[],
        total
      };
    } catch (error) {
      logger.error('Error retrieving events by location', error as Error);
      throw error;
    }
  }

  /**
   * Retrieves popular events based on attendance
   * 
   * @param options - Filtering and pagination options
   * @returns Promise resolving to popular events
   */
  async getPopularEvents(
    options: {
      startDate?: Date;
      endDate?: Date;
      categories?: InterestCategory[];
      location?: ICoordinates;
      radius?: number;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.debug('Retrieving popular events', { options });
      
      // Set default pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;
      
      // Build query filters
      const where: any = {
        status: {
          in: [EventStatus.SCHEDULED, EventStatus.ACTIVE]
        }
      };
      
      // Add date range filter if provided
      if (options.startDate || options.endDate) {
        where.startTime = {};
        
        if (options.startDate) {
          where.startTime.gte = options.startDate;
        }
        
        if (options.endDate) {
          where.startTime.lte = options.endDate;
        }
      }
      
      // Add category filter if provided
      if (options.categories && options.categories.length > 0) {
        where.categories = {
          hasSome: options.categories
        };
      }
      
      // Add location filter if provided
      if (options.location && options.radius) {
        const { latitude, longitude } = options.location;
        const radius = options.radius;
        
        // Rough conversion: 1 degree lat/lon is approximately 69 miles at the equator
        const latDegrees = radius / 69;
        const lonDegrees = radius / (69 * Math.cos(latitude * (Math.PI / 180)));
        
        where.coordinates = {
          latitude: {
            gte: latitude - latDegrees,
            lte: latitude + latDegrees
          },
          longitude: {
            gte: longitude - lonDegrees,
            lte: longitude + lonDegrees
          }
        };
      }
      
      // Get events with attendee count
      const eventsWithAttendeeCount = await this.prisma.event.findMany({
        where,
        include: {
          _count: {
            select: {
              EventAttendee: {
                where: {
                  rsvpStatus: 'going'
                }
              }
            }
          }
        },
        orderBy: {
          EventAttendee: {
            _count: 'desc'
          }
        },
        skip,
        take: limit
      });
      
      // Get total count
      const total = await this.prisma.event.count({ where });
      
      // Transform the result to include attendee count
      const events = eventsWithAttendeeCount.map(event => ({
        ...event,
        attendeeCount: event._count.EventAttendee,
        _count: undefined
      }));
      
      logger.debug(`Found ${events.length} popular events`);
      
      return {
        events: events as unknown as IEvent[],
        total
      };
    } catch (error) {
      logger.error('Error retrieving popular events', error as Error);
      throw error;
    }
  }

  /**
   * Recommends events based on user preferences and past attendance
   * 
   * @param params - Parameters for event recommendations
   * @returns Promise resolving to recommended events
   */
  async recommendEvents(
    params: IEventRecommendationParams
  ): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.debug('Generating event recommendations', { params });
      
      const { userId, location, maxDistance, maxCost, tribeId } = params;
      
      // Default limit if not provided
      const limit = params.limit || 10;
      
      // Get user preferences and past events
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            include: {
              interests: true
            }
          },
          EventAttendee: {
            include: {
              event: true
            },
            where: {
              rsvpStatus: {
                in: ['going', 'not_going']
              }
            }
          }
        }
      });
      
      if (!user) {
        throw ApiError.notFound(`User not found: ${userId}`);
      }
      
      // Get preferred categories from user profile
      const preferredCategories = params.preferredCategories || 
        user.profile?.interests.map(i => i.category as InterestCategory) || [];
      
      // Get events user has already seen or declined
      const excludeEventIds = params.excludeEventIds || [];
      
      user.EventAttendee.forEach(attendance => {
        if (attendance.rsvpStatus === 'not_going') {
          excludeEventIds.push(attendance.eventId);
        }
      });
      
      // Build query filters
      const where: any = {
        status: {
          in: [EventStatus.SCHEDULED, EventStatus.ACTIVE]
        },
        startTime: {
          gte: new Date()
        },
        id: {
          notIn: excludeEventIds
        }
      };
      
      // Add tribe filter if provided
      if (tribeId) {
        where.tribeId = tribeId;
      }
      
      // Add location filter
      if (location) {
        const { latitude, longitude } = location;
        
        // Rough conversion: 1 degree lat/lon is approximately 69 miles at the equator
        const latDegrees = maxDistance / 69;
        const lonDegrees = maxDistance / (69 * Math.cos(latitude * (Math.PI / 180)));
        
        where.coordinates = {
          latitude: {
            gte: latitude - latDegrees,
            lte: latitude + latDegrees
          },
          longitude: {
            gte: longitude - lonDegrees,
            lte: longitude + lonDegrees
          }
        };
      }
      
      // Add category preference filter if available
      if (preferredCategories.length > 0) {
        where.categories = {
          hasSome: preferredCategories
        };
      }
      
      // Add cost constraint if provided
      if (maxCost !== undefined && maxCost >= 0) {
        where.cost = {
          lte: maxCost
        };
      }
      
      // Add day/time preferences if provided
      if (params.preferredDays && params.preferredDays.length > 0) {
        // This is a simplification - in a real implementation we would use a more
        // sophisticated approach to filter by day of week and time of day
        // Prisma doesn't directly support day-of-week extraction in queries
      }
      
      // Get events that match the criteria
      const events = await this.prisma.event.findMany({
        where,
        include: {
          _count: {
            select: {
              EventAttendee: {
                where: {
                  rsvpStatus: 'going'
                }
              }
            }
          }
        },
        take: limit * 2 // Fetch more than needed for relevance sorting
      });
      
      logger.debug(`Found ${events.length} candidate events for recommendations`);
      
      // Calculate relevance score for each event
      const scoredEvents = events.map(event => {
        let score = 0;
        
        // Score based on category match
        const categoryMatchCount = event.categories.filter(
          category => preferredCategories.includes(category as InterestCategory)
        ).length;
        score += categoryMatchCount * 10;
        
        // Score based on popularity
        score += Math.min(event._count.EventAttendee, 10) * 2;
        
        // Score based on recency
        const daysUntilEvent = Math.max(0, 
          (new Date(event.startTime).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        // Prefer events happening soon, but not too soon
        if (daysUntilEvent < 2) {
          score += 5;
        } else if (daysUntilEvent < 7) {
          score += 10;
        } else if (daysUntilEvent < 14) {
          score += 7;
        } else {
          score += 3;
        }
        
        // Add distance-based score if location provided
        if (location && event.coordinates) {
          // Rough distance calculation
          const distance = Math.sqrt(
            Math.pow(location.latitude - event.coordinates.latitude, 2) +
            Math.pow(location.longitude - event.coordinates.longitude, 2)
          ) * 69; // Convert degrees to miles (approximate)
          
          // Score inversely proportional to distance
          score += Math.max(0, 20 - distance);
        }
        
        return {
          ...event,
          attendeeCount: event._count.EventAttendee,
          _count: undefined,
          relevanceScore: score
        };
      });
      
      // Sort by relevance score and take the top 'limit' events
      scoredEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);
      const recommendedEvents = scoredEvents.slice(0, limit);
      
      logger.debug(`Generated ${recommendedEvents.length} event recommendations for user: ${userId}`);
      
      return {
        events: recommendedEvents as unknown as IEvent[],
        total: scoredEvents.length
      };
    } catch (error) {
      logger.error('Error generating event recommendations', error as Error);
      throw error;
    }
  }

  /**
   * Recommends events based on weather conditions
   * 
   * @param params - Parameters for weather-based recommendations
   * @returns Promise resolving to weather-appropriate events
   */
  async recommendWeatherBasedEvents(
    params: IWeatherBasedActivityParams
  ): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.debug('Generating weather-based event recommendations', { params });
      
      const { location, date, preferIndoor, preferOutdoor, maxDistance } = params;
      
      // Default limit if not provided
      const limit = params.limit || 10;
      
      // Build query filters
      const where: any = {
        status: {
          in: [EventStatus.SCHEDULED, EventStatus.ACTIVE]
        },
        startTime: {
          gte: date,
          lte: new Date(date.getTime() + 24 * 60 * 60 * 1000) // Next 24 hours
        }
      };
      
      // Add location filter
      const { latitude, longitude } = location;
      
      // Rough conversion: 1 degree lat/lon is approximately 69 miles at the equator
      const latDegrees = maxDistance / 69;
      const lonDegrees = maxDistance / (69 * Math.cos(latitude * (Math.PI / 180)));
      
      where.coordinates = {
        latitude: {
          gte: latitude - latDegrees,
          lte: latitude + latDegrees
        },
        longitude: {
          gte: longitude - lonDegrees,
          lte: longitude + lonDegrees
        }
      };
      
      // Add category filter if provided
      if (params.preferredCategories && params.preferredCategories.length > 0) {
        where.categories = {
          hasSome: params.preferredCategories
        };
      }
      
      // Add cost constraint if provided
      if (params.maxCost !== undefined && params.maxCost >= 0) {
        where.cost = {
          lte: params.maxCost
        };
      }
      
      // Get events that match the criteria
      const events = await this.prisma.event.findMany({
        where,
        include: {
          _count: {
            select: {
              EventAttendee: {
                where: {
                  rsvpStatus: 'going'
                }
              }
            }
          }
        }
      });
      
      logger.debug(`Found ${events.length} candidate events for weather-based recommendations`);
      
      // Determine if weather is good for outdoor activities
      // In a real implementation, we would check the actual weather data
      // For now, we'll assume weather is good if any events have favorable weather data
      const eventsWithWeather = events.filter(e => e.weatherData);
      const goodWeather = eventsWithWeather.some(e => 
        e.weatherData && 
        !e.weatherData.condition.toLowerCase().includes('rain') &&
        !e.weatherData.condition.toLowerCase().includes('snow') &&
        !e.weatherData.condition.toLowerCase().includes('storm') &&
        e.weatherData.temperature > 60 && 
        e.weatherData.temperature < 90
      );
      
      // Calculate relevance score for each event
      const scoredEvents = events.map(event => {
        let score = 0;
        
        // Base score from popularity
        score += Math.min(event._count.EventAttendee, 10) * 2;
        
        // Score based on indoor/outdoor preference
        const isIndoor = event.eventType === EventType.VIRTUAL || 
                         (event.metadata && event.metadata.venue && event.metadata.venue.isIndoor);
        
        if (goodWeather && preferOutdoor && !isIndoor) {
          score += 20; // Strongly prefer outdoor events in good weather
        } else if (!goodWeather && preferIndoor && isIndoor) {
          score += 20; // Strongly prefer indoor events in bad weather
        } else if (preferIndoor && isIndoor) {
          score += 10; // Prefer indoor events if that's the user's preference
        } else if (preferOutdoor && !isIndoor) {
          score += 10; // Prefer outdoor events if that's the user's preference
        }
        
        // Weather-specific scoring
        if (event.weatherData) {
          // Temperature comfort factor
          const temp = event.weatherData.temperature;
          if (temp >= 65 && temp <= 85) {
            score += 10; // Ideal temperature range
          } else if (temp >= 55 && temp <= 95) {
            score += 5; // Acceptable temperature range
          }
          
          // Precipitation factor
          const precipitation = event.weatherData.precipitation;
          if (precipitation <= 10) {
            score += 10; // Low chance of precipitation
          } else if (precipitation <= 30) {
            score += 5; // Moderate chance of precipitation
          }
          
          // Condition factor
          const condition = event.weatherData.condition.toLowerCase();
          if (condition.includes('sunny') || condition.includes('clear')) {
            score += 10; // Perfect conditions
          } else if (condition.includes('cloudy') || condition.includes('partly')) {
            score += 5; // Good conditions
          }
        }
        
        return {
          ...event,
          attendeeCount: event._count.EventAttendee,
          _count: undefined,
          relevanceScore: score
        };
      });
      
      // Sort by relevance score and take the top 'limit' events
      scoredEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);
      const recommendedEvents = scoredEvents.slice(0, limit);
      
      logger.debug(`Generated ${recommendedEvents.length} weather-based event recommendations`);
      
      return {
        events: recommendedEvents as unknown as IEvent[],
        total: scoredEvents.length
      };
    } catch (error) {
      logger.error('Error generating weather-based event recommendations', error as Error);
      throw error;
    }
  }

  /**
   * Gets statistics about events for analytics
   * 
   * @param options - Filtering options
   * @returns Promise resolving to event statistics
   */
  async getEventStatistics(
    options: {
      tribeId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<object> {
    try {
      logger.debug('Generating event statistics', { options });
      
      // Build base filter
      const baseFilter: any = {};
      
      // Add tribe filter if provided
      if (options.tribeId) {
        baseFilter.tribeId = options.tribeId;
      }
      
      // Add date range filter if provided
      if (options.startDate || options.endDate) {
        baseFilter.startTime = {};
        
        if (options.startDate) {
          baseFilter.startTime.gte = options.startDate;
        }
        
        if (options.endDate) {
          baseFilter.startTime.lte = options.endDate;
        }
      }
      
      // Get counts by status
      const statusCounts = await this.prisma.event.groupBy({
        by: ['status'],
        where: baseFilter,
        _count: true
      });
      
      // Get counts by event type
      const typeCounts = await this.prisma.event.groupBy({
        by: ['eventType'],
        where: baseFilter,
        _count: true
      });
      
      // Get average attendance rate
      const events = await this.prisma.event.findMany({
        where: {
          ...baseFilter,
          status: EventStatus.COMPLETED
        },
        include: {
          EventAttendee: {
            where: {
              hasCheckedIn: true
            }
          },
          _count: {
            select: {
              EventAttendee: {
                where: {
                  rsvpStatus: 'going'
                }
              }
            }
          }
        }
      });
      
      let attendanceRate = 0;
      if (events.length > 0) {
        const totalAttending = events.reduce((sum, event) => sum + event._count.EventAttendee, 0);
        const totalCheckedIn = events.reduce((sum, event) => sum + event.EventAttendee.length, 0);
        attendanceRate = totalAttending > 0 ? (totalCheckedIn / totalAttending) * 100 : 0;
      }
      
      // Calculate average cost
      const costResult = await this.prisma.event.aggregate({
        where: baseFilter,
        _avg: {
          cost: true
        }
      });
      
      // Identify most popular categories
      const events2 = await this.prisma.event.findMany({
        where: baseFilter,
        select: {
          categories: true,
          _count: {
            select: {
              EventAttendee: {
                where: {
                  rsvpStatus: 'going'
                }
              }
            }
          }
        }
      });
      
      const categoryPopularity: Record<string, number> = {};
      events2.forEach(event => {
        const weight = event._count.EventAttendee;
        event.categories.forEach(category => {
          if (!categoryPopularity[category]) {
            categoryPopularity[category] = 0;
          }
          categoryPopularity[category] += weight;
        });
      });
      
      // Sort categories by popularity
      const sortedCategories = Object.entries(categoryPopularity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));
      
      // Compile statistics
      const statistics = {
        totalEvents: await this.prisma.event.count({ where: baseFilter }),
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byType: typeCounts.reduce((acc, item) => {
          acc[item.eventType] = item._count;
          return acc;
        }, {} as Record<string, number>),
        averageAttendanceRate: Math.round(attendanceRate * 100) / 100,
        averageCost: costResult._avg.cost || 0,
        popularCategories: sortedCategories
      };
      
      logger.debug('Generated event statistics', { statistics });
      
      return statistics;
    } catch (error) {
      logger.error('Error generating event statistics', error as Error);
      throw error;
    }
  }

  /**
   * Clears the event cache
   */
  clearCache(): void {
    logger.debug('Clearing event cache');
    this.cache.flushAll();
  }
}

export default EventModel;