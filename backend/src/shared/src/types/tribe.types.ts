/**
 * tribe.types.ts
 * 
 * TypeScript interfaces, types, and enumerations for tribe-related data structures used across 
 * the Tribe platform's microservices. This file establishes the standard data structures for 
 * tribes, memberships, activities, and chat messages, ensuring consistent representation of
 * group entities throughout the application.
 */

import { InterestCategory, ICoordinates } from './profile.types';
import { TRIBE_LIMITS } from '../constants/app.constants';

/**
 * Possible statuses of a tribe throughout its lifecycle
 */
export enum TribeStatus {
  FORMING = 'forming',    // Initial phase while gathering members
  ACTIVE = 'active',      // Fully functional tribe with regular activity
  AT_RISK = 'at_risk',    // Tribe with low engagement, at risk of becoming inactive
  INACTIVE = 'inactive',  // Tribe without recent activity
  DISSOLVED = 'dissolved' // Terminated tribe that no longer exists
}

/**
 * Privacy settings for tribe discovery and access
 */
export enum TribePrivacy {
  PUBLIC = 'public',   // Discoverable by all users
  PRIVATE = 'private'  // Only discoverable through direct invitation
}

/**
 * Roles a user can have within a tribe
 */
export enum MemberRole {
  CREATOR = 'creator', // Founder/owner of the tribe
  MEMBER = 'member'    // Regular tribe member
}

/**
 * Possible statuses of a user's membership in a tribe
 */
export enum MembershipStatus {
  PENDING = 'pending',   // Invitation sent or request made, not yet confirmed
  ACTIVE = 'active',     // Active participation in the tribe
  INACTIVE = 'inactive', // Member hasn't participated recently
  REMOVED = 'removed',   // Member was removed by tribe creator/admin
  LEFT = 'left'          // Member voluntarily left the tribe
}

/**
 * Types of activities that can occur within a tribe
 */
export enum ActivityType {
  TRIBE_CREATED = 'tribe_created',       // New tribe formation
  MEMBER_JOINED = 'member_joined',       // New member joined
  MEMBER_LEFT = 'member_left',           // Member left or was removed
  EVENT_CREATED = 'event_created',       // New event was scheduled
  EVENT_COMPLETED = 'event_completed',   // Event occurred and was marked complete
  AI_SUGGESTION = 'ai_suggestion',       // AI provided a recommendation
  CHALLENGE_CREATED = 'challenge_created', // New group challenge was created
  CHALLENGE_COMPLETED = 'challenge_completed' // Group completed a challenge
}

/**
 * Types of messages that can be sent in tribe chats
 */
export enum MessageType {
  TEXT = 'text',         // Standard text message
  IMAGE = 'image',       // Image attachment
  SYSTEM = 'system',     // System notification
  AI_PROMPT = 'ai_prompt', // AI-generated engagement prompt
  EVENT = 'event'        // Event-related message
}

/**
 * Interest associated with a tribe
 */
export interface ITribeInterest {
  id: string;
  tribeId: string;
  category: InterestCategory;
  name: string;
  isPrimary: boolean; // Whether this is a primary interest for the tribe
}

/**
 * User membership in a tribe
 */
export interface ITribeMembership {
  id: string;
  tribeId: string;
  userId: string;
  role: MemberRole;
  status: MembershipStatus;
  joinedAt: Date;
  lastActive: Date;
}

/**
 * Activity that occurred within a tribe
 */
export interface ITribeActivity {
  id: string;
  tribeId: string;
  userId: string;
  activityType: ActivityType;
  description: string;
  timestamp: Date;
  metadata: Record<string, any>; // Flexible metadata for different activity types
}

/**
 * Chat message sent within a tribe
 */
export interface IChatMessage {
  id: string;
  tribeId: string;
  userId: string;
  content: string;
  messageType: MessageType;
  sentAt: Date;
  isRead: boolean;
  metadata: Record<string, any>; // Additional data for rich messages
}

/**
 * Goal set for a tribe
 */
