import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { ModelService } from '../services/model.service';
import { ModelConfig, ModelProvider, ModelCapability, ModelParameters } from '../models/model.model';
import { OrchestrationFeature } from '../models/orchestration.model';
import { validateBody, validateParams, validateQuery } from '../../../shared/src/middlewares/validation.middleware';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../config/logging';

// Zod schemas for request validation
export const modelIdParamSchema = z.object({
  modelId: z.string().min(1, "Model ID is required")
});

export const providerQuerySchema = z.object({
  provider: z.nativeEnum(ModelProvider, {
    errorMap: () => ({ message: `Provider must be one of: ${Object.values(ModelProvider).join(', ')}` })
  }),
  activeOnly: z.string().optional().transform(val => val !== 'false') // default to true if not 'false'
});

export const capabilitiesQuerySchema = z.object({
  capabilities: z.union([
    z.nativeEnum(ModelCapability),
    z.string().transform(val => val.split(',').map(c => c.trim()) as ModelCapability[])
  ]),
  activeOnly: z.string().optional().transform(val => val !== 'false') // default to true if not 'false'
});

export const featureQuerySchema = z.object({
  feature: z.nativeEnum(OrchestrationFeature, {
    errorMap: () => ({ message: `Feature must be one of: ${Object.values(OrchestrationFeature).join(', ')}` })
  }),
  preferredModelId: z.string().optional()
});

export const modelCapabilitiesBodySchema = z.object({
  capabilities: z.array(z.nativeEnum(ModelCapability, {
    errorMap: () => ({ message: `Capabilities must be one of: ${Object.values(ModelCapability).join(', ')}` })
  }))
});

export const modelParametersBodySchema = z.object({
  parameters: z.object({
    temperature: z.number().min(0).max(1),
    maxTokens: z.number().int().positive(),
    topP: z.number().min(0).max(1),
    presencePenalty: z.number().min(-2).max(2),
    frequencyPenalty: z.number().min(-2).max(2),
    stopSequences: z.array(z.string())
  })
});

// Middleware for validating requests
export const validateModelIdParam = validateParams(modelIdParamSchema);
export const validateProviderQuery = validateQuery(providerQuerySchema);
export const validateCapabilitiesQuery = validateQuery(capabilitiesQuerySchema);
export const validateFeatureQuery = validateQuery(featureQuerySchema);
export const validateModelCapabilitiesBody = validateBody(modelCapabilitiesBodySchema);
export const validateModelParametersBody = validateBody(modelParametersBodySchema);

/**
 * Controller class for handling AI model-related HTTP requests
 */
export class ModelController {
  private modelService: ModelService;

  /**
   * Initialize the model controller with required services
   * 
   * @param modelService - Service for managing AI models
   */
  constructor(modelService: ModelService) {
    this.modelService = modelService;
    this.modelService.initialize().catch(error => {
      logger.error('Failed to initialize model service', error);
    });
  }

  /**
   * Get a model by ID
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getModel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { modelId } = req.params;
      logger.info('Getting model by ID', { modelId });
      
      const model = await this.modelService.getModel(modelId);
      
      if (!model) {
        throw ApiError.notFound(`Model with ID '${modelId}' not found`);
      }
      
      res.status(200).json(model);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all available models with optional active-only filter
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getModels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly !== 'false'; // Default to true
      logger.info('Getting all models', { activeOnly });
      
      const models = await this.modelService.getModels(activeOnly);
      
      res.status(200).json(models);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get models from a specific provider
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getModelsByProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provider } = req.query as { provider: ModelProvider };
      const activeOnly = req.query.activeOnly !== 'false'; // Default to true
      logger.info('Getting models by provider', { provider, activeOnly });
      
      const models = await this.modelService.getModelsByProvider(provider, activeOnly);
      
      res.status(200).json(models);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get models with specific capabilities
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getModelsByCapability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { capabilities } = req.query as { capabilities: ModelCapability[] };
      const activeOnly = req.query.activeOnly !== 'false'; // Default to true
      logger.info('Getting models by capabilities', { capabilities, activeOnly });
      
      const models = await this.modelService.getModelsByCapability(capabilities, activeOnly);
      
      res.status(200).json(models);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the most appropriate model for a specific feature
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getModelForFeature(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { feature, preferredModelId } = req.query as { 
        feature: OrchestrationFeature;
        preferredModelId?: string;
      };
      logger.info('Getting model for feature', { feature, preferredModelId });
      
      const model = await this.modelService.getModelForFeature(feature, preferredModelId);
      
      res.status(200).json(model);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate that a model with the given ID exists
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async validateModelExists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { modelId } = req.params;
      logger.info('Validating model exists', { modelId });
      
      const exists = await this.modelService.validateModelExists(modelId);
      
      res.status(200).json({ valid: exists });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate that a model has the required capabilities
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async validateModelCapability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { modelId } = req.params;
      const { capabilities } = req.body as { capabilities: ModelCapability[] };
      logger.info('Validating model capabilities', { modelId, capabilities });
      
      const valid = await this.modelService.validateModelCapability(modelId, capabilities);
      
      res.status(200).json({ valid });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate and prepare model parameters for use
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async validateAndPrepareParameters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { modelId } = req.params;
      const { parameters } = req.body as { parameters: ModelParameters };
      logger.info('Validating and preparing model parameters', { modelId });
      
      const validatedParameters = await this.modelService.validateAndPrepareParameters(modelId, parameters);
      
      res.status(200).json(validatedParameters);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh the available models from the OpenRouter API
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async refreshModels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Refreshing models from OpenRouter API');
      
      const models = await this.modelService.refreshModels();
      
      res.status(200).json(Array.from(models.values()));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear the model service cache
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async clearCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Clearing model service cache');
      
      this.modelService.clearCache();
      
      res.status(200).json({ success: true, message: 'Cache cleared successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check the health status of the model service
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Checking model service health');
      
      const healthy = await this.modelService.getHealth();
      
      res.status(healthy ? 200 : 503).json({
        status: healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}