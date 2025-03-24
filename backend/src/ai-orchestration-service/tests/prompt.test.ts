import { PromptService } from '../src/services/prompt.service';
import {
  PromptTemplate,
  PromptConfig,
  PromptData,
  PromptCategory,
  PromptVariableType,
  RenderedPrompt
} from '../src/models/prompt.model';
import { OrchestrationFeature } from '../src/models/orchestration.model';
import {
  renderPromptTemplate,
  validatePromptVariables,
  extractVariablesFromTemplate,
  createRenderedPrompt,
  optimizePromptForFeature,
  validateTemplateVariablesMatch,
  getDefaultPromptForFeature
} from '../src/utils/prompt.util';
import {
  validatePromptTemplate,
  validatePromptConfig,
  validatePromptData,
  validateRenderedPrompt,
  validateFeatureSpecificVariables
} from '../src/validations/prompt.validation';
import { ApiError } from '../../../shared/src/errors/api.error';
import { ValidationError } from '../../../shared/src/errors/validation.error';
import { prisma } from '../../../config/database';

jest.mock('../../../config/database', () => ({
  prisma: {
    promptTemplate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn()
    },
    promptConfig: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

/**
 * Creates a mock PromptTemplate object for testing
 * 
 * @param overrides - Optional partial object to override default values
 * @returns A mock prompt template
 */
function createMockPromptTemplate(overrides: Partial<PromptTemplate> = {}): PromptTemplate {
  const now = new Date();
  return {
    id: 'template-123',
    name: 'Test Template',
    description: 'A template for testing',
    template: 'This is a test template with {{variable1}} and {{variable2}}',
    variables: [
      {
        name: 'variable1',
        type: PromptVariableType.STRING,
        description: 'First test variable',
        required: true
      },
      {
        name: 'variable2',
        type: PromptVariableType.STRING,
        description: 'Second test variable',
        required: false,
        defaultValue: 'default value'
      }
    ],
    category: PromptCategory.SYSTEM,
    feature: OrchestrationFeature.MATCHING,
    version: '1.0.0',
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

/**
 * Creates a mock PromptConfig object for testing
 * 
 * @param overrides - Optional partial object to override default values
 * @returns A mock prompt configuration
 */
function createMockPromptConfig(overrides: Partial<PromptConfig> = {}): PromptConfig {
  const now = new Date();
  return {
    id: 'config-123',
    name: 'Test Config',
    description: 'A configuration for testing',
    feature: OrchestrationFeature.MATCHING,
    systemPromptId: 'template-system-123',
    userPromptId: 'template-user-123',
    assistantPromptId: 'template-assistant-123',
    isDefault: false,
    active: true,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

/**
 * Creates a mock PromptData object for testing
 * 
 * @param overrides - Optional partial object to override default values
 * @returns A mock prompt data object
 */
function createMockPromptData(overrides: Partial<PromptData> = {}): PromptData {
  return {
    templateId: 'template-123',
    variables: {
      variable1: 'test value 1',
      variable2: 'test value 2'
    },
    feature: OrchestrationFeature.MATCHING,
    ...overrides
  };
}

/**
 * Creates feature-specific variables for testing
 * 
 * @param feature - The orchestration feature to create variables for
 * @returns Feature-specific variables
 */
function createFeatureSpecificVariables(feature: OrchestrationFeature): Record<string, any> {
  switch (feature) {
    case OrchestrationFeature.MATCHING:
      return {
        userProfile: {
          id: 'user-123',
          name: 'Test User',
          interests: ['hiking', 'reading'],
          personalityTraits: ['outgoing', 'creative']
        },
        tribes: [
          {
            id: 'tribe-123',
            name: 'Hiking Club',
            members: [{ id: 'member-1' }, { id: 'member-2' }],
            interests: ['hiking', 'outdoors']
          }
        ],
        matchingCriteria: {
          preferredSize: 5,
          interestWeight: 0.7,
          personalityWeight: 0.3
        }
      };
      
    case OrchestrationFeature.PERSONALITY_ANALYSIS:
      return {
        assessmentResponses: {
          question1: 'I enjoy meeting new people',
          question2: 'I prefer quiet evenings at home',
          question3: 'I like to plan activities in advance'
        },
        userProfile: {
          id: 'user-123',
          name: 'Test User',
          age: 30,
          gender: 'female'
        },
        communicationData: {
          messagingStyle: 'direct',
          responseTime: 'quick',
          conversationInitiations: 12
        }
      };
      
    case OrchestrationFeature.ENGAGEMENT:
      return {
        tribeData: {
          id: 'tribe-123',
          name: 'Book Club',
          description: 'We read and discuss books monthly',
          formationDate: '2023-01-15'
        },
        memberProfiles: [
          {
            id: 'member-1',
            name: 'Alice',
            interests: ['fiction', 'mystery']
          },
          {
            id: 'member-2',
            name: 'Bob',
            interests: ['non-fiction', 'biography']
          }
        ],
        engagementHistory: [
          {
            type: 'meeting',
            date: '2023-02-15',
            attendees: 5,
            topic: 'Mystery novel discussion'
          }
        ],
        activityPreferences: {
          meetingFrequency: 'monthly',
          preferredFormats: ['in-person', 'video call'],
          preferredTimes: ['weekday evenings', 'weekend afternoons']
        }
      };
      
    case OrchestrationFeature.RECOMMENDATION:
      return {
        tribeData: {
          id: 'tribe-123',
          name: 'Foodies',
          description: 'We explore restaurants together',
          memberCount: 6
        },
        memberProfiles: [
          {
            id: 'member-1',
            name: 'Alice',
            foodPreferences: ['italian', 'vegetarian']
          },
          {
            id: 'member-2',
            name: 'Bob',
            foodPreferences: ['mexican', 'spicy']
          }
        ],
        location: {
          city: 'Seattle',
          coordinates: {
            latitude: 47.6062,
            longitude: -122.3321
          }
        },
        weatherData: {
          forecast: 'sunny',
          temperature: 75,
          precipitation: 0
        },
        eventOptions: [
          {
            id: 'event-1',
            name: 'Italian Restaurant Opening',
            type: 'dining',
            price: '$$'
          },
          {
            id: 'event-2',
            name: 'Food Festival',
            type: 'festival',
            price: '$'
          }
        ],
        budgetConstraints: {
          maxPerPerson: 30,
          preferredPriceRange: '$$'
        }
      };
      
    case OrchestrationFeature.CONVERSATION:
      return {
        tribeData: {
          id: 'tribe-123',
          name: 'Tech Discussion Group',
          topic: 'Artificial Intelligence'
        },
        memberProfiles: [
          {
            id: 'member-1',
            name: 'Alice',
            expertise: ['machine learning', 'neural networks']
          },
          {
            id: 'member-2',
            name: 'Bob',
            expertise: ['robotics', 'computer vision']
          }
        ],
        conversationHistory: [
          {
            speaker: 'Alice',
            message: 'What do you think about the latest GPT models?',
            timestamp: '2023-06-15T14:30:00Z'
          },
          {
            speaker: 'Bob',
            message: 'They\'re impressive but have limitations in real-world applications.',
            timestamp: '2023-06-15T14:32:00Z'
          }
        ],
        currentTopic: 'Large Language Models'
      };
      
    default:
      return {};
  }
}

describe('PromptService', () => {
  let promptService: PromptService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    promptService = new PromptService();
  });
  
  it('should initialize with default templates and configurations', async () => {
    const mockTemplate = createMockPromptTemplate();
    const mockConfig = createMockPromptConfig();
    
    // Mock database calls for initialization
    (prisma.promptTemplate.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.promptTemplate.create as jest.Mock).mockResolvedValue(mockTemplate);
    (prisma.promptConfig.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.promptConfig.create as jest.Mock).mockResolvedValue(mockConfig);
    
    await promptService.initialize();
    
    // Verify templates and configs were created
    expect(prisma.promptTemplate.create).toHaveBeenCalled();
    expect(prisma.promptConfig.create).toHaveBeenCalled();
    
    // Service should be marked as initialized
    expect((promptService as any).initialized).toBe(true);
  });
  
  it('should create a prompt template', async () => {
    const templateData = {
      name: 'New Template',
      description: 'A new test template',
      template: 'This is a {{variable}}',
      variables: [
        {
          name: 'variable',
          type: PromptVariableType.STRING,
          description: 'Test variable',
          required: true
        }
      ],
      category: PromptCategory.SYSTEM,
      feature: OrchestrationFeature.MATCHING
    };
    
    const createdTemplate = { 
      ...templateData, 
      id: 'new-template-id',
      version: '1.0.0',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptTemplate.create as jest.Mock).mockResolvedValue(createdTemplate);
    
    const result = await promptService.createPromptTemplate(templateData);
    
    expect(prisma.promptTemplate.create).toHaveBeenCalled();
    expect(result).toEqual(createdTemplate);
  });
  
  it('should get a prompt template by ID', async () => {
    const mockTemplate = createMockPromptTemplate();
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
    
    const result = await promptService.getPromptTemplate(mockTemplate.id);
    
    expect(prisma.promptTemplate.findUnique).toHaveBeenCalledWith({
      where: { id: mockTemplate.id }
    });
    expect(result).toEqual(mockTemplate);
    
    // Call again to test caching
    const cachedResult = await promptService.getPromptTemplate(mockTemplate.id);
    
    // Database should only be called once (not for the cached result)
    expect(prisma.promptTemplate.findUnique).toHaveBeenCalledTimes(1);
    expect(cachedResult).toEqual(mockTemplate);
  });
  
  it('should throw an error when getting a non-existent template', async () => {
    const templateId = 'non-existent-id';
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptTemplate.findUnique as jest.Mock).mockResolvedValue(null);
    
    await expect(promptService.getPromptTemplate(templateId))
      .rejects.toThrow(ApiError);
    
    expect(prisma.promptTemplate.findUnique).toHaveBeenCalledWith({
      where: { id: templateId }
    });
  });
  
  it('should update a prompt template', async () => {
    const templateId = 'template-123';
    const updateData = {
      name: 'Updated Template Name',
      description: 'Updated description'
    };
    
    const existingTemplate = createMockPromptTemplate();
    const updatedTemplate = {
      ...existingTemplate,
      ...updateData,
      updatedAt: expect.any(Date)
    };
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptTemplate.findUnique as jest.Mock).mockResolvedValue(existingTemplate);
    (prisma.promptTemplate.update as jest.Mock).mockResolvedValue(updatedTemplate);
    
    const result = await promptService.updatePromptTemplate(templateId, updateData);
    
    expect(prisma.promptTemplate.update).toHaveBeenCalledWith({
      where: { id: templateId },
      data: expect.objectContaining(updateData)
    });
    expect(result).toEqual(updatedTemplate);
  });
  
  it('should delete a prompt template', async () => {
    const templateId = 'template-123';
    const mockTemplate = createMockPromptTemplate({ id: templateId });
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
    (prisma.promptConfig.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.promptTemplate.delete as jest.Mock).mockResolvedValue(mockTemplate);
    
    const result = await promptService.deletePromptTemplate(templateId);
    
    expect(prisma.promptTemplate.findUnique).toHaveBeenCalledWith({
      where: { id: templateId }
    });
    expect(prisma.promptConfig.findMany).toHaveBeenCalled();
    expect(prisma.promptTemplate.delete).toHaveBeenCalledWith({
      where: { id: templateId }
    });
    expect(result).toBe(true);
  });
  
  it('should not delete a template used in configurations', async () => {
    const templateId = 'template-123';
    const mockTemplate = createMockPromptTemplate({ id: templateId });
    const mockConfigs = [createMockPromptConfig({ systemPromptId: templateId })];
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
    (prisma.promptConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs);
    
    await expect(promptService.deletePromptTemplate(templateId))
      .rejects.toThrow(ApiError);
    
    expect(prisma.promptTemplate.delete).not.toHaveBeenCalled();
  });
  
  it('should get prompt templates with filtering', async () => {
    const mockTemplates = [
      createMockPromptTemplate({ id: 'template-1', feature: OrchestrationFeature.MATCHING }),
      createMockPromptTemplate({ id: 'template-2', feature: OrchestrationFeature.ENGAGEMENT })
    ];
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptTemplate.findMany as jest.Mock).mockResolvedValue(mockTemplates);
    
    const filters = { feature: OrchestrationFeature.MATCHING };
    const result = await promptService.getPromptTemplates(filters);
    
    expect(prisma.promptTemplate.findMany).toHaveBeenCalledWith({
      where: filters,
      orderBy: { updatedAt: 'desc' }
    });
    expect(result).toEqual(mockTemplates);
  });
  
  it('should create a prompt configuration', async () => {
    const configData = {
      name: 'New Config',
      description: 'A new test configuration',
      feature: OrchestrationFeature.MATCHING,
      systemPromptId: 'system-template-id',
      userPromptId: 'user-template-id',
      assistantPromptId: 'assistant-template-id',
      isDefault: false
    };
    
    const createdConfig = { 
      ...configData, 
      id: 'new-config-id',
      version: '1.0.0',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptTemplate.findUnique as jest.Mock).mockResolvedValue(createMockPromptTemplate());
    (prisma.promptConfig.create as jest.Mock).mockResolvedValue(createdConfig);
    
    const result = await promptService.createPromptConfig(configData);
    
    expect(prisma.promptTemplate.findUnique).toHaveBeenCalledTimes(3); // For system, user, assistant
    expect(prisma.promptConfig.create).toHaveBeenCalled();
    expect(result).toEqual(createdConfig);
  });
  
  it('should get a prompt configuration by ID', async () => {
    const mockConfig = createMockPromptConfig();
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);
    
    const result = await promptService.getPromptConfig(mockConfig.id);
    
    expect(prisma.promptConfig.findUnique).toHaveBeenCalledWith({
      where: { id: mockConfig.id }
    });
    expect(result).toEqual(mockConfig);
    
    // Call again to test caching
    const cachedResult = await promptService.getPromptConfig(mockConfig.id);
    
    // Database should only be called once (not for the cached result)
    expect(prisma.promptConfig.findUnique).toHaveBeenCalledTimes(1);
    expect(cachedResult).toEqual(mockConfig);
  });
  
  it('should throw an error when getting a non-existent configuration', async () => {
    const configId = 'non-existent-id';
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptConfig.findUnique as jest.Mock).mockResolvedValue(null);
    
    await expect(promptService.getPromptConfig(configId))
      .rejects.toThrow(ApiError);
    
    expect(prisma.promptConfig.findUnique).toHaveBeenCalledWith({
      where: { id: configId }
    });
  });
  
  it('should update a prompt configuration', async () => {
    const configId = 'config-123';
    const updateData = {
      name: 'Updated Config Name',
      description: 'Updated description'
    };
    
    const existingConfig = createMockPromptConfig();
    const updatedConfig = {
      ...existingConfig,
      ...updateData,
      updatedAt: expect.any(Date)
    };
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptConfig.findUnique as jest.Mock).mockResolvedValue(existingConfig);
    (prisma.promptTemplate.findUnique as jest.Mock).mockResolvedValue(createMockPromptTemplate());
    (prisma.promptConfig.update as jest.Mock).mockResolvedValue(updatedConfig);
    
    const result = await promptService.updatePromptConfig(configId, updateData);
    
    expect(prisma.promptConfig.update).toHaveBeenCalledWith({
      where: { id: configId },
      data: expect.objectContaining(updateData)
    });
    expect(result).toEqual(updatedConfig);
  });
  
  it('should delete a prompt configuration', async () => {
    const configId = 'config-123';
    const mockConfig = createMockPromptConfig({ id: configId, isDefault: false });
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);
    (prisma.promptConfig.delete as jest.Mock).mockResolvedValue(mockConfig);
    
    const result = await promptService.deletePromptConfig(configId);
    
    expect(prisma.promptConfig.findUnique).toHaveBeenCalledWith({
      where: { id: configId }
    });
    expect(prisma.promptConfig.delete).toHaveBeenCalledWith({
      where: { id: configId }
    });
    expect(result).toBe(true);
  });
  
  it('should not delete a default configuration', async () => {
    const configId = 'config-123';
    const mockConfig = createMockPromptConfig({ id: configId, isDefault: true });
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);
    
    await expect(promptService.deletePromptConfig(configId))
      .rejects.toThrow(ApiError);
    
    expect(prisma.promptConfig.delete).not.toHaveBeenCalled();
  });
  
  it('should get prompt configurations with filtering', async () => {
    const mockConfigs = [
      createMockPromptConfig({ id: 'config-1', feature: OrchestrationFeature.MATCHING }),
      createMockPromptConfig({ id: 'config-2', feature: OrchestrationFeature.ENGAGEMENT })
    ];
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs);
    
    const filters = { feature: OrchestrationFeature.MATCHING };
    const result = await promptService.getPromptConfigs(filters);
    
    expect(prisma.promptConfig.findMany).toHaveBeenCalledWith({
      where: filters,
      orderBy: { updatedAt: 'desc' }
    });
    expect(result).toEqual(mockConfigs);
  });
  
  it('should get the default configuration for a feature', async () => {
    const feature = OrchestrationFeature.MATCHING;
    const mockConfig = createMockPromptConfig({
      feature,
      isDefault: true
    });
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptConfig.findFirst as jest.Mock).mockResolvedValue(mockConfig);
    
    const result = await promptService.getDefaultConfigForFeature(feature);
    
    expect(prisma.promptConfig.findFirst).toHaveBeenCalledWith({
      where: { feature, isDefault: true, active: true }
    });
    expect(result).toEqual(mockConfig);
  });
  
  it('should create a default configuration if none exists', async () => {
    const feature = OrchestrationFeature.MATCHING;
    const createdConfig = createMockPromptConfig({
      feature,
      isDefault: true
    });
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptConfig.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.promptConfig.create as jest.Mock).mockResolvedValue(createdConfig);
    
    const result = await promptService.getDefaultConfigForFeature(feature);
    
    expect(prisma.promptConfig.findFirst).toHaveBeenCalled();
    expect(prisma.promptConfig.create).toHaveBeenCalled();
    expect(result.isDefault).toBe(true);
    expect(result.feature).toBe(feature);
  });
  
  it('should set a configuration as default for a feature', async () => {
    const feature = OrchestrationFeature.MATCHING;
    const configId = 'config-123';
    
    const existingConfig = createMockPromptConfig({
      id: configId,
      feature,
      isDefault: false
    });
    
    const previousDefault = createMockPromptConfig({
      id: 'previous-default',
      feature,
      isDefault: true
    });
    
    const updatedConfig = {
      ...existingConfig,
      isDefault: true,
      updatedAt: expect.any(Date)
    };
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptConfig.findUnique as jest.Mock).mockResolvedValue(existingConfig);
    (prisma.promptConfig.findFirst as jest.Mock).mockResolvedValue(previousDefault);
    (prisma.promptConfig.update as jest.Mock).mockImplementation((args) => {
      if (args.where.id === configId) {
        return Promise.resolve(updatedConfig);
      }
      return Promise.resolve({ ...previousDefault, isDefault: false });
    });
    
    const result = await promptService.setDefaultConfigForFeature(configId, feature);
    
    expect(prisma.promptConfig.update).toHaveBeenCalledTimes(2); // Update previous default and new default
    expect(result).toEqual(updatedConfig);
    expect(result.isDefault).toBe(true);
  });
  
  it('should render a prompt template with variables', async () => {
    const mockTemplate = createMockPromptTemplate({
      template: 'Hello {{variable1}}, welcome to {{variable2}}!'
    });
    
    const promptData: PromptData = {
      templateId: mockTemplate.id,
      variables: {
        variable1: 'User',
        variable2: 'Tribe'
      },
      feature: OrchestrationFeature.MATCHING
    };
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
    
    const result = await promptService.renderPrompt(promptData);
    
    expect(result.content).toBe('Hello User, welcome to Tribe!');
    expect(result.templateId).toBe(mockTemplate.id);
    expect(result.feature).toBe(OrchestrationFeature.MATCHING);
    expect(result.variables).toEqual(promptData.variables);
  });
  
  it('should throw an error when rendering with invalid variables', async () => {
    const mockTemplate = createMockPromptTemplate({
      template: 'Hello {{variable1}}, welcome to {{variable2}}!'
    });
    
    const promptData: PromptData = {
      templateId: mockTemplate.id,
      variables: {
        // Missing required variable1
        variable2: 'Tribe'
      },
      feature: OrchestrationFeature.MATCHING
    };
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
    
    await expect(promptService.renderPrompt(promptData))
      .rejects.toThrow(ValidationError);
  });
  
  it('should render all templates in a prompt configuration', async () => {
    const mockConfig = createMockPromptConfig();
    
    const systemTemplate = createMockPromptTemplate({
      id: mockConfig.systemPromptId,
      category: PromptCategory.SYSTEM,
      template: 'System: {{variable1}}'
    });
    
    const userTemplate = createMockPromptTemplate({
      id: mockConfig.userPromptId,
      category: PromptCategory.USER,
      template: 'User: {{variable1}}'
    });
    
    const assistantTemplate = createMockPromptTemplate({
      id: mockConfig.assistantPromptId,
      category: PromptCategory.ASSISTANT,
      template: 'Assistant: {{variable1}}'
    });
    
    const variables = {
      variable1: 'test value'
    };
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);
    (prisma.promptTemplate.findUnique as jest.Mock).mockImplementation((args) => {
      const id = args.where.id;
      if (id === mockConfig.systemPromptId) return Promise.resolve(systemTemplate);
      if (id === mockConfig.userPromptId) return Promise.resolve(userTemplate);
      if (id === mockConfig.assistantPromptId) return Promise.resolve(assistantTemplate);
      return Promise.resolve(null);
    });
    
    const result = await promptService.renderPromptConfig(mockConfig.id, variables);
    
    expect(result[PromptCategory.SYSTEM].content).toBe('System: test value');
    expect(result[PromptCategory.USER].content).toBe('User: test value');
    expect(result[PromptCategory.ASSISTANT].content).toBe('Assistant: test value');
  });
  
  it('should clear the template and configuration caches', async () => {
    const mockTemplate = createMockPromptTemplate();
    const mockConfig = createMockPromptConfig();
    
    // Mock initialize and database calls
    (promptService as any).initialized = true;
    (prisma.promptTemplate.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
    (prisma.promptConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig);
    
    // Populate caches
    await promptService.getPromptTemplate(mockTemplate.id);
    await promptService.getPromptConfig(mockConfig.id);
    
    // Clear caches
    promptService.clearCache();
    
    // Access the same items again
    await promptService.getPromptTemplate(mockTemplate.id);
    await promptService.getPromptConfig(mockConfig.id);
    
    // Database should be called twice for each (before and after cache clear)
    expect(prisma.promptTemplate.findUnique).toHaveBeenCalledTimes(2);
    expect(prisma.promptConfig.findUnique).toHaveBeenCalledTimes(2);
  });
});

