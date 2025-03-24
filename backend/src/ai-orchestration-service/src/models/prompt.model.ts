import { OrchestrationFeature } from './orchestration.model';
import * as z from 'zod'; // v3.21.4

/**
 * Enum defining the categories of prompts in a conversation context
 */
export enum PromptCategory {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant'
}

/**
 * Enum defining the supported variable types in prompt templates
 */
export enum PromptVariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object'
}

/**
 * Interface defining a variable that can be used in a prompt template
 */
export interface PromptVariable {
  /** Name of the variable */
  name: string;
  /** Type of the variable */
  type: PromptVariableType;
  /** Description of the variable for documentation */
  description: string;
  /** Whether the variable is required */
  required: boolean;
  /** Default value if not provided */
  defaultValue?: any;
}

/**
 * Interface defining a prompt template with variables and metadata
 */
export interface PromptTemplate {
  /** Unique identifier for the template */
  id: string;
  /** Name of the template */
  name: string;
  /** Description of the template */
  description: string;
  /** Template text with variable placeholders */
  template: string;
  /** Variables used in the template */
  variables: PromptVariable[];
  /** Category of the prompt */
  category: PromptCategory;
  /** Feature this template is used for */
  feature: OrchestrationFeature;
  /** Version of the template */
  version: string;
  /** Whether the template is active */
  active: boolean;
  /** When the template was created */
  createdAt: Date;
  /** When the template was last updated */
  updatedAt: Date;
}

/**
 * Interface defining a configuration of system, user, and assistant prompts for a feature
 */
export interface PromptConfig {
  /** Unique identifier for the configuration */
  id: string;
  /** Name of the configuration */
  name: string;
  /** Description of the configuration */
  description: string;
  /** Feature this configuration is for */
  feature: OrchestrationFeature;
  /** ID of the system prompt template */
  systemPromptId: string;
  /** ID of the user prompt template */
  userPromptId: string;
  /** ID of the assistant prompt template */
  assistantPromptId: string;
  /** Whether this is the default configuration for the feature */
  isDefault: boolean;
  /** Whether the configuration is active */
  active: boolean;
  /** Version of the configuration */
  version: string;
  /** When the configuration was created */
  createdAt: Date;
  /** When the configuration was last updated */
  updatedAt: Date;
}

/**
 * Interface for providing data to render a prompt template
 */
export interface PromptData {
  /** ID of the template to render */
  templateId: string;
  /** Variables to use in rendering */
  variables: Record<string, any>;
  /** Feature this prompt is for (for validation) */
  feature: OrchestrationFeature;
}

/**
 * Interface for a rendered prompt with content and metadata
 */
export interface RenderedPrompt {
  /** Unique identifier for the rendered prompt */
  id: string;
  /** ID of the template used */
  templateId: string;
  /** Rendered content */
  content: string;
  /** Category of the prompt */
  category: PromptCategory;
  /** Feature this prompt is for */
  feature: OrchestrationFeature;
  /** Variables used in rendering */
  variables: Record<string, any>;
  /** Number of tokens in the rendered content */
  tokenCount: number;
  /** When the prompt was rendered */
  createdAt: Date;
}

/**
 * Zod schema for validating prompt variables
 */
export const PromptVariableSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(PromptVariableType),
  description: z.string(),
  required: z.boolean(),
  defaultValue: z.any().optional()
});

/**
 * Zod schema for validating prompt templates
 */
export const PromptTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  template: z.string(),
  variables: z.array(PromptVariableSchema),
  category: z.nativeEnum(PromptCategory),
  feature: z.nativeEnum(OrchestrationFeature),
  version: z.string(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Zod schema for validating prompt configurations
 */
export const PromptConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  feature: z.nativeEnum(OrchestrationFeature),
  systemPromptId: z.string(),
  userPromptId: z.string(),
  assistantPromptId: z.string(),
  isDefault: z.boolean(),
  active: z.boolean(),
  version: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Zod schema for validating prompt data
 */
export const PromptDataSchema = z.object({
  templateId: z.string(),
  variables: z.record(z.any()),
  feature: z.nativeEnum(OrchestrationFeature)
});

/**
 * Zod schema for validating rendered prompts
 */
export const RenderedPromptSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  content: z.string(),
  category: z.nativeEnum(PromptCategory),
  feature: z.nativeEnum(OrchestrationFeature),
  variables: z.record(z.any()),
  tokenCount: z.number().int().nonnegative(),
  createdAt: z.date()
});

