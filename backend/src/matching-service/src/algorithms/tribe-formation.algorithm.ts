/**
 * Tribe Formation Algorithm
 * 
 * This file implements the core tribe formation algorithm for the Tribe platform's AI-powered matchmaking functionality.
 * It combines clustering, compatibility analysis, and optimization techniques to form balanced tribes of 4-8 members
 * based on personality traits, interests, communication styles, and geographic proximity.
 * 
 * The algorithm performs the following key functions:
 * 1. Assigns users to compatible existing tribes based on comprehensive compatibility scores
 * 2. Forms new balanced tribes from users who couldn't be matched to existing tribes
 * 3. Optimizes tribe assignments to maximize overall compatibility and psychological balance
 * 4. Enhances tribe formation with AI-powered insights and suggestions
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
  ITribeMembership
} from '../../shared/src/types/tribe.types';
import { TRIBE_LIMITS } from '../../shared/src/constants/app.constants';
import { CompatibilityFactor } from '../models/compatibility.model';
import {
  ClusteringAlgorithm,
  ClusteringOptions
} from './clustering.algorithm';
import {
  CompatibilityAlgorithm,
  calculateGroupBalanceImpact
} from './compatibility.algorithm';

// Default configuration values for tribe formation
const DEFAULT_MIN_GROUP_SIZE = 4;
const DEFAULT_MAX_GROUP_SIZE = 8;
const DEFAULT_MAX_DISTANCE = 25; // miles
const DEFAULT_COMPATIBILITY_THRESHOLD = 0.7; // 70% compatibility
const DEFAULT_FACTOR_WEIGHTS = {
  [CompatibilityFactor.PERSONALITY]: 0.3,
  [CompatibilityFactor.INTERESTS]: 0.25,
  [CompatibilityFactor.COMMUNICATION_STYLE]: 0.2,
  [CompatibilityFactor.LOCATION]: 0.15,
  [CompatibilityFactor.GROUP_BALANCE]: 0.1
};

/**
 * Configuration options for the tribe formation algorithm
 */
export interface TribeFormationOptions {
  minGroupSize?: number;
  maxGroupSize?: number;
  maxDistance?: number;
  compatibilityThreshold?: number;
  factorWeights?: Record<CompatibilityFactor, number>;
}

/**
 * Assigns users to existing tribes based on compatibility scores and available capacity
 * 
 * @param users Array of user profiles to assign to tribes
 * @param existingTribes Array of existing tribes with capacity for new members
 * @param memberProfiles Map of profiles for existing tribe members
 * @param compatibilityAlgorithm Algorithm for calculating user-tribe compatibility
 * @param options Configuration options for tribe formation
 * @returns Assignments of users to tribes and remaining unassigned users
 */
