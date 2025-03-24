import { server, worker } from './server';
import { handlers } from './handlers';
import { mockUsers, mockProfiles, getUserById, getProfileByUserId, getUsersWithCompletedProfiles, searchUsers } from './data/users';
import { mockTribes, mockTribeSuggestions, getTribeById, getTribesByUserId, getTribeSuggestions, searchTribes } from './data/tribes';
import { mockEvents, getEventById, getEventsByTribeId, getUpcomingEvents, getEventSuggestions, getOptimalTimeSlots } from './data/events';
import { mockNotifications, getNotificationById, getUnreadNotifications, getRecentNotifications } from './data/notifications';
import { mockChatMessages, mockAIPrompts, getChatMessagesByTribeId, getAIPromptsByTribeId, getActiveAIPromptsByTribeId } from './data/chats';

/**
 * Initializes the mock service worker in the browser environment
 */
const initializeMocks = (): void => {
  // Check if the environment is a browser environment
  if (typeof window !== 'undefined') {
    // If in browser environment, start the MSW worker
    worker.start({
      onUnhandledRequest: 'bypass', // Allows unmocked requests to pass through
    });
    console.info('Tribe: Mock service worker initialized.');
  }
};

export {
    server,
    worker,
    handlers,
    initializeMocks,
    mockUsers,
    mockProfiles,
    mockTribes,
    mockTribeSuggestions,
    mockEvents,
    mockNotifications,
    mockChatMessages,
    mockAIPrompts,
    getUserById,
    getProfileByUserId,
    getUsersWithCompletedProfiles,
    searchUsers,
    getTribeById,
    getTribesByUserId,
    getTribeSuggestions,
    searchTribes,
    getEventById,
    getEventsByTribeId,
    getUpcomingEvents,
    getEventSuggestions,
    getOptimalTimeSlots,
    getNotificationById,
    getUnreadNotifications,
    getRecentNotifications,
    getChatMessagesByTribeId,
    getAIPromptsByTribeId,
    getActiveAIPromptsByTribeId,
};