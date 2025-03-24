// socket.service.ts
import { Server, Socket } from 'socket.io'; // ^4.6.1
import { PrismaClient } from '@prisma/client'; // ^4.16.0
import {
  IChatMessage,
  IChatMessageCreate,
  MessageType,
  MembershipStatus,
  MemberRole,
} from '@shared/types';
import { ApiError } from '@shared/errors';
import { logger } from '@shared/utils';
import { notificationService } from '../../notification-service/src/services/notification.service';
import { promptService } from '../../engagement-service/src/services/prompt.service';
import { ChatModel } from '../models/chat.model';
import { MemberModel } from '../models/member.model';
import { TribeModel } from '../models/tribe.model';

/**
 * Service class for managing chat functionality within tribes
 */
export class ChatService {
  private chatModel: ChatModel;
  private memberModel: MemberModel;
  private tribeModel: TribeModel;
  private io: Server;

  /**
   * Initialize the chat service with required models and socket server
   * @param prisma - PrismaClient instance
   * @param socketServer - Socket.io server instance
   */
  constructor(prisma: PrismaClient, socketServer: Server) {
    // Initialize chatModel with prisma client
    this.chatModel = new ChatModel(prisma);

    // Initialize memberModel with prisma client
    this.memberModel = new MemberModel(prisma);

    // Initialize tribeModel with prisma client
    this.tribeModel = new TribeModel(prisma);

    // Store socket.io server instance
    this.io = socketServer;

    // Set up socket event handlers for chat functionality
    this.setupSocketHandlers();
  }

  /**
   * Send a new message to a tribe chat
   * @param messageData - The message data
   * @returns The created message
   */
  async sendMessage(messageData: IChatMessageCreate): Promise<IChatMessage> {
    // Validate message data (tribeId, userId, content)
    if (!messageData.tribeId || !messageData.userId || !messageData.content) {
      throw ApiError.badRequest('Tribe ID, User ID, and message content are required');
    }

    // Verify sender is a member of the tribe
    const isMember = await this.verifyTribeMembership(messageData.tribeId, messageData.userId);
    if (!isMember) {
      throw ApiError.forbidden('User is not a member of this tribe');
    }

    // Create message in database using chatModel
    const message = await this.chatModel.createMessage(messageData);

    // Emit message to tribe room via socket.io
    this.io.to(messageData.tribeId).emit('newMessage', message);

    // Update tribe and member lastActive timestamps
    await this.tribeModel.updateLastActive(messageData.tribeId);
    const membership = await this.memberModel.findByTribeAndUser(messageData.tribeId, messageData.userId);
    if (membership) {
      await this.memberModel.updateLastActive(membership.id);
    }

    // Send notifications to tribe members not currently in the chat
    const tribeMembers = await this.memberModel.findByTribeId(messageData.tribeId, { status: MembershipStatus.ACTIVE });
    tribeMembers.forEach(async member => {
      if (member.userId !== messageData.userId) {
        // Check if user is in the room
        const socketsInRoom = await this.io.in(messageData.tribeId).fetchSockets();
        const userIsInRoom = socketsInRoom.some(socket => socket.data.userId === member.userId);

        if (!userIsInRoom) {
          // Send notification
          await notificationService.create({
            userId: member.userId,
            type: NotificationType.TRIBE_CHAT,
            title: `New message in ${messageData.tribeId}`,
            body: messageData.content,
            priority: 'medium',
            tribeId: messageData.tribeId,
          });
        }
      }
    });

    // Return the created message
    return message;
  }

  /**
   * Get a specific message by ID
   * @param messageId - The message ID
   * @returns The requested message
   */
  async getMessage(messageId: string): Promise<IChatMessage> {
    // Validate message ID
    if (!messageId) {
      throw ApiError.badRequest('Message ID is required');
    }

    // Retrieve message from database using chatModel
    const message = await this.chatModel.getMessage(messageId);

    // If message not found, throw NotFound error
    if (!message) {
      throw ApiError.notFound(`Message with ID ${messageId} not found`);
    }

    // Return the message
    return message;
  }

