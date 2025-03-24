import jest from 'jest';
import {
  ClusteringAlgorithm,
  calculateHaversineDistance,
  calculateJaccardSimilarity
} from '../src/algorithms/clustering.algorithm';
import {
  CompatibilityAlgorithm,
  calculatePersonalityCompatibility,
  calculateInterestCompatibility,
  calculateCommunicationCompatibility,
  calculateLocationCompatibility,
  calculateGroupBalanceImpact
} from '../src/algorithms/compatibility.algorithm';
import {
  TribeFormationAlgorithm
} from '../src/algorithms/tribe-formation.algorithm';
import {
  CompatibilityFactor
} from '../src/models/compatibility.model';
import {
  IProfile,
  IPersonalityTrait,
  IInterest,
  ICoordinates,
  PersonalityTrait,
  InterestCategory,
  CommunicationStyle
} from '../../shared/src/types/profile.types';
import {
  ITribe,
  ITribeMembership
} from '../../shared/src/types/tribe.types';

/**
 * Creates test user profiles with different personality traits, interests, and locations
 */
function createTestUserProfiles(count: number): Array<IProfile> {
  const profiles: Array<IProfile> = [];
  
  for (let i = 0; i < count; i++) {
    profiles.push({
      id: `user-${i}`,
      userId: `user-${i}`, 
      name: `User ${i}`,
      bio: `Bio for user ${i}`,
      location: `Location ${i}`,
      coordinates: {
        latitude: 40 + (i * 0.01), // Small variations in latitude
        longitude: -74 + (i * 0.01) // Small variations in longitude
      },
      birthdate: new Date(1990, 0, 1),
      phoneNumber: `555-000-${1000 + i}`,
      avatarUrl: `https://example.com/avatar/${i}.jpg`,
      communicationStyle: Object.values(CommunicationStyle)[i % Object.values(CommunicationStyle).length],
      maxTravelDistance: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
      personalityTraits: [
        {
          id: `trait-${i}-1`,
          profileId: `user-${i}`,
          trait: PersonalityTrait.OPENNESS,
          score: 50 + (i % 5) * 10, // Vary scores between users
          assessedAt: new Date()
        },
        {
          id: `trait-${i}-2`,
          profileId: `user-${i}`,
          trait: PersonalityTrait.CONSCIENTIOUSNESS,
          score: 60 + (i % 4) * 10,
          assessedAt: new Date()
        },
        {
          id: `trait-${i}-3`,
          profileId: `user-${i}`,
          trait: PersonalityTrait.EXTRAVERSION,
          score: 40 + (i % 6) * 10,
          assessedAt: new Date()
        },
        {
          id: `trait-${i}-4`,
          profileId: `user-${i}`,
          trait: PersonalityTrait.AGREEABLENESS,
          score: 70 + (i % 3) * 10,
          assessedAt: new Date()
        },
        {
          id: `trait-${i}-5`,
          profileId: `user-${i}`,
          trait: PersonalityTrait.NEUROTICISM,
          score: 30 + (i % 7) * 10,
          assessedAt: new Date()
        }
      ],
      interests: [
        {
          id: `interest-${i}-1`,
          profileId: `user-${i}`,
          category: InterestCategory.OUTDOOR_ADVENTURES,
          name: 'Hiking',
          level: 3
        },
        {
          id: `interest-${i}-2`,
          profileId: `user-${i}`,
          category: InterestCategory.FOOD_DINING,
          name: 'Restaurants',
          level: 2
        },
        {
          id: `interest-${i}-3`,
          profileId: `user-${i}`,
          category: Object.values(InterestCategory)[i % Object.values(InterestCategory).length],
          name: `Interest ${i}`,
          level: (i % 3) + 1
        }
      ]
    });
  }
  
  return profiles;
}

/**
 * Creates test tribes with different member compositions
 */
function createTestTribes(count: number, membersPerTribe: number): Array<ITribe> {
  const tribes: Array<ITribe> = [];
  
  for (let i = 0; i < count; i++) {
    const members: Array<ITribeMembership> = [];
    
    for (let j = 0; j < membersPerTribe; j++) {
      members.push({
        id: `membership-${i}-${j}`,
        tribeId: `tribe-${i}`,
        userId: `existing-user-${i * membersPerTribe + j}`,
        role: 'member',
        status: 'active',
        joinedAt: new Date(),
        lastActive: new Date()
      });
    }
    
    tribes.push({
      id: `tribe-${i}`,
      name: `Tribe ${i}`,
      description: `Description for Tribe ${i}`,
      location: `Location ${i}`,
      coordinates: {
        latitude: 40 + (i * 0.01),
        longitude: -74 + (i * 0.01)
      },
      imageUrl: `https://example.com/tribe/${i}.jpg`,
      status: 'active',
      privacy: 'public',
      maxMembers: 8, // TRIBE_LIMITS.MAX_MEMBERS
      createdBy: `existing-user-${i * membersPerTribe}`,
      createdAt: new Date(),
      lastActive: new Date(),
      interests: [],
      members,
      activities: [],
      goals: [],
      metadata: {}
    });
  }
  
  return tribes;
}

/**
 * Creates a mock CompatibilityAlgorithm for testing
 */
function createCompatibilityAlgorithmMock(): CompatibilityAlgorithm {
  const mock = {
    calculateUserCompatibility: jest.fn().mockResolvedValue({
      userId: 'user-1',
      targetUserId: 'user-2',
      overallScore: 85,
      details: [],
      calculatedAt: new Date()
    }),
    
    calculateTribeCompatibility: jest.fn().mockResolvedValue({
      userId: 'user-1',
      tribeId: 'tribe-1',
      overallScore: 80,
      details: [],
      memberCompatibility: [],
      groupBalanceImpact: 5,
      calculatedAt: new Date()
    }),
    
    calculateBatchUserCompatibility: jest.fn().mockResolvedValue([
      {
        userId: 'user-1',
        targetUserId: 'user-2',
        overallScore: 85,
        details: [],
        calculatedAt: new Date()
      },
      {
        userId: 'user-1',
        targetUserId: 'user-3',
        overallScore: 75,
        details: [],
        calculatedAt: new Date()
      }
    ]),
    
    findMostCompatibleTribes: jest.fn().mockResolvedValue([
      { tribeId: 'tribe-1', compatibilityScore: 85 },
      { tribeId: 'tribe-2', compatibilityScore: 75 }
    ]),
    
    findMostCompatibleUsers: jest.fn().mockResolvedValue([
      { userId: 'user-2', compatibilityScore: 85 },
      { userId: 'user-3', compatibilityScore: 75 }
    ])
  };
  
  return mock as unknown as CompatibilityAlgorithm;
}

