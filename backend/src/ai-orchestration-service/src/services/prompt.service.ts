import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import NodeCache from 'node-cache'; // v5.1.2
import {
  PromptTemplate,
  PromptConfig,
  PromptData,
  RenderedPrompt,
  PromptCategory,
  PromptVariableType
} from '../models/prompt.model';
import { OrchestrationFeature } from '../models/orchestration.model';
import {
  renderPromptTemplate,
  validatePromptVariables,
  createRenderedPrompt,
  optimizePromptForFeature,
  validateTemplateVariablesMatch,
  getDefaultPromptForFeature
} from '../utils/prompt.util';
import {
  validatePromptTemplate,
  validatePromptConfig,
  validatePromptData
} from '../validations/prompt.validation';
import { prisma } from '../../../config/database';
import { logger } from '../../../config/logging';
import { ApiError } from '../../../shared/src/errors/api.error';

/**
 * Service for managing AI prompt templates, configurations, and rendering
 */
export class PromptService {
  private templateCache: NodeCache;
  private configCache: NodeCache;
  private initialized: boolean;

  /**
   * Initialize the prompt service with caching
   */
  constructor() {
    // Initialize template cache with TTL of 1 hour
    this.templateCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
    
    // Initialize config cache with TTL of 1 hour
    this.configCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
    
    // Set initialized flag to false
    this.initialized = false;
  }

