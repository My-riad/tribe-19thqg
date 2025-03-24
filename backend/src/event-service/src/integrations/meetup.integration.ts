import axios from 'axios';  // ^1.4.0
import NodeCache from 'node-cache';  // ^5.1.2

import { ApiError } from '../../../shared/src/errors/api.error';
import { ICoordinates, InterestCategory } from '../../../shared/src/types/profile.types';
import { 
  IEvent, 
  IEventCreate, 
  EventType, 
  EventVisibility 
} from '../../../shared/src/types/event.types';
import { env, eventServiceConfig } from '../config';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Interface for Meetup search parameters
 */
interface IMeetupSearchParams {
  query?: string;        // Search query
  lat?: number;          // Latitude for location-based search
  lon?: number;          // Longitude for location-based search
  radius?: number;       // Search radius in miles
  categoryId?: string;   // Category ID for filtering events
  startDate?: string;    // ISO date for start of date range
  endDate?: string;      // ISO date for end of date range
  isOnline?: boolean;    // Filter for online events
  page?: number;         // Page number for pagination
  limit?: number;        // Number of results per page
}

/**
 * Interface for Meetup event data structure
 */
interface IMeetupEvent {
  id: string;
  title: string;
  description: string;
  eventUrl: string;
  startTime: string;     // ISO date string
  endTime: string;       // ISO date string
  group: {
    id: string;
    name: string;
    urlname: string;
    city: string;
    state: string;
    country: string;
  };
  venue?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
  };
  isOnline: boolean;
  isFree: boolean;
  fee?: {
    amount: number;
    currency: string;
  };
  maxAttendees?: number;
  attendeeCount: number;
  category?: {
    id: string;
    name: string;
    shortName: string;
  };
  imageUrl?: string;
}

/**
 * Interface for Meetup GraphQL API response
 */
interface IMeetupGraphQLResponse {
  data?: any;
  errors?: Array<{
    message: string;
    locations: Array<{ line: number; column: number }>;
    path: string[];
    extensions?: any;
  }>;
}

/**
 * Integration class for the Meetup API that provides methods to discover and search events
 */
class MeetupIntegration {
  private apiKey: string;
  private baseUrl: string;
  private cache: NodeCache;
  private categoryMapping: Record<string, InterestCategory>;

  /**
   * Initializes a new instance of the MeetupIntegration class
   */
  constructor() {
    // Set the API key from environment variables
    this.apiKey = env.MEETUP_API_KEY;
    if (!this.apiKey) {
      logger.warn('Meetup API key is not configured. Some functionality may be limited.');
    }

    // Set the base URL from service configuration
    this.baseUrl = eventServiceConfig.meetupApiUrl;

    // Initialize the cache with configured TTL
    this.cache = new NodeCache({
      stdTTL: eventServiceConfig.eventCacheTtl,
      checkperiod: eventServiceConfig.eventCacheTtl * 0.2, // Check for expired keys at 20% of TTL
      useClones: false
    });

    // Initialize the category mapping from Meetup to internal categories
    this.categoryMapping = {
      // Mapping from Meetup category IDs to our InterestCategory enum
      "1": InterestCategory.ARTS_CULTURE,  // Arts & Culture
      "2": InterestCategory.TECHNOLOGY,    // Technology & Digital
      "3": InterestCategory.SPORTS_FITNESS,  // Sports & Fitness
      "4": InterestCategory.LEARNING_EDUCATION,  // Education & Learning
      "5": InterestCategory.OUTDOOR_ADVENTURES,  // Outdoors & Adventure
      "6": InterestCategory.FOOD_DINING,  // Food & Drink
      "7": InterestCategory.GAMES_ENTERTAINMENT,  // Games & Entertainment
      "8": InterestCategory.WELLNESS_MINDFULNESS  // Health & Wellness
    };

    logger.info('MeetupIntegration initialized');
  }

