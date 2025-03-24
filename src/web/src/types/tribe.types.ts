/**
 * TypeScript type definitions for tribe-related data structures used throughout the Tribe application.
 * This file defines interfaces and enums for tribes, tribe members, tribe activities, tribe goals, 
 * and related types to ensure type safety for all tribe-related operations.
 */

import { Coordinates, Profile } from './profile.types';
import { User } from './auth.types';

/**
 * Enum representing the privacy settings for a tribe
 */
export enum TribePrivacy {
  PUBLIC = 'PUBLIC',   // Visible to all users, can be found in search
  PRIVATE = 'PRIVATE'  // Visible only to members and by invitation
}

/**
 * Enum representing the current status of a tribe
 * Follows the lifecycle defined in the technical specifications
 */
export enum TribeStatus {
  FORMATION = 'FORMATION',     // Initial creation, gathering members
  ACTIVE = 'ACTIVE',           // Minimum 4 members joined
  ENGAGED = 'ENGAGED',         // First meetup completed
  ESTABLISHED = 'ESTABLISHED', // 3+ meetups completed
  THRIVING = 'THRIVING',       // Regular meetups & high engagement
  AT_RISK = 'AT_RISK',         // No meetup in 30 days
  INACTIVE = 'INACTIVE',       // No meetup in 60 days
  DISSOLVED = 'DISSOLVED'      // No activity in 90 days
}

/**
 * Enum representing the role of a member within a tribe
 */
export enum MemberRole {
  CREATOR = 'CREATOR', // Original creator with full admin rights
  ADMIN = 'ADMIN',     // Has administrative permissions
  MEMBER = 'MEMBER'    // Regular member
}

/**
 * Enum representing the status of a member within a tribe
 */
export enum MemberStatus {
  INVITED = 'INVITED',   // Received invitation but hasn't responded
  PENDING = 'PENDING',   // Requested to join, awaiting approval
  ACTIVE = 'ACTIVE',     // Active member of the tribe
  INACTIVE = 'INACTIVE', // Inactive for an extended period
  REMOVED = 'REMOVED',   // Removed from the tribe
  LEFT = 'LEFT'          // Voluntarily left the tribe
}

/**
 * Enum representing the types of activities that can occur within a tribe
 */
export enum ActivityType {
  MEMBER_JOINED = 'MEMBER_JOINED',
  MEMBER_LEFT = 'MEMBER_LEFT',
  EVENT_CREATED = 'EVENT_CREATED',
  EVENT_UPDATED = 'EVENT_UPDATED',
  EVENT_CANCELLED = 'EVENT_CANCELLED',
  EVENT_COMPLETED = 'EVENT_COMPLETED',
  GOAL_CREATED = 'GOAL_CREATED',
  GOAL_COMPLETED = 'GOAL_COMPLETED',
  AI_SUGGESTION = 'AI_SUGGESTION',
  TRIBE_UPDATED = 'TRIBE_UPDATED'
}

/**
 * Enum representing the status of a tribe goal
 */
export enum GoalStatus {
  ACTIVE = 'ACTIVE',       // Currently being worked on
  COMPLETED = 'COMPLETED', // Successfully achieved
  ABANDONED = 'ABANDONED'  // No longer being pursued
}

/**
 * Interface representing a tribe in the application
 */
export interface Tribe {
  id: string;
  name: string;
  description: string;
  location: string;
  coordinates: Coordinates;
  imageUrl: string;
  coverImageUrl: string;
  createdAt: Date;
  createdBy: string;        // User ID of creator
  status: TribeStatus;
  privacy: TribePrivacy;
  maxMembers: number;       // Limited to 8 per technical specifications
  memberCount: number;      // Current number of members
  members: TribeMember[];   // Array of tribe members
  activities: TribeActivity[]; // Array of tribe activities
  goals: TribeGoal[];       // Array of tribe goals
  primaryInterests: string[]; // Main interests of the tribe
  secondaryInterests: string[]; // Additional interests
  compatibilityScore: number; // For the current user viewing the tribe
  lastActivity: Date;       // Date of most recent activity
  upcomingEventCount: number; // Number of planned future events
  isAiGenerated: boolean;   // Whether this tribe was auto-formed by AI
  metadata: Record<string, any>; // Flexible field for additional data
}

/**
 * Interface representing a member of a tribe
 */
export interface TribeMember {
  id: string;
  tribeId: string;
  userId: string;
  profile: Profile;         // Reference to user profile
  role: MemberRole;
  status: MemberStatus;
  joinedAt: Date;
  lastActive: Date;
  compatibilityScores: Record<string, number>; // Compatibility with other members
  engagementScore: number;  // Measure of participation and engagement
}

