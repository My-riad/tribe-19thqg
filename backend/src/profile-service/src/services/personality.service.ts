import prisma from '../../../config/database';
import { 
  IPersonalityTrait, 
  IPersonalityAssessment, 
  PersonalityTrait, 
  CommunicationStyle 
} from '../../../shared/src/types/profile.types';
import { DatabaseError } from '../../../shared/src/errors/database.error';
import { validateId } from '../../../shared/src/validation/common.validation';
import { logger } from '../../../config/logging';
import { updateProfile } from './profile.service';
import NodeCache from 'node-cache'; // ^5.1.2

// Time to live for compatibility cache in milliseconds (30 minutes)
const COMPATIBILITY_CACHE_TTL = 30 * 60 * 1000;

/**
 * Creates a new personality trait record for a user profile
 * 
 * @param traitData - Personality trait data
 * @returns The created personality trait record
 * @throws DatabaseError if creation fails
 */
export async function createPersonalityTrait(traitData: IPersonalityTrait): Promise<IPersonalityTrait> {
  try {
    logger.info('Creating personality trait', { profileId: traitData.profileId, trait: traitData.trait });
    
    const trait = await prisma.prisma.personalityTrait.create({
      data: {
        profileId: traitData.profileId,
        trait: traitData.trait,
        score: traitData.score,
        assessedAt: traitData.assessedAt || new Date()
      }
    });
    
    return trait;
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'create personality trait' });
  }
}

/**
 * Retrieves a personality trait by its ID
 * 
 * @param id - Personality trait ID
 * @returns The personality trait if found, null otherwise
 * @throws DatabaseError if retrieval fails
 */
export async function getPersonalityTraitById(id: string): Promise<IPersonalityTrait | null> {
  try {
    validateId(id);
    
    const trait = await prisma.prisma.personalityTrait.findUnique({
      where: { id }
    });
    
    return trait;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'get personality trait by id' });
  }
}

/**
 * Retrieves all personality traits for a specific profile
 * 
 * @param profileId - Profile ID
 * @returns Array of personality traits for the profile
 * @throws DatabaseError if retrieval fails
 */
export async function getPersonalityTraitsByProfileId(profileId: string): Promise<IPersonalityTrait[]> {
  try {
    validateId(profileId);
    
    const traits = await prisma.prisma.personalityTrait.findMany({
      where: { profileId }
    });
    
    return traits;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'get personality traits by profile id' });
  }
}

/**
 * Updates an existing personality trait record
 * 
 * @param id - Personality trait ID
 * @param updates - Updated trait data
 * @returns The updated personality trait record
 * @throws DatabaseError if update fails
 */
export async function updatePersonalityTrait(id: string, updates: Partial<IPersonalityTrait>): Promise<IPersonalityTrait> {
  try {
    validateId(id);
    logger.info('Updating personality trait', { id, updates });
    
    const trait = await prisma.prisma.personalityTrait.update({
      where: { id },
      data: {
        trait: updates.trait,
        score: updates.score,
        assessedAt: updates.assessedAt || new Date()
      }
    });
    
    if (!trait) {
      throw DatabaseError.notFoundError('Personality Trait');
    }
    
    return trait;
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'update personality trait' });
  }
}

/**
 * Deletes a personality trait record
 * 
 * @param id - Personality trait ID
 * @returns True if deletion was successful
 * @throws DatabaseError if deletion fails
 */
export async function deletePersonalityTrait(id: string): Promise<boolean> {
  try {
    validateId(id);
    logger.info('Deleting personality trait', { id });
    
    const trait = await prisma.prisma.personalityTrait.delete({
      where: { id }
    });
    
    if (!trait) {
      throw DatabaseError.notFoundError('Personality Trait');
    }
    
    return true;
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'delete personality trait' });
  }
}

/**
 * Updates a profile's communication style based on personality assessment
 * 
 * @param profileId - Profile ID
 * @param communicationStyle - New communication style
 * @returns True if update was successful
 * @throws DatabaseError if update fails
 */
