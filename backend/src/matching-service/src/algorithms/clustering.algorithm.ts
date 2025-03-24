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
  ITribeMembership
} from '../../shared/src/types/tribe.types';
import { TRIBE_LIMITS } from '../../shared/src/constants/app.constants';
import { CompatibilityFactor } from '../models/compatibility.model';

// Constants for the clustering algorithm configuration
const DEFAULT_MIN_GROUP_SIZE = 4;
const DEFAULT_MAX_GROUP_SIZE = 8;
const DEFAULT_MAX_DISTANCE = 25; // kilometers
const DEFAULT_COMPATIBILITY_THRESHOLD = 0.7; // 70% compatibility
const EARTH_RADIUS_KM = 6371; // Earth radius in kilometers for distance calculations

/**
 * Interface defining the compatibility algorithm requirements
 * Provides methods for calculating compatibility between users
 */
export interface ICompatibilityAlgorithm {
  /**
   * Calculates compatibility between two users
   * @param user1 First user profile
   * @param user2 Second user profile
   * @returns Promise resolving to a compatibility score between 0 and 1
   */
  calculateUserCompatibility(user1: IProfile, user2: IProfile): Promise<number>;
  
  /**
   * Calculates compatibility between multiple users
   * @param users Array of user profiles
   * @returns Promise resolving to a matrix of compatibility scores
   */
  calculateBatchUserCompatibility(users: IProfile[]): Promise<Record<string, Record<string, number>>>;
}

/**
 * Options for configuring the clustering algorithm
 */
export interface ClusteringOptions {
  minGroupSize?: number;
  maxGroupSize?: number;
  maxDistance?: number;
  compatibilityThreshold?: number;
  factorWeights?: Record<CompatibilityFactor, number>;
}

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * @param coords1 First coordinate point
 * @param coords2 Second coordinate point
 * @returns Distance in kilometers between the two points
 */