  /**
   * Get messages for a tribe with pagination
   * @param tribeId - The tribe ID
   * @param options - Pagination options
   * @returns Paginated messages and total count
   */
  async getMessages(tribeId: string, options: { page?: number; limit?: number }): Promise<{ messages: IChatMessage[]; total: number }> {
    // Validate tribe ID
    if (!tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }

    // Verify tribe exists
    const tribe = await this.tribeModel.findById(tribeId);
    if (!tribe) {
      throw ApiError.notFound(`Tribe with ID ${tribeId} not found`);
    }

    // Set default pagination options if not provided
    const page = options.page || 1;
    const limit = options.limit || 20;

    // Retrieve messages from database using chatModel
    const { messages, total } = await this.chatModel.getMessages(tribeId, { page, limit });

    // Return messages and total count
    return { messages, total };
  }

  /**
   * Get messages sent by a specific user in a tribe
   * @param tribeId - The tribe ID
   * @param userId - The user ID
   * @param options - Pagination options
   * @returns Paginated messages and total count
   */
  async getMessagesByUser(tribeId: string, userId: string, options: { page?: number; limit?: number }): Promise<{ messages: IChatMessage[]; total: number }> {
    // Validate tribe ID and user ID
    if (!tribeId || !userId) {
      throw ApiError.badRequest('Tribe ID and User ID are required');
    }

    // Verify tribe exists and user is a member
    const isMember = await this.verifyTribeMembership(tribeId, userId);
    if (!isMember) {
      throw ApiError.forbidden('User is not a member of this tribe');
    }

    // Set default pagination options if not provided
    const page = options.page || 1;
    const limit = options.limit || 20;

    // Retrieve messages from database using chatModel
    const { messages, total } = await this.chatModel.getMessagesByUser(tribeId, userId, { page, limit });

    // Return messages and total count
    return { messages, total };
  }

  /**
   * Get messages of a specific type in a tribe
   * @param tribeId - The tribe ID
   * @param messageType - The message type
   * @param options - Pagination options
   * @returns Paginated messages and total count
   */
  async getMessagesByType(tribeId: string, messageType: MessageType, options: { page?: number; limit?: number }): Promise<{ messages: IChatMessage[]; total: number }> {
    // Validate tribe ID and message type
    if (!tribeId || !messageType) {
      throw ApiError.badRequest('Tribe ID and Message Type are required');
    }

    // Verify tribe exists
    const tribe = await this.tribeModel.findById(tribeId);
    if (!tribe) {
      throw ApiError.notFound(`Tribe with ID ${tribeId} not found`);
    }

    // Set default pagination options if not provided
    const page = options.page || 1;
    const limit = options.limit || 20;

    // Retrieve messages from database using chatModel
    const { messages, total } = await this.chatModel.getMessagesByType(tribeId, messageType, { page, limit });

    // Return messages and total count
    return { messages, total };
  }

  /**
   * Mark specific messages as read for a user
   * @param userId - The user ID
   * @param messageIds - Array of message IDs to mark as read
   * @returns Number of messages marked as read
   */
  async markAsRead(userId: string, messageIds: string[]): Promise<number> {
    // Validate user ID and message IDs
    if (!userId || !messageIds || messageIds.length === 0) {
      throw ApiError.badRequest('User ID and Message IDs are required');
    }

    // Update messages as read in database using chatModel
    const count = await this.chatModel.markAsRead(userId, messageIds);

    // Emit read status update via socket.io
    this.io.to(userId).emit('readReceipt', { messageIds, userId });

    // Return count of updated messages
    return count;
  }

