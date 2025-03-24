import Joi from 'joi'; // ^17.9.2
import { idSchema } from '@shared/validation/common.validation';
import { PaymentProvider, PaymentMethod } from '@shared/types/payment.types';
import { validateBody, validateParams, validateQuery } from '@shared/middlewares/validation.middleware';

// Schema for creating a new payment method
export const createPaymentMethodSchema = Joi.object({
  userId: idSchema.required(),
  provider: Joi.string().valid(...Object.values(PaymentProvider)).required(),
  type: Joi.string().valid(...Object.values(PaymentMethod)).required(),
  token: Joi.string().required(),
  isDefault: Joi.boolean().default(false),
  // Card-specific fields, required only for credit/debit cards
  last4: Joi.when('type', {
    is: Joi.string().valid(PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD),
    then: Joi.string().length(4).pattern(/^[0-9]{4}$/).optional(),
    otherwise: Joi.forbidden()
  }),
  expiryMonth: Joi.when('type', {
    is: Joi.string().valid(PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD),
    then: Joi.number().integer().min(1).max(12).optional(),
    otherwise: Joi.forbidden()
  }),
  expiryYear: Joi.when('type', {
    is: Joi.string().valid(PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD),
    then: Joi.number().integer().min(new Date().getFullYear()).max(new Date().getFullYear() + 20).optional(),
    otherwise: Joi.forbidden()
  })
});

// Schema for retrieving a specific payment method by ID
export const getPaymentMethodSchema = Joi.object({
  id: idSchema.required()
});

// Schema for querying payment methods
export const getPaymentMethodsSchema = Joi.object({
  userId: idSchema.required(),
  provider: Joi.string().valid(...Object.values(PaymentProvider)).optional(),
  type: Joi.string().valid(...Object.values(PaymentMethod)).optional(),
  isDefault: Joi.boolean().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  page: Joi.number().integer().min(1).default(1)
});

// Schema for updating a payment method
export const updatePaymentMethodSchema = Joi.object({
  // Only allow updating card details and default status
  last4: Joi.string().length(4).pattern(/^[0-9]{4}$/).optional(),
  expiryMonth: Joi.number().integer().min(1).max(12).optional(),
  expiryYear: Joi.number().integer().min(new Date().getFullYear()).max(new Date().getFullYear() + 20).optional(),
  isDefault: Joi.boolean().optional()
});

// Schema for deleting a payment method
export const deletePaymentMethodSchema = Joi.object({
  id: idSchema.required(),
  userId: idSchema.required()
});

// Schema for setting a payment method as default
export const setDefaultPaymentMethodSchema = Joi.object({
  id: idSchema.required(),
  userId: idSchema.required()
});

// Middleware for validating payment method creation requests
export const validateCreatePaymentMethod = validateBody(createPaymentMethodSchema);

// Middleware for validating payment method retrieval by ID
export const validateGetPaymentMethod = validateParams(getPaymentMethodSchema);

// Middleware for validating payment methods query requests
export const validateGetPaymentMethods = validateQuery(getPaymentMethodsSchema);

// Middleware for validating payment method update requests
export const validateUpdatePaymentMethod = validateBody(updatePaymentMethodSchema);

// Middleware for validating payment method deletion requests
export const validateDeletePaymentMethod = validateParams(deletePaymentMethodSchema);

// Middleware for validating setting a payment method as default
export const validateSetDefaultPaymentMethod = validateParams(setDefaultPaymentMethodSchema);