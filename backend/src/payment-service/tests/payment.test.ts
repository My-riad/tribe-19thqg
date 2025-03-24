import { faker } from '@faker-js/faker'; // v8.0.2
import { jest } from '@jest/globals'; // v29.5.0

import {
  Payment
} from '../src/models/payment.model';
import {
  PaymentService
} from '../src/services/payment.service';
import {
  StripeProvider
} from '../src/providers/stripe.provider';
import {
  VenmoProvider
} from '../src/providers/venmo.provider';
import {
  getPaymentProvider
} from '../src/providers';
import {
  PaymentProvider,
  PaymentMethod,
  IPaymentMethodCreate,
  IPaymentMethodResponse
} from '@shared/types/payment.types';
import {
  ValidationError
} from '@shared/errors/validation.error';
import {
  DatabaseError
} from '@shared/errors/database.error';

/**
 * Creates mock payment method data for testing
 * @param provider The payment provider to use
 * @returns Mock payment method data
 */
function createMockPaymentMethodData(provider: PaymentProvider): IPaymentMethodCreate {
  return {
    userId: faker.string.uuid(),
    provider,
    type: provider === PaymentProvider.STRIPE ? PaymentMethod.CREDIT_CARD : PaymentMethod.VENMO_BALANCE,
    token: faker.string.alphanumeric(24),
    isDefault: false
  };
}

/**
 * Creates a mock implementation of the Stripe provider
 * @returns Mock Stripe provider
 */
function mockStripeProvider() {
  return {
    createPaymentMethod: jest.fn().mockResolvedValue({
      token: faker.string.alphanumeric(24),
      last4: faker.string.numeric(4),
      expiryMonth: faker.number.int({ min: 1, max: 12 }),
      expiryYear: faker.number.int({ min: new Date().getFullYear(), max: new Date().getFullYear() + 10 })
    }),
    getPaymentMethod: jest.fn().mockResolvedValue({
      id: faker.string.uuid(),
      card: {
        last4: faker.string.numeric(4),
        exp_month: faker.number.int({ min: 1, max: 12 }),
        exp_year: faker.number.int({ min: new Date().getFullYear(), max: new Date().getFullYear() + 10 })
      }
    }),
    deletePaymentMethod: jest.fn().mockResolvedValue(true)
  };
}

/**
 * Creates a mock implementation of the Venmo provider
 * @returns Mock Venmo provider
 */
