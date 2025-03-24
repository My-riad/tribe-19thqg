import { jest } from '@jest/globals';
import { faker } from '@faker-js/faker'; // v8.0.2
import nock from 'nock'; // v13.3.1

// Import services
import { PaymentService } from '../../src/payment-service/src/services/payment.service';
import { SplitService } from '../../src/payment-service/src/services/split.service';
import { TransactionService } from '../../src/payment-service/src/services/transaction.service';

// Import providers
import { getPaymentProvider, StripeProvider, VenmoProvider } from '../../src/payment-service/src/providers';

// Import database client for test data setup and verification
import prisma from '../../src/config/database';

// Import types
import {
  IPaymentMethodCreate,
  IPaymentSplitCreate,
  ITransactionCreate,
  PaymentProvider,
  SplitType,
  TransactionType,
  TransactionStatus
} from '../../src/shared/src/types/payment.types';

// Test variables
let testUserId: string;
let testEventId: string;
let paymentService: PaymentService;
let splitService: SplitService;
let transactionService: TransactionService;

/**
 * Sets up test data for payment integration tests
 */
async function setupTestData(): Promise<void> {
  // Generate test IDs
  testUserId = faker.string.uuid();
  testEventId = faker.string.uuid();
  
  // Create test user in database
  await prisma.prisma.user.create({
    data: {
      id: testUserId,
      email: faker.internet.email(),
      passwordHash: 'test-password-hash',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  
  // Create test tribe for the event
  const tribeId = faker.string.uuid();
  await prisma.prisma.tribe.create({
    data: {
      id: tribeId,
      name: 'Test Tribe',
      description: 'Test tribe for payment integration tests',
      createdBy: testUserId,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  
  // Create test event in database
  await prisma.prisma.event.create({
    data: {
      id: testEventId,
      name: 'Test Event',
      description: 'Test event for payment integration tests',
      location: 'Test Location',
      tribeId: tribeId,
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours after start
      createdBy: testUserId,
      status: 'SCHEDULED',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  
  // Initialize service instances
  paymentService = new PaymentService();
  transactionService = new TransactionService();
  splitService = new SplitService(transactionService);
}

/**
 * Cleans up test data after payment integration tests
 */
async function cleanupTestData(): Promise<void> {
  // Delete test transactions
  await prisma.prisma.transaction.deleteMany({
    where: { userId: testUserId }
  });
  
  // Delete test payment splits and shares
  const splits = await prisma.prisma.paymentSplit.findMany({
    where: { eventId: testEventId }
  });
  
  for (const split of splits) {
    await prisma.prisma.paymentShare.deleteMany({
      where: { splitId: split.id }
    });
  }
  
  await prisma.prisma.paymentSplit.deleteMany({
    where: { eventId: testEventId }
  });
  
  // Delete test payment methods
  await prisma.prisma.paymentMethod.deleteMany({
    where: { userId: testUserId }
  });
  
  // Delete test event
  await prisma.prisma.event.delete({
    where: { id: testEventId }
  });
  
  // Delete test tribe
  await prisma.prisma.tribe.deleteMany({
    where: { createdBy: testUserId }
  });
  
  // Delete test user
  await prisma.prisma.user.delete({
    where: { id: testUserId }
  });
}

/**
 * Sets up mocks for Stripe API calls
 */
function mockStripeApi(): void {
  // Mock Stripe payment method creation
  nock('https://api.stripe.com/v1')
    .post('/payment_methods')
    .reply(200, {
      id: 'pm_test123456',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025
      },
      created: Math.floor(Date.now() / 1000)
    });
  
  // Mock Stripe payment intent creation
  nock('https://api.stripe.com/v1')
    .post('/payment_intents')
    .reply(200, {
      id: 'pi_test123456',
      client_secret: 'pi_test123456_secret_test',
      status: 'requires_confirmation',
      amount: 1000, // $10.00
      currency: 'usd'
    });
  
  // Mock Stripe payment method retrieval
  nock('https://api.stripe.com/v1')
    .get(/\/payment_methods\/pm_.*/)
    .reply(200, {
      id: 'pm_test123456',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025
      },
      created: Math.floor(Date.now() / 1000)
    });
  
  // Mock Stripe refund creation
  nock('https://api.stripe.com/v1')
    .post('/refunds')
    .reply(200, {
      id: 're_test123456',
      amount: 1000,
      status: 'succeeded',
      payment_intent: 'pi_test123456'
    });
}

/**
 * Sets up mocks for Venmo API calls
 */
function mockVenmoApi(): void {
  // Mock Venmo API base URL
  const venmoApiBaseUrl = 'https://api.venmo.com/v1';
  
  // Mock Venmo account verification
  nock(venmoApiBaseUrl)
    .get('/me')
    .reply(200, {
      user: {
        id: 'user123456',
        username: 'testuser',
        email: faker.internet.email()
      }
    });
  
  // Mock Venmo payment request creation
  nock(venmoApiBaseUrl)
    .post('/payments')
    .reply(200, {
      payment: {
        id: 'payment123456',
        amount: 10.00,
        note: 'Test payment',
        status: 'pending'
      }
    });
  
  // Mock Venmo payment status check
  nock(venmoApiBaseUrl)
    .get(/\/payments\/payment.*/)
    .reply(200, {
      payment: {
        id: 'payment123456',
        amount: 10.00,
        note: 'Test payment',
        status: 'pending'
      }
    });
}

/**
 * Creates a test payment method for integration tests
 */
async function createTestPaymentMethod(provider: PaymentProvider, isDefault: boolean = false): Promise<any> {
  let paymentMethodData: IPaymentMethodCreate;
  
  if (provider === PaymentProvider.STRIPE) {
    paymentMethodData = {
      userId: testUserId,
      provider: PaymentProvider.STRIPE,
      type: 'CREDIT_CARD',
      token: 'pm_test123456',
      isDefault
    };
  } else {
    paymentMethodData = {
      userId: testUserId,
      provider: PaymentProvider.VENMO,
      type: 'VENMO_BALANCE',
      token: 'venmo_test123456',
      isDefault
    };
  }
  
  return await paymentService.createPaymentMethod(paymentMethodData);
}

/**
 * Creates a test payment split for integration tests
 */
async function createTestSplit(splitType: SplitType, amount: number, participantIds: string[]): Promise<any> {
  const splitData: IPaymentSplitCreate = {
    eventId: testEventId,
    createdBy: testUserId,
    description: 'Test payment split',
    totalAmount: amount,
    currency: 'USD',
    splitType,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    participants: []
  };
  
  if (splitType === SplitType.EQUAL) {
    // Equal split among participants
    splitData.participants = participantIds.map(id => ({
      userId: id
    }));
  } else if (splitType === SplitType.PERCENTAGE) {
    // Percentage-based split
    const percentage = 100 / participantIds.length;
    splitData.participants = participantIds.map(id => ({
      userId: id,
      percentage
    }));
  } else if (splitType === SplitType.CUSTOM) {
    // Custom amount split
    const individualAmount = amount / participantIds.length;
    splitData.participants = participantIds.map(id => ({
      userId: id,
      amount: individualAmount
    }));
  }
  
  return await splitService.createSplit(splitData);
}

/**
 * Creates a test transaction for integration tests
 */
async function createTestTransaction(type: TransactionType, amount: number, userId: string, splitId: string): Promise<any> {
  // Create a payment method first
  const paymentMethod = await createTestPaymentMethod(PaymentProvider.STRIPE);
  
  const transactionData: ITransactionCreate = {
    type,
    amount,
    currency: 'USD',
    description: 'Test transaction',
    userId,
    paymentMethodId: paymentMethod.id,
    provider: PaymentProvider.STRIPE,
    eventId: testEventId,
    splitId,
    metadata: {
      test: true
    }
  };
  
  return await transactionService.createTransaction(transactionData);
}

// Payment Method Integration Tests
describe('Payment Method Integration Tests', () => {
  beforeAll(async () => {
    await setupTestData();
    mockStripeApi();
  });
  
  afterAll(async () => {
    await cleanupTestData();
  });
  
  it('should create a Stripe payment method', async () => {
    const paymentMethodData: IPaymentMethodCreate = {
      userId: testUserId,
      provider: PaymentProvider.STRIPE,
      type: 'CREDIT_CARD',
      token: 'pm_test123456',
      isDefault: false
    };
    
    const result = await paymentService.createPaymentMethod(paymentMethodData);
    
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.provider).toBe(PaymentProvider.STRIPE);
    expect(result.type).toBe('CREDIT_CARD');
    expect(result.isDefault).toBe(false);
    
    // Verify in database
    const dbPaymentMethod = await prisma.prisma.paymentMethod.findUnique({
      where: { id: result.id }
    });
    
    expect(dbPaymentMethod).toBeDefined();
    expect(dbPaymentMethod.userId).toBe(testUserId);
  });
  
  it('should create a Venmo payment method', async () => {
    mockVenmoApi();
    
    const paymentMethodData: IPaymentMethodCreate = {
      userId: testUserId,
      provider: PaymentProvider.VENMO,
      type: 'VENMO_BALANCE',
      token: 'venmo_test123456',
      isDefault: false
    };
    
    const result = await paymentService.createPaymentMethod(paymentMethodData);
    
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.provider).toBe(PaymentProvider.VENMO);
    expect(result.type).toBe('VENMO_BALANCE');
    expect(result.isDefault).toBe(false);
    
    // Verify in database
    const dbPaymentMethod = await prisma.prisma.paymentMethod.findUnique({
      where: { id: result.id }
    });
    
    expect(dbPaymentMethod).toBeDefined();
    expect(dbPaymentMethod.userId).toBe(testUserId);
  });
  
  it('should retrieve a payment method by ID', async () => {
    // Create a payment method
    const paymentMethod = await createTestPaymentMethod(PaymentProvider.STRIPE);
    
    // Retrieve it by ID
    const result = await paymentService.getPaymentMethodById(paymentMethod.id);
    
    expect(result).toBeDefined();
    expect(result.id).toBe(paymentMethod.id);
    expect(result.provider).toBe(PaymentProvider.STRIPE);
  });
  
  it('should retrieve payment methods by user ID', async () => {
    // Create multiple payment methods for the same user
    await createTestPaymentMethod(PaymentProvider.STRIPE);
    mockVenmoApi();
    await createTestPaymentMethod(PaymentProvider.VENMO);
    
    // Retrieve all payment methods for the user
    const results = await paymentService.getPaymentMethodsByUser(testUserId);
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.some(pm => pm.provider === PaymentProvider.STRIPE)).toBe(true);
    expect(results.some(pm => pm.provider === PaymentProvider.VENMO)).toBe(true);
  });
  
  it('should update a payment method', async () => {
    // Create a payment method
    const paymentMethod = await createTestPaymentMethod(PaymentProvider.STRIPE, false);
    
    // Update it
    const updateData = {
      isDefault: true
    };
    
    const result = await paymentService.updatePaymentMethod(paymentMethod.id, updateData);
    
    expect(result).toBeDefined();
    expect(result.id).toBe(paymentMethod.id);
    expect(result.isDefault).toBe(true);
    
    // Verify in database
    const dbPaymentMethod = await prisma.prisma.paymentMethod.findUnique({
      where: { id: paymentMethod.id }
    });
    
    expect(dbPaymentMethod).toBeDefined();
    expect(dbPaymentMethod.isDefault).toBe(true);
  });
  
  it('should delete a payment method', async () => {
    // Create a payment method
    const paymentMethod = await createTestPaymentMethod(PaymentProvider.STRIPE);
    
    // Delete it
    const result = await paymentService.deletePaymentMethod(paymentMethod.id);
    
    expect(result).toBe(true);
    
    // Verify in database
    const dbPaymentMethod = await prisma.prisma.paymentMethod.findUnique({
      where: { id: paymentMethod.id }
    });
    
    expect(dbPaymentMethod).toBeNull();
  });
  
  it('should set a payment method as default', async () => {
    // Create multiple payment methods
    const pm1 = await createTestPaymentMethod(PaymentProvider.STRIPE, false);
    mockVenmoApi();
    const pm2 = await createTestPaymentMethod(PaymentProvider.VENMO, false);
    
    // Set one as default
    const result = await paymentService.setDefaultPaymentMethod(pm1.id, testUserId);
    
    expect(result).toBeDefined();
    expect(result.id).toBe(pm1.id);
    expect(result.isDefault).toBe(true);
    
    // Verify first method is default
    const dbPm1 = await prisma.prisma.paymentMethod.findUnique({
      where: { id: pm1.id }
    });
    
    expect(dbPm1).toBeDefined();
    expect(dbPm1.isDefault).toBe(true);
    
    // Verify second method is not default
    const dbPm2 = await prisma.prisma.paymentMethod.findUnique({
      where: { id: pm2.id }
    });
    
    expect(dbPm2).toBeDefined();
    expect(dbPm2.isDefault).toBe(false);
  });
});

// Payment Split Integration Tests
describe('Payment Split Integration Tests', () => {
  beforeAll(async () => {
    await setupTestData();
    mockStripeApi();
  });
  
  afterAll(async () => {
    await cleanupTestData();
  });
  
  it('should create an equal split payment', async () => {
    const participants = [testUserId, faker.string.uuid(), faker.string.uuid()];
    const totalAmount = 60.00;
    
    const result = await createTestSplit(SplitType.EQUAL, totalAmount, participants);
    
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.totalAmount).toBe(totalAmount);
    expect(result.splitType).toBe(SplitType.EQUAL);
    expect(result.shares).toHaveLength(participants.length);
    
    // Check that shares are equal
    const shareAmount = totalAmount / participants.length;
    for (const share of result.shares) {
      expect(share.amount).toBeCloseTo(shareAmount, 2);
    }
  });
  
  it('should create a percentage split payment', async () => {
    const participants = [
      { userId: testUserId, percentage: 50 },
      { userId: faker.string.uuid(), percentage: 30 },
      { userId: faker.string.uuid(), percentage: 20 }
    ];
    const totalAmount = 100.00;
    
    const splitData: IPaymentSplitCreate = {
      eventId: testEventId,
      createdBy: testUserId,
      description: 'Test percentage split',
      totalAmount,
      currency: 'USD',
      splitType: SplitType.PERCENTAGE,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      participants
    };
    
    const result = await splitService.createSplit(splitData);
    
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.totalAmount).toBe(totalAmount);
    expect(result.splitType).toBe(SplitType.PERCENTAGE);
    expect(result.shares).toHaveLength(participants.length);
    
    // Check that shares match percentages
    for (let i = 0; i < participants.length; i++) {
      const share = result.shares.find(s => s.userId === participants[i].userId);
      expect(share).toBeDefined();
      expect(share.amount).toBeCloseTo(totalAmount * (participants[i].percentage / 100), 2);
    }
  });
  
  it('should create a custom split payment', async () => {
    const participants = [
      { userId: testUserId, amount: 25.50 },
      { userId: faker.string.uuid(), amount: 15.75 },
      { userId: faker.string.uuid(), amount: 8.75 }
    ];
    const totalAmount = participants.reduce((sum, p) => sum + p.amount, 0);
    
    const splitData: IPaymentSplitCreate = {
      eventId: testEventId,
      createdBy: testUserId,
      description: 'Test custom split',
      totalAmount,
      currency: 'USD',
      splitType: SplitType.CUSTOM,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      participants
    };
    
    const result = await splitService.createSplit(splitData);
    
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.totalAmount).toBeCloseTo(totalAmount, 2);
    expect(result.splitType).toBe(SplitType.CUSTOM);
    expect(result.shares).toHaveLength(participants.length);
    
    // Check that shares match specified amounts
    for (let i = 0; i < participants.length; i++) {
      const share = result.shares.find(s => s.userId === participants[i].userId);
      expect(share).toBeDefined();
      expect(share.amount).toBeCloseTo(participants[i].amount, 2);
    }
  });
  
  it('should retrieve a split by ID', async () => {
    // Create a split
    const participants = [testUserId, faker.string.uuid()];
    const split = await createTestSplit(SplitType.EQUAL, 50.00, participants);
    
    // Retrieve it by ID
    const result = await splitService.getSplitById(split.id);
    
    expect(result).toBeDefined();
    expect(result.id).toBe(split.id);
    expect(result.shares).toHaveLength(participants.length);
  });
  
  it('should retrieve splits by event ID', async () => {
    // Create multiple splits for the same event
    await createTestSplit(SplitType.EQUAL, 30.00, [testUserId, faker.string.uuid()]);
    await createTestSplit(SplitType.EQUAL, 45.00, [testUserId, faker.string.uuid()]);
    
    // Retrieve all splits for the event
    const results = await splitService.getSplitsByEvent(testEventId);
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(2);
  });
  
  it('should retrieve splits by user ID', async () => {
    // Create multiple splits with the same user
    const otherUserId = faker.string.uuid();
    await createTestSplit(SplitType.EQUAL, 40.00, [testUserId, otherUserId]);
    await createTestSplit(SplitType.EQUAL, 60.00, [testUserId, otherUserId]);
    
    // Retrieve all splits for the user
    const results = await splitService.getSplitsByUser(testUserId);
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(2);
  });
  
  it('should process a share payment', async () => {
    // Create a split
    const split = await createTestSplit(SplitType.EQUAL, 50.00, [testUserId]);
    
    // Create a payment method
    const paymentMethod = await createTestPaymentMethod(PaymentProvider.STRIPE);
    
    // Process payment for the user's share
    const result = await splitService.processSharePayment(split.id, testUserId, paymentMethod.id);
    
    expect(result).toBe(true);
    
    // Verify a transaction was created
    const transactions = await prisma.prisma.transaction.findMany({
      where: { splitId: split.id }
    });
    
    expect(transactions).toBeDefined();
    expect(transactions.length).toBeGreaterThan(0);
  });
  
  it('should update split status based on share payments', async () => {
    // Create a split with multiple shares
    const participant1 = testUserId;
    const participant2 = faker.string.uuid();
    const split = await createTestSplit(SplitType.EQUAL, 100.00, [participant1, participant2]);
    
    // Create a payment method for test user
    const paymentMethod = await createTestPaymentMethod(PaymentProvider.STRIPE);
    
    // Process payment for test user's share
    await splitService.processSharePayment(split.id, participant1, paymentMethod.id);
    
    // Create test payment method for second participant and process payment
    await prisma.prisma.paymentMethod.create({
      data: {
        id: faker.string.uuid(),
        userId: participant2,
        provider: PaymentProvider.STRIPE,
        type: 'CREDIT_CARD',
        token: 'pm_test_participant2',
        last4: '4242',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Manually update share status since we can't make actual payment for the second user
    await prisma.prisma.paymentShare.updateMany({
      where: { 
        splitId: split.id,
        userId: participant2
      },
      data: {
        status: 'COMPLETED'
      }
    });
    
    // Update split status
    const status = await splitService.updateSplitStatus(split.id);
    
    expect(status).toBe('COMPLETED');
  });
});

// Transaction Integration Tests
describe('Transaction Integration Tests', () => {
  beforeAll(async () => {
    await setupTestData();
    mockStripeApi();
  });
  
  afterAll(async () => {
    await cleanupTestData();
  });
  
  it('should create a transaction', async () => {
    // Create a split for the transaction
    const split = await createTestSplit(SplitType.EQUAL, 75.00, [testUserId]);
    
    // Create a payment method
    const paymentMethod = await createTestPaymentMethod(PaymentProvider.STRIPE);
    
    const transactionData: ITransactionCreate = {
      type: TransactionType.SPLIT_PAYMENT,
      amount: 75.00,
      currency: 'USD',
      description: 'Test transaction',
      userId: testUserId,
      paymentMethodId: paymentMethod.id,
      provider: PaymentProvider.STRIPE,
      eventId: testEventId,
      splitId: split.id,
      metadata: {
        test: true
      }
    };
    
    const result = await transactionService.createTransaction(transactionData);
    
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.type).toBe(TransactionType.SPLIT_PAYMENT);
    expect(result.amount).toBe(75.00);
    expect(result.status).toBe(TransactionStatus.INITIATED);
    
    // Verify in database
    const dbTransaction = await prisma.prisma.transaction.findUnique({
      where: { id: result.id }
    });
    
    expect(dbTransaction).toBeDefined();
    expect(dbTransaction.userId).toBe(testUserId);
  });
  
  it('should retrieve a transaction by ID', async () => {
    // Create a split for the transaction
    const split = await createTestSplit(SplitType.EQUAL, 50.00, [testUserId]);
    
    // Create a transaction
    const transaction = await createTestTransaction(TransactionType.SPLIT_PAYMENT, 50.00, testUserId, split.id);
    
    // Retrieve it by ID
    const result = await transactionService.getTransactionById(transaction.id);
    
    expect(result).toBeDefined();
    expect(result.id).toBe(transaction.id);
    expect(result.amount).toBe(50.00);
  });
  
  it('should process a payment with Stripe', async () => {
    // Create a split for the transaction
    const split = await createTestSplit(SplitType.EQUAL, 25.00, [testUserId]);
    
    // Create a payment method
    const paymentMethod = await createTestPaymentMethod(PaymentProvider.STRIPE);
    
    // Create a transaction
    const transactionData: ITransactionCreate = {
      type: TransactionType.SPLIT_PAYMENT,
      amount: 25.00,
      currency: 'USD',
      description: 'Test Stripe payment',
      userId: testUserId,
      paymentMethodId: paymentMethod.id,
      provider: PaymentProvider.STRIPE,
      eventId: testEventId,
      splitId: split.id,
      metadata: {}
    };
    
    const transaction = await transactionService.createTransaction(transactionData);
    
    // Process the payment
    const result = await transactionService.processPayment(transaction.id, paymentMethod.id);
    
    expect(result).toBeDefined();
    expect(result.id).toBe(transaction.id);
    expect(result.status).toBe(TransactionStatus.PROCESSING);
    expect(result.providerTransactionId).toBeDefined();
  });
  
  it('should process a payment with Venmo', async () => {
    // Mock Venmo API
    mockVenmoApi();
    
    // Create a split for the transaction
    const split = await createTestSplit(SplitType.EQUAL, 15.00, [testUserId]);
    
    // Create a payment method
    const paymentMethod = await createTestPaymentMethod(PaymentProvider.VENMO);
    
    // Create a transaction
    const transactionData: ITransactionCreate = {
      type: TransactionType.SPLIT_PAYMENT,
      amount: 15.00,
      currency: 'USD',
      description: 'Test Venmo payment',
      userId: testUserId,
      paymentMethodId: paymentMethod.id,
      provider: PaymentProvider.VENMO,
      eventId: testEventId,
      splitId: split.id,
      metadata: {}
    };
    
    const transaction = await transactionService.createTransaction(transactionData);
    
    // Process the payment
    const result = await transactionService.processPayment(transaction.id, paymentMethod.id);
    
    expect(result).toBeDefined();
    expect(result.status).toBe(TransactionStatus.PROCESSING);
    expect(result.providerTransactionId).toBeDefined();
  });
  
  it('should process a refund', async () => {
    // Create a split for the transaction
    const split = await createTestSplit(SplitType.EQUAL, 35.00, [testUserId]);
    
    // Create a payment method
    const paymentMethod = await createTestPaymentMethod(PaymentProvider.STRIPE);
    
    // Create a transaction
    const transactionData: ITransactionCreate = {
      type: TransactionType.SPLIT_PAYMENT,
      amount: 35.00,
      currency: 'USD',
      description: 'Test refund transaction',
      userId: testUserId,
      paymentMethodId: paymentMethod.id,
      provider: PaymentProvider.STRIPE,
      eventId: testEventId,
      splitId: split.id,
      metadata: {}
    };
    
    const transaction = await transactionService.createTransaction(transactionData);
    
    // Process the payment
    await transactionService.processPayment(transaction.id, paymentMethod.id);
    
    // Mark the transaction as completed (normally done by webhook in production)
    await transactionService.updateTransactionStatus(transaction.id, TransactionStatus.COMPLETED);
    
    // Process a refund
    const refundResult = await transactionService.processRefund(transaction.id, 'Customer requested refund');
    
    expect(refundResult).toBeDefined();
    expect(refundResult.type).toBe(TransactionType.REFUND);
    expect(refundResult.amount).toBe(35.00);
    expect(refundResult.refundedTransactionId).toBe(transaction.id);
    
    // Verify original transaction is marked as refunded
    const updatedTransaction = await transactionService.getTransactionById(transaction.id);
    expect(updatedTransaction).toBeDefined();
    expect(updatedTransaction.status).toBe(TransactionStatus.REFUNDED);
  });
});

// Payment Provider Integration Tests
describe('Payment Provider Integration Tests', () => {
  beforeAll(async () => {
    await setupTestData();
    mockStripeApi();
    mockVenmoApi();
  });
  
  afterAll(async () => {
    await cleanupTestData();
  });
  
  it('should get Stripe provider instance', () => {
    const provider = getPaymentProvider(PaymentProvider.STRIPE);
    
    expect(provider).toBeDefined();
    expect(provider instanceof StripeProvider).toBe(true);
  });
  
  it('should get Venmo provider instance', () => {
    const provider = getPaymentProvider(PaymentProvider.VENMO);
    
    expect(provider).toBeDefined();
    expect(provider instanceof VenmoProvider).toBe(true);
  });
  
  it('should create payment method with Stripe provider', async () => {
    const provider = getPaymentProvider(PaymentProvider.STRIPE);
    
    const cardDetails = {
      card: {
        number: '4242424242424242',
        expMonth: 12,
        expYear: 2025,
        cvc: '123'
      }
    };
    
    const result = await provider.createPaymentMethod(cardDetails);
    
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.last4).toBe('4242');
    expect(result.expiryMonth).toBe(12);
    expect(result.expiryYear).toBe(2025);
  });
  
  it('should create payment method with Venmo provider', async () => {
    const provider = getPaymentProvider(PaymentProvider.VENMO);
    
    const venmoDetails = {
      username: 'testuser',
      email: 'test@example.com',
      accessToken: 'venmo_access_token_123'
    };
    
    const result = await provider.createPaymentMethod(venmoDetails);
    
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.last4).toBe('user');  // Last 4 chars of 'testuser'
  });
  
  it('should process payment with Stripe provider', async () => {
    // Create a transaction
    const split = await createTestSplit(SplitType.EQUAL, 55.00, [testUserId]);
    
    const transaction = {
      id: faker.string.uuid(),
      type: TransactionType.SPLIT_PAYMENT,
      status: TransactionStatus.INITIATED,
      amount: 55.00,
      currency: 'USD',
      description: 'Test provider payment',
      userId: testUserId,
      paymentMethodId: faker.string.uuid(),
      provider: PaymentProvider.STRIPE,
      eventId: testEventId,
      splitId: split.id,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create a payment method
    const paymentMethod = {
      id: faker.string.uuid(),
      userId: testUserId,
      provider: PaymentProvider.STRIPE,
      type: 'CREDIT_CARD',
      token: 'pm_test_provider',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const provider = getPaymentProvider(PaymentProvider.STRIPE);
    
    const result = await provider.processPayment(transaction, paymentMethod);
    
    expect(result).toBeDefined();
    expect(result.status).toBe(TransactionStatus.PROCESSING);
    expect(result.providerTransactionId).toBeDefined();
    expect(result.metadata.clientSecret).toBeDefined();
  });
  
  it('should process payment with Venmo provider', async () => {
    // Create a transaction
    const split = await createTestSplit(SplitType.EQUAL, 45.00, [testUserId]);
    
    const transaction = {
      id: faker.string.uuid(),
      type: TransactionType.SPLIT_PAYMENT,
      status: TransactionStatus.INITIATED,
      amount: 45.00,
      currency: 'USD',
      description: 'Test provider payment',
      userId: testUserId,
      paymentMethodId: faker.string.uuid(),
      provider: PaymentProvider.VENMO,
      eventId: testEventId,
      splitId: split.id,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create a payment method with encoded token that Venmo provider expects
    const token = Buffer.from(JSON.stringify({
      venmoId: 'user123456',
      username: 'testuser',
      accessToken: 'venmo_token_123'
    })).toString('base64');
    
    const paymentMethod = {
      id: faker.string.uuid(),
      userId: testUserId,
      provider: PaymentProvider.VENMO,
      type: 'VENMO_BALANCE',
      token: token,
      last4: 'user',
      expiryMonth: null,
      expiryYear: null,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const provider = getPaymentProvider(PaymentProvider.VENMO);
    
    const result = await provider.processPayment(transaction, paymentMethod);
    
    expect(result).toBeDefined();
    expect(result.status).toBe(TransactionStatus.PROCESSING);
    expect(result.providerTransactionId).toBeDefined();
    expect(result.metadata.paymentUrl).toBeDefined();
  });
});

// End-to-End Payment Flow Tests
describe('End-to-End Payment Flow Tests', () => {
  beforeAll(async () => {
    await setupTestData();
    mockStripeApi();
    mockVenmoApi();
  });
  
  afterAll(async () => {
    await cleanupTestData();
  });
  
  it('should complete full payment flow with Stripe', async () => {
    // Create payment method
    const paymentMethod = await createTestPaymentMethod(PaymentProvider.STRIPE);
    
    // Create payment split
    const split = await createTestSplit(SplitType.EQUAL, 85.00, [testUserId]);
    
    // Process payment for user's share
    const result = await splitService.processSharePayment(split.id, testUserId, paymentMethod.id);
    
    expect(result).toBe(true);
    
    // Verify a transaction was created
    const transactions = await prisma.prisma.transaction.findMany({
      where: { splitId: split.id }
    });
    
    expect(transactions).toBeDefined();
    expect(transactions.length).toBe(1);
    
    // Update transaction to COMPLETED status (simulating webhook callback)
    await prisma.prisma.transaction.update({
      where: { id: transactions[0].id },
      data: { status: TransactionStatus.COMPLETED }
    });
    
    // Update share status
    await prisma.prisma.paymentShare.updateMany({
      where: { 
        splitId: split.id,
        userId: testUserId
      },
      data: { status: 'COMPLETED' }
    });
    
    // Update split status
    await splitService.updateSplitStatus(split.id);
    
    // Verify split status is updated
    const updatedSplit = await splitService.getSplitById(split.id);
    expect(updatedSplit).toBeDefined();
    expect(updatedSplit.status).toBe('COMPLETED');
  });
  
  it('should complete full payment flow with Venmo', async () => {
    // Create payment method
    const paymentMethod = await createTestPaymentMethod(PaymentProvider.VENMO);
    
    // Create payment split
    const split = await createTestSplit(SplitType.EQUAL, 65.00, [testUserId]);
    
    // Process payment for user's share
    const result = await splitService.processSharePayment(split.id, testUserId, paymentMethod.id);
    
    expect(result).toBe(true);
    
    // Verify a transaction was created
    const transactions = await prisma.prisma.transaction.findMany({
      where: { splitId: split.id }
    });
    
    expect(transactions).toBeDefined();
    expect(transactions.length).toBe(1);
    expect(transactions[0].status).toBe('PROCESSING');
    
    // Venmo payments remain in PROCESSING state until webhook confirmation
    const updatedSplit = await splitService.getSplitById(split.id);
    expect(updatedSplit).toBeDefined();
    expect(updatedSplit.status).toBe('PENDING'); // Still pending until payment completes
  });
  
  it('should handle payment failure gracefully', async () => {
    // Create payment method
    const paymentMethod = await createTestPaymentMethod(PaymentProvider.STRIPE);
    
    // Create payment split
    const split = await createTestSplit(SplitType.EQUAL, 95.00, [testUserId]);
    
    // Mock a failed payment by modifying the Stripe API mock
    nock.cleanAll();
    nock('https://api.stripe.com/v1')
      .post('/payment_methods')
      .reply(200, {
        id: 'pm_test_fail',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025
        }
      });
    
    nock('https://api.stripe.com/v1')
      .post('/payment_intents')
      .reply(400, {
        error: {
          code: 'card_declined',
          message: 'Your card has been declined.',
          type: 'card_error'
        }
      });
    
    // Process payment (should fail)
    try {
      await splitService.processSharePayment(split.id, testUserId, paymentMethod.id);
      // If we get here, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toContain('Payment processing failed');
    }
    
    // Verify split status remains unchanged
    const updatedSplit = await splitService.getSplitById(split.id);
    expect(updatedSplit).toBeDefined();
    expect(updatedSplit.status).toBe('PENDING');
    
    // Restore the Stripe API mock for other tests
    mockStripeApi();
  });
  
  it('should complete refund flow', async () => {
    // Create payment method
    const paymentMethod = await createTestPaymentMethod(PaymentProvider.STRIPE);
    
    // Create payment split
    const split = await createTestSplit(SplitType.EQUAL, 75.00, [testUserId]);
    
    // Process payment
    await splitService.processSharePayment(split.id, testUserId, paymentMethod.id);
    
    // Get the transaction
    const transactions = await prisma.prisma.transaction.findMany({
      where: { splitId: split.id }
    });
    expect(transactions).toBeDefined();
    expect(transactions.length).toBe(1);
    
    // Make sure the transaction is marked as completed
    await prisma.prisma.transaction.update({
      where: { id: transactions[0].id },
      data: { status: TransactionStatus.COMPLETED }
    });
    
    // Process refund
    const refundResult = await transactionService.processRefund(transactions[0].id, 'Customer requested refund');
    
    expect(refundResult).toBeDefined();
    expect(refundResult.type).toBe(TransactionType.REFUND);
    
    // Verify original transaction is marked as refunded
    const updatedTransaction = await transactionService.getTransactionById(transactions[0].id);
    expect(updatedTransaction).toBeDefined();
    expect(updatedTransaction.status).toBe(TransactionStatus.REFUNDED);
    
    // Verify refund transaction was created
    const refundTransactions = await prisma.prisma.transaction.findMany({
      where: { 
        type: TransactionType.REFUND,
        refundedTransactionId: transactions[0].id
      }
    });
    
    expect(refundTransactions).toBeDefined();
    expect(refundTransactions.length).toBe(1);
  });
});