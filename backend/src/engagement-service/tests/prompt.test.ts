import mongoose from 'mongoose'; // ^6.0.0
import { MongoMemoryServer } from 'mongodb-memory-server'; // ^8.0.0
import { conversationPrompts, activityPrompts } from '../src/prompts';
import promptService from '../src/services/prompt.service';
import {
  Prompt,
  IPromptDocument,
  IPromptCreate,
  IPromptUpdate,
  IPromptResponse,
  IPromptUsageUpdate,
  PromptType,
  PromptCategory,
} from '../src/models/prompt.model';
import { ApiError } from '../../../shared/src/errors/api.error';
import sinon from 'sinon'; // ^15.0.0
import axios from 'axios'; // ^1.3.4

/**
 * Test suite for the Prompt Service functionality
 */
describe('Prompt Service', () => {
  let mongoServer: MongoMemoryServer;

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
   * Creates a mock prompt for testing
   * @param overrides - Partial prompt data to override default values
   * @returns Mock prompt data
   */
  const createMockPrompt = (overrides?: Partial<IPromptCreate>): IPromptCreate => {
    const defaultPrompt: IPromptCreate = {
      content: 'Test prompt content',
      type: PromptType.CONVERSATION_STARTER,
      category: PromptCategory.GENERAL,
      tags: ['test', 'mock'],
      interestCategories: [],
      personalityTraits: [],
      aiGenerated: false,
      metadata: {},
      ...overrides,
    };
    return defaultPrompt;
  };

  /**
   * Creates a test prompt in the database
   * @param overrides - Partial prompt data to override default values
   * @returns Created prompt document
   */
  const createTestPrompt = async (overrides?: Partial<IPromptCreate>): Promise<IPromptDocument> => {
    const mockPromptData = createMockPrompt(overrides);
    const prompt = new Prompt(mockPromptData);
    await prompt.save();
    return prompt;
  };

  /**
   * Mocks the AI orchestration service for testing AI-generated prompts
   * @param responseContent - The content to return in the mocked response
   * @returns Stubbed axios instance
   */
  const mockAIOrchestrationService = (responseContent: any): sinon.SinonStub => {
    const axiosStub = sinon.stub(axios, 'post');
    axiosStub.resolves({ data: { content: responseContent } });
    return axiosStub;
  };

  /**
   * Setup and teardown steps for the test suite
   */
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  beforeEach(async () => {
    await Prompt.deleteMany({});
  });

  afterEach(() => {
    sinon.restore();
  });

  /**
   * Test case: Should create a new prompt
   */
  it('createPrompt: Should create a new prompt', async () => {
    const mockPromptData = createMockPrompt();
    const createdPrompt = await promptService.createPrompt(mockPromptData);

    expect(createdPrompt).toHaveProperty('id');
    expect(createdPrompt.content).toBe(mockPromptData.content);
    expect(createdPrompt.type).toBe(mockPromptData.type);
    expect(createdPrompt.category).toBe(mockPromptData.category);

    const promptInDb = await Prompt.findById(createdPrompt.id);
    expect(promptInDb).toBeDefined();
    expect(promptInDb?.content).toBe(mockPromptData.content);
  });

  /**
   * Test case: Should retrieve a prompt by ID
   */
  it('getPrompt: Should retrieve a prompt by ID', async () => {
    const testPrompt = await createTestPrompt();
    const retrievedPrompt = await promptService.getPrompt(testPrompt.id);

    expect(retrievedPrompt).toBeDefined();
    expect(retrievedPrompt.id).toBe(testPrompt.id);
    expect(retrievedPrompt.content).toBe(testPrompt.content);
  });

  /**
   * Test case: Should throw an error for non-existent prompt ID
   */
  it('getPrompt: Should throw an error for non-existent prompt ID', async () => {
    await expect(promptService.getPrompt('nonexistentid')).rejects.toThrow(ApiError);
  });

  /**
   * Test case: Should update an existing prompt
   */
  it('updatePrompt: Should update an existing prompt', async () => {
    const testPrompt = await createTestPrompt();
    const updateData: IPromptUpdate = {
      content: 'Updated prompt content',
      tags: ['updated', 'test'],
    };
    const updatedPrompt = await promptService.updatePrompt(testPrompt.id, updateData);

    expect(updatedPrompt).toBeDefined();
    expect(updatedPrompt.id).toBe(testPrompt.id);
    expect(updatedPrompt.content).toBe(updateData.content);
    expect(updatedPrompt.tags).toEqual(expect.arrayContaining(updateData.tags!));

    const promptInDb = await Prompt.findById(testPrompt.id);
    expect(promptInDb).toBeDefined();
    expect(promptInDb?.content).toBe(updateData.content);
    expect(promptInDb?.tags).toEqual(expect.arrayContaining(updateData.tags!));
  });

  /**
   * Test case: Should throw an error for non-existent prompt ID
   */
  it('updatePrompt: Should throw an error for non-existent prompt ID', async () => {
    const updateData: IPromptUpdate = { content: 'Updated prompt content' };
    await expect(promptService.updatePrompt('nonexistentid', updateData)).rejects.toThrow(ApiError);
  });

  /**
   * Test case: Should delete a prompt by ID
   */
  it('deletePrompt: Should delete a prompt by ID', async () => {
    const testPrompt = await createTestPrompt();
    const result = await promptService.deletePrompt(testPrompt.id);

    expect(result).toBe(true);

    const promptInDb = await Prompt.findById(testPrompt.id);
    expect(promptInDb).toBeNull();
  });

  /**
   * Test case: Should list prompts with filtering
   */
  it('listPrompts: Should list prompts with filtering', async () => {
    await createTestPrompt({ type: PromptType.CONVERSATION_STARTER, category: PromptCategory.GENERAL, tags: ['test'] });
    await createTestPrompt({ type: PromptType.ACTIVITY_SUGGESTION, category: PromptCategory.GENERAL, tags: ['test'] });
    await createTestPrompt({ type: PromptType.CONVERSATION_STARTER, category: PromptCategory.INTEREST_BASED, tags: ['mock'] });

    const searchParams = { type: PromptType.CONVERSATION_STARTER, tags: ['test'], page: 1, limit: 10 };
    const result = await promptService.listPrompts(searchParams);

    expect(result.prompts).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.prompts[0].type).toBe(PromptType.CONVERSATION_STARTER);
    expect(result.prompts[0].tags).toEqual(expect.arrayContaining(['test']));
  });

  /**
   * Test case: Should find prompts relevant to specific criteria
   */
  it('findRelevantPrompts: Should find prompts relevant to specific criteria', async () => {
    await createTestPrompt({ type: PromptType.CONVERSATION_STARTER, category: PromptCategory.GENERAL, interestCategories: ['sports'] });
    await createTestPrompt({ type: PromptType.ACTIVITY_SUGGESTION, category: PromptCategory.GENERAL, personalityTraits: ['outgoing'] });

    const criteria = { type: PromptType.CONVERSATION_STARTER, category: PromptCategory.GENERAL, interestCategories: ['sports'], personalityTraits: ['outgoing'] };
    const result = await promptService.findRelevantPrompts(criteria);

    expect(result).toHaveLength(0);
  });

  /**
   * Test case: Should get a random prompt of a specific type and category
   */
  it('getRandomPrompt: Should get a random prompt of a specific type and category', async () => {
    await createTestPrompt({ type: PromptType.CONVERSATION_STARTER, category: PromptCategory.GENERAL });
    const result = await promptService.getRandomPrompt(PromptType.CONVERSATION_STARTER, PromptCategory.GENERAL);

    expect(result).toBeDefined();
    expect(result.type).toBe(PromptType.CONVERSATION_STARTER);
    expect(result.category).toBe(PromptCategory.GENERAL);
  });

  /**
   * Test case: Should update usage statistics for a prompt
   */
  it('updatePromptUsage: Should update usage statistics for a prompt', async () => {
    const testPrompt = await createTestPrompt();
    const usageData: IPromptUsageUpdate = { used: true, receivedResponse: true, engagementId: '123' };
    const updatedPrompt = await promptService.updatePromptUsage(testPrompt.id, usageData);

    expect(updatedPrompt).toBeDefined();
    expect(updatedPrompt.usageCount).toBe(1);
    expect(updatedPrompt.responseRate).toBeGreaterThan(0);

    const promptInDb = await Prompt.findById(testPrompt.id);
    expect(promptInDb).toBeDefined();
    expect(promptInDb?.usageCount).toBe(1);
    expect(promptInDb?.responseRate).toBeGreaterThan(0);
  });

  /**
   * Test case: Should seed the database with default prompts
   */
  it('seedDefaultPrompts: Should seed the database with default prompts', async () => {
    const promptCount = await promptService.seedDefaultPrompts();
    expect(promptCount).toBe(conversationPrompts.length + activityPrompts.length);

    const promptsInDb = await Prompt.find({});
    expect(promptsInDb).toHaveLength(promptCount);
  });

  /**
   * Test case: Should generate a new prompt using AI
   */
  it('generateAIPrompt: Should generate a new prompt using AI', async () => {
    const mockContent = 'This is an AI-generated prompt.';
    mockAIOrchestrationService(mockContent);

    const promptRequest = { type: PromptType.CONVERSATION_STARTER, category: PromptCategory.GENERAL, context: 'test context' };
    const aiPrompt = await promptService.generateAIPrompt(promptRequest);

    expect(aiPrompt).toBeDefined();
    expect(aiPrompt.content).toBe(mockContent);
    expect(aiPrompt.aiGenerated).toBe(true);

    const promptInDb = await Prompt.findById(aiPrompt.id);
    expect(promptInDb).toBeDefined();
    expect(promptInDb?.content).toBe(mockContent);
    expect(promptInDb?.aiGenerated).toBe(true);
  });
});