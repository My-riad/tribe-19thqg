/**
 * Tribe Database Seeding Script
 * 
 * This script populates the PostgreSQL database with realistic sample data for development
 * and testing purposes. It creates users, profiles, tribes, events, and other essential
 * entities with proper relationships to enable immediate testing of the application's
 * core features.
 */

import { faker } from '@faker-js/faker'; // ^8.0.0
import prisma from '../src/config/database';
import { hashPassword } from '../src/auth-service/src/utils/password.util';
import { logger } from '../src/shared/src/utils/logger.util';
import { 
  UserRole, 
  UserStatus, 
  AuthProvider 
} from '../src/shared/src/types/user.types';
import { 
  PersonalityTrait, 
  CommunicationStyle, 
  InterestCategory, 
  InterestLevel 
} from '../src/shared/src/types/profile.types';
import { 
  TribeStatus, 
  TribePrivacy, 
  MemberRole, 
  MembershipStatus 
} from '../src/shared/src/types/tribe.types';
import { 
  EventType, 
  EventStatus, 
  EventVisibility, 
  RSVPStatus,
  PaymentStatus 
} from '../src/shared/src/types/event.types';

/**
 * Configuration for seeding process
 * Controls the amount of data generated
 */
const SEED_CONFIG = {
  users: 20,                      // Number of users to create
  tribesPerUser: 2,               // Average number of tribes a user will join
  maxMembersPerTribe: 8,          // Maximum members per tribe
  eventsPerTribe: 3,              // Number of events per tribe
  interestsPerProfile: 5,         // Number of interests per user profile
  personalityTraitsPerProfile: 5, // Number of personality traits per user profile
  achievementsCount: 10,          // Number of system achievements
  venuesCount: 15                 // Number of venues for events
};

/**
 * Main seeding function
 * Orchestrates the process of creating all seed data in proper order
 */
async function main() {
  try {
    logger.info('Starting database seeding process...');
    
    // Check if database already has data
    const hasExistingData = await checkExistingData();
    
    if (hasExistingData) {
      // Check if force flag is set via command line
      const forceFlag = process.argv.includes('--force');
      if (forceFlag) {
        logger.info('Force flag detected. Cleaning up existing data...');
        await cleanupDatabase();
      } else {
        logger.info('Database already contains seed data. Use --force to reseed. Exiting...');
        return;
      }
    }
    
    // Create data in the correct order to maintain referential integrity
    
    // Create achievements (independent entity)
    const achievements = await createAchievements(SEED_CONFIG.achievementsCount);
    logger.info(`Created ${achievements.length} achievements`);
    
    // Create venues (independent entity)
    const venues = await createVenues(SEED_CONFIG.venuesCount);
    logger.info(`Created ${venues.length} venues`);
    
    // Create users with hashed passwords
    const users = await createUsers(SEED_CONFIG.users);
    logger.info(`Created ${users.length} users`);
    
    // Create profiles for each user
    const profiles = await createProfiles(users);
    logger.info(`Created ${profiles.length} profiles`);
    
    // Create personality traits for each profile
    const personalityTraits = await createPersonalityTraits(profiles);
    logger.info(`Created ${personalityTraits.length} personality traits`);
    
    // Create interests for each profile
    const interests = await createInterests(profiles);
    logger.info(`Created ${interests.length} interests`);
    
    // Create tribes and assign creators
    const tribes = await createTribes(users);
    logger.info(`Created ${tribes.length} tribes`);
    
    // Create tribe memberships to connect users to tribes
    const tribeMemberships = await createTribeMemberships(users, tribes);
    logger.info(`Created ${tribeMemberships.length} tribe memberships`);
    
    // Create tribe interests
    const tribeInterests = await createTribeInterests(tribes);
    logger.info(`Created ${tribeInterests.length} tribe interests`);
    
    // Create events for each tribe
    const events = await createEvents(tribes, venues);
    logger.info(`Created ${events.length} events`);
    
    // Create event attendees to connect users to events
    const eventAttendees = await createEventAttendees(events, tribeMemberships);
    logger.info(`Created ${eventAttendees.length} event attendees`);
    
    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Error during database seeding', error as Error);
    throw error;
  }
}

/**
 * Check if the database already contains seed data
 * Returns true if user data already exists
 */
async function checkExistingData(): Promise<boolean> {
  const userCount = await prisma.user.count();
  return userCount > 0;
}

/**
 * Cleans up existing data from the database
 * Deletes all records in reverse order of dependencies
 */
