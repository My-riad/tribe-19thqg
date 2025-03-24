/**
 * Advanced scheduling algorithms and utilities for Tribe's planning service.
 * 
 * This module provides sophisticated algorithms for finding optimal meeting times,
 * analyzing availability patterns, resolving scheduling conflicts, and optimizing
 * for various constraints like attendance and convenience.
 */

import * as dayjs from 'dayjs'; // ^1.11.7
import * as _ from 'lodash'; // ^4.17.21
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0

import { 
  IAvailability, 
  ITimeSlot, 
  AvailabilityStatus 
} from '../models/availability.model';
import { IOptimalTimeSlot } from '../models/planning.model';
import { 
  isValidDate, 
  addDaysToDate, 
  addHoursToDate, 
  addMinutesToDate,
  getMinutesBetweenDates,
  isDateBefore,
  isDateAfter,
  convertToTimezone,
  isWeekend
} from '../../../shared/src/utils/date.util';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Enum for categorizing times of day
 */
export enum TimeOfDay {
  MORNING = 'MORNING',     // 5:00 AM - 11:59 AM
  AFTERNOON = 'AFTERNOON', // 12:00 PM - 4:59 PM
  EVENING = 'EVENING'      // 5:00 PM - 4:59 AM
}

/**
 * Enum for scheduling constraint types
 */
export enum SchedulingConstraintType {
  TIME_OF_DAY = 'TIME_OF_DAY',
  DAY_OF_WEEK = 'DAY_OF_WEEK',
  DURATION = 'DURATION',
  ATTENDANCE = 'ATTENDANCE'
}

/**
 * Interface for scheduling options
 */
interface SchedulingOptions {
  minAttendees?: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  preferredTimeOfDay?: TimeOfDay[];
  preferredDaysOfWeek?: number[];
  startDate?: Date;
  endDate?: Date;
  attendeeWeights?: Record<string, number>;
  timezone?: string;
  prioritizeAttendance?: boolean;
}

/**
 * Interface for a candidate time slot with score and attendees
 */
interface CandidateTimeSlot {
  startTime: Date;
  endTime: Date;
  attendeeIds: string[];
  score: number;
  timeOfDay?: TimeOfDay;
  duration?: number;
}

/**
 * Interface for availability analysis result
 */
interface AvailabilityAnalysis {
  peakTimes: {
    byDay: Record<number, number[]>;
    byTimeOfDay: Record<TimeOfDay, number>;
  };
  bestDays: number[];
  bestTimeOfDay: TimeOfDay;
  commonWindows: Array<{
    startTime: Date;
    endTime: Date;
    availableUserIds: string[];
    duration: number;
  }>;
  recommendedTimeSlots: CandidateTimeSlot[];
  attendancePatterns: {
    averageAvailabilityHours: number;
    weekdayVsWeekendPreference: string;
    timeOfDayPreference: TimeOfDay;
  };
}

/**
 * Finds optimal time slots based on user availability and constraints
 * 
 * @param availabilities - Array of user availability records
 * @param options - Scheduling options and constraints
 * @returns Array of optimal time slots with attendee information and scores
 */
export function findOptimalTimeSlots(
  availabilities: IAvailability[],
  options: SchedulingOptions = {}
): CandidateTimeSlot[] {
  logger.debug('Finding optimal time slots', { userCount: availabilities.length, options });
  
  if (!availabilities || availabilities.length === 0) {
    logger.info('No availabilities provided for finding optimal time slots');
    return [];
  }
  
  // Default options
  const defaultOptions: SchedulingOptions = {
    minAttendees: 2,
    minDurationMinutes: 30,
    timezone: 'UTC',
    prioritizeAttendance: true
  };
  
  // Merge provided options with defaults
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    // Extract all time slots marked as AVAILABLE from all user availabilities
    const allAvailableTimeSlots: Array<{ 
      userId: string; 
      startTime: Date; 
      endTime: Date; 
    }> = [];
    
    availabilities.forEach(availability => {
      availability.timeSlots
        .filter(slot => slot.status === AvailabilityStatus.AVAILABLE)
        .forEach(slot => {
          allAvailableTimeSlots.push({
            userId: availability.userId,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime)
          });
        });
    });
    
    if (allAvailableTimeSlots.length === 0) {
      logger.info('No available time slots found in provided availabilities');
      return [];
    }
    
    // Filter time slots based on start and end date constraints
    let filteredTimeSlots = allAvailableTimeSlots;
    if (mergedOptions.startDate) {
      filteredTimeSlots = filteredTimeSlots.filter(slot => 
        isDateAfter(slot.startTime, mergedOptions.startDate!)
      );
    }
    if (mergedOptions.endDate) {
      filteredTimeSlots = filteredTimeSlots.filter(slot => 
        isDateBefore(slot.endTime, mergedOptions.endDate!)
      );
    }
    
    // Create a timeline of all time slot boundaries for efficient overlapping windows calculation
    let timeline: Array<{ 
      time: Date; 
      type: 'start' | 'end'; 
      userId: string;
    }> = [];
    
    filteredTimeSlots.forEach(slot => {
      timeline.push({ time: slot.startTime, type: 'start', userId: slot.userId });
      timeline.push({ time: slot.endTime, type: 'end', userId: slot.userId });
    });
    
    // Sort the timeline chronologically
    timeline.sort((a, b) => a.time.getTime() - b.time.getTime());
    
    // Find overlapping periods
    const overlappingPeriods: CandidateTimeSlot[] = [];
    const activeUsers = new Set<string>();
    let periodStart: Date | null = null;
    
    timeline.forEach(point => {
      if (point.type === 'start') {
        activeUsers.add(point.userId);
        // If this is the first user or we're starting a new period
        if (activeUsers.size === 1 && !periodStart) {
          periodStart = point.time;
        }
      } else {
        activeUsers.delete(point.userId);
        // If no users are available, end the current period
        if (activeUsers.size === 0 && periodStart) {
          const periodEnd = point.time;
          const duration = getMinutesBetweenDates(periodStart, periodEnd);
          
          // Check if the period meets the minimum duration requirement
          if (duration >= mergedOptions.minDurationMinutes!) {
            let currentAttendees = filteredTimeSlots
              .filter(slot => 
                isDateBefore(slot.startTime, periodStart!) && 
                isDateAfter(slot.endTime, periodEnd)
              )
              .map(slot => slot.userId);
            
            // Remove duplicates
            currentAttendees = Array.from(new Set(currentAttendees));
            
            // Check if the number of attendees meets the minimum requirement
            if (currentAttendees.length >= mergedOptions.minAttendees!) {
              // Calculate the time of day
              const timeOfDay = categorizeTimeOfDay(periodStart);
              
              // Apply day of week constraints if specified
              if (mergedOptions.preferredDaysOfWeek && 
                  mergedOptions.preferredDaysOfWeek.length > 0) {
                const dayOfWeek = periodStart.getDay();
                if (!mergedOptions.preferredDaysOfWeek.includes(dayOfWeek)) {
                  // Skip this period if it's not on a preferred day
                  periodStart = null;
                  return;
                }
              }
              
              // Apply time of day constraints if specified
              if (mergedOptions.preferredTimeOfDay && 
                  mergedOptions.preferredTimeOfDay.length > 0) {
                if (!mergedOptions.preferredTimeOfDay.includes(timeOfDay)) {
                  // Skip this period if it's not during a preferred time of day
                  periodStart = null;
                  return;
                }
              }
              
              // Calculate initial score based on attendance
              const baseScore = calculateAttendanceScore(
                currentAttendees, 
                availabilities.length, 
                mergedOptions.attendeeWeights
              ).overallScore;
              
              overlappingPeriods.push({
                startTime: periodStart,
                endTime: periodEnd,
                attendeeIds: currentAttendees,
                score: baseScore,
                timeOfDay,
                duration
              });
            }
          }
          
          periodStart = null;
        }
      }
    });
    
    // Apply duration constraints if maximum is specified
    if (mergedOptions.maxDurationMinutes) {
      for (let i = 0; i < overlappingPeriods.length; i++) {
        const period = overlappingPeriods[i];
        if (period.duration! > mergedOptions.maxDurationMinutes) {
          // Adjust the end time to match the maximum duration
          period.endTime = addMinutesToDate(
            period.startTime, 
            mergedOptions.maxDurationMinutes
          );
          period.duration = mergedOptions.maxDurationMinutes;
        }
      }
    }
    
    // Calculate comprehensive scores for each candidate time slot
    for (let i = 0; i < overlappingPeriods.length; i++) {
      const slot = overlappingPeriods[i];
      
      // Get detailed scoring with all factors
      const scoreDetails = calculateTimeSlotScore(
        slot, 
        availabilities, 
        {
          preferredTimeOfDay: mergedOptions.preferredTimeOfDay,
          preferredDaysOfWeek: mergedOptions.preferredDaysOfWeek,
          attendeeWeights: mergedOptions.attendeeWeights,
          prioritizeAttendance: mergedOptions.prioritizeAttendance
        }
      );
      
      slot.score = scoreDetails.overallScore;
    }
    
    // Sort time slots by score (descending)
    overlappingPeriods.sort((a, b) => b.score - a.score);
    
    logger.info(`Found ${overlappingPeriods.length} optimal time slots`, { 
      topScore: overlappingPeriods.length > 0 ? overlappingPeriods[0].score : 0 
    });
    
    return overlappingPeriods;
  } catch (error) {
    logger.error('Error finding optimal time slots', error);
    throw error;
  }
}

