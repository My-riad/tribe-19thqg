import { 
  NotificationType, 
  NotificationPriority, 
  Notification 
} from '../../types/notification.types';
import { getBasicUserInfo } from './users';
import { getTribeById } from './tribes';
import { getEventById } from './events';

// Mock notification data for testing and development
const mockNotifications: Notification[] = [
  {
    id: 'notification-1',
    type: NotificationType.TRIBE_MATCH,
    title: 'New Tribe Match',
    message: '"Board Game Enthusiasts" matches your interests (87% match)',
    isRead: false,
    createdAt: new Date('2023-07-15T09:30:00Z'),
    sender: null,
    priority: NotificationPriority.HIGH,
    payload: {
      tribeId: 'tribe-3',
      tribe: getTribeById('tribe-3')
    },
    actionUrl: '/tribes/tribe-3',
    imageUrl: 'tribe_3.jpg'
  },
  {
    id: 'notification-2',
    type: NotificationType.EVENT_REMINDER,
    title: 'Event Reminder',
    message: 'Trail Hike @ Discovery Park tomorrow at 10:00 AM',
    isRead: false,
    createdAt: new Date('2023-07-14T10:00:00Z'),
    sender: null,
    priority: NotificationPriority.HIGH,
    payload: {
      eventId: 'event-1',
      event: getEventById('event-1')
    },
    actionUrl: '/events/event-1',
    imageUrl: 'event_discovery_park.jpg'
  },
  {
    id: 'notification-3',
    type: NotificationType.CHAT_MESSAGE,
    title: 'New Message',
    message: 'Sarah: "Are you bringing snacks for the hike?"',
    isRead: true,
    createdAt: new Date('2023-07-14T15:45:00Z'),
    sender: getBasicUserInfo('user-2'),
    priority: NotificationPriority.MEDIUM,
    payload: {
      tribeId: 'tribe-1',
      tribe: getTribeById('tribe-1')
    },
    actionUrl: '/tribes/tribe-1/chat',
    imageUrl: 'avatar_2.jpg'
  },
  {
    id: 'notification-4',
    type: NotificationType.AI_SUGGESTION,
    title: 'Event Suggestion',
    message: 'Outdoor Movie Night at Gasworks Park this Friday',
    isRead: true,
    createdAt: new Date('2023-07-14T13:20:00Z'),
    sender: null,
    priority: NotificationPriority.MEDIUM,
    payload: {
      eventId: 'event-4',
      event: getEventById('event-4'),
      suggestionType: 'event'
    },
    actionUrl: '/events/event-4',
    imageUrl: 'event_outdoor_movie.jpg'
  },
  {
    id: 'notification-5',
    type: NotificationType.ACHIEVEMENT,
    title: 'Achievement Unlocked',
    message: '"Social Butterfly" - Joined 3 different Tribes',
    isRead: false,
    createdAt: new Date('2023-07-14T09:15:00Z'),
    sender: null,
    priority: NotificationPriority.LOW,
    payload: {
      achievementId: 'achievement-1'
    },
    actionUrl: '/profile/achievements',
    imageUrl: 'achievement_social_butterfly.png'
  },
  {
    id: 'notification-6',
    type: NotificationType.TRIBE_INVITATION,
    title: 'Tribe Invitation',
    message: 'Tom invited you to join "Hiking Enthusiasts"',
    isRead: false,
    createdAt: new Date('2023-07-13T16:30:00Z'),
    sender: getBasicUserInfo('user-3'),
    priority: NotificationPriority.HIGH,
    payload: {
      tribeId: 'tribe-5',
      tribe: getTribeById('tribe-5')
    },
    actionUrl: '/tribes/tribe-5/join',
    imageUrl: 'tribe_5.jpg'
  },
  {
    id: 'notification-7',
    type: NotificationType.EVENT_INVITATION,
    title: 'Event Invitation',
    message: 'Food Truck Festival this Sunday at 2:00 PM',
    isRead: true,
    createdAt: new Date('2023-07-13T14:45:00Z'),
    sender: getBasicUserInfo('user-5'),
    priority: NotificationPriority.MEDIUM,
    payload: {
      eventId: 'event-2',
      event: getEventById('event-2')
    },
    actionUrl: '/events/event-2',
    imageUrl: 'event_food_truck_festival.jpg'
  },
  {
    id: 'notification-8',
    type: NotificationType.AI_SUGGESTION,
    title: 'Engagement Suggestion',
    message: 'Your tribe "Weekend Explorers" has been quiet lately. Start a conversation?',
    isRead: true,
    createdAt: new Date('2023-07-13T11:20:00Z'),
    sender: null,
    priority: NotificationPriority.MEDIUM,
    payload: {
      tribeId: 'tribe-1',
      tribe: getTribeById('tribe-1'),
      suggestionType: 'engagement'
    },
    actionUrl: '/tribes/tribe-1/chat',
    imageUrl: 'tribe_1.jpg'
  },
  {
    id: 'notification-9',
    type: NotificationType.TRIBE_UPDATE,
    title: 'Tribe Update',
    message: 'New member joined "Foodies United"',
    isRead: false,
    createdAt: new Date('2023-07-12T15:10:00Z'),
    sender: null,
    priority: NotificationPriority.LOW,
    payload: {
      tribeId: 'tribe-2',
      tribe: getTribeById('tribe-2')
    },
    actionUrl: '/tribes/tribe-2',
    imageUrl: 'tribe_2.jpg'
  },
  {
    id: 'notification-10',
    type: NotificationType.EVENT_UPDATE,
    title: 'Event Update',
    message: 'Location changed for Board Game Night',
    isRead: true,
    createdAt: new Date('2023-07-12T13:45:00Z'),
    sender: null,
    priority: NotificationPriority.HIGH,
    payload: {
      eventId: 'event-3',
      event: getEventById('event-3')
    },
    actionUrl: '/events/event-3',
    imageUrl: 'event_board_game_night.jpg'
  },
  {
    id: 'notification-11',
    type: NotificationType.SYSTEM,
    title: 'Welcome to Tribe',
    message: 'Complete your profile to get personalized tribe recommendations',
    isRead: true,
    createdAt: new Date('2023-07-10T09:00:00Z'),
    sender: null,
    priority: NotificationPriority.HIGH,
    payload: {},
    actionUrl: '/profile/edit',
    imageUrl: 'system_welcome.jpg'
  },
  {
    id: 'notification-12',
    type: NotificationType.AI_SUGGESTION,
    title: 'Conversation Starter',
    message: 'Try asking your tribe about their favorite hiking trails',
    isRead: true,
    createdAt: new Date('2023-07-09T14:30:00Z'),
    sender: null,
    priority: NotificationPriority.LOW,
    payload: {
      tribeId: 'tribe-1',
      tribe: getTribeById('tribe-1'),
      suggestionType: 'conversation'
    },
    actionUrl: '/tribes/tribe-1/chat',
    imageUrl: 'ai_conversation_starter.jpg'
  }
];

/**
 * Helper function to find a notification by ID
 * @param notificationId - Notification ID to search for
 * @returns The found notification or undefined
 */
const getNotificationById = (notificationId: string): Notification | undefined => {
  return mockNotifications.find(notification => notification.id === notificationId);
};

/**
 * Helper function to get unread notifications
 * @returns Array of unread notifications
 */
const getUnreadNotifications = (): Notification[] => {
  return mockNotifications.filter(notification => !notification.isRead);
};

/**
 * Helper function to get notifications by type
 * @param type - Notification type to filter by
 * @returns Array of notifications of the specified type
 */
const getNotificationsByType = (type: NotificationType): Notification[] => {
  return mockNotifications.filter(notification => notification.type === type);
};

/**
 * Helper function to get recent notifications
 * @param count - Number of recent notifications to retrieve
 * @returns Array of recent notifications
 */
const getRecentNotifications = (count: number): Notification[] => {
  return [...mockNotifications]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, count);
};

export {
  mockNotifications,
  getNotificationById,
  getUnreadNotifications,
  getNotificationsByType,
  getRecentNotifications
};

export default {
  mockNotifications,
  getNotificationById,
  getUnreadNotifications,
  getNotificationsByType,
  getRecentNotifications
};