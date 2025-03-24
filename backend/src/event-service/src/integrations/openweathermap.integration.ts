/**
 * OpenWeatherMap Integration Module
 * 
 * This module provides integration with the OpenWeatherMap API for fetching weather data
 * to support event planning and weather-based activity recommendations. It handles
 * API requests, response parsing, error handling, and caching.
 * 
 * @version 1.0.0
 */

import axios from 'axios'; // ^1.3.4
import NodeCache from 'node-cache'; // ^5.1.2

import { eventServiceConfig, env } from '../config';
import { IWeatherData } from '../../../shared/src/types/event.types';
import { ICoordinates } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';

// Initialize cache for weather data with TTL from configuration
const weatherCache = new NodeCache({ stdTTL: eventServiceConfig.weatherCacheTtl, checkperiod: 120 });

/**
 * Class for integrating with OpenWeatherMap API to fetch weather data
 */
export class OpenWeatherMapIntegration {
  private apiKey: string;
  private baseUrl: string;
  private cache: NodeCache;

  /**
   * Initializes a new instance of the OpenWeatherMapIntegration class
   */
  constructor() {
    this.apiKey = env.OPENWEATHERMAP_API_KEY;
    this.baseUrl = eventServiceConfig.openWeatherMapApiUrl;
    this.cache = weatherCache;

    // Validate that API key is available
    if (!this.apiKey) {
      logger.warn('OpenWeatherMap API key is not configured. Weather data will not be available.');
    }
  }

  /**
   * Fetches current weather data for a specific location
   * 
   * @param coordinates - The latitude and longitude of the location
   * @returns Promise resolving to weather data for the location
   */
  async getCurrentWeather(coordinates: ICoordinates): Promise<IWeatherData> {
    // Validate coordinates
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      throw ApiError.badRequest('Invalid coordinates provided');
    }

    // Generate cache key based on coordinates
    const cacheKey = `current_weather_${coordinates.latitude}_${coordinates.longitude}`;

    // Check if weather data exists in cache
    const cachedData = this.cache.get<IWeatherData>(cacheKey);
    if (cachedData) {
      logger.debug('Returning cached current weather data', { coordinates });
      return cachedData;
    }

