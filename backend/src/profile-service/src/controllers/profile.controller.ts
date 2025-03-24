import { Request, Response, NextFunction } from 'express';
import { 
  IProfileCreate, 
  IProfileUpdate, 
  IProfileSearchParams, 
  ICoordinates, 
  CommunicationStyle, 
  IPersonalityAssessment, 
  IInterestSubmission 
} from '../../../shared/src/types/profile.types';
import { ProfileService } from '../services/profile.service';
import { logger } from '../../../config/logging';
import { 
  validateProfileParams, 
  validateProfileCreateBody, 
  validateProfileUpdateBody, 
  validateProfileSearchQuery, 
  validateLocationUpdateBody, 
  validateMaxTravelDistanceBody 
} from '../validations/profile.validation';

/**
 * Controller class that handles HTTP requests for profile-related operations
 */
export class ProfileController {
  private profileService: ProfileService;

  /**
   * Initializes the ProfileController with a ProfileService instance
   */
  constructor() {
    this.profileService = new ProfileService();
  }

  /**
   * Creates a new user profile
   */
  async createProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileData: IProfileCreate = req.body;
      logger.info('Creating new profile', { userId: profileData.userId });
      
      const profile = await this.profileService.create(profileData);
      
      res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a profile by its ID
   */
  async getProfileById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      logger.info('Retrieving profile by ID', { profileId: id });
      
      const profile = await this.profileService.getById(id);
      
      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a profile by the associated user ID
   */
  async getProfileByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      logger.info('Retrieving profile by user ID', { userId });
      
      const profile = await this.profileService.getByUserId(userId);
      
      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a complete profile with personality traits and interests
   */
  async getCompleteProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      logger.info('Retrieving complete profile', { profileId: id });
      
      const profile = await this.profileService.getComplete(id);
      
      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: IProfileUpdate = req.body;
      logger.info('Updating profile', { profileId: id });
      
      const updatedProfile = await this.profileService.update(id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a profile
   */
  async deleteProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      logger.info('Deleting profile', { profileId: id });
      
      const deletedProfile = await this.profileService.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Profile deleted successfully',
        data: deletedProfile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Searches for profiles based on various criteria
   */
  async searchProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const searchParams: IProfileSearchParams = req.query as any;
      logger.info('Searching profiles', { criteria: JSON.stringify(searchParams) });
      
      const searchResults = await this.profileService.search(searchParams);
      
      res.status(200).json({
        success: true,
        data: searchResults.profiles,
        meta: {
          total: searchResults.total,
          page: searchResults.page,
          limit: searchResults.limit,
          pages: Math.ceil(searchResults.total / searchResults.limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates a profile's location information
   */
  async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { location, coordinates } = req.body;
      logger.info('Updating profile location', { profileId: id, location });
      
      const updatedProfile = await this.profileService.updateLocation(id, location, coordinates);
      
      res.status(200).json({
        success: true,
        message: 'Location updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates a profile's maximum travel distance preference
   */
  async updateMaxTravelDistance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { maxTravelDistance } = req.body;
      logger.info('Updating maximum travel distance', { profileId: id, maxTravelDistance });
      
      const updatedProfile = await this.profileService.updateMaxTravelDistance(id, maxTravelDistance);
      
      res.status(200).json({
        success: true,
        message: 'Maximum travel distance updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates a profile's communication style
   */
  async updateCommunicationStyle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { communicationStyle } = req.body;
      logger.info('Updating communication style', { profileId: id, communicationStyle });
      
      const updatedProfile = await this.profileService.updateCommunicationStyle(id, communicationStyle);
      
      res.status(200).json({
        success: true,
        message: 'Communication style updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Processes and stores a personality assessment for a user profile
   */
  async submitPersonalityAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessmentData: IPersonalityAssessment = req.body;
      logger.info('Submitting personality assessment', { profileId: assessmentData.profileId });
      
      const updatedProfile = await this.profileService.submitPersonalityAssessment(assessmentData);
      
      res.status(200).json({
        success: true,
        message: 'Personality assessment submitted successfully',
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Processes and stores interests for a user profile
   */
  async submitInterests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const interestData: IInterestSubmission = req.body;
      logger.info('Submitting interests', { 
        profileId: interestData.profileId, 
        count: interestData.interests.length 
      });
      
      const updatedProfile = await this.profileService.submitInterests(interestData);
      
      res.status(200).json({
        success: true,
        message: 'Interests submitted successfully',
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Finds profiles near a specific location
   */
  async getNearbyProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coordinates: ICoordinates = {
        latitude: parseFloat(req.query.latitude as string),
        longitude: parseFloat(req.query.longitude as string)
      };
      
      const maxDistance = req.query.maxDistance ? parseFloat(req.query.maxDistance as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      
      logger.info('Finding profiles near location', { coordinates, maxDistance });
      
      const nearbyProfiles = await this.profileService.getNearLocation(
        coordinates,
        maxDistance,
        limit,
        offset
      );
      
      res.status(200).json({
        success: true,
        data: nearbyProfiles,
        meta: {
          count: nearbyProfiles.length,
          coordinates,
          maxDistance: maxDistance || 15, // Default to 15 miles
          limit: limit || 20 // Default to 20 results
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculates compatibility between two profiles
   */
  async calculateCompatibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { profileId1, profileId2 } = req.query as { profileId1: string, profileId2: string };
      logger.info('Calculating profile compatibility', { profileId1, profileId2 });
      
      const compatibilityScores = await this.profileService.calculateCompatibility(profileId1, profileId2);
      
      res.status(200).json({
        success: true,
        data: compatibilityScores
      });
    } catch (error) {
      next(error);
    }
  }
}