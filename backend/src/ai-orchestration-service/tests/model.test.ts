import { ModelService } from '../src/services/model.service';
import { OpenRouterIntegration } from '../src/integrations/openrouter.integration';
import { ModelConfig, ModelProvider, ModelCapability, ModelParameters } from '../src/models/model.model';
import { OrchestrationFeature } from '../src/models/orchestration.model';
import { checkModelCapability, validateModelParameters, mergeWithDefaultParameters } from '../src/utils/model.util';
import { ApiError } from '../../../shared/src/errors/api.error';
import { aiConfig } from '../src/config';

/**
 * Creates a mock ModelConfig object for testing
 *
 * @param overrides - Optional partial ModelConfig to override default values
 * @returns A complete mock ModelConfig
 */
function createMockModelConfig(overrides: Partial<ModelConfig> = {}): ModelConfig {
  return {
    id: 'test-model-1',
    name: 'Test Model',
    provider: ModelProvider.OPENAI,
    capabilities: [
      ModelCapability.TEXT_GENERATION,
      ModelCapability.CHAT_COMPLETION
    ],
    contextWindow: 4096,
    maxTokens: 2048,
    defaultParameters: {
      temperature: 0.7,
      maxTokens: 1024,
      topP: 0.9,
      presencePenalty: 0,
      frequencyPenalty: 0,
      stopSequences: []
    },
    active: true,
    description: 'Test model for unit testing',
    metadata: {},
    ...overrides
  };
}

/**
 * Creates an array of mock ModelConfig objects for testing
 *
 * @param count - Number of models to create
 * @returns Array of mock ModelConfig objects
 */
function createMockModelList(count: number): ModelConfig[] {
  const models: ModelConfig[] = [];
  
  for (let i = 0; i < count; i++) {
    // Create varied capabilities to test filtering
    const capabilities = [ModelCapability.TEXT_GENERATION];
    
    // Add additional capabilities for diversity
    if (i % 2 === 0) capabilities.push(ModelCapability.CHAT_COMPLETION);
    if (i % 3 === 0) capabilities.push(ModelCapability.FUNCTION_CALLING);
    if (i % 4 === 0) capabilities.push(ModelCapability.EMBEDDING);
    
    // Alternate providers
    const providerIndex = i % 3;
    const provider = [
      ModelProvider.OPENAI,
      ModelProvider.ANTHROPIC,
      ModelProvider.COHERE
    ][providerIndex];
    
    // Active status alternating
    const active = i % 5 !== 0;
    
    models.push(createMockModelConfig({
      id: `test-model-${i + 1}`,
      name: `Test Model ${i + 1}`,
      provider,
      capabilities,
      active
    }));
  }
  
  return models;
}

