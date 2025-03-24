import { ModelConfig, ModelParameters, ModelCapability } from '../models/model.model';
import { OrchestrationFeature } from '../models/orchestration.model';
import { logger } from '../config';
import { ApiError } from '../../shared/src/errors/api.error';
import * as z from 'zod'; // v3.21.4

/**
 * Checks if a model has the required capabilities
 * 
 * @param model - The model configuration to check
 * @param requiredCapabilities - Array of capabilities that the model must have
 * @returns True if the model has all required capabilities, false otherwise
 */
export function checkModelCapability(
  model: ModelConfig,
  requiredCapabilities: ModelCapability[]
): boolean {
  if (!model || !model.capabilities) {
    logger.warn('Invalid model configuration provided to checkModelCapability');
    return false;
  }

  // If no capabilities are required, any model is fine
  if (!requiredCapabilities || requiredCapabilities.length === 0) {
    return true;
  }

  // Check if the model has all required capabilities
  return requiredCapabilities.every(capability => 
    model.capabilities.includes(capability)
  );
}

/**
 * Selects the most appropriate model for a specific orchestration feature
 * 
 * @param availableModels - Array of available models to choose from
 * @param feature - The orchestration feature the model will be used for
 * @param requiredCapabilities - Optional array of specific capabilities required
 * @returns The best model for the feature or null if no suitable model found
 */
export function selectModelForFeature(
  availableModels: ModelConfig[],
  feature: OrchestrationFeature,
  requiredCapabilities?: ModelCapability[]
): ModelConfig | null {
  if (!availableModels || availableModels.length === 0) {
    logger.warn('No models provided to selectModelForFeature');
    return null;
  }

  if (!feature) {
    logger.warn('No feature specified for model selection');
    return null;
  }

  // Determine required capabilities based on feature if not provided
  let capabilities = requiredCapabilities;
  if (!capabilities || capabilities.length === 0) {
    capabilities = getRequiredCapabilitiesForFeature(feature);
  }

  // Filter models to those with required capabilities
  const compatibleModels = availableModels.filter(model => 
    model.active && checkModelCapability(model, capabilities!)
  );

  if (compatibleModels.length === 0) {
    logger.warn(`No compatible models found for feature ${feature}`);
    return null;
  }

  // Sort models by suitability for the feature
  const sortedModels = sortModelsByFeatureSuitability(compatibleModels, feature);
  
  return sortedModels[0];
}

/**
 * Returns the required capabilities for a specific feature
 * 
 * @param feature - The orchestration feature
 * @returns Array of required capabilities for the feature
 */
function getRequiredCapabilitiesForFeature(feature: OrchestrationFeature): ModelCapability[] {
  switch (feature) {
    case OrchestrationFeature.MATCHING:
      return [
        ModelCapability.TEXT_GENERATION,
        ModelCapability.CHAT_COMPLETION,
        ModelCapability.FUNCTION_CALLING // For structured matching outputs
      ];
    case OrchestrationFeature.PERSONALITY_ANALYSIS:
      return [
        ModelCapability.TEXT_GENERATION,
        ModelCapability.CHAT_COMPLETION,
        ModelCapability.FUNCTION_CALLING // For structured trait analysis
      ];
    case OrchestrationFeature.ENGAGEMENT:
      return [
        ModelCapability.TEXT_GENERATION,
        ModelCapability.CHAT_COMPLETION
      ];
    case OrchestrationFeature.RECOMMENDATION:
      return [
        ModelCapability.TEXT_GENERATION,
        ModelCapability.CHAT_COMPLETION,
        ModelCapability.FUNCTION_CALLING // For structured recommendations
      ];
    case OrchestrationFeature.CONVERSATION:
      return [
        ModelCapability.TEXT_GENERATION,
        ModelCapability.CHAT_COMPLETION
      ];
    default:
      logger.warn(`Unknown feature: ${feature}, using default capabilities`);
      return [ModelCapability.TEXT_GENERATION];
  }
}

/**
 * Sorts models by their suitability for a specific feature
 * 
 * @param models - Array of compatible models
 * @param feature - The orchestration feature
 * @returns Sorted array of models with the most suitable first
 */
