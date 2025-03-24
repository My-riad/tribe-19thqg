/**
 * activity.validation.ts
 * 
 * Defines validation schemas for tribe activity-related operations in the Tribe platform.
 * These schemas ensure data integrity and consistency for creating, filtering, and retrieving
 * activities within tribes, supporting the AI-driven engagement and group management features.
 */

import Joi from 'joi'; // v17.9.2
import { idSchema, paginationSchema, timeRangeSchema } from '@shared/validation/common.validation';
import { ActivityType } from '@shared/types';

/**
 * Validation schema for creating a new tribe activity
 * Used when recording actions and events within a tribe
 */
export const createActivitySchema = Joi.object({
  tribeId: idSchema.required().messages({
    'any.required': 'Tribe ID is required'
  }),
  userId: idSchema.required().messages({
    'any.required': 'User ID is required'
  }),
  activityType: Joi.string().valid(...Object.values(ActivityType)).required().messages({
    'any.only': 'Activity type must be one of the valid types',
    'any.required': 'Activity type is required'
  }),
  description: Joi.string().min(1).max(500).required().messages({
    'string.min': 'Description must be at least 1 character',
    'string.max': 'Description cannot exceed 500 characters',
    'any.required': 'Description is required'
  }),
  metadata: Joi.object().default({})
});

/**
 * Validation schema for activity ID parameter
 * Used when retrieving or manipulating a specific activity
 */
export const activityIdSchema = Joi.object({
  activityId: idSchema.required().messages({
    'any.required': 'Activity ID is required'
  })
});

/**
 * Validation schema for tribe ID parameter
 * Used when retrieving activities for a specific tribe
 */
export const tribeIdSchema = Joi.object({
  tribeId: idSchema.required().messages({
    'any.required': 'Tribe ID is required'
  })
});

/**
 * Validation schema for user ID parameter
 * Used when retrieving activities related to a specific user
 */
export const userIdSchema = Joi.object({
  userId: idSchema.required().messages({
    'any.required': 'User ID is required'
  })
});

/**
 * Validation schema for activity filtering parameters
 * Used to filter and paginate activity lists
 */
export const activityFiltersSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  activityTypes: Joi.array().items(
    Joi.string().valid(...Object.values(ActivityType))
  ).single()
});

/**
 * Validation schema for activity statistics parameters
 * Used when retrieving aggregated activity data within a date range
 */
export const activityStatsSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate'))
});

/**
 * Validation schema for creating an AI-generated engagement activity
 * Used specifically for AI-driven conversation prompts and challenges
 */
export const aiEngagementActivitySchema = Joi.object({
  tribeId: idSchema.required().messages({
    'any.required': 'Tribe ID is required'
  }),
  description: Joi.string().min(1).max(500).required().messages({
    'string.min': 'Description must be at least 1 character',
    'string.max': 'Description cannot exceed 500 characters',
    'any.required': 'Description is required'
  }),
  metadata: Joi.object().default({})
});