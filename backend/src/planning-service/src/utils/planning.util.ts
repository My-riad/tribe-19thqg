import dayjs from 'dayjs'; // ^1.11.7
import { cloneDeep, sortBy, uniqBy, groupBy } from 'lodash'; // ^4.17.21
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0

import {
  IAvailability,
  ITimeSlot,
  AvailabilityStatus
} from '../models/availability.model';
import { IOptimalTimeSlot } from '../models/planning.model';
import { IVenue } from '../../../shared/src/types/event.types';
import { ICoordinates } from '../../../shared/src/types/profile.types';
import {
  isValidDate,
  addDaysToDate,
  addHoursToDate,
  addMinutesToDate,
  getMinutesBetweenDates,
  isDateBefore,
  isDateAfter
} from '../../../shared/src/utils/date.util';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Finds overlapping time slots across multiple user availabilities
 * 
 * @param availabilities - Array of user availability data
 * @param options - Options for finding overlaps (minimumDuration, minimumUsers)
 * @returns Array of overlapping time slots with user information
 */
export const findOverlappingTimeSlots = (
  availabilities: IAvailability[],
  options: {
    minimumDuration?: number; // Minimum duration in minutes
    minimumUsers?: number;    // Minimum number of users required for overlap
  } = {}
): Array<{ startTime: Date; endTime: Date; userIds: string[]; duration: number }> => {
  if (!availabilities || availabilities.length === 0) {
    return [];
  }

  logger.debug('Finding overlapping time slots', {
    availabilitiesCount: availabilities.length,
    options
  });

  // Extract all available time slots
  const allTimeSlots: Array<{
    userId: string;
    startTime: Date;
    endTime: Date;
    status: AvailabilityStatus;
  }> = [];

  availabilities.forEach(availability => {
    availability.timeSlots.forEach(slot => {
      if (slot.status === AvailabilityStatus.AVAILABLE) {
        allTimeSlots.push({
          userId: availability.userId,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
          status: slot.status
        });
      }
    });
  });

  if (allTimeSlots.length === 0) {
    return [];
  }

  // Create a timeline of all time slot boundaries
  const timeline: Array<{
    time: Date;
    isStart: boolean;
    userId: string;
  }> = [];

  allTimeSlots.forEach(slot => {
    timeline.push({
      time: slot.startTime,
      isStart: true,
      userId: slot.userId
    });
    timeline.push({
      time: slot.endTime,
      isStart: false,
      userId: slot.userId
    });
  });

  // Sort the timeline chronologically
  timeline.sort((a, b) => a.time.getTime() - b.time.getTime());

  // Find overlapping periods
  const overlaps: Array<{
    startTime: Date;
    endTime: Date;
    userIds: string[];
    duration: number;
  }> = [];

  const activeUsers = new Set<string>();
  let currentStartTime: Date | null = null;

  for (let i = 0; i < timeline.length; i++) {
    const event = timeline[i];

    if (event.isStart) {
      // User becomes available
      activeUsers.add(event.userId);

      // Check if this is the start of an overlap
      if (
        activeUsers.size >= (options.minimumUsers || 2) &&
        currentStartTime === null
      ) {
        currentStartTime = event.time;
      }
    } else {
      // User becomes unavailable
      activeUsers.delete(event.userId);

      // Check if this is the end of an overlap
      if (
        currentStartTime !== null &&
        (activeUsers.size < (options.minimumUsers || 2) || i === timeline.length - 1)
      ) {
        const endTime = event.time;
        
        // Calculate duration in minutes
        const durationMinutes = getMinutesBetweenDates(currentStartTime, endTime);
        
        // Check if overlap meets minimum duration requirement
        if (!options.minimumDuration || durationMinutes >= options.minimumDuration) {
          // Get unique user IDs for this overlap period
          const overlapUserIds: string[] = [];
          
          // Find users who were available during this entire period
          allTimeSlots.forEach(slot => {
            if (
              isDateBefore(slot.startTime, currentStartTime) || 
              slot.startTime.getTime() === currentStartTime.getTime()
            ) {
              if (
                isDateAfter(slot.endTime, endTime) || 
                slot.endTime.getTime() === endTime.getTime()
              ) {
                if (!overlapUserIds.includes(slot.userId)) {
                  overlapUserIds.push(slot.userId);
                }
              }
            }
          });
          
          // Only add if we still meet the minimum users requirement
          if (overlapUserIds.length >= (options.minimumUsers || 2)) {
            overlaps.push({
              startTime: currentStartTime,
              endTime,
              userIds: overlapUserIds,
              duration: durationMinutes
            });
          }
        }
        
        currentStartTime = null;
      }
    }
  }

  // Sort overlaps by number of users (descending), then duration (descending)
  return overlaps.sort((a, b) => {
    // Sort by user count first (descending)
    if (b.userIds.length !== a.userIds.length) {
      return b.userIds.length - a.userIds.length;
    }
    
    // Then sort by duration (descending)
    return b.duration - a.duration;
  });
};

