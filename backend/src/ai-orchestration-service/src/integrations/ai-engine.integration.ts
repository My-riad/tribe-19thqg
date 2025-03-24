import axios, { AxiosInstance } from 'axios'; // v1.4.0
import axiosRetry from 'axios-retry'; // v3.5.0
import { v4 as uuidv4 } from 'uuid'; // v9.0.0

import { 
  AI_ENGINE_URL, 
  AI_ENGINE_API_KEY, 
  modelLatencyHistogram, 
  modelRequestCounter, 
  modelErrorCounter,
  logger,
  modelTimeout,
  maxRetries,
  retryDelay
} from '../config';
import { 
  OrchestrationFeature, 
  MatchingOperation, 
  PersonalityOperation, 
  EngagementOperation, 
  RecommendationOperation,
  MatchingOrchestrationInput,
  PersonalityOrchestrationInput,
  EngagementOrchestrationInput,
  RecommendationOrchestrationInput
} from '../models/orchestration.model';
import { ApiError } from '../../shared/src/errors/api.error';

/**
 * Creates and configures an Axios client for communicating with the AI Engine microservice
 * @returns Configured Axios client for AI Engine communication
 */
export function createAIEngineClient(): AxiosInstance {
  // Get configuration from environment/config
  const baseUrl = AI_ENGINE_URL || 'http://ai-engine-service:3000';
  const apiKey = AI_ENGINE_API_KEY;
  const timeout = modelTimeout || 30000; // 30 seconds default
  
  // Create Axios instance with base configuration
  const client = axios.create({
    baseURL: baseUrl,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'User-Agent': 'Tribe/AI-Orchestration-Service'
    }
  });
  
  // Configure request interceptor for logging and metrics
  client.interceptors.request.use((config) => {
    const requestId = config.headers['X-Request-ID'] || uuidv4();
    config.headers['X-Request-ID'] = requestId;
    
    logger.debug('AI Engine API Request', {
      url: `${config.baseURL}${config.url}`,
      method: config.method,
      requestId
    });
    
    // Add timing information for metrics
    config.metadata = { startTime: Date.now() };
    
    return config;
  });
  
  // Configure response interceptor for logging, metrics, and error handling
  client.interceptors.response.use(
    (response) => {
      const requestId = response.config.headers['X-Request-ID'];
      const endTime = Date.now();
      const startTime = response.config.metadata?.startTime || endTime;
      const duration = (endTime - startTime) / 1000;
      
      // Record metrics
      if (response.config.url) {
        const endpoint = response.config.url.split('?')[0]; // Remove query params
        modelLatencyHistogram.observe({ 
          endpoint, 
          method: response.config.method?.toUpperCase() || 'UNKNOWN' 
        }, duration);
      }
      
      logger.debug('AI Engine API Response', {
        url: `${response.config.baseURL}${response.config.url}`,
        status: response.status,
        duration,
        requestId
      });
      
      return response;
    },
    (error) => {
      // Handle error in the interceptor
      const requestId = error.config?.headers?.['X-Request-ID'] || 'unknown';
      const endTime = Date.now();
      const startTime = error.config?.metadata?.startTime || endTime;
      const duration = (endTime - startTime) / 1000;
      
      // Record error metrics
      const errorType = error.response?.status ? `${error.response.status}` : 'network';
      modelErrorCounter.inc({ error_type: errorType });
      
      logger.error('AI Engine API Error', error, {
        url: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
        status: error.response?.status,
        duration,
        requestId
      });
      
      return Promise.reject(error);
    }
  );
  
  // Configure retry logic
  axiosRetry(client, {
    retries: maxRetries || 3,
    retryDelay: (retryCount) => {
      // Exponential backoff: 1s, 2s, 4s, etc.
      return Math.pow(2, retryCount - 1) * (retryDelay || 1000);
    },
    retryCondition: (error) => {
      // Retry on network errors or 5xx responses (except 429 rate limit)
      return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
        (error.response?.status >= 500 && error.response?.status !== 429);
    }
  });
  
  return client;
}

