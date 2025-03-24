import { Request, Response, NextFunction } from 'express'; // ^4.17.1
import { logger } from 'winston'; // ^3.8.2

import { PaymentService } from '../services/payment.service';
import { IPaymentMethodCreate, IPaymentMethodResponse } from '@shared/types/payment.types';
import { 
  validateCreatePaymentMethod, 
  validateGetPaymentMethod, 
  validateGetPaymentMethods, 
  validateUpdatePaymentMethod, 
  validateDeletePaymentMethod, 
  validateSetDefaultPaymentMethod 
} from '../validations/payment.validation';
import { ApiError } from '@shared/errors/api.error';
import { ValidationError } from '@shared/errors/validation.error';
import { DatabaseError } from '@shared/errors/database.error';

// Create an instance of the PaymentService
const paymentService = new PaymentService();

/**
 * Creates a new payment method for a user
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 * @returns HTTP response with created payment method or error
 */
export const createPaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const paymentMethodData: IPaymentMethodCreate = req.body;
    logger.info('Creating payment method', { userId: paymentMethodData.userId, type: paymentMethodData.type });
    
    const createdPaymentMethod = await paymentService.createPaymentMethod(paymentMethodData);
    
    res.status(201).json({
      success: true,
      data: createdPaymentMethod
    });
  } catch (error) {
    logger.error('Error creating payment method', { error: error.message });
    next(error);
  }
};

/**
 * Retrieves a specific payment method by ID
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 * @returns HTTP response with payment method or error
 */
export const getPaymentMethodById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const paymentMethod = await paymentService.getPaymentMethodById(id);
    
    if (!paymentMethod) {
      return next(ApiError.notFound('Payment method not found'));
    }
    
    res.status(200).json({
      success: true,
      data: paymentMethod.toJSON()
    });
  } catch (error) {
    logger.error('Error retrieving payment method', { error: error.message, paymentMethodId: req.params.id });
    next(error);
  }
};

/**
 * Retrieves all payment methods for a user
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 * @returns HTTP response with array of payment methods or error
 */
export const getPaymentMethodsByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.query;
    const filters = {
      provider: req.query.provider as string,
      type: req.query.type as string,
      isDefault: req.query.isDefault === 'true'
    };
    
    const paymentMethods = await paymentService.getPaymentMethodsByUser(userId as string);
    
    res.status(200).json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    logger.error('Error retrieving payment methods', { error: error.message, userId: req.query.userId });
    next(error);
  }
};

/**
 * Updates a payment method
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 * @returns HTTP response with updated payment method or error
 */
export const updatePaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    logger.info('Updating payment method', { paymentMethodId: id });
    
    const updatedPaymentMethod = await paymentService.updatePaymentMethod(id, updateData);
    
    res.status(200).json({
      success: true,
      data: updatedPaymentMethod
    });
  } catch (error) {
    logger.error('Error updating payment method', { error: error.message, paymentMethodId: req.params.id });
    next(error);
  }
};

/**
 * Deletes a payment method
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 * @returns HTTP response with success message or error
 */
export const deletePaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.query.userId;
    
    logger.info('Deleting payment method', { paymentMethodId: id, userId });
    
    const deleted = await paymentService.deletePaymentMethod(id);
    
    if (!deleted) {
      return next(ApiError.badRequest('Failed to delete payment method'));
    }
    
    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting payment method', { error: error.message, paymentMethodId: req.params.id });
    next(error);
  }
};

/**
 * Sets a payment method as the default for a user
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 * @returns HTTP response with updated payment method or error
 */
export const setDefaultPaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.query.userId;
    
    logger.info('Setting default payment method', { paymentMethodId: id, userId });
    
    const updatedPaymentMethod = await paymentService.setDefaultPaymentMethod(id, userId as string);
    
    res.status(200).json({
      success: true,
      data: updatedPaymentMethod
    });
  } catch (error) {
    logger.error('Error setting default payment method', { error: error.message, paymentMethodId: req.params.id });
    next(error);
  }
};

/**
 * Gets the default payment method for a user
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 * @returns HTTP response with default payment method or error
 */
export const getDefaultPaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const defaultPaymentMethod = await paymentService.getDefaultPaymentMethod(userId);
    
    if (!defaultPaymentMethod) {
      return next(ApiError.notFound('No default payment method found'));
    }
    
    res.status(200).json({
      success: true,
      data: defaultPaymentMethod
    });
  } catch (error) {
    logger.error('Error retrieving default payment method', { error: error.message, userId: req.params.userId });
    next(error);
  }
};

/**
 * Validates a payment method with the provider
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 * @returns HTTP response with validation result or error
 */
export const validatePaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    logger.info('Validating payment method', { paymentMethodId: id });
    
    const isValid = await paymentService.validatePaymentMethod(id);
    
    res.status(200).json({
      success: true,
      data: {
        paymentMethodId: id,
        isValid
      }
    });
  } catch (error) {
    logger.error('Error validating payment method', { error: error.message, paymentMethodId: req.params.id });
    next(error);
  }
};