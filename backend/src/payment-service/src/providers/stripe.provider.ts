import Stripe from 'stripe'; // v12.0.0
import { logger } from 'winston'; // v3.8.2
import config from 'config'; // v3.3.9

import {
  IPaymentMethod,
  ITransaction,
  IStripePaymentIntent,
  IPaymentWebhookEvent,
  PaymentProvider,
  TransactionStatus
} from '@shared/types/payment.types';
import { Transaction } from '../models/transaction.model';
import { Payment } from '../models/payment.model';

/**
 * Implementation of the payment provider interface for Stripe payment processing
 */
export class StripeProvider {
  private apiKey: string;
  private webhookSecret: string;
  private stripeClient: Stripe;

  /**
   * Initializes the Stripe provider with API credentials from configuration
   */
  constructor() {
    // Load Stripe API key from configuration
    this.apiKey = config.get<string>('payment.stripe.apiKey');
    
    // Load Stripe webhook secret from configuration
    this.webhookSecret = config.get<string>('payment.stripe.webhookSecret');
    
    // Initialize Stripe client with API key
    this.stripeClient = new Stripe(this.apiKey, {
      apiVersion: '2023-10-16', // Use a specific API version for stability
    });
    
    // Validate API credentials are properly configured
    if (!this.apiKey) {
      logger.error('Stripe API key is not configured. Payment processing will not work.');
      throw new Error('Stripe API key is not configured');
    }
    
    logger.info('Stripe payment provider initialized', { provider: PaymentProvider.STRIPE });
  }

  /**
   * Creates a payment method in Stripe and returns a token
   * 
   * @param paymentDetails Card details to create a payment method
   * @returns Payment method token and card details
   */
  async createPaymentMethod(paymentDetails: any): Promise<{
    token: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  }> {
    try {
      // Validate payment details (card number, expiry, CVC)
      if (!paymentDetails.card || !paymentDetails.card.number || !paymentDetails.card.expMonth || 
          !paymentDetails.card.expYear || !paymentDetails.card.cvc) {
        throw new Error('Invalid card details provided');
      }

      // Call Stripe API to create a payment method
      const paymentMethod = await this.stripeClient.paymentMethods.create({
        type: 'card',
        card: {
          number: paymentDetails.card.number,
          exp_month: paymentDetails.card.expMonth,
          exp_year: paymentDetails.card.expYear,
          cvc: paymentDetails.card.cvc,
        },
      });

      // Extract token, last4, expiry month and year from response
      const token = paymentMethod.id;
      const last4 = paymentMethod.card.last4;
      const expiryMonth = paymentMethod.card.exp_month;
      const expiryYear = paymentMethod.card.exp_year;

      logger.debug('Created Stripe payment method', { last4 });

      // Return the token and card details for storage
      return {
        token,
        last4,
        expiryMonth,
        expiryYear
      };
    } catch (error) {
      logger.error('Error creating Stripe payment method', { error: error.message });
      throw new Error(`Failed to create payment method: ${error.message}`);
    }
  }

