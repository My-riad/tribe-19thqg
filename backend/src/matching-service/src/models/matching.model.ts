import {
  CompatibilityFactor,
  ICompatibilityDetail
} from './compatibility.model';

import {
  InterestCategory,
  PersonalityTrait,
  CommunicationStyle,
  ICoordinates
} from '../../shared/src/types/profile.types';

import {
  TribeStatus,
  TribePrivacy
} from '../../shared/src/types/tribe.types';

import {
  TRIBE_LIMITS
} from '../../shared/src/constants/app.constants';

/**
 * Default compatibility threshold for matching users
 * Users with a compatibility score below this value won't be matched
 */
export const DEFAULT_COMPATIBILITY_THRESHOLD = 0.7; // 70%

/**
 * Default maximum distance (in miles) for location-based matching
 */
export const DEFAULT_MAX_DISTANCE = 25; // miles

/**
 * Default weights for different compatibility factors
 * These weights determine how much each factor contributes to the overall compatibility score
 */
export const DEFAULT_FACTOR_WEIGHTS: Record<CompatibilityFactor, number> = {
  [CompatibilityFactor.PERSONALITY]: 0.3,
  [CompatibilityFactor.INTERESTS]: 0.3,
  [CompatibilityFactor.COMMUNICATION_STYLE]: 0.2,
  [CompatibilityFactor.LOCATION]: 0.1,
  [CompatibilityFactor.GROUP_BALANCE]: 0.1
};

/**
 * Defines the criteria used for matching users to tribes or other users
 * Contains parameters that influence the matching algorithm's decisions
 */
export interface IMatchingCriteria {
  /** Personality traits with importance weights */
  personalityTraits: Array<{ trait: PersonalityTrait; importance: number }>;

  /** Interest categories with importance weights */
  interests: Array<{ category: InterestCategory; importance: number }>;

  /** Preferred communication styles */
  communicationStyles: Array<CommunicationStyle>;

  /** Geographic location for proximity matching */
  location: ICoordinates;

  /** Maximum distance in miles for matching */
  maxDistance: number;

  /** Weights for different compatibility factors */
  factorWeights: Record<CompatibilityFactor, number>;
}

/**
 * Defines a user's preferences for automatic matching to tribes
 */
export interface IMatchingPreferences {
  /** User ID */
  userId: string;

  /** Whether auto-matching is enabled for this user */
  autoMatchingEnabled: boolean;

  /** How frequently matching should occur */
  matchingFrequency: 'weekly' | 'biweekly' | 'monthly';

  /** Matching criteria */
  criteria: IMatchingCriteria;

  /** When the user was last matched */
  lastMatchedAt: Date;

  /** When the preferences were created */
  createdAt: Date;

  /** When the preferences were last updated */
  updatedAt: Date;
}

/**
 * Defines a matching operation that processes users for tribe formation
 * Tracks the state and results of a matching job
 */
export interface IMatchingOperation {
  /** Unique identifier for the operation */
  id: string;

  /** Type of matching operation */
  type: 'auto' | 'manual' | 'batch';

  /** Current status of the operation */
  status: 'pending' | 'processing' | 'completed' | 'failed';

  /** Users included in this matching operation */
  userIds: string[];

  /** Matching criteria applied to this operation */
  criteria: IMatchingCriteria;

  /** When the operation started */
  startedAt: Date;

  /** When the operation completed (if finished) */
  completedAt?: Date;

  /** Error message if operation failed */
  error?: string;
}

/**
 * Defines the result of a matching operation for a single user
 * Records whether the user was successfully matched to a tribe
 */
export interface IMatchingResult {
  /** ID of the matching operation that produced this result */
  operationId: string;

  /** User ID */
  userId: string;

  /** Whether the user was successfully matched */
  matched: boolean;

  /** ID of the tribe the user was matched with (if matched) */
  tribeId?: string;

  /** Whether a new tribe was created for this match */
  isNewTribe?: boolean;

  /** Overall compatibility score with the tribe */
  compatibilityScore?: number;

