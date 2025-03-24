/**
 * Integration APIs Index Module
 * 
 * This module centralizes access to all external API integrations used by the event service,
 * providing a single entry point for accessing these integrations throughout the service.
 * 
 * These integrations support the "AI-Powered Real-Time Event & Activity Curation" feature 
 * (Technical Specifications/2.1 FEATURE CATALOG/2.1.5) by enabling:
 * - Discovery of local events through Eventbrite and Meetup APIs
 * - Venue information retrieval through Google Places API
 * - Weather-based activity suggestions through OpenWeatherMap API
 * 
 * The integrations follow the design specified in "External API Integration"
 * (Technical Specifications/6.3 INTEGRATION ARCHITECTURE/6.3.3 External Systems)
 * for secure and scalable interaction with third-party services.
 */

// Import integration classes
import EventbriteIntegration from './eventbrite.integration';
import GooglePlacesIntegration from './google-places.integration';
import MeetupIntegration from './meetup.integration';
import OpenWeatherMapIntegration from './openweathermap.integration';

// Export all integration classes
export {
  EventbriteIntegration,
  GooglePlacesIntegration,
  MeetupIntegration,
  OpenWeatherMapIntegration
};