describe('ModelService', () => {
  let modelService: ModelService;
  let mockOpenRouterIntegration: jest.Mocked<OpenRouterIntegration>;
  let mockModels: ModelConfig[];

  beforeEach(() => {
    // Create mock models
    mockModels = createMockModelList(10);
    
    // Create mocked OpenRouterIntegration
    mockOpenRouterIntegration = {
      listAvailableModels: jest.fn(),
      checkHealth: jest.fn(),
      generateText: jest.fn(),
      generateChatCompletion: jest.fn(),
      generateEmbedding: jest.fn()
    } as unknown as jest.Mocked<OpenRouterIntegration>;
    
    // Setup the mock to return our test models
    mockOpenRouterIntegration.listAvailableModels.mockResolvedValue(mockModels);
    
    // Create ModelService with mocked dependencies
    modelService = new ModelService(mockOpenRouterIntegration);
  });

  it('should initialize with available models from OpenRouter', async () => {
    // Call initialize method
    await modelService.initialize();
    
    // Verify OpenRouter integration was called
    expect(mockOpenRouterIntegration.listAvailableModels).toHaveBeenCalledTimes(1);
    
    // Verify that the models were stored in the service
    const models = await modelService.getModels();
    expect(models.length).toBeGreaterThan(0);
    
    // Only active models should be in the result
    const activeModelsCount = mockModels.filter(m => m.active).length;
    expect(models.length).toBe(activeModelsCount);
  });

  it('should get a model by ID', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Get the first model from our mock list
    const expectedModel = mockModels[0];
    
    // Retrieve the model by ID
    const model = await modelService.getModel(expectedModel.id);
    
    // Verify the model is returned correctly
    expect(model).toBeDefined();
    expect(model.id).toBe(expectedModel.id);
    expect(model.name).toBe(expectedModel.name);
    expect(model.provider).toBe(expectedModel.provider);
  });

  it('should throw an error when getting a non-existent model', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Mock ApiError.notFound
    const mockNotFound = jest.spyOn(ApiError, 'notFound');
    
    // Attempt to retrieve a non-existent model
    await expect(modelService.getModel('non-existent-model'))
      .rejects.toThrow();
      
    // Verify that ApiError.notFound was called
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('should get all models', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Get all models
    const models = await modelService.getModels(false);
    
    // Verify the correct number of models is returned
    expect(models.length).toBe(mockModels.length);
  });

  it('should get only active models when activeOnly is true', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Get only active models
    const models = await modelService.getModels(true);
    
    // Verify only active models are returned
    const activeCount = mockModels.filter(m => m.active).length;
    expect(models.length).toBe(activeCount);
    expect(models.every(m => m.active)).toBe(true);
  });

  it('should get models by provider', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Get models for a specific provider
    const provider = ModelProvider.OPENAI;
    const models = await modelService.getModelsByProvider(provider);
    
    // Verify only models from that provider are returned
    const expectedCount = mockModels.filter(m => m.provider === provider && m.active).length;
    expect(models.length).toBe(expectedCount);
    expect(models.every(m => m.provider === provider)).toBe(true);
  });

  it('should get models by capability', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Get models with specific capabilities
    const capabilities = [ModelCapability.FUNCTION_CALLING];
    const models = await modelService.getModelsByCapability(capabilities);
    
    // Verify only models with those capabilities are returned
    const expectedCount = mockModels.filter(m => 
      m.active && m.capabilities.includes(ModelCapability.FUNCTION_CALLING)
    ).length;
    
    expect(models.length).toBe(expectedCount);
    expect(models.every(m => 
      m.capabilities.includes(ModelCapability.FUNCTION_CALLING)
    )).toBe(true);
  });

  it('should get the appropriate model for a feature', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Get a model for a specific feature
    const feature = OrchestrationFeature.MATCHING;
    const model = await modelService.getModelForFeature(feature);
    
    // Verify a model with appropriate capabilities is returned
    expect(model).toBeDefined();
    expect(model.active).toBe(true);
    
    // The model should have the required capabilities for the feature
    const requiredCapabilities = modelService['featureCapabilityMap'].get(feature) || [];
    expect(requiredCapabilities.length).toBeGreaterThan(0);
    
    // Check that the model has all required capabilities
    for (const capability of requiredCapabilities) {
      expect(model.capabilities).toContain(capability);
    }
  });

  it('should use preferred model for feature if it has required capabilities', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Find a model that has the capabilities required for matching
    const preferredModel = mockModels.find(m => 
      m.active && 
      m.capabilities.includes(ModelCapability.TEXT_GENERATION) &&
      m.capabilities.includes(ModelCapability.CHAT_COMPLETION) &&
      m.capabilities.includes(ModelCapability.FUNCTION_CALLING)
    );
    
    if (!preferredModel) {
      // Skip this test if no suitable model exists in our mock data
      console.log('Skipping test: no suitable preferred model in test data');
      return;
    }
    
    // Get a model for the feature with preferred model ID
    const feature = OrchestrationFeature.MATCHING;
    const model = await modelService.getModelForFeature(feature, preferredModel.id);
    
    // Verify the preferred model is returned
    expect(model).toBeDefined();
    expect(model.id).toBe(preferredModel.id);
  });

  it('should fall back to another model if preferred model lacks capabilities', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Find a model that does NOT have the capabilities required for matching
    const preferredModel = mockModels.find(m => 
      m.active && 
      !m.capabilities.includes(ModelCapability.FUNCTION_CALLING)
    );
    
    if (!preferredModel) {
      // Skip this test if no suitable model exists in our mock data
      console.log('Skipping test: no suitable model for fallback test');
      return;
    }
    
    // Get a model for the feature with preferred model ID
    const feature = OrchestrationFeature.MATCHING;
    const model = await modelService.getModelForFeature(feature, preferredModel.id);
    
    // Verify a different model is returned
    expect(model).toBeDefined();
    expect(model.id).not.toBe(preferredModel.id);
    
    // The returned model should have the required capabilities
    const requiredCapabilities = modelService['featureCapabilityMap'].get(feature) || [];
    for (const capability of requiredCapabilities) {
      expect(model.capabilities).toContain(capability);
    }
  });

  it('should validate model existence', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Get the first model from our mock list
    const existingModel = mockModels[0];
    
    // Test validation for an existing model
    const result = await modelService.validateModelExists(existingModel.id);
    expect(result).toBe(true);
    
    // Test validation for a non-existent model
    await expect(modelService.validateModelExists('non-existent-model'))
      .rejects.toThrow();
  });

  it('should validate model capabilities', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Find a model with text generation capability
    const model = mockModels.find(m => 
      m.capabilities.includes(ModelCapability.TEXT_GENERATION)
    );
    
    if (!model) {
      console.log('Skipping test: no model with text generation capability');
      return;
    }
    
    // Test validation for capabilities the model has
    const result = await modelService.validateModelCapability(
      model.id, 
      [ModelCapability.TEXT_GENERATION]
    );
    expect(result).toBe(true);
    
    // Test validation for capabilities the model doesn't have
    const missingCapability = Object.values(ModelCapability)
      .find(cap => !model.capabilities.includes(cap));
      
    if (missingCapability) {
      await expect(modelService.validateModelCapability(
        model.id, 
        [missingCapability]
      )).rejects.toThrow();
    }
  });

  it('should validate and prepare model parameters', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Get the first model from our mock list
    const model = mockModels[0];
    
    // Valid parameters
    const validParameters: ModelParameters = {
      temperature: 0.5,
      maxTokens: 100,
      topP: 0.8,
      presencePenalty: 0.2,
      frequencyPenalty: 0.2,
      stopSequences: ['END']
    };
    
    // Test validation with valid parameters
    const result = await modelService.validateAndPrepareParameters(model.id, validParameters);
    expect(result).toBeDefined();
    expect(result.temperature).toBe(validParameters.temperature);
    
    // Invalid parameters
    const invalidParameters = {
      temperature: 2.0, // Invalid: should be between 0 and 1
      maxTokens: 100,
      topP: 0.8,
      presencePenalty: 0.2,
      frequencyPenalty: 0.2,
      stopSequences: ['END']
    };
    
    // Test validation with invalid parameters
    await expect(modelService.validateAndPrepareParameters(model.id, invalidParameters as any))
      .rejects.toThrow();
  });

  it('should refresh models from OpenRouter', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Create new mock models for refresh
    const updatedMockModels = createMockModelList(5);
    mockOpenRouterIntegration.listAvailableModels.mockResolvedValue(updatedMockModels);
    
    // Refresh models
    const refreshedModels = await modelService.refreshModels();
    
    // Verify OpenRouter integration was called again
    expect(mockOpenRouterIntegration.listAvailableModels).toHaveBeenCalledTimes(2);
    
    // Verify that the models were updated
    const activeModelsCount = updatedMockModels.filter(m => m.active).length;
    expect(refreshedModels.size).toBe(activeModelsCount);
    
    // Get models through the regular method to verify consistency
    const models = await modelService.getModels();
    expect(models.length).toBe(activeModelsCount);
  });

  it('should clear the model cache', async () => {
    // Initialize the service
    await modelService.initialize();
    
    // Get a model to cache it
    const model = mockModels[0];
    await modelService.getModel(model.id);
    
    // Spy on the cache's flushAll method
    const flushAllSpy = jest.spyOn(modelService['modelCache'], 'flushAll');
    
    // Clear the cache
    modelService.clearCache();
    
    // Verify the cache was cleared
    expect(flushAllSpy).toHaveBeenCalled();
  });

  it('should report health status correctly', async () => {
    // Before initialization, health should be false
    expect(await modelService.getHealth()).toBe(false);
    
    // Initialize the service
    await modelService.initialize();
    
    // After initialization, health should be true
    expect(await modelService.getHealth()).toBe(true);
    
    // Create a service with no models to test unhealthy state
    mockOpenRouterIntegration.listAvailableModels.mockResolvedValue([]);
    const emptyService = new ModelService(mockOpenRouterIntegration);
    await emptyService.initialize();
    
    // With no models, health should be false
    expect(await emptyService.getHealth()).toBe(false);
  });
});

