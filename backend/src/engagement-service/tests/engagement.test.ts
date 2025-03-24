import mongoose from 'mongoose'; // ^6.0.0
import { MongoMemoryServer } from 'mongodb-memory-server'; // ^8.0.0
import { EngagementService } from '../src/services/engagement.service';
import {
  Engagement,
  IEngagementDocument,
  IEngagementCreate,
  IEngagementUpdate,
  IEngagementResponse,
  IEngagementResponseCreate,
  EngagementType,
  EngagementStatus,
  EngagementTrigger,
} from '../src/models/engagement.model';
import { ApiError } from '../../../shared/src/errors/api.error';
import sinon from 'sinon'; // ^15.0.0
import axios from 'axios'; // ^1.3.4

let mongoServer: MongoMemoryServer;
let engagementService: EngagementService;

/**
 * Sets up the in-memory MongoDB database for testing
 */
const setupDatabase = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
};

/**
 * Tears down the database connection after tests
 */
const teardownDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

/**
 * Creates a mock engagement for testing
 * @param overrides - Optional overrides for the engagement data
 * @returns Mock engagement data
 */
const createMockEngagement = (overrides?: Partial<IEngagementCreate>): IEngagementCreate => {
  const defaultEngagement: IEngagementCreate = {
    tribeId: '64f3c9a3b1d14b001b000001',
    type: EngagementType.CONVERSATION_PROMPT,
    content: 'Test engagement content',
    trigger: EngagementTrigger.SCHEDULED,
    createdBy: 'testUser',
    aiGenerated: false,
    metadata: {}
  };

  return {
    ...defaultEngagement,
    ...overrides,
  };
};

/**
 * Creates a test engagement in the database
 * @param overrides - Optional overrides for the engagement data
 * @returns Created engagement document
 */
const createTestEngagement = async (overrides?: Partial<IEngagementCreate>): Promise<IEngagementDocument> => {
  const mockEngagementData = createMockEngagement(overrides);
  const engagement = new Engagement(mockEngagementData);
  await engagement.save();
  return engagement;
};

/**
 * Mocks the AI orchestration service for testing AI-generated engagements
 * @param responseContent - The content to return in the mocked response
 * @returns Stubbed axios instance
 */
const mockAIOrchestrationService = (responseContent: object): sinon.SinonStub => {
  const axiosStub = sinon.stub(axios, 'post');
  axiosStub.resolves({ data: responseContent });
  return axiosStub;
};

/**
 * Mocks the tribe service for testing tribe data retrieval
 * @param tribeData - The tribe data to return in the mocked response
 * @returns Stubbed axios instance
 */
const mockTribeService = (tribeData: object): sinon.SinonStub => {
  const axiosStub = sinon.stub(axios, 'get');
  axiosStub.resolves({ data: tribeData });
  return axiosStub;
};

