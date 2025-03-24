import { 
  IProfile, 
  PersonalityTrait, 
  InterestCategory, 
  CommunicationStyle, 
  ICoordinates
} from '../../shared/src/types/profile.types';
import { 
  ITribe 
} from '../../shared/src/types/tribe.types';
import { 
  CompatibilityFactor 
} from '../models/compatibility.model';
import { 
  IMatchingCriteria 
} from '../models/matching.model';
import { 
  calculateHaversineDistance 
} from '../algorithms/clustering.algorithm';
import { 
  TRIBE_LIMITS 
} from '../../shared/src/constants/app.constants';

// Default values for compatibility matching
export const DEFAULT_COMPATIBILITY_THRESHOLD = 0.7; // 70% minimum compatibility
export const DEFAULT_MAX_DISTANCE = 25; // miles

// Default weights for compatibility factors
export const DEFAULT_FACTOR_WEIGHTS: Record<CompatibilityFactor, number> = {
  [CompatibilityFactor.PERSONALITY]: 0.3,
  [CompatibilityFactor.INTERESTS]: 0.25,
  [CompatibilityFactor.COMMUNICATION_STYLE]: 0.2,
  [CompatibilityFactor.LOCATION]: 0.15,
  [CompatibilityFactor.GROUP_BALANCE]: 0.1
};

// Weights for personality traits
export const PERSONALITY_TRAIT_WEIGHTS: Record<PersonalityTrait, number> = {
  [PersonalityTrait.OPENNESS]: 0.2,
  [PersonalityTrait.CONSCIENTIOUSNESS]: 0.2,
  [PersonalityTrait.EXTRAVERSION]: 0.2,
  [PersonalityTrait.AGREEABLENESS]: 0.2,
  [PersonalityTrait.NEUROTICISM]: 0.2
};

// Communication style compatibility matrix
export const COMMUNICATION_STYLE_COMPATIBILITY_MATRIX: Record<CommunicationStyle, Record<CommunicationStyle, number>> = {
  [CommunicationStyle.DIRECT]: {
    [CommunicationStyle.DIRECT]: 0.9,
    [CommunicationStyle.THOUGHTFUL]: 0.6,
    [CommunicationStyle.EXPRESSIVE]: 0.7,
    [CommunicationStyle.SUPPORTIVE]: 0.5,
    [CommunicationStyle.ANALYTICAL]: 0.8
  },
  [CommunicationStyle.THOUGHTFUL]: {
    [CommunicationStyle.DIRECT]: 0.6,
    [CommunicationStyle.THOUGHTFUL]: 0.9,
    [CommunicationStyle.EXPRESSIVE]: 0.5,
    [CommunicationStyle.SUPPORTIVE]: 0.8,
    [CommunicationStyle.ANALYTICAL]: 0.7
  },
  [CommunicationStyle.EXPRESSIVE]: {
    [CommunicationStyle.DIRECT]: 0.7,
    [CommunicationStyle.THOUGHTFUL]: 0.5,
    [CommunicationStyle.EXPRESSIVE]: 0.9,
    [CommunicationStyle.SUPPORTIVE]: 0.7,
    [CommunicationStyle.ANALYTICAL]: 0.5
  },
  [CommunicationStyle.SUPPORTIVE]: {
    [CommunicationStyle.DIRECT]: 0.5,
    [CommunicationStyle.THOUGHTFUL]: 0.8,
    [CommunicationStyle.EXPRESSIVE]: 0.7,
    [CommunicationStyle.SUPPORTIVE]: 0.9,
    [CommunicationStyle.ANALYTICAL]: 0.6
  },
  [CommunicationStyle.ANALYTICAL]: {
    [CommunicationStyle.DIRECT]: 0.8,
    [CommunicationStyle.THOUGHTFUL]: 0.7,
    [CommunicationStyle.EXPRESSIVE]: 0.5,
    [CommunicationStyle.SUPPORTIVE]: 0.6,
    [CommunicationStyle.ANALYTICAL]: 0.9
  }
};

/**
 * Extracts personality traits from a user profile into a normalized record
 * @param profile User profile containing personality traits
 * @returns Record mapping each personality trait to a normalized score (0-1)
 */
