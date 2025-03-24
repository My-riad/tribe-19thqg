import NodeCache from 'node-cache'; // ^5.1.2
import { EventModel } from '../models/event.model';
import { AttendeeModel } from '../models/attendee.model';
import { DiscoveryService } from './discovery.service';
import { RecommendationService } from './recommendation.service';
import { getCurrentWeather, getWeatherForDate } from './weather.service';
import {
  IEvent,
  IEventCreate,
  IEventUpdate,
  IEventSearchParams,
  IEventRecommendationParams,
  IWeatherBasedActivityParams,
  EventStatus,
  RSVPStatus,
} from '../../../shared/src/types/event.types';
import { ICoordinates } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';
import { eventServiceConfig } from '../config';

// Initialize cache for event service
const eventServiceCache = new NodeCache({ stdTTL: eventServiceConfig.eventCacheTtl, checkperiod: 120 });

/**
 * Service class for managing events and related operations
 */
export class EventService {
  private EventModel: EventModel;
  private AttendeeModel: AttendeeModel;
  private DiscoveryService: DiscoveryService;
  private RecommendationService: RecommendationService;
  private cache: NodeCache;

  /**
   * Initializes a new instance of the EventService class
   */
  constructor() {
    this.EventModel = new EventModel();
    this.AttendeeModel = new AttendeeModel();
    this.DiscoveryService = new DiscoveryService();
    this.RecommendationService = new RecommendationService();
    this.cache = eventServiceCache;
  }