export async function updateCommunicationStyle(
  profileId: string, 
  communicationStyle: CommunicationStyle
): Promise<boolean> {
  try {
    validateId(profileId);
    logger.info('Updating communication style', { profileId, communicationStyle });
    
    await updateProfile(profileId, { communicationStyle });
    
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Processes and stores a complete personality assessment for a user profile
 * 
 * @param assessment - Personality assessment data
 * @returns Array of created/updated personality traits
 * @throws DatabaseError if processing fails
 */
export async function submitPersonalityAssessment(
  assessment: IPersonalityAssessment
): Promise<IPersonalityTrait[]> {
  const { profileId, traits, communicationStyle } = assessment;

  try {
    // Validate the assessment data
    validateId(profileId);
    if (!traits || !traits.length) {
      throw new Error('Personality traits are required');
    }

    logger.info('Submitting personality assessment', { profileId, traitCount: traits.length });

    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.prisma.$transaction(async (tx) => {
      // Delete existing personality traits for the profile
      await tx.personalityTrait.deleteMany({
        where: { profileId }
      });

      // Create new traits
      const createdTraits: IPersonalityTrait[] = [];
      
      for (const traitData of traits) {
        const trait = await tx.personalityTrait.create({
          data: {
            profileId,
            trait: traitData.trait,
            score: traitData.score,
            assessedAt: new Date()
          }
        });
        
        createdTraits.push(trait);
      }

      // Update communication style if provided
      if (communicationStyle) {
        await updateCommunicationStyle(profileId, communicationStyle);
      }

      return createdTraits;
    });

    // Clear any cached compatibility results for this profile
    clearCompatibilityCache(profileId);

    return result;
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'submit personality assessment' });
  }
}

/**
 * Calculates personality compatibility between two profiles
 * 
 * @param profileId1 - First profile ID
 * @param profileId2 - Second profile ID
 * @returns Compatibility score between 0 and 1
 * @throws DatabaseError if calculation fails
 */
export async function getPersonalityCompatibility(
  profileId1: string, 
  profileId2: string
): Promise<number> {
  try {
    // Check for cached result
    const cacheKey = `compatibility:${profileId1}:${profileId2}`;
    const reverseCacheKey = `compatibility:${profileId2}:${profileId1}`;
    
    const compatibilityCache = new NodeCache({ stdTTL: COMPATIBILITY_CACHE_TTL / 1000 });
    const cachedResult = compatibilityCache.get<number>(cacheKey) || compatibilityCache.get<number>(reverseCacheKey);
    
    if (cachedResult !== undefined) {
      return cachedResult;
    }
    
    // Validate the profile IDs
    validateId(profileId1);
    validateId(profileId2);

    // Get traits for both profiles
    const profile1Traits = await getPersonalityTraitsByProfileId(profileId1);
    const profile2Traits = await getPersonalityTraitsByProfileId(profileId2);

    if (!profile1Traits.length || !profile2Traits.length) {
      return 0; // Can't calculate compatibility without traits
    }

    // Create trait maps for easier access
    const profile1TraitMap = new Map(
      profile1Traits.map(trait => [trait.trait, trait.score])
    );
    
    const profile2TraitMap = new Map(
      profile2Traits.map(trait => [trait.trait, trait.score])
    );

    // Calculate trait similarity
    let totalDifference = 0;
    let traitCount = 0;

    // Combine all unique traits from both profiles
    const allTraits = new Set([
      ...profile1Traits.map(t => t.trait),
      ...profile2Traits.map(t => t.trait)
    ]);

    // Calculate differences for each trait
    for (const trait of allTraits) {
      const score1 = profile1TraitMap.get(trait) || 0;
      const score2 = profile2TraitMap.get(trait) || 0;
      
      // Calculate normalized difference (0-1 scale)
      const difference = Math.abs(score1 - score2) / 100;
      totalDifference += difference;
      traitCount++;
    }

    // Get communication styles for both profiles
    const [profile1, profile2] = await Promise.all([
      prisma.prisma.profile.findUnique({
        where: { id: profileId1 },
        select: { communicationStyle: true }
      }),
      prisma.prisma.profile.findUnique({
        where: { id: profileId2 },
        select: { communicationStyle: true }
      })
    ]);

    // Add communication style compatibility
    let communicationCompatibility = 0.5; // Default: neutral
    
    if (profile1?.communicationStyle && profile2?.communicationStyle) {
      if (profile1.communicationStyle === profile2.communicationStyle) {
        communicationCompatibility = 1.0; // Perfect match
      } else {
        // This could be enhanced with a more sophisticated compatibility matrix
        communicationCompatibility = 0.3; // Different styles
      }
    }

    // Calculate average trait difference
    const avgTraitDifference = traitCount > 0 ? totalDifference / traitCount : 1;
    
    // Calculate trait similarity (invert difference)
    const traitSimilarity = 1 - avgTraitDifference;
    
    // Combine trait similarity and communication compatibility
    // Weighted 70% traits, 30% communication style
    const overallCompatibility = (traitSimilarity * 0.7) + (communicationCompatibility * 0.3);
    
    // Round to 2 decimal places and ensure it's between 0 and 1
    const finalScore = Math.max(0, Math.min(1, Math.round(overallCompatibility * 100) / 100));
    
    // Cache the result
    compatibilityCache.set(cacheKey, finalScore);
    
    return finalScore;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'calculate compatibility' });
  }
}

