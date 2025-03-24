import * as z from 'zod';

/**
 * Enum representing supported AI model providers
 * Primarily used to categorize different AI services for routing and configuration
 */
export enum ModelProvider {
  OPENROUTER = 'openrouter',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  COHERE = 'cohere',
  CUSTOM = 'custom'
}

/**
 * Enum representing AI model capabilities for feature support
 * Used for filtering models based on required functionality
 */
export enum ModelCapability {
  TEXT_GENERATION = 'text_generation',
  CHAT_COMPLETION = 'chat_completion',
  EMBEDDING = 'embedding',
  FUNCTION_CALLING = 'function_calling',
  IMAGE_UNDERSTANDING = 'image_understanding'
}

/**
 * Interface for AI model configuration and capabilities
 * Provides comprehensive metadata about models available in the system
 */
export interface ModelConfig {
  /** Unique identifier for the model */
  id: string;
  /** Display name of the model */
  name: string;
  /** Provider of the model */
  provider: ModelProvider;
  /** Capabilities supported by the model */
  capabilities: ModelCapability[];
  /** Maximum context window size in tokens */
  contextWindow: number;
  /** Maximum output tokens the model can generate */
  maxTokens: number;
  /** Default generation parameters */
  defaultParameters: ModelParameters;
  /** Whether the model is active and available for use */
  active: boolean;
  /** Description of the model */
  description: string;
  /** Additional metadata for the model */
  metadata: Record<string, any>;
}

/**
 * Interface for AI model generation parameters
 * Controls the behavior and characteristics of AI-generated content
 */
export interface ModelParameters {
  /** Controls randomness (0-1), higher values make output more random */
  temperature: number;
  /** Maximum number of tokens to generate */
  maxTokens: number;
  /** Nucleus sampling, limits to tokens with top_p probability mass (0-1) */
  topP: number;
  /** Penalizes repeated tokens (-2.0 to 2.0) */
  presencePenalty: number;
  /** Penalizes frequent tokens (-2.0 to 2.0) */
  frequencyPenalty: number;
  /** Sequences that stop generation when encountered */
  stopSequences: string[];
}

/**
 * Interface for chat message format in conversations
 * Standardizes message structure across different AI providers
 */
export interface ChatMessage {
  /** Role of the message sender (system, user, assistant, function) */
  role: string;
  /** Content of the message */
  content: string;
  /** Optional name identifier for the sender */
  name?: string;
  /** Optional function call data for function-calling capable models */
  function_call?: Record<string, any>;
}

/**
 * Interface for AI model text generation response
 * Used for simple text completion responses
 */
export interface ModelResponse {
  /** Generated text content */
  content: string;
  /** Token usage statistics */
  usage: TokenUsage;
  /** ID of the model that generated the response */
  modelId: string;
  /** Reason why generation finished (e.g., 'stop', 'length') */
  finishReason: string;
}

/**
 * Interface for AI model chat completion response
 * Used for chat-based interactions with structured message format
 */
export interface ChatCompletionResponse {
  /** Generated chat message */
  message: ChatMessage;
  /** Token usage statistics */
  usage: TokenUsage;
  /** ID of the model that generated the response */
  modelId: string;
  /** Reason why generation finished (e.g., 'stop', 'length') */
  finishReason: string;
}

/**
 * Interface for tracking token usage in AI requests
 * Important for monitoring API costs and optimizing usage
 */
export interface TokenUsage {
  /** Number of tokens in the prompt */
  promptTokens: number;
  /** Number of tokens in the completion */
  completionTokens: number;
  /** Total tokens used (prompt + completion) */
  totalTokens: number;
}

/**
 * Zod schema for validating token usage data
 * Ensures proper tracking of token consumption
 */
export const TokenUsageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative()
});

/**
 * Zod schema for validating chat messages
 * Ensures proper message format for chat-based interactions
 */
export const ChatMessageSchema = z.object({
  role: z.string(),
  content: z.string(),
  name: z.string().optional(),
  function_call: z.record(z.any()).optional()
});

/**
 * Zod schema for validating model parameters
 * Ensures parameters are within acceptable ranges
 */
export const ModelParametersSchema = z.object({
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().int().positive(),
  topP: z.number().min(0).max(1),
  presencePenalty: z.number().min(-2).max(2),
  frequencyPenalty: z.number().min(-2).max(2),
  stopSequences: z.array(z.string())
});

/**
 * Zod schema for validating model configurations
 * Ensures proper model configuration for registration and use
 */
export const ModelConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.nativeEnum(ModelProvider),
  capabilities: z.array(z.nativeEnum(ModelCapability)),
  contextWindow: z.number().int().positive(),
  maxTokens: z.number().int().positive(),
  defaultParameters: ModelParametersSchema,
  active: z.boolean(),
  description: z.string(),
  metadata: z.record(z.any())
});

/**
 * Zod schema for validating model responses
 * Ensures proper response format for text generation
 */
export const ModelResponseSchema = z.object({
  content: z.string(),
  usage: TokenUsageSchema,
  modelId: z.string(),
  finishReason: z.string()
});

/**
 * Zod schema for validating chat completion responses
 * Ensures proper response format for chat completions
 */
export const ChatCompletionResponseSchema = z.object({
  message: ChatMessageSchema,
  usage: TokenUsageSchema,
  modelId: z.string(),
  finishReason: z.string()
});