import { z } from 'zod'; // v3.21.4
import { Request, Response, NextFunction } from 'express'; // v4.18.2

import {
  OrchestrationConfig,
  OrchestrationRequest,
  OrchestrationResponse,
  OrchestrationFeature,
  OrchestrationStatus,
  OrchestrationPriority,
  MatchingOperation,
  PersonalityOperation,
  EngagementOperation,
  RecommendationOperation,
  OrchestrationConfigSchema,
  OrchestrationRequestSchema,
  OrchestrationResponseSchema,
  MatchingOrchestrationInputSchema,
  PersonalityOrchestrationInputSchema,
  EngagementOrchestrationInputSchema,
  RecommendationOrchestrationInputSchema,
  ConversationOrchestrationInputSchema
} from '../models/orchestration.model';

import { ModelCapability, ModelParameters } from '../models/model.model';
import { validateId } from '../../../shared/src/validation/common.validation';
import { ValidationError } from '../../../shared/src/errors/validation.error';

/**
 * Validates an orchestration configuration object
 * 
 * @param config - The configuration object to validate
 * @returns True if valid, throws ValidationError otherwise
 */
export function validateOrchestrationConfig(config: any): boolean {
  try {
    // Validate overall schema using Zod
    const validatedConfig = OrchestrationConfigSchema.parse(config);
    
    // Additional validations for specific fields
    validateId(validatedConfig.id);
    
    // Validate that the feature is a valid enum value
    if (!Object.values(OrchestrationFeature).includes(validatedConfig.feature)) {
      throw ValidationError.invalidEnum('feature', Object.values(OrchestrationFeature));
    }
    
    // Validate model IDs
    validateId(validatedConfig.defaultModelId);
    validatedConfig.fallbackModelIds.forEach((modelId, index) => {
      try {
        validateId(modelId);
      } catch (error) {
        throw ValidationError.invalidField(`fallbackModelIds[${index}]`, 'is not a valid UUID');
      }
    });
    
    // Validate capabilities
    validatedConfig.requiredCapabilities.forEach((capability, index) => {
      if (!Object.values(ModelCapability).includes(capability)) {
        throw ValidationError.invalidEnum(
          `requiredCapabilities[${index}]`, 
          Object.values(ModelCapability)
        );
      }
    });
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      throw ValidationError.schemaValidation(issues);
    }
    throw error;
  }
}

/**
 * Validates an orchestration request object
 * 
 * @param request - The request object to validate
 * @returns True if valid, throws ValidationError otherwise
 */
export function validateOrchestrationRequest(request: any): boolean {
  try {
    // Validate overall schema using Zod
    const validatedRequest = OrchestrationRequestSchema.parse(request);
    
    // Additional validations for specific fields
    validateId(validatedRequest.id);
    
    // Validate that the feature is a valid enum value
    if (!Object.values(OrchestrationFeature).includes(validatedRequest.feature)) {
      throw ValidationError.invalidEnum('feature', Object.values(OrchestrationFeature));
    }
    
    // Validate user ID
    validateId(validatedRequest.userId);
    
    // Validate model ID if provided
    if (validatedRequest.modelId) {
      validateId(validatedRequest.modelId);
    }
    
    // Validate that the status is a valid enum value
    if (!Object.values(OrchestrationStatus).includes(validatedRequest.status)) {
      throw ValidationError.invalidEnum('status', Object.values(OrchestrationStatus));
    }
    
    // Validate that the priority is a valid enum value
    if (!Object.values(OrchestrationPriority).includes(validatedRequest.priority)) {
      throw ValidationError.invalidEnum('priority', Object.values(OrchestrationPriority));
    }
    
    // Validate feature-specific input
    validateFeatureInput(validatedRequest.feature, validatedRequest.input);
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      throw ValidationError.schemaValidation(issues);
    }
    throw error;
  }
}

/**
 * Validates an orchestration response object
 * 
 * @param response - The response object to validate
 * @returns True if valid, throws ValidationError otherwise
 */
