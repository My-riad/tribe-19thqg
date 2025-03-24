import { ProfileModel } from '../src/models/profile.model';
import { ProfileService } from '../src/services/profile.service';
import { ProfileController } from '../src/controllers/profile.controller';
import { 
  IProfile,
  IProfileCreate, 
  IProfileUpdate, 
  IProfileResponse,
  IProfileSearchParams,
  ICoordinates,
  CommunicationStyle 
} from '../../../shared/src/types/profile.types';
import { DatabaseError } from '../../../shared/src/errors/database.error';
import { ValidationError } from '../../../shared/src/errors/validation.error';
import prisma from '../../../config/database';
import { faker } from '@faker-js/faker';
import express from 'express';
import supertest from 'supertest';

// Mock Prisma client
jest.mock('../../../config/database', () => ({
  prisma: {
    profile: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn((callback) => callback(mockPrisma))
  },
  connectDatabase: jest.fn(),
  disconnectDatabase: jest.fn()
}));

// Mock PersonalityModel and InterestModel
jest.mock('../src/models/personality.model', () => ({
  PersonalityModel: jest.fn().mockImplementation(() => ({
    getByProfileId: jest.fn().mockResolvedValue([]),
    submitAssessment: jest.fn().mockResolvedValue([]),
    updateCommunicationStyle: jest.fn().mockResolvedValue(true),
    calculateCompatibility: jest.fn().mockResolvedValue(0.75)
  }))
}));

jest.mock('../src/models/interest.model', () => ({
  InterestModel: jest.fn().mockImplementation(() => ({
    getByProfileId: jest.fn().mockResolvedValue([]),
    submitBatch: jest.fn().mockResolvedValue([]),
    calculateCompatibility: jest.fn().mockResolvedValue(0.8)
  }))
}));

const mockPrisma = prisma.prisma;

// Helper functions to generate mock data
const generateMockProfile = (overrides = {}): IProfile => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  name: faker.person.fullName(),
  bio: faker.lorem.paragraph(),
  location: `${faker.location.city()}, ${faker.location.state()}`,
  coordinates: { 
    latitude: parseFloat(faker.location.latitude()), 
    longitude: parseFloat(faker.location.longitude()) 
  },
  birthdate: faker.date.past(),
  phoneNumber: faker.phone.number(),
  avatarUrl: faker.image.avatar(),
  communicationStyle: CommunicationStyle.DIRECT,
  maxTravelDistance: faker.number.int({ min: 5, max: 50 }),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides
});

const generateMockProfileCreate = (overrides = {}): IProfileCreate => ({
  userId: faker.string.uuid(),
  name: faker.person.fullName(),
  bio: faker.lorem.paragraph(),
  location: `${faker.location.city()}, ${faker.location.state()}`,
  coordinates: { 
    latitude: parseFloat(faker.location.latitude()), 
    longitude: parseFloat(faker.location.longitude()) 
  },
  birthdate: faker.date.past(),
  phoneNumber: faker.phone.number(),
  avatarUrl: faker.image.avatar(),
  communicationStyle: CommunicationStyle.DIRECT,
  maxTravelDistance: faker.number.int({ min: 5, max: 50 }),
  ...overrides
});

const generateMockProfileUpdate = (overrides = {}): IProfileUpdate => ({
  name: faker.person.fullName(),
  bio: faker.lorem.paragraph(),
  location: `${faker.location.city()}, ${faker.location.state()}`,
  ...overrides
});

const generateMockCoordinates = (overrides = {}): ICoordinates => ({
  latitude: parseFloat(faker.location.latitude()),
  longitude: parseFloat(faker.location.longitude()),
  ...overrides
});

// Mock request, response, and next function for controller tests
const mockRequest = (options = {}) => {
  const req: any = {};
  req.body = options.body || {};
  req.params = options.params || {};
  req.query = options.query || {};
  return req;
};

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