export function calculateHaversineDistance(coords1: ICoordinates, coords2: ICoordinates): number {
  // Convert latitude and longitude from degrees to radians
  const lat1Rad = (coords1.latitude * Math.PI) / 180;
  const lon1Rad = (coords1.longitude * Math.PI) / 180;
  const lat2Rad = (coords2.latitude * Math.PI) / 180;
  const lon2Rad = (coords2.longitude * Math.PI) / 180;
  
  // Calculate differences between latitudes and longitudes
  const latDiff = lat2Rad - lat1Rad;
  const lonDiff = lon2Rad - lon1Rad;
  
  // Apply Haversine formula to compute great-circle distance
  const a = 
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
    Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Multiply by Earth's radius to get distance in kilometers
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates the Jaccard similarity coefficient between two sets of interests
 * @param interests1 First set of interests
 * @param interests2 Second set of interests
 * @returns Similarity score between 0 and 1
 */
export function calculateJaccardSimilarity(
  interests1: Array<{category: InterestCategory, name: string}>,
  interests2: Array<{category: InterestCategory, name: string}>
): number {
  if (interests1.length === 0 && interests2.length === 0) {
    return 1; // Both have no interests, consider them similar
  }
  
  if (interests1.length === 0 || interests2.length === 0) {
    return 0; // One has interests, the other doesn't
  }
  
  // Create sets of interest identifiers by combining category and name
  const interestSet1 = new Set(
    interests1.map(interest => `${interest.category}:${interest.name}`)
  );
  const interestSet2 = new Set(
    interests2.map(interest => `${interest.category}:${interest.name}`)
  );
  
  // Find the intersection of the two interest sets
  const intersection = new Set(
    [...interestSet1].filter(x => interestSet2.has(x))
  );
  
  // Find the union of the two interest sets
  const union = new Set([...interestSet1, ...interestSet2]);
  
  // Calculate Jaccard similarity as size of intersection divided by size of union
  return intersection.size / union.size;
}

/**
 * Extracts interests from a user profile into a simplified format
 * @param profile User profile
 * @returns Simplified interest array
 */
function extractInterestsFromProfile(profile: IProfile): Array<{category: InterestCategory, name: string}> {
  return profile.interests.map(interest => ({
    category: interest.category,
    name: interest.name
  }));
}

/**
 * Groups users based on geographic proximity using their coordinates
 * @param users Array of user profiles
 * @param maxDistance Maximum distance in km for users to be considered proximate
 * @returns Arrays of users grouped by proximity
 */
function findNearbyUsers(users: IProfile[], maxDistance: number): Array<Array<IProfile>> {
  const groups: Array<Array<IProfile>> = [];
  
  for (const user of users) {
    let foundGroup = false;
    
    // For each user, check if they can join an existing group
    for (const group of groups) {
      // Calculate distance to each user in existing groups
      const allWithinDistance = group.every(groupMember => 
        calculateHaversineDistance(user.coordinates, groupMember.coordinates) <= maxDistance
      );
      
      // Join first group where distance to all members is within maxDistance
      if (allWithinDistance) {
        group.push(user);
        foundGroup = true;
        break;
      }
    }
    
    // If no suitable group found, create a new group with just this user
    if (!foundGroup) {
      groups.push([user]);
    }
  }
  
  return groups;
}

/**
 * Refines initial proximity-based groups using personality compatibility
 * @param proximityGroups Initial groups based on geographic proximity
 * @param compatibilityAlgorithm Algorithm for calculating user compatibility
 * @param compatibilityThreshold Minimum compatibility threshold (0-1)
 * @param minGroupSize Minimum number of members per group
 * @param maxGroupSize Maximum number of members per group
 * @returns Refined groups based on personality compatibility
 */
async function refineGroupsByPersonality(
  proximityGroups: Array<Array<IProfile>>,
  compatibilityAlgorithm: ICompatibilityAlgorithm,
  compatibilityThreshold: number,
  minGroupSize: number,
  maxGroupSize: number
): Promise<Array<Array<IProfile>>> {
  const refinedGroups: Array<Array<IProfile>> = [];
  
  for (const proximityGroup of proximityGroups) {
    // For small groups, keep them as is if they meet minimum size
    if (proximityGroup.length <= maxGroupSize && proximityGroup.length >= minGroupSize) {
      refinedGroups.push(proximityGroup);
      continue;
    }
    
    // For larger proximity groups, we need to split them based on compatibility
    if (proximityGroup.length > maxGroupSize) {
      // Calculate compatibility matrix for all users in the group
      const compatibilityMatrix = await compatibilityAlgorithm.calculateBatchUserCompatibility(proximityGroup);
      
      // Identify subgroups with high personality compatibility
      const subgroups = [];
      const remainingUsers = [...proximityGroup];
      
      while (remainingUsers.length > 0) {
        const seed = remainingUsers.shift();
        if (!seed) break;
        
        const subgroup = [seed];
        
        // Find compatible users for this subgroup
        for (let i = remainingUsers.length - 1; i >= 0; i--) {
          const candidate = remainingUsers[i];
          
          // Check if candidate is compatible with all members of the subgroup
          const isCompatible = subgroup.every(member => {
            const compatibility = compatibilityMatrix[member.id]?.[candidate.id] ?? 0;
            return compatibility >= compatibilityThreshold;
          });
          
          if (isCompatible && subgroup.length < maxGroupSize) {
            subgroup.push(candidate);
            remainingUsers.splice(i, 1);
          }
        }
        
        subgroups.push(subgroup);
      }
      
      // Process subgroups
      for (const subgroup of subgroups) {
        if (subgroup.length >= minGroupSize) {
          refinedGroups.push(subgroup);
        } else {
          // Try to merge small compatible subgroups
          let merged = false;
          for (let i = 0; i < refinedGroups.length; i++) {
            const group = refinedGroups[i];
            if (group.length + subgroup.length <= maxGroupSize) {
              // Check compatibility between groups
              const allCompatible = subgroup.every(member1 => 
                group.every(member2 => {
                  const compatibility = compatibilityMatrix[member1.id]?.[member2.id] ?? 0;
                  return compatibility >= compatibilityThreshold;
                })
              );
              
              if (allCompatible) {
                refinedGroups[i] = [...group, ...subgroup];
                merged = true;
                break;
              }
            }
          }
          
          // If couldn't merge, add as a potential incomplete group
          if (!merged && subgroup.length > 1) {
            refinedGroups.push(subgroup);
          }
        }
      }
    } else {
      // For groups within size limits, keep them as is
      refinedGroups.push(proximityGroup);
    }
  }
  
  // Ensure subgroups meet minimum size requirements
  const finalGroups = [];
  const tooSmallGroups = [];
  
  for (const group of refinedGroups) {
    if (group.length >= minGroupSize) {
      finalGroups.push(group);
    } else {
      tooSmallGroups.push(group);
    }
  }
  
  // Merge small compatible subgroups when possible
  while (tooSmallGroups.length > 1) {
    const group1 = tooSmallGroups.shift();
    let merged = false;
    
    if (!group1) break;
    
    for (let i = 0; i < tooSmallGroups.length; i++) {
      const group2 = tooSmallGroups[i];
      
      if (group1.length + group2.length >= minGroupSize && 
          group1.length + group2.length <= maxGroupSize) {
        // Calculate compatibility between groups
        const compatibilityMatrix = await compatibilityAlgorithm.calculateBatchUserCompatibility(
          [...group1, ...group2]
        );
        
        const allCompatible = group1.every(member1 => 
          group2.every(member2 => {
            const compatibility = compatibilityMatrix[member1.id]?.[member2.id] ?? 0;
            return compatibility >= compatibilityThreshold;
          })
        );
        
        if (allCompatible) {
          const mergedGroup = [...group1, ...group2];
          finalGroups.push(mergedGroup);
          tooSmallGroups.splice(i, 1);
          merged = true;
          break;
        }
      }
    }
    
    // If couldn't merge, keep it for potential future matches
    if (!merged) {
      finalGroups.push(group1);
    }
  }
  
  // Add any remaining small group
  if (tooSmallGroups.length === 1) {
    finalGroups.push(tooSmallGroups[0]);
  }
  
  return finalGroups;
}

/**
 * Optimizes groups to maximize shared interests among members
 * @param groups Initial groups to optimize
 * @param minGroupSize Minimum number of members per group
 * @param maxGroupSize Maximum number of members per group
 * @returns Groups optimized for shared interests
 */
function optimizeGroupsByInterests(
  groups: Array<Array<IProfile>>,
  minGroupSize: number,
  maxGroupSize: number
): Array<Array<IProfile>> {
  const optimizedGroups = [...groups.map(group => [...group])];
  
  // Calculate interest similarity for each group
  const calculateGroupInterestCohesion = (group: IProfile[]): number => {
    if (group.length <= 1) return 1;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const interests1 = extractInterestsFromProfile(group[i]);
        const interests2 = extractInterestsFromProfile(group[j]);
        const similarity = calculateJaccardSimilarity(interests1, interests2);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  };
  
  // Calculate initial cohesion for each group
  const groupCohesions = optimizedGroups.map(calculateGroupInterestCohesion);
  
  // Try swapping members to improve interest cohesion
  let improvements = true;
  const maxIterations = 5; // Limit iterations to prevent excessive computation
  let iteration = 0;
  
  while (improvements && iteration < maxIterations) {
    improvements = false;
    iteration++;
    
    // Identify potential member swaps that would increase overall interest similarity
    for (let i = 0; i < optimizedGroups.length; i++) {
      for (let j = i + 1; j < optimizedGroups.length; j++) {
        const group1 = optimizedGroups[i];
        const group2 = optimizedGroups[j];
        
        // Skip if either group is at size limits
        if (group1.length <= minGroupSize || group2.length <= minGroupSize) {
          continue;
        }
        
        // Try swapping each pair of members
        for (let memberIdx1 = 0; memberIdx1 < group1.length; memberIdx1++) {
          for (let memberIdx2 = 0; memberIdx2 < group2.length; memberIdx2++) {
            // Create potential new groups after swapping
            const newGroup1 = [
              ...group1.slice(0, memberIdx1),
              group2[memberIdx2],
              ...group1.slice(memberIdx1 + 1)
            ];
            
            const newGroup2 = [
              ...group2.slice(0, memberIdx2),
              group1[memberIdx1],
              ...group2.slice(memberIdx2 + 1)
            ];
            
            // Calculate new cohesion scores
            const newCohesion1 = calculateGroupInterestCohesion(newGroup1);
            const newCohesion2 = calculateGroupInterestCohesion(newGroup2);
            
            // Perform swaps that improve group cohesion without violating size constraints
            if ((newCohesion1 + newCohesion2) > (groupCohesions[i] + groupCohesions[j])) {
              // Update groups and cohesion scores
              optimizedGroups[i] = newGroup1;
              optimizedGroups[j] = newGroup2;
              groupCohesions[i] = newCohesion1;
              groupCohesions[j] = newCohesion2;
              improvements = true;
              
              // Break from inner loops - we'll reassess with new groups
              break;
            }
          }
          
          if (improvements) break;
        }
        
        if (improvements) break;
      }
      
      if (improvements) break;
    }
  }
  
  // Ensure all groups maintain minimum size requirements
  return optimizedGroups;
}

/**
 * Balances groups to ensure diverse personality trait distribution
 * @param groups Groups to balance for personality traits
 * @param minGroupSize Minimum number of members per group
 * @param maxGroupSize Maximum number of members per group
 * @returns Groups balanced for personality trait distribution
 */
function balanceGroupsByPersonalityDistribution(
  groups: Array<Array<IProfile>>,
  minGroupSize: number,
  maxGroupSize: number
): Array<Array<IProfile>> {
  const balancedGroups = [...groups.map(group => [...group])];
  
  // Calculate personality trait distribution for each group
  const calculateTraitDistribution = (group: IProfile[]): Record<PersonalityTrait, number> => {
    const distribution: Partial<Record<PersonalityTrait, number>> = {};
    
    for (const member of group) {
      for (const trait of member.personalityTraits) {
        distribution[trait.trait] = (distribution[trait.trait] || 0) + trait.score;
      }
    }
    
    // Normalize by group size
    Object.keys(distribution).forEach(key => {
      const trait = key as PersonalityTrait;
      distribution[trait] = (distribution[trait] || 0) / group.length;
    });
    
    return distribution as Record<PersonalityTrait, number>;
  };
  
  // Calculate trait variance (measure of balance)
  const calculateTraitVariance = (distribution: Record<PersonalityTrait, number>): number => {
    const values = Object.values(distribution);
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  };
  
  // Calculate initial trait distributions and variances
  const groupDistributions = balancedGroups.map(calculateTraitDistribution);
  const groupVariances = groupDistributions.map(calculateTraitVariance);
  
  // Try swapping members to improve trait balance
  let improvements = true;
  const maxIterations = 5; // Limit iterations to prevent excessive computation
  let iteration = 0;
  
  while (improvements && iteration < maxIterations) {
    improvements = false;
    iteration++;
    
    // Identify potential member swaps that would improve trait balance
    for (let i = 0; i < balancedGroups.length; i++) {
      for (let j = i + 1; j < balancedGroups.length; j++) {
        const group1 = balancedGroups[i];
        const group2 = balancedGroups[j];
        
        // Skip if either group is at size limits
        if (group1.length <= minGroupSize || group2.length <= minGroupSize) {
          continue;
        }
        
        // Try swapping each pair of members
        for (let memberIdx1 = 0; memberIdx1 < group1.length; memberIdx1++) {
          for (let memberIdx2 = 0; memberIdx2 < group2.length; memberIdx2++) {
            // Create potential new groups after swapping
            const newGroup1 = [
              ...group1.slice(0, memberIdx1),
              group2[memberIdx2],
              ...group1.slice(memberIdx1 + 1)
            ];
            
            const newGroup2 = [
              ...group2.slice(0, memberIdx2),
              group1[memberIdx1],
              ...group2.slice(memberIdx2 + 1)
            ];
            
            // Calculate new distributions and variances
            const newDistribution1 = calculateTraitDistribution(newGroup1);
            const newDistribution2 = calculateTraitDistribution(newGroup2);
            const newVariance1 = calculateTraitVariance(newDistribution1);
            const newVariance2 = calculateTraitVariance(newDistribution2);
            
            // Perform swaps that improve balance without reducing compatibility below threshold
            if ((newVariance1 + newVariance2) < (groupVariances[i] + groupVariances[j])) {
              // Update groups, distributions, and variances
              balancedGroups[i] = newGroup1;
              balancedGroups[j] = newGroup2;
              groupDistributions[i] = newDistribution1;
              groupDistributions[j] = newDistribution2;
              groupVariances[i] = newVariance1;
              groupVariances[j] = newVariance2;
              improvements = true;
              
              // Break from inner loops - we'll reassess with new groups
              break;
            }
          }
          
          if (improvements) break;
        }
        
        if (improvements) break;
      }
      
      if (improvements) break;
    }
  }
  
  // Ensure all groups maintain minimum size requirements
  return balancedGroups;
}

/**
 * Calculates compatibility scores for all members within each group
 * @param groups Groups to calculate compatibility scores for
 * @param compatibilityAlgorithm Algorithm for calculating user compatibility
 * @returns Groups with member compatibility scores
 */
async function calculateGroupCompatibilityScores(
  groups: Array<Array<IProfile>>,
  compatibilityAlgorithm: ICompatibilityAlgorithm
): Promise<Array<{members: Array<{userId: string, compatibilityScore: number}>}>> {
  const result = [];
  
  for (const group of groups) {
    // For each group, calculate compatibility between each member and the group as a whole
    const compatibilityMatrix = await compatibilityAlgorithm.calculateBatchUserCompatibility(group);
    
    // Calculate average compatibility score for each member
    const memberScores = group.map(member => {
      let totalScore = 0;
      let comparisons = 0;
      
      for (const otherMember of group) {
        if (member.id !== otherMember.id) {
          const compatibility = compatibilityMatrix[member.id]?.[otherMember.id] ?? 0;
          totalScore += compatibility;
          comparisons++;
        }
      }
      
      // Average individual compatibility scores to get overall member compatibility
      const avgScore = comparisons > 0 ? totalScore / comparisons : 0;
      
      return {
        userId: member.id,
        compatibilityScore: avgScore
      };
    });
    
    result.push({
      members: memberScores
    });
  }
  
  return result;
}

/**
 * Finds existing tribes that have capacity for new members
 * @param tribes List of all tribes
 * @returns Tribes with available capacity
 */
function findAvailableTribes(tribes: ITribe[]): ITribe[] {
  return tribes.filter(tribe => 
    tribe.members.length < tribe.maxMembers
  );
}

/**
 * Calculates compatibility between a user and potential tribes
 * @param user User profile
 * @param tribesWithMembers Tribes with their member profiles
 * @param compatibilityAlgorithm Algorithm for calculating compatibility
 * @param factorWeights Weights for different compatibility factors
 * @returns Compatibility scores for each tribe
 */
async function calculateUserToTribeCompatibility(
  user: IProfile,
  tribesWithMembers: Array<{tribe: ITribe, members: Array<IProfile>}>,
  compatibilityAlgorithm: ICompatibilityAlgorithm,
  factorWeights: Record<CompatibilityFactor, number>
): Promise<Array<{tribeId: string, compatibilityScore: number}>> {
  const results = [];
  
  for (const { tribe, members } of tribesWithMembers) {
    // Skip empty tribes
    if (members.length === 0) {
      results.push({
        tribeId: tribe.id,
        compatibilityScore: 0
      });
      continue;
    }
    
    // Consider personality compatibility with existing members
    let personalityScore = 0;
    for (const member of members) {
      const score = await compatibilityAlgorithm.calculateUserCompatibility(user, member);
      personalityScore += score;
    }
    personalityScore /= members.length;
    
    // Consider interest overlap with tribe interests
    const userInterests = extractInterestsFromProfile(user);
    const tribeInterests = members.flatMap(member => extractInterestsFromProfile(member));
    const uniqueTribeInterests = Array.from(
      new Set(tribeInterests.map(i => `${i.category}:${i.name}`))
    ).map(key => {
      const [category, name] = key.split(':');
      return { 
        category: category as InterestCategory, 
        name 
      };
    });
    
    const interestScore = calculateJaccardSimilarity(userInterests, uniqueTribeInterests);
    
    // Consider location proximity to tribe location
    const locationDistance = calculateHaversineDistance(user.coordinates, tribe.coordinates);
    const maxDistance = 25; // Maximum acceptable distance in kilometers
    const locationScore = Math.max(0, 1 - (locationDistance / maxDistance));
    
    // Consider communication style compatibility with members
    const communicationStyles = members.map(m => m.communicationStyle);
    const userStyleCount = communicationStyles.filter(style => style === user.communicationStyle).length;
    const communicationScore = userStyleCount / members.length;
    
    // Consider impact on group balance (simplified implementation)
    const groupBalanceImpact = 0.5; // Neutral impact for simplicity
    
    // Apply factor weights to calculate overall compatibility score
    const overallScore = 
      (personalityScore * factorWeights[CompatibilityFactor.PERSONALITY]) +
      (interestScore * factorWeights[CompatibilityFactor.INTERESTS]) +
      (locationScore * factorWeights[CompatibilityFactor.LOCATION]) +
      (communicationScore * factorWeights[CompatibilityFactor.COMMUNICATION_STYLE]) +
      (groupBalanceImpact * factorWeights[CompatibilityFactor.GROUP_BALANCE]);
    
    // Normalize to ensure score is between 0 and 1
    const weightSum = Object.values(factorWeights).reduce((sum, weight) => sum + weight, 0);
    const normalizedScore = overallScore / weightSum;
    
    results.push({
      tribeId: tribe.id,
      compatibilityScore: normalizedScore
    });
  }
  
  return results;
}

/**
 * Implements the clustering algorithm for grouping users into compatible tribes
 */
export class ClusteringAlgorithm {
  private compatibilityAlgorithm: ICompatibilityAlgorithm;
  private minGroupSize: number;
  private maxGroupSize: number;
  private maxDistance: number;
  private compatibilityThreshold: number;
  private factorWeights: Record<CompatibilityFactor, number>;
  
  /**
   * Initializes the clustering algorithm with default or custom parameters
   * @param compatibilityAlgorithm Algorithm for calculating user compatibility
   * @param options Optional configuration parameters
   */
  constructor(
    compatibilityAlgorithm: ICompatibilityAlgorithm,
    options: ClusteringOptions = {}
  ) {
    this.compatibilityAlgorithm = compatibilityAlgorithm;
    this.minGroupSize = options.minGroupSize || DEFAULT_MIN_GROUP_SIZE;
    this.maxGroupSize = options.maxGroupSize || DEFAULT_MAX_GROUP_SIZE;
    this.maxDistance = options.maxDistance || DEFAULT_MAX_DISTANCE;
    this.compatibilityThreshold = options.compatibilityThreshold || DEFAULT_COMPATIBILITY_THRESHOLD;
    
    // Initialize default factor weights for compatibility calculation
    this.factorWeights = options.factorWeights || {
      [CompatibilityFactor.PERSONALITY]: 0.4,
      [CompatibilityFactor.INTERESTS]: 0.3,
      [CompatibilityFactor.COMMUNICATION_STYLE]: 0.1,
      [CompatibilityFactor.LOCATION]: 0.1,
      [CompatibilityFactor.GROUP_BALANCE]: 0.1
    };
  }
  
  /**
   * Main method to form tribes from a set of users
   * @param users Array of user profiles to group into tribes
   * @returns Formed tribes with member compatibility scores
   */
  async formTribes(users: IProfile[]): Promise<Array<{members: Array<{userId: string, compatibilityScore: number}>}>> {
    // Group users by geographic proximity using findNearbyUsers
    const proximityGroups = findNearbyUsers(users, this.maxDistance);
    
    // Refine groups based on personality compatibility
    const personalityGroups = await refineGroupsByPersonality(
      proximityGroups,
      this.compatibilityAlgorithm,
      this.compatibilityThreshold,
      this.minGroupSize,
      this.maxGroupSize
    );
    
    // Optimize groups based on shared interests
    const interestGroups = optimizeGroupsByInterests(
      personalityGroups,
      this.minGroupSize,
      this.maxGroupSize
    );
    
    // Balance groups for personality trait distribution
    const balancedGroups = balanceGroupsByPersonalityDistribution(
      interestGroups,
      this.minGroupSize,
      this.maxGroupSize
    );
    
    // Calculate compatibility scores for all members within each group
    const tribesWithScores = await calculateGroupCompatibilityScores(
      balancedGroups,
      this.compatibilityAlgorithm
    );
    
    return tribesWithScores;
  }
  
  /**
   * Finds compatible existing tribes for users based on compatibility scores
   * @param users Array of user profiles to match to existing tribes
   * @param existingTribes Array of existing tribes
   * @param tribeMembers Array of profiles for existing tribe members
   * @returns User-tribe assignments and remaining unassigned users
   */
  async findExistingTribeMatches(
    users: IProfile[],
    existingTribes: ITribe[],
    tribeMembers: IProfile[]
  ): Promise<{
    assignments: Map<string, {tribeId: string, compatibilityScore: number}>,
    remainingUsers: IProfile[]
  }> {
    // Find tribes with available capacity using findAvailableTribes
    const availableTribes = findAvailableTribes(existingTribes);
    
    // Group tribe members by tribe ID for efficient lookup
    const membersByTribe = new Map<string, IProfile[]>();
    for (const tribe of availableTribes) {
      const tribeUserIds = tribe.members.map(m => m.userId);
      const members = tribeMembers.filter(m => tribeUserIds.includes(m.id));
      membersByTribe.set(tribe.id, members);
    }
    
    // For each user, calculate compatibility with available tribes
    const userTribeCompatibility = new Map<string, Array<{tribeId: string, compatibilityScore: number}>>();
    
    for (const user of users) {
      const tribesWithMembers = availableTribes.map(tribe => ({
        tribe,
        members: membersByTribe.get(tribe.id) || []
      }));
      
      const compatibilities = await calculateUserToTribeCompatibility(
        user,
        tribesWithMembers,
        this.compatibilityAlgorithm,
        this.factorWeights
      );
      
      userTribeCompatibility.set(user.id, compatibilities);
    }
    
    // Assign users to most compatible tribes where score exceeds threshold
    const assignments = new Map<string, {tribeId: string, compatibilityScore: number}>();
    const tribeCapacity = new Map<string, number>();
    
    // Initialize tribe capacity
    for (const tribe of availableTribes) {
      tribeCapacity.set(tribe.id, tribe.maxMembers - tribe.members.length);
    }
    
    // Sort users by their highest compatibility score (descending)
    const userScores = users.map(user => {
      const compatibilities = userTribeCompatibility.get(user.id) || [];
      const highestCompat = compatibilities.sort((a, b) => b.compatibilityScore - a.compatibilityScore)[0];
      return {
        userId: user.id,
        highestCompatTribe: highestCompat?.tribeId,
        highestCompatScore: highestCompat?.compatibilityScore || 0
      };
    }).sort((a, b) => b.highestCompatScore - a.highestCompatScore);
    
    // Assign users to tribes
    for (const userScore of userScores) {
      // Skip users with compatibility below threshold
      if (userScore.highestCompatScore < this.compatibilityThreshold || !userScore.highestCompatTribe) {
        continue;
      }
      
      const tribeId = userScore.highestCompatTribe;
      const tribeAvailableCapacity = tribeCapacity.get(tribeId) || 0;
      
      // Track tribe capacity to avoid exceeding maxMembers
      if (tribeAvailableCapacity > 0) {
        assignments.set(userScore.userId, {
          tribeId,
          compatibilityScore: userScore.highestCompatScore
        });
        
        // Update tribe capacity
        tribeCapacity.set(tribeId, tribeAvailableCapacity - 1);
      }
    }
    
    // Return map of assigned users with tribe IDs and compatibility scores
    // Also return array of users who couldn't be matched to existing tribes
    const remainingUsers = users.filter(user => !assignments.has(user.id));
    
    return {
      assignments,
      remainingUsers
    };
  }
  
  /**
   * Creates new tribes from users who couldn't be matched to existing tribes
   * @param users Array of user profiles to form into new tribes
   * @returns Newly formed tribes with member compatibility scores
   */
  async createNewTribes(
    users: IProfile[]
  ): Promise<Array<{members: Array<{userId: string, compatibilityScore: number}>}>> {
    // Call formTribes method to create optimal groupings
    return this.formTribes(users);
  }
  
  /**
   * Updates the algorithm parameters with new options
   * @param options New algorithm configuration options
   */
  setOptions(options: ClusteringOptions): void {
    if (options.minGroupSize !== undefined) {
      this.minGroupSize = options.minGroupSize;
    }
    
    if (options.maxGroupSize !== undefined) {
      this.maxGroupSize = options.maxGroupSize;
    }
    
    if (options.maxDistance !== undefined) {
      this.maxDistance = options.maxDistance;
    }
    
    if (options.compatibilityThreshold !== undefined) {
      this.compatibilityThreshold = options.compatibilityThreshold;
    }
    
    if (options.factorWeights !== undefined) {
      this.factorWeights = options.factorWeights;
    }
  }
}