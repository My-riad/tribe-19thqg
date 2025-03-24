import { 
  ITransaction, 
  ITransactionCreate, 
  IPaymentResponse,
  TransactionType,
  TransactionStatus,
  PaymentProvider
} from '@shared/types/payment.types';
import { DatabaseError } from '@shared/errors/database.error';
import { ValidationError } from '@shared/errors/validation.error';
import { v4 as uuidv4 } from 'uuid'; // v9.0.0

/**
 * Model class representing a financial transaction in the Tribe application
 */
export class Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string;
  userId: string;
  paymentMethodId: string;
  provider: PaymentProvider;
  providerTransactionId: string;
  eventId: string;
  splitId: string;
  refundedTransactionId: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Creates a new Transaction instance with the provided transaction data
   * @param transactionData The data required to create a new transaction
   */
  constructor(transactionData: ITransactionCreate) {
    this.id = uuidv4();
    this.type = transactionData.type;
    this.status = TransactionStatus.INITIATED;
    this.amount = transactionData.amount;
    this.currency = transactionData.currency || 'USD';
    this.description = transactionData.description;
    this.userId = transactionData.userId;
    this.paymentMethodId = transactionData.paymentMethodId;
    this.provider = transactionData.provider;
    this.providerTransactionId = undefined;
    this.eventId = transactionData.eventId;
    this.splitId = transactionData.splitId;
    this.refundedTransactionId = undefined;
    this.metadata = transactionData.metadata || {};
    this.createdAt = new Date();
    this.updatedAt = new Date();

    // Validate the transaction data
    this.validate();
  }

  /**
   * Validates the transaction data to ensure it meets requirements
   * @returns True if the transaction data is valid
   * @throws ValidationError if the transaction data is invalid
   */
  validate(): boolean {
    // Check if type is a valid TransactionType
    if (!Object.values(TransactionType).includes(this.type)) {
      throw ValidationError.invalidEnum('type', Object.values(TransactionType));
    }

    // Check if amount is a positive number
    if (typeof this.amount !== 'number' || this.amount <= 0) {
      throw ValidationError.invalidField('amount', 'must be a positive number');
    }

    // Check if currency is provided and is a valid format
    if (!this.currency) {
      throw ValidationError.requiredField('currency');
    }

    // Check if description is provided
    if (!this.description || this.description.trim() === '') {
      throw ValidationError.requiredField('description');
    }

    // Check if userId is provided
    if (!this.userId) {
      throw ValidationError.requiredField('userId');
    }

    // Check if paymentMethodId is provided
    if (!this.paymentMethodId) {
      throw ValidationError.requiredField('paymentMethodId');
    }

    // Check if provider is a valid PaymentProvider
    if (!Object.values(PaymentProvider).includes(this.provider)) {
      throw ValidationError.invalidEnum('provider', Object.values(PaymentProvider));
    }

    // Validate transaction type-specific requirements
    if (this.type === TransactionType.EVENT_PAYMENT && !this.eventId) {
      throw ValidationError.requiredField('eventId');
    }

    if (this.type === TransactionType.SPLIT_PAYMENT && !this.splitId) {
      throw ValidationError.requiredField('splitId');
    }

    if (this.type === TransactionType.REFUND && !this.refundedTransactionId) {
      throw ValidationError.requiredField('refundedTransactionId');
    }

    return true;
  }

  /**
   * Updates the status of the transaction
   * @param newStatus The new status to set
   */
  updateStatus(newStatus: TransactionStatus): void {
    // Validate status transition
    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      [TransactionStatus.INITIATED]: [
        TransactionStatus.PROCESSING, 
        TransactionStatus.FAILED, 
        TransactionStatus.CANCELLED
      ],
      [TransactionStatus.PROCESSING]: [
        TransactionStatus.COMPLETED, 
        TransactionStatus.FAILED, 
        TransactionStatus.CANCELLED
      ],
      [TransactionStatus.COMPLETED]: [
        TransactionStatus.REFUNDED
      ],
      [TransactionStatus.FAILED]: [],
      [TransactionStatus.REFUNDED]: [],
      [TransactionStatus.CANCELLED]: []
    };

    // Check if the status transition is valid
    if (!validTransitions[this.status].includes(newStatus)) {
      throw ValidationError.invalidField(
        'status',
        `cannot transition from ${this.status} to ${newStatus}`
      );
    }

    this.status = newStatus;
    this.updatedAt = new Date();
  }

  /**
   * Sets the provider-specific transaction ID after processing
   * @param providerTransactionId The transaction ID from the payment provider
   */
  setProviderTransactionId(providerTransactionId: string): void {
    this.providerTransactionId = providerTransactionId;
    this.updatedAt = new Date();
  }

  /**
   * Creates a refund transaction based on this transaction
   * @param reason The reason for the refund
   * @returns A new refund transaction
   * @throws ValidationError if the transaction cannot be refunded
   */
  processRefund(reason: string): Transaction {
    if (!this.isRefundable()) {
      throw ValidationError.invalidField(
        'transaction',
        'is not eligible for refund'
      );
    }

    const refundTransaction = new Transaction({
      type: TransactionType.REFUND,
      amount: this.amount,
      currency: this.currency,
      description: `Refund for transaction ${this.id}: ${reason}`,
      userId: this.userId,
      paymentMethodId: this.paymentMethodId,
      provider: this.provider,
      eventId: this.eventId,
      splitId: this.splitId,
      metadata: {
        refundReason: reason,
        originalTransactionId: this.id,
        ...this.metadata
      }
    });

    refundTransaction.refundedTransactionId = this.id;
    return refundTransaction;
  }

  /**
   * Checks if the transaction can be refunded
   * @returns True if the transaction can be refunded
   */
  isRefundable(): boolean {
    // Only completed transactions that aren't already refunds can be refunded
    return (
      this.type !== TransactionType.REFUND &&
      this.status === TransactionStatus.COMPLETED &&
      !this.refundedTransactionId
    );
  }

  /**
   * Gets the payment details for display or processing
   * @returns Payment details object
   */
  getPaymentDetails(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      amount: this.amount,
      currency: this.currency,
      description: this.description,
      userId: this.userId,
      paymentMethodId: this.paymentMethodId,
      provider: this.provider,
      providerTransactionId: this.providerTransactionId,
      eventId: this.eventId || undefined,
      splitId: this.splitId || undefined,
      refundedTransactionId: this.refundedTransactionId || undefined,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Converts the transaction to a JSON representation for API responses
   * @returns JSON representation of the transaction
   */
  toJSON(): IPaymentResponse {
    return {
      id: this.id,
      status: this.status,
      amount: this.amount,
      currency: this.currency,
      description: this.description,
      paymentMethod: this.paymentMethodId,
      createdAt: this.createdAt
    };
  }

  /**
   * Creates a Transaction instance from database record
   * @param dbTransaction The transaction data from the database
   * @returns A new Transaction instance populated with database data
   */
  static fromDatabase(dbTransaction: ITransaction): Transaction {
    // Create a minimal transaction to satisfy the constructor
    const transaction = new Transaction({
      type: dbTransaction.type,
      amount: dbTransaction.amount,
      currency: dbTransaction.currency,
      description: dbTransaction.description,
      userId: dbTransaction.userId,
      paymentMethodId: dbTransaction.paymentMethodId,
      provider: dbTransaction.provider,
      eventId: dbTransaction.eventId,
      splitId: dbTransaction.splitId,
      metadata: dbTransaction.metadata
    });

    // Override the generated ID and dates with the database values
    transaction.id = dbTransaction.id;
    transaction.status = dbTransaction.status;
    transaction.providerTransactionId = dbTransaction.providerTransactionId;
    transaction.refundedTransactionId = dbTransaction.refundedTransactionId;
    transaction.createdAt = new Date(dbTransaction.createdAt);
    transaction.updatedAt = new Date(dbTransaction.updatedAt);

    return transaction;
  }
}