import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import NodeCache from 'node-cache'; // ^5.1.2
import PQueue from 'p-queue'; // ^7.3.4

import {
  OrchestrationFeature,
  OrchestrationRequest,
  OrchestrationResponse,
  OrchestrationStatus,
  OrchestrationPriority,
  MatchingOperation,
  PersonalityOperation,
  EngagementOperation,
  RecommendationOperation,
  MatchingOrchestrationInput,
  PersonalityOrchestrationInput,
  EngagementOrchestrationInput,
  RecommendationOrchestrationInput,
  ConversationOrchestrationInput
} from '../models/orchestration.model';
import {
  ModelConfig,
  ModelParameters,
  ChatMessage,
  ModelResponse,
  ChatCompletionResponse
} from '../models/model.model';
import {
  PromptTemplate,
  PromptConfig,
  PromptData,
  RenderedPrompt,
  PromptCategory
} from '../models/prompt.model';
import { ModelService } from './model.service';
import { PromptService } from './prompt.service';
import { OpenRouterIntegration } from '../integrations/openrouter.integration';
import { AIEngineIntegration } from '../integrations/ai-engine.integration';
import {
  validateOrchestrationRequest,
  validateFeatureSpecificInput
} from '../validations/orchestration.validation';
import { prisma } from '../../../config/database';
import { logger } from '../../../config/logging';
import { metrics } from '../../../config/metrics';
import { ApiError } from '../../../shared/src/errors/api.error';

/**
 * Service for orchestrating AI operations across different features of the Tribe platform
 */
export class OrchestrationService {
  private modelService: ModelService;
  private promptService: PromptService;
  private openRouterIntegration: OpenRouterIntegration;
  private aiEngineIntegration: AIEngineIntegration;
  private responseCache: NodeCache;
  private requestQueue: PQueue;
  private activeRequests: Map<string, OrchestrationRequest>;
  private initialized: boolean;

  /**
   * Initialize the orchestration service with required dependencies
   * @param modelService - Model service instance
   * @param promptService - Prompt service instance
   * @param openRouterIntegration - OpenRouter integration instance
   * @param aiEngineIntegration - AI Engine integration instance
   */
  constructor(
    modelService: ModelService,
    promptService: PromptService,
    openRouterIntegration: OpenRouterIntegration,
    aiEngineIntegration: AIEngineIntegration
  ) {
    // LD1: Store service dependencies (modelService, promptService, openRouterIntegration, aiEngineIntegration)
    this.modelService = modelService;
    this.promptService = promptService;
    this.openRouterIntegration = openRouterIntegration;
    this.aiEngineIntegration = aiEngineIntegration;

    // LD1: Initialize response cache with TTL of 30 minutes
    this.responseCache = new NodeCache({ stdTTL: 1800 });

    // LD1: Initialize request queue with concurrency limit and priority sorting
    this.requestQueue = new PQueue({
      concurrency: 5,
      priority: (request: OrchestrationRequest) => {
        switch (request.priority) {
          case OrchestrationPriority.CRITICAL: return 1;
          case OrchestrationPriority.HIGH: return 2;
          case OrchestrationPriority.MEDIUM: return 3;
          case OrchestrationPriority.LOW: return 4;
          default: return 3; // Default to medium priority
        }
      }
    });

    // LD1: Initialize empty map for tracking active requests
    this.activeRequests = new Map<string, OrchestrationRequest>();

    // LD1: Set initialized flag to false
    this.initialized = false;
  }