/**
 * Checks the health status of the AI Engine microservice
 * @returns Promise resolving to true if AI Engine is healthy, false otherwise
 */
export async function checkAIEngineHealth(): Promise<boolean> {
  const requestId = uuidv4();
  
  logger.debug('Checking AI Engine health', { requestId });
  
  try {
    const client = createAIEngineClient();
    const response = await client.get('/health', {
      headers: {
        'X-Request-ID': requestId
      },
      // Use a shorter timeout for health checks
      timeout: 5000
    });
    
    const isHealthy = response.status === 200 && response.data?.status === 'ok';
    
    logger.debug('AI Engine health check result', {
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseStatus: response.status,
      responseData: response.data,
      requestId
    });
    
    return isHealthy;
  } catch (error) {
    logger.error('AI Engine health check failed', error as Error, { requestId });
    return false;
  }
}

/**
 * Handles errors from AI Engine requests and creates appropriate responses
 * @param error - The error object
 * @param requestId - The unique request ID
 * @param feature - The feature that was being used
 * @throws ApiError with appropriate details
 */
function handleAIEngineError(error: Error, requestId: string, feature: string): never {
  logger.error(`AI Engine error for ${feature}`, error, { requestId });
  
  // Increment error counter metric
  modelErrorCounter.inc({ 
    error_type: 'ai_engine_error',
    feature
  });
  
  // Handle specific error types
  if (axios.isAxiosError(error)) {
    // Timeout error
    if (error.code === 'ECONNABORTED') {
      throw ApiError.serviceUnavailable(
        `AI Engine timeout during ${feature} operation. Please try again later.`,
        { requestId, feature, error: error.message }
      );
    }
    
    // Handle specific HTTP status codes
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      // Authentication failure
      if (status === 401 || status === 403) {
        throw ApiError.externalServiceError(
          `AI Engine authentication failed during ${feature} operation.`,
          { requestId, feature, status, error: data }
        );
      }
      
      // Rate limiting
      if (status === 429) {
        throw ApiError.tooManyRequests(
          `AI Engine rate limit exceeded during ${feature} operation. Please try again later.`,
          { requestId, feature, error: data }
        );
      }
      
      // Validation errors
      if (status === 400 || status === 422) {
        throw ApiError.badRequest(
          `Invalid request to AI Engine during ${feature} operation.`,
          { requestId, feature, error: data }
        );
      }
      
      // Server errors
      if (status >= 500) {
        throw ApiError.externalServiceError(
          `AI Engine server error during ${feature} operation. Please try again later.`,
          { requestId, feature, status, error: data }
        );
      }
    }
    
    // Network or other Axios errors
    throw ApiError.externalServiceError(
      `AI Engine communication error during ${feature} operation.`,
      { requestId, feature, error: error.message }
    );
  }
  
  // Generic error fallback
  throw ApiError.externalServiceError(
    `Unexpected error during ${feature} operation with AI Engine.`,
    { requestId, feature, error: error.message }
  );
}

/**
 * Class that encapsulates integration with the AI Engine microservice for AI-powered features
 */
export class AIEngineIntegration {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;
  private retryCount: number;
  
  /**
   * Initialize the AI Engine integration with configuration
   */
  constructor() {
    // Get configuration values
    this.baseUrl = AI_ENGINE_URL || 'http://ai-engine-service:3000';
    this.apiKey = AI_ENGINE_API_KEY;
    this.timeout = modelTimeout || 30000;
    this.retryCount = maxRetries || 3;
    
    // Initialize HTTP client
    this.client = createAIEngineClient();
    
    logger.info('AI Engine integration initialized', {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      retryCount: this.retryCount
    });
  }
  
