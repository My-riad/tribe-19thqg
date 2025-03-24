/**
 * Personality Model
 * 
 * Defines the Personality model for the profile service, representing user personality traits
 * with their scores and assessment timestamps. This model provides methods for CRUD operations
 * on personality traits and supports the AI-powered matchmaking system by providing personality
 * data for compatibility calculations.
 */

import prisma from '../../../config/database';
import { 
  IPersonalityTrait, 
  IPersonalityAssessment, 
  PersonalityTrait, 
  CommunicationStyle 
} from '../../../shared/src/types/profile.types';
import { DatabaseError } from '../../../shared/src/errors/database.error';
import { validateId } from '../../../shared/src/validation/common.validation';

/**
 * Class representing the personality model with database operations
 */
export class PersonalityModel {
  private prisma;

  /**
   * Initializes the PersonalityModel
   */
  constructor() {
    this.prisma = prisma.prisma; // Access the Prisma client instance
  }

  /**
   * Creates a new personality trait
   * 
   * @param data - Personality trait data
   * @returns The created personality trait
   * @throws DatabaseError if creation fails
   */
  async create(data: IPersonalityTrait): Promise<IPersonalityTrait> {
    try {
      // Validate the trait data
      if (!data.profileId || !data.trait || data.score === undefined) {
        throw new Error('Missing required personality trait fields');
      }

      // Create the personality trait
      const trait = await this.prisma.personalityTrait.create({
        data: {
          profileId: data.profileId,
          trait: data.trait,
          score: data.score,
          assessedAt: data.assessedAt || new Date()
        }
      });

      return trait;
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'create personality trait' });
    }
  }

  /**
   * Retrieves a personality trait by ID
   * 
   * @param id - Personality trait ID
   * @returns The personality trait if found, null otherwise
   * @throws DatabaseError if retrieval fails
   */
  async getById(id: string): Promise<IPersonalityTrait | null> {
    try {
      // Validate the ID
      validateId(id);

      // Query the database
      const trait = await this.prisma.personalityTrait.findUnique({
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
   * Retrieves all personality traits for a profile
   * 
   * @param profileId - Profile ID
   * @returns Array of personality traits
   * @throws DatabaseError if retrieval fails
   */
  async getByProfileId(profileId: string): Promise<IPersonalityTrait[]> {
    try {
      // Validate the profile ID
      validateId(profileId);

      // Query the database
      const traits = await this.prisma.personalityTrait.findMany({
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
   * Updates a personality trait
   * 
   * @param id - Personality trait ID
   * @param data - Updated trait data
   * @returns The updated personality trait
   * @throws DatabaseError if update fails
   */
  async update(id: string, data: Partial<IPersonalityTrait>): Promise<IPersonalityTrait> {
    try {
      // Validate the ID
      validateId(id);

      // Update the trait
      const updatedTrait = await this.prisma.personalityTrait.update({
        where: { id },
        data: {
          trait: data.trait,
          score: data.score,
          assessedAt: data.assessedAt || new Date()
        }
      });

      return updatedTrait;
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'update personality trait' });
    }
  }

  /**
   * Deletes a personality trait
   * 
   * @param id - Personality trait ID
   * @returns True if deletion was successful
   * @throws DatabaseError if deletion fails
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Validate the ID
      validateId(id);

      // Delete the trait
      await this.prisma.personalityTrait.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'delete personality trait' });
    }
  }

  /**
   * Updates a profile's communication style
   * 
   * @param profileId - Profile ID
   * @param communicationStyle - New communication style
   * @returns True if update was successful
   * @throws DatabaseError if update fails
   */
  async updateCommunicationStyle(profileId: string, communicationStyle: CommunicationStyle): Promise<boolean> {
    try {
      // Validate the profile ID
      validateId(profileId);

      // Update the profile's communication style
      await this.prisma.profile.update({
        where: { id: profileId },
        data: { communicationStyle }
      });

      return true;
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'update communication style' });
    }
  }

  /**
   * Processes a complete personality assessment
   * 
   * @param assessment - Personality assessment data
   * @returns Array of created personality traits
   * @throws DatabaseError if processing fails
   */
  async submitAssessment(assessment: IPersonalityAssessment): Promise<IPersonalityTrait[]> {
    const { profileId, traits, communicationStyle } = assessment;

    try {
      // Validate the assessment data
      validateId(profileId);
      if (!traits || !traits.length) {
        throw new Error('Personality traits are required');
      }

      // Use a transaction to ensure all operations succeed or fail together
      const result = await this.prisma.$transaction(async (tx) => {
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
          await tx.profile.update({
            where: { id: profileId },
            data: { communicationStyle }
          });
        }

        return createdTraits;
      });

      return result;
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'submit personality assessment' });
    }
  }

  /**
   * Calculates personality compatibility between profiles
   * 
   * @param profileId1 - First profile ID
   * @param profileId2 - Second profile ID
   * @returns Compatibility score between 0 and 1
   * @throws DatabaseError if calculation fails
   */
  async calculateCompatibility(profileId1: string, profileId2: string): Promise<number> {
    try {
      // Validate the profile IDs
      validateId(profileId1);
      validateId(profileId2);

      // Get traits for both profiles
      const profile1Traits = await this.getByProfileId(profileId1);
      const profile2Traits = await this.getByProfileId(profileId2);

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
        this.prisma.profile.findUnique({
          where: { id: profileId1 },
          select: { communicationStyle: true }
        }),
        this.prisma.profile.findUnique({
          where: { id: profileId2 },
          select: { communicationStyle: true }
        })
      ]);

      // Add communication style compatibility
      // Simple version: same style = perfect match, different style = partial match
      let communicationCompatibility = 0.5; // Default: neutral
      
      if (profile1?.communicationStyle && profile2?.communicationStyle) {
        if (profile1.communicationStyle === profile2.communicationStyle) {
          communicationCompatibility = 1.0; // Perfect match
        } else {
          // This could be enhanced with a more sophisticated compatibility matrix
          // between different communication styles
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
      
      return Math.round(overallCompatibility * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'calculate compatibility' });
    }
  }
}

/**
 * Creates a new personality trait record for a user profile
 * 
 * @param traitData - Personality trait data
 * @returns The created personality trait record
 * @throws DatabaseError if creation fails
 */
export async function createPersonalityTrait(traitData: IPersonalityTrait): Promise<IPersonalityTrait> {
  try {
    // Validate the trait data
    if (!traitData.profileId || !traitData.trait || traitData.score === undefined) {
      throw new Error('Missing required personality trait fields');
    }

    // Create the personality trait
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
    // Validate the ID
    validateId(id);

    // Query the database
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
    // Validate the profile ID
    validateId(profileId);

    // Query the database
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
    // Validate the ID
    validateId(id);

    // Update the trait
    const updatedTrait = await prisma.prisma.personalityTrait.update({
      where: { id },
      data: {
        trait: updates.trait,
        score: updates.score,
        assessedAt: updates.assessedAt || new Date()
      }
    });

    return updatedTrait;
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
    // Validate the ID
    validateId(id);

    // Delete the trait
    await prisma.prisma.personalityTrait.delete({
      where: { id }
    });

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
    // Validate the profile ID
    validateId(profileId);

    // Update the profile's communication style
    await prisma.prisma.profile.update({
      where: { id: profileId },
      data: { communicationStyle }
    });

    return true;
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'update communication style' });
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
        await tx.profile.update({
          where: { id: profileId },
          data: { communicationStyle }
        });
      }

      return createdTraits;
    });

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
    
    return Math.round(overallCompatibility * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'calculate compatibility' });
  }
}