  /**
   * Mark all messages in a tribe as read for a user
   * @param tribeId - The tribe ID
   * @param userId - The user ID
   * @returns Number of messages marked as read
   */
  async markAllAsRead(tribeId: string, userId: string): Promise<number> {
    // Validate tribe ID and user ID
    if (!tribeId || !userId) {
      throw ApiError.badRequest('Tribe ID and User ID are required');
    }

    // Verify user is a member of the tribe
    const isMember = await this.verifyTribeMembership(tribeId, userId);
    if (!isMember) {
      throw ApiError.forbidden('User is not a member of this tribe');
    }

    // Update all messages as read in database using chatModel
    const count = await this.chatModel.markAllAsRead(tribeId, userId);

    // Emit read status update via socket.io
    this.io.to(tribeId).emit('readReceipt', { tribeId, userId });

    // Return count of updated messages
    return count;
  }

  /**
   * Get count of unread messages for a user in a tribe
   * @param tribeId - The tribe ID
   * @param userId - The user ID
   * @returns Count of unread messages
   */
  async getUnreadCount(tribeId: string, userId: string): Promise<number> {
    // Validate tribe ID and user ID
    if (!tribeId || !userId) {
      throw ApiError.badRequest('Tribe ID and User ID are required');
    }

    // Verify user is a member of the tribe
    const isMember = await this.verifyTribeMembership(tribeId, userId);
    if (!isMember) {
      throw ApiError.forbidden('User is not a member of this tribe');
    }

    // Get unread count from database using chatModel
    const count = await this.chatModel.getUnreadCount(tribeId, userId);

    // Return unread count
    return count;
  }

  /**
   * Delete a specific message
   * @param messageId - The message ID
   * @param userId - The user ID (for authorization)
   * @returns True if deleted successfully
   */
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    // Validate message ID and user ID
    if (!messageId || !userId) {
      throw ApiError.badRequest('Message ID and User ID are required');
    }

    // Verify user is the message sender or has admin rights
    // (Implementation depends on how admin rights are managed)

    // Delete message from database using chatModel
    const success = await this.chatModel.deleteMessage(messageId, userId);

    // Emit message deletion event via socket.io
    this.io.to(messageId).emit('messageDeleted', { messageId });

