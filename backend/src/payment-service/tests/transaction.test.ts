import { faker } from '@faker-js/faker';
import {
  Transaction
} from '../src/models/transaction.model';
import {
  TransactionService
} from '../src/services/transaction.service';
import {
  StripeProvider
} from '../src/providers/stripe.provider';
import {
  getPaymentProvider
} from '../src/providers';
import {
  ITransactionCreate,
  ITransaction,
  IPaymentResponse,
  TransactionType,
  TransactionStatus,
  PaymentProvider
} from '@shared/types/payment.types';
import { ValidationError } from '@shared/errors/validation.error';
import { DatabaseError } from '@shared/errors/database.error';

/**
 * Creates mock transaction data for testing
 * @param type Transaction type
 * @param provider Payment provider
 * @returns Mock transaction data
 */
function createMockTransactionData(
  type: TransactionType = TransactionType.EVENT_PAYMENT,
  provider: PaymentProvider = PaymentProvider.STRIPE
): ITransactionCreate {
  const userId = faker.string.uuid();
  const paymentMethodId = faker.string.uuid();
  const amount = faker.number.float({ min: 10, max: 1000, precision: 2 });
  const currency = 'USD';
  let description = '';
  
  switch (type) {
    case TransactionType.EVENT_PAYMENT:
      description = `Payment for event ${faker.lorem.words(3)}`;
      break;
    case TransactionType.SPLIT_PAYMENT:
      description = `Payment split for ${faker.lorem.words(3)}`;
      break;
    case TransactionType.REFUND:
      description = `Refund for transaction ${faker.string.uuid()}`;
      break;
  }
  
  const eventId = type === TransactionType.EVENT_PAYMENT ? faker.string.uuid() : undefined;
  const splitId = type === TransactionType.SPLIT_PAYMENT ? faker.string.uuid() : undefined;
  
  return {
    type,
    amount,
    currency,
    description,
    userId,
    paymentMethodId,
    provider,
    eventId,
    splitId,
    metadata: {}
  };
}

/**
 * Creates a mock implementation of the Stripe provider
 * @returns Mock Stripe provider
 */
function mockStripeProvider() {
  return {
    processPayment: jest.fn().mockImplementation(async (transaction) => {
      const txn = Transaction.fromDatabase(transaction);
      txn.updateStatus(TransactionStatus.COMPLETED);
      txn.setProviderTransactionId(faker.string.alphanumeric(24));
      return txn;
    }),
    processRefund: jest.fn().mockImplementation(async (refundTransaction) => {
      const txn = Transaction.fromDatabase(refundTransaction);
      txn.updateStatus(TransactionStatus.COMPLETED);
      txn.setProviderTransactionId(faker.string.alphanumeric(24));
      return txn;
    }),
    getPaymentStatus: jest.fn().mockResolvedValue(TransactionStatus.COMPLETED),
    handleWebhook: jest.fn().mockImplementation(async () => ({
      id: faker.string.uuid(),
      eventType: 'payment.succeeded',
      data: {
        paymentIntentId: faker.string.alphanumeric(24),
        amount: faker.number.float({ min: 10, max: 1000, precision: 2 }),
        status: 'succeeded',
        metadata: {}
      }
    }))
  };
}

/**
 * Creates a mock implementation of the Prisma transaction repository
 * @returns Mock repository
 */
