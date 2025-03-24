import { PrismaClient } from '@prisma/client';
import { ValidationError } from '../../../shared/src/errors/validation.error';

/**
 * Enum representing the possible availability statuses for time slots
 */
export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  TENTATIVE = 'TENTATIVE'
}

/**
 * Enum representing the possible recurrence patterns for availability
 */
export enum RecurrenceType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

/**
 * Interface representing a time slot with start time, end time, and availability status
 */
export interface ITimeSlot {
  startTime: Date;
  endTime: Date;
  status: AvailabilityStatus;
}

/**
 * Interface representing the complete availability record structure
 */
export interface IAvailability {
  id: string;
  userId: string;
  eventId?: string;
  tribeId?: string;
  timeSlots: ITimeSlot[];
  recurrenceType: RecurrenceType;
  recurrenceEndDate?: Date;
  preferredDuration?: number; // in minutes
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for creating a new availability record
 */
export interface IAvailabilityCreate {
  userId: string;
  eventId?: string;
  tribeId?: string;
  timeSlots: ITimeSlot[];
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: Date;
  preferredDuration?: number;
  notes?: string;
}

/**
 * Interface for updating an existing availability record
 */
export interface IAvailabilityUpdate {
  timeSlots?: ITimeSlot[];
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: Date;
  preferredDuration?: number;
  notes?: string;
}

/**
 * Interface representing the database document structure for availability records
 */
export interface IAvailabilityDocument {
  id: string;
  userId: string;
  eventId?: string;
  tribeId?: string;
  timeSlots: object; // Stored as JSON in the database
  recurrenceType: string;
  recurrenceEndDate?: Date;
  preferredDuration?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model class for managing user availability data for event planning
 */
export class Availability {
  private prisma: PrismaClient;

  /**
   * Initializes a new instance of the Availability class
   */
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Creates a new availability record
   * 
   * @param availabilityData - The availability data to create
   * @returns The created availability record
   * @throws ValidationError if the data is invalid or conflicting availability exists
   */
  async createAvailability(availabilityData: IAvailabilityCreate): Promise<IAvailability> {
    // Validate required fields
    if (!availabilityData.userId) {
      throw ValidationError.requiredField('userId');
    }

    if (!availabilityData.eventId && !availabilityData.tribeId) {
      throw ValidationError.invalidInput('Either eventId or tribeId must be provided');
    }

    if (!availabilityData.timeSlots || availabilityData.timeSlots.length === 0) {
      throw ValidationError.requiredField('timeSlots');
    }

    // Validate time slots
    for (const slot of availabilityData.timeSlots) {
      if (!slot.startTime) {
        throw ValidationError.requiredField('timeSlots[].startTime');
      }
      if (!slot.endTime) {
        throw ValidationError.requiredField('timeSlots[].endTime');
      }
      if (new Date(slot.startTime) >= new Date(slot.endTime)) {
        throw ValidationError.invalidInput('Start time must be before end time');
      }
      if (!Object.values(AvailabilityStatus).includes(slot.status)) {
        throw ValidationError.invalidEnum('timeSlots[].status', Object.values(AvailabilityStatus));
      }
    }

    // Set default recurrence type if not provided
    const recurrenceType = availabilityData.recurrenceType || RecurrenceType.NONE;

    // If recurrence type is not NONE, validate recurrenceEndDate
    if (recurrenceType !== RecurrenceType.NONE && !availabilityData.recurrenceEndDate) {
      throw ValidationError.requiredField('recurrenceEndDate');
    }

    // Check if an availability record already exists for this user and event/tribe
    let existingAvailability;
    if (availabilityData.eventId) {
      existingAvailability = await this.prisma.availability.findFirst({
        where: {
          userId: availabilityData.userId,
          eventId: availabilityData.eventId
        }
      });
    } else if (availabilityData.tribeId) {
      existingAvailability = await this.prisma.availability.findFirst({
        where: {
          userId: availabilityData.userId,
          tribeId: availabilityData.tribeId
        }
      });
    }

    if (existingAvailability) {
      throw ValidationError.conflict('Availability record already exists for this user and event/tribe');
    }

    // Create the availability record
    const newAvailability = await this.prisma.availability.create({
      data: {
        userId: availabilityData.userId,
        eventId: availabilityData.eventId,
        tribeId: availabilityData.tribeId,
        timeSlots: JSON.stringify(availabilityData.timeSlots),
        recurrenceType,
        recurrenceEndDate: availabilityData.recurrenceEndDate,
        preferredDuration: availabilityData.preferredDuration,
        notes: availabilityData.notes
      }
    });

    // Convert the stored JSON string back to an array
    const timeSlots = JSON.parse(newAvailability.timeSlots as string);

    return {
      ...newAvailability,
      timeSlots,
      recurrenceType: newAvailability.recurrenceType as RecurrenceType,
    };
  }

