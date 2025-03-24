import { PrismaClient } from '@prisma/client'; // v4.16.2
import { logger } from 'winston'; // v3.8.2

import { Payment } from '../models/payment.model';
import {
  IPaymentMethod,
  IPaymentMethodCreate,
  IPaymentMethodResponse,
  PaymentProvider,
  PaymentMethod
} from '@shared/types/payment.types';
import { DatabaseError } from '@shared/errors/database.error';
import { ValidationError } from '@shared/errors/validation.error';
import { getPaymentProvider } from '../providers';

/**
 * Service class for managing payment methods in the Tribe application
 */
export class PaymentService {
  private paymentMethodRepository;

  /**
   * Initializes the payment service with database connection
   */
  constructor() {
    const prisma = new PrismaClient();
    this.paymentMethodRepository = prisma.paymentMethod;
    
    logger.info('PaymentService initialized');
  }

  /**
   * Creates a new payment method for a user
   * 
   * @param paymentMethodData Data for creating a new payment method
   * @returns Created payment method
   */
  async createPaymentMethod(paymentMethodData: IPaymentMethodCreate): Promise<IPaymentMethodResponse> {
    try {
      // Create Payment model instance with data
      const payment = new Payment(paymentMethodData);
      
      // Validate the payment method
      payment.validate();
      
      // Get appropriate payment provider based on provider type
      const provider = getPaymentProvider(payment.provider);
      
      // Process payment method with provider (tokenization, verification)
      if (payment.type === PaymentMethod.CREDIT_CARD || payment.type === PaymentMethod.DEBIT_CARD) {
        // For cards, process card tokenization
        const { token, last4, expiryMonth, expiryYear } = await this.processCardTokenization(
          paymentMethodData['cardDetails'],
          provider
        );
        
        // Update payment with token and card details
        payment.token = token;
        payment.setCardDetails(last4, expiryMonth, expiryYear);
      } else if (payment.type === PaymentMethod.VENMO_BALANCE) {
        // For Venmo, process account linking
        const { token, last4 } = await this.processVenmoLinking(paymentMethodData['venmoDetails']);
        
        // Update payment with token and account details
        payment.token = token;
        payment.last4 = last4;
      }
      
      // If this is set as default, update existing payment methods
      if (payment.isDefault) {
        await this.paymentMethodRepository.updateMany({
          where: {
            userId: payment.userId,
            isDefault: true
          },
          data: {
            isDefault: false
          }
        });
      }
      
      // Save payment method to database
      const dbPaymentMethod = await this.paymentMethodRepository.create({
        data: {
          id: payment.id,
          userId: payment.userId,
          provider: payment.provider,
          type: payment.type,
          token: payment.token,
          last4: payment.last4,
          expiryMonth: payment.expiryMonth,
          expiryYear: payment.expiryYear,
          isDefault: payment.isDefault,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        }
      });
      
      logger.info('Created payment method', { paymentMethodId: payment.id, userId: payment.userId });
      
      // Return payment method response
      return payment.toJSON();
    } catch (error) {
      logger.error('Error creating payment method', { error: error.message, userId: paymentMethodData.userId });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Retrieves a specific payment method by ID
   * 
   * @param id Payment method ID
   * @returns Payment method if found, null otherwise
   */
  async getPaymentMethodById(id: string): Promise<Payment | null> {
    try {
      // Query database for payment method
      const paymentMethod = await this.paymentMethodRepository.findUnique({
        where: { id }
      });
      
      // If not found, return null
      if (!paymentMethod) {
        return null;
      }
      
      // Convert to Payment model instance
      return Payment.fromDatabase(paymentMethod);
    } catch (error) {
      logger.error('Error retrieving payment method', { error: error.message, paymentMethodId: id });
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Retrieves all payment methods for a user
   * 
   * @param userId User ID
   * @returns Array of payment methods
   */
  async getPaymentMethodsByUser(userId: string): Promise<IPaymentMethodResponse[]> {
    try {
      // Query database for user's payment methods
      const paymentMethods = await this.paymentMethodRepository.findMany({
        where: { userId },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      
      // Convert to Payment model instances and then to JSON responses
      return paymentMethods.map(pm => Payment.fromDatabase(pm).toJSON());
    } catch (error) {
      logger.error('Error retrieving user payment methods', { error: error.message, userId });
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Updates a payment method
   * 
   * @param id Payment method ID
   * @param updateData Data to update
   * @returns Updated payment method
   */
  async updatePaymentMethod(
    id: string, 
    updateData: Partial<IPaymentMethodCreate>
  ): Promise<IPaymentMethodResponse> {
    try {
      // Get the existing payment method
      const existingPayment = await this.getPaymentMethodById(id);
      
      if (!existingPayment) {
        throw DatabaseError.notFoundError('Payment method');
      }
      
      // Update fields based on updateData
      if (updateData.isDefault !== undefined) {
        existingPayment.setDefault(updateData.isDefault);
      }
      
      // If setting as default, update other payment methods
      if (updateData.isDefault === true) {
        await this.paymentMethodRepository.updateMany({
          where: {
            userId: existingPayment.userId,
            id: { not: id },
            isDefault: true
          },
          data: {
            isDefault: false
          }
        });
      }
      
      // Update payment method in database
      await this.paymentMethodRepository.update({
        where: { id },
        data: {
          isDefault: existingPayment.isDefault,
          updatedAt: new Date()
        }
      });
      
      logger.info('Updated payment method', { paymentMethodId: id });
      
      // Return updated payment method
      return existingPayment.toJSON();
    } catch (error) {
      logger.error('Error updating payment method', { error: error.message, paymentMethodId: id });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Deletes a payment method
   * 
   * @param id Payment method ID
   * @returns True if deletion was successful
   */
  async deletePaymentMethod(id: string): Promise<boolean> {
    try {
      // Get the existing payment method
      const paymentMethod = await this.getPaymentMethodById(id);
      
      if (!paymentMethod) {
        throw DatabaseError.notFoundError('Payment method');
      }
      
      // Get appropriate provider for deletion
      const provider = getPaymentProvider(paymentMethod.provider);
      
      // Delete payment method with provider if needed
      await provider.deletePaymentMethod(paymentMethod.token);
      
      // Delete from database
      await this.paymentMethodRepository.delete({
        where: { id }
      });
      
      logger.info('Deleted payment method', { paymentMethodId: id, userId: paymentMethod.userId });
      
      return true;
    } catch (error) {
      logger.error('Error deleting payment method', { error: error.message, paymentMethodId: id });
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Sets a payment method as the default for a user
   * 
   * @param id Payment method ID
   * @param userId User ID
   * @returns Updated payment method
   */
  async setDefaultPaymentMethod(id: string, userId: string): Promise<IPaymentMethodResponse> {
    try {
      // Begin database transaction
      const prisma = new PrismaClient();
      
      return await prisma.$transaction(async (tx) => {
        // Update all user's payment methods to not be default
        await tx.paymentMethod.updateMany({
          where: {
            userId,
            isDefault: true
          },
          data: {
            isDefault: false,
            updatedAt: new Date()
          }
        });
        
        // Retrieve payment method by ID
        const paymentMethod = await tx.paymentMethod.findUnique({
          where: { id }
        });
        
        if (!paymentMethod) {
          throw DatabaseError.notFoundError('Payment method');
        }
        
        // Set payment method as default
        await tx.paymentMethod.update({
          where: { id },
          data: {
            isDefault: true,
            updatedAt: new Date()
          }
        });
        
        // Get updated payment method
        const updatedPaymentMethod = await tx.paymentMethod.findUnique({
          where: { id }
        });
        
        logger.info('Set default payment method', { paymentMethodId: id, userId });
        
        // Return updated payment method
        return Payment.fromDatabase(updatedPaymentMethod).toJSON();
      });
    } catch (error) {
      logger.error('Error setting default payment method', { 
        error: error.message, 
        paymentMethodId: id, 
        userId 
      });
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Gets the default payment method for a user
   * 
   * @param userId User ID
   * @returns Default payment method if exists, null otherwise
   */
  async getDefaultPaymentMethod(userId: string): Promise<IPaymentMethodResponse | null> {
    try {
      // Query database for payment method with matching userId and isDefault=true
      const paymentMethod = await this.paymentMethodRepository.findFirst({
        where: {
          userId,
          isDefault: true
        }
      });
      
      // If not found, return null
      if (!paymentMethod) {
        return null;
      }
      
      // Convert database record to Payment model instance
      return Payment.fromDatabase(paymentMethod).toJSON();
    } catch (error) {
      logger.error('Error retrieving default payment method', { error: error.message, userId });
      throw DatabaseError.fromPrismaError(error);
    }
  }

  /**
   * Validates a payment method with the provider
   * 
   * @param id Payment method ID
   * @returns True if payment method is valid
   */
  async validatePaymentMethod(id: string): Promise<boolean> {
    try {
      // Retrieve payment method by ID
      const paymentMethod = await this.getPaymentMethodById(id);
      
      if (!paymentMethod) {
        throw DatabaseError.notFoundError('Payment method');
      }
      
      // Check if card is expired
      if (paymentMethod.isExpired()) {
        return false;
      }
      
      // Get appropriate payment provider based on payment method provider
      const provider = getPaymentProvider(paymentMethod.provider);
      
      // Validate payment method with provider
      await provider.getPaymentMethod(paymentMethod.token);
      
      return true;
    } catch (error) {
      logger.error('Error validating payment method', { error: error.message, paymentMethodId: id });
      return false;
    }
  }

  /**
   * Processes card tokenization with the payment provider
   * 
   * @param cardDetails Card details for tokenization
   * @param provider Payment provider to use
   * @returns Tokenized card details
   */
  async processCardTokenization(
    cardDetails: object,
    provider: PaymentProvider
  ): Promise<{ token: string, last4: string, expiryMonth: number, expiryYear: number }> {
    try {
      // Get appropriate payment provider based on provider type
      return await provider.createPaymentMethod(cardDetails);
    } catch (error) {
      logger.error('Error processing card tokenization', { error: error.message });
      throw new Error(`Card tokenization failed: ${error.message}`);
    }
  }

  /**
   * Processes Venmo account linking
   * 
   * @param venmoDetails Venmo account details
   * @returns Linked Venmo account details
   */
  async processVenmoLinking(venmoDetails: object): Promise<{ token: string, last4: string }> {
    try {
      // Get Venmo provider
      const provider = getPaymentProvider(PaymentProvider.VENMO);
      
      // Call provider's createPaymentMethod method with Venmo account details
      return await provider.createPaymentMethod(venmoDetails);
    } catch (error) {
      logger.error('Error processing Venmo linking', { error: error.message });
      throw new Error(`Venmo linking failed: ${error.message}`);
    }
  }
}