export async function assignUsersToExistingTribes(
  users: Array<IProfile>,
  existingTribes: Array<ITribe>,
  memberProfiles: Map<string, IProfile>,
  compatibilityAlgorithm: CompatibilityAlgorithm,
  options: TribeFormationOptions
): Promise<{
  assignments: Map<string, {tribeId: string, compatibilityScore: number}>,
  remainingUsers: Array<IProfile>
}> {
  // Filter tribes to find those with available capacity
  const tribesWithCapacity = existingTribes.filter(tribe => 
    tribe.members.length < tribe.maxMembers
  );
  
  if (tribesWithCapacity.length === 0) {
    // No existing tribes have capacity, all users remain unassigned
    return {
      assignments: new Map(),
      remainingUsers: [...users]
    };
  }
  
  // Group tribe members by tribe ID for efficient lookup
  const membersByTribe = new Map<string, Array<IProfile>>();
  for (const tribe of tribesWithCapacity) {
    const memberIds = tribe.members.map(member => member.userId);
    const tribeMembers = Array.from(memberProfiles.values())
      .filter(profile => memberIds.includes(profile.id));
    membersByTribe.set(tribe.id, tribeMembers);
  }
  
  // For each user, calculate compatibility with all available tribes
  const tribeCompatibilityScores = new Map<string, Array<{tribeId: string, compatibilityScore: number}>>();
  
  for (const user of users) {
    const compatibilityScores = [];
    
    for (const tribe of tribesWithCapacity) {
      const tribeMembers = membersByTribe.get(tribe.id) || [];
      
      const compatibility = await compatibilityAlgorithm.calculateTribeCompatibility(
        user,
        tribe,
        tribeMembers,
        options.factorWeights,
        false // don't include details for performance
      );
      
      compatibilityScores.push({
        tribeId: tribe.id,
        compatibilityScore: compatibility.overallScore
      });
    }
    
    tribeCompatibilityScores.set(user.id, compatibilityScores);
  }
  
  // Assign users to tribes in order of compatibility score
  const assignments = new Map<string, {tribeId: string, compatibilityScore: number}>();
  const tribeCapacity = new Map<string, number>();
  
  // Initialize tribe capacity
  tribesWithCapacity.forEach(tribe => {
    tribeCapacity.set(tribe.id, tribe.maxMembers - tribe.members.length);
  });
  
  // Sort users by their highest compatibility score
  const userScores = users.map(user => {
    const scores = tribeCompatibilityScores.get(user.id) || [];
    const bestMatch = scores.sort((a, b) => b.compatibilityScore - a.compatibilityScore)[0];
    
    return {
      userId: user.id,
      bestMatchTribeId: bestMatch?.tribeId,
      bestMatchScore: bestMatch?.compatibilityScore || 0
    };
  }).sort((a, b) => b.bestMatchScore - a.bestMatchScore); // Highest score first
  
  // Set compatibility threshold
  const compatibilityThreshold = options.compatibilityThreshold || DEFAULT_COMPATIBILITY_THRESHOLD;
  
  // Assign users to tribes based on compatibility score
  for (const userScore of userScores) {
    // Skip users with no compatible tribes or below threshold
    if (!userScore.bestMatchTribeId || userScore.bestMatchScore < compatibilityThreshold * 100) {
      continue;
    }
    
    const tribeId = userScore.bestMatchTribeId;
    const availableCapacity = tribeCapacity.get(tribeId) || 0;
    
    // Assign user if tribe has capacity
    if (availableCapacity > 0) {
      assignments.set(userScore.userId, {
        tribeId,
        compatibilityScore: userScore.bestMatchScore
      });
      
      // Update remaining capacity
      tribeCapacity.set(tribeId, availableCapacity - 1);
    }
  }
  
  // Identify remaining users who couldn't be assigned
  const remainingUsers = users.filter(user => !assignments.has(user.id));
  
  return {
    assignments,
    remainingUsers
  };
}

/**
 * Forms new tribes from users who couldn't be matched to existing tribes
 * 
 * @param users Array of user profiles to form into new tribes
 * @param clusteringAlgorithm Algorithm for clustering users into compatible groups
 * @param options Configuration options for tribe formation
 * @returns Newly formed tribes with member details
 */
export async function formNewTribes(
  users: Array<IProfile>,
  clusteringAlgorithm: ClusteringAlgorithm,
  options: TribeFormationOptions
): Promise<Array<{members: Array<{userId: string, compatibilityScore: number}>}>> {
  if (users.length === 0) {
    return [];
  }
  
  // Configure clustering algorithm with provided options
  const clusteringOptions: ClusteringOptions = {
    minGroupSize: options.minGroupSize || DEFAULT_MIN_GROUP_SIZE,
    maxGroupSize: options.maxGroupSize || DEFAULT_MAX_GROUP_SIZE,
    maxDistance: options.maxDistance || DEFAULT_MAX_DISTANCE,
    compatibilityThreshold: options.compatibilityThreshold || DEFAULT_COMPATIBILITY_THRESHOLD,
    factorWeights: options.factorWeights || DEFAULT_FACTOR_WEIGHTS
  };
  
  clusteringAlgorithm.setOptions(clusteringOptions);
  
  // Create new tribes using the clustering algorithm
  const newTribes = await clusteringAlgorithm.createNewTribes(users);
  
  return newTribes;
}

