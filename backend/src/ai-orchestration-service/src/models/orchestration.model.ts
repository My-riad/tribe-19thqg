import { ModelConfig, ModelParameters, ChatMessage, ModelCapability } from './model.model';
import * as z from 'zod'; // v3.21.4

/**
 * Enum of AI features that can be orchestrated
 * Represents the major AI capabilities of the Tribe platform
 */
export enum OrchestrationFeature {
  MATCHING = 'matching',
  PERSONALITY_ANALYSIS = 'personality_analysis',
  ENGAGEMENT = 'engagement',
  RECOMMENDATION = 'recommendation',
  CONVERSATION = 'conversation'
}

/**
 * Enum of possible orchestration request statuses
 * Tracks the lifecycle of an AI orchestration request
 */
export enum OrchestrationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Enum of orchestration request priorities
 * Used to determine processing order in queue
 */
export enum OrchestrationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Enum of matching operations that can be performed
 * Specific options for the matchmaking feature
 */
export enum MatchingOperation {
  USER_TO_TRIBES = 'user_to_tribes',
  TRIBE_FORMATION = 'tribe_formation',
  COMPATIBILITY = 'compatibility'
}

/**
 * Enum of personality analysis operations
 * Specific options for the personality feature
 */
export enum PersonalityOperation {
  TRAIT_ANALYSIS = 'trait_analysis',
  COMMUNICATION_STYLE = 'communication_style'
}

/**
 * Enum of engagement operations
 * Specific options for the engagement feature
 */
export enum EngagementOperation {
  CONVERSATION_PROMPTS = 'conversation_prompts',
  GROUP_CHALLENGES = 'group_challenges',
  ACTIVITY_SUGGESTIONS = 'activity_suggestions'
}

/**
 * Enum of recommendation operations
 * Specific options for the recommendation feature
 */
export enum RecommendationOperation {
  EVENTS = 'events',
  WEATHER_ACTIVITIES = 'weather_activities',
  BUDGET_OPTIONS = 'budget_options'
}

/**
 * Interface for orchestration configuration settings
 * Defines how each AI feature should be orchestrated
 */
export interface OrchestrationConfig {
  /** Unique identifier for the configuration */
  id: string;
  /** Feature this configuration applies to */
  feature: OrchestrationFeature;
  /** Name of the orchestration configuration */
  name: string;
  /** Description of what this orchestration does */
  description: string;
  /** Default AI model to use */
  defaultModelId: string;
  /** Fallback models if the default is unavailable */
  fallbackModelIds: string[];
  /** Required capabilities for models to be eligible */
  requiredCapabilities: ModelCapability[];
  /** Default parameters for the AI model */
  defaultParameters: ModelParameters;
  /** Whether to enable result caching */
  cacheEnabled: boolean;
  /** Cache time-to-live in seconds */
  cacheTTL: number;
  /** Whether this configuration is active */
  active: boolean;
  /** Version of this configuration */
  version: string;
  /** When this configuration was created */
  createdAt: Date;
  /** When this configuration was last updated */
  updatedAt: Date;
}

/**
 * Interface for orchestration request data
 * Represents a request for AI processing
 */
export interface OrchestrationRequest {
  /** Unique identifier for the request */
  id: string;
  /** Feature being requested */
  feature: OrchestrationFeature;
  /** Feature-specific input data */
  input: Record<string, any>;
  /** Chat messages for context (if applicable) */
  messages: ChatMessage[];
  /** User making the request */
  userId: string;
  /** Specific model to use (optional) */
  modelId: string;
  /** Custom parameters to override defaults */
  parameters: ModelParameters;
  /** Current status of the request */
  status: OrchestrationStatus;
  /** Priority level for processing */
  priority: OrchestrationPriority;
  /** When this request was created */
  createdAt: Date;
  /** When this request was last updated */
  updatedAt: Date;
}

/**
 * Interface for orchestration response data
 * Represents the result of an AI processing request
 */
