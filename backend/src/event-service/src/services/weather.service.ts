/**
 * Weather Service Module
 * 
 * This service provides weather data for event planning and recommendations, acting as a facade
 * over the OpenWeatherMap integration. It provides simplified methods for retrieving current
 * weather and forecasts, as well as utility functions for determining weather suitability for
 * different types of activities.
 * 
 * @version 1.0.0
 */

import NodeCache from 'node-cache'; // ^5.1.2
import OpenWeatherMapIntegration from '../integrations/openweathermap.integration';
import { IWeatherData } from '../../../shared/src/types/event.types';
import { ICoordinates } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';
import { eventServiceConfig } from '../config';

// Initialize cache for weather data
const weatherCache = new NodeCache({ stdTTL: eventServiceConfig.weatherCacheTtl, checkperiod: 120 });

// Create instance of weather integration
const weatherIntegration = new OpenWeatherMapIntegration();

/**
 * Gets current weather data for a specific location
 * 
 * @param coordinates - The latitude and longitude of the location
 * @returns Promise resolving to weather data for the location
 */
export async function getCurrentWeather(coordinates: ICoordinates): Promise<IWeatherData> {
  try {
    // Validate coordinates
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      throw ApiError.badRequest('Invalid coordinates provided');
    }

    // Generate cache key based on coordinates
    const cacheKey = `current_weather_${coordinates.latitude}_${coordinates.longitude}`;

    // Check if weather data exists in cache
    const cachedData = weatherCache.get<IWeatherData>(cacheKey);
    if (cachedData) {
      logger.debug('Returning cached current weather data', { coordinates });
      return cachedData;
    }

    // If no cached data, fetch from integration
    logger.info('Fetching current weather data', { coordinates });
    const weatherData = await weatherIntegration.getCurrentWeather(coordinates);
    
    // Store result in cache
    weatherCache.set(cacheKey, weatherData);
    
    return weatherData;
  } catch (error) {
    logger.error('Error getting current weather data', error as Error, { coordinates });
    
    // Rethrow as ApiError if it's not already one
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw ApiError.serviceUnavailable('Weather service is currently unavailable');
  }
}

/**
 * Gets weather forecast for a specific location for the next 5 days
 * 
 * @param coordinates - The latitude and longitude of the location
 * @returns Promise resolving to array of weather forecasts with dates
 */
export async function getWeatherForecast(coordinates: ICoordinates): Promise<Array<{date: Date, weather: IWeatherData}>> {
  try {
    // Validate coordinates
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      throw ApiError.badRequest('Invalid coordinates provided');
    }

    // Generate cache key based on coordinates
    const cacheKey = `forecast_${coordinates.latitude}_${coordinates.longitude}`;

    // Check if forecast data exists in cache
    const cachedData = weatherCache.get<Array<{date: Date, weather: IWeatherData}>>(cacheKey);
    if (cachedData) {
      logger.debug('Returning cached forecast data', { coordinates });
      return cachedData;
    }

    // If no cached data, fetch from integration
    logger.info('Fetching weather forecast data', { coordinates });
    const forecastData = await weatherIntegration.getWeatherForecast(coordinates);
    
    // Store result in cache
    weatherCache.set(cacheKey, forecastData);
    
    return forecastData;
  } catch (error) {
    logger.error('Error getting weather forecast', error as Error, { coordinates });
    
    // Rethrow as ApiError if it's not already one
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw ApiError.serviceUnavailable('Weather forecast service is currently unavailable');
  }
}

/**
 * Gets weather forecast for a specific date and location
 * 
 * @param coordinates - The latitude and longitude of the location
 * @param date - The specific date to get weather for
 * @returns Promise resolving to weather data for the specified date and location, or null if not available
 */
export async function getWeatherForDate(coordinates: ICoordinates, date: Date): Promise<IWeatherData | null> {
  try {
    // Validate coordinates and date
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      throw ApiError.badRequest('Invalid coordinates provided');
    }
    
    if (!date || isNaN(date.getTime())) {
      throw ApiError.badRequest('Invalid date provided');
    }

    // Generate cache key based on coordinates and date
    const dateStr = date.toISOString().split('T')[0];
    const cacheKey = `weather_date_${coordinates.latitude}_${coordinates.longitude}_${dateStr}`;

    // Check if weather data exists in cache
    const cachedData = weatherCache.get<IWeatherData | null>(cacheKey);
    if (cachedData !== undefined) {
      logger.debug('Returning cached weather data for date', { coordinates, date: dateStr });
      return cachedData;
    }

    // If no cached data, fetch from integration
    logger.info('Fetching weather data for specific date', { coordinates, date: dateStr });
    const weatherData = await weatherIntegration.getWeatherForDate(coordinates, date);
    
    // Store result in cache
    weatherCache.set(cacheKey, weatherData);
    
    return weatherData;
  } catch (error) {
    logger.error('Error getting weather for date', error as Error, { 
      coordinates, 
      date: date?.toISOString() 
    });
    
    // Rethrow as ApiError if it's not already one
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw ApiError.serviceUnavailable('Weather service is currently unavailable');
  }
}

/**
 * Determines if weather conditions are suitable for outdoor activities
 * 
 * @param weatherData - Weather data to evaluate
 * @returns True if weather is suitable for outdoor activities, false otherwise
 */
