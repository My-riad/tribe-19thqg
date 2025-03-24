import { 
  IPaymentSplit, 
  IPaymentSplitCreate,
  IPaymentSplitResponse,
  IPaymentShare,
  SplitType,
  SplitStatus,
  PaymentStatus
} from '@shared/types/payment.types';
import { DatabaseError } from '@shared/errors/database.error';
import { ValidationError } from '@shared/errors/validation.error';
import { v4 as uuidv4 } from 'uuid'; // v9.0.0

/**
 * Model class representing a payment split in the Tribe application
 */
export class PaymentSplit {
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

  /**
   * Creates a new PaymentSplit instance with the provided split data
   * 
   * @param splitData The data required to create a new payment split
   */
  constructor(splitData: IPaymentSplitCreate) {
    this.id = uuidv4();
    this.eventId = splitData.eventId;
    this.createdBy = splitData.createdBy;
    this.description = splitData.description;
    this.totalAmount = splitData.totalAmount;
    this.currency = splitData.currency || 'USD';
    this.splitType = splitData.splitType;
    this.status = SplitStatus.PENDING;
    this.dueDate = splitData.dueDate;
    this.shares = [];
    this.metadata = splitData.metadata || {};
    this.createdAt = new Date();
    this.updatedAt = new Date();

    // Calculate shares if participants are provided
    if (splitData.participants && splitData.participants.length > 0) {
      this.calculateShares(splitData.participants);
    }
  }

  /**
   * Validates the payment split data to ensure it meets requirements
   * 
   * @returns True if the payment split data is valid
   * @throws ValidationError if validation fails
   */
  validate(): boolean {
    // Check required fields
    if (!this.eventId || typeof this.eventId !== 'string') {
      throw ValidationError.requiredField('eventId');
    }

    if (!this.createdBy || typeof this.createdBy !== 'string') {
      throw ValidationError.requiredField('createdBy');
    }

    if (!this.description || typeof this.description !== 'string') {
      throw ValidationError.requiredField('description');
    }

    if (typeof this.totalAmount !== 'number' || this.totalAmount <= 0) {
      throw ValidationError.invalidField('totalAmount', 'must be a positive number');
    }

    if (!this.currency || typeof this.currency !== 'string' || this.currency.length !== 3) {
      throw ValidationError.invalidField('currency', 'must be a valid 3-letter currency code');
    }

    // Check if splitType is valid
    if (!Object.values(SplitType).includes(this.splitType)) {
      throw ValidationError.invalidEnum('splitType', Object.values(SplitType));
    }

    // Check if dueDate is valid and in the future
    if (!this.dueDate || !(this.dueDate instanceof Date)) {
      throw ValidationError.invalidType('dueDate', 'Date');
    }

    const now = new Date();
    if (this.dueDate < now) {
      throw ValidationError.invalidField('dueDate', 'must be a future date');
    }

    // If shares are already set, validate them
    if (this.shares && this.shares.length > 0) {
      this.validateShares();
    }

    return true;
  }

