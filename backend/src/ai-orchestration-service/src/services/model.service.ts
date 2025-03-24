import { 
  ModelConfig, 
  ModelCapability, 
  ModelParameters, 
  ModelProvider
} from '../models/model.model';
import { OrchestrationFeature } from '../models/orchestration.model';
import { OpenRouterIntegration } from '../integrations/openrouter.integration';
import { 
  checkModelCapability, 
  selectModelForFeature,
  validateModelParameters,
  mergeWithDefaultParameters
} from '../utils/model.util';
import { aiConfig } from '../config';
import { logger } from '../../../config/logging';
import { ApiError } from '../../../shared/src/errors/api.error';
import NodeCache from 'node-cache';

/**
 * Service for managing AI model configurations, selection, and validation
 */
export class ModelService {
  private openRouterIntegration: OpenRouterIntegration;
  private modelCache: NodeCache;
  private models: Map<string, ModelConfig>;
  private featureCapabilityMap: Map<OrchestrationFeature, ModelCapability[]>;
  private initialized: boolean;

  /**
   * Initialize the model service with OpenRouter integration
   * 
   * @param openRouterIntegration - OpenRouter integration instance
   */
  constructor(openRouterIntegration: OpenRouterIntegration) {
    this.openRouterIntegration = openRouterIntegration;
    this.modelCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
    this.models = new Map<string, ModelConfig>();
    this.featureCapabilityMap = new Map<OrchestrationFeature, ModelCapability[]>();
    this.initialized = false;

    // Initialize feature capability map
    this.featureCapabilityMap.set(OrchestrationFeature.MATCHING, [
      ModelCapability.TEXT_GENERATION,
      ModelCapability.CHAT_COMPLETION,
      ModelCapability.FUNCTION_CALLING
    ]);
    this.featureCapabilityMap.set(OrchestrationFeature.PERSONALITY_ANALYSIS, [
      ModelCapability.TEXT_GENERATION,
      ModelCapability.CHAT_COMPLETION,
      ModelCapability.FUNCTION_CALLING
    ]);
    this.featureCapabilityMap.set(OrchestrationFeature.ENGAGEMENT, [
      ModelCapability.TEXT_GENERATION,
      ModelCapability.CHAT_COMPLETION
    ]);
    this.featureCapabilityMap.set(OrchestrationFeature.RECOMMENDATION, [
      ModelCapability.TEXT_GENERATION,
      ModelCapability.CHAT_COMPLETION,
      ModelCapability.FUNCTION_CALLING
    ]);
    this.featureCapabilityMap.set(OrchestrationFeature.CONVERSATION, [
      ModelCapability.TEXT_GENERATION,
      ModelCapability.CHAT_COMPLETION
    ]);
  }

  /**
   * Initialize the model service by loading available models
   * 
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug('Model service already initialized');
      return;
    }

    logger.info('Initializing model service');
    try {
      const availableModels = await this.openRouterIntegration.listAvailableModels();
      
      // Filter for active models and add to models map
      for (const model of availableModels) {
        if (model.active) {
          this.models.set(model.id, model);
          this.modelCache.set(model.id, model);
        }
      }
      
      logger.info(`Model service initialized with ${this.models.size} active models`);
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize model service', error as Error);
      throw new ApiError(
        'Failed to initialize model service',
        'AI_SERVICE_ERROR',
        500,
        { error: (error as Error).message }
      );
    }
  }

  /**
   * Refresh the available models from the OpenRouter API
   * 
   * @returns Updated map of available models
   */
  async refreshModels(): Promise<Map<string, ModelConfig>> {
    logger.info('Refreshing models from OpenRouter API');
    try {
      const availableModels = await this.openRouterIntegration.listAvailableModels();
      
      // Clear existing models and cache
      this.models.clear();
      this.modelCache.flushAll();
      
      // Filter for active models and add to models map
      for (const model of availableModels) {
        if (model.active) {
          this.models.set(model.id, model);
          this.modelCache.set(model.id, model);
        }
      }
      
      logger.info(`Models refreshed successfully, ${this.models.size} active models available`);
      return this.models;
    } catch (error) {
      logger.error('Failed to refresh models', error as Error);
      throw new ApiError(
        'Failed to refresh models from AI service',
        'AI_SERVICE_ERROR',
        500,
        { error: (error as Error).message }
      );
    }
  }

