/**
 * Validation module for AI orchestration service
 * 
 * This file centralizes and exports all validation functions and middleware from the AI orchestration
 * service's validation modules. It serves as the main entry point for importing validation utilities
 * throughout the service.
 * 
 * @module validations
 * @version 1.0.0
 */

// Import validation functions and middleware from orchestration.validation
import {
  validateOrchestrationConfig,
  validateOrchestrationRequest,
  validateOrchestrationResponse,
  validateFeatureInput,
  orchestrationConfigValidation,
  orchestrationRequestValidation,
  createOrchestrationConfigValidation,
  updateOrchestrationConfigValidation,
  createOrchestrationRequestValidation,
  matchingInputValidation,
  personalityInputValidation,
  engagementInputValidation,
  recommendationInputValidation,
  conversationInputValidation
} from './orchestration.validation';

// Import validation functions and middleware from prompt.validation
import {
  validatePromptTemplate,
  validatePromptConfig,
  validatePromptData, 
  validateRenderedPrompt,
  validateFeatureSpecificVariables,
  promptTemplateValidation,
  promptConfigValidation,
  promptDataValidation,
  createPromptTemplateValidation,
  updatePromptTemplateValidation,
  createPromptConfigValidation,
  updatePromptConfigValidation
} from './prompt.validation';

// Export all orchestration validation functions
export {
  // Orchestration validation functions
  validateOrchestrationConfig,
  validateOrchestrationRequest,
  validateOrchestrationResponse,
  validateFeatureInput,
  
  // Orchestration validation middleware
  orchestrationConfigValidation,
  orchestrationRequestValidation,
  createOrchestrationConfigValidation,
  updateOrchestrationConfigValidation,
  createOrchestrationRequestValidation,
  matchingInputValidation,
  personalityInputValidation,
  engagementInputValidation,
  recommendationInputValidation,
  conversationInputValidation,
  
  // Prompt validation functions
  validatePromptTemplate,
  validatePromptConfig,
  validatePromptData,
  validateRenderedPrompt,
  validateFeatureSpecificVariables,
  
  // Prompt validation middleware
  promptTemplateValidation,
  promptConfigValidation,
  promptDataValidation,
  createPromptTemplateValidation,
  updatePromptTemplateValidation,
  createPromptConfigValidation,
  updatePromptConfigValidation
};