  /**
   * Calculates individual payment shares based on the split type
   * 
   * @param participants Array of users participating in the split with their share details
   * @returns Array of calculated payment shares
   * @throws ValidationError if the calculation cannot be performed
   */
  calculateShares(participants: Array<{userId: string, amount?: number, percentage?: number}>): IPaymentShare[] {
    if (!participants || participants.length === 0) {
      throw ValidationError.invalidInput('Participants array cannot be empty');
    }

    // Clear existing shares
    this.shares = [];

    switch (this.splitType) {
      case SplitType.EQUAL: {
        // Equal split among all participants
        const equalAmount = parseFloat((this.totalAmount / participants.length).toFixed(2));
        let remainingAmount = this.totalAmount;

        // Distribute the amount equally, handling rounding differences on the last share
        for (let i = 0; i < participants.length; i++) {
          const isLast = i === participants.length - 1;
          const amount = isLast ? parseFloat(remainingAmount.toFixed(2)) : equalAmount;
          
          this.shares.push({
            id: uuidv4(),
            splitId: this.id,
            userId: participants[i].userId,
            amount: amount,
            percentage: parseFloat((100 / participants.length).toFixed(2)),
            status: PaymentStatus.PENDING
          });

          remainingAmount -= equalAmount;
        }
        break;
      }

      case SplitType.PERCENTAGE: {
        // Percentage-based split
        let totalPercentage = 0;
        
        for (const participant of participants) {
          if (typeof participant.percentage !== 'number' || participant.percentage <= 0) {
            throw ValidationError.invalidField(`percentage for user ${participant.userId}`, 'must be a positive number');
          }
          totalPercentage += participant.percentage;
        }

        // Validate total percentage is (approximately) 100%
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw ValidationError.invalidInput(`Total percentage must be 100%, got ${totalPercentage}%`);
        }

        let remainingAmount = this.totalAmount;
        
        // Calculate each share based on percentage
        for (let i = 0; i < participants.length; i++) {
          const participant = participants[i];
          const isLast = i === participants.length - 1;
          
          // For the last participant, use the remaining amount to avoid rounding issues
          const amount = isLast 
            ? parseFloat(remainingAmount.toFixed(2)) 
            : parseFloat(((participant.percentage! / 100) * this.totalAmount).toFixed(2));
          
          this.shares.push({
            id: uuidv4(),
            splitId: this.id,
            userId: participant.userId,
            amount: amount,
            percentage: participant.percentage!,
            status: PaymentStatus.PENDING
          });

          remainingAmount -= amount;
        }
        break;
      }

      case SplitType.CUSTOM: {
        // Custom amount split
        let totalAmount = 0;
        
        for (const participant of participants) {
          if (typeof participant.amount !== 'number' || participant.amount <= 0) {
            throw ValidationError.invalidField(`amount for user ${participant.userId}`, 'must be a positive number');
          }
          totalAmount += participant.amount;
        }

        // Validate total amount matches the expected total (within a small margin for floating point errors)
        if (Math.abs(totalAmount - this.totalAmount) > 0.01) {
          throw ValidationError.invalidInput(`Total amount of shares (${totalAmount}) must match the total amount (${this.totalAmount})`);
        }

        // Create shares with custom amounts
        for (const participant of participants) {
          this.shares.push({
            id: uuidv4(),
            splitId: this.id,
            userId: participant.userId,
            amount: participant.amount!,
            percentage: parseFloat(((participant.amount! / this.totalAmount) * 100).toFixed(2)),
            status: PaymentStatus.PENDING
          });
        }
        break;
      }

      default:
        throw ValidationError.invalidEnum('splitType', Object.values(SplitType));
    }

    // Validate the created shares
    this.validateShares();

