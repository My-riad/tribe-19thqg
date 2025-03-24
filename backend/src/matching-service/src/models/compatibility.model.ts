import { 
  PersonalityTrait, 
  InterestCategory, 
  CommunicationStyle 
} from '../../shared/src/types/profile.types';

/**
 * Factors considered when calculating compatibility between users and tribes
 * These factors contribute to the overall compatibility score with different weights
 */
export enum CompatibilityFactor {
  PERSONALITY = 'personality',
  INTERESTS = 'interests',
  COMMUNICATION_STYLE = 'communication_style',
  LOCATION = 'location',
  GROUP_BALANCE = 'group_balance'
}

/**
 * Detailed information about a specific compatibility factor's contribution
 * to the overall compatibility score
 */
export interface ICompatibilityDetail {
  /** The specific factor being evaluated */
  factor: CompatibilityFactor;
  
  /** Weight of this factor in the overall compatibility calculation (0-1) */
  weight: number;
  
  /** Score for this particular factor (0-100) */
  score: number;
  
  /** Human-readable explanation of the compatibility calculation for this factor */
  description: string;
}

/**
 * Result of a personality compatibility calculation between two users
 * Based on the Big Five/OCEAN model (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
 */
export interface IPersonalityCompatibility {
  /** Individual compatibility scores for each personality trait */
  traitScores: Record<PersonalityTrait, number>;
  
  /** Overall personality compatibility score (0-100) */
  overallScore: number;
  
  /** Personality traits that complement each other */
  complementaryTraits: PersonalityTrait[];
  
  /** Personality traits that may cause conflict */
  conflictingTraits: PersonalityTrait[];
}

/**
 * Result of an interest compatibility calculation between a user and another user or tribe
 * Evaluates shared interests, interest categories, and interest levels
 */
export interface IInterestCompatibility {
  /** List of interests shared between the user and the target */
  sharedInterests: Array<{category: InterestCategory, name: string}>;
  
  /** Overall interest compatibility score (0-100) */
  overallScore: number;
  
  /** Whether there's a match in primary/highest interest category */
  primaryInterestMatch: boolean;
}

/**
 * Result of a communication style compatibility calculation between two users
 * Assesses how well their communication preferences would work together
 */
export interface ICommunicationCompatibility {
  /** Whether the communication styles are a direct match */
  styleMatch: boolean;
  
  /** Overall communication compatibility score (0-100) */
  overallScore: number;
  
  /** Whether the communication styles are complementary even if not matching */
  complementaryStyles: boolean;
}

/**
 * Result of a location compatibility calculation based on geographic distance
 * Considers user location preferences and physical proximity
 */
export interface ILocationCompatibility {
  /** Distance between users/tribe in miles */
  distance: number;
  
  /** Whether the distance is within the user's preferred range */
  withinPreferredRange: boolean;
  
  /** Overall location compatibility score (0-100, inversely proportional to distance) */
  overallScore: number;
}

/**
 * Analysis of how a user would affect the psychological balance of a tribe
 * Evaluates the distribution of personality traits before and after adding the user
 */
export interface IGroupBalanceAnalysis {
  /** Current distribution of personality traits in the tribe */
  currentBalance: Record<PersonalityTrait, number>;
  
  /** Projected distribution if the user joins the tribe */
  projectedBalance: Record<PersonalityTrait, number>;
  
  /** Impact score of the user on group balance (-100 to 100) */
  balanceImpact: number;
  
  /** Whether adding the user would improve the psychological diversity of the tribe */
  improvesBalance: boolean;
}

/**
 * Overall compatibility result between two users
 * Aggregates all compatibility factors with their respective weights
 */
export interface IUserCompatibility {
  /** ID of the user for whom compatibility is being calculated */
  userId: string;
  
  /** ID of the target user being compared */
  targetUserId: string;
  
  /** Overall compatibility score (0-100) */
  overallScore: number;
  
  /** Detailed breakdown of compatibility by factor */
  details: ICompatibilityDetail[];
  
  /** When the compatibility calculation was performed */
  calculatedAt: Date;
}

/**
 * Overall compatibility result between a user and a tribe
 * Includes individual compatibility with tribe members and group balance impact
 */
export interface ITribeCompatibility {
  /** ID of the user for whom compatibility is being calculated */
  userId: string;
  
  /** ID of the tribe being evaluated */
  tribeId: string;
  
  /** Overall compatibility score (0-100) */
  overallScore: number;
  
  /** Detailed breakdown of compatibility by factor */
  details: ICompatibilityDetail[];
  
  /** Individual compatibility scores with each tribe member */
  memberCompatibility: Array<{userId: string, score: number}>;
  
  /** Impact on the tribe's psychological balance (-100 to 100) */
  groupBalanceImpact: number;
  
  /** When the compatibility calculation was performed */
  calculatedAt: Date;
}

/**
 * Request parameters for calculating compatibility between a user and another user or tribe
 */
export interface ICompatibilityRequest {
  /** ID of the user for whom compatibility is being calculated */
  userId: string;
  
  /** Type of target (user or tribe) */
  targetType: 'user' | 'tribe';
  
  /** ID of the target user or tribe */
  targetId: string;
  
  /** Whether to include detailed breakdown by compatibility factors */
  includeDetails: boolean;
  
  /** Optional custom weights for different compatibility factors (defaults used if not provided) */
  factorWeights: Record<CompatibilityFactor, number>;
}

/**
 * Response structure for a compatibility calculation request
 */
export interface ICompatibilityResponse {
  /** ID of the user for whom compatibility was calculated */
  userId: string;
  
  /** Type of target (user or tribe) */
  targetType: 'user' | 'tribe';
  
  /** ID of the target user or tribe */
  targetId: string;
  
  /** Overall compatibility score (0-100) */
  overallScore: number;
  
  /** Detailed breakdown by compatibility factors (if requested) */
  details: ICompatibilityDetail[];
  
  /** When the compatibility calculation was performed */
  calculatedAt: Date;
}

/**
 * Request parameters for calculating compatibility between a user and multiple users or tribes
 */
export interface ICompatibilityBatchRequest {
  /** ID of the user for whom compatibility is being calculated */
  userId: string;
  
  /** Type of targets (users or tribes) */
  targetType: 'user' | 'tribe';
  
  /** IDs of the target users or tribes */
  targetIds: string[];
  
  /** Whether to include detailed breakdown by compatibility factors */
  includeDetails: boolean;
  
  /** Optional custom weights for different compatibility factors (defaults used if not provided) */
  factorWeights: Record<CompatibilityFactor, number>;
}

/**
 * Response structure for a batch compatibility calculation request
 */
export interface ICompatibilityBatchResponse {
  /** ID of the user for whom compatibility was calculated */
  userId: string;
  
  /** Type of targets (users or tribes) */
  targetType: 'user' | 'tribe';
  
  /** Compatibility results for each target */
  results: Array<{
    targetId: string,
    overallScore: number,
    details?: ICompatibilityDetail[]
  }>;
  
  /** When the compatibility calculation was performed */
  calculatedAt: Date;
}