/**
 * Analyzes user availability patterns to identify trends and optimal scheduling windows
 * 
 * @param availabilities - Array of user availability records
 * @returns Availability analysis with patterns and recommendations
 */
export function analyzeUserAvailability(availabilities: IAvailability[]): AvailabilityAnalysis {
  logger.debug('Analyzing user availability patterns', { userCount: availabilities.length });
  
  if (!availabilities || availabilities.length === 0) {
    logger.info('No availabilities provided for analysis');
    throw new Error('No availability data provided for analysis');
  }
  
  try {
    // Initialize analysis data structures
    const analysis: AvailabilityAnalysis = {
      peakTimes: {
        byDay: {}, // Key: day of week (0-6), Value: array of hours with high availability
        byTimeOfDay: {
          [TimeOfDay.MORNING]: 0,
          [TimeOfDay.AFTERNOON]: 0,
          [TimeOfDay.EVENING]: 0
        }
      },
      bestDays: [],
      bestTimeOfDay: TimeOfDay.AFTERNOON, // Default
      commonWindows: [],
      recommendedTimeSlots: [],
      attendancePatterns: {
        averageAvailabilityHours: 0,
        weekdayVsWeekendPreference: 'weekday', // Default
        timeOfDayPreference: TimeOfDay.AFTERNOON // Default
      }
    };
    
    // Initialize hourly availability counter for each day of the week
    const hourlyAvailability: Record<number, Record<number, number>> = {};
    for (let day = 0; day < 7; day++) {
      hourlyAvailability[day] = {};
      for (let hour = 0; hour < 24; hour++) {
        hourlyAvailability[day][hour] = 0;
      }
    }
    
    // Initialize time of day counters
    let morningHours = 0;
    let afternoonHours = 0;
    let eveningHours = 0;
    
    // Initialize weekday vs weekend counters
    let weekdayHours = 0;
    let weekendHours = 0;
    
    // Total available hours across all users
    let totalAvailableHours = 0;
    
    // Process each user's availability
    availabilities.forEach(availability => {
      // Process each available time slot
      availability.timeSlots
        .filter(slot => slot.status === AvailabilityStatus.AVAILABLE)
        .forEach(slot => {
          const startTime = new Date(slot.startTime);
          const endTime = new Date(slot.endTime);
          const durationHours = getMinutesBetweenDates(startTime, endTime) / 60;
          
          totalAvailableHours += durationHours;
          
          // Increment availability for each hour in the time slot
          let currentTime = new Date(startTime);
          while (currentTime < endTime) {
            const day = currentTime.getDay();
            const hour = currentTime.getHours();
            
            // Increment the counter for this day and hour
            hourlyAvailability[day][hour]++;
            
            // Categorize by time of day
            const timeOfDay = categorizeTimeOfDay(currentTime);
            if (timeOfDay === TimeOfDay.MORNING) morningHours++;
            else if (timeOfDay === TimeOfDay.AFTERNOON) afternoonHours++;
            else eveningHours++;
            
            // Categorize by weekday vs weekend
            if (day === 0 || day === 6) weekendHours++;
            else weekdayHours++;
            
            // Move to the next hour
            currentTime = addHoursToDate(currentTime, 1);
          }
        });
    });
    
    // Calculate average availability hours per user
    analysis.attendancePatterns.averageAvailabilityHours = 
      totalAvailableHours / availabilities.length;
    
    // Determine weekday vs weekend preference
    analysis.attendancePatterns.weekdayVsWeekendPreference = 
      weekdayHours > weekendHours ? 'weekday' : 'weekend';
    
    // Determine time of day preference
    const timeOfDayCounts = [
      { type: TimeOfDay.MORNING, count: morningHours },
      { type: TimeOfDay.AFTERNOON, count: afternoonHours },
      { type: TimeOfDay.EVENING, count: eveningHours }
    ];
    timeOfDayCounts.sort((a, b) => b.count - a.count);
    analysis.attendancePatterns.timeOfDayPreference = timeOfDayCounts[0].type;
    
    // Update time of day availability counts
    analysis.peakTimes.byTimeOfDay[TimeOfDay.MORNING] = morningHours;
    analysis.peakTimes.byTimeOfDay[TimeOfDay.AFTERNOON] = afternoonHours;
    analysis.peakTimes.byTimeOfDay[TimeOfDay.EVENING] = eveningHours;
    
    // Determine best time of day
    analysis.bestTimeOfDay = timeOfDayCounts[0].type;
    
    // Find peak hours for each day
    for (let day = 0; day < 7; day++) {
      const hoursForDay = hourlyAvailability[day];
      const hourEntries = Object.entries(hoursForDay)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count);
      
      // Get the top 3 hours for this day (or fewer if not available)
      const topHours = hourEntries
        .slice(0, 3)
        .filter(entry => entry.count > 0) // Only include hours with some availability
        .map(entry => entry.hour);
      
      analysis.peakTimes.byDay[day] = topHours;
    }
    
    // Find best days of the week
    const dayTotals = Array(7).fill(0);
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        dayTotals[day] += hourlyAvailability[day][hour];
      }
    }
    
    // Sort days by availability (descending)
    const sortedDays = Array(7).fill(0)
      .map((_, idx) => ({ day: idx, total: dayTotals[idx] }))
      .sort((a, b) => b.total - a.total);
    
    // Get the top 3 days
    analysis.bestDays = sortedDays
      .slice(0, 3)
      .map(entry => entry.day);
    
    // Find common availability windows
    analysis.commonWindows = findCommonAvailabilityWindows(availabilities, {
      minRequiredUsers: Math.ceil(availabilities.length * 0.5), // At least 50% of users
      minDurationMinutes: 60 // At least 1 hour
    });
    
    // Generate recommended time slots
    analysis.recommendedTimeSlots = findOptimalTimeSlots(availabilities, {
      preferredDaysOfWeek: analysis.bestDays,
      preferredTimeOfDay: [analysis.bestTimeOfDay],
      minDurationMinutes: 60,
      minAttendees: Math.ceil(availabilities.length * 0.7) // At least 70% of users
    });
    
    logger.info('Completed availability analysis', {
      bestDays: analysis.bestDays,
      bestTimeOfDay: analysis.bestTimeOfDay,
      commonWindowsCount: analysis.commonWindows.length
    });
    
    return analysis;
  } catch (error) {
    logger.error('Error analyzing user availability', error);
    throw error;
  }
}

