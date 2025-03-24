import axios from 'axios'; // ^1.4.0
import NodeCache from 'node-cache'; // ^5.1.2
import { ApiError } from '../../../shared/src/errors/api.error';
import {
  ICoordinates,
  InterestCategory
} from '../../../shared/src/types/profile.types';
import {
  IEvent,
  IEventCreate,
  EventType,
  EventVisibility
} from '../../../shared/src/types/event.types';
import { env, eventServiceConfig } from '../config';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Interface for Eventbrite search parameters
 */
interface IEventbriteSearchParams {
  q?: string;                      // Search query
  'location.latitude'?: number;    // Latitude for location-based search
  'location.longitude'?: number;   // Longitude for location-based search
  'location.within'?: string;      // Search radius in format '10mi' or '10km'
  categories?: string;             // Comma-separated list of category IDs
  'start_date.range_start'?: string; // ISO date for start of date range
  'start_date.range_end'?: string;   // ISO date for end of date range
  price?: string;                  // Price filter (free or paid)
  online_events?: boolean;         // Filter for online events
  page?: number;                   // Page number for pagination
  page_size?: number;              // Number of results per page
  sort_by?: string;                // Sorting criteria (date, best, relevance)
}

/**
 * Interface for Eventbrite event data structure
 */
interface IEventbriteEvent {
  id: string;
  name: {
    text: string;
    html: string;
  };
  description: {
    text: string;
    html: string;
  };
  url: string;
  start: {
    timezone: string;
    local: string;
    utc: string;
  };
  end: {
    timezone: string;
    local: string;
    utc: string;
  };
  organization_id: string;
  venue: {
    id: string;
    name: string;
    address: {
      address_1: string;
      address_2: string;
      city: string;
      region: string;
      postal_code: string;
      country: string;
      latitude: number;
      longitude: number;
    };
  };
  online_event: boolean;
  is_free: boolean;
  ticket_availability: {
    has_available_tickets: boolean;
    minimum_ticket_price: {
      currency: string;
      value: number;
    };
    maximum_ticket_price: {
      currency: string;
      value: number;
    };
  };
  capacity: number;
  category_id: string;
  logo: {
    url: string;
    original: {
      url: string;
    };
  };
  summary: string;
}

/**
 * Interface for Eventbrite API response
 */
interface IEventbriteResponse {
  pagination: {
    object_count: number;
    page_number: number;
    page_size: number;
    page_count: number;
    has_more_items: boolean;
  };
  events: IEventbriteEvent[];
}

/**
 * Integration class for the Eventbrite API that provides methods to discover and search events
 */
export class EventbriteIntegration {
  private apiKey: string;
  private baseUrl: string;
  private cache: NodeCache;
  private categoryMapping: Record<string, InterestCategory>;

  /**
   * Initializes a new instance of the EventbriteIntegration class
   */
  constructor() {
    this.apiKey = env.EVENTBRITE_API_KEY;
    if (!this.apiKey) {
      logger.error('Eventbrite API key is not configured');
    }
    
    this.baseUrl = eventServiceConfig.eventbriteApiUrl;
    this.cache = new NodeCache({ stdTTL: eventServiceConfig.eventCacheTtl });
    
    // Initialize category mapping from Eventbrite to internal categories
    this.categoryMapping = {
      '103': InterestCategory.ARTS_CULTURE,          // Music
      '104': InterestCategory.ARTS_CULTURE,          // Film & Media
      '105': InterestCategory.ARTS_CULTURE,          // Performing & Visual Arts
      '108': InterestCategory.FOOD_DINING,           // Food & Drink
      '109': InterestCategory.WELLNESS_MINDFULNESS,  // Health & Wellness
      '110': InterestCategory.LEARNING_EDUCATION,    // Education
      '113': InterestCategory.TECHNOLOGY,            // Tech
      '115': InterestCategory.GAMES_ENTERTAINMENT,   // Entertainment
      '116': InterestCategory.OUTDOOR_ADVENTURES,    // Recreation
      '117': InterestCategory.SPORTS_FITNESS,        // Sports & Fitness
      '118': InterestCategory.OUTDOOR_ADVENTURES,    // Travel & Outdoor
    };
  }

