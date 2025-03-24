/**
 * TypeScript type definitions for event-related data structures used throughout the Tribe application.
 * This file defines interfaces and enums for events, event attendees, RSVPs, and related types 
 * to ensure type safety for all event-related operations.
 */

import { Coordinates, Profile } from './profile.types';
import { TribeTypes } from './tribe.types';

/**
 * Enum representing the types of events that can be created
 */
export enum EventType {
  OUTDOOR_ACTIVITY = 'OUTDOOR_ACTIVITY',
  INDOOR_ACTIVITY = 'INDOOR_ACTIVITY',
  DINING = 'DINING',
  ENTERTAINMENT = 'ENTERTAINMENT',
  CULTURAL = 'CULTURAL',
  EDUCATIONAL = 'EDUCATIONAL',
  SOCIAL = 'SOCIAL',
  OTHER = 'OTHER'
}

/**
 * Enum representing the current status of an event
 */
export enum EventStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  RESCHEDULED = 'RESCHEDULED'
}

/**
 * Enum representing a user's RSVP status for an event
 */
export enum RSVPStatus {
  GOING = 'GOING',
  MAYBE = 'MAYBE',
  NOT_GOING = 'NOT_GOING',
  NO_RESPONSE = 'NO_RESPONSE'
}

/**
 * Enum representing the payment status for a paid event
 */
export enum PaymentStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

/**
 * Enum representing weather conditions for outdoor events
 */
export enum WeatherCondition {
  SUNNY = 'SUNNY',
  PARTLY_CLOUDY = 'PARTLY_CLOUDY',
  CLOUDY = 'CLOUDY',
  RAINY = 'RAINY',
  STORMY = 'STORMY',
  SNOWY = 'SNOWY',
  WINDY = 'WINDY',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Interface representing details about an event venue
 */
export interface VenueDetails {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  phoneNumber: string;
  website: string;
  rating: number;
  priceLevel: number;
  photos: string[];
  openingHours: Record<string, string>;
  amenities: string[];
}

/**
 * Interface representing weather data for an event
 */
export interface WeatherData {
  condition: WeatherCondition;
  temperature: number;
  temperatureUnit: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  iconUrl: string;
  forecast: string;
}

/**
 * Interface representing an event in the application
 */
export interface Event {
  id: string;
  name: string;
  description: string;
  eventType: EventType;
  location: string;
  coordinates: Coordinates;
  venueId: string;
  venueDetails: VenueDetails;
  startTime: Date;
  endTime: Date;
  tribeId: string;
  tribe: TribeTypes.Tribe;
  createdBy: string;
  createdAt: Date;
  status: EventStatus;
  imageUrl: string;
  attendees: EventAttendee[];
  attendeeCount: number;
  maxAttendees: number;
  cost: number;
  paymentStatus: PaymentStatus;
  weatherData: WeatherData;
  isAiGenerated: boolean;
  userRsvpStatus: RSVPStatus; // Current user's RSVP status
  metadata: Record<string, any>; // Flexible field for additional data
}

/**
 * Interface representing an attendee of an event
 */
export interface EventAttendee {
  id: string;
  eventId: string;
  userId: string;
  profile: Profile;
  rsvpStatus: RSVPStatus;
  rsvpTime: Date;
  hasCheckedIn: boolean;
  checkedInAt: Date;
  paymentStatus: PaymentStatus;
}

/**
 * Interface representing filters for searching events
 */
export interface EventFilters {
  tribeId: string;
  userId: string;
  eventType: EventType;
  status: EventStatus;
  startDate: Date;
  endDate: Date;
  location: string;
  coordinates: Coordinates;
  radius: number;
  query: string;
  isAiGenerated: boolean;
  maxCost: number;
}

/**
 * Interface representing an AI-suggested event for a tribe
 */
export interface EventSuggestion {
  event: Event;
  matchScore: number;
  matchReasons: string[];
  suggestedAt: Date;
  weatherSuitability: number;
  budgetFriendliness: number;
}

/**
 * Interface representing an AI-suggested optimal time slot for an event
 */
export interface OptimalTimeSlot {
  startTime: Date;
  endTime: Date;
  availableMembers: number;
  totalMembers: number;
  availabilityPercentage: number;
  weatherCondition: WeatherCondition;
  recommendationScore: number;
}

/**
 * Interface representing the request payload for creating a new event
 */
export interface CreateEventRequest {
  name: string;
  description: string;
  eventType: EventType;
  location: string;
  coordinates: Coordinates;
  venueId: string;
  startTime: Date;
  endTime: Date;
  tribeId: string;
  imageUrl: string;
  maxAttendees: number;
  cost: number;
  isAiGenerated: boolean;
}

/**
 * Interface representing the request payload for updating an existing event
 */
export interface UpdateEventRequest {
  name: string;
  description: string;
  eventType: EventType;
  location: string;
  coordinates: Coordinates;
  venueId: string;
  startTime: Date;
  endTime: Date;
  status: EventStatus;
  imageUrl: string;
  maxAttendees: number;
  cost: number;
}

/**
 * Interface representing user feedback for an event
 */
export interface EventFeedback {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comments: string;
  submittedAt: Date;
}

/**
 * Namespace containing all event-related types for easy import
 */
export namespace EventTypes {
  export {
    Event,
    EventAttendee,
    EventStatus,
    EventType,
    RSVPStatus,
    PaymentStatus,
    WeatherCondition,
    VenueDetails,
    WeatherData,
    EventFilters,
    EventSuggestion,
    OptimalTimeSlot,
    CreateEventRequest,
    UpdateEventRequest,
    EventFeedback
  };
}