describe('ClusteringAlgorithm', () => {
  it('should form tribes based on user profiles', async () => {
    // Create test data
    const users = createTestUserProfiles(20);
    
    // Create mock compatibility algorithm
    const mockCompatibilityAlgorithm = {
      calculateUserCompatibility: jest.fn().mockResolvedValue({ overallScore: 85 }),
      calculateBatchUserCompatibility: jest.fn().mockImplementation(async (users) => {
        // Create a compatibility matrix with reasonable scores
        const result: Record<string, Record<string, number>> = {};
        
        for (const user1 of users) {
          result[user1.id] = {};
          for (const user2 of users) {
            if (user1.id !== user2.id) {
              // Assign higher compatibility to users with closer indices
              const idDiff = Math.abs(parseInt(user1.id.split('-')[1]) - parseInt(user2.id.split('-')[1]));
              const score = Math.max(60, 100 - idDiff * 5); // Higher score for closer indices
              result[user1.id][user2.id] = score;
            }
          }
        }
        
        return result;
      })
    };
    
    // Create clustering algorithm
    const clusteringAlgorithm = new ClusteringAlgorithm(
      mockCompatibilityAlgorithm as any
    );
    
    // Call the formTribes method
    const result = await clusteringAlgorithm.formTribes(users);
    
    // Assertions
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    // Verify tribe size constraints (4-8 members)
    for (const tribe of result) {
      expect(tribe.members.length).toBeGreaterThanOrEqual(4);
      expect(tribe.members.length).toBeLessThanOrEqual(8);
    }
    
    // Verify all users are assigned to a tribe
    const assignedUserIds = result.flatMap(tribe => tribe.members.map(m => m.userId));
    expect(assignedUserIds.length).toBe(users.length);
    
    // Verify each user is assigned exactly once
    const userIdSet = new Set(assignedUserIds);
    expect(userIdSet.size).toBe(users.length);
    
    // Verify the compatibility scores are reasonable
    for (const tribe of result) {
      for (const member of tribe.members) {
        expect(member.compatibilityScore).toBeGreaterThanOrEqual(0);
        expect(member.compatibilityScore).toBeLessThanOrEqual(100);
      }
    }
  });
  
  it('should respect minimum and maximum group size constraints', async () => {
    // Create test data
    const users = createTestUserProfiles(25);
    
    // Create mock compatibility algorithm
    const mockCompatibilityAlgorithm = {
      calculateUserCompatibility: jest.fn().mockResolvedValue({ overallScore: 85 }),
      calculateBatchUserCompatibility: jest.fn().mockImplementation(async () => {
        const result: Record<string, Record<string, number>> = {};
        users.forEach(user1 => {
          result[user1.id] = {};
          users.forEach(user2 => {
            if (user1.id !== user2.id) {
              result[user1.id][user2.id] = 80; // High compatibility for everyone
            }
          });
        });
        return result;
      })
    };
    
    // Create clustering algorithm with custom min/max group sizes
    const clusteringAlgorithm = new ClusteringAlgorithm(
      mockCompatibilityAlgorithm as any,
      {
        minGroupSize: 5,
        maxGroupSize: 7
      }
    );
    
    // Call the formTribes method
    const result = await clusteringAlgorithm.formTribes(users);
    
    // Assertions
    for (const tribe of result) {
      expect(tribe.members.length).toBeGreaterThanOrEqual(5);
      expect(tribe.members.length).toBeLessThanOrEqual(7);
    }
  });
  
  it('should form tribes based on geographic proximity', async () => {
    // Create test data with specific geographic coordinates
    const users = createTestUserProfiles(20);
    
    // Modify some coordinates to create distinct geographic clusters
    for (let i = 0; i < 10; i++) {
      users[i].coordinates = { latitude: 40 + (i * 0.001), longitude: -74 + (i * 0.001) }; // NYC area
    }
    
    for (let i = 10; i < 20; i++) {
      users[i].coordinates = { latitude: 34 + ((i-10) * 0.001), longitude: -118 + ((i-10) * 0.001) }; // LA area
    }
    
    // Create mock compatibility algorithm
    const mockCompatibilityAlgorithm = {
      calculateUserCompatibility: jest.fn().mockResolvedValue({ overallScore: 85 }),
      calculateBatchUserCompatibility: jest.fn().mockResolvedValue({})
    };
    
    // Create clustering algorithm with a specific maxDistance
    const maxDistance = 50; // miles
    const clusteringAlgorithm = new ClusteringAlgorithm(
      mockCompatibilityAlgorithm as any,
      { maxDistance }
    );
    
    // Call the formTribes method
    const result = await clusteringAlgorithm.formTribes(users);
    
    // Assertions
    // Users should be grouped by geographic proximity
    for (const tribe of result) {
      const memberIds = tribe.members.map(m => m.userId);
      const tribeUsers = users.filter(u => memberIds.includes(u.id));
      
      // Check that all users in a tribe are within maxDistance of each other
      for (let i = 0; i < tribeUsers.length; i++) {
        for (let j = i + 1; j < tribeUsers.length; j++) {
          const distance = calculateHaversineDistance(
            tribeUsers[i].coordinates,
            tribeUsers[j].coordinates
          );
          
          // Convert km to miles (as maxDistance is in miles)
          const distanceInMiles = distance * 0.621371;
          expect(distanceInMiles).toBeLessThanOrEqual(maxDistance);
        }
      }
    }
  });
  
  it('should find existing tribe matches for users', async () => {
    // Create test data
    const users = createTestUserProfiles(10);
    const existingTribes = createTestTribes(3, 4); // 3 tribes with 4 members each
    
    // Create mock compatibility algorithm
    const mockCompatibilityAlgorithm = {
      calculateUserCompatibility: jest.fn().mockResolvedValue({ overallScore: 85 }),
      calculateBatchUserCompatibility: jest.fn().mockResolvedValue({})
    };
    
    // Create clustering algorithm
    const clusteringAlgorithm = new ClusteringAlgorithm(
      mockCompatibilityAlgorithm as any
    );
    
    // Mock the calculateUserToTribeCompatibility method by monkey-patching
    clusteringAlgorithm['calculateUserToTribeCompatibility'] = jest.fn().mockImplementation(
      async (user) => {
        // Generate compatibility scores based on user index
        const userIndex = parseInt(user.id.split('-')[1]);
        return existingTribes.map((tribe, i) => ({
          tribeId: tribe.id,
          compatibilityScore: userIndex % 3 === i ? 85 : 65 // Higher compatibility with one tribe
        }));
      }
    );
    
    // Call the findExistingTribeMatches method
    const result = await clusteringAlgorithm.findExistingTribeMatches(
      users,
      existingTribes,
      []
    );
    
    // Assertions
    expect(result).toBeDefined();
    expect(result.assignments).toBeDefined();
    expect(result.remainingUsers).toBeDefined();
    
    // Verify that some users are assigned to tribes
    expect(result.assignments.size).toBeGreaterThan(0);
    
    // Verify that tribe capacity constraints are respected
    const tribeAssignmentCounts: Record<string, number> = {};
    for (const [_, assignment] of result.assignments.entries()) {
      tribeAssignmentCounts[assignment.tribeId] = (tribeAssignmentCounts[assignment.tribeId] || 0) + 1;
    }
    
    for (const tribe of existingTribes) {
      const existingMemberCount = tribe.members.length;
      const newMemberCount = tribeAssignmentCounts[tribe.id] || 0;
      expect(existingMemberCount + newMemberCount).toBeLessThanOrEqual(tribe.maxMembers);
    }
    
    // Verify that remaining users + assigned users = total users
    expect(result.remainingUsers.length + result.assignments.size).toBe(users.length);
  });
  
  it('should create new tribes for unmatched users', async () => {
    // Create test data
    const users = createTestUserProfiles(20);
    
    // Create mock compatibility algorithm
    const mockCompatibilityAlgorithm = {
      calculateUserCompatibility: jest.fn().mockResolvedValue({ overallScore: 85 }),
      calculateBatchUserCompatibility: jest.fn().mockImplementation(async () => {
        const result: Record<string, Record<string, number>> = {};
        users.forEach(user1 => {
          result[user1.id] = {};
          users.forEach(user2 => {
            if (user1.id !== user2.id) {
              // Assign compatibility based on user indices
              const id1 = parseInt(user1.id.split('-')[1]);
              const id2 = parseInt(user2.id.split('-')[1]);
              const score = 100 - Math.abs(id1 - id2) * 5;
              result[user1.id][user2.id] = Math.max(60, score);
            }
          });
        });
        return result;
      })
    };
    
    // Create clustering algorithm
    const clusteringAlgorithm = new ClusteringAlgorithm(
      mockCompatibilityAlgorithm as any
    );
    
    // Call the createNewTribes method
    const result = await clusteringAlgorithm.createNewTribes(users);
    
    // Assertions
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    // Verify all users are assigned to a tribe
    const assignedUserIds = result.flatMap(tribe => tribe.members.map(m => m.userId));
    expect(assignedUserIds.length).toBe(users.length);
    
    // Verify tribe size constraints
    for (const tribe of result) {
      expect(tribe.members.length).toBeGreaterThanOrEqual(4);
      expect(tribe.members.length).toBeLessThanOrEqual(8);
    }
  });
});

