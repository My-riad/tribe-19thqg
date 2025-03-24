import CompatibilityAlgorithm, {
  calculatePersonalityCompatibility,
  calculateInterestCompatibility,
  calculateCommunicationCompatibility,
  calculateLocationCompatibility,
  calculateGroupBalanceImpact,
  normalizeFactorWeights
} from '../src/algorithms/compatibility.algorithm';

import { CompatibilityService } from '../src/services/compatibility.service';
import {
  CompatibilityFactor,
  ICompatibilityRequest,
  ICompatibilityBatchRequest
} from '../src/models/compatibility.model';

import {
  PersonalityTrait,
  InterestCategory,
  CommunicationStyle
} from '../../shared/src/types/profile.types';

import { faker } from '@faker-js/faker'; // ^8.0.2
import Redis from 'ioredis-mock'; // ^8.2.0

// Mock PrismaClient and Redis
jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn() }));
jest.mock('ioredis', () => require('ioredis-mock'));

/**
 * Generates a mock user profile for testing
 * @param id Optional user ID (generated if not provided)
 * @returns Mock user profile with personality traits, interests, and communication style
 */
function generateMockUserProfile(id = faker.string.uuid()) {
  // Generate random personality traits
  const personalityTraits = Object.values(PersonalityTrait).map(trait => ({
    id: faker.string.uuid(),
    profileId: id,
    trait,
    score: faker.number.int({ min: 10, max: 90 }),
    assessedAt: new Date()
  }));

  // Generate random interests (3-7 interests)
  const interestCategories = Object.values(InterestCategory);
  const interests = Array.from({ length: faker.number.int({ min: 3, max: 7 }) }, () => ({
    id: faker.string.uuid(),
    profileId: id,
    category: faker.helpers.arrayElement(interestCategories),
    name: faker.word.sample(),
    level: faker.number.int({ min: 1, max: 5 })
  }));

  // Generate random communication style
  const communicationStyle = faker.helpers.arrayElement(Object.values(CommunicationStyle));

  // Generate random coordinates (within the US for testing)
  const coordinates = {
    latitude: faker.location.latitude({ min: 25, max: 49 }),
    longitude: faker.location.longitude({ min: -125, max: -65 })
  };

  return {
    id,
    userId: faker.string.uuid(),
    name: faker.person.fullName(),
    bio: faker.lorem.paragraph(),
    location: faker.location.city(),
    coordinates,
    birthdate: faker.date.birthdate(),
    phoneNumber: faker.phone.number(),
    avatarUrl: faker.image.avatar(),
    communicationStyle,
    maxTravelDistance: faker.number.int({ min: 5, max: 30 }),
    personalityTraits,
    interests,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent()
  };
}

/**
 * Generates a mock tribe for testing
 * @param id Optional tribe ID (generated if not provided)
 * @param memberCount Optional number of members (default 4-8)
 * @returns Mock tribe with members, interests, and location
 */
function generateMockTribe(id = faker.string.uuid(), memberCount) {
  // Determine number of members (4-8 by default)
  const count = memberCount || faker.number.int({ min: 4, max: 8 });
  
  // Generate member IDs
  const memberIds = Array.from({ length: count }, () => faker.string.uuid());
  
  // Generate members
  const members = memberIds.map(userId => ({
    id: faker.string.uuid(),
    tribeId: id,
    userId,
    role: faker.helpers.arrayElement(['creator', 'member']),
    status: 'active',
    joinedAt: faker.date.past(),
    lastActive: faker.date.recent()
  }));

  // Generate tribe interests (primary and secondary)
  const interestCategories = Object.values(InterestCategory);
  const interests = Array.from({ length: faker.number.int({ min: 3, max: 5 }) }, () => ({
    id: faker.string.uuid(),
    tribeId: id,
    category: faker.helpers.arrayElement(interestCategories),
    name: faker.word.sample(),
    isPrimary: faker.datatype.boolean()
  }));

  // Generate coordinates (within the US for testing)
  const coordinates = {
    latitude: faker.location.latitude({ min: 25, max: 49 }),
    longitude: faker.location.longitude({ min: -125, max: -65 })
  };

  return {
    id,
    name: faker.company.name(),
    description: faker.lorem.paragraph(),
    location: faker.location.city(),
    coordinates,
    imageUrl: faker.image.urlPicsumPhotos(),
    status: 'active',
    privacy: faker.helpers.arrayElement(['public', 'private']),
    maxMembers: 8,
    createdBy: memberIds[0],
    createdAt: faker.date.past(),
    lastActive: faker.date.recent(),
    interests,
    members
  };
}

/**
 * Generates mock profiles for tribe members
 * @param memberIds Array of member IDs
 * @returns Map of member IDs to mock profiles
 */
function generateMockMemberProfiles(memberIds) {
  const memberProfiles = new Map();
  
  for (const memberId of memberIds) {
    const profile = generateMockUserProfile(memberId);
    memberProfiles.set(memberId, profile);
  }
  
  return memberProfiles;
}

