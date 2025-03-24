import { Server } from 'socket.io'; // ^4.6.1
import { ChatService } from '../src/services/chat.service';
import { ChatModel } from '../src/models/chat.model';
import { MemberModel } from '../src/models/member.model';
import { TribeModel } from '../src/models/tribe.model';
import { IChatMessage, IChatMessageCreate, MessageType, MembershipStatus, MemberRole } from '@shared/types';
import { ApiError } from '@shared/errors/api.error';
import { promptService } from '../../engagement-service/src/services/prompt.service';
import { notificationService } from '../../notification-service/src/services/notification.service';

// Mock Prisma client
const mockPrisma = {
  chatMessage: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
  tribeMembership: {
    findFirst: jest.fn(),
  },
  tribe: {
    findUnique: jest.fn(),
  },
};

// Mock Socket.io server
const mockSocketServer = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  on: jest.fn(),
  sockets: {
    adapter: {
      rooms: new Map(),
    },
  },
};

// Mock MemberModel
jest.mock('../src/models/member.model', () => {
  return {
    MemberModel: jest.fn().mockImplementation(() => ({
      findByTribeAndUser: jest.fn(),
      findByTribeId: jest.fn(),
      updateLastActive: jest.fn(),
    })),
  };
});

// Mock TribeModel
jest.mock('../src/models/tribe.model', () => {
  return {
    TribeModel: jest.fn().mockImplementation(() => ({
      findById: jest.fn(),
      updateLastActive: jest.fn(),
    })),
  };
});

// Mock promptService
jest.mock('../../engagement-service/src/services/prompt.service', () => ({
  promptService: {
    getRandomPrompt: jest.fn(),
    generateAIPrompt: jest.fn(),
  },
}));

// Mock notificationService
jest.mock('../../notification-service/src/services/notification.service', () => ({
  notificationService: {
    create: jest.fn(),
  },
}));

// Mock ChatModel
jest.mock('../src/models/chat.model', () => {
  return {
    ChatModel: jest.fn().mockImplementation(() => ({
      createMessage: jest.fn(),
      getMessage: jest.fn(),
      getMessages: jest.fn(),
      getMessagesByUser: jest.fn(),
      getMessagesByType: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      getUnreadCount: jest.fn(),
      deleteMessage: jest.fn(),
      searchMessages: jest.fn(),
    })),
  };
});

// Helper function to create a mock chat message
const generateMockMessage = (overrides: Partial<IChatMessage> = {}): IChatMessage => {
  const id = overrides.id || 'mock-message-id';
  const tribeId = overrides.tribeId || 'mock-tribe-id';
  const userId = overrides.userId || 'mock-user-id';
  const content = overrides.content || 'Mock message content';
  const messageType = overrides.messageType || MessageType.TEXT;
  const sentAt = overrides.sentAt || new Date();
  const isRead = overrides.isRead !== undefined ? overrides.isRead : false;
  const metadata = overrides.metadata || {};

  return {
    id,
    tribeId,
    userId,
    content,
    messageType,
    sentAt,
    isRead,
    metadata,
  };
};

