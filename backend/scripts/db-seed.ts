#!/usr/bin/env node
/**
 * Database Seeding Script for Tribe Platform
 * 
 * This script generates sample data for development, testing, and demonstration purposes.
 * It creates realistic relationships between users, tribes, events, and other entities.
 */

import { faker } from '@faker-js/faker'; // ^8.0.0
import yargs from 'yargs'; // ^17.7.2
import prisma, { connectDatabase, disconnectDatabase } from '../src/config/database';
import { hashPassword } from '../src/auth-service/src/utils/password.util';
import { logger } from '../src/shared/src/utils/logger.util';
import { UserRole, UserStatus, AuthProvider } from '../src/shared/src/types/user.types';
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
  MembershipStatus,
  ActivityType,
  MessageType
} from '../src/shared/src/types/tribe.types';
import {
  EventType,
  EventStatus,
  EventVisibility,
  RSVPStatus
} from '../src/shared/src/types/event.types';

// Default seed configuration
const DEFAULT_SEED_CONFIG = {
  users: 20,
  tribesPerUser: 2,
  maxMembersPerTribe: 8,
  eventsPerTribe: 3,
  interestsPerProfile: 5,
  personalityTraitsPerProfile: 5,
  achievementsCount: 10,
  venuesCount: 15,
  messagesPerTribe: 20,
  activitiesPerTribe: 10
};

/**
 * Main function to orchestrate the seeding process
 */
async function main(): Promise<void> {
  try {
    // Parse command-line arguments
    const argv = yargs(process.argv.slice(2))
      .option('force', {
        alias: 'f',
        description: 'Force reseed even if data exists',
        type: 'boolean',
        default: false
      })
      .option('count', {
        alias: 'c',
        description: 'Number of users to create',
        type: 'number',
        default: DEFAULT_SEED_CONFIG.users
      })
      .option('verbose', {
        alias: 'v',
        description: 'Enable verbose logging',
        type: 'boolean',
        default: false
      })
      .option('tribes', {
        alias: 't',
        description: 'Number of tribes per user',
        type: 'number',
        default: DEFAULT_SEED_CONFIG.tribesPerUser
      })
      .option('events', {
        alias: 'e',
        description: 'Number of events per tribe',
        type: 'number',
        default: DEFAULT_SEED_CONFIG.eventsPerTribe
      })
      .option('messages', {
        alias: 'm',
        description: 'Number of chat messages per tribe',
        type: 'number',
        default: DEFAULT_SEED_CONFIG.messagesPerTribe
      })
      .option('activities', {
        alias: 'a',
        description: 'Number of activities per tribe',
        type: 'number',
        default: DEFAULT_SEED_CONFIG.activitiesPerTribe
      })
      .help()
      .argv;

    const config = {
      ...DEFAULT_SEED_CONFIG,
      users: argv.count as number,
      tribesPerUser: argv.tribes as number,
      eventsPerTribe: argv.events as number,
      messagesPerTribe: argv.messages as number,
      activitiesPerTribe: argv.activities as number
    };

    // Connect to the database
    await connectDatabase();
    logger.info('Connected to database');

    // Check if database already has seed data
    const hasExistingData = await checkExistingData();
    
    if (hasExistingData && !argv.force) {
      logger.info('Database already contains data. Use --force to reseed.');
      await disconnectDatabase();
      return;
    }

    // Cleanup existing data if force flag is set
    if (hasExistingData && argv.force) {
      logger.info('Cleaning up existing data...');
      await cleanupDatabase();
    }

    // Create seed data
    logger.info('Starting seed data creation...');

    // Create achievements
    const achievements = await createAchievements(config.achievementsCount);
    logger.info(`Created ${achievements.length} achievements`);

    // Create venues
    const venues = await createVenues(config.venuesCount);
    logger.info(`Created ${venues.length} venues`);

    // Create users
    const users = await createUsers(config.users);
    logger.info(`Created ${users.length} users`);

    // Create profiles
    const profiles = await createProfiles(users);
    logger.info(`Created ${profiles.length} profiles`);

    // Create personality traits
    const personalityTraits = await createPersonalityTraits(profiles);
    logger.info(`Created ${personalityTraits.length} personality traits`);

    // Create interests
    const interests = await createInterests(profiles, config.interestsPerProfile);
    logger.info(`Created ${interests.length} interests`);

    // Create tribes
    const tribes = await createTribes(users, config.tribesPerUser);
    logger.info(`Created ${tribes.length} tribes`);

    // Create tribe memberships
    const tribeMemberships = await createTribeMemberships(users, tribes, config.maxMembersPerTribe);
    logger.info(`Created ${tribeMemberships.length} tribe memberships`);

    // Create tribe interests
    const tribeInterests = await createTribeInterests(tribes);
    logger.info(`Created ${tribeInterests.length} tribe interests`);

    // Create tribe activities
    const tribeActivities = await createTribeActivities(tribes, tribeMemberships, config.activitiesPerTribe);
    logger.info(`Created ${tribeActivities.length} tribe activities`);

    // Create chat messages
    const chatMessages = await createChatMessages(tribes, tribeMemberships, config.messagesPerTribe);
    logger.info(`Created ${chatMessages.length} chat messages`);

    // Create events
    const events = await createEvents(tribes, venues, config.eventsPerTribe);
    logger.info(`Created ${events.length} events`);

    // Create event attendees
    const eventAttendees = await createEventAttendees(events, tribeMemberships);
    logger.info(`Created ${eventAttendees.length} event attendees`);

    logger.info('Seed data creation completed successfully!');
    
    // Disconnect from the database
    await disconnectDatabase();
  } catch (error) {
    logger.error('Error during seeding process', error as Error);
    await disconnectDatabase();
    process.exit(1);
  }
}

