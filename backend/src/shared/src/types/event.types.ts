/**
 * event.types.ts
 * 
 * TypeScript definitions for events, attendees, venues, and related data structures
 * used across the Tribe platform's microservices. This file establishes standard data
 * structures for event planning, management, and coordination.
 */

import { ICoordinates, InterestCategory } from './profile.types';

/**
 * Defines the possible states of an event throughout its lifecycle
 */
export enum EventStatus {
  DRAFT = 'draft',          // Initial creation state, not yet visible to members
  SCHEDULED = 'scheduled',  // Confirmed and visible to members
  ACTIVE = 'active',        // Currently happening
  COMPLETED = 'completed',  // Successfully concluded
  CANCELLED = 'cancelled'   // Cancelled before occurring
}

/**
 * Defines the types of events that can be created
 */
export enum EventType {
  IN_PERSON = 'in_person',  // Physical meetup
  VIRTUAL = 'virtual',      // Online-only event
  HYBRID = 'hybrid'         // Combination of physical and virtual
}

/**
 * Defines the visibility settings for events
 */
export enum EventVisibility {
  TRIBE_ONLY = 'tribe_only', // Only visible to tribe members
  PUBLIC = 'public'          // Visible to all users
}

/**
 * Defines the possible RSVP statuses for event attendees
 */
export enum RSVPStatus {
  GOING = 'going',           // Confirmed attendance
  MAYBE = 'maybe',           // Tentative attendance
  NOT_GOING = 'not_going',   // Declined attendance
  NO_RESPONSE = 'no_response' // No response yet
}

/**
 * Defines the possible payment statuses for event attendees
 */
export enum PaymentStatus {
  NOT_REQUIRED = 'not_required', // No payment needed for this event
  PENDING = 'pending',           // Payment initiated but not completed
  COMPLETED = 'completed',       // Payment successfully processed
  FAILED = 'failed'              // Payment processing failed
}

/**
 * Defines weather data structure for event planning and recommendations
 */
export interface IWeatherData {
  temperature: number;   // Temperature in degrees Fahrenheit
  condition: string;     // Brief description (e.g., "Sunny", "Rainy")
  icon: string;          // Weather icon code
  precipitation: number; // Precipitation probability (0-100%)
  forecast: string;      // Detailed weather forecast
}

/**
 * Defines venue data structure for event locations
 */
export interface IVenue {
  id: string;
  name: string;
  address: string;
  coordinates: ICoordinates;
  placeId: string;              // Reference to external mapping service (e.g., Google Maps)
  website: string;
  phoneNumber: string;
  capacity: number;             // Maximum capacity of the venue
  priceLevel: number;           // Price level indicator (1-4)
  rating: number;               // Average rating (0-5)
  photos: string[];             // Array of photo URLs
  categories: InterestCategory[]; // Categories this venue belongs to
  metadata: Record<string, any>; // Additional flexible data
}

/**
 * Defines media associated with events (photos, documents, etc.)
 */
export interface IEventMedia {
  id: string;
  eventId: string;
  type: string;         // Media type (photo, document, etc.)
  url: string;          // Media resource URL
  uploadedAt: Date;
  uploadedBy: string;   // User ID of uploader
}

/**
 * Defines the relationship between a user and an event, including RSVP and check-in status
 */
export interface IEventAttendee {
  id: string;
  eventId: string;
  userId: string;
  rsvpStatus: RSVPStatus;
  rsvpTime: Date;
  hasCheckedIn: boolean;
  checkedInAt: Date;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  paymentId: string;         // Reference to payment transaction
  metadata: Record<string, any>; // Additional flexible data
}

/**
 * Defines the core event entity structure
 */
export interface IEvent {
  id: string;
  name: string;
  description: string;
  tribeId: string;
  createdBy: string;        // User ID of creator
  eventType: EventType;
  status: EventStatus;
  visibility: EventVisibility;
  startTime: Date;
  endTime: Date;
  location: string;         // Human-readable location
  coordinates: ICoordinates;
  venueId: string;          // Reference to venue
  weatherData: IWeatherData;
  cost: number;             // Cost per person if applicable
  paymentRequired: boolean;
  maxAttendees: number;     // Maximum capacity
  categories: InterestCategory[]; // Event categories
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>; // Additional flexible data
}