/**
 * Optimizes tribe assignments to maximize overall compatibility and group balance
 * 
 * @param existingAssignments Map of user assignments to existing tribes
 * @param newTribes Newly formed tribes with member details
 * @param userProfiles Map of user profiles by user ID
 * @param existingTribes Map of existing tribes by tribe ID
 * @param tribeMemberProfiles Map of tribe member profiles by tribe ID
 * @param compatibilityAlgorithm Algorithm for calculating compatibility
 * @returns Optimized assignments to existing and new tribes
 */
export async function optimizeTribes(
  existingAssignments: Map<string, {tribeId: string, compatibilityScore: number}>,
  newTribes: Array<{members: Array<{userId: string, compatibilityScore: number}>}>,
  userProfiles: Map<string, IProfile>,
  existingTribes: Map<string, ITribe>,
  tribeMemberProfiles: Map<string, Array<IProfile>>,
  compatibilityAlgorithm: CompatibilityAlgorithm
): Promise<{
  existingAssignments: Map<string, {tribeId: string, compatibilityScore: number}>,
  newTribes: Array<{members: Array<{userId: string, compatibilityScore: number}>}>
}> {
  if (existingAssignments.size === 0 && newTribes.length === 0) {
    return { existingAssignments, newTribes };
  }
  
  // Create a copy of assignments and tribes for optimization
  const optimizedExistingAssignments = new Map(existingAssignments);
  const optimizedNewTribes = JSON.parse(JSON.stringify(newTribes));
  
  // Track assignment changes to avoid infinite loops
  const processedAssignments = new Set<string>();
  let improvementsFound = true;
  let iterationCount = 0;
  const MAX_ITERATIONS = 5; // Limit iterations to prevent excessive processing
  
  while (improvementsFound && iterationCount < MAX_ITERATIONS) {
    improvementsFound = false;
    iterationCount++;
    
    // 1. Try to improve existing tribe assignments by swapping users
    if (existingAssignments.size >= 2) {
      const userAssignments = Array.from(optimizedExistingAssignments.entries());
      
      // Check all possible user pairs for potential swaps
      for (let i = 0; i < userAssignments.length; i++) {
        const [userId1, assignment1] = userAssignments[i];
        const user1 = userProfiles.get(userId1);
        const tribe1 = existingTribes.get(assignment1.tribeId);
        
        if (!user1 || !tribe1) continue;
        
        for (let j = i + 1; j < userAssignments.length; j++) {
          const [userId2, assignment2] = userAssignments[j];
          const user2 = userProfiles.get(userId2);
          const tribe2 = existingTribes.get(assignment2.tribeId);
          
          if (!user2 || !tribe2 || assignment1.tribeId === assignment2.tribeId) continue;
          
          // Skip if this pair has already been processed
          const pairKey = `${userId1}:${userId2}`;
          if (processedAssignments.has(pairKey)) continue;
          processedAssignments.add(pairKey);
          
          // Get tribe members for compatibility calculation
          const tribe1Members = tribeMemberProfiles.get(assignment1.tribeId) || [];
          const tribe2Members = tribeMemberProfiles.get(assignment2.tribeId) || [];
          
          // Calculate current compatibility scores
          const currentScore1 = assignment1.compatibilityScore;
          const currentScore2 = assignment2.compatibilityScore;
          const currentTotalScore = currentScore1 + currentScore2;
          
          // Calculate compatibility if users were swapped
          const [swappedScore1, swappedScore2] = await Promise.all([
            compatibilityAlgorithm.calculateTribeCompatibility(
              user1,
              tribe2,
              tribe2Members.filter(m => m.id !== userId2), // Remove user2 from tribe2
              DEFAULT_FACTOR_WEIGHTS,
              false
            ).then(result => result.overallScore),
            
            compatibilityAlgorithm.calculateTribeCompatibility(
              user2,
              tribe1,
              tribe1Members.filter(m => m.id !== userId1), // Remove user1 from tribe1
              DEFAULT_FACTOR_WEIGHTS,
              false
            ).then(result => result.overallScore)
          ]);
          
          const swappedTotalScore = swappedScore1 + swappedScore2;
          
          // If swapping improves overall compatibility, perform the swap
          if (swappedTotalScore > currentTotalScore) {
            optimizedExistingAssignments.set(userId1, {
              tribeId: assignment2.tribeId,
              compatibilityScore: swappedScore1
            });
            
            optimizedExistingAssignments.set(userId2, {
              tribeId: assignment1.tribeId,
              compatibilityScore: swappedScore2
            });
            
            improvementsFound = true;
            break; // Break inner loop after a successful swap
          }
        }
        
        if (improvementsFound) break; // Break outer loop after a successful swap
      }
    }
    
    // 2. Try to improve new tribe formations by swapping members
    if (optimizedNewTribes.length >= 2) {
      // Implement tribe optimization logic here if needed
      // This would involve swapping members between newly formed tribes
      // Similar to the existing tribe optimization above
    }
  }
  
  return {
    existingAssignments: optimizedExistingAssignments,
    newTribes: optimizedNewTribes
  };
}

