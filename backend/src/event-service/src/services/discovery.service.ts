import NodeCache from 'node-cache'; // ^5.1.2
import { EventModel } from '../models/event.model';
import { EventbriteIntegration } from '../integrations/eventbrite.integration';
import { MeetupIntegration } from '../integrations/meetup.integration';
import { OpenWeatherMapIntegration } from '../integrations/openweathermap.integration';
import { GooglePlacesIntegration } from '../integrations/google-places.integration';
import { isOutdoorWeather, getWeatherBasedActivitySuggestions } from './weather.service';
import { IEvent, IEventSearchParams, IWeatherBasedActivityParams } from '../../../shared/src/types/event.types';
import { ICoordinates, InterestCategory } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';
import { eventServiceConfig } from '../config';

// Initialize cache for discovery results
const discoveryCache = new NodeCache({ stdTTL: eventServiceConfig.eventCacheTtl, checkperiod: 120 });

/**
 * Service class for discovering and aggregating events from multiple sources
 */
export class DiscoveryService {
  private EventModel: EventModel;
  private EventbriteIntegration: EventbriteIntegration;
  private MeetupIntegration: MeetupIntegration;
  private OpenWeatherMapIntegration: OpenWeatherMapIntegration;
  private GooglePlacesIntegration: GooglePlacesIntegration;
  private NodeCache: NodeCache;

  /**
   * Initializes a new instance of the DiscoveryService class
   */
  constructor() {
    this.EventModel = new EventModel();
    this.EventbriteIntegration = new EventbriteIntegration();
    this.MeetupIntegration = new MeetupIntegration();
    this.OpenWeatherMapIntegration = new OpenWeatherMapIntegration();
    this.GooglePlacesIntegration = new GooglePlacesIntegration();
    this.NodeCache = discoveryCache;
  }

  /**
   * Discovers events from multiple sources based on search parameters
   * 
   * @param searchParams - Search parameters
   * @returns Discovered events with pagination info
   */
  async discoverEvents(searchParams: IEventSearchParams): Promise<{ events: IEvent[], total: number }> {
    // Generate cache key based on search parameters
    const cacheKey = this.getCacheKey('discoverEvents', searchParams);

    // Check if results exist in cache
    const cachedResults = this.NodeCache.get<{ events: IEvent[], total: number }>(cacheKey);
    if (cachedResults) {
      logger.info(`Returning cached results for discoverEvents with key: ${cacheKey}`);
      return cachedResults;
    }

    // Initialize results arrays for internal and external events
    let internalEvents: IEvent[] = [];
    let externalEvents: IEvent[] = [];
    let totalInternal: number = 0;
    let totalExternal: number = 0;

    // If includeInternal flag is true, query internal events using eventModel.searchEvents
    if (searchParams.includeInternal !== false) {
      const internalResult = await this.EventModel.searchEvents(searchParams);
      internalEvents = internalResult.events;
      totalInternal = internalResult.total;
    }

    // If includeExternal flag is true, query external events from Eventbrite and Meetup
    if (searchParams.includeExternal !== false) {
      const eventbriteResult = await this.EventbriteIntegration.searchEvents(searchParams);
      const meetupResult = await this.MeetupIntegration.searchEvents(searchParams);

      externalEvents = eventbriteResult.events.concat(meetupResult.events);
      totalExternal = eventbriteResult.total + meetupResult.total;
    }

    // Merge and deduplicate results from all sources
    let combinedEvents = this.mergeAndDeduplicateEvents([internalEvents, externalEvents]);

    // Apply sorting based on searchParams.sortBy
    if (searchParams.sortBy) {
      combinedEvents = this.sortEvents(combinedEvents, searchParams.sortBy, searchParams);
    }

    // Apply pagination based on searchParams.page and searchParams.limit
    const page = searchParams.page || 1;
    const limit = searchParams.limit || 20;
    const paginatedEvents = this.applyPagination(combinedEvents, page, limit);

    // Cache the results
    const total = totalInternal + totalExternal;
    const result = { events: paginatedEvents, total };
    this.NodeCache.set(cacheKey, result);
    logger.info(`Caching results for discoverEvents with key: ${cacheKey}`);

    // Return the combined events and total count
    return result;
  }

