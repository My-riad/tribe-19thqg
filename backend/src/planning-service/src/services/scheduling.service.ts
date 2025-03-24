import * as dayjs from 'dayjs'; // ^1.11.7
import * as _ from 'lodash'; // ^4.17.21
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import { AIOrchestrationClient } from '@tribe/ai-orchestration-client'; // ^1.0.0

import PlanningModel, { 
  IOptimalTimeSlot, 
  IPlanningSession 
} from '../models/planning.model';
import Availability, { 
  IAvailability, 
  ITimeSlot, 
  AvailabilityStatus 
} from '../models/availability.model';
import { 
  findOptimalTimeSlots, 
  analyzeUserAvailability, 
  resolveSchedulingConflicts, 
  optimizeForAttendance, 
  optimizeForConvenience, 
  findCommonAvailabilityWindows, 
  applySchedulingConstraints, 
  calculateAttendanceScore,
  SchedulingAlgorithm
} from '../utils/scheduling.util';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Service class for implementing advanced scheduling algorithms to find optimal meeting times
 * This service is a core component of the AI-optimized planning and coordination feature
 */
export class SchedulingService {
  private planningModel: PlanningModel;
  private availabilityModel: Availability;
  private schedulingAlgorithm: SchedulingAlgorithm;
  private aiClient: AIOrchestrationClient;

  /**
   * Initializes a new instance of the SchedulingService class
   */
  constructor() {
    this.planningModel = new PlanningModel();
    this.availabilityModel = new Availability();
    this.schedulingAlgorithm = new SchedulingAlgorithm({
      minAttendees: 2,
      minDurationMinutes: 60,
      prioritizeAttendance: true
    });
    this.aiClient = new AIOrchestrationClient();
  }

