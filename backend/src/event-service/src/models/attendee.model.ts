import { PrismaClient } from '@prisma/client'; // ^4.16.0
import { 
  IEventAttendee, 
  RSVPStatus, 
  PaymentStatus, 
  IRSVPUpdate,
  ICheckInUpdate
} from '../../../shared/src/types/event.types';
import { ICoordinates } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Model class for managing event attendee data in the Tribe platform.
 * Handles all attendee-related operations including RSVP management,
 * check-in tracking, and payment status updates for event participants.
 */
export class AttendeeModel {
  private prisma: PrismaClient;

  /**
   * Initializes a new instance of the AttendeeModel class
   */
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Retrieves all attendees for a specific event
   * 
   * @param eventId - The ID of the event
   * @param options - Additional filter options
   * @returns Promise resolving to an array of event attendees
   */
  async getAttendeesByEventId(
    eventId: string,
    options: {
      rsvpStatus?: RSVPStatus;
      hasCheckedIn?: boolean;
    } = {}
  ): Promise<IEventAttendee[]> {
    try {
      logger.debug(`Retrieving attendees for event: ${eventId}`, { eventId, options });
      
      // Build filter conditions
      const filter: any = {
        eventId
      };
      
      // Add optional filters if provided
      if (options.rsvpStatus) {
        filter.rsvpStatus = options.rsvpStatus;
      }
      
      if (options.hasCheckedIn !== undefined) {
        filter.hasCheckedIn = options.hasCheckedIn;
      }
      
      // Execute query
      const attendees = await this.prisma.eventAttendee.findMany({
        where: filter,
        orderBy: {
          rsvpTime: 'desc'
        }
      });
      
      logger.debug(`Found ${attendees.length} attendees for event: ${eventId}`);
      return attendees as IEventAttendee[];
    } catch (error) {
      logger.error(`Error retrieving attendees for event: ${eventId}`, error as Error);
      throw error;
    }
  }