describe('CompatibilityAlgorithm', () => {
  it('should calculate compatibility between two users', async () => {
    // Create test data
    const user1 = createTestUserProfiles(1)[0];
    const user2 = createTestUserProfiles(1)[0];
    
    // Modify user2 to create some differences
    user2.id = 'user-2';
    user2.personalityTraits.forEach(trait => {
      trait.profileId = 'user-2';
      trait.score = Math.min(100, trait.score + 10); // Slightly different scores
    });
    
    user2.interests[0].name = 'Camping'; // Different from user1's 'Hiking'
    user2.communicationStyle = CommunicationStyle.ANALYTICAL;
    
    // Create compatibility algorithm
    const compatibilityAlgorithm = new CompatibilityAlgorithm();
    
    // Mock the AI client to prevent actual API calls
    compatibilityAlgorithm['aiClient'] = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'SCORE: 78\nINSIGHTS: These users have complementary traits...' } }]
          })
        }
      }
    } as any;
    
    // Call the calculateUserCompatibility method
    const result = await compatibilityAlgorithm.calculateUserCompatibility(user1, user2, undefined, true);
    
    // Assertions
    expect(result).toBeDefined();
    expect(result.userId).toBe(user1.id);
    expect(result.targetUserId).toBe(user2.id);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    
    // Verify that details are included when requested
    expect(result.details).toBeDefined();
    expect(result.details.length).toBeGreaterThan(0);
    
    // Verify that all compatibility factors are included
    const factorTypes = result.details.map(d => d.factor);
    expect(factorTypes).toContain(CompatibilityFactor.PERSONALITY);
    expect(factorTypes).toContain(CompatibilityFactor.INTERESTS);
    expect(factorTypes).toContain(CompatibilityFactor.COMMUNICATION_STYLE);
    expect(factorTypes).toContain(CompatibilityFactor.LOCATION);
  });
  
  it('should calculate compatibility between a user and a tribe', async () => {
    // Create test data
    const user = createTestUserProfiles(1)[0];
    const tribe = createTestTribes(1, 3)[0]; // 1 tribe with 3 members
    const tribeMembers = createTestUserProfiles(3);
    
    // Adjust tribe members' IDs to match the tribe memberships
    tribeMembers.forEach((member, i) => {
      member.id = `existing-user-${i}`;
      member.personalityTraits.forEach(trait => {
        trait.profileId = member.id;
      });
      tribe.members[i].userId = member.id;
    });
    
    // Create compatibility algorithm
    const compatibilityAlgorithm = new CompatibilityAlgorithm();
    
    // Mock the AI client to prevent actual API calls
    compatibilityAlgorithm['aiClient'] = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'SCORE: 78\nINSIGHTS: This user would be a good fit...' } }]
          })
        }
      }
    } as any;
    
    // Call the calculateTribeCompatibility method
    const result = await compatibilityAlgorithm.calculateTribeCompatibility(
      user,
      tribe,
      tribeMembers,
      undefined,
      true
    );
    
    // Assertions
    expect(result).toBeDefined();
    expect(result.userId).toBe(user.id);
    expect(result.tribeId).toBe(tribe.id);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    
    // Verify that details are included when requested
    expect(result.details).toBeDefined();
    expect(result.details.length).toBeGreaterThan(0);
    
    // Verify that all compatibility factors are included
    const factorTypes = result.details.map(d => d.factor);
    expect(factorTypes).toContain(CompatibilityFactor.PERSONALITY);
    expect(factorTypes).toContain(CompatibilityFactor.INTERESTS);
    expect(factorTypes).toContain(CompatibilityFactor.COMMUNICATION_STYLE);
    expect(factorTypes).toContain(CompatibilityFactor.LOCATION);
    expect(factorTypes).toContain(CompatibilityFactor.GROUP_BALANCE);
    
    // Verify member compatibility scores
    expect(result.memberCompatibility).toBeDefined();
    expect(result.memberCompatibility.length).toBe(tribeMembers.length);
    result.memberCompatibility.forEach(mc => {
      expect(mc.userId).toBeDefined();
      expect(mc.score).toBeGreaterThanOrEqual(0);
      expect(mc.score).toBeLessThanOrEqual(100);
    });
    
    // Verify group balance impact
    expect(result.groupBalanceImpact).toBeDefined();
  });
  
  it('should calculate batch compatibility between users', async () => {
    // Create test data
    const users = createTestUserProfiles(5);
    
    // Create compatibility algorithm
    const compatibilityAlgorithm = new CompatibilityAlgorithm();
    
    // Mock the calculateUserCompatibility method
    compatibilityAlgorithm.calculateUserCompatibility = jest.fn().mockImplementation(
      async (user1, user2) => ({
        userId: user1.id,
        targetUserId: user2.id,
        overallScore: 75, // Default score
        details: [],
        calculatedAt: new Date()
      })
    );
    
    // Call the calculateBatchUserCompatibility method
    const result = await compatibilityAlgorithm.calculateBatchUserCompatibility(
      users[0],
      users.slice(1),
      undefined,
      false
    );
    
    // Assertions
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(users.length - 1);
    
    // Verify each result has the correct format
    result.forEach(item => {
      expect(item.userId).toBe(users[0].id);
      expect(item.targetUserId).toBeDefined();
      expect(item.overallScore).toBeGreaterThanOrEqual(0);
      expect(item.overallScore).toBeLessThanOrEqual(100);
    });
    
    // Verify the calculateUserCompatibility method was called for each target user
    expect(compatibilityAlgorithm.calculateUserCompatibility).toHaveBeenCalledTimes(users.length - 1);
  });
  
  it('should find most compatible tribes for a user', async () => {
    // Create test data
    const user = createTestUserProfiles(1)[0];
    const tribes = createTestTribes(3, 3); // 3 tribes with 3 members each
    const memberProfiles = new Map<string, IProfile>();
    
    // Create profiles for tribe members
    for (let i = 0; i < tribes.length; i++) {
      for (let j = 0; j < tribes[i].members.length; j++) {
        const memberId = tribes[i].members[j].userId;
        const profile = createTestUserProfiles(1)[0];
        profile.id = memberId;
        memberProfiles.set(memberId, profile);
      }
    }
    
    // Create compatibility algorithm
    const compatibilityAlgorithm = new CompatibilityAlgorithm();
    
    // Mock the calculateTribeCompatibility method
    compatibilityAlgorithm.calculateTribeCompatibility = jest.fn().mockImplementation(
      async (user, tribe, members) => ({
        userId: user.id,
        tribeId: tribe.id,
        overallScore: tribes.findIndex(t => t.id === tribe.id) * 10 + 70, // Scores: 70, 80, 90
        details: [],
        memberCompatibility: [],
        groupBalanceImpact: 0,
        calculatedAt: new Date()
      })
    );
    
    // Call the findMostCompatibleTribes method
    const result = await compatibilityAlgorithm.findMostCompatibleTribes(
      user,
      tribes,
      memberProfiles,
      undefined,
      2, // limit to top 2
      75 // threshold
    );
    
    // Assertions
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2); // Should return top 2 tribes above threshold (80, 90)
    
    // Verify tribes are returned in order of compatibility
    expect(result[0].tribeId).toBe(tribes[2].id); // 90
    expect(result[1].tribeId).toBe(tribes[1].id); // 80
    
    // Verify only tribes above threshold are returned
    result.forEach(item => {
      expect(item.compatibilityScore).toBeGreaterThanOrEqual(75);
    });
  });
  
  it('should find most compatible users for a user', async () => {
    // Create test data
    const users = createTestUserProfiles(5);
    
    // Create compatibility algorithm
    const compatibilityAlgorithm = new CompatibilityAlgorithm();
    
    // Mock the calculateUserCompatibility method
    compatibilityAlgorithm.calculateUserCompatibility = jest.fn().mockImplementation(
      async (user1, user2) => {
        const user2Index = parseInt(user2.id.split('-')[1]);
        return {
          userId: user1.id,
          targetUserId: user2.id,
          overallScore: 60 + user2Index * 5, // Scores increase with user index
          details: [],
          calculatedAt: new Date()
        };
      }
    );
    
    // Call the findMostCompatibleUsers method
    const result = await compatibilityAlgorithm.findMostCompatibleUsers(
      users[0],
      users,
      undefined,
      3, // limit to top 3
      70 // threshold
    );
    
    // Assertions
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3); // Should return top 3 users above threshold
    
    // Verify users are returned in order of compatibility
    expect(result[0].userId).toBe(users[4].id); // Highest score
    expect(result[1].userId).toBe(users[3].id);
    expect(result[2].userId).toBe(users[2].id);
    
    // Verify only users above threshold are returned
    result.forEach(item => {
      expect(item.compatibilityScore).toBeGreaterThanOrEqual(70);
    });
  });
  
  it('should apply factor weights correctly in compatibility calculations', async () => {
    // Create test data
    const user1 = createTestUserProfiles(1)[0];
    const user2 = createTestUserProfiles(1)[0];
    user2.id = 'user-2';
    
    // Create compatibility algorithm
    const compatibilityAlgorithm = new CompatibilityAlgorithm();
    
    // Mock the AI client to prevent actual API calls
    compatibilityAlgorithm['aiClient'] = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'SCORE: 78\nINSIGHTS: Good compatibility...' } }]
          })
        }
      }
    } as any;
    
    // Define custom factor weights
    const customWeights = {
      [CompatibilityFactor.PERSONALITY]: 0.5, // Higher weight on personality
      [CompatibilityFactor.INTERESTS]: 0.3,
      [CompatibilityFactor.COMMUNICATION_STYLE]: 0.1,
      [CompatibilityFactor.LOCATION]: 0.1,
      [CompatibilityFactor.GROUP_BALANCE]: 0
    };
    
    // Call with default weights
    const defaultResult = await compatibilityAlgorithm.calculateUserCompatibility(
      user1, 
      user2, 
      undefined, 
      true
    );
    
    // Call with custom weights
    const customResult = await compatibilityAlgorithm.calculateUserCompatibility(
      user1, 
      user2, 
      customWeights, 
      true
    );
    
    // Assertions
    expect(defaultResult.details.find(d => d.factor === CompatibilityFactor.PERSONALITY)?.weight)
      .not.toBe(customResult.details.find(d => d.factor === CompatibilityFactor.PERSONALITY)?.weight);
    
    expect(customResult.details.find(d => d.factor === CompatibilityFactor.PERSONALITY)?.weight)
      .toBe(0.5);
    
    // The overall scores should be different due to different weights
    expect(defaultResult.overallScore).not.toBe(customResult.overallScore);
  });
});

