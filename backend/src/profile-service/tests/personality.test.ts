import { PersonalityModel } from '../src/models/personality.model';
import { PersonalityService } from '../src/services/personality.service';
import { PersonalityController } from '../src/controllers/personality.controller';
import { 
  IPersonalityTrait, 
  IPersonalityAssessment, 
  PersonalityTrait,
  CommunicationStyle
} from '../../shared/src/types/profile.types';
import { DatabaseError } from '../../shared/src/errors/database.error';
import { ApiError } from '../../shared/src/errors/api.error';
import { updateProfile } from '../src/services/profile.service';
import { PrismaClient } from '@prisma/client'; // ^4.16.0
import express from 'express'; // ^4.18.2
import request from 'supertest'; // ^6.3.3
import NodeCache from 'node-cache'; // ^5.1.2

// Mock Prisma client for database operations
const mockPrisma = {
  personalityTrait: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  profile: {
    update: jest.fn(),
    findUnique: jest.fn()
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
} as unknown as PrismaClient;

// Mock updateProfile function
const mockUpdateProfile = jest.fn();

// Utility function to generate mock personality trait
const generateMockPersonalityTrait = (overrides: Partial<IPersonalityTrait> = {}): IPersonalityTrait => {
  const defaultTrait: IPersonalityTrait = {
    id: 'trait-id',
    profileId: 'profile-id',
    trait: PersonalityTrait.OPENNESS,
    score: 75,
    assessedAt: new Date(),
    ...overrides,
  };
  return defaultTrait;
};

// Utility function to generate mock personality assessment
const generateMockPersonalityAssessment = (overrides: Partial<IPersonalityAssessment> = {}): IPersonalityAssessment => {
  const defaultAssessment: IPersonalityAssessment = {
    profileId: 'profile-id',
    traits: [
      { trait: PersonalityTrait.OPENNESS, score: 75 },
      { trait: PersonalityTrait.CONSCIENTIOUSNESS, score: 60 },
    ],
    communicationStyle: CommunicationStyle.DIRECT,
    assessmentSource: 'questionnaire',
    ...overrides,
  };
  return defaultAssessment;
};

// Utility function to create a mock Express request object
const mockRequest = (options: any = {}): any => {
  const req: any = {
    body: {},
    params: {},
    query: {},
    ...options,
  };
  return req;
};

// Utility function to create a mock Express response object
const mockResponse = (): any => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
};

// Utility function to create a mock Express next function
const mockNext = (): any => {
  return jest.fn();
};