export function extractPersonalityTraits(profile: IProfile): Record<PersonalityTrait, number> {
  // Initialize traits with default values
  const traits: Partial<Record<PersonalityTrait, number>> = {
    [PersonalityTrait.OPENNESS]: 0,
    [PersonalityTrait.CONSCIENTIOUSNESS]: 0,
    [PersonalityTrait.EXTRAVERSION]: 0,
    [PersonalityTrait.AGREEABLENESS]: 0,
    [PersonalityTrait.NEUROTICISM]: 0
  };
  
  // Add personality traits from profile
  for (const trait of profile.personalityTraits) {
    traits[trait.trait] = normalizeScore(trait.score, 0, 100);
  }
  
  return traits as Record<PersonalityTrait, number>;
}

/**
 * Extracts interests from a user profile into a structured format
 * @param profile User profile containing interests
 * @returns Array of structured interest objects
 */
export function extractInterests(profile: IProfile): Array<{category: InterestCategory, name: string, level: number}> {
  return profile.interests.map(interest => ({
    category: interest.category,
    name: interest.name,
    level: normalizeScore(interest.level, 1, 3) // Normalize level to 0-1 range
  }));
}

/**
 * Normalizes a raw score to a 0-1 range based on min/max values
 * @param score Raw score to normalize
 * @param min Minimum possible score
 * @param max Maximum possible score
 * @returns Normalized score between 0 and 1
 */
export function normalizeScore(score: number, min: number, max: number): number {
  // Clamp score to min-max range
  const clampedScore = Math.max(min, Math.min(max, score));
  
  // Normalize to 0-1 range
  return (max > min) ? (clampedScore - min) / (max - min) : 0;
}

/**
 * Calculates a weighted average of scores based on provided weights
 * @param scores Record mapping keys to score values
 * @param weights Record mapping keys to weight values
 * @returns Weighted average score
 */
export function calculateWeightedAverage(
  scores: Record<string, number>,
  weights: Record<string, number>
): number {
  let sum = 0;
  let weightSum = 0;
  
  for (const key in scores) {
    if (weights[key] !== undefined) {
      sum += scores[key] * weights[key];
      weightSum += weights[key];
    }
  }
  
  return weightSum > 0 ? sum / weightSum : 0;
}

/**
 * Calculates the overlap between two sets of interests using Jaccard similarity
 * @param interests1 First set of interests
 * @param interests2 Second set of interests
 * @returns Similarity score between 0 and 1
 */
export function calculateInterestOverlap(
  interests1: Array<{category: InterestCategory, name: string, level?: number}>,
  interests2: Array<{category: InterestCategory, name: string, level?: number}>
): number {
  // Extract categories for simpler comparison
  const categories1 = new Set(interests1.map(i => i.category));
  const categories2 = new Set(interests2.map(i => i.category));
  
  // Calculate intersection and union sizes
  const intersection = [...categories1].filter(category => categories2.has(category));
  const union = new Set([...categories1, ...categories2]);
  
  // Compute Jaccard coefficient
  return union.size > 0 ? intersection.length / union.size : 0;
}

/**
 * Calculates compatibility between two communication styles
 * @param style1 First communication style
 * @param style2 Second communication style
 * @returns Compatibility score between 0 and 1
 */
export function calculateCommunicationCompatibility(
  style1: CommunicationStyle,
  style2: CommunicationStyle
): number {
  return COMMUNICATION_STYLE_COMPATIBILITY_MATRIX[style1][style2];
}

/**
 * Calculates location compatibility based on distance and maximum preferred distance
 * @param coordinates1 First location coordinates
 * @param coordinates2 Second location coordinates
 * @param maxDistance Maximum preferred distance in miles
 * @returns Compatibility score between 0 and 1
 */
export function calculateLocationCompatibility(
  coordinates1: ICoordinates,
  coordinates2: ICoordinates,
  maxDistance: number = DEFAULT_MAX_DISTANCE
): number {
  const distance = calculateHaversineDistance(coordinates1, coordinates2);
  
  // If distance exceeds maxDistance, return 0
  if (distance > maxDistance) {
    return 0;
  }
  
  // Calculate score as 1 - (distance/maxDistance)
  return 1 - (distance / maxDistance);
}

