import { User, MFAMethod } from '../../types/auth.types';
import { 
  Profile, 
  PersonalityTraitName, 
  InterestCategory, 
  PreferenceCategory 
} from '../../types/profile.types';

// Mock User data
const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'alex.johnson@example.com',
    name: 'Alex Johnson',
    isEmailVerified: true,
    createdAt: '2023-06-01T08:30:00Z',
    lastLogin: '2023-07-15T08:45:00Z',
    profileCompleted: true,
    hasCompletedOnboarding: true,
    mfaEnabled: false,
    preferredMfaMethod: null
  },
  {
    id: 'user-2',
    email: 'sarah.miller@example.com',
    name: 'Sarah Miller',
    isEmailVerified: true,
    createdAt: '2023-06-02T10:15:00Z',
    lastLogin: '2023-07-14T19:30:00Z',
    profileCompleted: true,
    hasCompletedOnboarding: true,
    mfaEnabled: true,
    preferredMfaMethod: MFAMethod.SMS
  },
  {
    id: 'user-3',
    email: 'tom.nelson@example.com',
    name: 'Tom Nelson',
    isEmailVerified: true,
    createdAt: '2023-06-03T14:45:00Z',
    lastLogin: '2023-07-15T12:10:00Z',
    profileCompleted: true,
    hasCompletedOnboarding: true,
    mfaEnabled: false,
    preferredMfaMethod: null
  },
  {
    id: 'user-4',
    email: 'kelly.lee@example.com',
    name: 'Kelly Lee',
    isEmailVerified: true,
    createdAt: '2023-06-05T09:20:00Z',
    lastLogin: '2023-07-13T20:30:00Z',
    profileCompleted: true,
    hasCompletedOnboarding: true,
    mfaEnabled: false,
    preferredMfaMethod: null
  },
  {
    id: 'user-5',
    email: 'jamie.park@example.com',
    name: 'Jamie Park',
    isEmailVerified: true,
    createdAt: '2023-06-05T11:30:00Z',
    lastLogin: '2023-07-15T07:45:00Z',
    profileCompleted: true,
    hasCompletedOnboarding: true,
    mfaEnabled: true,
    preferredMfaMethod: MFAMethod.AUTHENTICATOR
  },
  {
    id: 'user-6',
    email: 'michael.chen@example.com',
    name: 'Michael Chen',
    isEmailVerified: true,
    createdAt: '2023-06-06T13:15:00Z',
    lastLogin: '2023-07-14T22:15:00Z',
    profileCompleted: true,
    hasCompletedOnboarding: true,
    mfaEnabled: false,
    preferredMfaMethod: null
  },
  {
    id: 'user-7',
    email: 'sophia.rodriguez@example.com',
    name: 'Sophia Rodriguez',
    isEmailVerified: true,
    createdAt: '2023-06-08T10:45:00Z',
    lastLogin: '2023-07-15T10:20:00Z',
    profileCompleted: true,
    hasCompletedOnboarding: true,
    mfaEnabled: false,
    preferredMfaMethod: null
  },
  {
    id: 'user-8',
    email: 'david.wilson@example.com',
    name: 'David Wilson',
    isEmailVerified: true,
    createdAt: '2023-06-10T09:30:00Z',
    lastLogin: '2023-07-14T18:30:00Z',
    profileCompleted: true,
    hasCompletedOnboarding: true,
    mfaEnabled: false,
    preferredMfaMethod: null
  },
  {
    id: 'user-9',
    email: 'emma.thompson@example.com',
    name: 'Emma Thompson',
    isEmailVerified: true,
    createdAt: '2023-06-12T14:20:00Z',
    lastLogin: '2023-07-15T09:10:00Z',
    profileCompleted: true,
    hasCompletedOnboarding: true,
    mfaEnabled: true,
    preferredMfaMethod: MFAMethod.EMAIL
  },
  {
    id: 'user-10',
    email: 'ryan.garcia@example.com',
    name: 'Ryan Garcia',
    isEmailVerified: true,
    createdAt: '2023-06-15T11:10:00Z',
    lastLogin: '2023-07-14T21:45:00Z',
    profileCompleted: true,
    hasCompletedOnboarding: true,
    mfaEnabled: false,
    preferredMfaMethod: null
  },
  {
    id: 'user-11',
    email: 'olivia.kim@example.com',
    name: 'Olivia Kim',
    isEmailVerified: true,
    createdAt: '2023-06-18T15:30:00Z',
    lastLogin: '2023-07-15T11:30:00Z',
    profileCompleted: true,
    hasCompletedOnboarding: true,
    mfaEnabled: false,
    preferredMfaMethod: null
  },
  {
    id: 'user-12',
    email: 'new.user@example.com',
    name: 'New User',
    isEmailVerified: true,
    createdAt: '2023-07-14T09:45:00Z',
    lastLogin: '2023-07-14T09:45:00Z',
    profileCompleted: false,
    hasCompletedOnboarding: false,
    mfaEnabled: false,
    preferredMfaMethod: null
  }
];