    return this.shares;
  }

  /**
   * Updates the status of the payment split based on share statuses
   * 
   * @returns Updated status of the payment split
   */
  updateStatus(): SplitStatus {
    if (this.status === SplitStatus.CANCELLED) {
      return this.status;
    }

    // Count completed shares
    const completedCount = this.shares.filter(share => share.status === PaymentStatus.COMPLETED).length;
    const totalShares = this.shares.length;

    // Update status based on completion
    if (completedCount === totalShares) {
      this.status = SplitStatus.COMPLETED;
    } else if (completedCount > 0) {
      this.status = SplitStatus.PARTIAL;
    } else {
      this.status = SplitStatus.PENDING;
    }

    this.updatedAt = new Date();
    return this.status;
  }

  /**
   * Updates the status of a specific share in the payment split
   * 
   * @param userId The ID of the user whose share status is being updated
   * @param status The new payment status
   * @returns True if the share was updated successfully
   */
  updateShare(userId: string, status: PaymentStatus): boolean {
    const share = this.shares.find(s => s.userId === userId);
    
    if (!share) {
      return false;
    }

    share.status = status;
    this.updateStatus();
    this.updatedAt = new Date();
    
    return true;
  }

  /**
   * Cancels the payment split
   * 
   * @returns True if the split was cancelled successfully
   * @throws ValidationError if the split cannot be cancelled
   */
  cancel(): boolean {
    if (this.status === SplitStatus.COMPLETED) {
      throw ValidationError.invalidInput('Cannot cancel a completed payment split');
    }

    if (this.status === SplitStatus.CANCELLED) {
      return true; // Already cancelled
    }

    this.status = SplitStatus.CANCELLED;
    
    // Update all pending shares to reflect cancellation
    for (const share of this.shares) {
      if (share.status === PaymentStatus.PENDING) {
        share.status = PaymentStatus.FAILED;
      }
    }

    this.updatedAt = new Date();
    return true;
  }

  /**
   * Calculates the total amount paid across all shares
   * 
   * @returns Total amount paid
   */
  getTotalPaid(): number {
    const paidShares = this.shares.filter(share => share.status === PaymentStatus.COMPLETED);
    return parseFloat(paidShares.reduce((sum, share) => sum + share.amount, 0).toFixed(2));
  }

  /**
   * Calculates the remaining amount to be paid
   * 
   * @returns Remaining amount to be paid
   */
  getRemainingAmount(): number {
    const totalPaid = this.getTotalPaid();
    return parseFloat((this.totalAmount - totalPaid).toFixed(2));
  }

  /**
   * Calculates the percentage of the total amount that has been paid
   * 
   * @returns Completion percentage (0-100)
   */
  getCompletionPercentage(): number {
    if (this.totalAmount === 0) {
      return this.status === SplitStatus.COMPLETED ? 100 : 0;
    }
    
    const totalPaid = this.getTotalPaid();
    return parseFloat(((totalPaid / this.totalAmount) * 100).toFixed(2));
  }

  /**
   * Converts the payment split to a JSON representation for API responses
   * 
   * @returns JSON representation of the payment split
   */
  toJSON(): IPaymentSplitResponse {
    return {
      id: this.id,
      eventId: this.eventId,
      description: this.description,
      totalAmount: this.totalAmount,
      currency: this.currency,
      splitType: this.splitType,
      status: this.status,
      shares: this.shares.map(share => ({
        userId: share.userId,
        userName: '', // This would typically be populated by the service layer
        amount: share.amount,
        status: share.status
      }))
    };
  }

  /**
   * Creates a PaymentSplit instance from database record
   * 
   * @param dbPaymentSplit Payment split data from the database
   * @returns A new PaymentSplit instance populated with database data
   */
  static fromDatabase(dbPaymentSplit: IPaymentSplit): PaymentSplit {
    // Create instance with minimal required data
    const splitData: IPaymentSplitCreate = {
      eventId: dbPaymentSplit.eventId,
      createdBy: dbPaymentSplit.createdBy,
      description: dbPaymentSplit.description,
      totalAmount: dbPaymentSplit.totalAmount,
      currency: dbPaymentSplit.currency,
      splitType: dbPaymentSplit.splitType,
      dueDate: dbPaymentSplit.dueDate,
      participants: [], // Empty as we'll set shares directly
      metadata: dbPaymentSplit.metadata
    };

    const paymentSplit = new PaymentSplit(splitData);
    
    // Set properties from the database record
    paymentSplit.id = dbPaymentSplit.id;
    paymentSplit.status = dbPaymentSplit.status;
    paymentSplit.shares = [...dbPaymentSplit.shares];
    paymentSplit.createdAt = dbPaymentSplit.createdAt;
    paymentSplit.updatedAt = dbPaymentSplit.updatedAt;

    return paymentSplit;
  }

  /**
   * Validates that the shares are correct
   * 
   * @returns True if the shares are valid
   * @throws ValidationError if validation fails
   */
  private validateShares(): boolean {
    // Check if there are any shares
    if (!this.shares || this.shares.length === 0) {
      throw ValidationError.invalidInput('Payment split must have at least one share');
    }

    // Ensure all shares have required fields
    for (const share of this.shares) {
      if (!share.id || !share.userId || typeof share.amount !== 'number' || !share.status) {
        throw ValidationError.invalidInput('All shares must have id, userId, amount, and status');
      }
    }

    // Calculate total amount from shares
    const totalFromShares = this.shares.reduce((sum, share) => sum + share.amount, 0);
    
    // Check that total amount from shares matches the expected total amount (within a small margin for floating point errors)
    if (Math.abs(totalFromShares - this.totalAmount) > 0.01) {
      throw ValidationError.invalidInput(`Total amount of shares (${totalFromShares.toFixed(2)}) must match the total amount (${this.totalAmount.toFixed(2)})`);
    }

    return true;
  }
}