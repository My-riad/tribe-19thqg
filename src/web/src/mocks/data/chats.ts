import { ChatMessage, AIPromptMessage, MessageType, MessageStatus, AIPromptType } from '../../types/chat.types';

const mockChatMessages: ChatMessage[] = [
  // Tribe 1 - Weekend Explorers
  {
    id: 'msg-1-1',
    tribeId: 'tribe-1',
    senderId: 'user-1',
    senderName: 'Alex Johnson',
    senderAvatar: 'avatar_1.jpg',
    content: 'Hey everyone! I was thinking we could check out Discovery Park this weekend. Anyone interested?',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-14T09:15:00Z'),
    deliveredAt: new Date('2023-07-14T09:15:05Z'),
    readAt: new Date('2023-07-14T09:20:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-1-2',
    tribeId: 'tribe-1',
    senderId: 'user-2',
    senderName: 'Sarah Miller',
    senderAvatar: 'avatar_2.jpg',
    content: 'That sounds great! I\'ve been wanting to check out the lighthouse trail.',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-14T09:18:00Z'),
    deliveredAt: new Date('2023-07-14T09:18:05Z'),
    readAt: new Date('2023-07-14T09:22:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-1-3',
    tribeId: 'tribe-1',
    senderId: 'user-3',
    senderName: 'Tom Nelson',
    senderAvatar: 'avatar_3.jpg',
    content: 'I\'m in! What time were you thinking?',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-14T09:20:00Z'),
    deliveredAt: new Date('2023-07-14T09:20:05Z'),
    readAt: new Date('2023-07-14T09:25:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-1-4',
    tribeId: 'tribe-1',
    senderId: 'user-1',
    senderName: 'Alex Johnson',
    senderAvatar: 'avatar_1.jpg',
    content: 'How about 10 AM on Saturday? We could meet at the main entrance.',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-14T09:22:00Z'),
    deliveredAt: new Date('2023-07-14T09:22:05Z'),
    readAt: new Date('2023-07-14T09:26:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-1-5',
    tribeId: 'tribe-1',
    senderId: 'user-4',
    senderName: 'Kelly Lee',
    senderAvatar: 'avatar_4.jpg',
    content: 'Works for me! Should we bring anything for a picnic after?',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-14T09:25:00Z'),
    deliveredAt: new Date('2023-07-14T09:25:05Z'),
    readAt: new Date('2023-07-14T09:30:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-1-6',
    tribeId: 'tribe-1',
    senderId: 'system',
    senderName: 'System',
    senderAvatar: '',
    content: 'Alex Johnson created an event: Trail Hike @ Discovery Park',
    messageType: MessageType.SYSTEM,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-14T09:26:00Z'),
    deliveredAt: new Date('2023-07-14T09:26:05Z'),
    readAt: new Date('2023-07-14T09:30:00Z'),
    metadata: {
      eventId: 'event-1'
    },
    isFromCurrentUser: false
  },
  {
    id: 'msg-1-7',
    tribeId: 'tribe-1',
    senderId: 'user-1',
    senderName: 'Alex Johnson',
    senderAvatar: 'avatar_1.jpg',
    content: 'I\'ve created the event! Everyone please RSVP so we know how many people to expect.',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-14T09:27:00Z'),
    deliveredAt: new Date('2023-07-14T09:27:05Z'),
    readAt: new Date('2023-07-14T09:35:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-1-8',
    tribeId: 'tribe-1',
    senderId: 'ai-assistant',
    senderName: 'Tribe Assistant',
    senderAvatar: 'ai_assistant.jpg',
    content: 'I noticed your group enjoys hiking. Discovery Park has a new trail that opened this week! Would you like to plan a visit?',
    messageType: MessageType.AI_PROMPT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-14T10:15:00Z'),
    deliveredAt: new Date('2023-07-14T10:15:05Z'),
    readAt: new Date('2023-07-14T10:20:00Z'),
    metadata: {
      promptId: 'prompt-1',
      promptType: AIPromptType.ACTIVITY_SUGGESTION
    },
    isFromCurrentUser: false
  },
  {
    id: 'msg-1-9',
    tribeId: 'tribe-1',
    senderId: 'user-2',
    senderName: 'Sarah Miller',
    senderAvatar: 'avatar_2.jpg',
    content: 'That sounds amazing! I\'ve been wanting to check it out.',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-14T10:22:00Z'),
    deliveredAt: new Date('2023-07-14T10:22:05Z'),
    readAt: new Date('2023-07-14T10:25:00Z'),
    metadata: {
      replyTo: 'msg-1-8'
    },
    isFromCurrentUser: false
  },
  {
    id: 'msg-1-10',
    tribeId: 'tribe-1',
    senderId: 'ai-assistant',
    senderName: 'Tribe Assistant',
    senderAvatar: 'ai_assistant.jpg',
    content: 'Based on everyone\'s availability, Saturday morning works best. Shall I create an event?',
    messageType: MessageType.AI_PROMPT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-14T10:32:00Z'),
    deliveredAt: new Date('2023-07-14T10:32:05Z'),
    readAt: new Date('2023-07-14T10:35:00Z'),
    metadata: {
      promptId: 'prompt-2',
      promptType: AIPromptType.ACTIVITY_SUGGESTION,
      options: ['Yes, create event', 'Suggest time']
    },
    isFromCurrentUser: false
  },
  
  // Tribe 2 - Foodies United
  {
    id: 'msg-2-1',
    tribeId: 'tribe-2',
    senderId: 'user-5',
    senderName: 'Jamie Park',
    senderAvatar: 'avatar_5.jpg',
    content: 'Hey food lovers! There\'s a food truck festival happening this Sunday at South Lake Union. Anyone want to check it out?',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-15T14:30:00Z'),
    deliveredAt: new Date('2023-07-15T14:30:05Z'),
    readAt: new Date('2023-07-15T14:35:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-2-2',
    tribeId: 'tribe-2',
    senderId: 'user-6',
    senderName: 'Michael Chen',
    senderAvatar: 'avatar_6.jpg',
    content: 'Oh that sounds delicious! What time does it start?',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-15T14:33:00Z'),
    deliveredAt: new Date('2023-07-15T14:33:05Z'),
    readAt: new Date('2023-07-15T14:38:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-2-3',
    tribeId: 'tribe-2',
    senderId: 'user-5',
    senderName: 'Jamie Park',
    senderAvatar: 'avatar_5.jpg',
    content: 'It runs from 11 AM to 6 PM. I was thinking we could meet around 2 PM?',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-15T14:35:00Z'),
    deliveredAt: new Date('2023-07-15T14:35:05Z'),
    readAt: new Date('2023-07-15T14:40:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-2-4',
    tribeId: 'tribe-2',
    senderId: 'user-7',
    senderName: 'Sophia Rodriguez',
    senderAvatar: 'avatar_7.jpg',
    content: 'Count me in! I\'ve been craving some good street food.',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-15T14:38:00Z'),
    deliveredAt: new Date('2023-07-15T14:38:05Z'),
    readAt: new Date('2023-07-15T14:42:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-2-5',
    tribeId: 'tribe-2',
    senderId: 'user-1',
    senderName: 'Alex Johnson',
    senderAvatar: 'avatar_1.jpg',
    content: 'I can make it too! 2 PM works for me.',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-15T14:40:00Z'),
    deliveredAt: new Date('2023-07-15T14:40:05Z'),
    readAt: new Date('2023-07-15T14:45:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-2-6',
    tribeId: 'tribe-2',
    senderId: 'system',
    senderName: 'System',
    senderAvatar: '',
    content: 'Jamie Park created an event: Food Truck Festival',
    messageType: MessageType.SYSTEM,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-15T14:45:00Z'),
    deliveredAt: new Date('2023-07-15T14:45:05Z'),
    readAt: new Date('2023-07-15T14:50:00Z'),
    metadata: {
      eventId: 'event-2'
    },
    isFromCurrentUser: false
  },
  {
    id: 'msg-2-7',
    tribeId: 'tribe-2',
    senderId: 'ai-assistant',
    senderName: 'Tribe Assistant',
    senderAvatar: 'ai_assistant.jpg',
    content: 'It\'s been quiet in the group lately. How about a quick icebreaker? If you could eat one cuisine for the rest of your life, what would it be and why?',
    messageType: MessageType.AI_PROMPT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-15T15:45:00Z'),
    deliveredAt: new Date('2023-07-15T15:45:05Z'),
    readAt: new Date('2023-07-15T15:50:00Z'),
    metadata: {
      promptId: 'prompt-3',
      promptType: AIPromptType.ICE_BREAKER,
      options: ['Respond', 'Skip', 'Suggest another']
    },
    isFromCurrentUser: false
  },
  
  // Tribe 3 - Board Game Enthusiasts
  {
    id: 'msg-3-1',
    tribeId: 'tribe-3',
    senderId: 'user-8',
    senderName: 'David Wilson',
    senderAvatar: 'avatar_8.jpg',
    content: 'Hey everyone! Who\'s up for a board game night next Tuesday at Mox Boarding House?',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-12T13:00:00Z'),
    deliveredAt: new Date('2023-07-12T13:00:05Z'),
    readAt: new Date('2023-07-12T13:05:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-3-2',
    tribeId: 'tribe-3',
    senderId: 'user-9',
    senderName: 'Emma Thompson',
    senderAvatar: 'avatar_9.jpg',
    content: 'I\'m in! What games are we thinking of playing?',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-12T13:10:00Z'),
    deliveredAt: new Date('2023-07-12T13:10:05Z'),
    readAt: new Date('2023-07-12T13:15:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-3-3',
    tribeId: 'tribe-3',
    senderId: 'user-10',
    senderName: 'Ryan Garcia',
    senderAvatar: 'avatar_10.jpg',
    content: 'I can bring Settlers of Catan and Ticket to Ride!',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-12T13:15:00Z'),
    deliveredAt: new Date('2023-07-12T13:15:05Z'),
    readAt: new Date('2023-07-12T13:20:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-3-4',
    tribeId: 'tribe-3',
    senderId: 'user-8',
    senderName: 'David Wilson',
    senderAvatar: 'avatar_8.jpg',
    content: 'Perfect! I\'ll also bring Pandemic and Codenames. How does 6 PM sound?',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-12T13:20:00Z'),
    deliveredAt: new Date('2023-07-12T13:20:05Z'),
    readAt: new Date('2023-07-12T13:25:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-3-5',
    tribeId: 'tribe-3',
    senderId: 'user-11',
    senderName: 'Olivia Kim',
    senderAvatar: 'avatar_11.jpg',
    content: 'Sounds great! I can make it at 6 PM.',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-12T13:25:00Z'),
    deliveredAt: new Date('2023-07-12T13:25:05Z'),
    readAt: new Date('2023-07-12T13:30:00Z'),
    metadata: null,
    isFromCurrentUser: false
  },
  {
    id: 'msg-3-6',
    tribeId: 'tribe-3',
    senderId: 'system',
    senderName: 'System',
    senderAvatar: '',
    content: 'David Wilson created an event: Board Game Night',
    messageType: MessageType.SYSTEM,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-12T14:25:00Z'),
    deliveredAt: new Date('2023-07-12T14:25:05Z'),
    readAt: new Date('2023-07-12T14:30:00Z'),
    metadata: {
      eventId: 'event-3'
    },
    isFromCurrentUser: false
  },
  {
    id: 'msg-3-7',
    tribeId: 'tribe-3',
    senderId: 'ai-assistant',
    senderName: 'Tribe Assistant',
    senderAvatar: 'ai_assistant.jpg',
    content: 'I see you all enjoy board games! Have you tried the new cooperative game "The Mind"? It\'s a unique experience that tests how well you can read each other without speaking.',
    messageType: MessageType.AI_PROMPT,
    status: MessageStatus.DELIVERED,
    sentAt: new Date('2023-07-12T15:00:00Z'),
    deliveredAt: new Date('2023-07-12T15:00:05Z'),
    readAt: new Date('2023-07-12T15:05:00Z'),
    metadata: {
      promptId: 'prompt-4',
      promptType: AIPromptType.ACTIVITY_SUGGESTION
    },
    isFromCurrentUser: false
  }
];

const mockAIPrompts: AIPromptMessage[] = [
  {
    id: 'prompt-1',
    tribeId: 'tribe-1',
    promptType: AIPromptType.ACTIVITY_SUGGESTION,
    content: 'I noticed your group enjoys hiking. Discovery Park has a new trail that opened this week! Would you like to plan a visit?',
    options: null,
    createdAt: new Date('2023-07-14T10:15:00Z'),
    expiresAt: new Date('2023-07-21T10:15:00Z'),
    respondedBy: ['user-2'],
    skippedBy: [],
    metadata: null
  },
  {
    id: 'prompt-2',
    tribeId: 'tribe-1',
    promptType: AIPromptType.ACTIVITY_SUGGESTION,
    content: 'Based on everyone\'s availability, Saturday morning works best. Shall I create an event?',
    options: ['Yes, create event', 'Suggest time'],
    createdAt: new Date('2023-07-14T10:32:00Z'),
    expiresAt: new Date('2023-07-21T10:32:00Z'),
    respondedBy: [],
    skippedBy: [],
    metadata: null
  },
  {
    id: 'prompt-3',
    tribeId: 'tribe-2',
    promptType: AIPromptType.ICE_BREAKER,
    content: 'If you could eat one cuisine for the rest of your life, what would it be and why?',
    options: ['Respond', 'Skip', 'Suggest another'],
    createdAt: new Date('2023-07-15T15:45:00Z'),
    expiresAt: new Date('2023-07-22T15:45:00Z'),
    respondedBy: [],
    skippedBy: [],
    metadata: null
  },
  {
    id: 'prompt-4',
    tribeId: 'tribe-3',
    promptType: AIPromptType.ACTIVITY_SUGGESTION,
    content: 'Have you tried the new cooperative game "The Mind"? It\'s a unique experience that tests how well you can read each other without speaking.',
    options: null,
    createdAt: new Date('2023-07-12T15:00:00Z'),
    expiresAt: new Date('2023-07-19T15:00:00Z'),
    respondedBy: [],
    skippedBy: [],
    metadata: null
  },
  {
    id: 'prompt-5',
    tribeId: 'tribe-1',
    promptType: AIPromptType.CONVERSATION_STARTER,
    content: 'What\'s the most beautiful hiking trail you\'ve ever experienced?',
    options: null,
    createdAt: new Date('2023-07-10T09:00:00Z'),
    expiresAt: new Date('2023-07-17T09:00:00Z'),
    respondedBy: ['user-1', 'user-3'],
    skippedBy: ['user-2'],
    metadata: null
  },
  {
    id: 'prompt-6',
    tribeId: 'tribe-2',
    promptType: AIPromptType.POLL,
    content: 'What type of cuisine should we explore next?',
    options: ['Italian', 'Thai', 'Mexican', 'Indian', 'Japanese'],
    createdAt: new Date('2023-07-08T12:30:00Z'),
    expiresAt: new Date('2023-07-15T12:30:00Z'),
    respondedBy: ['user-5', 'user-6', 'user-7', 'user-1'],
    skippedBy: [],
    metadata: {
      votes: {
        'Italian': 1,
        'Thai': 0,
        'Mexican': 1,
        'Indian': 1,
        'Japanese': 1
      }
    }
  },
  {
    id: 'prompt-7',
    tribeId: 'tribe-3',
    promptType: AIPromptType.GROUP_CHALLENGE,
    content: 'Challenge: Each member brings a game no one else in the group has played before to the next meetup!',
    options: ['Accept Challenge', 'Skip Challenge'],
    createdAt: new Date('2023-07-05T16:45:00Z'),
    expiresAt: new Date('2023-07-12T16:45:00Z'),
    respondedBy: ['user-8', 'user-9', 'user-10'],
    skippedBy: ['user-11'],
    metadata: null
  }
];

/**
 * Helper function to get chat messages for a specific tribe
 * @param tribeId The ID of the tribe to get messages for
 * @returns Array of chat messages for the specified tribe
 */
const getChatMessagesByTribeId = (tribeId: string): ChatMessage[] => {
  return mockChatMessages
    .filter(message => message.tribeId === tribeId)
    .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
};

/**
 * Helper function to get AI prompts for a specific tribe
 * @param tribeId The ID of the tribe to get prompts for
 * @returns Array of AI prompts for the specified tribe
 */
const getAIPromptsByTribeId = (tribeId: string): AIPromptMessage[] => {
  return mockAIPrompts
    .filter(prompt => prompt.tribeId === tribeId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

/**
 * Helper function to get active (non-expired) AI prompts for a specific tribe
 * @param tribeId The ID of the tribe to get active prompts for
 * @returns Array of active AI prompts for the specified tribe
 */
const getActiveAIPromptsByTribeId = (tribeId: string): AIPromptMessage[] => {
  const now = new Date();
  return mockAIPrompts
    .filter(prompt => prompt.tribeId === tribeId && prompt.expiresAt && prompt.expiresAt > now)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export {
  mockChatMessages,
  mockAIPrompts,
  getChatMessagesByTribeId,
  getAIPromptsByTribeId,
  getActiveAIPromptsByTribeId
};

export default {
  mockChatMessages,
  mockAIPrompts,
  getChatMessagesByTribeId,
  getAIPromptsByTribeId,
  getActiveAIPromptsByTribeId
};