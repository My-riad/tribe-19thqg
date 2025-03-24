import { createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid'; // uuid v^9.0.0

import { socketClient, SocketEvents } from '../../api/socketClient';
import { tribeApi } from '../../api/tribeApi';
import { engagementApi } from '../../api/engagementApi';
import { actions } from '../slices/chatSlice';
import { offlineService } from '../../services/offlineService';
import { 
  ChatMessage, 
  MessageType, 
  MessageStatus,
  AIPromptMessage,
  AIPromptResponse,
  SendMessageRequest,
  GetChatMessagesRequest,
  MarkMessagesAsReadRequest,
  RequestAIPromptRequest,
  OfflineMessage
} from '../../types/chat.types';
import { RootState } from '../store';

/**
 * Initializes socket listeners for real-time chat events
 */
export const initChatListeners = createAsyncThunk(
  'chat/initChatListeners',
  async (_, { dispatch }) => {
    try {
      // Set up listener for incoming messages
      socketClient.on(SocketEvents.MESSAGE, (message: ChatMessage) => {
        dispatch(actions.addMessage(message));
      });

      // Set up listener for typing indicators
      socketClient.on(SocketEvents.TYPING, ({ tribeId, userIds }: { tribeId: string; userIds: string[] }) => {
        dispatch(actions.setTypingUsers({ tribeId, userIds }));
      });

      // Set up listener for read receipts
      socketClient.on(SocketEvents.READ, ({ tribeId, messageIds, userId }: { tribeId: string; messageIds: string[]; userId: string }) => {
        // Update message status for each message that was read
        messageIds.forEach(messageId => {
          dispatch(actions.updateMessageStatus({ tribeId, messageId, status: MessageStatus.READ }));
        });
      });

      // Set up listener for AI prompts
      socketClient.on(SocketEvents.AI_PROMPT, ({ tribeId, prompt }: { tribeId: string; prompt: AIPromptMessage }) => {
        dispatch(actions.addAIPrompt({ tribeId, prompt }));
      });
    } catch (error) {
      // Log error but don't fail the thunk - we can still function without real-time updates
      console.error('Error initializing chat listeners:', error);
      dispatch(actions.setError('Failed to initialize chat listeners'));
    }
  }
);

/**
 * Removes socket listeners for chat events
 */
export const removeChatListeners = createAsyncThunk(
  'chat/removeChatListeners',
  async (_, { dispatch }) => {
    try {
      // Remove all listeners for common chat events
      socketClient.off(SocketEvents.MESSAGE, null);
      socketClient.off(SocketEvents.TYPING, null);
      socketClient.off(SocketEvents.READ, null);
      socketClient.off(SocketEvents.AI_PROMPT, null);
    } catch (error) {
      console.error('Error removing chat listeners:', error);
      dispatch(actions.setError('Failed to clean up chat listeners'));
    }
  }
);

/**
 * Joins a tribe's chat room to receive real-time updates
 */
export const joinTribeChat = createAsyncThunk(
  'chat/joinTribeChat',
  async (tribeId: string, { dispatch }) => {
    try {
      dispatch(actions.setLoading(true));
      dispatch(actions.clearError());
      
      // Set the active chat and reset unread count
      dispatch(actions.setActiveChat(tribeId));
      dispatch(actions.resetUnreadCount(tribeId));
      
      // Check if socket is connected before trying to join room
      if (socketClient.isConnected()) {
        await socketClient.joinRoom(tribeId);
      } else {
        console.log('Socket not connected, skipping room join. Will use HTTP fallback for messages.');
        // We don't throw an error here because we can still function without real-time updates
        // by using HTTP requests to fetch messages
      }
      
      dispatch(actions.setLoading(false));
    } catch (error) {
      console.error(`Error joining tribe chat ${tribeId}:`, error);
      dispatch(actions.setError(`Failed to join tribe chat: ${error.message || 'Unknown error'}`));
      dispatch(actions.setLoading(false));
    }
  }
);

/**
 * Leaves a tribe's chat room to stop receiving updates
 */
export const leaveTribeChat = createAsyncThunk(
  'chat/leaveTribeChat',
  async (tribeId: string, { dispatch }) => {
    try {
      // Leave the room if socket is connected
      if (socketClient.isConnected()) {
        await socketClient.leaveRoom(tribeId);
      }
      
      // Clear active chat
      dispatch(actions.setActiveChat(null));
    } catch (error) {
      console.error(`Error leaving tribe chat ${tribeId}:`, error);
      dispatch(actions.setError(`Failed to leave tribe chat: ${error.message || 'Unknown error'}`));
    }
  }
);

/**
 * Retrieves chat message history for a tribe
 */
export const getChatMessages = createAsyncThunk(
  'chat/getChatMessages',
  async (request: GetChatMessagesRequest, { dispatch }) => {
    try {
      dispatch(actions.setLoading(true));
      dispatch(actions.clearError());
      
      let messages: ChatMessage[] = [];
      
      // Check if we're offline
      if (offlineService.isOffline()) {
        // Try to get cached messages
        const cachedMessages = await offlineService.getCachedData<ChatMessage[]>(
          `chat_messages_${request.tribeId}`,
          []
        );
        messages = cachedMessages || [];
      } else {
        // Fetch messages from API
        const response = await tribeApi.getTribeChat(
          request.tribeId,
          {
            limit: request.limit,
            before: request.before ? new Date(request.before).toISOString() : undefined
          }
        );
        
        if (response.success && response.data) {
          messages = response.data.items as ChatMessage[];
          
          // Cache messages for offline use
          await offlineService.cacheData(
            `chat_messages_${request.tribeId}`,
            messages
          );
        }
      }
      
      // Update Redux state
      dispatch(actions.setMessages({ tribeId: request.tribeId, messages }));
      dispatch(actions.setLoading(false));
      
      return messages;
    } catch (error) {
      console.error(`Error fetching chat messages for tribe ${request.tribeId}:`, error);
      dispatch(actions.setError(`Failed to load chat messages: ${error.message || 'Unknown error'}`));
      dispatch(actions.setLoading(false));
      return [];
    }
  }
);

/**
 * Sends a new message to a tribe's chat
 */
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (request: SendMessageRequest, { dispatch, getState }) => {
    // Generate a temporary ID for the message
    const tempId = uuidv4();
    
    // Create a message object with SENDING status
    const message: Partial<ChatMessage> = {
      id: tempId,
      tribeId: request.tribeId,
      content: request.content,
      messageType: request.messageType,
      metadata: request.metadata || null,
      status: MessageStatus.SENDING,
      sentAt: new Date(),
      isFromCurrentUser: true,
    };
    
    // Add to Redux immediately for optimistic UI update
    dispatch(actions.addMessage(message as ChatMessage));
    
    try {
      let sentMessage: ChatMessage;
      
      // Check if socket is connected
      if (socketClient.isConnected()) {
        // Send via socket for real-time delivery
        sentMessage = await socketClient.sendMessage(
          request.tribeId,
          {
            content: request.content,
            messageType: request.messageType,
            metadata: request.metadata
          }
        );
      } else if (offlineService.isOffline()) {
        // We're offline, queue the message for later
        await offlineService.queueAction({
          type: 'SEND_MESSAGE',
          payload: {
            messageId: tempId,
            tribeId: request.tribeId,
            content: request.content,
            messageType: request.messageType,
            metadata: request.metadata
          }
        });
        
        // Keep the message in SENDING state for UI purposes
        return {
          ...message,
          status: MessageStatus.SENDING,
        } as ChatMessage;
      } else {
        // Socket disconnected but we're online - use HTTP fallback
        const response = await tribeApi.sendChatMessage(
          request.tribeId,
          {
            content: request.content,
            messageType: request.messageType
          }
        );
        
        if (!response.success || !response.data) {
          throw new Error('Failed to send message via HTTP fallback');
        }
        
        sentMessage = response.data as ChatMessage;
      }
      
      // Update message status in Redux
      dispatch(actions.updateMessageStatus({
        tribeId: request.tribeId,
        messageId: tempId,
        status: MessageStatus.SENT
      }));
      
      // Return the sent message with server-assigned ID
      return {
        ...sentMessage,
        status: MessageStatus.SENT,
      };
    } catch (error) {
      console.error(`Error sending chat message to tribe ${request.tribeId}:`, error);
      
      // Update message status to FAILED
      dispatch(actions.updateMessageStatus({
        tribeId: request.tribeId,
        messageId: tempId,
        status: MessageStatus.FAILED
      }));
      
      dispatch(actions.setError(`Failed to send message: ${error.message || 'Unknown error'}`));
      
      // Return the message with FAILED status
      return {
        ...message,
        status: MessageStatus.FAILED,
      } as ChatMessage;
    }
  }
);

