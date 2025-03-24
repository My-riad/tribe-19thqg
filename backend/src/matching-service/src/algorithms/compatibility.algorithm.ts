/**
 * Compatibility Algorithm
 * 
 * Implements core compatibility calculations for Tribe's AI-powered matchmaking system.
 * This system analyzes user profiles to calculate compatibility scores based on:
 * - Personality traits compatibility
 * - Shared interests
 * - Communication style compatibility
 * - Geographic proximity
 * - Group psychological balance
 * 
 * These calculations form the foundation for creating balanced, compatible tribes.
 */

import { OpenRouter } from '@openrouter/api'; // v1.0.0
import {
  IProfile,
  IPersonalityTrait,
  IInterest,
  ICoordinates,
  PersonalityTrait,
  InterestCategory,
  CommunicationStyle
} from '../../shared/src/types/profile.types';
import {
  ITribe,
  ITribeMembership,
  ITribeInterest
} from '../../shared/src/types/tribe.types';
import {
  CompatibilityFactor,
  ICompatibilityDetail,
  IPersonalityCompatibility,
  IInterestCompatibility,
  ICommunicationCompatibility,
  ILocationCompatibility,
  IGroupBalanceAnalysis,
  IUserCompatibility,
  ITribeCompatibility,
  ICompatibilityRequest,
  ICompatibilityBatchRequest
} from '../models/compatibility.model';
import { calculateHaversineDistance } from './clustering.algorithm';

// Default weights for different compatibility factors (sum to 1.0)
const DEFAULT_FACTOR_WEIGHTS = {
  [CompatibilityFactor.PERSONALITY]: 0.3,
  [CompatibilityFactor.INTERESTS]: 0.25, 
  [CompatibilityFactor.COMMUNICATION_STYLE]: 0.2,
  [CompatibilityFactor.LOCATION]: 0.15,
  [CompatibilityFactor.GROUP_BALANCE]: 0.1
};

// Default maximum distance in miles for location compatibility
const DEFAULT_MAX_DISTANCE = 25;

// Communication style compatibility matrix - defines how well different styles work together
const COMMUNICATION_STYLE_COMPATIBILITY_MATRIX: Record<CommunicationStyle, Record<CommunicationStyle, number>> = {
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
    [CommunicationStyle.ANALYTICAL]: 0.4
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
    [CommunicationStyle.EXPRESSIVE]: 0.4,
    [CommunicationStyle.SUPPORTIVE]: 0.6,
    [CommunicationStyle.ANALYTICAL]: 0.9
  }
};

// Personality trait compatibility matrix - defines how well different traits work together
// Higher scores indicate traits that complement each other well
const PERSONALITY_TRAIT_COMPATIBILITY_MATRIX: Record<PersonalityTrait, Record<PersonalityTrait, number>> = {
  [PersonalityTrait.OPENNESS]: {
    [PersonalityTrait.OPENNESS]: 0.9,
    [PersonalityTrait.CONSCIENTIOUSNESS]: 0.7,
    [PersonalityTrait.EXTRAVERSION]: 0.8,
    [PersonalityTrait.AGREEABLENESS]: 0.8,
    [PersonalityTrait.NEUROTICISM]: 0.5
  },
  [PersonalityTrait.CONSCIENTIOUSNESS]: {
    [PersonalityTrait.OPENNESS]: 0.7,
    [PersonalityTrait.CONSCIENTIOUSNESS]: 0.8,
    [PersonalityTrait.EXTRAVERSION]: 0.6,
    [PersonalityTrait.AGREEABLENESS]: 0.7,
    [PersonalityTrait.NEUROTICISM]: 0.4
  },
  [PersonalityTrait.EXTRAVERSION]: {
    [PersonalityTrait.OPENNESS]: 0.8,
    [PersonalityTrait.CONSCIENTIOUSNESS]: 0.6,
    [PersonalityTrait.EXTRAVERSION]: 0.7,
    [PersonalityTrait.AGREEABLENESS]: 0.8,
    [PersonalityTrait.NEUROTICISM]: 0.4
  },
  [PersonalityTrait.AGREEABLENESS]: {
    [PersonalityTrait.OPENNESS]: 0.8,
    [PersonalityTrait.CONSCIENTIOUSNESS]: 0.7,
    [PersonalityTrait.EXTRAVERSION]: 0.8,
    [PersonalityTrait.AGREEABLENESS]: 0.9,
    [PersonalityTrait.NEUROTICISM]: 0.5
  },
  [PersonalityTrait.NEUROTICISM]: {
    [PersonalityTrait.OPENNESS]: 0.5,
    [PersonalityTrait.CONSCIENTIOUSNESS]: 0.4,
    [PersonalityTrait.EXTRAVERSION]: 0.4,
    [PersonalityTrait.AGREEABLENESS]: 0.5,
    [PersonalityTrait.NEUROTICISM]: 0.3
  }
};

/**
 * Calculates compatibility between two users based on their personality traits
 * Uses the Big Five/OCEAN personality model for trait-based compatibility
 * 
 * @param traits1 Personality traits of first user
 * @param traits2 Personality traits of second user
 * @returns Personality compatibility result with trait scores and overall score
 */
