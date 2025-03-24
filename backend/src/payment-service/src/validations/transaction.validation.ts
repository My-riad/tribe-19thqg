import Joi from 'joi'; // v17.9.2
import { idSchema } from '@shared/validation/common.validation';
import { 
  TransactionType,
  TransactionStatus,
  PaymentProvider
} from '@shared/types/payment.types';
import { 
  validateBody, 
  validateParams, 
  validateQuery 
} from '@shared/middlewares/validation.middleware';

/**
 * Validation schema for creating a new transaction
 * Ensures all required fields are provided and correctly formatted
 * Uses conditional validation based on transaction type
 */
export const createTransactionSchema = Joi.object({
  type: Joi.string().valid(...Object.values(TransactionType)).required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().length(3).uppercase().default('USD'),
  description: Joi.string().min(3).max(255).required(),
  userId: idSchema.required(),
  paymentMethodId: idSchema.required(),
  provider: Joi.string().valid(...Object.values(PaymentProvider)).required(),
  eventId: Joi.when('type', {
    is: TransactionType.EVENT_PAYMENT,
    then: idSchema.required(),
    otherwise: Joi.string().allow(null, '').optional()
  }),
  splitId: Joi.when('type', {
    is: TransactionType.SPLIT_PAYMENT,
    then: idSchema.required(),
    otherwise: Joi.string().allow(null, '').optional()
  }),
  metadata: Joi.object().optional()
});

/**
 * Validation schema for retrieving a specific transaction by ID
 */
export const getTransactionSchema = Joi.object({
  id: idSchema.required()
});

/**
 * Validation schema for querying transactions
 * Provides comprehensive filtering, pagination, and sorting options
 */
export const getTransactionsSchema = Joi.object({
  userId: idSchema.optional(),
  type: Joi.string().valid(...Object.values(TransactionType)).optional(),
  status: Joi.string().valid(...Object.values(TransactionStatus)).optional(),
  provider: Joi.string().valid(...Object.values(PaymentProvider)).optional(),
  eventId: idSchema.optional(),
  splitId: idSchema.optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  minAmount: Joi.number().positive().precision(2).optional(),
  maxAmount: Joi.number().positive().precision(2).min(Joi.ref('minAmount')).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  page: Joi.number().integer().min(1).default(1),
  sortBy: Joi.string().valid('createdAt', 'amount', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * Validation schema for updating a transaction status
 * Ensures status changes follow valid payment lifecycle transitions
 */
export const updateTransactionStatusSchema = Joi.object({
  id: idSchema.required(),
  status: Joi.string().valid(...Object.values(TransactionStatus)).required(),
  providerTransactionId: Joi.string().optional(),
  metadata: Joi.object().optional()
});

/**
 * Validation schema for refunding a transaction
 * Requires a reason for the refund for audit purposes
 */
export const refundTransactionSchema = Joi.object({
  id: idSchema.required(),
  reason: Joi.string().min(3).max(255).required(),
  metadata: Joi.object().optional()
});

/**
 * Middleware for validating transaction creation requests
 * Used on POST /transactions routes
 */
export const validateCreateTransaction = validateBody(createTransactionSchema);

/**
 * Middleware for validating transaction retrieval by ID
 * Used on GET /transactions/:id routes
 */
export const validateGetTransaction = validateParams(getTransactionSchema);

/**
 * Middleware for validating transactions query requests
 * Used on GET /transactions routes with query parameters
 */
export const validateGetTransactions = validateQuery(getTransactionsSchema);

/**
 * Middleware for validating transaction status update requests
 * Used on PATCH /transactions/:id/status routes
 */
export const validateUpdateTransactionStatus = validateBody(updateTransactionStatusSchema);

/**
 * Middleware for validating transaction refund requests
 * Used on POST /transactions/:id/refund routes
 */
export const validateRefundTransaction = validateBody(refundTransactionSchema);