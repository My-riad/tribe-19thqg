import { format } from 'date-fns';
import { Coordinates } from '../types/profile.types';
import { WeatherData, WeatherCondition } from '../types/event.types';

/**
 * Formats a number as currency with the specified currency code
 * @param amount - The number to format
 * @param currencyCode - The ISO currency code (default: 'USD')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | string, currencyCode = 'USD'): string => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(0);
  }
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(numericAmount);
};

/**
 * Formats a number with the specified number of decimal places and thousands separators
 * @param value - The number to format
 * @param decimalPlaces - The number of decimal places to include (default: 2)
 * @returns Formatted number string
 */
export const formatNumber = (value: number | string, decimalPlaces = 2): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0';
  }
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(numericValue);
};

/**
 * Formats a number as a percentage with the specified number of decimal places
 * @param value - The number to format (can be 0-100 or 0-1)
 * @param decimalPlaces - The number of decimal places to include (default: 0)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number | string, decimalPlaces = 0): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0%';
  }
  
  let numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Convert from decimal to percentage if value is between 0 and 1
  if (numericValue > 0 && numericValue < 1) {
    numericValue = numericValue * 100;
  }
  
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(numericValue)}%`;
};

/**
 * Formats a phone number string into a standardized format
 * @param phoneNumber - The phone number to format
 * @param format - The format to use (default: 'US')
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string, format = 'US'): string => {
  if (!phoneNumber) {
    return '';
  }
  
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (format === 'US') {
    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length === 11 && cleaned.charAt(0) === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
    }
  } else if (format === 'INTERNATIONAL') {
    // For international numbers, format with country code
    if (cleaned.length >= 10) {
      const countryCode = cleaned.slice(0, cleaned.length - 10);
      const areaCode = cleaned.slice(cleaned.length - 10, cleaned.length - 7);
      const firstPart = cleaned.slice(cleaned.length - 7, cleaned.length - 4);
      const lastPart = cleaned.slice(cleaned.length - 4);
      
      if (countryCode) {
        return `+${countryCode} ${areaCode} ${firstPart} ${lastPart}`;
      } else {
        return `${areaCode} ${firstPart} ${lastPart}`;
      }
    }
  }
  
  // Return the cleaned number if it doesn't match expected formats
  return cleaned;
};

/**
 * Formats an address object or string into a standardized format
 * @param address - The address to format
 * @returns Formatted address string
 */
export const formatAddress = (address: any): string => {
  if (!address) {
    return '';
  }
  
  if (typeof address === 'string') {
    return address;
  }
  
  const { street, street2, city, state, zip, zipCode, postalCode, country } = address;
  const parts = [];
  
  if (street) parts.push(street);
  if (street2) parts.push(street2);
  
  const cityStateZip = [];
  if (city) cityStateZip.push(city);
  if (state) cityStateZip.push(state);
  
  // Handle different possible names for postal code
  const postal = zip || zipCode || postalCode;
  if (postal) cityStateZip.push(postal);
  
  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(', '));
  }
  
  if (country) parts.push(country);
  
  return parts.join(', ');
};

/**
 * Formats coordinates into a readable string with specified precision
 * @param coordinates - The coordinates to format
 * @param precision - The number of decimal places (default: 6)
 * @returns Formatted coordinates string
 */
export const formatCoordinates = (coordinates: Coordinates, precision = 6): string => {
  if (!coordinates || typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
    return '';
  }
  
  const lat = coordinates.latitude.toFixed(precision);
  const lng = coordinates.longitude.toFixed(precision);
  
  return `Lat: ${lat}, Lng: ${lng}`;
};

/**
 * Formats a distance in meters to a human-readable format with appropriate units
 * @param distanceInMeters - The distance in meters
 * @param useImperial - Whether to use imperial units (miles/feet) instead of metric
 * @returns Formatted distance string
 */