export function calculatePersonalityCompatibility(
  traits1: Array<IPersonalityTrait>,
  traits2: Array<IPersonalityTrait>
): IPersonalityCompatibility {
  // Convert trait arrays to Record<PersonalityTrait, number> for easier processing
  const traitsMap1: Record<PersonalityTrait, number> = {};
  const traitsMap2: Record<PersonalityTrait, number> = {};
  
  // Normalize trait scores to 0-1 range
  traits1.forEach(trait => {
    traitsMap1[trait.trait] = trait.score / 100;
  });
  
  traits2.forEach(trait => {
    traitsMap2[trait.trait] = trait.score / 100;
  });
  
  // Calculate compatibility for each trait
  const traitScores: Record<PersonalityTrait, number> = {};
  const traitWeights: Record<PersonalityTrait, number> = {
    [PersonalityTrait.OPENNESS]: 0.2,
    [PersonalityTrait.CONSCIENTIOUSNESS]: 0.2,
    [PersonalityTrait.EXTRAVERSION]: 0.2,
    [PersonalityTrait.AGREEABLENESS]: 0.2,
    [PersonalityTrait.NEUROTICISM]: 0.2
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  const complementaryTraits: PersonalityTrait[] = [];
  const conflictingTraits: PersonalityTrait[] = [];
  
  // Process each of the core personality traits
  Object.values(PersonalityTrait).forEach(trait => {
    // Skip processing if either user doesn't have this trait
    if (traitsMap1[trait] === undefined || traitsMap2[trait] === undefined) {
      return;
    }
    
    const trait1Value = traitsMap1[trait];
    const trait2Value = traitsMap2[trait];
    const traitDifference = Math.abs(trait1Value - trait2Value);
    
    // Calculate trait compatibility based on matrix and trait values
    let compatibilityScore: number;
    
    // For certain traits like extraversion, we want a mix of values
    // For others like agreeableness, similar values work better
    if (trait === PersonalityTrait.EXTRAVERSION) {
      // For extraversion, different values can be complementary
      compatibilityScore = 1 - (Math.abs(trait1Value - (1 - trait2Value)) / 2);
    } else {
      // For other traits, use the compatibility matrix
      const baseCompatibility = PERSONALITY_TRAIT_COMPATIBILITY_MATRIX[trait][trait];
      
      // Adjust based on how close the trait values are
      const similarityFactor = 1 - traitDifference;
      compatibilityScore = baseCompatibility * similarityFactor;
    }
    
    // Scale score to 0-100 range
    const scaledScore = compatibilityScore * 100;
    traitScores[trait] = scaledScore;
    
    // Track complementary vs conflicting traits
    if (scaledScore >= 70) {
      complementaryTraits.push(trait);
    } else if (scaledScore <= 40) {
      conflictingTraits.push(trait);
    }
    
    // Add to weighted total score
    totalScore += scaledScore * traitWeights[trait];
    totalWeight += traitWeights[trait];
  });
  
  // Calculate overall personality compatibility score
  const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  
  return {
    traitScores,
    overallScore,
    complementaryTraits,
    conflictingTraits
  };
}

/**
 * Calculates compatibility between users based on shared interests
 * Higher weight given to primary interest matches
 * 
 * @param interests1 Interests of first user
 * @param interests2 Interests of second user/tribe
 * @returns Interest compatibility result with shared interests and overall score
 */
export function calculateInterestCompatibility(
  interests1: Array<IInterest>,
  interests2: Array<{category: InterestCategory, name: string, isPrimary?: boolean}>
): IInterestCompatibility {
  // Normalize interests for easier comparison
  const normalizedInterests1 = interests1.map(interest => ({
    category: interest.category,
    name: interest.name,
    // For user interests, treat higher level interests as "primary"
    isPrimary: interest.level ? interest.level >= 3 : false
  }));
  
  const normalizedInterests2 = interests2.map(interest => ({
    category: interest.category,
    name: interest.name,
    isPrimary: interest.isPrimary ?? false
  }));
  
  // Find shared interests
  const sharedInterests: Array<{category: InterestCategory, name: string}> = [];
  
  // Track if there's a match in primary interests
  let primaryInterestMatch = false;
  
  // Count total interests in both sets for Jaccard similarity
  const interestSet1 = new Set(normalizedInterests1.map(i => `${i.category}:${i.name}`));
  const interestSet2 = new Set(normalizedInterests2.map(i => `${i.category}:${i.name}`));
  
  // Find shared interests
  normalizedInterests1.forEach(interest1 => {
    const matchingInterest = normalizedInterests2.find(interest2 => 
      interest2.category === interest1.category && interest2.name === interest1.name
    );
    
    if (matchingInterest) {
      sharedInterests.push({
        category: interest1.category,
        name: interest1.name
      });
      
      // Check if this is a match between primary interests
      if (interest1.isPrimary && matchingInterest.isPrimary) {
        primaryInterestMatch = true;
      }
    }
  });
  
  // Calculate Jaccard similarity coefficient (intersection / union)
  const intersection = sharedInterests.length;
  const union = interestSet1.size + interestSet2.size - intersection;
  
  // Avoid division by zero
  const jaccardSimilarity = union > 0 ? intersection / union : 0;
  
  // Apply a bonus for primary interest matches
  const primaryInterestBonus = primaryInterestMatch ? 0.2 : 0;
  
  // Calculate overall interest compatibility score
  const baseScore = jaccardSimilarity * 100;
  const overallScore = Math.min(100, baseScore + (primaryInterestBonus * 100));
  
  return {
    sharedInterests,
    overallScore,
    primaryInterestMatch
  };
}

/**
 * Calculates compatibility between users based on communication styles
 * 
 * @param style1 Communication style of first user
 * @param style2 Communication style of second user
 * @returns Communication compatibility result with style analysis and overall score
 */
export function calculateCommunicationCompatibility(
  style1: CommunicationStyle,
  style2: CommunicationStyle
): ICommunicationCompatibility {
  // Check if styles are the same
  const styleMatch = style1 === style2;
  
  // Look up compatibility score from compatibility matrix
  const compatibilityScore = COMMUNICATION_STYLE_COMPATIBILITY_MATRIX[style1][style2];
  
  // Define which styles are considered complementary even if not identical
  const complementaryPairs: Record<CommunicationStyle, CommunicationStyle[]> = {
    [CommunicationStyle.DIRECT]: [CommunicationStyle.ANALYTICAL],
    [CommunicationStyle.ANALYTICAL]: [CommunicationStyle.DIRECT],
    [CommunicationStyle.THOUGHTFUL]: [CommunicationStyle.SUPPORTIVE],
    [CommunicationStyle.SUPPORTIVE]: [CommunicationStyle.THOUGHTFUL, CommunicationStyle.EXPRESSIVE],
    [CommunicationStyle.EXPRESSIVE]: [CommunicationStyle.SUPPORTIVE]
  };
  
  // Check if styles are complementary
  const complementaryStyles = complementaryPairs[style1]?.includes(style2) ?? false;
  
  // Calculate overall score (0-100 scale)
  const overallScore = compatibilityScore * 100;
  
  return {
    styleMatch,
    overallScore,
    complementaryStyles
  };
}

/**
 * Calculates compatibility based on geographic proximity between users
 * 
 * @param coordinates1 Geographic coordinates of first user
 * @param coordinates2 Geographic coordinates of second user/tribe
 * @param maxDistance Maximum preferred distance (in miles)
 * @returns Location compatibility result with distance and overall score
 */
export function calculateLocationCompatibility(
  coordinates1: ICoordinates,
  coordinates2: ICoordinates,
  maxDistance: number = DEFAULT_MAX_DISTANCE
): ILocationCompatibility {
  // Calculate distance between coordinates using the Haversine formula
  const distance = calculateHaversineDistance(coordinates1, coordinates2);
  
  // Convert km to miles for consistency with user preferences
  const distanceInMiles = distance * 0.621371;
  
  // Check if distance is within preferred range
  const withinPreferredRange = distanceInMiles <= maxDistance;
  
  // Calculate compatibility score based on distance (inversely proportional)
  // Score is 100 when distance is 0, and approaches 0 as distance approaches maxDistance
  let overallScore = 100 * (1 - (distanceInMiles / maxDistance));
  
  // Ensure score is within 0-100 range
  overallScore = Math.max(0, Math.min(100, overallScore));
  
  return {
    distance: distanceInMiles,
    withinPreferredRange,
    overallScore
  };
}

/**
 * Analyzes how a user would impact the psychological balance of a tribe
 * 
 * @param userTraits Personality traits of the user
 * @param memberTraits Personality traits of existing tribe members
 * @returns Group balance analysis with current and projected balance
 */
export function calculateGroupBalanceImpact(
  userTraits: Array<IPersonalityTrait>,
  memberTraits: Array<Array<IPersonalityTrait>>
): IGroupBalanceAnalysis {
  // Convert user traits to a record for easier access
  const userTraitsRecord: Record<PersonalityTrait, number> = {};
  userTraits.forEach(trait => {
    userTraitsRecord[trait.trait] = trait.score;
  });
  
  // Calculate current trait distribution across existing members
  const currentBalance: Record<PersonalityTrait, number> = {};
  const traitKeys = Object.values(PersonalityTrait);
  
  // Initialize with zero values
  traitKeys.forEach(trait => {
    currentBalance[trait] = 0;
  });
  
  // Sum up trait scores across all members
  memberTraits.forEach(memberTrait => {
    memberTrait.forEach(trait => {
      currentBalance[trait.trait] = (currentBalance[trait.trait] || 0) + trait.score;
    });
  });
  
  // Calculate average trait scores
  if (memberTraits.length > 0) {
    traitKeys.forEach(trait => {
      currentBalance[trait] = currentBalance[trait] / memberTraits.length;
    });
  }
  
  // Calculate what the balance would be if the user joined
  const projectedBalance: Record<PersonalityTrait, number> = { ...currentBalance };
  const totalMembers = memberTraits.length + 1; // including new user
  
  traitKeys.forEach(trait => {
    // Recalculate projected balance with user included
    const currentSum = currentBalance[trait] * memberTraits.length;
    const userScore = userTraitsRecord[trait] || 0;
    projectedBalance[trait] = (currentSum + userScore) / totalMembers;
  });
  
  // Calculate how much the user improves the group balance
  // A balanced group should have relatively even trait distribution
  
  // First calculate how balanced the current group is
  // We'll use standard deviation of trait scores as a measure of imbalance
  const currentMean = traitKeys.reduce((sum, trait) => sum + currentBalance[trait], 0) / traitKeys.length;
  const currentVariance = traitKeys.reduce((sum, trait) => {
    return sum + Math.pow(currentBalance[trait] - currentMean, 2);
  }, 0) / traitKeys.length;
  const currentImbalance = Math.sqrt(currentVariance);
  
  // Then calculate projected balance with new user
  const projectedMean = traitKeys.reduce((sum, trait) => sum + projectedBalance[trait], 0) / traitKeys.length;
  const projectedVariance = traitKeys.reduce((sum, trait) => {
    return sum + Math.pow(projectedBalance[trait] - projectedMean, 2);
  }, 0) / traitKeys.length;
  const projectedImbalance = Math.sqrt(projectedVariance);
  
  // Calculate balance impact (-100 to 100)
  // Positive means user improves balance, negative means user worsens balance
  // Scale factor ensures reasonable values
  const scaleFactor = 50;
  const balanceImpact = (currentImbalance - projectedImbalance) * scaleFactor;
  
  // Determine if user improves group balance
  const improvesBalance = balanceImpact > 0;
  
  return {
    currentBalance,
    projectedBalance,
    balanceImpact,
    improvesBalance
  };
}

/**
 * Normalizes factor weights to ensure they sum to 1.0
 * 
 * @param weights Input weights for compatibility factors
 * @returns Normalized weights that sum to 1.0
 */
export function normalizeFactorWeights(
  weights: Record<CompatibilityFactor, number>
): Record<CompatibilityFactor, number> {
  // Calculate sum of all weights
  const sum = Object.values(weights).reduce((total, weight) => total + weight, 0);
  
  // If sum is 0 or invalid, return default weights
  if (!sum) {
    return { ...DEFAULT_FACTOR_WEIGHTS };
  }
  
  // Normalize weights to sum to 1.0
  const normalizedWeights: Record<CompatibilityFactor, number> = {} as Record<CompatibilityFactor, number>;
  
  Object.keys(weights).forEach(factor => {
    const key = factor as CompatibilityFactor;
    normalizedWeights[key] = weights[key] / sum;
  });
  
  return normalizedWeights;
}

/**
 * Generates a human-readable description of compatibility for a specific factor
 * 
 * @param factor Compatibility factor type
 * @param score Compatibility score for the factor
 * @param details Additional details specific to the factor
 * @returns Human-readable description of the compatibility factor
 */
function generateCompatibilityDescription(
  factor: CompatibilityFactor,
  score: number,
  details: any
): string {
  switch (factor) {
    case CompatibilityFactor.PERSONALITY:
      const personalityDetails = details as IPersonalityCompatibility;
      let description = `Personality compatibility: ${score.toFixed(1)}%. `;
      
      if (personalityDetails.complementaryTraits.length > 0) {
        description += `Complementary traits: ${personalityDetails.complementaryTraits.join(', ')}. `;
      }
      
      if (personalityDetails.conflictingTraits.length > 0) {
        description += `Potential conflicts in: ${personalityDetails.conflictingTraits.join(', ')}. `;
      }
      
      return description;
      
    case CompatibilityFactor.INTERESTS:
      const interestDetails = details as IInterestCompatibility;
      let interestDescription = `Interest compatibility: ${score.toFixed(1)}%. `;
      
      if (interestDetails.sharedInterests.length > 0) {
        interestDescription += `Shared interests: ${interestDetails.sharedInterests.map(i => i.name).join(', ')}. `;
      }
      
      if (interestDetails.primaryInterestMatch) {
        interestDescription += `Strong match in primary interests. `;
      }
      
      return interestDescription;
      
    case CompatibilityFactor.COMMUNICATION_STYLE:
      const communicationDetails = details as ICommunicationCompatibility;
      let communicationDescription = `Communication compatibility: ${score.toFixed(1)}%. `;
      
      if (communicationDetails.styleMatch) {
        communicationDescription += `Matching communication styles. `;
      } else if (communicationDetails.complementaryStyles) {
        communicationDescription += `Complementary communication styles. `;
      } else {
        communicationDescription += `Different communication approaches. `;
      }
      
      return communicationDescription;
      
    case CompatibilityFactor.LOCATION:
      const locationDetails = details as ILocationCompatibility;
      let locationDescription = `Location compatibility: ${score.toFixed(1)}%. `;
      
      locationDescription += `Distance: ${locationDetails.distance.toFixed(1)} miles. `;
      
      if (locationDetails.withinPreferredRange) {
        locationDescription += `Within preferred range. `;
      } else {
        locationDescription += `Beyond preferred range. `;
      }
      
      return locationDescription;
      
    case CompatibilityFactor.GROUP_BALANCE:
      const balanceDetails = details as IGroupBalanceAnalysis;
      let balanceDescription = `Group balance impact: ${score.toFixed(1)}%. `;
      
      if (balanceDetails.improvesBalance) {
        balanceDescription += `Would improve the tribe's psychological balance. `;
      } else {
        balanceDescription += `Might not improve the tribe's psychological diversity. `;
      }
      
      return balanceDescription;
      
    default:
      return `Compatibility score: ${score.toFixed(1)}%.`;
  }
}

/**
 * Finds the most compatible users for a given user from a pool of candidates
 * 
 * @param userId ID of the user to find matches for
 * @param userPool Pool of potential user matches
 * @param factorWeights Weights for different compatibility factors
 * @param limit Maximum number of results to return
 * @param threshold Minimum compatibility score to consider (0-100)
 * @returns Array of compatible users with scores
 */
export async function findMostCompatibleUsers(
  userId: string,
  userPool: Array<IProfile>,
  factorWeights: Record<CompatibilityFactor, number> = DEFAULT_FACTOR_WEIGHTS,
  limit: number = 10,
  threshold: number = 70
): Promise<Array<{userId: string, compatibilityScore: number, details?: ICompatibilityDetail[]}>> {
  // Find user profile in the pool
  const user = userPool.find(u => u.id === userId);
  if (!user) {
    throw new Error(`User with ID ${userId} not found in the user pool`);
  }
  
  // Create compatibility algorithm instance
  const compatibilityAlgorithm = new CompatibilityAlgorithm();
  
  // Calculate compatibility with all other users in the pool
  const compatibilityResults = await Promise.all(
    userPool
      .filter(candidate => candidate.id !== userId)
      .map(async candidate => {
        const compatibility = await compatibilityAlgorithm.calculateUserCompatibility(
          user,
          candidate,
          factorWeights,
          true // include details
        );
        
        return {
          userId: candidate.id,
          compatibilityScore: compatibility.overallScore,
          details: compatibility.details
        };
      })
  );
  
  // Filter results by threshold, sort by compatibility score, and limit
  return compatibilityResults
    .filter(result => result.compatibilityScore >= threshold)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, limit);
}