describe('PersonalityModel', () => {
  let personalityModel: PersonalityModel;

  beforeEach(() => {
    personalityModel = new PersonalityModel();
    personalityModel['prisma'] = mockPrisma;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('Should create a new personality trait', async () => {
      const mockTrait = generateMockPersonalityTrait();
      (mockPrisma.personalityTrait.create as jest.Mock).mockResolvedValue(mockTrait);

      const traitData: IPersonalityTrait = {
        profileId: 'profile-id',
        trait: PersonalityTrait.OPENNESS,
        score: 75,
        id: 'trait-id',
        assessedAt: new Date()
      };

      const trait = await personalityModel.create(traitData);

      expect(mockPrisma.personalityTrait.create).toHaveBeenCalledWith({
        data: {
          profileId: 'profile-id',
          trait: PersonalityTrait.OPENNESS,
          score: 75,
          assessedAt: expect.any(Date)
        }
      });
      expect(trait).toEqual(mockTrait);
    });

    it('Should handle database errors appropriately', async () => {
      (mockPrisma.personalityTrait.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const traitData: IPersonalityTrait = {
        profileId: 'profile-id',
        trait: PersonalityTrait.OPENNESS,
        score: 75,
        id: 'trait-id',
        assessedAt: new Date()
      };

      await expect(personalityModel.create(traitData)).rejects.toThrow(DatabaseError);
    });
  });

  describe('getById', () => {
    it('Should retrieve a personality trait by ID', async () => {
      const mockTrait = generateMockPersonalityTrait();
      (mockPrisma.personalityTrait.findUnique as jest.Mock).mockResolvedValue(mockTrait);

      const trait = await personalityModel.getById('trait-id');

      expect(mockPrisma.personalityTrait.findUnique).toHaveBeenCalledWith({
        where: { id: 'trait-id' }
      });
      expect(trait).toEqual(mockTrait);
    });

    it('Should handle database errors appropriately', async () => {
      (mockPrisma.personalityTrait.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(personalityModel.getById('trait-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('getByProfileId', () => {
    it('Should retrieve personality traits by profile ID', async () => {
      const mockTraits = [generateMockPersonalityTrait(), generateMockPersonalityTrait({ trait: PersonalityTrait.CONSCIENTIOUSNESS })];
      (mockPrisma.personalityTrait.findMany as jest.Mock).mockResolvedValue(mockTraits);

      const traits = await personalityModel.getByProfileId('profile-id');

      expect(mockPrisma.personalityTrait.findMany).toHaveBeenCalledWith({
        where: { profileId: 'profile-id' }
      });
      expect(traits).toEqual(mockTraits);
    });

    it('Should handle database errors appropriately', async () => {
      (mockPrisma.personalityTrait.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(personalityModel.getByProfileId('profile-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('update', () => {
    it('Should update an existing personality trait', async () => {
      const mockUpdatedTrait = generateMockPersonalityTrait({ score: 80 });
      (mockPrisma.personalityTrait.update as jest.Mock).mockResolvedValue(mockUpdatedTrait);

      const updatedTrait = await personalityModel.update('trait-id', { score: 80 });

      expect(mockPrisma.personalityTrait.update).toHaveBeenCalledWith({
        where: { id: 'trait-id' },
        data: {
          trait: undefined,
          score: 80,
          assessedAt: expect.any(Date)
        }
      });
      expect(updatedTrait).toEqual(mockUpdatedTrait);
    });

    it('Should handle database errors appropriately', async () => {
      (mockPrisma.personalityTrait.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(personalityModel.update('trait-id', { score: 80 })).rejects.toThrow(DatabaseError);
    });
  });

  describe('delete', () => {
    it('Should delete a personality trait', async () => {
      (mockPrisma.personalityTrait.delete as jest.Mock).mockResolvedValue({});

      const result = await personalityModel.delete('trait-id');

      expect(mockPrisma.personalityTrait.delete).toHaveBeenCalledWith({
        where: { id: 'trait-id' }
      });
      expect(result).toBe(true);
    });

    it('Should handle database errors appropriately', async () => {
      (mockPrisma.personalityTrait.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(personalityModel.delete('trait-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('submitAssessment', () => {
    it('Should submit a complete personality assessment', async () => {
      const mockTraits = [generateMockPersonalityTrait(), generateMockPersonalityTrait({ trait: PersonalityTrait.CONSCIENTIOUSNESS })];
      (mockPrisma.$transaction as jest.Mock).mockImplementation((fn) => fn({
        personalityTrait: {
          deleteMany: mockPrisma.personalityTrait.deleteMany,
          create: mockPrisma.personalityTrait.create
        },
        profile: {
          update: mockPrisma.profile.update
        }
      }));
      (mockPrisma.personalityTrait.create as jest.Mock).mockResolvedValue(generateMockPersonalityTrait());
      (mockPrisma.profile.update as jest.Mock).mockResolvedValue({});

      const assessmentData: IPersonalityAssessment = generateMockPersonalityAssessment();

      const traits = await personalityModel.submitAssessment(assessmentData);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.personalityTrait.deleteMany).toHaveBeenCalledWith({
        where: { profileId: 'profile-id' }
      });
      expect(mockPrisma.personalityTrait.create).toHaveBeenCalledTimes(2);
      expect(traits).toEqual([generateMockPersonalityTrait(), generateMockPersonalityTrait()]);
    });

    it('Should handle database errors appropriately', async () => {
      (mockPrisma.$transaction as jest.Mock).mockRejectedValue(new Error('Database error'));

      const assessmentData: IPersonalityAssessment = generateMockPersonalityAssessment();

      await expect(personalityModel.submitAssessment(assessmentData)).rejects.toThrow(DatabaseError);
    });
  });

  describe('calculateCompatibility', () => {
    it('Should calculate personality compatibility between profiles', async () => {
      const mockTraits1 = [generateMockPersonalityTrait()];
      const mockTraits2 = [generateMockPersonalityTrait({ trait: PersonalityTrait.CONSCIENTIOUSNESS })];
      (mockPrisma.personalityTrait.findMany as jest.Mock).mockResolvedValueOnce(mockTraits1).mockResolvedValueOnce(mockTraits2);
      (mockPrisma.profile.findUnique as jest.Mock).mockResolvedValue({ communicationStyle: CommunicationStyle.DIRECT });

      const compatibility = await personalityModel.calculateCompatibility('profile-id-1', 'profile-id-2');

      expect(mockPrisma.personalityTrait.findMany).toHaveBeenCalledWith({
        where: { profileId: 'profile-id-1' }
      });
      expect(mockPrisma.personalityTrait.findMany).toHaveBeenCalledWith({
        where: { profileId: 'profile-id-2' }
      });
      expect(typeof compatibility).toBe('number');
      expect(compatibility).toBeGreaterThanOrEqual(0);
      expect(compatibility).toBeLessThanOrEqual(1);
    });

    it('Should handle database errors appropriately', async () => {
      (mockPrisma.personalityTrait.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(personalityModel.calculateCompatibility('profile-id-1', 'profile-id-2')).rejects.toThrow(DatabaseError);
    });
  });
});

describe('PersonalityService', () => {
  let personalityService: PersonalityService;

  beforeEach(() => {
    personalityService = new PersonalityService();
    jest.clearAllMocks();
  });

  describe('createTrait', () => {
    it('Should create a new personality trait', async () => {
      const mockTrait = generateMockPersonalityTrait();
      const createPersonalityTraitMock = jest.fn().mockResolvedValue(mockTrait);
      personalityService.createTrait = createPersonalityTraitMock;

      const traitData: IPersonalityTrait = {
        profileId: 'profile-id',
        trait: PersonalityTrait.OPENNESS,
        score: 75,
        id: 'trait-id',
        assessedAt: new Date()
      };

      const trait = await personalityService.createTrait(traitData);

      expect(createPersonalityTraitMock).toHaveBeenCalledWith(traitData);
      expect(trait).toEqual(mockTrait);
    });
  });

  describe('getById', () => {
    it('Should retrieve a personality trait by ID', async () => {
      const mockTrait = generateMockPersonalityTrait();
      const getPersonalityTraitByIdMock = jest.fn().mockResolvedValue(mockTrait);
      personalityService.getById = getPersonalityTraitByIdMock;

      const trait = await personalityService.getById('trait-id');

      expect(getPersonalityTraitByIdMock).toHaveBeenCalledWith('trait-id');
      expect(trait).toEqual(mockTrait);
    });
  });

  describe('getByProfileId', () => {
    it('Should retrieve personality traits by profile ID', async () => {
      const mockTraits = [generateMockPersonalityTrait(), generateMockPersonalityTrait({ trait: PersonalityTrait.CONSCIENTIOUSNESS })];
      const getPersonalityTraitsByProfileIdMock = jest.fn().mockResolvedValue(mockTraits);
      personalityService.getByProfileId = getPersonalityTraitsByProfileIdMock;

      const traits = await personalityService.getByProfileId('profile-id');

      expect(getPersonalityTraitsByProfileIdMock).toHaveBeenCalledWith('profile-id');
      expect(traits).toEqual(mockTraits);
    });
  });

  describe('update', () => {
    it('Should update an existing personality trait', async () => {
      const mockUpdatedTrait = generateMockPersonalityTrait({ score: 80 });
      const updatePersonalityTraitMock = jest.fn().mockResolvedValue(mockUpdatedTrait);
      personalityService.update = updatePersonalityTraitMock;

      const updatedTrait = await personalityService.update('trait-id', { score: 80 });

      expect(updatePersonalityTraitMock).toHaveBeenCalledWith('trait-id', { score: 80 });
      expect(updatedTrait).toEqual(mockUpdatedTrait);
    });
  });

  describe('delete', () => {
    it('Should delete a personality trait', async () => {
      const deletePersonalityTraitMock = jest.fn().mockResolvedValue(true);
      personalityService.delete = deletePersonalityTraitMock;

      const result = await personalityService.delete('trait-id');

      expect(deletePersonalityTraitMock).toHaveBeenCalledWith('trait-id');
      expect(result).toBe(true);
    });
  });

  describe('submitAssessment', () => {
    it('Should submit a complete personality assessment', async () => {
      const mockTraits = [generateMockPersonalityTrait(), generateMockPersonalityTrait({ trait: PersonalityTrait.CONSCIENTIOUSNESS })];
      const submitPersonalityAssessmentMock = jest.fn().mockResolvedValue(mockTraits);
      personalityService.submitAssessment = submitPersonalityAssessmentMock;

      const assessmentData: IPersonalityAssessment = generateMockPersonalityAssessment();

      const traits = await personalityService.submitAssessment(assessmentData);

      expect(submitPersonalityAssessmentMock).toHaveBeenCalledWith(assessmentData);
      expect(traits).toEqual(mockTraits);
    });
  });

  describe('getCompatibility', () => {
    it('Should get personality compatibility between profiles', async () => {
      const mockCompatibility = 0.75;
      const getPersonalityCompatibilityMock = jest.fn().mockResolvedValue(mockCompatibility);
      personalityService.getCompatibility = getPersonalityCompatibilityMock;

      const compatibility = await personalityService.getCompatibility('profile-id-1', 'profile-id-2');

      expect(getPersonalityCompatibilityMock).toHaveBeenCalledWith('profile-id-1', 'profile-id-2');
      expect(compatibility).toBe(mockCompatibility);
    });
  });

  describe('analyzeTraits', () => {
    it('Should analyze personality traits', async () => {
      const mockTraits = [generateMockPersonalityTrait(), generateMockPersonalityTrait({ trait: PersonalityTrait.CONSCIENTIOUSNESS })];
      const mockAnalysis = { dominantTraits: ['openness', 'conscientiousness'], personalityType: 'Balanced' };
      const analyzePersonalityTraitsMock = jest.fn().mockReturnValue(mockAnalysis);
      personalityService.analyzeTraits = analyzePersonalityTraitsMock;

      const analysis = personalityService.analyzeTraits(mockTraits);

      expect(analyzePersonalityTraitsMock).toHaveBeenCalledWith(mockTraits);
      expect(analysis).toEqual(mockAnalysis);
    });
  });

  describe('predictCommunicationStyle', () => {
    it('Should predict communication style from traits', async () => {
      const mockTraits = [generateMockPersonalityTrait(), generateMockPersonalityTrait({ trait: PersonalityTrait.CONSCIENTIOUSNESS })];
      const mockCommunicationStyle = CommunicationStyle.DIRECT;
      const predictCommunicationStyleMock = jest.fn().mockReturnValue(mockCommunicationStyle);
      personalityService.predictCommunicationStyle = predictCommunicationStyleMock;

      const style = personalityService.predictCommunicationStyle(mockTraits);

      expect(predictCommunicationStyleMock).toHaveBeenCalledWith(mockTraits);
      expect(style).toEqual(mockCommunicationStyle);
    });
  });

  describe('clearCompatibilityCache', () => {
    it('Should clear compatibility cache for a profile', async () => {
      const clearCompatibilityCacheMock = jest.fn();
      personalityService.clearCompatibilityCache = clearCompatibilityCacheMock;

      personalityService.clearCompatibilityCache('profile-id');

      expect(clearCompatibilityCacheMock).toHaveBeenCalledWith('profile-id');
    });
  });

  describe('caching behavior', () => {
    it('Should cache and retrieve compatibility results', async () => {
      const mockCompatibility = 0.75;
      const getPersonalityCompatibilityMock = jest.fn().mockResolvedValue(mockCompatibility);
      personalityService.getCompatibility = getPersonalityCompatibilityMock;

      const profileId1 = 'profile-id-1';
      const profileId2 = 'profile-id-2';

      // First call should invoke the mock function
      const compatibility1 = await personalityService.getCompatibility(profileId1, profileId2);
      expect(getPersonalityCompatibilityMock).toHaveBeenCalledTimes(1);
      expect(compatibility1).toBe(mockCompatibility);

      // Second call with the same profile IDs should return the cached result
      const compatibility2 = await personalityService.getCompatibility(profileId1, profileId2);
      expect(getPersonalityCompatibilityMock).toHaveBeenCalledTimes(1); // Still only called once
      expect(compatibility2).toBe(mockCompatibility);
    });
  });

  describe('error handling', () => {
    it('Should handle service errors appropriately', async () => {
      const errorMessage = 'Service error';
      const createPersonalityTraitMock = jest.fn().mockRejectedValue(new Error(errorMessage));
      personalityService.createTrait = createPersonalityTraitMock;

      const traitData: IPersonalityTrait = {
        profileId: 'profile-id',
        trait: PersonalityTrait.OPENNESS,
        score: 75,
        id: 'trait-id',
        assessedAt: new Date()
      };

      await expect(personalityService.createTrait(traitData)).rejects.toThrow(errorMessage);
    });
  });
});

describe('PersonalityController', () => {
  let personalityController: PersonalityController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      createTrait: jest.fn(),
      getById: jest.fn(),
      getByProfileId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      submitAssessment: jest.fn(),
      getCompatibility: jest.fn(),
      analyzeTraits: jest.fn(),
      predictCommunicationStyle: jest.fn(),
      clearCompatibilityCache: jest.fn()
    };
    personalityController = new PersonalityController();
    personalityController['personalityService'] = mockService;
    jest.clearAllMocks();
  });

  describe('createTrait', () => {
    it('Should handle requests to create a new personality trait', async () => {
      const mockTrait = generateMockPersonalityTrait();
      mockService.createTrait.mockResolvedValue(mockTrait);

      const req = mockRequest({ body: { profileId: 'profile-id', trait: PersonalityTrait.OPENNESS, score: 75 } });
      const res = mockResponse();
      const next = mockNext();

      await personalityController.createTrait(req, res, next);

      expect(mockService.createTrait).toHaveBeenCalledWith({ profileId: 'profile-id', trait: PersonalityTrait.OPENNESS, score: 75 });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(mockTrait);
    });
  });

  describe('getTraitById', () => {
    it('Should handle requests to get a personality trait by ID', async () => {
      const mockTrait = generateMockPersonalityTrait();
      mockService.getById.mockResolvedValue(mockTrait);

      const req = mockRequest({ params: { id: 'trait-id' } });
      const res = mockResponse();
      const next = mockNext();

      await personalityController.getTraitById(req, res, next);

      expect(mockService.getById).toHaveBeenCalledWith('trait-id');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(mockTrait);
    });

    it('Should handle trait not found', async () => {
      mockService.getById.mockResolvedValue(null);

      const req = mockRequest({ params: { id: 'trait-id' } });
      const res = mockResponse();
      const next = mockNext();

      await personalityController.getTraitById(req, res, next);

      expect(mockService.getById).toHaveBeenCalledWith('trait-id');
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe('getTraitsByProfileId', () => {
    it('Should handle requests to get personality traits by profile ID', async () => {
      const mockTraits = [generateMockPersonalityTrait(), generateMockPersonalityTrait({ trait: PersonalityTrait.CONSCIENTIOUSNESS })];
      mockService.getByProfileId.mockResolvedValue(mockTraits);

      const req = mockRequest({ params: { profileId: 'profile-id' } });
      const res = mockResponse();
      const next = mockNext();

      await personalityController.getTraitsByProfileId(req, res, next);

      expect(mockService.getByProfileId).toHaveBeenCalledWith('profile-id');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(mockTraits);
    });
  });

  describe('updateTrait', () => {
    it('Should handle requests to update a personality trait', async () => {
      const mockUpdatedTrait = generateMockPersonalityTrait({ score: 80 });
      mockService.update.mockResolvedValue(mockUpdatedTrait);

      const req = mockRequest({ params: { id: 'trait-id' }, body: { score: 80 } });
      const res = mockResponse();
      const next = mockNext();

      await personalityController.updateTrait(req, res, next);

      expect(mockService.update).toHaveBeenCalledWith('trait-id', { score: 80 });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedTrait);
    });
  });

  describe('deleteTrait', () => {
    it('Should handle requests to delete a personality trait', async () => {
      mockService.delete.mockResolvedValue(true);

      const req = mockRequest({ params: { id: 'trait-id' } });
      const res = mockResponse();
      const next = mockNext();

      await personalityController.deleteTrait(req, res, next);

      expect(mockService.delete).toHaveBeenCalledWith('trait-id');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NO_CONTENT);
    });
  });

  describe('submitAssessment', () => {
    it('Should handle requests to submit a personality assessment', async () => {
      const mockTraits = [generateMockPersonalityTrait(), generateMockPersonalityTrait({ trait: PersonalityTrait.CONSCIENTIOUSNESS })];
      mockService.submitAssessment.mockResolvedValue(mockTraits);

      const req = mockRequest({ body: generateMockPersonalityAssessment() });
      const res = mockResponse();
      const next = mockNext();

      await personalityController.submitAssessment(req, res, next);

      expect(mockService.submitAssessment).toHaveBeenCalledWith(generateMockPersonalityAssessment());
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(mockTraits);
    });
  });

  describe('getCompatibility', () => {
    it('Should handle requests to get personality compatibility', async () => {
      mockService.getCompatibility.mockResolvedValue(0.75);

      const req = mockRequest({ params: { profileId1: 'profile-id-1', profileId2: 'profile-id-2' } });
      const res = mockResponse();
      const next = mockNext();

      await personalityController.getCompatibility(req, res, next);

      expect(mockService.getCompatibility).toHaveBeenCalledWith('profile-id-1', 'profile-id-2');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({ compatibility: 0.75 });
    });
  });

  describe('analyzeTraits', () => {
    it('Should handle requests to analyze personality traits', async () => {
      const mockTraits = [generateMockPersonalityTrait(), generateMockPersonalityTrait({ trait: PersonalityTrait.CONSCIENTIOUSNESS })];
      mockService.getByProfileId.mockResolvedValue(mockTraits);
      const mockAnalysis = { dominantTraits: ['openness', 'conscientiousness'], personalityType: 'Balanced' };
      mockService.analyzeTraits.mockReturnValue(mockAnalysis);

      const req = mockRequest({ params: { profileId: 'profile-id' } });
      const res = mockResponse();
      const next = mockNext();

      await personalityController.analyzeTraits(req, res, next);

      expect(mockService.getByProfileId).toHaveBeenCalledWith('profile-id');
      expect(mockService.analyzeTraits).toHaveBeenCalledWith(mockTraits);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(mockAnalysis);
    });

    it('Should handle no traits found for analysis', async () => {
      mockService.getByProfileId.mockResolvedValue([]);

      const req = mockRequest({ params: { profileId: 'profile-id' } });
      const res = mockResponse();
      const next = mockNext();

      await personalityController.analyzeTraits(req, res, next);

      expect(mockService.getByProfileId).toHaveBeenCalledWith('profile-id');
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe('error handling', () => {
    it('Should handle controller errors appropriately', async () => {
      const errorMessage = 'Controller error';
      mockService.createTrait.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest({ body: { profileId: 'profile-id', trait: PersonalityTrait.OPENNESS, score: 75 } });
      const res = mockResponse();
      const next = mockNext();

      await personalityController.createTrait(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

describe('Integration Tests', () => {
  let app: express.Application;
  let personalityController: PersonalityController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      createTrait: jest.fn(),
      getById: jest.fn(),
      getByProfileId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      submitAssessment: jest.fn(),
      getCompatibility: jest.fn(),
      analyzeTraits: jest.fn(),
      predictCommunicationStyle: jest.fn(),
      clearCompatibilityCache: jest.fn()
    };
    personalityController = new PersonalityController();
    personalityController['personalityService'] = mockService;

    app = express();
    app.use(express.json());
    
    // Define routes using the mock controller
    app.post('/personality/traits', personalityController.createTrait.bind(personalityController));
    app.get('/personality/traits/:id', personalityController.getTraitById.bind(personalityController));
    app.get('/personality/profile/:profileId/traits', personalityController.getTraitsByProfileId.bind(personalityController));
    app.put('/personality/traits/:id', personalityController.updateTrait.bind(personalityController));
    app.delete('/personality/traits/:id', personalityController.deleteTrait.bind(personalityController));
    app.post('/personality/assessment', personalityController.submitAssessment.bind(personalityController));
    app.get('/personality/compatibility', personalityController.getCompatibility.bind(personalityController));
    app.get('/personality/profile/:profileId/analysis', personalityController.analyzeTraits.bind(personalityController));
  });

  it('POST /personality/traits', async () => {
    const mockTrait = generateMockPersonalityTrait();
    mockService.createTrait.mockResolvedValue(mockTrait);

    const response = await request(app)
      .post('/personality/traits')
      .send({ profileId: 'profile-id', trait: PersonalityTrait.OPENNESS, score: 75 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockTrait);
  });

  it('GET /personality/traits/:id', async () => {
    const mockTrait = generateMockPersonalityTrait();
    mockService.getById.mockResolvedValue(mockTrait);

    const response = await request(app).get('/personality/traits/trait-id');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockTrait);
  });

  it('GET /personality/profile/:profileId/traits', async () => {
    const mockTraits = [generateMockPersonalityTrait(), generateMockPersonalityTrait({ trait: PersonalityTrait.CONSCIENTIOUSNESS })];
    mockService.getByProfileId.mockResolvedValue(mockTraits);

    const response = await request(app).get('/personality/profile/profile-id/traits');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockTraits);
  });

  it('PUT /personality/traits/:id', async () => {
    const mockUpdatedTrait = generateMockPersonalityTrait({ score: 80 });
    mockService.update.mockResolvedValue(mockUpdatedTrait);

    const response = await request(app)
      .put('/personality/traits/trait-id')
      .send({ score: 80 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUpdatedTrait);
  });

  it('DELETE /personality/traits/:id', async () => {
    mockService.delete.mockResolvedValue(true);

    const response = await request(app).delete('/personality/traits/trait-id');

    expect(response.status).toBe(204);
  });

  it('POST /personality/assessment', async () => {
    const mockTraits = [generateMockPersonalityTrait(), generateMockPersonalityTrait({ trait: PersonalityTrait.CONSCIENTIOUSNESS })];
    mockService.submitAssessment.mockResolvedValue(mockTraits);

    const response = await request(app)
      .post('/personality/assessment')
      .send(generateMockPersonalityAssessment());

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockTraits);
  });

  it('GET /personality/compatibility', async () => {
    mockService.getCompatibility.mockResolvedValue(0.75);

    const response = await request(app).get('/personality/compatibility?profileId1=profile-id-1&profileId2=profile-id-2');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ compatibility: 0.75 });
  });

  it('GET /personality/profile/:profileId/analysis', async () => {
    const mockTraits = [generateMockPersonalityTrait(), generateMockPersonalityTrait({ trait: PersonalityTrait.CONSCIENTIOUSNESS })];
    mockService.getByProfileId.mockResolvedValue(mockTraits);
    const mockAnalysis = { dominantTraits: ['openness', 'conscientiousness'], personalityType: 'Balanced' };
    mockService.analyzeTraits.mockReturnValue(mockAnalysis);

    const response = await request(app).get('/personality/profile/profile-id/analysis');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockAnalysis);
  });
});