/**
 * profile.types.ts
 * 
 * TypeScript definitions for user profiles, personality traits, interests, and location data
 * used across the Tribe platform's microservices. This file establishes standard data structures
 * for personality-based matchmaking and user profiling.
 */

import { 
  EMAIL_REGEX, 
  PHONE_REGEX, 
  LATITUDE_REGEX, 
  LONGITUDE_REGEX 
} from '../constants/regex.constants';
import { MAX_TRIBES_PER_USER } from '../constants/app.constants';

/**
 * Categories of interests for user profiles and tribe matching
 */
export enum InterestCategory {
  OUTDOOR_ADVENTURES = 'outdoor_adventures',
  ARTS_CULTURE = 'arts_culture',
  FOOD_DINING = 'food_dining',
  SPORTS_FITNESS = 'sports_fitness',
  GAMES_ENTERTAINMENT = 'games_entertainment',
  LEARNING_EDUCATION = 'learning_education',
  TECHNOLOGY = 'technology',
  WELLNESS_MINDFULNESS = 'wellness_mindfulness'
}

/**
 * Levels of interest a user has in a particular category
 */
export enum InterestLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

/**
 * Personality traits based on the Big Five/OCEAN model and additional traits
 * Used for personality assessment and compatibility matching
 */
export enum PersonalityTrait {
  // Core OCEAN traits
  OPENNESS = 'openness',
  CONSCIENTIOUSNESS = 'conscientiousness',
  EXTRAVERSION = 'extraversion',
  AGREEABLENESS = 'agreeableness',
  NEUROTICISM = 'neuroticism',
  
  // Additional traits for more granular matching
  ADVENTUROUSNESS = 'adventurousness',
  CREATIVITY = 'creativity',
  CURIOSITY = 'curiosity',
  SOCIABILITY = 'sociability',
  ASSERTIVENESS = 'assertiveness'
}

/**
 * Communication styles for matching compatible conversation dynamics
 * Used to predict how users will interact in group settings
 */
export enum CommunicationStyle {
  DIRECT = 'direct',
  THOUGHTFUL = 'thoughtful',
  EXPRESSIVE = 'expressive',
  SUPPORTIVE = 'supportive',
  ANALYTICAL = 'analytical'
}

/**
 * Geographic coordinates for location-based features
 * Used for proximity matching and local event recommendations
 */
export interface ICoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Core user profile entity structure
 * Contains personal information, preferences, and metadata
 */
export interface IProfile {
  id: string;
  userId: string;
  name: string;
  bio: string;
  location: string;
  coordinates: ICoordinates;
  birthdate: Date;
  phoneNumber: string;
  avatarUrl: string;
  communicationStyle: CommunicationStyle;
  maxTravelDistance: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data structure for creating a new user profile
 * Required when a user completes their profile after registration
 */
export interface IProfileCreate {
  userId: string;
  name: string;
  bio: string;
  location: string;
  coordinates: ICoordinates;
  birthdate: Date;
  phoneNumber: string;
  avatarUrl: string;
  communicationStyle: CommunicationStyle;
  maxTravelDistance: number;
}

/**
 * Data structure for updating an existing user profile
 * All fields are optional to allow partial updates
 */
export interface IProfileUpdate {
  name?: string;
  bio?: string;
  location?: string;
  coordinates?: ICoordinates;
  birthdate?: Date;
  phoneNumber?: string;
  avatarUrl?: string;
  communicationStyle?: CommunicationStyle;
  maxTravelDistance?: number;
}

/**
 * Personality trait measurement for a user profile
 * Stores individual trait scores as determined by assessments
 */
export interface IPersonalityTrait {
  id: string;
  profileId: string;
  trait: PersonalityTrait;
  score: number; // Typically 0-100 scale
  assessedAt: Date;
}

/**
 * Complete personality assessment submission
 * Used when processing the results of a personality questionnaire
 */
export interface IPersonalityAssessment {
  profileId: string;
  traits: Array<{ trait: PersonalityTrait; score: number }>;
  communicationStyle: CommunicationStyle;
  assessmentSource: string; // e.g., 'questionnaire', 'behavior_analysis'
}

/**
 * User interest with category, specific name, and interest level
 * Used for matching users with similar interests
 */
export interface IInterest {
  id: string;
  profileId: string;
  category: InterestCategory;
  name: string; // Specific interest within the category
  level: InterestLevel;
}

/**
 * Batch submission of user interests
 * Used when a user selects multiple interests at once
 */
export interface IInterestSubmission {
  profileId: string;
  interests: Array<{ category: InterestCategory; name: string; level: InterestLevel }>;
  replaceExisting: boolean; // Whether to replace all existing interests or append
}

/**
 * Complete user profile data structure for API responses
 * Extends the base profile with related personality and interest data
 */
export interface IProfileResponse extends IProfile {
  personalityTraits: IPersonalityTrait[];
  interests: IInterest[];
}

/**
 * Search parameters for finding user profiles
 * Used for tribe discovery and matchmaking
 */
export interface IProfileSearchParams {
  query?: string; // General search term
  location?: ICoordinates; // Center point for geo-search
  maxDistance?: number; // Maximum distance in miles
  interests?: InterestCategory[]; // Filter by interest categories
  communicationStyles?: CommunicationStyle[]; // Filter by communication styles
  personalityTraits?: Array<{ trait: PersonalityTrait; minScore: number; maxScore: number }>; // Filter by personality ranges
  page?: number; // Pagination page number
  limit?: number; // Items per page
}

/**
 * Result of a compatibility calculation between two profiles
 * Used by the matchmaking algorithm to determine tribe composition
 */
export interface ICompatibilityResult {
  profileId1: string;
  profileId2: string;
  overallScore: number; // 0-100 compatibility percentage
  personalityScore: number; // 0-100 personality compatibility
  interestScore: number; // 0-100 interest compatibility
  communicationScore: number; // 0-100 communication style compatibility
  calculatedAt: Date;
}

/**
 * Validation functions for profile-related data structures
 * Used to ensure data integrity before database operations
 */
export interface IProfileValidation {
  validateProfileCreate: (profile: IProfileCreate) => boolean | Error;
  validateProfileUpdate: (profile: IProfileUpdate) => boolean | Error;
  validateInterest: (interest: Partial<IInterest>) => boolean | Error;
  validatePersonalityTrait: (trait: Partial<IPersonalityTrait>) => boolean | Error;
  validateCoordinates: (coordinates: ICoordinates) => boolean | Error;
}