/**
 * Finds the most compatible tribes for a given user
 * 
 * @param user User profile to find compatible tribes for
 * @param tribes Available tribes to consider
 * @param memberProfiles Profiles of all tribe members
 * @param factorWeights Weights for different compatibility factors
 * @param limit Maximum number of results to return
 * @param threshold Minimum compatibility score to consider (0-100)
 * @returns Array of compatible tribes with scores
 */
export async function findMostCompatibleTribes(
  user: IProfile,
  tribes: Array<ITribe>,
  memberProfiles: Map<string, IProfile>,
  factorWeights: Record<CompatibilityFactor, number> = DEFAULT_FACTOR_WEIGHTS,
  limit: number = 10,
  threshold: number = 70
): Promise<Array<{tribeId: string, compatibilityScore: number, details?: ICompatibilityDetail[]}>> {
  // Create compatibility algorithm instance
  const compatibilityAlgorithm = new CompatibilityAlgorithm();
  
  // Calculate compatibility with all tribes
  const compatibilityResults = await Promise.all(
    tribes.map(async tribe => {
      // Get profiles of tribe members
      const tribeUserProfiles = tribe.members.map(
        member => memberProfiles.get(member.userId)
      ).filter(profile => profile !== undefined) as IProfile[];
      
      const compatibility = await compatibilityAlgorithm.calculateTribeCompatibility(
        user,
        tribe,
        tribeUserProfiles,
        factorWeights,
        true // include details
      );
      
      return {
        tribeId: tribe.id,
        compatibilityScore: compatibility.overallScore,
        details: compatibility.details
      };
    })
  );
  
  // Filter results by threshold, sort by compatibility score, and limit
  return compatibilityResults
    .filter(result => result.compatibilityScore >= threshold)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, limit);
}