async function cleanupDatabase(): Promise<void> {
  // Delete data in reverse order of dependencies
  logger.info('Cleaning up existing database data...');
  
  await prisma.eventAttendee.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.tribeInterest.deleteMany({});
  await prisma.tribeMembership.deleteMany({});
  await prisma.tribe.deleteMany({});
  await prisma.interest.deleteMany({});
  await prisma.personalityTrait.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.venue.deleteMany({});
  await prisma.achievement.deleteMany({});
  
  logger.info('Database cleanup completed');
}

/**
 * Creates sample user records with hashed passwords
 */
async function createUsers(count: number): Promise<any[]> {
  const userData = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    
    // Hash the password - using a common password for all seed users
    const password = 'Password123!';
    const passwordHash = await hashPassword(password);
    
    // Determine role (make most users regular users, with a few admins)
    const role = i < 2 ? UserRole.ADMIN : UserRole.USER;
    
    userData.push({
      id: faker.string.uuid(),
      email,
      passwordHash,
      role,
      status: UserStatus.ACTIVE,
      isVerified: true,
      provider: AuthProvider.LOCAL,
      providerId: null,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent(),
      lastLogin: faker.date.recent(),
      failedLoginAttempts: 0,
      lockUntil: null,
      verificationToken: null,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });
  }
  
  // Create all users in a single database operation
  await prisma.user.createMany({
    data: userData
  });
  
  // Return created users
  return prisma.user.findMany();
}

/**
 * Creates profile records for each user
 */
