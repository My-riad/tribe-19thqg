import Joi from 'joi'; // v17.6.0
import { ValidationError } from '../../../shared/src/errors/validation.error';
import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  DeliveryChannel
} from '../../../shared/src/types/notification.types';

/**
 * Schema for validating notification creation requests
 */
export const createNotificationSchema = Joi.object({
  userId: Joi.string().required().messages({
    'any.required': 'User ID is required'
  }),
  type: Joi.string().valid(...Object.values(NotificationType)).required().messages({
    'any.required': 'Notification type is required',
    'any.only': 'Invalid notification type'
  }),
  title: Joi.string().max(100).required().messages({
    'any.required': 'Title is required',
    'string.max': 'Title cannot exceed 100 characters'
  }),
  body: Joi.string().max(500).required().messages({
    'any.required': 'Body is required',
    'string.max': 'Body cannot exceed 500 characters'
  }),
  priority: Joi.string().valid(...Object.values(NotificationPriority)).default(NotificationPriority.MEDIUM).messages({
    'any.only': 'Invalid notification priority'
  }),
  expiresAt: Joi.date().min('now').allow(null).default(null).messages({
    'date.min': 'Expiration date must be in the future'
  }),
  tribeId: Joi.string().allow(null).default(null).messages({
    'string.base': 'Tribe ID must be a string'
  }),
  eventId: Joi.string().allow(null).default(null).messages({
    'string.base': 'Event ID must be a string'
  }),
  actionUrl: Joi.string().uri().allow(null).default(null).messages({
    'string.uri': 'Action URL must be a valid URI'
  }),
  imageUrl: Joi.string().uri().allow(null).default(null).messages({
    'string.uri': 'Image URL must be a valid URI'
  }),
  metadata: Joi.object().allow(null).default(null)
});

/**
 * Schema for validating notification retrieval queries
 */
export const getNotificationsSchema = Joi.object({
  userId: Joi.string().required().messages({
    'any.required': 'User ID is required'
  }),
  type: Joi.string().valid(...Object.values(NotificationType)).allow(null).default(null).messages({
    'any.only': 'Invalid notification type'
  }),
  status: Joi.string().valid(...Object.values(NotificationStatus)).allow(null).default(null).messages({
    'any.only': 'Invalid notification status'
  }),
  tribeId: Joi.string().allow(null).default(null),
  eventId: Joi.string().allow(null).default(null),
  startDate: Joi.date().allow(null).default(null),
  endDate: Joi.date().min(Joi.ref('startDate')).allow(null).default(null).messages({
    'date.min': 'End date must be after start date'
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'Limit must be a number',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  }),
  offset: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'Offset must be a number',
    'number.min': 'Offset must be at least 0'
  })
});

/**
 * Schema for validating notification ID parameters
 */
export const notificationIdSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'Notification ID is required'
  })
});

/**
 * Schema for validating bulk notification creation
 */
export const bulkCreateNotificationSchema = Joi.object({
  userIds: Joi.array().items(Joi.string()).min(1).required().messages({
    'any.required': 'User IDs are required',
    'array.min': 'At least one user ID is required'
  }),
  type: Joi.string().valid(...Object.values(NotificationType)).required().messages({
    'any.required': 'Notification type is required',
    'any.only': 'Invalid notification type'
  }),
  title: Joi.string().max(100).required().messages({
    'any.required': 'Title is required',
    'string.max': 'Title cannot exceed 100 characters'
  }),
  body: Joi.string().max(500).required().messages({
    'any.required': 'Body is required',
    'string.max': 'Body cannot exceed 500 characters'
  }),
  priority: Joi.string().valid(...Object.values(NotificationPriority)).default(NotificationPriority.MEDIUM).messages({
    'any.only': 'Invalid notification priority'
  }),
  expiresAt: Joi.date().min('now').allow(null).default(null).messages({
    'date.min': 'Expiration date must be in the future'
  }),
  tribeId: Joi.string().allow(null).default(null),
  eventId: Joi.string().allow(null).default(null),
  actionUrl: Joi.string().uri().allow(null).default(null).messages({
    'string.uri': 'Action URL must be a valid URI'
  }),
  imageUrl: Joi.string().uri().allow(null).default(null).messages({
    'string.uri': 'Image URL must be a valid URI'
  }),
  metadata: Joi.object().allow(null).default(null)
});

/**
 * Schema for validating tribe-wide notification creation
 */
