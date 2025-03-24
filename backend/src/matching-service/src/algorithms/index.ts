/**
 * Algorithms Index
 * 
 * This file exports all algorithm implementations for the Tribe platform's AI-powered matchmaking
 * functionality. The algorithms include:
 * 
 * 1. Clustering Algorithm - Groups users based on compatibility and proximity
 * 2. Compatibility Algorithm - Calculates how compatible users are with each other and with tribes
 * 3. Tribe Formation Algorithm - Assigns users to existing tribes or forms new tribes
 * 
 * These algorithms form the core of Tribe's intelligent matchmaking system that creates
 * balanced, compatible tribes of 4-8 members.
 */

// Export from clustering.algorithm.ts
export {
  ClusteringAlgorithm,
  ICompatibilityAlgorithm,
  ClusteringOptions,
  calculateHaversineDistance,
  calculateJaccardSimilarity
} from './clustering.algorithm';

// Export from compatibility.algorithm.ts
export {
  CompatibilityAlgorithm,
  calculatePersonalityCompatibility,
  calculateInterestCompatibility,
  calculateCommunicationCompatibility,
  calculateLocationCompatibility,
  calculateGroupBalanceImpact,
  normalizeFactorWeights
} from './compatibility.algorithm';

// Export from tribe-formation.algorithm.ts
export {
  TribeFormationAlgorithm,
  TribeFormationOptions,
  assignUsersToExistingTribes,
  formNewTribes,
  optimizeTribes
} from './tribe-formation.algorithm';