import { TribeTypes } from '../../types/tribe.types';
import { getProfileByUserId, getBasicUserInfo } from './users';
import { InterestCategory } from '../../types/profile.types';

// Mock tribe data
const mockTribes: TribeTypes.Tribe[] = [
  {
    id: 'tribe-1',
    name: 'Weekend Explorers',
    description: 'A group for exploring hiking trails, parks, and outdoor activities every weekend.',
    location: 'Seattle, WA',
    coordinates: { latitude: 47.6062, longitude: -122.3321 },
    imageUrl: 'tribe_1.jpg',
    coverImageUrl: 'tribe_1_cover.jpg',
    createdAt: new Date('2023-06-01T10:30:00Z'),
    createdBy: 'user-1',
    status: TribeTypes.TribeStatus.ACTIVE,
    privacy: TribeTypes.TribePrivacy.PUBLIC,
    maxMembers: 8,
    memberCount: 4,
    members: [
      {
        id: 'member-1-1',
        tribeId: 'tribe-1',
        userId: 'user-1',
        profile: getProfileByUserId('user-1'),
        role: TribeTypes.MemberRole.CREATOR,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-01T10:30:00Z'),
        lastActive: new Date('2023-07-15T08:45:00Z'),
        compatibilityScores: {},
        engagementScore: 0.9
      },
      {
        id: 'member-1-2',
        tribeId: 'tribe-1',
        userId: 'user-2',
        profile: getProfileByUserId('user-2'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-02T14:15:00Z'),
        lastActive: new Date('2023-07-14T19:30:00Z'),
        compatibilityScores: {},
        engagementScore: 0.8
      },
      {
        id: 'member-1-3',
        tribeId: 'tribe-1',
        userId: 'user-3',
        profile: getProfileByUserId('user-3'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-03T09:45:00Z'),
        lastActive: new Date('2023-07-15T12:10:00Z'),
        compatibilityScores: {},
        engagementScore: 0.85
      },
      {
        id: 'member-1-4',
        tribeId: 'tribe-1',
        userId: 'user-4',
        profile: getProfileByUserId('user-4'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-05T16:30:00Z'),
        lastActive: new Date('2023-07-13T20:30:00Z'),
        compatibilityScores: {},
        engagementScore: 0.7
      }
    ],
    activities: [
      {
        id: 'activity-1-1',
        tribeId: 'tribe-1',
        userId: 'user-1',
        activityType: TribeTypes.ActivityType.EVENT_CREATED,
        description: 'Alex created an event: Trail Hike @ Discovery Park',
        timestamp: new Date('2023-07-01T15:30:00Z'),
        metadata: {
          eventId: 'event-1'
        }
      },
      {
        id: 'activity-1-2',
        tribeId: 'tribe-1',
        userId: 'user-2',
        activityType: TribeTypes.ActivityType.EVENT_CREATED,
        description: 'Sarah created an event: Outdoor Movie Night',
        timestamp: new Date('2023-07-10T16:45:00Z'),
        metadata: {
          eventId: 'event-4'
        }
      },
      {
        id: 'activity-1-3',
        tribeId: 'tribe-1',
        userId: null,
        activityType: TribeTypes.ActivityType.AI_SUGGESTION,
        description: 'AI suggested a new hiking trail at Discovery Park',
        timestamp: new Date('2023-07-14T10:15:00Z'),
        metadata: {
          promptId: 'prompt-1'
        }
      }
    ],
    goals: [
      {
        id: 'goal-1-1',
        tribeId: 'tribe-1',
        createdBy: 'user-1',
        title: 'Visit 5 different hiking trails this summer',
        description: 'Let\'s explore different trails around Seattle area between June and September',
        status: TribeTypes.GoalStatus.ACTIVE,
        createdAt: new Date('2023-06-10T11:30:00Z'),
        targetDate: new Date('2023-09-30T23:59:59Z'),
        completedAt: null,
        isAiGenerated: false
      },
      {
        id: 'goal-1-2',
        tribeId: 'tribe-1',
        createdBy: 'user-3',
        title: 'Take a group photo at each hiking location',
        description: 'Create a photo collection of our adventures',
        status: TribeTypes.GoalStatus.ACTIVE,
        createdAt: new Date('2023-06-15T14:45:00Z'),
        targetDate: new Date('2023-09-30T23:59:59Z'),
        completedAt: null,
        isAiGenerated: false
      }
    ],
    primaryInterests: [
      InterestCategory.OUTDOOR_ADVENTURES
    ],
    secondaryInterests: [
      InterestCategory.SPORTS_FITNESS,
      InterestCategory.ARTS_CULTURE
    ],
    compatibilityScore: null,
    lastActivity: new Date('2023-07-15T12:10:00Z'),
    upcomingEventCount: 2,
    isAiGenerated: false,
    metadata: {}
  },
  {
    id: 'tribe-2',
    name: 'Foodies United',
    description: 'A group for food enthusiasts to explore restaurants, food festivals, and cooking experiences together.',
    location: 'Seattle, WA',
    coordinates: { latitude: 47.6062, longitude: -122.3321 },
    imageUrl: 'tribe_2.jpg',
    coverImageUrl: 'tribe_2_cover.jpg',
    createdAt: new Date('2023-06-05T13:45:00Z'),
    createdBy: 'user-5',
    status: TribeTypes.TribeStatus.ACTIVE,
    privacy: TribeTypes.TribePrivacy.PUBLIC,
    maxMembers: 8,
    memberCount: 4,
    members: [
      {
        id: 'member-2-1',
        tribeId: 'tribe-2',
        userId: 'user-5',
        profile: getProfileByUserId('user-5'),
        role: TribeTypes.MemberRole.CREATOR,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-05T13:45:00Z'),
        lastActive: new Date('2023-07-15T07:45:00Z'),
        compatibilityScores: {},
        engagementScore: 0.95
      },
      {
        id: 'member-2-2',
        tribeId: 'tribe-2',
        userId: 'user-1',
        profile: getProfileByUserId('user-1'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-07T10:30:00Z'),
        lastActive: new Date('2023-07-15T08:45:00Z'),
        compatibilityScores: {},
        engagementScore: 0.75
      },
      {
        id: 'member-2-3',
        tribeId: 'tribe-2',
        userId: 'user-6',
        profile: getProfileByUserId('user-6'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-08T15:20:00Z'),
        lastActive: new Date('2023-07-14T22:15:00Z'),
        compatibilityScores: {},
        engagementScore: 0.8
      },
      {
        id: 'member-2-4',
        tribeId: 'tribe-2',
        userId: 'user-7',
        profile: getProfileByUserId('user-7'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-10T11:15:00Z'),
        lastActive: new Date('2023-07-15T10:20:00Z'),
        compatibilityScores: {},
        engagementScore: 0.85
      }
    ],
    activities: [
      {
        id: 'activity-2-1',
        tribeId: 'tribe-2',
        userId: 'user-5',
        activityType: TribeTypes.ActivityType.EVENT_CREATED,
        description: 'Jamie created an event: Food Truck Festival',
        timestamp: new Date('2023-07-05T11:45:00Z'),
        metadata: {
          eventId: 'event-2'
        }
      },
      {
        id: 'activity-2-2',
        tribeId: 'tribe-2',
        userId: 'user-5',
        activityType: TribeTypes.ActivityType.EVENT_CREATED,
        description: 'Jamie created an event: Farmers Market Tour',
        timestamp: new Date('2023-07-12T13:20:00Z'),
        metadata: {
          eventId: 'event-5'
        }
      },
      {
        id: 'activity-2-3',
        tribeId: 'tribe-2',
        userId: 'user-7',
        activityType: TribeTypes.ActivityType.MEMBER_JOINED,
        description: 'Sophia joined the tribe',
        timestamp: new Date('2023-06-10T11:15:00Z'),
        metadata: {}
      }
    ],
    goals: [
      {
        id: 'goal-2-1',
        tribeId: 'tribe-2',
        createdBy: 'user-5',
        title: 'Try 10 different cuisines this year',
        description: 'Explore diverse food cultures through restaurants and cooking',
        status: TribeTypes.GoalStatus.ACTIVE,
        createdAt: new Date('2023-06-15T14:30:00Z'),
        targetDate: new Date('2023-12-31T23:59:59Z'),
        completedAt: null,
        isAiGenerated: false
      }
    ],
    primaryInterests: [
      InterestCategory.FOOD_DINING
    ],
    secondaryInterests: [
      InterestCategory.ARTS_CULTURE,
      InterestCategory.SOCIAL_CAUSES
    ],
    compatibilityScore: null,
    lastActivity: new Date('2023-07-15T10:20:00Z'),
    upcomingEventCount: 2,
    isAiGenerated: false,
    metadata: {}
  },
  {
    id: 'tribe-3',
    name: 'Board Game Enthusiasts',
    description: 'A group for board game lovers to meet up, play games, and share strategies.',
    location: 'Bellevue, WA',
    coordinates: { latitude: 47.6101, longitude: -122.2015 },
    imageUrl: 'tribe_3.jpg',
    coverImageUrl: 'tribe_3_cover.jpg',
    createdAt: new Date('2023-06-10T16:30:00Z'),
    createdBy: 'user-8',
    status: TribeTypes.TribeStatus.ACTIVE,
    privacy: TribeTypes.TribePrivacy.PUBLIC,
    maxMembers: 8,
    memberCount: 4,
    members: [
      {
        id: 'member-3-1',
        tribeId: 'tribe-3',
        userId: 'user-8',
        profile: getProfileByUserId('user-8'),
        role: TribeTypes.MemberRole.CREATOR,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-10T16:30:00Z'),
        lastActive: new Date('2023-07-14T18:30:00Z'),
        compatibilityScores: {},
        engagementScore: 0.9
      },
      {
        id: 'member-3-2',
        tribeId: 'tribe-3',
        userId: 'user-9',
        profile: getProfileByUserId('user-9'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-12T11:45:00Z'),
        lastActive: new Date('2023-07-15T09:10:00Z'),
        compatibilityScores: {},
        engagementScore: 0.7
      },
      {
        id: 'member-3-3',
        tribeId: 'tribe-3',
        userId: 'user-10',
        profile: getProfileByUserId('user-10'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-15T14:20:00Z'),
        lastActive: new Date('2023-07-14T21:45:00Z'),
        compatibilityScores: {},
        engagementScore: 0.85
      },
      {
        id: 'member-3-4',
        tribeId: 'tribe-3',
        userId: 'user-11',
        profile: getProfileByUserId('user-11'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-18T10:15:00Z'),
        lastActive: new Date('2023-07-15T11:30:00Z'),
        compatibilityScores: {},
        engagementScore: 0.75
      }
    ],
    activities: [
      {
        id: 'activity-3-1',
        tribeId: 'tribe-3',
        userId: 'user-8',
        activityType: TribeTypes.ActivityType.EVENT_CREATED,
        description: 'David created an event: Board Game Night',
        timestamp: new Date('2023-07-08T20:15:00Z'),
        metadata: {
          eventId: 'event-3'
        }
      },
      {
        id: 'activity-3-2',
        tribeId: 'tribe-3',
        userId: 'user-11',
        activityType: TribeTypes.ActivityType.MEMBER_JOINED,
        description: 'Olivia joined the tribe',
        timestamp: new Date('2023-06-18T10:15:00Z'),
        metadata: {}
      },
      {
        id: 'activity-3-3',
        tribeId: 'tribe-3',
        userId: null,
        activityType: TribeTypes.ActivityType.AI_SUGGESTION,
        description: 'AI suggested trying the cooperative game "The Mind"',
        timestamp: new Date('2023-07-12T15:00:00Z'),
        metadata: {
          promptId: 'prompt-4'
        }
      }
    ],
    goals: [
      {
        id: 'goal-3-1',
        tribeId: 'tribe-3',
        createdBy: 'user-8',
        title: 'Play 20 different board games this year',
        description: 'Explore a variety of game mechanics and themes',
        status: TribeTypes.GoalStatus.ACTIVE,
        createdAt: new Date('2023-06-20T15:30:00Z'),
        targetDate: new Date('2023-12-31T23:59:59Z'),
        completedAt: null,
        isAiGenerated: false
      },
      {
        id: 'goal-3-2',
        tribeId: 'tribe-3',
        createdBy: 'user-10',
        title: 'Host a board game tournament',
        description: 'Organize a friendly competition with prizes',
        status: TribeTypes.GoalStatus.ACTIVE,
        createdAt: new Date('2023-06-25T11:45:00Z'),
        targetDate: new Date('2023-08-31T23:59:59Z'),
        completedAt: null,
        isAiGenerated: false
      }
    ],
    primaryInterests: [
      InterestCategory.GAMES_ENTERTAINMENT
    ],
    secondaryInterests: [
      InterestCategory.TECHNOLOGY,
      InterestCategory.LEARNING_EDUCATION
    ],
    compatibilityScore: 87,
    lastActivity: new Date('2023-07-15T11:30:00Z'),
    upcomingEventCount: 1,
    isAiGenerated: false,
    metadata: {}
  },
  {
    id: 'tribe-4',
    name: 'Urban Photographers',
    description: 'A group for photography enthusiasts to explore urban landscapes and architecture through their lenses.',
    location: 'Seattle, WA',
    coordinates: { latitude: 47.6062, longitude: -122.3321 },
    imageUrl: 'tribe_4.jpg',
    coverImageUrl: 'tribe_4_cover.jpg',
    createdAt: new Date('2023-06-15T14:30:00Z'),
    createdBy: 'user-4',
    status: TribeTypes.TribeStatus.ACTIVE,
    privacy: TribeTypes.TribePrivacy.PUBLIC,
    maxMembers: 8,
    memberCount: 3,
    members: [
      {
        id: 'member-4-1',
        tribeId: 'tribe-4',
        userId: 'user-4',
        profile: getProfileByUserId('user-4'),
        role: TribeTypes.MemberRole.CREATOR,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-15T14:30:00Z'),
        lastActive: new Date('2023-07-13T20:30:00Z'),
        compatibilityScores: {},
        engagementScore: 0.9
      },
      {
        id: 'member-4-2',
        tribeId: 'tribe-4',
        userId: 'user-2',
        profile: getProfileByUserId('user-2'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-18T11:15:00Z'),
        lastActive: new Date('2023-07-14T19:30:00Z'),
        compatibilityScores: {},
        engagementScore: 0.85
      },
      {
        id: 'member-4-3',
        tribeId: 'tribe-4',
        userId: 'user-11',
        profile: getProfileByUserId('user-11'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-20T15:45:00Z'),
        lastActive: new Date('2023-07-15T11:30:00Z'),
        compatibilityScores: {},
        engagementScore: 0.8
      }
    ],
    activities: [
      {
        id: 'activity-4-1',
        tribeId: 'tribe-4',
        userId: 'user-4',
        activityType: TribeTypes.ActivityType.EVENT_CREATED,
        description: 'Kelly created an event: Photography Walk: Urban Architecture',
        timestamp: new Date('2023-07-16T09:15:00Z'),
        metadata: {
          eventId: 'event-8'
        }
      },
      {
        id: 'activity-4-2',
        tribeId: 'tribe-4',
        userId: 'user-11',
        activityType: TribeTypes.ActivityType.MEMBER_JOINED,
        description: 'Olivia joined the tribe',
        timestamp: new Date('2023-06-20T15:45:00Z'),
        metadata: {}
      }
    ],
    goals: [
      {
        id: 'goal-4-1',
        tribeId: 'tribe-4',
        createdBy: 'user-4',
        title: 'Create a photo exhibition of Seattle architecture',
        description: 'Capture unique perspectives of the city\'s buildings and structures',
        status: TribeTypes.GoalStatus.ACTIVE,
        createdAt: new Date('2023-06-25T13:30:00Z'),
        targetDate: new Date('2023-10-31T23:59:59Z'),
        completedAt: null,
        isAiGenerated: false
      }
    ],
    primaryInterests: [
      InterestCategory.ARTS_CULTURE
    ],
    secondaryInterests: [
      InterestCategory.TECHNOLOGY,
      InterestCategory.OUTDOOR_ADVENTURES
    ],
    compatibilityScore: null,
    lastActivity: new Date('2023-07-15T11:30:00Z'),
    upcomingEventCount: 1,
    isAiGenerated: false,
    metadata: {}
  },
  {
    id: 'tribe-5',
    name: 'Hiking Enthusiasts',
    description: 'A group dedicated to exploring hiking trails of all difficulty levels in the Pacific Northwest.',
    location: 'Seattle, WA',
    coordinates: { latitude: 47.6062, longitude: -122.3321 },
    imageUrl: 'tribe_5.jpg',
    coverImageUrl: 'tribe_5_cover.jpg',
    createdAt: new Date('2023-06-12T09:45:00Z'),
    createdBy: 'user-3',
    status: TribeTypes.TribeStatus.ACTIVE,
    privacy: TribeTypes.TribePrivacy.PUBLIC,
    maxMembers: 8,
    memberCount: 3,
    members: [
      {
        id: 'member-5-1',
        tribeId: 'tribe-5',
        userId: 'user-3',
        profile: getProfileByUserId('user-3'),
        role: TribeTypes.MemberRole.CREATOR,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-12T09:45:00Z'),
        lastActive: new Date('2023-07-15T12:10:00Z'),
        compatibilityScores: {},
        engagementScore: 0.95
      },
      {
        id: 'member-5-2',
        tribeId: 'tribe-5',
        userId: 'user-7',
        profile: getProfileByUserId('user-7'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-15T10:30:00Z'),
        lastActive: new Date('2023-07-15T10:20:00Z'),
        compatibilityScores: {},
        engagementScore: 0.85
      },
      {
        id: 'member-5-3',
        tribeId: 'tribe-5',
        userId: 'user-9',
        profile: getProfileByUserId('user-9'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-18T14:15:00Z'),
        lastActive: new Date('2023-07-15T09:10:00Z'),
        compatibilityScores: {},
        engagementScore: 0.75
      }
    ],
    activities: [
      {
        id: 'activity-5-1',
        tribeId: 'tribe-5',
        userId: 'user-7',
        activityType: TribeTypes.ActivityType.MEMBER_JOINED,
        description: 'Sophia joined the tribe',
        timestamp: new Date('2023-06-15T10:30:00Z'),
        metadata: {}
      },
      {
        id: 'activity-5-2',
        tribeId: 'tribe-5',
        userId: 'user-9',
        activityType: TribeTypes.ActivityType.MEMBER_JOINED,
        description: 'Emma joined the tribe',
        timestamp: new Date('2023-06-18T14:15:00Z'),
        metadata: {}
      },
      {
        id: 'activity-5-3',
        tribeId: 'tribe-5',
        userId: 'user-3',
        activityType: TribeTypes.ActivityType.GOAL_CREATED,
        description: 'Tom created a goal: Hike Mt. Rainier by end of summer',
        timestamp: new Date('2023-06-20T11:30:00Z'),
        metadata: {
          goalId: 'goal-5-1'
        }
      }
    ],
    goals: [
      {
        id: 'goal-5-1',
        tribeId: 'tribe-5',
        createdBy: 'user-3',
        title: 'Hike Mt. Rainier by end of summer',
        description: 'Train together and complete a challenging hike to Mt. Rainier',
        status: TribeTypes.GoalStatus.ACTIVE,
        createdAt: new Date('2023-06-20T11:30:00Z'),
        targetDate: new Date('2023-09-30T23:59:59Z'),
        completedAt: null,
        isAiGenerated: false
      }
    ],
    primaryInterests: [
      InterestCategory.OUTDOOR_ADVENTURES
    ],
    secondaryInterests: [
      InterestCategory.SPORTS_FITNESS,
      InterestCategory.WELLNESS_MINDFULNESS
    ],
    compatibilityScore: null,
    lastActivity: new Date('2023-07-15T12:10:00Z'),
    upcomingEventCount: 0,
    isAiGenerated: false,
    metadata: {}
  },
  {
    id: 'tribe-6',
    name: 'Creative Minds',
    description: 'A group for artists, designers, and creative thinkers to share ideas, collaborate, and inspire each other.',
    location: 'Seattle, WA',
    coordinates: { latitude: 47.6062, longitude: -122.3321 },
    imageUrl: 'tribe_6.jpg',
    coverImageUrl: 'tribe_6_cover.jpg',
    createdAt: new Date('2023-06-18T15:30:00Z'),
    createdBy: 'user-11',
    status: TribeTypes.TribeStatus.ACTIVE,
    privacy: TribeTypes.TribePrivacy.PUBLIC,
    maxMembers: 8,
    memberCount: 3,
    members: [
      {
        id: 'member-6-1',
        tribeId: 'tribe-6',
        userId: 'user-11',
        profile: getProfileByUserId('user-11'),
        role: TribeTypes.MemberRole.CREATOR,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-18T15:30:00Z'),
        lastActive: new Date('2023-07-15T11:30:00Z'),
        compatibilityScores: {},
        engagementScore: 0.9
      },
      {
        id: 'member-6-2',
        tribeId: 'tribe-6',
        userId: 'user-2',
        profile: getProfileByUserId('user-2'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-20T10:15:00Z'),
        lastActive: new Date('2023-07-14T19:30:00Z'),
        compatibilityScores: {},
        engagementScore: 0.8
      },
      {
        id: 'member-6-3',
        tribeId: 'tribe-6',
        userId: 'user-4',
        profile: getProfileByUserId('user-4'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-22T14:45:00Z'),
        lastActive: new Date('2023-07-13T20:30:00Z'),
        compatibilityScores: {},
        engagementScore: 0.75
      }
    ],
    activities: [
      {
        id: 'activity-6-1',
        tribeId: 'tribe-6',
        userId: 'user-2',
        activityType: TribeTypes.ActivityType.MEMBER_JOINED,
        description: 'Sarah joined the tribe',
        timestamp: new Date('2023-06-20T10:15:00Z'),
        metadata: {}
      },
      {
        id: 'activity-6-2',
        tribeId: 'tribe-6',
        userId: 'user-4',
        activityType: TribeTypes.ActivityType.MEMBER_JOINED,
        description: 'Kelly joined the tribe',
        timestamp: new Date('2023-06-22T14:45:00Z'),
        metadata: {}
      },
      {
        id: 'activity-6-3',
        tribeId: 'tribe-6',
        userId: 'user-11',
        activityType: TribeTypes.ActivityType.GOAL_CREATED,
        description: 'Olivia created a goal: Collaborative art project',
        timestamp: new Date('2023-06-25T16:30:00Z'),
        metadata: {
          goalId: 'goal-6-1'
        }
      }
    ],
    goals: [
      {
        id: 'goal-6-1',
        tribeId: 'tribe-6',
        createdBy: 'user-11',
        title: 'Collaborative art project',
        description: 'Create a collaborative artwork where each member contributes their unique style',
        status: TribeTypes.GoalStatus.ACTIVE,
        createdAt: new Date('2023-06-25T16:30:00Z'),
        targetDate: new Date('2023-09-30T23:59:59Z'),
        completedAt: null,
        isAiGenerated: false
      }
    ],
    primaryInterests: [
      InterestCategory.ARTS_CULTURE
    ],
    secondaryInterests: [
      InterestCategory.TECHNOLOGY,
      InterestCategory.LEARNING_EDUCATION
    ],
    compatibilityScore: null,
    lastActivity: new Date('2023-07-15T11:30:00Z'),
    upcomingEventCount: 0,
    isAiGenerated: false,
    metadata: {}
  },
  {
    id: 'tribe-7',
    name: 'Tech Innovators',
    description: 'A group for tech enthusiasts, developers, and innovators to discuss emerging technologies and industry trends.',
    location: 'Seattle, WA',
    coordinates: { latitude: 47.6062, longitude: -122.3321 },
    imageUrl: 'tribe_7.jpg',
    coverImageUrl: 'tribe_7_cover.jpg',
    createdAt: new Date('2023-06-20T11:45:00Z'),
    createdBy: 'user-10',
    status: TribeTypes.TribeStatus.ACTIVE,
    privacy: TribeTypes.TribePrivacy.PUBLIC,
    maxMembers: 8,
    memberCount: 3,
    members: [
      {
        id: 'member-7-1',
        tribeId: 'tribe-7',
        userId: 'user-10',
        profile: getProfileByUserId('user-10'),
        role: TribeTypes.MemberRole.CREATOR,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-20T11:45:00Z'),
        lastActive: new Date('2023-07-14T21:45:00Z'),
        compatibilityScores: {},
        engagementScore: 0.95
      },
      {
        id: 'member-7-2',
        tribeId: 'tribe-7',
        userId: 'user-6',
        profile: getProfileByUserId('user-6'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-22T09:30:00Z'),
        lastActive: new Date('2023-07-14T22:15:00Z'),
        compatibilityScores: {},
        engagementScore: 0.9
      },
      {
        id: 'member-7-3',
        tribeId: 'tribe-7',
        userId: 'user-11',
        profile: getProfileByUserId('user-11'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-25T14:15:00Z'),
        lastActive: new Date('2023-07-15T11:30:00Z'),
        compatibilityScores: {},
        engagementScore: 0.8
      }
    ],
    activities: [
      {
        id: 'activity-7-1',
        tribeId: 'tribe-7',
        userId: 'user-6',
        activityType: TribeTypes.ActivityType.MEMBER_JOINED,
        description: 'Michael joined the tribe',
        timestamp: new Date('2023-06-22T09:30:00Z'),
        metadata: {}
      },
      {
        id: 'activity-7-2',
        tribeId: 'tribe-7',
        userId: 'user-11',
        activityType: TribeTypes.ActivityType.MEMBER_JOINED,
        description: 'Olivia joined the tribe',
        timestamp: new Date('2023-06-25T14:15:00Z'),
        metadata: {}
      },
      {
        id: 'activity-7-3',
        tribeId: 'tribe-7',
        userId: 'user-10',
        activityType: TribeTypes.ActivityType.EVENT_CREATED,
        description: 'Ryan created an event: Tech Meetup: AI Innovations',
        timestamp: new Date('2023-07-15T10:30:00Z'),
        metadata: {
          eventId: 'event-7'
        }
      }
    ],
    goals: [
      {
        id: 'goal-7-1',
        tribeId: 'tribe-7',
        createdBy: 'user-10',
        title: 'Build a collaborative tech project',
        description: 'Work together on a small tech project that showcases our skills',
        status: TribeTypes.GoalStatus.ACTIVE,
        createdAt: new Date('2023-06-30T15:45:00Z'),
        targetDate: new Date('2023-10-31T23:59:59Z'),
        completedAt: null,
        isAiGenerated: false
      }
    ],
    primaryInterests: [
      InterestCategory.TECHNOLOGY
    ],
    secondaryInterests: [
      InterestCategory.LEARNING_EDUCATION,
      InterestCategory.GAMES_ENTERTAINMENT
    ],
    compatibilityScore: null,
    lastActivity: new Date('2023-07-15T11:30:00Z'),
    upcomingEventCount: 1,
    isAiGenerated: false,
    metadata: {}
  },
  {
    id: 'tribe-8',
    name: 'Wellness Warriors',
    description: 'A group focused on holistic wellness, including yoga, meditation, and mindful living practices.',
    location: 'Seattle, WA',
    coordinates: { latitude: 47.6062, longitude: -122.3321 },
    imageUrl: 'tribe_8.jpg',
    coverImageUrl: 'tribe_8_cover.jpg',
    createdAt: new Date('2023-06-25T09:30:00Z'),
    createdBy: 'user-9',
    status: TribeTypes.TribeStatus.ACTIVE,
    privacy: TribeTypes.TribePrivacy.PUBLIC,
    maxMembers: 8,
    memberCount: 3,
    members: [
      {
        id: 'member-8-1',
        tribeId: 'tribe-8',
        userId: 'user-9',
        profile: getProfileByUserId('user-9'),
        role: TribeTypes.MemberRole.CREATOR,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-25T09:30:00Z'),
        lastActive: new Date('2023-07-15T09:10:00Z'),
        compatibilityScores: {},
        engagementScore: 0.95
      },
      {
        id: 'member-8-2',
        tribeId: 'tribe-8',
        userId: 'user-7',
        profile: getProfileByUserId('user-7'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-06-28T14:15:00Z'),
        lastActive: new Date('2023-07-15T10:20:00Z'),
        compatibilityScores: {},
        engagementScore: 0.9
      },
      {
        id: 'member-8-3',
        tribeId: 'tribe-8',
        userId: 'user-4',
        profile: getProfileByUserId('user-4'),
        role: TribeTypes.MemberRole.MEMBER,
        status: TribeTypes.MemberStatus.ACTIVE,
        joinedAt: new Date('2023-07-01T11:30:00Z'),
        lastActive: new Date('2023-07-13T20:30:00Z'),
        compatibilityScores: {},
        engagementScore: 0.8
      }
    ],
    activities: [
      {
        id: 'activity-8-1',
        tribeId: 'tribe-8',
        userId: 'user-7',
        activityType: TribeTypes.ActivityType.MEMBER_JOINED,
        description: 'Sophia joined the tribe',
        timestamp: new Date('2023-06-28T14:15:00Z'),
        metadata: {}
      },
      {
        id: 'activity-8-2',
        tribeId: 'tribe-8',
        userId: 'user-4',
        activityType: TribeTypes.ActivityType.MEMBER_JOINED,
        description: 'Kelly joined the tribe',
        timestamp: new Date('2023-07-01T11:30:00Z'),
        metadata: {}
      },
      {
        id: 'activity-8-3',
        tribeId: 'tribe-8',
        userId: 'user-9',
        activityType: TribeTypes.ActivityType.EVENT_CREATED,
        description: 'Emma created an event: Yoga in the Park',
        timestamp: new Date('2023-07-14T08:45:00Z'),
        metadata: {
          eventId: 'event-6'
        }
      }
    ],
    goals: [
      {
        id: 'goal-8-1',
        tribeId: 'tribe-8',
        createdBy: 'user-9',
        title: '30-day meditation challenge',
        description: 'Practice meditation daily for 30 days and share experiences',
        status: TribeTypes.GoalStatus.ACTIVE,
        createdAt: new Date('2023-07-01T10:15:00Z'),
        targetDate: new Date('2023-07-31T23:59:59Z'),
        completedAt: null,
        isAiGenerated: false
      }
    ],
    primaryInterests: [
      InterestCategory.WELLNESS_MINDFULNESS
    ],
    secondaryInterests: [
      InterestCategory.SPORTS_FITNESS,
      InterestCategory.FOOD_DINING
    ],
    compatibilityScore: null,
    lastActivity: new Date('2023-07-15T10:20:00Z'),
    upcomingEventCount: 1,
    isAiGenerated: false,
    metadata: {}
  }
];

const mockTribeSuggestions: TribeTypes.TribeSuggestion[] = [
  {
    tribe: mockTribes.find(tribe => tribe.id === 'tribe-3'),
    matchScore: 87,
    matchReasons: [
      'Shares your interest in board games and strategy',
      'Members have compatible personality traits',
      'Located within your preferred travel distance',
      'Active group with regular meetups'
    ],
    suggestedAt: new Date('2023-07-15T09:30:00Z')
  },
  {
    tribe: mockTribes.find(tribe => tribe.id === 'tribe-5'),
    matchScore: 82,
    matchReasons: [
      'Aligns with your interest in outdoor activities',
      'Members have similar adventure preferences',
      'Located in your area',
      'Active group with upcoming hiking events'
    ],
    suggestedAt: new Date('2023-07-14T10:15:00Z')
  },
  {
    tribe: mockTribes.find(tribe => tribe.id === 'tribe-8'),
    matchScore: 78,
    matchReasons: [
      'Matches your interest in wellness and mindfulness',
      'Members have complementary personality traits',
      'Located within your preferred travel distance',
      'Regular activities that fit your schedule'
    ],
    suggestedAt: new Date('2023-07-13T14:45:00Z')
  }
];

/**
 * Helper function to find a tribe by ID
 * @param tribeId - Tribe ID to search for
 * @returns The found tribe or undefined
 */
const getTribeById = (tribeId: string): TribeTypes.Tribe | undefined => {
  return mockTribes.find(tribe => tribe.id === tribeId);
};

/**
 * Helper function to find tribes that a user is a member of
 * @param userId - User ID to search for
 * @returns Array of tribes the user is a member of
 */
const getTribesByUserId = (userId: string): TribeTypes.Tribe[] => {
  return mockTribes.filter(tribe => 
    tribe.members.some(member => member.userId === userId)
  );
};

/**
 * Helper function to get AI-suggested tribes for a user
 * @param userId - User ID to get suggestions for
 * @returns Array of tribe suggestions for the user
 */
const getTribeSuggestions = (userId: string): TribeTypes.TribeSuggestion[] => {
  // In a real implementation, this would filter by userId
  return mockTribeSuggestions;
};

/**
 * Helper function to search tribes based on criteria
 * @param filters - Object containing search filters
 * @returns Array of tribes matching the search criteria
 */
const searchTribes = (filters: any): TribeTypes.Tribe[] => {
  return mockTribes.filter(tribe => {
    // Text search on name and description
    if (filters.query) {
      const query = filters.query.toLowerCase();
      if (!tribe.name.toLowerCase().includes(query) && 
          !tribe.description.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Location/proximity filtering
    if (filters.coordinates && filters.radius) {
      // In a real implementation, this would calculate distance between coordinates
      // For mock data, we'll just use a simple check
      if (tribe.location !== filters.location) {
        return false;
      }
    }
    
    // Interest filtering
    if (filters.interests && filters.interests.length > 0) {
      const hasMatchingInterest = filters.interests.some((interest: string) => 
        tribe.primaryInterests.includes(interest) || tribe.secondaryInterests.includes(interest)
      );
      if (!hasMatchingInterest) {
        return false;
      }
    }
    
    // Status filtering
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(tribe.status)) {
        return false;
      }
    }
    
    // Privacy filtering
    if (filters.privacy) {
      if (tribe.privacy !== filters.privacy) {
        return false;
      }
    }
    
    // Available spots filtering
    if (filters.hasAvailableSpots) {
      if (tribe.memberCount >= tribe.maxMembers) {
        return false;
      }
    }
    
    return true;
  });
};

export {
  mockTribes,
  mockTribeSuggestions,
  getTribeById,
  getTribesByUserId,
  getTribeSuggestions,
  searchTribes
};

export default {
  mockTribes,
  mockTribeSuggestions,
  getTribeById,
  getTribesByUserId,
  getTribeSuggestions,
  searchTribes
};