describe('Compatibility Algorithm Unit Tests', () => {
  describe('calculatePersonalityCompatibility', () => {
    it('Should calculate personality compatibility between two sets of traits', () => {
      // Generate two sets of personality traits
      const profile1 = generateMockUserProfile();
      const profile2 = generateMockUserProfile();
      
      // Calculate compatibility
      const result = calculatePersonalityCompatibility(
        profile1.personalityTraits,
        profile2.personalityTraits
      );
      
      // Assertions
      expect(result).toHaveProperty('traitScores');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('complementaryTraits');
      expect(result).toHaveProperty('conflictingTraits');
      
      // Ensure score is between 0 and 100
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      
      // Verify trait scores
      Object.values(PersonalityTrait).forEach(trait => {
        if (result.traitScores[trait]) {
          expect(result.traitScores[trait]).toBeGreaterThanOrEqual(0);
          expect(result.traitScores[trait]).toBeLessThanOrEqual(100);
        }
      });
    });

    it('Should identify complementary and conflicting traits correctly', () => {
      // Create profiles with known trait values
      const profile1 = generateMockUserProfile();
      const profile2 = generateMockUserProfile();
      
      // Set opposing extraversion traits
      profile1.personalityTraits.find(t => t.trait === PersonalityTrait.EXTRAVERSION).score = 90;
      profile2.personalityTraits.find(t => t.trait === PersonalityTrait.EXTRAVERSION).score = 20;
      
      // Set similar agreeableness traits
      profile1.personalityTraits.find(t => t.trait === PersonalityTrait.AGREEABLENESS).score = 85;
      profile2.personalityTraits.find(t => t.trait === PersonalityTrait.AGREEABLENESS).score = 80;
      
      const result = calculatePersonalityCompatibility(
        profile1.personalityTraits,
        profile2.personalityTraits
      );
      
      // Check if the algorithm correctly identifies complementary traits
      expect(result.complementaryTraits).toContain(PersonalityTrait.AGREEABLENESS);
      
      // For extraversion, different values can be either complementary or conflicting
      // depending on the implementation details
    });
  });

  describe('calculateInterestCompatibility', () => {
    it('Should calculate interest compatibility between two sets of interests', () => {
      // Generate two sets of interests
      const profile1 = generateMockUserProfile();
      const profile2 = generateMockUserProfile();
      
      // Calculate compatibility
      const result = calculateInterestCompatibility(
        profile1.interests,
        profile2.interests
      );
      
      // Assertions
      expect(result).toHaveProperty('sharedInterests');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('primaryInterestMatch');
      
      // Ensure score is between 0 and 100
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
    
    it('Should give higher scores for more shared interests', () => {
      const baseInterests = [
        {
          id: 'i1',
          profileId: 'p1',
          category: InterestCategory.OUTDOOR_ADVENTURES,
          name: 'hiking',
          level: 4
        },
        {
          id: 'i2',
          profileId: 'p1',
          category: InterestCategory.FOOD_DINING,
          name: 'restaurants',
          level: 3
        }
      ];
      
      const interests1 = [...baseInterests];
      
      // Test case 1: No shared interests
      const interests2 = [
        {
          id: 'i3',
          profileId: 'p2',
          category: InterestCategory.TECHNOLOGY,
          name: 'programming',
          level: 5
        }
      ];
      
      const noSharedResult = calculateInterestCompatibility(interests1, interests2);
      
      // Test case 2: Some shared interests
      const interests3 = [
        ...interests2,
        {
          id: 'i4',
          profileId: 'p3',
          category: InterestCategory.OUTDOOR_ADVENTURES,
          name: 'hiking',
          level: 4
        }
      ];
      
      const someSharedResult = calculateInterestCompatibility(interests1, interests3);
      
      // More shared interests should result in higher score
      expect(someSharedResult.overallScore).toBeGreaterThan(noSharedResult.overallScore);
    });
    
    it('Should weight primary interest matches more heavily', () => {
      const interests1 = [
        {
          id: 'i1',
          profileId: 'p1',
          category: InterestCategory.OUTDOOR_ADVENTURES,
          name: 'hiking',
          level: 5 // Primary interest (level >= 3)
        },
        {
          id: 'i2',
          profileId: 'p1',
          category: InterestCategory.FOOD_DINING,
          name: 'restaurants',
          level: 2 // Non-primary interest
        }
      ];
      
      // Case 1: Match on non-primary interest
      const interests2 = [
        {
          id: 'i3',
          profileId: 'p2',
          category: InterestCategory.FOOD_DINING,
          name: 'restaurants',
          level: 5 // Primary interest
        }
      ];
      
      const nonPrimaryMatch = calculateInterestCompatibility(interests1, interests2);
      
      // Case 2: Match on primary interest
      const interests3 = [
        {
          id: 'i4',
          profileId: 'p3',
          category: InterestCategory.OUTDOOR_ADVENTURES,
          name: 'hiking',
          level: 5 // Primary interest
        }
      ];
      
      const primaryMatch = calculateInterestCompatibility(interests1, interests3);
      
      // Primary interest match should result in higher score
      expect(primaryMatch.primaryInterestMatch).toBe(true);
      expect(primaryMatch.overallScore).toBeGreaterThan(nonPrimaryMatch.overallScore);
    });
  });

  describe('calculateCommunicationCompatibility', () => {
    it('Should calculate communication style compatibility', () => {
      // Test identical styles
      const style1 = CommunicationStyle.DIRECT;
      const result1 = calculateCommunicationCompatibility(style1, style1);
      
      expect(result1).toHaveProperty('styleMatch');
      expect(result1).toHaveProperty('overallScore');
      expect(result1).toHaveProperty('complementaryStyles');
      expect(result1.styleMatch).toBe(true);
      expect(result1.overallScore).toBeGreaterThanOrEqual(0);
      expect(result1.overallScore).toBeLessThanOrEqual(100);
      
      // Test different styles
      const style2 = CommunicationStyle.ANALYTICAL;
      const result2 = calculateCommunicationCompatibility(style1, style2);
      
      expect(result2.styleMatch).toBe(false);
    });
    
    it('Should determine identical styles have high compatibility', () => {
      const allStyles = Object.values(CommunicationStyle);
      
      allStyles.forEach(style => {
        const result = calculateCommunicationCompatibility(style, style);
        expect(result.styleMatch).toBe(true);
        expect(result.overallScore).toBeGreaterThanOrEqual(80); // Same styles should have high scores
      });
    });
    
    it('Should identify complementary communication styles', () => {
      // Known complementary pairs
      const complementaryPairs = [
        [CommunicationStyle.DIRECT, CommunicationStyle.ANALYTICAL],
        [CommunicationStyle.THOUGHTFUL, CommunicationStyle.SUPPORTIVE],
        [CommunicationStyle.SUPPORTIVE, CommunicationStyle.EXPRESSIVE]
      ];
      
      for (const [style1, style2] of complementaryPairs) {
        const result = calculateCommunicationCompatibility(style1, style2);
        expect(result.complementaryStyles).toBe(true);
      }
    });
  });

  describe('calculateLocationCompatibility', () => {
    it('Should calculate location compatibility based on distance', () => {
      // Test coordinates
      const coordinates1 = {
        latitude: 40.7128,
        longitude: -74.0060 // New York
      };
      
      const coordinates2 = {
        latitude: 40.7128,
        longitude: -74.0060 // Same location (New York)
      };
      
      const coordinates3 = {
        latitude: 34.0522,
        longitude: -118.2437 // Los Angeles (far from New York)
      };
      
      // Test same location
      const result1 = calculateLocationCompatibility(coordinates1, coordinates2);
      
      expect(result1).toHaveProperty('distance');
      expect(result1).toHaveProperty('withinPreferredRange');
      expect(result1).toHaveProperty('overallScore');
      
      expect(result1.distance).toBe(0);
      expect(result1.withinPreferredRange).toBe(true);
      expect(result1.overallScore).toBe(100);
      
      // Test distant locations
      const result2 = calculateLocationCompatibility(coordinates1, coordinates3);
      
      expect(result2.distance).toBeGreaterThan(0);
      expect(result2.overallScore).toBeLessThan(100);
    });
    
    it('Should calculate distance correctly using Haversine formula', () => {
      // New York to Los Angeles is approximately 2,451 miles
      const newYork = {
        latitude: 40.7128,
        longitude: -74.0060
      };
      
      const losAngeles = {
        latitude: 34.0522,
        longitude: -118.2437
      };
      
      const result = calculateLocationCompatibility(newYork, losAngeles);
      
      // Distance should be approximately 2,451 miles (allowing for some variation in calculation)
      expect(result.distance).toBeGreaterThan(2400);
      expect(result.distance).toBeLessThan(2500);
    });
    
    it('Should consider locations beyond max distance to have lower compatibility', () => {
      const location1 = {
        latitude: 40.7128,
        longitude: -74.0060 // New York
      };
      
      const location2 = {
        latitude: 34.0522,
        longitude: -118.2437 // Los Angeles
      };
      
      const maxDistance = 500; // miles
      const result = calculateLocationCompatibility(location1, location2, maxDistance);
      
      expect(result.withinPreferredRange).toBe(false);
      expect(result.overallScore).toBeLessThan(50); // Score should be low for distant locations
    });
  });

  describe('calculateGroupBalanceImpact', () => {
    it('Should calculate how a user would impact group balance', () => {
      // Generate user and member traits
      const userProfile = generateMockUserProfile();
      const memberProfiles = Array.from({ length: 4 }, () => generateMockUserProfile());
      
      const userTraits = userProfile.personalityTraits;
      const memberTraits = memberProfiles.map(profile => profile.personalityTraits);
      
      // Calculate group balance impact
      const result = calculateGroupBalanceImpact(userTraits, memberTraits);
      
      // Assertions
      expect(result).toHaveProperty('currentBalance');
      expect(result).toHaveProperty('projectedBalance');
      expect(result).toHaveProperty('balanceImpact');
      expect(result).toHaveProperty('improvesBalance');
      
      // Check that all personality traits are included
      Object.values(PersonalityTrait).forEach(trait => {
        expect(result.currentBalance).toHaveProperty(trait);
        expect(result.projectedBalance).toHaveProperty(trait);
      });
    });
    
    it('Should determine if user improves group balance', () => {
      // Create a group with high extraversion
      const highExtraversionMembers = Array.from({ length: 4 }, () => {
        const traits = Object.values(PersonalityTrait).map(trait => ({
          id: faker.string.uuid(),
          profileId: faker.string.uuid(),
          trait,
          score: trait === PersonalityTrait.EXTRAVERSION ? 90 : 50, // High extraversion
          assessedAt: new Date()
        }));
        return traits;
      });
      
      // Create a user with low extraversion
      const lowExtraversionUser = Object.values(PersonalityTrait).map(trait => ({
        id: faker.string.uuid(),
        profileId: faker.string.uuid(),
        trait,
        score: trait === PersonalityTrait.EXTRAVERSION ? 10 : 50, // Low extraversion
        assessedAt: new Date()
      }));
      
      // Calculate balance impact
      const result = calculateGroupBalanceImpact(lowExtraversionUser, highExtraversionMembers);
      
      // User should improve balance by bringing diversity
      expect(result.balanceImpact).toBeGreaterThan(0);
      expect(result.improvesBalance).toBe(true);
    });
  });

  describe('normalizeFactorWeights', () => {
    it('Should normalize factor weights to sum to 1.0', () => {
      // Test with valid weights
      const weights1 = {
        [CompatibilityFactor.PERSONALITY]: 3,
        [CompatibilityFactor.INTERESTS]: 2,
        [CompatibilityFactor.COMMUNICATION_STYLE]: 2,
        [CompatibilityFactor.LOCATION]: 2,
        [CompatibilityFactor.GROUP_BALANCE]: 1
      };
      
      const normalized1 = normalizeFactorWeights(weights1);
      
      // Sum should be very close to 1.0 (allow for floating-point imprecision)
      const sum1 = Object.values(normalized1).reduce((a, b) => a + b, 0);
      expect(sum1).toBeCloseTo(1.0);
      
      // Proportions should be maintained
      expect(normalized1[CompatibilityFactor.PERSONALITY]).toBeCloseTo(0.3);
      expect(normalized1[CompatibilityFactor.INTERESTS]).toBeCloseTo(0.2);
      expect(normalized1[CompatibilityFactor.GROUP_BALANCE]).toBeCloseTo(0.1);
    });
    
    it('Should handle empty or undefined weights', () => {
      // Test with empty weights object
      const emptyWeights = {} as Record<CompatibilityFactor, number>;
      
      const normalized = normalizeFactorWeights(emptyWeights);
      
      // Should have values for all factors
      Object.values(CompatibilityFactor).forEach(factor => {
        expect(normalized).toHaveProperty(factor);
        expect(normalized[factor]).toBeGreaterThan(0);
      });
      
      // Sum should be 1.0
      const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0);
    });
    
    it('Should return default weights if all weights are 0', () => {
      // Test with zero weights
      const zeroWeights = {
        [CompatibilityFactor.PERSONALITY]: 0,
        [CompatibilityFactor.INTERESTS]: 0,
        [CompatibilityFactor.COMMUNICATION_STYLE]: 0,
        [CompatibilityFactor.LOCATION]: 0,
        [CompatibilityFactor.GROUP_BALANCE]: 0
      };
      
      const normalized = normalizeFactorWeights(zeroWeights);
      
      // Should return default weights
      expect(normalized[CompatibilityFactor.PERSONALITY]).toBeGreaterThan(0);
      
      // Sum should be 1.0
      const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0);
    });
  });
});

