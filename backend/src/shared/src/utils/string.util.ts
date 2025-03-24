/**
 * String utility functions for validation, manipulation, and formatting
 * used across the Tribe application backend services.
 */

import {
  EMAIL_REGEX,
  URL_REGEX,
  ALPHA_NUMERIC_REGEX,
  ALPHA_REGEX,
  NUMERIC_REGEX
} from '../constants/regex.constants';
import { ValidationError } from '../errors/validation.error';

/**
 * Checks if a value is empty (undefined, null, empty string, or empty array/object)
 * 
 * @param value - The value to check
 * @returns True if the value is empty, false otherwise
 */
export function isEmpty(value: any): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}

/**
 * Checks if a value is a string
 * 
 * @param value - The value to check
 * @returns True if the value is a string, false otherwise
 */
export function isString(value: any): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  
  return typeof value === 'string';
}

/**
 * Validates if a string is a properly formatted email address
 * 
 * @param value - The string to validate
 * @returns True if the string is a valid email, false otherwise
 */
export function isEmail(value: string): boolean {
  if (!isString(value)) {
    return false;
  }
  
  return EMAIL_REGEX.test(value);
}

/**
 * Validates if a string is a properly formatted URL
 * 
 * @param value - The string to validate
 * @returns True if the string is a valid URL, false otherwise
 */
export function isUrl(value: string): boolean {
  if (!isString(value)) {
    return false;
  }
  
  return URL_REGEX.test(value);
}

/**
 * Checks if a string contains only alphanumeric characters
 * 
 * @param value - The string to check
 * @returns True if the string contains only alphanumeric characters, false otherwise
 */
export function isAlphaNumeric(value: string): boolean {
  if (!isString(value)) {
    return false;
  }
  
  return ALPHA_NUMERIC_REGEX.test(value);
}

/**
 * Checks if a string contains only alphabetic characters
 * 
 * @param value - The string to check
 * @returns True if the string contains only alphabetic characters, false otherwise
 */
export function isAlpha(value: string): boolean {
  if (!isString(value)) {
    return false;
  }
  
  return ALPHA_REGEX.test(value);
}

/**
 * Checks if a string contains only numeric characters
 * 
 * @param value - The string to check
 * @returns True if the string contains only numeric characters, false otherwise
 */
export function isNumeric(value: string): boolean {
  if (!isString(value)) {
    return false;
  }
  
  return NUMERIC_REGEX.test(value);
}

/**
 * Capitalizes the first letter of a string
 * 
 * @param value - The string to capitalize
 * @returns The string with the first letter capitalized
 */
export function capitalize(value: string): string {
  if (!isString(value)) {
    return '';
  }
  
  if (isEmpty(value)) {
    return '';
  }
  
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Truncates a string to a specified length and adds an ellipsis if truncated
 * 
 * @param value - The string to truncate
 * @param length - The maximum length of the string (default: 50)
 * @param suffix - The suffix to add if truncated (default: '...')
 * @returns The truncated string
 */
export function truncate(value: string, length: number = 50, suffix: string = '...'): string {
  if (!isString(value)) {
    return '';
  }
  
  if (value.length <= length) {
    return value;
  }
  
  return value.substring(0, length - suffix.length) + suffix;
}

/**
 * Converts a string to a URL-friendly slug
 * 
 * @param value - The string to slugify
 * @returns The slugified string
 */
export function slugify(value: string): string {
  if (!isString(value)) {
    return '';
  }
  
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/**
 * Escapes HTML special characters in a string to prevent XSS attacks
 * 
 * @param value - The string to escape
 * @returns The HTML-escaped string
 */
export function escapeHtml(value: string): string {
  if (!isString(value)) {
    return '';
  }
  
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Removes HTML tags from a string
 * 
 * @param value - The string to strip HTML from
 * @returns The string with HTML tags removed
 */
export function stripHtml(value: string): string {
  if (!isString(value)) {
    return '';
  }
  
  return value.replace(/<[^>]*>/g, '');
}

/**
 * Generates a random string of specified length
 * 
 * @param length - The length of the random string (default: 10)
 * @param charset - The character set to use for generation (default: alphanumeric)
 * @returns A random string
 */
export function generateRandomString(length: number = 10, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset.charAt(randomIndex);
  }
  
  return result;
}

/**
 * Formats a phone number string into a standardized format
 * 
 * @param phoneNumber - The phone number to format
 * @param format - The format to apply (default: '(XXX) XXX-XXXX' for US numbers)
 * @returns The formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string, format: string = '(XXX) XXX-XXXX'): string {
  if (!isString(phoneNumber)) {
    return '';
  }
  
  // Remove all non-numeric characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Apply the specified format
  let formattedNumber = format;
  for (let i = 0; i < digits.length && formattedNumber.includes('X'); i++) {
    formattedNumber = formattedNumber.replace('X', digits.charAt(i));
  }
  
  // Remove any remaining X placeholders
  formattedNumber = formattedNumber.replace(/X+/g, '');
  
  return formattedNumber;
}

/**
 * Masks a portion of a string with a specified character
 * 
 * @param value - The string to mask
 * @param visibleStart - Number of characters to leave visible at the start (default: 0)
 * @param visibleEnd - Number of characters to leave visible at the end (default: 0)
 * @param maskChar - The character to use for masking (default: '*')
 * @returns The masked string
 */
export function maskString(value: string, visibleStart: number = 0, visibleEnd: number = 0, maskChar: string = '*'): string {
  if (!isString(value)) {
    return '';
  }
  
  if (visibleStart < 0) visibleStart = 0;
  if (visibleEnd < 0) visibleEnd = 0;
  
  const start = value.substring(0, visibleStart);
  const end = visibleEnd > 0 ? value.substring(value.length - visibleEnd) : '';
  const maskLength = value.length - visibleStart - visibleEnd;
  
  if (maskLength <= 0) {
    return value;
  }
  
  const mask = maskChar.repeat(maskLength);
  
  return start + mask + end;
}

/**
 * Normalizes a string by removing diacritics, converting to lowercase, and trimming
 * 
 * @param value - The string to normalize
 * @returns The normalized string
 */
export function normalizeString(value: string): string {
  if (!isString(value)) {
    return '';
  }
  
  // Remove diacritics (accents)
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Convert to lowercase and trim
  return normalized.toLowerCase().trim();
}