export interface ITribeGoal {
  id: string;
  tribeId: string;
  createdBy: string;
  title: string;
  description: string;
  targetDate: Date;
  isCompleted: boolean;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Complete tribe entity with all related data
 */
export interface ITribe {
  id: string;
  name: string;
  description: string;
  location: string;
  coordinates: ICoordinates;
  imageUrl: string;
  status: TribeStatus;
  privacy: TribePrivacy;
  maxMembers: number; // Cannot exceed TRIBE_LIMITS.MAX_MEMBERS (8)
  createdBy: string;
  createdAt: Date;
  lastActive: Date;
  interests: ITribeInterest[];
  members: ITribeMembership[];
  activities: ITribeActivity[];
  goals: ITribeGoal[];
  metadata: Record<string, any>; // Flexible metadata for tribe customizations
}

/**
 * Data required to create a new tribe
 */
export interface ITribeCreate {
  name: string;
  description: string;
  location: string;
  coordinates: ICoordinates;
  imageUrl: string;
  privacy: TribePrivacy;
  maxMembers: number; // Cannot exceed TRIBE_LIMITS.MAX_MEMBERS (8)
  createdBy: string;
  interests: Array<{
    category: InterestCategory;
    name: string;
    isPrimary: boolean;
  }>;
}

/**
 * Data that can be updated for a tribe
 */
export interface ITribeUpdate {
  name: string;
  description: string;
  location: string;
  coordinates: ICoordinates;
  imageUrl: string;
  privacy: TribePrivacy;
  status: TribeStatus;
  maxMembers: number; // Cannot exceed TRIBE_LIMITS.MAX_MEMBERS (8)
}

/**
 * Data required to create a new tribe membership
 */
export interface IMembershipCreate {
  tribeId: string;
  userId: string;
  role: MemberRole;
}

/**
 * Data that can be updated for a tribe membership
 */
export interface IMembershipUpdate {
  role: MemberRole;
  status: MembershipStatus;
}

/**
 * Data required to create a new chat message
 */
export interface IChatMessageCreate {
  tribeId: string;
  userId: string;
  content: string;
  messageType: MessageType;
  metadata: Record<string, any>;
}

/**
 * Tribe data returned in API responses
 * Simplified version with essential information
 */
export interface ITribeResponse {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl: string;
  status: TribeStatus;
  privacy: TribePrivacy;
  memberCount: number;
  maxMembers: number;
  interests: Array<{
    category: InterestCategory;
    name: string;
    isPrimary: boolean;
  }>;
  userMembership: {
    role: MemberRole;
    status: MembershipStatus;
    joinedAt: Date;
  } | null;
  createdAt: Date;
  lastActive: Date;
  compatibilityScore: number; // Score from AI matching algorithm (0-100)
}

/**
 * Detailed tribe data returned in API responses
 * Contains comprehensive information about the tribe and its activities
 */
export interface ITribeDetailResponse {
  id: string;
  name: string;
  description: string;
  location: string;
  coordinates: ICoordinates;
  imageUrl: string;
  status: TribeStatus;
  privacy: TribePrivacy;
  maxMembers: number;
  createdBy: string;
  creatorName: string;
  interests: Array<{
    id: string;
    category: InterestCategory;
    name: string;
    isPrimary: boolean;
  }>;
  members: Array<{
    id: string;
    userId: string;
    role: MemberRole;
    status: MembershipStatus;
    joinedAt: Date;
    user: {
      id: string;
      name: string;
      avatarUrl: string;
    }
  }>;
  activities: Array<{
    id: string;
    userId: string;
    activityType: ActivityType;
    description: string;
    timestamp: Date;
    user: {
      id: string;
      name: string;
    }
  }>;
  goals: Array<{
    id: string;
    title: string;
    description: string;
    targetDate: Date;
    isCompleted: boolean;
    completedAt: Date;
  }>;
  upcomingEvents: Array<{
    id: string;
    name: string;
    startTime: Date;
    location: string;
  }>;
  userMembership: {
    id: string;
    role: MemberRole;
    status: MembershipStatus;
    joinedAt: Date;
  };
  unreadMessageCount: number;
  createdAt: Date;
  lastActive: Date;
}

/**
 * Parameters for searching tribes
 */
export interface ITribeSearchParams {
  query: string;                 // Text search in name/description
  interests: InterestCategory[]; // Filter by interest categories
  location: ICoordinates;        // Center point for proximity search
  maxDistance: number;           // Maximum distance from location in miles
  status: TribeStatus[];         // Filter by tribe status
  privacy: TribePrivacy;         // Filter by privacy setting
  hasAvailableSpots: boolean;    // Only show tribes with open slots
  page: number;                  // Pagination page number
  limit: number;                 // Items per page
}