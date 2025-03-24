import * as nodemailer from 'nodemailer'; // ^6.9.1
import * as handlebars from 'handlebars'; // ^4.7.7
import * as fs from 'fs'; // built-in
import * as path from 'path'; // built-in
import * as mongoose from 'mongoose'; // ^6.9.0

import { 
  INotification, 
  NotificationType, 
  DeliveryChannel, 
  NotificationStatus 
} from '../../../shared/src/types/notification.types';
import { IDeliveryDocument, Delivery } from '../models/delivery.model';
import { notificationConfig, env } from '../config';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Retrieves the email address for a specific user from the user data in MongoDB
 * 
 * @param userId - ID of the user
 * @returns Email address of the user
 */
async function getUserEmailAddress(userId: string): Promise<string> {
  try {
    // Query the users collection directly since we don't have a User model imported
    const usersCollection = mongoose.connection.collection('users');
    const user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    
    if (!user || !user.email) {
      logger.warn(`No email found for user ${userId}`, { userId });
      throw new Error(`User ${userId} has no email address`);
    }
    
    return user.email;
  } catch (error) {
    logger.error(`Error retrieving email for user ${userId}`, error as Error);
    throw error;
  }
}

/**
 * Loads and compiles an email template for a specific notification type
 * 
 * @param notificationType - Type of notification
 * @returns Compiled Handlebars template
 */
async function loadEmailTemplate(notificationType: NotificationType): Promise<handlebars.TemplateDelegate> {
  // Define template paths based on notification type
  const templatesDir = path.resolve(__dirname, '../../templates/email');
  let templatePath: string;
  
  switch (notificationType) {
    case NotificationType.EVENT_REMINDER:
      templatePath = path.join(templatesDir, 'event-reminder.hbs');
      break;
    case NotificationType.TRIBE_INVITATION:
      templatePath = path.join(templatesDir, 'tribe-invitation.hbs');
      break;
    case NotificationType.TRIBE_MATCH:
      templatePath = path.join(templatesDir, 'tribe-match.hbs');
      break;
    default:
      // Default to a generic template for other types
      templatePath = path.join(templatesDir, 'generic.hbs');
  }
  
  try {
    // Read template file
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    
    // Compile template
    return handlebars.compile(templateSource);
  } catch (error) {
    logger.error(`Error loading email template for ${notificationType}`, error as Error);
    
    // Fallback to a simple default template
    return handlebars.compile(`
      <html>
        <body>
          <h1>{{title}}</h1>
          <p>{{body}}</p>
          {{#if actionUrl}}
            <p><a href="{{actionUrl}}">View Details</a></p>
          {{/if}}
        </body>
      </html>
    `);
  }
}

/**
 * Creates HTML and text content for an email notification
 * 
 * @param notification - Notification data
 * @returns Email content in HTML and plain text formats
 */
async function createEmailContent(notification: INotification): Promise<{ html: string, text: string }> {
  try {
    // Load template for notification type
    const template = await loadEmailTemplate(notification.type);
    
    // Prepare template data
    const templateData = {
      title: notification.title,
      body: notification.body,
      actionUrl: notification.actionUrl,
      imageUrl: notification.imageUrl,
      ...notification.metadata
    };
    
    // Render HTML content
    const html = template(templateData);
    
    // Generate plain text version
    const text = `${notification.title}\n\n${notification.body}` + 
                 (notification.actionUrl ? `\n\nView details: ${notification.actionUrl}` : '');
    
    return { html, text };
  } catch (error) {
    logger.error('Error creating email content', error as Error);
    
    // Return simplified content in case of error
    return {
      html: `<html><body><h1>${notification.title}</h1><p>${notification.body}</p></body></html>`,
      text: `${notification.title}\n\n${notification.body}`
    };
  }
}

/**
 * Generates an appropriate email subject based on notification type and content
 * 
 * @param notification - Notification data
 * @returns Email subject line
 */
