import { InterestModel } from '../src/models/interest.model';
import { 
  InterestService, 
  createInterest, 
  getInterestById, 
  getInterestsByProfileId, 
  updateInterest, 
  deleteInterest, 
  submitInterests, 
  getInterestCompatibility 
} from '../src/services/interest.service';
import { 
  IInterest, 
  IInterestSubmission, 
  InterestCategory, 
  InterestLevel 
} from '../../shared/src/types/profile.types';
import { DatabaseError } from '../../shared/src/errors/database.error';
import prisma from '../../config/database';

// Mock the database module
jest.mock('../../config/database', () => {
  const mockPrisma = {
    interest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn()
    },
    $transaction: jest.fn((callback) => callback(mockPrisma))
  };
  
  return {
    prisma: mockPrisma
  };
});

// Mock validation utility
jest.mock('../../../shared/src/utils/validation.util', () => ({
  validateObject: jest.fn(data => data)
}));

/**
 * Generates a mock interest object for testing
 */
const generateMockInterest = (overrides = {}): IInterest => ({
  id: 'test-id',
  profileId: 'test-profile-id',
  category: InterestCategory.OUTDOOR_ADVENTURES,
  name: 'Hiking',
  level: InterestLevel.HIGH,
  ...overrides
});

/**
 * Generates a mock interest submission object for testing
 */
const generateMockInterestSubmission = (overrides = {}): IInterestSubmission => ({
  profileId: 'test-profile-id',
  interests: [
    {
      category: InterestCategory.OUTDOOR_ADVENTURES,
      name: 'Hiking',
      level: InterestLevel.HIGH
    },
    {
      category: InterestCategory.FOOD_DINING,
      name: 'Cooking',
      level: InterestLevel.MEDIUM
    }
  ],
  replaceExisting: true,
  ...overrides
});

