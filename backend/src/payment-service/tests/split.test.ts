import { jest } from '@jest/globals';
import { faker } from '@faker-js/faker';
import { SplitService } from '../src/services/split.service';
import { TransactionService } from '../src/services/transaction.service';
import { PaymentSplit } from '../src/models/split.model';
import { 
  IPaymentSplitCreate, 
  IPaymentSplitResponse, 
  SplitType, 
  SplitStatus, 
  PaymentStatus 
} from '@shared/types/payment.types';
import { ValidationError } from '@shared/errors/validation.error';
import { DatabaseError } from '@shared/errors/database.error';
import prisma from '../../src/config/database';

/**
 * Generates mock data for creating a payment split
 * 
 * @param splitType Type of split (EQUAL, PERCENTAGE, CUSTOM)
 * @param participantCount Number of participants to include
 * @returns Mock payment split data
 */
function generateMockSplitData(splitType: SplitType = SplitType.EQUAL, participantCount: number = 4): IPaymentSplitCreate {
  const eventId = faker.string.uuid();
  const createdBy = faker.string.uuid();
  const totalAmount = parseFloat(faker.finance.amount(50, 500, 2));
  const participants = [];

  for (let i = 0; i < participantCount; i++) {
    const participant: { userId: string; amount?: number; percentage?: number } = {
      userId: faker.string.uuid()
    };

    // Set amount or percentage based on split type
    if (splitType === SplitType.PERCENTAGE) {
      // For PERCENTAGE, set a percentage that will sum to 100%
      const remainingParticipants = participantCount - i;
      const remainingPercentage = 100 - participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
      
      if (i === participantCount - 1) {
        // Last participant gets the remainder to ensure total is exactly 100%
        participant.percentage = remainingPercentage;
      } else {
        // Random percentage between 10% and (remainingPercentage / remainingParticipants * 2)
        const maxPercentage = Math.min(remainingPercentage - (remainingParticipants - 1) * 5, remainingPercentage / remainingParticipants * 2);
        participant.percentage = parseFloat(faker.number.float({ min: 10, max: maxPercentage, precision: 0.01 }).toFixed(2));
      }
    } else if (splitType === SplitType.CUSTOM) {
      // For CUSTOM, set an amount that will sum to the total amount
      const remainingParticipants = participantCount - i;
      const remainingAmount = totalAmount - participants.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      if (i === participantCount - 1) {
        // Last participant gets the remainder to ensure total is exactly the total amount
        participant.amount = parseFloat(remainingAmount.toFixed(2));
      } else {
        // Random amount between 5 and (remainingAmount / remainingParticipants * 2)
        const maxAmount = Math.min(remainingAmount - (remainingParticipants - 1) * 5, remainingAmount / remainingParticipants * 2);
        participant.amount = parseFloat(faker.number.float({ min: 5, max: maxAmount, precision: 0.01 }).toFixed(2));
      }
    }
    // For EQUAL, no need to set amount or percentage as it will be calculated by the service

    participants.push(participant);
  }

  return {
    eventId,
    createdBy,
    description: `Test split for ${faker.commerce.product()}`,
    totalAmount,
    currency: 'USD',
    splitType,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    participants,
    metadata: { test: true }
  };
}

/**
 * Sets up test data in the database for split tests
 * 
 * @returns Created test user IDs and event ID
 */
async function setupTestData() {
  const users = [];
  
  // Create 5 test users
  for (let i = 0; i < 5; i++) {
    const user = await prisma.prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        passwordHash: faker.internet.password()
      }
    });
    users.push(user.id);
  }
  
  // Create test event
  const event = await prisma.prisma.event.create({
    data: {
      name: "Test Event",
      description: "Test event for payment splits",
      ownerId: users[0],
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      location: faker.location.streetAddress(),
      status: "ACTIVE"
    }
  });
  
  return { users, eventId: event.id };
}

/**
 * Cleans up test data from the database after tests
 */
