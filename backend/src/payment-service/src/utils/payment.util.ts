import { 
  PaymentProvider, 
  PaymentMethod, 
  TransactionType, 
  TransactionStatus, 
  SplitType, 
  SplitStatus, 
  PaymentStatus 
} from '@shared/types/payment.types';
import { ValidationError } from '@shared/errors/validation.error';
import logger from 'winston'; // winston@^3.8.2

/**
 * List of supported currency codes in the application
 */
export const SUPPORTED_CURRENCIES: string[] = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'
];

/**
 * Mapping of currency codes to their respective symbols
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'CAD': 'C$',
  'AUD': 'A$',
  'JPY': '¥',
  'CNY': '¥'
};

/**
 * Human-readable display names for payment providers
 */
export const PAYMENT_PROVIDER_DISPLAY_NAMES: Record<PaymentProvider, string> = {
  [PaymentProvider.STRIPE]: 'Credit/Debit Card',
  [PaymentProvider.VENMO]: 'Venmo',
  [PaymentProvider.MANUAL]: 'Manual Payment'
};

/**
 * Human-readable display names for payment methods
 */
export const PAYMENT_METHOD_DISPLAY_NAMES: Record<PaymentMethod, string> = {
  [PaymentMethod.CREDIT_CARD]: 'Credit Card',
  [PaymentMethod.DEBIT_CARD]: 'Debit Card',
  [PaymentMethod.BANK_ACCOUNT]: 'Bank Account',
  [PaymentMethod.VENMO_BALANCE]: 'Venmo Balance',
  [PaymentMethod.CASH]: 'Cash'
};

/**
 * Validates if a currency code is supported by the application
 * 
 * @param currencyCode - The currency code to validate
 * @returns True if the currency is supported, false otherwise
 */
export function validateCurrency(currencyCode: string): boolean {
  return SUPPORTED_CURRENCIES.includes(currencyCode);
}

/**
 * Formats a monetary amount with the appropriate currency symbol
 * 
 * @param amount - The monetary amount to format
 * @param currencyCode - The currency code (e.g., 'USD')
 * @param options - Additional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number, 
  currencyCode: string, 
  options?: Intl.NumberFormatOptions
): string {
  if (!validateCurrency(currencyCode)) {
    throw new ValidationError(`Currency code '${currencyCode}' is not supported`);
  }
  
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };
  
  const formattingOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
  
  return new Intl.NumberFormat('en-US', formattingOptions).format(amount);
}

/**
 * Calculates the processing fee for a payment based on provider and amount
 * 
 * @param provider - The payment provider
 * @param amount - The payment amount
 * @param method - The payment method (optional)
 * @returns The calculated fee amount
 */
export function calculateFee(
  provider: PaymentProvider, 
  amount: number, 
  method?: PaymentMethod
): number {
  if (amount <= 0) {
    throw new ValidationError('Amount must be greater than zero');
  }
  
  let fee = 0;
  
  switch (provider) {
    case PaymentProvider.STRIPE:
      // Stripe typically charges 2.9% + $0.30 for card payments
      fee = (amount * 0.029) + 0.30;
      break;
      
    case PaymentProvider.VENMO:
      // Venmo charges 1.9% for non-balance payments, 0% for balance payments
      if (method === PaymentMethod.VENMO_BALANCE) {
        fee = 0;
      } else {
        fee = amount * 0.019;
      }
      break;
      
    case PaymentProvider.MANUAL:
      // No fee for manual payments
      fee = 0;
      break;
      
    default:
      // Default fee calculation for unknown providers (should not happen)
      logger.warn(`Unknown payment provider: ${provider}, using default fee calculation`);
      fee = amount * 0.03;
  }
  
  // Round to 2 decimal places
  return Math.round(fee * 100) / 100;
}

/**
 * Calculates the total amount including processing fee
 * 
 * @param amount - The base payment amount
 * @param provider - The payment provider
 * @param method - The payment method (optional)
 * @returns Total amount including fee
 */
export function calculateTotalWithFee(
  amount: number, 
  provider: PaymentProvider, 
  method?: PaymentMethod
): number {
  const fee = calculateFee(provider, amount, method);
  return Math.round((amount + fee) * 100) / 100;
}

/**
 * Validates a credit/debit card number using Luhn algorithm
 * 
 * @param cardNumber - The card number to validate
 * @returns True if the card number is valid, false otherwise
 */
export function validateCardNumber(cardNumber: string): boolean {
  // Remove any spaces or dashes
  const digitsOnly = cardNumber.replace(/[\s-]/g, '');
  
  // Check if the card number contains only digits
  if (!/^\d+$/.test(digitsOnly)) {
    return false;
  }
  
  // Check length (most card numbers are 13-19 digits)
  if (digitsOnly.length < 13 || digitsOnly.length > 19) {
    return false;
  }
  
  // Apply Luhn algorithm (checksum validation)
  let sum = 0;
  let double = false;
  
  // Start from the rightmost digit and move left
  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i), 10);
    
    if (double) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    double = !double;
  }
  
  // If the sum is a multiple of 10, the card number is valid
  return sum % 10 === 0;
}

