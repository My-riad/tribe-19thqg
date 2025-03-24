/**
 * regex.constants.ts
 * 
 * Standardized regular expression patterns for data validation across the Tribe platform.
 * These patterns ensure consistent validation of user inputs including emails, passwords,
 * usernames, and other formatted data throughout the application's microservices.
 */

/**
 * Validates email addresses in standard format (user@domain.tld)
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates password complexity according to Tribe security policies:
 * - Minimum 10 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@$!%*?&)
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;

/**
 * Validates username format:
 * - 3-30 characters
 * - Allowed characters: alphanumeric, periods, underscores, hyphens
 */
export const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

/**
 * Validates phone number formats across different regional patterns
 * Based on E.164 standard (international telecommunication numbering plan)
 * Examples: +1234567890, 1234567890
 */
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * Validates properly formatted URLs with various protocols
 * Supports http, https protocols and various domain extensions
 */
export const URL_REGEX = /^(https?:\/\/)?([a-z\d.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

/**
 * Validates UUID format for database IDs and references
 * Supports UUID v1-v5 formats (case-insensitive)
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates date strings in ISO format (YYYY-MM-DD)
 */
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates time strings in 24-hour format (HH:MM:SS)
 */
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

/**
 * Validates ISO 8601 datetime strings (YYYY-MM-DDTHH:MM:SSZ)
 * Supports timezone offset formats (Z, +/-HH:MM)
 */
export const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Validates latitude coordinates (-90 to 90 degrees)
 */
export const LATITUDE_REGEX = /^-?([0-8]?\d(\.\d+)?|90(\.0+)?)$/;

/**
 * Validates longitude coordinates (-180 to 180 degrees)
 */
export const LONGITUDE_REGEX = /^-?((1[0-7]\d(\.\d+)?)|([0-9]?\d(\.\d+)?)|180(\.0+)?)$/;

/**
 * Validates US ZIP code formats (5-digit and ZIP+4)
 * Examples: 12345, 12345-6789
 */
export const ZIPCODE_REGEX = /^\d{5}(-\d{4})?$/;

/**
 * Validates strings containing only letters and numbers
 */
export const ALPHA_NUMERIC_REGEX = /^[a-zA-Z0-9]+$/;

/**
 * Validates strings containing only letters
 */
export const ALPHA_REGEX = /^[a-zA-Z]+$/;

/**
 * Validates strings containing only numbers
 */
export const NUMERIC_REGEX = /^\d+$/;