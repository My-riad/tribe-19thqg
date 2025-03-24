/**
 * Payment Service Validation Module
 * 
 * This module centralizes and exports all validation schemas and middleware from the 
 * payment service validation modules. It provides validation utilities for:
 * - Payment methods (credit cards, bank accounts, etc.)
 * - Payment splits (dividing costs among users)
 * - Transactions (financial operations)
 * 
 * These validation utilities ensure data integrity, security, and consistency across
 * all payment-related operations in the Tribe platform.
 * 
 * @version 1.0.0
 */

// Import payment method validation schemas and middleware
export { 
  createPaymentMethodSchema,
  getPaymentMethodSchema,
  getPaymentMethodsSchema,
  updatePaymentMethodSchema,
  deletePaymentMethodSchema,
  setDefaultPaymentMethodSchema,
  validateCreatePaymentMethod,
  validateGetPaymentMethod,
  validateGetPaymentMethods,
  validateUpdatePaymentMethod,
  validateDeletePaymentMethod,
  validateSetDefaultPaymentMethod
} from './payment.validation';

// Import payment split validation schemas and middleware
export {
  createSplitSchema,
  getSplitSchema,
  getSplitsSchema,
  updateSplitStatusSchema,
  cancelSplitSchema,
  updateShareStatusSchema,
  validateCreateSplit,
  validateGetSplit,
  validateGetSplits,
  validateUpdateSplitStatus,
  validateCancelSplit,
  validateUpdateShareStatus
} from './split.validation';

// Import transaction validation schemas and middleware
export {
  createTransactionSchema,
  getTransactionSchema,
  getTransactionsSchema,
  updateTransactionStatusSchema,
  refundTransactionSchema,
  validateCreateTransaction,
  validateGetTransaction,
  validateGetTransactions,
  validateUpdateTransactionStatus,
  validateRefundTransaction
} from './transaction.validation';