import { Router, Request, Response, NextFunction } from 'express'; // express ^4.18.2
import promptService from '../services/prompt.service';
import {
  validateCreatePrompt,
  validateUpdatePrompt,
  validateGetPrompt,
  validateListPrompts,
  validateUpdatePromptUsage,
  validateGeneratePrompt,
} from '../validations/prompt.validation';
import { PromptType, PromptCategory } from '../models/prompt.model';
import { logger } from '../../../shared/src/utils/logger.util';
import { ApiError } from '../../../shared/src/errors/api.error';

/**
 * Controller class for handling prompt-related HTTP requests
 */
class PromptController {
  public router: Router;

  /**
   * Initialize the prompt controller and set up routes
   */
  constructor() {
    // Initialize Express router
    this.router = Router();

    // Set up routes for prompt management
    this.router.post('/', validateCreatePrompt, this.createPrompt.bind(this));
    this.router.get('/:id', validateGetPrompt, this.getPrompt.bind(this));
    this.router.put('/:id', validateUpdatePrompt, this.updatePrompt.bind(this));
    this.router.delete('/:id', validateGetPrompt, this.deletePrompt.bind(this));
    this.router.get('/', validateListPrompts, this.listPrompts.bind(this));
    this.router.get('/relevant', this.findRelevantPrompts.bind(this));
    this.router.get('/random', this.getRandomPrompt.bind(this));
    this.router.post('/seed', this.seedPrompts.bind(this));

    // Set up routes for prompt usage and generation
    this.router.put('/:id/usage', validateUpdatePromptUsage, this.updatePromptUsage.bind(this));
    this.router.post('/generate', validateGeneratePrompt, this.generatePrompt.bind(this));
  }

  /**
   * Get the configured router for prompt endpoints
   * @returns Configured Express router
   */
  public getRouter(): Router {
    // Return the initialized router
    return this.router;
  }

  /**
   * Create a new prompt
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async createPrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract prompt data from request body
      const promptData = req.body;

      // Call promptService.createPrompt with the data
      const newPrompt = await promptService.createPrompt(promptData);

      // Return 201 status with the created prompt
      res.status(201).json(newPrompt);
    } catch (error) {
      // Catch and forward any errors to the error handler
      next(error);
    }
  }

  /**
   * Get a prompt by ID
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async getPrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract prompt ID from request parameters
      const promptId = req.params.id;

      // Call promptService.getPrompt with the ID
      const prompt = await promptService.getPrompt(promptId);

      // Return 200 status with the prompt data
      res.status(200).json(prompt);
    } catch (error) {
      // Catch and forward any errors to the error handler
      next(error);
    }
  }

  /**
   * Update an existing prompt
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async updatePrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract prompt ID from request parameters
      const promptId = req.params.id;

      // Extract update data from request body
      const updateData = req.body;

      // Call promptService.updatePrompt with the ID and update data
      const updatedPrompt = await promptService.updatePrompt(promptId, updateData);

      // Return 200 status with the updated prompt
      res.status(200).json(updatedPrompt);
    } catch (error) {
      // Catch and forward any errors to the error handler
      next(error);
    }
  }

  /**
   * Delete a prompt
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async deletePrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract prompt ID from request parameters
      const promptId = req.params.id;

      // Call promptService.deletePrompt with the ID
      await promptService.deletePrompt(promptId);

      // Return 204 status with no content
      res.status(204).send();
    } catch (error) {
      // Catch and forward any errors to the error handler
      next(error);
    }
  }

  /**
   * List prompts with optional filtering and pagination
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async listPrompts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract search parameters from request query
      const searchParams = req.query;

      // Call promptService.listPrompts with the search parameters
      const promptsData = await promptService.listPrompts(searchParams);

      // Return 200 status with the prompts and pagination metadata
      res.status(200).json(promptsData);
    } catch (error) {
      // Catch and forward any errors to the error handler
      next(error);
    }
  }

  /**
   * Find prompts relevant to a tribe based on interests and personality traits
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async findRelevantPrompts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract search criteria from request query
      const criteria = req.query;

      // Call promptService.findRelevantPrompts with the criteria
      const relevantPrompts = await promptService.findRelevantPrompts(criteria);

      // Return 200 status with the relevant prompts
      res.status(200).json(relevantPrompts);
    } catch (error) {
      // Catch and forward any errors to the error handler
      next(error);
    }
  }

  /**
   * Get a random prompt of a specific type and category
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async getRandomPrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract type and category from request query
      const { type, category } = req.query;

      // Call promptService.getRandomPrompt with the type and category
      const randomPrompt = await promptService.getRandomPrompt(type as PromptType, category as PromptCategory);

      // Return 200 status with the random prompt
      res.status(200).json(randomPrompt);
    } catch (error) {
      // Catch and forward any errors to the error handler
      next(error);
    }
  }

  /**
   * Update usage statistics for a prompt
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async updatePromptUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract prompt ID from request parameters
      const promptId = req.params.id;

      // Extract usage data from request body
      const usageData = req.body;

      // Call promptService.updatePromptUsage with the ID and usage data
      const updatedPrompt = await promptService.updatePromptUsage(promptId, usageData);

      // Return 200 status with the updated prompt
      res.status(200).json(updatedPrompt);
    } catch (error) {
      // Catch and forward any errors to the error handler
      next(error);
    }
  }

  /**
   * Seed the database with default prompts
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async seedPrompts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Call promptService.seedDefaultPrompts
      const promptCount = await promptService.seedDefaultPrompts();

      // Return 200 status with the number of prompts seeded
      res.status(200).json({ message: `Successfully seeded ${promptCount} prompts` });
    } catch (error) {
      // Catch and forward any errors to the error handler
      next(error);
    }
  }

  /**
   * Generate a new prompt using AI based on provided context
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  private async generatePrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract prompt generation request from request body
      const promptRequest = req.body;

      // Call promptService.generateAIPrompt with the request
      const generatedPrompt = await promptService.generateAIPrompt(promptRequest);

      // Return 201 status with the generated prompt
      res.status(201).json(generatedPrompt);
    } catch (error) {
      // Catch and forward any errors to the error handler
      next(error);
    }
  }
}

export default new PromptController();