import { PrismaClient } from '@prisma/client'; // ^4.16.0
import { IChatMessage, IChatMessageCreate, MessageType } from '@shared/types';
import { ApiError } from '@shared/errors';
import { logger } from '@shared/utils';

/**
 * Model class for chat message operations using Prisma ORM
 */
export class ChatModel {
  private prisma: PrismaClient;

  /**
   * Initialize the chat model with Prisma client
   * @param prisma - PrismaClient instance
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new chat message
   * @param messageData - The message data
   * @returns The created chat message
   */
  async createMessage(messageData: IChatMessageCreate): Promise<IChatMessage> {
    // Validate required fields
    if (!messageData.tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }
    if (!messageData.userId) {
      throw ApiError.badRequest('User ID is required');
    }
    if (!messageData.content) {
      throw ApiError.badRequest('Message content is required');
    }

    // Set default values if not provided
    const messageType = messageData.messageType || MessageType.TEXT;
    const metadata = messageData.metadata || {};

    try {
      // Create message record in database using Prisma
      const message = await this.prisma.chatMessage.create({
        data: {
          tribeId: messageData.tribeId,
          userId: messageData.userId,
          content: messageData.content,
          messageType,
          isRead: false,
          metadata,
        },
      });

      logger.info('Chat message created', { messageId: message.id, tribeId: message.tribeId });
      return message;
    } catch (error) {
      logger.error('Failed to create chat message', error);
      throw ApiError.fromError(error);
    }
  }

  /**
   * Get a specific chat message by ID
   * @param id - The message ID
   * @returns The chat message if found, null otherwise
   */
  async getMessage(id: string): Promise<IChatMessage | null> {
    if (!id) {
      throw ApiError.badRequest('Message ID is required');
    }

    try {
      const message = await this.prisma.chatMessage.findUnique({
        where: { id },
      });

      return message;
    } catch (error) {
      logger.error('Failed to get chat message', error, { messageId: id });
      throw ApiError.fromError(error);
    }
  }

  /**
   * Get chat messages for a specific tribe with pagination
   * @param tribeId - The tribe ID
   * @param options - Pagination options
   * @returns Paginated chat messages and total count
   */
  async getMessages(
    tribeId: string,
    options: { page?: number; limit?: number; beforeId?: string; afterId?: string } = {}
  ): Promise<{ messages: IChatMessage[]; total: number }> {
    if (!tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }

    try {
      // Base where condition for the tribe
      const where: any = { tribeId };
      
      // Build query configuration
      const queryConfig: any = {
        where,
        take: options.limit || 20,
        orderBy: { sentAt: 'desc' }
      };

      // Apply cursor-based pagination if specified
      if (options.beforeId) {
        queryConfig.cursor = { id: options.beforeId };
        queryConfig.skip = 1; // Skip the cursor itself
      } else if (options.afterId) {
        queryConfig.cursor = { id: options.afterId };
        queryConfig.skip = 1; // Skip the cursor itself
        queryConfig.orderBy = { sentAt: 'asc' }; // Reverse order for "after" queries
      } else {
        // If no cursor, use offset pagination
        queryConfig.skip = ((options.page || 1) - 1) * (options.limit || 20);
      }

      const messages = await this.prisma.chatMessage.findMany(queryConfig);

      // For "after" queries, reverse the results back to descending order
      if (options.afterId) {
        messages.reverse();
      }

      const total = await this.prisma.chatMessage.count({ where });

      return { messages, total };
    } catch (error) {
      logger.error('Failed to get chat messages', error, { tribeId });
      throw ApiError.fromError(error);
    }
  }

  /**
   * Get chat messages sent by a specific user in a tribe
   * @param tribeId - The tribe ID
   * @param userId - The user ID
   * @param options - Pagination options
   * @returns Paginated chat messages and total count
   */
  async getMessagesByUser(
    tribeId: string,
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ messages: IChatMessage[]; total: number }> {
    if (!tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }

    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    try {
      const messages = await this.prisma.chatMessage.findMany({
        where: {
          tribeId,
          userId,
        },
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
      });

      const total = await this.prisma.chatMessage.count({
        where: {
          tribeId,
          userId,
        },
      });

      return { messages, total };
    } catch (error) {
      logger.error('Failed to get user chat messages', error, { tribeId, userId });
      throw ApiError.fromError(error);
    }
  }