function getEmailSubject(notification: INotification): string {
  switch (notification.type) {
    case NotificationType.EVENT_REMINDER:
      return `Reminder: ${notification.metadata?.eventName || notification.title}`;
    case NotificationType.TRIBE_INVITATION:
      return `You've been invited to join ${notification.metadata?.tribeName || 'a new Tribe!'}`;
    case NotificationType.TRIBE_MATCH:
      return 'We found a Tribe match for you!';
    default:
      return notification.title;
  }
}

/**
 * Creates or updates delivery tracking record for an email notification
 * 
 * @param notificationId - ID of the notification
 * @param status - Delivery status
 * @param metadata - Additional metadata about the delivery
 * @returns Updated delivery document
 */
async function trackDelivery(
  notificationId: string, 
  status: NotificationStatus,
  metadata: Record<string, any> = {}
): Promise<IDeliveryDocument> {
  try {
    // Find existing delivery record for this notification and channel
    let delivery = await Delivery.findOne({ 
      notificationId, 
      channel: DeliveryChannel.EMAIL 
    });
    
    if (delivery) {
      // Update existing record
      delivery.status = status;
      delivery.metadata = { ...delivery.metadata, ...metadata };
    } else {
      // Create new delivery record
      delivery = new Delivery({
        notificationId,
        channel: DeliveryChannel.EMAIL,
        status,
        metadata
      });
    }
    
    // Save delivery record
    await delivery.save();
    
    return delivery;
  } catch (error) {
    logger.error('Error tracking email delivery', error as Error);
    throw error;
  }
}

/**
 * Provider for sending email notifications to users
 */
export class EmailProvider {
  private transporter: nodemailer.Transporter;
  private templateCache: Map<string, handlebars.TemplateDelegate>;
  