describe('Prompt Utility Functions', () => {
  it('renderPromptTemplate should substitute variables correctly', () => {
    const template = createMockPromptTemplate({
      template: 'Hello {{variable1}}, welcome to {{variable2}}!'
    });
    
    const variables = {
      variable1: 'User',
      variable2: 'Tribe'
    };
    
    const result = renderPromptTemplate(template, variables);
    
    expect(result).toBe('Hello User, welcome to Tribe!');
  });
  
  it('renderPromptTemplate should handle nested object variables', () => {
    const template = createMockPromptTemplate({
      template: 'Hello {{user.name}}, you are {{user.age}} years old!',
      variables: [
        {
          name: 'user',
          type: PromptVariableType.OBJECT,
          description: 'User object',
          required: true
        }
      ]
    });
    
    const variables = {
      user: {
        name: 'John',
        age: 30
      }
    };
    
    const result = renderPromptTemplate(template, variables);
    
    expect(result).toBe('Hello John, you are 30 years old!');
  });
  
  it('validatePromptVariables should validate required variables', () => {
    const templateVariables = [
      {
        name: 'variable1',
        type: PromptVariableType.STRING,
        description: 'Required variable',
        required: true
      },
      {
        name: 'variable2',
        type: PromptVariableType.STRING,
        description: 'Optional variable',
        required: false
      }
    ];
    
    // Valid case: all required variables provided
    const validVariables = {
      variable1: 'value1',
      variable2: 'value2'
    };
    
    expect(validatePromptVariables(templateVariables, validVariables)).toBe(true);
    
    // Invalid case: missing required variable
    const invalidVariables = {
      variable2: 'value2'
    };
    
    expect(() => validatePromptVariables(templateVariables, invalidVariables))
      .toThrow(ValidationError);
  });
  
  it('validatePromptVariables should validate variable types', () => {
    const templateVariables = [
      {
        name: 'stringVar',
        type: PromptVariableType.STRING,
        description: 'String variable',
        required: true
      },
      {
        name: 'numberVar',
        type: PromptVariableType.NUMBER,
        description: 'Number variable',
        required: true
      },
      {
        name: 'booleanVar',
        type: PromptVariableType.BOOLEAN,
        description: 'Boolean variable',
        required: true
      },
      {
        name: 'arrayVar',
        type: PromptVariableType.ARRAY,
        description: 'Array variable',
        required: true
      },
      {
        name: 'objectVar',
        type: PromptVariableType.OBJECT,
        description: 'Object variable',
        required: true
      }
    ];
    
    // Valid case: correct types
    const validVariables = {
      stringVar: 'string value',
      numberVar: 42,
      booleanVar: true,
      arrayVar: [1, 2, 3],
      objectVar: { key: 'value' }
    };
    
    expect(validatePromptVariables(templateVariables, validVariables)).toBe(true);
    
    // Invalid case: incorrect types
    const invalidVariables = {
      stringVar: 42, // Should be string
      numberVar: 'not a number', // Should be number
      booleanVar: 'true', // Should be boolean
      arrayVar: { not: 'an array' }, // Should be array
      objectVar: [1, 2, 3] // Should be object
    };
    
    expect(() => validatePromptVariables(templateVariables, invalidVariables))
      .toThrow(ValidationError);
  });
  
  it('extractVariablesFromTemplate should find all variable placeholders', () => {
    const templateString = 'Hello {{name}}, your order #{{orderId}} for {{product.name}} is {{status}}.';
    
    const variables = extractVariablesFromTemplate(templateString);
    
    expect(variables).toContain('name');
    expect(variables).toContain('orderId');
    expect(variables).toContain('product');
    expect(variables).toContain('status');
    expect(variables.length).toBe(4);
  });
  
  it('createRenderedPrompt should create a valid RenderedPrompt object', () => {
    const template = createMockPromptTemplate();
    const renderedContent = 'This is rendered content';
    const variables = { variable1: 'value1', variable2: 'value2' };
    
    const result = createRenderedPrompt(template, renderedContent, variables);
    
    expect(result.templateId).toBe(template.id);
    expect(result.content).toBe(renderedContent);
    expect(result.category).toBe(template.category);
    expect(result.feature).toBe(template.feature);
    expect(result.variables).toEqual(variables);
    expect(result.tokenCount).toBeGreaterThan(0);
    expect(result.createdAt).toBeInstanceOf(Date);
  });
  
  it('optimizePromptForFeature should optimize prompts for specific features', () => {
    const baseContent = 'Suggest some activities for the group.';
    
    // Test optimization for different features
    const matchingResult = optimizePromptForFeature(baseContent, OrchestrationFeature.MATCHING);
    const engagementResult = optimizePromptForFeature(baseContent, OrchestrationFeature.ENGAGEMENT);
    
    expect(matchingResult).not.toBe(baseContent); // Should be modified
    expect(engagementResult).not.toBe(baseContent); // Should be modified
    expect(matchingResult).not.toBe(engagementResult); // Should be different for different features
  });
  
  it('validateTemplateVariablesMatch should validate template variables match placeholders', () => {
    // Valid case: variables match placeholders
    const validTemplate = createMockPromptTemplate({
      template: 'Hello {{variable1}}, welcome to {{variable2}}!',
      variables: [
        {
          name: 'variable1',
          type: PromptVariableType.STRING,
          description: 'First variable',
          required: true
        },
        {
          name: 'variable2',
          type: PromptVariableType.STRING,
          description: 'Second variable',
          required: true
        }
      ]
    });
    
    expect(validateTemplateVariablesMatch(validTemplate)).toBe(true);
    
    // Invalid case: missing variable definition for placeholder
    const invalidTemplate1 = createMockPromptTemplate({
      template: 'Hello {{variable1}}, welcome to {{variable2}} and {{variable3}}!',
      variables: [
        {
          name: 'variable1',
          type: PromptVariableType.STRING,
          description: 'First variable',
          required: true
        },
        {
          name: 'variable2',
          type: PromptVariableType.STRING,
          description: 'Second variable',
          required: true
        }
        // Missing variable3 definition
      ]
    });
    
    expect(() => validateTemplateVariablesMatch(invalidTemplate1))
      .toThrow(ValidationError);
    
    // Invalid case: unused variable definition
    const invalidTemplate2 = createMockPromptTemplate({
      template: 'Hello {{variable1}}!',
      variables: [
        {
          name: 'variable1',
          type: PromptVariableType.STRING,
          description: 'First variable',
          required: true
        },
        {
          name: 'unusedVariable',
          type: PromptVariableType.STRING,
          description: 'Unused variable',
          required: false
        }
      ]
    });
    
    expect(() => validateTemplateVariablesMatch(invalidTemplate2))
      .toThrow(ValidationError);
  });
  
  it('getDefaultPromptForFeature should return appropriate templates for features', () => {
    // Test for different features and categories
    const matchingSystemTemplate = getDefaultPromptForFeature(
      OrchestrationFeature.MATCHING,
      PromptCategory.SYSTEM
    );
    
    const engagementUserTemplate = getDefaultPromptForFeature(
      OrchestrationFeature.ENGAGEMENT,
      PromptCategory.USER
    );
    
    // Check basic properties
    expect(matchingSystemTemplate.feature).toBe(OrchestrationFeature.MATCHING);
    expect(matchingSystemTemplate.category).toBe(PromptCategory.SYSTEM);
    expect(matchingSystemTemplate.template).toContain('matchmaking'); // Should have feature-specific content
    
    expect(engagementUserTemplate.feature).toBe(OrchestrationFeature.ENGAGEMENT);
    expect(engagementUserTemplate.category).toBe(PromptCategory.USER);
    
    // Check that appropriate variables are defined
    const matchingVars = matchingSystemTemplate.variables;
    expect(matchingVars.some(v => v.name === 'userProfile')).toBe(true);
    expect(matchingVars.some(v => v.name === 'tribes')).toBe(true);
  });
});