/**
 * Uses AI to enhance tribe formation with additional insights and optimizations
 * 
 * @param users Array of user profiles
 * @param existingAssignments Map of user assignments to existing tribes
 * @param newTribes Newly formed tribes with member details
 * @returns AI-generated insights and suggested adjustments
 */
export async function enhanceTribeFormationWithAI(
  users: Array<IProfile>,
  existingAssignments: Map<string, {tribeId: string, compatibilityScore: number}>,
  newTribes: Array<{members: Array<{userId: string, compatibilityScore: number}>}>
): Promise<{
  insights: string,
  adjustments: Array<{userId: string, fromTribeId: string, toTribeId: string, reason: string}>
}> {
  try {
    // Initialize OpenRouter client
    const aiClient = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY || ''
    });
    
    // Prepare a simplified representation of users for the prompt
    const userSummaries = users.map(user => ({
      id: user.id,
      name: user.name || `User ${user.id.substring(0, 6)}`,
      personalityTraits: user.personalityTraits.map(trait => `${trait.trait}: ${trait.score}`).join(', '),
      communicationStyle: user.communicationStyle,
      interests: user.interests.map(interest => interest.name).join(', '),
      location: user.location
    }));
    
    // Prepare information about current assignments
    const assignmentDetails = Array.from(existingAssignments.entries()).map(([userId, assignment]) => {
      const user = users.find(u => u.id === userId);
      return {
        userId,
        userName: user?.name || `User ${userId.substring(0, 6)}`,
        tribeId: assignment.tribeId,
        compatibilityScore: assignment.compatibilityScore
      };
    });
    
    // Prepare information about new tribes
    const newTribeDetails = newTribes.map((tribe, index) => ({
      tribeId: `new_tribe_${index + 1}`,
      members: tribe.members.map(member => {
        const user = users.find(u => u.id === member.userId);
        return {
          userId: member.userId,
          userName: user?.name || `User ${member.userId.substring(0, 6)}`,
          compatibilityScore: member.compatibilityScore
        };
      })
    }));
    
    // Construct AI prompt
    const prompt = `
As an AI matchmaking expert, analyze the following tribe formation results and suggest potential improvements:

USERS:
${userSummaries.map(user => 
  `- User ID: ${user.id}
   Name: ${user.name}
   Personality: ${user.personalityTraits}
   Communication: ${user.communicationStyle}
   Interests: ${user.interests}
   Location: ${user.location}`
).join('\n\n')}

EXISTING TRIBE ASSIGNMENTS:
${assignmentDetails.map(assignment => 
  `- User ID: ${assignment.userId} (${assignment.userName})
   Assigned to Tribe: ${assignment.tribeId}
   Compatibility Score: ${assignment.compatibilityScore.toFixed(1)}%`
).join('\n\n')}

NEW TRIBE FORMATIONS:
${newTribeDetails.map(tribe => 
  `- Tribe ID: ${tribe.tribeId}
   Members: ${tribe.members.map(m => `${m.userName} (${m.compatibilityScore.toFixed(1)}%)`).join(', ')}`
).join('\n\n')}

Please analyze these assignments and suggest up to 3 potential improvements to optimize tribe balance and cohesion.
Consider personality compatibility, shared interests, communication styles, and overall group balance.

Provide your response in this format:
INSIGHTS: [Your analysis of the current tribe formations and any patterns you notice]

ADJUSTMENTS:
1. Move [user_id] from [current_tribe_id] to [suggested_tribe_id] - [brief reason]
2. [Additional adjustments if applicable]
3. [Additional adjustments if applicable]
`;

    // Call OpenRouter API
    const response = await aiClient.chat.completions.create({
      model: 'openai/gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 800
    });

    const responseText = response.choices[0]?.message?.content || '';
    
    // Parse AI response
    const insightsMatch = responseText.match(/INSIGHTS:(.*?)(?=ADJUSTMENTS:|$)/s);
    const insights = insightsMatch ? insightsMatch[1].trim() : 'No insights provided.';
    
    const adjustmentsMatch = responseText.match(/ADJUSTMENTS:(.*?)$/s);
    const adjustmentsText = adjustmentsMatch ? adjustmentsMatch[1].trim() : '';
    
    // Parse adjustments
    const adjustments: Array<{userId: string, fromTribeId: string, toTribeId: string, reason: string}> = [];
    
    if (adjustmentsText) {
      const adjustmentLines = adjustmentsText.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of adjustmentLines) {
        // Attempt to parse adjustment in format: "Move [user_id] from [current_tribe_id] to [suggested_tribe_id] - [reason]"
        const adjustmentMatch = line.match(/\d+\.\s*Move\s+([a-zA-Z0-9-_]+)\s+from\s+([a-zA-Z0-9-_]+)\s+to\s+([a-zA-Z0-9-_]+)\s*-\s*(.+)/);
        
        if (adjustmentMatch) {
          const [_, userId, fromTribeId, toTribeId, reason] = adjustmentMatch;
          adjustments.push({
            userId,
            fromTribeId,
            toTribeId,
            reason: reason.trim()
          });
        }
      }
    }
    
    return {
      insights,
      adjustments
    };
  } catch (error) {
    console.error('Error enhancing tribe formation with AI:', error);
    return {
      insights: 'Unable to generate AI insights at this time.',
      adjustments: []
    };
  }
}

