import { Request, Response, NextFunction, Router } from 'express'; // ^4.18.2
import { logger } from 'winston'; // ^3.8.2

import { TransactionService } from '../services/transaction.service';
import { 
  ITransactionCreate, 
  IPaymentResponse, 
  TransactionStatus, 
  PaymentProvider 
} from '@shared/types/payment.types';
import { ApiError } from '@shared/errors/api.error';
import { DatabaseError } from '@shared/errors/database.error';
import { ValidationError } from '@shared/errors/validation.error';
import { 
  validateCreateTransaction, 
  validateGetTransaction, 
  validateGetTransactions, 
  validateUpdateTransactionStatus, 
  validateRefundTransaction 
} from '../validations/transaction.validation';

/**
 * Creates a new transaction record
 * 
 * @param req - Express request object containing transaction data
 * @param res - Express response object
 * @param next - Express next function
 * @returns Promise resolving to HTTP response
 */
async function createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extract transaction data from request body
    const transactionData: ITransactionCreate = req.body;
    
    // Log transaction creation attempt
    logger.debug('Creating new transaction', {
      type: transactionData.type,
      amount: transactionData.amount,
      userId: transactionData.userId
    });

    // Create transaction using service
    const transactionService = new TransactionService();
    const transaction = await transactionService.createTransaction(transactionData);

    // Return successful response with created transaction
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction.toJSON()
    });
  } catch (error) {
    logger.error('Failed to create transaction', {
      error: error.message,
      stack: error.stack
    });

    // Pass error to error handling middleware
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      next(error);
    } else {
      next(ApiError.internal('Failed to create transaction', { originalError: error.message }));
    }
  }
}

/**
 * Retrieves a specific transaction by ID
 * 
 * @param req - Express request object containing transaction ID
 * @param res - Express response object
 * @param next - Express next function
 * @returns Promise resolving to HTTP response
 */
async function getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extract transaction ID from request parameters
    const { id } = req.params;
    
    logger.debug('Retrieving transaction by ID', { transactionId: id });

    // Get transaction from service
    const transactionService = new TransactionService();
    const transaction = await transactionService.getTransactionById(id);

    // Handle not found scenario
    if (!transaction) {
      throw ApiError.notFound(`Transaction with ID ${id} not found`);
    }

    // Return successful response with transaction data
    res.status(200).json({
      success: true,
      data: transaction.toJSON()
    });
  } catch (error) {
    logger.error('Failed to retrieve transaction', {
      transactionId: req.params.id,
      error: error.message,
      stack: error.stack
    });

    // Pass error to error handling middleware
    if (error instanceof ApiError || error instanceof DatabaseError) {
      next(error);
    } else {
      next(ApiError.internal('Failed to retrieve transaction', { originalError: error.message }));
    }
  }
}

/**
 * Retrieves transactions based on query parameters
 * 
 * @param req - Express request object containing query parameters
 * @param res - Express response object
 * @param next - Express next function
 * @returns Promise resolving to HTTP response
 */
async function getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extract query parameters
    const { userId, eventId, splitId, ...filters } = req.query;
    
    logger.debug('Retrieving transactions', { userId, eventId, splitId, filters });

    const transactionService = new TransactionService();
    let transactions: IPaymentResponse[] = [];

    // Determine which service method to use based on provided parameters
    if (userId) {
      transactions = await transactionService.getTransactionsByUser(userId as string, filters);
    } else if (eventId) {
      transactions = await transactionService.getTransactionsByEvent(eventId as string);
    } else if (splitId) {
      transactions = await transactionService.getTransactionsBySplit(splitId as string);
    } else {
      throw ApiError.badRequest('At least one filter parameter (userId, eventId, or splitId) is required');
    }

    // Return successful response with transactions
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    logger.error('Failed to retrieve transactions', {
      filters: req.query,
      error: error.message,
      stack: error.stack
    });

    // Pass error to error handling middleware
    if (error instanceof ApiError || error instanceof DatabaseError) {
      next(error);
    } else {
      next(ApiError.internal('Failed to retrieve transactions', { originalError: error.message }));
    }
  }
}

/**
 * Processes a payment for a transaction
 * 
 * @param req - Express request object containing transaction ID and payment details
 * @param res - Express response object
 * @param next - Express next function
 * @returns Promise resolving to HTTP response
 */
async function processPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extract transaction ID and payment method ID from request
    const { id } = req.params;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      throw ApiError.badRequest('Payment method ID is required');
    }

    logger.debug('Processing payment for transaction', { 
      transactionId: id, 
      paymentMethodId 
    });

    // Process payment using service
    const transactionService = new TransactionService();
    const transaction = await transactionService.processPayment(id, paymentMethodId);

    // Return successful response with updated transaction
    res.status(200).json({
      success: true,
      message: 'Payment initiated successfully',
      data: transaction.toJSON(),
      paymentDetails: transaction.metadata
    });
  } catch (error) {
    logger.error('Failed to process payment', {
      transactionId: req.params.id,
      error: error.message,
      stack: error.stack
    });

    // Pass error to error handling middleware
    if (error instanceof ApiError || error instanceof DatabaseError) {
      next(error);
    } else {
      next(ApiError.internal('Failed to process payment', { originalError: error.message }));
    }
  }
}

/**
 * Updates the status of a transaction
 * 
 * @param req - Express request object containing transaction ID and new status
 * @param res - Express response object
 * @param next - Express next function
 * @returns Promise resolving to HTTP response
 */
