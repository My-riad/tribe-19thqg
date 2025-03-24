/**
 * Chat validation schemas for the Tribe service.
 * 
 * This module defines Joi validation schemas for chat-related operations,
 * ensuring data integrity and security for tribe communication features.
 * Validates formats for regular messages, AI prompts, system messages, and event announcements.
 */

import Joi from 'joi'; // v17.9.2
import { idSchema, paginationSchema } from '../../../shared/src/validation/common.validation';
import { MessageType } from '../../../shared/src/types/tribe.types';

/**
 * Validation schema for creating a new chat message
 */
export const createMessageSchema = {
  body: Joi.object({
    tribeId: idSchema.required().messages({
      'any.required': 'Tribe ID is required'
    }),
    content: Joi.string().trim().min(1).max(2000).required().messages({
      'string.empty': 'Message content cannot be empty',
      'string.min': 'Message content must be at least 1 character',
      'string.max': 'Message content cannot exceed 2000 characters',
      'any.required': 'Message content is required'
    }),
    messageType: Joi.string().valid(...Object.values(MessageType)).default(MessageType.TEXT),
    metadata: Joi.object().default({})
  })
};

/**
 * Validation schema for retrieving a specific chat message
 */
export const getMessageSchema = {
  params: Joi.object({
    messageId: idSchema.required().messages({
      'any.required': 'Message ID is required'
    })
  })
};

/**
 * Validation schema for retrieving chat messages for a tribe
 */
export const getTribeMessagesSchema = {
  params: Joi.object({
    tribeId: idSchema.required().messages({
      'any.required': 'Tribe ID is required'
    })
  }),
  query: paginationSchema.keys({
    beforeId: idSchema.optional(),
    afterId: idSchema.optional()
  })
};

/**
 * Validation schema for marking messages as read
 */
export const markMessagesAsReadSchema = {
  body: Joi.object({
    messageIds: Joi.array().items(idSchema).min(1).required().messages({
      'array.min': 'At least one message ID is required',
      'any.required': 'Message IDs are required'
    })
  })
};

/**
 * Validation schema for getting unread message count
 */
export const getUnreadMessageCountSchema = {
  params: Joi.object({
    tribeId: idSchema.required().messages({
      'any.required': 'Tribe ID is required'
    })
  })
};

/**
 * Validation schema for deleting a chat message
 */
export const deleteMessageSchema = {
  params: Joi.object({
    messageId: idSchema.required().messages({
      'any.required': 'Message ID is required'
    })
  })
};

/**
 * Validation schema for creating an AI-generated prompt message
 */
export const createAIPromptSchema = {
  params: Joi.object({
    tribeId: idSchema.required().messages({
      'any.required': 'Tribe ID is required'
    })
  })
};

/**
 * Validation schema for creating a system message
 */
export const createSystemMessageSchema = {
  params: Joi.object({
    tribeId: idSchema.required().messages({
      'any.required': 'Tribe ID is required'
    })
  }),
  body: Joi.object({
    content: Joi.string().trim().min(1).max(2000).required().messages({
      'string.empty': 'Message content cannot be empty',
      'string.min': 'Message content must be at least 1 character',
      'string.max': 'Message content cannot exceed 2000 characters',
      'any.required': 'Message content is required'
    }),
    metadata: Joi.object().default({})
  })
};

/**
 * Validation schema for creating an event-related message
 */
export const createEventMessageSchema = {
  params: Joi.object({
    tribeId: idSchema.required().messages({
      'any.required': 'Tribe ID is required'
    })
  }),
  body: Joi.object({
    content: Joi.string().trim().min(1).max(2000).required().messages({
      'string.empty': 'Message content cannot be empty',
      'string.min': 'Message content must be at least 1 character',
      'string.max': 'Message content cannot exceed 2000 characters',
      'any.required': 'Message content is required'
    }),
    eventData: Joi.object({
      eventId: idSchema.required(),
      eventName: Joi.string().required(),
      eventTime: Joi.date().iso().required(),
      eventLocation: Joi.string().required()
    }).required().messages({
      'any.required': 'Event data is required'
    })
  })
};

/**
 * Validation schema for searching chat messages
 */
export const searchMessagesSchema = {
  params: Joi.object({
    tribeId: idSchema.required().messages({
      'any.required': 'Tribe ID is required'
    })
  }),
  query: paginationSchema.keys({
    query: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Search query cannot be empty',
      'string.min': 'Search query must be at least 1 character',
      'string.max': 'Search query cannot exceed 100 characters',
      'any.required': 'Search query is required'
    })
  })
};