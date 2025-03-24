import { z } from 'zod'; // v3.21.4
import { Request, Response, NextFunction } from 'express'; // v4.18.2
import {
  PromptTemplate,
  PromptConfig,
  PromptData,
  RenderedPrompt,
  PromptCategory,
  PromptVariableType,
  PromptTemplateSchema,
  PromptConfigSchema,
  PromptDataSchema,
  RenderedPromptSchema,
  MatchingPromptVariablesSchema,
  PersonalityPromptVariablesSchema,
  EngagementPromptVariablesSchema,
  RecommendationPromptVariablesSchema,
  ConversationPromptVariablesSchema,
  OrchestrationFeature
} from '../models/prompt.model';
import { validateId } from '../../../shared/src/validation/common.validation';
import { ValidationError } from '../../../shared/src/errors/validation.error';

/**
 * Validates a prompt template object
 * 
 * @param template - The prompt template to validate
 * @returns true if validation passes
 * @throws ValidationError if validation fails
 */
export function validatePromptTemplate(template: any): boolean {
  try {
    // Parse using Zod schema for basic validation
    const parsedTemplate = PromptTemplateSchema.parse(template);
    
    // Validate ID is a valid UUID
    validateId(parsedTemplate.id);
    
    // Validate category is a valid enum value
    if (!Object.values(PromptCategory).includes(parsedTemplate.category)) {
      throw ValidationError.invalidEnum('category', Object.values(PromptCategory));
    }
    
    // Validate feature is a valid enum value
    if (!Object.values(OrchestrationFeature).includes(parsedTemplate.feature)) {
      throw ValidationError.invalidEnum('feature', Object.values(OrchestrationFeature));
    }
    
    // Validate variables
    if (!parsedTemplate.variables || !Array.isArray(parsedTemplate.variables)) {
      throw ValidationError.requiredField('variables');
    }
    
    // Validate each variable
    parsedTemplate.variables.forEach((variable, index) => {
      if (!variable.name) {
        throw ValidationError.requiredField(`variables[${index}].name`);
      }
      
      if (!Object.values(PromptVariableType).includes(variable.type)) {
        throw ValidationError.invalidEnum(`variables[${index}].type`, Object.values(PromptVariableType));
      }
    });
    
    // Validate that all variables are used in the template
    const variableNames = parsedTemplate.variables.map(v => v.name);
    for (const name of variableNames) {
      if (!parsedTemplate.template.includes(`{{${name}}}`)) {
        throw ValidationError.invalidField('template', `does not contain variable placeholder {{${name}}}`);
      }
    }
    
    // Check for variables in template that are not defined
    const templateVarRegex = /\{\{([^}]+)\}\}/g;
    let match;
    while ((match = templateVarRegex.exec(parsedTemplate.template)) !== null) {
      const varName = match[1];
      if (!variableNames.includes(varName)) {
        throw ValidationError.invalidField('template', `contains undefined variable placeholder {{${varName}}}`);
      }
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.schemaValidation(error.errors);
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    throw ValidationError.invalidInput(`Invalid prompt template: ${error.message}`);
  }
}

/**
 * Validates a prompt configuration object
 * 
 * @param config - The prompt configuration to validate
 * @returns true if validation passes
 * @throws ValidationError if validation fails
 */