export const tribeNotificationSchema = Joi.object({
  tribeId: Joi.string().required().messages({
    'any.required': 'Tribe ID is required'
  }),
  excludeUserIds: Joi.array().items(Joi.string()).allow(null).default(null),
  type: Joi.string().valid(...Object.values(NotificationType)).required().messages({
    'any.required': 'Notification type is required',
    'any.only': 'Invalid notification type'
  }),
  title: Joi.string().max(100).required().messages({
    'any.required': 'Title is required',
    'string.max': 'Title cannot exceed 100 characters'
  }),
  body: Joi.string().max(500).required().messages({
    'any.required': 'Body is required',
    'string.max': 'Body cannot exceed 500 characters'
  }),
  priority: Joi.string().valid(...Object.values(NotificationPriority)).default(NotificationPriority.MEDIUM).messages({
    'any.only': 'Invalid notification priority'
  }),
  expiresAt: Joi.date().min('now').allow(null).default(null).messages({
    'date.min': 'Expiration date must be in the future'
  }),
  eventId: Joi.string().allow(null).default(null),
  actionUrl: Joi.string().uri().allow(null).default(null).messages({
    'string.uri': 'Action URL must be a valid URI'
  }),
  imageUrl: Joi.string().uri().allow(null).default(null).messages({
    'string.uri': 'Image URL must be a valid URI'
  }),
  metadata: Joi.object().allow(null).default(null)
});

/**
 * Schema for validating marking notifications as read
 */
export const markAsReadSchema = Joi.object({
  userId: Joi.string().required().messages({
    'any.required': 'User ID is required'
  }),
  notificationIds: Joi.array().items(Joi.string()).min(1).when('all', {
    is: Joi.boolean().valid(true),
    then: Joi.optional(),
    otherwise: Joi.required()
  }).messages({
    'any.required': 'Notification IDs are required when not marking all as read',
    'array.min': 'At least one notification ID is required'
  }),
  all: Joi.boolean().default(false).messages({
    'boolean.base': 'All must be a boolean value'
  })
});

/**
 * Schema for validating delivery statistics queries
 */
export const deliveryStatsSchema = Joi.object({
  startDate: Joi.date().allow(null).default(null),
  endDate: Joi.date().min(Joi.ref('startDate')).allow(null).default(null).messages({
    'date.min': 'End date must be after start date'
  })
});

/**
 * Validates notification creation request data against the createNotificationSchema
 * 
 * @param notificationData - The notification data to validate
 * @returns The validated notification data
 * @throws ValidationError if validation fails
 */
export function validateCreateNotification(notificationData: any) {
  const { error, value } = createNotificationSchema.validate(notificationData, { abortEarly: false });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates notification retrieval query parameters against the getNotificationsSchema
 * 
 * @param queryParams - The query parameters to validate
 * @returns The validated query parameters
 * @throws ValidationError if validation fails
 */
export function validateGetNotifications(queryParams: any) {
  const { error, value } = getNotificationsSchema.validate(queryParams, { abortEarly: false });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates notification ID parameter against the notificationIdSchema
 * 
 * @param params - The parameters containing the notification ID
 * @returns The validated parameters
 * @throws ValidationError if validation fails
 */
export function validateNotificationId(params: any) {
  const { error, value } = notificationIdSchema.validate(params, { abortEarly: false });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates bulk notification creation request data against the bulkCreateNotificationSchema
 * 
 * @param bulkData - The bulk notification creation data to validate
 * @returns The validated bulk creation data
 * @throws ValidationError if validation fails
 */
export function validateBulkCreateNotification(bulkData: any) {
  const { error, value } = bulkCreateNotificationSchema.validate(bulkData, { abortEarly: false });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates tribe notification creation request data against the tribeNotificationSchema
 * 
 * @param tribeData - The tribe notification data to validate
 * @returns The validated tribe notification data
 * @throws ValidationError if validation fails
 */
export function validateTribeNotification(tribeData: any) {
  const { error, value } = tribeNotificationSchema.validate(tribeData, { abortEarly: false });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates mark as read request data against the markAsReadSchema
 * 
 * @param readData - The mark as read data to validate
 * @returns The validated mark as read data
 * @throws ValidationError if validation fails
 */
export function validateMarkAsRead(readData: any) {
  const { error, value } = markAsReadSchema.validate(readData, { abortEarly: false });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}

/**
 * Validates delivery stats query parameters against the deliveryStatsSchema
 * 
 * @param queryParams - The query parameters to validate
 * @returns The validated query parameters
 * @throws ValidationError if validation fails
 */
export function validateDeliveryStats(queryParams: any) {
  const { error, value } = deliveryStatsSchema.validate(queryParams, { abortEarly: false });
  
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  
  return value;
}