function mockPrismaTransactionRepository() {
  return {
    create: jest.fn().mockImplementation(async (data) => data.data),
    findUnique: jest.fn().mockImplementation(async ({ where }) => ({
      id: where.id,
      type: TransactionType.EVENT_PAYMENT,
      status: TransactionStatus.COMPLETED,
      amount: 100,
      currency: 'USD',
      description: 'Test transaction',
      userId: faker.string.uuid(),
      paymentMethodId: faker.string.uuid(),
      provider: PaymentProvider.STRIPE,
      providerTransactionId: faker.string.alphanumeric(24),
      eventId: faker.string.uuid(),
      splitId: undefined,
      refundedTransactionId: undefined,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    findMany: jest.fn().mockResolvedValue([
      {
        id: faker.string.uuid(),
        type: TransactionType.EVENT_PAYMENT,
        status: TransactionStatus.COMPLETED,
        amount: 100,
        currency: 'USD',
        description: 'Test transaction',
        userId: faker.string.uuid(),
        paymentMethodId: faker.string.uuid(),
        provider: PaymentProvider.STRIPE,
        providerTransactionId: faker.string.alphanumeric(24),
        eventId: faker.string.uuid(),
        splitId: undefined,
        refundedTransactionId: undefined,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]),
    findFirst: jest.fn().mockResolvedValue({
      id: faker.string.uuid(),
      type: TransactionType.EVENT_PAYMENT,
      status: TransactionStatus.PROCESSING,
      amount: 100,
      currency: 'USD',
      description: 'Test transaction',
      userId: faker.string.uuid(),
      paymentMethodId: faker.string.uuid(),
      provider: PaymentProvider.STRIPE,
      providerTransactionId: faker.string.alphanumeric(24),
      eventId: faker.string.uuid(),
      splitId: undefined,
      refundedTransactionId: undefined,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    update: jest.fn().mockImplementation(async ({ data }) => ({
      ...data,
      id: faker.string.uuid()
    })),
    delete: jest.fn().mockResolvedValue({ id: faker.string.uuid() })
  };
}

// Mock the prisma client
jest.mock('@prisma/client', () => {
  return {
    prisma: {
      transaction: mockPrismaTransactionRepository(),
      paymentMethod: {
        findUnique: jest.fn().mockResolvedValue({
          id: faker.string.uuid(),
          userId: faker.string.uuid(),
          provider: PaymentProvider.STRIPE,
          token: faker.string.alphanumeric(24),
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      },
      paymentSplit: {
        update: jest.fn().mockResolvedValue({})
      }
    }
  };
});

// Mock the payment provider factory
jest.mock('../src/providers', () => {
  return {
    getPaymentProvider: jest.fn().mockImplementation(() => mockStripeProvider())
  };
});

// Mock the logger
jest.mock('winston', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Enable fake timers for testing Date changes
jest.useFakeTimers();

describe('Transaction Model', () => {
  it('should create a valid transaction', () => {
    const mockData = createMockTransactionData();
    const transaction = new Transaction(mockData);
    
    expect(transaction.id).toBeDefined();
    expect(transaction.type).toBe(mockData.type);
    expect(transaction.status).toBe(TransactionStatus.INITIATED);
    expect(transaction.amount).toBe(mockData.amount);
    expect(transaction.currency).toBe(mockData.currency);
    expect(transaction.description).toBe(mockData.description);
    expect(transaction.userId).toBe(mockData.userId);
    expect(transaction.paymentMethodId).toBe(mockData.paymentMethodId);
    expect(transaction.provider).toBe(mockData.provider);
    expect(transaction.validate()).toBe(true);
  });

  it('should throw validation error for invalid data', () => {
    const invalidData = {
      type: 'INVALID_TYPE', // Invalid enum value
      amount: -100, // Negative amount
      currency: '', // Empty currency
      description: '',
      userId: '',
      paymentMethodId: '',
      provider: 'INVALID_PROVIDER',
    } as unknown as ITransactionCreate;

    expect(() => {
      new Transaction(invalidData);
    }).toThrow(ValidationError);
  });

  it('should update status correctly', () => {
    const mockData = createMockTransactionData();
    const transaction = new Transaction(mockData);
    const originalUpdatedAt = new Date(transaction.updatedAt.getTime());
    
    // Advance virtual time
    jest.advanceTimersByTime(1000);
    
    transaction.updateStatus(TransactionStatus.PROCESSING);
    
    expect(transaction.status).toBe(TransactionStatus.PROCESSING);
    expect(transaction.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should set provider transaction ID correctly', () => {
    const mockData = createMockTransactionData();
    const transaction = new Transaction(mockData);
    const originalUpdatedAt = new Date(transaction.updatedAt.getTime());
    const providerId = 'pi_123456789';
    
    // Advance virtual time
    jest.advanceTimersByTime(1000);
    
    transaction.setProviderTransactionId(providerId);
    
    expect(transaction.providerTransactionId).toBe(providerId);
    expect(transaction.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should create refund transaction correctly', () => {
    const mockData = createMockTransactionData();
    const transaction = new Transaction(mockData);
    transaction.updateStatus(TransactionStatus.COMPLETED);
    
    const refundReason = 'Customer requested refund';
    const refundTransaction = transaction.processRefund(refundReason);
    
    expect(refundTransaction.type).toBe(TransactionType.REFUND);
    expect(refundTransaction.refundedTransactionId).toBe(transaction.id);
    expect(refundTransaction.amount).toBe(transaction.amount);
    expect(refundTransaction.currency).toBe(transaction.currency);
    expect(refundTransaction.userId).toBe(transaction.userId);
    expect(refundTransaction.metadata.refundReason).toBe(refundReason);
    expect(refundTransaction.metadata.originalTransactionId).toBe(transaction.id);
  });

  it('should check if transaction is refundable', () => {
    const mockData = createMockTransactionData();
    const transaction = new Transaction(mockData);
    
    // Initially not refundable (INITIATED)
    expect(transaction.isRefundable()).toBe(false);
    
    // COMPLETED status should be refundable
    transaction.updateStatus(TransactionStatus.PROCESSING);
    transaction.updateStatus(TransactionStatus.COMPLETED);
    expect(transaction.isRefundable()).toBe(true);
    
    // REFUND type should not be refundable
    const refundData = createMockTransactionData(TransactionType.REFUND);
    const refundTransaction = new Transaction(refundData);
    refundTransaction.updateStatus(TransactionStatus.COMPLETED);
    expect(refundTransaction.isRefundable()).toBe(false);
  });

  it('should convert to JSON correctly', () => {
    const mockData = createMockTransactionData();
    const transaction = new Transaction(mockData);
    
    const json = transaction.toJSON();
    
    expect(json.id).toBe(transaction.id);
    expect(json.status).toBe(transaction.status);
    expect(json.amount).toBe(transaction.amount);
    expect(json.currency).toBe(transaction.currency);
    expect(json.description).toBe(transaction.description);
    expect(json.paymentMethod).toBe(transaction.paymentMethodId);
    expect(json.createdAt).toBe(transaction.createdAt);
    
    // Should not include sensitive data
    expect(json).not.toHaveProperty('providerTransactionId');
    expect(json).not.toHaveProperty('metadata');
    expect(json).not.toHaveProperty('userId');
  });

  it('should create from database record correctly', () => {
    const dbRecord: ITransaction = {
      id: faker.string.uuid(),
      type: TransactionType.EVENT_PAYMENT,
      status: TransactionStatus.COMPLETED,
      amount: 150.75,
      currency: 'USD',
      description: 'Test transaction',
      userId: faker.string.uuid(),
      paymentMethodId: faker.string.uuid(),
      provider: PaymentProvider.STRIPE,
      providerTransactionId: 'pi_123456789',
      eventId: faker.string.uuid(),
      splitId: undefined,
      refundedTransactionId: undefined,
      metadata: { customField: 'value' },
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02')
    };
    
    const transaction = Transaction.fromDatabase(dbRecord);
    
    expect(transaction.id).toBe(dbRecord.id);
    expect(transaction.type).toBe(dbRecord.type);
    expect(transaction.status).toBe(dbRecord.status);
    expect(transaction.amount).toBe(dbRecord.amount);
    expect(transaction.currency).toBe(dbRecord.currency);
    expect(transaction.description).toBe(dbRecord.description);
    expect(transaction.userId).toBe(dbRecord.userId);
    expect(transaction.paymentMethodId).toBe(dbRecord.paymentMethodId);
    expect(transaction.provider).toBe(dbRecord.provider);
    expect(transaction.providerTransactionId).toBe(dbRecord.providerTransactionId);
    expect(transaction.metadata).toEqual(dbRecord.metadata);
    expect(transaction.createdAt).toEqual(dbRecord.createdAt);
    expect(transaction.updatedAt).toEqual(dbRecord.updatedAt);
  });
});

describe('TransactionService', () => {
  let transactionService: TransactionService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    transactionService = new TransactionService();
    // Spy on updateTransactionStatus for the refund test
    jest.spyOn(transactionService, 'updateTransactionStatus');
  });
  
  it('should create a transaction', async () => {
    const mockData = createMockTransactionData();
    const transaction = await transactionService.createTransaction(mockData);
    
    expect(transaction).toBeInstanceOf(Transaction);
    expect(transaction.type).toBe(mockData.type);
    expect(transaction.amount).toBe(mockData.amount);
    expect(transaction.currency).toBe(mockData.currency);
    expect(transaction.status).toBe(TransactionStatus.INITIATED);
    
    // The repository create method should be called with the transaction data
    expect(transactionService['transactionRepository'].create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: transaction.id,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount
        })
      })
    );
  });
  
  it('should get a transaction by ID', async () => {
    const transactionId = faker.string.uuid();
    const transaction = await transactionService.getTransactionById(transactionId);
    
    expect(transaction).toBeInstanceOf(Transaction);
    expect(transactionService['transactionRepository'].findUnique).toHaveBeenCalledWith({
      where: { id: transactionId }
    });
  });
  
  it('should get transactions by user', async () => {
    const userId = faker.string.uuid();
    const transactions = await transactionService.getTransactionsByUser(userId);
    
    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactionService['transactionRepository'].findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId }),
        orderBy: { createdAt: 'desc' }
      })
    );
  });
  
  it('should get transactions by event', async () => {
    const eventId = faker.string.uuid();
    const transactions = await transactionService.getTransactionsByEvent(eventId);
    
    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactionService['transactionRepository'].findMany).toHaveBeenCalledWith({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    });
  });
  
  it('should get transactions by split', async () => {
    const splitId = faker.string.uuid();
    const transactions = await transactionService.getTransactionsBySplit(splitId);
    
    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactionService['transactionRepository'].findMany).toHaveBeenCalledWith({
      where: { splitId },
      orderBy: { createdAt: 'desc' }
    });
  });
  
  it('should process a payment', async () => {
    const transactionId = faker.string.uuid();
    const paymentMethodId = faker.string.uuid();
    
    const result = await transactionService.processPayment(transactionId, paymentMethodId);
    
    expect(result).toBeInstanceOf(Transaction);
    expect(result.status).toBe(TransactionStatus.COMPLETED);
    expect(result.providerTransactionId).toBeDefined();
    
    // Verify that the payment provider was called correctly
    expect(getPaymentProvider).toHaveBeenCalled();
    
    // Verify that the transaction was updated in the database
    expect(transactionService['transactionRepository'].update).toHaveBeenCalledWith({
      where: { id: transactionId },
      data: expect.objectContaining({
        status: TransactionStatus.COMPLETED,
        providerTransactionId: expect.any(String)
      })
    });
  });
  
  it('should update transaction status', async () => {
    const transactionId = faker.string.uuid();
    const newStatus = TransactionStatus.COMPLETED;
    
    const result = await transactionService.updateTransactionStatus(transactionId, newStatus);
    
    expect(result.status).toBe(newStatus);
    expect(transactionService['transactionRepository'].update).toHaveBeenCalledWith({
      where: { id: transactionId },
      data: expect.objectContaining({
        status: newStatus,
        updatedAt: expect.any(Date)
      })
    });
  });
  
  it('should process a refund', async () => {
    const transactionId = faker.string.uuid();
    const reason = 'Customer requested refund';
    
    const result = await transactionService.processRefund(transactionId, reason);
    
    expect(result.type).toBe(TransactionType.REFUND);
    expect(result.status).toBe(TransactionStatus.COMPLETED);
    
    // Verify that a refund transaction was created
    expect(transactionService['transactionRepository'].create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: TransactionType.REFUND,
          refundedTransactionId: expect.any(String)
        })
      })
    );
    
    // Verify that the original transaction status was updated
    expect(transactionService.updateTransactionStatus).toHaveBeenCalledWith(
      expect.any(String),
      TransactionStatus.REFUNDED
    );
  });
  
  it('should check transaction status', async () => {
    const transactionId = faker.string.uuid();
    
    const status = await transactionService.checkTransactionStatus(transactionId);
    
    expect(status).toBe(TransactionStatus.COMPLETED);
    expect(getPaymentProvider).toHaveBeenCalled();
  });
  
  it('should handle webhook events', async () => {
    const provider = PaymentProvider.STRIPE;
    const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
    const signature = 'test-signature';
    
    const result = await transactionService.handleWebhook(provider, payload, signature);
    
    expect(result).toBe(true);
    expect(getPaymentProvider).toHaveBeenCalledWith(provider);
    expect(transactionService['transactionRepository'].findFirst).toHaveBeenCalled();
    expect(transactionService.updateTransactionStatus).toHaveBeenCalled();
  });
  
  it('should handle transaction summary', async () => {
    const userId = faker.string.uuid();
    jest.spyOn(transactionService, 'getTransactionsByUser').mockResolvedValueOnce([
      {
        id: faker.string.uuid(),
        status: TransactionStatus.COMPLETED,
        amount: 100,
        currency: 'USD',
        description: 'Test transaction 1',
        paymentMethod: faker.string.uuid(),
        createdAt: new Date('2023-01-01')
      },
      {
        id: faker.string.uuid(),
        status: TransactionStatus.FAILED,
        amount: 50,
        currency: 'USD',
        description: 'Test transaction 2',
        paymentMethod: faker.string.uuid(),
        createdAt: new Date('2023-01-02')
      }
    ] as IPaymentResponse[]);
    
    const summary = await transactionService.getTransactionSummary(userId, 'user');
    
    expect(summary).toHaveProperty('totalTransactions', 2);
    expect(summary).toHaveProperty('totalAmount', 150);
    expect(summary).toHaveProperty('averageAmount', 75);
    expect(summary).toHaveProperty('countByStatus');
    expect(summary).toHaveProperty('countByType');
    expect(summary).toHaveProperty('currency', 'USD');
    
    expect(transactionService.getTransactionsByUser).toHaveBeenCalledWith(userId);
  });
});