export interface OrchestrationResponse {
  /** Unique identifier for the response */
  id: string;
  /** ID of the corresponding request */
  requestId: string;
  /** Feature that was processed */
  feature: OrchestrationFeature;
  /** Processed result data */
  result: Record<string, any>;
  /** Raw response from the AI model */
  rawResponse: any;
  /** ID of the model that generated the response */
  modelId: string;
  /** Final status of the request */
  status: OrchestrationStatus;
  /** Error message (if applicable) */
  error: string;
  /** Error stack trace (if applicable) */
  errorStack: string;
  /** Processing time in milliseconds */
  processingTime: number;
  /** When this response was created */
  createdAt: Date;
}

/**
 * Interface for matching feature input data
 * Specifies parameters for matchmaking operations
 */
export interface MatchingOrchestrationInput {
  /** Specific matching operation to perform */
  operation: MatchingOperation;
  /** Profile of the user to match (if applicable) */
  userProfile?: Record<string, any>;
  /** Collection of user profiles for matching (if applicable) */
  userProfiles?: Record<string, any>[];
  /** Tribes to consider for matching (if applicable) */
  tribes?: Record<string, any>[];
  /** Specific tribe to target (if applicable) */
  tribeId?: string;
  /** Specific user to target (if applicable) */
  targetUserId?: string;
  /** Specific matching criteria to apply */
  matchingCriteria?: Record<string, any>;
  /** Maximum number of results to return */
  maxResults?: number;
}

/**
 * Interface for personality analysis feature input data
 * Specifies parameters for personality operations
 */
export interface PersonalityOrchestrationInput {
  /** Specific personality operation to perform */
  operation: PersonalityOperation;
  /** Assessment responses to analyze (if applicable) */
  assessmentResponses?: Record<string, any>;
  /** User profile data (if applicable) */
  userProfile?: Record<string, any>;
  /** Communication data to analyze (if applicable) */
  communicationData?: Record<string, any>;
}

/**
 * Interface for engagement feature input data
 * Specifies parameters for generating engagement content
 */
export interface EngagementOrchestrationInput {
  /** Specific engagement operation to perform */
  operation: EngagementOperation;
  /** Tribe data for context */
  tribeData?: Record<string, any>;
  /** Profiles of tribe members */
  memberProfiles?: Record<string, any>[];
  /** History of previous engagements */
  engagementHistory?: Record<string, any>[];
  /** Activity preferences for the tribe */
  activityPreferences?: Record<string, any>;
  /** Number of items to generate */
  count?: number;
}

/**
 * Interface for recommendation feature input data
 * Specifies parameters for generating recommendations
 */
export interface RecommendationOrchestrationInput {
  /** Specific recommendation operation to perform */
  operation: RecommendationOperation;
  /** Tribe data for context */
  tribeData?: Record<string, any>;
  /** Profiles of tribe members */
  memberProfiles?: Record<string, any>[];
  /** Location data for geo-specific recommendations */
  location?: Record<string, any>;
  /** Weather data for context-aware recommendations */
  weatherData?: Record<string, any>;
  /** Available event options to rank (if applicable) */
  eventOptions?: Record<string, any>[];
  /** Budget constraints for recommendations */
  budgetConstraints?: Record<string, any>;
  /** Number of recommendations to generate */
  count?: number;
}

/**
 * Interface for conversation feature input data
 * Specifies parameters for conversation assistance
 */
export interface ConversationOrchestrationInput {
  /** Tribe data for context */
  tribeData?: Record<string, any>;
  /** Profiles of tribe members */
  memberProfiles?: Record<string, any>[];
  /** History of previous conversations */
  conversationHistory?: Record<string, any>[];
  /** Current conversation topic */
  currentTopic?: string;
}

/**
 * Zod schema for validating orchestration configuration
 * Ensures proper configuration structure
 */