/**
 * Validates if a card expiry date is in the future
 * 
 * @param month - The expiry month (1-12)
 * @param year - The expiry year (4-digit)
 * @returns True if the expiry date is valid and in the future
 */
export function validateExpiryDate(month: number, year: number): boolean {
  // Check if month is valid (1-12)
  if (month < 1 || month > 12) {
    return false;
  }
  
  // Check if year is a valid 4-digit year
  if (year < 1000 || year > 9999) {
    return false;
  }
  
  // Create a date object for the last day of the expiry month
  const now = new Date();
  const expiryDate = new Date(year, month, 0); // Last day of the month
  
  // Card is valid until the end of the expiry month
  return expiryDate > now;
}

/**
 * Masks a card number for display, showing only the last 4 digits
 * 
 * @param cardNumber - The card number to mask
 * @returns Masked card number
 */
export function maskCardNumber(cardNumber: string): string {
  // Remove any spaces or dashes
  const digitsOnly = cardNumber.replace(/[\s-]/g, '');
  
  if (digitsOnly.length < 4) {
    return '****';
  }
  
  // Extract the last 4 digits
  const last4 = digitsOnly.slice(-4);
  
  // Replace all other digits with asterisks
  const maskedPart = '*'.repeat(digitsOnly.length - 4);
  
  // Format the masked number with spaces for readability
  // Group in blocks of 4 for standard formatting
  const formatted = (maskedPart + last4).replace(/(.{4})/g, '$1 ').trim();
  
  return formatted;
}

/**
 * Detects the card type (Visa, Mastercard, etc.) based on the card number
 * 
 * @param cardNumber - The card number
 * @returns Card type name or 'Unknown'
 */
export function detectCardType(cardNumber: string): string {
  // Remove any spaces or dashes
  const digitsOnly = cardNumber.replace(/[\s-]/g, '');
  
  // Card type patterns
  const patterns = {
    'Visa': /^4\d{12}(?:\d{3})?$/,
    'Mastercard': /^5[1-5]\d{14}$/,
    'American Express': /^3[47]\d{13}$/,
    'Discover': /^6(?:011|5\d{2})\d{12}$/,
    'Diners Club': /^3(?:0[0-5]|[68]\d)\d{11}$/,
    'JCB': /^(?:2131|1800|35\d{3})\d{11}$/
  };
  
  // Check the card number against each pattern
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(digitsOnly)) {
      return type;
    }
  }
  
  return 'Unknown';
}

/**
 * Gets a human-readable display name for a payment provider
 * 
 * @param provider - The payment provider enum value
 * @returns Display name for the payment provider
 */
export function getPaymentProviderDisplayName(provider: PaymentProvider): string {
  return PAYMENT_PROVIDER_DISPLAY_NAMES[provider] || provider;
}

/**
 * Gets a human-readable display name for a payment method
 * 
 * @param method - The payment method enum value
 * @returns Display name for the payment method
 */
export function getPaymentMethodDisplayName(method: PaymentMethod): string {
  return PAYMENT_METHOD_DISPLAY_NAMES[method] || method;
}

/**
 * Generates a standardized payment description based on transaction type
 * 
 * @param type - The transaction type
 * @param metadata - Additional metadata for the description
 * @returns Standardized payment description
 */
export function generatePaymentDescription(
  type: TransactionType, 
  metadata: Record<string, any>
): string {
  switch (type) {
    case TransactionType.EVENT_PAYMENT:
      const eventName = metadata.eventName || 'Event';
      const eventDate = metadata.eventDate 
        ? new Date(metadata.eventDate).toLocaleDateString() 
        : '';
      
      return `Payment for ${eventName}${eventDate ? ` on ${eventDate}` : ''}`;
      
    case TransactionType.SPLIT_PAYMENT:
      const splitDescription = metadata.description || 'Split payment';
      const recipient = metadata.recipientName || 'group member';
      
      return `${splitDescription} to ${recipient}`;
      
    case TransactionType.REFUND:
      const originalRef = metadata.originalTransactionRef || 'payment';
      const reason = metadata.reason || 'requested refund';
      
      return `Refund for ${originalRef}: ${reason}`;
      
    default:
      return 'Payment';
  }
}

/**
 * Calculates individual payment shares based on split type and participants
 * 
 * @param splitType - The type of split to calculate
 * @param totalAmount - The total amount to split
 * @param participants - Array of participant objects with optional amount/percentage
 * @returns Array of calculated payment shares
 */
