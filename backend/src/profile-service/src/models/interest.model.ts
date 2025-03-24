import prisma from '../../../config/database';
import { 
  IInterest, 
  IInterestSubmission, 
  InterestCategory, 
  InterestLevel 
} from '../../../shared/src/types/profile.types';
import { DatabaseError } from '../../../shared/src/errors/database.error';

/**
 * Creates a new interest record for a user profile
 * 
 * @param interestData - The interest data to create
 * @returns The created interest record
 */
export async function createInterest(interestData: IInterest): Promise<IInterest> {
  try {
    return await prisma.prisma.interest.create({
      data: {
        profileId: interestData.profileId,
        category: interestData.category,
        name: interestData.name,
        level: interestData.level
      }
    });
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'createInterest' });
  }
}

/**
 * Retrieves an interest by its ID
 * 
 * @param id - The ID of the interest to retrieve
 * @returns The interest if found, null otherwise
 */
export async function getInterestById(id: string): Promise<IInterest | null> {
  try {
    return await prisma.prisma.interest.findUnique({
      where: { id }
    });
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'getInterestById' });
  }
}

/**
 * Retrieves all interests for a specific profile
 * 
 * @param profileId - The ID of the profile to retrieve interests for
 * @returns Array of interests for the profile
 */
export async function getInterestsByProfileId(profileId: string): Promise<IInterest[]> {
  try {
    return await prisma.prisma.interest.findMany({
      where: { profileId }
    });
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'getInterestsByProfileId' });
  }
}

/**
 * Updates an existing interest record
 * 
 * @param id - The ID of the interest to update
 * @param updates - The updated interest data
 * @returns The updated interest record
 */
export async function updateInterest(id: string, updates: Partial<IInterest>): Promise<IInterest> {
  try {
    return await prisma.prisma.interest.update({
      where: { id },
      data: {
        category: updates.category,
        name: updates.name,
        level: updates.level
      }
    });
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'updateInterest' });
  }
}

/**
 * Deletes an interest record
 * 
 * @param id - The ID of the interest to delete
 * @returns True if deletion was successful
 */
export async function deleteInterest(id: string): Promise<boolean> {
  try {
    await prisma.prisma.interest.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'deleteInterest' });
  }
}

/**
 * Processes and stores a batch of interests for a user profile
 * 
 * @param submission - The batch of interests to submit
 * @returns Array of created/updated interests
 */
export async function submitInterests(submission: IInterestSubmission): Promise<IInterest[]> {
  try {
    // Start a transaction to ensure all operations succeed or fail together
    return await prisma.prisma.$transaction(async (tx: any) => {
      // If replaceExisting is true, delete all existing interests for the profile
      if (submission.replaceExisting) {
        await tx.interest.deleteMany({
          where: { profileId: submission.profileId }
        });
      }

      // Create interests for each item in the submission
      const createdInterests: IInterest[] = [];
      
      for (const interest of submission.interests) {
        const newInterest = await tx.interest.create({
          data: {
            profileId: submission.profileId,
            category: interest.category,
            name: interest.name,
            level: interest.level
          }
        });
        
        createdInterests.push(newInterest);
      }

      return createdInterests;
    });
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'submitInterests' });
  }
}

/**
 * Calculates interest compatibility between two profiles
 * 
 * @param profileId1 - The ID of the first profile
 * @param profileId2 - The ID of the second profile
 * @returns Compatibility score between 0 and 1
 */
export async function getInterestCompatibility(profileId1: string, profileId2: string): Promise<number> {
  try {
    // Get interests for both profiles
    const interests1 = await getInterestsByProfileId(profileId1);
    const interests2 = await getInterestsByProfileId(profileId2);

    if (!interests1.length || !interests2.length) {
      return 0; // If either profile has no interests, compatibility is 0
    }

    // Create maps of categories to levels for each profile
    const categoryMap1 = new Map<InterestCategory, number>();
    const categoryMap2 = new Map<InterestCategory, number>();

    // For profile 1, use the highest level for each category
    interests1.forEach(interest => {
      const currentLevel = categoryMap1.get(interest.category) || 0;
      if (interest.level > currentLevel) {
        categoryMap1.set(interest.category, interest.level);
      }
    });

    // For profile 2, use the highest level for each category
    interests2.forEach(interest => {
      const currentLevel = categoryMap2.get(interest.category) || 0;
      if (interest.level > currentLevel) {
        categoryMap2.set(interest.category, interest.level);
      }
    });

    // Calculate overlap in categories and weighted match score
    let totalScore = 0;
    let maxPossibleScore = 0;

    // For each category in profile 1
    categoryMap1.forEach((level1, category) => {
      maxPossibleScore += level1 * 3; // Maximum possible score is if both had level 3

      // If profile 2 also has this category
      if (categoryMap2.has(category)) {
        const level2 = categoryMap2.get(category)!;
        // Score is the product of the levels (higher when both have high interest)
        totalScore += level1 * level2;
      }
    });

    // For categories only in profile 2
    categoryMap2.forEach((level2, category) => {
      if (!categoryMap1.has(category)) {
        maxPossibleScore += level2 * 3; // Add to max possible score
      }
    });

    // Normalize score to be between 0 and 1
    return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
  } catch (error) {
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'getInterestCompatibility' });
  }
}

/**
 * Class representing the Interest model with database operations
 */
export class InterestModel {
  private prisma: any;

  /**
   * Initializes the InterestModel
   */
  constructor() {
    this.prisma = prisma.prisma;
  }

  /**
   * Creates a new interest
   * 
   * @param data - Interest data to create
   * @returns The created interest
   */
  async create(data: IInterest): Promise<IInterest> {
    return createInterest(data);
  }

  /**
   * Retrieves an interest by ID
   * 
   * @param id - ID of the interest to retrieve
   * @returns The interest if found, null otherwise
   */
  async getById(id: string): Promise<IInterest | null> {
    return getInterestById(id);
  }

  /**
   * Retrieves all interests for a specific profile
   * 
   * @param profileId - ID of the profile to retrieve interests for
   * @returns Array of interests for the profile
   */
  async getByProfileId(profileId: string): Promise<IInterest[]> {
    return getInterestsByProfileId(profileId);
  }

  /**
   * Updates an existing interest
   * 
   * @param id - ID of the interest to update
   * @param data - Updated interest data
   * @returns The updated interest
   */
  async update(id: string, data: Partial<IInterest>): Promise<IInterest> {
    return updateInterest(id, data);
  }

  /**
   * Deletes an interest
   * 
   * @param id - ID of the interest to delete
   * @returns True if deletion was successful
   */
  async delete(id: string): Promise<boolean> {
    return deleteInterest(id);
  }

  /**
   * Processes and stores a batch of interests for a user profile
   * 
   * @param submission - Batch of interests to submit
   * @returns Array of created/updated interests
   */
  async submitBatch(submission: IInterestSubmission): Promise<IInterest[]> {
    return submitInterests(submission);
  }

  /**
   * Calculates interest compatibility between two profiles
   * 
   * @param profileId1 - ID of the first profile
   * @param profileId2 - ID of the second profile
   * @returns Compatibility score between 0 and 1
   */
  async calculateCompatibility(profileId1: string, profileId2: string): Promise<number> {
    return getInterestCompatibility(profileId1, profileId2);
  }
}