/**
 * Analyzes personality traits to determine dominant characteristics
 * 
 * @param traits - Array of personality traits
 * @returns Analysis of personality traits with dominant characteristics
 */
export function analyzePersonalityTraits(traits: IPersonalityTrait[]): object {
  // Group traits by categories (using OCEAN model)
  const traitCategories = {
    openness: ['openness', 'creativity', 'curiosity'],
    conscientiousness: ['conscientiousness'],
    extraversion: ['extraversion', 'sociability', 'assertiveness'],
    agreeableness: ['agreeableness'],
    neuroticism: ['neuroticism']
  };
  
  // Initialize category scores
  const categoryScores: Record<string, { total: number, count: number, average: number }> = {};
  for (const category in traitCategories) {
    categoryScores[category] = { total: 0, count: 0, average: 0 };
  }
  
  // Calculate scores for each category
  for (const trait of traits) {
    for (const [category, traitList] of Object.entries(traitCategories)) {
      if (traitList.includes(trait.trait)) {
        categoryScores[category].total += trait.score;
        categoryScores[category].count++;
      }
    }
  }
  
  // Calculate averages
  for (const category in categoryScores) {
    const { total, count } = categoryScores[category];
    categoryScores[category].average = count > 0 ? total / count : 0;
  }
  
  // Determine dominant traits (highest scoring)
  const dominantTraits = Object.entries(categoryScores)
    .filter(([_, data]) => data.count > 0)
    .sort((a, b) => b[1].average - a[1].average)
    .slice(0, 3)
    .map(([category, _]) => category);
  
  // Determine personality type based on dominant traits
  let personalityType = '';
  if (dominantTraits.includes('openness') && dominantTraits.includes('extraversion')) {
    personalityType = 'Explorer';
  } else if (dominantTraits.includes('conscientiousness') && dominantTraits.includes('neuroticism')) {
    personalityType = 'Analyst';
  } else if (dominantTraits.includes('agreeableness') && dominantTraits.includes('extraversion')) {
    personalityType = 'Diplomat';
  } else if (dominantTraits.includes('conscientiousness') && dominantTraits.includes('agreeableness')) {
    personalityType = 'Sentinel';
  } else {
    personalityType = 'Balanced';
  }
  
  return {
    categoryScores,
    dominantTraits,
    personalityType
  };
}

/**
 * Predicts the most suitable communication style based on personality traits
 * 
 * @param traits - Array of personality traits
 * @returns The predicted communication style
 */
export function predictCommunicationStyle(traits: IPersonalityTrait[]): CommunicationStyle {
  // Use the personality trait analysis
  const analysis = analyzePersonalityTraits(traits) as any;
  
  // Create a mapping from dominant traits to communication styles
  const traitToStyleMap: Record<string, CommunicationStyle> = {
    openness: CommunicationStyle.EXPRESSIVE,
    conscientiousness: CommunicationStyle.ANALYTICAL,
    extraversion: CommunicationStyle.DIRECT,
    agreeableness: CommunicationStyle.SUPPORTIVE,
    neuroticism: CommunicationStyle.THOUGHTFUL
  };
  
  // Check if we have a clear dominant trait
  if (analysis.dominantTraits.length > 0) {
    const dominantTrait = analysis.dominantTraits[0];
    return traitToStyleMap[dominantTrait] || CommunicationStyle.DIRECT;
  }
  
  // Default to DIRECT if no clear pattern
  return CommunicationStyle.DIRECT;
}

