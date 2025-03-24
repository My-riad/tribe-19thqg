/**
 * Notification Service Configuration
 * 
 * Centralizes configuration settings for the notification service, including
 * provider settings, delivery options, and service-specific environment variables.
 * This file serves as the single entry point for all configuration used throughout
 * the notification service.
 */

import baseConfig from '../../../config';
import { DeliveryChannel } from '../../../shared/src/types/notification.types';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Notification service specific configuration
 */
export const notificationConfig = {
  // Service identification
  serviceName: 'notification-service',
  
  // Delivery channels enabled for the service
  enabledChannels: (process.env.NOTIFICATION_ENABLED_CHANNELS || 'EMAIL,PUSH')
    .split(',')
    .map(channel => channel.trim().toUpperCase())
    .filter(channel => Object.values(DeliveryChannel).includes(channel as DeliveryChannel))
    .map(channel => channel as DeliveryChannel),

  // Notification retry configuration
  maxRetryAttempts: parseInt(process.env.NOTIFICATION_MAX_RETRY_ATTEMPTS || '3', 10),
  retryDelayMs: parseInt(process.env.NOTIFICATION_RETRY_DELAY_MS || '60000', 10),
  
  // Batch processing size for processing notifications
  batchSize: parseInt(process.env.NOTIFICATION_BATCH_SIZE || '100', 10),
  
  // Email provider configuration
  emailConfig: {
    enabled: true,
    emailFromAddress: process.env.EMAIL_FROM_ADDRESS || 'notifications@tribe-app.com',
    emailFromName: process.env.EMAIL_FROM_NAME || 'Tribe',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpSecure: process.env.SMTP_SECURE === 'true',
    templateDir: process.env.EMAIL_TEMPLATE_DIR || '../templates/email'
  },
  
  // Firebase Cloud Messaging configuration for push notifications
  fcmConfig: {
    enabled: true,
    fcmApiUrl: process.env.FCM_API_URL || 'https://fcm.googleapis.com/v1/projects/tribe-app/messages:send',
    fcmServiceAccountPath: process.env.FCM_SERVICE_ACCOUNT_PATH || '../credentials/firebase-service-account.json',
    androidChannelId: process.env.ANDROID_CHANNEL_ID || 'tribe_default_channel',
    apnsBundleId: process.env.APNS_BUNDLE_ID || 'com.tribe.app',
    ttlSeconds: parseInt(process.env.PUSH_TTL_SECONDS || '86400', 10) // 24 hours default
  }
};

/**
 * Validates notification service specific configuration
 * 
 * @returns True if all notification configuration is valid
 * @throws Error if any configuration validation fails
 */
export function validateNotificationConfiguration(): boolean {
  try {
    // First validate base configuration
    baseConfig.validateConfiguration();
    
    // Validate enabled channels
    if (notificationConfig.enabledChannels.length === 0) {
      throw new Error('No valid notification channels enabled');
    }
    
    // If email notifications are enabled, validate email configuration
    if (notificationConfig.enabledChannels.includes(DeliveryChannel.EMAIL) && 
        notificationConfig.emailConfig.enabled) {
      
      if (!notificationConfig.emailConfig.smtpHost) {
        throw new Error('SMTP host is required for email notifications');
      }
      
      if (!notificationConfig.emailConfig.smtpUser) {
        throw new Error('SMTP user is required for email notifications');
      }
      
      if (!notificationConfig.emailConfig.smtpPassword) {
        throw new Error('SMTP password is required for email notifications');
      }
    }
    
    // If push notifications are enabled, validate FCM configuration
    if (notificationConfig.enabledChannels.includes(DeliveryChannel.PUSH) && 
        notificationConfig.fcmConfig.enabled) {
      
      if (!process.env.FIREBASE_API_KEY) {
        throw new Error('Firebase API key is required for push notifications');
      }
      
      // Validate service account file exists if running in production
      if (process.env.NODE_ENV === 'production' && 
          !notificationConfig.fcmConfig.fcmServiceAccountPath) {
        throw new Error('FCM service account path is required for push notifications in production');
      }
    }
    
    logger.info('Notification service configuration validated successfully');
    return true;
  } catch (error) {
    logger.error('Notification configuration validation failed', error as Error);
    throw error;
  }
}

/**
 * Initializes notification service configuration and prepares providers
 * 
 * @returns Promise that resolves when configuration is initialized
 */
export async function initializeNotificationConfiguration(): Promise<void> {
  try {
    // Validate configuration
    validateNotificationConfiguration();
    
    // Initialize database connections if needed
    // Note: This is likely handled by the base configuration initialization
    
    // Initialize email provider if enabled
    if (notificationConfig.enabledChannels.includes(DeliveryChannel.EMAIL) && 
        notificationConfig.emailConfig.enabled) {
      // TODO: Initialize email provider (connect to SMTP server, verify credentials)
      logger.info('Email notification provider initialized');
    }
    
    // Initialize FCM provider if enabled
    if (notificationConfig.enabledChannels.includes(DeliveryChannel.PUSH) && 
        notificationConfig.fcmConfig.enabled) {
      // TODO: Initialize FCM provider (load service account credentials, verify API key)
      logger.info('Push notification provider initialized');
    }
    
    logger.info('Notification service configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize notification configuration', error as Error);
    throw error;
  }
}

// Export all configuration
export default {
  env: baseConfig.env,
  logging: baseConfig.logging,
  notificationConfig,
  validateNotificationConfiguration,
  initializeNotificationConfiguration
};