async function createProfiles(users: any[]): Promise<any[]> {
  const profileData = [];
  
  for (const user of users) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    
    // Generate a location in Seattle area
    const latitude = 47.6062 + (Math.random() - 0.5) * 0.1;
    const longitude = -122.3321 + (Math.random() - 0.5) * 0.1;
    
    profileData.push({
      id: faker.string.uuid(),
      userId: user.id,
      name: `${firstName} ${lastName}`,
      bio: faker.lorem.paragraph(),
      location: 'Seattle, WA',
      coordinates: {
        latitude,
        longitude
      },
      birthdate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      phoneNumber: faker.phone.number(),
      avatarUrl: faker.image.avatar(),
      communicationStyle: faker.helpers.arrayElement(Object.values(CommunicationStyle)),
      maxTravelDistance: faker.number.int({ min: 5, max: 25 }),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  }
  
  // Create all profiles
  await prisma.profile.createMany({
    data: profileData
  });
  
  // Return created profiles
  return prisma.profile.findMany();
}

/**
 * Creates personality trait records for each profile
 */
async function createPersonalityTraits(profiles: any[]): Promise<any[]> {
  const traitData = [];
  
  for (const profile of profiles) {
    // Get available trait types
    const traitTypes = Object.values(PersonalityTrait);
    
    // Select random traits from available types
    const selectedTraits = faker.helpers.arrayElements(
      traitTypes,
      Math.min(SEED_CONFIG.personalityTraitsPerProfile, traitTypes.length)
    );
    
    for (const trait of selectedTraits) {
      traitData.push({
        id: faker.string.uuid(),
        profileId: profile.id,
        trait,
        score: faker.number.int({ min: 1, max: 100 }),
        assessedAt: faker.date.recent()
      });
    }
  }
  
  // Create all personality traits
  await prisma.personalityTrait.createMany({
    data: traitData
  });
  
  // Return created personality traits
  return prisma.personalityTrait.findMany();
}

/**
 * Creates interest records for each profile
 */
async function createInterests(profiles: any[]): Promise<any[]> {
  const interestData = [];
  
  for (const profile of profiles) {
    // Get available interest categories
    const categories = Object.values(InterestCategory);
    
    // Select random categories
    const selectedCategories = faker.helpers.arrayElements(
      categories,
      Math.min(SEED_CONFIG.interestsPerProfile, categories.length)
    );
    
    for (const category of selectedCategories) {
      interestData.push({
        id: faker.string.uuid(),
        profileId: profile.id,
        category,
        name: getInterestNameByCategory(category),
        level: faker.helpers.arrayElement(Object.values(InterestLevel))
      });
    }
  }
  
  // Create all interests
  await prisma.interest.createMany({
    data: interestData
  });
  
  // Return created interests
  return prisma.interest.findMany();
}

/**
 * Helper function to get an interest name based on category
 */
function getInterestNameByCategory(category: InterestCategory): string {
  const interestsByCategory = {
    [InterestCategory.OUTDOOR_ADVENTURES]: [
      'Hiking', 'Camping', 'Rock Climbing', 'Kayaking', 'Fishing'
    ],
    [InterestCategory.ARTS_CULTURE]: [
      'Museums', 'Theater', 'Live Music', 'Painting', 'Sculpture'
    ],
    [InterestCategory.FOOD_DINING]: [
      'Fine Dining', 'Food Trucks', 'Cooking Classes', 'Wine Tasting', 'Craft Beer'
    ],
    [InterestCategory.SPORTS_FITNESS]: [
      'Running', 'Yoga', 'Soccer', 'Basketball', 'Cycling'
    ],
    [InterestCategory.GAMES_ENTERTAINMENT]: [
      'Board Games', 'Video Games', 'Trivia Nights', 'Escape Rooms', 'Card Games'
    ],
    [InterestCategory.LEARNING_EDUCATION]: [
      'Book Clubs', 'Workshops', 'Language Learning', 'Coding', 'History'
    ],
    [InterestCategory.TECHNOLOGY]: [
      'App Development', 'AI/ML', 'Blockchain', 'IoT', 'Robotics'
    ],
    [InterestCategory.WELLNESS_MINDFULNESS]: [
      'Meditation', 'Mindfulness', 'Spa Days', 'Wellness Retreats', 'Journaling'
    ]
  };
  
  return faker.helpers.arrayElement(interestsByCategory[category] || ['General Interest']);
}

/**
 * Creates tribe records with assigned creators
 */
async function createTribes(users: any[]): Promise<any[]> {
  const tribeData = [];
  const tribeCount = Math.floor(users.length / 4); // Create enough tribes for all users
  
  for (let i = 0; i < tribeCount; i++) {
    // Assign a random user as creator
    const creatorUser = faker.helpers.arrayElement(users);
    
    // Generate a location in Seattle area
    const latitude = 47.6062 + (Math.random() - 0.5) * 0.1;
    const longitude = -122.3321 + (Math.random() - 0.5) * 0.1;
    
    tribeData.push({
      id: faker.string.uuid(),
      name: generateTribeName(),
      description: faker.lorem.paragraph(),
      location: 'Seattle, WA',
      coordinates: {
        latitude,
        longitude
      },
      imageUrl: faker.image.urlLoremFlickr({ category: 'people' }),
      status: TribeStatus.ACTIVE,
      privacy: faker.helpers.arrayElement([TribePrivacy.PUBLIC, TribePrivacy.PRIVATE]),
      maxMembers: faker.helpers.arrayElement([4, 6, 8]), // Valid tribe sizes
      createdBy: creatorUser.id,
      createdAt: faker.date.past({ years: 1 }),
      lastActive: faker.date.recent(),
      metadata: {}
    });
  }
  
  // Create all tribes
  await prisma.tribe.createMany({
    data: tribeData
  });
  
  // Return created tribes
  return prisma.tribe.findMany();
}

/**
 * Helper function to generate tribe names
 */
function generateTribeName(): string {
  const adjectives = [
    'Adventurous', 'Creative', 'Curious', 'Energetic', 'Friendly',
    'Mindful', 'Passionate', 'Thoughtful', 'Vibrant', 'Wandering'
  ];
  
  const nouns = [
    'Explorers', 'Creators', 'Enthusiasts', 'Seekers', 'Adventurers',
    'Companions', 'Voyagers', 'Pioneers', 'Collective', 'Circle'
  ];
  
  return `${faker.helpers.arrayElement(adjectives)} ${faker.helpers.arrayElement(nouns)}`;
}

/**
 * Creates tribe membership records to connect users to tribes
 */
async function createTribeMemberships(users: any[], tribes: any[]): Promise<any[]> {
  const membershipData = [];
  
  // First, add creators as members of their own tribes
  for (const tribe of tribes) {
    membershipData.push({
      id: faker.string.uuid(),
      tribeId: tribe.id,
      userId: tribe.createdBy,
      role: MemberRole.CREATOR,
      status: MembershipStatus.ACTIVE,
      joinedAt: tribe.createdAt,
      lastActive: faker.date.recent()
    });
  }
  
  // Then, randomly assign users to tribes
  for (const user of users) {
    // How many tribes this user will join (1-3)
    const tribesJoinCount = Math.min(
      faker.number.int({ min: 1, max: SEED_CONFIG.tribesPerUser }),
      3 // MAX_TRIBES_PER_USER from constants
    );
    
    // Get tribes this user hasn't created
    const availableTribes = tribes.filter(tribe => tribe.createdBy !== user.id);
    
    // Randomly select tribes to join
    const tribesToJoin = faker.helpers.arrayElements(availableTribes, tribesJoinCount);
    
    for (const tribe of tribesToJoin) {
      // Count current members in this tribe
      const existingMemberships = membershipData.filter(tm => tm.tribeId === tribe.id);
      
      // Only add if tribe isn't at max capacity
      if (existingMemberships.length < tribe.maxMembers) {
        membershipData.push({
          id: faker.string.uuid(),
          tribeId: tribe.id,
          userId: user.id,
          role: MemberRole.MEMBER,
          status: MembershipStatus.ACTIVE,
          joinedAt: faker.date.past({ years: 1 }),
          lastActive: faker.date.recent()
        });
      }
    }
  }
  
  // Create all tribe memberships
  await prisma.tribeMembership.createMany({
    data: membershipData
  });
  
  // Return created tribe memberships
  return prisma.tribeMembership.findMany();
}

/**
 * Creates interest records for each tribe
 */
async function createTribeInterests(tribes: any[]): Promise<any[]> {
  const interestData = [];
  
  for (const tribe of tribes) {
    // Get available interest categories
    const categories = Object.values(InterestCategory);
    
    // Select 2-4 random categories for this tribe
    const selectedCategories = faker.helpers.arrayElements(
      categories,
      faker.number.int({ min: 2, max: 4 })
    );
    
    for (const category of selectedCategories) {
      interestData.push({
        id: faker.string.uuid(),
        tribeId: tribe.id,
        category,
        name: getInterestNameByCategory(category),
        isPrimary: faker.helpers.boolean() // Some interests are primary, some are secondary
      });
    }
  }
  
  // Create all tribe interests
  await prisma.tribeInterest.createMany({
    data: interestData
  });
  
  // Return created tribe interests
  return prisma.tribeInterest.findMany();
}

/**
 * Creates venue records for events
 */
async function createVenues(count: number): Promise<any[]> {
  const venueData = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a location in Seattle area
    const latitude = 47.6062 + (Math.random() - 0.5) * 0.1;
    const longitude = -122.3321 + (Math.random() - 0.5) * 0.1;
    
    venueData.push({
      id: faker.string.uuid(),
      name: faker.company.name(),
      address: faker.location.streetAddress({ useFullAddress: true }),
      coordinates: {
        latitude,
        longitude
      },
      placeId: faker.string.alphanumeric(20),
      website: faker.internet.url(),
      phoneNumber: faker.phone.number(),
      capacity: faker.number.int({ min: 10, max: 200 }),
      priceLevel: faker.number.int({ min: 1, max: 4 }),
      rating: faker.number.float({ min: 3, max: 5, precision: 0.1 }),
      photos: [
        faker.image.url(),
        faker.image.url()
      ],
      categories: [
        faker.helpers.arrayElement(Object.values(InterestCategory))
      ],
      metadata: {}
    });
  }
  
  // Create all venues
  await prisma.venue.createMany({
    data: venueData
  });
  
  // Return created venues
  return prisma.venue.findMany();
}

