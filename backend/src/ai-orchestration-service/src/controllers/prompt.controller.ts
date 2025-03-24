import { Request, Response, NextFunction, Router } from 'express';
import { PromptService } from '../services/prompt.service';
import { 
  PromptTemplate, 
  PromptConfig, 
  PromptData, 
  RenderedPrompt, 
  PromptCategory, 
  OrchestrationFeature 
} from '../models/prompt.model';
import {
  createPromptTemplateValidation,
  updatePromptTemplateValidation,
  createPromptConfigValidation,
  updatePromptConfigValidation,
  promptDataValidation
} from '../validations/prompt.validation';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../config/logging';

// Initialize the prompt service
const promptService = new PromptService();

/**
 * Creates a new prompt template
 */
async function createPromptTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const templateData: Partial<PromptTemplate> = req.body;
    const createdTemplate = await promptService.createPromptTemplate(templateData);
    logger.info(`Prompt template created: ${createdTemplate.id}`, { feature: createdTemplate.feature });
    res.status(201).json(createdTemplate);
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves a prompt template by ID
 */
async function getPromptTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const templateId = req.params.id;
    const template = await promptService.getPromptTemplate(templateId);
    res.status(200).json(template);
  } catch (error) {
    next(error);
  }
}

/**
 * Updates an existing prompt template
 */
async function updatePromptTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const templateId = req.params.id;
    const templateData: Partial<PromptTemplate> = req.body;
    const updatedTemplate = await promptService.updatePromptTemplate(templateId, templateData);
    logger.info(`Prompt template updated: ${updatedTemplate.id}`, { feature: updatedTemplate.feature });
    res.status(200).json(updatedTemplate);
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes a prompt template
 */
async function deletePromptTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const templateId = req.params.id;
    await promptService.deletePromptTemplate(templateId);
    logger.info(`Prompt template deleted: ${templateId}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves prompt templates with optional filtering
 */
async function getPromptTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters: Record<string, any> = {};
    
    // Add optional filters if provided
    if (req.query.category) filters.category = req.query.category;
    if (req.query.feature) filters.feature = req.query.feature;
    if (req.query.active !== undefined) filters.active = req.query.active === 'true';
    if (req.query.name) filters.name = req.query.name;
    
    const templates = await promptService.getPromptTemplates(filters);
    res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
}

/**
 * Creates a new prompt configuration
 */
async function createPromptConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const configData: Partial<PromptConfig> = req.body;
    const createdConfig = await promptService.createPromptConfig(configData);
    logger.info(`Prompt configuration created: ${createdConfig.id}`, { feature: createdConfig.feature });
    res.status(201).json(createdConfig);
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves a prompt configuration by ID
 */
async function getPromptConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const configId = req.params.id;
    const config = await promptService.getPromptConfig(configId);
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
}

/**
 * Updates an existing prompt configuration
 */
async function updatePromptConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const configId = req.params.id;
    const configData: Partial<PromptConfig> = req.body;
    const updatedConfig = await promptService.updatePromptConfig(configId, configData);
    logger.info(`Prompt configuration updated: ${updatedConfig.id}`, { feature: updatedConfig.feature });
    res.status(200).json(updatedConfig);
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes a prompt configuration
 */
async function deletePromptConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const configId = req.params.id;
    await promptService.deletePromptConfig(configId);
    logger.info(`Prompt configuration deleted: ${configId}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves prompt configurations with optional filtering
 */
async function getPromptConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters: Record<string, any> = {};
    
    // Add optional filters if provided
    if (req.query.feature) filters.feature = req.query.feature;
    if (req.query.isDefault !== undefined) filters.isDefault = req.query.isDefault === 'true';
    if (req.query.active !== undefined) filters.active = req.query.active === 'true';
    if (req.query.name) filters.name = req.query.name;
    
    const configs = await promptService.getPromptConfigs(filters);
    res.status(200).json(configs);
  } catch (error) {
    next(error);
  }
}

/**
 * Gets the default prompt configuration for a specific feature
 */
async function getDefaultConfigForFeature(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const feature = req.params.feature as OrchestrationFeature;
    
    // Validate feature is a valid OrchestrationFeature
    if (!Object.values(OrchestrationFeature).includes(feature)) {
      throw ApiError.badRequest(`Invalid feature: ${feature}`, { 
        validFeatures: Object.values(OrchestrationFeature) 
      });
    }
    
    const config = await promptService.getDefaultConfigForFeature(feature);
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
}

/**
 * Sets a prompt configuration as the default for a feature
 */
async function setDefaultConfigForFeature(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const configId = req.params.id;
    const feature = req.body.feature as OrchestrationFeature;
    
    // Validate feature is a valid OrchestrationFeature
    if (!Object.values(OrchestrationFeature).includes(feature)) {
      throw ApiError.badRequest(`Invalid feature: ${feature}`, { 
        validFeatures: Object.values(OrchestrationFeature) 
      });
    }
    
    const config = await promptService.setDefaultConfigForFeature(configId, feature);
    logger.info(`Set configuration ${configId} as default for feature: ${feature}`);
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
}

/**
 * Renders a prompt template with provided variables
 */
async function renderPrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const promptData: PromptData = req.body;
    const renderedPrompt = await promptService.renderPrompt(promptData);
    res.status(200).json(renderedPrompt);
  } catch (error) {
    next(error);
  }
}

/**
 * Renders all templates in a prompt configuration
 */
async function renderPromptConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const configId = req.params.id;
    const variables = req.body;
    const renderedPrompts = await promptService.renderPromptConfig(configId, variables);
    res.status(200).json(renderedPrompts);
  } catch (error) {
    next(error);
  }
}

// Create router and set up routes
const promptRouter = Router();

// Prompt Template routes
promptRouter.post('/templates', createPromptTemplateValidation, createPromptTemplate);
promptRouter.get('/templates/:id', getPromptTemplate);
promptRouter.put('/templates/:id', updatePromptTemplateValidation, updatePromptTemplate);
promptRouter.delete('/templates/:id', deletePromptTemplate);
promptRouter.get('/templates', getPromptTemplates);

// Prompt Configuration routes
promptRouter.post('/configs', createPromptConfigValidation, createPromptConfig);
promptRouter.get('/configs/:id', getPromptConfig);
promptRouter.put('/configs/:id', updatePromptConfigValidation, updatePromptConfig);
promptRouter.delete('/configs/:id', deletePromptConfig);
promptRouter.get('/configs', getPromptConfigs);

// Default configuration routes
promptRouter.get('/features/:feature/default-config', getDefaultConfigForFeature);
promptRouter.post('/configs/:id/set-default', setDefaultConfigForFeature);

// Rendering routes
promptRouter.post('/render', promptDataValidation, renderPrompt);
promptRouter.post('/configs/:id/render', renderPromptConfig);

export { promptRouter };