  /**
   * Initialize the orchestration service and its dependencies
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // LD1: Check if service is already initialized
    if (this.initialized) {
      logger.debug('Orchestration service already initialized');
      return;
    }

    logger.info('Initializing orchestration service');

    try {
      // LD1: Log initialization start
      logger.info('Initializing orchestration service dependencies');

      // LD1: Initialize model service
      await this.modelService.initialize();

      // LD1: Initialize prompt service
      await this.promptService.initialize();

      // LD1: Log successful initialization
      logger.info('Orchestration service initialized successfully');

      // LD1: Set initialized flag to true
      this.initialized = true;
    } catch (error) {
      // LD1: Handle any errors during initialization
      logger.error('Failed to initialize orchestration service', error as Error);
      throw ApiError.internal('Failed to initialize orchestration service', { error: (error as Error).message });
    }
  }

  /**
   * Create a new orchestration request for an AI operation
   * @param feature - The feature being requested
   * @param input - Feature-specific input data
   * @param userId - User making the request
   * @param modelId - Specific model to use (optional)
   * @param parameters - Custom parameters to override defaults
   * @param priority - Priority level for processing
   * @returns The created orchestration request
   */
  async createOrchestrationRequest(
    feature: OrchestrationFeature,
    input: Record<string, any>,
    userId: string,
    modelId: string,
    parameters: ModelParameters,
    priority: OrchestrationPriority
  ): Promise<OrchestrationRequest> {
    // LD1: Ensure service is initialized
    await this.ensureInitialized();

    // LD1: Validate input data for the specified feature using validateFeatureSpecificInput
    validateFeatureSpecificInput(feature, input);

    // LD1: Generate a unique request ID using uuid
    const requestId = uuidv4();

    // LD1: Create orchestration request object with provided data
    const orchestrationRequest: OrchestrationRequest = {
      id: requestId,
      feature,
      input,
      messages: [],
      userId,
      modelId,
      parameters,
      status: OrchestrationStatus.PENDING, // LD1: Set initial status to PENDING
      priority,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // LD1: Validate the complete request using validateOrchestrationRequest
    validateOrchestrationRequest(orchestrationRequest);

    try {
      // LD1: Store request in database with prisma.orchestrationRequest.create
      await prisma.orchestrationRequest.create({
        data: orchestrationRequest
      });

      // LD1: Add request to activeRequests map
      this.activeRequests.set(requestId, orchestrationRequest);

      // LD1: Log request creation
      logger.info(`Created orchestration request: ${requestId}`, { feature, userId, priority });

      // LD1: Return the created request
      return orchestrationRequest;
    } catch (error) {
      // LD1: Handle any errors during request creation
      logger.error(`Failed to create orchestration request: ${requestId}`, error as Error);
      throw ApiError.internal('Failed to create orchestration request', { error: (error as Error).message });
    }
  }

  /**
   * Retrieve an orchestration request by ID
   * @param requestId - The ID of the request to retrieve
   * @returns The orchestration request
   */
  async getOrchestrationRequest(requestId: string): Promise<OrchestrationRequest> {
    // LD1: Ensure service is initialized
    await this.ensureInitialized();

    try {
      // LD1: Check activeRequests map for the request
      if (this.activeRequests.has(requestId)) {
        // LD1: If found in activeRequests, return the request
        return this.activeRequests.get(requestId) as OrchestrationRequest;
      }

      // LD1: If not in activeRequests, query database with prisma.orchestrationRequest.findUnique
      const request = await prisma.orchestrationRequest.findUnique({
        where: { id: requestId }
      });

      // LD1: If not found in database, throw ApiError.notFound
      if (!request) {
        throw ApiError.notFound(`Orchestration request not found: ${requestId}`);
      }

      // LD1: Return the request
      return request;
    } catch (error) {
      // LD1: Handle any errors during retrieval
      logger.error(`Failed to get orchestration request: ${requestId}`, error as Error);
      throw ApiError.internal('Failed to get orchestration request', { error: (error as Error).message });
    }
  }

  /**
   * Process an orchestration request and generate a response
   * @param requestId - The ID of the request to process
   * @returns The orchestration response
   */
  async processOrchestrationRequest(requestId: string): Promise<OrchestrationResponse> {
    // LD1: Ensure service is initialized
    await this.ensureInitialized();

    // LD1: Get the orchestration request by ID
    const request = await this.getOrchestrationRequest(requestId);

    // LD1: Check if request is already being processed
    if (request.status === OrchestrationStatus.PROCESSING) {
      throw ApiError.badRequest(`Orchestration request is already being processed: ${requestId}`);
    }

    // LD1: Update request status to PROCESSING in database
    await prisma.orchestrationRequest.update({
      where: { id: requestId },
      data: { status: OrchestrationStatus.PROCESSING }
    });

    // LD1: Update request in activeRequests map
    this.activeRequests.set(requestId, { ...request, status: OrchestrationStatus.PROCESSING });

    // LD1: Start performance timer for metrics
    const startTime = Date.now();

    // LD1: Increment request counter metric with feature label
    metrics.orchestrationRequestCounter.inc({ feature: request.feature });

    try {
      // LD1: Select appropriate model for the feature if not specified
      const model = request.modelId
        ? await this.modelService.getModel(request.modelId)
        : await this.modelService.getModelForFeature(request.feature);

      // LD1: Validate and prepare model parameters
      const modelParams = await this.modelService.validateAndPrepareParameters(model.id, request.parameters);

      // LD1: Get prompt configuration for the feature
      const promptConfig = await this.promptService.getDefaultConfigForFeature(request.feature);

      // LD1: Render prompts with request input data
      const prompts = await this.promptService.renderPromptConfig(promptConfig.id, request.input);

      let result: Record<string, any>;

      // LD1: Process the request based on feature type (matching, personality, engagement, etc.)
      switch (request.feature) {
        case OrchestrationFeature.MATCHING:
          result = await this.processMatchingRequest(request, prompts);
          break;
        case OrchestrationFeature.PERSONALITY_ANALYSIS:
          result = await this.processPersonalityRequest(request, prompts);
          break;
        case OrchestrationFeature.ENGAGEMENT:
          result = await this.processEngagementRequest(request, prompts);
          break;
        case OrchestrationFeature.RECOMMENDATION:
          result = await this.processRecommendationRequest(request, prompts);
          break;
        case OrchestrationFeature.CONVERSATION:
          result = await this.processConversationRequest(request, prompts);
          break;
        default:
          throw ApiError.badRequest(`Unsupported orchestration feature: ${request.feature}`);
      }

      // LD1: Format and store the response
      const processingTime = Date.now() - startTime;
      const response = await this.createOrchestrationResponse(
        requestId,
        request.feature,
        result,
        result, // Raw response is the same as result for now
        model.id,
        OrchestrationStatus.COMPLETED,
        null,
        null,
        processingTime
      );

      // LD1: Record metrics for request duration
      metrics.orchestrationLatencyHistogram.observe({ feature: request.feature }, processingTime / 1000);

      // LD1: Log successful processing
      logger.info(`Orchestration request completed: ${requestId}`, { feature: request.feature, processingTime });

      // LD1: Return the orchestration response
      return response;
    } catch (error) {
      // LD1: Handle any errors during processing by updating status to FAILED and logging
      const processingTime = Date.now() - startTime;
      logger.error(`Orchestration request failed: ${requestId}`, error as Error);

      // Create a failed orchestration response
      const failedResponse = await this.createOrchestrationResponse(
        requestId,
        request.feature,
        {},
        {},
        request.modelId,
        OrchestrationStatus.FAILED,
        (error as Error).message,
        (error as Error).stack,
        processingTime
      );

      // Record error metrics
      metrics.orchestrationErrorCounter.inc({ feature: request.feature });

      // Throw the error to be handled by the caller
      throw error;
    } finally {
      // LD1: Update request status to COMPLETED
      await prisma.orchestrationRequest.update({
        where: { id: requestId },
        data: { status: OrchestrationStatus.COMPLETED }
      });

      // LD1: Remove request from activeRequests map
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Queue an orchestration request for asynchronous processing
   * @param requestId - The ID of the request to queue
   * @returns The request ID for tracking
   */
  async queueOrchestrationRequest(requestId: string): Promise<string> {
    // LD1: Ensure service is initialized
    await this.ensureInitialized();

    // LD1: Get the orchestration request by ID
    const request = await this.getOrchestrationRequest(requestId);

    try {
      // LD1: Add the request to the priority queue based on its priority
      await this.requestQueue.add(() => this.processOrchestrationRequest(requestId), {
        priority: (request.priority === OrchestrationPriority.CRITICAL) ? 1 : 2
      });

      // LD1: Log request queuing
      logger.info(`Queued orchestration request: ${requestId}`, { feature: request.feature, priority: request.priority });

      // LD1: Return the request ID
      return requestId;
    } catch (error) {
      // LD1: Handle any errors during queuing
      logger.error(`Failed to queue orchestration request: ${requestId}`, error as Error);
      throw ApiError.internal('Failed to queue orchestration request', { error: (error as Error).message });
    }
  }

  /**
   * Retrieve an orchestration response by request ID
   * @param requestId - The ID of the request to retrieve the response for
   * @returns The orchestration response
   */
  async getOrchestrationResponse(requestId: string): Promise<OrchestrationResponse> {
    // LD1: Ensure service is initialized
    await this.ensureInitialized();

    try {
      // LD1: Check response cache for the response
      const cachedResponse = this.responseCache.get<OrchestrationResponse>(requestId);
      if (cachedResponse) {
        logger.debug(`Retrieved orchestration response from cache: ${requestId}`);
        return cachedResponse;
      }

      // LD1: If not in cache, query database with prisma.orchestrationResponse.findUnique
      const response = await prisma.orchestrationResponse.findUnique({
        where: { requestId }
      });

      // LD1: If not found in database, throw ApiError.notFound
      if (!response) {
        throw ApiError.notFound(`Orchestration response not found for request: ${requestId}`);
      }

      // LD1: Add response to cache
      this.responseCache.set(requestId, response);

      // LD1: Return the response
      return response;
    } catch (error) {
      // LD1: Handle any errors during retrieval
      logger.error(`Failed to get orchestration response: ${requestId}`, error as Error);
      throw ApiError.internal('Failed to get orchestration response', { error: (error as Error).message });
    }
  }

  /**
   * Cancel a pending orchestration request
   * @param requestId - The ID of the request to cancel
   * @returns True if request was cancelled
   */
  async cancelOrchestrationRequest(requestId: string): Promise<boolean> {
    // LD1: Ensure service is initialized
    await this.ensureInitialized();

    try {
      // LD1: Get the orchestration request by ID
      const request = await this.getOrchestrationRequest(requestId);

      // LD1: Check if request can be cancelled (must be in PENDING status)
      if (request.status !== OrchestrationStatus.PENDING) {
        throw ApiError.badRequest(`Orchestration request cannot be cancelled in its current state: ${request.status}`);
      }

      // LD1: Update request status to CANCELLED in database
      await prisma.orchestrationRequest.update({
        where: { id: requestId },
        data: { status: OrchestrationStatus.CANCELLED }
      });

      // LD1: Remove request from activeRequests map
      this.activeRequests.delete(requestId);

      // LD1: Log request cancellation
      logger.info(`Cancelled orchestration request: ${requestId}`);

      // LD1: Return true if cancelled successfully
      return true;
    } catch (error) {
      // LD1: Handle any errors during cancellation
      logger.error(`Failed to cancel orchestration request: ${requestId}`, error as Error);
      throw ApiError.internal('Failed to cancel orchestration request', { error: (error as Error).message });
    }
  }

  /**
   * Process a matching feature orchestration request
   * @param request - The orchestration request
   * @param prompts - The rendered prompts
   * @returns The matching operation result
   */
  private async processMatchingRequest(
    request: OrchestrationRequest,
    prompts: Record<PromptCategory, RenderedPrompt>
  ): Promise<Record<string, any>> {
    try {
      // LD1: Cast input to MatchingOrchestrationInput type
      const matchingInput = request.input as MatchingOrchestrationInput;

      // LD1: Extract operation type from input
      const operation = matchingInput.operation;

      let result: any;

      // LD1: Based on operation type, call appropriate AI Engine method:
      switch (operation) {
        // LD1: For USER_TO_TRIBES: Call aiEngineIntegration.matchUserToTribes
        case MatchingOperation.USER_TO_TRIBES:
          result = await this.aiEngineIntegration.matchUserToTribes(
            matchingInput.userProfile,
            matchingInput.tribes,
            matchingInput
          );
          break;

        // LD1: For TRIBE_FORMATION: Call aiEngineIntegration.formTribes
        case MatchingOperation.TRIBE_FORMATION:
          result = await this.aiEngineIntegration.formTribes(
            matchingInput.userProfiles,
            matchingInput
          );
          break;

        // LD1: For COMPATIBILITY: Call aiEngineIntegration.calculateCompatibility
        case MatchingOperation.COMPATIBILITY:
          result = await this.aiEngineIntegration.calculateCompatibility(
            matchingInput.userProfile,
            matchingInput.tribes ? matchingInput.tribes[0] : matchingInput.userProfile,
            matchingInput.tribeId ? 'tribe' : 'user',
            matchingInput
          );
          break;

        default:
          throw ApiError.badRequest(`Unsupported matching operation: ${operation}`);
      }

      // LD1: Process and return the operation result
      return result;
    } catch (error) {
      // LD1: Handle any errors during processing
      logger.error('Failed to process matching request', error as Error);
      throw ApiError.internal('Failed to process matching request', { error: (error as Error).message });
    }
  }

  /**
   * Process a personality analysis feature orchestration request
   * @param request - The orchestration request
   * @param prompts - The rendered prompts
   * @returns The personality analysis result
   */
  private async processPersonalityRequest(
    request: OrchestrationRequest,
    prompts: Record<PromptCategory, RenderedPrompt>
  ): Promise<Record<string, any>> {
    try {
      // LD1: Cast input to PersonalityOrchestrationInput type
      const personalityInput = request.input as PersonalityOrchestrationInput;

      // LD1: Extract operation type from input
      const operation = personalityInput.operation;

      let result: any;

      // LD1: Based on operation type, call appropriate AI Engine method:
      switch (operation) {
        // LD1: For TRAIT_ANALYSIS: Call aiEngineIntegration.analyzePersonality
        case PersonalityOperation.TRAIT_ANALYSIS:
          result = await this.aiEngineIntegration.analyzePersonality(
            personalityInput.assessmentResponses,
            personalityInput
          );
          break;

        // LD1: For COMMUNICATION_STYLE: Call aiEngineIntegration.analyzeCommunicationStyle
        case PersonalityOperation.COMMUNICATION_STYLE:
          result = await this.aiEngineIntegration.analyzeCommunicationStyle(
            personalityInput.userProfile,
            personalityInput
          );
          break;

        default:
          throw ApiError.badRequest(`Unsupported personality operation: ${operation}`);
      }

      // LD1: Process and return the operation result
      return result;
    } catch (error) {
      // LD1: Handle any errors during processing
      logger.error('Failed to process personality request', error as Error);
      throw ApiError.internal('Failed to process personality request', { error: (error as Error).message });
    }
  }

  /**
   * Process an engagement feature orchestration request
   * @param request - The orchestration request
   * @param prompts - The rendered prompts
   * @returns The engagement operation result
   */
  private async processEngagementRequest(
    request: OrchestrationRequest,
    prompts: Record<PromptCategory, RenderedPrompt>
  ): Promise<Record<string, any>> {
    try {
      // LD1: Cast input to EngagementOrchestrationInput type
      const engagementInput = request.input as EngagementOrchestrationInput;

      // LD1: Extract operation type from input
      const operation = engagementInput.operation;

      let result: any;

      // LD1: Based on operation type, call appropriate AI Engine method:
      switch (operation) {
        // LD1: For CONVERSATION_PROMPTS: Call aiEngineIntegration.generateEngagementPrompts
        case EngagementOperation.CONVERSATION_PROMPTS:
          result = await this.aiEngineIntegration.generateEngagementPrompts(
            engagementInput.tribeData,
            engagementInput
          );
          break;

        // LD1: For GROUP_CHALLENGES: Call aiEngineIntegration.generateGroupChallenge
        case EngagementOperation.GROUP_CHALLENGES:
          result = await this.aiEngineIntegration.generateGroupChallenge(
            engagementInput.tribeData,
            engagementInput
          );
          break;

        // LD1: For ACTIVITY_SUGGESTIONS: Call aiEngineIntegration.suggestActivities
        case EngagementOperation.ACTIVITY_SUGGESTIONS:
          result = await this.aiEngineIntegration.suggestActivities(
            engagementInput.tribeData,
            engagementInput
          );
          break;

        default:
          throw ApiError.badRequest(`Unsupported engagement operation: ${operation}`);
      }

      // LD1: Process and return the operation result
      return result;
    } catch (error) {
      // LD1: Handle any errors during processing
      logger.error('Failed to process engagement request', error as Error);
      throw ApiError.internal('Failed to process engagement request', { error: (error as Error).message });
    }
  }

  /**
   * Process a recommendation feature orchestration request
   * @param request - The orchestration request
   * @param prompts - The rendered prompts
   * @returns The recommendation operation result
   */
  private async processRecommendationRequest(
    request: OrchestrationRequest,
    prompts: Record<PromptCategory, RenderedPrompt>
  ): Promise<Record<string, any>> {
    try {
      // LD1: Cast input to RecommendationOrchestrationInput type
      const recommendationInput = request.input as RecommendationOrchestrationInput;

      // LD1: Extract operation type from input
      const operation = recommendationInput.operation;

      let result: any;

      // LD1: Based on operation type, call appropriate AI Engine method:
      switch (operation) {
        // LD1: For EVENTS: Call aiEngineIntegration.recommendEvents
        case RecommendationOperation.EVENTS:
          result = await this.aiEngineIntegration.recommendEvents(
            recommendationInput.tribeData,
            recommendationInput.location,
            recommendationInput
          );
          break;

        // LD1: For WEATHER_ACTIVITIES: Call aiEngineIntegration.recommendWeatherActivities
        case RecommendationOperation.WEATHER_ACTIVITIES:
          result = await this.aiEngineIntegration.recommendWeatherActivities(
            recommendationInput.tribeData,
            recommendationInput.location,
            recommendationInput.weatherData,
            recommendationInput
          );
          break;

        // LD1: For BUDGET_OPTIONS: Call aiEngineIntegration.recommendBudgetOptions
        case RecommendationOperation.BUDGET_OPTIONS:
          result = await this.aiEngineIntegration.recommendBudgetOptions(
            recommendationInput.tribeData,
            recommendationInput.location,
            recommendationInput.budgetConstraints?.amount,
            recommendationInput
          );
          break;

        default:
          throw ApiError.badRequest(`Unsupported recommendation operation: ${operation}`);
      }

      // LD1: Process and return the operation result
      return result;
    } catch (error) {
      // LD1: Handle any errors during processing
      logger.error('Failed to process recommendation request', error as Error);
      throw ApiError.internal('Failed to process recommendation request', { error: (error as Error).message });
    }
  }

  /**
   * Process a conversation feature orchestration request
   * @param request - The orchestration request
   * @param prompts - The rendered prompts
   * @returns The conversation operation result
   */
  private async processConversationRequest(
    request: OrchestrationRequest,
    prompts: Record<PromptCategory, RenderedPrompt>
  ): Promise<Record<string, any>> {
    try {
      // LD1: Cast input to ConversationOrchestrationInput type
      const conversationInput = request.input as ConversationOrchestrationInput;

      // LD1: Prepare chat messages from prompts and conversation history
      const messages: ChatMessage[] = [];

      // Add system prompt
      if (prompts[PromptCategory.SYSTEM]) {
        messages.push({
          role: 'system',
          content: prompts[PromptCategory.SYSTEM].content
        });
      }

      // Add conversation history
      if (conversationInput.conversationHistory) {
        conversationInput.conversationHistory.forEach(message => {
          messages.push({
            role: message.role,
            content: message.content
          });
        });
      }

      // Add user prompt
      if (prompts[PromptCategory.USER]) {
        messages.push({
          role: 'user',
          content: prompts[PromptCategory.USER].content
        });
      }

      // LD1: Call openRouterIntegration.generateChatCompletion with prepared messages
      const chatCompletion = await this.openRouterIntegration.generateChatCompletion(
        messages,
        request.modelId,
        request.parameters
      );

      // LD1: Process and return the operation result
      return {
        message: chatCompletion.message
      };
    } catch (error) {
      // LD1: Handle any errors during processing
      logger.error('Failed to process conversation request', error as Error);
      throw ApiError.internal('Failed to process conversation request', { error: (error as Error).message });
    }
  }

  /**
   * Create and store an orchestration response
   * @param requestId - The ID of the request
   * @param feature - The feature that was processed
   * @param result - Processed result data
   * @param rawResponse - Raw response from the AI model
   * @param modelId - ID of the model that generated the response
   * @param status - Final status of the request
   * @param error - Error message (if applicable)
   * @param errorStack - Error stack trace (if applicable)
   * @param processingTime - Processing time in milliseconds
   * @returns The created orchestration response
   */
  private async createOrchestrationResponse(
    requestId: string,
    feature: OrchestrationFeature,
    result: Record<string, any>,
    rawResponse: any,
    modelId: string,
    status: OrchestrationStatus,
    error: string,
    errorStack: string,
    processingTime: number
  ): Promise<OrchestrationResponse> {
    // LD1: Generate a unique response ID using uuid
    const responseId = uuidv4();

    // LD1: Create orchestration response object with provided data
    const orchestrationResponse: OrchestrationResponse = {
      id: responseId,
      requestId,
      feature,
      result,
      rawResponse,
      modelId,
      status,
      error,
      errorStack,
      processingTime,
      createdAt: new Date()
    };

    try {
      // LD1: Store response in database with prisma.orchestrationResponse.create
      await prisma.orchestrationResponse.create({
        data: orchestrationResponse
      });

      // LD1: Add response to cache
      this.responseCache.set(requestId, orchestrationResponse);

      // LD1: Log response creation
      logger.info(`Created orchestration response: ${responseId}`, { feature, status });

      // LD1: Return the created response
      return orchestrationResponse;
    } catch (error) {
      // LD1: Handle any errors during response creation
      logger.error(`Failed to create orchestration response: ${responseId}`, error as Error);
      throw ApiError.internal('Failed to create orchestration response', { error: (error as Error).message });
    }
  }

  /**
   * Ensure the service is initialized before use
   * @returns Promise that resolves when initialization is confirmed
   */
  private async ensureInitialized(): Promise<void> {
    // LD1: Check if service is already initialized
    if (!this.initialized) {
      // LD1: If not initialized, call initialize method
      await this.initialize();
    }
  }

  /**
   * Clear the response cache
   */
  clearCache(): void {
    try {
      // LD1: Clear response cache
      this.responseCache.flushAll();

      // LD1: Log cache clearing
      logger.info('Orchestration service cache cleared');
    } catch (error) {
      // LD1: Handle any errors during cache clearing
      logger.error('Error clearing orchestration service cache', error as Error);
    }
  }

  /**
   * Get the health status of the orchestration service and its dependencies
   * @returns Health status of each component
   */
  async getHealth(): Promise<Record<string, boolean>> {
    try {
      // LD1: Check if service is initialized
      if (!this.initialized) {
        return {
          initialized: false,
          modelService: false,
          openRouterIntegration: false,
          aiEngineIntegration: false
        };
      }

      // LD1: Check health of model service
      const modelServiceHealth = await this.modelService.getHealth();

      // LD1: Check health of OpenRouter integration
      const openRouterIntegrationHealth = await this.openRouterIntegration.checkHealth();

      // LD1: Check health of AI Engine integration
      const aiEngineIntegrationHealth = await this.aiEngineIntegration.checkHealth();

      // LD1: Return object with health status of each component
      return {
        initialized: true,
        modelService: modelServiceHealth,
        openRouterIntegration: openRouterIntegrationHealth,
        aiEngineIntegration: aiEngineIntegrationHealth
      };
    } catch (error) {
      // LD1: Handle any errors during health check
      logger.error('Error checking orchestration service health', error as Error);
      return {
        initialized: false,
        modelService: false,
        openRouterIntegration: false,
        aiEngineIntegration: false
      };
    }
  }
}