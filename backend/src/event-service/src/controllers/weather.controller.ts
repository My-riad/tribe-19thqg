/**
 * Weather Controller Module
 * 
 * This controller handles HTTP requests for weather-related operations in the event service.
 * It provides endpoints for retrieving current weather, forecasts, and weather-based activity
 * suggestions based on location coordinates.
 * 
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import {
  getCurrentWeather,
  getWeatherForecast,
  getWeatherForDate,
  isOutdoorWeather,
  getWeatherSuitability,
  getWeatherDescription,
  suggestActivityType
} from '../services/weather.service';
import { validateWeatherBasedActivityParams } from '../validations';
import { ICoordinates } from '../../../shared/src/types/profile.types';
import { IWeatherData, IWeatherBasedActivityParams } from '../../../shared/src/types/event.types';
import { ApiError } from '../../../shared/src/errors/api.error';

/**
 * Handles requests to get current weather data for a specific location
 * 
 * @param req - Express request object with latitude and longitude query parameters
 * @param res - Express response object
 * @param next - Express next function
 */
export async function getCurrentWeatherHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract coordinates from query parameters
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      throw ApiError.badRequest('Invalid coordinates. Latitude and longitude must be valid numbers.');
    }

    const coordinates: ICoordinates = { latitude, longitude };

    // Get current weather data
    const weatherData = await getCurrentWeather(coordinates);

    // Return weather data
    res.status(200).json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles requests to get weather forecast for a specific location
 * 
 * @param req - Express request object with latitude and longitude query parameters
 * @param res - Express response object
 * @param next - Express next function
 */
export async function getWeatherForecastHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract coordinates from query parameters
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      throw ApiError.badRequest('Invalid coordinates. Latitude and longitude must be valid numbers.');
    }

    const coordinates: ICoordinates = { latitude, longitude };

    // Get weather forecast data
    const forecastData = await getWeatherForecast(coordinates);

    // Return forecast data
    res.status(200).json({
      success: true,
      data: forecastData
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles requests to get weather forecast for a specific date and location
 * 
 * @param req - Express request object with latitude, longitude, and date query parameters
 * @param res - Express response object
 * @param next - Express next function
 */
export async function getWeatherForDateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract coordinates and date from query parameters
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const dateStr = req.query.date as string;

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      throw ApiError.badRequest('Invalid coordinates. Latitude and longitude must be valid numbers.');
    }

    // Validate date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw ApiError.badRequest('Invalid date format. Please use YYYY-MM-DD format.');
    }

    const coordinates: ICoordinates = { latitude, longitude };

    // Get weather for the specified date
    const weatherData = await getWeatherForDate(coordinates, date);

    // Return weather data or appropriate message if not available
    if (weatherData) {
      res.status(200).json({
        success: true,
        data: weatherData
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Weather data not available for the specified date',
        data: null
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Handles requests to get weather suitability scores for different activity types
 * 
 * @param req - Express request object with latitude and longitude query parameters
 * @param res - Express response object
 * @param next - Express next function
 */
export async function getWeatherSuitabilityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract coordinates from query parameters
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      throw ApiError.badRequest('Invalid coordinates. Latitude and longitude must be valid numbers.');
    }

    const coordinates: ICoordinates = { latitude, longitude };

    // Get current weather data
    const weatherData = await getCurrentWeather(coordinates);

    // Calculate suitability scores
    const suitabilityScores = getWeatherSuitability(weatherData);

    // Return suitability scores
    res.status(200).json({
      success: true,
      data: {
        weather: weatherData,
        suitability: suitabilityScores
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles requests to suggest whether indoor or outdoor activities are more suitable based on weather
 * 
 * @param req - Express request object with latitude and longitude query parameters
 * @param res - Express response object
 * @param next - Express next function
 */
export async function suggestActivityTypeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract coordinates from query parameters
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      throw ApiError.badRequest('Invalid coordinates. Latitude and longitude must be valid numbers.');
    }

    const coordinates: ICoordinates = { latitude, longitude };

    // Get current weather data
    const weatherData = await getCurrentWeather(coordinates);

    // Get activity suggestion
    const suggestion = suggestActivityType(weatherData);

    // Return suggestion
    res.status(200).json({
      success: true,
      data: {
        weather: weatherData,
        suggestion,
        description: getWeatherDescription(weatherData)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles requests to get activity recommendations based on weather conditions
 * 
 * @param req - Express request object with activity parameters in the request body
 * @param res - Express response object
 * @param next - Express next function
 */
export async function getWeatherBasedActivitiesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request parameters
    const params = validateWeatherBasedActivityParams(req.body) as IWeatherBasedActivityParams;

    // Get weather data for the specified date and location
    const weatherData = await getWeatherForDate(params.location, new Date(params.date));

    // If weather data is not available, return appropriate response
    if (!weatherData) {
      res.status(200).json({
        success: true,
        message: 'Weather data not available for the specified date',
        data: {
          weather: null,
          isOutdoorSuitable: false,
          suggestedActivityType: 'indoor',
          recommendations: []
        }
      });
      return;
    }

    // Determine if weather is suitable for outdoor activities
    const isOutdoorSuitable = isOutdoorWeather(weatherData);
    
    // Get activity suggestion based on weather and user preferences
    let suggestedType = suggestActivityType(weatherData);
    
    // Adjust suggestion based on user preferences
    if (params.preferIndoor && !params.preferOutdoor) {
      suggestedType = 'indoor';
    } else if (!params.preferIndoor && params.preferOutdoor) {
      suggestedType = isOutdoorSuitable ? 'outdoor' : 'indoor';
    }

    // In a real implementation, we would use this information to query an activity service
    // For now, we'll just return the weather data and suggested activity type
    
    res.status(200).json({
      success: true,
      data: {
        weather: weatherData,
        isOutdoorSuitable,
        suggestedActivityType: suggestedType,
        weatherDescription: getWeatherDescription(weatherData),
        // This would normally come from an activity service based on the weather conditions
        recommendations: []
      }
    });
  } catch (error) {
    next(error);
  }
}