function mockVenmoProvider() {
  return {
    createPaymentMethod: jest.fn().mockResolvedValue({
      token: faker.string.alphanumeric(24),
      last4: faker.string.alphanumeric(4)
    }),
    getPaymentMethod: jest.fn().mockResolvedValue({
      id: faker.string.uuid(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      status: 'active',
      isVerified: true
    }),
    deletePaymentMethod: jest.fn().mockResolvedValue(true)
  };
}

/**
 * Creates a mock implementation of the Prisma payment method repository
 * @returns Mock repository
 */
function mockPrismaPaymentMethodRepository() {
  return {
    create: jest.fn().mockImplementation((args) => Promise.resolve(args.data)),
    findUnique: jest.fn().mockImplementation((args) => Promise.resolve({
      id: args.where.id,
      userId: faker.string.uuid(),
      provider: PaymentProvider.STRIPE,
      type: PaymentMethod.CREDIT_CARD,
      token: faker.string.alphanumeric(24),
      last4: faker.string.numeric(4),
      expiryMonth: faker.number.int({ min: 1, max: 12 }),
      expiryYear: faker.number.int({ min: new Date().getFullYear(), max: new Date().getFullYear() + 10 }),
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    findMany: jest.fn().mockResolvedValue([
      {
        id: faker.string.uuid(),
        userId: faker.string.uuid(),
        provider: PaymentProvider.STRIPE,
        type: PaymentMethod.CREDIT_CARD,
        token: faker.string.alphanumeric(24),
        last4: faker.string.numeric(4),
        expiryMonth: faker.number.int({ min: 1, max: 12 }),
        expiryYear: faker.number.int({ min: new Date().getFullYear(), max: new Date().getFullYear() + 10 }),
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: faker.string.uuid(),
        userId: faker.string.uuid(),
        provider: PaymentProvider.VENMO,
        type: PaymentMethod.VENMO_BALANCE,
        token: faker.string.alphanumeric(24),
        last4: faker.string.alphanumeric(4),
        expiryMonth: null,
        expiryYear: null,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]),
    findFirst: jest.fn().mockResolvedValue({
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      provider: PaymentProvider.STRIPE,
      type: PaymentMethod.CREDIT_CARD,
      token: faker.string.alphanumeric(24),
      last4: faker.string.numeric(4),
      expiryMonth: faker.number.int({ min: 1, max: 12 }),
      expiryYear: faker.number.int({ min: new Date().getFullYear(), max: new Date().getFullYear() + 10 }),
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    update: jest.fn().mockImplementation((args) => Promise.resolve({
      ...args.data,
      id: args.where.id,
      userId: faker.string.uuid(),
      provider: PaymentProvider.STRIPE,
      type: PaymentMethod.CREDIT_CARD,
      token: faker.string.alphanumeric(24),
      last4: faker.string.numeric(4),
      expiryMonth: faker.number.int({ min: 1, max: 12 }),
      expiryYear: faker.number.int({ min: new Date().getFullYear(), max: new Date().getFullYear() + 10 }),
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    delete: jest.fn().mockImplementation((args) => Promise.resolve({
      id: args.where.id,
      userId: faker.string.uuid(),
      provider: PaymentProvider.STRIPE,
      type: PaymentMethod.CREDIT_CARD,
      token: faker.string.alphanumeric(24),
      last4: faker.string.numeric(4),
      expiryMonth: faker.number.int({ min: 1, max: 12 }),
      expiryYear: faker.number.int({ min: new Date().getFullYear(), max: new Date().getFullYear() + 10 }),
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  };
}

// Mock getPaymentProvider function
jest.mock('../src/providers', () => ({
  getPaymentProvider: jest.fn((provider) => {
    if (provider === PaymentProvider.STRIPE) {
      return mockStripeProvider();
    } else if (provider === PaymentProvider.VENMO) {
      return mockVenmoProvider();
    }
    throw new Error(`Unsupported payment provider: ${provider}`);
  })
}));

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    paymentMethod: mockPrismaPaymentMethodRepository(),
    $transaction: jest.fn((callback) => callback(mockPrismaPaymentMethodRepository()))
  }));
  return { PrismaClient: mockPrismaClient };
});

// Mock logger
jest.mock('winston', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Payment Model', () => {
  test('should create a valid payment method', () => {
    // Create mock payment method data
    const mockData = createMockPaymentMethodData(PaymentProvider.STRIPE);
    
    // Create a new Payment instance
    const payment = new Payment(mockData);
    
    // Verify the payment method was created correctly
    expect(payment.userId).toBe(mockData.userId);
    expect(payment.provider).toBe(mockData.provider);
    expect(payment.type).toBe(mockData.type);
    expect(payment.token).toBe(mockData.token);
    expect(payment.isDefault).toBe(mockData.isDefault);
    
    // Verify validation passes
    expect(payment.validate()).toBe(true);
  });
  
  test('should throw validation error for invalid data', () => {
    // Create invalid payment method data (missing required field)
    const invalidData = {
      provider: PaymentProvider.STRIPE,
      type: PaymentMethod.CREDIT_CARD,
      token: faker.string.alphanumeric(24),
      isDefault: false
    } as IPaymentMethodCreate;
    
    // Create a new Payment instance
    const payment = new Payment(invalidData);
    
    // Verify validation throws an error
    expect(() => payment.validate()).toThrow(ValidationError);
  });
  
  test('should set card details correctly', () => {
    // Create mock payment method data
    const mockData = createMockPaymentMethodData(PaymentProvider.STRIPE);
    
    // Create a new Payment instance
    const payment = new Payment(mockData);
    
    // Set card details
    const last4 = '4242';
    const expiryMonth = 12;
    const expiryYear = new Date().getFullYear() + 2;
    payment.setCardDetails(last4, expiryMonth, expiryYear);
    
    // Verify the card details were set correctly
    expect(payment.last4).toBe(last4);
    expect(payment.expiryMonth).toBe(expiryMonth);
    expect(payment.expiryYear).toBe(expiryYear);
  });
  
  test('should set default status correctly', () => {
    // Create mock payment method data
    const mockData = createMockPaymentMethodData(PaymentProvider.STRIPE);
    
    // Create a new Payment instance
    const payment = new Payment(mockData);
    expect(payment.isDefault).toBe(false);
    
    // Set as default
    payment.setDefault(true);
    
    // Verify default status
    expect(payment.isDefault).toBe(true);
  });
  
  test('should detect expired cards correctly', () => {
    // Create mock payment method data
    const mockData = createMockPaymentMethodData(PaymentProvider.STRIPE);
    
    // Create a new Payment instance
    const payment = new Payment(mockData);
    
    // Set expired card details (last year)
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    payment.setCardDetails('4242', 12, lastYear);
    
    // Verify the card is detected as expired
    expect(payment.isExpired()).toBe(true);
    
    // Set valid card details (future year)
    const futureYear = currentYear + 2;
    payment.setCardDetails('4242', 12, futureYear);
    
    // Verify the card is not expired
    expect(payment.isExpired()).toBe(false);
  });
  
  test('should convert to JSON correctly', () => {
    // Create mock payment method data
    const mockData = createMockPaymentMethodData(PaymentProvider.STRIPE);
    
    // Create a new Payment instance
    const payment = new Payment(mockData);
    payment.setCardDetails('4242', 12, new Date().getFullYear() + 2);
    
    // Convert to JSON
    const json = payment.toJSON();
    
    // Verify the JSON format
    expect(json).toEqual({
      id: payment.id,
      type: payment.type,
      provider: payment.provider,
      last4: payment.last4,
      expiryMonth: payment.expiryMonth,
      expiryYear: payment.expiryYear,
      isDefault: payment.isDefault,
      createdAt: payment.createdAt
    });
    
    // Verify sensitive data is not included
    expect(json).not.toHaveProperty('token');
    expect(json).not.toHaveProperty('userId');
  });
  
  test('should create from database record correctly', () => {
    // Create mock database record
    const dbRecord = {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      provider: PaymentProvider.STRIPE,
      type: PaymentMethod.CREDIT_CARD,
      token: faker.string.alphanumeric(24),
      last4: '4242',
      expiryMonth: 12,
      expiryYear: new Date().getFullYear() + 2,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create Payment from database record
    const payment = Payment.fromDatabase(dbRecord);
    
    // Verify the Payment instance has all properties from the record
    expect(payment.id).toBe(dbRecord.id);
    expect(payment.userId).toBe(dbRecord.userId);
    expect(payment.provider).toBe(dbRecord.provider);
    expect(payment.type).toBe(dbRecord.type);
    expect(payment.token).toBe(dbRecord.token);
    expect(payment.last4).toBe(dbRecord.last4);
    expect(payment.expiryMonth).toBe(dbRecord.expiryMonth);
    expect(payment.expiryYear).toBe(dbRecord.expiryYear);
    expect(payment.isDefault).toBe(dbRecord.isDefault);
    expect(payment.createdAt).toEqual(dbRecord.createdAt);
    expect(payment.updatedAt).toEqual(dbRecord.updatedAt);
  });
});

describe('PaymentService', () => {
  let paymentService: PaymentService;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a new PaymentService instance
    paymentService = new PaymentService();
  });
  
  test('should create a payment method', async () => {
    // Create mock payment method data
    const mockData = createMockPaymentMethodData(PaymentProvider.STRIPE);
    
    // Mock card details for processing
    mockData['cardDetails'] = {
      number: '4242424242424242',
      expMonth: 12,
      expYear: new Date().getFullYear() + 2,
      cvc: '123'
    };
    
    // Call the service method
    const result = await paymentService.createPaymentMethod(mockData);
    
    // Verify the repository create method was called
    expect(paymentService['paymentMethodRepository'].create).toHaveBeenCalled();
    
    // Verify the result format
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('type', mockData.type);
    expect(result).toHaveProperty('provider', mockData.provider);
    expect(result).toHaveProperty('isDefault', mockData.isDefault);
  });
  
  test('should get a payment method by ID', async () => {
    // Create a mock ID
    const mockId = faker.string.uuid();
    
    // Call the service method
    const result = await paymentService.getPaymentMethodById(mockId);
    
    // Verify the repository findUnique method was called with the correct ID
    expect(paymentService['paymentMethodRepository'].findUnique).toHaveBeenCalledWith({
      where: { id: mockId }
    });
    
    // Verify the result is a Payment instance
    expect(result).toBeInstanceOf(Payment);
    expect(result.id).toBe(mockId);
  });
  
  test('should get payment methods by user', async () => {
    // Create a mock user ID
    const mockUserId = faker.string.uuid();
    
    // Call the service method
    const result = await paymentService.getPaymentMethodsByUser(mockUserId);
    
    // Verify the repository findMany method was called with the correct user ID
    expect(paymentService['paymentMethodRepository'].findMany).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    // Verify the result is an array of payment methods
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('type');
    expect(result[0]).toHaveProperty('provider');
  });
  
  test('should update a payment method', async () => {
    // Create a mock ID
    const mockId = faker.string.uuid();
    
    // Create mock update data
    const updateData = {
      isDefault: true
    };
    
    // Call the service method
    const result = await paymentService.updatePaymentMethod(mockId, updateData);
    
    // Verify the repository update method was called with the correct data
    expect(paymentService['paymentMethodRepository'].update).toHaveBeenCalledWith({
      where: { id: mockId },
      data: expect.objectContaining({
        isDefault: updateData.isDefault
      })
    });
    
    // Verify the result matches the updated payment method
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('isDefault', updateData.isDefault);
  });
  
  test('should delete a payment method', async () => {
    // Create a mock ID
    const mockId = faker.string.uuid();
    
    // Call the service method
    const result = await paymentService.deletePaymentMethod(mockId);
    
    // Verify the provider deletePaymentMethod was called
    const mockGetPaymentProvider = getPaymentProvider as jest.Mock;
    const mockProvider = mockGetPaymentProvider.mock.results[0].value;
    expect(mockProvider.deletePaymentMethod).toHaveBeenCalled();
    
    // Verify the repository delete method was called with the correct ID
    expect(paymentService['paymentMethodRepository'].delete).toHaveBeenCalledWith({
      where: { id: mockId }
    });
    
    // Verify the result is true (successful deletion)
    expect(result).toBe(true);
  });
  
  test('should set a payment method as default', async () => {
    // Create mock IDs
    const mockId = faker.string.uuid();
    const mockUserId = faker.string.uuid();
    
    // Call the service method
    const result = await paymentService.setDefaultPaymentMethod(mockId, mockUserId);
    
    // Verify updateMany was called to reset other default payment methods
    expect(paymentService['paymentMethodRepository'].updateMany).toHaveBeenCalledWith({
      where: {
        userId: mockUserId,
        isDefault: true
      },
      data: {
        isDefault: false,
        updatedAt: expect.any(Date)
      }
    });
    
    // Verify update was called to set the new default
    expect(paymentService['paymentMethodRepository'].update).toHaveBeenCalledWith({
      where: { id: mockId },
      data: {
        isDefault: true,
        updatedAt: expect.any(Date)
      }
    });
    
    // Verify the result is the updated payment method
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('isDefault', true);
  });
  
  test('should get the default payment method', async () => {
    // Create a mock user ID
    const mockUserId = faker.string.uuid();
    
    // Call the service method
    const result = await paymentService.getDefaultPaymentMethod(mockUserId);
    
    // Verify the repository findFirst method was called with the correct criteria
    expect(paymentService['paymentMethodRepository'].findFirst).toHaveBeenCalledWith({
      where: {
        userId: mockUserId,
        isDefault: true
      }
    });
    
    // Verify the result is a payment method response
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('isDefault', true);
  });
  
  test('should validate a payment method', async () => {
    // Create a mock ID
    const mockId = faker.string.uuid();
    
    // Call the service method
    const result = await paymentService.validatePaymentMethod(mockId);
    
    // Verify getPaymentMethod was called on the provider
    const mockGetPaymentProvider = getPaymentProvider as jest.Mock;
    const mockProvider = mockGetPaymentProvider.mock.results[0].value;
    expect(mockProvider.getPaymentMethod).toHaveBeenCalled();
    
    // Verify the result is true (valid payment method)
    expect(result).toBe(true);
  });
  
  test('should handle provider-specific payment method creation', async () => {
    // Create mock Stripe payment method data
    const stripeData = createMockPaymentMethodData(PaymentProvider.STRIPE);
    stripeData['cardDetails'] = {
      number: '4242424242424242',
      expMonth: 12,
      expYear: new Date().getFullYear() + 2,
      cvc: '123'
    };
    
    // Call the service method for Stripe
    await paymentService.createPaymentMethod(stripeData);
    
    // Verify Stripe provider was used
    expect(getPaymentProvider).toHaveBeenCalledWith(PaymentProvider.STRIPE);
    const stripeProvider = (getPaymentProvider as jest.Mock).mock.results[0].value;
    expect(stripeProvider.createPaymentMethod).toHaveBeenCalled();
    
    // Reset mock to verify Venmo call
    jest.clearAllMocks();
    
    // Create mock Venmo payment method data
    const venmoData = createMockPaymentMethodData(PaymentProvider.VENMO);
    venmoData['venmoDetails'] = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      accessToken: faker.string.alphanumeric(64)
    };
    
    // Call the service method for Venmo
    await paymentService.createPaymentMethod(venmoData);
    
    // Verify Venmo provider was used
    expect(getPaymentProvider).toHaveBeenCalledWith(PaymentProvider.VENMO);
    const venmoProvider = (getPaymentProvider as jest.Mock).mock.results[0].value;
    expect(venmoProvider.createPaymentMethod).toHaveBeenCalled();
  });
});