export function validateOrchestrationResponse(response: any): boolean {
  try {
    // Validate overall schema using Zod
    const validatedResponse = OrchestrationResponseSchema.parse(response);
    
    // Additional validations for specific fields
    validateId(validatedResponse.id);
    validateId(validatedResponse.requestId);
    
    // Validate that the feature is a valid enum value
    if (!Object.values(OrchestrationFeature).includes(validatedResponse.feature)) {
      throw ValidationError.invalidEnum('feature', Object.values(OrchestrationFeature));
    }
    
    // Validate model ID
    validateId(validatedResponse.modelId);
    
    // Validate that the status is a valid enum value
    if (!Object.values(OrchestrationStatus).includes(validatedResponse.status)) {
      throw ValidationError.invalidEnum('status', Object.values(OrchestrationStatus));
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      throw ValidationError.schemaValidation(issues);
    }
    throw error;
  }
}

/**
 * Validates input data for matching orchestration requests
 * 
 * @param input - The matching orchestration input to validate
 * @returns True if valid, throws ValidationError otherwise
 */
export function validateMatchingInput(input: any): boolean {
  try {
    // Validate overall schema using Zod
    const validatedInput = MatchingOrchestrationInputSchema.parse(input);
    
    // Validate that the operation is a valid enum value
    if (!Object.values(MatchingOperation).includes(validatedInput.operation)) {
      throw ValidationError.invalidEnum('operation', Object.values(MatchingOperation));
    }
    
    // Validate operation-specific required fields
    switch (validatedInput.operation) {
      case MatchingOperation.USER_TO_TRIBES:
        if (!validatedInput.userProfile) {
          throw ValidationError.requiredField('userProfile');
        }
        if (!validatedInput.tribes || !Array.isArray(validatedInput.tribes) || validatedInput.tribes.length === 0) {
          throw ValidationError.requiredField('tribes');
        }
        break;
        
      case MatchingOperation.TRIBE_FORMATION:
        if (!validatedInput.userProfiles || !Array.isArray(validatedInput.userProfiles)) {
          throw ValidationError.requiredField('userProfiles');
        }
        if (validatedInput.userProfiles.length < 4) {
          throw ValidationError.invalidField('userProfiles', 'must contain at least 4 profiles for tribe formation');
        }
        break;
        
      case MatchingOperation.COMPATIBILITY:
        if (!validatedInput.userProfile) {
          throw ValidationError.requiredField('userProfile');
        }
        if (!validatedInput.targetUserId) {
          throw ValidationError.requiredField('targetUserId');
        }
        validateId(validatedInput.targetUserId);
        if (!validatedInput.matchingCriteria) {
          throw ValidationError.requiredField('matchingCriteria');
        }
        break;
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      throw ValidationError.schemaValidation(issues);
    }
    throw error;
  }
}

/**
 * Validates input data for personality analysis orchestration requests
 * 
 * @param input - The personality orchestration input to validate
 * @returns True if valid, throws ValidationError otherwise
 */
export function validatePersonalityInput(input: any): boolean {
  try {
    // Validate overall schema using Zod
    const validatedInput = PersonalityOrchestrationInputSchema.parse(input);
    
    // Validate that the operation is a valid enum value
    if (!Object.values(PersonalityOperation).includes(validatedInput.operation)) {
      throw ValidationError.invalidEnum('operation', Object.values(PersonalityOperation));
    }
    
    // Validate operation-specific required fields
    switch (validatedInput.operation) {
      case PersonalityOperation.TRAIT_ANALYSIS:
        if (!validatedInput.assessmentResponses) {
          throw ValidationError.requiredField('assessmentResponses');
        }
        break;
        
      case PersonalityOperation.COMMUNICATION_STYLE:
        if (!validatedInput.userProfile) {
          throw ValidationError.requiredField('userProfile');
        }
        if (!validatedInput.communicationData) {
          throw ValidationError.requiredField('communicationData');
        }
        break;
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      throw ValidationError.schemaValidation(issues);
    }
    throw error;
  }
}

/**
 * Validates input data for engagement orchestration requests
 * 
 * @param input - The engagement orchestration input to validate
 * @returns True if valid, throws ValidationError otherwise
 */
