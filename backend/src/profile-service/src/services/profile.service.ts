import { ProfileModel } from '../models/profile.model';
import { PersonalityModel } from '../models/personality.model';
import { InterestModel } from '../models/interest.model';
import { 
  IProfile, 
  IProfileCreate, 
  IProfileUpdate, 
  IProfileResponse, 
  IProfileSearchParams, 
  ICoordinates, 
  CommunicationStyle, 
  IPersonalityAssessment, 
  IInterestSubmission
} from '../../../shared/src/types/profile.types';
import { DatabaseError } from '../../../shared/src/errors/database.error';
import { ValidationError } from '../../../shared/src/errors/validation.error';
import { 
  validateProfileCreate, 
  validateProfileUpdate, 
  validateProfileSearchParams, 
  validateCoordinates 
} from '../validations/profile.validation';
import { logger } from '../../../config/logging';

/**
 * Service class that implements business logic for profile management
 */
export class ProfileService {
  private profileModel: ProfileModel;
  private personalityModel: PersonalityModel;
  private interestModel: InterestModel;

  /**
   * Initializes the ProfileService with required models
   */
  constructor() {
    this.profileModel = new ProfileModel();
    this.personalityModel = new PersonalityModel();
    this.interestModel = new InterestModel();
  }

  /**
   * Creates a new user profile
   * 
   * @param profileData - The profile data to create
   * @returns The created profile
   * @throws ValidationError if validation fails
   * @throws DatabaseError if creation fails
   */
  async create(profileData: IProfileCreate): Promise<IProfile> {
    try {
      // Validate the profile data
      const validatedData = validateProfileCreate(profileData);
      
      logger.info('Creating new user profile', { userId: validatedData.userId });
      
      // Create the profile using the model
      const profile = await this.profileModel.create(validatedData);
      
      return profile;
    } catch (error) {
      logger.error('Failed to create user profile', error as Error, { userId: profileData.userId });
      throw error;
    }
  }

  /**
   * Retrieves a profile by ID
   * 
   * @param id - The profile ID
   * @returns The profile if found
   * @throws DatabaseError if retrieval fails or profile not found
   */
  async getById(id: string): Promise<IProfile> {
    try {
      logger.info('Retrieving profile by ID', { profileId: id });
      
      const profile = await this.profileModel.getById(id);
      
      if (!profile) {
        throw DatabaseError.notFoundError('Profile');
      }
      
      return profile;
    } catch (error) {
      logger.error('Failed to retrieve profile by ID', error as Error, { profileId: id });
      throw error;
    }
  }

