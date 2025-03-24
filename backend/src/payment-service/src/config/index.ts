/**
 * Payment Service Configuration
 * 
 * Centralizes configuration settings for the Payment Service microservice, including
 * payment provider settings, API keys, and service-specific environment variables.
 */

import baseConfig from '../../../config';
import { SecretKeys } from '../../../config/secrets';
import { logger } from '../../../shared/src/utils/logger.util';
import { ValidationError } from '../../../shared/src/errors/validation.error';

/**
 * Interface defining the structure of payment provider configuration
 */
export interface PaymentProviderConfig {
  apiKey: string;
  webhookSecret: string;
  apiUrl: string;
  options: Record<string, any>;
}

/**
 * Interface defining payment service specific configuration
 */
export interface PaymentServiceConfig {
  transactionExpiryTime: number;
  defaultCurrency: string;
  maxTransactionAmount: number;
  maxSplitParticipants: number;
}

// Payment service specific configuration with default values
const paymentConfig: PaymentServiceConfig = {
  transactionExpiryTime: Number(process.env.PAYMENT_TRANSACTION_EXPIRY_TIME || 86400), // 24 hours in seconds
  defaultCurrency: process.env.PAYMENT_DEFAULT_CURRENCY || 'USD',
  maxTransactionAmount: Number(process.env.PAYMENT_MAX_TRANSACTION_AMOUNT || 5000), // $50.00 in cents
  maxSplitParticipants: Number(process.env.PAYMENT_MAX_SPLIT_PARTICIPANTS || 8)
};

/**
 * Validates payment service specific configuration settings
 * 
 * @returns True if all payment configuration is valid
 * @throws Error if validation fails
 */
function validatePaymentConfiguration(): boolean {
  try {
    // Validate base configuration
    baseConfig.validateConfiguration();
    
    // Validate payment providers based on environment
    const requiredProviders = baseConfig.env.NODE_ENV === 'production' 
      ? ['stripe', 'venmo'] 
      : ['stripe']; // Only require Stripe in non-production
    
    // Validate required payment provider API keys
    for (const provider of requiredProviders) {
      if (provider === 'stripe') {
        baseConfig.secrets.getSecret(SecretKeys.STRIPE_API_KEY);
        // In production, also validate webhook secret
        if (baseConfig.env.NODE_ENV === 'production' && !process.env.STRIPE_WEBHOOK_SECRET) {
          throw new ValidationError('STRIPE_WEBHOOK_SECRET is required in production');
        }
      } else if (provider === 'venmo') {
        baseConfig.secrets.getSecret(SecretKeys.VENMO_API_KEY);
        // In production, validate Venmo specific config
        if (baseConfig.env.NODE_ENV === 'production') {
          if (!process.env.VENMO_CLIENT_ID) {
            throw new ValidationError('VENMO_CLIENT_ID is required in production');
          }
          if (!process.env.VENMO_CLIENT_SECRET) {
            throw new ValidationError('VENMO_CLIENT_SECRET is required in production');
          }
          if (!process.env.VENMO_WEBHOOK_SECRET) {
            throw new ValidationError('VENMO_WEBHOOK_SECRET is required in production');
          }
        }
      }
    }
    
    // Validate payment service specific environment variables
    if (isNaN(paymentConfig.transactionExpiryTime) || paymentConfig.transactionExpiryTime <= 0) {
      throw new ValidationError('PAYMENT_TRANSACTION_EXPIRY_TIME must be a positive number');
    }
    
    if (isNaN(paymentConfig.maxTransactionAmount) || paymentConfig.maxTransactionAmount <= 0) {
      throw new ValidationError('PAYMENT_MAX_TRANSACTION_AMOUNT must be a positive number');
    }
    
    if (isNaN(paymentConfig.maxSplitParticipants) || paymentConfig.maxSplitParticipants <= 1) {
      throw new ValidationError('PAYMENT_MAX_SPLIT_PARTICIPANTS must be greater than 1');
    }
    
    logger.info('Payment service configuration validated successfully');
    return true;
  } catch (error) {
    logger.error('Payment service configuration validation failed', error as Error);
    throw error;
  }
}

/**
 * Retrieves configuration for a specific payment provider
 * 
 * @param providerName - The name of the payment provider (stripe or venmo)
 * @returns Configuration object for the specified payment provider
 * @throws Error if provider name is invalid
 */
function getPaymentProviderConfig(providerName: string): PaymentProviderConfig {
  const normalizedName = providerName.toLowerCase();
  
  // Check if provider name is valid
  if (normalizedName !== 'stripe' && normalizedName !== 'venmo') {
    throw new ValidationError.invalidInput(`Invalid payment provider: ${providerName}. Supported providers are: stripe, venmo`);
  }
  
  // Initialize with default values
  const config: PaymentProviderConfig = {
    apiKey: '',
    webhookSecret: '',
    apiUrl: '',
    options: {}
  };
  
  try {
    // Configure provider-specific settings
    if (normalizedName === 'stripe') {
      config.apiKey = baseConfig.secrets.getSecret(SecretKeys.STRIPE_API_KEY);
      config.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      config.apiUrl = 'https://api.stripe.com/v1';
      config.options = {
        apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16' // Stripe API version 2023-10-16
      };
    } else if (normalizedName === 'venmo') {
      config.apiKey = baseConfig.secrets.getSecret(SecretKeys.VENMO_API_KEY);
      config.webhookSecret = process.env.VENMO_WEBHOOK_SECRET || '';
      config.apiUrl = process.env.VENMO_API_URL || 'https://api.venmo.com/v1';
      config.options = {
        clientId: process.env.VENMO_CLIENT_ID || '',
        clientSecret: process.env.VENMO_CLIENT_SECRET || ''
      };
    }
    
    return config;
  } catch (error) {
    logger.error(`Failed to retrieve config for ${providerName}`, error as Error);
    throw error;
  }
}

// Export payment service configuration and utilities
export default {
  // Re-export base config components
  env: baseConfig.env,
  secrets: baseConfig.secrets,
  logging: baseConfig.logging,
  
  // Export payment-specific functions
  validatePaymentConfiguration,
  getPaymentProviderConfig
};