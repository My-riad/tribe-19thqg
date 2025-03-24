/**
 * AI Orchestration Service Configuration
 * 
 * This module centralizes configuration settings for the AI Orchestration Service,
 * extending the base application configuration with AI-specific settings and metrics.
 * It provides a single entry point for accessing environment variables, logging configuration,
 * metrics, and AI-specific settings needed for model orchestration.
 */

import baseConfig from '../../../config';
import { logger } from '../../../shared/src/utils/logger.util';
import { ModelProvider, ModelCapability } from '../models/model.model';
import * as prometheus from 'prom-client'; // ^14.2.0

/**
 * AI-specific configuration settings
 */
export const aiConfig = {
  // OpenRouter API configuration
  OPENROUTER_API_KEY: baseConfig.env.OPENROUTER_API_KEY,
  OPENROUTER_API_URL: baseConfig.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1',
  
  // AI model request settings
  modelTimeout: baseConfig.env.AI_MODEL_TIMEOUT || 30000, // 30 seconds
  maxRetries: baseConfig.env.AI_MAX_RETRIES || 3,
  retryDelay: baseConfig.env.AI_RETRY_DELAY || 1000, // 1 second base delay
  
  // Default models for different capabilities
  defaultModels: {
    [ModelCapability.TEXT_GENERATION]: 'openai/gpt-4',
    [ModelCapability.CHAT_COMPLETION]: 'openai/gpt-4',
    [ModelCapability.EMBEDDING]: 'openai/text-embedding-ada-002'
  }
};

/**
 * Validates AI-specific configuration settings
 * 
 * @returns True if all AI configuration is valid
 * @throws Error if any AI configuration validation fails
 */
export function validateAIConfiguration(): boolean {
  try {
    // Check if OPENROUTER_API_KEY is defined
    if (!aiConfig.OPENROUTER_API_KEY) {
      if (baseConfig.env.NODE_ENV === 'production') {
        throw new Error('OPENROUTER_API_KEY is required in production environment');
      } else {
        logger.warn('OPENROUTER_API_KEY is not defined. AI features may not work correctly.');
      }
    }
    
    // Check if OPENROUTER_API_URL is defined
    if (!aiConfig.OPENROUTER_API_URL) {
      throw new Error('OPENROUTER_API_URL is not defined');
    }
    
    // Validate AI model timeout and retry settings
    if (aiConfig.modelTimeout <= 0) {
      throw new Error('AI_MODEL_TIMEOUT must be a positive number');
    }
    
    if (aiConfig.maxRetries < 0) {
      throw new Error('AI_MAX_RETRIES must be a non-negative number');
    }
    
    if (aiConfig.retryDelay <= 0) {
      throw new Error('AI_RETRY_DELAY must be a positive number');
    }
    
    logger.info('AI configuration validated successfully');
    return true;
  } catch (error) {
    logger.error('AI configuration validation failed', error as Error);
    throw error;
  }
}

/**
 * Creates and registers AI-specific metrics with Prometheus
 * 
 * @returns Object containing all created AI metrics
 */
function createAIMetrics() {
  // Create histogram for model latency by model ID
  const modelLatencyHistogram = new prometheus.Histogram({
    name: 'ai_model_latency_seconds',
    help: 'Latency of AI model requests in seconds',
    labelNames: ['model_id', 'capability'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    registers: [baseConfig.metrics.registry]
  });

  // Create counter for model requests by model ID
  const modelRequestCounter = new prometheus.Counter({
    name: 'ai_model_requests_total',
    help: 'Total number of AI model requests',
    labelNames: ['model_id', 'capability'],
    registers: [baseConfig.metrics.registry]
  });

  // Create counter for model errors by model ID and error type
  const modelErrorCounter = new prometheus.Counter({
    name: 'ai_model_errors_total',
    help: 'Total number of AI model errors',
    labelNames: ['model_id', 'error_type'],
    registers: [baseConfig.metrics.registry]
  });

  // Create counter for prompt tokens by model ID
  const promptTokensCounter = new prometheus.Counter({
    name: 'ai_prompt_tokens_total',
    help: 'Total number of prompt tokens',
    labelNames: ['model_id'],
    registers: [baseConfig.metrics.registry]
  });

  // Create counter for completion tokens by model ID
  const completionTokensCounter = new prometheus.Counter({
    name: 'ai_completion_tokens_total',
    help: 'Total number of completion tokens',
    labelNames: ['model_id'],
    registers: [baseConfig.metrics.registry]
  });
  
  // Register all metrics with the metrics registry
  return {
    modelLatencyHistogram,
    modelRequestCounter,
    modelErrorCounter,
    promptTokensCounter,
    completionTokensCounter
  };
}

// Create and register AI metrics
const {
  modelLatencyHistogram,
  modelRequestCounter,
  modelErrorCounter,
  promptTokensCounter,
  completionTokensCounter
} = createAIMetrics();

// Export metrics for use in other modules
export {
  modelLatencyHistogram,
  modelRequestCounter,
  modelErrorCounter,
  promptTokensCounter,
  completionTokensCounter
};

// Export combined configuration with AI-specific additions
export default {
  env: baseConfig.env,
  logging: baseConfig.logging,
  metrics: baseConfig.metrics,
  secrets: baseConfig.secrets,
  aiConfig,
  validateConfiguration: baseConfig.validateConfiguration,
  initializeConfiguration: baseConfig.initializeConfiguration,
  validateAIConfiguration
};