/**
 * Defines the data structure for creating a new event
 */
export interface IEventCreate {
  name: string;
  description: string;
  tribeId: string;
  createdBy: string;
  eventType: EventType;
  visibility: EventVisibility;
  startTime: Date;
  endTime: Date;
  location: string;
  coordinates: ICoordinates;
  venueId: string;
  cost: number;
  paymentRequired: boolean;
  maxAttendees: number;
  categories: InterestCategory[];
}

/**
 * Defines the data structure for updating an existing event
 */
export interface IEventUpdate {
  name?: string;
  description?: string;
  eventType?: EventType;
  status?: EventStatus;
  visibility?: EventVisibility;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  coordinates?: ICoordinates;
  venueId?: string;
  weatherData?: IWeatherData;
  cost?: number;
  paymentRequired?: boolean;
  maxAttendees?: number;
  categories?: InterestCategory[];
}

/**
 * Defines the data structure for updating an attendee's RSVP status
 */
export interface IRSVPUpdate {
  eventId: string;
  userId: string;
  status: RSVPStatus;
}

/**
 * Defines the data structure for updating an attendee's check-in status
 */
export interface ICheckInUpdate {
  eventId: string;
  userId: string;
  hasCheckedIn: boolean;
  coordinates: ICoordinates; // Location where check-in occurred
}

/**
 * Defines the event data structure for list API responses
 */
export interface IEventResponse {
  id: string;
  name: string;
  description: string;
  tribeId: string;
  tribeName: string;         // Added for convenience in responses
  createdBy: string;
  creatorName: string;       // Added for convenience in responses
  eventType: EventType;
  status: EventStatus;
  visibility: EventVisibility;
  startTime: Date;
  endTime: Date;
  location: string;
  coordinates: ICoordinates;
  weatherData: IWeatherData;
  attendeeCount: number;     // Count of attendees
  userRsvpStatus: RSVPStatus; // Current user's RSVP status
  categories: InterestCategory[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Defines the detailed event data structure for single event API responses
 */
export interface IEventDetailResponse {
  id: string;
  name: string;
  description: string;
  tribeId: string;
  tribeName: string;
  createdBy: string;
  creatorName: string;
  eventType: EventType;
  status: EventStatus;
  visibility: EventVisibility;
  startTime: Date;
  endTime: Date;
  location: string;
  coordinates: ICoordinates;
  venue: IVenue;
  weatherData: IWeatherData;
  cost: number;
  paymentRequired: boolean;
  maxAttendees: number;
  attendees: Array<IEventAttendee & { user: { id: string, name: string, avatarUrl: string } }>;
  userRsvpStatus: RSVPStatus;
  userCheckedIn: boolean;
  media: IEventMedia[];
  categories: InterestCategory[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Defines search parameters for finding events
 */
export interface IEventSearchParams {
  query?: string;
  tribeId?: string;
  userId?: string;
  status?: EventStatus[];
  eventType?: EventType[];
  categories?: InterestCategory[];
  location?: ICoordinates;
  maxDistance?: number;       // In miles
  startDate?: Date;
  endDate?: Date;
  maxCost?: number;
  page?: number;              // Pagination page number
  limit?: number;             // Items per page
}

/**
 * Defines parameters for AI-powered event recommendations
 */
export interface IEventRecommendationParams {
  userId: string;
  tribeId?: string;
  location: ICoordinates;
  maxDistance: number;
  maxCost?: number;
  preferredCategories?: InterestCategory[];
  preferredDays?: number[];   // Days of week (0-6, where 0 is Sunday)
  preferredTimeRanges?: Array<{ start: string, end: string }>;
  excludeEventIds?: string[]; // Events to exclude from recommendations
  limit?: number;
}

/**
 * Defines parameters for weather-based activity recommendations
 */
export interface IWeatherBasedActivityParams {
  location: ICoordinates;
  date: Date;
  preferIndoor: boolean;       // Preference for indoor activities
  preferOutdoor: boolean;      // Preference for outdoor activities
  maxDistance: number;
  preferredCategories?: InterestCategory[];
  maxCost?: number;
  limit?: number;
}