  /**
   * Retrieves an availability record by its ID
   * 
   * @param id - The ID of the availability record to retrieve
   * @returns The availability record if found, null otherwise
   */
  async getAvailabilityById(id: string): Promise<IAvailability | null> {
    const availability = await this.prisma.availability.findUnique({
      where: { id }
    });

    if (!availability) {
      return null;
    }

    // Convert the stored JSON string back to an array
    const timeSlots = JSON.parse(availability.timeSlots as string);

    return {
      ...availability,
      timeSlots,
      recurrenceType: availability.recurrenceType as RecurrenceType,
    };
  }

  /**
   * Retrieves availability records for a specific user
   * 
   * @param userId - The ID of the user to retrieve availability for
   * @param options - Optional parameters for filtering (eventId, tribeId, startDate, endDate)
   * @returns Array of availability records for the user
   */
  async getUserAvailability(userId: string, options?: {
    eventId?: string;
    tribeId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<IAvailability[]> {
    // Build the query filter
    const filter: any = { userId };
    
    if (options?.eventId) {
      filter.eventId = options.eventId;
    }
    
    if (options?.tribeId) {
      filter.tribeId = options.tribeId;
    }

    // Get the availability records
    const availabilityRecords = await this.prisma.availability.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' }
    });

    // Process the records to convert timeSlots from JSON string to array
    return availabilityRecords.map(record => ({
      ...record,
      timeSlots: JSON.parse(record.timeSlots as string),
      recurrenceType: record.recurrenceType as RecurrenceType,
    }));
  }

  /**
   * Retrieves availability records for a specific event
   * 
   * @param eventId - The ID of the event to retrieve availability for
   * @param options - Optional parameters for filtering (userId, startDate, endDate)
   * @returns Array of availability records for the event
   */
  async getEventAvailability(eventId: string, options?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<IAvailability[]> {
    // Build the query filter
    const filter: any = { eventId };
    
    if (options?.userId) {
      filter.userId = options.userId;
    }

    // Get the availability records
    const availabilityRecords = await this.prisma.availability.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' }
    });

    // Process the records to convert timeSlots from JSON string to array
    return availabilityRecords.map(record => ({
      ...record,
      timeSlots: JSON.parse(record.timeSlots as string),
      recurrenceType: record.recurrenceType as RecurrenceType,
    }));
  }