    try {
      // Construct API URL with coordinates and API key
      const url = `${this.baseUrl}/weather?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${this.apiKey}`;
      
      logger.info('Fetching current weather data from OpenWeatherMap API', { coordinates });
      const response = await axios.get(url);
      
      // Parse response and transform to IWeatherData format
      const weatherData = this.transformWeatherData(response.data);
      
      // Store result in cache
      this.cache.set(cacheKey, weatherData);
      
      return weatherData;
    } catch (error) {
      logger.error('Error fetching weather data from OpenWeatherMap API', error as Error, { coordinates });
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw ApiError.externalServiceError('Unauthorized access to weather service. API key may be invalid.');
        } else if (error.response?.status === 404) {
          throw ApiError.badRequest('Location not found in weather service.');
        } else if (error.response?.status === 429) {
          throw ApiError.serviceUnavailable('Weather service rate limit exceeded. Please try again later.');
        } else if (!error.response) {
          throw ApiError.serviceUnavailable('Weather service is unavailable. Please try again later.');
        }
      }
      
      throw ApiError.externalServiceError('Failed to fetch weather data: ' + (error as Error).message);
    }
  }

  /**
   * Fetches weather forecast for a specific location for the next 5 days
   * 
   * @param coordinates - The latitude and longitude of the location
   * @returns Promise resolving to array of weather forecasts with dates
   */
  async getWeatherForecast(coordinates: ICoordinates): Promise<Array<{date: Date, weather: IWeatherData}>> {
    // Validate coordinates
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      throw ApiError.badRequest('Invalid coordinates provided');
    }

    // Generate cache key based on coordinates
    const cacheKey = `forecast_${coordinates.latitude}_${coordinates.longitude}`;

    // Check if forecast data exists in cache
    const cachedData = this.cache.get<Array<{date: Date, weather: IWeatherData}>>(cacheKey);
    if (cachedData) {
      logger.debug('Returning cached forecast data', { coordinates });
      return cachedData;
    }

    try {
      // Construct API URL with coordinates and API key
      const url = `${this.baseUrl}/forecast?lat=${coordinates.latitude}&lon=${coordinates.longitude}&appid=${this.apiKey}`;
      
      logger.info('Fetching forecast data from OpenWeatherMap API', { coordinates });
      const response = await axios.get(url);
      
      // Parse response and transform to IWeatherData format
      const forecasts = response.data.list;
      const processedForecasts: Array<{date: Date, weather: IWeatherData}> = [];
      
      // Group forecasts by day
      const forecastsByDay = new Map<string, any[]>();
      
      for (const forecast of forecasts) {
        const date = new Date(forecast.dt * 1000);
        const dateString = date.toISOString().split('T')[0];
        
        if (!forecastsByDay.has(dateString)) {
          forecastsByDay.set(dateString, []);
        }
        
        forecastsByDay.get(dateString)?.push(forecast);
      }
      
      // For each day, select the forecast for noon (or closest available time)
      for (const [dateString, dayForecasts] of forecastsByDay.entries()) {
        // Sort forecasts by time
        dayForecasts.sort((a, b) => a.dt - b.dt);
        
        // Target noon (12:00) for daily forecast
        const targetHour = 12;
        let selectedForecast = dayForecasts[0];
        let minHourDiff = 24;
        
        for (const forecast of dayForecasts) {
          const forecastDate = new Date(forecast.dt * 1000);
          const hourDiff = Math.abs(forecastDate.getUTCHours() - targetHour);
          
          if (hourDiff < minHourDiff) {
            minHourDiff = hourDiff;
            selectedForecast = forecast;
          }
        }
        
        processedForecasts.push({
          date: new Date(dateString),
          weather: this.transformWeatherData(selectedForecast)
        });
      }
      
      // Store result in cache
      this.cache.set(cacheKey, processedForecasts);
      
      return processedForecasts;
    } catch (error) {
      logger.error('Error fetching forecast data from OpenWeatherMap API', error as Error, { coordinates });
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw ApiError.externalServiceError('Unauthorized access to weather service. API key may be invalid.');
        } else if (error.response?.status === 404) {
          throw ApiError.badRequest('Location not found in weather service.');
        } else if (error.response?.status === 429) {
          throw ApiError.serviceUnavailable('Weather service rate limit exceeded. Please try again later.');
        } else if (!error.response) {
          throw ApiError.serviceUnavailable('Weather service is unavailable. Please try again later.');
        }
      }
      
      throw ApiError.externalServiceError('Failed to fetch forecast data: ' + (error as Error).message);
    }
  }

  /**
   * Gets weather forecast for a specific date and location
   * 
   * @param coordinates - The latitude and longitude of the location
   * @param date - The specific date to get weather for
   * @returns Promise resolving to weather data for the specified date, or null if not available
   */
  async getWeatherForDate(coordinates: ICoordinates, date: Date): Promise<IWeatherData | null> {
    // Validate inputs
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      throw ApiError.badRequest('Invalid coordinates provided');
    }
    
    if (!date || isNaN(date.getTime())) {
      throw ApiError.badRequest('Invalid date provided');
    }
    
    // Normalize dates for comparison (strip time component)
    const normalizedTargetDate = new Date(date.toISOString().split('T')[0]);
    const normalizedToday = new Date(new Date().toISOString().split('T')[0]);
    
    // Calculate difference in days
    const timeDiff = normalizedTargetDate.getTime() - normalizedToday.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    try {
      // If date is today, return current weather
      if (dayDiff === 0) {
        return this.getCurrentWeather(coordinates);
      }
      
      // If date is in the future (within 5-day forecast range)
      if (dayDiff > 0 && dayDiff <= 5) {
        const forecast = await this.getWeatherForecast(coordinates);
        
        // Find the forecast for the requested date
        const targetDateForecast = forecast.find(item => {
          const forecastDate = new Date(item.date.toISOString().split('T')[0]);
          return forecastDate.getTime() === normalizedTargetDate.getTime();
        });
        
        return targetDateForecast ? targetDateForecast.weather : null;
      }
      
      // Date is beyond forecast range or in the past
      logger.info('Weather forecast requested for date outside available range', { 
        coordinates, 
        date: date.toISOString(),
        dayDiff 
      });
      
      return null;
    } catch (error) {
      logger.error('Error getting weather for specific date', error as Error, { 
        coordinates, 
        date: date.toISOString() 
      });
      throw ApiError.externalServiceError('Failed to get weather for date: ' + (error as Error).message);
    }
  }

  /**
   * Converts temperature from Kelvin to Celsius
   * 
   * @param kelvin - Temperature in Kelvin
   * @returns Temperature in Celsius
   */
  private kelvinToCelsius(kelvin: number): number {
    return Math.round((kelvin - 273.15) * 10) / 10;
  }

  /**
   * Converts temperature from Kelvin to Fahrenheit
   * 
   * @param kelvin - Temperature in Kelvin
   * @returns Temperature in Fahrenheit
   */
  private kelvinToFahrenheit(kelvin: number): number {
    const celsius = this.kelvinToCelsius(kelvin);
    return Math.round((celsius * 9/5 + 32) * 10) / 10;
  }

  /**
   * Maps OpenWeatherMap condition codes to standardized weather condition strings
   * 
   * @param conditionCode - OpenWeatherMap condition code
   * @returns Standardized weather condition description
   */
  private mapWeatherCondition(conditionCode: number): string {
    // Map OpenWeatherMap condition codes to standardized strings
    // https://openweathermap.org/weather-conditions
    
    if (conditionCode >= 200 && conditionCode < 300) {
      return 'Thunderstorm';
    } else if (conditionCode >= 300 && conditionCode < 400) {
      return 'Drizzle';
    } else if (conditionCode >= 500 && conditionCode < 600) {
      return 'Rainy';
    } else if (conditionCode >= 600 && conditionCode < 700) {
      return 'Snowy';
    } else if (conditionCode >= 700 && conditionCode < 800) {
      return 'Foggy';
    } else if (conditionCode === 800) {
      return 'Clear';
    } else if (conditionCode > 800 && conditionCode < 900) {
      return 'Cloudy';
    } else {
      return 'Unknown';
    }
  }

  /**
   * Transforms raw OpenWeatherMap API response to IWeatherData format
   * 
   * @param apiResponse - Raw API response from OpenWeatherMap
   * @returns Transformed weather data in application format
   */
  private transformWeatherData(apiResponse: any): IWeatherData {
    // Extract main weather data
    const main = apiResponse.main || {};
    const weather = apiResponse.weather?.[0] || {};
    const wind = apiResponse.wind || {};
    
    // Get temperature in Fahrenheit (API returns Kelvin)
    const temperature = this.kelvinToFahrenheit(main.temp || 273.15);
    
    // Map weather condition to standardized string
    const condition = this.mapWeatherCondition(weather.id || 800);
    
    // Get weather icon code
    const icon = weather.icon || '01d';
    
    // Get precipitation probability if available (forecast endpoint)
    // Convert from 0-1 scale to 0-100%
    const precipitation = apiResponse.pop ? Math.round(apiResponse.pop * 100) : 0;
    
    // Generate forecast summary text
    let forecast = `${condition} with temperature around ${temperature}°F`;
    if (precipitation > 0) {
      forecast += `, ${precipitation}% chance of precipitation`;
    }
    if (wind.speed > 5) {
      forecast += `, winds at ${Math.round(wind.speed * 2.237)}mph`; // Convert m/s to mph
    }
    
    return {
      temperature,
      condition,
      icon,
      precipitation,
      forecast
    };
  }

  /**
   * Clears the weather data cache
   */
  clearCache(): void {
    this.cache.flushAll();
    logger.info('Weather cache cleared');
  }
}

export default OpenWeatherMapIntegration;