export function calculateSplitShares(
  splitType: SplitType,
  totalAmount: number,
  participants: Array<{userId: string, amount?: number, percentage?: number}>
): Array<{userId: string, amount: number, percentage?: number}> {
  if (!participants || participants.length === 0) {
    throw new ValidationError('At least one participant is required for split calculation');
  }
  
  if (totalAmount <= 0) {
    throw new ValidationError('Total amount must be greater than zero');
  }
  
  const calculatedShares = participants.map(participant => {
    const result = { 
      userId: participant.userId,
      amount: 0,
      percentage: undefined as number | undefined
    };
    
    switch (splitType) {
      case SplitType.EQUAL:
        // Equal division among all participants
        result.amount = Math.round((totalAmount / participants.length) * 100) / 100;
        result.percentage = Math.round((100 / participants.length) * 100) / 100;
        break;
        
      case SplitType.PERCENTAGE:
        // Split based on specified percentages
        if (participant.percentage === undefined) {
          throw new ValidationError(`Percentage missing for user ${participant.userId}`);
        }
        
        if (participant.percentage < 0 || participant.percentage > 100) {
          throw new ValidationError(
            `Invalid percentage value for user ${participant.userId}. Must be between 0 and 100.`
          );
        }
        
        result.percentage = participant.percentage;
        result.amount = Math.round((totalAmount * participant.percentage / 100) * 100) / 100;
        break;
        
      case SplitType.CUSTOM:
        // Custom amount for each participant
        if (participant.amount === undefined) {
          throw new ValidationError(`Amount missing for user ${participant.userId}`);
        }
        
        if (participant.amount < 0) {
          throw new ValidationError(
            `Invalid amount value for user ${participant.userId}. Must be greater than or equal to 0.`
          );
        }
        
        result.amount = Math.round(participant.amount * 100) / 100;
        result.percentage = Math.round((participant.amount / totalAmount * 100) * 100) / 100;
        break;
    }
    
    return result;
  });
  
  // Validate that the sum of shares equals the total (within rounding tolerance)
  const sharesSum = calculatedShares.reduce((sum, share) => sum + share.amount, 0);
  const roundingTolerance = 0.01; // 1 cent tolerance to account for rounding errors
  
  if (Math.abs(sharesSum - totalAmount) > roundingTolerance) {
    // If we have a rounding discrepancy, adjust the largest share to compensate
    const difference = totalAmount - sharesSum;
    let largestShareIndex = 0;
    
    for (let i = 1; i < calculatedShares.length; i++) {
      if (calculatedShares[i].amount > calculatedShares[largestShareIndex].amount) {
        largestShareIndex = i;
      }
    }
    
    calculatedShares[largestShareIndex].amount = 
      Math.round((calculatedShares[largestShareIndex].amount + difference) * 100) / 100;
  }
  
  return calculatedShares;
}

/**
 * Validates a payment request for required fields and data integrity
 * 
 * @param paymentRequest - The payment request object to validate
 * @returns True if the payment request is valid
 * @throws ValidationError if validation fails
 */
export function validatePaymentRequest(paymentRequest: Record<string, any>): boolean {
  // Check required fields
  const requiredFields = ['amount', 'currency', 'userId', 'provider'];
  
  for (const field of requiredFields) {
    if (paymentRequest[field] === undefined || paymentRequest[field] === null) {
      throw ValidationError.requiredField(field);
    }
  }
  
  // Validate amount
  if (typeof paymentRequest.amount !== 'number' || paymentRequest.amount <= 0) {
    throw ValidationError.invalidField('amount', 'must be a positive number');
  }
  
  // Validate currency
  if (!validateCurrency(paymentRequest.currency)) {
    throw ValidationError.invalidField(
      'currency', 
      `must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`
    );
  }
  
  // Validate provider-specific requirements
  if (paymentRequest.provider === PaymentProvider.STRIPE) {
    if (!paymentRequest.paymentMethodId && !paymentRequest.token) {
      throw ValidationError.invalidInput(
        'Stripe payments require either paymentMethodId or token'
      );
    }
  } else if (paymentRequest.provider === PaymentProvider.VENMO) {
    if (!paymentRequest.venmoUsername && !paymentRequest.phoneNumber) {
      throw ValidationError.invalidInput(
        'Venmo payments require either venmoUsername or phoneNumber'
      );
    }
  }
  
  // All validations passed
  return true;
}

/**
 * Gets a human-readable display name for a transaction status
 * 
 * @param status - The transaction status enum value
 * @returns Display name for the transaction status
 */
export function getTransactionStatusDisplayName(status: TransactionStatus): string {
  const displayNames: Record<TransactionStatus, string> = {
    [TransactionStatus.INITIATED]: 'Initiated',
    [TransactionStatus.PROCESSING]: 'Processing',
    [TransactionStatus.COMPLETED]: 'Completed',
    [TransactionStatus.FAILED]: 'Failed',
    [TransactionStatus.REFUNDED]: 'Refunded',
    [TransactionStatus.CANCELLED]: 'Cancelled'
  };
  
  return displayNames[status] || status;
}

/**
 * Gets a human-readable display name for a split status
 * 
 * @param status - The split status enum value
 * @returns Display name for the split status
 */
export function getSplitStatusDisplayName(status: SplitStatus): string {
  const displayNames: Record<SplitStatus, string> = {
    [SplitStatus.PENDING]: 'Pending',
    [SplitStatus.PARTIAL]: 'Partially Paid',
    [SplitStatus.COMPLETED]: 'Fully Paid',
    [SplitStatus.CANCELLED]: 'Cancelled'
  };
  
  return displayNames[status] || status;
}