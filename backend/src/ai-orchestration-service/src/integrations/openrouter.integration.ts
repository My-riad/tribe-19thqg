/**
 * OpenRouter Integration Module
 * 
 * This module provides direct communication with the OpenRouter API for accessing
 * various AI language models. It implements methods to send requests to OpenRouter
 * for text generation, chat completion, and embeddings.
 * 
 * The integration handles:
 * - Authentication
 * - Request formatting
 * - Response parsing
 * - Error management
 * - Metrics collection
 * - Request retries
 */

import axios, { AxiosInstance, AxiosError } from 'axios'; // ^1.4.0
import axiosRetry from 'axios-retry'; // ^3.5.0
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0

import { 
  OPENROUTER_API_KEY, 
  OPENROUTER_API_URL, 
  modelTimeout, 
  maxRetries, 
  retryDelay, 
  defaultModels,
  modelLatencyHistogram,
  modelRequestCounter,
  modelErrorCounter,
  promptTokensCounter,
  completionTokensCounter
} from '../config';

import { 
  ModelConfig, 
  ModelParameters, 
  ModelCapability, 
  ChatMessage, 
  ModelResponse, 
  ChatCompletionResponse,
  TokenUsage
} from '../models/model.model';

import {
  validateModelParameters,
  mergeWithDefaultParameters,
  estimateTokenCount,
  getOptimalMaxTokens
} from '../utils/model.util';

import { ApiError } from '../../../shared/src/errors/api.error';

// Logger is imported from config and declared as global
const logger = global.logger;

/**
 * Creates and configures an Axios client for communicating with the OpenRouter API
 * 
 * @returns Configured Axios client for OpenRouter API communication
 */
export const createOpenRouterClient = (): AxiosInstance => {
  // Create base Axios instance with API URL
  const client = axios.create({
    baseURL: OPENROUTER_API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://tribe-app.com',
      'X-Title': 'Tribe App'
    },
    timeout: modelTimeout
  });

  // Add request interceptor for logging and metrics
  client.interceptors.request.use(config => {
    const requestId = config.headers['X-Request-ID'] as string || uuidv4();
    config.headers['X-Request-ID'] = requestId;
    
    // Log outgoing request details (excluding sensitive data)
    logger.debug('OpenRouter API request', {
      requestId,
      method: config.method,
      url: config.url,
      // Don't log full request body as it may contain sensitive user data
      modelId: config.data?.model || 'unknown',
    });
    
    return config;
  }, error => {
    logger.error('Error preparing OpenRouter request', error);
    return Promise.reject(error);
  });

  // Add response interceptor for logging, metrics, and error handling
  client.interceptors.response.use(response => {
    const requestId = response.config.headers['X-Request-ID'] as string;
    const modelId = response.config.data?.model || 'unknown';
    
    // Log successful response (excluding full payload for privacy reasons)
    logger.debug('OpenRouter API response received', {
      requestId,
      modelId,
      status: response.status,
      dataSize: JSON.stringify(response.data).length,
      headers: {
        'x-request-id': response.headers['x-request-id'],
        'x-ratelimit-limit': response.headers['x-ratelimit-limit'],
        'x-ratelimit-remaining': response.headers['x-ratelimit-remaining'],
        'x-ratelimit-reset': response.headers['x-ratelimit-reset']
      }
    });
    
    return response;
  }, error => {
    const requestId = error.config?.headers?.['X-Request-ID'] as string || 'unknown';
    const modelId = error.config?.data?.model || 'unknown';
    
    // Log error details
    logger.error(`OpenRouter API error: ${error.message}`, {
      requestId,
      modelId,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code
    });
    
    return Promise.reject(error);
  });

  // Configure retry behavior
  axiosRetry(client, {
    retries: maxRetries,
    retryDelay: (retryCount) => {
      // Exponential backoff with jitter
      const baseDelay = retryDelay * Math.pow(2, retryCount - 1);
      const jitter = baseDelay * 0.2 * Math.random();
      return baseDelay + jitter;
    },
    retryCondition: (error) => {
      // Only retry on network errors, 429 (Too Many Requests), or 500s
      return (
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.response?.status === 429 ||
        (error.response?.status && error.response.status >= 500)
      );
    },
    onRetry: (retryCount, error, requestConfig) => {
      const requestId = requestConfig.headers?.['X-Request-ID'] as string || 'unknown';
      const modelId = requestConfig.data?.model || 'unknown';
      
      logger.warn(`Retrying OpenRouter request (attempt ${retryCount})`, {
        requestId,
        modelId,
        error: error.message,
        status: error.response?.status
      });
    }
  });

  return client;
};

