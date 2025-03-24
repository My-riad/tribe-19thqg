import Joi from 'joi'; // ^17.9.2
import { validateBody, validateParams, validateQuery, validateRequest } from '../../../shared/src/middlewares/validation.middleware';
import { NotificationType, DeliveryChannel } from '../../../shared/src/types/notification.types';

/**
 * Schema for validating preference creation requests
 */
const createPreferenceSchema = Joi.object({
  userId: Joi.string().required(),
  notificationType: Joi.string().valid(...Object.values(NotificationType)).required(),
  enabled: Joi.boolean().default(true),
  channels: Joi.array().items(Joi.string().valid(...Object.values(DeliveryChannel))).min(1)
});

/**
 * Schema for validating preference update requests
 */
const updatePreferenceSchema = Joi.object({
  enabled: Joi.boolean(),
  channels: Joi.array().items(Joi.string().valid(...Object.values(DeliveryChannel))).min(1)
});

/**
 * Schema for validating preference retrieval requests
 */
const getPreferencesSchema = Joi.object({
  userId: Joi.string().required(),
  notificationType: Joi.string().valid(...Object.values(NotificationType))
});

/**
 * Schema for validating preference ID in request parameters
 */
const preferenceIdSchema = Joi.object({
  id: Joi.string().required()
});

/**
 * Schema for validating bulk preference update requests
 */
const bulkUpdatePreferencesSchema = Joi.object({
  userId: Joi.string().required(),
  preferences: Joi.array().items(
    Joi.object({
      notificationType: Joi.string().valid(...Object.values(NotificationType)).required(),
      enabled: Joi.boolean(),
      channels: Joi.array().items(Joi.string().valid(...Object.values(DeliveryChannel))).min(1)
    })
  ).min(1).required()
});

/**
 * Middleware for validating preference creation requests
 */
export const validateCreatePreference = validateBody(createPreferenceSchema);

/**
 * Middleware for validating preference update requests
 */
export const validateUpdatePreference = validateBody(updatePreferenceSchema);

/**
 * Middleware for validating preference retrieval requests
 */
export const validateGetPreferences = validateQuery(getPreferencesSchema);

/**
 * Middleware for validating preference ID in request parameters
 */
export const validatePreferenceId = validateParams(preferenceIdSchema);

/**
 * Middleware for validating bulk preference update requests
 */
export const validateBulkUpdatePreferences = validateBody(bulkUpdatePreferencesSchema);

/**
 * Middleware for validating notification type toggle requests
 */
export const validateToggleNotificationType = validateRequest({
  params: Joi.object({
    userId: Joi.string().required(),
    notificationType: Joi.string().valid(...Object.values(NotificationType)).required()
  }),
  body: Joi.object({
    enabled: Joi.boolean().required()
  })
});

/**
 * Middleware for validating channel update requests
 */
export const validateUpdateChannels = validateRequest({
  params: Joi.object({
    userId: Joi.string().required(),
    notificationType: Joi.string().valid(...Object.values(NotificationType)).required()
  }),
  body: Joi.object({
    channels: Joi.array().items(Joi.string().valid(...Object.values(DeliveryChannel))).min(1).required()
  })
});