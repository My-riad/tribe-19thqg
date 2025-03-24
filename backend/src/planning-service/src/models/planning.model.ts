import { PrismaClient } from '@prisma/client'; // ^4.16.0
import { AIOrchestrationClient } from '@tribe/ai-orchestration-client'; // ^1.0.0
import { ValidationError } from '../../../shared/src/errors/validation.error';
import { ApiError } from '../../../shared/src/errors/api.error';
import { IVenue } from '../../../shared/src/types/event.types';
import { ICoordinates } from '../../../shared/src/types/profile.types';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Defines the possible states of a planning session
 */
export enum PlanningStatus {
  DRAFT = 'DRAFT',
  COLLECTING_AVAILABILITY = 'COLLECTING_AVAILABILITY',
  SUGGESTING_TIMES = 'SUGGESTING_TIMES',
  SUGGESTING_VENUES = 'SUGGESTING_VENUES',
  VOTING = 'VOTING',
  FINALIZED = 'FINALIZED',
  CANCELLED = 'CANCELLED'
}

/**
 * Defines the types of votes that can be cast during planning
 */
export enum VoteType {
  TIME_SLOT = 'TIME_SLOT',
  VENUE = 'VENUE'
}

/**
 * Defines the structure of an optimal time slot suggestion
 */
export interface IOptimalTimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  attendanceScore: number;
  attendeeCount: number;
  totalAttendees: number;
  attendancePercentage: number;
  votes: string[]; // Array of user IDs who voted for this time slot
  aiRecommended: boolean;
  recommendationReason: string;
}

/**
 * Defines the structure of a venue suggestion with suitability scores
 */
export interface IVenueSuggestion {
  id: string;
  venue: IVenue;
  distanceScore: number;
  capacityScore: number;
  budgetScore: number;
  accessibilityScore: number;
  overallScore: number;
  votes: string[];
  aiRecommended: boolean;
  recommendationReason: string;
}

/**
 * Defines the structure of a finalized event plan
 */
export interface IEventPlan {
  id: string;
  eventId: string;
  planningSessionId: string;
  selectedTimeSlot: IOptimalTimeSlot;
  selectedVenue: IVenueSuggestion;
  reminderSchedule: IReminderSchedule;
  finalizedBy: string;
  finalizedAt: Date;
  notes: string;
}

/**
 * Defines the structure of an event reminder schedule
 */
export interface IReminderSchedule {
  id: string;
  eventId: string;
  reminders: IReminder[];
}

/**
 * Defines the structure of an individual reminder
 */
export interface IReminder {
  id: string;
  type: string;
  scheduledTime: Date;
  sent: boolean;
  sentAt: Date;
}

/**
 * Defines the structure of voting results for time slots and venues
 */
export interface IVotingResults {
  timeSlots: Array<{ timeSlot: IOptimalTimeSlot, voteCount: number, voters: string[] }>;
  venues: Array<{ venue: IVenueSuggestion, voteCount: number, voters: string[] }>;
  leadingTimeSlot: { timeSlot: IOptimalTimeSlot, voteCount: number };
  leadingVenue: { venue: IVenueSuggestion, voteCount: number };
  totalVoters: number;
  votingDeadline: Date;
  timeRemaining: number;
}

/**
 * Defines the structure of an AI-generated plan suggestion
 */
export interface IAutoSuggestedPlan {
  timeSlot: IOptimalTimeSlot;
  venue: IVenueSuggestion;
  reasoning: string;
  attendanceEstimate: number;
  confidenceScore: number;
}

/**
 * Defines the structure of a planning session
 */
export interface IPlanningSession {
  id: string;
  eventId: string;
  tribeId: string;
  createdBy: string;
  status: PlanningStatus;
  availabilityDeadline: Date;
  votingDeadline: Date;
  suggestedTimeSlots: IOptimalTimeSlot[];
  suggestedVenues: IVenueSuggestion[];
  eventPlan: IEventPlan;
  preferences: IPlanningPreferences;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Defines the data required to create a new planning session
 */
export interface IPlanningSessionCreate {
  eventId: string;
  tribeId: string;
  createdBy: string;
  availabilityDeadline: Date;
  preferences: IPlanningPreferences;
}

/**
 * Defines the data that can be updated for an existing planning session
 */
export interface IPlanningSessionUpdate {
  status?: PlanningStatus;
  availabilityDeadline?: Date;
  votingDeadline?: Date;
  preferences?: IPlanningPreferences;
}

/**
 * Defines the planning preferences for event scheduling and venue selection
 */
export interface IPlanningPreferences {
  durationMinutes: number;
  preferredDays: number[];
  preferredTimeRanges: Array<{ start: string, end: string }>;
  preferredLocation: ICoordinates;
  maxDistance: number;
  budgetRange: { min: number, max: number };
  venueTypes: string[];
  accessibilityRequirements: string[];
  prioritizeAttendance: boolean;
}

/**
 * Defines the data required to finalize an event plan
 */
export interface IEventPlanFinalize {
  timeSlotId: string;
  venueId: string;
  finalizedBy: string;
  notes: string;
}

/**
 * Model class for managing planning session data and operations
 */
export class PlanningModel {
  private prisma: PrismaClient;
  private aiClient: AIOrchestrationClient;