  /**
   * Match a user to compatible existing tribes
   * @param userProfile - The user profile to match
   * @param tribes - Array of tribes to match against
   * @param options - Additional matching options
   * @returns Promise resolving to tribe matches with compatibility scores
   */
  async matchUserToTribes(
    userProfile: any,
    tribes: any[],
    options: any = {}
  ): Promise<any> {
    const requestId = uuidv4();
    const feature = OrchestrationFeature.MATCHING;
    
    logger.info('Matching user to tribes', {
      userId: userProfile.id,
      tribeCount: tribes.length,
      options,
      requestId
    });
    
    try {
      // Prepare request payload
      const payload: MatchingOrchestrationInput = {
        operation: MatchingOperation.USER_TO_TRIBES,
        userProfile,
        tribes,
        matchingCriteria: options.matchingCriteria,
        maxResults: options.maxResults || 10
      };
      
      // Start performance timer for metrics
      const startTime = Date.now();
      
      // Send POST request to AI Engine's matching endpoint
      const response = await this.client.post('/matching', payload, {
        headers: {
          'X-Request-ID': requestId,
        }
      });
      
      // Calculate duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      
      // Validate response
      if (!response.data || !response.data.matches) {
        throw new Error('Invalid response from AI Engine');
      }
      
      // Record metrics for request duration and result
      modelLatencyHistogram.observe({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'matching'
      }, duration);
      
      modelRequestCounter.inc({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'matching'
      });
      
      logger.info('User-tribe matching completed', {
        userId: userProfile.id,
        matchCount: response.data.matches.length,
        duration,
        requestId
      });
      
      return response.data;
    } catch (error) {
      return handleAIEngineError(error as Error, requestId, feature);
    }
  }
  
  /**
   * Form balanced and compatible tribes from a pool of users
   * @param userProfiles - Array of user profiles to form tribes with
   * @param options - Additional tribe formation options
   * @returns Promise resolving to formed tribes with member assignments
   */
  async formTribes(
    userProfiles: any[],
    options: any = {}
  ): Promise<any> {
    const requestId = uuidv4();
    const feature = OrchestrationFeature.MATCHING;
    
    logger.info('Forming tribes from user pool', {
      userCount: userProfiles.length,
      options,
      requestId
    });
    
    try {
      // Prepare request payload
      const payload: MatchingOrchestrationInput = {
        operation: MatchingOperation.TRIBE_FORMATION,
        userProfiles,
        matchingCriteria: options.matchingCriteria,
        maxResults: options.maxTribes || 0 // 0 means form optimal number of tribes
      };
      
      // Start performance timer for metrics
      const startTime = Date.now();
      
      // Send POST request to AI Engine's matching endpoint
      const response = await this.client.post('/matching', payload, {
        headers: {
          'X-Request-ID': requestId,
        }
      });
      
      // Calculate duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      
      // Validate response
      if (!response.data || !response.data.tribes) {
        throw new Error('Invalid response from AI Engine');
      }
      
      // Record metrics for request duration and result
      modelLatencyHistogram.observe({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'matching'
      }, duration);
      
      modelRequestCounter.inc({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'matching'
      });
      
      logger.info('Tribe formation completed', {
        tribeCount: response.data.tribes.length,
        duration,
        requestId
      });
      
      return response.data;
    } catch (error) {
      return handleAIEngineError(error as Error, requestId, feature);
    }
  }
  