/**
 * Calculates attendance metrics for a time slot based on user availability
 * 
 * @param timeSlot - The time slot with attendee information
 * @param totalMembers - The total number of tribe members
 * @returns Attendance metrics including score, percentage, and counts
 */
export const calculateAttendanceMetrics = (
  timeSlot: { userIds: string[] } | { attendees: string[] },
  totalMembers: number
): {
  attendanceScore: number;
  attendancePercentage: number;
  attendeeCount: number;
  totalAttendees: number;
} => {
  // Handle different property names (userIds or attendees)
  const attendeeCount = 'userIds' in timeSlot 
    ? timeSlot.userIds.length 
    : 'attendees' in timeSlot 
      ? timeSlot.attendees.length 
      : 0;
  
  // Calculate percentage of total members attending
  const attendancePercentage = Math.round((attendeeCount / totalMembers) * 100);
  
  // Calculate attendance score using weighted formula
  // This gives higher scores to slots with higher attendance percentages
  // but also considers the absolute number of attendees
  const attendanceScore = Math.round(
    (0.7 * attendancePercentage) + // 70% weight to percentage (relative attendance)
    (0.3 * Math.min(attendeeCount / 8 * 100, 100)) // 30% weight to absolute attendance (max 8 members)
  );
  
  return {
    attendanceScore,
    attendancePercentage,
    attendeeCount,
    totalAttendees: totalMembers
  };
};

/**
 * Formats a time slot into a human-readable string
 * 
 * @param timeSlot - The time slot to format
 * @param format - The format string to use (default: 'h:mm A')
 * @returns Formatted time slot string (e.g., "2:00 PM - 4:00 PM")
 */
export const formatTimeSlot = (
  timeSlot: { startTime: Date; endTime: Date },
  format: string = 'h:mm A'
): string => {
  if (!timeSlot || !timeSlot.startTime || !timeSlot.endTime) {
    return '';
  }
  
  // Validate dates
  if (!isValidDate(timeSlot.startTime) || !isValidDate(timeSlot.endTime)) {
    return '';
  }
  
  // Format the start and end times
  const start = dayjs(timeSlot.startTime).format(format);
  const end = dayjs(timeSlot.endTime).format(format);
  
  return `${start} - ${end}`;
};

/**
 * Calculates the central location (centroid) from multiple coordinates
 * 
 * @param locations - Array of geographic coordinates
 * @returns Central coordinates or null if no valid locations provided
 */
export const calculateCentralLocation = (
  locations: ICoordinates[]
): ICoordinates | null => {
  if (!locations || locations.length === 0) {
    return null;
  }
  
  // Filter out invalid coordinates
  const validLocations = locations.filter(
    loc => loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
  );
  
  if (validLocations.length === 0) {
    return null;
  }
  
  // Calculate sum of latitudes and longitudes
  const sumLat = validLocations.reduce((sum, loc) => sum + loc.latitude, 0);
  const sumLng = validLocations.reduce((sum, loc) => sum + loc.longitude, 0);
  
  // Calculate average (centroid)
  return {
    latitude: sumLat / validLocations.length,
    longitude: sumLng / validLocations.length
  };
};

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * 
 * @param point1 - First coordinate
 * @param point2 - Second coordinate
 * @returns Distance in miles
 */
