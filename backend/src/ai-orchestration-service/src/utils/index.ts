/**
 * Central export file for all AI orchestration service utility functions.
 * 
 * This file aggregates and re-exports utility functions from both model
 * and prompt utility modules to provide a unified import location for
 * all AI-related utilities used throughout the application.
 * 
 * @module utils/index
 */

// Import model utility functions
import {
  checkModelCapability,
  selectModelForFeature,
  validateModelParameters,
  mergeWithDefaultParameters,
  estimateTokenCount,
  getOptimalMaxTokens,
  getFeatureSpecificParameters
} from './model.util';

// Import prompt utility functions
import {
  renderPromptTemplate,
  validatePromptVariables,
  extractVariablesFromTemplate,
  createRenderedPrompt,
  optimizePromptForFeature,
  validateTemplateVariablesMatch,
  truncatePromptToMaxTokens,
  getDefaultPromptForFeature
} from './prompt.util';

// Re-export model utilities
export {
  checkModelCapability,
  selectModelForFeature,
  validateModelParameters,
  mergeWithDefaultParameters,
  estimateTokenCount,
  getOptimalMaxTokens,
  getFeatureSpecificParameters
};

// Re-export prompt utilities
export {
  renderPromptTemplate,
  validatePromptVariables,
  extractVariablesFromTemplate,
  createRenderedPrompt,
  optimizePromptForFeature,
  validateTemplateVariablesMatch,
  truncatePromptToMaxTokens,
  getDefaultPromptForFeature
};