  /**
   * Updates an existing availability record
   * 
   * @param id - The ID of the availability record to update
   * @param updateData - The data to update
   * @returns The updated availability record
   * @throws ValidationError if the data is invalid or the record doesn't exist
   */
  async updateAvailability(id: string, updateData: IAvailabilityUpdate): Promise<IAvailability> {
    // Check if the availability record exists
    const existingAvailability = await this.prisma.availability.findUnique({
      where: { id }
    });

    if (!existingAvailability) {
      throw ValidationError.notFound(`Availability record with ID ${id} not found`);
    }

    // Validate time slots if provided
    if (updateData.timeSlots && updateData.timeSlots.length > 0) {
      for (const slot of updateData.timeSlots) {
        if (!slot.startTime) {
          throw ValidationError.requiredField('timeSlots[].startTime');
        }
        if (!slot.endTime) {
          throw ValidationError.requiredField('timeSlots[].endTime');
        }
        if (new Date(slot.startTime) >= new Date(slot.endTime)) {
          throw ValidationError.invalidInput('Start time must be before end time');
        }
        if (!Object.values(AvailabilityStatus).includes(slot.status)) {
          throw ValidationError.invalidEnum('timeSlots[].status', Object.values(AvailabilityStatus));
        }
      }
    }

    // If recurrence type is changed to something other than NONE, validate recurrenceEndDate
    if (updateData.recurrenceType && 
        updateData.recurrenceType !== RecurrenceType.NONE && 
        !updateData.recurrenceEndDate && 
        !existingAvailability.recurrenceEndDate) {
      throw ValidationError.requiredField('recurrenceEndDate');
    }

    // Prepare update data
    const updateObject: any = {};
    
    if (updateData.timeSlots) {
      updateObject.timeSlots = JSON.stringify(updateData.timeSlots);
    }
    
    if (updateData.recurrenceType) {
      updateObject.recurrenceType = updateData.recurrenceType;
    }
    
    if (updateData.recurrenceEndDate) {
      updateObject.recurrenceEndDate = updateData.recurrenceEndDate;
    }
    
    if (updateData.preferredDuration !== undefined) {
      updateObject.preferredDuration = updateData.preferredDuration;
    }
    
    if (updateData.notes !== undefined) {
      updateObject.notes = updateData.notes;
    }

    // Update the availability record
    const updatedAvailability = await this.prisma.availability.update({
      where: { id },
      data: updateObject
    });

    // Convert the stored JSON string back to an array
    const timeSlots = JSON.parse(updatedAvailability.timeSlots as string);

    return {
      ...updatedAvailability,
      timeSlots,
      recurrenceType: updatedAvailability.recurrenceType as RecurrenceType,
    };
  }

  /**
   * Deletes an availability record
   * 
   * @param id - The ID of the availability record to delete
   * @returns True if the availability record was deleted, false otherwise
   */
  async deleteAvailability(id: string): Promise<boolean> {
    try {
      await this.prisma.availability.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      // If the record doesn't exist, Prisma will throw an error
      if ((error as any).code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Creates multiple availability records in bulk
   * 
   * @param bulkData - Object containing arrays of availability data for multiple users
   * @returns Array of created availability records
   * @throws ValidationError if any of the data is invalid
   */
  async bulkCreateAvailability(bulkData: {
    eventId?: string;
    tribeId?: string;
    userAvailability: {
      userId: string;
      timeSlots: ITimeSlot[];
      recurrenceType?: RecurrenceType;
      recurrenceEndDate?: Date;
      preferredDuration?: number;
      notes?: string;
    }[];
  }): Promise<IAvailability[]> {
    // Validate required fields
    if (!bulkData.eventId && !bulkData.tribeId) {
      throw ValidationError.invalidInput('Either eventId or tribeId must be provided');
    }

    if (!bulkData.userAvailability || bulkData.userAvailability.length === 0) {
      throw ValidationError.requiredField('userAvailability');
    }

    const createdRecords: IAvailability[] = [];

    // Process each user's availability data
    for (const userData of bulkData.userAvailability) {
      try {
        const availabilityData: IAvailabilityCreate = {
          userId: userData.userId,
          eventId: bulkData.eventId,
          tribeId: bulkData.tribeId,
          timeSlots: userData.timeSlots,
          recurrenceType: userData.recurrenceType || RecurrenceType.NONE,
          recurrenceEndDate: userData.recurrenceEndDate,
          preferredDuration: userData.preferredDuration,
          notes: userData.notes
        };

        const record = await this.createAvailability(availabilityData);
        createdRecords.push(record);
      } catch (error) {
        // If there's an error creating one record, continue with the others
        // and include information about the failed record in the error
        throw new ValidationError(
          `Failed to create availability for user ${userData.userId}`,
          undefined,
          { failedUser: userData.userId, error }
        );
      }
    }

    return createdRecords;
  }
}

export default Availability;