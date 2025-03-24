/**
 * Payment Types
 * 
 * This file defines the shared type definitions for the payment system in the Tribe application.
 * It includes enums, interfaces, and types related to payment methods, transactions, payment
 * splits, and integration with payment providers like Stripe and Venmo.
 * 
 * @version 1.0.0
 */

/**
 * Enum representing the supported payment providers in the application
 */
export enum PaymentProvider {
  STRIPE = 'stripe',
  VENMO = 'venmo',
  MANUAL = 'manual'
}

/**
 * Enum representing the types of payment methods supported by the application
 */
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_ACCOUNT = 'bank_account',
  VENMO_BALANCE = 'venmo_balance',
  CASH = 'cash'
}

/**
 * Enum representing the types of financial transactions in the system
 */
export enum TransactionType {
  EVENT_PAYMENT = 'event_payment',
  SPLIT_PAYMENT = 'split_payment',
  REFUND = 'refund'
}

/**
 * Enum representing the possible statuses of a transaction
 */
export enum TransactionStatus {
  INITIATED = 'initiated',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

/**
 * Enum representing the methods for splitting payments among users
 */
export enum SplitType {
  EQUAL = 'equal',
  PERCENTAGE = 'percentage',
  CUSTOM = 'custom'
}

/**
 * Enum representing the status of a split payment
 */
export enum SplitStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Enum representing the status of an individual payment
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Interface representing a payment method stored in the system
 */
export interface IPaymentMethod {
  id: string;
  userId: string;
  provider: PaymentProvider;
  type: PaymentMethod;
  token: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface representing the data required to create a new payment method
 */
export interface IPaymentMethodCreate {
  userId: string;
  provider: PaymentProvider;
  type: PaymentMethod;
  token: string;
  isDefault: boolean;
}

/**
 * Interface representing a financial transaction in the system
 */
export interface ITransaction {
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
}

/**
 * Interface representing the data required to create a new transaction
 */
export interface ITransactionCreate {
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  userId: string;
  paymentMethodId: string;
  provider: PaymentProvider;
  eventId: string;
  splitId: string;
  metadata: Record<string, any>;
}

/**
 * Interface representing a payment split between multiple users
 */
export interface IPaymentSplit {
  id: string;
  eventId: string;
  createdBy: string;
  description: string;
  totalAmount: number;
  currency: string;
  splitType: SplitType;
  status: SplitStatus;
  dueDate: Date;
  shares: IPaymentShare[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface representing an individual's share in a split payment
 */
export interface IPaymentShare {
  id: string;
  splitId: string;
  userId: string;
  amount: number;
  percentage: number;
  status: PaymentStatus;
}

/**
 * Interface representing the data required to create a new payment split
 */
export interface IPaymentSplitCreate {
  eventId: string;
  createdBy: string;
  description: string;
  totalAmount: number;
  currency: string;
  splitType: SplitType;
  dueDate: Date;
  participants: Array<{
    userId: string;
    amount?: number;
    percentage?: number;
  }>;
  metadata: Record<string, any>;
}

/**
 * Interface representing the structure of a Stripe payment intent response
 */
export interface IStripePaymentIntent {
  id: string;
  clientSecret: string;
  status: string;
}

/**
 * Interface representing the structure of a Venmo payment request response
 */
export interface IVenmoPaymentRequest {
  id: string;
  amount: number;
  note: string;
  targetUserHandle: string;
  status: string;
  paymentUrl: string;
}

/**
 * Interface representing the payment data returned in API responses
 */
export interface IPaymentResponse {
  id: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string;
  paymentMethod: string;
  createdAt: Date;
}

/**
 * Interface representing the payment method data returned in API responses
 */
export interface IPaymentMethodResponse {
  id: string;
  type: PaymentMethod;
  provider: PaymentProvider;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt: Date;
}

/**
 * Interface representing the payment split data returned in API responses
 */
export interface IPaymentSplitResponse {
  id: string;
  eventId: string;
  description: string;
  totalAmount: number;
  currency: string;
  splitType: SplitType;
  status: SplitStatus;
  shares: Array<{
    userId: string;
    userName: string;
    amount: number;
    status: PaymentStatus;
  }>;
}

/**
 * Interface representing the structure of payment webhook events from external providers
 */
export interface IPaymentWebhookEvent {
  id: string;
  eventType: string;
  data: Record<string, any>;
}