/**
 * Interface representing an activity that occurred within a tribe
 */
export interface TribeActivity {
  id: string;
  tribeId: string;
  userId: string;           // User who performed the activity
  activityType: ActivityType;
  description: string;
  timestamp: Date;
  metadata: Record<string, any>; // Additional data specific to activity type
}

/**
 * Interface representing a goal set by a tribe
 */
export interface TribeGoal {
  id: string;
  tribeId: string;
  createdBy: string;        // User ID of creator
  title: string;
  description: string;
  status: GoalStatus;
  createdAt: Date;
  targetDate: Date;         // Planned completion date
  completedAt: Date;        // Actual completion date
  isAiGenerated: boolean;   // Whether this goal was suggested by AI
}

/**
 * Interface representing engagement metrics for a tribe
 */
export interface TribeEngagementMetrics {
  tribeId: string;
  messageCount: number;
  messageCountLast7Days: number;
  messageCountLast30Days: number;
  eventCount: number;
  eventCountLast30Days: number;
  completedEventCount: number;
  averageEventAttendance: number;
  activeMembers: number;
  activeMembersPercentage: number;
  lastActivityDate: Date;
  overallEngagementScore: number; // Calculated score based on various metrics
}

/**
 * Interface representing the request payload for creating a new tribe
 */
export interface CreateTribeRequest {
  name: string;
  description: string;
  location: string;
  coordinates: Coordinates;
  imageUrl: string;
  coverImageUrl: string;
  privacy: TribePrivacy;
  maxMembers: number;       // Max 8 per specs
  primaryInterests: string[];
  secondaryInterests: string[];
}

/**
 * Interface representing the request payload for updating an existing tribe
 */
export interface UpdateTribeRequest {
  name: string;
  description: string;
  location: string;
  coordinates: Coordinates;
  imageUrl: string;
  coverImageUrl: string;
  privacy: TribePrivacy;
  maxMembers: number;
  primaryInterests: string[];
  secondaryInterests: string[];
  status: TribeStatus;      // Allowing status updates for admin functions
}

/**
 * Interface representing a request to join a tribe
 */
export interface JoinTribeRequest {
  tribeId: string;
  message: string;          // Optional message to tribe admins
}

/**
 * Interface representing a request to invite a user to a tribe
 */
export interface InviteMemberRequest {
  tribeId: string;
  userId: string;
  message: string;          // Optional invitation message
}

/**
 * Interface representing filters for searching tribes
 */
export interface TribeSearchFilters {
  query: string;            // Search term
  location: string;
  coordinates: Coordinates;
  radius: number;           // Search radius in miles/kilometers
  interests: string[];      // Interest categories to filter by
  minCompatibility: number; // Minimum compatibility score (0-100)
  status: TribeStatus[];    // Filter by tribe status
  privacy: TribePrivacy;    // Filter by privacy setting
  hasAvailableSpots: boolean; // Only show tribes with open spots
  isAiGenerated: boolean;   // Filter for AI-generated tribes
}

/**
 * Interface representing the request payload for creating a new tribe goal
 */
export interface CreateTribeGoalRequest {
  tribeId: string;
  title: string;
  description: string;
  targetDate: Date;
  isAiGenerated: boolean;   // Whether suggested by AI
}

/**
 * Interface representing the request payload for updating a tribe goal
 */
export interface UpdateTribeGoalRequest {
  goalId: string;
  title: string;
  description: string;
  status: GoalStatus;
  targetDate: Date;
}

/**
 * Interface representing the tribe state in the Redux store
 */
export interface TribeState {
  tribes: Record<string, Tribe>; // Map of tribe IDs to tribe objects
  userTribes: string[];          // IDs of tribes the user belongs to
  suggestedTribes: string[];     // IDs of tribes suggested to the user
  activeTribe: string | null;    // ID of currently selected tribe
  loading: boolean;
  error: string | null;
  searchResults: string[];       // IDs of tribes from search
  searchLoading: boolean;
  searchError: string | null;
}

/**
 * Namespace containing all tribe-related types for easy import
 */
export namespace TribeTypes {
  export {
    Tribe,
    TribeMember,
    TribeActivity,
    TribeGoal,
    TribePrivacy,
    TribeStatus,
    MemberRole,
    MemberStatus,
    ActivityType,
    GoalStatus,
    TribeEngagementMetrics,
    CreateTribeRequest,
    UpdateTribeRequest,
    JoinTribeRequest,
    InviteMemberRequest,
    TribeSearchFilters,
    CreateTribeGoalRequest,
    UpdateTribeGoalRequest,
    TribeState
  };
}