  /**
   * Finds optimal meeting times based on user availability data
   * 
   * @param eventId - The ID of the event to find optimal times for
   * @param tribeId - The ID of the tribe to find optimal times for
   * @param options - Scheduling options and constraints
   * @returns Array of optimal time slots ranked by suitability
   */
  async findOptimalMeetingTimes(
    eventId?: string,
    tribeId?: string,
    options: any = {}
  ): Promise<IOptimalTimeSlot[]> {
    // Validate that at least one of eventId or tribeId is provided
    if (!eventId && !tribeId) {
      throw ApiError.badRequest('Either eventId or tribeId must be provided');
    }

    try {
      // Validate scheduling options
      const validatedOptions = {
        minAttendees: options.minAttendees || 2,
        minDurationMinutes: options.minDurationMinutes || 60,
        maxDurationMinutes: options.maxDurationMinutes,
        preferredTimeOfDay: options.preferredTimeOfDay,
        preferredDaysOfWeek: options.preferredDaysOfWeek,
        startDate: options.startDate,
        endDate: options.endDate,
        attendeeWeights: options.attendeeWeights,
        timezone: options.timezone || 'UTC',
        prioritizeAttendance: options.prioritizeAttendance !== false,
        enhanceWithAI: options.enhanceWithAI !== false
      };

      logger.info('Finding optimal meeting times', {
        eventId,
        tribeId,
        options: validatedOptions
      });

      // Retrieve availability data based on event or tribe ID
      let availabilities: IAvailability[] = [];
      if (eventId) {
        availabilities = await this.availabilityModel.getEventAvailability(eventId);
      } else if (tribeId) {
        // Get all availabilities for the tribe
        // This would need to be implemented in the availability model
        // For now, we'll simulate by getting availabilities for a specific event
        const tribeMemberAvailabilities = await this.getAvailabilityByTribeId(tribeId);
        availabilities = tribeMemberAvailabilities;
      }

      if (!availabilities || availabilities.length === 0) {
        throw ApiError.notFound('No availability data found for the specified event or tribe');
      }

      logger.debug('Retrieved availability data', {
        count: availabilities.length,
        eventId,
        tribeId
      });

      // Apply scheduling constraints
      const constraints = {
        timeOfDay: validatedOptions.preferredTimeOfDay ? {
          preferred: validatedOptions.preferredTimeOfDay,
          required: false
        } : undefined,
        dayOfWeek: validatedOptions.preferredDaysOfWeek ? {
          preferred: validatedOptions.preferredDaysOfWeek,
          required: false
        } : undefined,
        duration: {
          min: validatedOptions.minDurationMinutes,
          max: validatedOptions.maxDurationMinutes,
          required: true
        },
        attendance: {
          minAttendees: validatedOptions.minAttendees,
          required: true
        }
      };

      // Use scheduling util to find optimal time slots
      const candidateTimeSlots = findOptimalTimeSlots(availabilities, {
        minAttendees: validatedOptions.minAttendees,
        minDurationMinutes: validatedOptions.minDurationMinutes,
        maxDurationMinutes: validatedOptions.maxDurationMinutes,
        preferredTimeOfDay: validatedOptions.preferredTimeOfDay,
        preferredDaysOfWeek: validatedOptions.preferredDaysOfWeek,
        startDate: validatedOptions.startDate,
        endDate: validatedOptions.endDate,
        attendeeWeights: validatedOptions.attendeeWeights,
        timezone: validatedOptions.timezone,
        prioritizeAttendance: validatedOptions.prioritizeAttendance
      });

      // Format candidate slots as IOptimalTimeSlot objects
      let optimalTimeSlots: IOptimalTimeSlot[] = candidateTimeSlots.map(slot => {
        // Calculate attendance metrics
        const attendeeCount = slot.attendeeIds.length;
        const totalAttendees = availabilities.length;
        const attendancePercentage = Math.round((attendeeCount / totalAttendees) * 100);
        
        return {
          id: '', // Will be set later
          startTime: slot.startTime,
          endTime: slot.endTime,
          attendanceScore: slot.score,
          attendeeCount,
          totalAttendees,
          attendancePercentage,
          votes: [],
          aiRecommended: false,
          recommendationReason: ''
        };
      });

      // Enhance with AI if requested
      if (validatedOptions.enhanceWithAI) {
        optimalTimeSlots = await this.enhanceWithAI(
          optimalTimeSlots,
          availabilities,
          {
            eventId,
            tribeId,
            options: validatedOptions
          }
        );
      }

      // Sort by attendance score (descending)
      optimalTimeSlots.sort((a, b) => b.attendanceScore - a.attendanceScore);

      // Generate unique IDs for each time slot
      optimalTimeSlots = optimalTimeSlots.map(slot => ({
        ...slot,
        id: uuidv4()
      }));

      logger.info('Found optimal meeting times', {
        count: optimalTimeSlots.length,
        topScore: optimalTimeSlots.length > 0 ? optimalTimeSlots[0].attendanceScore : 0
      });

      return optimalTimeSlots;
    } catch (error) {
      logger.error('Error finding optimal meeting times', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to find optimal meeting times', { 
        eventId, 
        tribeId,
        error: error.message 
      });
    }
  }

  /**
   * Enhances time slot suggestions using AI capabilities
   * 
   * @param timeSlots - Original time slots to enhance
   * @param availabilities - User availability data
   * @param context - Additional context for AI enhancement
   * @returns AI-enhanced time slots with improved ranking and reasoning
   */
  private async enhanceWithAI(
    timeSlots: IOptimalTimeSlot[],
    availabilities: IAvailability[],
    context: any
  ): Promise<IOptimalTimeSlot[]> {
    if (!timeSlots || timeSlots.length === 0) {
      return [];
    }

    try {
      logger.info('Enhancing time slots with AI', {
        slotCount: timeSlots.length,
        eventId: context.eventId,
        tribeId: context.tribeId
      });

      // Prepare data for AI analysis
      const aiContext = {
        timeSlots,
        availabilities,
        context
      };

      // Call AI service to enhance recommendations
      const enhancedResults = await this.aiClient.enhanceTimeSlotRecommendations(aiContext);

      // Update time slots with AI recommendations
      const enhancedTimeSlots = timeSlots.map(slot => {
        const aiEnhancement = enhancedResults.find(
          er => new Date(er.startTime).getTime() === new Date(slot.startTime).getTime() &&
               new Date(er.endTime).getTime() === new Date(slot.endTime).getTime()
        );

        if (aiEnhancement) {
          return {
            ...slot,
            attendanceScore: aiEnhancement.enhancedScore || slot.attendanceScore,
            aiRecommended: aiEnhancement.recommended || false,
            recommendationReason: aiEnhancement.reason || ''
          };
        }
        
        return slot;
      });

      // Re-sort based on enhanced scores
      enhancedTimeSlots.sort((a, b) => b.attendanceScore - a.attendanceScore);

      // Flag the top recommendations
      const topCount = Math.min(3, enhancedTimeSlots.length);
      for (let i = 0; i < topCount; i++) {
        if (!enhancedTimeSlots[i].aiRecommended) {
          enhancedTimeSlots[i].aiRecommended = true;
          if (!enhancedTimeSlots[i].recommendationReason) {
            enhancedTimeSlots[i].recommendationReason = 'This time slot has a high attendance score';
          }
        }
      }

      logger.debug('AI enhancement complete', {
        enhancedCount: enhancedTimeSlots.filter(s => s.aiRecommended).length
      });

      return enhancedTimeSlots;
    } catch (error) {
      logger.error('Error enhancing time slots with AI', error);
      // Fall back to original time slots if AI enhancement fails
      return timeSlots;
    }
  }

  /**
   * Resolves scheduling conflicts by suggesting alternative times
   * 
   * @param proposedTimeSlots - Array of proposed time slots
   * @param existingEvents - Array of existing events that might conflict
   * @param eventId - ID of the event being scheduled
   * @returns Conflict resolution with alternative suggestions
   */
  async resolveSchedulingConflicts(
    proposedTimeSlots: IOptimalTimeSlot[],
    existingEvents: Array<{ startTime: Date, endTime: Date, eventId: string }>,
    eventId: string
  ): Promise<any> {
    try {
      logger.info('Resolving scheduling conflicts', {
        proposedSlotsCount: proposedTimeSlots.length,
        existingEventsCount: existingEvents.length,
        eventId
      });

      // Get availability data for the event
      const availabilities = await this.availabilityModel.getEventAvailability(eventId);

      if (!availabilities || availabilities.length === 0) {
        throw ApiError.notFound('No availability data found for the specified event');
      }

      // Convert IOptimalTimeSlot to the format expected by resolveSchedulingConflicts
      const formattedTimeSlots = proposedTimeSlots.map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        attendeeIds: Array.from({ length: slot.attendeeCount }, (_, i) => `user-${i + 1}`), // Simulated user IDs
        score: slot.attendanceScore,
        timeOfDay: this.getTimeOfDay(slot.startTime)
      }));

      // Call scheduling utility to resolve conflicts
      const conflictResolutions = resolveSchedulingConflicts(
        formattedTimeSlots,
        existingEvents,
        availabilities
      );

      // Enhance alternative suggestions with attendance metrics
      const enhancedResolutions = conflictResolutions.map(resolution => {
        const enhancedAlternatives = resolution.alternatives.map(alt => ({
          id: uuidv4(),
          startTime: alt.startTime,
          endTime: alt.endTime,
          attendanceScore: alt.score,
          attendeeCount: alt.attendeeIds.length,
          totalAttendees: availabilities.length,
          attendancePercentage: Math.round((alt.attendeeIds.length / availabilities.length) * 100),
          votes: [],
          aiRecommended: false,
          recommendationReason: ''
        }));

        // Find the original time slot from proposedTimeSlots
        const originalTimeSlot = proposedTimeSlots.find(
          slot => new Date(slot.startTime).getTime() === new Date(resolution.original.startTime).getTime() &&
                 new Date(slot.endTime).getTime() === new Date(resolution.original.endTime).getTime()
        );

        return {
          original: originalTimeSlot || resolution.original,
          conflicts: resolution.conflicts,
          alternatives: enhancedAlternatives
        };
      });

      // Enhance alternatives with AI if possible
      for (const resolution of enhancedResolutions) {
        if (resolution.alternatives.length > 0) {
          resolution.alternatives = await this.enhanceWithAI(
            resolution.alternatives,
            availabilities,
            {
              eventId,
              options: {
                prioritizeAttendance: true
              }
            }
          );
        }
      }

      logger.info('Resolved scheduling conflicts', {
        resolutionsCount: enhancedResolutions.length,
        conflictsFound: enhancedResolutions.filter(r => r.conflicts.length > 0).length
      });

      return enhancedResolutions;
    } catch (error) {
      logger.error('Error resolving scheduling conflicts', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to resolve scheduling conflicts', { 
        eventId, 
        error: error.message 
      });
    }
  }

  /**
   * Analyzes availability patterns to identify trends and optimal scheduling windows
   * 
   * @param eventId - The ID of the event to analyze
   * @param tribeId - The ID of the tribe to analyze
   * @returns Availability analysis with patterns and recommendations
   */
  async analyzeAvailabilityPatterns(
    eventId?: string,
    tribeId?: string
  ): Promise<any> {
    // Validate that at least one of eventId or tribeId is provided
    if (!eventId && !tribeId) {
      throw ApiError.badRequest('Either eventId or tribeId must be provided');
    }

    try {
      logger.info('Analyzing availability patterns', {
        eventId,
        tribeId
      });

      // Retrieve availability data based on event or tribe ID
      let availabilities: IAvailability[] = [];
      if (eventId) {
        availabilities = await this.availabilityModel.getEventAvailability(eventId);
      } else if (tribeId) {
        // Get all availabilities for the tribe
        const tribeMemberAvailabilities = await this.getAvailabilityByTribeId(tribeId);
        availabilities = tribeMemberAvailabilities;
      }

      if (!availabilities || availabilities.length === 0) {
        throw ApiError.notFound('No availability data found for the specified event or tribe');
      }

      // Call scheduling utility to analyze availability patterns
      const analysis = analyzeUserAvailability(availabilities);

      // Enhance with AI insights if possible
      try {
        const aiInsights = await this.aiClient.analyzeAvailabilityPatterns({
          eventId,
          tribeId,
          availabilities,
          analysis
        });

        if (aiInsights) {
          analysis.aiInsights = aiInsights;
        }
      } catch (aiError) {
        logger.warn('AI enhancement for availability analysis failed', aiError);
        // Continue without AI insights
      }

      logger.info('Completed availability pattern analysis', {
        eventId,
        tribeId,
        bestDays: analysis.bestDays,
        bestTimeOfDay: analysis.bestTimeOfDay
      });

      return analysis;
    } catch (error) {
      logger.error('Error analyzing availability patterns', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to analyze availability patterns', { 
        eventId, 
        tribeId,
        error: error.message 
      });
    }
  }

  /**
   * Finds common availability windows across multiple users
   * 
   * @param eventId - The ID of the event to find common windows for
   * @param tribeId - The ID of the tribe to find common windows for
   * @param options - Options for finding common windows
   * @returns Common availability windows
   */
  async findCommonAvailabilityWindows(
    eventId?: string,
    tribeId?: string,
    options: any = {}
  ): Promise<Array<{
    startTime: Date, 
    endTime: Date, 
    availableUsers: string[],
    duration: number
  }>> {
    // Validate that at least one of eventId or tribeId is provided
    if (!eventId && !tribeId) {
      throw ApiError.badRequest('Either eventId or tribeId must be provided');
    }

    try {
      // Validate and set default options
      const validatedOptions = {
        minRequiredUsers: options.minRequiredUsers || 2,
        minDurationMinutes: options.minDurationMinutes || 60,
        startDate: options.startDate,
        endDate: options.endDate
      };

      logger.info('Finding common availability windows', {
        eventId,
        tribeId,
        options: validatedOptions
      });

      // Retrieve availability data based on event or tribe ID
      let availabilities: IAvailability[] = [];
      if (eventId) {
        availabilities = await this.availabilityModel.getEventAvailability(eventId);
      } else if (tribeId) {
        // Get all availabilities for the tribe
        const tribeMemberAvailabilities = await this.getAvailabilityByTribeId(tribeId);
        availabilities = tribeMemberAvailabilities;
      }

      if (!availabilities || availabilities.length === 0) {
        throw ApiError.notFound('No availability data found for the specified event or tribe');
      }

      // Call scheduling utility to find common availability windows
      const commonWindows = findCommonAvailabilityWindows(availabilities, validatedOptions);

      // Format windows for response (rename availableUserIds to availableUsers)
      const formattedWindows = commonWindows.map(window => ({
        startTime: window.startTime,
        endTime: window.endTime,
        availableUsers: window.availableUserIds,
        duration: window.duration
      }));

      // Sort by number of available users (descending), then by duration (descending)
      formattedWindows.sort((a, b) => {
        if (a.availableUsers.length !== b.availableUsers.length) {
          return b.availableUsers.length - a.availableUsers.length;
        }
        return b.duration - a.duration;
      });

      logger.info('Found common availability windows', {
        windowsCount: formattedWindows.length,
        maxUsers: formattedWindows.length > 0 ? formattedWindows[0].availableUsers.length : 0
      });

      return formattedWindows;
    } catch (error) {
      logger.error('Error finding common availability windows', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to find common availability windows', { 
        eventId, 
        tribeId,
        error: error.message 
      });
    }
  }

  /**
   * Optimizes time slot selection to maximize attendance
   * 
   * @param eventId - The ID of the event to optimize for
   * @param tribeId - The ID of the tribe to optimize for
   * @param options - Optimization options
   * @returns Time slots optimized for maximum attendance
   */
  async optimizeForAttendance(
    eventId?: string,
    tribeId?: string,
    options: any = {}
  ): Promise<IOptimalTimeSlot[]> {
    // Validate that at least one of eventId or tribeId is provided
    if (!eventId && !tribeId) {
      throw ApiError.badRequest('Either eventId or tribeId must be provided');
    }

    try {
      // Validate and set default options
      const validatedOptions = {
        startDate: options.startDate,
        endDate: options.endDate,
        minDurationMinutes: options.minDurationMinutes || 60,
        maxDurationMinutes: options.maxDurationMinutes,
        minAttendancePercentage: options.minAttendancePercentage || 50,
        attendeeWeights: options.attendeeWeights,
        enhanceWithAI: options.enhanceWithAI !== false
      };

      logger.info('Optimizing time slots for attendance', {
        eventId,
        tribeId,
        options: validatedOptions
      });

      // Retrieve availability data based on event or tribe ID
      let availabilities: IAvailability[] = [];
      if (eventId) {
        availabilities = await this.availabilityModel.getEventAvailability(eventId);
      } else if (tribeId) {
        // Get all availabilities for the tribe
        const tribeMemberAvailabilities = await this.getAvailabilityByTribeId(tribeId);
        availabilities = tribeMemberAvailabilities;
      }

      if (!availabilities || availabilities.length === 0) {
        throw ApiError.notFound('No availability data found for the specified event or tribe');
      }

      // Call scheduling utility to optimize for attendance
      const optimizedSlots = optimizeForAttendance(availabilities, validatedOptions);

      // Convert to IOptimalTimeSlot format
      let optimalTimeSlots: IOptimalTimeSlot[] = optimizedSlots.map(slot => ({
        id: uuidv4(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        attendanceScore: slot.score,
        attendeeCount: slot.attendeeIds.length,
        totalAttendees: availabilities.length,
        attendancePercentage: slot.attendancePercentage,
        votes: [],
        aiRecommended: false,
        recommendationReason: ''
      }));

      // Enhance with AI if requested
      if (validatedOptions.enhanceWithAI) {
        optimalTimeSlots = await this.enhanceWithAI(
          optimalTimeSlots,
          availabilities,
          {
            eventId,
            tribeId,
            options: validatedOptions
          }
        );
      }

      logger.info('Optimized time slots for attendance', {
        slotsCount: optimalTimeSlots.length,
        maxAttendance: optimalTimeSlots.length > 0 ? optimalTimeSlots[0].attendancePercentage : 0
      });

      return optimalTimeSlots;
    } catch (error) {
      logger.error('Error optimizing for attendance', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to optimize for attendance', { 
        eventId, 
        tribeId,
        error: error.message 
      });
    }
  }

  /**
   * Optimizes time slot selection for user convenience based on preferences
   * 
   * @param eventId - The ID of the event to optimize for
   * @param tribeId - The ID of the tribe to optimize for
   * @param userPreferences - User convenience preferences
   * @returns Time slots optimized for user convenience
   */
  async optimizeForConvenience(
    eventId?: string,
    tribeId?: string,
    userPreferences: any = {}
  ): Promise<IOptimalTimeSlot[]> {
    // Validate that at least one of eventId or tribeId is provided
    if (!eventId && !tribeId) {
      throw ApiError.badRequest('Either eventId or tribeId must be provided');
    }

    try {
      // Validate and set default preferences
      const validatedPreferences = {
        preferredTimeOfDay: userPreferences.preferredTimeOfDay,
        preferredDaysOfWeek: userPreferences.preferredDaysOfWeek,
        preferredLocation: userPreferences.preferredLocation,
        maxTravelDistance: userPreferences.maxTravelDistance,
        prioritizeProximity: userPreferences.prioritizeProximity !== false,
        accountForTrafficHours: userPreferences.accountForTrafficHours !== false,
        enhanceWithAI: userPreferences.enhanceWithAI !== false
      };

      logger.info('Optimizing time slots for convenience', {
        eventId,
        tribeId,
        preferences: validatedPreferences
      });

      // Retrieve availability data based on event or tribe ID
      let availabilities: IAvailability[] = [];
      if (eventId) {
        availabilities = await this.availabilityModel.getEventAvailability(eventId);
      } else if (tribeId) {
        // Get all availabilities for the tribe
        const tribeMemberAvailabilities = await this.getAvailabilityByTribeId(tribeId);
        availabilities = tribeMemberAvailabilities;
      }

      if (!availabilities || availabilities.length === 0) {
        throw ApiError.notFound('No availability data found for the specified event or tribe');
      }

      // Call scheduling utility to optimize for convenience
      const optimizedSlots = optimizeForConvenience(availabilities, validatedPreferences);

      // Convert to IOptimalTimeSlot format
      let optimalTimeSlots: IOptimalTimeSlot[] = optimizedSlots.map(slot => ({
        id: uuidv4(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        attendanceScore: slot.convenienceScore, // Use convenience score as attendance score
        attendeeCount: slot.attendeeIds.length,
        totalAttendees: availabilities.length,
        attendancePercentage: Math.round((slot.attendeeIds.length / availabilities.length) * 100),
        votes: [],
        aiRecommended: false,
        recommendationReason: `Convenience factors: ${Object.entries(slot.factors)
          .filter(([_, score]) => score > 70)
          .map(([factor, _]) => factor.replace('Score', ''))
          .join(', ')}`
      }));

      // Enhance with AI if requested
      if (validatedPreferences.enhanceWithAI) {
        optimalTimeSlots = await this.enhanceWithAI(
          optimalTimeSlots,
          availabilities,
          {
            eventId,
            tribeId,
            options: validatedPreferences
          }
        );
      }

      logger.info('Optimized time slots for convenience', {
        slotsCount: optimalTimeSlots.length,
        maxConvenience: optimalTimeSlots.length > 0 ? optimalTimeSlots[0].attendanceScore : 0
      });

      return optimalTimeSlots;
    } catch (error) {
      logger.error('Error optimizing for convenience', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to optimize for convenience', { 
        eventId, 
        tribeId,
        error: error.message 
      });
    }
  }

  /**
   * Updates a planning session with optimal time slot suggestions
   * 
   * @param planningSessionId - The ID of the planning session to update
   * @param timeSlots - The optimal time slots to add to the planning session
   * @returns The updated planning session
   */
  async updatePlanningSessionWithTimeSlots(
    planningSessionId: string,
    timeSlots: IOptimalTimeSlot[]
  ): Promise<IPlanningSession> {
    try {
      // Validate inputs
      if (!planningSessionId) {
        throw ApiError.badRequest('Planning session ID is required');
      }
      
      if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
        throw ApiError.badRequest('At least one time slot must be provided');
      }

      logger.info('Updating planning session with time slots', {
        planningSessionId,
        timeSlotCount: timeSlots.length
      });

      // Prepare update data
      const updateData = {
        suggestedTimeSlots: timeSlots,
        status: 'SUGGESTING_TIMES' // Update the status to reflect the current step
      };

      // Update the planning session
      const updatedSession = await this.planningModel.updatePlanningSession(
        planningSessionId,
        updateData
      );

      logger.info('Updated planning session with time slots', {
        planningSessionId,
        timeSlotCount: timeSlots.length
      });

      return updatedSession;
    } catch (error) {
      logger.error('Error updating planning session with time slots', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to update planning session with time slots', { 
        planningSessionId, 
        error: error.message 
      });
    }
  }

  /**
   * Generates scheduling options based on event context and user preferences
   * 
   * @param eventId - The ID of the event to generate options for
   * @param tribeId - The ID of the tribe to generate options for
   * @param baseOptions - Base options to include
   * @returns Generated scheduling options
   */
  async generateSchedulingOptions(
    eventId?: string,
    tribeId?: string,
    baseOptions: any = {}
  ): Promise<any> {
    // Validate that at least one of eventId or tribeId is provided
    if (!eventId && !tribeId) {
      throw ApiError.badRequest('Either eventId or tribeId must be provided');
    }

    try {
      logger.info('Generating scheduling options', {
        eventId,
        tribeId
      });

      let options = { ...baseOptions };

      // If event ID is provided, get event details
      if (eventId) {
        // This would be implemented to fetch event details
        // For now, we'll use placeholder logic
        options = {
          ...options,
          eventType: 'in_person', // Example data
          minDurationMinutes: options.minDurationMinutes || 60
        };
      }

      // If tribe ID is provided, analyze historical patterns
      if (tribeId) {
        try {
          // Analyze historical scheduling patterns
          const availabilities = await this.getAvailabilityByTribeId(tribeId);
          
          if (availabilities && availabilities.length > 0) {
            const analysis = analyzeUserAvailability(availabilities);
            
            // Use analysis to inform scheduling options
            options = {
              ...options,
              preferredDaysOfWeek: options.preferredDaysOfWeek || analysis.bestDays,
              preferredTimeOfDay: options.preferredTimeOfDay || [analysis.bestTimeOfDay]
            };
          }
        } catch (analysisError) {
          logger.warn('Error analyzing historical patterns for scheduling options', analysisError);
          // Continue with base options
        }
      }

      // Set defaults for any missing options
      const finalOptions = {
        minAttendees: options.minAttendees || 2,
        minDurationMinutes: options.minDurationMinutes || 60,
        prioritizeAttendance: options.prioritizeAttendance !== false,
        enhanceWithAI: options.enhanceWithAI !== false,
        ...options
      };

      logger.info('Generated scheduling options', {
        eventId,
        tribeId,
        options: finalOptions
      });

      return finalOptions;
    } catch (error) {
      logger.error('Error generating scheduling options', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to generate scheduling options', { 
        eventId, 
        tribeId,
        error: error.message 
      });
    }
  }

  /**
   * Calculates attendance metrics for time slots
   * 
   * @param timeSlots - The time slots to calculate metrics for
   * @param totalMembers - The total number of members
   * @returns Time slots with attendance metrics
   */
  calculateAttendanceMetrics(
    timeSlots: IOptimalTimeSlot[],
    totalMembers: number
  ): IOptimalTimeSlot[] {
    return timeSlots.map(slot => {
      const attendancePercentage = Math.round((slot.attendeeCount / totalMembers) * 100);
      
      // Calculate an attendance score that prioritizes high attendance percentages
      // but also considers the absolute number of attendees
      const attendanceScore = Math.round(
        (0.7 * attendancePercentage) + 
        (0.3 * (Math.min(slot.attendeeCount, 8) / 8) * 100)
      );
      
      return {
        ...slot,
        attendanceScore,
        attendancePercentage,
        totalAttendees: totalMembers
      };
    });
  }

  /**
   * Gets the current scheduling algorithm options
   * 
   * @returns Current scheduling algorithm options
   */
  getSchedulingAlgorithmOptions(): object {
    return this.schedulingAlgorithm['options'] || {};
  }

  /**
   * Updates the scheduling algorithm options
   * 
   * @param options - New options to set
   */
  setSchedulingAlgorithmOptions(options: any): void {
    if (!options || typeof options !== 'object') {
      throw ApiError.badRequest('Valid options object must be provided');
    }

    logger.info('Updating scheduling algorithm options', { options });
    this.schedulingAlgorithm.setOptions(options);
  }

  /**
   * Helper method to get availability data by tribe ID
   * This would be implemented in the Availability model in a production system
   * 
   * @param tribeId - The ID of the tribe to get availability for
   * @returns Array of availability records
   */
  private async getAvailabilityByTribeId(tribeId: string): Promise<IAvailability[]> {
    // In a real implementation, this would query the database for all tribe members' availability
    // For now, we'll return an empty array or fetch from a different data source
    
    // This is just a placeholder until a proper implementation is available
    return [];
  }

  /**
   * Helper method to determine time of day from a date
   * 
   * @param date - The date to categorize
   * @returns Time of day category (MORNING, AFTERNOON, EVENING)
   */
  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'MORNING';
    } else if (hour >= 12 && hour < 17) {
      return 'AFTERNOON';
    } else {
      return 'EVENING';
    }
  }
}

export default SchedulingService;