describe('Model Utility Functions', () => {
  it('checkModelCapability should correctly verify model capabilities', () => {
    // Create a mock model with specific capabilities
    const model = createMockModelConfig({
      capabilities: [
        ModelCapability.TEXT_GENERATION,
        ModelCapability.CHAT_COMPLETION
      ]
    });
    
    // Check for capabilities the model has
    expect(checkModelCapability(model, [ModelCapability.TEXT_GENERATION])).toBe(true);
    expect(checkModelCapability(model, [
      ModelCapability.TEXT_GENERATION,
      ModelCapability.CHAT_COMPLETION
    ])).toBe(true);
    
    // Check for capabilities the model doesn't have
    expect(checkModelCapability(model, [ModelCapability.EMBEDDING])).toBe(false);
    expect(checkModelCapability(model, [
      ModelCapability.TEXT_GENERATION,
      ModelCapability.FUNCTION_CALLING
    ])).toBe(false);
    
    // Check with empty capabilities array (should return true)
    expect(checkModelCapability(model, [])).toBe(true);
  });

  it('validateModelParameters should validate parameters correctly', () => {
    // Valid parameters
    const validParams: ModelParameters = {
      temperature: 0.7,
      maxTokens: 100,
      topP: 0.9,
      presencePenalty: 0,
      frequencyPenalty: 0,
      stopSequences: []
    };
    
    // Test validation with valid parameters
    expect(validateModelParameters(validParams)).toEqual(validParams);
    
    // Invalid parameters - temperature out of range
    const invalidTemp = { ...validParams, temperature: 1.5 };
    expect(() => validateModelParameters(invalidTemp)).toThrow();
    
    // Invalid parameters - negative max tokens
    const invalidTokens = { ...validParams, maxTokens: -10 };
    expect(() => validateModelParameters(invalidTokens)).toThrow();
    
    // Invalid parameters - topP out of range
    const invalidTopP = { ...validParams, topP: 2.0 };
    expect(() => validateModelParameters(invalidTopP)).toThrow();
    
    // Invalid parameters - presence penalty out of range
    const invalidPresencePenalty = { ...validParams, presencePenalty: 3.0 };
    expect(() => validateModelParameters(invalidPresencePenalty)).toThrow();
    
    // Invalid parameters - frequency penalty out of range
    const invalidFrequencyPenalty = { ...validParams, frequencyPenalty: -3.0 };
    expect(() => validateModelParameters(invalidFrequencyPenalty)).toThrow();
  });

  it('mergeWithDefaultParameters should merge parameters correctly', () => {
    // Default parameters
    const defaultParams: ModelParameters = {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      presencePenalty: 0,
      frequencyPenalty: 0,
      stopSequences: ['DEFAULT_STOP']
    };
    
    // User parameters
    const userParams: Partial<ModelParameters> = {
      temperature: 0.5,
      maxTokens: 1000,
      stopSequences: ['USER_STOP']
    };
    
    // Merge parameters
    const merged = mergeWithDefaultParameters(userParams, defaultParams);
    
    // Verify user parameters override defaults
    expect(merged.temperature).toBe(userParams.temperature);
    expect(merged.maxTokens).toBe(userParams.maxTokens);
    expect(merged.stopSequences).toEqual(userParams.stopSequences);
    
    // Verify defaults are used where user didn't specify
    expect(merged.topP).toBe(defaultParams.topP);
    expect(merged.presencePenalty).toBe(defaultParams.presencePenalty);
    expect(merged.frequencyPenalty).toBe(defaultParams.frequencyPenalty);
  });
});