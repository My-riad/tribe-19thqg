import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  ChatState, 
  ChatMessage, 
  MessageStatus,
  AIPromptMessage 
} from '../../types/chat.types';

/**
 * Initial state for the chat slice
 */
const initialState: ChatState = {
  messages: {},
  activeChat: null,
  loading: false,
  error: null,
  typingUsers: {},
  unreadCounts: {},
  aiPrompts: {},
};

/**
 * Redux slice for managing chat state in the Tribe application
 * Handles messages, typing indicators, AI prompts, and unread counts
 */
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    /**
     * Sets all messages for a specific tribe
     */
    setMessages(state, action: PayloadAction<{ tribeId: string; messages: ChatMessage[] }>) {
      const { tribeId, messages } = action.payload;
      state.messages[tribeId] = messages;
    },
    
    /**
     * Adds a new message to a tribe's chat history
     * Also handles incrementing unread count for messages to non-active chats
     */
    addMessage(state, action: PayloadAction<ChatMessage>) {
      const message = action.payload;
      const { tribeId } = message;
      
      // Initialize messages array if it doesn't exist
      if (!state.messages[tribeId]) {
        state.messages[tribeId] = [];
      }
      
      // Add message to the beginning of the array (newest first)
      state.messages[tribeId].unshift(message);
      
      // If this message is from someone else and it's not the active chat,
      // increment the unread count
      if (!message.isFromCurrentUser && state.activeChat !== tribeId) {
        if (!state.unreadCounts[tribeId]) {
          state.unreadCounts[tribeId] = 0;
        }
        state.unreadCounts[tribeId]++;
      }
    },
    
    /**
     * Updates the status of a specific message (sent, delivered, read, failed)
     * Also updates relevant timestamps based on the new status
     */
    updateMessageStatus(
      state,
      action: PayloadAction<{ tribeId: string; messageId: string; status: MessageStatus }>
    ) {
      const { tribeId, messageId, status } = action.payload;
      const messages = state.messages[tribeId];
      
      if (messages) {
        const messageIndex = messages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          messages[messageIndex].status = status;
          
          // Update timestamps based on status
          const now = new Date();
          if (status === MessageStatus.DELIVERED) {
            messages[messageIndex].deliveredAt = now;
          } else if (status === MessageStatus.READ) {
            messages[messageIndex].readAt = now;
          }
        }
      }
    },
    
    /**
     * Sets the list of users currently typing in a tribe chat
     */
    setTypingUsers(state, action: PayloadAction<{ tribeId: string; userIds: string[] }>) {
      const { tribeId, userIds } = action.payload;
      state.typingUsers[tribeId] = userIds;
    },
    
    /**
     * Sets the loading state for chat operations
     */
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    
    /**
     * Sets an error message for chat operations
     */
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    
    /**
     * Clears the error message
     */
    clearError(state) {
      state.error = null;
    },
    
    /**
     * Sets the currently active chat tribe
     * Also resets the unread count for the newly active chat
     */
    setActiveChat(state, action: PayloadAction<string | null>) {
      state.activeChat = action.payload;
      
      // Reset unread count when making a chat active
      if (action.payload && state.unreadCounts[action.payload]) {
        state.unreadCounts[action.payload] = 0;
      }
    },
    
    /**
     * Increments the unread message count for a tribe
     */
    incrementUnreadCount(state, action: PayloadAction<string>) {
      const tribeId = action.payload;
      if (!state.unreadCounts[tribeId]) {
        state.unreadCounts[tribeId] = 0;
      }
      state.unreadCounts[tribeId]++;
    },
    
    /**
     * Resets the unread message count for a tribe to zero
     */
    resetUnreadCount(state, action: PayloadAction<string>) {
      const tribeId = action.payload;
      state.unreadCounts[tribeId] = 0;
    },
    
    /**
     * Adds an AI-generated prompt to a tribe's chat
     */
    addAIPrompt(state, action: PayloadAction<{ tribeId: string; prompt: AIPromptMessage }>) {
      const { tribeId, prompt } = action.payload;
      
      // Initialize AI prompts array if it doesn't exist
      if (!state.aiPrompts[tribeId]) {
        state.aiPrompts[tribeId] = [];
      }
      
      // Add prompt to the beginning of the array (newest first)
      state.aiPrompts[tribeId].unshift(prompt);
    },
    
    /**
     * Updates the status of an AI prompt (e.g., when a user responds or skips)
     */
    updateAIPromptStatus(
      state,
      action: PayloadAction<{ 
        tribeId: string; 
        promptId: string; 
        userId: string; 
        action: string;
      }>
    ) {
      const { tribeId, promptId, userId, action: promptAction } = action.payload;
      const prompts = state.aiPrompts[tribeId];
      
      if (prompts) {
        const promptIndex = prompts.findIndex(prompt => prompt.id === promptId);
        if (promptIndex !== -1) {
          const prompt = prompts[promptIndex];
          
          // Update the appropriate array based on action
          if (promptAction === 'respond') {
            if (!prompt.respondedBy.includes(userId)) {
              prompt.respondedBy.push(userId);
            }
          } else if (promptAction === 'skip') {
            if (!prompt.skippedBy.includes(userId)) {
              prompt.skippedBy.push(userId);
            }
          }
        }
      }
    },
    
    /**
     * Clears all messages and AI prompts for a specific tribe
     */
    clearChat(state, action: PayloadAction<string>) {
      const tribeId = action.payload;
      delete state.messages[tribeId];
      delete state.aiPrompts[tribeId];
      state.unreadCounts[tribeId] = 0;
    },
    
    /**
     * Resets the entire chat state to initial values
     */
    resetState() {
      return initialState;
    }
  }
});

// Export actions and reducer
export const { actions } = chatSlice;
export default chatSlice.reducer;