/**
 * Clears cached compatibility results for a profile
 * 
 * @param profileId - Profile ID
 */
export function clearCompatibilityCache(profileId: string): void {
  const compatibilityCache = new NodeCache({ stdTTL: COMPATIBILITY_CACHE_TTL / 1000 });
  
  // Get all keys
  const keys = compatibilityCache.keys();
  
  // Filter for keys containing the profile ID
  const keysToDelete = keys.filter(key => 
    key.startsWith(`compatibility:${profileId}:`) || 
    key.includes(`:${profileId}`)
  );
  
  // Delete these keys
  compatibilityCache.del(keysToDelete);
  
  logger.info('Cleared compatibility cache', { profileId, keyCount: keysToDelete.length });
}

/**
 * Service class that provides business logic for personality trait management
 */
export class PersonalityService {
  private compatibilityCache: NodeCache;
  
  /**
   * Initializes the PersonalityService
   */
  constructor() {
    // Initialize cache with TTL in seconds
    this.compatibilityCache = new NodeCache({ stdTTL: COMPATIBILITY_CACHE_TTL / 1000 });
  }
  
  /**
   * Creates a new personality trait
   * 
   * @param traitData - The personality trait data
   * @returns The created personality trait
   */
  async createTrait(traitData: IPersonalityTrait): Promise<IPersonalityTrait> {
    return createPersonalityTrait(traitData);
  }
  
  /**
   * Gets a personality trait by ID
   * 
   * @param id - The trait ID
   * @returns The personality trait if found
   */
  async getById(id: string): Promise<IPersonalityTrait | null> {
    return getPersonalityTraitById(id);
  }
  
  /**
   * Gets all personality traits for a profile
   * 
   * @param profileId - The profile ID
   * @returns Array of personality traits
   */
  async getByProfileId(profileId: string): Promise<IPersonalityTrait[]> {
    return getPersonalityTraitsByProfileId(profileId);
  }
  
  /**
   * Updates a personality trait
   * 
   * @param id - The trait ID
   * @param updates - The updated trait data
   * @returns The updated personality trait
   */
  async update(id: string, updates: Partial<IPersonalityTrait>): Promise<IPersonalityTrait> {
    return updatePersonalityTrait(id, updates);
  }
  
  /**
   * Deletes a personality trait
   * 
   * @param id - The trait ID
   * @returns True if deletion was successful
   */
  async delete(id: string): Promise<boolean> {
    return deletePersonalityTrait(id);
  }
  
  /**
   * Updates a profile's communication style
   * 
   * @param profileId - The profile ID
   * @param style - The communication style
   * @returns True if update was successful
   */
  async updateCommunicationStyle(profileId: string, style: CommunicationStyle): Promise<boolean> {
    return updateCommunicationStyle(profileId, style);
  }
  
  /**
   * Submits a complete personality assessment
   * 
   * @param assessment - The assessment data
   * @returns Array of created personality traits
   */
  async submitAssessment(assessment: IPersonalityAssessment): Promise<IPersonalityTrait[]> {
    return submitPersonalityAssessment(assessment);
  }
  
  /**
   * Gets personality compatibility between profiles
   * 
   * @param profileId1 - First profile ID
   * @param profileId2 - Second profile ID
   * @returns Compatibility score
   */
  async getCompatibility(profileId1: string, profileId2: string): Promise<number> {
    return getPersonalityCompatibility(profileId1, profileId2);
  }
  
  /**
   * Analyzes personality traits
   * 
   * @param traits - Array of personality traits
   * @returns Trait analysis
   */
  analyzeTraits(traits: IPersonalityTrait[]): object {
    return analyzePersonalityTraits(traits);
  }
  
  /**
   * Predicts communication style from traits
   * 
   * @param traits - Array of personality traits
   * @returns Predicted communication style
   */
  predictCommunicationStyle(traits: IPersonalityTrait[]): CommunicationStyle {
    return predictCommunicationStyle(traits);
  }
  
  /**
   * Clears compatibility cache for a profile
   * 
   * @param profileId - The profile ID
   */
  clearCompatibilityCache(profileId: string): void {
    clearCompatibilityCache(profileId);
  }
}