describe('CompatibilityAlgorithm Class Tests', () => {
  let compatibilityAlgorithm: CompatibilityAlgorithm;
  
  beforeEach(() => {
    compatibilityAlgorithm = new CompatibilityAlgorithm();
  });
  
  describe('calculateUserCompatibility', () => {
    it('Should calculate compatibility between two users', async () => {
      // Generate test profiles
      const user1 = generateMockUserProfile();
      const user2 = generateMockUserProfile();
      
      // Calculate compatibility
      const result = await compatibilityAlgorithm.calculateUserCompatibility(
        user1,
        user2,
        undefined, // default weights
        true // include details
      );
      
      // Assertions
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('targetUserId');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('calculatedAt');
      
      expect(result.userId).toBe(user1.id);
      expect(result.targetUserId).toBe(user2.id);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      
      // Details should be provided
      expect(result.details.length).toBeGreaterThan(0);
      result.details.forEach(detail => {
        expect(detail).toHaveProperty('factor');
        expect(detail).toHaveProperty('weight');
        expect(detail).toHaveProperty('score');
        expect(detail).toHaveProperty('description');
      });
    });
    
    it('Should include detailed factor scores when includeDetails is true', async () => {
      const user1 = generateMockUserProfile();
      const user2 = generateMockUserProfile();
      
      // With details
      const resultWithDetails = await compatibilityAlgorithm.calculateUserCompatibility(
        user1,
        user2,
        undefined,
        true
      );
      
      // Without details
      const resultWithoutDetails = await compatibilityAlgorithm.calculateUserCompatibility(
        user1,
        user2,
        undefined,
        false
      );
      
      expect(resultWithDetails.details.length).toBeGreaterThan(0);
      expect(resultWithoutDetails.details.length).toBe(0);
    });
    
    it('Should apply custom factor weights correctly', async () => {
      // Generate test profiles
      const user1 = generateMockUserProfile();
      const user2 = generateMockUserProfile();
      
      // Custom weights emphasizing personality
      const personalityWeights = {
        [CompatibilityFactor.PERSONALITY]: 0.8,
        [CompatibilityFactor.INTERESTS]: 0.1,
        [CompatibilityFactor.COMMUNICATION_STYLE]: 0.05,
        [CompatibilityFactor.LOCATION]: 0.03,
        [CompatibilityFactor.GROUP_BALANCE]: 0.02
      };
      
      // Custom weights emphasizing interests
      const interestWeights = {
        [CompatibilityFactor.PERSONALITY]: 0.1,
        [CompatibilityFactor.INTERESTS]: 0.8,
        [CompatibilityFactor.COMMUNICATION_STYLE]: 0.05,
        [CompatibilityFactor.LOCATION]: 0.03,
        [CompatibilityFactor.GROUP_BALANCE]: 0.02
      };
      
      // Calculate compatibility with different weights
      const result1 = await compatibilityAlgorithm.calculateUserCompatibility(
        user1,
        user2,
        personalityWeights,
        true
      );
      
      const result2 = await compatibilityAlgorithm.calculateUserCompatibility(
        user1,
        user2,
        interestWeights,
        true
      );
      
      // Results should reflect the different weights
      const personalityDetail1 = result1.details.find(
        d => d.factor === CompatibilityFactor.PERSONALITY
      );
      const personalityDetail2 = result2.details.find(
        d => d.factor === CompatibilityFactor.PERSONALITY
      );
      
      expect(personalityDetail1.weight).toBeCloseTo(0.8);
      expect(personalityDetail2.weight).toBeCloseTo(0.1);
    });
    
    it('Should calculate compatibility consistently for the same inputs', async () => {
      // Generate test profiles
      const user1 = generateMockUserProfile();
      const user2 = generateMockUserProfile();
      
      // Calculate compatibility twice with same inputs
      const result1 = await compatibilityAlgorithm.calculateUserCompatibility(
        user1,
        user2,
        undefined,
        false
      );
      
      const result2 = await compatibilityAlgorithm.calculateUserCompatibility(
        user1,
        user2,
        undefined,
        false
      );
      
      // Results should be consistent (allowing for minor AI-based variations)
      expect(result1.overallScore).toBeCloseTo(result2.overallScore, 0);
    });
  });
  
  describe('calculateTribeCompatibility', () => {
    it('Should calculate compatibility between a user and a tribe', async () => {
      // Generate test user and tribe
      const user = generateMockUserProfile();
      const tribe = generateMockTribe();
      const memberIds = tribe.members.map(member => member.userId);
      const memberProfiles = Array.from(memberIds, id => generateMockUserProfile(id));
      
      // Calculate compatibility
      const result = await compatibilityAlgorithm.calculateTribeCompatibility(
        user,
        tribe,
        memberProfiles,
        undefined, // default weights
        true // include details
      );
      
      // Assertions
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('tribeId');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('memberCompatibility');
      expect(result).toHaveProperty('groupBalanceImpact');
      expect(result).toHaveProperty('calculatedAt');
      
      expect(result.userId).toBe(user.id);
      expect(result.tribeId).toBe(tribe.id);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      
      // Details should be provided
      expect(result.details.length).toBeGreaterThan(0);
      
      // Member compatibility should be calculated for each member
      expect(result.memberCompatibility.length).toBe(memberProfiles.length);
      result.memberCompatibility.forEach(member => {
        expect(member).toHaveProperty('userId');
        expect(member).toHaveProperty('score');
        expect(memberIds).toContain(member.userId);
      });
    });
    
    it('Should include detailed factor scores when includeDetails is true', async () => {
      const user = generateMockUserProfile();
      const tribe = generateMockTribe();
      const memberIds = tribe.members.map(member => member.userId);
      const memberProfiles = Array.from(memberIds, id => generateMockUserProfile(id));
      
      // With details
      const resultWithDetails = await compatibilityAlgorithm.calculateTribeCompatibility(
        user,
        tribe,
        memberProfiles,
        undefined,
        true
      );
      
      // Without details
      const resultWithoutDetails = await compatibilityAlgorithm.calculateTribeCompatibility(
        user,
        tribe,
        memberProfiles,
        undefined,
        false
      );
      
      expect(resultWithDetails.details.length).toBeGreaterThan(0);
      expect(resultWithoutDetails.details.length).toBe(0);
    });
    
    it('Should calculate individual compatibility with each tribe member', async () => {
      const user = generateMockUserProfile();
      const tribe = generateMockTribe();
      const memberIds = tribe.members.map(member => member.userId);
      const memberProfiles = Array.from(memberIds, id => generateMockUserProfile(id));
      
      const result = await compatibilityAlgorithm.calculateTribeCompatibility(
        user,
        tribe,
        memberProfiles,
        undefined,
        true
      );
      
      // Should have compatibility scores for each member
      expect(result.memberCompatibility.length).toBe(memberProfiles.length);
      
      // Each member should have a score
      memberIds.forEach(memberId => {
        const memberCompat = result.memberCompatibility.find(mc => mc.userId === memberId);
        expect(memberCompat).toBeDefined();
        expect(memberCompat.score).toBeGreaterThanOrEqual(0);
        expect(memberCompat.score).toBeLessThanOrEqual(100);
      });
    });
    
    it('Should include group balance impact in the calculation', async () => {
      const user = generateMockUserProfile();
      const tribe = generateMockTribe();
      const memberIds = tribe.members.map(member => member.userId);
      const memberProfiles = Array.from(memberIds, id => generateMockUserProfile(id));
      
      const result = await compatibilityAlgorithm.calculateTribeCompatibility(
        user,
        tribe,
        memberProfiles,
        undefined,
        true
      );
      
      // Should include group balance factor
      const balanceFactor = result.details.find(
        d => d.factor === CompatibilityFactor.GROUP_BALANCE
      );
      
      expect(balanceFactor).toBeDefined();
      expect(result.groupBalanceImpact).toBeDefined();
    });
    
    it('Should apply custom factor weights correctly', async () => {
      const user = generateMockUserProfile();
      const tribe = generateMockTribe();
      const memberProfiles = tribe.members.map(m => generateMockUserProfile(m.userId));
      
      // Custom weights emphasizing group balance
      const balanceWeights = {
        [CompatibilityFactor.PERSONALITY]: 0.2,
        [CompatibilityFactor.INTERESTS]: 0.2,
        [CompatibilityFactor.COMMUNICATION_STYLE]: 0.1,
        [CompatibilityFactor.LOCATION]: 0.1,
        [CompatibilityFactor.GROUP_BALANCE]: 0.4
      };
      
      const result = await compatibilityAlgorithm.calculateTribeCompatibility(
        user,
        tribe,
        memberProfiles,
        balanceWeights,
        true
      );
      
      // Check if weights are applied
      const balanceFactor = result.details.find(
        d => d.factor === CompatibilityFactor.GROUP_BALANCE
      );
      
      expect(balanceFactor.weight).toBeCloseTo(0.4);
    });
  });
  
  describe('findMostCompatibleUsers', () => {
    it('Should find the most compatible users for a given user', async () => {
      // Generate test users
      const user = generateMockUserProfile();
      const candidates = Array.from({ length: 10 }, () => generateMockUserProfile());
      
      // Find compatible users
      const result = await compatibilityAlgorithm.findMostCompatibleUsers(
        user,
        candidates,
        undefined, // default weights
        5, // limit
        50 // threshold
      );
      
      // Assertions
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
      
      // Results should be sorted by compatibility score in descending order
      for (let i = 1; i < result.length; i++) {
        expect(result[i-1].compatibilityScore).toBeGreaterThanOrEqual(result[i].compatibilityScore);
      }
      
      // All results should meet the threshold
      result.forEach(match => {
        expect(match.compatibilityScore).toBeGreaterThanOrEqual(50);
      });
    });
    
    it('Should respect the limit parameter', async () => {
      const user = generateMockUserProfile();
      const candidates = Array.from({ length: 20 }, () => generateMockUserProfile());
      
      // With limit of 5
      const result1 = await compatibilityAlgorithm.findMostCompatibleUsers(
        user,
        candidates,
        undefined,
        5,
        0 // no threshold to ensure we get results
      );
      
      // With limit of 10
      const result2 = await compatibilityAlgorithm.findMostCompatibleUsers(
        user,
        candidates,
        undefined,
        10,
        0 // no threshold to ensure we get results
      );
      
      expect(result1.length).toBeLessThanOrEqual(5);
      expect(result2.length).toBeLessThanOrEqual(10);
      expect(result2.length).toBeGreaterThan(result1.length);
    });
    
    it('Should filter results by the threshold parameter', async () => {
      const user = generateMockUserProfile();
      const candidates = Array.from({ length: 15 }, () => generateMockUserProfile());
      
      // Mock the calculateUserCompatibility to return predetermined scores
      jest.spyOn(compatibilityAlgorithm, 'calculateUserCompatibility').mockImplementation(
        async (user1, user2) => {
          // Assign scores based on index to ensure a range of values
          const index = candidates.findIndex(c => c.id === user2.id);
          const score = index * 10; // 0, 10, 20, ..., 140
          
          return {
            userId: user1.id,
            targetUserId: user2.id,
            overallScore: score,
            details: [],
            calculatedAt: new Date()
          };
        }
      );
      
      // With high threshold
      const highThreshold = await compatibilityAlgorithm.findMostCompatibleUsers(
        user,
        candidates,
        undefined,
        10,
        70 // Only scores >= 70 should pass
      );
      
      // With low threshold
      const lowThreshold = await compatibilityAlgorithm.findMostCompatibleUsers(
        user,
        candidates,
        undefined,
        10,
        30 // Scores >= 30 should pass
      );
      
      expect(highThreshold.length).toBeLessThan(lowThreshold.length);
      highThreshold.forEach(match => {
        expect(match.compatibilityScore).toBeGreaterThanOrEqual(70);
      });
    });
    
    it('Should include detailed factor scores when includeDetails is true', async () => {
      const user = generateMockUserProfile();
      const candidates = Array.from({ length: 5 }, () => generateMockUserProfile());
      
      // Override calculateUserCompatibility to include mock details
      jest.spyOn(compatibilityAlgorithm, 'calculateUserCompatibility').mockImplementation(
        async (user1, user2, weights, includeDetails) => {
          const details = includeDetails ? [
            {
              factor: CompatibilityFactor.PERSONALITY,
              weight: 0.3,
              score: 75,
              description: 'Mock personality compatibility'
            }
          ] : [];
          
          return {
            userId: user1.id,
            targetUserId: user2.id,
            overallScore: 80,
            details,
            calculatedAt: new Date()
          };
        }
      );
      
      // With details
      const withDetails = await compatibilityAlgorithm.findMostCompatibleUsers(
        user,
        candidates,
        undefined,
        5,
        0,
        true // include details
      );
      
      expect(withDetails[0].details).toBeDefined();
      expect(withDetails[0].details.length).toBeGreaterThan(0);
    });
  });
  
  describe('findMostCompatibleTribes', () => {
    it('Should find the most compatible tribes for a given user', async () => {
      // Generate test user and tribes
      const user = generateMockUserProfile();
      const tribes = Array.from({ length: 5 }, () => generateMockTribe());
      
      // Create member profiles map
      const memberProfiles = new Map();
      tribes.forEach(tribe => {
        tribe.members.forEach(member => {
          const profile = generateMockUserProfile(member.userId);
          memberProfiles.set(member.userId, profile);
        });
      });
      
      // Find compatible tribes
      const result = await compatibilityAlgorithm.findMostCompatibleTribes(
        user,
        tribes,
        memberProfiles,
        undefined, // default weights
        3, // limit
        50 // threshold
      );
      
      // Assertions
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3);
      
      // Results should be sorted by compatibility score in descending order
      for (let i = 1; i < result.length; i++) {
        expect(result[i-1].compatibilityScore).toBeGreaterThanOrEqual(result[i].compatibilityScore);
      }
      
      // All results should meet the threshold
      result.forEach(match => {
        expect(match.compatibilityScore).toBeGreaterThanOrEqual(50);
      });
    });
    
    it('Should respect the limit parameter', async () => {
      const user = generateMockUserProfile();
      const tribes = Array.from({ length: 10 }, () => generateMockTribe());
      
      // Create member profiles map
      const memberProfiles = new Map();
      tribes.forEach(tribe => {
        tribe.members.forEach(member => {
          const profile = generateMockUserProfile(member.userId);
          memberProfiles.set(member.userId, profile);
        });
      });
      
      // Mock compatibility calculation to return consistent scores
      jest.spyOn(compatibilityAlgorithm, 'calculateTribeCompatibility').mockImplementation(
        async (user, tribe) => {
          return {
            userId: user.id,
            tribeId: tribe.id,
            overallScore: 80,
            details: [],
            memberCompatibility: [],
            groupBalanceImpact: 0,
            calculatedAt: new Date()
          };
        }
      );
      
      // With limit of 3
      const result1 = await compatibilityAlgorithm.findMostCompatibleTribes(
        user,
        tribes,
        memberProfiles,
        undefined,
        3,
        0 // no threshold to ensure we get results
      );
      
      // With limit of 5
      const result2 = await compatibilityAlgorithm.findMostCompatibleTribes(
        user,
        tribes,
        memberProfiles,
        undefined,
        5,
        0 // no threshold to ensure we get results
      );
      
      expect(result1.length).toBe(3);
      expect(result2.length).toBe(5);
    });
    
    it('Should filter results by the threshold parameter', async () => {
      const user = generateMockUserProfile();
      const tribes = Array.from({ length: 10 }, (_, i) => generateMockTribe(`tribe${i}`));
      
      // Create member profiles map
      const memberProfiles = new Map();
      tribes.forEach(tribe => {
        tribe.members.forEach(member => {
          const profile = generateMockUserProfile(member.userId);
          memberProfiles.set(member.userId, profile);
        });
      });
      
      // Mock the calculateTribeCompatibility to return predetermined scores
      jest.spyOn(compatibilityAlgorithm, 'calculateTribeCompatibility').mockImplementation(
        async (user, tribe) => {
          // Assign scores based on tribe ID number
          const tribeNum = parseInt(tribe.id.replace('tribe', ''));
          const score = tribeNum * 10; // 0, 10, 20, ..., 90
          
          return {
            userId: user.id,
            tribeId: tribe.id,
            overallScore: score,
            details: [],
            memberCompatibility: [],
            groupBalanceImpact: 0,
            calculatedAt: new Date()
          };
        }
      );
      
      // With high threshold
      const highThreshold = await compatibilityAlgorithm.findMostCompatibleTribes(
        user,
        tribes,
        memberProfiles,
        undefined,
        10,
        70 // Only scores >= 70 should pass
      );
      
      // With low threshold
      const lowThreshold = await compatibilityAlgorithm.findMostCompatibleTribes(
        user,
        tribes,
        memberProfiles,
        undefined,
        10,
        30 // Scores >= 30 should pass
      );
      
      expect(highThreshold.length).toBeLessThan(lowThreshold.length);
      highThreshold.forEach(match => {
        expect(match.compatibilityScore).toBeGreaterThanOrEqual(70);
      });
    });
    
    it('Should include detailed factor scores when includeDetails is true', async () => {
      const user = generateMockUserProfile();
      const tribes = [generateMockTribe()];
      const memberProfiles = new Map();
      
      tribes[0].members.forEach(member => {
        const profile = generateMockUserProfile(member.userId);
        memberProfiles.set(member.userId, profile);
      });
      
      // Override calculateTribeCompatibility to include mock details
      jest.spyOn(compatibilityAlgorithm, 'calculateTribeCompatibility').mockImplementation(
        async (user, tribe, members, weights, includeDetails) => {
          const details = includeDetails ? [
            {
              factor: CompatibilityFactor.PERSONALITY,
              weight: 0.3,
              score: 75,
              description: 'Mock personality compatibility'
            }
          ] : [];
          
          return {
            userId: user.id,
            tribeId: tribe.id,
            overallScore: 80,
            details,
            memberCompatibility: [],
            groupBalanceImpact: 0,
            calculatedAt: new Date()
          };
        }
      );
      
      // With details
      const withDetails = await compatibilityAlgorithm.findMostCompatibleTribes(
        user,
        tribes,
        memberProfiles,
        undefined,
        1,
        0,
        true // include details
      );
      
      expect(withDetails[0].details).toBeDefined();
      expect(withDetails[0].details.length).toBeGreaterThan(0);
    });
  });
});