  /**
   * Searches for events on Eventbrite based on search parameters
   * 
   * @param searchParams - The search parameters
   * @returns Search results with pagination info
   */
  async searchEvents(searchParams: {
    query?: string;
    location?: ICoordinates;
    radius?: number;
    categories?: InterestCategory[];
    startDate?: Date;
    endDate?: Date;
    price?: 'free' | 'paid' | 'all';
    online?: boolean;
    page?: number;
    limit?: number;
    sort?: 'date' | 'best' | 'relevance' | 'distance';
  }): Promise<{ events: IEvent[], total: number }> {
    try {
      const params: IEventbriteSearchParams = {};
      
      // Add query parameter if provided
      if (searchParams.query) {
        params.q = searchParams.query;
      }
      
      // Add location parameters if provided
      if (searchParams.location) {
        params['location.latitude'] = searchParams.location.latitude;
        params['location.longitude'] = searchParams.location.longitude;
        
        // Add radius parameter, default to 10 miles
        const radius = searchParams.radius || 10;
        params['location.within'] = `${radius}mi`;
      }
      
      // Add category parameters if provided
      if (searchParams.categories && searchParams.categories.length > 0) {
        // Map internal categories to Eventbrite category IDs
        const categoryIds = searchParams.categories
          .map(category => {
            // Find matching Eventbrite category IDs
            return Object.entries(this.categoryMapping)
              .filter(([, internalCategory]) => internalCategory === category)
              .map(([id]) => id);
          })
          .flat();
        
        if (categoryIds.length > 0) {
          params.categories = categoryIds.join(',');
        }
      }
      
      // Add date range parameters if provided
      if (searchParams.startDate) {
        params['start_date.range_start'] = searchParams.startDate.toISOString();
      }
      
      if (searchParams.endDate) {
        params['start_date.range_end'] = searchParams.endDate.toISOString();
      }
      
      // Add price filter if provided
      if (searchParams.price) {
        if (searchParams.price === 'free') {
          params.price = 'free';
        } else if (searchParams.price === 'paid') {
          params.price = 'paid';
        }
      }
      
      // Add online event filter if provided
      if (searchParams.online !== undefined) {
        params.online_events = searchParams.online;
      }
      
      // Add pagination parameters
      params.page = searchParams.page || 1;
      params.page_size = searchParams.limit || 20;
      
      // Add sorting parameter if provided
      if (searchParams.sort) {
        params.sort_by = searchParams.sort;
      }
      
      // Generate cache key
      const cacheKey = this.getCacheKey('/events/search/', params);
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        logger.debug('Retrieved Eventbrite search results from cache', { cacheKey });
        return cachedResult as { events: IEvent[], total: number };
      }
      
      // Make API request
      const response = await this.makeApiRequest('/events/search/', params) as IEventbriteResponse;
      
      // Transform events to internal format
      const events = response.events.map(event => this.mapEventbriteEventToInternalEvent(event));
      
      // Prepare result
      const result = {
        events,
        total: response.pagination.object_count
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error('Failed to search Eventbrite events', error as Error);
      throw error;
    }
  }

  /**
   * Retrieves a specific event from Eventbrite by ID
   * 
   * @param eventId - The Eventbrite event ID
   * @returns The event if found, null otherwise
   */
  async getEventById(eventId: string): Promise<IEvent | null> {
    try {
      if (!eventId) {
        throw ApiError.badRequest('Event ID is required');
      }
      
      // Check cache first
      const cacheKey = this.getCacheKey(`/events/${eventId}/`, {});
      const cachedEvent = this.cache.get(cacheKey);
      
      if (cachedEvent) {
        logger.debug('Retrieved Eventbrite event from cache', { eventId, cacheKey });
        return cachedEvent as IEvent;
      }
      
      // Make API request
      const event = await this.makeApiRequest(`/events/${eventId}/`, {}) as IEventbriteEvent;
      
      // Transform to internal format
      const mappedEvent = this.mapEventbriteEventToInternalEvent(event);
      
      // Cache the result
      this.cache.set(cacheKey, mappedEvent);
      
      return mappedEvent;
    } catch (error) {
      if ((error as ApiError).statusCode === 404) {
        logger.debug('Eventbrite event not found', { eventId });
        return null;
      }
      
      logger.error('Failed to retrieve Eventbrite event', error as Error, { eventId });
      throw error;
    }
  }