/**
 * Checks the health status of the OpenRouter API
 * 
 * @returns Promise resolving to true if OpenRouter API is healthy, false otherwise
 */
export const checkOpenRouterHealth = async (): Promise<boolean> => {
  const requestId = uuidv4();
  
  logger.debug('Checking OpenRouter API health', { requestId });
  
  try {
    const client = createOpenRouterClient();
    const response = await client.get('/models', {
      headers: {
        'X-Request-ID': requestId
      }
    });
    
    const isHealthy = response.status === 200 && Array.isArray(response.data.data);
    
    logger.debug(`OpenRouter API health check ${isHealthy ? 'successful' : 'failed'}`, {
      requestId,
      status: response.status,
      modelCount: isHealthy ? response.data.data.length : 0
    });
    
    return isHealthy;
  } catch (error) {
    logger.error('OpenRouter API health check failed', {
      requestId,
      error: (error as Error).message
    });
    
    return false;
  }
};

/**
 * Handles errors from OpenRouter API requests and creates appropriate responses
 * 
 * @param error - The error from the OpenRouter API request
 * @param requestId - The unique ID for the request
 * @param modelId - The ID of the model being used
 * @throws ApiError with appropriate details
 */
const handleOpenRouterError = (error: Error, requestId: string, modelId: string): never => {
  // Log error with request details
  logger.error(`OpenRouter error: ${error.message}`, {
    requestId,
    modelId,
    error
  });
  
  // Track error metrics
  let errorType = 'unknown';
  let statusCode = 500;
  let errorCode = 'AI_SERVICE_ERROR';
  let errorMessage = `Error accessing AI service: ${error.message}`;
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    statusCode = axiosError.response?.status || 500;
    
    // Determine error type
    if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
      errorType = 'timeout';
      errorMessage = `Request to AI service timed out after ${modelTimeout}ms`;
      statusCode = 504; // Gateway Timeout
    } else if (statusCode === 401 || statusCode === 403) {
      errorType = 'authentication';
      errorMessage = 'Authentication error with AI service';
      errorCode = 'AUTHENTICATION_ERROR';
    } else if (statusCode === 429) {
      errorType = 'rate_limit';
      errorMessage = 'AI service rate limit exceeded, please try again later';
      errorCode = 'RATE_LIMIT_EXCEEDED';
    } else if (statusCode >= 400 && statusCode < 500) {
      errorType = 'validation';
      errorMessage = `Invalid request to AI service: ${axiosError.response?.data?.error?.message || error.message}`;
      errorCode = 'VALIDATION_ERROR';
    } else if (statusCode >= 500) {
      errorType = 'server';
      errorMessage = 'AI service is currently unavailable';
      errorCode = 'SERVICE_UNAVAILABLE';
    }
  } else {
    errorType = 'unknown';
  }
  
  // Increment error counter metric
  modelErrorCounter.inc({ model_id: modelId, error_type: errorType });
  
  // Throw appropriate API error
  throw new ApiError(
    errorMessage,
    errorCode,
    statusCode,
    {
      requestId,
      modelId,
      errorType,
      originalError: error.message
    }
  );
};

/**
 * Formats a request payload for the OpenRouter API based on the request type
 * 
 * @param requestType - The type of request ("text", "chat", or "embedding")
 * @param content - The content for the request (prompt, messages, or input text)
 * @param modelId - The ID of the model to use
 * @param parameters - The parameters for the request
 * @returns Formatted request payload for OpenRouter API
 */