describe('TribeFormationAlgorithm', () => {
  it('should form tribes by assigning users to existing tribes or creating new ones', async () => {
    // Create test data
    const users = createTestUserProfiles(20);
    const existingTribes = createTestTribes(2, 5); // 2 tribes with 5 members each
    const memberProfiles = new Map<string, IProfile>();
    
    // Create profiles for tribe members
    existingTribes.forEach(tribe => {
      tribe.members.forEach(member => {
        const memberProfile = createTestUserProfiles(1)[0];
        memberProfile.id = member.userId;
        memberProfiles.set(member.userId, memberProfile);
      });
    });
    
    // Create mock algorithms
    const mockClusteringAlgorithm = {
      setOptions: jest.fn(),
      findExistingTribeMatches: jest.fn().mockResolvedValue({
        assignments: new Map([
          ['user-0', { tribeId: 'tribe-0', compatibilityScore: 85 }],
          ['user-1', { tribeId: 'tribe-0', compatibilityScore: 82 }],
          ['user-2', { tribeId: 'tribe-1', compatibilityScore: 88 }]
        ]),
        remainingUsers: users.slice(3) // Users 3-19 remain unassigned
      }),
      createNewTribes: jest.fn().mockResolvedValue([
        {
          members: [
            { userId: 'user-3', compatibilityScore: 90 },
            { userId: 'user-4', compatibilityScore: 85 },
            { userId: 'user-5', compatibilityScore: 80 },
            { userId: 'user-6', compatibilityScore: 75 }
          ]
        },
        {
          members: [
            { userId: 'user-7', compatibilityScore: 88 },
            { userId: 'user-8', compatibilityScore: 84 },
            { userId: 'user-9', compatibilityScore: 82 },
            { userId: 'user-10', compatibilityScore: 78 }
          ]
        },
        // Users 11-19 in additional tribes...
      ])
    };
    
    const mockCompatibilityAlgorithm = createCompatibilityAlgorithmMock();
    
    // Create tribe formation algorithm
    const tribeFormationAlgorithm = new TribeFormationAlgorithm(
      mockClusteringAlgorithm as any,
      mockCompatibilityAlgorithm,
      {
        minGroupSize: 4,
        maxGroupSize: 8,
        compatibilityThreshold: 0.7
      }
    );
    
    // Mock the optimization method to return unchanged assignments
    tribeFormationAlgorithm.optimizeTribeAssignments = jest.fn().mockImplementation(
      async (existingAssignments, newTribes) => ({ existingAssignments, newTribes })
    );
    
    // Mock the AI enhancement method
    tribeFormationAlgorithm.enhanceWithAI = jest.fn().mockResolvedValue({
      insights: 'Test insights',
      adjustments: []
    });
    
    // Call the formTribes method
    const result = await tribeFormationAlgorithm.formTribes(
      users,
      existingTribes,
      memberProfiles,
      true // preferExistingTribes
    );
    
    // Assertions
    expect(result).toBeDefined();
    expect(result.existingAssignments).toBeDefined();
    expect(result.newTribes).toBeDefined();
    
    // Verify existing tribe assignments
    expect(result.existingAssignments.size).toBe(3);
    expect(result.existingAssignments.get('user-0')?.tribeId).toBe('tribe-0');
    expect(result.existingAssignments.get('user-1')?.tribeId).toBe('tribe-0');
    expect(result.existingAssignments.get('user-2')?.tribeId).toBe('tribe-1');
    
    // Verify new tribe formation
    expect(result.newTribes.length).toBeGreaterThan(0);
    
    // Verify that all users are assigned somewhere
    const assignedToExistingCount = result.existingAssignments.size;
    const assignedToNewCount = result.newTribes.reduce(
      (sum, tribe) => sum + tribe.members.length, 
      0
    );
    expect(assignedToExistingCount + assignedToNewCount).toBe(users.length);
    
    // Verify the appropriate methods were called
    expect(mockClusteringAlgorithm.findExistingTribeMatches).toHaveBeenCalledWith(
      users,
      existingTribes,
      expect.anything()
    );
    
    expect(mockClusteringAlgorithm.createNewTribes).toHaveBeenCalled();
    expect(tribeFormationAlgorithm.optimizeTribeAssignments).toHaveBeenCalled();
  });
  
  it('should assign users to existing tribes based on compatibility', async () => {
    // Create test data
    const users = createTestUserProfiles(10);
    const existingTribes = createTestTribes(3, 5); // 3 tribes with 5 members each
    const memberProfiles = new Map<string, IProfile>();
    
    // Create profiles for tribe members
    existingTribes.forEach(tribe => {
      tribe.members.forEach(member => {
        const memberProfile = createTestUserProfiles(1)[0];
        memberProfile.id = member.userId;
        memberProfiles.set(member.userId, memberProfile);
      });
    });
    
    // Create mock compatibility algorithm
    const mockCompatibilityAlgorithm = createCompatibilityAlgorithmMock();
    mockCompatibilityAlgorithm.calculateTribeCompatibility = jest.fn().mockImplementation(
      async (user, tribe) => {
        // Assign compatibility based on user and tribe indices
        const userIndex = parseInt(user.id.split('-')[1]);
        const tribeIndex = parseInt(tribe.id.split('-')[1]);
        
        // User 0-2 highly compatible with tribe 0, users 3-5 with tribe 1, etc.
        const isHighlyCompatible = Math.floor(userIndex / 3) === tribeIndex;
        
        return {
          userId: user.id,
          tribeId: tribe.id,
          overallScore: isHighlyCompatible ? 85 : 65,
          details: [],
          memberCompatibility: [],
          groupBalanceImpact: 0,
          calculatedAt: new Date()
        };
      }
    );
    
    // Create clustering algorithm as a pass-through to the compatibility algorithm
    const mockClusteringAlgorithm = {
      setOptions: jest.fn(),
      findExistingTribeMatches: jest.fn().mockImplementation(
        async (users, tribes, profiles) => {
          const assignments = new Map<string, {tribeId: string, compatibilityScore: number}>();
          const remainingUsers = [];
          
          for (const user of users) {
            let bestTribeId = null;
            let bestScore = 0;
            
            for (const tribe of tribes) {
              if (tribe.members.length < tribe.maxMembers) {
                const compat = await mockCompatibilityAlgorithm.calculateTribeCompatibility(
                  user, tribe, [], undefined, false
                );
                
                if (compat.overallScore > bestScore && compat.overallScore >= 70) {
                  bestScore = compat.overallScore;
                  bestTribeId = tribe.id;
                }
              }
            }
            
            if (bestTribeId) {
              assignments.set(user.id, {
                tribeId: bestTribeId,
                compatibilityScore: bestScore
              });
            } else {
              remainingUsers.push(user);
            }
          }
          
          return { assignments, remainingUsers };
        }
      )
    };
    
    // Create tribe formation algorithm
    const tribeFormationAlgorithm = new TribeFormationAlgorithm(
      mockClusteringAlgorithm as any,
      mockCompatibilityAlgorithm,
      {
        compatibilityThreshold: 0.7
      }
    );
    
    // Call the assignToExistingTribes method
    const result = await tribeFormationAlgorithm.assignToExistingTribes(
      users,
      existingTribes,
      memberProfiles
    );
    
    // Assertions
    expect(result).toBeDefined();
    expect(result.assignments).toBeDefined();
    expect(result.remainingUsers).toBeDefined();
    
    // Verify that compatible users are assigned correctly
    const tribe0Users = Array.from(result.assignments.entries())
      .filter(([_, assignment]) => assignment.tribeId === 'tribe-0')
      .map(([userId]) => userId);
    
    const tribe1Users = Array.from(result.assignments.entries())
      .filter(([_, assignment]) => assignment.tribeId === 'tribe-1')
      .map(([userId]) => userId);
    
    // Users 0-2 should be assigned to tribe 0
    expect(tribe0Users).toContain('user-0');
    expect(tribe0Users).toContain('user-1');
    expect(tribe0Users).toContain('user-2');
    
    // Users 3-5 should be assigned to tribe 1
    expect(tribe1Users).toContain('user-3');
    expect(tribe1Users).toContain('user-4');
    expect(tribe1Users).toContain('user-5');
    
    // Verify that assignment respects tribe capacity
    for (const tribe of existingTribes) {
      const assignedCount = Array.from(result.assignments.values())
        .filter(assignment => assignment.tribeId === tribe.id)
        .length;
      
      expect(tribe.members.length + assignedCount).toBeLessThanOrEqual(tribe.maxMembers);
    }
    
    // Verify that assignment respects compatibility threshold
    for (const [_, assignment] of result.assignments.entries()) {
      expect(assignment.compatibilityScore).toBeGreaterThanOrEqual(70);
    }
  });
  
  it("should create new tribes for users who couldn't be matched to existing tribes", async () => {
    // Create test data
    const users = createTestUserProfiles(15);
    
    // Create mock clustering algorithm
    const mockClusteringAlgorithm = {
      setOptions: jest.fn(),
      createNewTribes: jest.fn().mockResolvedValue([
        {
          members: [
            { userId: 'user-0', compatibilityScore: 90 },
            { userId: 'user-1', compatibilityScore: 85 },
            { userId: 'user-2', compatibilityScore: 80 },
            { userId: 'user-3', compatibilityScore: 75 }
          ]
        },
        {
          members: [
            { userId: 'user-4', compatibilityScore: 88 },
            { userId: 'user-5', compatibilityScore: 84 },
            { userId: 'user-6', compatibilityScore: 82 },
            { userId: 'user-7', compatibilityScore: 78 }
          ]
        },
        {
          members: [
            { userId: 'user-8', compatibilityScore: 86 },
            { userId: 'user-9', compatibilityScore: 83 },
            { userId: 'user-10', compatibilityScore: 81 },
            { userId: 'user-11', compatibilityScore: 77 }
          ]
        },
        {
          members: [
            { userId: 'user-12', compatibilityScore: 85 },
            { userId: 'user-13', compatibilityScore: 82 },
            { userId: 'user-14', compatibilityScore: 79 }
          ]
        }
      ])
    };
    
    // Create mock compatibility algorithm
    const mockCompatibilityAlgorithm = createCompatibilityAlgorithmMock();
    
    // Create tribe formation algorithm
    const tribeFormationAlgorithm = new TribeFormationAlgorithm(
      mockClusteringAlgorithm as any,
      mockCompatibilityAlgorithm
    );
    
    // Call the createNewTribes method
    const result = await tribeFormationAlgorithm.createNewTribes(users);
    
    // Assertions
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(4); // Should create 4 tribes for 15 users
    
    // Verify tribes have appropriate size
    expect(result[0].members.length).toBe(4);
    expect(result[1].members.length).toBe(4);
    expect(result[2].members.length).toBe(4);
    expect(result[3].members.length).toBe(3);
    
    // Verify all users are assigned
    const assignedUserIds = result.flatMap(tribe => tribe.members.map(m => m.userId));
    expect(assignedUserIds.length).toBe(users.length);
    
    // Verify the clustering algorithm was called with the correct parameters
    expect(mockClusteringAlgorithm.setOptions).toHaveBeenCalled();
    expect(mockClusteringAlgorithm.createNewTribes).toHaveBeenCalledWith(users);
  });
  
  it('should optimize tribe assignments to maximize overall compatibility', async () => {
    // Create test data
    const users = createTestUserProfiles(20);
    const existingTribes = createTestTribes(2, 5); // 2 tribes with 5 members each
    
    // Create existing assignments
    const existingAssignments = new Map<string, {tribeId: string, compatibilityScore: number}>();
    existingAssignments.set('user-0', { tribeId: 'tribe-0', compatibilityScore: 75 });
    existingAssignments.set('user-1', { tribeId: 'tribe-0', compatibilityScore: 72 });
    existingAssignments.set('user-2', { tribeId: 'tribe-1', compatibilityScore: 78 });
    
    // Create new tribes
    const newTribes = [
      {
        members: [
          { userId: 'user-3', compatibilityScore: 85 },
          { userId: 'user-4', compatibilityScore: 82 },
          { userId: 'user-5', compatibilityScore: 80 },
          { userId: 'user-6', compatibilityScore: 78 }
        ]
      },
      {
        members: [
          { userId: 'user-7', compatibilityScore: 84 },
          { userId: 'user-8', compatibilityScore: 81 },
          { userId: 'user-9', compatibilityScore: 79 },
          { userId: 'user-10', compatibilityScore: 77 }
        ]
      }
    ];
    
    // Create user profiles map
    const userProfiles = new Map<string, IProfile>();
    users.forEach(user => userProfiles.set(user.id, user));
    
    // Create existing tribes map
    const existingTribesMap = new Map<string, ITribe>();
    existingTribes.forEach(tribe => existingTribesMap.set(tribe.id, tribe));
    
    // Create tribe member profiles map
    const tribeMemberProfiles = new Map<string, Array<IProfile>>();
    for (const tribe of existingTribes) {
      const tribeMembers = tribe.members.map(member => {
        const profile = createTestUserProfiles(1)[0];
        profile.id = member.userId;
        return profile;
      });
      tribeMemberProfiles.set(tribe.id, tribeMembers);
    }
    
    // Create mock compatibility algorithm that will suggest a beneficial swap
    const mockCompatibilityAlgorithm = createCompatibilityAlgorithmMock();
    mockCompatibilityAlgorithm.calculateTribeCompatibility = jest.fn()
      .mockImplementationOnce(async () => ({ overallScore: 85 })) // user-0 to tribe-1
      .mockImplementationOnce(async () => ({ overallScore: 88 })); // user-2 to tribe-0
    
    // Create tribe formation algorithm
    const tribeFormationAlgorithm = new TribeFormationAlgorithm(
      {} as any,
      mockCompatibilityAlgorithm
    );
    
    // Call the optimizeTribeAssignments method
    const result = await tribeFormationAlgorithm.optimizeTribeAssignments(
      existingAssignments,
      newTribes,
      userProfiles,
      existingTribesMap,
      tribeMemberProfiles
    );
    
    // Assertions
    expect(result).toBeDefined();
    expect(result.existingAssignments).toBeDefined();
    expect(result.newTribes).toBeDefined();
    
    // The optimization method should be called with the correct parameters
    expect(mockCompatibilityAlgorithm.calculateTribeCompatibility).toHaveBeenCalled();
    
    // Verify the optimized assignments are returned
    // Note: We're not actually testing the optimization logic here since we mocked it,
    // but we're verifying the method returns the expected structure
    expect(result.existingAssignments.size).toBe(existingAssignments.size);
    expect(result.newTribes.length).toBe(newTribes.length);
  });
  
  it('should respect custom options for tribe formation', async () => {
    // Create test data
    const users = createTestUserProfiles(10);
    const existingTribes = createTestTribes(2, 5); // 2 tribes with 5 members each
    const memberProfiles = new Map<string, IProfile>();
    
    // Create profiles for tribe members
    existingTribes.forEach(tribe => {
      tribe.members.forEach(member => {
        const memberProfile = createTestUserProfiles(1)[0];
        memberProfile.id = member.userId;
        memberProfiles.set(member.userId, memberProfile);
      });
    });
    
    // Create mock algorithms
    const mockClusteringAlgorithm = {
      setOptions: jest.fn(),
      findExistingTribeMatches: jest.fn().mockResolvedValue({
        assignments: new Map(),
        remainingUsers: users
      }),
      createNewTribes: jest.fn().mockResolvedValue([])
    };
    
    const mockCompatibilityAlgorithm = createCompatibilityAlgorithmMock();
    
    // Define custom options
    const customOptions = {
      minGroupSize: 5,
      maxGroupSize: 7,
      maxDistance: 15,
      compatibilityThreshold: 0.8,
      factorWeights: {
        [CompatibilityFactor.PERSONALITY]: 0.4,
        [CompatibilityFactor.INTERESTS]: 0.3,
        [CompatibilityFactor.COMMUNICATION_STYLE]: 0.1,
        [CompatibilityFactor.LOCATION]: 0.1,
        [CompatibilityFactor.GROUP_BALANCE]: 0.1
      }
    };
    
    // Create tribe formation algorithm
    const tribeFormationAlgorithm = new TribeFormationAlgorithm(
      mockClusteringAlgorithm as any,
      mockCompatibilityAlgorithm
    );
    
    // Mock the enhanceWithAI method
    tribeFormationAlgorithm.enhanceWithAI = jest.fn().mockResolvedValue({
      insights: 'Test insights',
      adjustments: []
    });
    
    // Set custom options
    tribeFormationAlgorithm.setOptions(customOptions);
    
    // Call the formTribes method
    await tribeFormationAlgorithm.formTribes(
      users,
      existingTribes,
      memberProfiles,
      true
    );
    
    // Assertions
    // Verify the clustering algorithm was configured with the custom options
    expect(mockClusteringAlgorithm.setOptions).toHaveBeenCalledWith(expect.objectContaining({
      minGroupSize: customOptions.minGroupSize,
      maxGroupSize: customOptions.maxGroupSize,
      maxDistance: customOptions.maxDistance,
      compatibilityThreshold: customOptions.compatibilityThreshold,
      factorWeights: customOptions.factorWeights
    }));
  });
});