export function isOutdoorWeather(weatherData: IWeatherData): boolean {
  if (!weatherData) {
    return false;
  }

  // Temperature between 50°F and 90°F is generally comfortable for outdoor activities
  const isComfortableTemperature = weatherData.temperature >= 50 && weatherData.temperature <= 90;
  
  // Less than 30% chance of precipitation
  const isLowPrecipitation = weatherData.precipitation < 30;
  
  // Weather condition is not extreme
  const extremeConditions = ['Thunderstorm', 'Heavy Rain', 'Snowy', 'Stormy'];
  const isNotExtreme = !extremeConditions.includes(weatherData.condition);
  
  return isComfortableTemperature && isLowPrecipitation && isNotExtreme;
}

/**
 * Calculates a suitability score for different activity types based on weather conditions
 * 
 * @param weatherData - Weather data to evaluate
 * @returns Object with suitability scores for outdoor, indoor, and any-weather activities
 */
export function getWeatherSuitability(weatherData: IWeatherData): { outdoor: number, indoor: number, anyWeather: number } {
  if (!weatherData) {
    return { outdoor: 0, indoor: 0.8, anyWeather: 0.4 };
  }

  // Calculate outdoor suitability (0-1 scale)
  let outdoorScore = 0;
  
  // Temperature factor (optimal is 65-80°F)
  const temp = weatherData.temperature;
  if (temp >= 65 && temp <= 80) {
    outdoorScore += 0.4; // Optimal temperature
  } else if ((temp >= 50 && temp < 65) || (temp > 80 && temp <= 90)) {
    outdoorScore += 0.3; // Good temperature
  } else if ((temp >= 40 && temp < 50) || (temp > 90 && temp <= 95)) {
    outdoorScore += 0.1; // Acceptable temperature
  } else {
    outdoorScore += 0; // Poor temperature
  }
  
  // Precipitation factor
  const precipitation = weatherData.precipitation;
  if (precipitation < 10) {
    outdoorScore += 0.3; // Very low chance of precipitation
  } else if (precipitation < 30) {
    outdoorScore += 0.2; // Low chance of precipitation
  } else if (precipitation < 50) {
    outdoorScore += 0.1; // Moderate chance of precipitation
  } else {
    outdoorScore += 0; // High chance of precipitation
  }
  
  // Weather condition factor
  const condition = weatherData.condition;
  const goodConditions = ['Clear', 'Sunny', 'Partly Cloudy'];
  const okayConditions = ['Cloudy', 'Drizzle', 'Foggy'];
  const badConditions = ['Rainy', 'Thunderstorm', 'Snowy', 'Stormy'];
  
  if (goodConditions.some(c => condition.includes(c))) {
    outdoorScore += 0.3; // Good weather conditions
  } else if (okayConditions.some(c => condition.includes(c))) {
    outdoorScore += 0.2; // Okay weather conditions
  } else if (badConditions.some(c => condition.includes(c))) {
    outdoorScore += 0; // Bad weather conditions
  } else {
    outdoorScore += 0.1; // Unknown/other conditions
  }
  
  // Indoor score is generally high but can be affected by extreme conditions
  let indoorScore = 0.8; // Base indoor score
  
  // Reduce indoor score slightly for power outage risk conditions
  if (condition.includes('Thunderstorm') || condition.includes('Stormy')) {
    indoorScore = 0.7;
  }
  
  // Calculate anyWeather score (average of outdoor and indoor)
  const anyWeatherScore = (outdoorScore + indoorScore) / 2;
  
  return {
    outdoor: outdoorScore,
    indoor: indoorScore,
    anyWeather: anyWeatherScore
  };
}

/**
 * Generates a human-readable description of weather conditions
 * 
 * @param weatherData - Weather data to describe
 * @returns Human-readable weather description
 */
export function getWeatherDescription(weatherData: IWeatherData): string {
  if (!weatherData) {
    return 'Weather information not available';
  }

  const { temperature, condition, precipitation } = weatherData;
  
  // Generate temperature description
  let tempDescription;
  if (temperature < 40) {
    tempDescription = 'cold';
  } else if (temperature < 60) {
    tempDescription = 'cool';
  } else if (temperature < 80) {
    tempDescription = 'warm';
  } else {
    tempDescription = 'hot';
  }
  
  // Generate precipitation description
  let precipDescription = '';
  if (precipitation > 0) {
    if (precipitation < 20) {
      precipDescription = ' with a slight chance of precipitation';
    } else if (precipitation < 50) {
      precipDescription = ' with a moderate chance of precipitation';
    } else {
      precipDescription = ' with a high chance of precipitation';
    }
  }
  
  // Generate full description
  return `${tempDescription} and ${condition.toLowerCase()}${precipDescription}, with temperatures around ${Math.round(temperature)}°F`;
}

/**
 * Suggests whether indoor or outdoor activities are more suitable based on weather
 * 
 * @param weatherData - Weather data to evaluate
 * @returns "indoor", "outdoor", or "either" based on weather conditions
 */
export function suggestActivityType(weatherData: IWeatherData): string {
  if (!weatherData) {
    return 'indoor'; // Default to indoor if no weather data
  }

  const suitability = getWeatherSuitability(weatherData);
  
  // Determine recommendation based on relative scores
  const difference = suitability.outdoor - suitability.indoor;
  
  if (difference > 0.2) {
    return 'outdoor'; // Significantly better for outdoor
  } else if (difference < -0.2) {
    return 'indoor'; // Significantly better for indoor
  } else {
    return 'either'; // Similar suitability for both
  }
}

/**
 * Clears the weather service cache
 */
export function clearCache(): void {
  weatherCache.flushAll();
  logger.info('Weather cache cleared');
}