/**
 * Creates sample user records with hashed passwords
 * 
 * @param count - Number of users to create
 * @returns Array of created user records
 */
async function createUsers(count: number): Promise<any[]> {
  const userData = [];
  
  // Create admin user
  const adminPassword = await hashPassword('Password123!');
  userData.push({
    email: 'admin@tribe.com',
    passwordHash: adminPassword,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    isVerified: true,
    provider: AuthProvider.LOCAL,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Create regular users
  for (let i = 1; i <= count; i++) {
    const password = await hashPassword('Password123!');
    userData.push({
      email: `user${i}@tribe.com`,
      passwordHash: password,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      isVerified: true,
      provider: AuthProvider.LOCAL,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  await prisma.user.createMany({
    data: userData
  });
  
  // Return created users
  return prisma.user.findMany();
}

/**
 * Creates profile records for each user
 * 
 * @param users - Array of user records
 * @returns Array of created profile records
 */
async function createProfiles(users: any[]): Promise<any[]> {
  const profileData = users.map(user => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    
    return {
      userId: user.id,
      name: `${firstName} ${lastName}`,
      bio: faker.lorem.paragraph(),
      location: faker.location.city() + ', ' + faker.location.state(),
      coordinates: {
        latitude: parseFloat(faker.location.latitude()),
        longitude: parseFloat(faker.location.longitude())
      },
      birthdate: faker.date.past({ years: 30 }),
      phoneNumber: faker.phone.number(),
      avatarUrl: faker.image.avatar(),
      communicationStyle: faker.helpers.arrayElement(Object.values(CommunicationStyle)),
      maxTravelDistance: faker.number.int({ min: 5, max: 25 }),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  });
  
  await prisma.profile.createMany({
    data: profileData
  });
  
  // Return created profiles
  return prisma.profile.findMany();
}

/**
 * Creates personality trait records for each profile
 * 
 * @param profiles - Array of profile records
 * @returns Array of created personality trait records
 */
async function createPersonalityTraits(profiles: any[]): Promise<any[]> {
  const traitData = [];
  
  // Ensure all profiles have the big five traits
  for (const profile of profiles) {
    const traits = [
      PersonalityTrait.OPENNESS,
      PersonalityTrait.CONSCIENTIOUSNESS,
      PersonalityTrait.EXTRAVERSION,
      PersonalityTrait.AGREEABLENESS,
      PersonalityTrait.NEUROTICISM
    ];
    
    for (const trait of traits) {
      traitData.push({
        profileId: profile.id,
        trait,
        score: faker.number.float({ min: 0.1, max: 1.0, precision: 0.01 }),
        assessedAt: profile.createdAt
      });
    }
  }
  
  await prisma.personalityTrait.createMany({
    data: traitData
  });
  
  // Return created traits
  return prisma.personalityTrait.findMany();
}

/**
 * Creates interest records for each profile
 * 
 * @param profiles - Array of profile records
 * @param interestsPerProfile - Number of interests per profile
 * @returns Array of created interest records
 */
async function createInterests(profiles: any[], interestsPerProfile: number): Promise<any[]> {
  const interestData = [];
  
  for (const profile of profiles) {
    const categories = faker.helpers.arrayElements(
      Object.values(InterestCategory),
      interestsPerProfile
    );
    
    for (const category of categories) {
      interestData.push({
        profileId: profile.id,
        category,
        name: getInterestName(category),
        level: faker.helpers.arrayElement(Object.values(InterestLevel))
      });
    }
  }
  
  await prisma.interest.createMany({
    data: interestData
  });
  
  // Return created interests
  return prisma.interest.findMany();
}

/**
 * Helper function to generate interest names based on category
 */
function getInterestName(category: InterestCategory): string {
  const interestNamesByCategory: Record<InterestCategory, string[]> = {
    [InterestCategory.OUTDOOR_ADVENTURES]: [
      'Hiking', 'Camping', 'Kayaking', 'Rock Climbing', 'Cycling', 'Fishing'
    ],
    [InterestCategory.ARTS_CULTURE]: [
      'Museums', 'Theater', 'Painting', 'Photography', 'Live Music', 'Dance'
    ],
    [InterestCategory.FOOD_DINING]: [
      'Fine Dining', 'Cooking Classes', 'Wine Tasting', 'Food Festivals', 'Breweries', 'Food Trucks'
    ],
    [InterestCategory.SPORTS_FITNESS]: [
      'Running', 'Yoga', 'Weight Training', 'Team Sports', 'Swimming', 'Martial Arts'
    ],
    [InterestCategory.GAMES_ENTERTAINMENT]: [
      'Board Games', 'Video Games', 'Trivia Nights', 'Escape Rooms', 'Card Games', 'Arcades'
    ],
    [InterestCategory.LEARNING_EDUCATION]: [
      'Book Clubs', 'Workshops', 'Public Lectures', 'Language Exchange', 'Science Events', 'Debates'
    ],
    [InterestCategory.TECHNOLOGY]: [
      'Coding', 'Tech Meetups', 'Hackathons', 'Startups', 'Robotics', 'AI/ML'
    ],
    [InterestCategory.WELLNESS_MINDFULNESS]: [
      'Meditation', 'Spa Days', 'Self-care', 'Retreats', 'Wellness Workshops', 'Nature Therapy'
    ]
  };
  
  return faker.helpers.arrayElement(interestNamesByCategory[category]);
}

/**
 * Creates tribe records with assigned creators
 * 
 * @param users - Array of user records
 * @param tribesPerUser - Number of tribes per user
 * @returns Array of created tribe records
 */
async function createTribes(users: any[], tribesPerUser: number): Promise<any[]> {
  const tribeData = [];
  const tribeNames = [
    'Weekend Explorers', 'City Adventurers', 'Food Enthusiasts', 'Book Lovers',
    'Hiking Crew', 'Photography Club', 'Tech Innovators', 'Fitness Friends',
    'Board Game Geeks', 'Coffee Connoisseurs', 'Urban Cyclists', 'Art Appreciators',
    'Movie Buffs', 'Nature Lovers', 'Wine Tasters', 'Music Fans',
    'Yoga Tribe', 'Cooking Club', 'Dance Enthusiasts', 'Volunteer Squad'
  ];
  
  let nameIndex = 0;
  
  // Distribute tribe creation among users
  for (let i = 0; i < tribesPerUser; i++) {
    for (const user of users) {
      if (nameIndex >= tribeNames.length) {
        nameIndex = 0; // Cycle back to beginning of names if we run out
      }
      
      const tribeName = tribeNames[nameIndex];
      nameIndex++;
      
      tribeData.push({
        name: tribeName,
        description: faker.lorem.paragraph(),
        location: faker.location.city() + ', ' + faker.location.state(),
        coordinates: {
          latitude: parseFloat(faker.location.latitude()),
          longitude: parseFloat(faker.location.longitude())
        },
        imageUrl: faker.image.urlLoremFlickr({ category: 'people' }),
        status: TribeStatus.ACTIVE,
        privacy: faker.helpers.arrayElement([TribePrivacy.PUBLIC, TribePrivacy.PRIVATE]),
        maxMembers: faker.number.int({ min: 4, max: 8 }),
        createdBy: user.id,
        createdAt: faker.date.recent(90),
        lastActive: faker.date.recent(7)
      });
    }
  }
  
  await prisma.tribe.createMany({
    data: tribeData
  });
  
  // Return created tribes
  return prisma.tribe.findMany();
}

/**
 * Creates tribe membership records to connect users to tribes
 * 
 * @param users - Array of user records
 * @param tribes - Array of tribe records
 * @param maxMembersPerTribe - Maximum members per tribe
 * @returns Array of created tribe membership records
 */
async function createTribeMemberships(users: any[], tribes: any[], maxMembersPerTribe: number): Promise<any[]> {
  const membershipData = [];
  
  // First, add creators as members of their own tribes
  for (const tribe of tribes) {
    membershipData.push({
      tribeId: tribe.id,
      userId: tribe.createdBy,
      role: MemberRole.CREATOR,
      status: MembershipStatus.ACTIVE,
      joinedAt: tribe.createdAt,
      lastActive: faker.date.recent(7)
    });
  }
  
  // Then add random members to each tribe
  for (const tribe of tribes) {
    // Get existing members for this tribe
    const existingMemberIds = membershipData
      .filter(m => m.tribeId === tribe.id)
      .map(m => m.userId);
    
    // Determine how many more members to add (random, but respect maxMembersPerTribe)
    const currentMemberCount = existingMemberIds.length;
    const membersToAdd = faker.number.int({ 
      min: 1, 
      max: Math.min(maxMembersPerTribe - currentMemberCount, users.length - currentMemberCount) 
    });
    
    // Find eligible users who aren't already members
    const eligibleUsers = users.filter(user => !existingMemberIds.includes(user.id));
    
    // Add random members
    const newMembers = faker.helpers.arrayElements(eligibleUsers, membersToAdd);
    for (const user of newMembers) {
      membershipData.push({
        tribeId: tribe.id,
        userId: user.id,
        role: MemberRole.MEMBER,
        status: MembershipStatus.ACTIVE,
        joinedAt: faker.date.between({ from: tribe.createdAt, to: new Date() }),
        lastActive: faker.date.recent(14)
      });
    }
  }
  
  await prisma.tribeMembership.createMany({
    data: membershipData
  });
  
  // Return created memberships
  return prisma.tribeMembership.findMany();
}

/**
 * Creates interest records for each tribe
 * 
 * @param tribes - Array of tribe records
 * @returns Array of created tribe interest records
 */
async function createTribeInterests(tribes: any[]): Promise<any[]> {
  const interestData = [];
  
  for (const tribe of tribes) {
    // Determine number of interests (3-5)
    const interestCount = faker.number.int({ min: 3, max: 5 });
    
    // Select random interest categories
    const categories = faker.helpers.arrayElements(
      Object.values(InterestCategory),
      interestCount
    );
    
    // Add at least one primary interest
    const primaryIndex = faker.number.int({ min: 0, max: categories.length - 1 });
    
    categories.forEach((category, index) => {
      interestData.push({
        tribeId: tribe.id,
        category,
        name: getInterestName(category),
        isPrimary: index === primaryIndex
      });
    });
  }
  
  await prisma.tribeInterest.createMany({
    data: interestData
  });
  
  // Return created interests
  return prisma.tribeInterest.findMany();
}

/**
 * Creates activity records for each tribe
 * 
 * @param tribes - Array of tribe records
 * @param memberships - Array of tribe membership records
 * @param activitiesPerTribe - Number of activities per tribe
 * @returns Array of created tribe activity records
 */
async function createTribeActivities(tribes: any[], memberships: any[], activitiesPerTribe: number): Promise<any[]> {
  const activityData = [];
  
  for (const tribe of tribes) {
    // Get members of this tribe
    const tribeMembers = memberships.filter(m => m.tribeId === tribe.id);
    
    // Create activities in chronological order
    let activityTime = new Date(tribe.createdAt);
    
    // Always add tribe creation as first activity
    activityData.push({
      tribeId: tribe.id,
      userId: tribe.createdBy,
      activityType: ActivityType.TRIBE_CREATED,
      description: `${tribe.name} was created`,
      timestamp: activityTime,
      metadata: {}
    });
    
    // Advance time
    activityTime = new Date(activityTime.getTime() + 3600000); // Add 1 hour
    
    // Add member joined activities for each member
    for (const member of tribeMembers) {
      if (member.userId !== tribe.createdBy) { // Skip creator who's already "joined" by creating
        activityData.push({
          tribeId: tribe.id,
          userId: member.userId,
          activityType: ActivityType.MEMBER_JOINED,
          description: `A new member joined the tribe`,
          timestamp: member.joinedAt,
          metadata: {}
        });
        
        // Advance time
        activityTime = new Date(activityTime.getTime() + 3600000); // Add 1 hour
      }
    }
    
    // Add additional random activities
    const activityTypes = [
      ActivityType.EVENT_CREATED,
      ActivityType.EVENT_COMPLETED,
      ActivityType.AI_SUGGESTION,
      ActivityType.CHALLENGE_CREATED,
      ActivityType.CHALLENGE_COMPLETED
    ];
    
    const remainingActivities = activitiesPerTribe - activityData.filter(a => a.tribeId === tribe.id).length;
    
    for (let i = 0; i < Math.max(0, remainingActivities); i++) {
      const activityType = faker.helpers.arrayElement(activityTypes);
      const actor = faker.helpers.arrayElement(tribeMembers);
      
      activityData.push({
        tribeId: tribe.id,
        userId: actor.userId,
        activityType,
        description: getActivityDescription(activityType),
        timestamp: activityTime,
        metadata: {}
      });
      
      // Advance time for next activity
      activityTime = new Date(activityTime.getTime() + faker.number.int({ min: 3600000, max: 86400000 })); // 1 hour to 1 day
    }
  }
  
  await prisma.tribeActivity.createMany({
    data: activityData
  });
  
  // Return created activities
  return prisma.tribeActivity.findMany();
}

/**
 * Helper function to get activity description based on type
 */
function getActivityDescription(activityType: ActivityType): string {
  switch (activityType) {
    case ActivityType.TRIBE_CREATED:
      return 'A new tribe was created';
    case ActivityType.MEMBER_JOINED:
      return 'A new member joined the tribe';
    case ActivityType.MEMBER_LEFT:
      return 'A member left the tribe';
    case ActivityType.EVENT_CREATED:
      return `A new event was scheduled: "${faker.lorem.words(3)}"`;
    case ActivityType.EVENT_COMPLETED:
      return `The tribe completed an event: "${faker.lorem.words(3)}"`;
    case ActivityType.AI_SUGGESTION:
      return `AI suggested an activity: "${faker.lorem.sentence()}"`;
    case ActivityType.CHALLENGE_CREATED:
      return `A new challenge was created: "${faker.lorem.words(4)}"`;
    case ActivityType.CHALLENGE_COMPLETED:
      return `The tribe completed a challenge: "${faker.lorem.words(4)}"`;
    default:
      return 'Activity occurred in the tribe';
  }
}

/**
 * Creates chat message records for each tribe
 * 
 * @param tribes - Array of tribe records
 * @param memberships - Array of tribe membership records
 * @param messagesPerTribe - Number of messages per tribe
 * @returns Array of created chat message records
 */
async function createChatMessages(tribes: any[], memberships: any[], messagesPerTribe: number): Promise<any[]> {
  const messageData = [];
  
  for (const tribe of tribes) {
    // Get members of this tribe
    const tribeMembers = memberships.filter(m => m.tribeId === tribe.id);
    
    // Create messages in chronological order
    let messageTime = new Date(tribe.createdAt);
    messageTime = new Date(messageTime.getTime() + 3600000); // Add 1 hour from creation
    
    // Create welcome message from AI
    messageData.push({
      tribeId: tribe.id,
      userId: tribe.createdBy, // AI messages are attributed to creator for now
      content: `Welcome to ${tribe.name}! This is a space for you to connect, plan activities, and build meaningful relationships. Let's get started by introducing ourselves.`,
      messageType: MessageType.AI_PROMPT,
      sentAt: messageTime,
      isRead: true,
      metadata: { isAI: true }
    });
    
    // Advance time
    messageTime = new Date(messageTime.getTime() + 1800000); // Add 30 minutes
    
    // Create introduction messages from members
    for (const member of tribeMembers) {
      messageData.push({
        tribeId: tribe.id,
        userId: member.userId,
        content: faker.lorem.sentence(faker.number.int({ min: 5, max: 20 })),
        messageType: MessageType.TEXT,
        sentAt: messageTime,
        isRead: true,
        metadata: {}
      });
      
      // Advance time
      messageTime = new Date(messageTime.getTime() + faker.number.int({ min: 300000, max: 1800000 })); // 5 to 30 minutes
    }
    
    // Add AI engagement prompt
    messageData.push({
      tribeId: tribe.id,
      userId: tribe.createdBy, // AI messages are attributed to creator for now
      content: `I noticed everyone has joined! How about we plan our first meetup? What kind of activities are you all interested in?`,
      messageType: MessageType.AI_PROMPT,
      sentAt: messageTime,
      isRead: true,
      metadata: { isAI: true }
    });
    
    // Advance time
    messageTime = new Date(messageTime.getTime() + 3600000); // Add 1 hour
    
    // Add remaining random messages
    const remainingMessages = messagesPerTribe - messageData.filter(m => m.tribeId === tribe.id).length;
    
    for (let i = 0; i < Math.max(0, remainingMessages); i++) {
      const sender = faker.helpers.arrayElement(tribeMembers);
      const isAI = faker.datatype.boolean(0.1); // 10% chance of AI message
      
      messageData.push({
        tribeId: tribe.id,
        userId: sender.userId,
        content: isAI 
          ? getAIPrompt() 
          : faker.lorem.sentence(faker.number.int({ min: 3, max: 20 })),
        messageType: isAI ? MessageType.AI_PROMPT : MessageType.TEXT,
        sentAt: messageTime,
        isRead: faker.datatype.boolean(0.9), // 90% chance of being read
        metadata: isAI ? { isAI: true } : {}
      });
      
      // Advance time for next message
      messageTime = new Date(messageTime.getTime() + faker.number.int({ min: 60000, max: 3600000 })); // 1 to 60 minutes
    }
  }
  
  await prisma.chatMessage.createMany({
    data: messageData
  });
  
  // Return created messages
  return prisma.chatMessage.findMany();
}

/**
 * Helper function to generate AI prompts
 */
function getAIPrompt(): string {
  const prompts = [
    "I've noticed the group has been quiet lately. How about we play a quick game? Two truths and a lie - who wants to go first?",
    "It's been a while since our last meetup. Would anyone be interested in getting together this weekend?",
    "I found some interesting events happening nearby that match our interests. Would you like me to share them?",
    "What's been the highlight of everyone's week so far?",
    "If you could travel anywhere in the world right now, where would you go and why?",
    "Quick poll: Coffee, tea, or something else?",
    "I'd love to hear everyone's favorite local restaurant. Maybe we could try one together!",
    "What book/movie/show has everyone been enjoying lately?",
    "It's a beautiful day for outdoor activities. Anyone up for a spontaneous meetup?",
    "What's one skill you've always wanted to learn but haven't had the chance to yet?"
  ];
  
  return faker.helpers.arrayElement(prompts);
}

/**
 * Creates event records for each tribe
 * 
 * @param tribes - Array of tribe records
 * @param venues - Array of venue records
 * @param eventsPerTribe - Number of events per tribe
 * @returns Array of created event records
 */
async function createEvents(tribes: any[], venues: any[], eventsPerTribe: number): Promise<any[]> {
  const eventData = [];
  
  const eventNames = [
    'Weekly Meetup', 'Social Gathering', 'Group Dinner', 'Coffee Chat',
    'Game Night', 'Hiking Adventure', 'Movie Night', 'Book Discussion',
    'Workshop', 'Volunteering Day', 'Potluck Dinner', 'Fitness Session',
    'Art Class', 'Tech Talk', 'Wine Tasting', 'Walking Tour',
    'Trivia Night', 'Cooking Class', 'Photo Walk', 'Museum Visit'
  ];
  
  for (const tribe of tribes) {
    // Create a mix of past, current, and future events
    // Past events
    for (let i = 0; i < Math.floor(eventsPerTribe / 3); i++) {
      const eventDate = faker.date.past({ years: 0.25, refDate: new Date() });
      const endTime = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
      
      eventData.push(createEventObject(
        tribe,
        venues,
        faker.helpers.arrayElement(eventNames),
        EventStatus.COMPLETED,
        eventDate,
        endTime
      ));
    }
    
    // Current/upcoming events
    for (let i = 0; i < Math.floor(eventsPerTribe / 3); i++) {
      const eventDate = faker.date.soon({ days: 7, refDate: new Date() });
      const endTime = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
      
      eventData.push(createEventObject(
        tribe,
        venues,
        faker.helpers.arrayElement(eventNames),
        EventStatus.SCHEDULED,
        eventDate,
        endTime
      ));
    }
    
    // Future events
    for (let i = 0; i < Math.ceil(eventsPerTribe / 3); i++) {
      const eventDate = faker.date.future({ years: 0.25, refDate: new Date() });
      const endTime = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
      
      eventData.push(createEventObject(
        tribe,
        venues,
        faker.helpers.arrayElement(eventNames),
        EventStatus.SCHEDULED,
        eventDate,
        endTime
      ));
    }
  }
  
  await prisma.event.createMany({
    data: eventData
  });
  
  // Return created events
  return prisma.event.findMany();
}

/**
 * Helper function to create event object
 */
function createEventObject(tribe: any, venues: any[], name: string, status: EventStatus, startTime: Date, endTime: Date) {
  const venue = faker.helpers.arrayElement(venues);
  const isPaymentRequired = faker.datatype.boolean(0.3); // 30% chance of payment required
  
  return {
    name,
    description: faker.lorem.paragraph(),
    tribeId: tribe.id,
    createdBy: tribe.createdBy,
    eventType: faker.helpers.arrayElement(Object.values(EventType)),
    status,
    visibility: faker.helpers.arrayElement(Object.values(EventVisibility)),
    startTime,
    endTime,
    location: venue.address,
    coordinates: venue.coordinates,
    venueId: venue.id,
    weatherData: {
      temperature: faker.number.int({ min: 50, max: 85 }),
      condition: faker.helpers.arrayElement(['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy']),
      icon: 'partly-cloudy',
      precipitation: faker.number.int({ min: 0, max: 100 }),
      forecast: faker.lorem.sentence()
    },
    cost: isPaymentRequired ? faker.number.float({ min: 5, max: 50, precision: 0.01 }) : 0,
    paymentRequired: isPaymentRequired,
    maxAttendees: faker.number.int({ min: 4, max: 15 }),
    categories: [faker.helpers.arrayElement(Object.values(InterestCategory))],
    createdAt: new Date(startTime.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week before event
    updatedAt: new Date(startTime.getTime() - 7 * 24 * 60 * 60 * 1000)
  };
}

/**
 * Creates event attendee records to connect users to events
 * 
 * @param events - Array of event records
 * @param tribeMemberships - Array of tribe membership records
 * @returns Array of created event attendee records
 */
async function createEventAttendees(events: any[], tribeMemberships: any[]): Promise<any[]> {
  const attendeeData = [];
  
  for (const event of events) {
    // Get members of this tribe
    const tribeMembers = tribeMemberships.filter(m => m.tribeId === event.tribeId);
    
    // Event creator is always attending
    attendeeData.push({
      eventId: event.id,
      userId: event.createdBy,
      rsvpStatus: RSVPStatus.GOING,
      rsvpTime: new Date(event.createdAt.getTime() + 3600000), // 1 hour after creation
      hasCheckedIn: event.status === EventStatus.COMPLETED,
      checkedInAt: event.status === EventStatus.COMPLETED ? event.startTime : null,
      paymentStatus: event.paymentRequired ? 'COMPLETED' : 'NOT_REQUIRED',
      paymentAmount: event.paymentRequired ? event.cost : 0
    });
    
    // Randomly add other tribe members
    const attendeeCount = faker.number.int({ 
      min: 1, 
      max: Math.min(tribeMembers.length - 1, event.maxAttendees - 1) 
    });
    
    const otherMembers = tribeMembers.filter(m => m.userId !== event.createdBy);
    const selectedMembers = faker.helpers.arrayElements(otherMembers, attendeeCount);
    
    for (const member of selectedMembers) {
      // Past events: everyone has either attended or not
      // Future events: mix of RSVP statuses
      let rsvpStatus = RSVPStatus.GOING;
      
      if (event.status === EventStatus.SCHEDULED) {
        rsvpStatus = faker.helpers.arrayElement([
          RSVPStatus.GOING,
          RSVPStatus.MAYBE,
          RSVPStatus.NOT_GOING,
          RSVPStatus.NO_RESPONSE
        ]);
      }
      
      attendeeData.push({
        eventId: event.id,
        userId: member.userId,
        rsvpStatus,
        rsvpTime: faker.date.between({ from: event.createdAt, to: new Date() }),
        hasCheckedIn: event.status === EventStatus.COMPLETED && rsvpStatus === RSVPStatus.GOING,
        checkedInAt: event.status === EventStatus.COMPLETED && rsvpStatus === RSVPStatus.GOING ? 
          event.startTime : null,
        paymentStatus: event.paymentRequired ? 
          (rsvpStatus === RSVPStatus.GOING ? 'COMPLETED' : 'PENDING') : 
          'NOT_REQUIRED',
        paymentAmount: event.paymentRequired && rsvpStatus === RSVPStatus.GOING ? event.cost : 0
      });
    }
  }
  
  await prisma.eventAttendee.createMany({
    data: attendeeData
  });
  
  // Return created attendees
  return prisma.eventAttendee.findMany();
}

/**
 * Creates venue records for events
 * 
 * @param count - Number of venues to create
 * @returns Array of created venue records
 */
async function createVenues(count: number): Promise<any[]> {
  const venueData = [];
  
  const venueTypes = [
    'Restaurant', 'Café', 'Park', 'Museum', 'Bar', 'Community Center',
    'Library', 'Coworking Space', 'Brewery', 'Art Gallery', 'Theater',
    'Bookstore', 'Game Shop', 'Yoga Studio', 'Gym', 'Sports Center'
  ];
  
  for (let i = 0; i < count; i++) {
    const venueType = faker.helpers.arrayElement(venueTypes);
    
    venueData.push({
      name: `${faker.company.name()} ${venueType}`,
      address: faker.location.streetAddress({ useFullAddress: true }),
      coordinates: {
        latitude: parseFloat(faker.location.latitude()),
        longitude: parseFloat(faker.location.longitude())
      },
      placeId: faker.string.alphanumeric(20),
      website: faker.internet.url(),
      phoneNumber: faker.phone.number(),
      capacity: faker.number.int({ min: 10, max: 200 }),
      priceLevel: faker.number.int({ min: 1, max: 4 }),
      rating: faker.number.float({ min: 3, max: 5, precision: 0.1 }),
      photos: [
        faker.image.urlLoremFlickr({ category: 'business' }),
        faker.image.urlLoremFlickr({ category: 'city' })
      ],
      categories: [faker.helpers.arrayElement(Object.values(InterestCategory))],
      metadata: {}
    });
  }
  
  await prisma.venue.createMany({
    data: venueData
  });
  
  // Return created venues
  return prisma.venue.findMany();
}

/**
 * Creates achievement records for the system
 * 
 * @param count - Number of achievements to create
 * @returns Array of created achievement records
 */
async function createAchievements(count: number): Promise<any[]> {
  const achievementData = [];
  
  const achievementTypes = [
    { 
      name: 'Social Butterfly', 
      description: 'Join 3 different Tribes', 
      category: 'SOCIAL',
      pointValue: 100,
      iconUrl: '🦋'
    },
    { 
      name: 'Event Explorer', 
      description: 'Attend 5 different types of events', 
      category: 'ATTENDANCE',
      pointValue: 150,
      iconUrl: '🗺️'
    },
    { 
      name: 'Consistent Attendee', 
      description: 'Attend events for 3 consecutive weeks', 
      category: 'ATTENDANCE',
      pointValue: 200,
      iconUrl: '📅'
    },
    { 
      name: 'Tribe Founder', 
      description: 'Create your first Tribe', 
      category: 'ORGANIZATION',
      pointValue: 300,
      iconUrl: '👑'
    },
    { 
      name: 'Event Organizer', 
      description: 'Organize 3 successful events', 
      category: 'ORGANIZATION',
      pointValue: 250,
      iconUrl: '📋'
    },
    { 
      name: 'Conversation Starter', 
      description: 'Initiate 10 group discussions', 
      category: 'ENGAGEMENT',
      pointValue: 100,
      iconUrl: '💬'
    },
    { 
      name: 'Profile Perfectionist', 
      description: 'Complete all profile sections', 
      category: 'PROFILE',
      pointValue: 50,
      iconUrl: '🌟'
    },
    { 
      name: 'Local Explorer', 
      description: 'Attend events in 5 different locations', 
      category: 'EXPLORATION',
      pointValue: 200,
      iconUrl: '🧭'
    },
    { 
      name: 'Feedback Provider', 
      description: 'Provide feedback for 5 events', 
      category: 'CONTRIBUTION',
      pointValue: 100,
      iconUrl: '📝'
    },
    { 
      name: 'Community Connector', 
      description: 'Introduce 2 members who form a connection', 
      category: 'SOCIAL',
      pointValue: 300,
      iconUrl: '🤝'
    }
  ];
  
  // Use pre-defined achievements first
  for (let i = 0; i < Math.min(count, achievementTypes.length); i++) {
    achievementData.push(achievementTypes[i]);
  }
  
  // Add more random achievements if needed
  for (let i = achievementTypes.length; i < count; i++) {
    achievementData.push({
      name: `Achievement ${i + 1}`,
      description: faker.lorem.sentence(),
      category: faker.helpers.arrayElement([
        'SOCIAL', 'ATTENDANCE', 'ORGANIZATION', 'ENGAGEMENT', 
        'PROFILE', 'EXPLORATION', 'CONTRIBUTION'
      ]),
      pointValue: faker.number.int({ min: 50, max: 500 }),
      iconUrl: faker.helpers.arrayElement(['🏆', '🎯', '🎖️', '🥇', '🌟', '⭐', '🔥', '💯'])
    });
  }
  
  await prisma.achievement.createMany({
    data: achievementData
  });
  
  // Return created achievements
  return prisma.achievement.findMany();
}

/**
 * Checks if the database already contains seed data
 * 
 * @returns True if seed data exists, false otherwise
 */
async function checkExistingData(): Promise<boolean> {
  const userCount = await prisma.user.count();
  return userCount > 0;
}

/**
 * Cleans up existing data from the database if force flag is set
 * 
 * @returns Promise that resolves when cleanup is complete
 */
async function cleanupDatabase(): Promise<void> {
  // Delete in reverse order of dependencies
  await prisma.eventAttendee.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.tribeActivity.deleteMany({});
  await prisma.tribeInterest.deleteMany({});
  await prisma.tribeMembership.deleteMany({});
  await prisma.tribe.deleteMany({});
  await prisma.interest.deleteMany({});
  await prisma.personalityTrait.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.venue.deleteMany({});
  await prisma.achievement.deleteMany({});
  
  logger.info('Database cleaned up successfully');
}

// Call the main function to start seeding
main().catch(error => {
  logger.error('Failed to seed database', error as Error);
  process.exit(1);
});