export const calculateDistance = (
  point1: ICoordinates,
  point2: ICoordinates
): number => {
  if (!point1 || !point2) {
    return 0;
  }
  
  // Validate coordinates
  if (
    typeof point1.latitude !== 'number' || 
    typeof point1.longitude !== 'number' ||
    typeof point2.latitude !== 'number' || 
    typeof point2.longitude !== 'number'
  ) {
    return 0;
  }
  
  // Convert latitude and longitude from degrees to radians
  const lat1 = (point1.latitude * Math.PI) / 180;
  const lon1 = (point1.longitude * Math.PI) / 180;
  const lat2 = (point2.latitude * Math.PI) / 180;
  const lon2 = (point2.longitude * Math.PI) / 180;
  
  // Haversine formula
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Earth's radius in kilometers
  const earthRadius = 6371;
  
  // Calculate distance in kilometers
  const distanceKm = earthRadius * c;
  
  // Convert to miles (1 km ≈ 0.621371 miles)
  const distanceMiles = distanceKm * 0.621371;
  
  return distanceMiles;
};

/**
 * Generates time slots within a date range at specified intervals
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @param durationMinutes - Duration of each time slot in minutes
 * @param intervalMinutes - Interval between slot start times in minutes
 * @returns Array of generated time slots
 */
export const generateTimeSlots = (
  startDate: Date,
  endDate: Date,
  durationMinutes: number = 60,
  intervalMinutes: number = 30
): ITimeSlot[] => {
  // Validate inputs
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    logger.error('Invalid dates provided to generateTimeSlots');
    return [];
  }
  
  if (durationMinutes <= 0 || intervalMinutes <= 0) {
    logger.error('Duration and interval must be positive values');
    return [];
  }
  
  if (isDateAfter(startDate, endDate)) {
    logger.error('Start date must be before end date');
    return [];
  }
  
  const timeSlots: ITimeSlot[] = [];
  let currentTime = new Date(startDate);
  
  while (isDateBefore(currentTime, endDate)) {
    const slotEndTime = addMinutesToDate(currentTime, durationMinutes);
    
    // Only add the slot if its end time doesn't exceed the overall end date
    if (!isDateAfter(slotEndTime, endDate)) {
      timeSlots.push({
        startTime: new Date(currentTime),
        endTime: slotEndTime,
        status: AvailabilityStatus.AVAILABLE
      });
    }
    
    // Move to the next interval
    currentTime = addMinutesToDate(currentTime, intervalMinutes);
  }
  
  return timeSlots;
};

/**
 * Filters time slots based on user preferences
 * 
 * @param timeSlots - Array of time slots to filter
 * @param preferences - User preferences for filtering
 * @returns Filtered array of time slots
 */
export const filterTimeSlotsByPreferences = (
  timeSlots: ITimeSlot[],
  preferences: {
    preferredDays?: number[];  // Days of week (0 = Sunday, 6 = Saturday)
    preferredTimeRanges?: Array<{ start: string; end: string }>;
    minimumDuration?: number;  // Minimum duration in minutes
  }
): ITimeSlot[] => {
  if (!timeSlots || timeSlots.length === 0) {
    return [];
  }
  
  // Create a clone to avoid modifying the original array
  let filteredSlots = cloneDeep(timeSlots);
  
  // Filter by preferred days of the week
  if (preferences.preferredDays && preferences.preferredDays.length > 0) {
    filteredSlots = filteredSlots.filter(slot => {
      const day = slot.startTime.getDay();
      return preferences.preferredDays.includes(day);
    });
  }
  
  // Filter by preferred time ranges
  if (preferences.preferredTimeRanges && preferences.preferredTimeRanges.length > 0) {
    filteredSlots = filteredSlots.filter(slot => {
      const slotHour = slot.startTime.getHours();
      const slotMinute = slot.startTime.getMinutes();
      const slotTimeValue = slotHour * 60 + slotMinute;
      
      // Check if this slot starts within any preferred time range
      return preferences.preferredTimeRanges.some(range => {
        // Parse time range start and end
        const [startHour, startMinute] = range.start.split(':').map(Number);
        const [endHour, endMinute] = range.end.split(':').map(Number);
        
        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
          return false;
        }
        
        const rangeStartValue = startHour * 60 + startMinute;
        const rangeEndValue = endHour * 60 + endMinute;
        
        return slotTimeValue >= rangeStartValue && slotTimeValue <= rangeEndValue;
      });
    });
  }
  
  // Filter by minimum duration
  if (preferences.minimumDuration && preferences.minimumDuration > 0) {
    filteredSlots = filteredSlots.filter(slot => {
      const durationMinutes = getMinutesBetweenDates(slot.startTime, slot.endTime);
      return durationMinutes >= preferences.minimumDuration;
    });
  }
  
  return filteredSlots;
};

