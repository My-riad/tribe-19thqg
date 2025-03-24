/**
 * Integration Index Module
 * 
 * This module serves as a central export point for all AI integrations used by the
 * AI Orchestration Service. It exports classes and functions for interacting with
 * external AI providers like OpenRouter as well as internal AI Engine services.
 * 
 * By consolidating these exports, it provides a clean interface for other services
 * to import the necessary integration components for AI-powered features.
 */

// Import OpenRouter integration components
import {
  OpenRouterIntegration,
  createOpenRouterClient,
  checkOpenRouterHealth
} from './openrouter.integration';

// Import AI Engine integration components
import {
  AIEngineIntegration,
  createAIEngineClient,
  checkAIEngineHealth
} from './ai-engine.integration';

// Export all integration components for use in other modules
export {
  // OpenRouter Integration
  OpenRouterIntegration,
  createOpenRouterClient,
  checkOpenRouterHealth,
  
  // AI Engine Integration
  AIEngineIntegration,
  createAIEngineClient,
  checkAIEngineHealth
};