/**
 * Resolves scheduling conflicts by suggesting alternative times
 * 
 * @param proposedTimeSlots - Array of proposed time slots
 * @param existingEvents - Array of existing events that might conflict
 * @param availabilities - Array of user availability records
 * @returns Conflict resolution with alternative suggestions
 */
export function resolveSchedulingConflicts(
  proposedTimeSlots: CandidateTimeSlot[],
  existingEvents: Array<{ startTime: Date; endTime: Date; eventId: string }>,
  availabilities: IAvailability[]
): Array<{
  original: CandidateTimeSlot;
  conflicts: Array<{ eventId: string; startTime: Date; endTime: Date }>;
  alternatives: CandidateTimeSlot[];
}> {
  logger.debug('Resolving scheduling conflicts', { 
    proposedSlotsCount: proposedTimeSlots.length,
    existingEventsCount: existingEvents.length
  });
  
  if (!proposedTimeSlots || proposedTimeSlots.length === 0) {
    logger.info('No proposed time slots provided for conflict resolution');
    return [];
  }
  
  try {
    const resolutions: Array<{
      original: CandidateTimeSlot;
      conflicts: Array<{ eventId: string; startTime: Date; endTime: Date }>;
      alternatives: CandidateTimeSlot[];
    }> = [];
    
    // Check each proposed time slot for conflicts
    for (const proposedSlot of proposedTimeSlots) {
      const conflicts: Array<{ eventId: string; startTime: Date; endTime: Date }> = [];
      
      // Find all conflicts with existing events
      for (const event of existingEvents) {
        // Check if the time slots overlap
        if (!(event.endTime <= proposedSlot.startTime || event.startTime >= proposedSlot.endTime)) {
          conflicts.push({
            eventId: event.eventId,
            startTime: event.startTime,
            endTime: event.endTime
          });
        }
      }
      
      // If there are conflicts, find alternative time slots
      if (conflicts.length > 0) {
        // Find affected users who are attending both the proposed slot and conflicting events
        const affectedUserIds = new Set<string>();
        
        // We assume that any user who is available for the proposed slot
        // and has availability information is potentially affected
        proposedSlot.attendeeIds.forEach(userId => {
          affectedUserIds.add(userId);
        });
        
        // Update availability to exclude conflicting times
        const adjustedAvailabilities = _.cloneDeep(availabilities);
        
        // For each affected user, adjust their availability to exclude conflict times
        for (const availability of adjustedAvailabilities) {
          if (affectedUserIds.has(availability.userId)) {
            const updatedTimeSlots: ITimeSlot[] = [];
            
            // Process each original time slot
            for (const slot of availability.timeSlots) {
              const slotStart = new Date(slot.startTime);
              const slotEnd = new Date(slot.endTime);
              
              // Check if this time slot conflicts with any existing event
              let hasConflict = false;
              for (const conflict of conflicts) {
                if (!(conflict.endTime <= slotStart || conflict.startTime >= slotEnd)) {
                  hasConflict = true;
                  
                  // If there's a conflict, we may need to split the time slot
                  // into before-conflict and after-conflict portions
                  
                  // Before conflict
                  if (isDateBefore(slotStart, conflict.startTime)) {
                    updatedTimeSlots.push({
                      startTime: slotStart,
                      endTime: conflict.startTime,
                      status: slot.status
                    });
                  }
                  
                  // After conflict
                  if (isDateAfter(slotEnd, conflict.endTime)) {
                    updatedTimeSlots.push({
                      startTime: conflict.endTime,
                      endTime: slotEnd,
                      status: slot.status
                    });
                  }
                }
              }
              
              // If no conflict, keep the original slot
              if (!hasConflict) {
                updatedTimeSlots.push(slot);
              }
            }
            
            // Update the availability with adjusted time slots
            availability.timeSlots = updatedTimeSlots;
          }
        }
        
        // Find alternative time slots using the adjusted availability
        const alternatives = findOptimalTimeSlots(adjustedAvailabilities, {
          minAttendees: Math.max(2, Math.ceil(proposedSlot.attendeeIds.length * 0.7)),
          minDurationMinutes: getMinutesBetweenDates(proposedSlot.startTime, proposedSlot.endTime),
          // Try to find slots with similar time of day
          preferredTimeOfDay: [proposedSlot.timeOfDay!],
          // Looking for times that are close to the original proposal
          startDate: addDaysToDate(proposedSlot.startTime, -3),
          endDate: addDaysToDate(proposedSlot.startTime, 3)
        });
        
        // Sort alternatives by similarity to original and attendance
        const scoredAlternatives = alternatives.map(alt => {
          // Calculate days difference from original
          const daysDiff = Math.abs(
            proposedSlot.startTime.getDate() - alt.startTime.getDate()
          );
          
          // Calculate time of day similarity (0 if same, otherwise penalize)
          const timeOfDaySimilarity = (proposedSlot.timeOfDay === alt.timeOfDay) ? 1 : 0.5;
          
          // Calculate attendance ratio compared to original
          const attendanceRatio = alt.attendeeIds.length / proposedSlot.attendeeIds.length;
          
          // Calculate similarity score (higher is better)
          const similarityScore = (
            (1 - (daysDiff * 0.1)) * // Closer dates are better
            timeOfDaySimilarity * // Same time of day is better
            attendanceRatio * // Higher attendance is better
            0.4 + // Weight for similarity factors
            alt.score * 0.6 // Weight for intrinsic score
          );
          
          return {
            ...alt,
            score: similarityScore
          };
        });
        
        // Sort by score (descending)
        scoredAlternatives.sort((a, b) => b.score - a.score);
        
        // Take top 3 alternatives
        const topAlternatives = scoredAlternatives.slice(0, 3);
        
        resolutions.push({
          original: proposedSlot,
          conflicts,
          alternatives: topAlternatives
        });
      } else {
        // No conflicts, just return the original time slot with empty alternatives
        resolutions.push({
          original: proposedSlot,
          conflicts: [],
          alternatives: []
        });
      }
    }
    
    logger.info(`Resolved conflicts for ${proposedTimeSlots.length} time slots`, {
      conflictsFound: resolutions.filter(r => r.conflicts.length > 0).length
    });
    
    return resolutions;
  } catch (error) {
    logger.error('Error resolving scheduling conflicts', error);
    throw error;
  }
}

/**
 * Optimizes time slot selection to maximize attendance
 * 
 * @param availabilities - Array of user availability records
 * @param options - Optimization options
 * @returns Time slots optimized for maximum attendance
 */
