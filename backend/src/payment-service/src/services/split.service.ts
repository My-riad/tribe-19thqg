import { PaymentSplit } from '../models/split.model';
import { 
  IPaymentSplit, 
  IPaymentSplitCreate, 
  IPaymentSplitResponse, 
  IPaymentShare, 
  SplitType, 
  SplitStatus, 
  PaymentStatus 
} from '@shared/types/payment.types';
import { DatabaseError } from '@shared/errors/database.error';
import { ValidationError } from '@shared/errors/validation.error';
import { TransactionService } from './transaction.service';
import { logger } from 'winston'; // v3.8.2
import { PrismaClient } from '@prisma/client'; // v4.16.2

/**
 * Service class for managing payment splits in the Tribe application
 */
export class SplitService {
  private splitRepository;
  private shareRepository;
  private transactionService: TransactionService;
  private prisma: PrismaClient;

  /**
   * Initializes the split service with database connection and transaction service
   * 
   * @param transactionService Service for managing transactions related to splits
   */
  constructor(transactionService: TransactionService) {
    this.prisma = new PrismaClient();
    this.splitRepository = this.prisma.paymentSplit;
    this.shareRepository = this.prisma.paymentShare;
    this.transactionService = transactionService;
    logger.debug('SplitService initialized');
  }

  /**
   * Creates a new payment split
   * 
   * @param splitData Data for the new payment split
   * @returns Created payment split
   */
  async createSplit(splitData: IPaymentSplitCreate): Promise<IPaymentSplitResponse> {
    try {
      // Create PaymentSplit model instance with data
      const paymentSplit = new PaymentSplit(splitData);
      
      // Calculate shares based on participants and split type
      paymentSplit.calculateShares(splitData.participants);
      
      // Validate the payment split model
      paymentSplit.validate();

      // Begin database transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Save payment split to database
        const createdSplit = await tx.paymentSplit.create({
          data: {
            id: paymentSplit.id,
            eventId: paymentSplit.eventId,
            createdBy: paymentSplit.createdBy,
            description: paymentSplit.description,
            totalAmount: paymentSplit.totalAmount,
            currency: paymentSplit.currency,
            splitType: paymentSplit.splitType,
            status: paymentSplit.status,
            dueDate: paymentSplit.dueDate,
            metadata: paymentSplit.metadata,
            createdAt: paymentSplit.createdAt,
            updatedAt: paymentSplit.updatedAt
          }
        });

        // Save payment shares to database
        for (const share of paymentSplit.shares) {
          await tx.paymentShare.create({
            data: {
              id: share.id,
              splitId: share.splitId,
              userId: share.userId,
              amount: share.amount,
              percentage: share.percentage,
              status: share.status
            }
          });
        }

        return createdSplit;
      });

      logger.info('Payment split created', {
        splitId: paymentSplit.id,
        eventId: paymentSplit.eventId,
        totalAmount: paymentSplit.totalAmount,
        sharesCount: paymentSplit.shares.length
      });