  /**
   * Retrieve a model configuration by ID
   * 
   * @param modelId - The ID of the model to retrieve
   * @returns The model configuration
   */
  async getModel(modelId: string): Promise<ModelConfig> {
    await this.ensureInitialized();
    
    try {
      // Check cache first
      const cachedModel = this.modelCache.get<ModelConfig>(modelId);
      if (cachedModel) {
        return cachedModel;
      }
      
      // If not in cache, check models map
      const model = this.models.get(modelId);
      if (!model) {
        throw ApiError.notFound(`Model with ID '${modelId}' not found`);
      }
      
      // Add to cache and return
      this.modelCache.set(modelId, model);
      return model;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Error retrieving model ${modelId}`, error as Error);
      throw ApiError.notFound(`Model with ID '${modelId}' not found`);
    }
  }

  /**
   * Retrieve all available models
   * 
   * @param activeOnly - If true, return only active models
   * @returns Array of model configurations
   */
  async getModels(activeOnly: boolean = true): Promise<ModelConfig[]> {
    await this.ensureInitialized();
    
    try {
      const modelArray = Array.from(this.models.values());
      if (activeOnly) {
        return modelArray.filter(model => model.active);
      }
      return modelArray;
    } catch (error) {
      logger.error('Error retrieving models', error as Error);
      throw new ApiError(
        'Failed to retrieve models',
        'INTERNAL_SERVER_ERROR',
        500,
        { error: (error as Error).message }
      );
    }
  }

  /**
   * Retrieve models from a specific provider
   * 
   * @param provider - The provider to filter by
   * @param activeOnly - If true, return only active models
   * @returns Array of model configurations from the provider
   */
  async getModelsByProvider(provider: ModelProvider, activeOnly: boolean = true): Promise<ModelConfig[]> {
    await this.ensureInitialized();
    
    try {
      const allModels = await this.getModels(activeOnly);
      return allModels.filter(model => model.provider === provider);
    } catch (error) {
      logger.error(`Error retrieving models for provider ${provider}`, error as Error);
      throw new ApiError(
        `Failed to retrieve models for provider ${provider}`,
        'INTERNAL_SERVER_ERROR',
        500,
        { error: (error as Error).message }
      );
    }
  }

  /**
   * Retrieve models with specific capabilities
   * 
   * @param capabilities - Array of capabilities that models must have
   * @param activeOnly - If true, return only active models
   * @returns Array of model configurations with the capabilities
   */
  async getModelsByCapability(capabilities: ModelCapability[], activeOnly: boolean = true): Promise<ModelConfig[]> {
    await this.ensureInitialized();
    
    try {
      const allModels = await this.getModels(activeOnly);
      return allModels.filter(model => 
        checkModelCapability(model, capabilities)
      );
    } catch (error) {
      const capabilitiesStr = capabilities.join(', ');
      logger.error(`Error retrieving models with capabilities: ${capabilitiesStr}`, error as Error);
      throw new ApiError(
        `Failed to retrieve models with capabilities: ${capabilitiesStr}`,
        'INTERNAL_SERVER_ERROR',
        500,
        { error: (error as Error).message }
      );
    }
  }

  /**
   * Get the most appropriate model for a specific feature
   * 
   * @param feature - The orchestration feature to get a model for
   * @param preferredModelId - Optional preferred model ID
   * @returns The selected model configuration
   */
  async getModelForFeature(feature: OrchestrationFeature, preferredModelId?: string): Promise<ModelConfig> {
    await this.ensureInitialized();
    
    try {
      // If preferred model ID is provided, try to use it
      if (preferredModelId) {
        try {
          const preferredModel = await this.getModel(preferredModelId);
          const requiredCapabilities = this.getRequiredCapabilitiesForFeature(feature);
          
          // Check if preferred model has required capabilities
          if (preferredModel.active && checkModelCapability(preferredModel, requiredCapabilities)) {
            return preferredModel;
          }
          logger.warn(`Preferred model ${preferredModelId} does not have required capabilities for ${feature}`);
        } catch (error) {
          logger.warn(`Preferred model ${preferredModelId} not found, falling back to automatic selection`);
        }
      }
      
      // Get required capabilities for the feature
      const requiredCapabilities = this.getRequiredCapabilitiesForFeature(feature);
      
      // Get active models with required capabilities
      const compatibleModels = await this.getModelsByCapability(requiredCapabilities, true);
      
      if (compatibleModels.length === 0) {
        logger.warn(`No models with required capabilities for feature ${feature} found`);
        
        // Try to use default model from config
        const defaultModelId = aiConfig.defaultModels[feature] || aiConfig.defaultModels[ModelCapability.CHAT_COMPLETION];
        if (defaultModelId) {
          try {
            return await this.getModel(defaultModelId);
          } catch (error) {
            logger.error(`Default model ${defaultModelId} not found`, error as Error);
          }
        }
        
        throw ApiError.badRequest(`No suitable model available for feature ${feature}`);
      }
      
      // Use utility function to select best model
      const selectedModel = selectModelForFeature(compatibleModels, feature, requiredCapabilities);
      if (!selectedModel) {
        throw ApiError.badRequest(`Failed to select model for feature ${feature}`);
      }
      
      return selectedModel;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Error selecting model for feature ${feature}`, error as Error);
      throw new ApiError(
        `Failed to select model for feature ${feature}`,
        'MODEL_SELECTION_ERROR',
        500,
        { error: (error as Error).message }
      );
    }
  }

  /**
   * Validate that a model with the given ID exists
   * 
   * @param modelId - The ID of the model to validate
   * @returns True if model exists, throws error otherwise
   */
  async validateModelExists(modelId: string): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      await this.getModel(modelId);
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.notFound(`Model with ID '${modelId}' not found`);
    }
  }

  /**
   * Validate that a model has the required capabilities
   * 
   * @param modelId - The ID of the model to validate
   * @param requiredCapabilities - Array of required capabilities
   * @returns True if model has capabilities, throws error otherwise
   */
  async validateModelCapability(modelId: string, requiredCapabilities: ModelCapability[]): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      const model = await this.getModel(modelId);
      if (!checkModelCapability(model, requiredCapabilities)) {
        const missingCapabilities = requiredCapabilities.filter(
          capability => !model.capabilities.includes(capability)
        );
        throw ApiError.badRequest(
          `Model ${modelId} does not have required capabilities: ${missingCapabilities.join(', ')}`
        );
      }
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Error validating capabilities for model ${modelId}`, error as Error);
      throw ApiError.badRequest(`Failed to validate capabilities for model ${modelId}`);
    }
  }

  /**
   * Validate and prepare model parameters for use
   * 
   * @param modelId - The ID of the model to validate parameters for
   * @param userParameters - Parameters provided by the user
   * @returns Validated and prepared parameters
   */
  async validateAndPrepareParameters(modelId: string, userParameters: ModelParameters): Promise<ModelParameters> {
    await this.ensureInitialized();
    
    try {
      const model = await this.getModel(modelId);
      const defaultParameters = model.defaultParameters;
      
      // Merge user parameters with default parameters
      const mergedParameters = mergeWithDefaultParameters(userParameters, defaultParameters);
      
      // Validate merged parameters
      const validatedParameters = validateModelParameters(mergedParameters);
      
      return validatedParameters;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Error validating parameters for model ${modelId}`, error as Error);
      throw new ApiError(
        `Failed to validate parameters for model ${modelId}`,
        'VALIDATION_ERROR',
        400,
        { error: (error as Error).message }
      );
    }
  }

  /**
   * Get the required capabilities for a specific feature
   * 
   * @param feature - The orchestration feature
   * @returns Array of required capabilities
   */
  getRequiredCapabilitiesForFeature(feature: OrchestrationFeature): ModelCapability[] {
    const capabilities = this.featureCapabilityMap.get(feature);
    return capabilities || [];
  }

  /**
   * Ensure the service is initialized before use
   * 
   * @returns Promise that resolves when initialization is confirmed
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Clear the model cache
   */
  clearCache(): void {
    try {
      this.modelCache.flushAll();
      logger.debug('Model cache cleared');
    } catch (error) {
      logger.error('Error clearing model cache', error as Error);
    }
  }

  /**
   * Get the health status of the model service
   * 
   * @returns True if service is healthy
   */
  async getHealth(): Promise<boolean> {
    try {
      return this.initialized && this.models.size > 0;
    } catch (error) {
      logger.error('Error checking model service health', error as Error);
      return false;
    }
  }
}