  /**
   * Initializes the email provider with SMTP configuration
   */
  constructor() {
    // Initialize nodemailer transporter with SMTP config
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD
      },
      pool: true, // Use connection pool for better performance
      maxConnections: 5, // Limit to 5 simultaneous connections
      maxMessages: 100 // Limit to 100 messages per connection
    });
    
    // Initialize template cache
    this.templateCache = new Map<string, handlebars.TemplateDelegate>();
    
    // Verify connection
    this.verifyConnection()
      .then(result => {
        if (result) {
          logger.info('Email provider initialized with verified SMTP connection');
        } else {
          logger.error('Email provider initialized but SMTP connection verification failed');
        }
      })
      .catch(error => {
        logger.error('Error verifying SMTP connection during initialization', error);
      });
  }
  
  /**
   * Sends an email notification to a user
   * 
   * @param notification - Notification data
   * @returns Delivery tracking document
   */
  async send(notification: INotification): Promise<IDeliveryDocument> {
    try {
      // Get user's email address
      let userEmail: string;
      try {
        userEmail = await getUserEmailAddress(notification.userId);
      } catch (error) {
        logger.warn(`Cannot send email for notification ${notification.id}: ${(error as Error).message}`);
        return await trackDelivery(notification.id, NotificationStatus.FAILED, {
          error: 'Failed to retrieve user email',
          errorDetails: (error as Error).message
        });
      }
      
      // Create delivery tracking record with PENDING status
      const delivery = await trackDelivery(notification.id, NotificationStatus.PENDING, {
        recipientEmail: userEmail,
        attemptedAt: new Date()
      });
      
      // Create email content
      const { html, text } = await createEmailContent(notification);
      const subject = getEmailSubject(notification);
      
      // Configure email message
      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${notificationConfig.emailConfig.emailFromName}" <${notificationConfig.emailConfig.emailFromAddress}>`,
        to: userEmail,
        subject,
        text,
        html,
        messageId: `<notification-${notification.id}@${env.SMTP_HOST}>`,
        headers: {
          'X-Notification-ID': notification.id,
          'X-Notification-Type': notification.type
        }
      };
      
      // If notification has attachment in metadata, include it
      if (notification.metadata?.attachments) {
        mailOptions.attachments = notification.metadata.attachments;
      }
      
      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      
      // Update delivery record with success status
      await trackDelivery(notification.id, NotificationStatus.SENT, {
        messageId: info.messageId,
        response: info.response,
        sentAt: new Date()
      });
      
      logger.info(`Email sent successfully for notification ${notification.id}`, {
        notificationId: notification.id,
        userId: notification.userId,
        messageId: info.messageId
      });
      
      return delivery;
    } catch (error) {
      logger.error(`Error sending email for notification ${notification.id}`, error as Error);
      
      // Update delivery record with failure status
      return await trackDelivery(notification.id, NotificationStatus.FAILED, {
        error: 'Failed to send email',
        errorDetails: (error as Error).message,
        failedAt: new Date()
      });
    }
  }
  
  /**
   * Sends email notifications to multiple users
   * 
   * @param notifications - Array of notification data
   * @returns Array of delivery tracking documents
   */
  async sendBulk(notifications: INotification[]): Promise<IDeliveryDocument[]> {
    // Process notifications in batches to avoid overwhelming the SMTP server
    const batchSize = 10; // Process 10 notifications at a time
    const results: IDeliveryDocument[] = [];
    
    // Process notifications in batches
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      // Send emails in parallel within each batch
      const batchResults = await Promise.all(
        batch.map(notification => this.send(notification))
      );
      
      results.push(...batchResults);
      
      // Pause briefly between batches to avoid rate limiting
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Log summary of batch sending
    const successCount = results.filter(r => r.status === NotificationStatus.SENT).length;
    const failCount = results.filter(r => r.status === NotificationStatus.FAILED).length;
    
    logger.info(`Bulk email sending completed: ${successCount} succeeded, ${failCount} failed`);
    
    return results;
  }
  
  /**
   * Retries sending a failed email notification
   * 
   * @param delivery - Failed delivery document
   * @returns Updated delivery document
   */
  async retry(delivery: IDeliveryDocument): Promise<IDeliveryDocument> {
    try {
      // Check if retry count exceeds maximum attempts
      if (delivery.retryCount >= notificationConfig.maxRetryAttempts) {
        logger.warn(`Maximum retry attempts reached for notification ${delivery.notificationId}`);
        return delivery;
      }
      
      // Retrieve original notification from database
      const notificationsCollection = mongoose.connection.collection('notifications');
      const notification = await notificationsCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(delivery.notificationId) 
      });
      
      if (!notification) {
        logger.warn(`Cannot retry notification ${delivery.notificationId}: notification not found`);
        return await trackDelivery(delivery.notificationId, NotificationStatus.FAILED, {
          ...delivery.metadata,
          error: 'Notification not found for retry',
          retryCount: (delivery.retryCount || 0) + 1,
          lastRetryAt: new Date()
        });
      }
      
      // Increment retry count
      delivery.retryCount = (delivery.retryCount || 0) + 1;
      await delivery.save();
      
      logger.info(`Retrying email notification ${delivery.notificationId}, attempt ${delivery.retryCount}`);
      
      // Try to send the notification again
      return await this.send(notification as unknown as INotification);
    } catch (error) {
      logger.error(`Error retrying email for notification ${delivery.notificationId}`, error as Error);
      
      // Update delivery record with failure status and increment retry count
      return await trackDelivery(delivery.notificationId, NotificationStatus.FAILED, {
        ...delivery.metadata,
        error: 'Failed to retry email',
        errorDetails: (error as Error).message,
        retryCount: (delivery.retryCount || 0) + 1,
        lastRetryAt: new Date()
      });
    }
  }
  
  /**
   * Verifies the SMTP connection is working
   * 
   * @returns True if connection is successful
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed', error as Error);
      return false;
    }
  }
}

// Create and export singleton instance
export const emailProvider = new EmailProvider();