/**
 * Implements the core algorithm for forming balanced, compatible tribes based on user profiles
 */
export class TribeFormationAlgorithm {
  private clusteringAlgorithm: ClusteringAlgorithm;
  private compatibilityAlgorithm: CompatibilityAlgorithm;
  private aiClient: OpenRouter;
  private options: TribeFormationOptions;
  
  /**
   * Initializes the tribe formation algorithm with compatibility and clustering algorithms
   * 
   * @param clusteringAlgorithm Algorithm for clustering users into groups
   * @param compatibilityAlgorithm Algorithm for calculating compatibility
   * @param options Configuration options for tribe formation
   */
  constructor(
    clusteringAlgorithm: ClusteringAlgorithm,
    compatibilityAlgorithm: CompatibilityAlgorithm,
    options: TribeFormationOptions = {}
  ) {
    this.clusteringAlgorithm = clusteringAlgorithm;
    this.compatibilityAlgorithm = compatibilityAlgorithm;
    
    // Initialize OpenRouter for AI-enhanced tribe formation
    this.aiClient = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY || ''
    });
    
    // Set default options if not provided
    this.options = {
      minGroupSize: options.minGroupSize || DEFAULT_MIN_GROUP_SIZE,
      maxGroupSize: options.maxGroupSize || DEFAULT_MAX_GROUP_SIZE,
      maxDistance: options.maxDistance || DEFAULT_MAX_DISTANCE,
      compatibilityThreshold: options.compatibilityThreshold || DEFAULT_COMPATIBILITY_THRESHOLD,
      factorWeights: options.factorWeights || DEFAULT_FACTOR_WEIGHTS
    };
    
    // Validate that options meet minimum requirements
    this.validateOptions();
  }
  
  /**
   * Main method to form tribes from a set of users, either by assigning to existing tribes or creating new ones
   * 
   * @param users Array of user profiles to group into tribes
   * @param existingTribes Array of existing tribes
   * @param memberProfiles Map of profiles for existing tribe members
   * @param preferExistingTribes Whether to prioritize assigning to existing tribes
   * @returns Assignments to existing tribes and newly formed tribes
   */
  async formTribes(
    users: Array<IProfile>,
    existingTribes: Array<ITribe>,
    memberProfiles: Map<string, IProfile>,
    preferExistingTribes: boolean = true
  ): Promise<{
    existingAssignments: Map<string, {tribeId: string, compatibilityScore: number}>,
    newTribes: Array<{members: Array<{userId: string, compatibilityScore: number}>}>
  }> {
    if (users.length === 0) {
      return {
        existingAssignments: new Map(),
        newTribes: []
      };
    }
    
    let existingAssignments = new Map<string, {tribeId: string, compatibilityScore: number}>();
    let remainingUsers = [...users];
    
    // If preferExistingTribes is true, first try to assign users to existing tribes
    if (preferExistingTribes && existingTribes.length > 0) {
      const assignmentResult = await this.assignToExistingTribes(users, existingTribes, memberProfiles);
      existingAssignments = assignmentResult.assignments;
      remainingUsers = assignmentResult.remainingUsers;
    }
    
    // Form new tribes with remaining unassigned users
    const newTribes = await this.createNewTribes(remainingUsers);
    
    // Prepare user profiles map for optimization
    const userProfilesMap = new Map<string, IProfile>();
    users.forEach(user => userProfilesMap.set(user.id, user));
    
    // Prepare existing tribes map for optimization
    const existingTribesMap = new Map<string, ITribe>();
    existingTribes.forEach(tribe => existingTribesMap.set(tribe.id, tribe));
    
    // Prepare tribe member profiles map for optimization
    const tribeMemberProfilesMap = new Map<string, Array<IProfile>>();
    for (const tribe of existingTribes) {
      const memberIds = tribe.members.map(member => member.userId);
      const tribeMembers = Array.from(memberProfiles.values())
        .filter(profile => memberIds.includes(profile.id));
      tribeMemberProfilesMap.set(tribe.id, tribeMembers);
    }
    
    // Optimize tribe assignments
    const optimizedResult = await this.optimizeTribeAssignments(
      existingAssignments,
      newTribes,
      userProfilesMap,
      existingTribesMap,
      tribeMemberProfilesMap
    );
    
    // Enhance tribe formation with AI insights if available
    try {
      const aiEnhancement = await this.enhanceWithAI(users, optimizedResult.existingAssignments, optimizedResult.newTribes);
      console.log('AI Enhancements:', aiEnhancement);
      // We could apply AI suggestions here, but for now we'll just log them
    } catch (error) {
      console.error('Error enhancing tribe formation with AI:', error);
    }
    
    return optimizedResult;
  }
  
  /**
   * Assigns users to existing tribes based on compatibility and available capacity
   * 
   * @param users Array of user profiles to assign to tribes
   * @param existingTribes Array of existing tribes
   * @param memberProfiles Map of profiles for existing tribe members
   * @returns User assignments and remaining unassigned users
   */
  async assignToExistingTribes(
    users: Array<IProfile>,
    existingTribes: Array<ITribe>,
    memberProfiles: Map<string, IProfile>
  ): Promise<{
    assignments: Map<string, {tribeId: string, compatibilityScore: number}>,
    remainingUsers: Array<IProfile>
  }> {
    return assignUsersToExistingTribes(
      users,
      existingTribes,
      memberProfiles,
      this.compatibilityAlgorithm,
      this.options
    );
  }
  
  /**
   * Creates new tribes from users who couldn't be matched to existing tribes
   * 
   * @param users Array of user profiles to form into new tribes
   * @returns Newly formed tribes with member details
   */
  async createNewTribes(
    users: Array<IProfile>
  ): Promise<Array<{members: Array<{userId: string, compatibilityScore: number}>}>> {
    return formNewTribes(
      users,
      this.clusteringAlgorithm,
      this.options
    );
  }
  
  /**
   * Optimizes tribe assignments to maximize overall compatibility and balance
   * 
   * @param existingAssignments Map of user assignments to existing tribes
   * @param newTribes Newly formed tribes with member details
   * @param userProfiles Map of user profiles by user ID
   * @param existingTribes Map of existing tribes by tribe ID
   * @param tribeMemberProfiles Map of tribe member profiles by tribe ID
   * @returns Optimized assignments
   */
  async optimizeTribeAssignments(
    existingAssignments: Map<string, {tribeId: string, compatibilityScore: number}>,
    newTribes: Array<{members: Array<{userId: string, compatibilityScore: number}>}>,
    userProfiles: Map<string, IProfile>,
    existingTribes: Map<string, ITribe>,
    tribeMemberProfiles: Map<string, Array<IProfile>>
  ): Promise<{
    existingAssignments: Map<string, {tribeId: string, compatibilityScore: number}>,
    newTribes: Array<{members: Array<{userId: string, compatibilityScore: number}>}>
  }> {
    return optimizeTribes(
      existingAssignments,
      newTribes,
      userProfiles,
      existingTribes,
      tribeMemberProfiles,
      this.compatibilityAlgorithm
    );
  }
  
  /**
   * Updates the algorithm parameters with new options
   * 
   * @param options New configuration options
   */
  setOptions(options: TribeFormationOptions): void {
    if (options.minGroupSize !== undefined) {
      this.options.minGroupSize = options.minGroupSize;
    }
    
    if (options.maxGroupSize !== undefined) {
      this.options.maxGroupSize = options.maxGroupSize;
    }
    
    if (options.maxDistance !== undefined) {
      this.options.maxDistance = options.maxDistance;
    }
    
    if (options.compatibilityThreshold !== undefined) {
      this.options.compatibilityThreshold = options.compatibilityThreshold;
    }
    
    if (options.factorWeights !== undefined) {
      this.options.factorWeights = options.factorWeights;
    }
    
    // Validate updated options
    this.validateOptions();
    
    // Update clustering algorithm options
    this.clusteringAlgorithm.setOptions({
      minGroupSize: this.options.minGroupSize,
      maxGroupSize: this.options.maxGroupSize,
      maxDistance: this.options.maxDistance,
      compatibilityThreshold: this.options.compatibilityThreshold,
      factorWeights: this.options.factorWeights
    });
  }
  
  /**
   * Uses AI to enhance tribe formation with additional insights
   * 
   * @param users Array of user profiles
   * @param existingAssignments Map of user assignments to existing tribes
   * @param newTribes Newly formed tribes with member details
   * @returns AI-generated insights and suggested adjustments
   */
  async enhanceWithAI(
    users: Array<IProfile>,
    existingAssignments: Map<string, {tribeId: string, compatibilityScore: number}>,
    newTribes: Array<{members: Array<{userId: string, compatibilityScore: number}>}>
  ): Promise<{
    insights: string,
    adjustments: Array<{userId: string, fromTribeId: string, toTribeId: string, reason: string}>
  }> {
    return enhanceTribeFormationWithAI(
      users,
      existingAssignments,
      newTribes
    );
  }
  
  /**
   * Validates that configuration options meet minimum requirements
   * @private
   */
  private validateOptions(): void {
    // Ensure minimum group size is at least TRIBE_LIMITS.MIN_MEMBERS
    if (this.options.minGroupSize! < TRIBE_LIMITS.MIN_MEMBERS) {
      this.options.minGroupSize = TRIBE_LIMITS.MIN_MEMBERS;
    }
    
    // Ensure maximum group size is at most TRIBE_LIMITS.MAX_MEMBERS
    if (this.options.maxGroupSize! > TRIBE_LIMITS.MAX_MEMBERS) {
      this.options.maxGroupSize = TRIBE_LIMITS.MAX_MEMBERS;
    }
    
    // Ensure minimum is less than or equal to maximum
    if (this.options.minGroupSize! > this.options.maxGroupSize!) {
      this.options.minGroupSize = this.options.maxGroupSize;
    }
    
    // Ensure compatibility threshold is between 0 and 1
    if (this.options.compatibilityThreshold! < 0 || this.options.compatibilityThreshold! > 1) {
      this.options.compatibilityThreshold = DEFAULT_COMPATIBILITY_THRESHOLD;
    }
    
    // Ensure factor weights are present for all compatibility factors
    if (this.options.factorWeights) {
      const factors = Object.values(CompatibilityFactor);
      for (const factor of factors) {
        if (this.options.factorWeights[factor] === undefined) {
          this.options.factorWeights[factor] = DEFAULT_FACTOR_WEIGHTS[factor];
        }
      }
    }
  }
}