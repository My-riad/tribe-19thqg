import mongoose from 'mongoose';
import sinon from 'sinon';
import axios from 'axios';
import { MongoMemoryServer } from 'mongodb-memory-server';

import ChallengeService from '../src/services/challenge.service';
import { 
  Challenge, 
  IChallengeDocument, 
  IChallengeCreate, 
  IChallengeUpdate, 
  IChallengeResponse, 
  IChallengeParticipation, 
  ChallengeType, 
  ChallengeStatus 
} from '../src/models/challenge.model';
import { challengePrompts } from '../src/prompts/challenge.prompts';
import { ApiError } from '../../../shared/src/errors/api.error';

let mongoServer: MongoMemoryServer;

/**
 * Sets up the in-memory MongoDB database for testing
 */
async function setupDatabase(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

/**
 * Tears down the database connection after tests
 */
async function teardownDatabase(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
}

/**
 * Creates a mock challenge for testing
 */
function createMockChallenge(overrides: Partial<IChallengeCreate> = {}): IChallengeCreate {
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 7); // End date is a week from now
  
  return {
    tribeId: '60d21b4667d0d8992e610c85',
    title: 'Test Challenge',
    description: 'This is a test challenge',
    type: ChallengeType.PHOTO,
    status: ChallengeStatus.PENDING,
    startDate: today,
    endDate: endDate,
    createdBy: 'test-user-id',
    pointValue: 10,
    aiGenerated: false,
    metadata: {},
    ...overrides
  };
}

/**
 * Creates a test challenge in the database
 */
async function createTestChallenge(overrides: Partial<IChallengeCreate> = {}): Promise<IChallengeDocument> {
  const challengeData = createMockChallenge(overrides);
  const challenge = new Challenge(challengeData);
  return await challenge.save();
}

/**
 * Mocks the AI orchestration service for testing AI-generated challenges
 */
function mockAIOrchestrationService(responseContent: object): sinon.SinonStub {
  const stub = sinon.stub(axios, 'post');
  stub.resolves({
    data: {
      result: responseContent,
      model: 'test-model',
      usage: {
        promptTokens: 100,
        completionTokens: 150
      }
    }
  });
  return stub;
}