/**
 * Calculates compatibility between two personality profiles
 * @param traits1 First personality trait profile
 * @param traits2 Second personality trait profile
 * @returns Compatibility score between 0 and 1
 */
export function calculatePersonalityCompatibility(
  traits1: Record<PersonalityTrait, number>,
  traits2: Record<PersonalityTrait, number>
): number {
  const traitScores: Partial<Record<PersonalityTrait, number>> = {};
  
  // Calculate compatibility for each trait
  for (const trait in traits1) {
    const typedTrait = trait as PersonalityTrait;
    
    // We want some traits to be similar and others to be complementary
    if (typedTrait === PersonalityTrait.OPENNESS || 
        typedTrait === PersonalityTrait.CONSCIENTIOUSNESS) {
      // For these traits, similarity is good
      const similarity = 1 - Math.abs(traits1[typedTrait] - traits2[typedTrait]);
      traitScores[typedTrait] = similarity;
    } else if (typedTrait === PersonalityTrait.EXTRAVERSION || 
               typedTrait === PersonalityTrait.AGREEABLENESS) {
      // For these traits, we want a balanced mix (not too similar, not too different)
      const diff = Math.abs(traits1[typedTrait] - traits2[typedTrait]);
      traitScores[typedTrait] = 1 - (diff > 0.5 ? diff : 0.5 - diff);
    } else {
      // For neuroticism, lower combined values are better
      const combinedScore = (traits1[typedTrait] + traits2[typedTrait]) / 2;
      traitScores[typedTrait] = 1 - combinedScore;
    }
  }
  
  // Calculate weighted average of trait compatibility scores
  return calculateWeightedAverage(
    traitScores as Record<string, number>,
    PERSONALITY_TRAIT_WEIGHTS as Record<string, number>
  );
}

/**
 * Calculates how a user would impact the psychological balance of a tribe
 * @param userTraits Personality traits of the user
 * @param memberTraits Personality traits of existing tribe members
 * @returns Balance impact score between 0 and 1
 */
export function calculateGroupBalanceImpact(
  userTraits: Record<PersonalityTrait, number>,
  memberTraits: Array<Record<PersonalityTrait, number>>
): number {
  // If no existing members, user will define the group
  if (memberTraits.length === 0) {
    return 1.0;
  }
  
  // Calculate current trait distribution
  const currentDistribution = calculateTraitDistribution(memberTraits);
  
  // Calculate ideal balanced distribution
  const idealDistribution = calculateIdealDistribution();
  
  // Calculate current deviation from ideal balance
  const currentDeviation = calculateDistributionDeviation(
    currentDistribution,
    idealDistribution
  );
  
  // Project new distribution if user were to join
  const projectedMemberTraits = [...memberTraits, userTraits];
  const projectedDistribution = calculateTraitDistribution(projectedMemberTraits);
  
  // Calculate projected deviation
  const projectedDeviation = calculateDistributionDeviation(
    projectedDistribution,
    idealDistribution
  );
  
  // Determine if adding the user improves balance
  const improvement = currentDeviation - projectedDeviation;
  
  // Convert improvement to a 0-1 score
  // Maximum theoretical improvement would be a deviation of 1.0 going to 0
  const normalizedImprovement = Math.max(-0.5, Math.min(0.5, improvement));
  return 0.5 + normalizedImprovement; // Scale to 0-1 range
}

/**
 * Merges custom factor weights with default weights
 * @param customWeights Custom weights for compatibility factors
 * @returns Merged weights normalized to sum to 1
 */
export function mergeFactorWeights(
  customWeights: Partial<Record<CompatibilityFactor, number>>
): Record<CompatibilityFactor, number> {
  // Start with default weights
  const mergedWeights = { ...DEFAULT_FACTOR_WEIGHTS };
  
  // Apply custom weights
  for (const factor in customWeights) {
    if (mergedWeights[factor as CompatibilityFactor] !== undefined && 
        customWeights[factor as CompatibilityFactor] !== undefined) {
      mergedWeights[factor as CompatibilityFactor] = customWeights[factor as CompatibilityFactor]!;
    }
  }
  
  // Normalize weights to sum to 1
  const weightSum = Object.values(mergedWeights).reduce((sum, weight) => sum + weight, 0);
  
  if (weightSum > 0) {
    for (const factor in mergedWeights) {
      mergedWeights[factor as CompatibilityFactor] /= weightSum;
    }
  }
  
  return mergedWeights;
}