  /**
   * Discovers events near a specific location
   * 
   * @param coordinates - Location coordinates
   * @param radius - Search radius
   * @param options - Additional options
   * @returns Location-based events with pagination info
   */
  async discoverEventsByLocation(
    coordinates: ICoordinates,
    radius: number,
    options: any
  ): Promise<{ events: IEvent[], total: number }> {
    // Generate cache key based on coordinates, radius, and options
    const cacheKey = this.getCacheKey('discoverEventsByLocation', { coordinates, radius, options });

    // Check if results exist in cache
    const cachedResults = this.NodeCache.get<{ events: IEvent[], total: number }>(cacheKey);
    if (cachedResults) {
      logger.info(`Returning cached results for discoverEventsByLocation with key: ${cacheKey}`);
      return cachedResults;
    }

    // Initialize results arrays for internal and external events
    let internalEvents: IEvent[] = [];
    let externalEvents: IEvent[] = [];
    let totalInternal: number = 0;
    let totalExternal: number = 0;

    // If includeInternal flag is true, query internal events using eventModel.getEventsByLocation
    if (options.includeInternal !== false) {
      const internalResult = await this.EventModel.getEventsByLocation(coordinates, radius, options);
      internalEvents = internalResult.events;
      totalInternal = internalResult.total;
    }

    // If includeExternal flag is true, query external events from Eventbrite and Meetup
    if (options.includeExternal !== false) {
      const eventbriteResult = await this.EventbriteIntegration.getEventsByLocation(coordinates, radius, options);
      const meetupResult = await this.MeetupIntegration.getEventsByLocation(coordinates, radius, options);

      externalEvents = eventbriteResult.events.concat(meetupResult.events);
      totalExternal = eventbriteResult.total + meetupResult.total;
    }

    // Merge and deduplicate results from all sources
    let combinedEvents = this.mergeAndDeduplicateEvents([internalEvents, externalEvents]);

    // Calculate distance from search coordinates for each event
    combinedEvents = combinedEvents.map(event => {
      const distance = this.calculateDistance(coordinates, event.coordinates);
      return { ...event, distance };
    });

    // Sort events by distance (ascending)
    combinedEvents.sort((a, b) => a.distance - b.distance);

    // Apply additional filters from options
    // (Currently no additional filters specified in requirements)

    // Apply pagination based on options
    const page = options.page || 1;
    const limit = options.limit || 20;
    const paginatedEvents = this.applyPagination(combinedEvents, page, limit);

    // Cache the results
    const total = totalInternal + totalExternal;
    const result = { events: paginatedEvents, total };
    this.NodeCache.set(cacheKey, result);
    logger.info(`Caching results for discoverEventsByLocation with key: ${cacheKey}`);

    // Return the location-based events and total count
    return result;
  }

  /**
   * Discovers events matching specific interest categories
   * 
   * @param categories - Array of interest categories
   * @param options - Additional options
   * @returns Interest-based events with pagination info
   */
  async discoverEventsByInterest(
    categories: InterestCategory[],
    options: any
  ): Promise<{ events: IEvent[], total: number }> {
    // Generate cache key based on categories and options
    const cacheKey = this.getCacheKey('discoverEventsByInterest', { categories, options });

    // Check if results exist in cache
    const cachedResults = this.NodeCache.get<{ events: IEvent[], total: number }>(cacheKey);
    if (cachedResults) {
      logger.info(`Returning cached results for discoverEventsByInterest with key: ${cacheKey}`);
      return cachedResults;
    }

    // Initialize results arrays for each category
    let allEvents: IEvent[] = [];
    let totalEvents: number = 0;

    // For each category, query internal events using eventModel.getEventsByCategory
    // For each category, query external events from Eventbrite and Meetup
    for (const category of categories) {
      const internalResult = await this.EventModel.getEventsByCategory(category, options);
      const eventbriteResult = await this.EventbriteIntegration.getEventsByCategory(category, options);
      const meetupResult = await this.MeetupIntegration.getEventsByCategory(category, options);

      allEvents = allEvents.concat(internalResult.events, eventbriteResult.events, meetupResult.events);
      totalEvents += internalResult.total + eventbriteResult.total + meetupResult.total;
    }

    // Merge and deduplicate results from all sources and categories
    let combinedEvents = this.mergeAndDeduplicateEvents([allEvents]);

    // Apply additional filters from options
    // (Currently no additional filters specified in requirements)

    // Apply sorting based on options
    if (options.sortBy) {
      combinedEvents = this.sortEvents(combinedEvents, options.sortBy, options);
    }

    // Apply pagination based on options
    const page = options.page || 1;
    const limit = options.limit || 20;
    const paginatedEvents = this.applyPagination(combinedEvents, page, limit);

    // Cache the results
    const result = { events: paginatedEvents, total: totalEvents };
    this.NodeCache.set(cacheKey, result);
    logger.info(`Caching results for discoverEventsByInterest with key: ${cacheKey}`);

    // Return the interest-based events and total count
    return result;
  }