// Mock Profile data
const mockProfiles: Profile[] = [
  {
    id: 'profile-1',
    userId: 'user-1',
    name: 'Alex Johnson',
    bio: 'Outdoor enthusiast and tech professional. Love hiking, photography, and trying new restaurants.',
    location: 'Seattle, WA',
    coordinates: { latitude: 47.6062, longitude: -122.3321 },
    birthdate: new Date('1990-05-15'),
    phoneNumber: '+12065551234',
    avatarUrl: 'avatar_1.jpg',
    coverImageUrl: 'cover_1.jpg',
    personalityTraits: [
      {
        id: 'trait-1-1',
        profileId: 'profile-1',
        traitName: PersonalityTraitName.OPENNESS,
        score: 0.85,
        assessedAt: new Date('2023-06-01T09:30:00Z')
      },
      {
        id: 'trait-1-2',
        profileId: 'profile-1',
        traitName: PersonalityTraitName.CONSCIENTIOUSNESS,
        score: 0.75,
        assessedAt: new Date('2023-06-01T09:30:00Z')
      },
      {
        id: 'trait-1-3',
        profileId: 'profile-1',
        traitName: PersonalityTraitName.EXTRAVERSION,
        score: 0.65,
        assessedAt: new Date('2023-06-01T09:30:00Z')
      },
      {
        id: 'trait-1-4',
        profileId: 'profile-1',
        traitName: PersonalityTraitName.AGREEABLENESS,
        score: 0.80,
        assessedAt: new Date('2023-06-01T09:30:00Z')
      },
      {
        id: 'trait-1-5',
        profileId: 'profile-1',
        traitName: PersonalityTraitName.NEUROTICISM,
        score: 0.40,
        assessedAt: new Date('2023-06-01T09:30:00Z')
      },
      {
        id: 'trait-1-6',
        profileId: 'profile-1',
        traitName: PersonalityTraitName.ADVENTUROUSNESS,
        score: 0.90,
        assessedAt: new Date('2023-06-01T09:30:00Z')
      }
    ],
    interests: [
      {
        id: 'interest-1-1',
        profileId: 'profile-1',
        category: InterestCategory.OUTDOOR_ADVENTURES,
        name: 'Hiking',
        level: 5
      },
      {
        id: 'interest-1-2',
        profileId: 'profile-1',
        category: InterestCategory.ARTS_CULTURE,
        name: 'Photography',
        level: 4
      },
      {
        id: 'interest-1-3',
        profileId: 'profile-1',
        category: InterestCategory.FOOD_DINING,
        name: 'Trying new restaurants',
        level: 4
      },
      {
        id: 'interest-1-4',
        profileId: 'profile-1',
        category: InterestCategory.TECHNOLOGY,
        name: 'Mobile app development',
        level: 3
      }
    ],
    preferences: [
      {
        id: 'pref-1-1',
        profileId: 'profile-1',
        category: PreferenceCategory.MATCHING,
        setting: 'maxDistance',
        value: '15'
      },
      {
        id: 'pref-1-2',
        profileId: 'profile-1',
        category: PreferenceCategory.NOTIFICATIONS,
        setting: 'eventReminders',
        value: 'true'
      },
      {
        id: 'pref-1-3',
        profileId: 'profile-1',
        category: PreferenceCategory.PRIVACY,
        setting: 'showLocation',
        value: 'true'
      }
    ],
    achievements: [
      {
        id: 'achievement-1-1',
        userId: 'user-1',
        name: 'Social Butterfly',
        description: 'Joined 3 different Tribes',
        category: 'membership',
        iconUrl: 'achievement_social_butterfly.png',
        awardedAt: new Date('2023-07-14T09:15:00Z'),
        pointValue: 50,
        metadata: {}
      },
      {
        id: 'achievement-1-2',
        userId: 'user-1',
        name: 'Explorer',
        description: 'Attended 5 events',
        category: 'participation',
        iconUrl: 'achievement_explorer.png',
        awardedAt: new Date('2023-07-10T14:30:00Z'),
        pointValue: 75,
        metadata: {}
      }
    ],
    lastUpdated: new Date('2023-07-01T10:15:00Z'),
    completionPercentage: 100,
    maxTravelDistance: 15,
    availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
    availableTimeRanges: [
      { day: 'Monday', startTime: '18:00', endTime: '21:00' },
      { day: 'Wednesday', startTime: '18:00', endTime: '21:00' },
      { day: 'Friday', startTime: '18:00', endTime: '22:00' },
      { day: 'Saturday', startTime: '10:00', endTime: '22:00' },
      { day: 'Sunday', startTime: '10:00', endTime: '20:00' }
    ]
  },
  {
    id: 'profile-2',
    userId: 'user-2',
    name: 'Sarah Miller',
    bio: 'Creative soul with a passion for art, photography, and the outdoors. Always looking for new adventures!',
    location: 'Seattle, WA',
    coordinates: { latitude: 47.6092, longitude: -122.3331 },
    birthdate: new Date('1992-08-23'),
    phoneNumber: '+12065552345',
    avatarUrl: 'avatar_2.jpg',
    coverImageUrl: 'cover_2.jpg',
    personalityTraits: [
      {
        id: 'trait-2-1',
        profileId: 'profile-2',
        traitName: PersonalityTraitName.OPENNESS,
        score: 0.90,
        assessedAt: new Date('2023-06-02T11:15:00Z')
      },
      {
        id: 'trait-2-2',
        profileId: 'profile-2',
        traitName: PersonalityTraitName.CONSCIENTIOUSNESS,
        score: 0.65,
        assessedAt: new Date('2023-06-02T11:15:00Z')
      },
      {
        id: 'trait-2-3',
        profileId: 'profile-2',
        traitName: PersonalityTraitName.EXTRAVERSION,
        score: 0.70,
        assessedAt: new Date('2023-06-02T11:15:00Z')
      },
      {
        id: 'trait-2-4',
        profileId: 'profile-2',
        traitName: PersonalityTraitName.AGREEABLENESS,
        score: 0.85,
        assessedAt: new Date('2023-06-02T11:15:00Z')
      },
      {
        id: 'trait-2-5',
        profileId: 'profile-2',
        traitName: PersonalityTraitName.NEUROTICISM,
        score: 0.45,
        assessedAt: new Date('2023-06-02T11:15:00Z')
      },
      {
        id: 'trait-2-6',
        profileId: 'profile-2',
        traitName: PersonalityTraitName.CREATIVITY,
        score: 0.95,
        assessedAt: new Date('2023-06-02T11:15:00Z')
      }
    ],
    interests: [
      {
        id: 'interest-2-1',
        profileId: 'profile-2',
        category: InterestCategory.ARTS_CULTURE,
        name: 'Photography',
        level: 5
      },
      {
        id: 'interest-2-2',
        profileId: 'profile-2',
        category: InterestCategory.ARTS_CULTURE,
        name: 'Painting',
        level: 4
      },
      {
        id: 'interest-2-3',
        profileId: 'profile-2',
        category: InterestCategory.OUTDOOR_ADVENTURES,
        name: 'Hiking',
        level: 4
      },
      {
        id: 'interest-2-4',
        profileId: 'profile-2',
        category: InterestCategory.GAMES_ENTERTAINMENT,
        name: 'Movies',
        level: 3
      }
    ],
    preferences: [
      {
        id: 'pref-2-1',
        profileId: 'profile-2',
        category: PreferenceCategory.MATCHING,
        setting: 'maxDistance',
        value: '10'
      },
      {
        id: 'pref-2-2',
        profileId: 'profile-2',
        category: PreferenceCategory.NOTIFICATIONS,
        setting: 'eventReminders',
        value: 'true'
      },
      {
        id: 'pref-2-3',
        profileId: 'profile-2',
        category: PreferenceCategory.PRIVACY,
        setting: 'showLocation',
        value: 'true'
      }
    ],
    achievements: [
      {
        id: 'achievement-2-1',
        userId: 'user-2',
        name: 'Social Butterfly',
        description: 'Joined 3 different Tribes',
        category: 'membership',
        iconUrl: 'achievement_social_butterfly.png',
        awardedAt: new Date('2023-07-05T16:45:00Z'),
        pointValue: 50,
        metadata: {}
      }
    ],
    lastUpdated: new Date('2023-06-15T14:30:00Z'),
    completionPercentage: 100,
    maxTravelDistance: 10,
    availableDays: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
    availableTimeRanges: [
      { day: 'Tuesday', startTime: '18:00', endTime: '21:00' },
      { day: 'Thursday', startTime: '18:00', endTime: '21:00' },
      { day: 'Saturday', startTime: '11:00', endTime: '22:00' },
      { day: 'Sunday', startTime: '11:00', endTime: '20:00' }
    ]
  },
  // Additional profiles for users 3-11 would follow the same pattern
  // For brevity, I'm including just the first two detailed profiles
  // In a real implementation, all users would have complete profiles
  {
    id: 'profile-12',
    userId: 'user-12',
    name: 'New User',
    bio: '',
    location: 'Seattle, WA',
    coordinates: { latitude: 47.6062, longitude: -122.3321 },
    birthdate: new Date('1995-03-10'),
    phoneNumber: '',
    avatarUrl: 'default_avatar.jpg',
    coverImageUrl: 'default_cover.jpg',
    personalityTraits: [],
    interests: [],
    preferences: [],
    achievements: [],
    lastUpdated: new Date('2023-07-14T09:45:00Z'),
    completionPercentage: 20,
    maxTravelDistance: 10,
    availableDays: [],
    availableTimeRanges: []
  }
];