  /**
   * Calculate compatibility between a user and another user or tribe
   * @param userProfile - The user profile to calculate compatibility for
   * @param target - The target user or tribe
   * @param targetType - The type of the target ('user' or 'tribe')
   * @param options - Additional compatibility options
   * @returns Promise resolving to compatibility analysis with scores
   */
  async calculateCompatibility(
    userProfile: any,
    target: any,
    targetType: 'user' | 'tribe',
    options: any = {}
  ): Promise<any> {
    const requestId = uuidv4();
    const feature = OrchestrationFeature.MATCHING;
    
    logger.info('Calculating compatibility', {
      userId: userProfile.id,
      targetType,
      targetId: target.id,
      options,
      requestId
    });
    
    try {
      // Prepare request payload
      const payload: MatchingOrchestrationInput = {
        operation: MatchingOperation.COMPATIBILITY,
        userProfile,
        matchingCriteria: options.matchingCriteria
      };
      
      // Add target based on type
      if (targetType === 'user') {
        payload.targetUserId = target.id;
        payload.userProfiles = [target];
      } else {
        payload.tribeId = target.id;
        payload.tribes = [target];
      }
      
      // Start performance timer for metrics
      const startTime = Date.now();
      
      // Send POST request to AI Engine's matching endpoint
      const response = await this.client.post('/matching', payload, {
        headers: {
          'X-Request-ID': requestId,
        }
      });
      
      // Calculate duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      
      // Validate response
      if (!response.data || !response.data.compatibility) {
        throw new Error('Invalid response from AI Engine');
      }
      
      // Record metrics for request duration and result
      modelLatencyHistogram.observe({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'matching'
      }, duration);
      
      modelRequestCounter.inc({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'matching'
      });
      
      logger.info('Compatibility calculation completed', {
        userId: userProfile.id,
        targetType,
        targetId: target.id,
        score: response.data.compatibility.score,
        duration,
        requestId
      });
      
      return response.data;
    } catch (error) {
      return handleAIEngineError(error as Error, requestId, feature);
    }
  }
  
  /**
   * Analyze personality assessment responses to generate a personality profile
   * @param assessmentData - The assessment responses to analyze
   * @param options - Additional analysis options
   * @returns Promise resolving to personality profile with traits
   */
  async analyzePersonality(
    assessmentData: any,
    options: any = {}
  ): Promise<any> {
    const requestId = uuidv4();
    const feature = OrchestrationFeature.PERSONALITY_ANALYSIS;
    
    logger.info('Analyzing personality assessment', {
      userId: assessmentData.userId,
      questionCount: assessmentData.responses?.length || 0,
      options,
      requestId
    });
    
    try {
      // Prepare request payload
      const payload: PersonalityOrchestrationInput = {
        operation: PersonalityOperation.TRAIT_ANALYSIS,
        assessmentResponses: assessmentData
      };
      
      // Start performance timer for metrics
      const startTime = Date.now();
      
      // Send POST request to AI Engine's personality endpoint
      const response = await this.client.post('/personality', payload, {
        headers: {
          'X-Request-ID': requestId,
        }
      });
      
      // Calculate duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      
      // Validate response
      if (!response.data || !response.data.personalityProfile) {
        throw new Error('Invalid response from AI Engine');
      }
      
      // Record metrics for request duration and result
      modelLatencyHistogram.observe({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'personality_analysis'
      }, duration);
      
      modelRequestCounter.inc({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'personality_analysis'
      });
      
      logger.info('Personality analysis completed', {
        userId: assessmentData.userId,
        traitCount: response.data.personalityProfile.traits?.length || 0,
        duration,
        requestId
      });
      
      return response.data;
    } catch (error) {
      return handleAIEngineError(error as Error, requestId, feature);
    }
  }
  
  /**
   * Analyze interaction data to determine a user's communication style
   * @param interactionData - The interaction data to analyze
   * @param options - Additional analysis options
   * @returns Promise resolving to communication style analysis
   */
  async analyzeCommunicationStyle(
    interactionData: any,
    options: any = {}
  ): Promise<any> {
    const requestId = uuidv4();
    const feature = OrchestrationFeature.PERSONALITY_ANALYSIS;
    
    logger.info('Analyzing communication style', {
      userId: interactionData.userId,
      messageCount: interactionData.messages?.length || 0,
      options,
      requestId
    });
    
    try {
      // Prepare request payload
      const payload: PersonalityOrchestrationInput = {
        operation: PersonalityOperation.COMMUNICATION_STYLE,
        communicationData: interactionData
      };
      
      // Start performance timer for metrics
      const startTime = Date.now();
      
      // Send POST request to AI Engine's personality endpoint
      const response = await this.client.post('/personality', payload, {
        headers: {
          'X-Request-ID': requestId,
        }
      });
      
      // Calculate duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      
      // Validate response
      if (!response.data || !response.data.communicationStyle) {
        throw new Error('Invalid response from AI Engine');
      }
      
      // Record metrics for request duration and result
      modelLatencyHistogram.observe({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'personality_analysis'
      }, duration);
      
      modelRequestCounter.inc({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'personality_analysis'
      });
      
      logger.info('Communication style analysis completed', {
        userId: interactionData.userId,
        dominantStyle: response.data.communicationStyle.dominant,
        duration,
        requestId
      });
      
      return response.data;
    } catch (error) {
      return handleAIEngineError(error as Error, requestId, feature);
    }
  }
  