    // Return deletion success status
    return success;
  }

  /**
   * Search for messages in a tribe by content
   * @param tribeId - The tribe ID
   * @param query - The search query
   * @param options - Pagination options
   * @returns Matching messages and total count
   */
  async searchMessages(tribeId: string, query: string, options: { page?: number; limit?: number }): Promise<{ messages: IChatMessage[]; total: number }> {
    // Validate tribe ID and search query
    if (!tribeId || !query) {
      throw ApiError.badRequest('Tribe ID and Search Query are required');
    }

    // Verify tribe exists
    const tribe = await this.tribeModel.findById(tribeId);
    if (!tribe) {
      throw ApiError.notFound(`Tribe with ID ${tribeId} not found`);
    }

    // Set default search options if not provided
    const page = options.page || 1;
    const limit = options.limit || 20;

    // Search messages in database using chatModel
    const { messages, total } = await this.chatModel.searchMessages(tribeId, query, { page, limit });

    // Return matching messages and total count
    return { messages, total };
  }

  /**
   * Generate an AI-powered conversation prompt for a tribe
   * @param tribeId - The tribe ID
   * @param userId - The user ID
   * @param context - Additional context for prompt generation
   * @returns The created AI prompt message
   */
  async generateAIPrompt(tribeId: string, userId: string, context: any): Promise<IChatMessage> {
    // Validate tribe ID and user ID
    if (!tribeId || !userId) {
      throw ApiError.badRequest('Tribe ID and User ID are required');
    }

    // Verify user is a member of the tribe with appropriate permissions
    const isMember = await this.verifyTribeMembership(tribeId, userId);
    if (!isMember) {
      throw ApiError.forbidden('User is not a member of this tribe');
    }

    // Retrieve tribe data including interests and recent activity
    const tribe = await this.tribeModel.findById(tribeId);
    if (!tribe) {
      throw ApiError.notFound(`Tribe with ID ${tribeId} not found`);
    }

    // Generate AI prompt using promptService
    const prompt = await promptService.getRandomPrompt(MessageType.AI_PROMPT, PromptCategory.GENERAL);
    if (!prompt) {
      throw ApiError.notFound('No AI prompts found');
    }

    // Create message with type AI_PROMPT
    const messageData: IChatMessageCreate = {
      tribeId,
      userId,
      content: prompt.content,
      messageType: MessageType.AI_PROMPT,
      metadata: {
        promptId: prompt.id,
        ...context,
      },
    };

    // Send message to tribe chat
    const message = await this.sendMessage(messageData);

    // Return the created message
    return message;
  }

  /**
   * Set up socket.io event handlers for chat functionality
   */
  private setupSocketHandlers(): void {
    // Set up connection event handler
    this.io.on('connection', (socket: Socket) => this.handleSocketConnection(socket));
  }

  /**
   * Handle new socket connections
   * @param socket - The socket instance
   */
  private handleSocketConnection(socket: Socket): void {
    // Authenticate socket connection
    // (Implementation depends on authentication method)
    const userId = socket.handshake.query.userId as string;
    if (!userId) {
      logger.warn('Socket connection unauthorized: missing userId');
      socket.disconnect(true);
      return;
    }

    // Store user ID in socket data for later use
    socket.data.userId = userId;
    logger.info(`Socket connected: ${socket.id}, userId: ${userId}`);

    // Set up event handlers for the connected socket
    socket.on('joinRoom', (tribeId: string, callback: Function) => this.handleJoinRoom(socket, tribeId, userId, callback));
    socket.on('leaveRoom', (tribeId: string, callback: Function) => this.handleLeaveRoom(socket, tribeId, userId, callback));
    socket.on('newMessage', (messageData: any, callback: Function) => this.handleNewMessage(socket, messageData, callback));
    socket.on('typing', (data: any) => this.handleTypingIndicator(socket, data));
    socket.on('readReceipts', (data: any, callback: Function) => this.handleReadReceipts(socket, data, callback));

    // Handle disconnection cleanup
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}, userId: ${userId}`);
      // Clean up any room associations or resources
    });

    // Set up error handling for socket events
    socket.on('error', (error: Error) => {
      logger.error(`Socket error: ${socket.id}, userId: ${userId}`, error);
      // Handle socket errors
    });
  }

  /**
   * Handle a user joining a chat room
   * @param socket - The socket instance
   * @param tribeId - The tribe ID
   * @param userId - The user ID
   * @param callback - Callback function to execute after joining
   */
  private handleJoinRoom(socket: Socket, tribeId: string, userId: string, callback: Function): void {
    // Verify user is a member of the tribe
    this.verifyTribeMembership(tribeId, userId)
      .then(isMember => {
        if (!isMember) {
          logger.warn(`Unauthorized attempt to join room: ${socket.id}, tribeId: ${tribeId}, userId: ${userId}`);
          return callback({ status: 'error', message: 'Unauthorized' });
        }

        // Add socket to the tribe room
        socket.join(tribeId);
        logger.info(`Socket joined room: ${socket.id}, tribeId: ${tribeId}, userId: ${userId}`);

        // Notify other members that user has joined
        socket.broadcast.to(tribeId).emit('userJoined', { userId, tribeId });

        // Update member's lastActive timestamp
        this.memberModel.findByTribeAndUser(tribeId, userId)
          .then(membership => {
            if (membership) {
              this.memberModel.updateLastActive(membership.id);
            }
          });

        // Execute callback with success status
        callback({ status: 'success' });
      })
      .catch(error => {
        logger.error(`Failed to join room: ${socket.id}, tribeId: ${tribeId}, userId: ${userId}`, error);
        callback({ status: 'error', message: error.message });
      });
  }

  /**
   * Handle a user leaving a chat room
   * @param socket - The socket instance
   * @param tribeId - The tribe ID
   * @param userId - The user ID
   * @param callback - Callback function to execute after leaving
   */
  private handleLeaveRoom(socket: Socket, tribeId: string, userId: string, callback: Function): void {
    // Remove socket from the tribe room
    socket.leave(tribeId);
    logger.info(`Socket left room: ${socket.id}, tribeId: ${tribeId}, userId: ${userId}`);

    // Notify other members that user has left
    socket.broadcast.to(tribeId).emit('userLeft', { userId, tribeId });

    // Execute callback with success status
    callback({ status: 'success' });
  }

  /**
   * Handle a new message from a socket
   * @param socket - The socket instance
   * @param messageData - The message data
   * @param callback - Callback function to execute after sending
   */
  private handleNewMessage(socket: Socket, messageData: any, callback: Function): void {
    // Validate message data
    if (!messageData || !messageData.tribeId || !messageData.content) {
      logger.warn(`Invalid message data: ${socket.id}, messageData: ${JSON.stringify(messageData)}`);
      return callback({ status: 'error', message: 'Invalid message data' });
    }

    // Create message using sendMessage method
    this.sendMessage({
      tribeId: messageData.tribeId,
      userId: socket.data.userId,
      content: messageData.content,
      messageType: messageData.messageType || MessageType.TEXT,
      metadata: messageData.metadata || {}
    })
      .then(message => {
        logger.info(`New message sent: ${socket.id}, messageId: ${message.id}, tribeId: ${message.tribeId}`);
        // Execute callback with created message
        callback({ status: 'success', message });
      })
      .catch(error => {
        logger.error(`Failed to send message: ${socket.id}, messageData: ${JSON.stringify(messageData)}`, error);
        callback({ status: 'error', message: error.message });
      });
  }

  /**
   * Handle typing indicator updates
   * @param socket - The socket instance
   * @param data - The typing indicator data
   */
  private handleTypingIndicator(socket: Socket, data: any): void {
    // Extract tribeId, userId, and isTyping status from data
    const { tribeId, isTyping } = data;
    if (!tribeId || typeof isTyping !== 'boolean') {
      logger.warn(`Invalid typing indicator data: ${socket.id}, data: ${JSON.stringify(data)}`);
      return;
    }

    // Broadcast typing status to other members in the room
    socket.broadcast.to(tribeId).emit('typing', {
      userId: socket.data.userId,
      isTyping: isTyping
    });
  }

  /**
   * Handle message read receipts
   * @param socket - The socket instance
   * @param data - The read receipt data
   * @param callback - Callback function to execute after marking as read
   */
  private handleReadReceipts(socket: Socket, data: any, callback: Function): void {
    // Extract tribeId, userId, and messageIds from data
    const { tribeId, messageIds } = data;
    if (!tribeId || !messageIds || !Array.isArray(messageIds)) {
      logger.warn(`Invalid read receipt data: ${socket.id}, data: ${JSON.stringify(data)}`);
      return callback({ status: 'error', message: 'Invalid read receipt data' });
    }

    // Mark messages as read using markAsRead method
    this.markAsRead(socket.data.userId, messageIds)
      .then(count => {
        logger.info(`Marked ${count} messages as read: ${socket.id}, tribeId: ${tribeId}, messageIds: ${messageIds.join(', ')}`);
        // Execute callback with success status
        callback({ status: 'success', count });
      })
      .catch(error => {
        logger.error(`Failed to mark messages as read: ${socket.id}, tribeId: ${tribeId}, messageIds: ${messageIds.join(', ')}`, error);
        callback({ status: 'error', message: error.message });
      });
  }

  /**
   * Verify a user is a member of a tribe
   * @param tribeId - The tribe ID
   * @param userId - The user ID
   * @returns True if user is a member
   */
  private async verifyTribeMembership(tribeId: string, userId: string): Promise<boolean> {
    // Find membership record using memberModel
    const membership = await this.memberModel.findByTribeAndUser(tribeId, userId);

    // Check if membership exists and is active
    return membership !== null && membership.status === MembershipStatus.ACTIVE;
  }
}

export default ChatService;