  /**
   * Retrieves events from Eventbrite based on geographic location
   * 
   * @param coordinates - The location coordinates
   * @param radius - Search radius in miles
   * @param options - Additional search options
   * @returns Location-based events with pagination info
   */
  async getEventsByLocation(
    coordinates: ICoordinates,
    radius: number = 10,
    options: {
      startDate?: Date;
      endDate?: Date;
      categories?: InterestCategory[];
      page?: number;
      limit?: number;
      sort?: 'date' | 'best' | 'distance';
    } = {}
  ): Promise<{ events: IEvent[], total: number }> {
    try {
      // Validate coordinates
      if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
        throw ApiError.badRequest('Invalid coordinates for location-based event search');
      }
      
      // Prepare search parameters
      const params: IEventbriteSearchParams = {
        'location.latitude': coordinates.latitude,
        'location.longitude': coordinates.longitude,
        'location.within': `${radius}mi`,
        page: options.page || 1,
        page_size: options.limit || 20,
        sort_by: options.sort ? options.sort : 'distance'
      };
      
      // Add date range parameters if provided
      if (options.startDate) {
        params['start_date.range_start'] = options.startDate.toISOString();
      }
      
      if (options.endDate) {
        params['start_date.range_end'] = options.endDate.toISOString();
      }
      
      // Add category parameters if provided
      if (options.categories && options.categories.length > 0) {
        // Map internal categories to Eventbrite category IDs
        const categoryIds = options.categories
          .map(category => {
            // Find matching Eventbrite category IDs
            return Object.entries(this.categoryMapping)
              .filter(([, internalCategory]) => internalCategory === category)
              .map(([id]) => id);
          })
          .flat();
        
        if (categoryIds.length > 0) {
          params.categories = categoryIds.join(',');
        }
      }
      
      // Generate cache key
      const cacheKey = this.getCacheKey('/events/search/', params);
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        logger.debug('Retrieved Eventbrite location-based events from cache', { 
          latitude: coordinates.latitude, 
          longitude: coordinates.longitude,
          radius,
          cacheKey 
        });
        return cachedResult as { events: IEvent[], total: number };
      }
      
      // Make API request
      const response = await this.makeApiRequest('/events/search/', params) as IEventbriteResponse;
      
      // Transform events to internal format
      const events = response.events.map(event => this.mapEventbriteEventToInternalEvent(event));
      
