/**
 * Payment Services Index
 *
 * This file exports all payment-related services from the payment service module,
 * providing a centralized entry point for accessing payment functionality
 * throughout the application.
 *
 * @module payment-service/services
 * @version 1.0.0
 */

import { PaymentService } from './payment.service';
import { SplitService } from './split.service';
import { TransactionService } from './transaction.service';

export {
  /**
   * Service for managing payment methods (credit/debit cards, Venmo accounts)
   * Handles operations like tokenization, storage, and validation of payment methods.
   */
  PaymentService,

  /**
   * Service for managing payment splits between multiple users
   * Enables equal, percentage-based, or custom amount splitting for group expenses.
   */
  SplitService,

  /**
   * Service for managing payment transactions
   * Handles processing payments, refunds, and transaction lifecycle management.
   */
  TransactionService
};