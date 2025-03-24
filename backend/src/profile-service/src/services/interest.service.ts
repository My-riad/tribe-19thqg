import database from '../../../config/database';
import { IInterest, IInterestSubmission, InterestCategory, InterestLevel } from '../../../shared/src/types/profile.types';
import { DatabaseError } from '../../../shared/src/errors/database.error';
import { validateObject } from '../../../shared/src/utils/validation.util';
import { interestSchema } from '../validations/interest.validation';

// Get the prisma client from the database module
const { prisma } = database;

/**
 * Creates a new interest record for a user profile
 * 
 * @param interestData - The interest data to create
 * @returns Promise resolving to the created interest
 */
export const createInterest = async (interestData: IInterest): Promise<IInterest> => {
  try {
    // Validate the interest data
    const validatedData = validateObject(interestData, interestSchema);
    
    // Create the interest record
    const interest = await prisma.interest.create({
      data: validatedData
    });
    
    return interest as IInterest;
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error);
  }
};

/**
 * Retrieves an interest by its ID
 * 
 * @param id - The ID of the interest to retrieve
 * @returns Promise resolving to the interest if found, null otherwise
 */
export const getInterestById = async (id: string): Promise<IInterest | null> => {
  try {
    const interest = await prisma.interest.findUnique({
      where: { id }
    });
    
    return interest as IInterest | null;
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error);
  }
};

/**
 * Retrieves all interests for a specific profile
 * 
 * @param profileId - The ID of the profile
 * @returns Promise resolving to an array of interests
 */
export const getInterestsByProfileId = async (profileId: string): Promise<IInterest[]> => {
  try {
    const interests = await prisma.interest.findMany({
      where: { profileId }
    });
    
    return interests as IInterest[];
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error);
  }
};

/**
 * Updates an existing interest record
 * 
 * @param id - The ID of the interest to update
 * @param updates - The updates to apply
 * @returns Promise resolving to the updated interest
 */
export const updateInterest = async (id: string, updates: Partial<IInterest>): Promise<IInterest> => {
  try {
    // Check if the interest exists
    const existingInterest = await getInterestById(id);
    if (!existingInterest) {
      throw DatabaseError.notFoundError('Interest');
    }
    
    // Merge existing data with updates for validation
    const mergedData = { ...existingInterest, ...updates };
    
    // Validate the merged data
    validateObject(mergedData, interestSchema);
    
    // Update only the fields that were provided in updates
    const updatedInterest = await prisma.interest.update({
      where: { id },
      data: updates
    });
    
    return updatedInterest as IInterest;
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error);
  }
};

/**
 * Deletes an interest record
 * 
 * @param id - The ID of the interest to delete
 * @returns Promise resolving to true if deletion was successful
 */
export const deleteInterest = async (id: string): Promise<boolean> => {
  try {
    // Check if the interest exists
    const existingInterest = await getInterestById(id);
    if (!existingInterest) {
      throw DatabaseError.notFoundError('Interest');
    }
    
    // Delete the interest record
    await prisma.interest.delete({
      where: { id }
    });
    
    return true;
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error);
  }
};

/**
 * Processes and stores a batch of interests for a user profile
 * 
 * @param submission - The interest submission data
 * @returns Promise resolving to an array of created interests
 */
export const submitInterests = async (submission: IInterestSubmission): Promise<IInterest[]> => {
  try {
    const { profileId, interests, replaceExisting } = submission;
    
    // Start a transaction
    return await prisma.$transaction(async (tx) => {
      // If replaceExisting is true, delete existing interests for the profile
      if (replaceExisting) {
        await tx.interest.deleteMany({
          where: { profileId }
        });
      }
      
      // Create new interest records
      const createdInterests: IInterest[] = [];
      
      for (const interest of interests) {
        const createdInterest = await tx.interest.create({
          data: {
            profileId,
            category: interest.category,
            name: interest.name,
            level: interest.level
          }
        });
        
        createdInterests.push(createdInterest as IInterest);
      }
      
      return createdInterests;
    });
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error);
  }
};

/**
 * Calculates interest compatibility between two profiles
 * 
 * @param profileId1 - The ID of the first profile
 * @param profileId2 - The ID of the second profile
 * @returns Promise resolving to a compatibility score between 0 and 1
 */