  /**
   * Discovers events suitable for current or forecasted weather conditions
   * 
   * @param params - Weather-based activity parameters
   * @returns Weather-appropriate events with weather data
   */
  async discoverWeatherBasedEvents(
    params: IWeatherBasedActivityParams
  ): Promise<{ events: IEvent[], total: number, weather: any }> {
    // Generate cache key based on params
    const cacheKey = this.getCacheKey('discoverWeatherBasedEvents', params);

    // Check if results exist in cache
    const cachedResults = this.NodeCache.get<{ events: IEvent[], total: number, weather: any }>(cacheKey);
    if (cachedResults) {
      logger.info(`Returning cached results for discoverWeatherBasedEvents with key: ${cacheKey}`);
      return cachedResults;
    }

    // Get weather data for the specified location and date
    const weatherData = await this.OpenWeatherMapIntegration.getWeatherForDate(params.location, params.date);

    // Determine if weather is suitable for outdoor activities using isOutdoorWeather
    const isGoodWeather = isOutdoorWeather(weatherData);

    // Get weather-based activity suggestions using getWeatherBasedActivitySuggestions
    const activitySuggestions = getWeatherBasedActivitySuggestions(weatherData);

    // Build search parameters based on weather conditions and activity suggestions
    const searchParams: IEventSearchParams = {
      location: params.location,
      maxDistance: params.maxDistance,
      categories: params.preferredCategories,
      page: params.limit,
      limit: params.limit,
    };

    // If weather is good for outdoors and not preferIndoor, prioritize outdoor events
    // If weather is bad for outdoors or preferIndoor, prioritize indoor events
    let internalEvents: IEvent[] = [];
    let externalEvents: IEvent[] = [];
    let totalInternal: number = 0;
    let totalExternal: number = 0;

    const internalResult = await this.EventModel.recommendWeatherBasedEvents(params);
    internalEvents = internalResult.events;
    totalInternal = internalResult.total;

    const eventbriteResult = await this.EventbriteIntegration.searchEvents(searchParams);
    const meetupResult = await this.MeetupIntegration.searchEvents(searchParams);

    externalEvents = eventbriteResult.events.concat(meetupResult.events);
    totalExternal = eventbriteResult.total + meetupResult.total;

    // Merge and deduplicate results
    let combinedEvents = this.mergeAndDeduplicateEvents([internalEvents, externalEvents]);

    // Apply additional filters from params
    // (Currently no additional filters specified in requirements)

    // Apply sorting based on weather suitability and relevance
    combinedEvents = this.sortEvents(combinedEvents, 'relevance', params);

    // Apply pagination based on params
    const page = params.limit || 1;
    const limit = params.limit || 20;
    const paginatedEvents = this.applyPagination(combinedEvents, page, limit);

    // Cache the results
    const total = totalInternal + totalExternal;
    const result = { events: paginatedEvents, total, weather: weatherData };
    this.NodeCache.set(cacheKey, result);
    logger.info(`Caching results for discoverWeatherBasedEvents with key: ${cacheKey}`);

    // Return the weather-appropriate events, total count, and weather data
    return result;
  }

  /**
   * Discovers trending or popular events
   * 
   * @param options - Additional options
   * @returns Popular events with pagination info
   */
  async discoverPopularEvents(options: any): Promise<{ events: IEvent[], total: number }> {
    // Generate cache key based on options
    const cacheKey = this.getCacheKey('discoverPopularEvents', options);

    // Check if results exist in cache
    const cachedResults = this.NodeCache.get<{ events: IEvent[], total: number }>(cacheKey);
    if (cachedResults) {
      logger.info(`Returning cached results for discoverPopularEvents with key: ${cacheKey}`);
      return cachedResults;
    }

    // Query internal popular events using eventModel.getPopularEvents
    // Query external popular events from Eventbrite and Meetup
    const internalResult = await this.EventModel.getPopularEvents(options);
    const eventbriteResult = await this.EventbriteIntegration.getPopularEvents(options);
    const meetupResult = await this.MeetupIntegration.searchEvents(options);

    const internalEvents = internalResult.events;
    const externalEvents = eventbriteResult.events.concat(meetupResult.events);
    const totalInternal = internalResult.total;
    const totalExternal = eventbriteResult.total + meetupResult.total;

    // Merge and deduplicate results
    let combinedEvents = this.mergeAndDeduplicateEvents([internalEvents, externalEvents]);

    // Apply additional filters from options
    // (Currently no additional filters specified in requirements)

    // Sort by popularity metrics (attendance, RSVPs, views)
    combinedEvents = this.sortEvents(combinedEvents, 'popularity', options);

    // Apply pagination based on options
    const page = options.page || 1;
    const limit = options.limit || 20;
    const paginatedEvents = this.applyPagination(combinedEvents, page, limit);

    // Cache the results
    const total = totalInternal + totalExternal;
    const result = { events: paginatedEvents, total };
    this.NodeCache.set(cacheKey, result);
    logger.info(`Caching results for discoverPopularEvents with key: ${cacheKey}`);

    // Return the popular events and total count
    return result;
  }