describe('Engagement Service', () => {
  beforeAll(async () => {
    await setupDatabase();
    engagementService = new EngagementService();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  afterEach(async () => {
    sinon.restore();
    await Engagement.deleteMany({});
  });

  it('createEngagement: Should create a new engagement', async () => {
    const mockEngagementData = createMockEngagement();
    const engagement = await engagementService.createEngagement(mockEngagementData);

    expect(engagement).toBeDefined();
    expect(engagement.tribeId).toBe(mockEngagementData.tribeId);
    expect(engagement.type).toBe(mockEngagementData.type);

    const savedEngagement = await Engagement.findById(engagement.id);
    expect(savedEngagement).toBeDefined();
    expect(savedEngagement.tribeId).toBe(mockEngagementData.tribeId);
  });

  it('getEngagement: Should retrieve an engagement by ID', async () => {
    const testEngagement = await createTestEngagement();
    const engagement = await engagementService.getEngagement(testEngagement.id, 'testUser');

    expect(engagement).toBeDefined();
    expect(engagement.id).toBe(testEngagement.id);
    expect(engagement.tribeId).toBe(testEngagement.tribeId);
  });

  it('getEngagement with userId: Should retrieve an engagement with user response data', async () => {
    const testEngagement = await createTestEngagement();
    const responseData: IEngagementResponseCreate = {
      userId: 'testUser',
      content: 'Test response',
      responseType: 'text',
    };
    await engagementService.addEngagementResponse(testEngagement.id, responseData);
    const engagement = await engagementService.getEngagement(testEngagement.id, 'testUser');

    expect(engagement).toBeDefined();
    expect(engagement.userHasResponded).toBe(true);
  });

  it('getEngagement with non-existent ID: Should throw an error for non-existent engagement ID', async () => {
    await expect(engagementService.getEngagement('64f3c9a3b1d14b001b000002', 'testUser')).rejects.toThrow(ApiError);
  });

  it('updateEngagement: Should update an existing engagement', async () => {
    const testEngagement = await createTestEngagement();
    const updateData: IEngagementUpdate = {
      content: 'Updated engagement content',
      status: EngagementStatus.COMPLETED,
    };
    const engagement = await engagementService.updateEngagement(testEngagement.id, updateData);

    expect(engagement).toBeDefined();
    expect(engagement.content).toBe(updateData.content);
    expect(engagement.status).toBe(updateData.status);

    const updatedEngagement = await Engagement.findById(testEngagement.id);
    expect(updatedEngagement.content).toBe(updateData.content);
    expect(updatedEngagement.status).toBe(updateData.status);
  });

  it('updateEngagement with non-existent ID: Should throw an error for non-existent engagement ID', async () => {
    const updateData: IEngagementUpdate = { content: 'Updated content' };
    await expect(engagementService.updateEngagement('64f3c9a3b1d14b001b000002', updateData)).rejects.toThrow(ApiError);
  });

  it('deleteEngagement: Should delete an engagement by ID', async () => {
    const testEngagement = await createTestEngagement();
    await engagementService.deleteEngagement(testEngagement.id);

    const deletedEngagement = await Engagement.findById(testEngagement.id);
    expect(deletedEngagement).toBeNull();
  });

  it('listEngagements: Should list engagements with filtering', async () => {
    await createTestEngagement({ tribeId: 'tribe1', type: EngagementType.CONVERSATION_PROMPT });
    await createTestEngagement({ tribeId: 'tribe2', type: EngagementType.ACTIVITY_SUGGESTION });

    const filters = { tribeId: 'tribe1' };
    const pagination = { page: 1, limit: 10 };
    const result = await engagementService.listEngagements(filters, pagination, 'testUser');

    expect(result).toBeDefined();
    expect(result.engagements.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.engagements[0].tribeId).toBe('tribe1');
  });

  it('addEngagementResponse: Should add a user response to an engagement', async () => {
    const testEngagement = await createTestEngagement();
    const responseData: IEngagementResponseCreate = {
      userId: 'testUser',
      content: 'Test response',
      responseType: 'text',
    };
    const engagement = await engagementService.addEngagementResponse(testEngagement.id, responseData);

    expect(engagement).toBeDefined();
    expect(engagement.responses.length).toBe(1);
    expect(engagement.responses[0].userId).toBe(responseData.userId);

    const updatedEngagement = await Engagement.findById(testEngagement.id);
    expect(updatedEngagement.responses.length).toBe(1);
    expect(updatedEngagement.status).toBe(EngagementStatus.RESPONDED);
  });

  it('addEngagementResponse with expired engagement: Should throw an error for expired engagement', async () => {
    const testEngagement = await createTestEngagement({ status: EngagementStatus.EXPIRED });
    const responseData: IEngagementResponseCreate = {
      userId: 'testUser',
      content: 'Test response',
      responseType: 'text',
    };
    await expect(engagementService.addEngagementResponse(testEngagement.id, responseData)).rejects.toThrow(ApiError);
  });

  it('addEngagementResponse with duplicate user: Should throw an error for duplicate user response', async () => {
    const testEngagement = await createTestEngagement();
    const responseData: IEngagementResponseCreate = {
      userId: 'testUser',
      content: 'Test response',
      responseType: 'text',
    };
    await engagementService.addEngagementResponse(testEngagement.id, responseData);
    await expect(engagementService.addEngagementResponse(testEngagement.id, responseData)).rejects.toThrow(ApiError);
  });

  it('deliverEngagement: Should mark an engagement as delivered', async () => {
    const testEngagement = await createTestEngagement({ status: EngagementStatus.PENDING });
    const engagement = await engagementService.deliverEngagement(testEngagement.id);

    expect(engagement).toBeDefined();
    expect(engagement.status).toBe(EngagementStatus.DELIVERED);
    expect(engagement.deliveredAt).toBeDefined();

    const updatedEngagement = await Engagement.findById(testEngagement.id);
    expect(updatedEngagement.status).toBe(EngagementStatus.DELIVERED);
    expect(updatedEngagement.deliveredAt).toBeDefined();
  });

  it('completeEngagement: Should mark an engagement as completed', async () => {
    const testEngagement = await createTestEngagement({ status: EngagementStatus.DELIVERED });
    const engagement = await engagementService.completeEngagement(testEngagement.id);

    expect(engagement).toBeDefined();
    expect(engagement.status).toBe(EngagementStatus.COMPLETED);

    const updatedEngagement = await Engagement.findById(testEngagement.id);
    expect(updatedEngagement.status).toBe(EngagementStatus.COMPLETED);
  });

  it('generateEngagement with conversation prompt: Should generate a conversation prompt engagement', async () => {
    const tribeId = '64f3c9a3b1d14b001b000001';
    const mockTribeData = { id: tribeId, name: 'Test Tribe', members: [], interests: [] };
    mockTribeService(mockTribeData);
    const mockAIResponse = { content: 'Test AI-generated prompt' };
    mockAIOrchestrationService(mockAIResponse);

    const engagement = await engagementService.generateEngagement(tribeId, EngagementType.CONVERSATION_PROMPT, EngagementTrigger.AI_INITIATED);

    expect(engagement).toBeDefined();
    expect(engagement.tribeId).toBe(tribeId);
    expect(engagement.type).toBe(EngagementType.CONVERSATION_PROMPT);
    expect(engagement.content).toBe(mockAIResponse.content);
    expect(engagement.aiGenerated).toBe(true);

    const savedEngagement = await Engagement.findById(engagement.id);
    expect(savedEngagement).toBeDefined();
    expect(savedEngagement.aiGenerated).toBe(true);
  });

  it('generateEngagement with activity suggestion: Should generate an activity suggestion engagement', async () => {
    const tribeId = '64f3c9a3b1d14b001b000001';
    const mockTribeData = { id: tribeId, name: 'Test Tribe', members: [], interests: [] };
    mockTribeService(mockTribeData);
    const mockAIResponse = { content: 'Test AI-generated activity suggestion' };
    mockAIOrchestrationService(mockAIResponse);

    const engagement = await engagementService.generateEngagement(tribeId, EngagementType.ACTIVITY_SUGGESTION, EngagementTrigger.AI_INITIATED);

    expect(engagement).toBeDefined();
    expect(engagement.tribeId).toBe(tribeId);
    expect(engagement.type).toBe(EngagementType.ACTIVITY_SUGGESTION);
    expect(engagement.content).toBe(mockAIResponse.content);
    expect(engagement.aiGenerated).toBe(true);

    const savedEngagement = await Engagement.findById(engagement.id);
    expect(savedEngagement).toBeDefined();
    expect(savedEngagement.aiGenerated).toBe(true);
  });

  it('checkEngagementStatus: Should update engagement statuses based on expiration dates', async () => {
    const expiredEngagement = await createTestEngagement({ expiresAt: new Date(Date.now() - 1000), status: EngagementStatus.PENDING });
    const validEngagement = await createTestEngagement({ expiresAt: new Date(Date.now() + 1000), status: EngagementStatus.PENDING });

    await engagementService.checkEngagementStatus();

    const updatedExpiredEngagement = await Engagement.findById(expiredEngagement.id);
    expect(updatedExpiredEngagement.status).toBe(EngagementStatus.EXPIRED);

    const updatedValidEngagement = await Engagement.findById(validEngagement.id);
    expect(updatedValidEngagement.status).toBe(EngagementStatus.PENDING);
  });

  it('getEngagementMetrics: Should return metrics for tribe engagements', async () => {
    const tribeId = '64f3c9a3b1d14b001b000001';
    await createTestEngagement({ tribeId, type: EngagementType.CONVERSATION_PROMPT, status: EngagementStatus.COMPLETED });
    await createTestEngagement({ tribeId, type: EngagementType.ACTIVITY_SUGGESTION, status: EngagementStatus.PENDING });
    const engagement = await createTestEngagement({ tribeId, type: EngagementType.CONVERSATION_PROMPT, status: EngagementStatus.PENDING });
    await engagementService.addEngagementResponse(engagement.id, { userId: 'user1', content: 'response', responseType: 'text' });

    const metrics = await engagementService.getEngagementMetrics(tribeId, {});

    expect(metrics).toBeDefined();
    expect(metrics.totalEngagements).toBe(3);
    expect(metrics.responseRate).toBeCloseTo(0.33, 2);
    expect(metrics.engagementsByType[EngagementType.CONVERSATION_PROMPT]).toBe(2);
    expect(metrics.engagementsByType[EngagementType.ACTIVITY_SUGGESTION]).toBe(1);
  });

  it('detectLowActivity: Should detect tribes with low activity', async () => {
    const tribeId1 = '64f3c9a3b1d14b001b000001';
    const tribeId2 = '64f3c9a3b1d14b001b000002';
    const recentDate = new Date(Date.now() - 1);
    const oldDate = new Date(Date.now() - 100000);

    await createTestEngagement({ tribeId: tribeId1, createdAt: recentDate });
    await createTestEngagement({ tribeId: tribeId2, createdAt: oldDate });

    const lowActivityTribes = await engagementService.detectLowActivity(50, 10);

    expect(lowActivityTribes).toBeDefined();
    expect(lowActivityTribes).toContain(tribeId2);
    expect(lowActivityTribes).not.toContain(tribeId1);
  });
});