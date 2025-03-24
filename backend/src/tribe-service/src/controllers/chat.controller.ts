import { Router, Request, Response, NextFunction } from 'express'; //  ^4.18.2
import { chatService } from '../services/chat.service';
import { validateBody, validateParams, validateQuery, validateRequest } from '@shared/middlewares/validation.middleware';
import {
  createMessageSchema,
  getMessageSchema,
  getTribeMessagesSchema,
  markMessagesAsReadSchema,
  getUnreadMessageCountSchema,
  deleteMessageSchema,
  createAIPromptSchema,
  searchMessagesSchema,
} from '../validations/chat.validation';
import { ApiError } from '@shared/errors/api.error';
import { logger } from '@shared/utils/logger.util';
import { IChatMessage, IChatMessageCreate, MessageType } from '@shared/types';

// Create an Express router
const router = Router();

/**
 * Controller class for handling chat-related HTTP requests
 */
export class ChatController {
  /**
   * Initialize the chat controller
   */
  constructor() {
    // Initialize router with all chat-related routes
    this.initializeRoutes();
  }

  /**
   * Set up all routes for chat functionality
   */
  private initializeRoutes(): void {
    // Set up POST /tribes/:tribeId/messages route for sending messages
    router.post(
      '/tribes/:tribeId/messages',
      validateParams(getTribeMessagesSchema.params),
      validateBody(createMessageSchema.body),
      this.sendMessage.bind(this)
    );

    // Set up GET /messages/:messageId route for getting a specific message
    router.get(
      '/messages/:messageId',
      validateParams(getMessageSchema.params),
      this.getMessage.bind(this)
    );

    // Set up GET /tribes/:tribeId/messages route for getting tribe messages
    router.get(
      '/tribes/:tribeId/messages',
      validateParams(getTribeMessagesSchema.params),
      validateQuery(getTribeMessagesSchema.query),
      this.getMessages.bind(this)
    );

    // Set up GET /tribes/:tribeId/users/:userId/messages route for getting user messages in a tribe
    router.get(
      '/tribes/:tribeId/users/:userId/messages',
      validateParams(getMessageSchema.params),
      validateQuery(getTribeMessagesSchema.query),
      this.getMessagesByUser.bind(this)
    );

    // Set up GET /tribes/:tribeId/messages/type/:messageType route for getting messages by type
    router.get(
      '/tribes/:tribeId/messages/type/:messageType',
      validateParams(getMessageSchema.params),
      validateQuery(getTribeMessagesSchema.query),
      this.getMessagesByType.bind(this)
    );

    // Set up POST /messages/read route for marking messages as read
    router.post(
      '/messages/read',
      validateBody(markMessagesAsReadSchema.body),
      this.markAsRead.bind(this)
    );

    // Set up POST /tribes/:tribeId/messages/read-all route for marking all messages as read
    router.post(
      '/tribes/:tribeId/messages/read-all',
      validateParams(getTribeMessagesSchema.params),
      this.markAllAsRead.bind(this)
    );

    // Set up GET /tribes/:tribeId/messages/unread-count route for getting unread count
    router.get(
      '/tribes/:tribeId/messages/unread-count',
      validateParams(getUnreadMessageCountSchema.params),
      this.getUnreadCount.bind(this)
    );

    // Set up DELETE /messages/:messageId route for deleting a message
    router.delete(
      '/messages/:messageId',
      validateParams(deleteMessageSchema.params),
      this.deleteMessage.bind(this)
    );

    // Set up GET /tribes/:tribeId/messages/search route for searching messages
    router.get(
      '/tribes/:tribeId/messages/search',
      validateParams(searchMessagesSchema.params),
      validateQuery(searchMessagesSchema.query),
      this.searchMessages.bind(this)
    );

    // Set up POST /tribes/:tribeId/messages/ai-prompt route for generating AI prompts
    router.post(
      '/tribes/:tribeId/messages/ai-prompt',
      validateParams(createAIPromptSchema.params),
      this.generateAIPrompt.bind(this)
    );

    // Apply appropriate validation middleware to each route
  }

  /**
   * Send a new message to a tribe chat
   */
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract tribeId from request parameters
      const { tribeId } = req.params;

      // Extract message content and metadata from request body
      const { content, messageType, metadata } = req.body;

      // Get userId from authenticated user in request
      const userId = req.user.id;

      // Call chatService.sendMessage with the message data
      const messageData: IChatMessageCreate = {
        tribeId,
        userId,
        content,
        messageType,
        metadata
      };
      const message = await chatService.sendMessage(messageData);