  /** Detailed breakdown of compatibility by factor */
  details?: ICompatibilityDetail[];

  /** When the result was created */
  createdAt: Date;
}

/**
 * Defines a tribe formation result from a matching operation
 * Records the creation or modification of a tribe through matching
 */
export interface ITribeFormation {
  /** Unique identifier */
  id: string;

  /** ID of the matching operation that led to this formation */
  operationId: string;

  /** ID of the formed or modified tribe */
  tribeId: string;

  /** Whether this is a newly created tribe */
  isNewTribe: boolean;

  /** Members assigned to the tribe with their compatibility scores */
  members: Array<{ userId: string; compatibilityScore: number }>;

  /** Average compatibility score across all members */
  averageCompatibility: number;

  /** When the tribe formation occurred */
  createdAt: Date;
}

/**
 * Defines a request to opt-in for automatic matching
 */
export interface IAutoMatchingRequest {
  /** User ID */
  userId: string;

  /** Matching criteria */
  criteria: IMatchingCriteria;
}

/**
 * Defines a request for immediate manual matching
 */
export interface IManualMatchingRequest {
  /** User ID */
  userId: string;

  /** Matching criteria */
  criteria: IMatchingCriteria;

  /** Whether to prioritize existing tribes over forming new ones */
  preferExistingTribes: boolean;
}

/**
 * Defines a request for batch matching of multiple users
 */
export interface IBatchMatchingRequest {
  /** User IDs to include in the batch */
  userIds: string[];

  /** Matching criteria */
  criteria: IMatchingCriteria;

  /** Whether to prioritize existing tribes over forming new ones */
  preferExistingTribes: boolean;
}

/**
 * Defines criteria for searching compatible tribes
 */
export interface ITribeSearchCriteria {
  /** Interest categories to match */
  interests: InterestCategory[];

  /** Geographic location for proximity search */
  location: ICoordinates;

  /** Maximum distance in miles */
  maxDistance: number;

  /** Filter by tribe status */
  status: TribeStatus[];

  /** Filter by privacy setting */
  privacy: TribePrivacy;

  /** Minimum compatibility score threshold */
  minCompatibility: number;

  /** Whether to only include tribes with available spots */
  hasAvailableSpots: boolean;
}

/**
 * Defines the response structure for matching operations
 */
export interface IMatchingResponse {
  /** ID of the matching operation */
  operationId: string;

  /** Status of the operation */
  status: 'success' | 'pending' | 'failed';

  /** Descriptive message */
  message: string;

  /** Matching results for users */
  results: IMatchingResult[];

  /** Tribe formations created by this operation */
  tribeFormations: ITribeFormation[];
}

/**
 * Defines a tribe suggestion for a user based on compatibility
 */
export interface IMatchingSuggestion {
  /** User ID */
  userId: string;

  /** Tribe ID */
  tribeId: string;

  /** Name of the tribe */
  tribeName: string;

  /** Overall compatibility score (0-1) */
  compatibilityScore: number;

  /** Detailed compatibility breakdown by factor */
  compatibilityDetails: ICompatibilityDetail[];

  /** Current number of members in the tribe */
  memberCount: number;

  /** Primary interests of the tribe */
  primaryInterests: Array<{ category: InterestCategory; name: string }>;

  /** Location name */
  location: string;

  /** Distance from user in miles */
  distance: number;

  /** When the suggestion was created */
  createdAt: Date;

  /** When the suggestion expires */
  expiresAt: Date;
}

/**
 * Defines statistics about matching operations for analytics
 */
export interface IMatchingStats {
  /** Total number of matching operations performed */
  totalOperations: number;

  /** Number of users successfully matched */
  successfulMatches: number;

  /** Number of new tribes formed */
  newTribesFormed: number;

  /** Number of users assigned to existing tribes */
  existingTribeAssignments: number;

  /** Average compatibility score across all matches */
  averageCompatibilityScore: number;

  /** Average time to process a matching operation (ms) */
  averageProcessingTime: number;
}