import Joi from 'joi'; // v17.9.2

import { idSchema, paginationSchema } from '../../../shared/src/validation/common.validation';
import { PromptType, PromptCategory } from '../models/prompt.model';
import { validateBody, validateParams, validateQuery } from '../../../shared/src/middlewares/validation.middleware';

// Validation constants
const PROMPT_CONTENT_MIN_LENGTH = 10;
const PROMPT_CONTENT_MAX_LENGTH = 1000;
const TAG_MIN_LENGTH = 2;
const TAG_MAX_LENGTH = 30;
const MAX_TAGS = 10;
const MAX_INTEREST_CATEGORIES = 10;
const MAX_PERSONALITY_TRAITS = 10;

/**
 * Schema for creating a new prompt
 * Validates required fields and enforces content length, valid types/categories, and array limits
 */
export const createPromptSchema = Joi.object({
  content: Joi.string().min(PROMPT_CONTENT_MIN_LENGTH).max(PROMPT_CONTENT_MAX_LENGTH).required(),
  type: Joi.string().valid(...Object.values(PromptType)).required(),
  category: Joi.string().valid(...Object.values(PromptCategory)).required(),
  tags: Joi.array().items(Joi.string().min(TAG_MIN_LENGTH).max(TAG_MAX_LENGTH)).max(MAX_TAGS).default([]),
  interestCategories: Joi.array().items(Joi.string()).max(MAX_INTEREST_CATEGORIES).default([]),
  personalityTraits: Joi.array().items(Joi.string()).max(MAX_PERSONALITY_TRAITS).default([]),
  aiGenerated: Joi.boolean().default(false),
  metadata: Joi.object().optional()
});

/**
 * Schema for updating an existing prompt
 * All fields are optional, and system-managed fields are excluded
 */
export const updatePromptSchema = Joi.object({
  content: Joi.string().min(PROMPT_CONTENT_MIN_LENGTH).max(PROMPT_CONTENT_MAX_LENGTH).optional(),
  tags: Joi.array().items(Joi.string().min(TAG_MIN_LENGTH).max(TAG_MAX_LENGTH)).max(MAX_TAGS).optional(),
  interestCategories: Joi.array().items(Joi.string()).max(MAX_INTEREST_CATEGORIES).optional(),
  personalityTraits: Joi.array().items(Joi.string()).max(MAX_PERSONALITY_TRAITS).optional(),
  metadata: Joi.object().optional()
});

/**
 * Schema for retrieving a single prompt by ID
 */
export const getPromptSchema = Joi.object({
  id: idSchema
});

/**
 * Schema for listing prompts with various filter criteria and pagination
 */
export const listPromptsSchema = Joi.object({
  type: Joi.string().valid(...Object.values(PromptType)).optional(),
  category: Joi.string().valid(...Object.values(PromptCategory)).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  interestCategories: Joi.array().items(Joi.string()).optional(),
  personalityTraits: Joi.array().items(Joi.string()).optional(),
  aiGenerated: Joi.boolean().optional(),
  minResponseRate: Joi.number().min(0).max(1).optional(),
  excludeUsedInLast: Joi.number().integer().min(1).optional(),
  ...paginationSchema
});

/**
 * Schema for updating prompt usage statistics
 * Tracks whether a prompt was used and if it received a response
 */
export const updatePromptUsageSchema = Joi.object({
  used: Joi.boolean().required(),
  receivedResponse: Joi.boolean().optional(),
  engagementId: idSchema.optional()
});

/**
 * Schema for generating an AI-powered prompt based on provided criteria
 */
export const generatePromptSchema = Joi.object({
  type: Joi.string().valid(...Object.values(PromptType)).required(),
  category: Joi.string().valid(...Object.values(PromptCategory)).optional(),
  interestCategories: Joi.array().items(Joi.string()).optional(),
  personalityTraits: Joi.array().items(Joi.string()).optional(),
  tribeId: idSchema.optional()
});

// Middleware functions for validating different prompt-related requests
export const validateCreatePrompt = validateBody(createPromptSchema);
export const validateUpdatePrompt = validateBody(updatePromptSchema);
export const validateGetPrompt = validateParams(getPromptSchema);
export const validateListPrompts = validateQuery(listPromptsSchema);
export const validateUpdatePromptUsage = validateBody(updatePromptUsageSchema);
export const validateGeneratePrompt = validateBody(generatePromptSchema);