      // Return the created payment split as a response object
      return paymentSplit.toJSON();
    } catch (error) {
      logger.error('Error creating payment split', {
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
   * Retrieves a specific payment split by ID
   * 
   * @param id Split ID
   * @returns Payment split if found, null otherwise
   */
  async getSplitById(id: string): Promise<PaymentSplit | null> {
    try {
      // Query database for payment split with matching id
      const split = await this.splitRepository.findUnique({
        where: { id }
      });

      // If not found, return null
      if (!split) {
        return null;
      }

      // Query database for payment shares associated with the split
      const shares = await this.shareRepository.findMany({
        where: { splitId: id }
      });

      // Convert database record to PaymentSplit model instance
      const splitData = {
        ...split,
        shares: shares
      } as IPaymentSplit;

      return PaymentSplit.fromDatabase(splitData);
    } catch (error) {
      logger.error('Error retrieving payment split', {
        splitId: id,
        error: error.message,
        stack: error.stack
      });
      
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Retrieves all payment splits for an event
   * 
   * @param eventId Event ID
   * @returns Array of payment splits
   */
  async getSplitsByEvent(eventId: string): Promise<IPaymentSplitResponse[]> {
    try {
      // Query database for payment splits with matching eventId
      const splits = await this.splitRepository.findMany({
        where: { eventId }
      });

      // If no splits found, return empty array
      if (splits.length === 0) {
        return [];
      }

      // Build array of PaymentSplit model instances
      const paymentSplits: PaymentSplit[] = [];

      // For each split, query associated payment shares
      for (const split of splits) {
        const shares = await this.shareRepository.findMany({
          where: { splitId: split.id }
        });

        // Convert database record to PaymentSplit model instance
        const splitData = {
          ...split,
          shares: shares
        } as IPaymentSplit;

        paymentSplits.push(PaymentSplit.fromDatabase(splitData));
      }

      // Convert PaymentSplit models to JSON responses
      return paymentSplits.map(split => split.toJSON());
    } catch (error) {
      logger.error('Error retrieving event payment splits', {
        eventId,
        error: error.message,
        stack: error.stack
      });
      
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Retrieves all payment splits for a user
   * 
   * @param userId User ID
   * @returns Array of payment splits
   */
  async getSplitsByUser(userId: string): Promise<IPaymentSplitResponse[]> {
    try {
      // Query database for payment shares with matching userId
      const shares = await this.shareRepository.findMany({
        where: { userId }
      });

      // Extract splitIds from the shares
      const splitIds = [...new Set(shares.map(share => share.splitId))];

      // If no splits found, return empty array
      if (splitIds.length === 0) {
        return [];
      }

      // Query database for payment splits with matching ids
      const splits = await this.splitRepository.findMany({
        where: { id: { in: splitIds } }
      });

      // Build array of PaymentSplit model instances
      const paymentSplits: PaymentSplit[] = [];

      // For each split, get all associated payment shares
      for (const split of splits) {
        const allShares = await this.shareRepository.findMany({
          where: { splitId: split.id }
        });

        // Convert database record to PaymentSplit model instance
        const splitData = {
          ...split,
          shares: allShares
        } as IPaymentSplit;

        paymentSplits.push(PaymentSplit.fromDatabase(splitData));
      }

      // Convert PaymentSplit models to JSON responses
      return paymentSplits.map(split => split.toJSON());
    } catch (error) {
      logger.error('Error retrieving user payment splits', {
        userId,
        error: error.message,
        stack: error.stack
      });
      
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Updates the status of a payment split based on share statuses
   * 
   * @param id Split ID
   * @returns Updated status of the payment split
   */
  async updateSplitStatus(id: string): Promise<SplitStatus> {
    try {
      // Retrieve payment split by ID
      const split = await this.getSplitById(id);
      
      // If not found, throw error
      if (!split) {
        throw DatabaseError.notFoundError('Payment Split');
      }

      // Update split status using PaymentSplit.updateStatus
      const newStatus = split.updateStatus();

      // Save updated payment split to database
      await this.splitRepository.update({
        where: { id },
        data: {
          status: newStatus,
          updatedAt: split.updatedAt
        }
      });

      logger.info('Payment split status updated', {
        splitId: id,
        newStatus
      });

      return newStatus;
    } catch (error) {
      logger.error('Error updating payment split status', {
        splitId: id,
        error: error.message,
        stack: error.stack
      });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new Error(`Failed to update split status: ${error.message}`);
    }
  }

  /**
   * Processes a payment for a user's share in a split
   * 
   * @param splitId Split ID
   * @param userId User ID
   * @param paymentMethodId Payment method ID to use for the payment
   * @returns True if payment was processed successfully
   */
  async processSharePayment(splitId: string, userId: string, paymentMethodId: string): Promise<boolean> {
    try {
      // Retrieve payment split by ID
      const split = await this.getSplitById(splitId);
      
      // If not found, throw error
      if (!split) {
        throw DatabaseError.notFoundError('Payment Split');
      }

      // Find the user's share in the split
      const userShare = split.shares.find(share => share.userId === userId);
      
      // If share not found or already paid, throw error
      if (!userShare) {
        throw ValidationError.invalidInput(`User ${userId} is not part of this payment split`);
      }
      
      if (userShare.status === PaymentStatus.COMPLETED) {
        throw ValidationError.invalidInput('This share has already been paid');
      }

      // Create transaction for the share payment
      const transaction = await this.transactionService.createTransaction({
        type: 'SPLIT_PAYMENT',
        amount: userShare.amount,
        currency: split.currency,
        description: `Payment for ${split.description}`,
        userId: userId,
        paymentMethodId: paymentMethodId,
        provider: 'STRIPE', // Default to STRIPE, could be parameterized
        eventId: split.eventId,
        splitId: splitId,
        metadata: {
          shareId: userShare.id,
          splitDescription: split.description
        }
      });

      // Process payment using transactionService
      const paymentResult = await this.transactionService.processPayment(
        transaction.id,
        paymentMethodId
      );

      // If payment successful, update share status to COMPLETED
      if (paymentResult.status === 'COMPLETED') {
        // Update share status
        await this.shareRepository.update({
          where: { id: userShare.id },
          data: {
            status: PaymentStatus.COMPLETED
          }
        });

        // Update split status based on all shares
        await this.updateSplitStatus(splitId);

        logger.info('Share payment processed successfully', {
          splitId,
          userId,
          amount: userShare.amount
        });

        return true;
      } else {
        logger.warn('Share payment processing incomplete', {
          splitId,
          userId,
          transactionStatus: paymentResult.status
        });

        return false;
      }
    } catch (error) {
      logger.error('Error processing share payment', {
        splitId,
        userId,
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
   * Cancels a payment split
   * 
   * @param id Split ID
   * @returns True if the split was cancelled successfully
   */
  async cancelSplit(id: string): Promise<boolean> {
    try {
      // Retrieve payment split by ID
      const split = await this.getSplitById(id);
      
      // If not found, throw error
      if (!split) {
        throw DatabaseError.notFoundError('Payment Split');
      }

      // Check if the split can be cancelled (not already completed)
      if (split.status === SplitStatus.COMPLETED) {
        throw ValidationError.invalidInput('Cannot cancel a completed payment split');
      }

      // Update split status to CANCELLED
      split.cancel();

      // Begin database transaction
      await this.prisma.$transaction(async (tx) => {
        // Update payment split status
        await tx.paymentSplit.update({
          where: { id },
          data: {
            status: SplitStatus.CANCELLED,
            updatedAt: new Date()
          }
        });

        // Update all pending shares to FAILED
        await tx.paymentShare.updateMany({
          where: { 
            splitId: id,
            status: PaymentStatus.PENDING
          },
          data: {
            status: PaymentStatus.FAILED
          }
        });
      });

      logger.info('Payment split cancelled', {
        splitId: id
      });

      return true;
    } catch (error) {
      logger.error('Error cancelling payment split', {
        splitId: id,
        error: error.message,
        stack: error.stack
      });
      
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      
      throw new Error(`Failed to cancel payment split: ${error.message}`);
    }
  }

  /**
   * Gets statistics about payment splits for an event or user
   * 
   * @param id ID of the event or user
   * @param type Type of entity ('event' or 'user')
   * @returns Statistics about payment splits
   */
  async getSplitStatistics(id: string, type: string): Promise<object> {
    try {
      let splits: IPaymentSplitResponse[] = [];

      // If type is 'event', get all splits for the event
      if (type.toLowerCase() === 'event') {
        splits = await this.getSplitsByEvent(id);
      } 
      // If type is 'user', get all splits for the user
      else if (type.toLowerCase() === 'user') {
        splits = await this.getSplitsByUser(id);
      } else {
        throw ValidationError.invalidEnum('type', ['event', 'user']);
      }

      // If no splits found, return empty statistics
      if (splits.length === 0) {
        return {
          totalSplits: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          splitsByStatus: {},
          averageSplitAmount: 0
        };
      }

      // Calculate total amount across all splits
      const totalAmount = splits.reduce((sum, split) => sum + split.totalAmount, 0);

      // Calculate amounts by status
      const paidAmount = splits.reduce((sum, split) => {
        const paidShares = split.shares.filter(share => share.status === PaymentStatus.COMPLETED);
        return sum + paidShares.reduce((shareSum, share) => shareSum + share.amount, 0);
      }, 0);

      const pendingAmount = totalAmount - paidAmount;

      // Count splits by status
      const splitsByStatus = splits.reduce((counts, split) => {
        counts[split.status] = (counts[split.status] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      // Calculate average split amount
      const averageSplitAmount = totalAmount / splits.length;

      // Return statistics object
      return {
        totalSplits: splits.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        splitsByStatus,
        averageSplitAmount,
        currency: splits[0].currency // Assuming all splits use the same currency
      };
    } catch (error) {
      logger.error('Error generating split statistics', {
        id,
        type,
        error: error.message,
        stack: error.stack
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(`Failed to generate split statistics: ${error.message}`);
    }
  }

  /**
   * Sends reminders for pending payments in a split
   * 
   * @param splitId Split ID
   * @returns True if reminders were sent successfully
   */
  async remindPendingPayments(splitId: string): Promise<boolean> {
    try {
      // Retrieve payment split by ID
      const split = await this.getSplitById(splitId);
      
      // If not found, throw error
      if (!split) {
        throw DatabaseError.notFoundError('Payment Split');
      }

      // Filter shares with PENDING status
      const pendingShares = split.shares.filter(share => share.status === PaymentStatus.PENDING);
      
      if (pendingShares.length === 0) {
        logger.info('No pending payments to remind', { splitId });
        return true;
      }

      // In a real implementation, we would integrate with notification service
      // For now, we'll just log and update the split metadata to record reminder sent
      logger.info('Sending payment reminders', { 
        splitId, 
        pendingCount: pendingShares.length 
      });

      // Update split metadata to record reminder sent
      const metadata = {
        ...split.metadata,
        reminders: [
          ...(split.metadata?.reminders || []),
          {
            timestamp: new Date().toISOString(),
            userCount: pendingShares.length,
            users: pendingShares.map(share => share.userId)
          }
        ]
      };

      // Save updated payment split to database
      await this.splitRepository.update({
        where: { id: splitId },
        data: {
          metadata,
          updatedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      logger.error('Error sending payment reminders', {
        splitId,
        error: error.message,
        stack: error.stack
      });
      
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      
      throw new Error(`Failed to send payment reminders: ${error.message}`);
    }
  }

  /**
   * Gets a summary of a payment split with user details
   * 
   * @param id Split ID
   * @returns Detailed summary of the payment split
   */
  async getSplitSummary(id: string): Promise<object> {
    try {
      // Retrieve payment split by ID
      const split = await this.getSplitById(id);
      
      // If not found, throw error
      if (!split) {
        throw DatabaseError.notFoundError('Payment Split');
      }

      // Get transactions associated with the split
      const transactions = await this.transactionService.getTransactionsBySplit(id);

      // Get user details for each share participant
      // In a real implementation, we would call a user service to get this information
      // For now, we'll simulate that with placeholder data
      const sharesWithUserInfo = await Promise.all(split.shares.map(async (share) => {
        // Placeholder for user service call
        const userInfo = {
          userId: share.userId,
          name: `User ${share.userId.substring(0, 5)}`, // Placeholder
          avatar: `https://avatars.example.com/${share.userId}` // Placeholder
        };

        // Find transactions for this share
        const shareTransactions = transactions.filter(transaction => 
          transaction.metadata && transaction.metadata.shareId === share.id
        );

        return {
          ...share,
          user: userInfo,
          transactions: shareTransactions
        };
      }));

      // Calculate payment status statistics
      const paidShares = split.shares.filter(share => share.status === PaymentStatus.COMPLETED);
      const paidAmount = paidShares.reduce((sum, share) => sum + share.amount, 0);
      const pendingAmount = split.totalAmount - paidAmount;
      const completionPercentage = split.getCompletionPercentage();

      // Format response with split details, shares with user info, and payment status
      return {
        id: split.id,
        eventId: split.eventId,
        description: split.description,
        totalAmount: split.totalAmount,
        currency: split.currency,
        splitType: split.splitType,
        status: split.status,
        dueDate: split.dueDate,
        createdAt: split.createdAt,
        updatedAt: split.updatedAt,
        paymentStatus: {
          paidAmount,
          pendingAmount,
          completionPercentage,
          paidSharesCount: paidShares.length,
          totalSharesCount: split.shares.length
        },
        shares: sharesWithUserInfo,
        createdBy: split.createdBy
      };
    } catch (error) {
      logger.error('Error generating split summary', {
        splitId: id,
        error: error.message,
        stack: error.stack
      });
      
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      
      throw new Error(`Failed to generate split summary: ${error.message}`);
    }
  }
}