async function cleanupTestData() {
  // Delete all test data in the correct order to avoid foreign key constraints
  await prisma.prisma.paymentShare.deleteMany({ where: { splitId: { contains: 'test' } } });
  await prisma.prisma.paymentSplit.deleteMany({ where: { id: { contains: 'test' } } });
  await prisma.prisma.transaction.deleteMany({ where: { splitId: { contains: 'test' } } });
  await prisma.prisma.event.deleteMany({ where: { name: "Test Event" } });
  await prisma.prisma.user.deleteMany({ where: { email: { contains: 'faker.js' } } });
}

describe('SplitService', () => {
  let transactionService: TransactionService;
  let splitService: SplitService;
  let testData: { users: string[], eventId: string };

  beforeAll(async () => {
    // Setup services and test data
    transactionService = new TransactionService();
    splitService = new SplitService(transactionService);
    testData = await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
  });

  describe('createSplit', () => {
    it('should create a new equal split payment', async () => {
      // Arrange
      const mockData = generateMockSplitData(SplitType.EQUAL, 4);
      mockData.eventId = testData.eventId;
      mockData.createdBy = testData.users[0];
      mockData.participants = testData.users.slice(0, 4).map(userId => ({ userId }));

      // Act
      const result = await splitService.createSplit(mockData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.eventId).toBe(mockData.eventId);
      expect(result.description).toBe(mockData.description);
      expect(result.totalAmount).toBe(mockData.totalAmount);
      expect(result.currency).toBe(mockData.currency);
      expect(result.splitType).toBe(SplitType.EQUAL);
      expect(result.status).toBe(SplitStatus.PENDING);
      expect(result.shares).toHaveLength(4);
      
      // Verify all shares have equal amounts
      const expectedAmount = parseFloat((mockData.totalAmount / 4).toFixed(2));
      const sharesTotal = result.shares.reduce((sum, share) => sum + share.amount, 0);
      
      result.shares.forEach(share => {
        // Due to floating point precision, we may have a slight difference in the last share
        expect(Math.abs(share.amount - expectedAmount)).toBeLessThan(0.1);
        expect(share.status).toBe(PaymentStatus.PENDING);
      });
      
      // Verify the total of all shares equals the total amount
      expect(parseFloat(sharesTotal.toFixed(2))).toBe(parseFloat(mockData.totalAmount.toFixed(2)));
      
      // Verify split is saved in database
      const dbSplit = await prisma.prisma.paymentSplit.findUnique({
        where: { id: result.id },
        include: { shares: true }
      });
      
      expect(dbSplit).toBeDefined();
      expect(dbSplit!.id).toBe(result.id);
      expect(dbSplit!.shares).toHaveLength(4);
    });

    it('should create a new percentage-based split payment', async () => {
      // Arrange
      const mockData = generateMockSplitData(SplitType.PERCENTAGE, 3);
      mockData.eventId = testData.eventId;
      mockData.createdBy = testData.users[0];
      
      // Set explicit percentages that sum to 100
      mockData.participants = [
        { userId: testData.users[0], percentage: 50 },
        { userId: testData.users[1], percentage: 30 },
        { userId: testData.users[2], percentage: 20 }
      ];

      // Act
      const result = await splitService.createSplit(mockData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.splitType).toBe(SplitType.PERCENTAGE);
      expect(result.shares).toHaveLength(3);
      
      // Verify shares are calculated correctly based on percentages
      expect(result.shares[0].amount).toBe(mockData.totalAmount * 0.5);
      expect(result.shares[1].amount).toBe(mockData.totalAmount * 0.3);
      expect(result.shares[2].amount).toBe(mockData.totalAmount * 0.2);
      
      // Verify the total of all shares equals the total amount
      const sharesTotal = result.shares.reduce((sum, share) => sum + share.amount, 0);
      expect(parseFloat(sharesTotal.toFixed(2))).toBe(parseFloat(mockData.totalAmount.toFixed(2)));
    });

    it('should create a new custom split payment', async () => {
      // Arrange
      const mockData = generateMockSplitData(SplitType.CUSTOM, 3);
      mockData.eventId = testData.eventId;
      mockData.createdBy = testData.users[0];
      
      // Set explicit amounts that sum to the total
      const amount1 = parseFloat((mockData.totalAmount * 0.4).toFixed(2));
      const amount2 = parseFloat((mockData.totalAmount * 0.35).toFixed(2));
      const amount3 = parseFloat((mockData.totalAmount - amount1 - amount2).toFixed(2));
      
      mockData.participants = [
        { userId: testData.users[0], amount: amount1 },
        { userId: testData.users[1], amount: amount2 },
        { userId: testData.users[2], amount: amount3 }
      ];

      // Act
      const result = await splitService.createSplit(mockData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.splitType).toBe(SplitType.CUSTOM);
      expect(result.shares).toHaveLength(3);
      
      // Verify shares have the custom amounts
      expect(result.shares[0].amount).toBe(amount1);
      expect(result.shares[1].amount).toBe(amount2);
      expect(result.shares[2].amount).toBe(amount3);
      
      // Verify the total of all shares equals the total amount
      const sharesTotal = result.shares.reduce((sum, share) => sum + share.amount, 0);
      expect(parseFloat(sharesTotal.toFixed(2))).toBe(parseFloat(mockData.totalAmount.toFixed(2)));
    });

    it('should throw validation error for invalid split data', async () => {
      // Arrange - try with negative amount
      const invalidData = generateMockSplitData(SplitType.EQUAL, 3);
      invalidData.totalAmount = -100;

      // Act & Assert
      await expect(splitService.createSplit(invalidData))
        .rejects.toThrow(ValidationError);

      // Arrange - try with missing required field
      const missingFieldData = generateMockSplitData(SplitType.EQUAL, 3);
      delete missingFieldData.eventId;

      // Act & Assert
      await expect(splitService.createSplit(missingFieldData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getSplitById', () => {
    let testSplitId: string;

    beforeAll(async () => {
      // Create a test split to retrieve
      const mockData = generateMockSplitData(SplitType.EQUAL, 3);
      mockData.eventId = testData.eventId;
      mockData.createdBy = testData.users[0];
      mockData.participants = testData.users.slice(0, 3).map(userId => ({ userId }));
      
      const result = await splitService.createSplit(mockData);
      testSplitId = result.id;
    });

    it('should retrieve a split by ID', async () => {
      // Act
      const split = await splitService.getSplitById(testSplitId);

      // Assert
      expect(split).toBeDefined();
      expect(split!.id).toBe(testSplitId);
      expect(split!.shares).toHaveLength(3);
      expect(split).toBeInstanceOf(PaymentSplit);
    });

    it('should return null for non-existent split ID', async () => {
      // Act
      const split = await splitService.getSplitById(faker.string.uuid());

      // Assert
      expect(split).toBeNull();
    });
  });

  describe('getSplitsByEvent', () => {
    beforeAll(async () => {
      // Create multiple test splits for the same event
      for (let i = 0; i < 3; i++) {
        const mockData = generateMockSplitData(SplitType.EQUAL, 2);
        mockData.eventId = testData.eventId;
        mockData.createdBy = testData.users[0];
        mockData.participants = testData.users.slice(0, 2).map(userId => ({ userId }));
        await splitService.createSplit(mockData);
      }
    });

    it('should retrieve all splits for an event', async () => {
      // Act
      const splits = await splitService.getSplitsByEvent(testData.eventId);

      // Assert
      expect(splits).toBeDefined();
      expect(splits.length).toBeGreaterThanOrEqual(3);
      splits.forEach(split => {
        expect(split.eventId).toBe(testData.eventId);
      });
    });

    it('should return empty array for event with no splits', async () => {
      // Act
      const splits = await splitService.getSplitsByEvent(faker.string.uuid());

      // Assert
      expect(splits).toEqual([]);
    });
  });

  describe('getSplitsByUser', () => {
    beforeAll(async () => {
      // Create multiple test splits with a specific user as participant
      const testUserId = testData.users[1];
      
      for (let i = 0; i < 2; i++) {
        const mockData = generateMockSplitData(SplitType.EQUAL, 2);
        mockData.eventId = testData.eventId;
        mockData.createdBy = testData.users[0];
        mockData.participants = [
          { userId: testUserId },
          { userId: testData.users[2] }
        ];
        await splitService.createSplit(mockData);
      }
    });

    it('should retrieve all splits for a user', async () => {
      // Act
      const splits = await splitService.getSplitsByUser(testData.users[1]);

      // Assert
      expect(splits).toBeDefined();
      expect(splits.length).toBeGreaterThanOrEqual(2);
      
      splits.forEach(split => {
        const userInSplit = split.shares.some(share => share.userId === testData.users[1]);
        expect(userInSplit).toBe(true);
      });
    });

    it('should return empty array for user with no splits', async () => {
      // Act
      const splits = await splitService.getSplitsByUser(faker.string.uuid());

      // Assert
      expect(splits).toEqual([]);
    });
  });

  describe('updateSplitStatus', () => {
    let testSplitId: string;

    beforeEach(async () => {
      // Create a new test split for each test
      const mockData = generateMockSplitData(SplitType.EQUAL, 4);
      mockData.eventId = testData.eventId;
      mockData.createdBy = testData.users[0];
      mockData.participants = testData.users.slice(0, 4).map(userId => ({ userId }));
      
      const result = await splitService.createSplit(mockData);
      testSplitId = result.id;
    });

    it('should update split status to PARTIAL when some shares are completed', async () => {
      // Arrange - update one share to COMPLETED
      await prisma.prisma.paymentShare.update({
        where: {
          id: (await prisma.prisma.paymentShare.findFirst({ 
            where: { splitId: testSplitId } 
          }))!.id
        },
        data: { status: PaymentStatus.COMPLETED }
      });

      // Act
      const status = await splitService.updateSplitStatus(testSplitId);

      // Assert
      expect(status).toBe(SplitStatus.PARTIAL);
      
      // Verify the split status in the database
      const dbSplit = await prisma.prisma.paymentSplit.findUnique({
        where: { id: testSplitId }
      });
      expect(dbSplit!.status).toBe(SplitStatus.PARTIAL);
    });

    it('should update split status to COMPLETED when all shares are completed', async () => {
      // Arrange - update all shares to COMPLETED
      await prisma.prisma.paymentShare.updateMany({
        where: { splitId: testSplitId },
        data: { status: PaymentStatus.COMPLETED }
      });

      // Act
      const status = await splitService.updateSplitStatus(testSplitId);

      // Assert
      expect(status).toBe(SplitStatus.COMPLETED);
      
      // Verify the split status in the database
      const dbSplit = await prisma.prisma.paymentSplit.findUnique({
        where: { id: testSplitId }
      });
      expect(dbSplit!.status).toBe(SplitStatus.COMPLETED);
    });

    it('should throw error when updating status for non-existent split', async () => {
      // Act & Assert
      await expect(splitService.updateSplitStatus(faker.string.uuid()))
        .rejects.toThrow(DatabaseError);
    });
  });

  describe('processSharePayment', () => {
    let testSplitId: string;
    let testUserId: string;

    beforeEach(async () => {
      // Create a new test split
      const mockData = generateMockSplitData(SplitType.EQUAL, 3);
      mockData.eventId = testData.eventId;
      mockData.createdBy = testData.users[0];
      testUserId = testData.users[1];
      mockData.participants = [
        { userId: testData.users[0] },
        { userId: testUserId },
        { userId: testData.users[2] }
      ];
      
      const result = await splitService.createSplit(mockData);
      testSplitId = result.id;
      
      // Mock the transaction service processPayment method
      jest.spyOn(transactionService, 'processPayment').mockResolvedValue({
        status: 'COMPLETED',
        id: faker.string.uuid(),
        toJSON: () => ({ status: 'COMPLETED' })
      } as any);
    });

    it('should process a share payment successfully', async () => {
      // Arrange
      const paymentMethodId = faker.string.uuid();

      // Act
      const result = await splitService.processSharePayment(testSplitId, testUserId, paymentMethodId);

      // Assert
      expect(result).toBe(true);
      
      // Verify the share status is updated
      const dbShare = await prisma.prisma.paymentShare.findFirst({
        where: { 
          splitId: testSplitId,
          userId: testUserId
        }
      });
      expect(dbShare!.status).toBe(PaymentStatus.COMPLETED);
      
      // Verify the transaction service was called
      expect(transactionService.processPayment).toHaveBeenCalled();
    });

    it('should throw error when processing payment for non-existent split', async () => {
      // Act & Assert
      await expect(splitService.processSharePayment(
        faker.string.uuid(), 
        testUserId, 
        faker.string.uuid()
      )).rejects.toThrow(DatabaseError);
    });

    it('should throw error when processing payment for non-existent share', async () => {
      // Act & Assert
      await expect(splitService.processSharePayment(
        testSplitId, 
        faker.string.uuid(), 
        faker.string.uuid()
      )).rejects.toThrow(ValidationError);
    });
  });

  describe('cancelSplit', () => {
    let testSplitId: string;

    beforeEach(async () => {
      // Create a new test split
      const mockData = generateMockSplitData(SplitType.EQUAL, 3);
      mockData.eventId = testData.eventId;
      mockData.createdBy = testData.users[0];
      mockData.participants = testData.users.slice(0, 3).map(userId => ({ userId }));
      
      const result = await splitService.createSplit(mockData);
      testSplitId = result.id;
    });

    it('should cancel a split successfully', async () => {
      // Act
      const result = await splitService.cancelSplit(testSplitId);

      // Assert
      expect(result).toBe(true);
      
      // Verify the split status in the database
      const dbSplit = await prisma.prisma.paymentSplit.findUnique({
        where: { id: testSplitId }
      });
      expect(dbSplit!.status).toBe(SplitStatus.CANCELLED);
      
      // Verify pending shares are updated to FAILED
      const dbShares = await prisma.prisma.paymentShare.findMany({
        where: { splitId: testSplitId }
      });
      dbShares.forEach(share => {
        expect(share.status).toBe(PaymentStatus.FAILED);
      });
    });

    it('should throw error when cancelling non-existent split', async () => {
      // Act & Assert
      await expect(splitService.cancelSplit(faker.string.uuid()))
        .rejects.toThrow(DatabaseError);
    });

    it('should throw error when cancelling completed split', async () => {
      // Arrange - update all shares to COMPLETED
      await prisma.prisma.paymentShare.updateMany({
        where: { splitId: testSplitId },
        data: { status: PaymentStatus.COMPLETED }
      });
      
      // Update split status to COMPLETED
      await prisma.prisma.paymentSplit.update({
        where: { id: testSplitId },
        data: { status: SplitStatus.COMPLETED }
      });

      // Act & Assert
      await expect(splitService.cancelSplit(testSplitId))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getSplitStatistics', () => {
    beforeAll(async () => {
      // Create splits with various statuses for an event
      const mockBaseData = {
        eventId: testData.eventId,
        createdBy: testData.users[0],
        participants: testData.users.slice(0, 3).map(userId => ({ userId }))
      };
      
      // Create a PENDING split
      const pendingSplit = generateMockSplitData(SplitType.EQUAL, 3);
      Object.assign(pendingSplit, mockBaseData);
      await splitService.createSplit(pendingSplit);
      
      // Create a PARTIAL split
      const partialSplit = generateMockSplitData(SplitType.EQUAL, 3);
      Object.assign(partialSplit, mockBaseData);
      const partialResult = await splitService.createSplit(partialSplit);
      
      // Update one share to COMPLETED
      await prisma.prisma.paymentShare.update({
        where: {
          id: (await prisma.prisma.paymentShare.findFirst({ 
            where: { splitId: partialResult.id } 
          }))!.id
        },
        data: { status: PaymentStatus.COMPLETED }
      });
      await splitService.updateSplitStatus(partialResult.id);
      
      // Create a COMPLETED split
      const completedSplit = generateMockSplitData(SplitType.EQUAL, 3);
      Object.assign(completedSplit, mockBaseData);
      const completedResult = await splitService.createSplit(completedSplit);
      
      // Update all shares to COMPLETED
      await prisma.prisma.paymentShare.updateMany({
        where: { splitId: completedResult.id },
        data: { status: PaymentStatus.COMPLETED }
      });
      await splitService.updateSplitStatus(completedResult.id);
    });

    it('should get split statistics for an event', async () => {
      // Act
      const stats = await splitService.getSplitStatistics(testData.eventId, 'event');

      // Assert
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalSplits');
      expect(stats).toHaveProperty('totalAmount');
      expect(stats).toHaveProperty('paidAmount');
      expect(stats).toHaveProperty('pendingAmount');
      expect(stats).toHaveProperty('splitsByStatus');
      expect(stats).toHaveProperty('averageSplitAmount');
      
      // Verify we have PENDING, PARTIAL, and COMPLETED splits
      const splitsByStatus = stats['splitsByStatus'] as Record<string, number>;
      expect(Object.keys(splitsByStatus)).toContain(SplitStatus.PENDING);
      expect(Object.keys(splitsByStatus)).toContain(SplitStatus.PARTIAL);
      expect(Object.keys(splitsByStatus)).toContain(SplitStatus.COMPLETED);
    });

    it('should get split statistics for a user', async () => {
      // Act
      const stats = await splitService.getSplitStatistics(testData.users[1], 'user');

      // Assert
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalSplits');
      expect(stats).toHaveProperty('totalAmount');
      expect(stats).toHaveProperty('paidAmount');
      expect(stats).toHaveProperty('pendingAmount');
      expect(stats).toHaveProperty('splitsByStatus');
      expect(stats).toHaveProperty('averageSplitAmount');
    });

    it('should throw error for invalid statistic type', async () => {
      // Act & Assert
      await expect(splitService.getSplitStatistics(testData.eventId, 'invalid'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('remindPendingPayments', () => {
    let testSplitId: string;

    beforeEach(async () => {
      // Create a new test split with pending shares
      const mockData = generateMockSplitData(SplitType.EQUAL, 3);
      mockData.eventId = testData.eventId;
      mockData.createdBy = testData.users[0];
      mockData.participants = testData.users.slice(0, 3).map(userId => ({ userId }));
      
      const result = await splitService.createSplit(mockData);
      testSplitId = result.id;
    });

    it('should send reminders for pending payments', async () => {
      // Act
      const result = await splitService.remindPendingPayments(testSplitId);

      // Assert
      expect(result).toBe(true);
      
      // Verify the split metadata is updated with reminder information
      const dbSplit = await prisma.prisma.paymentSplit.findUnique({
        where: { id: testSplitId }
      });
      
      expect(dbSplit!.metadata).toHaveProperty('reminders');
      expect(Array.isArray(dbSplit!.metadata.reminders)).toBe(true);
      expect(dbSplit!.metadata.reminders.length).toBe(1);
      expect(dbSplit!.metadata.reminders[0]).toHaveProperty('timestamp');
      expect(dbSplit!.metadata.reminders[0]).toHaveProperty('userCount', 3);
    });

    it('should throw error for non-existent split', async () => {
      // Act & Assert
      await expect(splitService.remindPendingPayments(faker.string.uuid()))
        .rejects.toThrow(DatabaseError);
    });
  });

  describe('getSplitSummary', () => {
    let testSplitId: string;

    beforeEach(async () => {
      // Create a new test split
      const mockData = generateMockSplitData(SplitType.EQUAL, 3);
      mockData.eventId = testData.eventId;
      mockData.createdBy = testData.users[0];
      mockData.participants = testData.users.slice(0, 3).map(userId => ({ userId }));
      
      const result = await splitService.createSplit(mockData);
      testSplitId = result.id;
      
      // Process one payment
      jest.spyOn(transactionService, 'processPayment').mockResolvedValue({
        status: 'COMPLETED',
        id: faker.string.uuid(),
        toJSON: () => ({ status: 'COMPLETED' })
      } as any);
      
      jest.spyOn(transactionService, 'getTransactionsBySplit').mockResolvedValue([
        {
          id: faker.string.uuid(),
          amount: mockData.totalAmount / 3,
          status: 'COMPLETED',
          createdAt: new Date(),
          metadata: {
            shareId: (await prisma.prisma.paymentShare.findFirst({
              where: { splitId: testSplitId }
            }))!.id
          }
        } as any
      ]);
      
      await splitService.processSharePayment(testSplitId, testData.users[0], faker.string.uuid());
    });

    it('should get detailed split summary', async () => {
      // Act
      const summary = await splitService.getSplitSummary(testSplitId) as any;

      // Assert
      expect(summary).toBeDefined();
      expect(summary.id).toBe(testSplitId);
      expect(summary.shares).toHaveLength(3);
      expect(summary.paymentStatus).toBeDefined();
      expect(summary.paymentStatus.paidSharesCount).toBe(1);
      expect(summary.paymentStatus.totalSharesCount).toBe(3);
      
      // Verify each share has user information
      summary.shares.forEach(share => {
        expect(share.user).toBeDefined();
        expect(share.user.userId).toBe(share.userId);
      });
      
      // Verify the share that was paid has transactions
      const paidShare = summary.shares.find(s => s.status === PaymentStatus.COMPLETED);
      expect(paidShare).toBeDefined();
      expect(paidShare.transactions).toHaveLength(1);
    });

    it('should throw error for non-existent split', async () => {
      // Act & Assert
      await expect(splitService.getSplitSummary(faker.string.uuid()))
        .rejects.toThrow(DatabaseError);
    });
  });
});

describe('PaymentSplit Model', () => {
  describe('calculateShares', () => {
    it('should calculate equal shares correctly', () => {
      // Arrange
      const splitData: IPaymentSplitCreate = {
        eventId: faker.string.uuid(),
        createdBy: faker.string.uuid(),
        description: 'Test equal split',
        totalAmount: 100,
        currency: 'USD',
        splitType: SplitType.EQUAL,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        participants: [
          { userId: faker.string.uuid() },
          { userId: faker.string.uuid() },
          { userId: faker.string.uuid() },
          { userId: faker.string.uuid() }
        ],
        metadata: {}
      };
      
      const paymentSplit = new PaymentSplit(splitData);
      
      // Act
      const shares = paymentSplit.calculateShares(splitData.participants);
      
      // Assert
      expect(shares).toHaveLength(4);
      
      const expectedAmount = 25; // $100 / 4 participants
      shares.forEach(share => {
        expect(share.amount).toBe(expectedAmount);
        expect(share.status).toBe(PaymentStatus.PENDING);
      });
      
      // Verify total equals original amount
      const total = shares.reduce((sum, share) => sum + share.amount, 0);
      expect(total).toBe(splitData.totalAmount);
    });

    it('should calculate percentage-based shares correctly', () => {
      // Arrange
      const splitData: IPaymentSplitCreate = {
        eventId: faker.string.uuid(),
        createdBy: faker.string.uuid(),
        description: 'Test percentage split',
        totalAmount: 100,
        currency: 'USD',
        splitType: SplitType.PERCENTAGE,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        participants: [
          { userId: faker.string.uuid(), percentage: 40 },
          { userId: faker.string.uuid(), percentage: 35 },
          { userId: faker.string.uuid(), percentage: 25 }
        ],
        metadata: {}
      };
      
      const paymentSplit = new PaymentSplit(splitData);
      
      // Act
      const shares = paymentSplit.calculateShares(splitData.participants);
      
      // Assert
      expect(shares).toHaveLength(3);
      expect(shares[0].amount).toBe(40);
      expect(shares[1].amount).toBe(35);
      expect(shares[2].amount).toBe(25);
      
      // Verify total equals original amount
      const total = shares.reduce((sum, share) => sum + share.amount, 0);
      expect(total).toBe(splitData.totalAmount);
    });

    it('should calculate custom shares correctly', () => {
      // Arrange
      const splitData: IPaymentSplitCreate = {
        eventId: faker.string.uuid(),
        createdBy: faker.string.uuid(),
        description: 'Test custom split',
        totalAmount: 100,
        currency: 'USD',
        splitType: SplitType.CUSTOM,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        participants: [
          { userId: faker.string.uuid(), amount: 30 },
          { userId: faker.string.uuid(), amount: 45 },
          { userId: faker.string.uuid(), amount: 25 }
        ],
        metadata: {}
      };
      
      const paymentSplit = new PaymentSplit(splitData);
      
      // Act
      const shares = paymentSplit.calculateShares(splitData.participants);
      
      // Assert
      expect(shares).toHaveLength(3);
      expect(shares[0].amount).toBe(30);
      expect(shares[1].amount).toBe(45);
      expect(shares[2].amount).toBe(25);
      
      // Verify total equals original amount
      const total = shares.reduce((sum, share) => sum + share.amount, 0);
      expect(total).toBe(splitData.totalAmount);
    });

    it("should throw error when percentages don't sum to 100", () => {
      // Arrange
      const splitData: IPaymentSplitCreate = {
        eventId: faker.string.uuid(),
        createdBy: faker.string.uuid(),
        description: 'Test invalid percentage split',
        totalAmount: 100,
        currency: 'USD',
        splitType: SplitType.PERCENTAGE,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        participants: [
          { userId: faker.string.uuid(), percentage: 40 },
          { userId: faker.string.uuid(), percentage: 30 },
          { userId: faker.string.uuid(), percentage: 20 }
          // Total is 90%, not 100%
        ],
        metadata: {}
      };
      
      const paymentSplit = new PaymentSplit(splitData);
      
      // Act & Assert
      expect(() => paymentSplit.calculateShares(splitData.participants))
        .toThrow(ValidationError);
    });

    it("should throw error when custom amounts don't sum to total", () => {
      // Arrange
      const splitData: IPaymentSplitCreate = {
        eventId: faker.string.uuid(),
        createdBy: faker.string.uuid(),
        description: 'Test invalid custom split',
        totalAmount: 100,
        currency: 'USD',
        splitType: SplitType.CUSTOM,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        participants: [
          { userId: faker.string.uuid(), amount: 30 },
          { userId: faker.string.uuid(), amount: 40 },
          { userId: faker.string.uuid(), amount: 20 }
          // Total is 90, not 100
        ],
        metadata: {}
      };
      
      const paymentSplit = new PaymentSplit(splitData);
      
      // Act & Assert
      expect(() => paymentSplit.calculateShares(splitData.participants))
        .toThrow(ValidationError);
    });
  });

  describe('updateStatus', () => {
    it('should update status correctly based on share statuses', () => {
      // Arrange - all shares pending
      const splitData = generateMockSplitData(SplitType.EQUAL, 3);
      const paymentSplit = new PaymentSplit(splitData);
      paymentSplit.calculateShares(splitData.participants);
      
      // Act & Assert - Initially all PENDING
      expect(paymentSplit.updateStatus()).toBe(SplitStatus.PENDING);
      
      // Arrange - some shares completed
      paymentSplit.shares[0].status = PaymentStatus.COMPLETED;
      
      // Act & Assert - Should be PARTIAL
      expect(paymentSplit.updateStatus()).toBe(SplitStatus.PARTIAL);
      
      // Arrange - all shares completed
      paymentSplit.shares.forEach(share => share.status = PaymentStatus.COMPLETED);
      
      // Act & Assert - Should be COMPLETED
      expect(paymentSplit.updateStatus()).toBe(SplitStatus.COMPLETED);
    });

    it('should maintain CANCELLED status', () => {
      // Arrange
      const splitData = generateMockSplitData(SplitType.EQUAL, 3);
      const paymentSplit = new PaymentSplit(splitData);
      paymentSplit.calculateShares(splitData.participants);
      
      // Set status to CANCELLED
      paymentSplit.status = SplitStatus.CANCELLED;
      
      // Act & Assert - Should remain CANCELLED regardless of shares
      expect(paymentSplit.updateStatus()).toBe(SplitStatus.CANCELLED);
      
      // Change some share statuses
      paymentSplit.shares[0].status = PaymentStatus.COMPLETED;
      
      // Act & Assert - Should still remain CANCELLED
      expect(paymentSplit.updateStatus()).toBe(SplitStatus.CANCELLED);
    });
  });
});