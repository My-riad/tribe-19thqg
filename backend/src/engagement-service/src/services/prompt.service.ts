import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import NodeCache from 'node-cache'; // ^5.1.2
import {
  PromptTemplate,
  PromptConfig,
  PromptData,
  RenderedPrompt,
  PromptCategory,
  PromptVariableType,
  IPromptDocument,
  IPromptModel,
  PromptType,
  IPromptCreate,
  IPromptUpdate,
  IPromptResponse,
  IPromptUsageUpdate,
  IPromptSearchParams,
} from '../models/prompt.model';
import { OrchestrationFeature } from '../models/orchestration.model';
import {
  renderPromptTemplate,
  validatePromptVariables,
  createRenderedPrompt,
  optimizePromptForFeature,
  validateTemplateVariablesMatch,
  getDefaultPromptForFeature,
} from '../utils/prompt.util';
import {
  validatePromptTemplate as validatePromptTemplateUtil,
  validatePromptConfig as validatePromptConfigUtil,
  validatePromptData as validatePromptDataUtil,
} from '../validations/prompt.validation';
import { prisma } from '../../../config/database';
import { logger } from '../../../shared/src/utils/logger.util';
import { ApiError } from '../../../shared/src/errors/api.error';
import { allPrompts } from '../prompts';
import { AIOrchestrationService } from '../../ai-orchestration-service/src/services/orchestration.service';

/**
 * Service for managing AI-driven prompts in the Tribe platform
 */
export class PromptService {
  private templateCache: NodeCache;
  private configCache: NodeCache;
  private initialized: boolean;
  private aiOrchestrationService: AIOrchestrationService;

  /**
   * Initialize the prompt service
   */
  constructor() {
    // Initialize template cache with TTL of 1 hour
    this.templateCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

    // Initialize config cache with TTL of 1 hour
    this.configCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

    // Set initialized flag to false
    this.initialized = false;

    // Initialize the AI orchestration service instance
    this.aiOrchestrationService = new AIOrchestrationService();
  }

  /**
   * Create a new prompt in the database
   * @param promptData - The data for the new prompt
   * @returns The created prompt
   */
  async createPrompt(promptData: IPromptCreate): Promise<IPromptResponse> {
    // Validate the prompt data
    if (!promptData) {
      throw ApiError.badRequest('Prompt data is required');
    }

    try {
      // Create a new prompt document using the Prompt model
      const newPrompt = await prisma.prompt.create({
        data: promptData,
      });

      // Transform the document to a response object
      const promptResponse = this.transformPromptToResponse(newPrompt);

      // Return the created prompt
      return promptResponse;
    } catch (error) {
      // Handle any errors during creation
      logger.error('Error creating prompt', error);
      throw ApiError.internal('Failed to create prompt', { error: (error as Error).message });
    }
  }

  /**
   * Retrieve a prompt by ID
   * @param promptId - The ID of the prompt to retrieve
   * @returns The retrieved prompt
   */
  async getPrompt(promptId: string): Promise<IPromptResponse> {
    // Validate the prompt ID
    if (!promptId) {
      throw ApiError.badRequest('Prompt ID is required');
    }

    try {
      // Query the database for the prompt with the given ID
      const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
      });

      // If not found, throw a not found error
      if (!prompt) {
        throw ApiError.notFound(`Prompt with ID ${promptId} not found`);
      }

      // Transform the document to a response object
      const promptResponse = this.transformPromptToResponse(prompt);