describe('Prompt Validation Functions', () => {
  it('validatePromptTemplate should validate template structure', () => {
    // Valid template
    const validTemplate = createMockPromptTemplate();
    
    expect(validatePromptTemplate(validTemplate)).toBe(true);
    
    // Invalid template (missing required fields)
    const invalidTemplate = {
      ...validTemplate,
      name: '' // Empty name
    };
    
    expect(() => validatePromptTemplate(invalidTemplate))
      .toThrow(ValidationError);
  });
  
  it('validatePromptConfig should validate configuration structure', () => {
    // Valid configuration
    const validConfig = createMockPromptConfig();
    
    expect(validatePromptConfig(validConfig)).toBe(true);
    
    // Invalid configuration (missing required fields)
    const invalidConfig = {
      ...validConfig,
      systemPromptId: '' // Empty systemPromptId
    };
    
    expect(() => validatePromptConfig(invalidConfig))
      .toThrow(ValidationError);
  });
  
  it('validatePromptData should validate prompt data structure', () => {
    // Valid prompt data
    const validPromptData = createMockPromptData();
    
    // Mock validateFeatureSpecificVariables to pass validation
    jest.spyOn(require('../src/validations/prompt.validation'), 'validateFeatureSpecificVariables')
      .mockImplementation(() => true);
    
    expect(validatePromptData(validPromptData)).toBe(true);
    
    // Invalid prompt data (missing required fields)
    const invalidPromptData = {
      ...validPromptData,
      templateId: '' // Empty templateId
    };
    
    expect(() => validatePromptData(invalidPromptData))
      .toThrow(ValidationError);
  });
  
  it('validateRenderedPrompt should validate rendered prompt structure', () => {
    // Valid rendered prompt
    const validRenderedPrompt: RenderedPrompt = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      templateId: '123e4567-e89b-12d3-a456-426614174001',
      content: 'Rendered content',
      category: PromptCategory.SYSTEM,
      feature: OrchestrationFeature.MATCHING,
      variables: { test: 'value' },
      tokenCount: 10,
      createdAt: new Date()
    };
    
    expect(validateRenderedPrompt(validRenderedPrompt)).toBe(true);
    
    // Invalid rendered prompt (missing required fields)
    const invalidRenderedPrompt = {
      ...validRenderedPrompt,
      content: '' // Empty content
    };
    
    expect(() => validateRenderedPrompt(invalidRenderedPrompt))
      .toThrow(ValidationError);
  });
  
  it('validateFeatureSpecificVariables should validate feature-specific variables', () => {
    // Test for different features
    const featureTypes = [
      OrchestrationFeature.MATCHING,
      OrchestrationFeature.PERSONALITY_ANALYSIS,
      OrchestrationFeature.ENGAGEMENT,
      OrchestrationFeature.RECOMMENDATION,
      OrchestrationFeature.CONVERSATION
    ];
    
    // For each feature, create valid variables and test validation
    for (const feature of featureTypes) {
      const validVariables = createFeatureSpecificVariables(feature);
      
      // Mock the specific validation functions to return true
      for (const funcName of [
        'validateMatchingVariables',
        'validatePersonalityVariables',
        'validateEngagementVariables',
        'validateRecommendationVariables',
        'validateConversationVariables'
      ]) {
        jest.spyOn(require('../src/validations/prompt.validation'), funcName)
          .mockImplementation(() => true);
      }
      
      expect(validateFeatureSpecificVariables(feature, validVariables)).toBe(true);
    }
    
    // Test with invalid feature
    expect(() => validateFeatureSpecificVariables('invalid-feature' as OrchestrationFeature, {}))
      .toThrow(ValidationError);
  });
});