/**
 * Interface for variables specific to matching prompts
 */
export interface MatchingPromptVariables {
  /** Profile of the user to match */
  userProfile: Record<string, any>;
  /** Collection of user profiles for matching */
  userProfiles: Record<string, any>[];
  /** Tribes to consider for matching */
  tribes: Record<string, any>[];
  /** Specific matching criteria to apply */
  matchingCriteria: Record<string, any>;
}

/**
 * Interface for variables specific to personality analysis prompts
 */
export interface PersonalityPromptVariables {
  /** Assessment responses to analyze */
  assessmentResponses: Record<string, any>;
  /** User profile data */
  userProfile: Record<string, any>;
  /** Communication data to analyze */
  communicationData: Record<string, any>;
}

/**
 * Interface for variables specific to engagement prompts
 */
export interface EngagementPromptVariables {
  /** Tribe data for context */
  tribeData: Record<string, any>;
  /** Profiles of tribe members */
  memberProfiles: Record<string, any>[];
  /** History of previous engagements */
  engagementHistory: Record<string, any>[];
  /** Activity preferences for the tribe */
  activityPreferences: Record<string, any>;
}

/**
 * Interface for variables specific to recommendation prompts
 */
export interface RecommendationPromptVariables {
  /** Tribe data for context */
  tribeData: Record<string, any>;
  /** Profiles of tribe members */
  memberProfiles: Record<string, any>[];
  /** Location data for geo-specific recommendations */
  location: Record<string, any>;
  /** Weather data for context-aware recommendations */
  weatherData: Record<string, any>;
  /** Available event options to rank */
  eventOptions: Record<string, any>[];
  /** Budget constraints for recommendations */
  budgetConstraints: Record<string, any>;
}

/**
 * Interface for variables specific to conversation prompts
 */
export interface ConversationPromptVariables {
  /** Tribe data for context */
  tribeData: Record<string, any>;
  /** Profiles of tribe members */
  memberProfiles: Record<string, any>[];
  /** History of previous conversations */
  conversationHistory: Record<string, any>[];
  /** Current conversation topic */
  currentTopic: string;
}

/**
 * Zod schema for validating matching prompt variables
 */
export const MatchingPromptVariablesSchema = z.object({
  userProfile: z.record(z.any()),
  userProfiles: z.array(z.record(z.any())),
  tribes: z.array(z.record(z.any())),
  matchingCriteria: z.record(z.any())
});

/**
 * Zod schema for validating personality prompt variables
 */
export const PersonalityPromptVariablesSchema = z.object({
  assessmentResponses: z.record(z.any()),
  userProfile: z.record(z.any()),
  communicationData: z.record(z.any())
});

/**
 * Zod schema for validating engagement prompt variables
 */
export const EngagementPromptVariablesSchema = z.object({
  tribeData: z.record(z.any()),
  memberProfiles: z.array(z.record(z.any())),
  engagementHistory: z.array(z.record(z.any())),
  activityPreferences: z.record(z.any())
});

/**
 * Zod schema for validating recommendation prompt variables
 */
export const RecommendationPromptVariablesSchema = z.object({
  tribeData: z.record(z.any()),
  memberProfiles: z.array(z.record(z.any())),
  location: z.record(z.any()),
  weatherData: z.record(z.any()),
  eventOptions: z.array(z.record(z.any())),
  budgetConstraints: z.record(z.any())
});

/**
 * Zod schema for validating conversation prompt variables
 */
export const ConversationPromptVariablesSchema = z.object({
  tribeData: z.record(z.any()),
  memberProfiles: z.array(z.record(z.any())),
  conversationHistory: z.array(z.record(z.any())),
  currentTopic: z.string()
});