import { 
  NotificationType, 
  NotificationPriority, 
  INotificationCreate 
} from '../../../shared/src/types/notification.types';

/**
 * Creates a generic achievement unlocked notification
 * 
 * @param userId - The ID of the user who unlocked the achievement
 * @param achievementName - The name of the unlocked achievement
 * @param achievementDescription - The description of the unlocked achievement
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export function createAchievementUnlockedNotification(
  userId: string,
  achievementName: string,
  achievementDescription: string,
  metadata: Record<string, any> = {}
): INotificationCreate {
  return {
    userId,
    type: NotificationType.ACHIEVEMENT_UNLOCKED,
    title: 'Achievement Unlocked',
    body: `Congratulations! You've earned the "${achievementName}" achievement. ${achievementDescription}`,
    priority: NotificationPriority.MEDIUM,
    expiresAt: null,
    tribeId: null,
    eventId: null,
    actionUrl: '/profile/achievements',
    imageUrl: metadata.imageUrl || getAchievementNotificationImage(metadata.category || 'default'),
    metadata: {
      achievementName,
      achievementDescription,
      ...metadata
    }
  };
}

/**
 * Creates a notification for the Social Butterfly achievement (joining multiple tribes)
 * 
 * @param userId - The ID of the user who unlocked the achievement
 * @param tribeCount - The number of tribes the user has joined
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export function createSocialButterflyNotification(
  userId: string,
  tribeCount: number,
  metadata: Record<string, any> = {}
): INotificationCreate {
  const achievementName = 'Social Butterfly';
  const achievementDescription = `You've joined ${tribeCount} different Tribes!`;
  
  const nextAchievement = getNextAchievementInfo('social_butterfly', tribeCount);
  
  return {
    userId,
    type: NotificationType.ACHIEVEMENT_UNLOCKED,
    title: `Achievement Unlocked: ${achievementName}`,
    body: `Congratulations! ${achievementDescription} Your social network is growing!`,
    priority: NotificationPriority.MEDIUM,
    expiresAt: null,
    tribeId: null,
    eventId: null,
    actionUrl: '/profile/achievements',
    imageUrl: getAchievementNotificationImage('social_butterfly'),
    metadata: {
      achievementName,
      achievementDescription,
      category: 'social_butterfly',
      level: tribeCount,
      nextAchievement,
      ...metadata
    }
  };
}

/**
 * Creates a notification for the Explorer achievement (attending multiple events)
 * 
 * @param userId - The ID of the user who unlocked the achievement
 * @param eventCount - The number of events the user has attended
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export function createExplorerNotification(
  userId: string,
  eventCount: number,
  metadata: Record<string, any> = {}
): INotificationCreate {
  const achievementName = 'Explorer';
  const achievementDescription = `You've attended ${eventCount} events!`;
  
  const nextAchievement = getNextAchievementInfo('explorer', eventCount);
  
  return {
    userId,
    type: NotificationType.ACHIEVEMENT_UNLOCKED,
    title: `Achievement Unlocked: ${achievementName}`,
    body: `Congratulations! ${achievementDescription} You're discovering the world around you!`,
    priority: NotificationPriority.MEDIUM,
    expiresAt: null,
    tribeId: null,
    eventId: null,
    actionUrl: '/profile/achievements',
    imageUrl: getAchievementNotificationImage('explorer'),
    metadata: {
      achievementName,
      achievementDescription,
      category: 'explorer',
      level: eventCount,
      nextAchievement,
      ...metadata
    }
  };
}

/**
 * Creates a notification for the Consistent achievement (maintaining an attendance streak)
 * 
 * @param userId - The ID of the user who unlocked the achievement
 * @param streakWeeks - The number of weeks in the user's attendance streak
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export function createConsistentNotification(
  userId: string,
  streakWeeks: number,
  metadata: Record<string, any> = {}
): INotificationCreate {
  const achievementName = 'Consistent';
  const achievementDescription = `You've maintained a ${streakWeeks}-week attendance streak!`;
  
  const nextAchievement = getNextAchievementInfo('consistent', streakWeeks);
  
  return {
    userId,
    type: NotificationType.ACHIEVEMENT_UNLOCKED,
    title: `Achievement Unlocked: ${achievementName}`,
    body: `Congratulations! ${achievementDescription} Your dedication is impressive!`,
    priority: NotificationPriority.MEDIUM,
    expiresAt: null,
    tribeId: null,
    eventId: null,
    actionUrl: '/profile/achievements',
    imageUrl: getAchievementNotificationImage('consistent'),
    metadata: {
      achievementName,
      achievementDescription,
      category: 'consistent',
      level: streakWeeks,
      nextAchievement,
      ...metadata
    }
  };
}

/**
 * Creates a notification for the Community Builder achievement (attending events across different tribes)
 * 
 * @param userId - The ID of the user who unlocked the achievement
 * @param tribeCount - The number of different tribes where the user has attended events
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export function createCommunityBuilderNotification(
  userId: string,
  tribeCount: number,
  metadata: Record<string, any> = {}
): INotificationCreate {
  const achievementName = 'Community Builder';
  const achievementDescription = `You've attended events across ${tribeCount} different Tribes!`;
  
  const nextAchievement = getNextAchievementInfo('community_builder', tribeCount);
  
  return {
    userId,
    type: NotificationType.ACHIEVEMENT_UNLOCKED,
    title: `Achievement Unlocked: ${achievementName}`,
    body: `Congratulations! ${achievementDescription} You're bridging communities!`,
    priority: NotificationPriority.MEDIUM,
    expiresAt: null,
    tribeId: null,
    eventId: null,
    actionUrl: '/profile/achievements',
    imageUrl: getAchievementNotificationImage('community_builder'),
    metadata: {
      achievementName,
      achievementDescription,
      category: 'community_builder',
      level: tribeCount,
      nextAchievement,
      ...metadata
    }
  };
}

/**
 * Creates a notification for the Event Organizer achievement (organizing multiple events)
 * 
 * @param userId - The ID of the user who unlocked the achievement
 * @param eventCount - The number of events the user has organized
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export function createEventOrganizerNotification(
  userId: string,
  eventCount: number,
  metadata: Record<string, any> = {}
): INotificationCreate {
  const achievementName = 'Event Organizer';
  const achievementDescription = `You've organized ${eventCount} events!`;
  
  const nextAchievement = getNextAchievementInfo('event_organizer', eventCount);
  
  return {
    userId,
    type: NotificationType.ACHIEVEMENT_UNLOCKED,
    title: `Achievement Unlocked: ${achievementName}`,
    body: `Congratulations! ${achievementDescription} You're bringing people together!`,
    priority: NotificationPriority.MEDIUM,
    expiresAt: null,
    tribeId: null,
    eventId: null,
    actionUrl: '/profile/achievements',
    imageUrl: getAchievementNotificationImage('event_organizer'),
    metadata: {
      achievementName,
      achievementDescription,
      category: 'event_organizer',
      level: eventCount,
      nextAchievement,
      ...metadata
    }
  };
}

/**
 * Creates a notification for the Connection Maker achievement (introducing tribe members who form connections)
 * 
 * @param userId - The ID of the user who unlocked the achievement
 * @param connectionCount - The number of connections facilitated by the user
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export function createConnectionMakerNotification(
  userId: string,
  connectionCount: number,
  metadata: Record<string, any> = {}
): INotificationCreate {
  const achievementName = 'Connection Maker';
  const achievementDescription = `You've helped ${connectionCount} people connect!`;
  
  const nextAchievement = getNextAchievementInfo('connection_maker', connectionCount);
  
  return {
    userId,
    type: NotificationType.ACHIEVEMENT_UNLOCKED,
    title: `Achievement Unlocked: ${achievementName}`,
    body: `Congratulations! ${achievementDescription} You're a social catalyst!`,
    priority: NotificationPriority.MEDIUM,
    expiresAt: null,
    tribeId: null,
    eventId: null,
    actionUrl: '/profile/achievements',
    imageUrl: getAchievementNotificationImage('connection_maker'),
    metadata: {
      achievementName,
      achievementDescription,
      category: 'connection_maker',
      level: connectionCount,
      nextAchievement,
      ...metadata
    }
  };
}

/**
 * Creates a notification for the Feedback Champion achievement (providing feedback after events)
 * 
 * @param userId - The ID of the user who unlocked the achievement
 * @param feedbackCount - The number of feedback submissions provided by the user
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export function createFeedbackChampionNotification(
  userId: string,
  feedbackCount: number,
  metadata: Record<string, any> = {}
): INotificationCreate {
  const achievementName = 'Feedback Champion';
  const achievementDescription = `You've provided feedback ${feedbackCount} times!`;
  
  const nextAchievement = getNextAchievementInfo('feedback_champion', feedbackCount);
  
  return {
    userId,
    type: NotificationType.ACHIEVEMENT_UNLOCKED,
    title: `Achievement Unlocked: ${achievementName}`,
    body: `Congratulations! ${achievementDescription} Your input helps improve experiences for everyone!`,
    priority: NotificationPriority.MEDIUM,
    expiresAt: null,
    tribeId: null,
    eventId: null,
    actionUrl: '/profile/achievements',
    imageUrl: getAchievementNotificationImage('feedback_champion'),
    metadata: {
      achievementName,
      achievementDescription,
      category: 'feedback_champion',
      level: feedbackCount,
      nextAchievement,
      ...metadata
    }
  };
}

/**
 * Helper function to get the appropriate image URL for an achievement type
 * 
 * @param achievementCategory - The category of achievement
 * @returns URL to the achievement image
 */