      // Prepare result
      const result = {
        events,
        total: response.pagination.object_count
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error('Failed to retrieve Eventbrite events by location', error as Error, {
        coordinates,
        radius
      });
      throw error;
    }
  }

  /**
   * Retrieves events from Eventbrite based on category
   * 
   * @param category - The interest category
   * @param options - Additional search options
   * @returns Category-based events with pagination info
   */
  async getEventsByCategory(
    category: InterestCategory,
    options: {
      location?: ICoordinates;
      radius?: number;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      sort?: 'date' | 'best' | 'relevance';
    } = {}
  ): Promise<{ events: IEvent[], total: number }> {
    try {
      // Find matching Eventbrite category IDs
      const categoryIds = Object.entries(this.categoryMapping)
        .filter(([, internalCategory]) => internalCategory === category)
        .map(([id]) => id);
      
      if (categoryIds.length === 0) {
        logger.warn('No matching Eventbrite categories found for interest category', { category });
        return { events: [], total: 0 };
      }
      
      // Prepare search parameters
      const params: IEventbriteSearchParams = {
        categories: categoryIds.join(','),
        page: options.page || 1,
        page_size: options.limit || 20,
        sort_by: options.sort ? options.sort : 'date'
      };
      
      // Add location parameters if provided
      if (options.location) {
        params['location.latitude'] = options.location.latitude;
        params['location.longitude'] = options.location.longitude;
        
        // Add radius parameter, default to 10 miles
        const radius = options.radius || 10;
        params['location.within'] = `${radius}mi`;
      }
      
      // Add date range parameters if provided
      if (options.startDate) {
        params['start_date.range_start'] = options.startDate.toISOString();
      }
      
      if (options.endDate) {
        params['start_date.range_end'] = options.endDate.toISOString();
      }
      
      // Generate cache key
      const cacheKey = this.getCacheKey('/events/search/', params);
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        logger.debug('Retrieved Eventbrite category-based events from cache', { 
          category,
          cacheKey 
        });
        return cachedResult as { events: IEvent[], total: number };
      }
      
      // Make API request
      const response = await this.makeApiRequest('/events/search/', params) as IEventbriteResponse;
      
      // Transform events to internal format
      const events = response.events.map(event => this.mapEventbriteEventToInternalEvent(event));
      
      // Prepare result
      const result = {
        events,
        total: response.pagination.object_count
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error('Failed to retrieve Eventbrite events by category', error as Error, { category });
      throw error;
    }
  }

  /**
   * Retrieves popular events from Eventbrite
   * 
   * @param options - Search options
   * @returns Popular events with pagination info
   */
  async getPopularEvents(
    options: {
      location?: ICoordinates;
      radius?: number;
      categories?: InterestCategory[];
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ events: IEvent[], total: number }> {
    try {
      // Prepare search parameters
      const params: IEventbriteSearchParams = {
        page: options.page || 1,
        page_size: options.limit || 20,
        sort_by: 'best' // Sort by popularity/relevance
      };
      
      // Add location parameters if provided
      if (options.location) {
        params['location.latitude'] = options.location.latitude;
        params['location.longitude'] = options.location.longitude;
        
        // Add radius parameter, default to 10 miles
        const radius = options.radius || 10;
        params['location.within'] = `${radius}mi`;
      }
      
      // Add category parameters if provided
      if (options.categories && options.categories.length > 0) {
        // Map internal categories to Eventbrite category IDs
        const categoryIds = options.categories
          .map(category => {
            // Find matching Eventbrite category IDs
            return Object.entries(this.categoryMapping)
              .filter(([, internalCategory]) => internalCategory === category)
              .map(([id]) => id);
          })
          .flat();
        
        if (categoryIds.length > 0) {
          params.categories = categoryIds.join(',');
        }
      }
      
      // Add date range parameters if provided
      if (options.startDate) {
        params['start_date.range_start'] = options.startDate.toISOString();
      }
      
      if (options.endDate) {
        params['start_date.range_end'] = options.endDate.toISOString();
      }
      
      // Generate cache key
      const cacheKey = this.getCacheKey('/events/search/', params);
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        logger.debug('Retrieved Eventbrite popular events from cache', { cacheKey });
        return cachedResult as { events: IEvent[], total: number };
      }
      
      // Make API request
      const response = await this.makeApiRequest('/events/search/', params) as IEventbriteResponse;
      
      // Transform events to internal format
      const events = response.events.map(event => this.mapEventbriteEventToInternalEvent(event));
      
      // Prepare result
      const result = {
        events,
        total: response.pagination.object_count
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error('Failed to retrieve popular Eventbrite events', error as Error);
      throw error;
    }
  }

  /**
   * Maps an Eventbrite event to the internal event format
   * 
   * @param eventbriteEvent - The Eventbrite event
   * @returns Event in internal format
   */
  private mapEventbriteEventToInternalEvent(eventbriteEvent: IEventbriteEvent): IEventCreate {
    // Determine event type
    const eventType = eventbriteEvent.online_event 
      ? EventType.VIRTUAL 
      : EventType.IN_PERSON;
    
    // Determine coordinates
    const coordinates: ICoordinates = eventbriteEvent.venue?.address
      ? {
          latitude: eventbriteEvent.venue.address.latitude,
          longitude: eventbriteEvent.venue.address.longitude
        }
      : { latitude: 0, longitude: 0 };
    
    // Determine location name
    const location = eventbriteEvent.venue?.name 
      ? `${eventbriteEvent.venue.name}${eventbriteEvent.venue.address?.city ? `, ${eventbriteEvent.venue.address.city}` : ''}`
      : 'Online Event';
    
    // Determine cost
    const isFree = eventbriteEvent.is_free;
    let cost = 0;
    
    if (!isFree && eventbriteEvent.ticket_availability?.minimum_ticket_price) {
      cost = eventbriteEvent.ticket_availability.minimum_ticket_price.value;
    }
    
    // Determine category
    let categories: InterestCategory[] = [];
    if (eventbriteEvent.category_id && this.categoryMapping[eventbriteEvent.category_id]) {
      categories = [this.categoryMapping[eventbriteEvent.category_id]];
    }
    
    // Map to internal event format
    const mappedEvent: IEventCreate = {
      name: eventbriteEvent.name.text,
      description: eventbriteEvent.description.text,
      tribeId: '', // To be filled by the calling service
      createdBy: '', // To be filled by the calling service
      eventType: eventType,
      visibility: EventVisibility.PUBLIC,
      startTime: new Date(eventbriteEvent.start.utc),
      endTime: new Date(eventbriteEvent.end.utc),
      location: location,
      coordinates: coordinates,
      venueId: eventbriteEvent.venue?.id || '',
      cost: cost,
      paymentRequired: !isFree,
      maxAttendees: eventbriteEvent.capacity || 0,
      categories: categories,
    };
    
    // Add event metadata as non-enumerable property
    Object.defineProperty(mappedEvent, 'metadata', {
      value: {
        eventbriteId: eventbriteEvent.id,
        eventbriteUrl: eventbriteEvent.url,
        logoUrl: eventbriteEvent.logo?.url || '',
        summary: eventbriteEvent.summary || '',
        organization_id: eventbriteEvent.organization_id,
        source: 'eventbrite'
      },
      enumerable: true,
      writable: true
    });
    
    return mappedEvent;
  }

  /**
   * Makes an API request to the Eventbrite API
   * 
   * @param endpoint - The API endpoint
   * @param params - Query parameters
   * @returns API response data
   */
  private async makeApiRequest(endpoint: string, params: object): Promise<any> {
    try {
      if (!this.apiKey) {
        throw ApiError.internal('Eventbrite API key is not configured');
      }
      
      const url = `${this.baseUrl}${endpoint}`;
      
      logger.debug('Making Eventbrite API request', { url, params });
      
      const response = await axios.get(url, {
        params,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      // Handle Axios errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        
        if (status === 404) {
          throw ApiError.notFound('Eventbrite resource not found', {
            endpoint,
            message: data?.error_description || 'Resource not found'
          });
        } else if (status === 429) {
          throw ApiError.tooManyRequests('Eventbrite rate limit exceeded', {
            endpoint,
            message: data?.error_description || 'Too many requests'
          });
        } else if (status >= 500) {
          throw ApiError.serviceUnavailable('Eventbrite service unavailable', {
            endpoint,
            message: data?.error_description || 'Service unavailable'
          });
        } else {
          throw ApiError.internal('Eventbrite API error', {
            endpoint,
            status,
            message: data?.error_description || error.message
          });
        }
      }
      
      // Handle network errors
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
          throw ApiError.serviceUnavailable('Eventbrite service unavailable', {
            endpoint,
            message: error.message
          });
        }
      }
      
      // Re-throw unexpected errors
      throw ApiError.internal('Unexpected error while calling Eventbrite API', {
        endpoint,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generates a cache key based on endpoint and parameters
   * 
   * @param endpoint - The API endpoint
   * @param params - Query parameters
   * @returns Cache key
   */
  private getCacheKey(endpoint: string, params: object): string {
    return `eventbrite:${endpoint}:${JSON.stringify(params)}`;
  }
}

export default EventbriteIntegration;