  /**
   * Retrieves a specific attendee record by event and user IDs
   * 
   * @param eventId - The ID of the event
   * @param userId - The ID of the user
   * @returns Promise resolving to the attendee record if found, null otherwise
   */
  async getAttendeeByEventAndUser(
    eventId: string,
    userId: string
  ): Promise<IEventAttendee | null> {
    try {
      logger.debug(`Retrieving attendee record for event: ${eventId}, user: ${userId}`);
      
      const attendee = await this.prisma.eventAttendee.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId
          }
        }
      });
      
      return attendee as IEventAttendee | null;
    } catch (error) {
      logger.error(`Error retrieving attendee record for event: ${eventId}, user: ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Creates a new attendee record for an event
   * 
   * @param eventId - The ID of the event
   * @param userId - The ID of the user
   * @param rsvpStatus - The initial RSVP status
   * @returns Promise resolving to the created attendee record
   * @throws ApiError if attendee record already exists
   */
  async createAttendee(
    eventId: string,
    userId: string,
    rsvpStatus: RSVPStatus
  ): Promise<IEventAttendee> {
    try {
      logger.debug(`Creating attendee record for event: ${eventId}, user: ${userId}`);
      
      // Check if attendee record already exists
      const existingAttendee = await this.getAttendeeByEventAndUser(eventId, userId);
      if (existingAttendee) {
        logger.debug(`Attendee record already exists for event: ${eventId}, user: ${userId}`);
        throw ApiError.conflict(`Attendee record already exists for event: ${eventId}, user: ${userId}`);
      }
      
      // Create new attendee record
      const attendee = await this.prisma.eventAttendee.create({
        data: {
          eventId,
          userId,
          rsvpStatus,
          rsvpTime: new Date(),
          hasCheckedIn: false,
          paymentStatus: PaymentStatus.NOT_REQUIRED,
          paymentAmount: 0,
          paymentId: '',
          metadata: {}
        }
      });
      
      logger.info(`Created attendee record for event: ${eventId}, user: ${userId}`, { 
        attendeeId: attendee.id,
        rsvpStatus
      });
      
      return attendee as IEventAttendee;
    } catch (error) {
      logger.error(`Error creating attendee record for event: ${eventId}, user: ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Updates the RSVP status for an attendee
   * 
   * @param eventId - The ID of the event
   * @param userId - The ID of the user
   * @param status - The new RSVP status
   * @returns Promise resolving to the updated attendee record
   */
  async updateAttendeeRSVP(
    eventId: string,
    userId: string,
    status: RSVPStatus
  ): Promise<IEventAttendee> {
    try {
      logger.debug(`Updating RSVP status for event: ${eventId}, user: ${userId}`, { newStatus: status });
      
      // Check if attendee record exists
      const existingAttendee = await this.getAttendeeByEventAndUser(eventId, userId);
      
      // If record doesn't exist, create a new one
      if (!existingAttendee) {
        logger.debug(`No existing attendee record found, creating new one`);
        return this.createAttendee(eventId, userId, status);
      }
      
      // Update the existing record
      const updatedData: any = {
        rsvpStatus: status,
        rsvpTime: new Date()
      };
      
      // If status is NOT_GOING, reset check-in status
      if (status === RSVPStatus.NOT_GOING) {
        updatedData.hasCheckedIn = false;
        updatedData.checkedInAt = null;
      }
      
      const attendee = await this.prisma.eventAttendee.update({
        where: {
          eventId_userId: {
            eventId,
            userId
          }
        },
        data: updatedData
      });
      
      logger.info(`Updated RSVP status for event: ${eventId}, user: ${userId}`, { 
        attendeeId: attendee.id,
        rsvpStatus: status
      });
      
      return attendee as IEventAttendee;
    } catch (error) {
      logger.error(`Error updating RSVP status for event: ${eventId}, user: ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Updates the check-in status for an attendee
   * 
   * @param eventId - The ID of the event
   * @param userId - The ID of the user
   * @param hasCheckedIn - Whether the user has checked in
   * @param coordinates - Optional coordinates of the check-in location
   * @returns Promise resolving to the updated attendee record
   * @throws ApiError if attendee record doesn't exist or has invalid RSVP status
   */
  async updateAttendeeCheckIn(
    eventId: string,
    userId: string,
    hasCheckedIn: boolean,
    coordinates?: ICoordinates
  ): Promise<IEventAttendee> {
    try {
      logger.debug(`Updating check-in status for event: ${eventId}, user: ${userId}`, { hasCheckedIn });
      
      // Check if attendee record exists
      const existingAttendee = await this.getAttendeeByEventAndUser(eventId, userId);
      if (!existingAttendee) {
        logger.debug(`No attendee record found for event: ${eventId}, user: ${userId}`);
        throw ApiError.notFound(`Attendee record not found for event: ${eventId}, user: ${userId}`);
      }
      
      // Verify the attendee has a valid RSVP status for check-in
      if (hasCheckedIn && 
          existingAttendee.rsvpStatus !== RSVPStatus.GOING && 
          existingAttendee.rsvpStatus !== RSVPStatus.MAYBE) {
        logger.debug(`Invalid RSVP status for check-in: ${existingAttendee.rsvpStatus}`);
        throw ApiError.badRequest(`Cannot check in with RSVP status: ${existingAttendee.rsvpStatus}`);
      }
      
      // Prepare update data
      const updateData: any = {
        hasCheckedIn
      };
      
      // Set check-in time and location if checking in
      if (hasCheckedIn) {
        updateData.checkedInAt = new Date();
        
        // Store coordinates in metadata if provided
        if (coordinates) {
          updateData.metadata = {
            ...existingAttendee.metadata,
            checkInLocation: coordinates
          };
        }
      }
      
      // Update the record
      const attendee = await this.prisma.eventAttendee.update({
        where: {
          eventId_userId: {
            eventId,
            userId
          }
        },
        data: updateData
      });
      
      logger.info(`Updated check-in status for event: ${eventId}, user: ${userId}`, { 
        attendeeId: attendee.id,
        hasCheckedIn
      });
      
      return attendee as IEventAttendee;
    } catch (error) {
      logger.error(`Error updating check-in status for event: ${eventId}, user: ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Updates the payment status for an attendee
   * 
   * @param eventId - The ID of the event
   * @param userId - The ID of the user
   * @param paymentStatus - The new payment status
   * @param paymentAmount - The payment amount
   * @param paymentId - The payment transaction ID
   * @returns Promise resolving to the updated attendee record
   * @throws ApiError if attendee record doesn't exist
   */
  async updateAttendeePayment(
    eventId: string,
    userId: string,
    paymentStatus: PaymentStatus,
    paymentAmount: number,
    paymentId: string
  ): Promise<IEventAttendee> {
    try {
      logger.debug(`Updating payment status for event: ${eventId}, user: ${userId}`, { 
        paymentStatus, 
        paymentAmount,
        paymentId
      });
      
      // Check if attendee record exists
      const existingAttendee = await this.getAttendeeByEventAndUser(eventId, userId);
      if (!existingAttendee) {
        logger.debug(`No attendee record found for event: ${eventId}, user: ${userId}`);
        throw ApiError.notFound(`Attendee record not found for event: ${eventId}, user: ${userId}`);
      }
      
      // Update the payment information
      const attendee = await this.prisma.eventAttendee.update({
        where: {
          eventId_userId: {
            eventId,
            userId
          }
        },
        data: {
          paymentStatus,
          paymentAmount,
          paymentId,
          metadata: {
            ...existingAttendee.metadata,
            paymentUpdatedAt: new Date().toISOString()
          }
        }
      });
      
      logger.info(`Updated payment status for event: ${eventId}, user: ${userId}`, { 
        attendeeId: attendee.id,
        paymentStatus
      });
      
      return attendee as IEventAttendee;
    } catch (error) {
      logger.error(`Error updating payment status for event: ${eventId}, user: ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Deletes an attendee record
   * 
   * @param eventId - The ID of the event
   * @param userId - The ID of the user
   * @returns Promise resolving to true if the attendee was deleted, false otherwise
   */
  async deleteAttendee(
    eventId: string,
    userId: string
  ): Promise<boolean> {
    try {
      logger.debug(`Deleting attendee record for event: ${eventId}, user: ${userId}`);
      
      // Check if attendee record exists
      const existingAttendee = await this.getAttendeeByEventAndUser(eventId, userId);
      if (!existingAttendee) {
        logger.debug(`No attendee record found for event: ${eventId}, user: ${userId}`);
        return false;
      }
      
      // Delete the record
      await this.prisma.eventAttendee.delete({
        where: {
          eventId_userId: {
            eventId,
            userId
          }
        }
      });
      
      logger.info(`Deleted attendee record for event: ${eventId}, user: ${userId}`, { 
        attendeeId: existingAttendee.id
      });
      
      return true;
    } catch (error) {
      logger.error(`Error deleting attendee record for event: ${eventId}, user: ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Deletes all attendees for an event
   * 
   * @param eventId - The ID of the event
   * @returns Promise resolving to the number of attendees deleted
   */
  async deleteEventAttendees(
    eventId: string
  ): Promise<number> {
    try {
      logger.debug(`Deleting all attendee records for event: ${eventId}`);
      
      // Delete all attendee records for the event
      const result = await this.prisma.eventAttendee.deleteMany({
        where: {
          eventId
        }
      });
      
      logger.info(`Deleted ${result.count} attendee records for event: ${eventId}`);
      
      return result.count;
    } catch (error) {
      logger.error(`Error deleting attendee records for event: ${eventId}`, error as Error);
      throw error;
    }
  }

  /**
   * Gets attendance statistics for an event
   * 
   * @param eventId - The ID of the event
   * @returns Promise resolving to object containing attendance statistics
   */
  async getEventAttendanceStats(
    eventId: string
  ): Promise<object> {
    try {
      logger.debug(`Getting attendance statistics for event: ${eventId}`);
      
      // Get all attendees for the event to calculate stats
      const attendees = await this.getAttendeesByEventId(eventId);
      
      if (attendees.length === 0) {
        return {
          total: 0,
          going: 0,
          maybe: 0,
          notGoing: 0,
          noResponse: 0,
          checkedIn: 0,
          attendanceRate: 0,
          responseRate: 0
        };
      }
      
      // Count by RSVP status
      const going = attendees.filter(a => a.rsvpStatus === RSVPStatus.GOING).length;
      const maybe = attendees.filter(a => a.rsvpStatus === RSVPStatus.MAYBE).length;
      const notGoing = attendees.filter(a => a.rsvpStatus === RSVPStatus.NOT_GOING).length;
      const noResponse = attendees.filter(a => a.rsvpStatus === RSVPStatus.NO_RESPONSE).length;
      
      // Count checked-in attendees
      const checkedIn = attendees.filter(a => a.hasCheckedIn).length;
      
      // Calculate rates
      const attendanceRate = going > 0 ? (checkedIn / going) * 100 : 0;
      const responseRate = ((going + maybe + notGoing) / attendees.length) * 100;
      
      const stats = {
        total: attendees.length,
        going,
        maybe,
        notGoing,
        noResponse,
        checkedIn,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        responseRate: Math.round(responseRate * 100) / 100
      };
      
      logger.debug(`Attendance statistics for event: ${eventId}`, stats);
      
      return stats;
    } catch (error) {
      logger.error(`Error getting attendance statistics for event: ${eventId}`, error as Error);
      throw error;
    }
  }

  /**
   * Gets attendance history for a user
   * 
   * @param userId - The ID of the user
   * @param options - Optional filters including date range
   * @returns Promise resolving to object containing user attendance statistics
   */
  async getUserEventAttendance(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<object> {
    try {
      logger.debug(`Getting attendance history for user: ${userId}`, { options });
      
      // Build filter conditions
      const filter: any = {
        userId
      };
      
      // Add date range filters if provided
      if (options.startDate || options.endDate) {
        filter.event = {
          startTime: {}
        };
        
        if (options.startDate) {
          filter.event.startTime.gte = options.startDate;
        }
        
        if (options.endDate) {
          filter.event.startTime.lte = options.endDate;
        }
      }
      
      // Query for user's event attendances with join to event
      const attendances = await this.prisma.eventAttendee.findMany({
        where: filter,
        include: {
          event: true
        },
        orderBy: {
          event: {
            startTime: 'desc'
          }
        }
      });
      
      // Calculate statistics
      const total = attendances.length;
      
      if (total === 0) {
        return {
          total: 0,
          going: 0,
          maybe: 0,
          notGoing: 0,
          noResponse: 0,
          checkedIn: 0,
          attendanceRate: 0,
          responseRate: 0,
          events: []
        };
      }
      
      // Count by RSVP status
      const going = attendances.filter(a => a.rsvpStatus === RSVPStatus.GOING).length;
      const maybe = attendances.filter(a => a.rsvpStatus === RSVPStatus.MAYBE).length;
      const notGoing = attendances.filter(a => a.rsvpStatus === RSVPStatus.NOT_GOING).length;
      const noResponse = attendances.filter(a => a.rsvpStatus === RSVPStatus.NO_RESPONSE).length;
      
      // Count checked-in events
      const checkedIn = attendances.filter(a => a.hasCheckedIn).length;
      
      // Calculate rates
      const attendanceRate = going > 0 ? (checkedIn / going) * 100 : 0;
      const responseRate = ((going + maybe + notGoing) / total) * 100;
      
      const stats = {
        total,
        going,
        maybe,
        notGoing,
        noResponse,
        checkedIn,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        responseRate: Math.round(responseRate * 100) / 100,
        // Include the list of events for potential UI display
        events: attendances.map(a => ({
          eventId: a.eventId,
          eventName: a.event.name,
          startTime: a.event.startTime,
          rsvpStatus: a.rsvpStatus,
          hasCheckedIn: a.hasCheckedIn
        }))
      };
      
      logger.debug(`Attendance history for user: ${userId}`, {
        totalEvents: total,
        checkedInEvents: checkedIn
      });
      
      return stats;
    } catch (error) {
      logger.error(`Error getting attendance history for user: ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Calculates a user's attendance streak
   * 
   * @param userId - The ID of the user
   * @returns Promise resolving to current streak count
   */
  async getAttendanceStreak(
    userId: string
  ): Promise<number> {
    try {
      logger.debug(`Calculating attendance streak for user: ${userId}`);
      
      // Get all events the user has checked into, ordered by date
      const checkedInEvents = await this.prisma.eventAttendee.findMany({
        where: {
          userId,
          hasCheckedIn: true
        },
        include: {
          event: true
        },
        orderBy: {
          event: {
            startTime: 'desc'
          }
        }
      });
      
      if (checkedInEvents.length === 0) {
        return 0;
      }
      
      // Calculate streak by checking for consecutive events
      let streak = 1;
      const now = new Date();
      let lastEventDate = new Date(checkedInEvents[0].event.startTime);
      
      // If the most recent event was more than 30 days ago, streak is broken
      const daysSinceLastEvent = Math.floor((now.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastEvent > 30) {
        return 0;
      }
      
      // Check for consecutive monthly attendance
      for (let i = 1; i < checkedInEvents.length; i++) {
        const currentEventDate = new Date(checkedInEvents[i].event.startTime);
        const daysBetweenEvents = Math.floor((lastEventDate.getTime() - currentEventDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // If events are within 30 days of each other, continue streak
        if (daysBetweenEvents <= 30) {
          streak++;
          lastEventDate = currentEventDate;
        } else {
          break;
        }
      }
      
      logger.debug(`Attendance streak for user ${userId}: ${streak}`);
      
      return streak;
    } catch (error) {
      logger.error(`Error calculating attendance streak for user: ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Updates multiple attendee records at once
   * 
   * @param eventId - The ID of the event
   * @param updates - Array of attendee updates
   * @returns Promise resolving to number of attendees updated
   */
  async bulkUpdateAttendees(
    eventId: string,
    updates: Array<{
      userId: string;
      rsvpStatus?: RSVPStatus;
      hasCheckedIn?: boolean;
      paymentStatus?: PaymentStatus;
      paymentAmount?: number;
      paymentId?: string;
    }>
  ): Promise<number> {
    try {
      logger.debug(`Bulk updating attendees for event: ${eventId}`, {
        updateCount: updates.length
      });
      
      if (!updates || updates.length === 0) {
        return 0;
      }
      
      // Use a transaction to ensure all updates succeed or fail together
      let updatedCount = 0;
      
      await this.prisma.$transaction(async (prisma) => {
        for (const update of updates) {
          // Check if attendee exists
          const existingAttendee = await prisma.eventAttendee.findUnique({
            where: {
              eventId_userId: {
                eventId,
                userId: update.userId
              }
            }
          });
          
          const updateData: any = {};
          
          // Set fields that are provided in the update
          if (update.rsvpStatus) {
            updateData.rsvpStatus = update.rsvpStatus;
            updateData.rsvpTime = new Date();
          }
          
          if (update.hasCheckedIn !== undefined) {
            updateData.hasCheckedIn = update.hasCheckedIn;
            if (update.hasCheckedIn) {
              updateData.checkedInAt = new Date();
            }
          }
          
          if (update.paymentStatus) {
            updateData.paymentStatus = update.paymentStatus;
          }
          
          if (update.paymentAmount !== undefined) {
            updateData.paymentAmount = update.paymentAmount;
          }
          
          if (update.paymentId) {
            updateData.paymentId = update.paymentId;
          }
          
          // Create or update the attendee record
          if (existingAttendee) {
            await prisma.eventAttendee.update({
              where: {
                eventId_userId: {
                  eventId,
                  userId: update.userId
                }
              },
              data: updateData
            });
          } else if (update.rsvpStatus) {
            // Only create a new record if rsvpStatus is provided
            await prisma.eventAttendee.create({
              data: {
                eventId,
                userId: update.userId,
                rsvpStatus: update.rsvpStatus,
                rsvpTime: new Date(),
                hasCheckedIn: update.hasCheckedIn || false,
                paymentStatus: update.paymentStatus || PaymentStatus.NOT_REQUIRED,
                paymentAmount: update.paymentAmount || 0,
                paymentId: update.paymentId || '',
                metadata: {}
              }
            });
          }
          
          updatedCount++;
        }
      });
      
      logger.info(`Bulk updated ${updatedCount} attendees for event: ${eventId}`);
      
      return updatedCount;
    } catch (error) {
      logger.error(`Error bulk updating attendees for event: ${eventId}`, error as Error);
      throw error;
    }
  }
}