export function optimizeForAttendance(
  availabilities: IAvailability[],
  options: {
    startDate?: Date;
    endDate?: Date;
    minDurationMinutes?: number;
    maxDurationMinutes?: number;
    minAttendancePercentage?: number;
    attendeeWeights?: Record<string, number>;
  } = {}
): Array<{
  startTime: Date;
  endTime: Date;
  attendeeIds: string[];
  attendancePercentage: number;
  score: number;
}> {
  logger.debug('Optimizing time slots for attendance', { 
    userCount: availabilities.length, 
    options 
  });
  
  if (!availabilities || availabilities.length === 0) {
    logger.info('No availabilities provided for attendance optimization');
    return [];
  }
  
  try {
    // Default options
    const defaultOptions = {
      minDurationMinutes: 60,
      minAttendancePercentage: 50
    };
    
    // Merge provided options with defaults
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Generate candidate time slots using the findOptimalTimeSlots function
    const candidateSlots = findOptimalTimeSlots(availabilities, {
      startDate: mergedOptions.startDate,
      endDate: mergedOptions.endDate,
      minDurationMinutes: mergedOptions.minDurationMinutes,
      maxDurationMinutes: mergedOptions.maxDurationMinutes,
      attendeeWeights: mergedOptions.attendeeWeights,
      prioritizeAttendance: true // Explicitly prioritize attendance
    });
    
    // Convert to the required return format and calculate attendance percentages
    const optimizedSlots = candidateSlots.map(slot => {
      const attendancePercentage = Math.round(
        (slot.attendeeIds.length / availabilities.length) * 100
      );
      
      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        attendeeIds: slot.attendeeIds,
        attendancePercentage,
        score: slot.score
      };
    });
    
    // Filter by minimum attendance percentage if specified
    let filteredSlots = optimizedSlots;
    if (mergedOptions.minAttendancePercentage && mergedOptions.minAttendancePercentage > 0) {
      filteredSlots = optimizedSlots.filter(
        slot => slot.attendancePercentage >= mergedOptions.minAttendancePercentage!
      );
    }
    
    // Sort by attendance percentage (descending), then by score
    filteredSlots.sort((a, b) => {
      // First compare by attendance percentage
      if (b.attendancePercentage !== a.attendancePercentage) {
        return b.attendancePercentage - a.attendancePercentage;
      }
      // If attendance percentage is the same, compare by score
      return b.score - a.score;
    });
    
    logger.info(`Optimized ${filteredSlots.length} time slots for attendance`, {
      maxAttendance: filteredSlots.length > 0 ? filteredSlots[0].attendancePercentage : 0
    });
    
    return filteredSlots;
  } catch (error) {
    logger.error('Error optimizing for attendance', error);
    throw error;
  }
}

/**
 * Optimizes time slot selection for user convenience based on preferences
 * 
 * @param availabilities - Array of user availability records
 * @param userPreferences - User convenience preferences
 * @returns Time slots optimized for user convenience
 */
export function optimizeForConvenience(
  availabilities: IAvailability[],
  userPreferences: {
    preferredTimeOfDay?: TimeOfDay[];
    preferredDaysOfWeek?: number[];
    preferredLocation?: { latitude: number; longitude: number };
    maxTravelDistance?: number;
    prioritizeProximity?: boolean;
    accountForTrafficHours?: boolean;
  } = {}
): Array<{
  startTime: Date;
  endTime: Date;
  attendeeIds: string[];
  convenienceScore: number;
  factors: {
    attendanceScore: number;
    timeOfDayScore: number;
    dayOfWeekScore: number;
    locationScore?: number;
    trafficScore?: number;
  };
}> {
  logger.debug('Optimizing time slots for convenience', { 
    userCount: availabilities.length, 
    preferences: userPreferences 
  });
  
  if (!availabilities || availabilities.length === 0) {
    logger.info('No availabilities provided for convenience optimization');
    return [];
  }
  
  try {
    // Generate candidate time slots
    const candidateSlots = findOptimalTimeSlots(availabilities, {
      preferredTimeOfDay: userPreferences.preferredTimeOfDay,
      preferredDaysOfWeek: userPreferences.preferredDaysOfWeek,
      minDurationMinutes: 60, // Default minimum duration
      prioritizeAttendance: false // Prioritize convenience over pure attendance
    });
    
    // Define scoring weights for different factors
    const weights: {
      attendance: number;
      timeOfDay: number;
      dayOfWeek: number;
      location: number;
      traffic: number;
    } = {
      attendance: 0.4,
      timeOfDay: 0.3,
      dayOfWeek: 0.2,
      location: userPreferences.prioritizeProximity ? 0.3 : 0.1,
      traffic: userPreferences.accountForTrafficHours ? 0.1 : 0
    };
    
    // Adjust weights to ensure they sum to 1.0
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    Object.keys(weights).forEach(key => {
      weights[key as keyof typeof weights] /= totalWeight;
    });
    
    // Score each candidate slot for convenience
    const scoredSlots = candidateSlots.map(slot => {
      // Calculate base attendance score (normalized to 0-100)
      const attendanceScore = Math.round(
        (slot.attendeeIds.length / availabilities.length) * 100
      );
      
      // Calculate time of day score
      let timeOfDayScore = 50; // Default middle score
      if (userPreferences.preferredTimeOfDay && 
          userPreferences.preferredTimeOfDay.length > 0) {
        // Check if this slot's time of day matches any preferred time of day
        const timeOfDay = categorizeTimeOfDay(slot.startTime);
        timeOfDayScore = userPreferences.preferredTimeOfDay.includes(timeOfDay) ? 100 : 0;
      } else {
        // No specific preference, score based on common preferences
        // (higher scores for afternoon and early evening)
        const hour = slot.startTime.getHours();
        if (hour >= 10 && hour <= 18) {
          timeOfDayScore = 100; // Business hours get top score
        } else if (hour >= 8 && hour < 10) {
          timeOfDayScore = 70; // Early morning
        } else if (hour > 18 && hour <= 20) {
          timeOfDayScore = 80; // Early evening
        } else if (hour > 20 && hour <= 22) {
          timeOfDayScore = 60; // Late evening
        } else {
          timeOfDayScore = 30; // Late night/very early morning
        }
      }
      
      // Calculate day of week score
      let dayOfWeekScore = 50; // Default middle score
      if (userPreferences.preferredDaysOfWeek && 
          userPreferences.preferredDaysOfWeek.length > 0) {
        // Check if this slot's day of week matches any preferred day
        const dayOfWeek = slot.startTime.getDay();
        dayOfWeekScore = userPreferences.preferredDaysOfWeek.includes(dayOfWeek) ? 100 : 0;
      } else {
        // No specific preference, score based on common preferences
        // (higher scores for weekends)
        const dayOfWeek = slot.startTime.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          dayOfWeekScore = 90; // Weekend
        } else if (dayOfWeek === 5) {
          dayOfWeekScore = 80; // Friday
        } else if (dayOfWeek === 1) {
          dayOfWeekScore = 40; // Monday
        } else {
          dayOfWeekScore = 60; // Other weekdays
        }
      }
      
      // Calculate traffic score if enabled
      let trafficScore = 100; // Default best score
      if (userPreferences.accountForTrafficHours) {
        const hour = slot.startTime.getHours();
        const dayOfWeek = slot.startTime.getDay();
        
        // Lower scores during typical rush hours on weekdays
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
          if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
            trafficScore = 30; // Rush hour
          } else if ((hour >= 6 && hour < 7) || (hour > 9 && hour <= 10) || 
                     (hour >= 15 && hour < 16) || (hour > 18 && hour <= 19)) {
            trafficScore = 50; // Near rush hour
          }
        }
      }
      
      // Calculate location score if location preferences are provided
      let locationScore = 50; // Default middle score
      
      // Calculate weighted convenience score
      const factors: {
        attendanceScore: number;
        timeOfDayScore: number;
        dayOfWeekScore: number;
        trafficScore?: number;
        locationScore?: number;
      } = {
        attendanceScore,
        timeOfDayScore,
        dayOfWeekScore
      };
      
      if (userPreferences.accountForTrafficHours) {
        factors.trafficScore = trafficScore;
      }
      
      if (userPreferences.preferredLocation && userPreferences.maxTravelDistance) {
        factors.locationScore = locationScore;
      }
      
      const convenienceScore = Math.round(
        attendanceScore * weights.attendance +
        timeOfDayScore * weights.timeOfDay +
        dayOfWeekScore * weights.dayOfWeek +
        (factors.trafficScore ? factors.trafficScore * weights.traffic : 0) +
        (factors.locationScore ? factors.locationScore * weights.location : 0)
      );
      
      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        attendeeIds: slot.attendeeIds,
        convenienceScore,
        factors
      };
    });
    
    // Sort by convenience score (descending)
    scoredSlots.sort((a, b) => b.convenienceScore - a.convenienceScore);
    
    logger.info(`Optimized ${scoredSlots.length} time slots for convenience`, {
      maxConvenience: scoredSlots.length > 0 ? scoredSlots[0].convenienceScore : 0
    });
    
    return scoredSlots;
  } catch (error) {
    logger.error('Error optimizing for convenience', error);
    throw error;
  }
}