describe('Utility Functions', () => {
  it('should calculate Haversine distance correctly', () => {
    // Test case 1: Same coordinates
    const coord1 = { latitude: 40.7128, longitude: -74.0060 }; // New York
    const result1 = calculateHaversineDistance(coord1, coord1);
    expect(result1).toBe(0);
    
    // Test case 2: Different coordinates
    const coord2 = { latitude: 34.0522, longitude: -118.2437 }; // Los Angeles
    const result2 = calculateHaversineDistance(coord1, coord2);
    
    // The distance between NY and LA is roughly 3,935 km
    expect(result2).toBeGreaterThan(3900);
    expect(result2).toBeLessThan(4000);
    
    // Test case 3: Nearby locations
    const coord3 = { latitude: 40.7138, longitude: -74.0070 }; // Very close to NY
    const result3 = calculateHaversineDistance(coord1, coord3);
    expect(result3).toBeLessThan(1); // Less than 1 km apart
  });
  
  it('should calculate Jaccard similarity correctly', () => {
    // Test case 1: Identical sets
    const interests1 = [
      { category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking' },
      { category: InterestCategory.FOOD_DINING, name: 'Restaurants' }
    ];
    
    const result1 = calculateJaccardSimilarity(interests1, interests1);
    expect(result1).toBe(1); // Identical sets have similarity 1
    
    // Test case 2: Disjoint sets
    const interests2 = [
      { category: InterestCategory.ARTS_CULTURE, name: 'Museums' },
      { category: InterestCategory.GAMES_ENTERTAINMENT, name: 'Board Games' }
    ];
    
    const result2 = calculateJaccardSimilarity(interests1, interests2);
    expect(result2).toBe(0); // No overlap, similarity is 0
    
    // Test case 3: Partially overlapping sets
    const interests3 = [
      { category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking' },
      { category: InterestCategory.ARTS_CULTURE, name: 'Museums' }
    ];
    
    const result3 = calculateJaccardSimilarity(interests1, interests3);
    expect(result3).toBe(1/3); // 1 common item out of 3 unique items
  });
  
  it('should calculate personality compatibility correctly', () => {
    // Create test personality traits
    const traits1: Array<IPersonalityTrait> = [
      { id: '1', profileId: 'user-1', trait: PersonalityTrait.OPENNESS, score: 80, assessedAt: new Date() },
      { id: '2', profileId: 'user-1', trait: PersonalityTrait.CONSCIENTIOUSNESS, score: 70, assessedAt: new Date() },
      { id: '3', profileId: 'user-1', trait: PersonalityTrait.EXTRAVERSION, score: 60, assessedAt: new Date() },
      { id: '4', profileId: 'user-1', trait: PersonalityTrait.AGREEABLENESS, score: 75, assessedAt: new Date() },
      { id: '5', profileId: 'user-1', trait: PersonalityTrait.NEUROTICISM, score: 40, assessedAt: new Date() }
    ];
    
    const traits2: Array<IPersonalityTrait> = [
      { id: '6', profileId: 'user-2', trait: PersonalityTrait.OPENNESS, score: 75, assessedAt: new Date() },
      { id: '7', profileId: 'user-2', trait: PersonalityTrait.CONSCIENTIOUSNESS, score: 65, assessedAt: new Date() },
      { id: '8', profileId: 'user-2', trait: PersonalityTrait.EXTRAVERSION, score: 55, assessedAt: new Date() },
      { id: '9', profileId: 'user-2', trait: PersonalityTrait.AGREEABLENESS, score: 80, assessedAt: new Date() },
      { id: '10', profileId: 'user-2', trait: PersonalityTrait.NEUROTICISM, score: 45, assessedAt: new Date() }
    ];
    
    // Calculate compatibility
    const result = calculatePersonalityCompatibility(traits1, traits2);
    
    // Assertions
    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.traitScores).toBeDefined();
    
    // Verify trait scores are calculated for each trait
    Object.values(PersonalityTrait).forEach(trait => {
      if (traits1.some(t => t.trait === trait) && traits2.some(t => t.trait === trait)) {
        expect(result.traitScores[trait]).toBeDefined();
        expect(result.traitScores[trait]).toBeGreaterThanOrEqual(0);
        expect(result.traitScores[trait]).toBeLessThanOrEqual(100);
      }
    });
    
    // Verify complementary traits are identified
    expect(Array.isArray(result.complementaryTraits)).toBe(true);
    expect(Array.isArray(result.conflictingTraits)).toBe(true);
  });
  
  it('should calculate interest compatibility correctly', () => {
    // Create test interests
    const interests1: Array<IInterest> = [
      { id: '1', profileId: 'user-1', category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking', level: 3 },
      { id: '2', profileId: 'user-1', category: InterestCategory.FOOD_DINING, name: 'Restaurants', level: 2 },
      { id: '3', profileId: 'user-1', category: InterestCategory.GAMES_ENTERTAINMENT, name: 'Board Games', level: 3 }
    ];
    
    const interests2: Array<{category: InterestCategory, name: string}> = [
      { category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking' },
      { category: InterestCategory.ARTS_CULTURE, name: 'Museums' },
      { category: InterestCategory.GAMES_ENTERTAINMENT, name: 'Board Games' }
    ];
    
    // Calculate compatibility
    const result = calculateInterestCompatibility(interests1, interests2);
    
    // Assertions
    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    
    // Verify shared interests are identified correctly
    expect(result.sharedInterests).toBeDefined();
    expect(result.sharedInterests.length).toBe(2); // Hiking and Board Games
    expect(result.sharedInterests).toContainEqual({ category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking' });
    expect(result.sharedInterests).toContainEqual({ category: InterestCategory.GAMES_ENTERTAINMENT, name: 'Board Games' });
    
    // Verify primary interest matches
    // Both users have Board Games as a primary interest (level 3)
    expect(result.primaryInterestMatch).toBeDefined();
  });
  
  it('should calculate communication compatibility correctly', () => {
    // Test case 1: Same communication styles
    const style1 = CommunicationStyle.DIRECT;
    const result1 = calculateCommunicationCompatibility(style1, style1);
    
    expect(result1).toBeDefined();
    expect(result1.styleMatch).toBe(true);
    expect(result1.overallScore).toBeGreaterThanOrEqual(0);
    expect(result1.overallScore).toBeLessThanOrEqual(100);
    expect(result1.overallScore).toBeGreaterThan(80); // Same styles should have high score
    
    // Test case 2: Different but complementary styles
    const style2 = CommunicationStyle.ANALYTICAL;
    const result2 = calculateCommunicationCompatibility(style1, style2);
    
    expect(result2).toBeDefined();
    expect(result2.styleMatch).toBe(false);
    expect(result2.complementaryStyles).toBeDefined();
    expect(result2.overallScore).toBeGreaterThanOrEqual(0);
    expect(result2.overallScore).toBeLessThanOrEqual(100);
    
    // Test case 3: Different, less compatible styles
    const style3 = CommunicationStyle.SUPPORTIVE;
    const result3 = calculateCommunicationCompatibility(style1, style3);
    
    expect(result3).toBeDefined();
    expect(result3.styleMatch).toBe(false);
    expect(result3.overallScore).toBeLessThan(result1.overallScore); // Less compatible
  });
  
  it('should calculate location compatibility correctly', () => {
    // Test case 1: Same location
    const loc1 = { latitude: 40.7128, longitude: -74.0060 }; // New York
    const result1 = calculateLocationCompatibility(loc1, loc1, 10);
    
    expect(result1).toBeDefined();
    expect(result1.distance).toBe(0);
    expect(result1.withinPreferredRange).toBe(true);
    expect(result1.overallScore).toBe(100); // Perfect score for same location
    
    // Test case 2: Within range
    const loc2 = { latitude: 40.7138, longitude: -74.0070 }; // Very close to NY
    const result2 = calculateLocationCompatibility(loc1, loc2, 10);
    
    expect(result2).toBeDefined();
    expect(result2.distance).toBeGreaterThan(0);
    expect(result2.distance).toBeLessThan(1); // Less than 1 mile
    expect(result2.withinPreferredRange).toBe(true);
    expect(result2.overallScore).toBeGreaterThan(90); // High score for close locations
    
    // Test case 3: Outside range
    const loc3 = { latitude: 34.0522, longitude: -118.2437 }; // Los Angeles
    const result3 = calculateLocationCompatibility(loc1, loc3, 100);
    
    expect(result3).toBeDefined();
    expect(result3.distance).toBeGreaterThan(2000); // Much further
    expect(result3.withinPreferredRange).toBe(false);
    expect(result3.overallScore).toBe(0); // Low score for distant locations
  });
  
  it('should calculate group balance impact correctly', () => {
    // Create test personality traits for a user
    const userTraits: Array<IPersonalityTrait> = [
      { id: '1', profileId: 'user-1', trait: PersonalityTrait.OPENNESS, score: 80, assessedAt: new Date() },
      { id: '2', profileId: 'user-1', trait: PersonalityTrait.CONSCIENTIOUSNESS, score: 70, assessedAt: new Date() },
      { id: '3', profileId: 'user-1', trait: PersonalityTrait.EXTRAVERSION, score: 30, assessedAt: new Date() }, // Low extraversion
      { id: '4', profileId: 'user-1', trait: PersonalityTrait.AGREEABLENESS, score: 75, assessedAt: new Date() },
      { id: '5', profileId: 'user-1', trait: PersonalityTrait.NEUROTICISM, score: 40, assessedAt: new Date() }
    ];
    
    // Create test personality traits for existing members (all high extraversion)
    const memberTraits: Array<Array<IPersonalityTrait>> = [
      [
        { id: '6', profileId: 'user-2', trait: PersonalityTrait.OPENNESS, score: 75, assessedAt: new Date() },
        { id: '7', profileId: 'user-2', trait: PersonalityTrait.CONSCIENTIOUSNESS, score: 65, assessedAt: new Date() },
        { id: '8', profileId: 'user-2', trait: PersonalityTrait.EXTRAVERSION, score: 85, assessedAt: new Date() }, // High extraversion
        { id: '9', profileId: 'user-2', trait: PersonalityTrait.AGREEABLENESS, score: 70, assessedAt: new Date() },
        { id: '10', profileId: 'user-2', trait: PersonalityTrait.NEUROTICISM, score: 45, assessedAt: new Date() }
      ],
      [
        { id: '11', profileId: 'user-3', trait: PersonalityTrait.OPENNESS, score: 70, assessedAt: new Date() },
        { id: '12', profileId: 'user-3', trait: PersonalityTrait.CONSCIENTIOUSNESS, score: 60, assessedAt: new Date() },
        { id: '13', profileId: 'user-3', trait: PersonalityTrait.EXTRAVERSION, score: 90, assessedAt: new Date() }, // High extraversion
        { id: '14', profileId: 'user-3', trait: PersonalityTrait.AGREEABLENESS, score: 75, assessedAt: new Date() },
        { id: '15', profileId: 'user-3', trait: PersonalityTrait.NEUROTICISM, score: 50, assessedAt: new Date() }
      ],
      [
        { id: '16', profileId: 'user-4', trait: PersonalityTrait.OPENNESS, score: 80, assessedAt: new Date() },
        { id: '17', profileId: 'user-4', trait: PersonalityTrait.CONSCIENTIOUSNESS, score: 70, assessedAt: new Date() },
        { id: '18', profileId: 'user-4', trait: PersonalityTrait.EXTRAVERSION, score: 80, assessedAt: new Date() }, // High extraversion
        { id: '19', profileId: 'user-4', trait: PersonalityTrait.AGREEABLENESS, score: 80, assessedAt: new Date() },
        { id: '20', profileId: 'user-4', trait: PersonalityTrait.NEUROTICISM, score: 40, assessedAt: new Date() }
      ]
    ];
    
    // Calculate balance impact
    const result = calculateGroupBalanceImpact(userTraits, memberTraits);
    
    // Assertions
    expect(result).toBeDefined();
    expect(result.currentBalance).toBeDefined();
    expect(result.projectedBalance).toBeDefined();
    expect(result.balanceImpact).toBeDefined();
    expect(result.improvesBalance).toBeDefined();
    
    // A user with low extraversion should improve the balance of a group with high extraversion
    expect(result.improvesBalance).toBe(true);
    expect(result.balanceImpact).toBeGreaterThan(0);
  });
});