describe('ChatService', () => {
  let chatService: ChatService;
  let chatModel: any;
  let memberModel: any;
  let tribeModel: any;

  beforeEach(() => {
    jest.clearAllMocks();
    chatService = new ChatService(mockPrisma as any, mockSocketServer as any);
    chatModel = new ChatModel(mockPrisma as any);
    memberModel = new MemberModel(mockPrisma as any);
    tribeModel = new TribeModel(mockPrisma as any);
  });

  describe('sendMessage', () => {
    it('should send a new message with valid data', async () => {
      const messageData: IChatMessageCreate = {
        tribeId: 'tribe123',
        userId: 'user456',
        content: 'Hello, Tribe!',
        messageType: MessageType.TEXT,
        metadata: { key: 'value' },
      };

      (mockPrisma.chatMessage.create as jest.Mock).mockResolvedValue(generateMockMessage(messageData));
      (memberModel.findByTribeAndUser as jest.Mock).mockResolvedValue({ id: 'member123' });
      (tribeModel.findById as jest.Mock).mockResolvedValue({ id: 'tribe123' });
      (memberModel.findByTribeId as jest.Mock).mockResolvedValue([]);

      const message = await chatService.sendMessage(messageData);

      expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith({
        data: messageData,
      });
      expect(message.content).toBe(messageData.content);
    });

    it('should set default messageType to TEXT if not provided', async () => {
      const messageData: any = {
        tribeId: 'tribe123',
        userId: 'user456',
        content: 'Hello, Tribe!',
      };

      (mockPrisma.chatMessage.create as jest.Mock).mockResolvedValue(generateMockMessage(messageData));
      (memberModel.findByTribeAndUser as jest.Mock).mockResolvedValue({ id: 'member123' });
      (tribeModel.findById as jest.Mock).mockResolvedValue({ id: 'tribe123' });
      (memberModel.findByTribeId as jest.Mock).mockResolvedValue([]);

      const message = await chatService.sendMessage(messageData);

      expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith({
        data: { ...messageData, messageType: MessageType.TEXT },
      });
      expect(message.messageType).toBe(MessageType.TEXT);
    });

    it('should set default metadata to empty object if not provided', async () => {
      const messageData: any = {
        tribeId: 'tribe123',
        userId: 'user456',
        content: 'Hello, Tribe!',
        messageType: MessageType.TEXT,
      };

      (mockPrisma.chatMessage.create as jest.Mock).mockResolvedValue(generateMockMessage(messageData));
      (memberModel.findByTribeAndUser as jest.Mock).mockResolvedValue({ id: 'member123' });
      (tribeModel.findById as jest.Mock).mockResolvedValue({ id: 'tribe123' });
      (memberModel.findByTribeId as jest.Mock).mockResolvedValue([]);

      const message = await chatService.sendMessage(messageData);

      expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith({
        data: { ...messageData, messageType: MessageType.TEXT, metadata: {} },
      });
      expect(message.metadata).toEqual({});
    });

    it('should throw error if tribe does not exist', async () => {
      const messageData: IChatMessageCreate = {
        tribeId: 'tribe123',
        userId: 'user456',
        content: 'Hello, Tribe!',
        messageType: MessageType.TEXT,
        metadata: { key: 'value' },
      };

      (tribeModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(chatService.sendMessage(messageData)).rejects.toThrow(ApiError);
      expect(mockPrisma.chatMessage.create).not.toHaveBeenCalled();
    });

    it('should throw error if user is not a member of the tribe', async () => {
      const messageData: IChatMessageCreate = {
        tribeId: 'tribe123',
        userId: 'user456',
        content: 'Hello, Tribe!',
        messageType: MessageType.TEXT,
        metadata: { key: 'value' },
      };

      (tribeModel.findById as jest.Mock).mockResolvedValue({ id: 'tribe123' });
      (memberModel.findByTribeAndUser as jest.Mock).mockResolvedValue(null);

      await expect(chatService.sendMessage(messageData)).rejects.toThrow(ApiError);
      expect(mockPrisma.chatMessage.create).not.toHaveBeenCalled();
    });

    it('should create message in database', async () => {
      const messageData: IChatMessageCreate = {
        tribeId: 'tribe123',
        userId: 'user456',
        content: 'Hello, Tribe!',
        messageType: MessageType.TEXT,
        metadata: { key: 'value' },
      };

      (mockPrisma.chatMessage.create as jest.Mock).mockResolvedValue(generateMockMessage(messageData));
      (memberModel.findByTribeAndUser as jest.Mock).mockResolvedValue({ id: 'member123' });
      (tribeModel.findById as jest.Mock).mockResolvedValue({ id: 'tribe123' });
      (memberModel.findByTribeId as jest.Mock).mockResolvedValue([]);

      await chatService.sendMessage(messageData);

      expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith({
        data: messageData,
      });
    });

    it('should emit message to tribe room via socket.io', async () => {
      const messageData: IChatMessageCreate = {
        tribeId: 'tribe123',
        userId: 'user456',
        content: 'Hello, Tribe!',
        messageType: MessageType.TEXT,
        metadata: { key: 'value' },
      };

      (mockPrisma.chatMessage.create as jest.Mock).mockResolvedValue(generateMockMessage(messageData));
      (memberModel.findByTribeAndUser as jest.Mock).mockResolvedValue({ id: 'member123' });
      (tribeModel.findById as jest.Mock).mockResolvedValue({ id: 'tribe123' });
      (memberModel.findByTribeId as jest.Mock).mockResolvedValue([]);

      const message = await chatService.sendMessage(messageData);

      expect(mockSocketServer.to).toHaveBeenCalledWith(messageData.tribeId);
      expect(mockSocketServer.emit).toHaveBeenCalledWith('newMessage', message);
    });

    it('should return the created message', async () => {
      const messageData: IChatMessageCreate = {
        tribeId: 'tribe123',
        userId: 'user456',
        content: 'Hello, Tribe!',
        messageType: MessageType.TEXT,
        metadata: { key: 'value' },
      };

      const mockMessage = generateMockMessage(messageData);
      (mockPrisma.chatMessage.create as jest.Mock).mockResolvedValue(mockMessage);
      (memberModel.findByTribeAndUser as jest.Mock).mockResolvedValue({ id: 'member123' });
      (tribeModel.findById as jest.Mock).mockResolvedValue({ id: 'tribe123' });
      (memberModel.findByTribeId as jest.Mock).mockResolvedValue([]);

      const message = await chatService.sendMessage(messageData);

      expect(message).toEqual(mockMessage);
    });
  });

  describe('getMessage', () => {
    it('should return message by ID', async () => {
      const messageId = 'message123';
      const mockMessage = generateMockMessage({ id: messageId });
      (mockPrisma.chatMessage.findUnique as jest.Mock).mockResolvedValue(mockMessage);

      const message = await chatService.getMessage(messageId);

      expect(mockPrisma.chatMessage.findUnique).toHaveBeenCalledWith({
        where: { id: messageId },
      });
      expect(message).toEqual(mockMessage);
    });

    it('should throw error if message not found', async () => {
      const messageId = 'message123';
      (mockPrisma.chatMessage.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(chatService.getMessage(messageId)).rejects.toThrow(ApiError);
      expect(mockPrisma.chatMessage.findUnique).toHaveBeenCalledWith({
        where: { id: messageId },
      });
    });
  });
});