  /**
   * Searches for events on Meetup based on search parameters
   * 
   * @param searchParams - Search parameters for Meetup events
   * @returns Search results with pagination info
   */
  async searchEvents(searchParams: IMeetupSearchParams): Promise<{ events: IEvent[], total: number }> {
    logger.debug('Searching Meetup events', { searchParams });

    try {
      // Build GraphQL query for events search
      const query = `
        query($input: EventsSearchInput!) {
          searchEvents(input: $input) {
            count
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                title
                description
                eventUrl
                startTime
                endTime
                group {
                  id
                  name
                  urlname
                  city
                  state
                  country
                }
                venue {
                  id
                  name
                  address
                  city
                  state
                  country
                  lat
                  lng
                }
                isOnline
                fee {
                  amount
                  currency
                }
                maxAttendees
                attendeeCount
                category {
                  id
                  name
                  shortName
                }
                imageUrl
              }
            }
          }
        }
      `;

      // Build variables for the GraphQL query
      const variables = {
        input: {
          query: searchParams.query,
          location: searchParams.lat && searchParams.lon ? {
            lat: searchParams.lat,
            lon: searchParams.lon,
            radius: searchParams.radius || 25
          } : undefined,
          categoryId: searchParams.categoryId,
          startDate: searchParams.startDate,
          endDate: searchParams.endDate,
          isOnline: searchParams.isOnline,
          first: searchParams.limit || 20,
          offset: searchParams.page ? (searchParams.page - 1) * (searchParams.limit || 20) : 0
        }
      };

      // Generate cache key
      const cacheKey = this.getCacheKey(query, variables);
      
      // Check if we have cached results
      const cachedResult = this.cache.get<{ events: IEvent[], total: number }>(cacheKey);
      if (cachedResult) {
        logger.debug('Returning cached Meetup events', { 
          count: cachedResult.events.length, 
          total: cachedResult.total 
        });
        return cachedResult;
      }

      // Make GraphQL request to Meetup API
      const response = await this.makeGraphQLRequest(query, variables);

      // Extract events from response
      const searchResults = response.data?.searchEvents;
      if (!searchResults) {
        return { events: [], total: 0 };
      }

      const total = searchResults.count || 0;
      const meetupEvents = searchResults.edges?.map((edge: any) => edge.node) || [];

      // Map Meetup events to our internal format
      const events = meetupEvents.map((event: IMeetupEvent) => 
        this.mapMeetupEventToInternalEvent(event)
      );

      // Cache the result
      const result = { events, total };
      this.cache.set(cacheKey, result);

      logger.debug('Retrieved Meetup events', { count: events.length, total });
      return result;
    } catch (error) {
      logger.error('Error searching Meetup events', error as Error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw ApiError.tooManyRequests('Meetup API rate limit exceeded');
        } else if (error.response?.status === 503) {
          throw ApiError.serviceUnavailable('Meetup API is unavailable');
        } else {
          throw ApiError.internal(`Meetup API error: ${error.message}`);
        }
      }
      throw ApiError.internal(`Error searching Meetup events: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves a specific event from Meetup by ID
   * 
   * @param eventId - Meetup event ID
   * @returns The event if found, null otherwise
   */
  async getEventById(eventId: string): Promise<IEvent | null> {
    logger.debug('Getting Meetup event by ID', { eventId });

    try {
      // Check if we have this event cached
      const cacheKey = `meetup-event-${eventId}`;
      const cachedEvent = this.cache.get<IEvent>(cacheKey);
      if (cachedEvent) {
        logger.debug('Returning cached Meetup event', { eventId });
        return cachedEvent;
      }

      // Build GraphQL query for specific event
      const query = `
        query($eventId: ID!) {
          event(id: $eventId) {
            id
            title
            description
            eventUrl
            startTime
            endTime
            group {
              id
              name
              urlname
              city
              state
              country
            }
            venue {
              id
              name
              address
              city
              state
              country
              lat
              lng
            }
            isOnline
            fee {
              amount
              currency
            }
            maxAttendees
            attendeeCount
            category {
              id
              name
              shortName
            }
            imageUrl
          }
        }
      `;

      // Build variables for the GraphQL query
      const variables = {
        eventId
      };

      // Make GraphQL request to Meetup API
      const response = await this.makeGraphQLRequest(query, variables);

      // Extract event from response
      const meetupEvent = response.data?.event;
      if (!meetupEvent) {
        return null;
      }

      // Map Meetup event to our internal format
      const event = this.mapMeetupEventToInternalEvent(meetupEvent);

      // Cache the result
      this.cache.set(cacheKey, event);

      logger.debug('Retrieved Meetup event by ID', { eventId });
      return event;
    } catch (error) {
      logger.error('Error getting Meetup event by ID', error as Error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return null;
        } else if (error.response?.status === 429) {
          throw ApiError.tooManyRequests('Meetup API rate limit exceeded');
        } else if (error.response?.status === 503) {
          throw ApiError.serviceUnavailable('Meetup API is unavailable');
        } else {
          throw ApiError.internal(`Meetup API error: ${error.message}`);
        }
      }
      throw ApiError.internal(`Error getting Meetup event by ID: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves events from Meetup based on geographic location
   * 
   * @param coordinates - Geographic coordinates for center of search
   * @param radius - Search radius in miles
   * @param options - Additional search options
   * @returns Location-based events with pagination info
   */
  async getEventsByLocation(
    coordinates: ICoordinates,
    radius: number = 10,
    options: {
      startDate?: Date,
      endDate?: Date,
      categories?: InterestCategory[],
      isOnline?: boolean,
      page?: number,
      limit?: number
    } = {}
  ): Promise<{ events: IEvent[], total: number }> {
    logger.debug('Getting Meetup events by location', { coordinates, radius, options });

    try {
      // Build search parameters
      const searchParams: IMeetupSearchParams = {
        lat: coordinates.latitude,
        lon: coordinates.longitude,
        radius,
        isOnline: options.isOnline,
        page: options.page,
        limit: options.limit
      };

      // Add date filters if provided
      if (options.startDate) {
        searchParams.startDate = options.startDate.toISOString();
      }
      if (options.endDate) {
        searchParams.endDate = options.endDate.toISOString();
      }

      // Generate cache key based on parameters
      const cacheKey = `meetup-location-${JSON.stringify({
        coordinates,
        radius,
        options
      })}`;

      // Check if we have cached results
      const cachedResult = this.cache.get<{ events: IEvent[], total: number }>(cacheKey);
      if (cachedResult) {
        logger.debug('Returning cached location-based Meetup events', { 
          count: cachedResult.events.length, 
          total: cachedResult.total 
        });
        return cachedResult;
      }

      // Retrieve events using search function
      const result = await this.searchEvents(searchParams);

      // Filter by categories if specified
      if (options.categories && options.categories.length > 0) {
        result.events = result.events.filter(event => 
          event.categories.some(category => options.categories!.includes(category))
        );
      }

      // Cache the filtered result
      this.cache.set(cacheKey, result);

      logger.debug('Retrieved location-based Meetup events', { 
        count: result.events.length, 
        total: result.total 
      });
      return result;
    } catch (error) {
      logger.error('Error getting Meetup events by location', error as Error);
      throw ApiError.internal(`Error getting Meetup events by location: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves events from Meetup based on category
   * 
   * @param category - Internal interest category for filtering
   * @param options - Additional search options
   * @returns Category-based events with pagination info
   */
  async getEventsByCategory(
    category: InterestCategory,
    options: {
      location?: ICoordinates,
      radius?: number,
      startDate?: Date,
      endDate?: Date,
      isOnline?: boolean,
      page?: number,
      limit?: number
    } = {}
  ): Promise<{ events: IEvent[], total: number }> {
    logger.debug('Getting Meetup events by category', { category, options });

    try {
      // Find Meetup category ID that maps to our interest category
      const meetupCategoryId = Object.entries(this.categoryMapping)
        .find(([_, interestCategory]) => interestCategory === category)?.[0];

      if (!meetupCategoryId) {
        logger.warn('No matching Meetup category ID found for interest category', { category });
        return { events: [], total: 0 };
      }

      // Build search parameters
      const searchParams: IMeetupSearchParams = {
        categoryId: meetupCategoryId,
        isOnline: options.isOnline,
        page: options.page,
        limit: options.limit
      };

      // Add location if provided
      if (options.location) {
        searchParams.lat = options.location.latitude;
        searchParams.lon = options.location.longitude;
        searchParams.radius = options.radius || 10;
      }

      // Add date filters if provided
      if (options.startDate) {
        searchParams.startDate = options.startDate.toISOString();
      }
      if (options.endDate) {
        searchParams.endDate = options.endDate.toISOString();
      }

      // Generate cache key based on parameters
      const cacheKey = `meetup-category-${JSON.stringify({
        category,
        options
      })}`;

      // Check if we have cached results
      const cachedResult = this.cache.get<{ events: IEvent[], total: number }>(cacheKey);
      if (cachedResult) {
        logger.debug('Returning cached category-based Meetup events', { 
          category,
          count: cachedResult.events.length, 
          total: cachedResult.total 
        });
        return cachedResult;
      }

      // Retrieve events using search function
      const result = await this.searchEvents(searchParams);

      // Cache the result
      this.cache.set(cacheKey, result);

      logger.debug('Retrieved category-based Meetup events', { 
        category,
        count: result.events.length, 
        total: result.total 
      });
      return result;
    } catch (error) {
      logger.error('Error getting Meetup events by category', error as Error);
      throw ApiError.internal(`Error getting Meetup events by category: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves upcoming events from Meetup
   * 
   * @param options - Search options for upcoming events
   * @returns Upcoming events with pagination info
   */
  async getUpcomingEvents(
    options: {
      location?: ICoordinates,
      radius?: number,
      categories?: InterestCategory[],
      isOnline?: boolean,
      days?: number,
      page?: number,
      limit?: number
    } = {}
  ): Promise<{ events: IEvent[], total: number }> {
    logger.debug('Getting upcoming Meetup events', { options });

    try {
      // Build date range for upcoming events
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (options.days || 30)); // Default to 30 days ahead

      // Build search parameters
      const searchParams: IMeetupSearchParams = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isOnline: options.isOnline,
        page: options.page,
        limit: options.limit
      };

      // Add location if provided
      if (options.location) {
        searchParams.lat = options.location.latitude;
        searchParams.lon = options.location.longitude;
        searchParams.radius = options.radius || 10;
      }

      // Generate cache key based on parameters
      const cacheKey = `meetup-upcoming-${JSON.stringify({
        options,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })}`;

      // Check if we have cached results
      const cachedResult = this.cache.get<{ events: IEvent[], total: number }>(cacheKey);
      if (cachedResult) {
        logger.debug('Returning cached upcoming Meetup events', { 
          count: cachedResult.events.length, 
          total: cachedResult.total 
        });
        return cachedResult;
      }

      // Retrieve events using search function
      const result = await this.searchEvents(searchParams);

      // Filter by categories if specified
      if (options.categories && options.categories.length > 0) {
        result.events = result.events.filter(event => 
          event.categories.some(category => options.categories!.includes(category))
        );
      }

      // Cache the filtered result
      this.cache.set(cacheKey, result);

      logger.debug('Retrieved upcoming Meetup events', { 
        count: result.events.length, 
        total: result.total 
      });
      return result;
    } catch (error) {
      logger.error('Error getting upcoming Meetup events', error as Error);
      throw ApiError.internal(`Error getting upcoming Meetup events: ${(error as Error).message}`);
    }
  }

  /**
   * Maps a Meetup event to the internal event format
   * 
   * @param meetupEvent - Meetup event data
   * @returns Event in internal format
   */
  private mapMeetupEventToInternalEvent(meetupEvent: IMeetupEvent): IEventCreate {
    // Determine event type
    let eventType = EventType.IN_PERSON;
    if (meetupEvent.isOnline) {
      eventType = EventType.VIRTUAL;
    }
    // If it has both a venue and is marked as online, it's a hybrid event
    if (meetupEvent.venue && meetupEvent.isOnline) {
      eventType = EventType.HYBRID;
    }

    // Map location and coordinates
    let location = '';
    let coordinates: ICoordinates | undefined;

    if (meetupEvent.venue) {
      location = [
        meetupEvent.venue.name,
        meetupEvent.venue.address,
        meetupEvent.venue.city,
        meetupEvent.venue.state,
        meetupEvent.venue.country
      ].filter(Boolean).join(', ');

      coordinates = {
        latitude: meetupEvent.venue.lat,
        longitude: meetupEvent.venue.lng
      };
    } else if (meetupEvent.group) {
      // Fall back to group location if no venue is specified
      location = [
        meetupEvent.group.city,
        meetupEvent.group.state,
        meetupEvent.group.country
      ].filter(Boolean).join(', ');
    }

    // Map cost information
    const cost = meetupEvent.fee?.amount || 0;
    const paymentRequired = !meetupEvent.isFree && cost > 0;

    // Map category
    let categories: InterestCategory[] = [];
    if (meetupEvent.category?.id && this.categoryMapping[meetupEvent.category.id]) {
      categories = [this.categoryMapping[meetupEvent.category.id]];
    }

    // Parse dates
    const startTime = new Date(meetupEvent.startTime);
    let endTime = meetupEvent.endTime ? new Date(meetupEvent.endTime) : new Date(startTime);
    
    // If end time is not provided, default to 2 hours after start
    if (!meetupEvent.endTime) {
      endTime.setHours(endTime.getHours() + 2);
    }

    // Create the event in our internal format
    const event: IEventCreate = {
      name: meetupEvent.title,
      description: meetupEvent.description,
      tribeId: '', // Placeholder, to be filled by consumer
      createdBy: '', // Placeholder, to be filled by consumer
      eventType,
      visibility: EventVisibility.PUBLIC,
      startTime,
      endTime,
      location,
      coordinates: coordinates || { latitude: 0, longitude: 0 },
      venueId: meetupEvent.venue?.id || '',
      cost,
      paymentRequired,
      maxAttendees: meetupEvent.maxAttendees || 0,
      categories,
    };

    return event;
  }

  /**
   * Makes a GraphQL request to the Meetup API
   * 
   * @param query - GraphQL query string
   * @param variables - Variables for the GraphQL query
   * @returns API response data
   */
  private async makeGraphQLRequest(query: string, variables: any): Promise<any> {
    try {
      const response = await axios.post<IMeetupGraphQLResponse>(
        this.baseUrl,
        {
          query,
          variables
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      // Check for GraphQL errors
      if (response.data.errors && response.data.errors.length > 0) {
        const errorMessages = response.data.errors.map(error => error.message).join(', ');
        logger.error('Meetup GraphQL API returned errors', { errors: response.data.errors });
        throw new Error(`Meetup API GraphQL errors: ${errorMessages}`);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Meetup API request failed', { 
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });

        if (error.response?.status === 401) {
          throw ApiError.internal('Meetup API authentication failed - invalid API key');
        } else if (error.response?.status === 404) {
          throw ApiError.notFound('Meetup resource not found');
        } else if (error.response?.status === 429) {
          throw ApiError.tooManyRequests('Meetup API rate limit exceeded');
        } else if (error.response?.status >= 500) {
          throw ApiError.serviceUnavailable('Meetup API is currently unavailable');
        }
      }
      
      throw error;
    }
  }

  /**
   * Generates a cache key based on query and variables
   * 
   * @param query - GraphQL query string
   * @param variables - Variables for the GraphQL query
   * @returns Cache key
   */
  private getCacheKey(query: string, variables: any): string {
    // Create a simplified key based on the query and variables
    return `meetup-query-${JSON.stringify(variables)}`;
  }
}

export default MeetupIntegration;