/**
 * Filters tribes that have capacity for new members
 * @param tribes Array of tribes to filter
 * @returns Tribes with available capacity
 */
export function filterEligibleTribes(tribes: ITribe[]): ITribe[] {
  return tribes.filter(tribe => hasCapacity(tribe));
}

/**
 * Checks if a tribe has capacity for additional members
 * @param tribe Tribe to check capacity for
 * @returns True if tribe has capacity
 */
export function hasCapacity(tribe: ITribe): boolean {
  const currentMemberCount = tribe.members.length;
  const maxMembers = tribe.maxMembers || TRIBE_LIMITS.MAX_MEMBERS_PER_TRIBE;
  
  return currentMemberCount < maxMembers;
}

/**
 * Creates a map of user profiles for efficient lookup
 * @param profiles Array of user profiles
 * @returns Map of user ID to profile
 */
export function createUserProfileMap(profiles: IProfile[]): Map<string, IProfile> {
  const profileMap = new Map<string, IProfile>();
  
  for (const profile of profiles) {
    profileMap.set(profile.id, profile);
  }
  
  return profileMap;
}

/**
 * Calculates the ideal balanced distribution of personality traits
 * @returns Ideal balanced distribution
 */
export function calculateIdealDistribution(): Record<PersonalityTrait, number> {
  // For an ideally balanced group, each trait should be equally represented
  const traitCount = Object.keys(PersonalityTrait).length / 2; // Divide by 2 because TypeScript enums contain both keys and values
  const idealProportion = 1 / traitCount;
  
  const distribution: Partial<Record<PersonalityTrait, number>> = {};
  
  for (const trait in PersonalityTrait) {
    // Skip numeric keys in the enum
    if (isNaN(Number(trait))) {
      distribution[trait as PersonalityTrait] = idealProportion;
    }
  }
  
  return distribution as Record<PersonalityTrait, number>;
}

/**
 * Calculates the deviation of a trait distribution from the ideal balance
 * @param distribution Current trait distribution
 * @param idealDistribution Ideal balanced distribution
 * @returns Deviation score (lower is better)
 */
export function calculateDistributionDeviation(
  distribution: Record<PersonalityTrait, number>,
  idealDistribution: Record<PersonalityTrait, number>
): number {
  let totalDeviation = 0;
  
  // Sum the absolute differences for each trait
  for (const trait in idealDistribution) {
    const typedTrait = trait as PersonalityTrait;
    const actual = distribution[typedTrait] || 0;
    const ideal = idealDistribution[typedTrait];
    
    totalDeviation += Math.abs(actual - ideal);
  }
  
  return totalDeviation;
}

/**
 * Calculates the distribution of personality traits across members
 * @param memberTraits Array of personality trait records
 * @returns Distribution of traits
 */
function calculateTraitDistribution(
  memberTraits: Array<Record<PersonalityTrait, number>>
): Record<PersonalityTrait, number> {
  const distribution: Partial<Record<PersonalityTrait, number>> = {};
  
  // Initialize all traits to 0
  for (const trait in PersonalityTrait) {
    // Skip numeric keys in the enum
    if (isNaN(Number(trait))) {
      distribution[trait as PersonalityTrait] = 0;
    }
  }
  
  // Sum trait values across all members
  for (const memberTrait of memberTraits) {
    for (const trait in memberTrait) {
      const typedTrait = trait as PersonalityTrait;
      distribution[typedTrait] = (distribution[typedTrait] || 0) + memberTrait[typedTrait];
    }
  }
  
  // Calculate average for each trait
  const memberCount = memberTraits.length;
  if (memberCount > 0) {
    for (const trait in distribution) {
      distribution[trait as PersonalityTrait] = (distribution[trait as PersonalityTrait] || 0) / memberCount;
    }
  }
  
  return distribution as Record<PersonalityTrait, number>;
}