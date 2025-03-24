import { VALIDATION_ERRORS } from '../constants/errorMessages';
import { Coordinates } from '../types/profile.types';

// Regular expressions for validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const LATITUDE_REGEX = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/;
const LONGITUDE_REGEX = /^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;

/**
 * Validates that a field has a non-empty value
 * @param value - The value to validate
 * @returns Error message if validation fails, undefined if validation passes
 */
export const isRequired = (value: any): string | undefined => {
  if (value === undefined || value === null || value === '') {
    return VALIDATION_ERRORS.REQUIRED_FIELD;
  }
  return undefined;
};

/**
 * Validates that a string is a properly formatted email address
 * @param email - The email to validate
 * @returns Error message if validation fails, undefined if validation passes
 */
export const isEmail = (email: string): string | undefined => {
  if (email === undefined || email === null) {
    return VALIDATION_ERRORS.REQUIRED_FIELD;
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return VALIDATION_ERRORS.INVALID_EMAIL;
  }
  
  return undefined;
};

/**
 * Validates that a string meets password complexity requirements
 * @param password - The password to validate
 * @returns Error message if validation fails, undefined if validation passes
 */
export const isPassword = (password: string): string | undefined => {
  if (password === undefined || password === null) {
    return VALIDATION_ERRORS.REQUIRED_FIELD;
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    return VALIDATION_ERRORS.INVALID_PASSWORD;
  }
  
  return undefined;
};

/**
 * Validates that two password strings match
 * @param password - The password
 * @param confirmPassword - The confirmation password
 * @returns Error message if validation fails, undefined if validation passes
 */
export const isPasswordMatch = (password: string, confirmPassword: string): string | undefined => {
  if (password === undefined || password === null || confirmPassword === undefined || confirmPassword === null) {
    return VALIDATION_ERRORS.REQUIRED_FIELD;
  }
  
  if (password !== confirmPassword) {
    return VALIDATION_ERRORS.PASSWORDS_DO_NOT_MATCH;
  }
  
  return undefined;
};

/**
 * Validates that a string is a properly formatted phone number
 * @param phone - The phone number to validate
 * @returns Error message if validation fails, undefined if validation passes
 */
export const isPhone = (phone: string): string | undefined => {
  if (phone === undefined || phone === null) {
    return undefined; // Phone may be optional
  }
  
  if (!PHONE_REGEX.test(phone)) {
    return VALIDATION_ERRORS.INVALID_PHONE;
  }
  
  return undefined;
};

/**
 * Validates that a string is a properly formatted date
 * @param date - The date string to validate (YYYY-MM-DD)
 * @returns Error message if validation fails, undefined if validation passes
 */
export const isDate = (date: string): string | undefined => {
  if (date === undefined || date === null) {
    return undefined; // Date may be optional
  }
  
  if (!DATE_REGEX.test(date)) {
    return VALIDATION_ERRORS.INVALID_DATE;
  }
  
  return undefined;
};

/**
 * Validates that a string is a properly formatted URL
 * @param url - The URL to validate
 * @returns Error message if validation fails, undefined if validation passes
 */
export const isUrl = (url: string): string | undefined => {
  if (url === undefined || url === null) {
    return undefined; // URL may be optional
  }
  
  if (!URL_REGEX.test(url)) {
    return 'Please enter a valid URL';
  }
  
  return undefined;
};

/**
 * Validates that a string does not exceed a maximum length
 * @param text - The text to validate
 * @param maxLength - The maximum allowed length
 * @returns Error message if validation fails, undefined if validation passes
 */
export const maxLength = (text: string, maxLength: number): string | undefined => {
  if (text === undefined || text === null) {
    return undefined; // Text may be optional
  }
  
  if (text.length > maxLength) {
    return VALIDATION_ERRORS.TEXT_TOO_LONG;
  }
  
  return undefined;
};

/**
 * Validates that a date represents a user who is at least 18 years old
 * @param birthdate - The birthdate to validate
 * @returns Error message if validation fails, undefined if validation passes
 */
export const isValidAge = (birthdate: string | Date): string | undefined => {
  if (birthdate === undefined || birthdate === null) {
    return undefined; // Birthdate may be optional
  }
  
  const birthdateObj = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
  
  if (isNaN(birthdateObj.getTime())) {
    return VALIDATION_ERRORS.INVALID_DATE;
  }
  
  const today = new Date();
  let age = today.getFullYear() - birthdateObj.getFullYear();
  const m = today.getMonth() - birthdateObj.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthdateObj.getDate())) {
    age--;
  }
  
  if (age < 18) {
    return VALIDATION_ERRORS.INVALID_AGE;
  }
  
  return undefined;
};

/**
 * Validates that coordinates are valid latitude and longitude values
 * @param coordinates - The coordinates to validate
 * @returns Error message if validation fails, undefined if validation passes
 */
export const isValidCoordinates = (coordinates: Coordinates): string | undefined => {
  if (coordinates === undefined || coordinates === null) {
    return undefined; // Coordinates may be optional
  }
  
  if (
    coordinates.latitude === undefined ||
    coordinates.longitude === undefined ||
    !LATITUDE_REGEX.test(String(coordinates.latitude)) || 
    !LONGITUDE_REGEX.test(String(coordinates.longitude))
  ) {
    return VALIDATION_ERRORS.INVALID_LOCATION;
  }
  
  return undefined;
};

/**
 * Validates a form object against a set of validation rules
 * @param formData - The form data to validate
 * @param validationRules - Object mapping field names to validation functions
 * @returns Object containing validation errors for each field that failed validation
 */
export const validateForm = (
  formData: Record<string, any>,
  validationRules: Record<string, (value: any) => string | undefined>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  for (const field in validationRules) {
    if (Object.prototype.hasOwnProperty.call(validationRules, field)) {
      const validate = validationRules[field];
      const value = formData[field];
      const error = validate(value);
      
      if (error) {
        errors[field] = error;
      }
    }
  }
  
  return errors;
};