      // Return the prompt
      return promptResponse;
    } catch (error) {
      // Handle any errors during retrieval
      logger.error(`Error getting prompt with ID ${promptId}`, error);
      throw ApiError.internal('Failed to get prompt', { error: (error as Error).message });
    }
  }

  /**
   * Update an existing prompt
   * @param promptId - The ID of the prompt to update
   * @param updateData - The data to update the prompt with
   * @returns The updated prompt
   */
  async updatePrompt(promptId: string, updateData: IPromptUpdate): Promise<IPromptResponse> {
    // Validate the prompt ID and update data
    if (!promptId) {
      throw ApiError.badRequest('Prompt ID is required');
    }
    if (!updateData) {
      throw ApiError.badRequest('Update data is required');
    }

    try {
      // Find the prompt by ID
      const existingPrompt = await prisma.prompt.findUnique({
        where: { id: promptId },
      });

      // If not found, throw a not found error
      if (!existingPrompt) {
        throw ApiError.notFound(`Prompt with ID ${promptId} not found`);
      }

      // Update the prompt with the provided data
      const updatedPrompt = await prisma.prompt.update({
        where: { id: promptId },
        data: updateData,
      });

      // Transform the document to a response object
      const promptResponse = this.transformPromptToResponse(updatedPrompt);

      // Return the updated prompt
      return promptResponse;
    } catch (error) {
      // Handle any errors during update
      logger.error(`Error updating prompt with ID ${promptId}`, error);
      throw ApiError.internal('Failed to update prompt', { error: (error as Error).message });
    }
  }

  /**
   * Delete a prompt from the database
   * @param promptId - The ID of the prompt to delete
   * @returns True if the prompt was deleted
   */
  async deletePrompt(promptId: string): Promise<boolean> {
    // Validate the prompt ID
    if (!promptId) {
      throw ApiError.badRequest('Prompt ID is required');
    }

    try {
      // Find the prompt by ID
      const existingPrompt = await prisma.prompt.findUnique({
        where: { id: promptId },
      });

      // If not found, throw a not found error
      if (!existingPrompt) {
        throw ApiError.notFound(`Prompt with ID ${promptId} not found`);
      }

      // Delete the prompt from the database
      await prisma.prompt.delete({
        where: { id: promptId },
      });

      // Return true if deletion was successful
      return true;
    } catch (error) {
      // Handle any errors during deletion
      logger.error(`Error deleting prompt with ID ${promptId}`, error);
      throw ApiError.internal('Failed to delete prompt', { error: (error as Error).message });
    }
  }

  /**
   * List prompts with optional filtering and pagination
   * @param searchParams - Search parameters for filtering and pagination
   * @returns Paginated list of prompts
   */
  async listPrompts(searchParams: IPromptSearchParams): Promise<{ prompts: IPromptResponse[]; total: number; page: number; limit: number }> {
    // Extract filter criteria from search parameters
    const { type, category, tags, interestCategories, personalityTraits, aiGenerated, minResponseRate, excludeUsedInLast, page = 1, limit = 10 } = searchParams;

    try {
      // Build the query filter object
      const where: any = {};
      if (type) where.type = type;
      if (category) where.category = category;
      if (tags) where.tags = { hasSome: tags };
      if (interestCategories) where.interestCategories = { hasSome: interestCategories };
      if (personalityTraits) where.personalityTraits = { hasSome: personalityTraits };
      if (aiGenerated !== undefined) where.aiGenerated = aiGenerated;
      if (minResponseRate !== undefined) where.responseRate = { gte: minResponseRate };
      if (excludeUsedInLast !== undefined) {
        where.lastUsed = { lte: new Date(Date.now() - excludeUsedInLast * 24 * 60 * 60 * 1000) };
      }

      // Query the database with pagination
      const prompts = await prisma.prompt.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      });

      // Count total matching documents for pagination metadata
      const total = await prisma.prompt.count({ where });

      // Transform the documents to response objects
      const promptResponses = prompts.map((prompt) => this.transformPromptToResponse(prompt));

      // Return the prompts with pagination metadata
      return {
        prompts: promptResponses,
        total,
        page,
        limit,
      };
    } catch (error) {
      // Handle any errors during retrieval
      logger.error('Error listing prompts', error);
      throw ApiError.internal('Failed to list prompts', { error: (error as Error).message });
    }
  }

  /**
   * Find prompts relevant to a tribe based on interests and personality traits
   * @param criteria - Search criteria including type, category, interests, and personality traits
   * @returns Array of relevant prompts
   */
  async findRelevantPrompts(criteria: any): Promise<IPromptResponse[]> {
    // Extract type, category, interestCategories, and personalityTraits from criteria
    const { type, category, interestCategories, personalityTraits, limit } = criteria;

    try {
      // Build a query combining all provided criteria
      const where: any = {};
      if (type) where.type = type;
      if (category) where.category = category;
      if (interestCategories) where.interestCategories = { hasSome: interestCategories };
      if (personalityTraits) where.personalityTraits = { hasSome: personalityTraits };

      // Query the database for prompts matching the combined criteria
      let prompts = await prisma.prompt.findMany({
        where,
      });

      // If limit is specified, limit the number of results
      if (limit) {
        prompts = prompts.slice(0, limit);
      }

      // Transform the documents to response objects
      const promptResponses = prompts.map((prompt) => this.transformPromptToResponse(prompt));

      // Return the relevant prompts
      return promptResponses;
    } catch (error) {
      // Handle any errors during retrieval
      logger.error('Error finding relevant prompts', error);
      throw ApiError.internal('Failed to find relevant prompts', { error: (error as Error).message });
    }
  }

  /**
   * Get a random prompt of a specific type and category
   * @param type - The type of prompt to retrieve
   * @param category - The category of prompt to retrieve
   * @returns A random prompt
   */
  async getRandomPrompt(type: PromptType, category: PromptCategory): Promise<IPromptResponse> {
    // Validate the prompt type and category
    if (!type) {
      throw ApiError.badRequest('Prompt type is required');
    }
    if (!category) {
      throw ApiError.badRequest('Prompt category is required');
    }

    try {
      // Build a query filter with the type and category
      const where: any = {
        type,
        category,
      };

      // Query the database for matching prompts
      const prompts = await prisma.prompt.findMany({
        where,
      });

      // If no prompts found, throw a not found error
      if (!prompts || prompts.length === 0) {
        throw ApiError.notFound(`No prompts found for type ${type} and category ${category}`);
      }

      // Select a random prompt from the results
      const randomIndex = Math.floor(Math.random() * prompts.length);
      const randomPrompt = prompts[randomIndex];

      // Transform the document to a response object
      const promptResponse = this.transformPromptToResponse(randomPrompt);

      // Return the random prompt
      return promptResponse;
    } catch (error) {
      // Handle any errors during retrieval
      logger.error(`Error getting random prompt for type ${type} and category ${category}`, error);
      throw ApiError.internal('Failed to get random prompt', { error: (error as Error).message });
    }
  }

  /**
   * Update usage statistics for a prompt
   * @param promptId - The ID of the prompt to update
   * @param usageData - The usage data to update the prompt with
   * @returns The updated prompt
   */
  async updatePromptUsage(promptId: string, usageData: IPromptUsageUpdate): Promise<IPromptResponse> {
    // Validate the prompt ID and usage data
    if (!promptId) {
      throw ApiError.badRequest('Prompt ID is required');
    }
    if (!usageData) {
      throw ApiError.badRequest('Usage data is required');
    }

    try {
      // Find the prompt by ID
      const existingPrompt = await prisma.prompt.findUnique({
        where: { id: promptId },
      });

      // If not found, throw a not found error
      if (!existingPrompt) {
        throw ApiError.notFound(`Prompt with ID ${promptId} not found`);
      }

      // Update usage statistics based on provided data
      let updatedPrompt = await prisma.prompt.update({
        where: { id: promptId },
        data: {
          usageCount: {
            increment: usageData.used ? 1 : 0,
          },
          lastUsed: usageData.used ? new Date() : undefined,
        },
      });

      // Transform the document to a response object
      const promptResponse = this.transformPromptToResponse(updatedPrompt);

      // Return the updated prompt
      return promptResponse;
    } catch (error) {
      // Handle any errors during update
      logger.error(`Error updating prompt usage for prompt with ID ${promptId}`, error);
      throw ApiError.internal('Failed to update prompt usage', { error: (error as Error).message });
    }
  }

  /**
   * Seed the database with default prompts
   * @returns Number of prompts seeded
   */
  async seedDefaultPrompts(): Promise<number> {
    try {
      // Check if prompts already exist in the database
      const existingPrompts = await prisma.prompt.count();
      if (existingPrompts > 0) {
        logger.info('Default prompts already exist in the database');
        return existingPrompts;
      }

      // If no prompts exist, insert all default prompts from imported arrays
      await prisma.prompt.createMany({
        data: allPrompts,
      });

      // Log the number of prompts seeded
      const promptCount = await prisma.prompt.count();
      logger.info(`Seeded ${promptCount} default prompts into the database`);

      // Return the number of prompts seeded
      return promptCount;
    } catch (error) {
      // Handle any errors during seeding
      logger.error('Error seeding default prompts', error);
      throw ApiError.internal('Failed to seed default prompts', { error: (error as Error).message });
    }
  }

  /**
   * Generate a new prompt using AI based on provided context
   * @param promptRequest - The request object containing type, category, and context
   * @returns The generated prompt
   */
  async generateAIPrompt(promptRequest: any): Promise<IPromptResponse> {
    // Extract type, category, and context information from the request
    const { type, category, context } = promptRequest;

    try {
      // Prepare the prompt generation request for the AI orchestration service
      const aiRequest = {
        type,
        category,
        context,
      };

      // Call the AI orchestration service to generate the prompt content
      const aiResponse = await this.aiOrchestrationService.generatePrompt(aiRequest);
      const content = aiResponse.content;

      // Create a new prompt with the generated content
      const newPrompt = await prisma.prompt.create({
        data: {
          content,
          type,
          category,
          aiGenerated: true,
        },
      });

      // Transform the document to a response object
      const promptResponse = this.transformPromptToResponse(newPrompt);

      // Return the generated prompt
      return promptResponse;
    } catch (error) {
      // Handle any errors during generation
      logger.error('Error generating AI prompt', error);
      throw ApiError.internal('Failed to generate AI prompt', { error: (error as Error).message });
    }
  }

  /**
   * Transform a prompt document to a response object
   * @param prompt - The prompt document to transform
   * @returns The transformed prompt response
   */
  private transformPromptToResponse(prompt: any): IPromptResponse {
    // Extract relevant fields from the prompt document
    const { id, content, type, category, tags, interestCategories, personalityTraits, usageCount, responseRate, lastUsed, aiGenerated, createdAt, updatedAt } = prompt;

    // Format the response according to the IPromptResponse interface
    const promptResponse: IPromptResponse = {
      id,
      content,
      type,
      category,
      tags,
      interestCategories,
      personalityTraits,
      usageCount,
      responseRate,
      lastUsed,
      aiGenerated,
      createdAt,
      updatedAt,
    };

    // Return the formatted response object
    return promptResponse;
  }
}

export default new PromptService();