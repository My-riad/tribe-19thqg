/**
 * date.util.ts
 * 
 * Utility functions for date manipulation, validation, formatting, and calculations.
 * This module centralizes date-related operations to ensure consistent handling
 * of temporal data throughout the Tribe application.
 */

import {
  format,
  parse,
  isValid,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  addHours,
  addMinutes,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
  isSameDay as isSameDayFn,
  parseISO
} from 'date-fns'; // ^2.30.0
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'; // ^2.0.0
import { DATE_REGEX, TIME_REGEX, DATETIME_REGEX } from '../constants/regex.constants';

/**
 * Checks if a value is a valid date object or date string
 * 
 * @param value - The value to check
 * @returns True if the value is a valid date, false otherwise
 */
export const isValidDate = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (value instanceof Date) {
    return isValid(value);
  }
  
  if (typeof value === 'string') {
    const parsedDate = parseISO(value);
    return isValid(parsedDate);
  }
  
  return false;
};

/**
 * Formats a date object or date string according to the specified format
 * 
 * @param date - The date to format
 * @param formatString - The format string pattern (using date-fns format)
 * @returns The formatted date string
 */
export const formatDate = (date: Date | string, formatString: string = 'yyyy-MM-dd'): string => {
  if (!isValidDate(date)) {
    return '';
  }
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
};

/**
 * Parses a date string into a Date object
 * 
 * @param dateString - The date string to parse
 * @param formatString - The format string pattern (using date-fns parse)
 * @returns The parsed Date object or null if parsing fails
 */
export const parseDate = (dateString: string, formatString?: string): Date | null => {
  if (!dateString) {
    return null;
  }
  
  let parsedDate: Date;
  
  if (formatString) {
    // If format string is provided, use date-fns parse
    parsedDate = parse(dateString, formatString, new Date());
  } else {
    // Otherwise try to parse as ISO string
    parsedDate = parseISO(dateString);
  }
  
  if (!isValid(parsedDate)) {
    return null;
  }
  
  return parsedDate;
};

/**
 * Returns the start of day (00:00:00) for a given date
 * 
 * @param date - The reference date
 * @returns Date object representing the start of the day
 */
export const getStartOfDay = (date: Date | string): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to getStartOfDay');
  }
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(dateObj);
};

/**
 * Returns the end of day (23:59:59.999) for a given date
 * 
 * @param date - The reference date
 * @returns Date object representing the end of the day
 */
export const getEndOfDay = (date: Date | string): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to getEndOfDay');
  }
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(dateObj);
};

/**
 * Calculates the number of days between two dates
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Number of days between the dates
 */
export const getDaysBetweenDates = (startDate: Date | string, endDate: Date | string): number => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date(s) provided to getDaysBetweenDates');
  }
  
  const startDateObj = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const endDateObj = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  return Math.abs(differenceInDays(startDateObj, endDateObj));
};

/**
 * Calculates the number of hours between two dates
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Number of hours between the dates
 */
export const getHoursBetweenDates = (startDate: Date | string, endDate: Date | string): number => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date(s) provided to getHoursBetweenDates');
  }
  
  const startDateObj = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const endDateObj = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  return Math.abs(differenceInHours(startDateObj, endDateObj));
};

/**
 * Calculates the number of minutes between two dates
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns Number of minutes between the dates
 */
export const getMinutesBetweenDates = (startDate: Date | string, endDate: Date | string): number => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Invalid date(s) provided to getMinutesBetweenDates');
  }
  
  const startDateObj = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const endDateObj = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  return Math.abs(differenceInMinutes(startDateObj, endDateObj));
};

/**
 * Adds a specified number of days to a date
 * 
 * @param date - The reference date
 * @param days - Number of days to add
 * @returns New date with days added
 */
export const addDaysToDate = (date: Date | string, days: number): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to addDaysToDate');
  }
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  return addDays(dateObj, days);
};

/**
 * Adds a specified number of hours to a date
 * 
 * @param date - The reference date
 * @param hours - Number of hours to add
 * @returns New date with hours added
 */
export const addHoursToDate = (date: Date | string, hours: number): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to addHoursToDate');
  }
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  return addHours(dateObj, hours);
};

/**
 * Adds a specified number of minutes to a date
 * 
 * @param date - The reference date
 * @param minutes - Number of minutes to add
 * @returns New date with minutes added
 */
export const addMinutesToDate = (date: Date | string, minutes: number): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to addMinutesToDate');
  }
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  return addMinutes(dateObj, minutes);
};

/**
 * Checks if the first date is before the second date
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if date1 is before date2, false otherwise
 */
export const isDateBefore = (date1: Date | string, date2: Date | string): boolean => {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    throw new Error('Invalid date(s) provided to isDateBefore');
  }
  
  const date1Obj = typeof date1 === 'string' ? parseISO(date1) : date1;
  const date2Obj = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  return isBefore(date1Obj, date2Obj);
};

/**
 * Checks if the first date is after the second date
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if date1 is after date2, false otherwise
 */