/**
 * Generates time slots at regular intervals within a date range
 * 
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @param durationMinutes - The duration of each time slot in minutes
 * @param options - Additional generation options
 * @returns Array of generated time slots
 */
export function generateTimeSlots(
  startDate: Date,
  endDate: Date,
  durationMinutes: number,
  options: {
    intervalMinutes?: number;
    businessHoursOnly?: boolean;
    businessHourStart?: number;
    businessHourEnd?: number;
    excludeWeekends?: boolean;
    timezone?: string;
  } = {}
): ITimeSlot[] {
  logger.debug('Generating time slots', { 
    startDate, 
    endDate, 
    durationMinutes, 
    options 
  });
  
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    logger.error('Invalid start or end date provided to generateTimeSlots');
    throw new Error('Start and end dates must be valid Date objects');
  }
  
  if (isDateAfter(startDate, endDate)) {
    logger.error('Start date is after end date in generateTimeSlots');
    throw new Error('Start date must be before end date');
  }
  
  if (durationMinutes <= 0) {
    logger.error('Invalid duration provided to generateTimeSlots');
    throw new Error('Duration must be a positive number of minutes');
  }
  
  try {
    // Default options
    const defaultOptions = {
      intervalMinutes: durationMinutes, // Default to slots with no gaps
      businessHoursOnly: false,
      businessHourStart: 9, // 9 AM
      businessHourEnd: 17, // 5 PM
      excludeWeekends: false,
      timezone: 'UTC'
    };
    
    // Merge provided options with defaults
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Convert dates to the specified timezone if needed
    let currentTime = startDate;
    const endTime = endDate;
    
    if (mergedOptions.timezone !== 'UTC') {
      currentTime = convertToTimezone(currentTime, mergedOptions.timezone);
      currentTime = convertToTimezone(endTime, mergedOptions.timezone);
    }
    
    const timeSlots: ITimeSlot[] = [];
    
    // Generate time slots
    while (isDateBefore(currentTime, endTime)) {
      // Check if the current time meets the criteria
      const hour = currentTime.getHours();
      const dayOfWeek = currentTime.getDay();
      
      let skipSlot = false;
      
      // Check business hours constraint
      if (mergedOptions.businessHoursOnly &&
          (hour < mergedOptions.businessHourStart || hour >= mergedOptions.businessHourEnd)) {
        skipSlot = true;
      }
      
      // Check weekend constraint
      if (mergedOptions.excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        skipSlot = true;
      }
      
      if (!skipSlot) {
        // Calculate end time for this slot
        const slotEndTime = addMinutesToDate(currentTime, durationMinutes);
        
        // Create the time slot
        timeSlots.push({
          startTime: new Date(currentTime),
          endTime: new Date(slotEndTime),
          status: AvailabilityStatus.AVAILABLE
        });
      }
      
      // Move to the next interval
      currentTime = addMinutesToDate(currentTime, mergedOptions.intervalMinutes);
    }
    
    logger.info(`Generated ${timeSlots.length} time slots`, {
      startDate,
      endDate,
      durationMinutes
    });
    
    return timeSlots;
  } catch (error) {
    logger.error('Error generating time slots', error);
    throw error;
  }
}

/**
 * Calculates a comprehensive score for a time slot based on multiple factors
 * 
 * @param timeSlot - The time slot to score
 * @param availabilities - User availability records
 * @param scoringOptions - Options for scoring calculation
 * @returns Score details with overall score and factor breakdown
 */
export function calculateTimeSlotScore(
  timeSlot: {
    startTime: Date;
    endTime: Date;
    attendeeIds: string[];
    timeOfDay?: TimeOfDay;
  },
  availabilities: IAvailability[],
  scoringOptions: {
    preferredTimeOfDay?: TimeOfDay[];
    preferredDaysOfWeek?: number[];
    attendeeWeights?: Record<string, number>;
    prioritizeAttendance?: boolean;
  } = {}
): {
  overallScore: number;
  factors: {
    attendanceScore: number;
    timeOfDayScore: number;
    dayOfWeekScore: number;
  };
} {
  try {
    // Total number of potential attendees
    const totalAttendees = availabilities.length;
    
    // Calculate attendance score
    const attendanceResult = calculateAttendanceScore(
      timeSlot.attendeeIds, 
      totalAttendees, 
      scoringOptions.attendeeWeights
    );
    
    // Calculate time of day score
    let timeOfDayScore = 75; // Default is a decent score
    const timeOfDay = timeSlot.timeOfDay || categorizeTimeOfDay(timeSlot.startTime);
    
    if (scoringOptions.preferredTimeOfDay && scoringOptions.preferredTimeOfDay.length > 0) {
      // Higher score if the time slot falls within preferred time of day
      timeOfDayScore = scoringOptions.preferredTimeOfDay.includes(timeOfDay) ? 100 : 50;
    } else {
      // If no preferences specified, use common preferences
      // (higher scores for afternoon and early evening)
      if (timeOfDay === TimeOfDay.AFTERNOON) {
        timeOfDayScore = 90;
      } else if (timeOfDay === TimeOfDay.EVENING) {
        timeOfDayScore = 80;
      } else {
        timeOfDayScore = 70;
      }
    }
    
    // Calculate day of week score
    let dayOfWeekScore = 75; // Default is a decent score
    const dayOfWeek = timeSlot.startTime.getDay();
    
    if (scoringOptions.preferredDaysOfWeek && scoringOptions.preferredDaysOfWeek.length > 0) {
      // Higher score if the time slot falls on a preferred day of week
      dayOfWeekScore = scoringOptions.preferredDaysOfWeek.includes(dayOfWeek) ? 100 : 50;
    } else {
      // If no preferences specified, use common preferences
      // (higher scores for weekends)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayOfWeekScore = 90; // Weekend
      } else if (dayOfWeek === 5) {
        dayOfWeekScore = 85; // Friday
      } else {
        dayOfWeekScore = 70; // Weekday
      }
    }
    
    // Calculate weights for each factor
    const weights = {
      attendance: scoringOptions.prioritizeAttendance ? 0.7 : 0.4,
      timeOfDay: scoringOptions.preferredTimeOfDay ? 0.3 : 0.2,
      dayOfWeek: scoringOptions.preferredDaysOfWeek ? 0.3 : 0.2
    };
    
    // Normalize weights to sum to 1.0
    const totalWeight = weights.attendance + weights.timeOfDay + weights.dayOfWeek;
    Object.keys(weights).forEach(key => {
      weights[key as keyof typeof weights] /= totalWeight;
    });
    
    // Calculate overall score as a weighted average
    const overallScore = Math.round(
      attendanceResult.overallScore * weights.attendance +
      timeOfDayScore * weights.timeOfDay +
      dayOfWeekScore * weights.dayOfWeek
    );
    
    return {
      overallScore,
      factors: {
        attendanceScore: attendanceResult.overallScore,
        timeOfDayScore,
        dayOfWeekScore
      }
    };
  } catch (error) {
    logger.error('Error calculating time slot score', error);
    throw error;
  }
}