/**
 * Compatibility Algorithm Class
 * 
 * Implements the core compatibility algorithm for Tribe's AI-powered matchmaking.
 * This is the main class used to calculate compatibility between users and tribes
 * in order to form balanced, compatible tribes of 4-8 members.
 */
export class CompatibilityAlgorithm {
  private defaultFactorWeights: Record<CompatibilityFactor, number>;
  private aiClient: OpenRouter;
  
  /**
   * Creates a new compatibility algorithm instance
   */
  constructor() {
    // Initialize default weights for compatibility factors
    this.defaultFactorWeights = { ...DEFAULT_FACTOR_WEIGHTS };
    
    // Initialize AI client for enhanced compatibility analysis
    this.aiClient = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY || ''
    });
  }
  
  /**
   * Calculates compatibility between two users
   * 
   * @param user1 First user profile
   * @param user2 Second user profile
   * @param factorWeights Weights for different compatibility factors
   * @param includeDetails Whether to include detailed factor breakdowns
   * @returns Compatibility result between the two users
   */
  async calculateUserCompatibility(
    user1: IProfile,
    user2: IProfile,
    factorWeights: Record<CompatibilityFactor, number> = this.defaultFactorWeights,
    includeDetails: boolean = false
  ): Promise<IUserCompatibility> {
    // Calculate personality compatibility
    const personalityCompatibility = calculatePersonalityCompatibility(
      user1.personalityTraits,
      user2.personalityTraits
    );
    
    // Calculate interest compatibility
    const interestCompatibility = calculateInterestCompatibility(
      user1.interests,
      user2.interests
    );
    
    // Calculate communication style compatibility
    const communicationCompatibility = calculateCommunicationCompatibility(
      user1.communicationStyle,
      user2.communicationStyle
    );
    
    // Calculate location compatibility
    const locationCompatibility = calculateLocationCompatibility(
      user1.coordinates,
      user2.coordinates
    );
    
    // Normalize factor weights to ensure they sum to 1.0
    const normalizedWeights = normalizeFactorWeights(factorWeights);
    
    // Calculate the weighted overall compatibility score
    const overallScore = 
      (personalityCompatibility.overallScore * normalizedWeights[CompatibilityFactor.PERSONALITY]) +
      (interestCompatibility.overallScore * normalizedWeights[CompatibilityFactor.INTERESTS]) +
      (communicationCompatibility.overallScore * normalizedWeights[CompatibilityFactor.COMMUNICATION_STYLE]) +
      (locationCompatibility.overallScore * normalizedWeights[CompatibilityFactor.LOCATION]);
    
    // Prepare compatibility details if requested
    const details: ICompatibilityDetail[] = includeDetails ? [
      {
        factor: CompatibilityFactor.PERSONALITY,
        weight: normalizedWeights[CompatibilityFactor.PERSONALITY],
        score: personalityCompatibility.overallScore,
        description: generateCompatibilityDescription(
          CompatibilityFactor.PERSONALITY,
          personalityCompatibility.overallScore,
          personalityCompatibility
        )
      },
      {
        factor: CompatibilityFactor.INTERESTS,
        weight: normalizedWeights[CompatibilityFactor.INTERESTS],
        score: interestCompatibility.overallScore,
        description: generateCompatibilityDescription(
          CompatibilityFactor.INTERESTS,
          interestCompatibility.overallScore,
          interestCompatibility
        )
      },
      {
        factor: CompatibilityFactor.COMMUNICATION_STYLE,
        weight: normalizedWeights[CompatibilityFactor.COMMUNICATION_STYLE],
        score: communicationCompatibility.overallScore,
        description: generateCompatibilityDescription(
          CompatibilityFactor.COMMUNICATION_STYLE,
          communicationCompatibility.overallScore,
          communicationCompatibility
        )
      },
      {
        factor: CompatibilityFactor.LOCATION,
        weight: normalizedWeights[CompatibilityFactor.LOCATION],
        score: locationCompatibility.overallScore,
        description: generateCompatibilityDescription(
          CompatibilityFactor.LOCATION,
          locationCompatibility.overallScore,
          locationCompatibility
        )
      }
    ] : [];
    
    // Try to enhance compatibility analysis with AI insights
    try {
      const aiEnhancement = await this.enhanceCompatibilityWithAI(
        user1,
        user2,
        personalityCompatibility,
        interestCompatibility
      );
      
      // Blend AI score with algorithmic score (giving more weight to algorithmic)
      const enhancedScore = (overallScore * 0.7) + (aiEnhancement.enhancedScore * 0.3);
      
      return {
        userId: user1.id,
        targetUserId: user2.id,
        overallScore: enhancedScore,
        details,
        calculatedAt: new Date()
      };
    } catch (error) {
      // Fallback to algorithmic score if AI enhancement fails
      return {
        userId: user1.id,
        targetUserId: user2.id,
        overallScore,
        details,
        calculatedAt: new Date()
      };
    }
  }
  
  /**
   * Calculates compatibility between a user and a tribe
   * 
   * @param user User profile
   * @param tribe Tribe entity
   * @param memberProfiles Profiles of tribe members
   * @param factorWeights Weights for different compatibility factors
   * @param includeDetails Whether to include detailed factor breakdowns
   * @returns Compatibility result between user and tribe
   */
  async calculateTribeCompatibility(
    user: IProfile,
    tribe: ITribe,
    memberProfiles: Array<IProfile>,
    factorWeights: Record<CompatibilityFactor, number> = this.defaultFactorWeights,
    includeDetails: boolean = false
  ): Promise<ITribeCompatibility> {
    // Extract tribe interests
    const tribeInterests = tribe.interests.map(interest => ({
      category: interest.category,
      name: interest.name,
      isPrimary: interest.isPrimary
    }));
    
    // Calculate interest compatibility with tribe
    const interestCompatibility = calculateInterestCompatibility(
      user.interests,
      tribeInterests
    );
    
    // Calculate average personality compatibility with tribe members
    let personalityCompatibilitySum = 0;
    let communicationCompatibilitySum = 0;
    
    const memberCompatibility: Array<{userId: string, score: number}> = [];
    
    // Calculate compatibility with each tribe member
    for (const member of memberProfiles) {
      const personalityComp = calculatePersonalityCompatibility(
        user.personalityTraits,
        member.personalityTraits
      );
      
      const communicationComp = calculateCommunicationCompatibility(
        user.communicationStyle,
        member.communicationStyle
      );
      
      // Calculate overall member compatibility as weighted average
      const memberCompatScore = 
        (personalityComp.overallScore * 0.7) + 
        (communicationComp.overallScore * 0.3);
      
      memberCompatibility.push({
        userId: member.id,
        score: memberCompatScore
      });
      
      personalityCompatibilitySum += personalityComp.overallScore;
      communicationCompatibilitySum += communicationComp.overallScore;
    }
    
    // Calculate average compatibility scores
    const avgPersonalityScore = memberProfiles.length > 0 
      ? personalityCompatibilitySum / memberProfiles.length 
      : 0;
    
    const avgCommunicationScore = memberProfiles.length > 0 
      ? communicationCompatibilitySum / memberProfiles.length 
      : 0;
    
    // Calculate location compatibility
    const locationCompatibility = calculateLocationCompatibility(
      user.coordinates,
      tribe.coordinates
    );
    
    // Calculate group balance impact
    const memberTraits = memberProfiles.map(profile => profile.personalityTraits);
    const groupBalanceAnalysis = calculateGroupBalanceImpact(
      user.personalityTraits,
      memberTraits
    );
    
    // Normalize the group balance impact score to 0-100 scale
    const scaledBalanceImpact = ((groupBalanceAnalysis.balanceImpact + 100) / 2);
    const groupBalanceScore = Math.max(0, Math.min(100, scaledBalanceImpact));
    
    // Normalize factor weights to ensure they sum to 1.0
    const normalizedWeights = normalizeFactorWeights(factorWeights);
    
    // Calculate the weighted overall compatibility score
    const overallScore = 
      (avgPersonalityScore * normalizedWeights[CompatibilityFactor.PERSONALITY]) +
      (interestCompatibility.overallScore * normalizedWeights[CompatibilityFactor.INTERESTS]) +
      (avgCommunicationScore * normalizedWeights[CompatibilityFactor.COMMUNICATION_STYLE]) +
      (locationCompatibility.overallScore * normalizedWeights[CompatibilityFactor.LOCATION]) +
      (groupBalanceScore * normalizedWeights[CompatibilityFactor.GROUP_BALANCE]);
    
    // Prepare compatibility details if requested
    const details: ICompatibilityDetail[] = includeDetails ? [
      {
        factor: CompatibilityFactor.PERSONALITY,
        weight: normalizedWeights[CompatibilityFactor.PERSONALITY],
        score: avgPersonalityScore,
        description: `Average personality compatibility with tribe members: ${avgPersonalityScore.toFixed(1)}%.`
      },
      {
        factor: CompatibilityFactor.INTERESTS,
        weight: normalizedWeights[CompatibilityFactor.INTERESTS],
        score: interestCompatibility.overallScore,
        description: generateCompatibilityDescription(
          CompatibilityFactor.INTERESTS,
          interestCompatibility.overallScore,
          interestCompatibility
        )
      },
      {
        factor: CompatibilityFactor.COMMUNICATION_STYLE,
        weight: normalizedWeights[CompatibilityFactor.COMMUNICATION_STYLE],
        score: avgCommunicationScore,
        description: `Average communication style compatibility with tribe members: ${avgCommunicationScore.toFixed(1)}%.`
      },
      {
        factor: CompatibilityFactor.LOCATION,
        weight: normalizedWeights[CompatibilityFactor.LOCATION],
        score: locationCompatibility.overallScore,
        description: generateCompatibilityDescription(
          CompatibilityFactor.LOCATION,
          locationCompatibility.overallScore,
          locationCompatibility
        )
      },
      {
        factor: CompatibilityFactor.GROUP_BALANCE,
        weight: normalizedWeights[CompatibilityFactor.GROUP_BALANCE],
        score: groupBalanceScore,
        description: generateCompatibilityDescription(
          CompatibilityFactor.GROUP_BALANCE,
          groupBalanceScore,
          groupBalanceAnalysis
        )
      }
    ] : [];
    
    return {
      userId: user.id,
      tribeId: tribe.id,
      overallScore,
      details,
      memberCompatibility,
      groupBalanceImpact: groupBalanceAnalysis.balanceImpact,
      calculatedAt: new Date()
    };
  }
  
  /**
   * Calculates compatibility between a user and multiple other users
   * 
   * @param user User profile
   * @param targetUsers Profiles of potential matches
   * @param factorWeights Weights for different compatibility factors
   * @param includeDetails Whether to include detailed factor breakdowns
   * @returns Array of compatibility results
   */
  async calculateBatchUserCompatibility(
    user: IProfile,
    targetUsers: Array<IProfile>,
    factorWeights: Record<CompatibilityFactor, number> = this.defaultFactorWeights,
    includeDetails: boolean = false
  ): Promise<Array<IUserCompatibility>> {
    // Calculate compatibility with each target user in parallel
    return Promise.all(
      targetUsers.map(targetUser => 
        this.calculateUserCompatibility(user, targetUser, factorWeights, includeDetails)
      )
    );
  }
  
  /**
   * Calculates compatibility between a user and multiple tribes
   * 
   * @param user User profile
   * @param tribes Array of tribes
   * @param memberProfiles Map of tribe member profiles by user ID
   * @param factorWeights Weights for different compatibility factors
   * @param includeDetails Whether to include detailed factor breakdowns
   * @returns Array of compatibility results
   */
  async calculateBatchTribeCompatibility(
    user: IProfile,
    tribes: Array<ITribe>,
    memberProfiles: Map<string, IProfile>,
    factorWeights: Record<CompatibilityFactor, number> = this.defaultFactorWeights,
    includeDetails: boolean = false
  ): Promise<Array<ITribeCompatibility>> {
    // Calculate compatibility with each tribe in parallel
    return Promise.all(
      tribes.map(tribe => {
        // Get profiles of tribe members
        const tribeUserProfiles = tribe.members
          .map(member => memberProfiles.get(member.userId))
          .filter(profile => profile !== undefined) as IProfile[];
        
        return this.calculateTribeCompatibility(
          user, 
          tribe, 
          tribeUserProfiles, 
          factorWeights, 
          includeDetails
        );
      })
    );
  }
  
  /**
   * Processes a compatibility request between a user and another user or tribe
   * 
   * @param request Compatibility request parameters
   * @param userProfiles Map of user profiles by ID
   * @param tribes Map of tribes by ID
   * @param memberProfiles Map of tribe member profiles by ID
   * @returns Compatibility result
   */
  async processCompatibilityRequest(
    request: ICompatibilityRequest,
    userProfiles: Map<string, IProfile>,
    tribes: Map<string, ITribe>,
    memberProfiles: Map<string, IProfile>
  ): Promise<IUserCompatibility | ITribeCompatibility> {
    const { userId, targetType, targetId, includeDetails, factorWeights } = request;
    
    // Get user profile
    const user = userProfiles.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    if (targetType === 'user') {
      // Calculate user-to-user compatibility
      const targetUser = userProfiles.get(targetId);
      if (!targetUser) {
        throw new Error(`Target user with ID ${targetId} not found`);
      }
      
      return this.calculateUserCompatibility(user, targetUser, factorWeights, includeDetails);
    } else {
      // Calculate user-to-tribe compatibility
      const tribe = tribes.get(targetId);
      if (!tribe) {
        throw new Error(`Tribe with ID ${targetId} not found`);
      }
      
      // Get profiles of tribe members
      const tribeUserProfiles = tribe.members
        .map(member => memberProfiles.get(member.userId))
        .filter(profile => profile !== undefined) as IProfile[];
      
      return this.calculateTribeCompatibility(
        user,
        tribe,
        tribeUserProfiles,
        factorWeights,
        includeDetails
      );
    }
  }
  
  /**
   * Processes a batch compatibility request between a user and multiple users or tribes
   * 
   * @param request Batch compatibility request parameters
   * @param userProfiles Map of user profiles by ID
   * @param tribes Map of tribes by ID
   * @param memberProfiles Map of tribe member profiles by ID
   * @returns Array of compatibility results
   */
  async processBatchCompatibilityRequest(
    request: ICompatibilityBatchRequest,
    userProfiles: Map<string, IProfile>,
    tribes: Map<string, ITribe>,
    memberProfiles: Map<string, IProfile>
  ): Promise<Array<IUserCompatibility | ITribeCompatibility>> {
    const { userId, targetType, targetIds, includeDetails, factorWeights } = request;
    
    // Get user profile
    const user = userProfiles.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    if (targetType === 'user') {
      // Calculate user-to-user compatibility for multiple users
      const targetUsers = targetIds
        .map(id => userProfiles.get(id))
        .filter(profile => profile !== undefined) as IProfile[];
      
      return this.calculateBatchUserCompatibility(
        user,
        targetUsers,
        factorWeights,
        includeDetails
      );
    } else {
      // Calculate user-to-tribe compatibility for multiple tribes
      const targetTribes = targetIds
        .map(id => tribes.get(id))
        .filter(tribe => tribe !== undefined) as ITribe[];
      
      return this.calculateBatchTribeCompatibility(
        user,
        targetTribes,
        memberProfiles,
        factorWeights,
        includeDetails
      );
    }
  }
  
  /**
   * Finds the most compatible tribes for a user from a pool of tribes
   * 
   * @param user User profile to find matches for
   * @param tribes Pool of potential tribe matches
   * @param memberProfiles Profiles of all tribe members
   * @param factorWeights Weights for different compatibility factors
   * @param limit Maximum number of results to return
   * @param threshold Minimum compatibility score to consider (0-100)
   * @returns Array of compatible tribes with scores
   */
  async findMostCompatibleTribes(
    user: IProfile,
    tribes: Array<ITribe>,
    memberProfiles: Map<string, IProfile>,
    factorWeights: Record<CompatibilityFactor, number> = this.defaultFactorWeights,
    limit: number = 10,
    threshold: number = 70
  ): Promise<Array<{tribeId: string, compatibilityScore: number, details?: ICompatibilityDetail[]}>> {
    return findMostCompatibleTribes(
      user,
      tribes,
      memberProfiles,
      factorWeights,
      limit,
      threshold
    );
  }
  
  /**
   * Finds the most compatible users for a given user from a pool of candidates
   * 
   * @param user User profile to find matches for
   * @param candidates Pool of potential user matches
   * @param factorWeights Weights for different compatibility factors
   * @param limit Maximum number of results to return
   * @param threshold Minimum compatibility score to consider (0-100)
   * @returns Array of compatible users with scores
   */
  async findMostCompatibleUsers(
    user: IProfile,
    candidates: Array<IProfile>,
    factorWeights: Record<CompatibilityFactor, number> = this.defaultFactorWeights,
    limit: number = 10,
    threshold: number = 70
  ): Promise<Array<{userId: string, compatibilityScore: number, details?: ICompatibilityDetail[]}>> {
    // Calculate compatibility with all candidates
    const compatibilityResults = await Promise.all(
      candidates
        .filter(candidate => candidate.id !== user.id)
        .map(async candidate => {
          const compatibility = await this.calculateUserCompatibility(
            user,
            candidate,
            factorWeights,
            true // include details
          );
          
          return {
            userId: candidate.id,
            compatibilityScore: compatibility.overallScore,
            details: compatibility.details
          };
        })
    );
    
    // Filter results by threshold, sort by compatibility score, and limit
    return compatibilityResults
      .filter(result => result.compatibilityScore >= threshold)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);
  }
  
  /**
   * Uses AI to enhance compatibility analysis with additional insights
   * 
   * @param user1 First user profile
   * @param user2 Second user profile
   * @param personalityCompatibility Calculated personality compatibility
   * @param interestCompatibility Calculated interest compatibility
   * @returns AI-enhanced compatibility score and insights
   * @private
   */
  private async enhanceCompatibilityWithAI(
    user1: IProfile,
    user2: IProfile,
    personalityCompatibility: IPersonalityCompatibility,
    interestCompatibility: IInterestCompatibility
  ): Promise<{enhancedScore: number, insights: string}> {
    try {
      // Prepare prompt with user profiles, personality traits, and interests
      const prompt = `
        As an AI matchmaking expert, analyze the compatibility between these two users for the Tribe platform:
        
        User 1: ${user1.name}
        - Personality: ${user1.personalityTraits.map(t => `${t.trait}: ${t.score}`).join(', ')}
        - Communication style: ${user1.communicationStyle}
        - Interests: ${user1.interests.map(i => i.name).join(', ')}
        
        User 2: ${user2.name}
        - Personality: ${user2.personalityTraits.map(t => `${t.trait}: ${t.score}`).join(', ')}
        - Communication style: ${user2.communicationStyle}
        - Interests: ${user2.interests.map(i => i.name).join(', ')}
        
        Algorithm has calculated:
        - Personality compatibility: ${personalityCompatibility.overallScore.toFixed(1)}%
        - Interest compatibility: ${interestCompatibility.overallScore.toFixed(1)}%
        - Complementary traits: ${personalityCompatibility.complementaryTraits.join(', ')}
        - Shared interests: ${interestCompatibility.sharedInterests.map(i => i.name).join(', ')}
        
        Based on this data and your expertise in group dynamics and social psychology:
        1. Provide a compatibility score (0-100) that might differ from the algorithm's calculation
        2. Explain briefly why these users might or might not form a good connection
        
        Format your response as:
        SCORE: [number]
        INSIGHTS: [explanation]
      `;
      
      // Send prompt to OpenRouter AI API
      const response = await this.aiClient.chat.completions.create({
        model: 'openai/gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300
      });
      
      // Extract response text
      const responseText = response.choices[0]?.message?.content || '';
      
      // Parse AI response to extract enhanced score and insights
      const scoreMatch = responseText.match(/SCORE:\s*(\d+)/i);
      const insightsMatch = responseText.match(/INSIGHTS:\s*([\s\S]+)/i);
      
      const enhancedScore = scoreMatch ? parseInt(scoreMatch[1], 10) : personalityCompatibility.overallScore;
      const insights = insightsMatch ? insightsMatch[1].trim() : 'No additional insights available.';
      
      return {
        enhancedScore,
        insights
      };
    } catch (error) {
      // Fallback to algorithmic score if AI enhancement fails
      return {
        enhancedScore: (personalityCompatibility.overallScore + interestCompatibility.overallScore) / 2,
        insights: 'AI enhancement unavailable. Using algorithmic score.'
      };
    }
  }
}