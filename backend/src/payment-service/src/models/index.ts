/**
 * Barrel file that exports all model classes from the payment service.
 * This file simplifies imports by providing a single entry point for
 * accessing all payment-related models.
 * 
 * @version 1.0.0
 */

// Import model classes
import { Payment } from './payment.model';
import { PaymentSplit } from './split.model';
import { Transaction } from './transaction.model';

// Re-export all models
export { Payment, PaymentSplit, Transaction };