/**
 * Identifies the optimal scheduling window within a date range
 * 
 * @param availabilities - Array of user availability records
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @param windowSizeDays - The size of the scheduling window in days
 * @returns Optimal scheduling window with availability metrics
 */
export function identifyOptimalSchedulingWindow(
  availabilities: IAvailability[],
  startDate: Date,
  endDate: Date,
  windowSizeDays: number
): {
  startDate: Date;
  endDate: Date;
  availabilityDensity: number;
  attendeeCount: number;
  totalAttendees: number;
  availabilityPercentage: number;
} {
  logger.debug('Identifying optimal scheduling window', { 
    startDate, 
    endDate, 
    windowSizeDays 
  });
  
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    logger.error('Invalid start or end date provided to identifyOptimalSchedulingWindow');
    throw new Error('Start and end dates must be valid Date objects');
  }
  
  if (isDateAfter(startDate, endDate)) {
    logger.error('Start date is after end date in identifyOptimalSchedulingWindow');
    throw new Error('Start date must be before end date');
  }
  
  if (windowSizeDays <= 0) {
    logger.error('Invalid window size provided to identifyOptimalSchedulingWindow');
    throw new Error('Window size must be a positive number of days');
  }
  
  try {
    // Total number of potential attendees
    const totalAttendees = availabilities.length;
    
    // Calculate the total number of days in the range
    const totalDays = Math.ceil(getMinutesBetweenDates(startDate, endDate) / (60 * 24));
    
    // If the window size is larger than the total range, return the entire range
    if (windowSizeDays >= totalDays) {
      const availableAttendees = new Set<string>();
      
      availabilities.forEach(availability => {
        // Check if the user has any availability in this range
        const hasAvailability = availability.timeSlots.some(slot => {
          const slotStart = new Date(slot.startTime);
          const slotEnd = new Date(slot.endTime);
          
          return (
            slot.status === AvailabilityStatus.AVAILABLE &&
            isDateAfter(slotEnd, startDate) &&
            isDateBefore(slotStart, endDate)
          );
        });
        
        if (hasAvailability) {
          availableAttendees.add(availability.userId);
        }
      });
      
      return {
        startDate,
        endDate,
        availabilityDensity: availableAttendees.size / totalAttendees,
        attendeeCount: availableAttendees.size,
        totalAttendees,
        availabilityPercentage: Math.round((availableAttendees.size / totalAttendees) * 100)
      };
    }
    
    // Divide the range into windows of the specified size
    const windows: Array<{
      startDate: Date;
      endDate: Date;
      availableAttendees: Set<string>;
    }> = [];
    
    let windowStart = new Date(startDate);
    while (isDateBefore(windowStart, endDate)) {
      const windowEnd = addDaysToDate(windowStart, windowSizeDays);
      
      // Adjust the last window to not exceed the end date
      const adjustedWindowEnd = isDateAfter(windowEnd, endDate) ? 
        new Date(endDate) : windowEnd;
      
      // Count the number of attendees available in this window
      const availableAttendees = new Set<string>();
      
      availabilities.forEach(availability => {
        // Check if the user has any availability in this window
        const hasAvailability = availability.timeSlots.some(slot => {
          const slotStart = new Date(slot.startTime);
          const slotEnd = new Date(slot.endTime);
          
          return (
            slot.status === AvailabilityStatus.AVAILABLE &&
            isDateAfter(slotEnd, windowStart) &&
            isDateBefore(slotStart, adjustedWindowEnd)
          );
        });
        
        if (hasAvailability) {
          availableAttendees.add(availability.userId);
        }
      });
      
      windows.push({
        startDate: windowStart,
        endDate: adjustedWindowEnd,
        availableAttendees
      });
      
      // Move to the next window
      windowStart = addDaysToDate(windowStart, 1); // Overlapping windows by moving 1 day at a time
    }
    
    // Find the window with the highest availability density
    let bestWindow = windows[0];
    let highestDensity = 0;
    
    windows.forEach(window => {
      const density = window.availableAttendees.size / totalAttendees;
      if (density > highestDensity) {
        highestDensity = density;
        bestWindow = window;
      }
    });
    
    // Return the optimal window
    return {
      startDate: bestWindow.startDate,
      endDate: bestWindow.endDate,
      availabilityDensity: highestDensity,
      attendeeCount: bestWindow.availableAttendees.size,
      totalAttendees,
      availabilityPercentage: Math.round((bestWindow.availableAttendees.size / totalAttendees) * 100)
    };
  } catch (error) {
    logger.error('Error identifying optimal scheduling window', error);
    throw error;
  }
}

/**
 * Finds common availability windows across multiple users
 * 
 * @param availabilities - Array of user availability records
 * @param options - Options for finding common windows
 * @returns Common availability windows
 */
