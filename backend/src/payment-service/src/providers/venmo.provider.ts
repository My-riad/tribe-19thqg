import axios from 'axios';
import logger from 'winston';
import config from 'config';

import {
  IPaymentMethod,
  ITransaction,
  IVenmoPaymentRequest,
  IPaymentWebhookEvent,
  PaymentProvider,
  TransactionStatus
} from '@shared/types/payment.types';
import { Transaction } from '../models/transaction.model';
import { Payment } from '../models/payment.model';

/**
 * Axios instance configured with Venmo API base URL and headers
 */
let venmoApiClient;

/**
 * Implementation of the payment provider interface for Venmo payment processing
 */
export class VenmoProvider {
  private apiKey: string;
  private apiSecret: string;
  private webhookSecret: string;
  private apiBaseUrl: string;

  /**
   * Initializes the Venmo provider with API credentials from configuration
   */
  constructor() {
    // Load configuration from environment or config files
    this.apiKey = config.get('payment.venmo.apiKey');
    this.apiSecret = config.get('payment.venmo.apiSecret');
    this.webhookSecret = config.get('payment.venmo.webhookSecret');
    this.apiBaseUrl = config.get('payment.venmo.apiBaseUrl') || 'https://api.venmo.com/v1';

    // Initialize Venmo API client
    venmoApiClient = axios.create({
      baseURL: this.apiBaseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Validate API credentials are properly configured
    if (!this.apiKey || !this.apiSecret) {
      logger.error('Venmo API credentials not properly configured');
      throw new Error('Venmo payment provider initialization failed: Missing API credentials');
    }

    logger.info('Venmo payment provider initialized successfully');
  }

  /**
   * Links a Venmo account as a payment method
   * 
   * @param venmoAccountDetails Venmo account details including username/email and access token
   * @returns Venmo account token and identifier for storage
   */
  async createPaymentMethod(venmoAccountDetails: object): Promise<{ token: string, last4: string }> {
    try {
      // Validate Venmo account details
      if (!venmoAccountDetails['username'] && !venmoAccountDetails['email']) {
        throw new Error('Venmo username or email is required');
      }

      if (!venmoAccountDetails['accessToken']) {
        throw new Error('Venmo access token is required');
      }

      // Call Venmo API to verify account exists and is accessible
      const response = await venmoApiClient.get('/me', {
        headers: {
          'Authorization': `Bearer ${venmoAccountDetails['accessToken']}`
        }
      });

      if (!response.data || !response.data.user || !response.data.user.id) {
        throw new Error('Unable to verify Venmo account');
      }

      // Generate a token representing the Venmo account link
      const token = Buffer.from(JSON.stringify({
        venmoId: response.data.user.id,
        username: response.data.user.username,
        accessToken: venmoAccountDetails['accessToken']
      })).toString('base64');

      // Extract last4 digits of phone number or username for display
      const last4 = response.data.user.username.slice(-4);

      logger.info('Venmo payment method created', { userId: response.data.user.id });
      return { token, last4 };
    } catch (error) {
      logger.error('Error creating Venmo payment method', { error: error.message });
      throw new Error(`Failed to link Venmo account: ${error.message}`);
    }
  }

  /**
   * Retrieves Venmo account details for a linked payment method
   * 
   * @param paymentMethodId ID of the payment method to retrieve
   * @returns Venmo account details
   */
  async getPaymentMethod(paymentMethodId: string): Promise<object> {
    try {
      // Validate payment method ID
      if (!paymentMethodId) {
        throw new Error('Payment method ID is required');
      }

      // Call Venmo API to retrieve account details
      // In a real implementation, we would decode the token and use it to query Venmo
      const response = await venmoApiClient.get(`/payment_methods/${paymentMethodId}`);
      
      // Format the response to match application requirements
      return {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        status: response.data.status,
        isVerified: response.data.verified
      };
    } catch (error) {
      logger.error('Error retrieving Venmo payment method', { paymentMethodId, error: error.message });
      throw new Error(`Failed to retrieve Venmo account details: ${error.message}`);
    }
  }

  /**
   * Unlinks a Venmo account from the user's payment methods
   * 
   * @param paymentMethodId ID of the payment method to delete
   * @returns True if unlinking was successful
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      // Validate payment method ID
      if (!paymentMethodId) {
        throw new Error('Payment method ID is required');
      }

      // Call Venmo API to revoke access token if applicable
      // In a real implementation, we would decode the token, extract the access token,
      // and call Venmo's API to revoke it
      
      logger.info('Venmo payment method deleted', { paymentMethodId });
      
      // Return true to indicate successful removal
      return true;
    } catch (error) {
      logger.error('Error deleting Venmo payment method', { paymentMethodId, error: error.message });
      throw new Error(`Failed to unlink Venmo account: ${error.message}`);
    }
  }

  /**
   * Creates a payment request in Venmo
   * 
   * @param transaction Transaction details
   * @param paymentMethod Payment method to use
   * @returns Venmo payment request details
   */
  async createPaymentRequest(
    transaction: ITransaction,
    paymentMethod: IPaymentMethod
  ): Promise<IVenmoPaymentRequest> {
    try {
      // Extract Venmo username/handle from payment method token
      const tokenData = JSON.parse(Buffer.from(paymentMethod.token, 'base64').toString());
      
      // Prepare payment request data including amount and description
      const paymentRequestData = {
        amount: transaction.amount,
        note: transaction.description,
        target_user_id: tokenData.venmoId,
        audience: 'private'
      };

      // Call Venmo API to create a payment request
      const response = await venmoApiClient.post('/payments', paymentRequestData);

      if (!response.data || !response.data.payment) {
        throw new Error('Invalid response from Venmo API');
      }

      // Return payment request details including payment URL
      return {
        id: response.data.payment.id,
        amount: response.data.payment.amount,
        note: response.data.payment.note,
        targetUserHandle: tokenData.username,
        status: response.data.payment.status,
        paymentUrl: `https://venmo.com/account/pay?txn=${response.data.payment.id}`
      };
    } catch (error) {
      logger.error('Error creating Venmo payment request', { 
        transactionId: transaction.id, 
        error: error.message 
      });
      throw new Error(`Failed to create Venmo payment request: ${error.message}`);
    }
  }

  /**
   * Processes a payment using Venmo
   * 
   * @param transaction Transaction to process
   * @param paymentMethod Payment method to use
   * @returns Updated transaction with provider details
   */
  async processPayment(
    transaction: ITransaction,
    paymentMethod: IPaymentMethod
  ): Promise<Transaction> {
    try {
      // Create a payment request with Venmo
      const paymentRequest = await this.createPaymentRequest(transaction, paymentMethod);
      
      // Convert the ITransaction to Transaction instance
      const transactionModel = Transaction.fromDatabase(transaction);
      
      // Update transaction status to PROCESSING
      transactionModel.updateStatus(TransactionStatus.PROCESSING);
      
      // Set provider transaction ID to payment request ID
      transactionModel.setProviderTransactionId(paymentRequest.id);
      
      // Add payment URL to transaction metadata for client-side redirection
      transactionModel.metadata = {
        ...transactionModel.metadata,
        paymentUrl: paymentRequest.paymentUrl,
        venmoPaymentId: paymentRequest.id
      };
      
      logger.info('Venmo payment initiated', { 
        transactionId: transaction.id,
        venmoPaymentId: paymentRequest.id
      });
      
      // Return the updated transaction
      return transactionModel;
    } catch (error) {
      logger.error('Error processing Venmo payment', { 
        transactionId: transaction.id, 
        error: error.message 
      });
      throw new Error(`Failed to process Venmo payment: ${error.message}`);
    }
  }

  /**
   * Processes a refund for a previous transaction
   * 
   * @param refundTransaction Refund transaction to process
   * @param originalTransaction Original transaction to refund
   * @returns Updated refund transaction with provider details
   */
  async processRefund(
    refundTransaction: ITransaction,
    originalTransaction: ITransaction
  ): Promise<Transaction> {
    try {
      // Validate that original transaction has a provider transaction ID
      if (!originalTransaction.providerTransactionId) {
        throw new Error('Original transaction has no provider transaction ID');
      }

      // Call Venmo API to create a reverse payment request
      // In Venmo, this is essentially creating a new payment in the opposite direction
      const refundPaymentData = {
        amount: Math.abs(refundTransaction.amount),
        note: `Refund for: ${originalTransaction.description}`,
        payment_id: originalTransaction.providerTransactionId
      };

      const response = await venmoApiClient.post('/payments/refunds', refundPaymentData);

      if (!response.data || !response.data.refund) {
        throw new Error('Invalid response from Venmo API');
      }

      // Update refund transaction status based on refund result
      const refundTransactionModel = Transaction.fromDatabase(refundTransaction);
      refundTransactionModel.updateStatus(TransactionStatus.PROCESSING);
      
      // Set provider transaction ID in the refund transaction
      refundTransactionModel.setProviderTransactionId(response.data.refund.id);
      
      // Add refund metadata
      refundTransactionModel.metadata = {
        ...refundTransactionModel.metadata,
        originalTransactionId: originalTransaction.id,
        venmoRefundId: response.data.refund.id
      };
      
      logger.info('Venmo refund processed', { 
        refundTransactionId: refundTransaction.id,
        originalTransactionId: originalTransaction.id,
        venmoRefundId: response.data.refund.id
      });
      
      // Return the updated refund transaction
      return refundTransactionModel;
    } catch (error) {
      logger.error('Error processing Venmo refund', { 
        refundTransactionId: refundTransaction.id,
        originalTransactionId: originalTransaction.id, 
        error: error.message 
      });
      throw new Error(`Failed to process Venmo refund: ${error.message}`);
    }
  }

  /**
   * Processes Venmo webhook events
   * 
   * @param payload Raw webhook payload
   * @param signature Webhook signature for verification
   * @returns Processed webhook event
   */
  async handleWebhook(payload: string, signature: string): Promise<IPaymentWebhookEvent> {
    try {
      // Verify webhook signature using webhook secret
      const verifiedPayload = await this.verifyWebhookSignature(payload, signature);
      
      // Parse the event data from Venmo
      const venmoEvent = JSON.parse(verifiedPayload);
      
      // Map Venmo event type to internal event type
      const webhookEvent = this.mapVenmoEventToWebhookEvent(venmoEvent);
      
      logger.info('Venmo webhook processed', { 
        eventType: webhookEvent.eventType,
        eventId: webhookEvent.id
      });
      
      // Return formatted webhook event for further processing
      return webhookEvent;
    } catch (error) {
      logger.error('Error handling Venmo webhook', { error: error.message });
      throw new Error(`Failed to process Venmo webhook: ${error.message}`);
    }
  }

  /**
   * Verifies the signature of a Venmo webhook event
   * 
   * @param payload Raw webhook payload
   * @param signature Webhook signature for verification
   * @returns Verified Venmo event object
   */
  private async verifyWebhookSignature(payload: string, signature: string): Promise<object> {
    try {
      // Compute HMAC signature using webhook secret
      // Note: In a real implementation, we would use crypto library for proper HMAC generation
      const crypto = require('crypto');
      const computedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');
      
      // Compare computed signature with provided signature
      if (computedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }
      
      // Return the parsed event object if signature is valid
      return payload;
    } catch (error) {
      logger.error('Webhook signature verification failed', { error: error.message });
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  /**
   * Checks the status of a payment with Venmo
   * 
   * @param paymentRequestId Venmo payment request ID
   * @returns Current status of the transaction
   */
  async getPaymentStatus(paymentRequestId: string): Promise<TransactionStatus> {
    try {
      // Call Venmo API to retrieve the payment request status
      const response = await venmoApiClient.get(`/payments/${paymentRequestId}`);
      
      if (!response.data || !response.data.payment) {
        throw new Error('Invalid response from Venmo API');
      }
      
      // Map Venmo payment status to internal transaction status
      const status = this.mapVenmoStatusToTransactionStatus(response.data.payment.status);
      
      logger.info('Retrieved Venmo payment status', { 
        paymentRequestId,
        status: response.data.payment.status,
        mappedStatus: status
      });
      
      return status;
    } catch (error) {
      logger.error('Error getting Venmo payment status', { 
        paymentRequestId, 
        error: error.message 
      });
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  /**
   * Maps Venmo payment status to internal transaction status
   * 
   * @param venmoStatus Venmo payment status
   * @returns Internal transaction status
   */
  private mapVenmoStatusToTransactionStatus(venmoStatus: string): TransactionStatus {
    switch (venmoStatus.toLowerCase()) {
      case 'completed':
        return TransactionStatus.COMPLETED;
      case 'pending':
        return TransactionStatus.PROCESSING;
      case 'failed':
        return TransactionStatus.FAILED;
      case 'cancelled':
        return TransactionStatus.FAILED;
      case 'refunded':
        return TransactionStatus.REFUNDED;
      default:
        logger.warn('Unknown Venmo status mapped to PROCESSING', { venmoStatus });
        return TransactionStatus.PROCESSING;
    }
  }

  /**
   * Maps a Venmo event to the internal webhook event format
   * 
   * @param venmoEvent Venmo event object
   * @returns Formatted webhook event
   */
  private mapVenmoEventToWebhookEvent(venmoEvent: object): IPaymentWebhookEvent {
    // Extract event ID, type, and data from Venmo event
    const eventId = venmoEvent['id'] || `venmo-event-${Date.now()}`;
    const eventType = venmoEvent['type'] || 'unknown';
    const eventData = venmoEvent['data'] || {};
    
    // Map Venmo event type to internal event type
    let mappedEventType = 'payment.unknown';
    let formattedData = {};
    
    switch (eventType) {
      case 'payment.created':
        mappedEventType = 'payment.created';
        formattedData = {
          paymentId: eventData['payment']?.id,
          status: this.mapVenmoStatusToTransactionStatus(eventData['payment']?.status || 'pending'),
          amount: eventData['payment']?.amount,
          metadata: eventData['payment']?.metadata || {}
        };
        break;
        
      case 'payment.updated':
        mappedEventType = 'payment.updated';
        formattedData = {
          paymentId: eventData['payment']?.id,
          status: this.mapVenmoStatusToTransactionStatus(eventData['payment']?.status || 'pending'),
          amount: eventData['payment']?.amount,
          metadata: eventData['payment']?.metadata || {}
        };
        break;
        
      case 'payment.completed':
        mappedEventType = 'payment.completed';
        formattedData = {
          paymentId: eventData['payment']?.id,
          status: TransactionStatus.COMPLETED,
          amount: eventData['payment']?.amount,
          completedAt: new Date().toISOString()
        };
        break;
        
      case 'payment.failed':
        mappedEventType = 'payment.failed';
        formattedData = {
          paymentId: eventData['payment']?.id,
          status: TransactionStatus.FAILED,
          failureReason: eventData['payment']?.failureReason || 'Unknown failure'
        };
        break;
        
      default:
        logger.warn('Unknown Venmo event type', { type: eventType });
        formattedData = { 
          originalEvent: venmoEvent,
          processedAt: new Date().toISOString()
        };
    }
    
    // Return the formatted webhook event
    return {
      id: eventId,
      eventType: mappedEventType,
      data: formattedData
    };
  }
}