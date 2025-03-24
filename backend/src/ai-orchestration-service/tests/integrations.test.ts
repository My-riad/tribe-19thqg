import nock from 'nock'; // v13.3.1
import axios from 'axios'; // v1.4.0

import { 
  OpenRouterIntegration, 
  createOpenRouterClient,
  checkOpenRouterHealth
} from '../src/integrations/openrouter.integration';

import {
  AIEngineIntegration,
  createAIEngineClient,
  checkAIEngineHealth
} from '../src/integrations/ai-engine.integration';

import {
  ModelConfig,
  ModelParameters,
  ModelCapability,
  ChatMessage
} from '../src/models/model.model';

import {
  OrchestrationFeature,
  MatchingOperation,
  PersonalityOperation,
  EngagementOperation,
  RecommendationOperation
} from '../src/models/orchestration.model';

import { ApiError } from '../../shared/src/errors/api.error';

// Mock the configuration values
jest.mock('../src/config', () => ({
  OPENROUTER_API_KEY: 'test-api-key',
  OPENROUTER_API_URL: 'https://openrouter.ai/api/v1',
  AI_ENGINE_URL: 'http://ai-engine-service:3000',
  AI_ENGINE_API_KEY: 'test-engine-key',
  modelTimeout: 5000,
  maxRetries: 0, // No retries in tests
  retryDelay: 0,
  defaultModels: {
    text_generation: 'openai/gpt-4',
    chat_completion: 'openai/gpt-4',
    embedding: 'openai/text-embedding-ada-002'
  },
  modelLatencyHistogram: {
    observe: jest.fn()
  },
  modelRequestCounter: {
    inc: jest.fn()
  },
  modelErrorCounter: {
    inc: jest.fn()
  },
  promptTokensCounter: {
    inc: jest.fn()
  },
  completionTokensCounter: {
    inc: jest.fn()
  },
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Helper functions to create mock data for tests
function createMockUserProfile(overrides = {}) {
  return {
    id: 'user123',
    name: 'Test User',
    bio: 'A test user for AI integration tests',
    interests: ['hiking', 'reading', 'technology'],
    personality: {
      traits: [
        { name: 'openness', score: 0.8 },
        { name: 'conscientiousness', score: 0.7 },
        { name: 'extraversion', score: 0.4 },
        { name: 'agreeableness', score: 0.9 },
        { name: 'neuroticism', score: 0.2 }
      ]
    },
    communicationStyle: 'collaborative',
    location: {
      city: 'Seattle',
      state: 'WA',
      coordinates: {
        latitude: 47.6062,
        longitude: -122.3321
      }
    },
    ...overrides
  };
}

function createMockTribeData(overrides = {}) {
  return {
    id: 'tribe123',
    name: 'Adventure Seekers',
    description: 'A group for outdoor enthusiasts',
    members: [
      createMockUserProfile({ id: 'user123' }),
      createMockUserProfile({ id: 'user124', name: 'Test User 2' }),
      createMockUserProfile({ id: 'user125', name: 'Test User 3' })
    ],
    interests: ['hiking', 'camping', 'travel'],
    location: {
      city: 'Seattle',
      state: 'WA',
      coordinates: {
        latitude: 47.6062,
        longitude: -122.3321
      }
    },
    engagementHistory: [
      { type: 'meetup', date: '2023-07-10', participants: 3, activity: 'Hiking' },
      { type: 'chat', date: '2023-07-15', participants: 3, messages: 25 }
    ],
    ...overrides
  };
}

function createMockAssessmentData(overrides = {}) {
  return {
    userId: 'user123',
    responses: [
      { questionId: 'q1', text: 'I enjoy spending time with large groups of people', response: 3 },
      { questionId: 'q2', text: 'I prefer to plan activities in advance', response: 4 },
      { questionId: 'q3', text: 'I enjoy trying new experiences', response: 5 },
      { questionId: 'q4', text: 'I prefer deep conversations to small talk', response: 5 },
      { questionId: 'q5', text: 'I find it easy to relate to others\' emotions', response: 4 }
    ],
    ...overrides
  };
}

// Helper functions to set up mocks
function setupOpenRouterMock(endpoint: string, response: any, statusCode: number = 200) {
  return nock('https://openrouter.ai/api/v1')
    .post(endpoint)
    .reply(statusCode, response);
}

function setupAIEngineMock(endpoint: string, response: any, statusCode: number = 200) {
  return nock('http://ai-engine-service:3000')
    .post(endpoint)
    .reply(statusCode, response);
}

describe('OpenRouterIntegration', () => {
  let openRouterIntegration: OpenRouterIntegration;

  beforeEach(() => {
    // Create a new instance before each test
    openRouterIntegration = new OpenRouterIntegration();
    // Disable actual HTTP requests
    axios.defaults.adapter = 'http';
  });

  afterEach(() => {
    // Clean up mocks
    nock.cleanAll();
    jest.clearAllMocks();
  });

  describe('generateText', () => {
    it('should successfully generate text from a prompt', async () => {
      // Set up mock response
      const mockResponse = {
        choices: [
          {
            text: 'This is a generated text response.',
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 8,
          total_tokens: 18
        },
        model: 'openai/gpt-4'
      };

      // Set up mock request
      const mockScope = setupOpenRouterMock('/completions', mockResponse);

      // Call the method
      const result = await openRouterIntegration.generateText(
        'Generate a test response',
        'openai/gpt-4'
      );

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toHaveProperty('content', 'This is a generated text response.');
      expect(result).toHaveProperty('usage');
      expect(result.usage).toHaveProperty('promptTokens', 10);
      expect(result.usage).toHaveProperty('completionTokens', 8);
      expect(result).toHaveProperty('modelId', 'openai/gpt-4');
      expect(result).toHaveProperty('finishReason', 'stop');
    });

    it('should handle errors from the OpenRouter API', async () => {
      // Set up mock to return an error
      const mockScope = nock('https://openrouter.ai/api/v1')
        .post('/completions')
        .reply(500, { error: { message: 'Internal server error' } });

      // Expect the method to throw an error
      await expect(openRouterIntegration.generateText(
        'Generate a test response',
        'openai/gpt-4'
      )).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('generateChatCompletion', () => {
    it('should successfully generate a chat completion', async () => {
      // Set up mock messages
      const messages: ChatMessage[] = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Tell me about AI.' }
      ];

      // Set up mock response
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'AI, or artificial intelligence, refers to systems designed to perform tasks that typically require human intelligence.'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 20,
          completion_tokens: 18,
          total_tokens: 38
        },
        model: 'openai/gpt-4'
      };

      // Set up mock request
      const mockScope = setupOpenRouterMock('/chat/completions', mockResponse);

      // Call the method
      const result = await openRouterIntegration.generateChatCompletion(
        messages,
        'openai/gpt-4'
      );

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toHaveProperty('message');
      expect(result.message).toHaveProperty('role', 'assistant');
      expect(result.message).toHaveProperty('content', 'AI, or artificial intelligence, refers to systems designed to perform tasks that typically require human intelligence.');
      expect(result).toHaveProperty('usage');
      expect(result.usage).toHaveProperty('promptTokens', 20);
      expect(result.usage).toHaveProperty('completionTokens', 18);
      expect(result).toHaveProperty('modelId', 'openai/gpt-4');
      expect(result).toHaveProperty('finishReason', 'stop');
    });

    it('should handle errors from the OpenRouter API', async () => {
      // Set up mock messages
      const messages: ChatMessage[] = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Tell me about AI.' }
      ];

      // Set up mock to return an error
      const mockScope = nock('https://openrouter.ai/api/v1')
        .post('/chat/completions')
        .reply(429, { error: { message: 'Rate limit exceeded' } });

      // Expect the method to throw an error
      await expect(openRouterIntegration.generateChatCompletion(
        messages,
        'openai/gpt-4'
      )).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('generateEmbedding', () => {
    it('should successfully generate embeddings for text', async () => {
      // Set up mock response
      const mockResponse = {
        data: [
          {
            embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
          }
        ]
      };

      // Set up mock request
      const mockScope = setupOpenRouterMock('/embeddings', mockResponse);

      // Call the method
      const result = await openRouterIntegration.generateEmbedding(
        'Generate embeddings for this text',
        'openai/text-embedding-ada-002'
      );

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
    });

    it('should handle errors from the OpenRouter API', async () => {
      // Set up mock to return an error
      const mockScope = nock('https://openrouter.ai/api/v1')
        .post('/embeddings')
        .reply(400, { error: { message: 'Invalid input' } });

      // Expect the method to throw an error
      await expect(openRouterIntegration.generateEmbedding(
        'Generate embeddings for this text',
        'openai/text-embedding-ada-002'
      )).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('listAvailableModels', () => {
    it('should successfully list available models', async () => {
      // Set up mock response
      const mockResponse = {
        data: [
          {
            id: 'openai/gpt-4',
            name: 'GPT-4',
            context_length: 8192,
            pricing: {
              prompt: 0.03,
              completion: 0.06
            }
          },
          {
            id: 'anthropic/claude-2',
            name: 'Claude 2',
            context_length: 100000,
            pricing: {
              prompt: 0.02,
              completion: 0.06
            }
          }
        ]
      };

      // Set up mock request
      const mockScope = nock('https://openrouter.ai/api/v1')
        .get('/models')
        .reply(200, mockResponse);

      // Call the method
      const result = await openRouterIntegration.listAvailableModels();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'openai/gpt-4');
      expect(result[0]).toHaveProperty('name', 'GPT-4');
      expect(result[0]).toHaveProperty('capabilities');
      expect(result[0]).toHaveProperty('contextWindow', 8192);
      expect(result[1]).toHaveProperty('id', 'anthropic/claude-2');
    });

    it('should handle errors from the OpenRouter API', async () => {
      // Set up mock to return an error
      const mockScope = nock('https://openrouter.ai/api/v1')
        .get('/models')
        .reply(500, { error: { message: 'Server error' } });

      // Expect the method to throw an error
      await expect(openRouterIntegration.listAvailableModels()).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('checkHealth', () => {
    it('should return true when the OpenRouter API is healthy', async () => {
      // Set up mock response
      const mockResponse = {
        data: [
          {
            id: 'openai/gpt-4',
            name: 'GPT-4'
          }
        ]
      };

      // Set up mock request
      const mockScope = nock('https://openrouter.ai/api/v1')
        .get('/models')
        .reply(200, mockResponse);

      // Call the method
      const result = await openRouterIntegration.checkHealth();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toBe(true);
    });

    it('should return false when the OpenRouter API is unhealthy', async () => {
      // Set up mock to return an error
      const mockScope = nock('https://openrouter.ai/api/v1')
        .get('/models')
        .reply(500, { error: { message: 'Server error' } });

      // Call the method
      const result = await openRouterIntegration.checkHealth();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toBe(false);
    });
  });
});

describe('AIEngineIntegration', () => {
  let aiEngineIntegration: AIEngineIntegration;

  beforeEach(() => {
    // Create a new instance before each test
    aiEngineIntegration = new AIEngineIntegration();
    // Disable actual HTTP requests
    axios.defaults.adapter = 'http';
  });

  afterEach(() => {
    // Clean up mocks
    nock.cleanAll();
    jest.clearAllMocks();
  });

  describe('matchUserToTribes', () => {
    it('should successfully match a user to tribes', async () => {
      const userProfile = createMockUserProfile();
      const tribes = [
        createMockTribeData({ id: 'tribe123' }),
        createMockTribeData({ id: 'tribe124', name: 'Book Club' })
      ];
      
      // Set up mock response
      const mockResponse = {
        matches: [
          {
            tribeId: 'tribe123',
            compatibility: 0.85,
            reasons: ['Shared interest in hiking', 'Compatible personality traits']
          },
          {
            tribeId: 'tribe124',
            compatibility: 0.72,
            reasons: ['Both enjoy reading']
          }
        ],
        modelId: 'openai/gpt-4'
      };

      // Set up mock request
      const mockScope = setupAIEngineMock('/matching', mockResponse);

      // Call the method
      const result = await aiEngineIntegration.matchUserToTribes(userProfile, tribes);

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toHaveProperty('matches');
      expect(result.matches).toHaveLength(2);
      expect(result.matches[0]).toHaveProperty('tribeId', 'tribe123');
      expect(result.matches[0]).toHaveProperty('compatibility', 0.85);
      expect(result).toHaveProperty('modelId', 'openai/gpt-4');
    });

    it('should handle errors from the AI Engine', async () => {
      const userProfile = createMockUserProfile();
      const tribes = [createMockTribeData()];
      
      // Set up mock to return an error
      const mockScope = nock('http://ai-engine-service:3000')
        .post('/matching')
        .reply(500, { error: 'Internal server error' });

      // Expect the method to throw an error
      await expect(aiEngineIntegration.matchUserToTribes(userProfile, tribes)).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('formTribes', () => {
    it('should successfully form tribes from a pool of users', async () => {
      const userProfiles = [
        createMockUserProfile({ id: 'user123' }),
        createMockUserProfile({ id: 'user124', name: 'Test User 2' }),
        createMockUserProfile({ id: 'user125', name: 'Test User 3' }),
        createMockUserProfile({ id: 'user126', name: 'Test User 4' }),
        createMockUserProfile({ id: 'user127', name: 'Test User 5' }),
        createMockUserProfile({ id: 'user128', name: 'Test User 6' })
      ];
      
      // Set up mock response
      const mockResponse = {
        tribes: [
          {
            id: 'new-tribe-1',
            members: ['user123', 'user125', 'user127'],
            compatibilityScore: 0.88,
            commonInterests: ['hiking', 'technology']
          },
          {
            id: 'new-tribe-2',
            members: ['user124', 'user126', 'user128'],
            compatibilityScore: 0.76,
            commonInterests: ['reading', 'music']
          }
        ],
        modelId: 'openai/gpt-4'
      };

      // Set up mock request
      const mockScope = setupAIEngineMock('/matching', mockResponse);

      // Call the method
      const result = await aiEngineIntegration.formTribes(userProfiles);

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toHaveProperty('tribes');
      expect(result.tribes).toHaveLength(2);
      expect(result.tribes[0]).toHaveProperty('id', 'new-tribe-1');
      expect(result.tribes[0]).toHaveProperty('members');
      expect(result.tribes[0].members).toContain('user123');
      expect(result).toHaveProperty('modelId', 'openai/gpt-4');
    });

    it('should handle errors from the AI Engine', async () => {
      const userProfiles = [createMockUserProfile()];
      
      // Set up mock to return an error
      const mockScope = nock('http://ai-engine-service:3000')
        .post('/matching')
        .reply(400, { error: 'Invalid request' });

      // Expect the method to throw an error
      await expect(aiEngineIntegration.formTribes(userProfiles)).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('calculateCompatibility', () => {
    it('should successfully calculate compatibility between a user and a tribe', async () => {
      const userProfile = createMockUserProfile();
      const tribe = createMockTribeData();
      
      // Set up mock response
      const mockResponse = {
        compatibility: {
          score: 0.82,
          strengths: ['Shared interest in hiking', 'Compatible personality with existing members'],
          challenges: ['Different communication styles']
        },
        modelId: 'openai/gpt-4'
      };

      // Set up mock request
      const mockScope = setupAIEngineMock('/matching', mockResponse);

      // Call the method
      const result = await aiEngineIntegration.calculateCompatibility(userProfile, tribe, 'tribe');

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toHaveProperty('compatibility');
      expect(result.compatibility).toHaveProperty('score', 0.82);
      expect(result.compatibility).toHaveProperty('strengths');
      expect(result.compatibility).toHaveProperty('challenges');
      expect(result).toHaveProperty('modelId', 'openai/gpt-4');
    });

    it('should handle errors from the AI Engine', async () => {
      const userProfile = createMockUserProfile();
      const targetUser = createMockUserProfile({ id: 'user999' });
      
      // Set up mock to return an error
      const mockScope = nock('http://ai-engine-service:3000')
        .post('/matching')
        .replyWithError('Connection refused');

      // Expect the method to throw an error
      await expect(aiEngineIntegration.calculateCompatibility(userProfile, targetUser, 'user')).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('analyzePersonality', () => {
    it('should successfully analyze personality assessment data', async () => {
      const assessmentData = createMockAssessmentData();
      
      // Set up mock response
      const mockResponse = {
        personalityProfile: {
          traits: [
            { name: 'openness', score: 0.85, description: 'High openness indicates curiosity and willingness to try new experiences' },
            { name: 'conscientiousness', score: 0.75, description: 'High conscientiousness indicates organization and responsibility' },
            { name: 'extraversion', score: 0.45, description: 'Moderate extraversion indicates balance between social engagement and solitude' },
            { name: 'agreeableness', score: 0.9, description: 'High agreeableness indicates empathy and cooperation' },
            { name: 'neuroticism', score: 0.3, description: 'Low neuroticism indicates emotional stability' }
          ],
          summary: 'This individual is curious, responsible, moderately social, highly empathetic, and emotionally stable.',
          recommendations: ['Would likely thrive in collaborative environments', 'May enjoy intellectual discussions']
        },
        modelId: 'openai/gpt-4'
      };

      // Set up mock request
      const mockScope = setupAIEngineMock('/personality', mockResponse);

      // Call the method
      const result = await aiEngineIntegration.analyzePersonality(assessmentData);

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toHaveProperty('personalityProfile');
      expect(result.personalityProfile).toHaveProperty('traits');
      expect(result.personalityProfile.traits).toHaveLength(5);
      expect(result.personalityProfile).toHaveProperty('summary');
      expect(result).toHaveProperty('modelId', 'openai/gpt-4');
    });

    it('should handle errors from the AI Engine', async () => {
      const assessmentData = createMockAssessmentData();
      
      // Set up mock to return an error
      const mockScope = nock('http://ai-engine-service:3000')
        .post('/personality')
        .reply(500, { error: 'Processing error' });

      // Expect the method to throw an error
      await expect(aiEngineIntegration.analyzePersonality(assessmentData)).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('analyzeCommunicationStyle', () => {
    it('should successfully analyze communication style data', async () => {
      const interactionData = {
        userId: 'user123',
        messages: [
          { content: 'I think we should consider all options before deciding.', timestamp: '2023-07-01T10:00:00Z' },
          { content: 'That's a great point! I hadn't thought of that perspective.', timestamp: '2023-07-01T10:05:00Z' },
          { content: 'Let's try to find a solution that works for everyone.', timestamp: '2023-07-01T10:10:00Z' }
        ]
      };
      
      // Set up mock response
      const mockResponse = {
        communicationStyle: {
          dominant: 'collaborative',
          secondary: 'analytical',
          traits: ['considerate', 'inclusive', 'thoughtful'],
          description: 'This person emphasizes teamwork and consensus-building, while also applying logical analysis to discussions.',
          recommendations: ['Works well in collaborative environments', 'Appreciates when others consider multiple perspectives']
        },
        modelId: 'openai/gpt-4'
      };

      // Set up mock request
      const mockScope = setupAIEngineMock('/personality', mockResponse);

      // Call the method
      const result = await aiEngineIntegration.analyzeCommunicationStyle(interactionData);

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toHaveProperty('communicationStyle');
      expect(result.communicationStyle).toHaveProperty('dominant', 'collaborative');
      expect(result.communicationStyle).toHaveProperty('traits');
      expect(result).toHaveProperty('modelId', 'openai/gpt-4');
    });

    it('should handle errors from the AI Engine', async () => {
      const interactionData = {
        userId: 'user123',
        messages: []
      };
      
      // Set up mock to return an error
      const mockScope = nock('http://ai-engine-service:3000')
        .post('/personality')
        .reply(422, { error: 'Insufficient data for analysis' });

      // Expect the method to throw an error
      await expect(aiEngineIntegration.analyzeCommunicationStyle(interactionData)).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('generateEngagementPrompts', () => {
    it('should successfully generate engagement prompts for a tribe', async () => {
      const tribeData = createMockTribeData();
      
      // Set up mock response
      const mockResponse = {
        prompts: [
          {
            text: 'If you could go hiking anywhere in the world, where would it be and why?',
            rationale: 'Based on the tribe's shared interest in hiking',
            type: 'discussion'
          },
          {
            text: 'Share a book or article about outdoor adventures that you've enjoyed recently.',
            rationale: 'Combines interests in reading and outdoors',
            type: 'sharing'
          },
          {
            text: 'What's your favorite technology gadget for outdoor activities?',
            rationale: 'Connects technology interest with outdoor activities',
            type: 'discussion'
          }
        ],
        modelId: 'openai/gpt-4'
      };

      // Set up mock request
      const mockScope = setupAIEngineMock('/engagement', mockResponse);

      // Call the method
      const result = await aiEngineIntegration.generateEngagementPrompts(tribeData);

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toHaveProperty('prompts');
      expect(result.prompts).toHaveLength(3);
      expect(result.prompts[0]).toHaveProperty('text');
      expect(result.prompts[0]).toHaveProperty('rationale');
      expect(result).toHaveProperty('modelId', 'openai/gpt-4');
    });

    it('should handle errors from the AI Engine', async () => {
      const tribeData = createMockTribeData();
      
      // Set up mock to return an error
      const mockScope = nock('http://ai-engine-service:3000')
        .post('/engagement')
        .reply(429, { error: 'Rate limit exceeded' });

      // Expect the method to throw an error
      await expect(aiEngineIntegration.generateEngagementPrompts(tribeData)).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('generateGroupChallenge', () => {
    it('should successfully generate a group challenge for a tribe', async () => {
      const tribeData = createMockTribeData();
      
      // Set up mock response
      const mockResponse = {
        challenges: [
          {
            title: 'Sunrise Hike Challenge',
            description: 'Meet up for a sunrise hike at a local trail, capture photos of the sunrise, and share them in the group chat.',
            difficulty: 'Moderate',
            duration: '3-4 hours',
            requirements: ['Hiking gear', 'Camera/phone', 'Water'],
            benefits: ['Shared experience', 'Physical activity', 'Photography opportunities']
          }
        ],
        modelId: 'openai/gpt-4'
      };

      // Set up mock request
      const mockScope = setupAIEngineMock('/engagement', mockResponse);

      // Call the method
      const result = await aiEngineIntegration.generateGroupChallenge(tribeData);

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toHaveProperty('challenges');
      expect(result.challenges).toHaveLength(1);
      expect(result.challenges[0]).toHaveProperty('title', 'Sunrise Hike Challenge');
      expect(result.challenges[0]).toHaveProperty('description');
      expect(result).toHaveProperty('modelId', 'openai/gpt-4');
    });

    it('should handle errors from the AI Engine', async () => {
      const tribeData = createMockTribeData();
      
      // Set up mock to return an error
      const mockScope = nock('http://ai-engine-service:3000')
        .post('/engagement')
        .replyWithError('Connection timeout');

      // Expect the method to throw an error
      await expect(aiEngineIntegration.generateGroupChallenge(tribeData)).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('suggestActivities', () => {
    it('should successfully suggest activities for a tribe', async () => {
      const tribeData = createMockTribeData();
      
      // Set up mock response
      const mockResponse = {
        activities: [
          {
            name: 'Trail Hike at Discovery Park',
            description: 'Explore the scenic trails at Discovery Park with views of Puget Sound.',
            type: 'Outdoor',
            benefits: ['Physical activity', 'Nature appreciation', 'Group bonding'],
            location: 'Discovery Park, Seattle'
          },
          {
            name: 'Tech Meetup Social',
            description: 'Attend a local tech meetup together and discuss the latest innovations.',
            type: 'Educational',
            benefits: ['Knowledge sharing', 'Networking', 'Common interest in technology'],
            location: 'Various venues in Seattle'
          },
          {
            name: 'Book Club Discussion',
            description: 'Select a book related to outdoor adventures and meet to discuss it.',
            type: 'Social',
            benefits: ['Intellectual stimulation', 'Shared interest in reading'],
            location: 'Local café or member's home'
          }
        ],
        modelId: 'openai/gpt-4'
      };

      // Set up mock request
      const mockScope = setupAIEngineMock('/engagement', mockResponse);

      // Call the method
      const result = await aiEngineIntegration.suggestActivities(tribeData);

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toHaveProperty('activities');
      expect(result.activities).toHaveLength(3);
      expect(result.activities[0]).toHaveProperty('name');
      expect(result.activities[0]).toHaveProperty('description');
      expect(result).toHaveProperty('modelId', 'openai/gpt-4');
    });

    it('should handle errors from the AI Engine', async () => {
      const tribeData = createMockTribeData();
      
      // Set up mock to return an error
      const mockScope = nock('http://ai-engine-service:3000')
        .post('/engagement')
        .reply(500, { error: 'Server error' });

      // Expect the method to throw an error
      await expect(aiEngineIntegration.suggestActivities(tribeData)).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('recommendEvents', () => {
    it('should successfully recommend events for a tribe', async () => {
      const tribeData = createMockTribeData();
      const location = {
        city: 'Seattle',
        state: 'WA',
        coordinates: {
          latitude: 47.6062,
          longitude: -122.3321
        }
      };
      
      // Set up mock response
      const mockResponse = {
        events: [
          {
            name: 'Seattle Hiking Club - Weekend Trek',
            description: 'Join experienced hikers for a trek through the beautiful trails near Seattle.',
            date: '2023-08-05',
            time: '09:00 AM',
            location: 'Rattlesnake Ledge Trail',
            relevanceScore: 0.92,
            relevanceFactors: ['Matches hiking interest', 'Outdoor activity', 'Group-friendly']
          },
          {
            name: 'Tech Talk: Future of Outdoor Gear',
            description: 'Learn about the latest technological innovations in outdoor and hiking equipment.',
            date: '2023-08-03',
            time: '06:30 PM',
            location: 'REI Seattle',
            relevanceScore: 0.85,
            relevanceFactors: ['Combines technology and hiking interests', 'Educational']
          }
        ],
        modelId: 'openai/gpt-4'
      };

      // Set up mock request
      const mockScope = setupAIEngineMock('/recommendations', mockResponse);

      // Call the method
      const result = await aiEngineIntegration.recommendEvents(tribeData, location);

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toHaveProperty('events');
      expect(result.events).toHaveLength(2);
      expect(result.events[0]).toHaveProperty('name');
      expect(result.events[0]).toHaveProperty('relevanceScore');
      expect(result).toHaveProperty('modelId', 'openai/gpt-4');
    });

    it('should handle errors from the AI Engine', async () => {
      const tribeData = createMockTribeData();
      const location = { city: 'Seattle', state: 'WA' };
      
      // Set up mock to return an error
      const mockScope = nock('http://ai-engine-service:3000')
        .post('/recommendations')
        .reply(400, { error: 'Invalid location data' });

      // Expect the method to throw an error
      await expect(aiEngineIntegration.recommendEvents(tribeData, location)).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('recommendWeatherActivities', () => {
    it('should successfully recommend weather-appropriate activities', async () => {
      const tribeData = createMockTribeData();
      const location = {
        city: 'Seattle',
        state: 'WA',
        coordinates: {
          latitude: 47.6062,
          longitude: -122.3321
        }
      };
      const weatherData = {
        condition: 'rain',
        temperature: 55,
        precipitation: 0.3,
        windSpeed: 5,
        forecast: [
          { day: 'today', condition: 'rain', high: 58, low: 52 },
          { day: 'tomorrow', condition: 'cloudy', high: 62, low: 54 }
        ]
      };
      
      // Set up mock response
      const mockResponse = {
        activities: [
          {
            name: 'Indoor Rock Climbing',
            description: 'Try indoor rock climbing at a local gym - a great way to build climbing skills while staying dry.',
            type: 'Indoor',
            weatherAppropriate: true,
            location: 'Seattle Bouldering Project',
            relevanceScore: 0.88
          },
          {
            name: 'Tech Museum Visit',
            description: 'Visit the Museum of Pop Culture or Living Computers Museum for an indoor activity that caters to technology interests.',
            type: 'Indoor',
            weatherAppropriate: true,
            location: 'Seattle Center',
            relevanceScore: 0.85
          },
          {
            name: 'Book Café Meetup',
            description: 'Meet at a cozy café to discuss favorite books or plan future outdoor adventures.',
            type: 'Indoor Social',
            weatherAppropriate: true,
            location: 'Various Seattle cafés',
            relevanceScore: 0.82
          }
        ],
        weatherConsideration: 'Activities recommended for rainy weather with moderate temperatures around 55°F.',
        modelId: 'openai/gpt-4'
      };

      // Set up mock request
      const mockScope = setupAIEngineMock('/recommendations', mockResponse);

      // Call the method
      const result = await aiEngineIntegration.recommendWeatherActivities(tribeData, location, weatherData);

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toHaveProperty('activities');
      expect(result.activities).toHaveLength(3);
      expect(result.activities[0]).toHaveProperty('name');
      expect(result.activities[0]).toHaveProperty('weatherAppropriate', true);
      expect(result).toHaveProperty('weatherConsideration');
      expect(result).toHaveProperty('modelId', 'openai/gpt-4');
    });

    it('should handle errors from the AI Engine', async () => {
      const tribeData = createMockTribeData();
      const location = { city: 'Seattle', state: 'WA' };
      const weatherData = { condition: 'sunny' };
      
      // Set up mock to return an error
      const mockScope = nock('http://ai-engine-service:3000')
        .post('/recommendations')
        .reply(503, { error: 'Service unavailable' });

      // Expect the method to throw an error
      await expect(aiEngineIntegration.recommendWeatherActivities(tribeData, location, weatherData)).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('recommendBudgetOptions', () => {
    it('should successfully recommend budget-friendly options', async () => {
      const tribeData = createMockTribeData();
      const location = {
        city: 'Seattle',
        state: 'WA',
        coordinates: {
          latitude: 47.6062,
          longitude: -122.3321
        }
      };
      const budget = 50; // $50 per person
      
      // Set up mock response
      const mockResponse = {
        activities: [
          {
            name: 'Discovery Park Hike & Picnic',
            description: 'Explore the trails at Discovery Park followed by a group picnic with shared dishes.',
            cost: {
              total: 15,
              breakdown: 'Transportation: $5, Picnic contribution: $10'
            },
            type: 'Outdoor',
            location: 'Discovery Park, Seattle',
            relevanceScore: 0.95
          },
          {
            name: 'Community Tech Meetup',
            description: 'Attend a free community tech event or workshop together.',
            cost: {
              total: 0,
              breakdown: 'Free event'
            },
            type: 'Educational',
            location: 'Various venues in Seattle',
            relevanceScore: 0.82
          },
          {
            name: 'Library Book Club Session',
            description: 'Meet at the public library for a discussion about a selected book on outdoor adventures.',
            cost: {
              total: 0,
              breakdown: 'Free event, optional book purchase'
            },
            type: 'Social',
            location: 'Seattle Public Library',
            relevanceScore: 0.8
          }
        ],
        budgetConsideration: 'All activities are well under the $50 per person budget, with most being free or low-cost options.',
        modelId: 'openai/gpt-4'
      };

      // Set up mock request
      const mockScope = setupAIEngineMock('/recommendations', mockResponse);

      // Call the method
      const result = await aiEngineIntegration.recommendBudgetOptions(tribeData, location, budget);

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toHaveProperty('activities');
      expect(result.activities).toHaveLength(3);
      expect(result.activities[0]).toHaveProperty('name');
      expect(result.activities[0]).toHaveProperty('cost');
      expect(result).toHaveProperty('budgetConsideration');
      expect(result).toHaveProperty('modelId', 'openai/gpt-4');
    });

    it('should handle errors from the AI Engine', async () => {
      const tribeData = createMockTribeData();
      const location = { city: 'Seattle', state: 'WA' };
      const budget = -10; // Invalid budget
      
      // Set up mock to return an error
      const mockScope = nock('http://ai-engine-service:3000')
        .post('/recommendations')
        .reply(400, { error: 'Invalid budget amount' });

      // Expect the method to throw an error
      await expect(aiEngineIntegration.recommendBudgetOptions(tribeData, location, budget)).rejects.toThrow();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);
    });
  });

  describe('checkHealth', () => {
    it('should return true when the AI Engine is healthy', async () => {
      // Set up mock response
      const mockResponse = {
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      };

      // Set up mock request
      const mockScope = nock('http://ai-engine-service:3000')
        .get('/health')
        .reply(200, mockResponse);

      // Call the method
      const result = await aiEngineIntegration.checkHealth();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toBe(true);
    });

    it('should return false when the AI Engine is unhealthy', async () => {
      // Set up mock to return an error
      const mockScope = nock('http://ai-engine-service:3000')
        .get('/health')
        .reply(500, { status: 'error' });

      // Call the method
      const result = await aiEngineIntegration.checkHealth();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toBe(false);
    });

    it('should return false when the AI Engine is unreachable', async () => {
      // Set up mock to network error
      const mockScope = nock('http://ai-engine-service:3000')
        .get('/health')
        .replyWithError('Connection refused');

      // Call the method
      const result = await aiEngineIntegration.checkHealth();

      // Verify mock was called
      expect(mockScope.isDone()).toBe(true);

      // Verify the result
      expect(result).toBe(false);
    });
  });
});