export function validatePromptConfig(config: any): boolean {
  try {
    // Parse using Zod schema for basic validation
    const parsedConfig = PromptConfigSchema.parse(config);
    
    // Validate ID is a valid UUID
    validateId(parsedConfig.id);
    
    // Validate feature is a valid enum value
    if (!Object.values(OrchestrationFeature).includes(parsedConfig.feature)) {
      throw ValidationError.invalidEnum('feature', Object.values(OrchestrationFeature));
    }
    
    // Validate prompt IDs are valid UUIDs
    validateId(parsedConfig.systemPromptId);
    validateId(parsedConfig.userPromptId);
    
    // Assistant prompt ID is optional
    if (parsedConfig.assistantPromptId) {
      validateId(parsedConfig.assistantPromptId);
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.schemaValidation(error.errors);
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    throw ValidationError.invalidInput(`Invalid prompt configuration: ${error.message}`);
  }
}

/**
 * Validates prompt data used for rendering a prompt template
 * 
 * @param data - The prompt data to validate
 * @returns true if validation passes
 * @throws ValidationError if validation fails
 */
export function validatePromptData(data: any): boolean {
  try {
    // Parse using Zod schema for basic validation
    const parsedData = PromptDataSchema.parse(data);
    
    // Validate templateId is a valid UUID
    validateId(parsedData.templateId);
    
    // Validate feature is a valid enum value
    if (!Object.values(OrchestrationFeature).includes(parsedData.feature)) {
      throw ValidationError.invalidEnum('feature', Object.values(OrchestrationFeature));
    }
    
    // Validate feature-specific variables
    validateFeatureSpecificVariables(parsedData.feature, parsedData.variables);
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.schemaValidation(error.errors);
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    throw ValidationError.invalidInput(`Invalid prompt data: ${error.message}`);
  }
}

/**
 * Validates a rendered prompt object
 * 
 * @param prompt - The rendered prompt to validate
 * @returns true if validation passes
 * @throws ValidationError if validation fails
 */
export function validateRenderedPrompt(prompt: any): boolean {
  try {
    // Parse using Zod schema for basic validation
    const parsedPrompt = RenderedPromptSchema.parse(prompt);
    
    // Validate ID is a valid UUID
    validateId(parsedPrompt.id);
    
    // Validate templateId is a valid UUID
    validateId(parsedPrompt.templateId);
    
    // Validate category is a valid enum value
    if (!Object.values(PromptCategory).includes(parsedPrompt.category)) {
      throw ValidationError.invalidEnum('category', Object.values(PromptCategory));
    }
    
    // Validate feature is a valid enum value
    if (!Object.values(OrchestrationFeature).includes(parsedPrompt.feature)) {
      throw ValidationError.invalidEnum('feature', Object.values(OrchestrationFeature));
    }
    
    // Validate content is not empty
    if (!parsedPrompt.content.trim()) {
      throw ValidationError.invalidField('content', 'cannot be empty');
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.schemaValidation(error.errors);
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    throw ValidationError.invalidInput(`Invalid rendered prompt: ${error.message}`);
  }
}

/**
 * Validates variables specific to matching prompts
 * 
 * @param variables - The matching prompt variables to validate
 * @returns true if validation passes
 * @throws ValidationError if validation fails
 */
export function validateMatchingVariables(variables: any): boolean {
  try {
    const parsedVariables = MatchingPromptVariablesSchema.parse(variables);
    
    // Validate required fields based on context
    if (!parsedVariables.userProfile || Object.keys(parsedVariables.userProfile).length === 0) {
      throw ValidationError.requiredField('userProfile');
    }
    
    // Check if either userProfiles or tribes is provided
    if ((!parsedVariables.userProfiles || parsedVariables.userProfiles.length === 0) && 
        (!parsedVariables.tribes || parsedVariables.tribes.length === 0)) {
      throw ValidationError.invalidInput('Either userProfiles or tribes must be provided');
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.schemaValidation(error.errors);
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    throw ValidationError.invalidInput(`Invalid matching variables: ${error.message}`);
  }
}

/**
 * Validates variables specific to personality analysis prompts
 * 
 * @param variables - The personality prompt variables to validate
 * @returns true if validation passes
 * @throws ValidationError if validation fails
 */
export function validatePersonalityVariables(variables: any): boolean {
  try {
    const parsedVariables = PersonalityPromptVariablesSchema.parse(variables);
    
    // Validate that at least one of assessmentResponses or communicationData is provided
    if (!parsedVariables.assessmentResponses && !parsedVariables.communicationData) {
      throw ValidationError.invalidInput('Either assessmentResponses or communicationData must be provided');
    }
    
    // Validate userProfile is provided
    if (!parsedVariables.userProfile || Object.keys(parsedVariables.userProfile).length === 0) {
      throw ValidationError.requiredField('userProfile');
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.schemaValidation(error.errors);
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    throw ValidationError.invalidInput(`Invalid personality variables: ${error.message}`);
  }
}

/**
 * Validates variables specific to engagement prompts
 * 
 * @param variables - The engagement prompt variables to validate
 * @returns true if validation passes
 * @throws ValidationError if validation fails
 */
export function validateEngagementVariables(variables: any): boolean {
  try {
    const parsedVariables = EngagementPromptVariablesSchema.parse(variables);
    
    // Validate required fields
    if (!parsedVariables.tribeData || Object.keys(parsedVariables.tribeData).length === 0) {
      throw ValidationError.requiredField('tribeData');
    }
    
    if (!parsedVariables.memberProfiles || parsedVariables.memberProfiles.length === 0) {
      throw ValidationError.requiredField('memberProfiles');
    }
    
    if (!parsedVariables.engagementHistory) {
      throw ValidationError.requiredField('engagementHistory');
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.schemaValidation(error.errors);
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    throw ValidationError.invalidInput(`Invalid engagement variables: ${error.message}`);
  }
}

/**
 * Validates variables specific to recommendation prompts
 * 
 * @param variables - The recommendation prompt variables to validate
 * @returns true if validation passes
 * @throws ValidationError if validation fails
 */
export function validateRecommendationVariables(variables: any): boolean {
  try {
    const parsedVariables = RecommendationPromptVariablesSchema.parse(variables);
    
    // Validate required fields
    if (!parsedVariables.tribeData || Object.keys(parsedVariables.tribeData).length === 0) {
      throw ValidationError.requiredField('tribeData');
    }
    
    if (!parsedVariables.memberProfiles || parsedVariables.memberProfiles.length === 0) {
      throw ValidationError.requiredField('memberProfiles');
    }
    
    if (!parsedVariables.location || Object.keys(parsedVariables.location).length === 0) {
      throw ValidationError.requiredField('location');
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.schemaValidation(error.errors);
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    throw ValidationError.invalidInput(`Invalid recommendation variables: ${error.message}`);
  }
}

/**
 * Validates variables specific to conversation prompts
 * 
 * @param variables - The conversation prompt variables to validate
 * @returns true if validation passes
 * @throws ValidationError if validation fails
 */
export function validateConversationVariables(variables: any): boolean {
  try {
    const parsedVariables = ConversationPromptVariablesSchema.parse(variables);
    
    // Validate required fields
    if (!parsedVariables.tribeData || Object.keys(parsedVariables.tribeData).length === 0) {
      throw ValidationError.requiredField('tribeData');
    }
    
    if (!parsedVariables.memberProfiles || parsedVariables.memberProfiles.length === 0) {
      throw ValidationError.requiredField('memberProfiles');
    }
    
    if (!parsedVariables.conversationHistory) {
      throw ValidationError.requiredField('conversationHistory');
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ValidationError.schemaValidation(error.errors);
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    throw ValidationError.invalidInput(`Invalid conversation variables: ${error.message}`);
  }
}

/**
 * Validates feature-specific variables based on the orchestration feature type
 * 
 * @param feature - The orchestration feature type
 * @param variables - The variables to validate
 * @returns true if validation passes
 * @throws ValidationError if validation fails
 */
export function validateFeatureSpecificVariables(feature: OrchestrationFeature, variables: any): boolean {
  try {
    switch (feature) {
      case OrchestrationFeature.MATCHING:
        return validateMatchingVariables(variables);
      
      case OrchestrationFeature.PERSONALITY_ANALYSIS:
        return validatePersonalityVariables(variables);
      
      case OrchestrationFeature.ENGAGEMENT:
        return validateEngagementVariables(variables);
      
      case OrchestrationFeature.RECOMMENDATION:
        return validateRecommendationVariables(variables);
      
      case OrchestrationFeature.CONVERSATION:
        return validateConversationVariables(variables);
      
      default:
        throw ValidationError.invalidEnum('feature', Object.values(OrchestrationFeature));
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw ValidationError.invalidInput(`Invalid feature-specific variables: ${error.message}`);
  }
}

/**
 * Express middleware for validating prompt templates in requests
 */
export function promptTemplateValidation(req: Request, res: Response, next: NextFunction): void {
  try {
    validatePromptTemplate(req.body);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Express middleware for validating prompt configurations in requests
 */
export function promptConfigValidation(req: Request, res: Response, next: NextFunction): void {
  try {
    validatePromptConfig(req.body);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Express middleware for validating prompt data in requests
 */
export function promptDataValidation(req: Request, res: Response, next: NextFunction): void {
  try {
    validatePromptData(req.body);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Express middleware for validating prompt template creation requests
 */
export function createPromptTemplateValidation(req: Request, res: Response, next: NextFunction): void {
  try {
    // For creation, ensure ID is not provided (will be generated)
    if (req.body.id) {
      throw ValidationError.invalidField('id', 'should not be provided for creation');
    }
    
    // Add default values for creation
    const template = {
      ...req.body,
      active: req.body.active ?? true,
      version: req.body.version ?? '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Validate the constructed template
    validatePromptTemplate(template);
    
    // Update request body with the validated template
    req.body = template;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Express middleware for validating prompt template update requests
 */
export function updatePromptTemplateValidation(req: Request, res: Response, next: NextFunction): void {
  try {
    // For updates, ensure ID in path matches body if provided
    const idFromPath = req.params.id;
    validateId(idFromPath);
    
    if (req.body.id && req.body.id !== idFromPath) {
      throw ValidationError.invalidField('id', 'does not match the ID in the request path');
    }
    
    // Add required fields for validation
    const template = {
      ...req.body,
      id: idFromPath,
      updatedAt: new Date()
    };
    
    // Validate the constructed template
    validatePromptTemplate(template);
    
    // Update request body with the validated template
    req.body = template;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Express middleware for validating prompt configuration creation requests
 */
export function createPromptConfigValidation(req: Request, res: Response, next: NextFunction): void {
  try {
    // For creation, ensure ID is not provided (will be generated)
    if (req.body.id) {
      throw ValidationError.invalidField('id', 'should not be provided for creation');
    }
    
    // Add default values for creation
    const config = {
      ...req.body,
      active: req.body.active ?? true,
      isDefault: req.body.isDefault ?? false,
      version: req.body.version ?? '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Validate the constructed config
    validatePromptConfig(config);
    
    // Update request body with the validated config
    req.body = config;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Express middleware for validating prompt configuration update requests
 */
export function updatePromptConfigValidation(req: Request, res: Response, next: NextFunction): void {
  try {
    // For updates, ensure ID in path matches body if provided
    const idFromPath = req.params.id;
    validateId(idFromPath);
    
    if (req.body.id && req.body.id !== idFromPath) {
      throw ValidationError.invalidField('id', 'does not match the ID in the request path');
    }
    
    // Add required fields for validation
    const config = {
      ...req.body,
      id: idFromPath,
      updatedAt: new Date()
    };
    
    // Validate the constructed config
    validatePromptConfig(config);
    
    // Update request body with the validated config
    req.body = config;
    next();
  } catch (error) {
    next(error);
  }
}