  /**
   * Get chat messages of a specific type in a tribe
   * @param tribeId - The tribe ID
   * @param messageType - The message type
   * @param options - Pagination options
   * @returns Paginated chat messages and total count
   */
  async getMessagesByType(
    tribeId: string,
    messageType: MessageType,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ messages: IChatMessage[]; total: number }> {
    if (!tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }
    if (!messageType) {
      throw ApiError.badRequest('Message type is required');
    }

    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    try {
      const messages = await this.prisma.chatMessage.findMany({
        where: {
          tribeId,
          messageType,
        },
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
      });

      const total = await this.prisma.chatMessage.count({
        where: {
          tribeId,
          messageType,
        },
      });

      return { messages, total };
    } catch (error) {
      logger.error('Failed to get chat messages by type', error, { tribeId, messageType });
      throw ApiError.fromError(error);
    }
  }

  /**
   * Mark multiple chat messages as read for a specific user
   * @param userId - The user ID
   * @param messageIds - Array of message IDs to mark as read
   * @returns The number of messages updated
   */
  async markAsRead(userId: string, messageIds: string[]): Promise<number> {
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }
    if (!messageIds || !messageIds.length) {
      throw ApiError.badRequest('Message IDs are required');
    }

    try {
      const result = await this.prisma.chatMessage.updateMany({
        where: {
          id: { in: messageIds },
          userId: { not: userId }, // Only mark messages from others as read
        },
        data: {
          isRead: true,
        },
      });

      logger.info('Marked messages as read', { userId, count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to mark messages as read', error, { userId, messageIds });
      throw ApiError.fromError(error);
    }
  }

  /**
   * Mark all chat messages in a tribe as read for a specific user
   * @param tribeId - The tribe ID
   * @param userId - The user ID
   * @returns The number of messages updated
   */
  async markAllAsRead(tribeId: string, userId: string): Promise<number> {
    if (!tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }

    try {
      const result = await this.prisma.chatMessage.updateMany({
        where: {
          tribeId,
          userId: { not: userId }, // Only mark messages from others as read
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      logger.info('Marked all tribe messages as read', { tribeId, userId, count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to mark all messages as read', error, { tribeId, userId });
      throw ApiError.fromError(error);
    }
  }

  /**
   * Get count of unread messages for a user in a tribe
   * @param tribeId - The tribe ID
   * @param userId - The user ID
   * @returns Count of unread messages
   */
  async getUnreadCount(tribeId: string, userId: string): Promise<number> {
    if (!tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }

    try {
      const count = await this.prisma.chatMessage.count({
        where: {
          tribeId,
          userId: { not: userId }, // Only count messages from others
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      logger.error('Failed to get unread message count', error, { tribeId, userId });
      throw ApiError.fromError(error);
    }
  }

  /**
   * Delete a specific chat message
   * @param id - The message ID
   * @param userId - The user ID (for authorization)
   * @returns True if deleted, false if not found or not authorized
   */
  async deleteMessage(id: string, userId: string): Promise<boolean> {
    if (!id) {
      throw ApiError.badRequest('Message ID is required');
    }
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }

    try {
      // First check if the message exists and belongs to the user
      const message = await this.prisma.chatMessage.findUnique({
        where: { id },
      });

      if (!message) {
        return false;
      }

      // Only message creator can delete their messages
      if (message.userId !== userId) {
        return false;
      }

      // Delete the message
      await this.prisma.chatMessage.delete({
        where: { id },
      });

      logger.info('Chat message deleted', { messageId: id });
      return true;
    } catch (error) {
      logger.error('Failed to delete chat message', error, { messageId: id });
      throw ApiError.fromError(error);
    }
  }

  /**
   * Delete all chat messages for a specific tribe
   * @param tribeId - The tribe ID
   * @returns Number of messages deleted
   */
  async deleteMessagesByTribeId(tribeId: string): Promise<number> {
    if (!tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }

    try {
      const result = await this.prisma.chatMessage.deleteMany({
        where: { tribeId },
      });

      logger.info('Deleted all tribe messages', { tribeId, count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to delete tribe messages', error, { tribeId });
      throw ApiError.fromError(error);
    }
  }

  /**
   * Search for chat messages in a tribe by content
   * @param tribeId - The tribe ID
   * @param query - The search query
   * @param options - Pagination options
   * @returns Matching chat messages and total count
   */
  async searchMessages(
    tribeId: string,
    query: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ messages: IChatMessage[]; total: number }> {
    if (!tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }
    if (!query || query.trim().length === 0) {
      throw ApiError.badRequest('Search query is required');
    }

    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    try {
      // Using Prisma's contains for text search
      const messages = await this.prisma.chatMessage.findMany({
        where: {
          tribeId,
          content: {
            contains: query,
            mode: 'insensitive', // Case-insensitive search
          },
        },
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
      });

      const total = await this.prisma.chatMessage.count({
        where: {
          tribeId,
          content: {
            contains: query,
            mode: 'insensitive',
          },
        },
      });

      return { messages, total };
    } catch (error) {
      logger.error('Failed to search chat messages', error, { tribeId, query });
      throw ApiError.fromError(error);
    }
  }
}

export default ChatModel;