const formatOpenRouterRequest = (
  requestType: string,
  content: any,
  modelId: string,
  parameters: ModelParameters
): object => {
  // Validate parameters to ensure they're within allowed ranges
  const validatedParams = validateModelParameters(parameters);
  
  // Create base request object
  const request: Record<string, any> = {
    model: modelId,
    temperature: validatedParams.temperature,
    max_tokens: validatedParams.maxTokens,
    top_p: validatedParams.topP,
    presence_penalty: validatedParams.presencePenalty,
    frequency_penalty: validatedParams.frequencyPenalty
  };
  
  // Add stop sequences if provided
  if (validatedParams.stopSequences && validatedParams.stopSequences.length > 0) {
    request.stop = validatedParams.stopSequences;
  }
  
  // Add content based on request type
  switch (requestType) {
    case 'text':
      if (typeof content !== 'string') {
        throw new ApiError(
          'Text generation requires a string prompt',
          'VALIDATION_ERROR',
          400
        );
      }
      request.prompt = content;
      break;
      
    case 'chat':
      if (!Array.isArray(content)) {
        throw new ApiError(
          'Chat completion requires an array of messages',
          'VALIDATION_ERROR',
          400
        );
      }
      request.messages = content;
      break;
      
    case 'embedding':
      if (typeof content !== 'string') {
        throw new ApiError(
          'Embedding generation requires a string input',
          'VALIDATION_ERROR',
          400
        );
      }
      request.input = content;
      break;
      
    default:
      throw new ApiError(
        `Unsupported request type: ${requestType}`,
        'VALIDATION_ERROR',
        400
      );
  }
  
  return request;
};

/**
 * Parses the response from OpenRouter API into standardized format
 * 
 * @param response - The response from OpenRouter API
 * @param requestType - The type of request ("text", "chat", or "embedding")
 * @param modelId - The ID of the model used
 * @returns Parsed response in standardized format
 */
const parseOpenRouterResponse = (
  response: any,
  requestType: string,
  modelId: string
): ModelResponse | ChatCompletionResponse | number[] => {
  // Validate response structure
  if (!response || !response.data) {
    throw new ApiError(
      'Invalid response from AI service',
      'AI_SERVICE_ERROR',
      500
    );
  }
  
  // Different parsing based on request type
  switch (requestType) {
    case 'text': {
      const data = response.data;
      
      // Extract content from the response
      if (!data.choices || !data.choices[0]) {
        throw new ApiError(
          'No content in AI service response',
          'AI_SERVICE_ERROR',
          500
        );
      }
      
      const choice = data.choices[0];
      const content = choice.text || '';
      const finishReason = choice.finish_reason || 'unknown';
      
      // Format token usage
      const usage: TokenUsage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      };
      
      // Update token usage metrics
      promptTokensCounter.inc({ model_id: modelId }, usage.promptTokens);
      completionTokensCounter.inc({ model_id: modelId }, usage.completionTokens);
      
      // Return standardized response
      return {
        content,
        usage,
        modelId,
        finishReason
      };
    }
    
    case 'chat': {
      const data = response.data;
      
      // Extract message from the response
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new ApiError(
          'No message in AI service response',
          'AI_SERVICE_ERROR',
          500
        );
      }
      
      const choice = data.choices[0];
      const message: ChatMessage = {
        role: choice.message.role || 'assistant',
        content: choice.message.content || '',
        name: choice.message.name,
        function_call: choice.message.function_call
      };
      const finishReason = choice.finish_reason || 'unknown';
      
      // Format token usage
      const usage: TokenUsage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      };
      
      // Update token usage metrics
      promptTokensCounter.inc({ model_id: modelId }, usage.promptTokens);
      completionTokensCounter.inc({ model_id: modelId }, usage.completionTokens);
      
      // Return standardized response
      return {
        message,
        usage,
        modelId,
        finishReason
      };
    }
    
    case 'embedding': {
      const data = response.data;
      
      // Extract embedding from the response
      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new ApiError(
          'No embedding in AI service response',
          'AI_SERVICE_ERROR',
          500
        );
      }
      
      // Return embedding vector
      return data.data[0].embedding;
    }
    
    default:
      throw new ApiError(
        `Unsupported request type: ${requestType}`,
        'VALIDATION_ERROR',
        400
      );
  }
};

/**
 * Class that encapsulates integration with the OpenRouter API for accessing AI language models
 */
export class OpenRouterIntegration {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;
  private retryCount: number;
  