  /**
   * Generate conversation starters for a Tribe based on member profiles and interaction history
   * @param tribeData - Data about the tribe and its members
   * @param options - Additional generation options
   * @returns Promise resolving to conversation prompts with explanations
   */
  async generateEngagementPrompts(
    tribeData: any,
    options: any = {}
  ): Promise<any> {
    const requestId = uuidv4();
    const feature = OrchestrationFeature.ENGAGEMENT;
    
    logger.info('Generating engagement prompts', {
      tribeId: tribeData.id,
      memberCount: tribeData.members?.length || 0,
      options,
      requestId
    });
    
    try {
      // Prepare request payload
      const payload: EngagementOrchestrationInput = {
        operation: EngagementOperation.CONVERSATION_PROMPTS,
        tribeData,
        memberProfiles: tribeData.members,
        engagementHistory: tribeData.engagementHistory,
        count: options.count || 3
      };
      
      // Start performance timer for metrics
      const startTime = Date.now();
      
      // Send POST request to AI Engine's engagement endpoint
      const response = await this.client.post('/engagement', payload, {
        headers: {
          'X-Request-ID': requestId,
        }
      });
      
      // Calculate duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      
      // Validate response
      if (!response.data || !response.data.prompts) {
        throw new Error('Invalid response from AI Engine');
      }
      
      // Record metrics for request duration and result
      modelLatencyHistogram.observe({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'engagement'
      }, duration);
      
      modelRequestCounter.inc({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'engagement'
      });
      
      logger.info('Engagement prompts generation completed', {
        tribeId: tribeData.id,
        promptCount: response.data.prompts.length,
        duration,
        requestId
      });
      
      return response.data;
    } catch (error) {
      return handleAIEngineError(error as Error, requestId, feature);
    }
  }
  
  /**
   * Generate a group challenge for a Tribe based on member profiles and shared interests
   * @param tribeData - Data about the tribe and its members
   * @param options - Additional generation options
   * @returns Promise resolving to challenge details with instructions
   */
  async generateGroupChallenge(
    tribeData: any,
    options: any = {}
  ): Promise<any> {
    const requestId = uuidv4();
    const feature = OrchestrationFeature.ENGAGEMENT;
    
    logger.info('Generating group challenge', {
      tribeId: tribeData.id,
      memberCount: tribeData.members?.length || 0,
      options,
      requestId
    });
    
    try {
      // Prepare request payload
      const payload: EngagementOrchestrationInput = {
        operation: EngagementOperation.GROUP_CHALLENGES,
        tribeData,
        memberProfiles: tribeData.members,
        engagementHistory: tribeData.engagementHistory,
        count: options.count || 1
      };
      
      // Start performance timer for metrics
      const startTime = Date.now();
      
      // Send POST request to AI Engine's engagement endpoint
      const response = await this.client.post('/engagement', payload, {
        headers: {
          'X-Request-ID': requestId,
        }
      });
      
      // Calculate duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      
      // Validate response
      if (!response.data || !response.data.challenges) {
        throw new Error('Invalid response from AI Engine');
      }
      
      // Record metrics for request duration and result
      modelLatencyHistogram.observe({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'engagement'
      }, duration);
      
      modelRequestCounter.inc({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'engagement'
      });
      
      logger.info('Group challenge generation completed', {
        tribeId: tribeData.id,
        challengeCount: response.data.challenges.length,
        duration,
        requestId
      });
      
      return response.data;
    } catch (error) {
      return handleAIEngineError(error as Error, requestId, feature);
    }
  }
  