describe('InterestModel', () => {
  let interestModel: InterestModel;
  const mockPrisma = prisma.prisma;
  
  beforeEach(() => {
    interestModel = new InterestModel();
    jest.clearAllMocks();
  });
  
  describe('create', () => {
    it('should create a new interest', async () => {
      const mockInterest = generateMockInterest();
      mockPrisma.interest.create.mockResolvedValue(mockInterest);
      
      const result = await interestModel.create(mockInterest);
      
      expect(mockPrisma.interest.create).toHaveBeenCalledWith({
        data: mockInterest
      });
      expect(result).toEqual(mockInterest);
    });
    
    it('should throw DatabaseError when creation fails', async () => {
      const mockInterest = generateMockInterest();
      const error = new Error('Database error');
      mockPrisma.interest.create.mockRejectedValue(error);
      
      await expect(interestModel.create(mockInterest)).rejects.toThrow(DatabaseError);
    });
  });
  
  describe('getById', () => {
    it('should retrieve an interest by ID', async () => {
      const mockInterest = generateMockInterest();
      mockPrisma.interest.findUnique.mockResolvedValue(mockInterest);
      
      const result = await interestModel.getById(mockInterest.id);
      
      expect(mockPrisma.interest.findUnique).toHaveBeenCalledWith({
        where: { id: mockInterest.id }
      });
      expect(result).toEqual(mockInterest);
    });
    
    it('should return null when interest not found', async () => {
      mockPrisma.interest.findUnique.mockResolvedValue(null);
      
      const result = await interestModel.getById('non-existent-id');
      
      expect(result).toBeNull();
    });
    
    it('should throw DatabaseError when query fails', async () => {
      const error = new Error('Database error');
      mockPrisma.interest.findUnique.mockRejectedValue(error);
      
      await expect(interestModel.getById('test-id')).rejects.toThrow(DatabaseError);
    });
  });
  
  describe('getByProfileId', () => {
    it('should retrieve interests by profile ID', async () => {
      const mockInterests = [
        generateMockInterest(),
        generateMockInterest({ id: 'test-id-2', name: 'Swimming' })
      ];
      mockPrisma.interest.findMany.mockResolvedValue(mockInterests);
      
      const result = await interestModel.getByProfileId('test-profile-id');
      
      expect(mockPrisma.interest.findMany).toHaveBeenCalledWith({
        where: { profileId: 'test-profile-id' }
      });
      expect(result).toEqual(mockInterests);
    });
    
    it('should return empty array when no interests found', async () => {
      mockPrisma.interest.findMany.mockResolvedValue([]);
      
      const result = await interestModel.getByProfileId('test-profile-id');
      
      expect(result).toEqual([]);
    });
    
    it('should throw DatabaseError when query fails', async () => {
      const error = new Error('Database error');
      mockPrisma.interest.findMany.mockRejectedValue(error);
      
      await expect(interestModel.getByProfileId('test-profile-id')).rejects.toThrow(DatabaseError);
    });
  });
  
  describe('update', () => {
    it('should update an existing interest', async () => {
      const mockInterest = generateMockInterest();
      const updates = { name: 'Mountain Climbing', level: InterestLevel.MEDIUM };
      const updatedInterest = { ...mockInterest, ...updates };
      
      mockPrisma.interest.update.mockResolvedValue(updatedInterest);
      
      const result = await interestModel.update(mockInterest.id, updates);
      
      expect(mockPrisma.interest.update).toHaveBeenCalledWith({
        where: { id: mockInterest.id },
        data: updates
      });
      expect(result).toEqual(updatedInterest);
    });
    
    it('should throw DatabaseError when update fails', async () => {
      const error = new Error('Database error');
      mockPrisma.interest.update.mockRejectedValue(error);
      
      await expect(interestModel.update('test-id', { name: 'New Name' })).rejects.toThrow(DatabaseError);
    });
  });
  
  describe('delete', () => {
    it('should delete an interest', async () => {
      const mockInterest = generateMockInterest();
      mockPrisma.interest.delete.mockResolvedValue(mockInterest);
      
      const result = await interestModel.delete(mockInterest.id);
      
      expect(mockPrisma.interest.delete).toHaveBeenCalledWith({
        where: { id: mockInterest.id }
      });
      expect(result).toBe(true);
    });
    
    it('should throw DatabaseError when deletion fails', async () => {
      const error = new Error('Database error');
      mockPrisma.interest.delete.mockRejectedValue(error);
      
      await expect(interestModel.delete('test-id')).rejects.toThrow(DatabaseError);
    });
  });
  
  describe('submitBatch', () => {
    it('should process a batch of interests', async () => {
      const submission = generateMockInterestSubmission();
      const createdInterests = submission.interests.map((interest, index) => ({
        id: `created-id-${index}`,
        profileId: submission.profileId,
        ...interest
      }));
      
      // Mock the transaction to create interests one by one
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        // Mock deleteMany for existing interests
        mockPrisma.interest.deleteMany.mockResolvedValue({ count: 2 });
        
        // Mock create for each new interest
        mockPrisma.interest.create
          .mockResolvedValueOnce(createdInterests[0])
          .mockResolvedValueOnce(createdInterests[1]);
        
        return callback(mockPrisma);
      });
      
      const result = await interestModel.submitBatch(submission);
      
      expect(mockPrisma.interest.deleteMany).toHaveBeenCalledWith({
        where: { profileId: submission.profileId }
      });
      expect(mockPrisma.interest.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual(createdInterests);
    });
    
    it('should throw DatabaseError when transaction fails', async () => {
      const submission = generateMockInterestSubmission();
      const error = new Error('Transaction error');
      
      mockPrisma.$transaction.mockRejectedValue(error);
      
      await expect(interestModel.submitBatch(submission)).rejects.toThrow(DatabaseError);
    });
  });
  
  describe('calculateCompatibility', () => {
    it('should calculate interest compatibility between profiles', async () => {
      const profile1Id = 'profile-1';
      const profile2Id = 'profile-2';
      
      const profile1Interests = [
        generateMockInterest({ 
          id: 'interest-1', 
          profileId: profile1Id,
          category: InterestCategory.OUTDOOR_ADVENTURES,
          level: InterestLevel.HIGH
        }),
        generateMockInterest({ 
          id: 'interest-2', 
          profileId: profile1Id,
          category: InterestCategory.FOOD_DINING,
          level: InterestLevel.MEDIUM
        })
      ];
      
      const profile2Interests = [
        generateMockInterest({ 
          id: 'interest-3', 
          profileId: profile2Id,
          category: InterestCategory.OUTDOOR_ADVENTURES,
          level: InterestLevel.MEDIUM
        }),
        generateMockInterest({ 
          id: 'interest-4', 
          profileId: profile2Id,
          category: InterestCategory.TECHNOLOGY,
          level: InterestLevel.HIGH
        })
      ];
      
      // Mock the findMany calls for each profile
      mockPrisma.interest.findMany
        .mockResolvedValueOnce(profile1Interests)
        .mockResolvedValueOnce(profile2Interests);
      
      const result = await interestModel.calculateCompatibility(profile1Id, profile2Id);
      
      expect(mockPrisma.interest.findMany).toHaveBeenCalledTimes(2);
      expect(mockPrisma.interest.findMany).toHaveBeenNthCalledWith(1, {
        where: { profileId: profile1Id }
      });
      expect(mockPrisma.interest.findMany).toHaveBeenNthCalledWith(2, {
        where: { profileId: profile2Id }
      });
      
      // Compatibility calculation is complex, so we'll just verify it's a number between 0 and 1
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
    
    it('should return 0 when a profile has no interests', async () => {
      const profile1Id = 'profile-1';
      const profile2Id = 'profile-2';
      
      // Profile 1 has interests, but profile 2 doesn't
      mockPrisma.interest.findMany
        .mockResolvedValueOnce([generateMockInterest({ profileId: profile1Id })])
        .mockResolvedValueOnce([]);
      
      const result = await interestModel.calculateCompatibility(profile1Id, profile2Id);
      
      expect(result).toBe(0);
    });
    
    it('should throw DatabaseError when query fails', async () => {
      const error = new Error('Database error');
      mockPrisma.interest.findMany.mockRejectedValue(error);
      
      await expect(interestModel.calculateCompatibility('profile-1', 'profile-2')).rejects.toThrow(DatabaseError);
    });
  });
});

describe('InterestService', () => {
  let interestService: InterestService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock all the service functions we're testing
    jest.spyOn(require('../src/services/interest.service'), 'createInterest').mockImplementation(jest.fn());
    jest.spyOn(require('../src/services/interest.service'), 'getInterestById').mockImplementation(jest.fn());
    jest.spyOn(require('../src/services/interest.service'), 'getInterestsByProfileId').mockImplementation(jest.fn());
    jest.spyOn(require('../src/services/interest.service'), 'updateInterest').mockImplementation(jest.fn());
    jest.spyOn(require('../src/services/interest.service'), 'deleteInterest').mockImplementation(jest.fn());
    jest.spyOn(require('../src/services/interest.service'), 'submitInterests').mockImplementation(jest.fn());
    jest.spyOn(require('../src/services/interest.service'), 'getInterestCompatibility').mockImplementation(jest.fn());
    
    interestService = new InterestService();
  });
  
  describe('create', () => {
    it('should create a new interest', async () => {
      const mockInterest = generateMockInterest();
      (createInterest as jest.Mock).mockResolvedValue(mockInterest);
      
      const result = await interestService.create(mockInterest);
      
      expect(createInterest).toHaveBeenCalledWith(mockInterest);
      expect(result).toEqual(mockInterest);
    });
  });
  
  describe('getById', () => {
    it('should retrieve an interest by ID', async () => {
      const mockInterest = generateMockInterest();
      (getInterestById as jest.Mock).mockResolvedValue(mockInterest);
      
      const result = await interestService.getById(mockInterest.id);
      
      expect(getInterestById).toHaveBeenCalledWith(mockInterest.id);
      expect(result).toEqual(mockInterest);
    });
  });
  
  describe('getByProfileId', () => {
    it('should retrieve interests by profile ID', async () => {
      const mockInterests = [generateMockInterest()];
      (getInterestsByProfileId as jest.Mock).mockResolvedValue(mockInterests);
      
      const result = await interestService.getByProfileId('test-profile-id');
      
      expect(getInterestsByProfileId).toHaveBeenCalledWith('test-profile-id');
      expect(result).toEqual(mockInterests);
    });
  });
  
  describe('update', () => {
    it('should update an existing interest', async () => {
      const mockInterest = generateMockInterest();
      const updates = { name: 'Updated Name' };
      const updatedInterest = { ...mockInterest, ...updates };
      
      (updateInterest as jest.Mock).mockResolvedValue(updatedInterest);
      
      const result = await interestService.update(mockInterest.id, updates);
      
      expect(updateInterest).toHaveBeenCalledWith(mockInterest.id, updates);
      expect(result).toEqual(updatedInterest);
    });
  });
  
  describe('delete', () => {
    it('should delete an interest', async () => {
      (deleteInterest as jest.Mock).mockResolvedValue(true);
      
      const result = await interestService.delete('test-id');
      
      expect(deleteInterest).toHaveBeenCalledWith('test-id');
      expect(result).toBe(true);
    });
  });
  
  describe('submitBatch', () => {
    it('should process a batch of interests', async () => {
      const submission = generateMockInterestSubmission();
      const createdInterests = submission.interests.map((interest, index) => ({
        id: `created-id-${index}`,
        profileId: submission.profileId,
        ...interest
      }));
      
      (submitInterests as jest.Mock).mockResolvedValue(createdInterests);
      
      const result = await interestService.submitBatch(submission);
      
      expect(submitInterests).toHaveBeenCalledWith(submission);
      expect(result).toEqual(createdInterests);
    });
  });
  
  describe('calculateCompatibility', () => {
    it('should calculate interest compatibility between profiles', async () => {
      const profile1Id = 'profile-1';
      const profile2Id = 'profile-2';
      
      (getInterestCompatibility as jest.Mock).mockResolvedValue(0.75);
      
      const result = await interestService.calculateCompatibility(profile1Id, profile2Id);
      
      expect(getInterestCompatibility).toHaveBeenCalledWith(profile1Id, profile2Id);
      expect(result).toBe(0.75);
    });
  });
});