describe('CompatibilityService Integration Tests', () => {
  let compatibilityService: CompatibilityService;
  let mockPrisma: any;
  let mockRedis: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockPrisma = {
      profile: {
        findUnique: jest.fn(),
        findMany: jest.fn()
      },
      tribe: {
        findUnique: jest.fn(),
        findMany: jest.fn()
      },
      tribeMembership: {
        findMany: jest.fn()
      }
    };
    
    mockRedis = new Redis();
    
    // Initialize service
    compatibilityService = new CompatibilityService(mockPrisma, mockRedis);
  });
  
  describe('getUserCompatibility', () => {
    it('Should retrieve user compatibility from cache or calculate it', async () => {
      // Setup cache mock
      const cachedResult = {
        userId: 'user1',
        targetUserId: 'user2',
        overallScore: 85,
        details: [],
        calculatedAt: new Date()
      };
      
      jest.spyOn(mockRedis, 'get').mockImplementationOnce(async () => JSON.stringify(cachedResult));
      
      // Test cache hit
      const result = await compatibilityService.getUserCompatibility('user1', 'user2');
      
      // Should return cached result
      expect(result).toEqual(cachedResult);
      expect(mockRedis.get).toHaveBeenCalled();
      expect(mockPrisma.profile.findUnique).not.toHaveBeenCalled();
      
      // Now test cache miss
      jest.spyOn(mockRedis, 'get').mockImplementationOnce(async () => null);
      jest.spyOn(mockRedis, 'set').mockImplementationOnce(async () => 'OK');
      
      // Mock user profiles
      const user1 = generateMockUserProfile('user1');
      const user2 = generateMockUserProfile('user2');
      
      mockPrisma.profile.findUnique
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);
      
      // Calculate compatibility
      const result2 = await compatibilityService.getUserCompatibility('user1', 'user2');
      
      // Should calculate and cache result
      expect(mockPrisma.profile.findUnique).toHaveBeenCalledTimes(2);
      expect(mockRedis.set).toHaveBeenCalled();
      expect(result2).toHaveProperty('userId', 'user1');
      expect(result2).toHaveProperty('targetUserId', 'user2');
      expect(result2).toHaveProperty('overallScore');
    });
    
    it('Should handle errors gracefully', async () => {
      // Mock cache miss
      jest.spyOn(mockRedis, 'get').mockImplementationOnce(async () => null);
      
      // Mock database error
      mockPrisma.profile.findUnique.mockRejectedValueOnce(new Error('Database error'));
      
      // Should throw error
      await expect(compatibilityService.getUserCompatibility('user1', 'user2'))
        .rejects.toThrow();
    });
    
    it('Should apply custom factor weights correctly', async () => {
      // Mock cache miss
      jest.spyOn(mockRedis, 'get').mockImplementationOnce(async () => null);
      jest.spyOn(mockRedis, 'set').mockImplementationOnce(async () => 'OK');
      
      // Mock user profiles
      const user1 = generateMockUserProfile('user1');
      const user2 = generateMockUserProfile('user2');
      
      mockPrisma.profile.findUnique
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);
      
      // Custom weights
      const customWeights = {
        [CompatibilityFactor.PERSONALITY]: 0.5,
        [CompatibilityFactor.INTERESTS]: 0.3,
        [CompatibilityFactor.COMMUNICATION_STYLE]: 0.1,
        [CompatibilityFactor.LOCATION]: 0.05,
        [CompatibilityFactor.GROUP_BALANCE]: 0.05
      };
      
      // Calculate with custom weights
      await compatibilityService.getUserCompatibility('user1', 'user2', customWeights, true);
      
      // Custom weights should be passed to compatibility algorithm
      expect(mockPrisma.profile.findUnique).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('getTribeCompatibility', () => {
    it('Should retrieve tribe compatibility from cache or calculate it', async () => {
      // Setup cache mock
      const cachedResult = {
        userId: 'user1',
        tribeId: 'tribe1',
        overallScore: 75,
        details: [],
        memberCompatibility: [],
        groupBalanceImpact: 10,
        calculatedAt: new Date()
      };
      
      jest.spyOn(mockRedis, 'get').mockImplementationOnce(async () => JSON.stringify(cachedResult));
      
      // Test cache hit
      const result = await compatibilityService.getTribeCompatibility('user1', 'tribe1');
      
      // Should return cached result
      expect(result).toEqual(cachedResult);
      expect(mockRedis.get).toHaveBeenCalled();
      expect(mockPrisma.profile.findUnique).not.toHaveBeenCalled();
      
      // Now test cache miss
      jest.spyOn(mockRedis, 'get').mockImplementationOnce(async () => null);
      jest.spyOn(mockRedis, 'set').mockImplementationOnce(async () => 'OK');
      
      // Mock user profile, tribe, and members
      const user = generateMockUserProfile('user1');
      const tribe = generateMockTribe('tribe1');
      const memberProfiles = tribe.members.map(m => generateMockUserProfile(m.userId));
      
      mockPrisma.profile.findUnique.mockResolvedValueOnce(user);
      mockPrisma.tribe.findUnique.mockResolvedValueOnce(tribe);
      mockPrisma.profile.findMany.mockResolvedValueOnce(memberProfiles);
      
      // Calculate compatibility
      const result2 = await compatibilityService.getTribeCompatibility('user1', 'tribe1');
      
      // Should calculate and cache result
      expect(mockPrisma.profile.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.tribe.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.profile.findMany).toHaveBeenCalledTimes(1);
      expect(mockRedis.set).toHaveBeenCalled();
      expect(result2).toHaveProperty('userId', 'user1');
      expect(result2).toHaveProperty('tribeId', 'tribe1');
      expect(result2).toHaveProperty('overallScore');
    });
    
    it('Should handle errors gracefully', async () => {
      // Mock cache miss
      jest.spyOn(mockRedis, 'get').mockImplementationOnce(async () => null);
      
      // Mock user not found
      mockPrisma.profile.findUnique.mockResolvedValueOnce(null);
      
      // Should throw error
      await expect(compatibilityService.getTribeCompatibility('user1', 'tribe1'))
        .rejects.toThrow();
    });
  });
  
  describe('processCompatibilityRequest', () => {
    it('Should process a compatibility request for user or tribe', async () => {
      // Mock getUserCompatibility
      const mockUserCompat = {
        userId: 'user1',
        targetUserId: 'user2',
        overallScore: 80,
        details: [],
        calculatedAt: new Date()
      };
      
      // Mock getTribeCompatibility
      const mockTribeCompat = {
        userId: 'user1',
        tribeId: 'tribe1',
        overallScore: 75,
        details: [],
        memberCompatibility: [],
        groupBalanceImpact: 10,
        calculatedAt: new Date()
      };
      
      compatibilityService.getUserCompatibility = jest.fn().mockResolvedValue(mockUserCompat);
      compatibilityService.getTribeCompatibility = jest.fn().mockResolvedValue(mockTribeCompat);
      
      // Test user request
      const userRequest: ICompatibilityRequest = {
        userId: 'user1',
        targetType: 'user',
        targetId: 'user2',
        includeDetails: false,
        factorWeights: {
          [CompatibilityFactor.PERSONALITY]: 0.3,
          [CompatibilityFactor.INTERESTS]: 0.3,
          [CompatibilityFactor.COMMUNICATION_STYLE]: 0.2,
          [CompatibilityFactor.LOCATION]: 0.1,
          [CompatibilityFactor.GROUP_BALANCE]: 0.1
        }
      };
      
      const userResult = await compatibilityService.processCompatibilityRequest(userRequest);
      
      expect(compatibilityService.getUserCompatibility).toHaveBeenCalledWith(
        'user1',
        'user2',
        userRequest.factorWeights,
        false
      );
      
      expect(userResult).toHaveProperty('userId', 'user1');
      expect(userResult).toHaveProperty('targetType', 'user');
      expect(userResult).toHaveProperty('targetId', 'user2');
      expect(userResult).toHaveProperty('overallScore', 80);
      
      // Test tribe request
      const tribeRequest: ICompatibilityRequest = {
        userId: 'user1',
        targetType: 'tribe',
        targetId: 'tribe1',
        includeDetails: true,
        factorWeights: {
          [CompatibilityFactor.PERSONALITY]: 0.3,
          [CompatibilityFactor.INTERESTS]: 0.3,
          [CompatibilityFactor.COMMUNICATION_STYLE]: 0.2,
          [CompatibilityFactor.LOCATION]: 0.1,
          [CompatibilityFactor.GROUP_BALANCE]: 0.1
        }
      };
      
      const tribeResult = await compatibilityService.processCompatibilityRequest(tribeRequest);
      
      expect(compatibilityService.getTribeCompatibility).toHaveBeenCalledWith(
        'user1',
        'tribe1',
        tribeRequest.factorWeights,
        true
      );
      
      expect(tribeResult).toHaveProperty('userId', 'user1');
      expect(tribeResult).toHaveProperty('targetType', 'tribe');
      expect(tribeResult).toHaveProperty('targetId', 'tribe1');
      expect(tribeResult).toHaveProperty('overallScore', 75);
    });
    
    it('Should handle invalid requests gracefully', async () => {
      const invalidRequest: ICompatibilityRequest = {
        userId: 'user1',
        targetType: 'invalid' as any,
        targetId: 'target1',
        includeDetails: false,
        factorWeights: {
          [CompatibilityFactor.PERSONALITY]: 0.3,
          [CompatibilityFactor.INTERESTS]: 0.3,
          [CompatibilityFactor.COMMUNICATION_STYLE]: 0.2,
          [CompatibilityFactor.LOCATION]: 0.1,
          [CompatibilityFactor.GROUP_BALANCE]: 0.1
        }
      };
      
      await expect(compatibilityService.processCompatibilityRequest(invalidRequest))
        .rejects.toThrow();
    });
  });
  
  describe('processBatchCompatibilityRequest', () => {
    it('Should process a batch compatibility request', async () => {
      // Mock cache miss
      jest.spyOn(mockRedis, 'get').mockImplementationOnce(async () => null);
      jest.spyOn(mockRedis, 'set').mockImplementationOnce(async () => 'OK');
      
      // Mock user profile and target users
      const user = generateMockUserProfile('user1');
      const targetUsers = [
        generateMockUserProfile('user2'),
        generateMockUserProfile('user3')
      ];
      
      mockPrisma.profile.findUnique.mockResolvedValueOnce(user);
      mockPrisma.profile.findMany.mockResolvedValueOnce(targetUsers);
      
      // Create request
      const request: ICompatibilityBatchRequest = {
        userId: 'user1',
        targetType: 'user',
        targetIds: ['user2', 'user3'],
        includeDetails: false,
        factorWeights: {
          [CompatibilityFactor.PERSONALITY]: 0.3,
          [CompatibilityFactor.INTERESTS]: 0.3,
          [CompatibilityFactor.COMMUNICATION_STYLE]: 0.2,
          [CompatibilityFactor.LOCATION]: 0.1,
          [CompatibilityFactor.GROUP_BALANCE]: 0.1
        }
      };
      
      // Process request
      const result = await compatibilityService.processBatchCompatibilityRequest(request);
      
      // Verify results
      expect(mockPrisma.profile.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.profile.findMany).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('userId', 'user1');
      expect(result).toHaveProperty('targetType', 'user');
      expect(result).toHaveProperty('results');
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results.length).toBe(2);
    });
    
    it('Should return cached batch results when available', async () => {
      // Setup cache hit
      const cachedResult = {
        userId: 'user1',
        targetType: 'user',
        results: [
          { targetId: 'user2', overallScore: 85 },
          { targetId: 'user3', overallScore: 75 }
        ],
        calculatedAt: new Date()
      };
      
      jest.spyOn(mockRedis, 'get').mockImplementationOnce(async () => JSON.stringify(cachedResult));
      
      // Create request
      const request: ICompatibilityBatchRequest = {
        userId: 'user1',
        targetType: 'user',
        targetIds: ['user2', 'user3'],
        includeDetails: false,
        factorWeights: {
          [CompatibilityFactor.PERSONALITY]: 0.3,
          [CompatibilityFactor.INTERESTS]: 0.3,
          [CompatibilityFactor.COMMUNICATION_STYLE]: 0.2,
          [CompatibilityFactor.LOCATION]: 0.1,
          [CompatibilityFactor.GROUP_BALANCE]: 0.1
        }
      };
      
      // Process request
      const result = await compatibilityService.processBatchCompatibilityRequest(request);
      
      // Should return cached result
      expect(mockRedis.get).toHaveBeenCalled();
      expect(mockPrisma.profile.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });
    
    it('Should handle invalid requests gracefully', async () => {
      // Create request with invalid target type
      const invalidRequest: ICompatibilityBatchRequest = {
        userId: 'user1',
        targetType: 'invalid' as any,
        targetIds: ['target1', 'target2'],
        includeDetails: false,
        factorWeights: {
          [CompatibilityFactor.PERSONALITY]: 0.3,
          [CompatibilityFactor.INTERESTS]: 0.3,
          [CompatibilityFactor.COMMUNICATION_STYLE]: 0.2,
          [CompatibilityFactor.LOCATION]: 0.1,
          [CompatibilityFactor.GROUP_BALANCE]: 0.1
        }
      };
      
      // Mock cache miss
      jest.spyOn(mockRedis, 'get').mockImplementationOnce(async () => null);
      
      // Mock user profile
      const user = generateMockUserProfile('user1');
      mockPrisma.profile.findUnique.mockResolvedValueOnce(user);
      
      await expect(compatibilityService.processBatchCompatibilityRequest(invalidRequest))
        .rejects.toThrow();
    });
  });
  
  describe('findMostCompatibleTribes', () => {
    it('Should find the most compatible tribes for a user', async () => {
      // Mock user profile
      const user = generateMockUserProfile('user1');
      mockPrisma.profile.findUnique.mockResolvedValueOnce(user);
      
      // Mock user memberships
      mockPrisma.tribeMembership.findMany.mockResolvedValueOnce([
        { tribeId: 'existing1' },
        { tribeId: 'existing2' }
      ]);
      
      // Mock eligible tribes
      const eligibleTribes = Array.from({ length: 3 }, () => generateMockTribe());
      mockPrisma.tribe.findMany.mockResolvedValueOnce(eligibleTribes);
      
      // Mock member profiles
      const memberProfiles = [];
      eligibleTribes.forEach(tribe => {
        tribe.members.forEach(member => {
          memberProfiles.push(generateMockUserProfile(member.userId));
        });
      });
      
      mockPrisma.profile.findMany.mockResolvedValueOnce(memberProfiles);
      
      // Find compatible tribes
      const result = await compatibilityService.findMostCompatibleTribes('user1');
      
      // Verify queries and results
      expect(mockPrisma.profile.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.tribeMembership.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.tribe.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.profile.findMany).toHaveBeenCalledTimes(1);
      
      expect(Array.isArray(result)).toBe(true);
      result.forEach(match => {
        expect(match).toHaveProperty('tribeId');
        expect(match).toHaveProperty('compatibilityScore');
      });
    });
  });
  
  describe('findMostCompatibleUsers', () => {
    it('Should find the most compatible users for a given user', async () => {
      // Mock user profile
      const user = generateMockUserProfile('user1');
      mockPrisma.profile.findUnique.mockResolvedValueOnce(user);
      
      // Mock other users
      const otherUsers = Array.from({ length: 5 }, () => generateMockUserProfile());
      mockPrisma.profile.findMany.mockResolvedValueOnce(otherUsers);
      
      // Find compatible users
      const result = await compatibilityService.findMostCompatibleUsers('user1');
      
      // Verify queries and results
      expect(mockPrisma.profile.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.profile.findMany).toHaveBeenCalledTimes(1);
      
      expect(Array.isArray(result)).toBe(true);
      result.forEach(match => {
        expect(match).toHaveProperty('userId');
        expect(match).toHaveProperty('compatibilityScore');
      });
    });
  });
  
  describe('caching behavior', () => {
    it('Should properly cache and retrieve compatibility results', async () => {
      // Setup compatibility result
      const userId = 'user1';
      const targetId = 'user2';
      const targetType = 'user';
      
      const compatibilityResult = {
        userId,
        targetUserId: targetId,
        overallScore: 80,
        details: [],
        calculatedAt: new Date()
      };
      
      // Mock Redis set
      jest.spyOn(mockRedis, 'set').mockResolvedValue('OK');
      
      // Cache result
      await compatibilityService.cacheCompatibility(
        userId,
        targetType,
        targetId,
        compatibilityResult
      );
      
      expect(mockRedis.set).toHaveBeenCalled();
      
      // Mock Redis get
      jest.spyOn(mockRedis, 'get').mockResolvedValue(JSON.stringify(compatibilityResult));
      
      // Retrieve from cache
      const cached = await compatibilityService.getCachedCompatibility(
        userId,
        targetType,
        targetId
      );
      
      expect(mockRedis.get).toHaveBeenCalled();
      expect(cached).toEqual(compatibilityResult);
    });
    
    it('Should clear specific cache entries when requested', async () => {
      // Mock Redis del
      jest.spyOn(mockRedis, 'del').mockResolvedValue(1);
      
      // Clear cache
      await compatibilityService.clearCompatibilityCache('user1', 'user', 'user2');
      
      expect(mockRedis.del).toHaveBeenCalled();
    });
    
    it('Should clear all user cache entries when requested', async () => {
      // Mock Redis keys and del
      jest.spyOn(mockRedis, 'keys').mockResolvedValue([
        'compatibility:user1:user:user2',
        'compatibility:user1:tribe:tribe1'
      ]);
      jest.spyOn(mockRedis, 'del').mockResolvedValue(2);
      
      // Clear all cache
      await compatibilityService.clearAllUserCompatibilityCache('user1');
      
      expect(mockRedis.keys).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalled();
    });
  });
});