/**
 * Creates event records for each tribe
 */
async function createEvents(tribes: any[], venues: any[]): Promise<any[]> {
  const eventData = [];
  
  for (const tribe of tribes) {
    // Create a few events for each tribe
    for (let i = 0; i < SEED_CONFIG.eventsPerTribe; i++) {
      // Get a random venue
      const venue = faker.helpers.arrayElement(venues);
      
      // Generate event dates
      const futureDate = faker.date.future();
      const startTime = new Date(futureDate);
      const endTime = new Date(futureDate);
      endTime.setHours(endTime.getHours() + faker.number.int({ min: 1, max: 4 }));
      
      eventData.push({
        id: faker.string.uuid(),
        name: generateEventName(),
        description: faker.lorem.paragraph(),
        tribeId: tribe.id,
        createdBy: tribe.createdBy,
        eventType: faker.helpers.arrayElement(Object.values(EventType)),
        status: faker.helpers.arrayElement([EventStatus.DRAFT, EventStatus.SCHEDULED]),
        visibility: faker.helpers.arrayElement(Object.values(EventVisibility)),
        startTime,
        endTime,
        location: venue.address,
        coordinates: venue.coordinates,
        venueId: venue.id,
        weatherData: {
          temperature: faker.number.int({ min: 60, max: 80 }),
          condition: faker.helpers.arrayElement(['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy']),
          icon: 'weather-icon',
          precipitation: faker.number.int({ min: 0, max: 100 }),
          forecast: faker.lorem.sentence()
        },
        cost: faker.helpers.arrayElement([0, 0, 0, 10, 15, 20, 25]), // Most events free, some paid
        paymentRequired: false, // Set to true for paid events in a real app
        maxAttendees: faker.number.int({ min: 4, max: 20 }),
        categories: [faker.helpers.arrayElement(Object.values(InterestCategory))],
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent(),
        metadata: {}
      });
    }
  }
  
  // Create all events
  await prisma.event.createMany({
    data: eventData
  });
  
  // Return created events
  return prisma.event.findMany();
}