  /**
   * Retrieves a profile by user ID
   * 
   * @param userId - The user ID
   * @returns The profile if found
   * @throws DatabaseError if retrieval fails or profile not found
   */
  async getByUserId(userId: string): Promise<IProfile> {
    try {
      logger.info('Retrieving profile by user ID', { userId });
      
      const profile = await this.profileModel.getByUserId(userId);
      
      if (!profile) {
        throw DatabaseError.notFoundError('Profile');
      }
      
      return profile;
    } catch (error) {
      logger.error('Failed to retrieve profile by user ID', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Updates an existing profile
   * 
   * @param id - The profile ID
   * @param profileData - The updated profile data
   * @returns The updated profile
   * @throws ValidationError if validation fails
   * @throws DatabaseError if update fails
   */
  async update(id: string, profileData: IProfileUpdate): Promise<IProfile> {
    try {
      // Validate the profile data
      const validatedData = validateProfileUpdate(profileData);
      
      logger.info('Updating user profile', { profileId: id });
      
      // Update the profile using the model
      const profile = await this.profileModel.update(id, validatedData);
      
      return profile;
    } catch (error) {
      logger.error('Failed to update user profile', error as Error, { profileId: id });
      throw error;
    }
  }

  /**
   * Deletes a profile
   * 
   * @param id - The profile ID
   * @returns The deleted profile
   * @throws DatabaseError if deletion fails
   */
  async delete(id: string): Promise<IProfile> {
    try {
      logger.info('Deleting user profile', { profileId: id });
      
      const profile = await this.profileModel.delete(id);
      
      return profile;
    } catch (error) {
      logger.error('Failed to delete user profile', error as Error, { profileId: id });
      throw error;
    }
  }

  /**
   * Searches for profiles based on various criteria
   * 
   * @param searchParams - The search parameters
   * @returns Search results with pagination information
   * @throws ValidationError if validation fails
   * @throws DatabaseError if search fails
   */
  async search(searchParams: IProfileSearchParams): Promise<{ profiles: IProfile[]; total: number; page: number; limit: number; }> {
    try {
      // Validate the search parameters
      const validatedParams = validateProfileSearchParams(searchParams);
      
      logger.info('Searching for profiles', { criteria: JSON.stringify(validatedParams) });
      
      // Perform the search using the model
      const results = await this.profileModel.search(validatedParams);
      
      return results;
    } catch (error) {
      logger.error('Failed to search for profiles', error as Error);
      throw error;
    }
  }

  /**
   * Retrieves a complete profile with personality traits and interests
   * 
   * @param id - The profile ID
   * @returns The complete profile data
   * @throws DatabaseError if retrieval fails or profile not found
   */
  async getComplete(id: string): Promise<IProfileResponse> {
    try {
      logger.info('Retrieving complete profile', { profileId: id });
      
      const profile = await this.profileModel.getComplete(id);
      
      if (!profile) {
        throw DatabaseError.notFoundError('Profile');
      }
      
      return profile;
    } catch (error) {
      logger.error('Failed to retrieve complete profile', error as Error, { profileId: id });
      throw error;
    }
  }

  /**
   * Updates a profile's location information
   * 
   * @param id - The profile ID
   * @param location - The location string
   * @param coordinates - The geographic coordinates
   * @returns The updated profile
   * @throws ValidationError if validation fails
   * @throws DatabaseError if update fails
   */
  async updateLocation(id: string, location: string, coordinates: ICoordinates): Promise<IProfile> {
    try {
      // Validate the coordinates
      const validatedCoordinates = validateCoordinates(coordinates);
      
      logger.info('Updating profile location', { profileId: id, location, coordinates: validatedCoordinates });
      
      // Update the location using the model
      const profile = await this.profileModel.updateLocation(id, location, validatedCoordinates);
      
      return profile;
    } catch (error) {
      logger.error('Failed to update profile location', error as Error, { profileId: id });
      throw error;
    }
  }

  /**
   * Updates a profile's maximum travel distance preference
   * 
   * @param id - The profile ID
   * @param maxTravelDistance - The maximum travel distance in miles
   * @returns The updated profile
   * @throws ValidationError if validation fails
   * @throws DatabaseError if update fails
   */
  async updateMaxTravelDistance(id: string, maxTravelDistance: number): Promise<IProfile> {
    try {
      // Validate the maxTravelDistance
      if (typeof maxTravelDistance !== 'number' || maxTravelDistance <= 0) {
        throw new ValidationError('Maximum travel distance must be a positive number');
      }
      
      logger.info('Updating maximum travel distance', { profileId: id, maxTravelDistance });
      
      // Update the max travel distance using the model
      const profile = await this.profileModel.updateMaxTravelDistance(id, maxTravelDistance);
      
      return profile;
    } catch (error) {
      logger.error('Failed to update maximum travel distance', error as Error, { profileId: id });
      throw error;
    }
  }

  /**
   * Updates a profile's communication style
   * 
   * @param id - The profile ID
   * @param communicationStyle - The communication style
   * @returns The updated profile
   * @throws ValidationError if validation fails
   * @throws DatabaseError if update fails
   */
  async updateCommunicationStyle(id: string, communicationStyle: CommunicationStyle): Promise<IProfile> {
    try {
      // Validate the communication style
      if (!Object.values(CommunicationStyle).includes(communicationStyle)) {
        throw new ValidationError(`Invalid communication style. Must be one of: ${Object.values(CommunicationStyle).join(', ')}`);
      }
      
      logger.info('Updating communication style', { profileId: id, communicationStyle });
      
      // Update the communication style using the model
      await this.personalityModel.updateCommunicationStyle(id, communicationStyle);
      
      // Return the updated profile
      const profile = await this.profileModel.getById(id);
      
      if (!profile) {
        throw DatabaseError.notFoundError('Profile');
      }
      
      return profile;
    } catch (error) {
      logger.error('Failed to update communication style', error as Error, { profileId: id });
      throw error;
    }
  }

  /**
   * Processes and stores a personality assessment for a user profile
   * 
   * @param assessment - The personality assessment data
   * @returns The updated profile with personality assessment
   * @throws ValidationError if validation fails
   * @throws DatabaseError if processing fails
   */
  async submitPersonalityAssessment(assessment: IPersonalityAssessment): Promise<IProfile> {
    try {
      // Validate the assessment data
      if (!assessment.profileId || !assessment.traits || assessment.traits.length === 0) {
        throw new ValidationError('Invalid personality assessment data');
      }
      
      logger.info('Submitting personality assessment', { profileId: assessment.profileId });
      
      // Submit the assessment using the model
      await this.personalityModel.submitAssessment(assessment);
      
      // Return the updated profile
      const profile = await this.profileModel.getById(assessment.profileId);
      
      if (!profile) {
        throw DatabaseError.notFoundError('Profile');
      }
      
      return profile;
    } catch (error) {
      logger.error('Failed to submit personality assessment', error as Error, { profileId: assessment.profileId });
      throw error;
    }
  }

  /**
   * Processes and stores interests for a user profile
   * 
   * @param submission - The interest submission data
   * @returns The updated profile with interests
   * @throws ValidationError if validation fails
   * @throws DatabaseError if processing fails
   */
  async submitInterests(submission: IInterestSubmission): Promise<IProfile> {
    try {
      // Validate the submission data
      if (!submission.profileId || !submission.interests || submission.interests.length === 0) {
        throw new ValidationError('Invalid interest submission data');
      }
      
      logger.info('Submitting interests', { profileId: submission.profileId, count: submission.interests.length });
      
      // Submit the interests using the model
      await this.interestModel.submitBatch(submission);
      
      // Return the updated profile
      const profile = await this.profileModel.getById(submission.profileId);
      
      if (!profile) {
        throw DatabaseError.notFoundError('Profile');
      }
      
      return profile;
    } catch (error) {
      logger.error('Failed to submit interests', error as Error, { profileId: submission.profileId });
      throw error;
    }
  }

  /**
   * Finds profiles near a specific location
   * 
   * @param coordinates - The center coordinates
   * @param maxDistance - Maximum distance in miles
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Array of nearby profiles
   * @throws ValidationError if validation fails
   * @throws DatabaseError if search fails
   */
  async getNearLocation(coordinates: ICoordinates, maxDistance?: number, limit?: number, offset?: number): Promise<IProfile[]> {
    try {
      // Validate the coordinates
      const validatedCoordinates = validateCoordinates(coordinates);
      
      // Set default values if not provided
      const distance = maxDistance || 15; // Default to 15 miles
      const resultLimit = limit || 20; // Default to 20 results
      const resultOffset = offset || 0; // Default to no offset
      
      logger.info('Finding profiles near location', { coordinates: validatedCoordinates, maxDistance: distance });
      
      // Find nearby profiles using the model
      const profiles = await this.profileModel.findNearby(validatedCoordinates, distance, resultLimit);
      
      return profiles;
    } catch (error) {
      logger.error('Failed to find profiles near location', error as Error);
      throw error;
    }
  }

  /**
   * Calculates compatibility between two profiles
   * 
   * @param profileId1 - ID of the first profile
   * @param profileId2 - ID of the second profile
   * @returns Compatibility scores
   * @throws DatabaseError if calculation fails
   */
  async calculateCompatibility(profileId1: string, profileId2: string): Promise<{ overall: number; personality: number; interests: number; communication: number; }> {
    try {
      logger.info('Calculating profile compatibility', { profileId1, profileId2 });
      
      // Validate that both profiles exist
      const [profile1, profile2] = await Promise.all([
        this.profileModel.getById(profileId1),
        this.profileModel.getById(profileId2)
      ]);
      
      if (!profile1 || !profile2) {
        throw DatabaseError.notFoundError('Profile');
      }
      
      // Calculate personality compatibility
      const personalityCompatibility = await this.personalityModel.calculateCompatibility(profileId1, profileId2);
      
      // Calculate interest compatibility
      const interestCompatibility = await this.interestModel.calculateCompatibility(profileId1, profileId2);
      
      // Calculate communication style compatibility
      let communicationCompatibility = 0.5; // Default neutral value
      
      if (profile1.communicationStyle && profile2.communicationStyle) {
        if (profile1.communicationStyle === profile2.communicationStyle) {
          communicationCompatibility = 1.0; // Perfect match
        } else {
          // This could be enhanced with a more sophisticated compatibility matrix
          communicationCompatibility = 0.3; // Different styles
        }
      }
      
      // Calculate overall compatibility (weighted average)
      const overall = (
        personalityCompatibility * 0.6 + 
        interestCompatibility * 0.3 + 
        communicationCompatibility * 0.1
      );
      
      return {
        overall,
        personality: personalityCompatibility,
        interests: interestCompatibility,
        communication: communicationCompatibility
      };
    } catch (error) {
      logger.error('Failed to calculate profile compatibility', error as Error, { profileId1, profileId2 });
      throw error;
    }
  }
}