export const getInterestCompatibility = async (profileId1: string, profileId2: string): Promise<number> => {
  try {
    // Get interests for both profiles
    const profile1Interests = await getInterestsByProfileId(profileId1);
    const profile2Interests = await getInterestsByProfileId(profileId2);
    
    // If either profile has no interests, return 0 compatibility
    if (profile1Interests.length === 0 || profile2Interests.length === 0) {
      return 0;
    }
    
    // Count matching interests by category and apply weighting based on interest level
    let matchScore = 0;
    let totalPossibleScore = 0;
    
    // Create a map of categories to interest levels for profile 2
    const profile2InterestMap = new Map<InterestCategory, number[]>();
    profile2Interests.forEach(interest => {
      const levels = profile2InterestMap.get(interest.category) || [];
      levels.push(interest.level);
      profile2InterestMap.set(interest.category, levels);
    });
    
    // For each interest in profile 1, check for matches in profile 2
    profile1Interests.forEach(interest1 => {
      const category = interest1.category;
      const level1 = interest1.level;
      
      // Add to total possible score based on interest level
      totalPossibleScore += level1;
      
      // Check if profile 2 has matching category
      const matchingLevels = profile2InterestMap.get(category);
      if (matchingLevels && matchingLevels.length > 0) {
        // Find the highest matching level
        const highestMatchLevel = Math.max(...matchingLevels);
        
        // Calculate match score based on both interest levels
        // The higher the interest level on both sides, the higher the match score
        matchScore += Math.min(level1, highestMatchLevel);
      }
    });
    
    // Add score from profile 2's unique categories
    profile2Interests.forEach(interest2 => {
      const category = interest2.category;
      const level2 = interest2.level;
      
      // Check if we already counted this category from profile 1
      const profile1HasCategory = profile1Interests.some(i => i.category === category);
      
      if (!profile1HasCategory) {
        totalPossibleScore += level2;
      }
    });
    
    // Calculate final compatibility score (normalized between 0 and 1)
    if (totalPossibleScore === 0) {
      return 0;
    }
    
    return matchScore / totalPossibleScore;
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error);
  }
};

/**
 * Service class for managing user interests and calculating interest compatibility
 */
export class InterestService {
  /**
   * Creates a new interest
   * 
   * @param interestData - The interest data to create
   * @returns Promise resolving to the created interest
   */
  async create(interestData: IInterest): Promise<IInterest> {
    return createInterest(interestData);
  }
  
  /**
   * Retrieves an interest by ID
   * 
   * @param id - The ID of the interest to retrieve
   * @returns Promise resolving to the interest if found, null otherwise
   */
  async getById(id: string): Promise<IInterest | null> {
    return getInterestById(id);
  }
  
  /**
   * Retrieves all interests for a profile
   * 
   * @param profileId - The ID of the profile
   * @returns Promise resolving to an array of interests
   */
  async getByProfileId(profileId: string): Promise<IInterest[]> {
    return getInterestsByProfileId(profileId);
  }
  
  /**
   * Updates an interest
   * 
   * @param id - The ID of the interest to update
   * @param updates - The updates to apply
   * @returns Promise resolving to the updated interest
   */
  async update(id: string, updates: Partial<IInterest>): Promise<IInterest> {
    return updateInterest(id, updates);
  }
  
  /**
   * Deletes an interest
   * 
   * @param id - The ID of the interest to delete
   * @returns Promise resolving to true if deletion was successful
   */
  async delete(id: string): Promise<boolean> {
    return deleteInterest(id);
  }
  
  /**
   * Processes a batch of interests
   * 
   * @param submission - The interest submission data
   * @returns Promise resolving to an array of created interests
   */
  async submitBatch(submission: IInterestSubmission): Promise<IInterest[]> {
    return submitInterests(submission);
  }
  
  /**
   * Calculates interest compatibility between profiles
   * 
   * @param profileId1 - The ID of the first profile
   * @param profileId2 - The ID of the second profile
   * @returns Promise resolving to a compatibility score between 0 and 1
   */
  async calculateCompatibility(profileId1: string, profileId2: string): Promise<number> {
    return getInterestCompatibility(profileId1, profileId2);
  }
}