import { Transaction } from '../models/transaction.model';
import {
  ITransaction,
  ITransactionCreate,
  IPaymentResponse,
  TransactionType,
  TransactionStatus,
  PaymentProvider
} from '@shared/types/payment.types';
import { DatabaseError } from '@shared/errors/database.error';
import { ValidationError } from '@shared/errors/validation.error';
import { getPaymentProvider } from '../providers';
import { logger } from 'winston'; // v3.8.2
import { prisma } from '@prisma/client'; // v4.16.2

/**
 * Service class for managing financial transactions in the Tribe application
 */
export class TransactionService {
  private transactionRepository = prisma.transaction;

  /**
   * Initializes the transaction service with database connection
   */
  constructor() {
    logger.debug('TransactionService initialized');
  }

  /**
   * Creates a new transaction record
   * 
   * @param transactionData Data for the new transaction
   * @returns Created transaction
   */
  async createTransaction(transactionData: ITransactionCreate): Promise<Transaction> {
    try {
      // Create Transaction model instance with data
      const transaction = new Transaction(transactionData);
      
      // Validate the transaction model
      transaction.validate();

      // Save transaction to database with initial status INITIATED
      const createdTransaction = await this.transactionRepository.create({
        data: {
          id: transaction.id,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          description: transaction.description,
          userId: transaction.userId,
          paymentMethodId: transaction.paymentMethodId,
          provider: transaction.provider,
          providerTransactionId: transaction.providerTransactionId,
          eventId: transaction.eventId,
          splitId: transaction.splitId,
          refundedTransactionId: transaction.refundedTransactionId,
          metadata: transaction.metadata,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        }
      });

      logger.info('Transaction created', {
        transactionId: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency
      });

      return transaction;
    } catch (error) {
      logger.error('Error creating transaction', {
        error: error.message,
        stack: error.stack
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Retrieves a specific transaction by ID
   * 
   * @param id Transaction ID
   * @returns Transaction if found, null otherwise
   */
  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      // Query database for transaction with matching id
      const transaction = await this.transactionRepository.findUnique({
        where: { id }
      });

      // If not found, return null
      if (!transaction) {
        return null;
      }

      // Convert database record to Transaction model instance
      return Transaction.fromDatabase(transaction as ITransaction);
    } catch (error) {
      logger.error('Error retrieving transaction', {
        transactionId: id,
        error: error.message,
        stack: error.stack
      });
      
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Retrieves all transactions for a user
   * 
   * @param userId User ID
   * @param filters Optional filters (type, status, date range)
   * @returns Array of transactions
   */
  async getTransactionsByUser(
    userId: string,
    filters = {}
  ): Promise<IPaymentResponse[]> {
    try {
      // Prepare query filters (type, status, date range)
      const queryFilters: any = {
        userId,
        ...filters
      };

      // Add date range filter if provided
      if (filters['startDate'] && filters['endDate']) {
        queryFilters.createdAt = {
          gte: new Date(filters['startDate']),
          lte: new Date(filters['endDate'])
        };
        
        // Remove these from the main filter object as they're not direct DB fields
        delete queryFilters.startDate;
        delete queryFilters.endDate;
      }

      // Query database for transactions with matching userId and filters
      const transactions = await this.transactionRepository.findMany({
        where: queryFilters,
        orderBy: { createdAt: 'desc' }
      });

      // Convert database records to Transaction model instances
      const transactionModels = transactions.map(transaction => 
        Transaction.fromDatabase(transaction as ITransaction)
      );

      // Convert Transaction models to JSON responses
      return transactionModels.map(transaction => transaction.toJSON());
    } catch (error) {
      logger.error('Error retrieving user transactions', {
        userId,
        filters,
        error: error.message,
        stack: error.stack
      });
      
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Retrieves all transactions for an event
   * 
   * @param eventId Event ID
   * @returns Array of transactions
   */
  async getTransactionsByEvent(eventId: string): Promise<IPaymentResponse[]> {
    try {
      // Query database for transactions with matching eventId
      const transactions = await this.transactionRepository.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' }
      });

      // Convert database records to Transaction model instances
      const transactionModels = transactions.map(transaction => 
        Transaction.fromDatabase(transaction as ITransaction)
      );

      // Convert Transaction models to JSON responses
      return transactionModels.map(transaction => transaction.toJSON());
    } catch (error) {
      logger.error('Error retrieving event transactions', {
        eventId,
        error: error.message,
        stack: error.stack
      });
      
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Retrieves all transactions for a payment split
   * 
   * @param splitId Split ID
   * @returns Array of transactions
   */
  async getTransactionsBySplit(splitId: string): Promise<IPaymentResponse[]> {
    try {
      // Query database for transactions with matching splitId
      const transactions = await this.transactionRepository.findMany({
        where: { splitId },
        orderBy: { createdAt: 'desc' }
      });

      // Convert database records to Transaction model instances
      const transactionModels = transactions.map(transaction => 
        Transaction.fromDatabase(transaction as ITransaction)
      );

      // Convert Transaction models to JSON responses
      return transactionModels.map(transaction => transaction.toJSON());
    } catch (error) {
      logger.error('Error retrieving split transactions', {
        splitId,
        error: error.message,
        stack: error.stack
      });
      
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Processes a payment transaction using the appropriate payment provider
   * 
   * @param transactionId Transaction ID to process
   * @param paymentMethodId Payment method ID to use
   * @returns Updated transaction with payment result
   */
  async processPayment(
    transactionId: string,
    paymentMethodId: string
  ): Promise<Transaction> {
    try {
      // Retrieve transaction by ID
      const transaction = await this.getTransactionById(transactionId);
      
      // If not found, throw error
      if (!transaction) {
        throw DatabaseError.notFoundError('Transaction');
      }

      // Retrieve payment method by ID
      const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId }
      });

      // If not found, throw error
      if (!paymentMethod) {
        throw DatabaseError.notFoundError('Payment Method');
      }

      // Get appropriate payment provider based on payment method provider
      const paymentProvider = getPaymentProvider(paymentMethod.provider);

      // Process payment with provider
      const updatedTransaction = await paymentProvider.processPayment(
        transaction as ITransaction,
        paymentMethod
      );

      // Update transaction status based on payment result
      // Set provider transaction ID from payment provider response
      // Save updated transaction to database
      await this.transactionRepository.update({
        where: { id: transaction.id },
        data: {
          status: updatedTransaction.status,
          providerTransactionId: updatedTransaction.providerTransactionId,
          metadata: updatedTransaction.metadata,
          updatedAt: new Date()
        }
      });

      logger.info('Payment processed', {
        transactionId: transaction.id,
        paymentMethodId,
        provider: paymentMethod.provider,
        status: updatedTransaction.status
      });

      return updatedTransaction;
    } catch (error) {
      logger.error('Error processing payment', {
        transactionId,
        paymentMethodId,
        error: error.message,
        stack: error.stack
      });
      
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Updates the status of a transaction
   * 
   * @param id Transaction ID
   * @param status New transaction status
   * @returns Updated transaction
   */
  async updateTransactionStatus(
    id: string,
    status: TransactionStatus
  ): Promise<Transaction> {
    try {
      // Retrieve transaction by ID
      const transaction = await this.getTransactionById(id);
      
      // If not found, throw error
      if (!transaction) {
        throw DatabaseError.notFoundError('Transaction');
      }

      // Update transaction status using Transaction.updateStatus
      transaction.updateStatus(status);

      // Save updated transaction to database
      await this.transactionRepository.update({
        where: { id },
        data: {
          status: transaction.status,
          updatedAt: transaction.updatedAt
        }
      });

      logger.info('Transaction status updated', {
        transactionId: id,
        newStatus: status
      });

      return transaction;
    } catch (error) {
      logger.error('Error updating transaction status', {
        transactionId: id,
        status,
        error: error.message,
        stack: error.stack
      });
      
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      
      throw new Error(`Status update failed: ${error.message}`);
    }
  }

  /**
   * Processes a refund for a previous transaction
   * 
   * @param transactionId ID of the transaction to refund
   * @param reason Reason for the refund
   * @returns Refund transaction
   */
  async processRefund(
    transactionId: string,
    reason: string
  ): Promise<Transaction> {
    try {
      // Retrieve original transaction by ID
      const originalTransaction = await this.getTransactionById(transactionId);
      
      // If not found, throw error
      if (!originalTransaction) {
        throw DatabaseError.notFoundError('Transaction');
      }

      // Check if transaction is refundable
      if (!originalTransaction.isRefundable()) {
        throw ValidationError.invalidInput('Transaction is not eligible for refund');
      }

      // Create refund transaction using Transaction.processRefund
      const refundTransaction = originalTransaction.processRefund(reason);

      // Save refund transaction to database
      await this.transactionRepository.create({
        data: {
          id: refundTransaction.id,
          type: refundTransaction.type,
          status: refundTransaction.status,
          amount: refundTransaction.amount,
          currency: refundTransaction.currency,
          description: refundTransaction.description,
          userId: refundTransaction.userId,
          paymentMethodId: refundTransaction.paymentMethodId,
          provider: refundTransaction.provider,
          providerTransactionId: refundTransaction.providerTransactionId,
          eventId: refundTransaction.eventId,
          splitId: refundTransaction.splitId,
          refundedTransactionId: refundTransaction.refundedTransactionId,
          metadata: refundTransaction.metadata,
          createdAt: refundTransaction.createdAt,
          updatedAt: refundTransaction.updatedAt
        }
      });

      // Get appropriate payment provider based on original transaction provider
      const paymentProvider = getPaymentProvider(originalTransaction.provider);

      // Process refund with provider
      const updatedRefundTransaction = await paymentProvider.processRefund(
        refundTransaction as ITransaction,
        originalTransaction as ITransaction
      );

      // Update refund transaction status based on refund result
      await this.transactionRepository.update({
        where: { id: refundTransaction.id },
        data: {
          status: updatedRefundTransaction.status,
          providerTransactionId: updatedRefundTransaction.providerTransactionId,
          metadata: updatedRefundTransaction.metadata,
          updatedAt: new Date()
        }
      });

      // Update original transaction status to REFUNDED
      await this.updateTransactionStatus(originalTransaction.id, TransactionStatus.REFUNDED);

      logger.info('Refund processed', {
        originalTransactionId: originalTransaction.id,
        refundTransactionId: refundTransaction.id,
        amount: refundTransaction.amount,
        reason
      });

      return updatedRefundTransaction;
    } catch (error) {
      logger.error('Error processing refund', {
        transactionId,
        reason,
        error: error.message,
        stack: error.stack
      });
      
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }

  /**
   * Gets a summary of transactions for a user, event, or split
   * 
   * @param id User, event, or split ID
   * @param type Type of entity ('user', 'event', 'split')
   * @returns Transaction summary statistics
   */
  async getTransactionSummary(id: string, type: string): Promise<object> {
    try {
      let transactions: ITransaction[] = [];

      // If type is 'user', get all transactions for the user
      if (type.toLowerCase() === 'user') {
        const userTransactions = await this.getTransactionsByUser(id);
        transactions = userTransactions as unknown as ITransaction[];
      } 
      // If type is 'event', get all transactions for the event
      else if (type.toLowerCase() === 'event') {
        const eventTransactions = await this.getTransactionsByEvent(id);
        transactions = eventTransactions as unknown as ITransaction[];
      } 
      // If type is 'split', get all transactions for the split
      else if (type.toLowerCase() === 'split') {
        const splitTransactions = await this.getTransactionsBySplit(id);
        transactions = splitTransactions as unknown as ITransaction[];
      } else {
        throw ValidationError.invalidEnum('type', ['user', 'event', 'split']);
      }

      // Calculate total amount, count by status, count by type
      const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      
      // Count by status
      const countByStatus = transactions.reduce((counts, transaction) => {
        counts[transaction.status] = (counts[transaction.status] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      
      // Count by type
      const countByType = transactions.reduce((counts, transaction) => {
        counts[transaction.type] = (counts[transaction.type] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      
      // Calculate average transaction amount
      const averageAmount = transactions.length > 0 
        ? totalAmount / transactions.length 
        : 0;

      // Return summary object with statistics
      return {
        totalTransactions: transactions.length,
        totalAmount,
        averageAmount,
        countByStatus,
        countByType,
        currency: transactions.length > 0 ? transactions[0].currency : 'USD',
        period: {
          start: transactions.length > 0 
            ? new Date(Math.min(...transactions.map(t => new Date(t.createdAt).getTime())))
            : null,
          end: transactions.length > 0 
            ? new Date(Math.max(...transactions.map(t => new Date(t.createdAt).getTime())))
            : null,
        }
      };
    } catch (error) {
      logger.error('Error generating transaction summary', {
        id,
        type,
        error: error.message,
        stack: error.stack
      });
      
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      
      throw new Error(`Failed to generate transaction summary: ${error.message}`);
    }
  }

  /**
   * Checks the current status of a transaction with the payment provider
   * 
   * @param id Transaction ID
   * @returns Current status of the transaction
   */
  async checkTransactionStatus(id: string): Promise<TransactionStatus> {
    try {
      // Retrieve transaction by ID
      const transaction = await this.getTransactionById(id);
      
      // If not found, throw error
      if (!transaction) {
        throw DatabaseError.notFoundError('Transaction');
      }

      // If no provider transaction ID, return current status
      if (!transaction.providerTransactionId) {
        return transaction.status;
      }

      // Get appropriate payment provider based on transaction provider
      const paymentProvider = getPaymentProvider(transaction.provider);

      // Check transaction status with provider
      const currentStatus = await paymentProvider.getPaymentStatus(
        transaction.providerTransactionId
      );

      // If status has changed, update transaction in database
      if (currentStatus !== transaction.status) {
        await this.updateTransactionStatus(id, currentStatus);
      }

      logger.info('Transaction status checked with provider', {
        transactionId: id,
        provider: transaction.provider,
        status: currentStatus
      });

      return currentStatus;
    } catch (error) {
      logger.error('Error checking transaction status', {
        transactionId: id,
        error: error.message,
        stack: error.stack
      });
      
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      
      throw new Error(`Failed to check transaction status: ${error.message}`);
    }
  }

  /**
   * Processes payment provider webhook events
   * 
   * @param provider Payment provider name (stripe, venmo)
   * @param payload Raw webhook payload
   * @param signature Webhook signature for verification
   * @returns True if webhook was processed successfully
   */
  async handleWebhook(
    provider: string,
    payload: string,
    signature: string
  ): Promise<boolean> {
    try {
      // Get appropriate payment provider based on provider parameter
      const paymentProvider = getPaymentProvider(provider as PaymentProvider);

      // Process webhook with provider to verify and parse event
      const webhookEvent = await paymentProvider.handleWebhook(payload, signature);

      logger.info('Webhook received from payment provider', {
        provider,
        eventType: webhookEvent.eventType,
        eventId: webhookEvent.id
      });

      // Extract provider transaction ID from webhook data
      const providerTransactionId = webhookEvent.data.paymentIntentId || 
                                    webhookEvent.data.paymentId || 
                                    webhookEvent.data.id;

      if (!providerTransactionId) {
        logger.warn('Unable to extract provider transaction ID from webhook', {
          provider,
          eventType: webhookEvent.eventType
        });
        return false;
      }

      // Find transaction with matching provider transaction ID
      const transaction = await this.transactionRepository.findFirst({
        where: { providerTransactionId: providerTransactionId.toString() }
      });

      // If not found, log warning and return false
      if (!transaction) {
        logger.warn('No matching transaction found for webhook', {
          provider,
          providerTransactionId
        });
        return false;
      }

      // Update transaction status based on webhook event type
      let newStatus: TransactionStatus | null = null;

      switch (webhookEvent.eventType) {
        case 'payment.succeeded':
          newStatus = TransactionStatus.COMPLETED;
          break;
        case 'payment.failed':
          newStatus = TransactionStatus.FAILED;
          break;
        case 'payment.processing':
          newStatus = TransactionStatus.PROCESSING;
          break;
        case 'payment.canceled':
          newStatus = TransactionStatus.CANCELLED;
          break;
        case 'payment.refunded':
          newStatus = TransactionStatus.REFUNDED;
          break;
        default:
          logger.info('Webhook event type does not require status update', {
            eventType: webhookEvent.eventType
          });
      }

      // Update transaction status if needed
      if (newStatus && newStatus !== transaction.status) {
        await this.updateTransactionStatus(transaction.id, newStatus);
      }

      // If event is for a split payment, update split status
      if (transaction.splitId && newStatus === TransactionStatus.COMPLETED) {
        await this.updateSplitStatus(transaction.splitId);
      }

      logger.info('Webhook processed successfully', {
        provider,
        transactionId: transaction.id,
        eventType: webhookEvent.eventType
      });

      return true;
    } catch (error) {
      logger.error('Error processing webhook', {
        provider,
        error: error.message,
        stack: error.stack
      });
      
      return false;
    }
  }

  /**
   * Updates the status of a payment split based on its transactions
   * 
   * @param splitId Payment split ID
   * @private
   */
  private async updateSplitStatus(splitId: string): Promise<void> {
    try {
      // Get all transactions for the split
      const transactions = await this.transactionRepository.findMany({
        where: { splitId }
      });

      // Check if all transactions are completed
      const allCompleted = transactions.every(
        transaction => transaction.status === TransactionStatus.COMPLETED
      );
      
      // Check if any transactions are completed (partial payment)
      const anyCompleted = transactions.some(
        transaction => transaction.status === TransactionStatus.COMPLETED
      );

      // Update split status accordingly
      if (allCompleted) {
        await prisma.paymentSplit.update({
          where: { id: splitId },
          data: { status: 'COMPLETED' }
        });
      } else if (anyCompleted) {
        await prisma.paymentSplit.update({
          where: { id: splitId },
          data: { status: 'PARTIAL' }
        });
      }
    } catch (error) {
      logger.error('Error updating split status', {
        splitId,
        error: error.message
      });
      // Don't throw error to prevent blocking webhook processing
    }
  }
}