/**
 * Merges adjacent or overlapping time slots into continuous blocks
 * 
 * @param timeSlots - Array of time slots to merge
 * @param maxGapMinutes - Maximum gap between slots to consider them adjacent (default: 0)
 * @returns Array of merged time slots
 */
export const mergeAdjacentTimeSlots = (
  timeSlots: ITimeSlot[],
  maxGapMinutes: number = 0
): ITimeSlot[] => {
  if (!timeSlots || timeSlots.length <= 1) {
    return [...timeSlots];
  }
  
  // Sort time slots by start time
  const sortedSlots = sortBy(timeSlots, slot => slot.startTime.getTime());
  
  const mergedSlots: ITimeSlot[] = [];
  let currentSlot = cloneDeep(sortedSlots[0]);
  
  for (let i = 1; i < sortedSlots.length; i++) {
    const nextSlot = sortedSlots[i];
    
    // Check if the next slot overlaps or is adjacent to current slot
    const gapMinutes = getMinutesBetweenDates(currentSlot.endTime, nextSlot.startTime);
    
    if (
      // Slots overlap or are exactly adjacent
      currentSlot.endTime.getTime() >= nextSlot.startTime.getTime() ||
      // Or the gap is within the allowed maximum
      gapMinutes <= maxGapMinutes
    ) {
      // Extend the current slot's end time if the next slot ends later
      if (nextSlot.endTime.getTime() > currentSlot.endTime.getTime()) {
        currentSlot.endTime = new Date(nextSlot.endTime);
      }
    } else {
      // If not adjacent, add the current slot to results and start a new one
      mergedSlots.push(currentSlot);
      currentSlot = cloneDeep(nextSlot);
    }
  }
  
  // Add the last slot
  mergedSlots.push(currentSlot);
  
  return mergedSlots;
};

/**
 * Ranks time slots by attendance metrics and other factors
 * 
 * @param timeSlotWithMetrics - Array of time slots with their metrics
 * @returns Ranked time slots with rank field added
 */
export const rankTimeSlotsByAttendance = (
  timeSlotWithMetrics: Array<{
    timeSlot: ITimeSlot | IOptimalTimeSlot;
    metrics: {
      attendanceScore: number;
      attendancePercentage: number;
      attendeeCount: number;
      totalAttendees: number;
    };
  }>
): Array<{
  timeSlot: ITimeSlot | IOptimalTimeSlot;
  metrics: {
    attendanceScore: number;
    attendancePercentage: number;
    attendeeCount: number;
    totalAttendees: number;
  };
  rank: number;
}> => {
  if (!timeSlotWithMetrics || timeSlotWithMetrics.length === 0) {
    return [];
  }
  
  // Clone to avoid modifying the original
  const slots = cloneDeep(timeSlotWithMetrics);
  
  // First sort by attendance score (descending)
  slots.sort((a, b) => b.metrics.attendanceScore - a.metrics.attendanceScore);
  
  // If scores are tied, prioritize by duration (longer is better)
  slots.sort((a, b) => {
    if (b.metrics.attendanceScore === a.metrics.attendanceScore) {
      const aDuration = getMinutesBetweenDates(a.timeSlot.startTime, a.timeSlot.endTime);
      const bDuration = getMinutesBetweenDates(b.timeSlot.startTime, b.timeSlot.endTime);
      return bDuration - aDuration;
    }
    return 0; // Keep previous sort order
  });
  
  // If attendance and duration are tied, prioritize by start time (earlier is better)
  slots.sort((a, b) => {
    if (
      b.metrics.attendanceScore === a.metrics.attendanceScore &&
      getMinutesBetweenDates(a.timeSlot.startTime, a.timeSlot.endTime) ===
      getMinutesBetweenDates(b.timeSlot.startTime, b.timeSlot.endTime)
    ) {
      return a.timeSlot.startTime.getTime() - b.timeSlot.startTime.getTime();
    }
    return 0; // Keep previous sort order
  });
  
  // Assign rank based on position in sorted array
  return slots.map((slot, index) => ({
    ...slot,
    rank: index + 1
  }));
};

