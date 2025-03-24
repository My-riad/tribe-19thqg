/**
 * Split Validation
 * 
 * Defines validation schemas for payment split operations in the Tribe application.
 * This module provides Joi validation schemas for creating, retrieving, updating,
 * and managing payment splits to ensure data integrity and security.
 */

import Joi from 'joi'; // ^17.9.2
import { idSchema, dateSchema } from '@shared/validation/common.validation';
import { SplitType, SplitStatus, PaymentStatus } from '@shared/types/payment.types';
import { validateBody, validateParams, validateQuery, validateRequest } from '@shared/middlewares/validation.middleware';

/**
 * Validation schema for creating a new payment split
 */
export const createSplitSchema = Joi.object({
  eventId: idSchema.required().messages({
    'any.required': 'Event ID is required for creating a split'
  }),
  description: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Description must be at least 3 characters',
    'string.max': 'Description cannot exceed 200 characters',
    'any.required': 'Description is required'
  }),
  totalAmount: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Total amount must be a valid number',
    'number.positive': 'Total amount must be greater than 0',
    'number.precision': 'Total amount cannot have more than 2 decimal places',
    'any.required': 'Total amount is required'
  }),
  currency: Joi.string().length(3).uppercase().required().messages({
    'string.length': 'Currency must be a 3-letter ISO currency code',
    'string.uppercase': 'Currency must be uppercase',
    'any.required': 'Currency is required'
  }),
  splitType: Joi.string().valid(...Object.values(SplitType)).required().messages({
    'string.valid': `Split type must be one of: ${Object.values(SplitType).join(', ')}`,
    'any.required': 'Split type is required'
  }),
  dueDate: dateSchema.required().messages({
    'any.required': 'Due date is required'
  }),
  participants: Joi.array().items(
    Joi.object({
      userId: idSchema.required().messages({
        'any.required': 'User ID is required for each participant'
      }),
      amount: Joi.number().positive().precision(2).messages({
        'number.base': 'Amount must be a valid number',
        'number.positive': 'Amount must be greater than 0',
        'number.precision': 'Amount cannot have more than 2 decimal places'
      }),
      percentage: Joi.number().min(0).max(100).messages({
        'number.base': 'Percentage must be a valid number',
        'number.min': 'Percentage cannot be negative',
        'number.max': 'Percentage cannot exceed 100'
      })
    })
  ).min(2).max(20).required().messages({
    'array.min': 'At least 2 participants are required',
    'array.max': 'Maximum of 20 participants allowed',
    'any.required': 'Participants are required'
  }),
  metadata: Joi.object().allow(null).optional()
}).custom((value, helpers) => {
  // Additional validation based on splitType
  const { splitType, participants } = value;
  
  if (splitType === SplitType.CUSTOM) {
    // For custom splits, ensure each participant has an amount
    for (const participant of participants) {
      if (!participant.amount) {
        return helpers.error('any.custom', { message: 'Amount is required for each participant in a custom split' });
      }
    }
    
    // Validate that the sum of amounts equals totalAmount
    const totalParticipantAmount = participants.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalParticipantAmount - value.totalAmount) > 0.01) { // Allow small rounding errors
      return helpers.error('any.custom', { 
        message: `Sum of participant amounts (${totalParticipantAmount}) must equal total amount (${value.totalAmount})` 
      });
    }
  } else if (splitType === SplitType.PERCENTAGE) {
    // For percentage splits, ensure each participant has a percentage
    for (const participant of participants) {
      if (participant.percentage === undefined) {
        return helpers.error('any.custom', { message: 'Percentage is required for each participant in a percentage split' });
      }
    }
    
    // Validate that percentages sum to 100
    const totalPercentage = participants.reduce((sum, p) => sum + p.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) { // Allow small rounding errors
      return helpers.error('any.custom', { 
        message: `Sum of percentages (${totalPercentage}) must equal 100%` 
      });
    }
  }
  
  return value;
});

/**
 * Validation schema for retrieving a specific payment split by ID
 */
export const getSplitSchema = Joi.object({
  splitId: idSchema.required().messages({
    'any.required': 'Split ID is required'
  })
});

/**
 * Validation schema for querying payment splits
 */
export const getSplitsSchema = Joi.object({
  eventId: idSchema.optional(),
  userId: idSchema.optional(),
  status: Joi.string().valid(...Object.values(SplitStatus)).optional().messages({
    'string.valid': `Status must be one of: ${Object.values(SplitStatus).join(', ')}`
  }),
  createdBy: idSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'Limit must be a valid integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  }),
  offset: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'Offset must be a valid integer',
    'number.min': 'Offset cannot be negative'
  }),
  sortBy: Joi.string().valid('createdAt', 'dueDate', 'totalAmount').default('createdAt').messages({
    'string.valid': 'Sort field must be one of: createdAt, dueDate, totalAmount'
  }),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
    'string.valid': 'Sort order must be either asc or desc'
  })
});

/**
 * Validation schema for updating a payment split status
 */
export const updateSplitStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(SplitStatus)).required().messages({
    'string.valid': `Status must be one of: ${Object.values(SplitStatus).join(', ')}`,
    'any.required': 'Status is required'
  })
});

/**
 * Validation schema for cancelling a payment split
 */
export const cancelSplitSchema = Joi.object({
  reason: Joi.string().max(200).optional().messages({
    'string.max': 'Reason cannot exceed 200 characters'
  })
});

/**
 * Validation schema for payment share params
 */
export const shareParamsSchema = Joi.object({
  splitId: idSchema.required().messages({
    'any.required': 'Split ID is required'
  }),
  shareId: idSchema.required().messages({
    'any.required': 'Share ID is required'
  })
});

/**
 * Validation schema for updating a payment share status
 */
export const updateShareStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(PaymentStatus)).required().messages({
    'string.valid': `Status must be one of: ${Object.values(PaymentStatus).join(', ')}`,
    'any.required': 'Status is required'
  }),
  transactionId: Joi.when('status', {
    is: PaymentStatus.COMPLETED,
    then: idSchema.required().messages({
      'any.required': 'Transaction ID is required when status is COMPLETED'
    }),
    otherwise: idSchema.optional()
  })
});

/**
 * Middleware for validating payment split creation requests
 */
export const validateCreateSplit = validateBody(createSplitSchema);

/**
 * Middleware for validating payment split retrieval by ID
 */
export const validateGetSplit = validateParams(getSplitSchema);

/**
 * Middleware for validating payment splits query requests
 */
export const validateGetSplits = validateQuery(getSplitsSchema);

/**
 * Middleware for validating payment split status update requests
 */
export const validateUpdateSplitStatus = validateRequest({
  params: getSplitSchema,
  body: updateSplitStatusSchema
});

/**
 * Middleware for validating payment split cancellation requests
 */
export const validateCancelSplit = validateParams(getSplitSchema);

/**
 * Middleware for validating payment share status update requests
 */
export const validateUpdateShareStatus = validateRequest({
  params: shareParamsSchema,
  body: updateShareStatusSchema
});