/**
 * Marks messages as read in a tribe's chat
 */
export const markMessagesAsRead = createAsyncThunk(
  'chat/markMessagesAsRead',
  async (request: MarkMessagesAsReadRequest, { dispatch }) => {
    try {
      // If socket is connected, send read receipts
      if (socketClient.isConnected()) {
        await socketClient.markMessagesAsRead(request.tribeId, request.messageIds);
      } else if (offlineService.isOffline()) {
        // Queue for later if offline
        await offlineService.queueAction({
          type: 'MARK_MESSAGES_READ',
          payload: request
        });
      }
      
      // Update local state immediately for better UX
      request.messageIds.forEach(messageId => {
        dispatch(actions.updateMessageStatus({
          tribeId: request.tribeId,
          messageId,
          status: MessageStatus.READ
        }));
      });
      
      // Reset unread count for the tribe
      dispatch(actions.resetUnreadCount(request.tribeId));
      
      return true;
    } catch (error) {
      console.error(`Error marking messages as read in tribe ${request.tribeId}:`, error);
      dispatch(actions.setError(`Failed to mark messages as read: ${error.message || 'Unknown error'}`));
      return false;
    }
  }
);

/**
 * Sends a typing indicator to a tribe's chat
 */
export const sendTypingIndicator = createAsyncThunk(
  'chat/sendTypingIndicator',
  async ({ tribeId, isTyping }: { tribeId: string, isTyping: boolean }, { dispatch }) => {
    try {
      // Only send if socket is connected
      if (socketClient.isConnected()) {
        await socketClient.sendTypingIndicator(tribeId, isTyping);
      }
      // If not connected, silently fail - typing indicators are non-critical
    } catch (error) {
      // Silently fail - typing indicators should not cause visible errors
      console.error(`Error sending typing indicator to tribe ${tribeId}:`, error);
    }
  }
);

