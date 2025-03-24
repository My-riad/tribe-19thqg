import { jest } from '@jest/globals';
import NodeCache from 'node-cache';
import * as weatherService from '../src/services/weather.service';
import OpenWeatherMapIntegration from '../src/integrations/openweathermap.integration';
import { IWeatherData } from '../../../shared/src/types/event.types';
import { ICoordinates } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';

// Mock dependencies
jest.mock('../src/integrations/openweathermap.integration', () => ({ default: jest.fn() }));
jest.mock('node-cache', () => jest.fn());

/**
 * Creates a mock weather data object for testing
 */
function createMockWeatherData(overrides = {}): IWeatherData {
  return {
    temperature: 72,
    condition: 'Sunny',
    icon: '01d',
    precipitation: 0,
    forecast: 'Sunny with temperature around 72°F',
    ...overrides
  };
}

/**
 * Creates a mock coordinates object for testing
 */
function createMockCoordinates(overrides = {}): ICoordinates {
  return {
    latitude: 47.6062,
    longitude: -122.3321,
    ...overrides
  };
}

describe('Weather Service', () => {
  // Mocked dependencies
  let mockOpenWeatherMapInstance: jest.Mocked<any>;
  let mockCacheInstance: jest.Mocked<any>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create mock instance for OpenWeatherMapIntegration
    mockOpenWeatherMapInstance = {
      getCurrentWeather: jest.fn(),
      getWeatherForecast: jest.fn(),
      getWeatherForDate: jest.fn(),
      clearCache: jest.fn()
    };
    
    // Set up the class mock to return our instance
    (OpenWeatherMapIntegration as jest.Mock).mockImplementation(() => mockOpenWeatherMapInstance);
    
    // Create mock instance for NodeCache
    mockCacheInstance = {
      get: jest.fn(),
      set: jest.fn(),
      flushAll: jest.fn()
    };
    
    // Set up the NodeCache mock to return our instance
    (NodeCache as jest.Mock).mockImplementation(() => mockCacheInstance);
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  describe('getCurrentWeather', () => {
    it('should retrieve current weather data for a location', async () => {
      // Create mock coordinates
      const coordinates = createMockCoordinates();
      // Create mock weather data
      const mockWeatherData = createMockWeatherData();
      
      // Set up OpenWeatherMapIntegration mock to return the mock weather data
      mockOpenWeatherMapInstance.getCurrentWeather.mockResolvedValue(mockWeatherData);
      
      // Call weatherService.getCurrentWeather with the coordinates
      const result = await weatherService.getCurrentWeather(coordinates);
      
      // Verify that OpenWeatherMapIntegration.getCurrentWeather was called with correct parameters
      expect(mockOpenWeatherMapInstance.getCurrentWeather).toHaveBeenCalledWith(coordinates);
      // Verify that the returned weather data matches the mock weather data
      expect(result).toEqual(mockWeatherData);
    });

    it('should return cached weather data if available', async () => {
      // Create mock coordinates
      const coordinates = createMockCoordinates();
      // Create mock weather data
      const mockWeatherData = createMockWeatherData();
      
      // Set up cache mock to return the mock weather data
      const cacheKey = `current_weather_${coordinates.latitude}_${coordinates.longitude}`;
      mockCacheInstance.get.mockImplementation((key) => {
        if (key === cacheKey) return mockWeatherData;
        return undefined;
      });
      
      // Call weatherService.getCurrentWeather with the coordinates
      const result = await weatherService.getCurrentWeather(coordinates);
      
      // Verify that OpenWeatherMapIntegration.getCurrentWeather was not called
      expect(mockOpenWeatherMapInstance.getCurrentWeather).not.toHaveBeenCalled();
      // Verify that the returned weather data matches the mock weather data
      expect(result).toEqual(mockWeatherData);
    });

    it('should handle errors from the OpenWeatherMap integration', async () => {
      // Create mock coordinates
      const coordinates = createMockCoordinates();
      
      // Set up OpenWeatherMapIntegration mock to throw an error
      mockOpenWeatherMapInstance.getCurrentWeather.mockRejectedValue(new Error('API error'));
      
      // Call weatherService.getCurrentWeather with the coordinates
      await expect(weatherService.getCurrentWeather(coordinates)).rejects.toThrow(ApiError);
      // Verify that an ApiError is thrown with the correct status code
      await expect(weatherService.getCurrentWeather(coordinates)).rejects.toMatchObject({
        statusCode: 503
      });
    });
  });

  describe('getWeatherForecast', () => {
    it('should retrieve weather forecast for a location', async () => {
      // Create mock coordinates
      const coordinates = createMockCoordinates();
      // Create mock forecast data array
      const mockForecastData = [
        { date: new Date('2023-07-15'), weather: createMockWeatherData() },
        { date: new Date('2023-07-16'), weather: createMockWeatherData({ temperature: 75 }) }
      ];
      
      // Set up OpenWeatherMapIntegration mock to return the mock forecast data
      mockOpenWeatherMapInstance.getWeatherForecast.mockResolvedValue(mockForecastData);
      
      // Call weatherService.getWeatherForecast with the coordinates
      const result = await weatherService.getWeatherForecast(coordinates);
      
      // Verify that OpenWeatherMapIntegration.getWeatherForecast was called with correct parameters
      expect(mockOpenWeatherMapInstance.getWeatherForecast).toHaveBeenCalledWith(coordinates);
      // Verify that the returned forecast data matches the mock forecast data
      expect(result).toEqual(mockForecastData);
    });

    it('should return cached forecast data if available', async () => {
      // Create mock coordinates
      const coordinates = createMockCoordinates();
      // Create mock forecast data array
      const mockForecastData = [
        { date: new Date('2023-07-15'), weather: createMockWeatherData() },
        { date: new Date('2023-07-16'), weather: createMockWeatherData({ temperature: 75 }) }
      ];
      
      // Set up cache mock to return the mock forecast data
      const cacheKey = `forecast_${coordinates.latitude}_${coordinates.longitude}`;
      mockCacheInstance.get.mockImplementation((key) => {
        if (key === cacheKey) return mockForecastData;
        return undefined;
      });
      
      // Call weatherService.getWeatherForecast with the coordinates
      const result = await weatherService.getWeatherForecast(coordinates);
      
      // Verify that OpenWeatherMapIntegration.getWeatherForecast was not called
      expect(mockOpenWeatherMapInstance.getWeatherForecast).not.toHaveBeenCalled();
      // Verify that the returned forecast data matches the mock forecast data
      expect(result).toEqual(mockForecastData);
    });

    it('should handle errors from the OpenWeatherMap integration', async () => {
      // Create mock coordinates
      const coordinates = createMockCoordinates();
      
      // Set up OpenWeatherMapIntegration mock to throw an error
      mockOpenWeatherMapInstance.getWeatherForecast.mockRejectedValue(new Error('API error'));
      
      // Call weatherService.getWeatherForecast with the coordinates
      await expect(weatherService.getWeatherForecast(coordinates)).rejects.toThrow(ApiError);
      // Verify that an ApiError is thrown with the correct status code
      await expect(weatherService.getWeatherForecast(coordinates)).rejects.toMatchObject({
        statusCode: 503
      });
    });
  });

  describe('getWeatherForDate', () => {
    it('should retrieve weather data for a specific date and location', async () => {
      // Create mock coordinates
      const coordinates = createMockCoordinates();
      // Create mock date
      const date = new Date('2023-07-15');
      // Create mock weather data
      const mockWeatherData = createMockWeatherData();
      
      // Set up OpenWeatherMapIntegration mock to return the mock weather data
      mockOpenWeatherMapInstance.getWeatherForDate.mockResolvedValue(mockWeatherData);
      
      // Call weatherService.getWeatherForDate with the coordinates and date
      const result = await weatherService.getWeatherForDate(coordinates, date);
      
      // Verify that OpenWeatherMapIntegration.getWeatherForDate was called with correct parameters
      expect(mockOpenWeatherMapInstance.getWeatherForDate).toHaveBeenCalledWith(coordinates, date);
      // Verify that the returned weather data matches the mock weather data
      expect(result).toEqual(mockWeatherData);
    });

    it('should return cached weather data for a date if available', async () => {
      // Create mock coordinates
      const coordinates = createMockCoordinates();
      // Create mock date
      const date = new Date('2023-07-15');
      // Create mock weather data
      const mockWeatherData = createMockWeatherData();
      
      // Set up cache mock to return the mock weather data
      const dateStr = date.toISOString().split('T')[0];
      const cacheKey = `weather_date_${coordinates.latitude}_${coordinates.longitude}_${dateStr}`;
      mockCacheInstance.get.mockImplementation((key) => {
        if (key === cacheKey) return mockWeatherData;
        return undefined;
      });
      
      // Call weatherService.getWeatherForDate with the coordinates and date
      const result = await weatherService.getWeatherForDate(coordinates, date);
      
      // Verify that OpenWeatherMapIntegration.getWeatherForDate was not called
      expect(mockOpenWeatherMapInstance.getWeatherForDate).not.toHaveBeenCalled();
      // Verify that the returned weather data matches the mock weather data
      expect(result).toEqual(mockWeatherData);
    });

    it('should handle errors from the OpenWeatherMap integration', async () => {
      // Create mock coordinates
      const coordinates = createMockCoordinates();
      // Create mock date
      const date = new Date('2023-07-15');
      
      // Set up OpenWeatherMapIntegration mock to throw an error
      mockOpenWeatherMapInstance.getWeatherForDate.mockRejectedValue(new Error('API error'));
      
      // Verify that the error is caught and handled appropriately
      await expect(weatherService.getWeatherForDate(coordinates, date)).rejects.toThrow(ApiError);
      // Verify that an ApiError is thrown with the correct status code
      await expect(weatherService.getWeatherForDate(coordinates, date)).rejects.toMatchObject({
        statusCode: 503
      });
    });
  });

  describe('isOutdoorWeather', () => {
    it('should correctly determine if weather is suitable for outdoor activities', () => {
      // Create mock weather data with good outdoor conditions
      const goodWeather = createMockWeatherData({
        temperature: 75,
        condition: 'Sunny',
        precipitation: 0
      });
      
      // Call weatherService.isOutdoorWeather with the good weather data
      const goodResult = weatherService.isOutdoorWeather(goodWeather);
      // Verify that the function returns true
      expect(goodResult).toBe(true);
      
      // Create mock weather data with poor outdoor conditions
      const badWeather = createMockWeatherData({
        temperature: 40,
        condition: 'Thunderstorm',
        precipitation: 80
      });
      
      // Call weatherService.isOutdoorWeather with the poor weather data
      const badResult = weatherService.isOutdoorWeather(badWeather);
      // Verify that the function returns false
      expect(badResult).toBe(false);
    });
  });

  describe('getWeatherSuitability', () => {
    it('should calculate suitability scores for different activity types', () => {
      // Create mock weather data
      const weatherData = createMockWeatherData({
        temperature: 75,
        condition: 'Sunny',
        precipitation: 0
      });
      
      // Call weatherService.getWeatherSuitability with the weather data
      const result = weatherService.getWeatherSuitability(weatherData);
      
      // Verify that the function returns an object with outdoor, indoor, and anyWeather scores
      expect(result).toHaveProperty('outdoor');
      expect(result).toHaveProperty('indoor');
      expect(result).toHaveProperty('anyWeather');
      
      // Verify that the scores are between 0 and 1
      expect(result.outdoor).toBeGreaterThanOrEqual(0);
      expect(result.outdoor).toBeLessThanOrEqual(1);
      expect(result.indoor).toBeGreaterThanOrEqual(0);
      expect(result.indoor).toBeLessThanOrEqual(1);
      
      // Test with different weather conditions to ensure scores change appropriately
      const badWeather = createMockWeatherData({
        temperature: 40,
        condition: 'Thunderstorm',
        precipitation: 80
      });
      
      const badResult = weatherService.getWeatherSuitability(badWeather);
      expect(badResult.outdoor).toBeLessThan(result.outdoor);
    });
  });

  describe('getWeatherDescription', () => {
    it('should generate a human-readable weather description', () => {
      // Create mock weather data
      const weatherData = createMockWeatherData({
        temperature: 75,
        condition: 'Sunny',
        precipitation: 0
      });
      
      // Call weatherService.getWeatherDescription with the weather data
      const result = weatherService.getWeatherDescription(weatherData);
      
      // Verify that the function returns a non-empty string
      expect(result).toBeTypeOf('string');
      expect(result.length).toBeGreaterThan(0);
      
      // Verify that the description includes temperature and condition information
      expect(result).toContain('warm');
      expect(result).toContain('sunny');
      expect(result).toContain('75°F');
      
      // Test with different weather conditions to ensure descriptions change appropriately
      const rainyWeather = createMockWeatherData({
        temperature: 50,
        condition: 'Rainy',
        precipitation: 70
      });
      
      const rainyResult = weatherService.getWeatherDescription(rainyWeather);
      expect(rainyResult).toContain('cool');
      expect(rainyResult).toContain('rainy');
      expect(rainyResult).toContain('precipitation');
    });
  });

  describe('suggestActivityType', () => {
    it('should suggest appropriate activity types based on weather', () => {
      // Create mock weather data for good outdoor conditions
      const goodOutdoorWeather = createMockWeatherData({
        temperature: 75,
        condition: 'Sunny',
        precipitation: 0
      });
      
      // Call weatherService.suggestActivityType with the good outdoor weather data
      const goodResult = weatherService.suggestActivityType(goodOutdoorWeather);
      // Verify that the function returns 'outdoor'
      expect(goodResult).toBe('outdoor');
      
      // Create mock weather data for poor outdoor conditions
      const badOutdoorWeather = createMockWeatherData({
        temperature: 40,
        condition: 'Rainy',
        precipitation: 80
      });
      
      // Call weatherService.suggestActivityType with the poor outdoor weather data
      const badResult = weatherService.suggestActivityType(badOutdoorWeather);
      // Verify that the function returns 'indoor'
      expect(badResult).toBe('indoor');
      
      // Create mock weather data for moderate conditions
      const moderateWeather = createMockWeatherData({
        temperature: 68,
        condition: 'Partly Cloudy',
        precipitation: 20
      });
      
      // Call weatherService.suggestActivityType with the moderate weather data
      const moderateResult = weatherService.suggestActivityType(moderateWeather);
      // Verify that the function returns 'either'
      expect(moderateResult).toBe('either');
    });
  });

  describe('clearCache', () => {
    it('should clear the weather service cache', () => {
      // Set up OpenWeatherMapIntegration mock
      mockOpenWeatherMapInstance.clearCache.mockImplementation(() => {});
      
      // Call weatherService.clearCache
      weatherService.clearCache();
      
      // Verify that OpenWeatherMapIntegration.clearCache was called
      expect(mockCacheInstance.flushAll).toHaveBeenCalled();
    });
  });
});