  /**
   * Retrieves payment method details from Stripe
   * 
   * @param paymentMethodId ID of the payment method to retrieve
   * @returns Payment method details from Stripe
   */
  async getPaymentMethod(paymentMethodId: string): Promise<object> {
    try {
      // Call Stripe API to retrieve the payment method
      const paymentMethod = await this.stripeClient.paymentMethods.retrieve(paymentMethodId);
      
      // Format the response to match application requirements
      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expiryMonth: paymentMethod.card.exp_month,
          expiryYear: paymentMethod.card.exp_year,
        } : undefined,
        created: new Date(paymentMethod.created * 1000),
      };
    } catch (error) {
      logger.error('Error retrieving Stripe payment method', { 
        paymentMethodId,
        error: error.message 
      });
      throw new Error(`Failed to retrieve payment method: ${error.message}`);
    }
  }

  /**
   * Detaches and deletes a payment method from Stripe
   * 
   * @param paymentMethodId ID of the payment method to delete
   * @returns True if deletion was successful
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      // Call Stripe API to detach the payment method
      const paymentMethod = await this.stripeClient.paymentMethods.detach(paymentMethodId);
      
      // Verify the payment method was successfully detached
      const isDetached = paymentMethod.id === paymentMethodId;
      
      if (isDetached) {
        logger.debug('Detached Stripe payment method', { paymentMethodId });
      }
      
      // Return true to indicate successful removal
      return isDetached;
    } catch (error) {
      logger.error('Error detaching Stripe payment method', { 
        paymentMethodId,
        error: error.message 
      });
      throw new Error(`Failed to delete payment method: ${error.message}`);
    }
  }

  /**
   * Creates a payment intent in Stripe for processing a payment
   * 
   * @param transaction Transaction data for the payment
   * @param paymentMethod Payment method to use for the transaction
   * @returns Payment intent details including client secret
   */
  async createPaymentIntent(
    transaction: ITransaction,
    paymentMethod: IPaymentMethod
  ): Promise<IStripePaymentIntent> {
    try {
      // Prepare payment intent data including amount, currency, and description
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(transaction.amount * 100), // Stripe uses cents
        currency: transaction.currency.toLowerCase(),
        description: transaction.description,
        payment_method: paymentMethod.token,
        confirmation_method: 'manual',
        confirm: false,
      };
      
      // Add metadata from transaction for tracking
      if (transaction.metadata) {
        paymentIntentData.metadata = {
          transactionId: transaction.id,
          userId: transaction.userId,
          eventId: transaction.eventId || '',
          splitId: transaction.splitId || '',
          ...transaction.metadata,
        };
      }
      
      // Call Stripe API to create a payment intent
      const paymentIntent = await this.stripeClient.paymentIntents.create(paymentIntentData);
      
      logger.debug('Created Stripe payment intent', { 
        paymentIntentId: paymentIntent.id,
        amount: transaction.amount, 
        currency: transaction.currency 
      });
      
      // Return payment intent details with client secret for client-side confirmation
      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
      };
    } catch (error) {
      logger.error('Error creating Stripe payment intent', { 
        transactionId: transaction.id,
        error: error.message 
      });
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Processes a payment using Stripe
   * 
   * @param transaction Transaction data for the payment
   * @param paymentMethod Payment method to use for the transaction
   * @returns Updated transaction with provider details
   */
  async processPayment(
    transaction: ITransaction,
    paymentMethod: IPaymentMethod
  ): Promise<Transaction> {
    try {
      // Create a payment intent with Stripe
      const paymentIntent = await this.createPaymentIntent(transaction, paymentMethod);
      
      // Convert transaction to Transaction model instance for updates
      const transactionModel = Transaction.fromDatabase(transaction);
      
      // Update transaction status to PROCESSING
      transactionModel.updateStatus(TransactionStatus.PROCESSING);
      
      // Set provider transaction ID to payment intent ID
      transactionModel.setProviderTransactionId(paymentIntent.id);
      
      // Add client secret to transaction metadata for client-side confirmation
      if (!transactionModel.metadata) {
        transactionModel.metadata = {};
      }
      transactionModel.metadata.clientSecret = paymentIntent.clientSecret;
      transactionModel.metadata.stripePaymentIntentId = paymentIntent.id;
      
      logger.info('Processed Stripe payment', { 
        transactionId: transaction.id,
        paymentIntentId: paymentIntent.id
      });
      
      // Return the updated transaction
      return transactionModel;
    } catch (error) {
      logger.error('Error processing Stripe payment', { 
        transactionId: transaction.id,
        error: error.message 
      });
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Processes a refund for a previous transaction
   * 
   * @param refundTransaction Transaction data for the refund
   * @param originalTransaction Original transaction to be refunded
   * @returns Updated refund transaction with provider details
   */
  async processRefund(
    refundTransaction: ITransaction,
    originalTransaction: ITransaction
  ): Promise<Transaction> {
    try {
      // Validate that original transaction has a provider transaction ID
      if (!originalTransaction.providerTransactionId) {
        throw new Error('Original transaction does not have a provider transaction ID');
      }
      
      // Call Stripe API to create a refund for the payment intent
      const refund = await this.stripeClient.refunds.create({
        payment_intent: originalTransaction.providerTransactionId,
        amount: Math.round(refundTransaction.amount * 100), // Stripe uses cents
        reason: 'requested_by_customer',
        metadata: {
          refundTransactionId: refundTransaction.id,
          originalTransactionId: originalTransaction.id,
          userId: refundTransaction.userId,
          ...refundTransaction.metadata
        }
      });
      
      // Convert refund transaction to Transaction model instance for updates
      const refundTransactionModel = Transaction.fromDatabase(refundTransaction);
      
      // Update refund transaction status based on refund result
      if (refund.status === 'succeeded') {
        refundTransactionModel.updateStatus(TransactionStatus.COMPLETED);
      } else if (refund.status === 'pending') {
        refundTransactionModel.updateStatus(TransactionStatus.PROCESSING);
      } else {
        refundTransactionModel.updateStatus(TransactionStatus.FAILED);
      }
      
      // Set provider transaction ID in the refund transaction
      refundTransactionModel.setProviderTransactionId(refund.id);
      
      logger.info('Processed Stripe refund', { 
        refundTransactionId: refundTransaction.id,
        originalTransactionId: originalTransaction.id,
        refundId: refund.id,
        status: refund.status
      });
      
      // Return the updated refund transaction
      return refundTransactionModel;
    } catch (error) {
      logger.error('Error processing Stripe refund', { 
        refundTransactionId: refundTransaction.id,
        originalTransactionId: originalTransaction.id,
        error: error.message 
      });
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }

  /**
   * Processes Stripe webhook events
   * 
   * @param payload Raw webhook payload
   * @param signature Stripe signature header
   * @returns Processed webhook event
   */
  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<IPaymentWebhookEvent> {
    try {
      // Verify webhook signature using webhook secret
      const event = await this.verifyWebhookSignature(payload, signature);
      
      // Map Stripe event to internal event format
      const webhookEvent = this.mapStripeEventToWebhookEvent(event);
      
      logger.debug('Processed Stripe webhook event', { 
        eventId: webhookEvent.id,
        eventType: webhookEvent.eventType 
      });
      
      return webhookEvent;
    } catch (error) {
      logger.error('Error processing Stripe webhook', { error: error.message });
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }

  /**
   * Verifies the signature of a Stripe webhook event
   * 
   * @param payload Raw webhook payload
   * @param signature Stripe signature header
   * @returns Verified Stripe event object
   */
  private async verifyWebhookSignature(
    payload: string,
    signature: string
  ): Promise<object> {
    try {
      // Use Stripe SDK to construct and verify the event
      const event = this.stripeClient.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      
      // Return the parsed event object if signature is valid
      return event;
    } catch (error) {
      logger.error('Invalid Stripe webhook signature', { error: error.message });
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Checks the status of a payment with Stripe
   * 
   * @param paymentIntentId ID of the payment intent to check
   * @returns Current status of the transaction
   */
  async getPaymentStatus(paymentIntentId: string): Promise<TransactionStatus> {
    try {
      // Call Stripe API to retrieve the payment intent
      const paymentIntent = await this.stripeClient.paymentIntents.retrieve(paymentIntentId);
      
      // Map Stripe payment intent status to internal transaction status
      const status = this.mapStripeStatusToTransactionStatus(paymentIntent.status);
      
      logger.debug('Retrieved Stripe payment status', { 
        paymentIntentId,
        stripeStatus: paymentIntent.status,
        mappedStatus: status
      });
      
      return status;
    } catch (error) {
      logger.error('Error retrieving Stripe payment status', { 
        paymentIntentId,
        error: error.message 
      });
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  /**
   * Maps a Stripe event to the internal webhook event format
   * 
   * @param stripeEvent Stripe event object
   * @returns Formatted webhook event
   */
  private mapStripeEventToWebhookEvent(stripeEvent: any): IPaymentWebhookEvent {
    const eventTypeMap: { [key: string]: string } = {
      'payment_intent.succeeded': 'payment.succeeded',
      'payment_intent.payment_failed': 'payment.failed',
      'payment_intent.processing': 'payment.processing',
      'payment_intent.canceled': 'payment.canceled',
      'charge.refunded': 'payment.refunded',
      'charge.dispute.created': 'payment.disputed',
      'charge.dispute.closed': 'payment.dispute.resolved',
    };
    
    // Extract event ID, type, and data from Stripe event
    // Map Stripe event type to internal event type
    // Format the data according to internal requirements
    const webhookEvent: IPaymentWebhookEvent = {
      id: stripeEvent.id,
      eventType: eventTypeMap[stripeEvent.type] || stripeEvent.type,
      data: {
        ...stripeEvent.data.object,
        metadata: stripeEvent.data.object.metadata || {},
      },
    };
    
    // Add additional context based on event type
    if (stripeEvent.type === 'payment_intent.succeeded' || 
        stripeEvent.type === 'payment_intent.payment_failed' ||
        stripeEvent.type === 'payment_intent.processing' ||
        stripeEvent.type === 'payment_intent.canceled') {
      webhookEvent.data.transactionId = stripeEvent.data.object.metadata?.transactionId;
      webhookEvent.data.paymentIntentId = stripeEvent.data.object.id;
      webhookEvent.data.amount = stripeEvent.data.object.amount / 100; // Convert cents to dollars
      webhookEvent.data.currency = stripeEvent.data.object.currency;
    } else if (stripeEvent.type === 'charge.refunded') {
      webhookEvent.data.transactionId = stripeEvent.data.object.metadata?.refundTransactionId;
      webhookEvent.data.refundId = stripeEvent.data.object.id;
      webhookEvent.data.amount = stripeEvent.data.object.amount_refunded / 100;
      webhookEvent.data.currency = stripeEvent.data.object.currency;
    }
    
    return webhookEvent;
  }

  /**
   * Maps Stripe payment intent status to internal transaction status
   * 
   * @param stripeStatus Stripe payment intent status
   * @returns Internal transaction status
   */
  private mapStripeStatusToTransactionStatus(stripeStatus: string): TransactionStatus {
    switch (stripeStatus) {
      case 'succeeded':
        return TransactionStatus.COMPLETED;
      case 'processing':
        return TransactionStatus.PROCESSING;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return TransactionStatus.PROCESSING;
      case 'canceled':
        return TransactionStatus.FAILED;
      default:
        return TransactionStatus.PROCESSING;
    }
  }
}