describe('Challenge Service', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await Challenge.deleteMany({});
  });

  afterEach(() => {
    // Restore all mocks after each test
    sinon.restore();
  });

  describe('createChallenge', () => {
    it('should create a new challenge', async () => {
      const challengeData = createMockChallenge();
      
      const result = await ChallengeService.createChallenge(challengeData);
      
      // Verify returned challenge
      expect(result).toBeDefined();
      expect(result.title).toBe(challengeData.title);
      expect(result.description).toBe(challengeData.description);
      expect(result.type).toBe(challengeData.type);
      expect(result.status).toBe(challengeData.status);
      
      // Verify challenge was saved to database
      const savedChallenge = await Challenge.findById(result.id);
      expect(savedChallenge).toBeDefined();
      expect(savedChallenge?.title).toBe(challengeData.title);
    });
  });

  describe('getChallenge', () => {
    it('should retrieve a challenge by ID', async () => {
      const testChallenge = await createTestChallenge();
      
      const result = await ChallengeService.getChallenge(testChallenge._id.toString());
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testChallenge._id.toString());
      expect(result.title).toBe(testChallenge.title);
    });

    it('should retrieve a challenge with user participation data', async () => {
      const userId = 'test-user-123';
      
      // Create a challenge with the user as a participant
      const testChallenge = await createTestChallenge();
      testChallenge.participants = [userId];
      testChallenge.completedBy = [{
        userId,
        completedAt: new Date(),
        evidence: 'Test evidence'
      }];
      await testChallenge.save();
      
      const result = await ChallengeService.getChallenge(testChallenge._id.toString(), userId);
      
      expect(result).toBeDefined();
      expect(result.userParticipation).toBeDefined();
      expect(result.userParticipation.isParticipating).toBe(true);
      expect(result.userParticipation.hasCompleted).toBe(true);
      expect(result.userParticipation.evidence).toBe('Test evidence');
    });

    it('should throw an error for non-existent challenge ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(ChallengeService.getChallenge(nonExistentId))
        .rejects.toThrow('Challenge not found');
    });
  });

  describe('updateChallenge', () => {
    it('should update an existing challenge', async () => {
      const testChallenge = await createTestChallenge();
      
      const updateData: IChallengeUpdate = {
        title: 'Updated Title',
        description: 'Updated Description',
        status: ChallengeStatus.ACTIVE
      };
      
      const result = await ChallengeService.updateChallenge(
        testChallenge._id.toString(),
        updateData
      );
      
      expect(result).toBeDefined();
      expect(result.title).toBe(updateData.title);
      expect(result.description).toBe(updateData.description);
      expect(result.status).toBe(updateData.status);
      
      // Verify challenge was updated in database
      const updatedChallenge = await Challenge.findById(testChallenge._id);
      expect(updatedChallenge?.title).toBe(updateData.title);
    });

    it('should throw an error for non-existent challenge ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const updateData: IChallengeUpdate = { title: 'Test Update' };
      
      await expect(ChallengeService.updateChallenge(nonExistentId, updateData))
        .rejects.toThrow('Challenge not found');
    });
  });

  describe('deleteChallenge', () => {
    it('should delete a challenge by ID', async () => {
      const testChallenge = await createTestChallenge();
      
      await ChallengeService.deleteChallenge(testChallenge._id.toString());
      
      // Verify challenge was removed from database
      const deletedChallenge = await Challenge.findById(testChallenge._id);
      expect(deletedChallenge).toBeNull();
    });
  });

  describe('listChallenges', () => {
    it('should list challenges with filtering', async () => {
      // Create multiple test challenges with different properties
      await createTestChallenge({
        tribeId: 'tribe-1',
        type: ChallengeType.PHOTO,
        status: ChallengeStatus.ACTIVE
      });
      
      await createTestChallenge({
        tribeId: 'tribe-1',
        type: ChallengeType.CREATIVE,
        status: ChallengeStatus.PENDING
      });
      
      await createTestChallenge({
        tribeId: 'tribe-2',
        type: ChallengeType.PHOTO,
        status: ChallengeStatus.ACTIVE
      });
      
      // Test filtering by tribeId
      const result1 = await ChallengeService.listChallenges(
        { tribeId: 'tribe-1' },
        { page: 1, limit: 10 }
      );
      
      expect(result1.challenges.length).toBe(2);
      expect(result1.total).toBe(2);
      
      // Test filtering by tribeId and type
      const result2 = await ChallengeService.listChallenges(
        { tribeId: 'tribe-1', type: ChallengeType.PHOTO },
        { page: 1, limit: 10 }
      );
      
      expect(result2.challenges.length).toBe(1);
      expect(result2.total).toBe(1);
      
      // Test filtering by status
      const result3 = await ChallengeService.listChallenges(
        { status: ChallengeStatus.ACTIVE },
        { page: 1, limit: 10 }
      );
      
      expect(result3.challenges.length).toBe(2);
      expect(result3.total).toBe(2);
    });
  });

  describe('participateInChallenge', () => {
    it('should add a user as a participant in a challenge', async () => {
      const testChallenge = await createTestChallenge();
      const userId = 'test-user-123';
      
      const result = await ChallengeService.participateInChallenge(
        testChallenge._id.toString(),
        userId
      );
      
      expect(result).toBeDefined();
      expect(result.userParticipation.isParticipating).toBe(true);
      
      // Verify challenge was updated in database
      const updatedChallenge = await Challenge.findById(testChallenge._id);
      expect(updatedChallenge?.participants).toContain(userId);
    });

    it('should not add a user who is already participating', async () => {
      const userId = 'test-user-123';
      const testChallenge = await Challenge.create({
        ...createMockChallenge(),
        participants: [userId]
      });
      
      const result = await ChallengeService.participateInChallenge(
        testChallenge._id.toString(),
        userId
      );
      
      expect(result).toBeDefined();
      expect(result.userParticipation.isParticipating).toBe(true);
      
      // Verify participants list didn't change
      const updatedChallenge = await Challenge.findById(testChallenge._id);
      expect(updatedChallenge?.participants.length).toBe(1);
    });

    it('should throw an error for completed challenge', async () => {
      const testChallenge = await createTestChallenge({
        status: ChallengeStatus.COMPLETED
      });
      const userId = 'test-user-123';
      
      await expect(ChallengeService.participateInChallenge(
        testChallenge._id.toString(),
        userId
      )).rejects.toThrow('Cannot participate in a completed or cancelled challenge');
    });
  });

  describe('completeChallenge', () => {
    it('should mark a challenge as completed by a user', async () => {
      const userId = 'test-user-123';
      const testChallenge = await Challenge.create({
        ...createMockChallenge(),
        participants: [userId]
      });
      
      const completionData = {
        evidence: 'Test evidence'
      };
      
      const result = await ChallengeService.completeChallenge(
        testChallenge._id.toString(),
        userId,
        completionData
      );
      
      expect(result).toBeDefined();
      expect(result.userParticipation.hasCompleted).toBe(true);
      expect(result.userParticipation.evidence).toBe(completionData.evidence);
      
      // Verify challenge was updated in database
      const updatedChallenge = await Challenge.findById(testChallenge._id);
      const completedRecord = updatedChallenge?.completedBy.find(c => c.userId === userId);
      expect(completedRecord).toBeDefined();
      expect(completedRecord?.evidence).toBe(completionData.evidence);
    });

    it('should throw an error for non-participant user', async () => {
      const testChallenge = await createTestChallenge();
      const userId = 'non-participant-user';
      
      await expect(ChallengeService.completeChallenge(
        testChallenge._id.toString(),
        userId
      )).rejects.toThrow('User is not a participant in this challenge');
    });

    it('should throw an error for already completed user', async () => {
      const userId = 'test-user-123';
      const testChallenge = await Challenge.create({
        ...createMockChallenge(),
        participants: [userId],
        completedBy: [{
          userId,
          completedAt: new Date(),
          evidence: 'Already completed'
        }]
      });
      
      await expect(ChallengeService.completeChallenge(
        testChallenge._id.toString(),
        userId
      )).rejects.toThrow();
    });
  });

  describe('generateChallenge with template', () => {
    it('should generate a template-based challenge', async () => {
      // Mock Math.random to ensure we get template-based generation (not AI)
      const randomStub = sinon.stub(Math, 'random').returns(0.8); // 0.8 > 0.7 => template-based
      
      const tribeId = 'test-tribe-id';
      const type = ChallengeType.PHOTO;
      
      const result = await ChallengeService.generateChallenge(tribeId, type);
      
      expect(result).toBeDefined();
      expect(result.tribeId).toBe(tribeId);
      expect(result.type).toBe(type);
      expect(result.aiGenerated).toBe(false);
      
      // Verify challenge was saved to database
      const savedChallenge = await Challenge.findById(result.id);
      expect(savedChallenge).toBeDefined();
      expect(savedChallenge?.metadata.generationMethod).toBe('template');
    });
  });

  describe('generateChallenge with AI', () => {
    it('should generate an AI-powered challenge', async () => {
      // Mock Math.random to ensure we get AI-based generation
      const randomStub = sinon.stub(Math, 'random').returns(0.5); // 0.5 < 0.7 => AI-based
      
      // Mock the AI service response
      const aiServiceStub = mockAIOrchestrationService({
        title: 'AI Generated Challenge',
        description: 'This is an AI-generated challenge description'
      });
      
      const tribeId = 'test-tribe-id';
      const type = ChallengeType.CREATIVE;
      
      const result = await ChallengeService.generateChallenge(tribeId, type);
      
      expect(result).toBeDefined();
      expect(result.tribeId).toBe(tribeId);
      expect(result.type).toBe(type);
      expect(result.title).toBe('AI Generated Challenge');
      expect(result.description).toBe('This is an AI-generated challenge description');
      expect(result.aiGenerated).toBe(true);
      
      // Verify challenge was saved to database
      const savedChallenge = await Challenge.findById(result.id);
      expect(savedChallenge).toBeDefined();
      expect(savedChallenge?.aiGenerated).toBe(true);
      expect(savedChallenge?.metadata.generationMethod).toBe('ai');
    });
  });

  describe('activateChallenge', () => {
    it('should activate a pending challenge', async () => {
      const testChallenge = await createTestChallenge({
        status: ChallengeStatus.PENDING
      });
      
      const result = await ChallengeService.activateChallenge(testChallenge._id.toString());
      
      expect(result).toBeDefined();
      expect(result.status).toBe(ChallengeStatus.ACTIVE);
      
      // Verify challenge was updated in database
      const updatedChallenge = await Challenge.findById(testChallenge._id);
      expect(updatedChallenge?.status).toBe(ChallengeStatus.ACTIVE);
    });
  });

  describe('cancelChallenge', () => {
    it('should cancel an active challenge', async () => {
      const testChallenge = await createTestChallenge({
        status: ChallengeStatus.ACTIVE
      });
      
      const result = await ChallengeService.cancelChallenge(testChallenge._id.toString());
      
      expect(result).toBeDefined();
      expect(result.status).toBe(ChallengeStatus.CANCELLED);
      
      // Verify challenge was updated in database
      const updatedChallenge = await Challenge.findById(testChallenge._id);
      expect(updatedChallenge?.status).toBe(ChallengeStatus.CANCELLED);
    });
  });

  describe('checkChallengeStatus', () => {
    it('should update challenge statuses based on end dates', async () => {
      // Create a challenge with past end date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      await createTestChallenge({
        status: ChallengeStatus.ACTIVE,
        endDate: pastDate
      });
      
      // Create a challenge with future end date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      await createTestChallenge({
        status: ChallengeStatus.ACTIVE,
        endDate: futureDate
      });
      
      await ChallengeService.checkChallengeStatus();
      
      // Verify only the expired challenge was updated
      const challenges = await Challenge.find({});
      expect(challenges.length).toBe(2);
      
      const expiredChallenge = challenges.find(c => c.endDate < new Date());
      expect(expiredChallenge?.status).toBe(ChallengeStatus.COMPLETED);
      
      const activeChallenge = challenges.find(c => c.endDate > new Date());
      expect(activeChallenge?.status).toBe(ChallengeStatus.ACTIVE);
    });
  });

  describe('getChallengeMetrics', () => {
    it('should return metrics for tribe challenges', async () => {
      const tribeId = 'metric-test-tribe';
      
      // Create multiple challenges with different statuses
      await Challenge.create({
        ...createMockChallenge({
          tribeId,
          status: ChallengeStatus.ACTIVE,
          type: ChallengeType.PHOTO
        }),
        participants: ['user1', 'user2', 'user3'],
        completedBy: [
          { userId: 'user1', completedAt: new Date(), evidence: 'test' }
        ]
      });
      
      await Challenge.create({
        ...createMockChallenge({
          tribeId,
          status: ChallengeStatus.COMPLETED,
          type: ChallengeType.CREATIVE
        }),
        participants: ['user1', 'user2'],
        completedBy: [
          { userId: 'user1', completedAt: new Date() },
          { userId: 'user2', completedAt: new Date() }
        ]
      });
      
      await createTestChallenge({
        tribeId: 'different-tribe', // Different tribe
        status: ChallengeStatus.ACTIVE
      });
      
      const metrics = await ChallengeService.getChallengeMetrics(tribeId);
      
      expect(metrics).toBeDefined();
      expect(metrics['totalChallenges']).toBe(2); // Only challenges for our tribe
      
      // Check challenge type breakdown
      expect(metrics['challengesByType'][ChallengeType.PHOTO]).toBe(1);
      expect(metrics['challengesByType'][ChallengeType.CREATIVE]).toBe(1);
      
      // Check user participation
      expect(metrics['topParticipants']).toBeDefined();
      expect(metrics['topParticipants'].length).toBeGreaterThan(0);
      
      // Check recent challenges
      expect(metrics['recentChallenges']).toBeDefined();
      expect(metrics['recentChallenges'].length).toBeLessThanOrEqual(5);
    });
  });
});