function sortModelsByFeatureSuitability(
  models: ModelConfig[],
  feature: OrchestrationFeature
): ModelConfig[] {
  return models.sort((a, b) => {
    // First prioritize models that have all required capabilities
    const aCapabilities = getRequiredCapabilitiesForFeature(feature).filter(cap => 
      a.capabilities.includes(cap)
    ).length;
    const bCapabilities = getRequiredCapabilitiesForFeature(feature).filter(cap => 
      b.capabilities.includes(cap)
    ).length;
    
    if (aCapabilities !== bCapabilities) {
      return bCapabilities - aCapabilities;
    }
    
    // Then prioritize by context window size (larger is better for complex tasks)
    if (a.contextWindow !== b.contextWindow) {
      return b.contextWindow - a.contextWindow;
    }
    
    // Then by maximum tokens (larger is better for output)
    if (a.maxTokens !== b.maxTokens) {
      return b.maxTokens - a.maxTokens;
    }
    
    // As a last resort, use model name alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Validates model parameters against schema and constraints
 * 
 * @param parameters - The parameters to validate
 * @returns Validated parameters object
 * @throws ApiError if validation fails
 */
export function validateModelParameters(parameters: ModelParameters): ModelParameters {
  // Define schema for model parameters with appropriate constraints
  const modelParametersSchema = z.object({
    temperature: z.number().min(0).max(1),
    maxTokens: z.number().int().positive(),
    topP: z.number().min(0).max(1),
    presencePenalty: z.number().min(-2).max(2),
    frequencyPenalty: z.number().min(-2).max(2),
    stopSequences: z.array(z.string())
  });

  try {
    // Validate parameters against schema
    return modelParametersSchema.parse(parameters);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      logger.error(`Parameter validation failed: ${errorDetails}`);
      throw ApiError.badRequest(`Parameter validation failed: ${errorDetails}`);
    }
    logger.error('Invalid model parameters', error as Error);
    throw ApiError.badRequest('Invalid model parameters');
  }
}

/**
 * Merges user-provided parameters with model default parameters
 * 
 * @param userParameters - Parameters provided by the user
 * @param defaultParameters - Default parameters for the model
 * @returns Merged and validated parameters
 */
export function mergeWithDefaultParameters(
  userParameters: Partial<ModelParameters>, 
  defaultParameters: ModelParameters
): ModelParameters {
  // Start with default parameters
  const mergedParams: ModelParameters = {
    temperature: defaultParameters.temperature,
    maxTokens: defaultParameters.maxTokens,
    topP: defaultParameters.topP,
    presencePenalty: defaultParameters.presencePenalty,
    frequencyPenalty: defaultParameters.frequencyPenalty,
    stopSequences: [...defaultParameters.stopSequences],
  };

  // Override with user parameters where provided
  if (userParameters.temperature !== undefined) mergedParams.temperature = userParameters.temperature;
  if (userParameters.maxTokens !== undefined) mergedParams.maxTokens = userParameters.maxTokens;
  if (userParameters.topP !== undefined) mergedParams.topP = userParameters.topP;
  if (userParameters.presencePenalty !== undefined) mergedParams.presencePenalty = userParameters.presencePenalty;
  if (userParameters.frequencyPenalty !== undefined) mergedParams.frequencyPenalty = userParameters.frequencyPenalty;
  if (userParameters.stopSequences !== undefined) mergedParams.stopSequences = [...userParameters.stopSequences];

  // Validate the merged parameters
  return validateModelParameters(mergedParams);
}

/**
 * Estimates the number of tokens in a text string
 * 
 * This is a simple approximation based on the average token size
 * for English text. For more accurate results, a proper tokenizer 
 * should be used.
 * 
 * @param text - The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  
  // Basic approximation: 1 token is roughly 4 characters in English
  // This is a rough estimate - proper tokenizers would be more accurate
  const characterCount = text.length;
  
  // Count words (as tokens are often aligned with word boundaries)
  const wordCount = text.split(/\s+/).length;
  
  // Handle special cases that typically use more tokens
  // Code blocks, lists, tables, etc.
  let specialTokens = 0;
  
  // Code blocks often use more tokens due to special characters
  const codeBlockMatches = text.match(/```[\s\S]*?```/g);
  if (codeBlockMatches) {
    codeBlockMatches.forEach(block => {
      // Code has more special characters, which often become separate tokens
      specialTokens += Math.ceil(block.length / 3);
    });
  }
  
  // Lists often have special tokens for bullets
  const listItemCount = (text.match(/^[-*+]\s.+$/gm) || []).length;
  specialTokens += listItemCount;
  
  // Tables often have many special characters
  const tableRowCount = (text.match(/^\|.+\|$/gm) || []).length;
  specialTokens += tableRowCount * 2;
  
  // Estimate based on character count and word boundaries
  // This formula is a simplified approximation
  const baseEstimate = Math.max(
    Math.ceil(characterCount / 4),
    wordCount
  );
  
  return baseEstimate + specialTokens;
}

/**
 * Calculates the optimal maximum tokens for a response based on 
 * input length and model context window
 * 
 * @param inputTokens - Number of tokens in the input
 * @param contextWindow - Maximum context window size of the model
 * @param defaultMaxTokens - Default maximum tokens setting
 * @returns Optimal maximum tokens for the response
 */
export function getOptimalMaxTokens(
  inputTokens: number,
  contextWindow: number,
  defaultMaxTokens: number
): number {
  // Calculate available tokens
  const availableTokens = contextWindow - inputTokens;
  
  // Apply a safety margin to avoid context window overflow
  // Reserve 50 tokens or 5% of context window, whichever is larger
  const safetyMargin = Math.max(50, Math.floor(contextWindow * 0.05));
  const safeAvailableTokens = Math.max(0, availableTokens - safetyMargin);
  
  // Return the smaller of available tokens or default max tokens
  // Ensure we return at least 50 tokens if possible
  return Math.max(
    Math.min(safeAvailableTokens, defaultMaxTokens),
    Math.min(50, availableTokens) // Minimum of 50 tokens or all available tokens
  );
}

/**
 * Returns optimized model parameters for a specific orchestration feature
 * 
 * @param feature - The orchestration feature
 * @param baseParameters - Base parameters to adjust
 * @returns Feature-optimized parameters
 */
export function getFeatureSpecificParameters(
  feature: OrchestrationFeature,
  baseParameters: ModelParameters
): ModelParameters {
  // Create a copy of the base parameters
  const params: ModelParameters = {
    temperature: baseParameters.temperature,
    maxTokens: baseParameters.maxTokens,
    topP: baseParameters.topP,
    presencePenalty: baseParameters.presencePenalty,
    frequencyPenalty: baseParameters.frequencyPenalty,
    stopSequences: [...baseParameters.stopSequences],
  };
  
  // Apply feature-specific adjustments
  switch (feature) {
    case OrchestrationFeature.MATCHING:
      // For matching, we want a balance of creativity and determinism
      // to ensure consistent but insightful compatibility analysis
      params.temperature = 0.7;
      params.topP = 0.9;
      params.frequencyPenalty = 0.5; // Reduce repetition for varied analysis
      break;
      
    case OrchestrationFeature.PERSONALITY_ANALYSIS:
      // For personality analysis, we want more deterministic outputs
      // for consistent trait identification
      params.temperature = 0.4;
      params.topP = 0.85;
      params.frequencyPenalty = 0.3;
      break;
      
    case OrchestrationFeature.ENGAGEMENT:
      // For engagement, we want more creative and varied outputs
      // to generate interesting conversation prompts and challenges
      params.temperature = 0.8;
      params.topP = 0.95;
      params.frequencyPenalty = 0.7; // Higher penalty for more varied suggestions
      params.presencePenalty = 0.7; // Encourage novel topics
      break;
      
    case OrchestrationFeature.RECOMMENDATION:
      // For recommendations, we want relevance with some variety
      params.temperature = 0.6;
      params.topP = 0.9;
      params.frequencyPenalty = 0.5;
      break;
      
    case OrchestrationFeature.CONVERSATION:
      // For conversation assistance, we want natural, context-aware replies
      params.temperature = 0.7;
      params.topP = 0.9;
      params.frequencyPenalty = 0.5;
      params.presencePenalty = 0.3;
      break;
      
    default:
      // Use base parameters for unknown features
      logger.warn(`No specific parameters for feature: ${feature}, using defaults`);
  }
  
  return params;
}