  /**
   * Initialize the OpenRouter integration with configuration
   */
  constructor() {
    this.baseUrl = OPENROUTER_API_URL;
    this.apiKey = OPENROUTER_API_KEY;
    this.timeout = modelTimeout;
    this.retryCount = maxRetries;
    
    // Initialize Axios client
    this.client = createOpenRouterClient();
    
    logger.info('OpenRouter integration initialized', {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      retryCount: this.retryCount
    });
  }
  
  /**
   * Generate text completion from a prompt using OpenRouter API
   * 
   * @param prompt - The text prompt to generate from
   * @param modelId - The ID of the model to use
   * @param parameters - Optional parameters to override defaults
   * @returns Promise resolving to text generation response
   */
  async generateText(
    prompt: string,
    modelId: string,
    parameters: Partial<ModelParameters> = {}
  ): Promise<ModelResponse> {
    const requestId = uuidv4();
    
    logger.debug('Generating text with OpenRouter', {
      requestId,
      modelId,
      promptStart: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      promptLength: prompt.length
    });
    
    try {
      // Merge with default parameters
      const mergedParams = mergeWithDefaultParameters(parameters, {
        temperature: 0.7,
        maxTokens: 500,
        topP: 0.9,
        presencePenalty: 0,
        frequencyPenalty: 0,
        stopSequences: []
      });
      
      // Format request payload
      const requestData = formatOpenRouterRequest('text', prompt, modelId, mergedParams);
      
      // Start timer for metrics
      const startTime = Date.now();
      
      // Increment request counter
      modelRequestCounter.inc({ model_id: modelId, capability: 'text_generation' });
      
      // Make API request
      const response = await this.client.post('/completions', requestData, {
        headers: {
          'X-Request-ID': requestId
        }
      });
      
      // Calculate request duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      modelLatencyHistogram.observe(
        { model_id: modelId, capability: 'text_generation' },
        duration
      );
      
      // Parse response
      const result = parseOpenRouterResponse(response, 'text', modelId) as ModelResponse;
      
      logger.debug('Text generation completed', {
        requestId,
        modelId,
        responseLength: result.content.length,
        duration: `${duration.toFixed(2)}s`,
        tokens: result.usage
      });
      
      return result;
    } catch (error) {
      return handleOpenRouterError(error as Error, requestId, modelId);
    }
  }
  
  /**
   * Generate chat completion from messages using OpenRouter API
   * 
   * @param messages - The chat messages to generate from
   * @param modelId - The ID of the model to use
   * @param parameters - Optional parameters to override defaults
   * @returns Promise resolving to chat completion response
   */
  async generateChatCompletion(
    messages: ChatMessage[],
    modelId: string,
    parameters: Partial<ModelParameters> = {}
  ): Promise<ChatCompletionResponse> {
    const requestId = uuidv4();
    
    logger.debug('Generating chat completion with OpenRouter', {
      requestId,
      modelId,
      messageCount: messages.length,
      lastMessage: messages.length > 0 ? 
        `${messages[messages.length-1].role}: ${messages[messages.length-1].content.substring(0, 100)}${messages[messages.length-1].content.length > 100 ? '...' : ''}` :
        'No messages'
    });
    
    try {
      // Merge with default parameters
      const mergedParams = mergeWithDefaultParameters(parameters, {
        temperature: 0.7,
        maxTokens: 500,
        topP: 0.9,
        presencePenalty: 0,
        frequencyPenalty: 0,
        stopSequences: []
      });
      
      // Format request payload
      const requestData = formatOpenRouterRequest('chat', messages, modelId, mergedParams);
      
      // Start timer for metrics
      const startTime = Date.now();
      
      // Increment request counter
      modelRequestCounter.inc({ model_id: modelId, capability: 'chat_completion' });
      
      // Make API request
      const response = await this.client.post('/chat/completions', requestData, {
        headers: {
          'X-Request-ID': requestId
        }
      });
      
      // Calculate request duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      modelLatencyHistogram.observe(
        { model_id: modelId, capability: 'chat_completion' },
        duration
      );
      
      // Parse response
      const result = parseOpenRouterResponse(response, 'chat', modelId) as ChatCompletionResponse;
      
      logger.debug('Chat completion completed', {
        requestId,
        modelId,
        responseContent: result.message.content.substring(0, 100) + (result.message.content.length > 100 ? '...' : ''),
        duration: `${duration.toFixed(2)}s`,
        tokens: result.usage
      });
      
      return result;
    } catch (error) {
      return handleOpenRouterError(error as Error, requestId, modelId);
    }
  }
  
  /**
   * Generate embedding vector for input text using OpenRouter API
   * 
   * @param input - The text to generate an embedding for
   * @param modelId - The ID of the model to use
   * @returns Promise resolving to embedding vector
   */
  async generateEmbedding(
    input: string,
    modelId: string
  ): Promise<number[]> {
    const requestId = uuidv4();
    
    logger.debug('Generating embedding with OpenRouter', {
      requestId,
      modelId,
      inputStart: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
      inputLength: input.length
    });
    
    try {
      // Format request payload - embedding doesn't need most parameters
      const requestData = formatOpenRouterRequest('embedding', input, modelId, {
        temperature: 0,
        maxTokens: 0,
        topP: 1,
        presencePenalty: 0,
        frequencyPenalty: 0,
        stopSequences: []
      });
      
      // Start timer for metrics
      const startTime = Date.now();
      
      // Increment request counter
      modelRequestCounter.inc({ model_id: modelId, capability: 'embedding' });
      
      // Make API request
      const response = await this.client.post('/embeddings', requestData, {
        headers: {
          'X-Request-ID': requestId
        }
      });
      
      // Calculate request duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      modelLatencyHistogram.observe(
        { model_id: modelId, capability: 'embedding' },
        duration
      );
      
      // Parse response
      const result = parseOpenRouterResponse(response, 'embedding', modelId) as number[];
      
      logger.debug('Embedding generation completed', {
        requestId,
        modelId,
        embeddingDimensions: result.length,
        duration: `${duration.toFixed(2)}s`
      });
      
      return result;
    } catch (error) {
      return handleOpenRouterError(error as Error, requestId, modelId);
    }
  }
  
  /**
   * Retrieve list of available models from OpenRouter API
   * 
   * @returns Promise resolving to list of available models
   */
  async listAvailableModels(): Promise<ModelConfig[]> {
    const requestId = uuidv4();
    
    logger.debug('Retrieving available models from OpenRouter', { requestId });
    
    try {
      // Make API request
      const response = await this.client.get('/models', {
        headers: {
          'X-Request-ID': requestId
        }
      });
      
      // Validate response
      if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response format from OpenRouter API');
      }
      
      // Transform OpenRouter models to our model format
      const models: ModelConfig[] = response.data.data.map((model: any) => {
        // Determine model capabilities based on metadata
        const capabilities: ModelCapability[] = [];
        
        if (model.context_length > 0) {
          capabilities.push(ModelCapability.TEXT_GENERATION);
          capabilities.push(ModelCapability.CHAT_COMPLETION);
        }
        
        if (model.type === 'embedding') {
          capabilities.push(ModelCapability.EMBEDDING);
        }
        
        if (model.features?.includes('function_calling')) {
          capabilities.push(ModelCapability.FUNCTION_CALLING);
        }
        
        if (model.features?.includes('vision')) {
          capabilities.push(ModelCapability.IMAGE_UNDERSTANDING);
        }
        
        // Create model config
        return {
          id: model.id,
          name: model.name || model.id,
          provider: model.id.split('/')[0],
          capabilities,
          contextWindow: model.context_length || 4096,
          maxTokens: model.context_length ? Math.floor(model.context_length / 2) : 2048,
          defaultParameters: {
            temperature: 0.7,
            maxTokens: model.context_length ? Math.floor(model.context_length / 2) : 2048,
            topP: 0.9,
            presencePenalty: 0,
            frequencyPenalty: 0,
            stopSequences: []
          },
          active: true,
          description: model.description || '',
          metadata: {
            ...model,
            pricing: {
              prompt: model.pricing?.prompt,
              completion: model.pricing?.completion
            }
          }
        };
      });
      
      logger.debug('Retrieved available models from OpenRouter', { 
        requestId,
        modelCount: models.length
      });
      
      return models;
    } catch (error) {
      return handleOpenRouterError(error as Error, requestId, 'system');
    }
  }
  
  /**
   * Check the health status of the OpenRouter API
   * 
   * @returns Promise resolving to health status
   */
  async checkHealth(): Promise<boolean> {
    return checkOpenRouterHealth();
  }
}