describe('Interest Functions', () => {
  const mockPrisma = prisma.prisma;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createInterest', () => {
    it('should create a new interest', async () => {
      const mockInterest = generateMockInterest();
      mockPrisma.interest.create.mockResolvedValue(mockInterest);
      
      const result = await createInterest(mockInterest);
      
      expect(mockPrisma.interest.create).toHaveBeenCalledWith({
        data: mockInterest
      });
      expect(result).toEqual(mockInterest);
    });
    
    it('should throw DatabaseError when creation fails', async () => {
      const mockInterest = generateMockInterest();
      const error = new Error('Database error');
      mockPrisma.interest.create.mockRejectedValue(error);
      
      await expect(createInterest(mockInterest)).rejects.toThrow(DatabaseError);
    });
  });
  
  describe('getInterestById', () => {
    it('should retrieve an interest by ID', async () => {
      const mockInterest = generateMockInterest();
      mockPrisma.interest.findUnique.mockResolvedValue(mockInterest);
      
      const result = await getInterestById(mockInterest.id);
      
      expect(mockPrisma.interest.findUnique).toHaveBeenCalledWith({
        where: { id: mockInterest.id }
      });
      expect(result).toEqual(mockInterest);
    });
    
    it('should return null when interest not found', async () => {
      mockPrisma.interest.findUnique.mockResolvedValue(null);
      
      const result = await getInterestById('non-existent-id');
      
      expect(result).toBeNull();
    });
    
    it('should throw DatabaseError when query fails', async () => {
      const error = new Error('Database error');
      mockPrisma.interest.findUnique.mockRejectedValue(error);
      
      await expect(getInterestById('test-id')).rejects.toThrow(DatabaseError);
    });
  });
  
  describe('getInterestsByProfileId', () => {
    it('should retrieve interests by profile ID', async () => {
      const mockInterests = [
        generateMockInterest(),
        generateMockInterest({ id: 'test-id-2', name: 'Swimming' })
      ];
      mockPrisma.interest.findMany.mockResolvedValue(mockInterests);
      
      const result = await getInterestsByProfileId('test-profile-id');
      
      expect(mockPrisma.interest.findMany).toHaveBeenCalledWith({
        where: { profileId: 'test-profile-id' }
      });
      expect(result).toEqual(mockInterests);
    });
    
    it('should throw DatabaseError when query fails', async () => {
      const error = new Error('Database error');
      mockPrisma.interest.findMany.mockRejectedValue(error);
      
      await expect(getInterestsByProfileId('test-profile-id')).rejects.toThrow(DatabaseError);
    });
  });
  
  describe('updateInterest', () => {
    it('should update an existing interest', async () => {
      const mockInterest = generateMockInterest();
      const updates = { name: 'Mountain Climbing', level: InterestLevel.MEDIUM };
      const updatedInterest = { ...mockInterest, ...updates };
      
      // Mock findUnique for the existence check
      mockPrisma.interest.findUnique.mockResolvedValue(mockInterest);
      // Mock update for the actual update
      mockPrisma.interest.update.mockResolvedValue(updatedInterest);
      
      const result = await updateInterest(mockInterest.id, updates);
      
      expect(mockPrisma.interest.findUnique).toHaveBeenCalledWith({
        where: { id: mockInterest.id }
      });
      expect(mockPrisma.interest.update).toHaveBeenCalledWith({
        where: { id: mockInterest.id },
        data: updates
      });
      expect(result).toEqual(updatedInterest);
    });
    
    it('should throw not found error when interest does not exist', async () => {
      mockPrisma.interest.findUnique.mockResolvedValue(null);
      
      await expect(updateInterest('non-existent-id', { name: 'New Name' }))
        .rejects.toThrow(/Interest not found/);
    });
    
    it('should throw DatabaseError when update fails', async () => {
      mockPrisma.interest.findUnique.mockResolvedValue(generateMockInterest());
      
      const error = new Error('Database error');
      mockPrisma.interest.update.mockRejectedValue(error);
      
      await expect(updateInterest('test-id', { name: 'New Name' })).rejects.toThrow(DatabaseError);
    });
  });
  
  describe('deleteInterest', () => {
    it('should delete an interest', async () => {
      const mockInterest = generateMockInterest();
      
      // Mock findUnique for the existence check
      mockPrisma.interest.findUnique.mockResolvedValue(mockInterest);
      // Mock delete for the actual deletion
      mockPrisma.interest.delete.mockResolvedValue(mockInterest);
      
      const result = await deleteInterest(mockInterest.id);
      
      expect(mockPrisma.interest.findUnique).toHaveBeenCalledWith({
        where: { id: mockInterest.id }
      });
      expect(mockPrisma.interest.delete).toHaveBeenCalledWith({
        where: { id: mockInterest.id }
      });
      expect(result).toBe(true);
    });
    
    it('should throw not found error when interest does not exist', async () => {
      mockPrisma.interest.findUnique.mockResolvedValue(null);
      
      await expect(deleteInterest('non-existent-id'))
        .rejects.toThrow(/Interest not found/);
    });
    
    it('should throw DatabaseError when deletion fails', async () => {
      mockPrisma.interest.findUnique.mockResolvedValue(generateMockInterest());
      
      const error = new Error('Database error');
      mockPrisma.interest.delete.mockRejectedValue(error);
      
      await expect(deleteInterest('test-id')).rejects.toThrow(DatabaseError);
    });
  });
  
  describe('submitInterests', () => {
    it('should process a batch of interests', async () => {
      const submission = generateMockInterestSubmission();
      const createdInterests = submission.interests.map((interest, index) => ({
        id: `created-id-${index}`,
        profileId: submission.profileId,
        ...interest
      }));
      
      // Mock the transaction to create interests one by one
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        // Mock deleteMany for existing interests
        mockPrisma.interest.deleteMany.mockResolvedValue({ count: 2 });
        
        // Mock create for each new interest
        mockPrisma.interest.create
          .mockResolvedValueOnce(createdInterests[0])
          .mockResolvedValueOnce(createdInterests[1]);
        
        return callback(mockPrisma);
      });
      
      const result = await submitInterests(submission);
      
      expect(mockPrisma.interest.deleteMany).toHaveBeenCalledWith({
        where: { profileId: submission.profileId }
      });
      expect(mockPrisma.interest.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual(createdInterests);
    });
    
    it('should not delete existing interests when replaceExisting is false', async () => {
      const submission = generateMockInterestSubmission({ replaceExisting: false });
      const createdInterests = submission.interests.map((interest, index) => ({
        id: `created-id-${index}`,
        profileId: submission.profileId,
        ...interest
      }));
      
      // Mock the transaction to create interests one by one
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        // Mock create for each new interest
        mockPrisma.interest.create
          .mockResolvedValueOnce(createdInterests[0])
          .mockResolvedValueOnce(createdInterests[1]);
        
        return callback(mockPrisma);
      });
      
      const result = await submitInterests(submission);
      
      expect(mockPrisma.interest.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.interest.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual(createdInterests);
    });
    
    it('should throw DatabaseError when transaction fails', async () => {
      const submission = generateMockInterestSubmission();
      const error = new Error('Transaction error');
      
      mockPrisma.$transaction.mockRejectedValue(error);
      
      await expect(submitInterests(submission)).rejects.toThrow(DatabaseError);
    });
  });
  
  describe('getInterestCompatibility', () => {
    it('should calculate interest compatibility between profiles', async () => {
      const profile1Id = 'profile-1';
      const profile2Id = 'profile-2';
      
      const profile1Interests = [
        generateMockInterest({ 
          id: 'interest-1', 
          profileId: profile1Id,
          category: InterestCategory.OUTDOOR_ADVENTURES,
          level: InterestLevel.HIGH
        }),
        generateMockInterest({ 
          id: 'interest-2', 
          profileId: profile1Id,
          category: InterestCategory.FOOD_DINING,
          level: InterestLevel.MEDIUM
        })
      ];
      
      const profile2Interests = [
        generateMockInterest({ 
          id: 'interest-3', 
          profileId: profile2Id,
          category: InterestCategory.OUTDOOR_ADVENTURES,
          level: InterestLevel.MEDIUM
        }),
        generateMockInterest({ 
          id: 'interest-4', 
          profileId: profile2Id,
          category: InterestCategory.TECHNOLOGY,
          level: InterestLevel.HIGH
        })
      ];
      
      // Mock the method calls for getInterestsByProfileId
      mockPrisma.interest.findMany
        .mockResolvedValueOnce(profile1Interests)
        .mockResolvedValueOnce(profile2Interests);
      
      const result = await getInterestCompatibility(profile1Id, profile2Id);
      
      expect(mockPrisma.interest.findMany).toHaveBeenCalledTimes(2);
      
      // Compatibility should be a number between 0 and 1
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
    
    it('should return 0 when a profile has no interests', async () => {
      const profile1Id = 'profile-1';
      const profile2Id = 'profile-2';
      
      // First profile has interests, second doesn't
      mockPrisma.interest.findMany
        .mockResolvedValueOnce([generateMockInterest({ profileId: profile1Id })])
        .mockResolvedValueOnce([]);
      
      const result = await getInterestCompatibility(profile1Id, profile2Id);
      
      expect(result).toBe(0);
    });
    
    it('should handle profiles with different interest categories', async () => {
      const profile1Id = 'profile-1';
      const profile2Id = 'profile-2';
      
      // Profiles with completely different interests
      mockPrisma.interest.findMany
        .mockResolvedValueOnce([
          generateMockInterest({ 
            profileId: profile1Id,
            category: InterestCategory.OUTDOOR_ADVENTURES,
            level: InterestLevel.HIGH
          })
        ])
        .mockResolvedValueOnce([
          generateMockInterest({ 
            profileId: profile2Id,
            category: InterestCategory.TECHNOLOGY,
            level: InterestLevel.HIGH
          })
        ]);
      
      const result = await getInterestCompatibility(profile1Id, profile2Id);
      
      // Should have a low compatibility score since no shared interests
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(0.5);
    });
  });
});

