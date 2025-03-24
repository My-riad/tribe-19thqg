import { Availability } from '../models/availability.model';
import {
  validateAvailabilityCreate,
  validateAvailabilityUpdate,
  validateAvailabilityQuery,
  validateBulkAvailability,
  validateOptimalTimeQuery
} from '../validations/availability.validation';
import {
  findOptimalTimeSlots,
  findCommonAvailabilityWindows,
  analyzeUserAvailability
} from '../utils/scheduling.util';
import {
  IAvailability,
  IAvailabilityCreate,
  IAvailabilityUpdate,
  ITimeSlot,
  AvailabilityStatus
} from '../models/availability.model';
import { IOptimalTimeSlot } from '../models/planning.model';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util'; // Assuming shared library for logging

// lodash v4.17.21
import * as _ from 'lodash';

/**
 * Service class for managing user availability data for event planning
 */
export class AvailabilityService {
  private Availability: Availability;

  /**
   * Initializes a new instance of the AvailabilityService class
   */
  constructor() {
    // Initialize the Availability model instance
    this.Availability = new Availability();
  }

  /**
   * Creates a new availability record for a user
   *
   * @param availabilityData - The availability data to create
   * @returns The created availability record
   */
  async createAvailability(availabilityData: IAvailabilityCreate): Promise<IAvailability> {
    // Validate the availability data using validateAvailabilityCreate
    validateAvailabilityCreate(availabilityData);

    // Call availabilityModel.createAvailability with validated data
    const availability = await this.Availability.createAvailability(availabilityData);

    // Log the creation of the availability record
    logger.info('Created availability record', { availabilityId: availability.id, userId: availability.userId });

    // Return the created availability record
    return availability;
  }

  /**
   * Retrieves an availability record by its ID
   *
   * @param id - The ID of the availability record to retrieve
   * @returns The availability record
   */
  async getAvailabilityById(id: string): Promise<IAvailability> {
    // Call availabilityModel.getAvailabilityById with the provided ID
    const availability = await this.Availability.getAvailabilityById(id);

    // If no record is found, throw ApiError.notFound
    if (!availability) {
      throw ApiError.notFound(`Availability with id '${id}' not found`);
    }

    // Return the availability record
    return availability;
  }

  /**
   * Retrieves availability records for a specific user
   *
   * @param userId - The ID of the user to retrieve availability for
   * @param options - Optional parameters for filtering (eventId, tribeId, startDate, endDate)
   * @returns Array of availability records for the user
   */
  async getUserAvailability(userId: string, options?: { eventId?: string; tribeId?: string; startDate?: Date; endDate?: Date }): Promise<IAvailability[]> {
    // Validate the query options using validateAvailabilityQuery
    validateAvailabilityQuery({ userId, ...options });

    // Call availabilityModel.getUserAvailability with userId and validated options
    const availabilities = await this.Availability.getUserAvailability(userId, options);

    // Return the array of availability records
    return availabilities;
  }

  /**
   * Retrieves availability records for a specific event
   *
   * @param eventId - The ID of the event to retrieve availability for
   * @param options - Optional parameters for filtering (userId, startDate, endDate)
   * @returns Array of availability records for the event
   */
  async getEventAvailability(eventId: string, options?: { userId?: string; startDate?: Date; endDate?: Date }): Promise<IAvailability[]> {
    // Validate the query options using validateAvailabilityQuery
    validateAvailabilityQuery({ eventId, ...options });

    // Call availabilityModel.getEventAvailability with eventId and validated options
    const availabilities = await this.Availability.getEventAvailability(eventId, options);

    // Return the array of availability records
    return availabilities;
  }

  /**
   * Retrieves availability records for a specific tribe
   *
   * @param tribeId - The ID of the tribe to retrieve availability for
   * @param options - Optional parameters for filtering (userId, startDate, endDate)
   * @returns Array of availability records for the tribe
   */
  async getTribeAvailability(tribeId: string, options?: { userId?: string; startDate?: Date; endDate?: Date }): Promise<IAvailability[]> {
    // Validate the query options using validateAvailabilityQuery
    validateAvailabilityQuery({ tribeId, ...options });

    // Call availabilityModel.getUserAvailability with tribeId and validated options
    const availabilities = await this.Availability.getUserAvailability(tribeId, options);

    // Return the array of availability records
    return availabilities;
  }

  /**
   * Updates an existing availability record
   *
   * @param id - The ID of the availability record to update
   * @param updateData - The data to update
   * @returns The updated availability record
   */
  async updateAvailability(id: string, updateData: IAvailabilityUpdate): Promise<IAvailability> {
    // Validate the update data using validateAvailabilityUpdate
    validateAvailabilityUpdate(updateData);

    // Call availabilityModel.updateAvailability with id and validated data
    const availability = await this.Availability.updateAvailability(id, updateData);

    // Log the update of the availability record
    logger.info('Updated availability record', { availabilityId: availability.id });

    // Return the updated availability record
    return availability;
  }