/**
 * Requests an AI-generated prompt for a tribe's chat
 */
export const requestAIPrompt = createAsyncThunk(
  'chat/requestAIPrompt',
  async (request: RequestAIPromptRequest, { dispatch }) => {
    try {
      dispatch(actions.setLoading(true));
      dispatch(actions.clearError());
      
      // Request AI prompt from engagement API
      const response = await engagementApi.getEngagementPrompts({
        type: request.promptType,
        tribeId: request.tribeId,
        context: request.context || {}
      });
      
      if (!response.success || !response.data) {
        throw new Error('Failed to generate AI prompt');
      }
      
      // Add prompt to Redux state
      const prompt = response.data as AIPromptMessage;
      dispatch(actions.addAIPrompt({
        tribeId: request.tribeId,
        prompt
      }));
      
      dispatch(actions.setLoading(false));
      return prompt;
    } catch (error) {
      console.error(`Error requesting AI prompt for tribe ${request.tribeId}:`, error);
      dispatch(actions.setError(`Failed to get AI prompt: ${error.message || 'Unknown error'}`));
      dispatch(actions.setLoading(false));
      throw error;
    }
  }
);

/**
 * Sends a user's response to an AI-generated prompt
 */
export const respondToAIPrompt = createAsyncThunk(
  'chat/respondToAIPrompt',
  async (response: AIPromptResponse, { dispatch }) => {
    try {
      dispatch(actions.setLoading(true));
      dispatch(actions.clearError());
      
      // Send response to AI prompt
      const apiResponse = await engagementApi.respondToPrompt(response);
      
      if (!apiResponse.success) {
        throw new Error('Failed to send prompt response');
      }
      
      // Update AI prompt status in Redux
      dispatch(actions.updateAIPromptStatus({
        tribeId: response.promptId.split(':')[0], // Extract tribeId from promptId format "tribeId:promptId"
        promptId: response.promptId,
        userId: response.userId,
        action: 'respond'
      }));
      
      // If the response includes a message to be sent to the chat
      if (response.response) {
        // Create and send a chat message with the response
        await dispatch(sendMessage({
          tribeId: response.promptId.split(':')[0],
          content: response.response,
          messageType: MessageType.TEXT,
          metadata: {
            promptId: response.promptId,
            isPromptResponse: true
          }
        }));
      }
      
      dispatch(actions.setLoading(false));
      return true;
    } catch (error) {
      console.error(`Error responding to AI prompt ${response.promptId}:`, error);
      dispatch(actions.setError(`Failed to respond to prompt: ${error.message || 'Unknown error'}`));
      dispatch(actions.setLoading(false));
      return false;
    }
  }
);

/**
 * Synchronizes messages sent while offline when connectivity is restored
 */
export const syncOfflineMessages = createAsyncThunk(
  'chat/syncOfflineMessages',
  async (_, { dispatch }) => {
    // Initialize counters for result
    let synced = 0;
    let failed = 0;
    
    try {
      // Check if socket is connected - we need real-time connection for syncing
      if (!socketClient.isConnected()) {
        return { success: false, synced, failed };
      }
      
      // Get queued offline messages
      const queuedActions = await offlineService.getQueuedActions();
      const messageActions = queuedActions.filter(action => action.type === 'SEND_MESSAGE');
      
      // Process each message
      for (const action of messageActions) {
        try {
          const { messageId, tribeId, content, messageType, metadata } = action.payload;
          
          // Send message via socket
          const sentMessage = await socketClient.sendMessage(
            tribeId,
            {
              content,
              messageType,
              metadata
            }
          );
          
          // Update message status to sent
          dispatch(actions.updateMessageStatus({
            tribeId,
            messageId,
            status: MessageStatus.SENT
          }));
          
          synced++;
        } catch (error) {
          console.error('Error syncing offline message:', error);
          failed++;
        }
      }
      
      return { success: true, synced, failed };
    } catch (error) {
      console.error('Error syncing offline messages:', error);
      dispatch(actions.setError(`Failed to sync offline messages: ${error.message || 'Unknown error'}`));
      return { success: false, synced, failed };
    }
  }
);