/**
 * Helper function to generate event names
 */
function generateEventName(): string {
  const eventTypes = [
    'Meetup', 'Gathering', 'Workshop', 'Social', 'Outing',
    'Adventure', 'Session', 'Get-together', 'Hangout', 'Expedition'
  ];
  
  const activities = [
    'Hiking', 'Coffee', 'Dinner', 'Exploring', 'Gaming',
    'Discussion', 'Learning', 'Movie Night', 'Game Night', 'Food Tour'
  ];
  
  return `${faker.helpers.arrayElement(activities)} ${faker.helpers.arrayElement(eventTypes)}`;
}

/**
 * Creates event attendee records to connect users to events
 */
async function createEventAttendees(events: any[], tribeMemberships: any[]): Promise<any[]> {
  const attendeeData = [];
  
  for (const event of events) {
    // Find members of the tribe that created this event
    const tribeMembers = tribeMemberships.filter(tm => tm.tribeId === event.tribeId);
    
    // Each member has a chance to attend
    for (const member of tribeMembers) {
      // 70% chance of responding to the event
      if (faker.number.int({ min: 1, max: 10 }) <= 7) {
        attendeeData.push({
          id: faker.string.uuid(),
          eventId: event.id,
          userId: member.userId,
          rsvpStatus: faker.helpers.arrayElement(Object.values(RSVPStatus)),
          rsvpTime: faker.date.recent(),
          hasCheckedIn: faker.helpers.boolean(),
          checkedInAt: faker.date.recent(),
          paymentStatus: PaymentStatus.NOT_REQUIRED,
          paymentAmount: 0,
          paymentId: null,
          metadata: {}
        });
      }
    }
  }
  
  // Create all event attendees
  await prisma.eventAttendee.createMany({
    data: attendeeData
  });
  
  // Return created event attendees
  return prisma.eventAttendee.findMany();
}

/**
 * Creates achievement records for the system
 */
async function createAchievements(count: number): Promise<any[]> {
  const achievementData = [
    {
      id: faker.string.uuid(),
      name: 'Social Butterfly',
      description: 'Join 3 different Tribes',
      category: 'social',
      pointValue: 50,
      iconUrl: faker.image.url(),
      criteria: { type: 'tribes_joined', count: 3 }
    },
    {
      id: faker.string.uuid(),
      name: 'Explorer',
      description: 'Attend 5 different events',
      category: 'events',
      pointValue: 75,
      iconUrl: faker.image.url(),
      criteria: { type: 'events_attended', count: 5 }
    },
    {
      id: faker.string.uuid(),
      name: 'Consistent',
      description: 'Attend events for 3 consecutive weeks',
      category: 'engagement',
      pointValue: 100,
      iconUrl: faker.image.url(),
      criteria: { type: 'attendance_streak', weeks: 3 }
    }
  ];
  
  // Add more achievements to reach the desired count
  while (achievementData.length < count) {
    achievementData.push({
      id: faker.string.uuid(),
      name: faker.commerce.productAdjective() + ' ' + faker.animal.type(),
      description: faker.lorem.sentence(),
      category: faker.helpers.arrayElement(['social', 'events', 'engagement', 'creator']),
      pointValue: faker.number.int({ min: 10, max: 200 }),
      iconUrl: faker.image.url(),
      criteria: { 
        type: faker.helpers.arrayElement(['events_created', 'profile_complete', 'invites_sent']), 
        count: faker.number.int({ min: 1, max: 10 }) 
      }
    });
  }
  
  // Create all achievements
  await prisma.achievement.createMany({
    data: achievementData
  });
  
  // Return created achievements
  return prisma.achievement.findMany();
}

// Export the main function for CLI execution
export { main };