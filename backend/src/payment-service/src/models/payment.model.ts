import {
  IPaymentMethod,
  IPaymentMethodCreate,
  IPaymentMethodResponse,
  PaymentProvider,
  PaymentMethod
} from '@shared/types/payment.types';
import { DatabaseError } from '@shared/errors/database.error';
import { ValidationError } from '@shared/errors/validation.error';
import { v4 as uuidv4 } from 'uuid';

/**
 * Model class representing a payment method in the Tribe application
 * Handles the creation, validation, and management of payment methods
 * like credit cards, debit cards, and digital wallets
 */
export class Payment {
  public id: string;
  public userId: string;
  public provider: PaymentProvider;
  public type: PaymentMethod;
  public token: string;
  public last4: string;
  public expiryMonth: number;
  public expiryYear: number;
  public isDefault: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  /**
   * Creates a new Payment instance with the provided payment method data
   * 
   * @param paymentMethodData Data required to create a new payment method
   */
  constructor(paymentMethodData: IPaymentMethodCreate) {
    this.id = uuidv4();
    this.userId = paymentMethodData.userId;
    this.provider = paymentMethodData.provider;
    this.type = paymentMethodData.type;
    this.token = paymentMethodData.token;
    this.last4 = '';
    this.expiryMonth = undefined;
    this.expiryYear = undefined;
    this.isDefault = paymentMethodData.isDefault || false;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Validates the payment method data to ensure it meets requirements
   * 
   * @returns True if the payment method data is valid
   * @throws ValidationError if validation fails
   */
  validate(): boolean {
    // Check required fields
    if (!this.userId || typeof this.userId !== 'string') {
      throw ValidationError.requiredField('userId');
    }

    // Validate provider is a valid enum value
    const validProviders = Object.values(PaymentProvider);
    if (!validProviders.includes(this.provider)) {
      throw ValidationError.invalidEnum('provider', validProviders);
    }

    // Validate type is a valid enum value
    const validTypes = Object.values(PaymentMethod);
    if (!validTypes.includes(this.type)) {
      throw ValidationError.invalidEnum('type', validTypes);
    }

    // Validate token is present
    if (!this.token || typeof this.token !== 'string') {
      throw ValidationError.requiredField('token');
    }

    // Validate card-specific requirements
    if (this.type === PaymentMethod.CREDIT_CARD || this.type === PaymentMethod.DEBIT_CARD) {
      if (this.expiryMonth !== undefined) {
        if (this.expiryMonth < 1 || this.expiryMonth > 12) {
          throw ValidationError.invalidRange('expiryMonth', 1, 12);
        }
      }

      if (this.expiryYear !== undefined) {
        const currentYear = new Date().getFullYear();
        if (this.expiryYear < currentYear) {
          throw ValidationError.invalidField('expiryYear', 'cannot be in the past');
        }
      }
    }

    return true;
  }

  /**
   * Sets the card details for credit/debit card payment methods
   * 
   * @param last4 Last 4 digits of the card number
   * @param expiryMonth Card expiration month (1-12)
   * @param expiryYear Card expiration year (4-digit)
   * @throws ValidationError if the payment method is not a card type or if invalid data is provided
   */
  setCardDetails(last4: string, expiryMonth: number, expiryYear: number): void {
    if (this.type !== PaymentMethod.CREDIT_CARD && this.type !== PaymentMethod.DEBIT_CARD) {
      throw ValidationError.invalidInput('Card details can only be set for credit or debit card payment methods');
    }

    if (!last4 || last4.length !== 4 || !/^\d{4}$/.test(last4)) {
      throw ValidationError.invalidFormat('last4', '4 digits');
    }

    if (expiryMonth < 1 || expiryMonth > 12) {
      throw ValidationError.invalidRange('expiryMonth', 1, 12);
    }

    const currentYear = new Date().getFullYear();
    if (expiryYear < currentYear) {
      throw ValidationError.invalidField('expiryYear', 'cannot be in the past');
    }

    this.last4 = last4;
    this.expiryMonth = expiryMonth;
    this.expiryYear = expiryYear;
    this.updatedAt = new Date();
  }

  /**
   * Sets this payment method as the default for the user
   * 
   * @param isDefault Boolean indicating if this is the default payment method
   */
  setDefault(isDefault: boolean): void {
    this.isDefault = isDefault;
    this.updatedAt = new Date();
  }

  /**
   * Checks if the payment method is expired (for cards)
   * 
   * @returns True if the payment method is expired
   */
  isExpired(): boolean {
    // Only applicable for cards
    if (this.type !== PaymentMethod.CREDIT_CARD && this.type !== PaymentMethod.DEBIT_CARD) {
      return false;
    }

    // If expiry info is not set, we can't determine
    if (this.expiryMonth === undefined || this.expiryYear === undefined) {
      return false;
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = now.getFullYear();

    return (this.expiryYear < currentYear) || 
           (this.expiryYear === currentYear && this.expiryMonth < currentMonth);
  }

  /**
   * Converts the payment method to a JSON representation for API responses
   * Excludes sensitive data like tokens
   * 
   * @returns JSON representation of the payment method
   */
  toJSON(): IPaymentMethodResponse {
    return {
      id: this.id,
      type: this.type,
      provider: this.provider,
      last4: this.last4,
      expiryMonth: this.expiryMonth,
      expiryYear: this.expiryYear,
      isDefault: this.isDefault,
      createdAt: this.createdAt
    };
  }

  /**
   * Creates a Payment instance from database record
   * 
   * @param dbPaymentMethod Payment method data from the database
   * @returns A new Payment instance populated with database data
   */
  static fromDatabase(dbPaymentMethod: IPaymentMethod): Payment {
    // Create minimal payment object to satisfy constructor
    const payment = new Payment({
      userId: dbPaymentMethod.userId,
      provider: dbPaymentMethod.provider,
      type: dbPaymentMethod.type,
      token: dbPaymentMethod.token,
      isDefault: dbPaymentMethod.isDefault
    });

    // Override with database values
    payment.id = dbPaymentMethod.id;
    payment.last4 = dbPaymentMethod.last4;
    payment.expiryMonth = dbPaymentMethod.expiryMonth;
    payment.expiryYear = dbPaymentMethod.expiryYear;
    payment.createdAt = dbPaymentMethod.createdAt;
    payment.updatedAt = dbPaymentMethod.updatedAt;

    return payment;
  }
}