export function findCommonAvailabilityWindows(
  availabilities: IAvailability[],
  options: {
    minRequiredUsers?: number;
    minDurationMinutes?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Array<{
  startTime: Date;
  endTime: Date;
  availableUserIds: string[];
  duration: number;
}> {
  logger.debug('Finding common availability windows', { 
    userCount: availabilities.length, 
    options 
  });
  
  if (!availabilities || availabilities.length === 0) {
    logger.info('No availabilities provided for finding common windows');
    return [];
  }
  
  try {
    // Default options
    const defaultOptions = {
      minRequiredUsers: 2,
      minDurationMinutes: 30
    };
    
    // Merge provided options with defaults
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Extract all time slots marked as AVAILABLE from all user availabilities
    const allAvailableTimeSlots: Array<{ 
      userId: string; 
      startTime: Date; 
      endTime: Date; 
    }> = [];
    
    availabilities.forEach(availability => {
      availability.timeSlots
        .filter(slot => slot.status === AvailabilityStatus.AVAILABLE)
        .forEach(slot => {
          allAvailableTimeSlots.push({
            userId: availability.userId,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime)
          });
        });
    });
    
    if (allAvailableTimeSlots.length === 0) {
      logger.info('No available time slots found in provided availabilities');
      return [];
    }
    
    // Filter time slots based on start and end date constraints
    let filteredTimeSlots = allAvailableTimeSlots;
    if (mergedOptions.startDate) {
      filteredTimeSlots = filteredTimeSlots.filter(slot => 
        isDateAfter(slot.endTime, mergedOptions.startDate!)
      );
    }
    if (mergedOptions.endDate) {
      filteredTimeSlots = filteredTimeSlots.filter(slot => 
        isDateBefore(slot.startTime, mergedOptions.endDate!)
      );
    }
    
    // Create a timeline of all time slot boundaries for efficient common window calculation
    let timeline: Array<{ 
      time: Date; 
      type: 'start' | 'end'; 
      userId: string;
    }> = [];
    
    filteredTimeSlots.forEach(slot => {
      timeline.push({ time: slot.startTime, type: 'start', userId: slot.userId });
      timeline.push({ time: slot.endTime, type: 'end', userId: slot.userId });
    });
    
    // Sort the timeline chronologically
    timeline.sort((a, b) => a.time.getTime() - b.time.getTime());
    
    // Find common availability windows
    const commonWindows: Array<{
      startTime: Date;
      endTime: Date;
      availableUserIds: string[];
      duration: number;
    }> = [];
    
    const activeUsers = new Set<string>();
    let windowStart: Date | null = null;
    let currentWindowUsers: Set<string> = new Set();
    
    timeline.forEach((point) => {
      if (point.type === 'start') {
        activeUsers.add(point.userId);
        
        // Check if we've reached the minimum required users
        if (activeUsers.size >= mergedOptions.minRequiredUsers! && !windowStart) {
          windowStart = point.time;
          currentWindowUsers = new Set(activeUsers);
        }
      } else {
        // Before removing the user, check if we need to close a window
        if (windowStart && activeUsers.size >= mergedOptions.minRequiredUsers! && 
            activeUsers.has(point.userId)) {
          
          // This user is leaving and was part of the current window
          
          // Save the current window
          const duration = getMinutesBetweenDates(windowStart, point.time);
          
          // Only save windows that meet the minimum duration
          if (duration >= mergedOptions.minDurationMinutes!) {
            commonWindows.push({
              startTime: windowStart,
              endTime: point.time,
              availableUserIds: Array.from(currentWindowUsers),
              duration
            });
          }
          
          // Update for the next window
          windowStart = point.time;
          currentWindowUsers = new Set(activeUsers);
        }
        
        // Now remove the user
        activeUsers.delete(point.userId);
        
        // Check if we've fallen below the minimum required users
        if (windowStart && activeUsers.size < mergedOptions.minRequiredUsers!) {
          windowStart = null;
          currentWindowUsers.clear();
        }
      }
    });
    
    // Sort windows by number of available users (descending), then by duration (descending)
    commonWindows.sort((a, b) => {
      if (a.availableUserIds.length !== b.availableUserIds.length) {
        return b.availableUserIds.length - a.availableUserIds.length;
      }
      return b.duration - a.duration;
    });
    
    logger.info(`Found ${commonWindows.length} common availability windows`, {
      maxUsers: commonWindows.length > 0 ? commonWindows[0].availableUserIds.length : 0
    });
    
    return commonWindows;
  } catch (error) {
    logger.error('Error finding common availability windows', error);
    throw error;
  }
}

/**
 * Applies scheduling constraints to filter and score time slots
 * 
 * @param timeSlots - Array of time slots to filter and score
 * @param constraints - Scheduling constraints to apply
 * @returns Filtered and scored time slots
 */
export function applySchedulingConstraints(
  timeSlots: CandidateTimeSlot[],
  constraints: {
    timeOfDay?: { preferred: TimeOfDay[]; required?: boolean };
    dayOfWeek?: { preferred: number[]; required?: boolean };
    duration?: { min: number; max?: number; required?: boolean };
    attendance?: { minAttendees: number; minPercentage?: number; required?: boolean };
  }
): CandidateTimeSlot[] {
  logger.debug('Applying scheduling constraints', { 
    timeSlotCount: timeSlots.length, 
    constraints 
  });
  
  if (!timeSlots || timeSlots.length === 0) {
    logger.info('No time slots provided for constraint application');
    return [];
  }
  
  try {
    let filteredSlots = [...timeSlots];
    
    // Apply time of day constraint if specified
    if (constraints.timeOfDay) {
      filteredSlots = filteredSlots.filter(slot => {
        const timeOfDay = slot.timeOfDay || categorizeTimeOfDay(slot.startTime);
        
        // Check if this time of day is in the preferred list
        const isPreferred = constraints.timeOfDay!.preferred.includes(timeOfDay);
        
        // If required and not preferred, filter out
        if (constraints.timeOfDay!.required && !isPreferred) {
          return false;
        }
        
        // Update the score based on preference match
        if (isPreferred) {
          slot.score += 20; // Bonus points for matching preferred time of day
        } else {
          slot.score -= 10; // Penalty for not matching preferred time of day
        }
        
        return true;
      });
    }
    
    // Apply day of week constraint if specified
    if (constraints.dayOfWeek) {
      filteredSlots = filteredSlots.filter(slot => {
        const dayOfWeek = slot.startTime.getDay();
        
        // Check if this day of week is in the preferred list
        const isPreferred = constraints.dayOfWeek!.preferred.includes(dayOfWeek);
        
        // If required and not preferred, filter out
        if (constraints.dayOfWeek!.required && !isPreferred) {
          return false;
        }
        
        // Update the score based on preference match
        if (isPreferred) {
          slot.score += 15; // Bonus points for matching preferred day of week
        } else {
          slot.score -= 8; // Penalty for not matching preferred day of week
        }
        
        return true;
      });
    }
    
    // Apply duration constraint if specified
    if (constraints.duration) {
      filteredSlots = filteredSlots.filter(slot => {
        const duration = getMinutesBetweenDates(slot.startTime, slot.endTime);
        
        // Check if duration is within the allowed range
        const isValid = duration >= constraints.duration!.min && 
                        (!constraints.duration!.max || duration <= constraints.duration!.max);
        
        // If required and not valid, filter out
        if (constraints.duration!.required && !isValid) {
          return false;
        }
        
        // Update the score based on duration
        if (isValid) {
          // Give bonus points based on how close the duration is to the ideal length
          const ideal = constraints.duration!.max ? 
            (constraints.duration!.min + constraints.duration!.max) / 2 : 
            constraints.duration!.min;
          
          const closeness = Math.abs(duration - ideal) / ideal;
          slot.score += Math.round(10 * (1 - closeness)); // Up to 10 bonus points
        } else {
          slot.score -= 10; // Penalty for not meeting duration requirements
        }
        
        return true;
      });
    }
    
    // Apply attendance constraint if specified
    if (constraints.attendance) {
      filteredSlots = filteredSlots.filter(slot => {
        // Check if attendance meets the minimum requirements
        const hasMinAttendees = slot.attendeeIds.length >= constraints.attendance!.minAttendees;
        
        // Calculate attendance percentage if minPercentage is specified
        let meetsPercentage = true;
        if (constraints.attendance!.minPercentage) {
          // Calculate percentage based on total possible attendees (assuming we're working with all attendeeIds in the slots)
          const totalPossibleAttendees = Math.max(...timeSlots.map(s => s.attendeeIds.length));
          const percentage = Math.round((slot.attendeeIds.length / totalPossibleAttendees) * 100);
          meetsPercentage = percentage >= constraints.attendance!.minPercentage;
        }
        
        const isValid = hasMinAttendees && meetsPercentage;
        
        // If required and not valid, filter out
        if (constraints.attendance!.required && !isValid) {
          return false;
        }
        
        // Update the score based on attendance
        if (isValid) {
          // Give bonus points based on attendance
          // Calculate percentage based on total possible attendees
          const totalPossibleAttendees = Math.max(...timeSlots.map(s => s.attendeeIds.length));
          slot.score += Math.round(25 * (slot.attendeeIds.length / totalPossibleAttendees));
        } else {
          slot.score -= 20; // Significant penalty for not meeting attendance requirements
        }
        
        return true;
      });
    }
    
    // Re-sort the filtered slots by score (descending)
    filteredSlots.sort((a, b) => b.score - a.score);
    
    logger.info(`Applied constraints, resulting in ${filteredSlots.length} matching time slots`);
    
    return filteredSlots;
  } catch (error) {
    logger.error('Error applying scheduling constraints', error);
    throw error;
  }
}

/**
 * Calculates an attendance score for a time slot based on available attendees
 * 
 * @param availableAttendeeIds - Array of user IDs who can attend
 * @param totalAttendees - Total number of potential attendees
 * @param attendeeWeights - Optional weightings for specific attendees
 * @returns Attendance score details
 */
export function calculateAttendanceScore(
  availableAttendeeIds: string[],
  totalAttendees: number,
  attendeeWeights?: Record<string, number>
): {
  attendancePercentage: number;
  weightedScore: number;
  overallScore: number;
} {
  try {
    // Calculate basic attendance percentage
    const attendancePercentage = Math.round((availableAttendeeIds.length / totalAttendees) * 100);
    
    // Initialize weighted score with the simple percentage
    let weightedScore = attendancePercentage;
    
    // Apply weights if provided
    if (attendeeWeights && Object.keys(attendeeWeights).length > 0) {
      let totalWeight = 0;
      let weightedSum = 0;
      
      // Calculate the total weight of all potential attendees
      for (let i = 0; i < availableAttendeeIds.length; i++) {
        const userId = availableAttendeeIds[i];
        const weight = attendeeWeights[userId] || 1; // Default weight is 1
        weightedSum += weight;
      }
      
      // Calculate the maximum possible weighted sum (if all attendees were available)
      for (const userId in attendeeWeights) {
        totalWeight += attendeeWeights[userId];
      }
      
      // Add weight for users not explicitly weighted
      const unweightedCount = totalAttendees - Object.keys(attendeeWeights).length;
      totalWeight += unweightedCount * 1; // Default weight is 1
      
      // Calculate the weighted score as a percentage
      weightedScore = Math.round((weightedSum / totalWeight) * 100);
    }
    
    // Calculate the overall score with non-linear scaling to prioritize higher attendance
    // This curve gives disproportionately higher scores to slots with more attendees
    const attendanceFactor = Math.pow(attendancePercentage / 100, 0.7);
    const overallScore = Math.round(Math.min(100, attendanceFactor * 120));
    
    return {
      attendancePercentage,
      weightedScore,
      overallScore
    };
  } catch (error) {
    logger.error('Error calculating attendance score', error);
    throw error;
  }
}

/**
 * Categorizes a time into morning, afternoon, or evening
 * 
 * @param date - The date to categorize
 * @returns Time of day category
 */
export function categorizeTimeOfDay(date: Date): TimeOfDay {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to categorizeTimeOfDay');
  }
  
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 12) {
    return TimeOfDay.MORNING;
  } else if (hour >= 12 && hour < 17) {
    return TimeOfDay.AFTERNOON;
  } else {
    return TimeOfDay.EVENING;
  }
}