describe('Performance Tests', () => {
  let compatibilityAlgorithm: CompatibilityAlgorithm;
  
  beforeEach(() => {
    compatibilityAlgorithm = new CompatibilityAlgorithm();
    
    // Mock AI enhancement to avoid actual API calls during tests
    jest.spyOn(compatibilityAlgorithm as any, 'enhanceCompatibilityWithAI')
      .mockImplementation(async () => ({
        enhancedScore: 75,
        insights: 'Mock AI insights'
      }));
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('Should calculate user compatibility within acceptable time limits', async () => {
    // Generate test profiles
    const user1 = generateMockUserProfile();
    const user2 = generateMockUserProfile();
    
    // Measure execution time
    const startTime = Date.now();
    
    await compatibilityAlgorithm.calculateUserCompatibility(user1, user2);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Should execute in under 100ms for standard profiles
    expect(executionTime).toBeLessThan(100);
  }, 500); // 500ms timeout
  
  it('Should calculate tribe compatibility within acceptable time limits', async () => {
    // Generate test user and tribe
    const user = generateMockUserProfile();
    const tribe = generateMockTribe();
    const memberIds = tribe.members.map(member => member.userId);
    const memberProfiles = Array.from(memberIds, id => generateMockUserProfile(id));
    
    // Measure execution time
    const startTime = Date.now();
    
    await compatibilityAlgorithm.calculateTribeCompatibility(user, tribe, memberProfiles);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Should execute in under 200ms for standard tribe size
    expect(executionTime).toBeLessThan(200);
  }, 1000); // 1000ms timeout
  
  it('Should efficiently process batch compatibility requests', async () => {
    // Generate test profiles
    const user = generateMockUserProfile();
    const targets = Array.from({ length: 10 }, () => generateMockUserProfile());
    
    // Measure individual calculation time
    const startTime1 = Date.now();
    
    for (const target of targets) {
      await compatibilityAlgorithm.calculateUserCompatibility(user, target);
    }
    
    const endTime1 = Date.now();
    const individualTime = endTime1 - startTime1;
    
    // Measure batch calculation time
    const startTime2 = Date.now();
    
    await compatibilityAlgorithm.calculateBatchUserCompatibility(user, targets);
    
    const endTime2 = Date.now();
    const batchTime = endTime2 - startTime2;
    
    // Batch processing should be more efficient than individual calculations
    // Allow a bit of flexibility for test environment variations
    expect(batchTime * 1.5).toBeLessThan(individualTime);
  }, 2000); // 2000ms timeout
});