export const OrchestrationConfigSchema = z.object({
  id: z.string(),
  feature: z.nativeEnum(OrchestrationFeature),
  name: z.string(),
  description: z.string(),
  defaultModelId: z.string(),
  fallbackModelIds: z.array(z.string()),
  requiredCapabilities: z.array(z.nativeEnum(ModelCapability)),
  defaultParameters: z.object({
    temperature: z.number().min(0).max(1),
    maxTokens: z.number().int().positive(),
    topP: z.number().min(0).max(1),
    presencePenalty: z.number().min(-2).max(2),
    frequencyPenalty: z.number().min(-2).max(2),
    stopSequences: z.array(z.string())
  }),
  cacheEnabled: z.boolean(),
  cacheTTL: z.number().int().nonnegative(),
  active: z.boolean(),
  version: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Zod schema for validating orchestration requests
 * Ensures proper request structure
 */
export const OrchestrationRequestSchema = z.object({
  id: z.string(),
  feature: z.nativeEnum(OrchestrationFeature),
  input: z.record(z.any()),
  messages: z.array(z.object({
    role: z.string(),
    content: z.string(),
    name: z.string().optional(),
    function_call: z.record(z.any()).optional()
  })),
  userId: z.string(),
  modelId: z.string(),
  parameters: z.object({
    temperature: z.number().min(0).max(1),
    maxTokens: z.number().int().positive(),
    topP: z.number().min(0).max(1),
    presencePenalty: z.number().min(-2).max(2),
    frequencyPenalty: z.number().min(-2).max(2),
    stopSequences: z.array(z.string())
  }),
  status: z.nativeEnum(OrchestrationStatus),
  priority: z.nativeEnum(OrchestrationPriority),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Zod schema for validating orchestration responses
 * Ensures proper response structure
 */
export const OrchestrationResponseSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  feature: z.nativeEnum(OrchestrationFeature),
  result: z.record(z.any()),
  rawResponse: z.any(),
  modelId: z.string(),
  status: z.nativeEnum(OrchestrationStatus),
  error: z.string().optional(),
  errorStack: z.string().optional(),
  processingTime: z.number(),
  createdAt: z.date()
});

/**
 * Zod schema for validating matching input data
 * Ensures proper structure for matchmaking operations
 */
export const MatchingOrchestrationInputSchema = z.object({
  operation: z.nativeEnum(MatchingOperation),
  userProfile: z.record(z.any()).optional(),
  userProfiles: z.array(z.record(z.any())).optional(),
  tribes: z.array(z.record(z.any())).optional(),
  tribeId: z.string().optional(),
  targetUserId: z.string().optional(),
  matchingCriteria: z.record(z.any()).optional(),
  maxResults: z.number().int().positive().optional().default(10)
});

/**
 * Zod schema for validating personality analysis input data
 * Ensures proper structure for personality operations
 */
export const PersonalityOrchestrationInputSchema = z.object({
  operation: z.nativeEnum(PersonalityOperation),
  assessmentResponses: z.record(z.any()).optional(),
  userProfile: z.record(z.any()).optional(),
  communicationData: z.record(z.any()).optional()
});

/**
 * Zod schema for validating engagement input data
 * Ensures proper structure for engagement operations
 */
export const EngagementOrchestrationInputSchema = z.object({
  operation: z.nativeEnum(EngagementOperation),
  tribeData: z.record(z.any()).optional(),
  memberProfiles: z.array(z.record(z.any())).optional(),
  engagementHistory: z.array(z.record(z.any())).optional(),
  activityPreferences: z.record(z.any()).optional(),
  count: z.number().int().positive().optional().default(3)
});

/**
 * Zod schema for validating recommendation input data
 * Ensures proper structure for recommendation operations
 */
export const RecommendationOrchestrationInputSchema = z.object({
  operation: z.nativeEnum(RecommendationOperation),
  tribeData: z.record(z.any()).optional(),
  memberProfiles: z.array(z.record(z.any())).optional(),
  location: z.record(z.any()).optional(),
  weatherData: z.record(z.any()).optional(),
  eventOptions: z.array(z.record(z.any())).optional(),
  budgetConstraints: z.record(z.any()).optional(),
  count: z.number().int().positive().optional().default(5)
});

/**
 * Zod schema for validating conversation input data
 * Ensures proper structure for conversation operations
 */
export const ConversationOrchestrationInputSchema = z.object({
  tribeData: z.record(z.any()).optional(),
  memberProfiles: z.array(z.record(z.any())).optional(),
  conversationHistory: z.array(z.record(z.any())).optional(),
  currentTopic: z.string().optional()
});