export function validateEngagementInput(input: any): boolean {
  try {
    // Validate overall schema using Zod
    const validatedInput = EngagementOrchestrationInputSchema.parse(input);
    
    // Validate that the operation is a valid enum value
    if (!Object.values(EngagementOperation).includes(validatedInput.operation)) {
      throw ValidationError.invalidEnum('operation', Object.values(EngagementOperation));
    }
    
    // Validate operation-specific required fields
    switch (validatedInput.operation) {
      case EngagementOperation.CONVERSATION_PROMPTS:
        if (!validatedInput.tribeData) {
          throw ValidationError.requiredField('tribeData');
        }
        if (!validatedInput.memberProfiles || !Array.isArray(validatedInput.memberProfiles) || validatedInput.memberProfiles.length === 0) {
          throw ValidationError.requiredField('memberProfiles');
        }
        break;
        
      case EngagementOperation.GROUP_CHALLENGES:
        if (!validatedInput.tribeData) {
          throw ValidationError.requiredField('tribeData');
        }
        if (!validatedInput.memberProfiles || !Array.isArray(validatedInput.memberProfiles) || validatedInput.memberProfiles.length === 0) {
          throw ValidationError.requiredField('memberProfiles');
        }
        if (!validatedInput.engagementHistory) {
          throw ValidationError.requiredField('engagementHistory');
        }
        break;
        
      case EngagementOperation.ACTIVITY_SUGGESTIONS:
        if (!validatedInput.tribeData) {
          throw ValidationError.requiredField('tribeData');
        }
        if (!validatedInput.memberProfiles || !Array.isArray(validatedInput.memberProfiles) || validatedInput.memberProfiles.length === 0) {
          throw ValidationError.requiredField('memberProfiles');
        }
        if (!validatedInput.activityPreferences) {
          throw ValidationError.requiredField('activityPreferences');
        }
        break;
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      throw ValidationError.schemaValidation(issues);
    }
    throw error;
  }
}

/**
 * Validates input data for recommendation orchestration requests
 * 
 * @param input - The recommendation orchestration input to validate
 * @returns True if valid, throws ValidationError otherwise
 */
export function validateRecommendationInput(input: any): boolean {
  try {
    // Validate overall schema using Zod
    const validatedInput = RecommendationOrchestrationInputSchema.parse(input);
    
    // Validate that the operation is a valid enum value
    if (!Object.values(RecommendationOperation).includes(validatedInput.operation)) {
      throw ValidationError.invalidEnum('operation', Object.values(RecommendationOperation));
    }
    
    // Validate operation-specific required fields
    switch (validatedInput.operation) {
      case RecommendationOperation.EVENTS:
        if (!validatedInput.tribeData) {
          throw ValidationError.requiredField('tribeData');
        }
        if (!validatedInput.memberProfiles || !Array.isArray(validatedInput.memberProfiles) || validatedInput.memberProfiles.length === 0) {
          throw ValidationError.requiredField('memberProfiles');
        }
        if (!validatedInput.location) {
          throw ValidationError.requiredField('location');
        }
        break;
        
      case RecommendationOperation.WEATHER_ACTIVITIES:
        if (!validatedInput.tribeData) {
          throw ValidationError.requiredField('tribeData');
        }
        if (!validatedInput.memberProfiles || !Array.isArray(validatedInput.memberProfiles) || validatedInput.memberProfiles.length === 0) {
          throw ValidationError.requiredField('memberProfiles');
        }
        if (!validatedInput.location) {
          throw ValidationError.requiredField('location');
        }
        if (!validatedInput.weatherData) {
          throw ValidationError.requiredField('weatherData');
        }
        break;
        
      case RecommendationOperation.BUDGET_OPTIONS:
        if (!validatedInput.tribeData) {
          throw ValidationError.requiredField('tribeData');
        }
        if (!validatedInput.memberProfiles || !Array.isArray(validatedInput.memberProfiles) || validatedInput.memberProfiles.length === 0) {
          throw ValidationError.requiredField('memberProfiles');
        }
        if (!validatedInput.budgetConstraints) {
          throw ValidationError.requiredField('budgetConstraints');
        }
        break;
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      throw ValidationError.schemaValidation(issues);
    }
    throw error;
  }
}

/**
 * Validates input data for conversation orchestration requests
 * 
 * @param input - The conversation orchestration input to validate
 * @returns True if valid, throws ValidationError otherwise
 */
