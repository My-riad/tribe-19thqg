/**
 * TypeScript type definitions for chat-related data structures used throughout the Tribe application.
 * This file defines interfaces and enums for chat messages, message types, AI-driven engagement prompts,
 * and chat state management to ensure type safety for all chat-related operations.
 */

import { User } from './auth.types';

/**
 * Enum representing the types of messages that can be sent in a chat
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  SYSTEM = 'system',
  AI_PROMPT = 'ai_prompt',
  EVENT_SHARE = 'event_share',
  LOCATION_SHARE = 'location_share'
}

/**
 * Enum representing the delivery status of a message
 */
export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

/**
 * Enum representing the types of AI-generated prompts
 */
export enum AIPromptType {
  CONVERSATION_STARTER = 'conversation_starter',
  GROUP_CHALLENGE = 'group_challenge',
  ACTIVITY_SUGGESTION = 'activity_suggestion',
  ICE_BREAKER = 'ice_breaker',
  POLL = 'poll'
}

/**
 * Enum representing the possible actions a user can take on an AI prompt
 */
export enum AIPromptAction {
  RESPOND = 'respond',
  SKIP = 'skip',
  SUGGEST_ANOTHER = 'suggest_another',
  CREATE_EVENT = 'create_event'
}

/**
 * Interface representing a chat message in the application
 */
export interface ChatMessage {
  id: string;
  tribeId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  messageType: MessageType;
  status: MessageStatus;
  sentAt: Date;
  deliveredAt: Date | null;
  readAt: Date | null;
  metadata: Record<string, any> | null;
  isFromCurrentUser: boolean;
}

/**
 * Interface representing an AI-generated prompt message
 */
export interface AIPromptMessage {
  id: string;
  tribeId: string;
  promptType: AIPromptType;
  content: string;
  options: string[] | null;
  createdAt: Date;
  expiresAt: Date | null;
  respondedBy: string[];
  skippedBy: string[];
  metadata: Record<string, any> | null;
}

/**
 * Interface representing a user's response to an AI prompt
 */
export interface AIPromptResponse {
  promptId: string;
  userId: string;
  action: AIPromptAction;
  response: string | null;
  respondedAt: Date;
}

/**
 * Interface representing the chat state in the Redux store
 */
export interface ChatState {
  messages: Record<string, ChatMessage[]>;
  activeChat: string | null;
  loading: boolean;
  error: string | null;
  typingUsers: Record<string, string[]>;
  unreadCounts: Record<string, number>;
  aiPrompts: Record<string, AIPromptMessage[]>;
}

/**
 * Interface representing a request to send a new message
 */
export interface SendMessageRequest {
  tribeId: string;
  content: string;
  messageType: MessageType;
  metadata: Record<string, any> | null;
}

/**
 * Interface representing a request to retrieve chat messages
 */
export interface GetChatMessagesRequest {
  tribeId: string;
  limit: number;
  before: Date | null;
}

/**
 * Interface representing a request to mark messages as read
 */
export interface MarkMessagesAsReadRequest {
  tribeId: string;
  messageIds: string[];
}

/**
 * Interface representing a request for an AI-generated prompt
 */
export interface RequestAIPromptRequest {
  tribeId: string;
  promptType: AIPromptType;
  context: Record<string, any> | null;
}

/**
 * Interface representing a message stored offline for later synchronization
 */
export interface OfflineMessage {
  id: string;
  tribeId: string;
  content: string;
  messageType: MessageType;
  metadata: Record<string, any> | null;
  createdAt: Date;
  attempts: number;
}