/**
 * Calculates a suitability score for a venue based on various factors
 * 
 * @param venue - The venue to calculate scores for
 * @param preferences - User preferences for venue scoring
 * @returns The venue with suitability scores added
 */
export const calculateVenueSuitabilityScore = (
  venue: IVenue,
  preferences: {
    preferredLocation?: ICoordinates;
    maxDistance?: number;
    expectedGroupSize?: number;
    budgetRange?: { min: number; max: number };
    accessibilityRequirements?: string[];
  }
): {
  venue: IVenue;
  distanceScore: number;
  capacityScore: number;
  budgetScore: number;
  accessibilityScore: number;
  overallScore: number;
} => {
  if (!venue) {
    throw new Error('Venue is required for suitability calculation');
  }
  
  const pref = {
    preferredLocation: preferences.preferredLocation || null,
    maxDistance: preferences.maxDistance || 25, // Default to 25 miles
    expectedGroupSize: preferences.expectedGroupSize || 6, // Default to average tribe size
    budgetRange: preferences.budgetRange || { min: 0, max: 100 }, // Default budget range
    accessibilityRequirements: preferences.accessibilityRequirements || []
  };
  
  // Calculate distance score (higher score for venues closer to preferred location)
  let distanceScore = 100; // Default to perfect score if no location preference
  
  if (pref.preferredLocation && venue.coordinates) {
    const distance = calculateDistance(pref.preferredLocation, venue.coordinates);
    // Linear score calculation: 100 at 0 miles, 0 at or beyond max distance
    distanceScore = Math.max(0, 100 - (distance / pref.maxDistance * 100));
  }
  
  // Calculate capacity score (higher score for venues with capacity close to group size)
  let capacityScore = 50; // Default to neutral score if capacity unknown
  
  if (typeof venue.capacity === 'number') {
    // Perfect score if capacity matches exactly, decrease as difference increases
    const capacityDifference = Math.abs(venue.capacity - pref.expectedGroupSize);
    const capacityRatio = capacityDifference / pref.expectedGroupSize;
    capacityScore = Math.max(0, 100 - (capacityRatio * 100));
    
    // Penalize more heavily for under-capacity than over-capacity
    if (venue.capacity < pref.expectedGroupSize) {
      capacityScore = Math.max(0, capacityScore - 20); // Additional penalty
    }
  }
  
  // Calculate budget score (higher score for venues within budget range)
  let budgetScore = 50; // Default to neutral score
  
  if (typeof venue.priceLevel === 'number') {
    // Convert price level (1-4) to estimated cost
    const estimatedCost = venue.priceLevel * 25; // Rough conversion
    
    // Perfect score if within budget range
    if (estimatedCost >= pref.budgetRange.min && estimatedCost <= pref.budgetRange.max) {
      budgetScore = 100;
    } else {
      // Calculate how far outside budget range (as percentage of range)
      const budgetRange = pref.budgetRange.max - pref.budgetRange.min;
      
      if (estimatedCost < pref.budgetRange.min) {
        // Under budget (less penalty)
        const deviation = (pref.budgetRange.min - estimatedCost) / budgetRange;
        budgetScore = Math.max(0, 100 - (deviation * 50)); // 50% penalty factor
      } else {
        // Over budget (more penalty)
        const deviation = (estimatedCost - pref.budgetRange.max) / budgetRange;
        budgetScore = Math.max(0, 100 - (deviation * 100)); // 100% penalty factor
      }
    }
  }
  
  // Calculate accessibility score
  let accessibilityScore = 100; // Default to perfect score
  
  if (pref.accessibilityRequirements.length > 0) {
    // If venue has accessibility info
    if (venue.metadata && venue.metadata.accessibility) {
      const venueAccessibility = venue.metadata.accessibility || [];
      
      // Calculate percentage of required features available
      const matchedFeatures = pref.accessibilityRequirements.filter(req => 
        venueAccessibility.includes(req)
      );
      
      accessibilityScore = Math.round(
        (matchedFeatures.length / pref.accessibilityRequirements.length) * 100
      );
    } else {
      // No accessibility info available
      accessibilityScore = 0; // Assume worst case
    }
  }
  
  // Calculate overall score with weighted components
  const overallScore = Math.round(
    (0.35 * distanceScore) +    // 35% weight to distance
    (0.25 * budgetScore) +      // 25% weight to budget
    (0.20 * capacityScore) +    // 20% weight to capacity
    (0.20 * accessibilityScore) // 20% weight to accessibility
  );
  
  return {
    venue,
    distanceScore,
    capacityScore,
    budgetScore,
    accessibilityScore,
    overallScore
  };
};

