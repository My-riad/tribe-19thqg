import { EventService } from './event.service';
import { DiscoveryService } from './discovery.service';
import { RecommendationService } from './recommendation.service';
import { getCurrentWeather, getWeatherForecast, getWeatherForDate, isOutdoorWeather, getWeatherSuitability, getWeatherDescription, suggestActivityType, clearCache } from './weather.service';

/**
 * Index file that exports all service classes and functions from the event service module.
 * This file serves as the central export point for the event service's functionality, making it easier to import services throughout the application.
 */

export {
    EventService,
    DiscoveryService,
    RecommendationService,
    getCurrentWeather,
    getWeatherForecast,
    getWeatherForDate,
    isOutdoorWeather,
    getWeatherSuitability,
    getWeatherDescription,
    suggestActivityType,
    clearCache
};