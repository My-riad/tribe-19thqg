import { Request, Response, NextFunction } from 'express';
import { PersonalityService } from '../services/personality.service';
import { 
  IPersonalityTrait, 
  IPersonalityAssessment, 
  PersonalityTrait, 
  CommunicationStyle 
} from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { HTTP_STATUS } from '../../../shared/src/constants/error.constants';
import { logger } from '../../../config/logging';

/**
 * Controller class that handles HTTP requests for personality-related operations
 */
export class PersonalityController {
  private personalityService: PersonalityService;

  /**
   * Initializes the PersonalityController with a PersonalityService instance
   */
  constructor() {
    this.personalityService = new PersonalityService();
  }

  /**
   * Creates a new personality trait for a user profile
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async createTrait(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const traitData: IPersonalityTrait = req.body;
      
      logger.info('Creating personality trait', { profileId: traitData.profileId, trait: traitData.trait });
      
      const trait = await this.personalityService.createTrait(traitData);
      
      res.status(HTTP_STATUS.CREATED).json(trait);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a personality trait by its ID
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getTraitById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const trait = await this.personalityService.getById(id);
      
      if (!trait) {
        throw ApiError.notFound(`Personality trait with ID ${id} not found`);
      }
      
      res.status(HTTP_STATUS.OK).json(trait);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all personality traits for a specific profile
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getTraitsByProfileId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const traits = await this.personalityService.getByProfileId(profileId);
      
      res.status(HTTP_STATUS.OK).json(traits);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing personality trait
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async updateTrait(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: Partial<IPersonalityTrait> = req.body;
      
      logger.info('Updating personality trait', { id, updates: updateData });
      
      const updatedTrait = await this.personalityService.update(id, updateData);
      
      res.status(HTTP_STATUS.OK).json(updatedTrait);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a personality trait
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async deleteTrait(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      logger.info('Deleting personality trait', { id });
      
      await this.personalityService.delete(id);
      
      res.status(HTTP_STATUS.NO_CONTENT).end();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submits a complete personality assessment for a user profile
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async submitAssessment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessment: IPersonalityAssessment = req.body;
      
      logger.info('Submitting personality assessment', { profileId: assessment.profileId });
      
      const traits = await this.personalityService.submitAssessment(assessment);
      
      res.status(HTTP_STATUS.CREATED).json(traits);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculates personality compatibility between two profiles
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getCompatibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { profileId1, profileId2 } = req.params;
      
      const compatibility = await this.personalityService.getCompatibility(profileId1, profileId2);
      
      res.status(HTTP_STATUS.OK).json({ compatibility });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyzes personality traits for a profile to determine dominant characteristics
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async analyzeTraits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { profileId } = req.params;
      
      // Get traits for the profile
      const traits = await this.personalityService.getByProfileId(profileId);
      
      if (!traits || traits.length === 0) {
        throw ApiError.notFound(`No personality traits found for profile ${profileId}`);
      }
      
      // Analyze the traits
      const analysis = this.personalityService.analyzeTraits(traits);
      
      res.status(HTTP_STATUS.OK).json(analysis);
    } catch (error) {
      next(error);
    }
  }
}