/**
 * Generates a schedule of reminders for an event
 * 
 * @param eventDate - The date of the event
 * @param options - Options for reminder generation
 * @returns Array of scheduled reminders
 */
export const generateReminderSchedule = (
  eventDate: Date,
  options: {
    includeWeekBefore?: boolean;
    includeDayBefore?: boolean;
    includeHoursBefore?: boolean;
    includePostEvent?: boolean;
  } = {
    includeWeekBefore: true,
    includeDayBefore: true,
    includeHoursBefore: true,
    includePostEvent: true
  }
): Array<{
  type: string;
  scheduledTime: Date;
}> => {
  if (!isValidDate(eventDate)) {
    throw new Error('Invalid event date provided to generateReminderSchedule');
  }
  
  const eventTime = new Date(eventDate).getTime();
  const now = new Date().getTime();
  const reminders: Array<{
    type: string;
    scheduledTime: Date;
  }> = [];
  
  // One week before reminder
  const weekBeforeTime = addDaysToDate(eventDate, -7);
  if (options.includeWeekBefore !== false && weekBeforeTime.getTime() > now) {
    reminders.push({
      type: 'one_week_before',
      scheduledTime: weekBeforeTime
    });
  }
  
  // Three days before reminder
  const threeDaysBeforeTime = addDaysToDate(eventDate, -3);
  if (options.includeDayBefore !== false && threeDaysBeforeTime.getTime() > now) {
    reminders.push({
      type: 'three_days_before',
      scheduledTime: threeDaysBeforeTime
    });
  }
  
  // One day before reminder
  const oneDayBeforeTime = addDaysToDate(eventDate, -1);
  if (options.includeDayBefore !== false && oneDayBeforeTime.getTime() > now) {
    reminders.push({
      type: 'one_day_before',
      scheduledTime: oneDayBeforeTime
    });
  }
  
  // Three hours before reminder
  const threeHoursBeforeTime = addHoursToDate(eventDate, -3);
  if (options.includeHoursBefore !== false && threeHoursBeforeTime.getTime() > now) {
    reminders.push({
      type: 'three_hours_before',
      scheduledTime: threeHoursBeforeTime
    });
  }
  
  // Event start notification
  if (eventTime > now) {
    reminders.push({
      type: 'event_start',
      scheduledTime: new Date(eventDate)
    });
  }
  
  // Post-event feedback reminder (3 hours after)
  const postEventTime = addHoursToDate(eventDate, 3);
  if (options.includePostEvent !== false && postEventTime.getTime() > now) {
    reminders.push({
      type: 'post_event_feedback',
      scheduledTime: postEventTime
    });
  }
  
  return reminders;
};