export const formatDistance = (distanceInMeters: number, useImperial = false): string => {
  if (distanceInMeters === null || distanceInMeters === undefined || isNaN(distanceInMeters)) {
    return useImperial ? '0 ft' : '0 m';
  }
  
  if (useImperial) {
    // Convert to imperial units (miles/feet)
    const feet = distanceInMeters * 3.28084;
    if (feet > 5280) {
      // Convert to miles if more than a mile
      const miles = feet / 5280;
      return `${formatNumber(miles, miles < 10 ? 1 : 0)} mi`;
    }
    return `${formatNumber(feet, 0)} ft`;
  } else {
    // Use metric units (km/m)
    if (distanceInMeters >= 1000) {
      // Convert to kilometers if 1km or more
      const km = distanceInMeters / 1000;
      return `${formatNumber(km, km < 10 ? 1 : 0)} km`;
    }
    return `${formatNumber(distanceInMeters, 0)} m`;
  }
};

/**
 * Formats weather data into a human-readable string
 * @param weatherData - The weather data to format
 * @param useFahrenheit - Whether to display temperature in Fahrenheit
 * @returns Formatted weather string
 */
export const formatWeather = (weatherData: WeatherData, useFahrenheit = true): string => {
  if (!weatherData) {
    return '';
  }
  
  let temperature = weatherData.temperature;
  const unit = useFahrenheit ? '°F' : '°C';
  
  // Convert to Fahrenheit if needed
  if (useFahrenheit && weatherData.temperatureUnit === '°C') {
    temperature = (temperature * 9/5) + 32;
  }
  // Convert to Celsius if needed
  else if (!useFahrenheit && weatherData.temperatureUnit === '°F') {
    temperature = (temperature - 32) * 5/9;
  }
  
  const formattedTemp = `${Math.round(temperature)}${unit}`;
  
  // Format the weather condition for display
  const conditionMap: Record<WeatherCondition, string> = {
    [WeatherCondition.SUNNY]: 'Sunny',
    [WeatherCondition.PARTLY_CLOUDY]: 'Partly cloudy',
    [WeatherCondition.CLOUDY]: 'Cloudy',
    [WeatherCondition.RAINY]: 'Rainy',
    [WeatherCondition.STORMY]: 'Stormy',
    [WeatherCondition.SNOWY]: 'Snowy',
    [WeatherCondition.WINDY]: 'Windy',
    [WeatherCondition.UNKNOWN]: 'Unknown'
  };
  
  const condition = conditionMap[weatherData.condition] || 'Unknown';
  
  return `${condition}, ${formattedTemp}`;
};

/**
 * Formats a name with proper capitalization
 * @param name - The name to format
 * @returns Formatted name
 */
export const formatName = (name: string): string => {
  if (!name) {
    return '';
  }
  
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Truncates text to a specified length and adds an ellipsis if truncated
 * @param text - The text to truncate
 * @param maxLength - The maximum length
 * @param ellipsis - The ellipsis to add (default: '...')
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number, ellipsis = '...'): string => {
  if (!text) {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * Formats a file size in bytes to a human-readable format
 * @param bytes - The file size in bytes
 * @param decimals - The number of decimal places to include (default: 2)
 * @returns Formatted file size
 */
export const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === null || bytes === undefined || isNaN(bytes)) {
    return '0 Bytes';
  }
  
  if (bytes === 0) {
    return '0 Bytes';
  }
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Returns singular or plural form of a word based on count
 * @param count - The count determining which form to use
 * @param singular - The singular form
 * @param plural - The plural form (optional, defaults to singular + 's')
 * @returns Appropriate form of the word
 */
export const formatPlural = (count: number, singular: string, plural?: string): string => {
  if (count === null || count === undefined || isNaN(count)) {
    return singular;
  }
  
  if (count === 1) {
    return singular;
  }
  
  return plural || `${singular}s`;
};

/**
 * Formats an array of items into a comma-separated list with 'and' before the last item
 * @param items - The array of items
 * @param conjunction - The conjunction to use (default: 'and')
 * @returns Formatted list string
 */
export const formatList = (items: string[], conjunction = 'and'): string => {
  if (!items || items.length === 0) {
    return '';
  }
  
  if (items.length === 1) {
    return items[0];
  }
  
  if (items.length === 2) {
    return `${items[0]} ${conjunction} ${items[1]}`;
  }
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1).join(', ');
  
  return `${otherItems}, ${conjunction} ${lastItem}`;
};