  /**
   * Discovers free or low-cost events
   * 
   * @param maxCost - Maximum cost
   * @param options - Additional options
   * @returns Budget-friendly events with pagination info
   */
  async discoverBudgetFriendlyEvents(maxCost: number, options: any): Promise<{ events: IEvent[], total: number }> {
    // Generate cache key based on maxCost and options
    const cacheKey = this.getCacheKey('discoverBudgetFriendlyEvents', { maxCost, options });

    // Check if results exist in cache
    const cachedResults = this.NodeCache.get<{ events: IEvent[], total: number }>(cacheKey);
    if (cachedResults) {
      logger.info(`Returning cached results for discoverBudgetFriendlyEvents with key: ${cacheKey}`);
      return cachedResults;
    }

    // Build search parameters with cost filter
    const searchParams: IEventSearchParams = {
      maxCost: maxCost,
      page: options.page,
      limit: options.limit,
    };

    // Query internal events using eventModel.searchEvents with cost filter
    // Query external events from Eventbrite and Meetup with cost filter
    const internalResult = await this.EventModel.searchEvents(searchParams);
    const eventbriteResult = await this.EventbriteIntegration.searchEvents(searchParams);
    const meetupResult = await this.MeetupIntegration.searchEvents(searchParams);

    const internalEvents = internalResult.events;
    const externalEvents = eventbriteResult.events.concat(meetupResult.events);
    const totalInternal = internalResult.total;
    const totalExternal = eventbriteResult.total + meetupResult.total;

    // Merge and deduplicate results
    let combinedEvents = this.mergeAndDeduplicateEvents([internalEvents, externalEvents]);

    // Filter events to ensure they are within budget (cost <= maxCost)
    combinedEvents = combinedEvents.filter(event => event.cost <= maxCost);

    // Sort by cost (ascending)
    combinedEvents = this.sortEvents(combinedEvents, 'cost', options);

    // Apply additional filters from options
    // (Currently no additional filters specified in requirements)

    // Apply pagination based on options
    const page = options.page || 1;
    const limit = options.limit || 20;
    const paginatedEvents = this.applyPagination(combinedEvents, page, limit);

    // Cache the results
    const total = totalInternal + totalExternal;
    const result = { events: paginatedEvents, total };
    this.NodeCache.set(cacheKey, result);
    logger.info(`Caching results for discoverBudgetFriendlyEvents with key: ${cacheKey}`);

    // Return the budget-friendly events and total count
    return result;
  }

  /**
   * Discovers events within a specific date/time range
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @param options - Additional options
   * @returns Time-based events with pagination info
   */
  async discoverEventsForTimeframe(startDate: Date, endDate: Date, options: any): Promise<{ events: IEvent[], total: number }> {
    // Generate cache key based on startDate, endDate, and options
    const cacheKey = this.getCacheKey('discoverEventsForTimeframe', { startDate, endDate, options });

    // Check if results exist in cache
    const cachedResults = this.NodeCache.get<{ events: IEvent[], total: number }>(cacheKey);
    if (cachedResults) {
      logger.info(`Returning cached results for discoverEventsForTimeframe with key: ${cacheKey}`);
      return cachedResults;
    }

    // Build search parameters with date range filter
    const searchParams: IEventSearchParams = {
      startDate: startDate,
      endDate: endDate,
      page: options.page,
      limit: options.limit,
    };

    // Query internal events using eventModel.searchEvents with date range
    // Query external events from Eventbrite and Meetup with date range
    const internalResult = await this.EventModel.searchEvents(searchParams);
    const eventbriteResult = await this.EventbriteIntegration.searchEvents(searchParams);
    const meetupResult = await this.MeetupIntegration.searchEvents(searchParams);

    const internalEvents = internalResult.events;
    const externalEvents = eventbriteResult.events.concat(meetupResult.events);
    const totalInternal = internalResult.total;
    const totalExternal = eventbriteResult.total + meetupResult.total;

    // Merge and deduplicate results
    let combinedEvents = this.mergeAndDeduplicateEvents([internalEvents, externalEvents]);

    // Apply additional filters from options
    // (Currently no additional filters specified in requirements)

    // Sort by start time (ascending)
    combinedEvents = this.sortEvents(combinedEvents, 'date', options);

    // Apply pagination based on options
    const page = options.page || 1;
    const limit = options.limit || 20;
    const paginatedEvents = this.applyPagination(combinedEvents, page, limit);

    // Cache the results
    const total = totalInternal + totalExternal;
    const result = { events: paginatedEvents, total };
    this.NodeCache.set(cacheKey, result);
    logger.info(`Caching results for discoverEventsForTimeframe with key: ${cacheKey}`);

    // Return the time-based events and total count
    return result;
  }