  /**
   * Retrieves an event by its ID
   * @param id - The ID of the event to retrieve
   * @param includeAttendees - Whether to include attendee data
   * @returns The event if found, null otherwise
   */
  async getEventById(id: string, includeAttendees: boolean): Promise<IEvent | null> {
    try {
      logger.info(`Getting event by ID: ${id}`);
      return await this.EventModel.getEventById(id, includeAttendees);
    } catch (error) {
      logger.error(`Error getting event by ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * Retrieves all events for a specific tribe
   * @param tribeId - The ID of the tribe
   * @param options - Filtering and pagination options
   * @returns Events for the tribe with pagination info
   */
  async getEventsByTribeId(tribeId: string, options: any): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.info(`Getting events by tribe ID: ${tribeId}`);
      return await this.EventModel.getEventsByTribeId(tribeId, options);
    } catch (error) {
      logger.error(`Error getting events by tribe ID: ${tribeId}`, error);
      throw error;
    }
  }

  /**
   * Retrieves all events a user is attending or created
   * @param userId - The ID of the user
   * @param options - Filtering and pagination options
   * @returns Events the user is involved with
   */
  async getEventsByUserId(userId: string, options: any): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.info(`Getting events by user ID: ${userId}`);
      return await this.EventModel.getEventsByUserId(userId, options);
    } catch (error) {
      logger.error(`Error getting events by user ID: ${userId}`, error);
      throw error;
    }
  }

  /**
   * Searches for events based on various criteria
   * @param searchParams - Parameters for filtering events
   * @returns Search results with pagination info
   */
  async searchEvents(searchParams: IEventSearchParams): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.info('Searching events', { searchParams });
      return await this.EventModel.searchEvents(searchParams);
    } catch (error) {
      logger.error('Error searching events', error);
      throw error;
    }
  }

  /**
   * Creates a new event with the provided data
   * @param eventData - Data for the new event
   * @returns The created event
   */
  async createEvent(eventData: IEventCreate): Promise<IEvent> {
    try {
      logger.info('Creating event', { eventData });
      return await this.EventModel.createEvent(eventData);
    } catch (error) {
      logger.error('Error creating event', error);
      throw error;
    }
  }

  /**
   * Updates an existing event
   * @param id - The ID of the event to update
   * @param eventData - Updated event data
   * @returns The updated event
   */
  async updateEvent(id: string, eventData: IEventUpdate): Promise<IEvent> {
    try {
      logger.info(`Updating event: ${id}`, { eventData });
      return await this.EventModel.updateEvent(id, eventData);
    } catch (error) {
      logger.error(`Error updating event: ${id}`, error);
      throw error;
    }
  }

  /**
   * Updates the status of an event
   * @param id - The ID of the event
   * @param status - The new status
   * @returns The updated event
   */
  async updateEventStatus(id: string, status: EventStatus): Promise<IEvent> {
    try {
      logger.info(`Updating event status: ${id} to ${status}`);
      return await this.EventModel.updateEventStatus(id, status);
    } catch (error) {
      logger.error(`Error updating event status: ${id}`, error);
      throw error;
    }
  }

  /**
   * Deletes an event
   * @param id - The ID of the event to delete
   * @returns True if the event was deleted, false otherwise
   */
  async deleteEvent(id: string): Promise<boolean> {
    try {
      logger.info(`Deleting event: ${id}`);
      return await this.EventModel.deleteEvent(id);
    } catch (error) {
      logger.error(`Error deleting event: ${id}`, error);
      throw error;
    }
  }

  /**
   * Retrieves upcoming events based on date range
   * @param options - Filtering and pagination options
   * @returns Upcoming events with pagination info
   */
  async getUpcomingEvents(options: any): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.info('Getting upcoming events', { options });
      return await this.EventModel.getUpcomingEvents(options);
    } catch (error) {
      logger.error('Error getting upcoming events', error);
      throw error;
    }
  }

  /**
   * Retrieves all attendees for an event with user details
   * @param eventId - The ID of the event
   * @returns Array of attendees with user details
   */
  async getEventAttendees(eventId: string): Promise<Array<any>> {
    try {
      logger.info(`Getting attendees for event: ${eventId}`);
      return await this.EventModel.getEventAttendees(eventId);
    } catch (error) {
      logger.error(`Error getting attendees for event: ${eventId}`, error);
      throw error;
    }
  }

  /**
   * Updates the RSVP status for an attendee
   * @param eventId - The ID of the event
   * @param userId - The ID of the user
   * @param status - The new RSVP status
   * @returns The updated attendee record
   */
  async updateAttendeeRSVP(eventId: string, userId: string, status: RSVPStatus): Promise<any> {
    try {
      logger.info(`Updating RSVP status for user ${userId} to ${status} for event ${eventId}`);
      return await this.AttendeeModel.updateAttendeeRSVP(eventId, userId, status);
    } catch (error) {
      logger.error(`Error updating RSVP status for user ${userId} to ${status} for event ${eventId}`, error);
      throw error;
    }
  }

  /**
   * Updates the check-in status for an attendee
   * @param eventId - The ID of the event
   * @param userId - The ID of the user
   * @param hasCheckedIn - Whether the user has checked in
    * @param coordinates - The coordinates of the user
   * @returns The updated attendee record
   */
  async updateAttendeeCheckIn(eventId: string, userId: string, hasCheckedIn: boolean, coordinates: ICoordinates): Promise<any> {
    try {
      logger.info(`Updating check-in status for user ${userId} to ${hasCheckedIn} for event ${eventId}`);
      return await this.AttendeeModel.updateAttendeeCheckIn(eventId, userId, hasCheckedIn, coordinates);
    } catch (error) {
      logger.error(`Error updating check-in status for user ${userId} to ${hasCheckedIn} for event ${eventId}`, error);
      throw error;
    }
  }

  /**
   * Gets attendance statistics for an event
   * @param eventId - The ID of the event
   * @returns Object containing attendance statistics
   */
  async getEventAttendanceStats(eventId: string): Promise<object> {
    try {
      logger.info(`Getting attendance stats for event ${eventId}`);
      return await this.AttendeeModel.getEventAttendanceStats(eventId);
    } catch (error) {
      logger.error(`Error getting attendance stats for event ${eventId}`, error);
      throw error;
    }
  }

  /**
   * Checks for scheduling conflicts for a tribe or user
   * @param tribeId - The ID of the tribe
   * @param userId - The ID of the user
   * @param startTime - The start time of the proposed event
   * @param endTime - The end time of the proposed event
   * @param excludeEventId - ID of an event to exclude from conflict check (e.g., when updating)
   * @returns Conflict check results
   */
  async checkEventConflicts(tribeId: string, userId: string, startTime: Date, endTime: Date, excludeEventId: string): Promise<{ hasConflict: boolean; conflictingEvents: IEvent[] }> {
    try {
      logger.info(`Checking for event conflicts for tribe ${tribeId} and user ${userId}`);
      return await this.EventModel.checkEventConflicts(tribeId, userId, startTime, endTime, excludeEventId);
    } catch (error) {
      logger.error(`Error checking for event conflicts for tribe ${tribeId} and user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Discovers events from multiple sources based on search parameters
   * @param searchParams - Search parameters
   * @returns Discovered events with pagination info
   */
  async discoverEvents(searchParams: IEventSearchParams): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.info('Discovering events', { searchParams });
      return await this.DiscoveryService.discoverEvents(searchParams);
    } catch (error) {
      logger.error('Error discovering events', error);
      throw error;
    }
  }

  /**
   * Discovers events near a specific location
   * @param coordinates - Location coordinates
   * @param radius - Search radius
   * @param options - Additional options
   * @returns Location-based events with pagination info
   */
  async discoverEventsByLocation(coordinates: ICoordinates, radius: number, options: any): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.info(`Discovering events by location: ${coordinates.latitude}, ${coordinates.longitude}`);
      return await this.DiscoveryService.discoverEventsByLocation(coordinates, radius, options);
    } catch (error) {
      logger.error(`Error discovering events by location: ${coordinates.latitude}, ${coordinates.longitude}`, error);
      throw error;
    }
  }

  /**
   * Discovers events matching specific interest categories
   * @param categories - Array of interest categories
   * @param options - Additional options
   * @returns Interest-based events with pagination info
   */
  async discoverEventsByInterest(categories: InterestCategory[], options: any): Promise<{ events: IEvent[]; total: number }> {
    try {
      logger.info(`Discovering events by interest: ${categories.join(', ')}`);
      return await this.DiscoveryService.discoverEventsByInterest(categories, options);
    } catch (error) {
      logger.error(`Error discovering events by interest: ${categories.join(', ')}`, error);
      throw error;
    }
  }

  /**
   * Discovers events suitable for current or forecasted weather conditions
   * @param params - Weather-based activity parameters
   * @returns Weather-appropriate events with weather data
   */
  async discoverWeatherBasedEvents(params: IWeatherBasedActivityParams): Promise<{ events: IEvent[]; total: number; weather: any }> {
    try {
      logger.info('Discovering weather-based events', { params });
      return await this.DiscoveryService.discoverWeatherBasedEvents(params);
    } catch (error) {
      logger.error('Error discovering weather-based events', error);
      throw error;
    }
  }

  /**
   * Get personalized event recommendations for a user based on their profile and preferences
   * @param userId - The ID of the user
   * @param options - Additional options
   * @returns Personalized event recommendations with relevance scores
   */
  async getPersonalizedRecommendations(userId: string, options: any): Promise<any> {
    try {
      logger.info(`Getting personalized recommendations for user ${userId}`);
      return await this.RecommendationService.getPersonalizedRecommendations(userId, options);
    } catch (error) {
      logger.error(`Error getting personalized recommendations for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get event recommendations for a tribe based on collective interests and past activities
   * @param tribeId - The ID of the tribe
   * @param options - Additional options
   * @returns Tribe-specific event recommendations with relevance scores
   */
  async getTribeRecommendations(tribeId: string, options: any): Promise<any> {
    try {
      logger.info(`Getting tribe recommendations for tribe ${tribeId}`);
      return await this.RecommendationService.getTribeRecommendations(tribeId, options);
    } catch (error) {
      logger.error(`Error getting tribe recommendations for tribe ${tribeId}`, error);
      throw error;
    }
  }

  /**
   * Get event recommendations based on current or forecasted weather conditions
   * @param coordinates - The coordinates of the location
   * @param date - The date to get weather for
   * @param options - Additional options
   * @returns Weather-appropriate event recommendations
   */
  async getWeatherBasedRecommendations(coordinates: ICoordinates, date: Date, options: any): Promise<any> {
    try {
      logger.info(`Getting weather-based recommendations for location ${coordinates.latitude}, ${coordinates.longitude} on ${date}`);
      return await this.RecommendationService.getWeatherBasedRecommendations(coordinates, date, options);
    } catch (error) {
      logger.error(`Error getting weather-based recommendations for location ${coordinates.latitude}, ${coordinates.longitude} on ${date}`, error);
      throw error;
    }
  }

  /**
   * Get budget-friendly event recommendations based on specified cost constraints
   * @param maxCost - The maximum cost
   * @param options - Additional options
   * @returns Budget-friendly event recommendations
   */
  async getBudgetFriendlyRecommendations(maxCost: number, options: any): Promise<any> {
    try {
      logger.info(`Getting budget-friendly recommendations with max cost ${maxCost}`);
      return await this.RecommendationService.getBudgetFriendlyRecommendations(maxCost, options);
    } catch (error) {
      logger.error(`Error getting budget-friendly recommendations with max cost ${maxCost}`, error);
      throw error;
    }
  }

  /**
   * Clears the event service cache
   */
  clearCache(): void {
    try {
      logger.info('Clearing event service cache');
      this.EventModel.clearCache();
      this.AttendeeModel.clearCache();
      this.DiscoveryService.clearCache();
      this.RecommendationService.clearCache();
      this.cache.flushAll();
    } catch (error) {
      logger.error('Error clearing event service cache', error);
    }
  }
}