async function updateTransactionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extract transaction ID and new status from request
    const { id } = req.params;
    const { status } = req.body;

    logger.debug('Updating transaction status', { 
      transactionId: id, 
      newStatus: status 
    });

    // Update transaction status using service
    const transactionService = new TransactionService();
    const transaction = await transactionService.updateTransactionStatus(id, status as TransactionStatus);

    // Return successful response with updated transaction
    res.status(200).json({
      success: true,
      message: `Transaction status updated to ${status}`,
      data: transaction.toJSON()
    });
  } catch (error) {
    logger.error('Failed to update transaction status', {
      transactionId: req.params.id,
      newStatus: req.body.status,
      error: error.message,
      stack: error.stack
    });

    // Pass error to error handling middleware
    if (error instanceof ApiError || error instanceof DatabaseError || error instanceof ValidationError) {
      next(error);
    } else {
      next(ApiError.internal('Failed to update transaction status', { originalError: error.message }));
    }
  }
}

/**
 * Processes a refund for a transaction
 * 
 * @param req - Express request object containing transaction ID and refund reason
 * @param res - Express response object
 * @param next - Express next function
 * @returns Promise resolving to HTTP response
 */
async function processRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extract transaction ID and refund reason from request
    const { id } = req.params;
    const { reason } = req.body;

    logger.debug('Processing refund for transaction', { 
      transactionId: id, 
      reason 
    });

    // Process refund using service
    const transactionService = new TransactionService();
    const refundTransaction = await transactionService.processRefund(id, reason);

    // Return successful response with refund transaction
    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: refundTransaction.toJSON()
    });
  } catch (error) {
    logger.error('Failed to process refund', {
      transactionId: req.params.id,
      reason: req.body.reason,
      error: error.message,
      stack: error.stack
    });

    // Pass error to error handling middleware
    if (error instanceof ApiError || error instanceof DatabaseError || error instanceof ValidationError) {
      next(error);
    } else {
      next(ApiError.internal('Failed to process refund', { originalError: error.message }));
    }
  }
}

/**
 * Gets a summary of transactions for a user, event, or split
 * 
 * @param req - Express request object containing type and ID
 * @param res - Express response object
 * @param next - Express next function
 * @returns Promise resolving to HTTP response
 */
async function getTransactionSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extract ID and type from request parameters
    const { type, id } = req.params;

    if (!['user', 'event', 'split'].includes(type)) {
      throw ApiError.badRequest('Type must be one of: user, event, split');
    }

    logger.debug('Retrieving transaction summary', { 
      type, 
      id 
    });

    // Get transaction summary using service
    const transactionService = new TransactionService();
    const summary = await transactionService.getTransactionSummary(id, type);

    // Return successful response with summary data
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Failed to retrieve transaction summary', {
      type: req.params.type,
      id: req.params.id,
      error: error.message,
      stack: error.stack
    });

    // Pass error to error handling middleware
    if (error instanceof ApiError || error instanceof DatabaseError) {
      next(error);
    } else {
      next(ApiError.internal('Failed to retrieve transaction summary', { originalError: error.message }));
    }
  }
}

/**
 * Handles webhook events from payment providers
 * 
 * @param req - Express request object containing webhook data
 * @param res - Express response object
 * @param next - Express next function
 * @returns Promise resolving to HTTP response
 */
async function handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Extract provider, payload and signature from request
    const { provider } = req.params;
    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = req.headers['stripe-signature'] || 
                     req.headers['venmo-signature'] ||
                     req.headers['x-webhook-signature'] ||
                     '';

    if (!provider || !Object.values(PaymentProvider).includes(provider as PaymentProvider)) {
      throw ApiError.badRequest('Invalid payment provider');
    }

    logger.debug('Processing webhook from payment provider', { provider });

    // Process webhook using service
    const transactionService = new TransactionService();
    const success = await transactionService.handleWebhook(
      provider,
      payload,
      signature as string
    );

    // Return appropriate response
    if (success) {
      res.status(200).json({ received: true });
    } else {
      res.status(400).json({ received: false, error: 'Failed to process webhook' });
    }
  } catch (error) {
    logger.error('Failed to process webhook', {
      provider: req.params.provider,
      error: error.message,
      stack: error.stack
    });

    // For webhooks, we always return a 200 response to prevent retries
    // but we log the error for investigation
    res.status(200).json({
      received: true,
      processed: false,
      error: 'Webhook processing error'
    });
  }
}

/**
 * Sets up the transaction routes with their handlers and middleware
 * 
 * @returns Configured Express router
 */
export function setupRoutes(): Router {
  const router = Router();
  
  // Initialize transaction service
  const transactionService = new TransactionService();

  // POST /transactions - Create a new transaction
  router.post(
    '/',
    validateCreateTransaction,
    createTransaction
  );

  // GET /transactions/:id - Get transaction by ID
  router.get(
    '/:id',
    validateGetTransaction,
    getTransactionById
  );

  // GET /transactions - Get transactions based on query parameters
  router.get(
    '/',
    validateGetTransactions,
    getTransactions
  );

  // POST /transactions/:id/process - Process a payment for a transaction
  router.post(
    '/:id/process',
    validateGetTransaction,
    processPayment
  );

  // PATCH /transactions/:id/status - Update transaction status
  router.patch(
    '/:id/status',
    validateUpdateTransactionStatus,
    updateTransactionStatus
  );

  // POST /transactions/:id/refund - Process a refund for a transaction
  router.post(
    '/:id/refund',
    validateRefundTransaction,
    processRefund
  );

  // GET /transactions/summary/:type/:id - Get transaction summary
  router.get(
    '/summary/:type/:id',
    getTransactionSummary
  );

  // POST /webhooks/:provider - Handle webhooks from payment providers
  router.post(
    '/webhooks/:provider',
    handleWebhook
  );

  return router;
}