/**
 * Class that implements advanced scheduling algorithms for finding optimal meeting times
 */
export class SchedulingAlgorithm {
  private options: {
    minAttendees: number;
    minDurationMinutes: number;
    prioritizeAttendance: boolean;
    attendeeWeights: Record<string, number>;
    preferredTimeOfDay?: TimeOfDay[];
    preferredDaysOfWeek?: number[];
    timezone: string;
  };
  
  /**
   * Initializes a new instance of the SchedulingAlgorithm class
   * 
   * @param options - Configuration options
   */
  constructor(options: any = {}) {
    // Initialize with default options
    this.options = {
      minAttendees: options.minAttendees || 2,
      minDurationMinutes: options.minDurationMinutes || 60,
      prioritizeAttendance: options.prioritizeAttendance !== false,
      attendeeWeights: options.attendeeWeights || {},
      preferredTimeOfDay: options.preferredTimeOfDay,
      preferredDaysOfWeek: options.preferredDaysOfWeek,
      timezone: options.timezone || 'UTC'
    };
  }
  
  /**
   * Finds optimal time slots based on user availability and constraints
   * 
   * @param availabilities - Array of user availability records
   * @param options - Scheduling options to override instance options
   * @returns Array of optimal time slots
   */
  findOptimalTimeSlots(
    availabilities: IAvailability[],
    options: any = {}
  ): CandidateTimeSlot[] {
    // Merge instance options with provided options
    const mergedOptions = { ...this.options, ...options };
    
    // Call the standalone function with merged options
    return findOptimalTimeSlots(availabilities, mergedOptions);
  }
  
  /**
   * Analyzes user availability patterns
   * 
   * @param availabilities - Array of user availability records
   * @returns Availability analysis
   */
  analyzeUserAvailability(availabilities: IAvailability[]): AvailabilityAnalysis {
    // Call the standalone function
    return analyzeUserAvailability(availabilities);
  }
  
  /**
   * Resolves scheduling conflicts
   * 
   * @param proposedTimeSlots - Array of proposed time slots
   * @param existingEvents - Array of existing events
   * @param availabilities - Array of user availability records
   * @returns Conflict resolution
   */
  resolveSchedulingConflicts(
    proposedTimeSlots: CandidateTimeSlot[],
    existingEvents: Array<{ startTime: Date; endTime: Date; eventId: string }>,
    availabilities: IAvailability[]
  ): Array<{
    original: CandidateTimeSlot;
    conflicts: Array<{ eventId: string; startTime: Date; endTime: Date }>;
    alternatives: CandidateTimeSlot[];
  }> {
    // Call the standalone function
    return resolveSchedulingConflicts(proposedTimeSlots, existingEvents, availabilities);
  }
  
  /**
   * Optimizes for maximum attendance
   * 
   * @param availabilities - Array of user availability records
   * @param options - Optimization options
   * @returns Attendance-optimized time slots
   */
  optimizeForAttendance(
    availabilities: IAvailability[],
    options: any = {}
  ): Array<{
    startTime: Date;
    endTime: Date;
    attendeeIds: string[];
    attendancePercentage: number;
    score: number;
  }> {
    // Merge instance options with provided options
    const mergedOptions = {
      attendeeWeights: this.options.attendeeWeights,
      minDurationMinutes: this.options.minDurationMinutes,
      ...options
    };
    
    // Call the standalone function with merged options
    return optimizeForAttendance(availabilities, mergedOptions);
  }
  
  /**
   * Optimizes for user convenience
   * 
   * @param availabilities - Array of user availability records
   * @param userPreferences - User preferences for convenience optimization
   * @returns Convenience-optimized time slots
   */
  optimizeForConvenience(
    availabilities: IAvailability[],
    userPreferences: any = {}
  ): Array<{
    startTime: Date;
    endTime: Date;
    attendeeIds: string[];
    convenienceScore: number;
    factors: {
      attendanceScore: number;
      timeOfDayScore: number;
      dayOfWeekScore: number;
      locationScore?: number;
      trafficScore?: number;
    };
  }> {
    // Merge instance options with provided preferences
    const mergedPreferences = {
      preferredTimeOfDay: this.options.preferredTimeOfDay,
      preferredDaysOfWeek: this.options.preferredDaysOfWeek,
      ...userPreferences
    };
    
    // Call the standalone function with merged preferences
    return optimizeForConvenience(availabilities, mergedPreferences);
  }
  
  /**
   * Updates the algorithm options
   * 
   * @param newOptions - New options to set
   */
  setOptions(newOptions: any): void {
    this.options = { ...this.options, ...newOptions };
  }
}