  /**
   * Generate activity suggestions for a Tribe based on member profiles and shared interests
   * @param tribeData - Data about the tribe and its members
   * @param options - Additional generation options
   * @returns Promise resolving to activity suggestions with details
   */
  async suggestActivities(
    tribeData: any,
    options: any = {}
  ): Promise<any> {
    const requestId = uuidv4();
    const feature = OrchestrationFeature.ENGAGEMENT;
    
    logger.info('Suggesting activities', {
      tribeId: tribeData.id,
      memberCount: tribeData.members?.length || 0,
      options,
      requestId
    });
    
    try {
      // Prepare request payload
      const payload: EngagementOrchestrationInput = {
        operation: EngagementOperation.ACTIVITY_SUGGESTIONS,
        tribeData,
        memberProfiles: tribeData.members,
        activityPreferences: tribeData.activityPreferences || {},
        count: options.count || 5
      };
      
      // Start performance timer for metrics
      const startTime = Date.now();
      
      // Send POST request to AI Engine's engagement endpoint
      const response = await this.client.post('/engagement', payload, {
        headers: {
          'X-Request-ID': requestId,
        }
      });
      
      // Calculate duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      
      // Validate response
      if (!response.data || !response.data.activities) {
        throw new Error('Invalid response from AI Engine');
      }
      
      // Record metrics for request duration and result
      modelLatencyHistogram.observe({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'engagement'
      }, duration);
      
      modelRequestCounter.inc({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'engagement'
      });
      
      logger.info('Activity suggestions completed', {
        tribeId: tribeData.id,
        activityCount: response.data.activities.length,
        duration,
        requestId
      });
      
      return response.data;
    } catch (error) {
      return handleAIEngineError(error as Error, requestId, feature);
    }
  }
  
  /**
   * Generate event recommendations for a Tribe based on member preferences and location
   * @param tribeData - Data about the tribe and its members
   * @param location - Location data for geo-specific recommendations
   * @param options - Additional recommendation options
   * @returns Promise resolving to event recommendations with relevance scores
   */
  async recommendEvents(
    tribeData: any,
    location: any,
    options: any = {}
  ): Promise<any> {
    const requestId = uuidv4();
    const feature = OrchestrationFeature.RECOMMENDATION;
    
    logger.info('Recommending events', {
      tribeId: tribeData.id,
      location: location.name || location,
      options,
      requestId
    });
    
    try {
      // Prepare request payload
      const payload: RecommendationOrchestrationInput = {
        operation: RecommendationOperation.EVENTS,
        tribeData,
        memberProfiles: tribeData.members,
        location,
        eventOptions: options.eventOptions,
        count: options.count || 5
      };
      
      // Start performance timer for metrics
      const startTime = Date.now();
      
      // Send POST request to AI Engine's recommendations endpoint
      const response = await this.client.post('/recommendations', payload, {
        headers: {
          'X-Request-ID': requestId,
        }
      });
      
      // Calculate duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      
      // Validate response
      if (!response.data || !response.data.events) {
        throw new Error('Invalid response from AI Engine');
      }
      
      // Record metrics for request duration and result
      modelLatencyHistogram.observe({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'recommendation'
      }, duration);
      
      modelRequestCounter.inc({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'recommendation'
      });
      
      logger.info('Event recommendations completed', {
        tribeId: tribeData.id,
        eventCount: response.data.events.length,
        duration,
        requestId
      });
      
      return response.data;
    } catch (error) {
      return handleAIEngineError(error as Error, requestId, feature);
    }
  }
  