export const isDateAfter = (date1: Date | string, date2: Date | string): boolean => {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    throw new Error('Invalid date(s) provided to isDateAfter');
  }
  
  const date1Obj = typeof date1 === 'string' ? parseISO(date1) : date1;
  const date2Obj = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  return isAfter(date1Obj, date2Obj);
};

/**
 * Checks if two dates fall on the same day
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same day, false otherwise
 */
export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    throw new Error('Invalid date(s) provided to isSameDay');
  }
  
  const date1Obj = typeof date1 === 'string' ? parseISO(date1) : date1;
  const date2Obj = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  return isSameDayFn(date1Obj, date2Obj);
};

/**
 * Converts a date to the specified timezone
 * 
 * @param date - The date to convert
 * @param timezone - The target timezone (e.g., 'America/New_York')
 * @returns Date converted to the specified timezone
 */
export const convertToTimezone = (date: Date | string, timezone: string): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to convertToTimezone');
  }
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  return utcToZonedTime(dateObj, timezone);
};

/**
 * Converts a date from a specific timezone to UTC
 * 
 * @param date - The date to convert
 * @param timezone - The source timezone (e.g., 'America/New_York')
 * @returns Date converted to UTC
 */
export const convertToUTC = (date: Date | string, timezone: string): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to convertToUTC');
  }
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  return zonedTimeToUtc(dateObj, timezone);
};

/**
 * Formats a date as a relative time string (e.g., '2 hours ago', 'in 3 days')
 * 
 * @param date - The date to format
 * @param baseDate - The reference date (defaults to now)
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: Date | string, baseDate?: Date | string): string => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to formatRelativeTime');
  }
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const baseDateObj = baseDate ? (typeof baseDate === 'string' ? parseISO(baseDate) : baseDate) : new Date();
  
  // Calculate differences
  const minutesDiff = differenceInMinutes(dateObj, baseDateObj);
  const hoursDiff = differenceInHours(dateObj, baseDateObj);
  const daysDiff = differenceInDays(dateObj, baseDateObj);
  
  // Determine if date is in the past or future
  const isPast = minutesDiff < 0;
  const absMinutesDiff = Math.abs(minutesDiff);
  const absHoursDiff = Math.abs(hoursDiff);
  const absDaysDiff = Math.abs(daysDiff);
  
  // Format based on the magnitude of the difference
  if (absMinutesDiff < 1) {
    return 'just now';
  } else if (absMinutesDiff < 60) {
    return isPast ? `${absMinutesDiff} minutes ago` : `in ${absMinutesDiff} minutes`;
  } else if (absHoursDiff < 24) {
    return isPast ? `${absHoursDiff} hours ago` : `in ${absHoursDiff} hours`;
  } else if (absDaysDiff < 30) {
    return isPast ? `${absDaysDiff} days ago` : `in ${absDaysDiff} days`;
  } else {
    // For longer time spans, return formatted date
    return formatDate(dateObj, 'MMM d, yyyy');
  }
};

/**
 * Gets the name of the weekday for a given date
 * 
 * @param date - The reference date
 * @param formatType - Format of the weekday name ('long' for full name, 'short' for abbreviated)
 * @returns Name of the weekday (e.g., 'Monday', 'Mon')
 */
export const getWeekdayName = (date: Date | string, formatType: 'long' | 'short' = 'long'): string => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to getWeekdayName');
  }
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const formatPattern = formatType === 'long' ? 'EEEE' : 'EEE';
  
  return format(dateObj, formatPattern);
};

/**
 * Gets the name of the month for a given date
 * 
 * @param date - The reference date
 * @param formatType - Format of the month name ('long' for full name, 'short' for abbreviated)
 * @returns Name of the month (e.g., 'January', 'Jan')
 */
export const getMonthName = (date: Date | string, formatType: 'long' | 'short' = 'long'): string => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to getMonthName');
  }
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const formatPattern = formatType === 'long' ? 'MMMM' : 'MMM';
  
  return format(dateObj, formatPattern);
};

/**
 * Checks if a given date falls on a weekend (Saturday or Sunday)
 * 
 * @param date - The date to check
 * @returns True if the date is a weekend, false otherwise
 */
export const isWeekend = (date: Date | string): boolean => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to isWeekend');
  }
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const day = dateObj.getDay();
  
  // 0 is Sunday, 6 is Saturday
  return day === 0 || day === 6;
};

/**
 * Validates if a string is in a valid date format
 * 
 * @param dateString - The string to validate
 * @param format - The expected format ('date', 'time', 'datetime')
 * @returns True if the string is a valid date format, false otherwise
 */
export const isDateStringValid = (dateString: string, format?: 'date' | 'time' | 'datetime'): boolean => {
  if (!dateString) {
    return false;
  }
  
  if (format === 'date') {
    return DATE_REGEX.test(dateString);
  } else if (format === 'time') {
    return TIME_REGEX.test(dateString);
  } else if (format === 'datetime') {
    return DATETIME_REGEX.test(dateString);
  } else {
    // If no format specified, try all formats
    return DATE_REGEX.test(dateString) || 
           TIME_REGEX.test(dateString) || 
           DATETIME_REGEX.test(dateString);
  }
};