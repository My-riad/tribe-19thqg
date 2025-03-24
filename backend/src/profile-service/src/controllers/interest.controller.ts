/**
 * Express controller for handling HTTP requests related to user interests in the Tribe platform.
 * This controller provides endpoints for creating, retrieving, updating, and deleting interest records,
 * as well as bulk operations for managing multiple interests at once.
 */

import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { InterestService } from '../services/interest.service';
import { IInterest, IInterestSubmission } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Express request handler for creating a new interest
 * 
 * @param req - Express request with interest data in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const createInterestHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    logger.debug('Creating new interest', { profileId: req.body.profileId });
    
    const interestData: IInterest = req.body;
    const interestService = new InterestService();
    
    const createdInterest = await interestService.create(interestData);
    
    res.status(201).json(createdInterest);
  } catch (error) {
    next(error);
  }
};

/**
 * Express request handler for retrieving an interest by ID
 * 
 * @param req - Express request with interest ID in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getInterestByIdHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    logger.debug('Getting interest by ID', { id });
    
    const interestService = new InterestService();
    const interest = await interestService.getById(id);
    
    if (!interest) {
      throw ApiError.notFound(`Interest with ID ${id} not found`);
    }
    
    res.status(200).json(interest);
  } catch (error) {
    next(error);
  }
};

/**
 * Express request handler for retrieving all interests for a profile
 * 
 * @param req - Express request with profile ID in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getInterestsByProfileIdHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { profileId } = req.params;
    logger.debug('Getting interests by profile ID', { profileId });
    
    const interestService = new InterestService();
    const interests = await interestService.getByProfileId(profileId);
    
    res.status(200).json(interests);
  } catch (error) {
    next(error);
  }
};

/**
 * Express request handler for updating an existing interest
 * 
 * @param req - Express request with interest ID in params and update data in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const updateInterestHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    logger.debug('Updating interest', { id });
    
    const interestService = new InterestService();
    const updatedInterest = await interestService.update(id, updateData);
    
    res.status(200).json(updatedInterest);
  } catch (error) {
    next(error);
  }
};

/**
 * Express request handler for deleting an interest
 * 
 * @param req - Express request with interest ID in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const deleteInterestHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    logger.debug('Deleting interest', { id });
    
    const interestService = new InterestService();
    await interestService.delete(id);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Express request handler for creating multiple interests in a single operation
 * 
 * @param req - Express request with interest submission data in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const bulkCreateInterestsHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const submissionData: IInterestSubmission = req.body;
    logger.debug('Creating interests in bulk', { 
      profileId: submissionData.profileId,
      count: submissionData.interests.length
    });
    
    const interestService = new InterestService();
    const createdInterests = await interestService.submitBatch(submissionData);
    
    res.status(201).json(createdInterests);
  } catch (error) {
    next(error);
  }
};

/**
 * Express request handler for deleting all interests for a profile
 * 
 * @param req - Express request with profile ID in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const deleteInterestsByProfileIdHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { profileId } = req.params;
    logger.debug('Deleting all interests for profile', { profileId });
    
    const interestService = new InterestService();
    
    // Create a submission with empty interests array and replaceExisting=true
    // This will delete all existing interests for the profile
    const submission: IInterestSubmission = {
      profileId,
      interests: [],
      replaceExisting: true
    };
    
    await interestService.submitBatch(submission);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};