  /**
   * Initializes a new instance of the PlanningModel class
   */
  constructor() {
    this.prisma = new PrismaClient();
    this.aiClient = new AIOrchestrationClient();
  }

  /**
   * Creates a new planning session for an event
   * 
   * @param sessionData - The planning session data
   * @returns The created planning session
   */
  async createPlanningSession(sessionData: IPlanningSessionCreate): Promise<IPlanningSession> {
    // Validate the planning session data
    if (!sessionData.eventId) {
      throw ValidationError.requiredField('eventId');
    }
    if (!sessionData.tribeId) {
      throw ValidationError.requiredField('tribeId');
    }
    if (!sessionData.createdBy) {
      throw ValidationError.requiredField('createdBy');
    }

    // Check if a planning session already exists for the event
    const existingSession = await this.getPlanningSessionByEventId(sessionData.eventId);
    if (existingSession) {
      throw ApiError.badRequest(`A planning session already exists for event ${sessionData.eventId}`);
    }

    try {
      logger.info(`Creating planning session for event ${sessionData.eventId}`, { 
        tribeId: sessionData.tribeId, 
        createdBy: sessionData.createdBy 
      });

      // Create a new planning session in the database
      const planningSession = await this.prisma.planningSession.create({
        data: {
          eventId: sessionData.eventId,
          tribeId: sessionData.tribeId,
          createdBy: sessionData.createdBy,
          status: PlanningStatus.DRAFT,
          availabilityDeadline: sessionData.availabilityDeadline,
          preferences: sessionData.preferences,
          suggestedTimeSlots: [],
          suggestedVenues: []
        }
      });

      return planningSession as IPlanningSession;
    } catch (error) {
      logger.error(`Failed to create planning session`, error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Retrieves a planning session by its ID
   * 
   * @param id - The planning session ID
   * @returns The planning session if found, null otherwise
   */
  async getPlanningSessionById(id: string): Promise<IPlanningSession | null> {
    try {
      const planningSession = await this.prisma.planningSession.findUnique({
        where: { id }
      });

      return planningSession as IPlanningSession;
    } catch (error) {
      logger.error(`Failed to get planning session by ID ${id}`, error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Retrieves a planning session by its associated event ID
   * 
   * @param eventId - The event ID
   * @returns The planning session if found, null otherwise
   */
  async getPlanningSessionByEventId(eventId: string): Promise<IPlanningSession | null> {
    try {
      const planningSession = await this.prisma.planningSession.findFirst({
        where: { eventId }
      });

      return planningSession as IPlanningSession;
    } catch (error) {
      logger.error(`Failed to get planning session by event ID ${eventId}`, error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Updates an existing planning session
   * 
   * @param id - The planning session ID
   * @param updateData - The data to update
   * @returns The updated planning session
   */
  async updatePlanningSession(id: string, updateData: IPlanningSessionUpdate): Promise<IPlanningSession> {
    try {
      // Check if the planning session exists
      const existingSession = await this.getPlanningSessionById(id);
      if (!existingSession) {
        throw ApiError.notFound(`Planning session not found with ID ${id}`);
      }

      logger.info(`Updating planning session ${id}`, { updateData });

      // Update the planning session in the database
      const planningSession = await this.prisma.planningSession.update({
        where: { id },
        data: updateData
      });

      return planningSession as IPlanningSession;
    } catch (error) {
      logger.error(`Failed to update planning session ${id}`, error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Deletes a planning session
   * 
   * @param id - The planning session ID
   * @returns True if the planning session was deleted
   */
  async deletePlanningSession(id: string): Promise<boolean> {
    try {
      // Check if the planning session exists
      const existingSession = await this.getPlanningSessionById(id);
      if (!existingSession) {
        throw ApiError.notFound(`Planning session not found with ID ${id}`);
      }

      logger.info(`Deleting planning session ${id}`);

      // Delete the planning session from the database
      await this.prisma.planningSession.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      logger.error(`Failed to delete planning session ${id}`, error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Finds optimal time slots based on collected availability data
   * 
   * @param planningSessionId - The planning session ID
   * @param options - Options for finding optimal time slots
   * @returns Array of optimal time slots
   */
  async findOptimalTimeSlots(planningSessionId: string, options: any = {}): Promise<IOptimalTimeSlot[]> {
    try {
      // Retrieve the planning session
      const planningSession = await this.getPlanningSessionById(planningSessionId);
      if (!planningSession) {
        throw ApiError.notFound(`Planning session not found with ID ${planningSessionId}`);
      }

      logger.info(`Finding optimal time slots for planning session ${planningSessionId}`);

      // Get all availability data for the event
      const availabilityData = await this.prisma.availability.findMany({
        where: { eventId: planningSession.eventId }
      });

      if (availabilityData.length === 0) {
        throw ApiError.badRequest('No availability data found for this planning session');
      }

      // Prepare the availability data for the algorithm
      const formattedAvailability = availabilityData.map(availability => ({
        userId: availability.userId,
        availableTimes: availability.availableTimes
      }));

      // Use internal algorithm to find optimal time slots
      const candidateSlots = this.findOptimalTimeSlotsAlgorithm(
        formattedAvailability,
        {
          durationMinutes: planningSession.preferences.durationMinutes,
          preferredDays: planningSession.preferences.preferredDays,
          preferredTimeRanges: planningSession.preferences.preferredTimeRanges
        }
      );

      // Calculate attendance metrics for each time slot
      const optimalTimeSlots: IOptimalTimeSlot[] = candidateSlots.map((slot, index) => {
        const metrics = this.calculateAttendanceMetrics(slot, availabilityData.length);
        return {
          id: `ts-${index + 1}`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          attendanceScore: metrics.attendanceScore,
          attendeeCount: metrics.attendeeCount,
          totalAttendees: availabilityData.length,
          attendancePercentage: metrics.attendancePercentage,
          votes: [],
          aiRecommended: false,
          recommendationReason: ''
        };
      });

      // Use AI to enhance time slot suggestions with AI insights
      const enhancedTimeSlots = await this.aiClient.enhanceTimeSlotSuggestions(
        optimalTimeSlots,
        availabilityData,
        planningSession.preferences
      );

      // Update the planning session with the suggested time slots
      await this.updatePlanningSession(planningSessionId, {
        status: PlanningStatus.SUGGESTING_TIMES,
        suggestedTimeSlots: enhancedTimeSlots
      });

      return enhancedTimeSlots;
    } catch (error) {
      logger.error(`Failed to find optimal time slots for planning session ${planningSessionId}`, error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Internal algorithm to find optimal time slots based on availability data
   * 
   * @param availabilityData - Array of user availability data
   * @param options - Options for finding optimal time slots
   * @returns Candidate time slots with attendee information
   */
  private findOptimalTimeSlotsAlgorithm(
    availabilityData: Array<{ userId: string, availableTimes: Array<{ start: Date, end: Date }> }>,
    options: any
  ): Array<{ startTime: Date, endTime: Date, attendees: string[] }> {
    logger.debug('Running optimal time slot algorithm', { 
      userCount: availabilityData.length,
      options 
    });

    // Extract options
    const { durationMinutes, preferredDays, preferredTimeRanges } = options;
    const minDurationMs = durationMinutes * 60 * 1000;

    // Collect all time ranges
    const allTimeRanges: Array<{
      start: Date;
      end: Date;
      userId: string;
    }> = [];

    availabilityData.forEach(userData => {
      userData.availableTimes.forEach(timeRange => {
        allTimeRanges.push({
          start: new Date(timeRange.start),
          end: new Date(timeRange.end),
          userId: userData.userId
        });
      });
    });

    // Sort by start time
    allTimeRanges.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Find overlapping time periods
    const overlappingPeriods: Array<{
      startTime: Date;
      endTime: Date;
      attendees: string[];
    }> = [];

    for (let i = 0; i < allTimeRanges.length; i++) {
      const currentRange = allTimeRanges[i];
      const attendees = [currentRange.userId];
      
      let latestEnd = currentRange.end;
      
      // Look for overlapping time ranges
      for (let j = 0; j < allTimeRanges.length; j++) {
        if (i === j) continue;
        
        const compareRange = allTimeRanges[j];
        
        // Check if the ranges overlap
        if (compareRange.start <= latestEnd && compareRange.end >= currentRange.start) {
          // Calculate the overlapping period
          const overlapStart = new Date(Math.max(currentRange.start.getTime(), compareRange.start.getTime()));
          const overlapEnd = new Date(Math.min(latestEnd.getTime(), compareRange.end.getTime()));
          
          // Check if the overlap is long enough
          if (overlapEnd.getTime() - overlapStart.getTime() >= minDurationMs) {
            if (!attendees.includes(compareRange.userId)) {
              attendees.push(compareRange.userId);
            }
            
            // Update the latest end time if this range extends further
            if (compareRange.end > latestEnd) {
              latestEnd = compareRange.end;
            }
          }
        }
      }
      
      // If we have a valid overlap with at least 2 attendees
      if (attendees.length >= 2 && latestEnd.getTime() - currentRange.start.getTime() >= minDurationMs) {
        overlappingPeriods.push({
          startTime: currentRange.start,
          endTime: latestEnd,
          attendees
        });
      }
    }

    // Further filter by preferred days if specified
    let filteredPeriods = overlappingPeriods;
    
    if (preferredDays && preferredDays.length > 0) {
      filteredPeriods = filteredPeriods.filter(period => {
        const day = period.startTime.getDay();
        return preferredDays.includes(day);
      });
    }

    // Further filter by preferred time ranges if specified
    if (preferredTimeRanges && preferredTimeRanges.length > 0) {
      filteredPeriods = filteredPeriods.filter(period => {
        const startHour = period.startTime.getHours();
        const startMinute = period.startTime.getMinutes();
        const startTimeValue = startHour * 60 + startMinute;
        
        // Check if this period starts within any preferred time range
        return preferredTimeRanges.some(range => {
          const [rangeStartHour, rangeStartMinute] = range.start.split(':').map(Number);
          const [rangeEndHour, rangeEndMinute] = range.end.split(':').map(Number);
          
          const rangeStartValue = rangeStartHour * 60 + rangeStartMinute;
          const rangeEndValue = rangeEndHour * 60 + rangeEndMinute;
          
          return startTimeValue >= rangeStartValue && startTimeValue <= rangeEndValue;
        });
      });
    }

    // Sort by number of attendees (descending) and then by start time
    filteredPeriods.sort((a, b) => {
      // First compare by number of attendees (descending)
      if (b.attendees.length !== a.attendees.length) {
        return b.attendees.length - a.attendees.length;
      }
      
      // If same number of attendees, sort by start time
      return a.startTime.getTime() - b.startTime.getTime();
    });

    // Return top candidates (limited to 5)
    return filteredPeriods.slice(0, 5);
  }

  /**
   * Calculates attendance metrics for a time slot
   * 
   * @param timeSlot - The time slot to calculate metrics for
   * @param totalMembers - The total number of members
   * @returns Attendance metrics including attendance score, percentage, and count
   */
  private calculateAttendanceMetrics(
    timeSlot: { attendees: string[] },
    totalMembers: number
  ): { attendanceScore: number, attendancePercentage: number, attendeeCount: number } {
    const attendeeCount = timeSlot.attendees.length;
    const attendancePercentage = Math.round((attendeeCount / totalMembers) * 100);
    
    // Calculate an attendance score that considers both raw numbers and percentages
    // This formula gives more weight to higher percentages while still valuing absolute numbers
    const attendanceScore = Math.round(
      (0.7 * attendancePercentage) + (0.3 * (attendeeCount / 8) * 100)
    );
    
    return {
      attendanceScore,
      attendancePercentage,
      attendeeCount
    };
  }

  /**
   * Suggests venues based on event requirements and preferences
   * 
   * @param planningSessionId - The planning session ID
   * @param options - Options for venue suggestions
   * @returns Array of venue suggestions
   */
  async suggestVenues(planningSessionId: string, options: any = {}): Promise<IVenueSuggestion[]> {
    try {
      // Retrieve the planning session
      const planningSession = await this.getPlanningSessionById(planningSessionId);
      if (!planningSession) {
        throw ApiError.notFound(`Planning session not found with ID ${planningSessionId}`);
      }

      logger.info(`Finding venue suggestions for planning session ${planningSessionId}`);

      // Get event details and attendee locations
      const event = await this.prisma.event.findUnique({
        where: { id: planningSession.eventId }
      });

      if (!event) {
        throw ApiError.notFound(`Event not found with ID ${planningSession.eventId}`);
      }

      // Get member locations from their profiles
      const tribeMembers = await this.prisma.tribeMembership.findMany({
        where: { tribeId: planningSession.tribeId },
        include: { user: { include: { profile: true } } }
      });

      // Calculate central location based on member locations
      const membersWithCoordinates = tribeMembers.filter(
        member => member.user.profile && member.user.profile.coordinates
      );

      let centralLocation: ICoordinates;
      
      if (membersWithCoordinates.length > 0) {
        // Calculate average latitude and longitude
        const totalLat = membersWithCoordinates.reduce(
          (sum, member) => sum + member.user.profile.coordinates.latitude, 0
        );
        const totalLng = membersWithCoordinates.reduce(
          (sum, member) => sum + member.user.profile.coordinates.longitude, 0
        );
        
        centralLocation = {
          latitude: totalLat / membersWithCoordinates.length,
          longitude: totalLng / membersWithCoordinates.length
        };
      } else {
        // Fall back to preferred location from preferences
        centralLocation = planningSession.preferences.preferredLocation;
      }

      // Query venue database for suitable venues
      const venues = await this.prisma.venue.findMany({
        where: {
          // Use geospatial query to find venues within the max distance
          // This is simplified here - would use proper geospatial query in actual implementation
          AND: [
            // Apply venue type filter if specified
            planningSession.preferences.venueTypes.length > 0 ? {
              categories: {
                hasSome: planningSession.preferences.venueTypes
              }
            } : {},
            
            // Apply budget range filter
            {
              priceLevel: {
                lte: Math.ceil(planningSession.preferences.budgetRange.max / 25) // Rough conversion to price level
              }
            }
          ]
        }
      });

      // Calculate suitability scores for each venue
      const venueSuggestions: IVenueSuggestion[] = venues.map((venue, index) => {
        // Calculate distance score (higher score for venues closer to central location)
        const distance = this.calculateDistance(
          centralLocation,
          venue.coordinates as ICoordinates
        );
        const distanceScore = Math.max(0, 100 - (distance / planningSession.preferences.maxDistance * 100));
        
        // Calculate capacity score (higher score for venues with appropriate capacity)
        const expectedAttendees = tribeMembers.length;
        const capacityDifference = Math.abs(venue.capacity - expectedAttendees);
        const capacityScore = Math.max(0, 100 - (capacityDifference / expectedAttendees * 100));
        
        // Calculate budget score (higher score for venues within budget range)
        const budgetMiddle = (planningSession.preferences.budgetRange.min + planningSession.preferences.budgetRange.max) / 2;
        const estimatedCost = venue.priceLevel * 25; // Rough conversion from price level
        const budgetDifference = Math.abs(estimatedCost - budgetMiddle);
        const budgetScore = Math.max(0, 100 - (budgetDifference / budgetMiddle * 100));
        
        // Calculate accessibility score (placeholder - would use actual accessibility data)
        const accessibilityScore = planningSession.preferences.accessibilityRequirements.length > 0 ? 
          (venue.accessibility ? 100 : 0) : 100;
        
        // Calculate overall score with weighted components
        const overallScore = (
          (0.3 * distanceScore) +
          (0.3 * capacityScore) +
          (0.3 * budgetScore) +
          (0.1 * accessibilityScore)
        );
        
        return {
          id: `vs-${index + 1}`,
          venue: venue as IVenue,
          distanceScore,
          capacityScore,
          budgetScore,
          accessibilityScore,
          overallScore,
          votes: [],
          aiRecommended: false,
          recommendationReason: ''
        };
      });

      // Sort venues by overall score
      venueSuggestions.sort((a, b) => b.overallScore - a.overallScore);

      // Use AI to enhance venue suggestions
      const enhancedVenueSuggestions = await this.aiClient.enhanceVenueSuggestions(
        venueSuggestions.slice(0, 5), // Top 5 venues
        tribeMembers,
        planningSession.preferences
      );

      // Update the planning session with the suggested venues
      await this.updatePlanningSession(planningSessionId, {
        status: PlanningStatus.SUGGESTING_VENUES,
        suggestedVenues: enhancedVenueSuggestions
      });

      return enhancedVenueSuggestions;
    } catch (error) {
      logger.error(`Failed to find venue suggestions for planning session ${planningSessionId}`, error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Calculates distance between two coordinates in miles using Haversine formula
   * 
   * @param coord1 - First coordinate
   * @param coord2 - Second coordinate
   * @returns Distance in miles
   */
  private calculateDistance(coord1: ICoordinates, coord2: ICoordinates): number {
    // Haversine formula for calculating distance between two points on a sphere
    const R = 3958.8; // Earth's radius in miles
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Converts degrees to radians
   * 
   * @param degrees - Angle in degrees
   * @returns Angle in radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  /**
   * Records a user's vote for a time slot or venue
   * 
   * @param planningSessionId - The planning session ID
   * @param itemId - The ID of the time slot or venue
   * @param userId - The ID of the user casting the vote
   * @param voteType - The type of vote (time slot or venue)
   * @returns The updated planning session
   */
  async recordVote(
    planningSessionId: string,
    itemId: string,
    userId: string,
    voteType: VoteType
  ): Promise<IPlanningSession> {
    try {
      // Retrieve the planning session
      const planningSession = await this.getPlanningSessionById(planningSessionId);
      if (!planningSession) {
        throw ApiError.notFound(`Planning session not found with ID ${planningSessionId}`);
      }

      if (planningSession.status !== PlanningStatus.VOTING) {
        await this.updatePlanningSession(planningSessionId, {
          status: PlanningStatus.VOTING
        });
      }

      logger.info(`Recording vote for planning session ${planningSessionId}`, {
        userId,
        itemId,
        voteType
      });

      // Deep clone the planning session to avoid direct mutations
      const updatedSession = JSON.parse(JSON.stringify(planningSession));

      if (voteType === VoteType.TIME_SLOT) {
        // Find the time slot
        const timeSlotIndex = updatedSession.suggestedTimeSlots.findIndex(
          (slot: IOptimalTimeSlot) => slot.id === itemId
        );
        
        if (timeSlotIndex === -1) {
          throw ApiError.notFound(`Time slot not found with ID ${itemId}`);
        }
        
        // Remove the user's vote from any previously voted time slots
        updatedSession.suggestedTimeSlots.forEach((slot: IOptimalTimeSlot, index: number) => {
          if (index !== timeSlotIndex && slot.votes.includes(userId)) {
            slot.votes = slot.votes.filter((id: string) => id !== userId);
          }
        });
        
        // Add the user's vote to the selected time slot if not already voted
        if (!updatedSession.suggestedTimeSlots[timeSlotIndex].votes.includes(userId)) {
          updatedSession.suggestedTimeSlots[timeSlotIndex].votes.push(userId);
        }
      } else if (voteType === VoteType.VENUE) {
        // Find the venue
        const venueIndex = updatedSession.suggestedVenues.findIndex(
          (venue: IVenueSuggestion) => venue.id === itemId
        );
        
        if (venueIndex === -1) {
          throw ApiError.notFound(`Venue not found with ID ${itemId}`);
        }
        
        // Remove the user's vote from any previously voted venues
        updatedSession.suggestedVenues.forEach((venue: IVenueSuggestion, index: number) => {
          if (index !== venueIndex && venue.votes.includes(userId)) {
            venue.votes = venue.votes.filter((id: string) => id !== userId);
          }
        });
        
        // Add the user's vote to the selected venue if not already voted
        if (!updatedSession.suggestedVenues[venueIndex].votes.includes(userId)) {
          updatedSession.suggestedVenues[venueIndex].votes.push(userId);
        }
      } else {
        throw ApiError.badRequest(`Invalid vote type: ${voteType}`);
      }

      // Update the planning session with the new vote counts
      return await this.updatePlanningSession(planningSessionId, {
        suggestedTimeSlots: updatedSession.suggestedTimeSlots,
        suggestedVenues: updatedSession.suggestedVenues
      });
    } catch (error) {
      logger.error(`Failed to record vote for planning session ${planningSessionId}`, error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Finalizes the event plan with selected time and venue
   * 
   * @param planningSessionId - The planning session ID
   * @param finalizeData - The data for finalizing the event plan
   * @returns The finalized event plan
   */
  async finalizeEventPlan(
    planningSessionId: string,
    finalizeData: IEventPlanFinalize
  ): Promise<IEventPlan> {
    try {
      // Validate the finalize data
      if (!finalizeData.timeSlotId) {
        throw ValidationError.requiredField('timeSlotId');
      }
      if (!finalizeData.venueId) {
        throw ValidationError.requiredField('venueId');
      }
      if (!finalizeData.finalizedBy) {
        throw ValidationError.requiredField('finalizedBy');
      }

      // Retrieve the planning session
      const planningSession = await this.getPlanningSessionById(planningSessionId);
      if (!planningSession) {
        throw ApiError.notFound(`Planning session not found with ID ${planningSessionId}`);
      }

      logger.info(`Finalizing event plan for planning session ${planningSessionId}`, { finalizeData });

      // Find the selected time slot
      const selectedTimeSlot = planningSession.suggestedTimeSlots.find(
        slot => slot.id === finalizeData.timeSlotId
      );
      
      if (!selectedTimeSlot) {
        throw ApiError.notFound(`Time slot not found with ID ${finalizeData.timeSlotId}`);
      }
      
      // Find the selected venue
      const selectedVenue = planningSession.suggestedVenues.find(
        venue => venue.id === finalizeData.venueId
      );
      
      if (!selectedVenue) {
        throw ApiError.notFound(`Venue not found with ID ${finalizeData.venueId}`);
      }

      // Generate reminder schedule
      const reminderSchedule = await this.generateReminderSchedule(
        planningSession.eventId,
        selectedTimeSlot.startTime
      );

      // Create the event plan
      const eventPlan: IEventPlan = {
        id: `plan-${planningSessionId}`,
        eventId: planningSession.eventId,
        planningSessionId: planningSessionId,
        selectedTimeSlot,
        selectedVenue,
        reminderSchedule,
        finalizedBy: finalizeData.finalizedBy,
        finalizedAt: new Date(),
        notes: finalizeData.notes || ''
      };

      // Update the event with the finalized details
      await this.prisma.event.update({
        where: { id: planningSession.eventId },
        data: {
          startTime: selectedTimeSlot.startTime,
          endTime: selectedTimeSlot.endTime,
          location: selectedVenue.venue.address,
          coordinates: selectedVenue.venue.coordinates,
          venueId: selectedVenue.venue.id,
          status: 'SCHEDULED' // Update the event status to scheduled
        }
      });

      // Update the planning session with the event plan and status
      await this.updatePlanningSession(planningSessionId, {
        status: PlanningStatus.FINALIZED,
        eventPlan
      });

      return eventPlan;
    } catch (error) {
      logger.error(`Failed to finalize event plan for planning session ${planningSessionId}`, error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Retrieves the event plan for a specific event
   * 
   * @param eventId - The event ID
   * @returns The event plan if found, null otherwise
   */
  async getEventPlan(eventId: string): Promise<IEventPlan | null> {
    try {
      // Retrieve the planning session for the event
      const planningSession = await this.getPlanningSessionByEventId(eventId);
      if (!planningSession || planningSession.status !== PlanningStatus.FINALIZED) {
        return null;
      }

      return planningSession.eventPlan;
    } catch (error) {
      logger.error(`Failed to get event plan for event ${eventId}`, error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Generates a schedule of reminders for an event
   * 
   * @param eventId - The event ID
   * @param eventDate - The event date
   * @returns The generated reminder schedule
   */
  async generateReminderSchedule(eventId: string, eventDate: Date): Promise<IReminderSchedule> {
    try {
      logger.info(`Generating reminder schedule for event ${eventId}`);

      const eventTime = new Date(eventDate).getTime();
      
      // Create reminders at standard intervals
      const reminders: IReminder[] = [
        // 1 week before
        {
          id: `rem-${eventId}-week`,
          type: '1_week_before',
          scheduledTime: new Date(eventTime - 7 * 24 * 60 * 60 * 1000),
          sent: false,
          sentAt: null
        },
        // 3 days before
        {
          id: `rem-${eventId}-3days`,
          type: '3_days_before',
          scheduledTime: new Date(eventTime - 3 * 24 * 60 * 60 * 1000),
          sent: false,
          sentAt: null
        },
        // 1 day before
        {
          id: `rem-${eventId}-1day`,
          type: '1_day_before',
          scheduledTime: new Date(eventTime - 24 * 60 * 60 * 1000),
          sent: false,
          sentAt: null
        },
        // 3 hours before
        {
          id: `rem-${eventId}-3hours`,
          type: '3_hours_before',
          scheduledTime: new Date(eventTime - 3 * 60 * 60 * 1000),
          sent: false,
          sentAt: null
        },
        // Event start
        {
          id: `rem-${eventId}-start`,
          type: 'event_start',
          scheduledTime: new Date(eventTime),
          sent: false,
          sentAt: null
        },
        // Post-event feedback (3 hours after)
        {
          id: `rem-${eventId}-feedback`,
          type: 'post_event_feedback',
          scheduledTime: new Date(eventTime + 3 * 60 * 60 * 1000),
          sent: false,
          sentAt: null
        }
      ];

      // Filter out reminders that are in the past
      const now = new Date().getTime();
      const futureReminders = reminders.filter(
        reminder => reminder.scheduledTime.getTime() > now
      );

      // Create and store the reminder schedule
      const reminderSchedule: IReminderSchedule = {
        id: `schedule-${eventId}`,
        eventId,
        reminders: futureReminders
      };

      // Store the reminder schedule in the database
      await this.prisma.reminderSchedule.upsert({
        where: { eventId },
        update: { reminders: reminderSchedule.reminders },
        create: {
          id: reminderSchedule.id,
          eventId: reminderSchedule.eventId,
          reminders: reminderSchedule.reminders
        }
      });

      return reminderSchedule;
    } catch (error) {
      logger.error(`Failed to generate reminder schedule for event ${eventId}`, error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Gets the voting results for time slots and venues
   * 
   * @param planningSessionId - The planning session ID
   * @returns The voting results
   */
  async getVotingResults(planningSessionId: string): Promise<IVotingResults> {
    try {
      // Retrieve the planning session
      const planningSession = await this.getPlanningSessionById(planningSessionId);
      if (!planningSession) {
        throw ApiError.notFound(`Planning session not found with ID ${planningSessionId}`);
      }

      logger.info(`Getting voting results for planning session ${planningSessionId}`);

      // Calculate time slot voting results
      const timeSlotResults = planningSession.suggestedTimeSlots.map(timeSlot => ({
        timeSlot,
        voteCount: timeSlot.votes.length,
        voters: timeSlot.votes
      }));

      // Calculate venue voting results
      const venueResults = planningSession.suggestedVenues.map(venue => ({
        venue,
        voteCount: venue.votes.length,
        voters: venue.votes
      }));

      // Find the leading time slot and venue
      timeSlotResults.sort((a, b) => b.voteCount - a.voteCount);
      venueResults.sort((a, b) => b.voteCount - a.voteCount);

      const leadingTimeSlot = timeSlotResults.length > 0 ? 
        { timeSlot: timeSlotResults[0].timeSlot, voteCount: timeSlotResults[0].voteCount } : null;
      
      const leadingVenue = venueResults.length > 0 ? 
        { venue: venueResults[0].venue, voteCount: venueResults[0].voteCount } : null;

      // Calculate unique voters
      const allVoters = new Set([
        ...planningSession.suggestedTimeSlots.flatMap(slot => slot.votes),
        ...planningSession.suggestedVenues.flatMap(venue => venue.votes)
      ]);

      // Calculate time remaining until voting deadline
      const now = new Date().getTime();
      const deadline = new Date(planningSession.votingDeadline).getTime();
      const timeRemaining = Math.max(0, Math.floor((deadline - now) / 1000)); // in seconds

      return {
        timeSlots: timeSlotResults,
        venues: venueResults,
        leadingTimeSlot,
        leadingVenue,
        totalVoters: allVoters.size,
        votingDeadline: planningSession.votingDeadline,
        timeRemaining
      };
    } catch (error) {
      logger.error(`Failed to get voting results for planning session ${planningSessionId}`, error);
      throw ApiError.fromError(error as Error);
    }
  }

  /**
   * Automatically suggests an optimal plan based on all collected data
   * 
   * @param planningSessionId - The planning session ID
   * @returns The AI-suggested optimal plan
   */
  async autoSuggestPlan(planningSessionId: string): Promise<IAutoSuggestedPlan> {
    try {
      // Retrieve the planning session
      const planningSession = await this.getPlanningSessionById(planningSessionId);
      if (!planningSession) {
        throw ApiError.notFound(`Planning session not found with ID ${planningSessionId}`);
      }

      logger.info(`Auto-suggesting optimal plan for planning session ${planningSessionId}`);

      // Get all availability data and venue suggestions
      const availabilityData = await this.prisma.availability.findMany({
        where: { eventId: planningSession.eventId }
      });

      const tribeMembers = await this.prisma.tribeMembership.findMany({
        where: { tribeId: planningSession.tribeId },
        include: { user: { include: { profile: true } } }
      });

      // Use AI to generate optimal plan suggestion
      const suggestedPlan = await this.aiClient.generateOptimalPlan(
        planningSession.suggestedTimeSlots,
        planningSession.suggestedVenues,
        availabilityData,
        tribeMembers,
        planningSession.preferences
      );

      return suggestedPlan;
    } catch (error) {
      logger.error(`Failed to auto-suggest plan for planning session ${planningSessionId}`, error);
      throw ApiError.fromError(error as Error);
    }
  }
}

export default PlanningModel;