  /**
   * Generate weather-appropriate activity recommendations based on forecast and preferences
   * @param tribeData - Data about the tribe and its members
   * @param location - Location data for geo-specific recommendations
   * @param weatherData - Weather forecast data
   * @param options - Additional recommendation options
   * @returns Promise resolving to weather-appropriate activity recommendations
   */
  async recommendWeatherActivities(
    tribeData: any,
    location: any,
    weatherData: any,
    options: any = {}
  ): Promise<any> {
    const requestId = uuidv4();
    const feature = OrchestrationFeature.RECOMMENDATION;
    
    logger.info('Recommending weather-based activities', {
      tribeId: tribeData.id,
      location: location.name || location,
      weather: weatherData.condition || weatherData,
      options,
      requestId
    });
    
    try {
      // Prepare request payload
      const payload: RecommendationOrchestrationInput = {
        operation: RecommendationOperation.WEATHER_ACTIVITIES,
        tribeData,
        memberProfiles: tribeData.members,
        location,
        weatherData,
        count: options.count || 5
      };
      
      // Start performance timer for metrics
      const startTime = Date.now();
      
      // Send POST request to AI Engine's recommendations endpoint
      const response = await this.client.post('/recommendations', payload, {
        headers: {
          'X-Request-ID': requestId,
        }
      });
      
      // Calculate duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      
      // Validate response
      if (!response.data || !response.data.activities) {
        throw new Error('Invalid response from AI Engine');
      }
      
      // Record metrics for request duration and result
      modelLatencyHistogram.observe({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'recommendation'
      }, duration);
      
      modelRequestCounter.inc({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'recommendation'
      });
      
      logger.info('Weather activity recommendations completed', {
        tribeId: tribeData.id,
        activityCount: response.data.activities.length,
        weather: weatherData.condition || weatherData,
        duration,
        requestId
      });
      
      return response.data;
    } catch (error) {
      return handleAIEngineError(error as Error, requestId, feature);
    }
  }
  
  /**
   * Generate budget-friendly activity recommendations based on budget constraints
   * @param tribeData - Data about the tribe and its members
   * @param location - Location data for geo-specific recommendations
   * @param budget - Budget constraint amount
   * @param options - Additional recommendation options
   * @returns Promise resolving to budget-friendly activity recommendations
   */
  async recommendBudgetOptions(
    tribeData: any,
    location: any,
    budget: number,
    options: any = {}
  ): Promise<any> {
    const requestId = uuidv4();
    const feature = OrchestrationFeature.RECOMMENDATION;
    
    logger.info('Recommending budget-friendly options', {
      tribeId: tribeData.id,
      location: location.name || location,
      budget,
      options,
      requestId
    });
    
    try {
      // Prepare request payload
      const payload: RecommendationOrchestrationInput = {
        operation: RecommendationOperation.BUDGET_OPTIONS,
        tribeData,
        memberProfiles: tribeData.members,
        location,
        budgetConstraints: { amount: budget, ...options.budgetDetails },
        count: options.count || 5
      };
      
      // Start performance timer for metrics
      const startTime = Date.now();
      
      // Send POST request to AI Engine's recommendations endpoint
      const response = await this.client.post('/recommendations', payload, {
        headers: {
          'X-Request-ID': requestId,
        }
      });
      
      // Calculate duration for metrics
      const duration = (Date.now() - startTime) / 1000;
      
      // Validate response
      if (!response.data || !response.data.activities) {
        throw new Error('Invalid response from AI Engine');
      }
      
      // Record metrics for request duration and result
      modelLatencyHistogram.observe({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'recommendation'
      }, duration);
      
      modelRequestCounter.inc({ 
        model_id: response.data.modelId || 'unknown',
        capability: 'recommendation'
      });
      
      logger.info('Budget activity recommendations completed', {
        tribeId: tribeData.id,
        activityCount: response.data.activities.length,
        budget,
        duration,
        requestId
      });
      
      return response.data;
    } catch (error) {
      return handleAIEngineError(error as Error, requestId, feature);
    }
  }
  
  /**
   * Check the health status of the AI Engine microservice
   * @returns Promise resolving to health status
   */
  async checkHealth(): Promise<boolean> {
    return checkAIEngineHealth();
  }
}