describe('ProfileModel', () => {
  let profileModel: ProfileModel;

  beforeEach(() => {
    jest.clearAllMocks();
    profileModel = new ProfileModel();
  });

  describe('create', () => {
    it('should create a new profile', async () => {
      const mockProfileData = generateMockProfileCreate();
      const mockCreatedProfile = generateMockProfile({
        ...mockProfileData,
        id: faker.string.uuid(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockPrisma.profile.create.mockResolvedValue(mockCreatedProfile);

      const result = await profileModel.create(mockProfileData);

      expect(mockPrisma.profile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockProfileData.userId,
          name: mockProfileData.name
        })
      });
      expect(result).toEqual(mockCreatedProfile);
    });

    it('should throw DatabaseError if creation fails', async () => {
      const mockProfileData = generateMockProfileCreate();
      const mockError = new Error('Database error');
      
      mockPrisma.profile.create.mockRejectedValue(mockError);

      await expect(profileModel.create(mockProfileData)).rejects.toThrow(DatabaseError);
    });
  });

  describe('getById', () => {
    it('should retrieve a profile by ID', async () => {
      const mockProfile = generateMockProfile();
      
      mockPrisma.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await profileModel.getById(mockProfile.id);

      expect(mockPrisma.profile.findUnique).toHaveBeenCalledWith({
        where: { id: mockProfile.id }
      });
      expect(result).toEqual(mockProfile);
    });

    it('should return null if profile not found', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);

      const result = await profileModel.getById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw DatabaseError if retrieval fails', async () => {
      const mockError = new Error('Database error');
      
      mockPrisma.profile.findUnique.mockRejectedValue(mockError);

      await expect(profileModel.getById('test-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('getByUserId', () => {
    it('should retrieve a profile by user ID', async () => {
      const mockProfile = generateMockProfile();
      
      mockPrisma.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await profileModel.getByUserId(mockProfile.userId);

      expect(mockPrisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockProfile.userId }
      });
      expect(result).toEqual(mockProfile);
    });

    it('should return null if profile not found', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);

      const result = await profileModel.getByUserId('non-existent-user-id');

      expect(result).toBeNull();
    });

    it('should throw DatabaseError if retrieval fails', async () => {
      const mockError = new Error('Database error');
      
      mockPrisma.profile.findUnique.mockRejectedValue(mockError);

      await expect(profileModel.getByUserId('test-user-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('update', () => {
    it('should update an existing profile', async () => {
      const mockProfile = generateMockProfile();
      const mockUpdateData = generateMockProfileUpdate();
      const mockUpdatedProfile = { ...mockProfile, ...mockUpdateData, updatedAt: new Date() };
      
      mockPrisma.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await profileModel.update(mockProfile.id, mockUpdateData);

      expect(mockPrisma.profile.update).toHaveBeenCalledWith({
        where: { id: mockProfile.id },
        data: expect.objectContaining({
          name: mockUpdateData.name,
          bio: mockUpdateData.bio
        })
      });
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should throw DatabaseError if update fails', async () => {
      const mockError = new Error('Database error');
      
      mockPrisma.profile.update.mockRejectedValue(mockError);

      await expect(profileModel.update('test-id', {})).rejects.toThrow(DatabaseError);
    });
  });

  describe('delete', () => {
    it('should delete a profile', async () => {
      const mockProfile = generateMockProfile();
      
      mockPrisma.profile.delete.mockResolvedValue(mockProfile);

      const result = await profileModel.delete(mockProfile.id);

      expect(mockPrisma.profile.delete).toHaveBeenCalledWith({
        where: { id: mockProfile.id }
      });
      expect(result).toEqual(mockProfile);
    });

    it('should throw DatabaseError if deletion fails', async () => {
      const mockError = new Error('Database error');
      
      mockPrisma.profile.delete.mockRejectedValue(mockError);

      await expect(profileModel.delete('test-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('search', () => {
    it('should search for profiles based on criteria', async () => {
      const mockProfiles = [generateMockProfile(), generateMockProfile()];
      const mockSearchParams: IProfileSearchParams = {
        query: 'test',
        page: 1,
        limit: 20
      };
      
      mockPrisma.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrisma.profile.count.mockResolvedValue(mockProfiles.length);

      const result = await profileModel.search(mockSearchParams);

      expect(mockPrisma.profile.findMany).toHaveBeenCalled();
      expect(mockPrisma.profile.count).toHaveBeenCalled();
      expect(result).toEqual({
        profiles: mockProfiles,
        total: mockProfiles.length,
        page: 1,
        limit: 20
      });
    });

    it('should throw DatabaseError if search fails', async () => {
      const mockError = new Error('Database error');
      
      mockPrisma.profile.count.mockRejectedValue(mockError);

      await expect(profileModel.search({})).rejects.toThrow(DatabaseError);
    });
  });

  describe('getComplete', () => {
    it('should retrieve a complete profile with related data', async () => {
      const mockProfile = generateMockProfile();
      const mockPersonalityTraits = [{ id: 'trait1', profileId: mockProfile.id, trait: 'openness', score: 80, assessedAt: new Date() }];
      const mockInterests = [{ id: 'interest1', profileId: mockProfile.id, category: 'ARTS_CULTURE', name: 'Painting', level: 3 }];
      
      mockPrisma.profile.findUnique.mockResolvedValue(mockProfile);
      
      // Mock PersonalityModel and InterestModel methods since we've already mocked the classes
      const personalityModelMock = require('../src/models/personality.model').PersonalityModel.mock.results[0].value;
      const interestModelMock = require('../src/models/interest.model').InterestModel.mock.results[0].value;
      
      personalityModelMock.getByProfileId.mockResolvedValue(mockPersonalityTraits);
      interestModelMock.getByProfileId.mockResolvedValue(mockInterests);

      const result = await profileModel.getComplete(mockProfile.id);

      expect(mockPrisma.profile.findUnique).toHaveBeenCalledWith({
        where: { id: mockProfile.id }
      });
      expect(personalityModelMock.getByProfileId).toHaveBeenCalledWith(mockProfile.id);
      expect(interestModelMock.getByProfileId).toHaveBeenCalledWith(mockProfile.id);
      expect(result).toEqual({
        ...mockProfile,
        personalityTraits: mockPersonalityTraits,
        interests: mockInterests
      });
    });

    it('should return null if profile not found', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);

      const result = await profileModel.getComplete('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw DatabaseError if retrieval fails', async () => {
      const mockError = new Error('Database error');
      
      mockPrisma.profile.findUnique.mockRejectedValue(mockError);

      await expect(profileModel.getComplete('test-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('updateLocation', () => {
    it('should update a profile\'s location', async () => {
      const mockProfile = generateMockProfile();
      const mockLocation = 'New York, NY';
      const mockCoordinates = generateMockCoordinates();
      const mockUpdatedProfile = { 
        ...mockProfile, 
        location: mockLocation, 
        coordinates: mockCoordinates,
        updatedAt: new Date()
      };
      
      mockPrisma.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await profileModel.updateLocation(mockProfile.id, mockLocation, mockCoordinates);

      expect(mockPrisma.profile.update).toHaveBeenCalledWith({
        where: { id: mockProfile.id },
        data: {
          location: mockLocation,
          coordinates: mockCoordinates
        }
      });
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should throw DatabaseError if update fails', async () => {
      const mockError = new Error('Database error');
      
      mockPrisma.profile.update.mockRejectedValue(mockError);

      await expect(profileModel.updateLocation('test-id', 'location', { latitude: 0, longitude: 0 })).rejects.toThrow(DatabaseError);
    });

    it('should validate location and coordinates', async () => {
      await expect(profileModel.updateLocation('test-id', '', { latitude: 0, longitude: 0 })).rejects.toThrow();
      await expect(profileModel.updateLocation('test-id', 'location', { latitude: 'invalid' as any, longitude: 0 })).rejects.toThrow();
    });
  });

  describe('updateMaxTravelDistance', () => {
    it('should update a profile\'s maximum travel distance', async () => {
      const mockProfile = generateMockProfile();
      const newMaxDistance = 25;
      const mockUpdatedProfile = { 
        ...mockProfile, 
        maxTravelDistance: newMaxDistance,
        updatedAt: new Date()
      };
      
      mockPrisma.profile.update.mockResolvedValue(mockUpdatedProfile);

      const result = await profileModel.updateMaxTravelDistance(mockProfile.id, newMaxDistance);

      expect(mockPrisma.profile.update).toHaveBeenCalledWith({
        where: { id: mockProfile.id },
        data: { maxTravelDistance: newMaxDistance }
      });
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should throw DatabaseError if update fails', async () => {
      const mockError = new Error('Database error');
      
      mockPrisma.profile.update.mockRejectedValue(mockError);

      await expect(profileModel.updateMaxTravelDistance('test-id', 20)).rejects.toThrow(DatabaseError);
    });

    it('should validate the travel distance value', async () => {
      await expect(profileModel.updateMaxTravelDistance('test-id', -5)).rejects.toThrow();
      await expect(profileModel.updateMaxTravelDistance('test-id', 'invalid' as any)).rejects.toThrow();
    });
  });

  describe('findNearby', () => {
    it('should find profiles near a location', async () => {
      const mockProfiles = [generateMockProfile(), generateMockProfile()];
      const mockCoordinates = generateMockCoordinates();
      const maxDistance = 15;
      
      mockPrisma.$queryRaw.mockResolvedValue(mockProfiles);

      const result = await profileModel.findNearby(mockCoordinates, maxDistance);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(mockProfiles);
    });

    it('should throw DatabaseError if search fails', async () => {
      const mockError = new Error('Database error');
      
      mockPrisma.$queryRaw.mockRejectedValue(mockError);

      await expect(profileModel.findNearby({ latitude: 0, longitude: 0 }, 15)).rejects.toThrow(DatabaseError);
    });

    it('should validate coordinates and distance', async () => {
      await expect(profileModel.findNearby({ latitude: 'invalid' as any, longitude: 0 }, 15)).rejects.toThrow();
      await expect(profileModel.findNearby({ latitude: 0, longitude: 0 }, -5)).rejects.toThrow();
    });
  });
});

describe('ProfileService', () => {
  let profileService: ProfileService;
  let profileModelMock: jest.Mocked<ProfileModel>;
  let personalityModelMock: any;
  let interestModelMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh mocks for each test
    profileModelMock = {
      create: jest.fn(),
      getById: jest.fn(),
      getByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      getComplete: jest.fn(),
      updateLocation: jest.fn(),
      updateMaxTravelDistance: jest.fn(),
      findNearby: jest.fn()
    } as unknown as jest.Mocked<ProfileModel>;
    
    personalityModelMock = {
      updateCommunicationStyle: jest.fn(),
      submitAssessment: jest.fn(),
      calculateCompatibility: jest.fn()
    };
    
    interestModelMock = {
      submitBatch: jest.fn(),
      calculateCompatibility: jest.fn()
    };
    
    // Mock the constructor to return our mocks
    jest.spyOn(ProfileModel.prototype, 'create').mockImplementation(profileModelMock.create);
    jest.spyOn(ProfileModel.prototype, 'getById').mockImplementation(profileModelMock.getById);
    jest.spyOn(ProfileModel.prototype, 'getByUserId').mockImplementation(profileModelMock.getByUserId);
    jest.spyOn(ProfileModel.prototype, 'update').mockImplementation(profileModelMock.update);
    jest.spyOn(ProfileModel.prototype, 'delete').mockImplementation(profileModelMock.delete);
    jest.spyOn(ProfileModel.prototype, 'search').mockImplementation(profileModelMock.search);
    jest.spyOn(ProfileModel.prototype, 'getComplete').mockImplementation(profileModelMock.getComplete);
    jest.spyOn(ProfileModel.prototype, 'updateLocation').mockImplementation(profileModelMock.updateLocation);
    jest.spyOn(ProfileModel.prototype, 'updateMaxTravelDistance').mockImplementation(profileModelMock.updateMaxTravelDistance);
    jest.spyOn(ProfileModel.prototype, 'findNearby').mockImplementation(profileModelMock.findNearby);

    profileService = new ProfileService();
    
    // Access private properties to inject our mocks
    (profileService as any).personalityModel = personalityModelMock;
    (profileService as any).interestModel = interestModelMock;
  });

  describe('create', () => {
    it('should create a new profile', async () => {
      const mockProfileData = generateMockProfileCreate();
      const mockCreatedProfile = generateMockProfile({
        ...mockProfileData,
        id: faker.string.uuid(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      profileModelMock.create.mockResolvedValue(mockCreatedProfile);

      const result = await profileService.create(mockProfileData);

      expect(profileModelMock.create).toHaveBeenCalledWith(mockProfileData);
      expect(result).toEqual(mockCreatedProfile);
    });

    it('should throw ValidationError if data is invalid', async () => {
      const invalidData = { name: 'Test' } as IProfileCreate;
      
      await expect(profileService.create(invalidData)).rejects.toThrow(ValidationError);
      expect(profileModelMock.create).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should retrieve a profile by ID', async () => {
      const mockProfile = generateMockProfile();
      
      profileModelMock.getById.mockResolvedValue(mockProfile);

      const result = await profileService.getById(mockProfile.id);

      expect(profileModelMock.getById).toHaveBeenCalledWith(mockProfile.id);
      expect(result).toEqual(mockProfile);
    });

    it('should throw DatabaseError if profile not found', async () => {
      profileModelMock.getById.mockResolvedValue(null);

      await expect(profileService.getById('non-existent-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('getByUserId', () => {
    it('should retrieve a profile by user ID', async () => {
      const mockProfile = generateMockProfile();
      
      profileModelMock.getByUserId.mockResolvedValue(mockProfile);

      const result = await profileService.getByUserId(mockProfile.userId);

      expect(profileModelMock.getByUserId).toHaveBeenCalledWith(mockProfile.userId);
      expect(result).toEqual(mockProfile);
    });

    it('should throw DatabaseError if profile not found', async () => {
      profileModelMock.getByUserId.mockResolvedValue(null);

      await expect(profileService.getByUserId('non-existent-user-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('update', () => {
    it('should update an existing profile', async () => {
      const mockProfile = generateMockProfile();
      const mockUpdateData = generateMockProfileUpdate();
      const mockUpdatedProfile = { ...mockProfile, ...mockUpdateData, updatedAt: new Date() };
      
      profileModelMock.update.mockResolvedValue(mockUpdatedProfile);

      const result = await profileService.update(mockProfile.id, mockUpdateData);

      expect(profileModelMock.update).toHaveBeenCalledWith(mockProfile.id, mockUpdateData);
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should throw ValidationError if update data is invalid', async () => {
      const invalidData = { name: '' } as IProfileUpdate;
      
      await expect(profileService.update('test-id', invalidData)).rejects.toThrow(ValidationError);
      expect(profileModelMock.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a profile', async () => {
      const mockProfile = generateMockProfile();
      
      profileModelMock.delete.mockResolvedValue(mockProfile);

      const result = await profileService.delete(mockProfile.id);

      expect(profileModelMock.delete).toHaveBeenCalledWith(mockProfile.id);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('search', () => {
    it('should search for profiles based on criteria', async () => {
      const mockProfiles = [generateMockProfile(), generateMockProfile()];
      const mockSearchParams: IProfileSearchParams = {
        query: 'test',
        page: 1,
        limit: 20
      };
      const mockSearchResults = {
        profiles: mockProfiles,
        total: mockProfiles.length,
        page: 1,
        limit: 20
      };
      
      profileModelMock.search.mockResolvedValue(mockSearchResults);

      const result = await profileService.search(mockSearchParams);

      expect(profileModelMock.search).toHaveBeenCalledWith(mockSearchParams);
      expect(result).toEqual(mockSearchResults);
    });
  });

  describe('getComplete', () => {
    it('should retrieve a complete profile with related data', async () => {
      const mockProfile = generateMockProfile();
      const mockCompleteProfile = {
        ...mockProfile,
        personalityTraits: [],
        interests: []
      };
      
      profileModelMock.getComplete.mockResolvedValue(mockCompleteProfile);

      const result = await profileService.getComplete(mockProfile.id);

      expect(profileModelMock.getComplete).toHaveBeenCalledWith(mockProfile.id);
      expect(result).toEqual(mockCompleteProfile);
    });

    it('should throw DatabaseError if profile not found', async () => {
      profileModelMock.getComplete.mockResolvedValue(null);

      await expect(profileService.getComplete('non-existent-id')).rejects.toThrow(DatabaseError);
    });
  });

  describe('updateLocation', () => {
    it('should update a profile\'s location', async () => {
      const mockProfile = generateMockProfile();
      const mockLocation = 'New York, NY';
      const mockCoordinates = generateMockCoordinates();
      const mockUpdatedProfile = { 
        ...mockProfile, 
        location: mockLocation, 
        coordinates: mockCoordinates,
        updatedAt: new Date()
      };
      
      profileModelMock.updateLocation.mockResolvedValue(mockUpdatedProfile);

      const result = await profileService.updateLocation(mockProfile.id, mockLocation, mockCoordinates);

      expect(profileModelMock.updateLocation).toHaveBeenCalledWith(mockProfile.id, mockLocation, mockCoordinates);
      expect(result).toEqual(mockUpdatedProfile);
    });
  });

  describe('updateMaxTravelDistance', () => {
    it('should update a profile\'s maximum travel distance', async () => {
      const mockProfile = generateMockProfile();
      const newMaxDistance = 25;
      const mockUpdatedProfile = { 
        ...mockProfile, 
        maxTravelDistance: newMaxDistance,
        updatedAt: new Date()
      };
      
      profileModelMock.updateMaxTravelDistance.mockResolvedValue(mockUpdatedProfile);

      const result = await profileService.updateMaxTravelDistance(mockProfile.id, newMaxDistance);

      expect(profileModelMock.updateMaxTravelDistance).toHaveBeenCalledWith(mockProfile.id, newMaxDistance);
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should throw ValidationError if travel distance is invalid', async () => {
      await expect(profileService.updateMaxTravelDistance('test-id', -5)).rejects.toThrow(ValidationError);
      expect(profileModelMock.updateMaxTravelDistance).not.toHaveBeenCalled();
    });
  });

  describe('updateCommunicationStyle', () => {
    it('should update a profile\'s communication style', async () => {
      const mockProfile = generateMockProfile();
      const newStyle = CommunicationStyle.THOUGHTFUL;
      const mockUpdatedProfile = { 
        ...mockProfile, 
        communicationStyle: newStyle,
        updatedAt: new Date()
      };
      
      personalityModelMock.updateCommunicationStyle.mockResolvedValue(true);
      profileModelMock.getById.mockResolvedValue(mockUpdatedProfile);

      const result = await profileService.updateCommunicationStyle(mockProfile.id, newStyle);

      expect(personalityModelMock.updateCommunicationStyle).toHaveBeenCalledWith(mockProfile.id, newStyle);
      expect(profileModelMock.getById).toHaveBeenCalledWith(mockProfile.id);
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should throw ValidationError if communication style is invalid', async () => {
      await expect(profileService.updateCommunicationStyle('test-id', 'INVALID_STYLE' as any)).rejects.toThrow(ValidationError);
      expect(personalityModelMock.updateCommunicationStyle).not.toHaveBeenCalled();
    });
  });

  describe('submitPersonalityAssessment', () => {
    it('should submit a personality assessment', async () => {
      const mockProfile = generateMockProfile();
      const mockAssessment = {
        profileId: mockProfile.id,
        traits: [{ trait: 'openness', score: 80 }],
        communicationStyle: CommunicationStyle.DIRECT,
        assessmentSource: 'questionnaire'
      };
      
      personalityModelMock.submitAssessment.mockResolvedValue([]);
      profileModelMock.getById.mockResolvedValue(mockProfile);

      const result = await profileService.submitPersonalityAssessment(mockAssessment);

      expect(personalityModelMock.submitAssessment).toHaveBeenCalledWith(mockAssessment);
      expect(profileModelMock.getById).toHaveBeenCalledWith(mockProfile.id);
      expect(result).toEqual(mockProfile);
    });

    it('should throw ValidationError if assessment data is invalid', async () => {
      const invalidAssessment = {
        profileId: 'profile-id',
        traits: []
      } as any;
      
      await expect(profileService.submitPersonalityAssessment(invalidAssessment)).rejects.toThrow(ValidationError);
      expect(personalityModelMock.submitAssessment).not.toHaveBeenCalled();
    });
  });

  describe('submitInterests', () => {
    it('should submit interests for a profile', async () => {
      const mockProfile = generateMockProfile();
      const mockSubmission = {
        profileId: mockProfile.id,
        interests: [{ category: 'ARTS_CULTURE', name: 'Painting', level: 3 }],
        replaceExisting: true
      };
      
      interestModelMock.submitBatch.mockResolvedValue([]);
      profileModelMock.getById.mockResolvedValue(mockProfile);

      const result = await profileService.submitInterests(mockSubmission);

      expect(interestModelMock.submitBatch).toHaveBeenCalledWith(mockSubmission);
      expect(profileModelMock.getById).toHaveBeenCalledWith(mockProfile.id);
      expect(result).toEqual(mockProfile);
    });

    it('should throw ValidationError if submission data is invalid', async () => {
      const invalidSubmission = {
        profileId: 'profile-id',
        interests: []
      } as any;
      
      await expect(profileService.submitInterests(invalidSubmission)).rejects.toThrow(ValidationError);
      expect(interestModelMock.submitBatch).not.toHaveBeenCalled();
    });
  });

  describe('getNearLocation', () => {
    it('should find profiles near a location', async () => {
      const mockProfiles = [generateMockProfile(), generateMockProfile()];
      const mockCoordinates = generateMockCoordinates();
      const maxDistance = 15;
      
      profileModelMock.findNearby.mockResolvedValue(mockProfiles);

      const result = await profileService.getNearLocation(mockCoordinates, maxDistance);

      expect(profileModelMock.findNearby).toHaveBeenCalledWith(mockCoordinates, maxDistance, 20);
      expect(result).toEqual(mockProfiles);
    });
  });

  describe('calculateCompatibility', () => {
    it('should calculate compatibility between profiles', async () => {
      const mockProfile1 = generateMockProfile();
      const mockProfile2 = generateMockProfile();
      
      profileModelMock.getById.mockImplementation(async (id) => {
        if (id === mockProfile1.id) return mockProfile1;
        if (id === mockProfile2.id) return mockProfile2;
        return null;
      });
      
      personalityModelMock.calculateCompatibility.mockResolvedValue(0.75);
      interestModelMock.calculateCompatibility.mockResolvedValue(0.8);

      const result = await profileService.calculateCompatibility(mockProfile1.id, mockProfile2.id);

      expect(profileModelMock.getById).toHaveBeenCalledWith(mockProfile1.id);
      expect(profileModelMock.getById).toHaveBeenCalledWith(mockProfile2.id);
      expect(personalityModelMock.calculateCompatibility).toHaveBeenCalledWith(mockProfile1.id, mockProfile2.id);
      expect(interestModelMock.calculateCompatibility).toHaveBeenCalledWith(mockProfile1.id, mockProfile2.id);
      
      expect(result).toEqual({
        overall: expect.any(Number),
        personality: 0.75,
        interests: 0.8,
        communication: expect.any(Number)
      });
    });

    it('should throw DatabaseError if a profile is not found', async () => {
      profileModelMock.getById.mockResolvedValue(null);

      await expect(profileService.calculateCompatibility('id1', 'id2')).rejects.toThrow(DatabaseError);
    });
  });
});

describe('ProfileController', () => {
  let profileController: ProfileController;
  let profileServiceMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh mock for ProfileService
    profileServiceMock = {
      create: jest.fn(),
      getById: jest.fn(),
      getByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      getComplete: jest.fn(),
      updateLocation: jest.fn(),
      updateMaxTravelDistance: jest.fn(),
      updateCommunicationStyle: jest.fn(),
      submitPersonalityAssessment: jest.fn(),
      submitInterests: jest.fn(),
      getNearLocation: jest.fn(),
      calculateCompatibility: jest.fn()
    };
    
    // Create controller and inject mock service
    profileController = new ProfileController();
    (profileController as any).profileService = profileServiceMock;
  });

  describe('createProfile', () => {
    it('should handle requests to create a new profile', async () => {
      const mockProfileData = generateMockProfileCreate();
      const mockCreatedProfile = generateMockProfile({
        ...mockProfileData,
        id: faker.string.uuid(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      profileServiceMock.create.mockResolvedValue(mockCreatedProfile);
      
      const req = mockRequest({ body: mockProfileData });
      const res = mockResponse();
      const next = mockNext();

      await profileController.createProfile(req, res, next);

      expect(profileServiceMock.create).toHaveBeenCalledWith(mockProfileData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile created successfully',
        data: mockCreatedProfile
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass errors to the next middleware', async () => {
      const mockError = new Error('Service error');
      profileServiceMock.create.mockRejectedValue(mockError);
      
      const req = mockRequest({ body: {} });
      const res = mockResponse();
      const next = mockNext();

      await profileController.createProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getProfileById', () => {
    it('should handle requests to get a profile by ID', async () => {
      const mockProfile = generateMockProfile();
      
      profileServiceMock.getById.mockResolvedValue(mockProfile);
      
      const req = mockRequest({ params: { id: mockProfile.id } });
      const res = mockResponse();
      const next = mockNext();

      await profileController.getProfileById(req, res, next);

      expect(profileServiceMock.getById).toHaveBeenCalledWith(mockProfile.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfile
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass errors to the next middleware', async () => {
      const mockError = new Error('Service error');
      profileServiceMock.getById.mockRejectedValue(mockError);
      
      const req = mockRequest({ params: { id: 'test-id' } });
      const res = mockResponse();
      const next = mockNext();

      await profileController.getProfileById(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getProfileByUserId', () => {
    it('should handle requests to get a profile by user ID', async () => {
      const mockProfile = generateMockProfile();
      
      profileServiceMock.getByUserId.mockResolvedValue(mockProfile);
      
      const req = mockRequest({ params: { userId: mockProfile.userId } });
      const res = mockResponse();
      const next = mockNext();

      await profileController.getProfileByUserId(req, res, next);

      expect(profileServiceMock.getByUserId).toHaveBeenCalledWith(mockProfile.userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfile
      });
    });
  });

  describe('getCompleteProfile', () => {
    it('should handle requests to get a complete profile', async () => {
      const mockProfile = generateMockProfile();
      const mockCompleteProfile = {
        ...mockProfile,
        personalityTraits: [],
        interests: []
      };
      
      profileServiceMock.getComplete.mockResolvedValue(mockCompleteProfile);
      
      const req = mockRequest({ params: { id: mockProfile.id } });
      const res = mockResponse();
      const next = mockNext();

      await profileController.getCompleteProfile(req, res, next);

      expect(profileServiceMock.getComplete).toHaveBeenCalledWith(mockProfile.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCompleteProfile
      });
    });
  });

  describe('updateProfile', () => {
    it('should handle requests to update a profile', async () => {
      const mockProfile = generateMockProfile();
      const mockUpdateData = generateMockProfileUpdate();
      const mockUpdatedProfile = { ...mockProfile, ...mockUpdateData, updatedAt: new Date() };
      
      profileServiceMock.update.mockResolvedValue(mockUpdatedProfile);
      
      const req = mockRequest({ 
        params: { id: mockProfile.id },
        body: mockUpdateData
      });
      const res = mockResponse();
      const next = mockNext();

      await profileController.updateProfile(req, res, next);

      expect(profileServiceMock.update).toHaveBeenCalledWith(mockProfile.id, mockUpdateData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: mockUpdatedProfile
      });
    });
  });

  describe('deleteProfile', () => {
    it('should handle requests to delete a profile', async () => {
      const mockProfile = generateMockProfile();
      
      profileServiceMock.delete.mockResolvedValue(mockProfile);
      
      const req = mockRequest({ params: { id: mockProfile.id } });
      const res = mockResponse();
      const next = mockNext();

      await profileController.deleteProfile(req, res, next);

      expect(profileServiceMock.delete).toHaveBeenCalledWith(mockProfile.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile deleted successfully',
        data: mockProfile
      });
    });
  });

  describe('searchProfiles', () => {
    it('should handle requests to search for profiles', async () => {
      const mockProfiles = [generateMockProfile(), generateMockProfile()];
      const mockSearchParams = {
        query: 'test',
        page: 1,
        limit: 20
      };
      const mockSearchResults = {
        profiles: mockProfiles,
        total: mockProfiles.length,
        page: 1,
        limit: 20
      };
      
      profileServiceMock.search.mockResolvedValue(mockSearchResults);
      
      const req = mockRequest({ query: mockSearchParams });
      const res = mockResponse();
      const next = mockNext();

      await profileController.searchProfiles(req, res, next);

      expect(profileServiceMock.search).toHaveBeenCalledWith(mockSearchParams);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfiles,
        meta: {
          total: mockProfiles.length,
          page: 1,
          limit: 20,
          pages: 1
        }
      });
    });
  });

  describe('updateLocation', () => {
    it('should handle requests to update a profile\'s location', async () => {
      const mockProfile = generateMockProfile();
      const mockLocation = 'New York, NY';
      const mockCoordinates = generateMockCoordinates();
      const mockUpdatedProfile = { 
        ...mockProfile, 
        location: mockLocation, 
        coordinates: mockCoordinates,
        updatedAt: new Date()
      };
      
      profileServiceMock.updateLocation.mockResolvedValue(mockUpdatedProfile);
      
      const req = mockRequest({ 
        params: { id: mockProfile.id },
        body: { location: mockLocation, coordinates: mockCoordinates }
      });
      const res = mockResponse();
      const next = mockNext();

      await profileController.updateLocation(req, res, next);

      expect(profileServiceMock.updateLocation).toHaveBeenCalledWith(mockProfile.id, mockLocation, mockCoordinates);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Location updated successfully',
        data: mockUpdatedProfile
      });
    });
  });

  describe('updateMaxTravelDistance', () => {
    it('should handle requests to update a profile\'s maximum travel distance', async () => {
      const mockProfile = generateMockProfile();
      const newMaxDistance = 25;
      const mockUpdatedProfile = { 
        ...mockProfile, 
        maxTravelDistance: newMaxDistance,
        updatedAt: new Date()
      };
      
      profileServiceMock.updateMaxTravelDistance.mockResolvedValue(mockUpdatedProfile);
      
      const req = mockRequest({ 
        params: { id: mockProfile.id },
        body: { maxTravelDistance: newMaxDistance }
      });
      const res = mockResponse();
      const next = mockNext();

      await profileController.updateMaxTravelDistance(req, res, next);

      expect(profileServiceMock.updateMaxTravelDistance).toHaveBeenCalledWith(mockProfile.id, newMaxDistance);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Maximum travel distance updated successfully',
        data: mockUpdatedProfile
      });
    });
  });

  describe('updateCommunicationStyle', () => {
    it('should handle requests to update a profile\'s communication style', async () => {
      const mockProfile = generateMockProfile();
      const newStyle = CommunicationStyle.THOUGHTFUL;
      const mockUpdatedProfile = { 
        ...mockProfile, 
        communicationStyle: newStyle,
        updatedAt: new Date()
      };
      
      profileServiceMock.updateCommunicationStyle.mockResolvedValue(mockUpdatedProfile);
      
      const req = mockRequest({ 
        params: { id: mockProfile.id },
        body: { communicationStyle: newStyle }
      });
      const res = mockResponse();
      const next = mockNext();

      await profileController.updateCommunicationStyle(req, res, next);

      expect(profileServiceMock.updateCommunicationStyle).toHaveBeenCalledWith(mockProfile.id, newStyle);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Communication style updated successfully',
        data: mockUpdatedProfile
      });
    });
  });

  describe('submitPersonalityAssessment', () => {
    it('should handle requests to submit a personality assessment', async () => {
      const mockProfile = generateMockProfile();
      const mockAssessment = {
        profileId: mockProfile.id,
        traits: [{ trait: 'openness', score: 80 }],
        communicationStyle: CommunicationStyle.DIRECT,
        assessmentSource: 'questionnaire'
      };
      
      profileServiceMock.submitPersonalityAssessment.mockResolvedValue(mockProfile);
      
      const req = mockRequest({ body: mockAssessment });
      const res = mockResponse();
      const next = mockNext();

      await profileController.submitPersonalityAssessment(req, res, next);

      expect(profileServiceMock.submitPersonalityAssessment).toHaveBeenCalledWith(mockAssessment);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Personality assessment submitted successfully',
        data: mockProfile
      });
    });
  });

  describe('submitInterests', () => {
    it('should handle requests to submit interests', async () => {
      const mockProfile = generateMockProfile();
      const mockSubmission = {
        profileId: mockProfile.id,
        interests: [{ category: 'ARTS_CULTURE', name: 'Painting', level: 3 }],
        replaceExisting: true
      };
      
      profileServiceMock.submitInterests.mockResolvedValue(mockProfile);
      
      const req = mockRequest({ body: mockSubmission });
      const res = mockResponse();
      const next = mockNext();

      await profileController.submitInterests(req, res, next);

      expect(profileServiceMock.submitInterests).toHaveBeenCalledWith(mockSubmission);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Interests submitted successfully',
        data: mockProfile
      });
    });
  });

  describe('getNearbyProfiles', () => {
    it('should handle requests to find nearby profiles', async () => {
      const mockProfiles = [generateMockProfile(), generateMockProfile()];
      const mockCoordinates: ICoordinates = {
        latitude: 40.7128,
        longitude: -74.0060
      };
      const maxDistance = 15;
      
      profileServiceMock.getNearLocation.mockResolvedValue(mockProfiles);
      
      const req = mockRequest({ 
        query: {
          latitude: mockCoordinates.latitude.toString(),
          longitude: mockCoordinates.longitude.toString(),
          maxDistance: maxDistance.toString()
        }
      });
      const res = mockResponse();
      const next = mockNext();

      await profileController.getNearbyProfiles(req, res, next);

      expect(profileServiceMock.getNearLocation).toHaveBeenCalledWith(
        mockCoordinates,
        maxDistance,
        undefined,
        undefined
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfiles,
        meta: {
          count: mockProfiles.length,
          coordinates: mockCoordinates,
          maxDistance: maxDistance,
          limit: 20
        }
      });
    });
  });

  describe('calculateCompatibility', () => {
    it('should handle requests to calculate profile compatibility', async () => {
      const profile1Id = faker.string.uuid();
      const profile2Id = faker.string.uuid();
      const compatibilityScores = {
        overall: 0.75,
        personality: 0.8,
        interests: 0.7,
        communication: 0.6
      };
      
      profileServiceMock.calculateCompatibility.mockResolvedValue(compatibilityScores);
      
      const req = mockRequest({ 
        query: {
          profileId1: profile1Id,
          profileId2: profile2Id
        }
      });
      const res = mockResponse();
      const next = mockNext();

      await profileController.calculateCompatibility(req, res, next);

      expect(profileServiceMock.calculateCompatibility).toHaveBeenCalledWith(profile1Id, profile2Id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: compatibilityScores
      });
    });
  });
});

describe('Integration Tests', () => {
  // Setup for integration tests with an Express app and supertest
  let app: express.Application;
  let profileController: ProfileController;
  let profileServiceMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock for ProfileService
    profileServiceMock = {
      create: jest.fn(),
      getById: jest.fn(),
      getByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      getComplete: jest.fn(),
      updateLocation: jest.fn(),
      updateMaxTravelDistance: jest.fn(),
      updateCommunicationStyle: jest.fn(),
      submitPersonalityAssessment: jest.fn(),
      submitInterests: jest.fn(),
      getNearLocation: jest.fn(),
      calculateCompatibility: jest.fn()
    };
    
    // Create controller and inject mock service
    profileController = new ProfileController();
    (profileController as any).profileService = profileServiceMock;
    
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Add routes
    app.post('/profiles', profileController.createProfile.bind(profileController));
    app.get('/profiles/:id', profileController.getProfileById.bind(profileController));
    app.get('/profiles/user/:userId', profileController.getProfileByUserId.bind(profileController));
    app.get('/profiles/:id/complete', profileController.getCompleteProfile.bind(profileController));
    app.put('/profiles/:id', profileController.updateProfile.bind(profileController));
    app.delete('/profiles/:id', profileController.deleteProfile.bind(profileController));
    app.get('/profiles/search', profileController.searchProfiles.bind(profileController));
    app.put('/profiles/:id/location', profileController.updateLocation.bind(profileController));
    app.put('/profiles/:id/travel-distance', profileController.updateMaxTravelDistance.bind(profileController));
    app.put('/profiles/:id/communication-style', profileController.updateCommunicationStyle.bind(profileController));
    app.post('/profiles/personality-assessment', profileController.submitPersonalityAssessment.bind(profileController));
    app.post('/profiles/interests', profileController.submitInterests.bind(profileController));
    app.get('/profiles/nearby', profileController.getNearbyProfiles.bind(profileController));
    app.get('/profiles/compatibility', profileController.calculateCompatibility.bind(profileController));
    
    // Add error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
        error: err
      });
    });
  });

  describe('POST /profiles', () => {
    it('should create a new profile', async () => {
      const mockProfileData = generateMockProfileCreate();
      const mockCreatedProfile = generateMockProfile({
        ...mockProfileData,
        id: faker.string.uuid(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      profileServiceMock.create.mockResolvedValue(mockCreatedProfile);
      
      const response = await supertest(app)
        .post('/profiles')
        .send(mockProfileData)
        .expect(201);
      
      expect(profileServiceMock.create).toHaveBeenCalledWith(expect.objectContaining(mockProfileData));
      expect(response.body).toEqual({
        success: true,
        message: 'Profile created successfully',
        data: expect.objectContaining({
          id: mockCreatedProfile.id,
          name: mockProfileData.name
        })
      });
    });
  });

  describe('GET /profiles/:id', () => {
    it('should get a profile by ID', async () => {
      const mockProfile = generateMockProfile();
      
      profileServiceMock.getById.mockResolvedValue(mockProfile);
      
      const response = await supertest(app)
        .get(`/profiles/${mockProfile.id}`)
        .expect(200);
      
      expect(profileServiceMock.getById).toHaveBeenCalledWith(mockProfile.id);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: mockProfile.id,
          name: mockProfile.name
        })
      });
    });
  });

  describe('GET /profiles/user/:userId', () => {
    it('should get a profile by user ID', async () => {
      const mockProfile = generateMockProfile();
      
      profileServiceMock.getByUserId.mockResolvedValue(mockProfile);
      
      const response = await supertest(app)
        .get(`/profiles/user/${mockProfile.userId}`)
        .expect(200);
      
      expect(profileServiceMock.getByUserId).toHaveBeenCalledWith(mockProfile.userId);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: mockProfile.id,
          userId: mockProfile.userId
        })
      });
    });
  });

  describe('GET /profiles/:id/complete', () => {
    it('should get a complete profile', async () => {
      const mockProfile = generateMockProfile();
      const mockCompleteProfile = {
        ...mockProfile,
        personalityTraits: [],
        interests: []
      };
      
      profileServiceMock.getComplete.mockResolvedValue(mockCompleteProfile);
      
      const response = await supertest(app)
        .get(`/profiles/${mockProfile.id}/complete`)
        .expect(200);
      
      expect(profileServiceMock.getComplete).toHaveBeenCalledWith(mockProfile.id);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: mockProfile.id,
          personalityTraits: [],
          interests: []
        })
      });
    });
  });

  describe('PUT /profiles/:id', () => {
    it('should update a profile', async () => {
      const mockProfile = generateMockProfile();
      const mockUpdateData = generateMockProfileUpdate();
      const mockUpdatedProfile = { ...mockProfile, ...mockUpdateData, updatedAt: new Date() };
      
      profileServiceMock.update.mockResolvedValue(mockUpdatedProfile);
      
      const response = await supertest(app)
        .put(`/profiles/${mockProfile.id}`)
        .send(mockUpdateData)
        .expect(200);
      
      expect(profileServiceMock.update).toHaveBeenCalledWith(mockProfile.id, expect.objectContaining(mockUpdateData));
      expect(response.body).toEqual({
        success: true,
        message: 'Profile updated successfully',
        data: expect.objectContaining({
          id: mockProfile.id,
          name: mockUpdateData.name
        })
      });
    });
  });
});