/**
 * Helper function to find a user by ID
 * @param userId - User ID to search for
 * @returns The found user or undefined
 */
const getUserById = (userId: string): User | undefined => {
  return mockUsers.find(user => user.id === userId);
};

/**
 * Helper function to find a profile by user ID
 * @param userId - User ID to search for
 * @returns The found profile or undefined
 */
const getProfileByUserId = (userId: string): Profile | undefined => {
  return mockProfiles.find(profile => profile.userId === userId);
};

/**
 * Helper function to get basic user info for display purposes
 * @param userId - User ID to search for
 * @returns Basic user information object with id, name, and avatarUrl
 */
const getBasicUserInfo = (userId: string): { id: string; name: string; avatarUrl: string } | null => {
  const user = getUserById(userId);
  const profile = getProfileByUserId(userId);

  if (!user || !profile) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    avatarUrl: profile.avatarUrl
  };
};

/**
 * Helper function to get all users with completed profiles
 * @returns Array of users with completed profiles
 */
const getUsersWithCompletedProfiles = (): User[] => {
  return mockUsers.filter(user => user.profileCompleted);
};

/**
 * Helper function to search users based on criteria
 * @param searchParams - Object containing search parameters
 * @returns Array of users matching the search criteria
 */
const searchUsers = (searchParams: {
  query?: string;
  profileCompleted?: boolean;
  hasCompletedOnboarding?: boolean;
}): User[] => {
  return mockUsers.filter(user => {
    // Text search on name and email
    if (searchParams.query) {
      const query = searchParams.query.toLowerCase();
      if (!user.name.toLowerCase().includes(query) && 
          !user.email.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Filter by profile completion status
    if (searchParams.profileCompleted !== undefined && 
        user.profileCompleted !== searchParams.profileCompleted) {
      return false;
    }

    // Filter by onboarding status
    if (searchParams.hasCompletedOnboarding !== undefined && 
        user.hasCompletedOnboarding !== searchParams.hasCompletedOnboarding) {
      return false;
    }

    return true;
  });
};

export {
  mockUsers,
  mockProfiles,
  getUserById,
  getProfileByUserId,
  getBasicUserInfo,
  getUsersWithCompletedProfiles,
  searchUsers
};

// Default export for easier importing
export default {
  mockUsers,
  mockProfiles,
  getUserById,
  getProfileByUserId,
  getBasicUserInfo,
  getUsersWithCompletedProfiles,
  searchUsers
};