      // Return 201 status with the created message
      res.status(201).json(message);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract messageId from request parameters
      const { messageId } = req.params;

      // Call chatService.getMessage with the messageId
      const message = await chatService.getMessage(messageId);

      // Return 200 status with the message data
      res.status(200).json(message);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Get messages for a tribe with pagination
   */
  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract tribeId from request parameters
      const { tribeId } = req.params;

      // Extract pagination options from request query
      const { page, limit } = req.query;
      const options = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      };

      // Call chatService.getMessages with tribeId and options
      const { messages, total } = await chatService.getMessages(tribeId, options);

      // Return 200 status with messages and pagination metadata
      res.status(200).json({
        messages,
        total,
        page: options.page || 1,
        limit: options.limit || 20
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Get messages sent by a specific user in a tribe
   */
  async getMessagesByUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract tribeId and userId from request parameters
      const { tribeId, userId } = req.params;

      // Extract pagination options from request query
      const { page, limit } = req.query;
      const options = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      };

      // Call chatService.getMessagesByUser with tribeId, userId, and options
      const { messages, total } = await chatService.getMessagesByUser(tribeId, userId, options);

      // Return 200 status with messages and pagination metadata
      res.status(200).json({
        messages,
        total,
        page: options.page || 1,
        limit: options.limit || 20
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Get messages of a specific type in a tribe
   */
  async getMessagesByType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract tribeId from request parameters
      const { tribeId } = req.params;

      // Extract messageType from request query
      const { messageType } = req.query;

      // Extract pagination options from request query
      const { page, limit } = req.query;
      const options = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      };

      // Call chatService.getMessagesByType with tribeId, messageType, and options
      const { messages, total } = await chatService.getMessagesByType(tribeId, messageType as MessageType, options);

      // Return 200 status with messages and pagination metadata
      res.status(200).json({
        messages,
        total,
        page: options.page || 1,
        limit: options.limit || 20
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Mark specific messages as read for a user
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract messageIds from request body
      const { messageIds } = req.body;

      // Get userId from authenticated user in request
      const userId = req.user.id;

      // Call chatService.markAsRead with userId and messageIds
      const count = await chatService.markAsRead(userId, messageIds);

      // Return 200 status with count of messages marked as read
      res.status(200).json({ count });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Mark all messages in a tribe as read for a user
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract tribeId from request parameters
      const { tribeId } = req.params;

      // Get userId from authenticated user in request
      const userId = req.user.id;

      // Call chatService.markAllAsRead with tribeId and userId
      const count = await chatService.markAllAsRead(tribeId, userId);

      // Return 200 status with count of messages marked as read
      res.status(200).json({ count });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Get count of unread messages for a user in a tribe
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract tribeId from request parameters
      const { tribeId } = req.params;

      // Get userId from authenticated user in request
      const userId = req.user.id;

      // Call chatService.getUnreadCount with tribeId and userId
      const count = await chatService.getUnreadCount(tribeId, userId);

      // Return 200 status with unread message count
      res.status(200).json({ count });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Delete a specific message
   */
  async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract messageId from request parameters
      const { messageId } = req.params;

      // Get userId from authenticated user in request
      const userId = req.user.id;

      // Call chatService.deleteMessage with messageId and userId
      const success = await chatService.deleteMessage(messageId, userId);

      // Return 200 status with success message
      res.status(200).json({ success });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Search for messages in a tribe by content
   */
  async searchMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract tribeId from request parameters
      const { tribeId } = req.params;

      // Extract search query from request query
      const { query } = req.query;

      // Extract pagination options from request query
      const { page, limit } = req.query;
      const options = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      };

      // Call chatService.searchMessages with tribeId, query, and options
      const { messages, total } = await chatService.searchMessages(tribeId, query as string, options);

      // Return 200 status with matching messages and pagination metadata
      res.status(200).json({
        messages,
        total,
        page: options.page || 1,
        limit: options.limit || 20
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Generate an AI-powered conversation prompt for a tribe
   */
  async generateAIPrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract tribeId from request parameters
      const { tribeId } = req.params;

      // Get userId from authenticated user in request
      const userId = req.user.id;

      // Extract context data from request body if provided
      const context = req.body;

      // Call chatService.generateAIPrompt with tribeId, userId, and context
      const message = await chatService.generateAIPrompt(tribeId, userId, context);

      // Return 201 status with the generated AI prompt message
      res.status(201).json(message);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }
}

// Create a new ChatController instance
const chatController = new ChatController();

// Export the router for use in the main application
export const router = chatController.router;