export function validateConversationInput(input: any): boolean {
  try {
    // Validate overall schema using Zod
    const validatedInput = ConversationOrchestrationInputSchema.parse(input);
    
    // Validate required fields
    if (!validatedInput.tribeData) {
      throw ValidationError.requiredField('tribeData');
    }
    
    if (!validatedInput.memberProfiles || !Array.isArray(validatedInput.memberProfiles) || validatedInput.memberProfiles.length === 0) {
      throw ValidationError.requiredField('memberProfiles');
    }
    
    if (!validatedInput.conversationHistory) {
      throw ValidationError.requiredField('conversationHistory');
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      throw ValidationError.schemaValidation(issues);
    }
    throw error;
  }
}

/**
 * Validates feature-specific input data based on the orchestration feature type
 * 
 * @param feature - The orchestration feature
 * @param input - The feature-specific input data
 * @returns True if valid, throws ValidationError otherwise
 */
export function validateFeatureInput(feature: OrchestrationFeature, input: any): boolean {
  switch (feature) {
    case OrchestrationFeature.MATCHING:
      return validateMatchingInput(input);
      
    case OrchestrationFeature.PERSONALITY_ANALYSIS:
      return validatePersonalityInput(input);
      
    case OrchestrationFeature.ENGAGEMENT:
      return validateEngagementInput(input);
      
    case OrchestrationFeature.RECOMMENDATION:
      return validateRecommendationInput(input);
      
    case OrchestrationFeature.CONVERSATION:
      return validateConversationInput(input);
      
    default:
      throw ValidationError.invalidEnum('feature', Object.values(OrchestrationFeature));
  }
}

/**
 * Express middleware for validating orchestration configurations in requests
 */
export const orchestrationConfigValidation = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const config = req.params.id ? 
      req.body : // For updates
      req.body.config || req.body; // For creation or when the config is the entire body
    
    validateOrchestrationConfig(config);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating orchestration requests
 */
export const orchestrationRequestValidation = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const request = req.body.request || req.body;
    validateOrchestrationRequest(request);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating orchestration configuration creation requests
 */
export const createOrchestrationConfigValidation = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const config = req.body;
    
    // Ensure required fields for creation are present
    if (!config.feature) {
      throw ValidationError.requiredField('feature');
    }
    if (!config.name) {
      throw ValidationError.requiredField('name');
    }
    if (!config.defaultModelId) {
      throw ValidationError.requiredField('defaultModelId');
    }
    
    validateOrchestrationConfig(config);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating orchestration configuration update requests
 */
export const updateOrchestrationConfigValidation = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const config = req.body;
    
    // Ensure ID is present for update
    if (!req.params.id) {
      throw ValidationError.requiredField('id');
    }
    
    // Validate the ID
    validateId(req.params.id);
    
    // For partial updates, we only validate the provided fields
    if (config.feature && !Object.values(OrchestrationFeature).includes(config.feature)) {
      throw ValidationError.invalidEnum('feature', Object.values(OrchestrationFeature));
    }
    
    if (config.defaultModelId) {
      validateId(config.defaultModelId);
    }
    
    if (config.fallbackModelIds && Array.isArray(config.fallbackModelIds)) {
      config.fallbackModelIds.forEach((modelId: string, index: number) => {
        try {
          validateId(modelId);
        } catch (error) {
          throw ValidationError.invalidField(`fallbackModelIds[${index}]`, 'is not a valid UUID');
        }
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating orchestration request creation
 */
export const createOrchestrationRequestValidation = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const request = req.body;
    
    // Ensure required fields for creation are present
    if (!request.feature) {
      throw ValidationError.requiredField('feature');
    }
    if (!request.input) {
      throw ValidationError.requiredField('input');
    }
    if (!request.userId) {
      throw ValidationError.requiredField('userId');
    }
    
    validateOrchestrationRequest(request);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating matching input data
 */
export const matchingInputValidation = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const input = req.body.input || req.body;
    validateMatchingInput(input);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating personality analysis input data
 */
export const personalityInputValidation = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const input = req.body.input || req.body;
    validatePersonalityInput(input);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating engagement input data
 */
export const engagementInputValidation = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const input = req.body.input || req.body;
    validateEngagementInput(input);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating recommendation input data
 */
export const recommendationInputValidation = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const input = req.body.input || req.body;
    validateRecommendationInput(input);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware for validating conversation input data
 */
export const conversationInputValidation = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const input = req.body.input || req.body;
    validateConversationInput(input);
    next();
  } catch (error) {
    next(error);
  }
};