  /**
   * Initialize the prompt service by loading default templates and configurations
   * 
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // Check if service is already initialized
    if (this.initialized) {
      logger.debug('Prompt service already initialized');
      return;
    }

    try {
      logger.info('Initializing prompt service');
      
      // Ensure default templates exist for each feature and category
      await this.ensureDefaultTemplatesExist();
      
      // Ensure default configurations exist for each feature
      await this.ensureDefaultConfigsExist();
      
      logger.info('Prompt service initialized successfully');
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize prompt service', error as Error);
      throw ApiError.internal('Failed to initialize prompt service', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Create a new prompt template
   * 
   * @param templateData - Partial template data to create
   * @returns The created prompt template
   */
  async createPromptTemplate(templateData: Partial<PromptTemplate>): Promise<PromptTemplate> {
    await this.ensureInitialized();

    try {
      // Generate a unique ID for the template
      const id = templateData.id || uuidv4();
      
      // Set creation and update timestamps
      const now = new Date();
      const template: PromptTemplate = {
        id,
        name: templateData.name || '',
        description: templateData.description || '',
        template: templateData.template || '',
        variables: templateData.variables || [],
        category: templateData.category || PromptCategory.SYSTEM,
        feature: templateData.feature || OrchestrationFeature.MATCHING,
        version: templateData.version || '1.0.0',
        active: templateData.active !== undefined ? templateData.active : true,
        createdAt: templateData.createdAt || now,
        updatedAt: templateData.updatedAt || now
      };
      
      // Validate the template
      validatePromptTemplate(template);
      
      // Validate that template variables match placeholders
      validateTemplateVariablesMatch(template);
      
      // Store template in database
      const createdTemplate = await prisma.promptTemplate.create({
        data: template
      });
      
      // Add template to cache
      this.templateCache.set(createdTemplate.id, createdTemplate);
      
      logger.info(`Created prompt template: ${createdTemplate.id}`, { 
        feature: createdTemplate.feature, 
        category: createdTemplate.category 
      });
      
      return createdTemplate;
    } catch (error) {
      logger.error('Failed to create prompt template', error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to create prompt template', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Retrieve a prompt template by ID
   * 
   * @param templateId - The ID of the template to retrieve
   * @returns The prompt template
   */
  async getPromptTemplate(templateId: string): Promise<PromptTemplate> {
    await this.ensureInitialized();

    try {
      // Check cache first
      const cachedTemplate = this.templateCache.get<PromptTemplate>(templateId);
      if (cachedTemplate) {
        logger.debug(`Retrieved prompt template from cache: ${templateId}`);
        return cachedTemplate;
      }
      
      // Query database if not in cache
      const template = await prisma.promptTemplate.findUnique({
        where: { id: templateId }
      });
      
      if (!template) {
        throw ApiError.notFound(`Prompt template not found: ${templateId}`);
      }
      
      // Add to cache
      this.templateCache.set(templateId, template);
      
      return template;
    } catch (error) {
      logger.error(`Failed to get prompt template: ${templateId}`, error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to get prompt template', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Update an existing prompt template
   * 
   * @param templateId - The ID of the template to update
   * @param templateData - The updated template data
   * @returns The updated prompt template
   */
  async updatePromptTemplate(
    templateId: string,
    templateData: Partial<PromptTemplate>
  ): Promise<PromptTemplate> {
    await this.ensureInitialized();

    try {
      // Get existing template
      const existingTemplate = await this.getPromptTemplate(templateId);
      
      // Merge existing template with update data
      const updatedTemplate: PromptTemplate = {
        ...existingTemplate,
        ...templateData,
        id: templateId, // Ensure ID remains the same
        updatedAt: new Date(), // Update timestamp
      };
      
      // Validate the updated template
      validatePromptTemplate(updatedTemplate);
      
      // Validate that template variables match placeholders
      validateTemplateVariablesMatch(updatedTemplate);
      
      // Update in database
      const result = await prisma.promptTemplate.update({
        where: { id: templateId },
        data: updatedTemplate
      });
      
      // Update cache
      this.templateCache.set(templateId, result);
      
      logger.info(`Updated prompt template: ${templateId}`, { 
        feature: result.feature, 
        category: result.category 
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to update prompt template: ${templateId}`, error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to update prompt template', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Delete a prompt template
   * 
   * @param templateId - The ID of the template to delete
   * @returns True if template was deleted
   */
  async deletePromptTemplate(templateId: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      // Check if template exists
      const template = await this.getPromptTemplate(templateId);
      
      // Check if template is used in any configurations
      const configs = await prisma.promptConfig.findMany({
        where: {
          OR: [
            { systemPromptId: templateId },
            { userPromptId: templateId },
            { assistantPromptId: templateId }
          ]
        }
      });
      
      if (configs.length > 0) {
        throw ApiError.badRequest(
          `Cannot delete prompt template that is used in ${configs.length} configurations`,
          { configIds: configs.map(c => c.id) }
        );
      }
      
      // Delete from database
      await prisma.promptTemplate.delete({
        where: { id: templateId }
      });
      
      // Remove from cache
      this.templateCache.del(templateId);
      
      logger.info(`Deleted prompt template: ${templateId}`, { 
        feature: template.feature, 
        category: template.category 
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete prompt template: ${templateId}`, error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to delete prompt template', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Retrieve prompt templates with optional filtering
   * 
   * @param filters - Optional filters for querying templates
   * @returns Array of prompt templates
   */
  async getPromptTemplates(filters: object = {}): Promise<PromptTemplate[]> {
    await this.ensureInitialized();

    try {
      // Build query filters based on provided filters object
      const queryFilters: any = {};
      
      if ('feature' in filters) {
        queryFilters.feature = filters['feature'];
      }
      
      if ('category' in filters) {
        queryFilters.category = filters['category'];
      }
      
      if ('active' in filters) {
        queryFilters.active = filters['active'];
      }
      
      if ('name' in filters) {
        queryFilters.name = {
          contains: filters['name'],
          mode: 'insensitive'
        };
      }
      
      // Query database with prisma.promptTemplate.findMany
      const templates = await prisma.promptTemplate.findMany({
        where: queryFilters,
        orderBy: { updatedAt: 'desc' }
      });
      
      return templates;
    } catch (error) {
      logger.error('Failed to get prompt templates', error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to get prompt templates', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Create a new prompt configuration
   * 
   * @param configData - Partial configuration data to create
   * @returns The created prompt configuration
   */
  async createPromptConfig(configData: Partial<PromptConfig>): Promise<PromptConfig> {
    await this.ensureInitialized();

    try {
      // Generate a unique ID for the configuration
      const id = configData.id || uuidv4();
      
      // Set creation and update timestamps
      const now = new Date();
      const config: PromptConfig = {
        id,
        name: configData.name || '',
        description: configData.description || '',
        feature: configData.feature || OrchestrationFeature.MATCHING,
        systemPromptId: configData.systemPromptId || '',
        userPromptId: configData.userPromptId || '',
        assistantPromptId: configData.assistantPromptId || '',
        isDefault: configData.isDefault !== undefined ? configData.isDefault : false,
        active: configData.active !== undefined ? configData.active : true,
        version: configData.version || '1.0.0',
        createdAt: configData.createdAt || now,
        updatedAt: configData.updatedAt || now
      };
      
      // Validate the configuration using validatePromptConfig
      validatePromptConfig(config);
      
      // Verify that referenced template IDs exist
      await this.getPromptTemplate(config.systemPromptId);
      await this.getPromptTemplate(config.userPromptId);
      
      if (config.assistantPromptId) {
        await this.getPromptTemplate(config.assistantPromptId);
      }
      
      // If this is set as default, update any existing default configs
      if (config.isDefault) {
        await this.clearDefaultConfigForFeature(config.feature);
      }
      
      // Store configuration in database with prisma.promptConfig.create
      const createdConfig = await prisma.promptConfig.create({
        data: config
      });
      
      // Add configuration to cache
      this.configCache.set(createdConfig.id, createdConfig);
      
      logger.info(`Created prompt configuration: ${createdConfig.id}`, { 
        feature: createdConfig.feature,
        isDefault: createdConfig.isDefault
      });
      
      return createdConfig;
    } catch (error) {
      logger.error('Failed to create prompt configuration', error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to create prompt configuration', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Retrieve a prompt configuration by ID
   * 
   * @param configId - The ID of the configuration to retrieve
   * @returns The prompt configuration
   */
  async getPromptConfig(configId: string): Promise<PromptConfig> {
    await this.ensureInitialized();

    try {
      // Check cache for configuration
      const cachedConfig = this.configCache.get<PromptConfig>(configId);
      if (cachedConfig) {
        logger.debug(`Retrieved prompt configuration from cache: ${configId}`);
        return cachedConfig;
      }
      
      // If not in cache, query database with prisma.promptConfig.findUnique
      const config = await prisma.promptConfig.findUnique({
        where: { id: configId }
      });
      
      // If not found in database, throw ApiError.notFound
      if (!config) {
        throw ApiError.notFound(`Prompt configuration not found: ${configId}`);
      }
      
      // Add configuration to cache
      this.configCache.set(configId, config);
      
      return config;
    } catch (error) {
      logger.error(`Failed to get prompt configuration: ${configId}`, error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to get prompt configuration', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Update an existing prompt configuration
   * 
   * @param configId - The ID of the configuration to update
   * @param configData - The updated configuration data
   * @returns The updated prompt configuration
   */
  async updatePromptConfig(
    configId: string,
    configData: Partial<PromptConfig>
  ): Promise<PromptConfig> {
    await this.ensureInitialized();

    try {
      // Get existing configuration by ID
      const existingConfig = await this.getPromptConfig(configId);
      
      // Merge existing configuration with update data
      const updatedConfig: PromptConfig = {
        ...existingConfig,
        ...configData,
        id: configId, // Ensure ID remains the same
        updatedAt: new Date(), // Update timestamp
      };
      
      // Validate the updated configuration using validatePromptConfig
      validatePromptConfig(updatedConfig);
      
      // Verify that referenced template IDs exist
      await this.getPromptTemplate(updatedConfig.systemPromptId);
      await this.getPromptTemplate(updatedConfig.userPromptId);
      
      if (updatedConfig.assistantPromptId) {
        await this.getPromptTemplate(updatedConfig.assistantPromptId);
      }
      
      // If isDefault is being changed to true, update other configs
      if (updatedConfig.isDefault && !existingConfig.isDefault) {
        await this.clearDefaultConfigForFeature(updatedConfig.feature);
      }
      
      // Update configuration in database with prisma.promptConfig.update
      const result = await prisma.promptConfig.update({
        where: { id: configId },
        data: updatedConfig
      });
      
      // Update configuration in cache
      this.configCache.set(configId, result);
      
      logger.info(`Updated prompt configuration: ${configId}`, { 
        feature: result.feature,
        isDefault: result.isDefault
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to update prompt configuration: ${configId}`, error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to update prompt configuration', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Delete a prompt configuration
   * 
   * @param configId - The ID of the configuration to delete
   * @returns True if configuration was deleted
   */
  async deletePromptConfig(configId: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      // Check if configuration exists
      const config = await this.getPromptConfig(configId);
      
      // Check if configuration is set as default for any feature
      if (config.isDefault) {
        throw ApiError.badRequest(
          `Cannot delete default prompt configuration for feature: ${config.feature}`,
          { feature: config.feature }
        );
      }
      
      // Delete configuration from database with prisma.promptConfig.delete
      await prisma.promptConfig.delete({
        where: { id: configId }
      });
      
      // Remove configuration from cache
      this.configCache.del(configId);
      
      logger.info(`Deleted prompt configuration: ${configId}`, { 
        feature: config.feature
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete prompt configuration: ${configId}`, error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to delete prompt configuration', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Retrieve prompt configurations with optional filtering
   * 
   * @param filters - Optional filters for querying configurations
   * @returns Array of prompt configurations
   */
  async getPromptConfigs(filters: object = {}): Promise<PromptConfig[]> {
    await this.ensureInitialized();

    try {
      // Build query filters based on provided filters object
      const queryFilters: any = {};
      
      if ('feature' in filters) {
        queryFilters.feature = filters['feature'];
      }
      
      if ('isDefault' in filters) {
        queryFilters.isDefault = filters['isDefault'];
      }
      
      if ('active' in filters) {
        queryFilters.active = filters['active'];
      }
      
      if ('name' in filters) {
        queryFilters.name = {
          contains: filters['name'],
          mode: 'insensitive'
        };
      }
      
      // Query database with prisma.promptConfig.findMany
      const configs = await prisma.promptConfig.findMany({
        where: queryFilters,
        orderBy: { updatedAt: 'desc' }
      });
      
      return configs;
    } catch (error) {
      logger.error('Failed to get prompt configurations', error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to get prompt configurations', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Get the default prompt configuration for a specific feature
   * 
   * @param feature - The orchestration feature
   * @returns The default prompt configuration for the feature
   */
  async getDefaultConfigForFeature(feature: OrchestrationFeature): Promise<PromptConfig> {
    await this.ensureInitialized();

    try {
      // Query database for configuration with matching feature and isDefault=true
      const config = await prisma.promptConfig.findFirst({
        where: {
          feature,
          isDefault: true,
          active: true
        }
      });
      
      // If not found, create a default configuration for the feature
      if (!config) {
        logger.info(`No default configuration found for feature: ${feature}, creating one`);
        return this.createDefaultConfigForFeature(feature);
      }
      
      return config;
    } catch (error) {
      logger.error(`Failed to get default config for feature: ${feature}`, error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to get default configuration for feature', { 
        error: (error as Error).message,
        feature
      });
    }
  }

  /**
   * Set a prompt configuration as the default for a feature
   * 
   * @param configId - The ID of the configuration to set as default
   * @param feature - The orchestration feature
   * @returns The updated prompt configuration
   */
  async setDefaultConfigForFeature(
    configId: string,
    feature: OrchestrationFeature
  ): Promise<PromptConfig> {
    await this.ensureInitialized();

    try {
      // Get configuration by ID
      const config = await this.getPromptConfig(configId);
      
      // Verify that configuration is for the specified feature
      if (config.feature !== feature) {
        throw ApiError.badRequest(
          `Configuration feature (${config.feature}) does not match the specified feature (${feature})`,
          { configFeature: config.feature, specifiedFeature: feature }
        );
      }
      
      // Update any existing default configurations for the feature to non-default
      await this.clearDefaultConfigForFeature(feature);
      
      // Update the specified configuration to be default
      const updatedConfig = await this.updatePromptConfig(configId, { isDefault: true });
      
      // Update cache entries
      this.configCache.set(configId, updatedConfig);
      
      logger.info(`Set configuration ${configId} as default for feature: ${feature}`);
      
      return updatedConfig;
    } catch (error) {
      logger.error(`Failed to set default config for feature: ${feature}`, error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to set default configuration', { 
        error: (error as Error).message,
        feature,
        configId
      });
    }
  }

  /**
   * Render a prompt template with provided variables
   * 
   * @param promptData - The prompt data containing templateId and variables
   * @returns The rendered prompt
   */
  async renderPrompt(promptData: PromptData): Promise<RenderedPrompt> {
    await this.ensureInitialized();

    try {
      // Validate prompt data using validatePromptData
      validatePromptData(promptData);
      
      // Get template by ID
      const template = await this.getPromptTemplate(promptData.templateId);
      
      // Validate that provided variables match template requirements using validatePromptVariables
      validatePromptVariables(template.variables, promptData.variables);
      
      // Render the template using renderPromptTemplate
      const renderedContent = renderPromptTemplate(template, promptData.variables);
      
      // Optimize the rendered content for the specific feature using optimizePromptForFeature
      const optimizedContent = optimizePromptForFeature(renderedContent, promptData.feature);
      
      // Create a RenderedPrompt object using createRenderedPrompt
      const renderedPrompt = createRenderedPrompt(
        template,
        optimizedContent,
        promptData.variables
      );
      
      logger.debug(`Rendered prompt template: ${template.id}`, {
        feature: promptData.feature,
        category: template.category
      });
      
      return renderedPrompt;
    } catch (error) {
      logger.error('Failed to render prompt', error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to render prompt', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Render all templates in a prompt configuration
   * 
   * @param configId - The ID of the configuration to render
   * @param variables - Variables to use in rendering
   * @returns Object with rendered prompts by category
   */
  async renderPromptConfig(
    configId: string,
    variables: Record<string, any>
  ): Promise<Record<PromptCategory, RenderedPrompt>> {
    await this.ensureInitialized();

    try {
      // Get configuration by ID
      const config = await this.getPromptConfig(configId);
      
      // Get all templates referenced in the configuration
      const systemTemplate = await this.getPromptTemplate(config.systemPromptId);
      const userTemplate = await this.getPromptTemplate(config.userPromptId);
      
      let assistantTemplate = null;
      if (config.assistantPromptId) {
        assistantTemplate = await this.getPromptTemplate(config.assistantPromptId);
      }
      
      // Render each template with the provided variables
      const renderedSystem = await this.renderPrompt({
        templateId: systemTemplate.id,
        variables,
        feature: config.feature
      });
      
      const renderedUser = await this.renderPrompt({
        templateId: userTemplate.id,
        variables,
        feature: config.feature
      });
      
      // Organize rendered prompts by category
      const result: Record<PromptCategory, RenderedPrompt> = {
        [PromptCategory.SYSTEM]: renderedSystem,
        [PromptCategory.USER]: renderedUser
      };
      
      if (assistantTemplate) {
        const renderedAssistant = await this.renderPrompt({
          templateId: assistantTemplate.id,
          variables,
          feature: config.feature
        });
        
        result[PromptCategory.ASSISTANT] = renderedAssistant;
      }
      
      logger.debug(`Rendered configuration: ${configId}`, {
        feature: config.feature
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to render prompt configuration: ${configId}`, error as Error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.internal('Failed to render prompt configuration', { 
        error: (error as Error).message,
        configId
      });
    }
  }

  /**
   * Ensure default prompt templates exist for each feature and category
   * 
   * @returns Promise that resolves when defaults are ensured
   */
  private async ensureDefaultTemplatesExist(): Promise<void> {
    try {
      // For each combination of feature and category:
      for (const feature of Object.values(OrchestrationFeature)) {
        for (const category of Object.values(PromptCategory)) {
          // Check if a default template exists
          const defaultId = `default_${feature}_${category}`;
          
          const existingTemplate = await prisma.promptTemplate.findUnique({
            where: { id: defaultId }
          });
          
          // If not, create a default template using getDefaultPromptForFeature
          if (!existingTemplate) {
            const defaultTemplate = getDefaultPromptForFeature(
              feature as OrchestrationFeature,
              category as PromptCategory
            );
            
            await prisma.promptTemplate.create({
              data: defaultTemplate
            });
            
            logger.info(`Created default template for feature: ${feature}, category: ${category}`);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to ensure default templates exist', error as Error);
      throw error;
    }
  }

  /**
   * Ensure default prompt configurations exist for each feature
   * 
   * @returns Promise that resolves when defaults are ensured
   */
  private async ensureDefaultConfigsExist(): Promise<void> {
    try {
      // For each feature:
      for (const feature of Object.values(OrchestrationFeature)) {
        // Check if a default configuration exists
        const existingConfig = await prisma.promptConfig.findFirst({
          where: {
            feature: feature as OrchestrationFeature,
            isDefault: true
          }
        });
        
        // If not, create a default configuration with default templates
        if (!existingConfig) {
          await this.createDefaultConfigForFeature(feature as OrchestrationFeature);
          logger.info(`Created default configuration for feature: ${feature}`);
        }
      }
    } catch (error) {
      logger.error('Failed to ensure default configurations exist', error as Error);
      throw error;
    }
  }

  /**
   * Ensure the service is initialized before use
   * 
   * @returns Promise that resolves when initialization is confirmed
   */
  private async ensureInitialized(): Promise<void> {
    // Check if service is already initialized
    if (!this.initialized) {
      // If not initialized, call initialize method
      await this.initialize();
    }
  }

  /**
   * Clear the template and configuration caches
   */
  clearCache(): void {
    try {
      // Clear template cache
      this.templateCache.flushAll();
      // Clear configuration cache
      this.configCache.flushAll();
      
      logger.info('Prompt service caches cleared');
    } catch (error) {
      logger.error('Failed to clear caches', error as Error);
    }
  }

  /**
   * Get the health status of the prompt service
   * 
   * @returns True if service is healthy
   */
  async getHealth(): Promise<boolean> {
    try {
      // Check if service is initialized
      if (!this.initialized) {
        return false;
      }
      
      // Attempt to query database for a template
      await prisma.promptTemplate.findFirst();
      
      // Return true if service is healthy
      return true;
    } catch (error) {
      logger.error('Prompt service health check failed', error as Error);
      return false;
    }
  }

  /**
   * Create a default configuration for a feature
   * 
   * @param feature - The orchestration feature
   * @returns The created default configuration
   */
  private async createDefaultConfigForFeature(
    feature: OrchestrationFeature
  ): Promise<PromptConfig> {
    try {
      // Generate ID and timestamps
      const defaultId = uuidv4();
      const now = new Date();
      
      // Get default template IDs
      const systemPromptId = `default_${feature}_${PromptCategory.SYSTEM}`;
      const userPromptId = `default_${feature}_${PromptCategory.USER}`;
      const assistantPromptId = `default_${feature}_${PromptCategory.ASSISTANT}`;
      
      // Create default configuration
      const defaultConfig: PromptConfig = {
        id: defaultId,
        name: `Default ${feature} configuration`,
        description: `Default configuration for ${feature} feature`,
        feature,
        systemPromptId,
        userPromptId,
        assistantPromptId,
        isDefault: true,
        active: true,
        version: '1.0.0',
        createdAt: now,
        updatedAt: now
      };
      
      // Save to database
      const createdConfig = await prisma.promptConfig.create({
        data: defaultConfig
      });
      
      // Add to cache
      this.configCache.set(defaultId, createdConfig);
      
      return createdConfig;
    } catch (error) {
      logger.error(`Failed to create default config for feature: ${feature}`, error as Error);
      throw error;
    }
  }

  /**
   * Clear the default status of any configurations for a specific feature
   * 
   * @param feature - The orchestration feature
   * @returns Number of configurations updated
   */
  private async clearDefaultConfigForFeature(feature: OrchestrationFeature): Promise<number> {
    try {
      // Find existing default configurations for the feature
      const existingDefaults = await prisma.promptConfig.findMany({
        where: {
          feature,
          isDefault: true
        }
      });
      
      // Update each one to not be default
      for (const config of existingDefaults) {
        await prisma.promptConfig.update({
          where: { id: config.id },
          data: { isDefault: false }
        });
        
        // Update cache
        this.configCache.del(config.id);
      }
      
      return existingDefaults.length;
    } catch (error) {
      logger.error(`Failed to clear default configs for feature: ${feature}`, error as Error);
      throw error;
    }
  }
}