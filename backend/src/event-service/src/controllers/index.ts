import * as eventController from './event.controller';
import * as discoveryController from './discovery.controller';
import * as recommendationController from './recommendation.controller';
import * as weatherController from './weather.controller';

/**
 * Export all controller functions from the event service controllers.
 * This file serves as a central export point for all event-related API endpoint handlers,
 * including event management, discovery, recommendations, and weather-related functionality.
 */
export {
    eventController, // Export all event management controller functions
    discoveryController, // Export all event discovery controller functions
    recommendationController, // Export all event recommendation controller functions
    weatherController  // Export all weather-related controller functions
};