  /**
   * Merges and deduplicates events from multiple sources
   * 
   * @param eventArrays - Array of event arrays
   * @returns Merged and deduplicated events
   */
  private mergeAndDeduplicateEvents(eventArrays: IEvent[][]): IEvent[] {
    // Flatten the array of event arrays
    const allEvents = eventArrays.flat();

    // Create a map to track unique events by ID or external ID
    const uniqueEventsMap = new Map<string, IEvent>();

    // Iterate through all events and add to map if not already present
    for (const event of allEvents) {
      const eventId = event.id || (event.metadata && event.metadata.eventbriteId) || (event.metadata && event.metadata.meetupId);
      if (eventId && !uniqueEventsMap.has(eventId)) {
        uniqueEventsMap.set(eventId, event);
      }
    }

    // Convert map values back to array
    const deduplicatedEvents = Array.from(uniqueEventsMap.values());

    // Return the deduplicated events array
    return deduplicatedEvents;
  }

  /**
   * Sorts events based on specified criteria
   * 
   * @param events - Array of events
   * @param sortBy - Sorting criteria
   * @param context - Context object
   * @returns Sorted events
   */
  private sortEvents(events: IEvent[], sortBy: string, context: any): IEvent[] {
    // Create a copy of the events array
    const sortedEvents = [...events];

    // Apply sorting based on sortBy parameter:
    if (sortBy === 'date') {
      // If 'date', sort by startTime (ascending)
      sortedEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    } else if (sortBy === 'relevance' && context.location) {
      // If 'relevance', sort by relevance score if available
      sortedEvents.sort((a: any, b: any) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } else if (sortBy === 'distance' && context.location) {
      // If 'distance', sort by distance from coordinates if available
      sortedEvents.sort((a: any, b: any) => a.distance - b.distance);
    } else if (sortBy === 'cost') {
      // If 'cost', sort by cost (ascending)
      sortedEvents.sort((a, b) => a.cost - b.cost);
    } else if (sortBy === 'popularity') {
      // If 'popularity', sort by attendance or RSVP count
      sortedEvents.sort((a: any, b: any) => (b.attendeeCount || 0) - (a.attendeeCount || 0));
    }

    // Return the sorted events array
    return sortedEvents;
  }

  /**
   * Applies pagination to events array
   * 
   * @param events - Array of events
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated events
   */
  private applyPagination(events: IEvent[], page: number, limit: number): IEvent[] {
    // Calculate start and end indices based on page and limit
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Return the sliced events array
    return events.slice(startIndex, endIndex);
  }

  /**
   * Calculates the distance between two coordinates in miles
   * 
   * @param coord1 - First coordinate
   * @param coord2 - Second coordinate
   * @returns Distance in miles
   */
  private calculateDistance(coord1: ICoordinates, coord2: ICoordinates): number {
    const R = 3958.8; // Radius of the earth in miles
    const lat1 = coord1.latitude * Math.PI / 180;
    const lon1 = coord1.longitude * Math.PI / 180;
    const lat2 = coord2.latitude * Math.PI / 180;
    const lon2 = coord2.longitude * Math.PI / 180;

    const dlon = lon2 - lon1;
    const dlat = lat2 - lat1;

    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance;
  }

  /**
   * Generates a cache key for discovery results
   * 
   * @param prefix - Cache key prefix
   * @param params - Parameters
   * @returns Cache key
   */
  private getCacheKey(prefix: string, params: any): string {
    // Combine prefix with stringified parameters
    const paramsString = JSON.stringify(params);
    const cacheKey = `${prefix}:${paramsString}`;

    // Return the combined string as cache key
    return cacheKey;
  }

  /**
   * Clears the discovery cache
   */
  clearCache(): void {
    // Call cache.flushAll() to clear all cached discovery results
    this.NodeCache.flushAll();

    // Log cache clearing action
    logger.info('Discovery cache cleared');
  }
}

export default DiscoveryService;