  /**
   * Deletes an availability record
   *
   * @param id - The ID of the availability record to delete
   * @returns True if the availability record was deleted
   */
  async deleteAvailability(id: string): Promise<boolean> {
    // Call availabilityModel.deleteAvailability with the provided ID
    const deleted = await this.Availability.deleteAvailability(id);

    // Log the deletion of the availability record
    if (deleted) {
      logger.info('Deleted availability record', { availabilityId: id });
    } else {
      logger.warn('Availability record not found for deletion', { availabilityId: id });
    }

    // Return the result of the deletion operation
    return deleted;
  }

  /**
   * Creates multiple availability records in bulk
   *
   * @param bulkData - Object containing arrays of availability data for multiple users
   * @returns Array of created availability records
   */
  async bulkCreateAvailability(bulkData: { eventId?: string; tribeId?: string; userAvailability: { userId: string; timeSlots: ITimeSlot[]; recurrenceType?: string; recurrenceEndDate?: Date; preferredDuration?: number; notes?: string; }[] }): Promise<IAvailability[]> {
    // Validate the bulk data using validateBulkAvailability
    validateBulkAvailability(bulkData);

    // Call availabilityModel.bulkCreateAvailability with validated data
    const availabilities = await this.Availability.bulkCreateAvailability(bulkData);

    // Log the bulk creation of availability records
    logger.info('Created bulk availability records', { count: availabilities.length });

    // Return the array of created availability records
    return availabilities;
  }

  /**
   * Finds optimal meeting times based on user availability
   *
   * @param eventId - The event ID
   * @param tribeId - The tribe ID
   * @param options - Options for finding optimal time slots
   * @returns Array of optimal time slots ranked by suitability
   */
  async findOptimalMeetingTimes(eventId: string, tribeId: string, options: any): Promise<IOptimalTimeSlot[]> {
    // Validate that at least one of eventId or tribeId is provided
    if (!eventId && !tribeId) {
      throw ApiError.badRequest('Either eventId or tribeId must be provided');
    }

    // Validate the query options using validateOptimalTimeQuery
    validateOptimalTimeQuery({ eventId, tribeId, ...options });

    // Retrieve availability data based on provided parameters
    let availabilities: IAvailability[];
    if (eventId) {
      availabilities = await this.getEventAvailability(eventId, options);
    } else {
      availabilities = await this.getUserAvailability(tribeId, options);
    }

    // Call findOptimalTimeSlots from scheduling.util with availability data and options
    const optimalTimeSlots = findOptimalTimeSlots(availabilities, options);

    // Process and rank the optimal time slots
    const rankedTimeSlots: IOptimalTimeSlot[] = optimalTimeSlots.map((slot, index) => ({
      id: `optimal-time-slot-${index + 1}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      attendanceScore: slot.score,
      attendeeCount: slot.attendeeIds.length,
      totalAttendees: availabilities.length,
      attendancePercentage: (slot.attendeeIds.length / availabilities.length) * 100,
      votes: [],
      aiRecommended: false,
      recommendationReason: 'Based on availability data'
    }));

    // Return the ranked optimal time slots
    return rankedTimeSlots;
  }

  /**
   * Finds common availability windows across multiple users
   *
   * @param eventId - The event ID
   * @param tribeId - The tribe ID
   * @param options - Options for finding common availability windows
   * @returns Common availability windows
   */
  async findCommonAvailabilityWindows(eventId: string, tribeId: string, options: any): Promise<Array<{ startTime: Date; endTime: Date; availableUsers: string[]; }>> {
    // Validate that at least one of eventId or tribeId is provided
    if (!eventId && !tribeId) {
      throw ApiError.badRequest('Either eventId or tribeId must be provided');
    }

    // Retrieve availability data based on provided parameters
    let availabilities: IAvailability[];
    if (eventId) {
      availabilities = await this.getEventAvailability(eventId, options);
    } else {
      availabilities = await this.getUserAvailability(tribeId, options);
    }

    // Call findCommonAvailabilityWindows from scheduling.util with availability data and options
    const commonWindows = findCommonAvailabilityWindows(availabilities, options);

    // Process and sort the common availability windows
    const sortedWindows = commonWindows.sort((a, b) => b.availableUserIds.length - a.availableUserIds.length);

    // Return the common availability windows with user lists
    return sortedWindows;
  }

  /**
   * Analyzes availability patterns to identify trends and optimal scheduling windows
   *
   * @param eventId - The event ID
   * @param tribeId - The tribe ID
   * @returns Availability analysis with patterns and recommendations
   */
  async analyzeAvailabilityPatterns(eventId: string, tribeId: string): Promise<object> {
    // Validate that at least one of eventId or tribeId is provided
    if (!eventId && !tribeId) {
      throw ApiError.badRequest('Either eventId or tribeId must be provided');
    }

    // Retrieve availability data based on provided parameters
    let availabilities: IAvailability[];
    if (eventId) {
      availabilities = await this.getEventAvailability(eventId);
    } else {
      availabilities = await this.getUserAvailability(tribeId);
    }

    // Call analyzeUserAvailability from scheduling.util with availability data
    const availabilityAnalysis = analyzeUserAvailability(availabilities);

    // Process and enhance the availability analysis
    const enhancedAnalysis = {
      ...availabilityAnalysis,
      eventId,
      tribeId
    };

    // Return comprehensive availability analysis with recommendations
    return enhancedAnalysis;
  }
}

export default AvailabilityService;