function getAchievementNotificationImage(achievementCategory: string): string {
  switch (achievementCategory) {
    case 'social_butterfly':
      return '/assets/achievements/social_butterfly.png';
    case 'explorer':
      return '/assets/achievements/explorer.png';
    case 'consistent':
      return '/assets/achievements/consistent.png';
    case 'community_builder':
      return '/assets/achievements/community_builder.png';
    case 'event_organizer':
      return '/assets/achievements/event_organizer.png';
    case 'connection_maker':
      return '/assets/achievements/connection_maker.png';
    case 'feedback_champion':
      return '/assets/achievements/feedback_champion.png';
    default:
      return '/assets/achievements/default.png';
  }
}

/**
 * Helper function to get information about the next achievement in a series
 * 
 * @param achievementCategory - The category of achievement
 * @param currentLevel - The current level achieved
 * @returns Information about the next achievement
 */
function getNextAchievementInfo(achievementCategory: string, currentLevel: number): { name: string, requirement: string } | null {
  switch (achievementCategory) {
    case 'social_butterfly':
      if (currentLevel < 5) {
        return { 
          name: 'Social Butterfly II', 
          requirement: 'Join 5 Tribes' 
        };
      } else if (currentLevel < 10) {
        return { 
          name: 'Social Butterfly III', 
          requirement: 'Join 10 Tribes' 
        };
      }
      return null;
      
    case 'explorer':
      if (currentLevel < 10) {
        return { 
          name: 'Explorer II', 
          requirement: 'Attend 10 events' 
        };
      } else if (currentLevel < 25) {
        return { 
          name: 'Explorer III', 
          requirement: 'Attend 25 events' 
        };
      }
      return null;
      
    case 'consistent':
      if (currentLevel < 5) {
        return { 
          name: 'Consistent II', 
          requirement: 'Maintain a 5-week streak' 
        };
      } else if (currentLevel < 10) {
        return { 
          name: 'Consistent III', 
          requirement: 'Maintain a 10-week streak' 
        };
      }
      return null;
      
    case 'community_builder':
      if (currentLevel < 5) {
        return { 
          name: 'Community Builder II', 
          requirement: 'Attend events in 5 different Tribes' 
        };
      } else if (currentLevel < 10) {
        return { 
          name: 'Community Builder III', 
          requirement: 'Attend events in 10 different Tribes' 
        };
      }
      return null;
      
    case 'event_organizer':
      if (currentLevel < 5) {
        return { 
          name: 'Event Organizer II', 
          requirement: 'Organize 5 events' 
        };
      } else if (currentLevel < 10) {
        return { 
          name: 'Event Organizer III', 
          requirement: 'Organize 10 events' 
        };
      }
      return null;
      
    case 'connection_maker':
      if (currentLevel < 10) {
        return { 
          name: 'Connection Maker II', 
          requirement: 'Help 10 people connect' 
        };
      } else if (currentLevel < 25) {
        return { 
          name: 'Connection Maker III', 
          requirement: 'Help 25 people connect' 
        };
      }
      return null;
      
    case 'feedback_champion':
      if (currentLevel < 10) {
        return { 
          name: 'Feedback Champion II', 
          requirement: 'Provide feedback 10 times' 
        };
      } else if (currentLevel < 25) {
        return { 
          name: 'Feedback Champion III', 
          requirement: 'Provide feedback 25 times' 
        };
      }
      return null;
      
    default:
      return null;
  }
}