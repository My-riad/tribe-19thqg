/**
 * Barrel file that exports all controller classes and related validation utilities from the AI orchestration service.
 * This file centralizes the exports of ModelController, OrchestrationController, and PromptController, making them easily importable from a single location.
 * These controllers handle HTTP requests for AI model management, orchestration operations, and prompt template management.
 */

// Import ModelController for re-export
import { ModelController, 
    validateModelIdParam,
    validateProviderQuery,
    validateCapabilitiesQuery,
    validateFeatureQuery,
    validateModelCapabilitiesBody,
    validateModelParametersBody
 } from './model.controller';

// Import OrchestrationController for re-export
import { OrchestrationController, 
    validateRequestIdParam,
    validateCreateOrchestrationRequest
 } from './orchestration.controller';

// Import prompt controller functions for re-export
import { 
    createPromptTemplate,
    getPromptTemplate,
    updatePromptTemplate,
    deletePromptTemplate,
    getPromptTemplates,
    createPromptConfig,
    getPromptConfig,
    updatePromptConfig,
    deletePromptConfig,
    getPromptConfigs,
    getDefaultConfigForFeature,
    setDefaultConfigForFeature,
    renderPrompt,
    renderPromptConfig,
    promptRouter
 } from './prompt.controller';

// Export the ModelController class for handling AI model-related HTTP requests
export { ModelController, 
    validateModelIdParam,
    validateProviderQuery,
    validateCapabilitiesQuery,
    validateFeatureQuery,
    validateModelCapabilitiesBody,
    validateModelParametersBody
 };

// Export the OrchestrationController class for handling AI orchestration-related HTTP requests
export { OrchestrationController, 
    validateRequestIdParam,
    validateCreateOrchestrationRequest
 };

// Export functions for managing prompt templates and configurations
export { 
    createPromptTemplate,
    getPromptTemplate,
    updatePromptTemplate,
    deletePromptTemplate,
    getPromptTemplates,
    createPromptConfig,
    getPromptConfig,
    updatePromptConfig,
    deletePromptConfig,
    getPromptConfigs,
    getDefaultConfigForFeature,
    setDefaultConfigForFeature,
    renderPrompt,
    renderPromptConfig,
    promptRouter
 };