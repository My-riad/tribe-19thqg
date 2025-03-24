import { format, parse, formatDistance, addDays, addMinutes, differenceInMinutes, isWithinInterval } from 'date-fns'; // date-fns version: ^2.29.3

/**
 * Formats a date object or string into a human-readable date string
 * @param date The date to format
 * @param formatString The format string to use (date-fns format)
 * @returns Formatted date string or empty string if date is invalid
 */
export function formatDate(date: Date | string | number | null | undefined, formatString: string): string {
  if (!date) {
    return '';
  }

  try {
    const dateObj = typeof date === 'object' ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Formats a date specifically for event display (e.g., 'Friday, July 15, 2023')
 * @param date The date to format
 * @returns Formatted event date string or empty string if date is invalid
 */
export function formatEventDate(date: Date | string | number | null | undefined): string {
  return formatDate(date, 'EEEE, MMMM d, yyyy');
}

/**
 * Formats a time specifically for event display (e.g., '7:30 PM')
 * @param time The time to format
 * @returns Formatted event time string or empty string if time is invalid
 */
export function formatEventTime(time: Date | string | number | null | undefined): string {
  return formatDate(time, 'h:mm a');
}

/**
 * Formats a date and time together for event display (e.g., 'Friday, July 15, 2023 at 7:30 PM')
 * @param dateTime The date and time to format
 * @returns Formatted event date and time string or empty string if dateTime is invalid
 */
export function formatEventDateTime(dateTime: Date | string | number | null | undefined): string {
  if (!dateTime) {
    return '';
  }

  const formattedDate = formatEventDate(dateTime);
  const formattedTime = formatEventTime(dateTime);

  if (!formattedDate || !formattedTime) {
    return '';
  }

  return `${formattedDate} at ${formattedTime}`;
}

/**
 * Formats a date relative to the current time (e.g., '2 hours ago', 'in 3 days')
 * @param date The date to format
 * @param baseDate The base date to compare against (defaults to now)
 * @returns Relative time string or empty string if date is invalid
 */
export function formatRelativeTime(
  date: Date | string | number | null | undefined,
  baseDate: Date = new Date()
): string {
  if (!date) {
    return '';
  }

  try {
    const dateObj = typeof date === 'object' ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    return formatDistance(dateObj, baseDate, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
}

/**
 * Parses a time string (e.g., '7:30 PM') into a Date object
 * @param timeString The time string to parse
 * @returns Parsed Date object or null if parsing fails
 */
export function parseTimeString(timeString: string): Date | null {
  if (!timeString) {
    return null;
  }

  try {
    // Use today's date as the base for parsing time
    const today = new Date();
    const todayString = format(today, 'yyyy-MM-dd');
    const dateTimeString = `${todayString} ${timeString}`;
    
    const parsedDate = parse(dateTimeString, 'yyyy-MM-dd h:mm a', new Date());
    
    if (isNaN(parsedDate.getTime())) {
      return null;
    }
    
    return parsedDate;
  } catch (error) {
    console.error('Error parsing time string:', error);
    return null;
  }
}

/**
 * Combines a date string and time string into a single Date object
 * @param dateString The date string (e.g., '2023-07-15')
 * @param timeString The time string (e.g., '7:30 PM')
 * @returns Combined Date object or null if either input is invalid
 */
export function combineDateAndTime(dateString: string, timeString: string): Date | null {
  if (!dateString || !timeString) {
    return null;
  }

  try {
    // Parse the date string
    const datePart = new Date(dateString);
    if (isNaN(datePart.getTime())) {
      return null;
    }

    // Parse the time string
    const timePart = parseTimeString(timeString);
    if (!timePart) {
      return null;
    }

    // Combine date and time
    const result = new Date(datePart);
    result.setHours(timePart.getHours());
    result.setMinutes(timePart.getMinutes());
    result.setSeconds(0);
    result.setMilliseconds(0);

    return result;
  } catch (error) {
    console.error('Error combining date and time:', error);
    return null;
  }
}

/**
 * Generates an array of time slots for a given day with specified interval
 * @param date The base date for the time slots
 * @param intervalMinutes The interval between time slots in minutes
 * @param startTime The start time (e.g., '9:00 AM')
 * @param endTime The end time (e.g., '5:00 PM')
 * @returns Array of time slot objects with label and value properties
 */
export function getTimeSlots(
  date: Date,
  intervalMinutes: number = 30,
  startTime: string = '9:00 AM',
  endTime: string = '5:00 PM'
): Array<{ label: string; value: string }> {
  const timeSlots: Array<{ label: string; value: string }> = [];
  
  try {
    // Parse start and end times
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);
    
    const start = combineDateAndTime(format(baseDate, 'yyyy-MM-dd'), startTime);
    const end = combineDateAndTime(format(baseDate, 'yyyy-MM-dd'), endTime);
    
    if (!start || !end) {
      return timeSlots;
    }

    // Generate time slots
    let currentTime = new Date(start);
    while (currentTime <= end) {
      const timeValue = format(currentTime, 'h:mm a');
      
      timeSlots.push({
        value: timeValue,
        label: timeValue
      });
      
      currentTime = addMinutes(currentTime, intervalMinutes);
    }
    
    return timeSlots;
  } catch (error) {
    console.error('Error generating time slots:', error);
    return timeSlots;
  }
}

/**
 * Checks if an event is happening soon (within the specified hours)
 * @param eventDate The date and time of the event
 * @param hoursThreshold The number of hours to consider as "soon"
 * @returns True if the event is within the threshold, false otherwise
 */
export function isEventSoon(eventDate: Date | string | number, hoursThreshold: number = 24): boolean {
  try {
    const eventDateTime = typeof eventDate === 'object' ? eventDate : new Date(eventDate);
    const now = new Date();
    
    if (isNaN(eventDateTime.getTime())) {
      return false;
    }
    
    // Calculate the difference in minutes
    const diffInMinutes = differenceInMinutes(eventDateTime, now);
    
    // Convert hours threshold to minutes
    const thresholdMinutes = hoursThreshold * 60;
    
    // Event is soon if it's in the future and within the threshold
    return diffInMinutes > 0 && diffInMinutes <= thresholdMinutes;
  } catch (error) {
    console.error('Error checking if event is soon:', error);
    return false;
  }
}

/**
 * Calculates the duration of an event in minutes
 * @param startTime The start time of the event
 * @param endTime The end time of the event
 * @returns Duration in minutes or 0 if inputs are invalid
 */
export function getEventDuration(startTime: Date | string | number, endTime: Date | string | number): number {
  try {
    const start = typeof startTime === 'object' ? startTime : new Date(startTime);
    const end = typeof endTime === 'object' ? endTime : new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }
    
    return differenceInMinutes(end, start);
  } catch (error) {
    console.error('Error calculating event duration:', error);
    return 0;
  }
}

/**
 * Formats a duration in minutes into a human-readable string (e.g., '2 hours 30 minutes')
 * @param durationMinutes The duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(durationMinutes: number): string {
  if (durationMinutes < 0) {
    return '0 minutes';
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  
  if (minutes > 0) {
    if (result) {
      result += ' ';
    }
    result += `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
  
  if (!result) {
    result = '0 minutes';
  }
  
  return result;
}

/**
 * Generates an array of dates within a specified range
 * @param startDate The start date of the range
 * @param endDate The end date of the range
 * @returns Array of dates within the range (inclusive)
 */
export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dateRange: Date[] = [];
  
  try {
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return dateRange;
    }
    
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    
    const lastDate = new Date(endDate);
    lastDate.setHours(0, 0, 0, 0);
    
    while (currentDate <= lastDate) {
      dateRange.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return dateRange;
  } catch (error) {
    console.error('Error generating date range:', error);
    return dateRange;
  }
}

/**
 * Checks if a date is within a specified range
 * @param date The date to check
 * @param startDate The start date of the range
 * @param endDate The end date of the range
 * @returns True if the date is within the range (inclusive), false otherwise
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  try {
    return isWithinInterval(date, { start: startDate, end: endDate });
  } catch (error) {
    console.error('Error checking if date is in range:', error);
    return false;
  }
}

/**
 * Gets the abbreviated day name for a date (e.g., 'MON', 'TUE')
 * @param date The date to get the day abbreviation for
 * @returns Abbreviated day name or empty string if date is invalid
 */
export function getDayAbbreviation(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'object' ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return formatDate(dateObj, 'EEE').toUpperCase();
  } catch (error) {
    console.error('Error getting day abbreviation:', error);
    return '';
  }
}