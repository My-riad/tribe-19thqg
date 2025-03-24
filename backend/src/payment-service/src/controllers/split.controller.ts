import { Request, Response, NextFunction } from 'express'; // ^4.17.1
import { logger } from 'winston'; // ^3.8.2

import { SplitService } from '../services/split.service';
import { TransactionService } from '../services/transaction.service';
import {
  validateCreateSplit,
  validateGetSplit,
  validateGetSplits,
  validateUpdateSplitStatus,
  validateCancelSplit,
  validateUpdateShareStatus
} from '../validations/split.validation';
import { IPaymentSplitCreate, IPaymentSplitResponse } from '@shared/types/payment.types';
import { ApiError } from '@shared/errors/api.error';

/**
 * Controller class for handling payment split HTTP requests
 */
export class SplitController {
  private splitService: SplitService;
  private transactionService: TransactionService;

  /**
   * Initializes the split controller with required services
   * 
   * @param splitService Service for managing payment splits
   * @param transactionService Service for managing transactions related to splits
   */
  constructor(splitService: SplitService, transactionService: TransactionService) {
    this.splitService = splitService;
    this.transactionService = transactionService;
  }

  /**
   * Creates a new payment split
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async createSplit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const splitData: IPaymentSplitCreate = req.body;
      const createdSplit = await this.splitService.createSplit(splitData);
      
      res.status(201).json(createdSplit);
    } catch (error) {
      logger.error('Error creating payment split', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * Retrieves a specific payment split by ID
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getSplitById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { splitId } = req.params;
      const split = await this.splitService.getSplitById(splitId);
      
      if (!split) {
        throw ApiError.notFound(`Payment split with ID ${splitId} not found`);
      }
      
      res.status(200).json(split.toJSON());
    } catch (error) {
      logger.error('Error retrieving payment split', {
        splitId: req.params.splitId,
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * Retrieves payment splits based on query parameters
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getSplits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId, userId } = req.query;
      
      let splits: IPaymentSplitResponse[] = [];
      
      if (eventId) {
        splits = await this.splitService.getSplitsByEvent(eventId as string);
      } else if (userId) {
        splits = await this.splitService.getSplitsByUser(userId as string);
      } else {
        throw ApiError.badRequest('Either eventId or userId query parameter is required');
      }
      
      res.status(200).json(splits);
    } catch (error) {
      logger.error('Error retrieving payment splits', {
        query: req.query,
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * Updates the status of a payment split
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async updateSplitStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { splitId } = req.params;
      const updatedStatus = await this.splitService.updateSplitStatus(splitId);
      
      res.status(200).json({ id: splitId, status: updatedStatus });
    } catch (error) {
      logger.error('Error updating payment split status', {
        splitId: req.params.splitId,
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * Processes a payment for a user's share in a split
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async processSharePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { splitId } = req.params;
      const { userId, paymentMethodId } = req.body;
      
      if (!userId || !paymentMethodId) {
        throw ApiError.badRequest('userId and paymentMethodId are required');
      }
      
      const success = await this.splitService.processSharePayment(splitId, userId, paymentMethodId);
      
      if (success) {
        res.status(200).json({ message: 'Payment processed successfully' });
      } else {
        throw ApiError.badRequest('Payment processing failed');
      }
    } catch (error) {
      logger.error('Error processing share payment', {
        splitId: req.params.splitId,
        userId: req.body.userId,
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * Cancels a payment split
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async cancelSplit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { splitId } = req.params;
      const success = await this.splitService.cancelSplit(splitId);
      
      if (success) {
        res.status(200).json({ message: 'Split cancelled successfully' });
      } else {
        throw ApiError.badRequest('Failed to cancel split');
      }
    } catch (error) {
      logger.error('Error cancelling payment split', {
        splitId: req.params.splitId,
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * Gets statistics about payment splits for an event or user
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getSplitStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, type } = req.params;
      
      if (!id || !type) {
        throw ApiError.badRequest('id and type parameters are required');
      }
      
      if (!['event', 'user'].includes(type.toLowerCase())) {
        throw ApiError.badRequest('type must be either "event" or "user"');
      }
      
      const statistics = await this.splitService.getSplitStatistics(id, type);
      
      res.status(200).json(statistics);
    } catch (error) {
      logger.error('Error generating split statistics', {
        id: req.params.id,
        type: req.params.type,
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * Sends reminders for pending payments in a split
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async remindPendingPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { splitId } = req.params;
      const success = await this.splitService.remindPendingPayments(splitId);
      
      if (success) {
        res.status(200).json({ message: 'Reminders sent successfully' });
      } else {
        throw ApiError.badRequest('Failed to send reminders');
      }
    } catch (error) {
      logger.error('Error sending payment reminders', {
        splitId: req.params.splitId,
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * Gets a detailed summary of a payment split with user details
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getSplitSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { splitId } = req.params;
      const summary = await this.splitService.getSplitSummary(splitId);
      
      res.status(200).json(summary);
    } catch (error) {
      logger.error('Error generating split summary', {
        splitId: req.params.splitId,
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * Gets all transactions associated with a payment split
   * 
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getSplitTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { splitId } = req.params;
      const transactions = await this.transactionService.getTransactionsBySplit(splitId);
      
      res.status(200).json(transactions);
    } catch (error) {
      logger.error('Error retrieving split transactions', {
        splitId: req.params.splitId,
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }
}

export { SplitController };