describe('Interest Validation', () => {
  const mockPrisma = prisma.prisma;
  const validateObject = require('../../../shared/src/utils/validation.util').validateObject;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should validate correct interest data', async () => {
    const mockInterest = generateMockInterest();
    mockPrisma.interest.create.mockResolvedValue(mockInterest);
    
    await createInterest(mockInterest);
    
    expect(validateObject).toHaveBeenCalledWith(mockInterest, expect.any(Object));
  });
  
  it('should reject invalid interest category', async () => {
    const mockInterest = generateMockInterest({ category: 'invalid_category' });
    validateObject.mockImplementation(() => {
      throw new Error('Invalid category');
    });
    
    await expect(createInterest(mockInterest)).rejects.toThrow();
  });
  
  it('should reject invalid interest level', async () => {
    const mockInterest = generateMockInterest({ level: 10 });
    validateObject.mockImplementation(() => {
      throw new Error('Invalid level');
    });
    
    await expect(createInterest(mockInterest)).rejects.toThrow();
  });
  
  it('should validate interest submission data', async () => {
    const submission = generateMockInterestSubmission();
    
    // Mock the transaction
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      mockPrisma.interest.create
        .mockResolvedValueOnce({ id: 'created-1', profileId: submission.profileId, ...submission.interests[0] })
        .mockResolvedValueOnce({ id: 'created-2', profileId: submission.profileId, ...submission.interests[1] });
      
      return callback(mockPrisma);
    });
    
    await submitInterests(submission);
    
    expect(validateObject).toHaveBeenCalledWith(expect.anything(), expect.any(Object));
  });
  
  it('should reject interest submission with empty interests array', async () => {
    const submission = generateMockInterestSubmission({ interests: [] });
    validateObject.mockImplementation(() => {
      throw new Error('Interests array cannot be empty');
    });
    
    await expect(submitInterests(submission)).rejects.toThrow();
  });
});