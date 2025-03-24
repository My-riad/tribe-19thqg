/**
 * tribe.util.ts
 * 
 * Utility functions for tribe-related operations in the Tribe platform.
 * This file provides helper functions for validating, formatting, and processing tribe data,
 * as well as determining tribe status changes, calculating compatibility, and checking membership eligibility.
 */

import {
  ITribe, ITribeCreate, ITribeUpdate, ITribeInterest, ITribeSearchParams,
  ITribeResponse, ITribeDetailResponse,
  TribeStatus, TribePrivacy, MemberRole, MembershipStatus, ActivityType
} from '@shared/types';
import { InterestCategory, ICoordinates } from '@shared/types';
import { TRIBE_LIMITS } from '@shared/constants/app.constants';
import { ValidationError } from '@shared/errors';
import { logger } from '@shared/utils';

// Constants for tribe-related validations
export const MAX_TRIBE_NAME_LENGTH = 50;
export const MAX_TRIBE_DESCRIPTION_LENGTH = 500;
export const MIN_TRIBE_NAME_LENGTH = 3;
export const DEFAULT_MAX_MEMBERS = 8;
export const MIN_TRIBE_MEMBERS = 4;
export const MAX_TRIBE_MEMBERS = 8;
export const MAX_USER_TRIBES = 3;

/**
 * Validates tribe creation data against business rules
 * 
 * @param tribeData Tribe creation data to validate
 * @returns Validated tribe data
 * @throws ValidationError if data doesn't meet requirements
 */
export function validateTribeCreate(tribeData: ITribeCreate): ITribeCreate {
  logger.info('Validating tribe creation data');
  
  // Check required fields
  if (!tribeData.name) {
    throw ValidationError.invalidField('name', 'is required');
  }
  
  // Validate name length
  if (tribeData.name.length < MIN_TRIBE_NAME_LENGTH || tribeData.name.length > MAX_TRIBE_NAME_LENGTH) {
    throw ValidationError.invalidLength('name', MIN_TRIBE_NAME_LENGTH, MAX_TRIBE_NAME_LENGTH);
  }
  
  // Validate description
  if (!tribeData.description) {
    throw ValidationError.invalidField('description', 'is required');
  }
  
  if (tribeData.description.length > MAX_TRIBE_DESCRIPTION_LENGTH) {
    throw ValidationError.invalidLength('description', 0, MAX_TRIBE_DESCRIPTION_LENGTH);
  }
  
  // Validate location
  if (!tribeData.location) {
    throw ValidationError.invalidField('location', 'is required');
  }
  
  // Validate coordinates
  if (!tribeData.coordinates || 
      typeof tribeData.coordinates.latitude !== 'number' || 
      typeof tribeData.coordinates.longitude !== 'number') {
    throw ValidationError.invalidField('coordinates', 'must include valid latitude and longitude');
  }
  
  // Validate maximum members
  if (tribeData.maxMembers !== undefined) {
    if (tribeData.maxMembers < MIN_TRIBE_MEMBERS || tribeData.maxMembers > MAX_TRIBE_MEMBERS) {
      throw ValidationError.invalidRange('maxMembers', MIN_TRIBE_MEMBERS, MAX_TRIBE_MEMBERS);
    }
  } else {
    // Set default max members if not provided
    tribeData.maxMembers = DEFAULT_MAX_MEMBERS;
  }
  
  // Validate privacy
  if (tribeData.privacy === undefined) {
    tribeData.privacy = TribePrivacy.PUBLIC;
  } else if (!Object.values(TribePrivacy).includes(tribeData.privacy)) {
    throw ValidationError.invalidEnum('privacy', Object.values(TribePrivacy));
  }
  
  // Validate interests
  if (!tribeData.interests || !Array.isArray(tribeData.interests) || tribeData.interests.length === 0) {
    throw ValidationError.invalidField('interests', 'must include at least one interest');
  }
  
  // Validate that at least one primary interest is defined
  const hasPrimaryInterest = tribeData.interests.some(interest => interest.isPrimary);
  if (!hasPrimaryInterest) {
    throw ValidationError.invalidField('interests', 'must include at least one primary interest');
  }
  
  // Validate each interest
  tribeData.interests = tribeData.interests.map(interest => validateTribeInterest(interest));
  
  // Set default image URL if not provided
  if (!tribeData.imageUrl) {
    tribeData.imageUrl = '';
  }
  
  return tribeData;
}

/**
 * Validates tribe update data against business rules
 * 
 * @param updateData Tribe update data to validate
 * @returns Validated update data
 * @throws ValidationError if data doesn't meet requirements
 */
export function validateTribeUpdate(updateData: ITribeUpdate): ITribeUpdate {
  logger.info('Validating tribe update data');
  
  // Check if at least one field is being updated
  if (Object.keys(updateData).length === 0) {
    throw ValidationError.invalidInput('At least one field must be provided for update');
  }
  
  // Validate name if provided
  if (updateData.name !== undefined) {
    if (updateData.name.length < MIN_TRIBE_NAME_LENGTH || updateData.name.length > MAX_TRIBE_NAME_LENGTH) {
      throw ValidationError.invalidLength('name', MIN_TRIBE_NAME_LENGTH, MAX_TRIBE_NAME_LENGTH);
    }
  }
  
  // Validate description if provided
  if (updateData.description !== undefined) {
    if (updateData.description.length > MAX_TRIBE_DESCRIPTION_LENGTH) {
      throw ValidationError.invalidLength('description', 0, MAX_TRIBE_DESCRIPTION_LENGTH);
    }
  }
  
  // Validate location if provided
  if (updateData.location !== undefined && !updateData.location) {
    throw ValidationError.invalidField('location', 'cannot be empty if provided');
  }
  
  // Validate coordinates if provided
  if (updateData.coordinates !== undefined) {
    if (typeof updateData.coordinates.latitude !== 'number' || 
        typeof updateData.coordinates.longitude !== 'number') {
      throw ValidationError.invalidField('coordinates', 'must include valid latitude and longitude');
    }
  }
  
  // Validate maxMembers if provided
  if (updateData.maxMembers !== undefined) {
    if (updateData.maxMembers < MIN_TRIBE_MEMBERS || updateData.maxMembers > MAX_TRIBE_MEMBERS) {
      throw ValidationError.invalidRange('maxMembers', MIN_TRIBE_MEMBERS, MAX_TRIBE_MEMBERS);
    }
  }
  
  // Validate status if provided
  if (updateData.status !== undefined) {
    if (!Object.values(TribeStatus).includes(updateData.status)) {
      throw ValidationError.invalidEnum('status', Object.values(TribeStatus));
    }
  }
  
  // Validate privacy if provided
  if (updateData.privacy !== undefined) {
    if (!Object.values(TribePrivacy).includes(updateData.privacy)) {
      throw ValidationError.invalidEnum('privacy', Object.values(TribePrivacy));
    }
  }
  
  return updateData;
}

/**
 * Validates tribe interest data
 * 
 * @param interestData Interest data to validate
 * @returns Validated interest data
 * @throws ValidationError if data doesn't meet requirements
 */
export function validateTribeInterest(interestData: { category: InterestCategory; name: string; isPrimary: boolean }): { category: InterestCategory; name: string; isPrimary: boolean } {
  // Validate category
  if (!interestData.category || !Object.values(InterestCategory).includes(interestData.category)) {
    throw ValidationError.invalidEnum('category', Object.values(InterestCategory));
  }
  
  // Validate name
  if (!interestData.name || interestData.name.trim().length === 0) {
    throw ValidationError.invalidField('name', 'is required and cannot be empty');
  }
  
  if (interestData.name.length > 50) {
    throw ValidationError.invalidLength('name', 1, 50);
  }
  
  // Set default value for isPrimary if not provided
  const result = { ...interestData };
  if (result.isPrimary === undefined) {
    result.isPrimary = false;
  }
  
  return result;
}

/**
 * Validates tribe search parameters
 * 
 * @param searchParams Search parameters to validate
 * @returns Validated search parameters
 */
export function validateTribeSearchParams(searchParams: ITribeSearchParams): ITribeSearchParams {
  // Create a new object to avoid modifying the original
  const validatedParams: ITribeSearchParams = { ...searchParams };
  
  // Validate query string
  if (validatedParams.query !== undefined) {
    if (typeof validatedParams.query !== 'string') {
      throw ValidationError.invalidType('query', 'string');
    }
    
    // Trim and limit query length
    validatedParams.query = validatedParams.query.trim().substring(0, 100);
  }
  
  // Validate interests
  if (validatedParams.interests !== undefined) {
    if (!Array.isArray(validatedParams.interests)) {
      throw ValidationError.invalidType('interests', 'array');
    }
    
    // Check each interest is valid
    for (const interest of validatedParams.interests) {
      if (!Object.values(InterestCategory).includes(interest)) {
        throw ValidationError.invalidEnum('interests items', Object.values(InterestCategory));
      }
    }
  }
  
  // Validate location
  if (validatedParams.location !== undefined) {
    if (typeof validatedParams.location !== 'object' || 
        validatedParams.location === null ||
        typeof validatedParams.location.latitude !== 'number' || 
        typeof validatedParams.location.longitude !== 'number') {
      throw ValidationError.invalidField('location', 'must include valid latitude and longitude');
    }
  }
  
  // Validate maxDistance
  if (validatedParams.maxDistance !== undefined) {
    if (typeof validatedParams.maxDistance !== 'number' || validatedParams.maxDistance <= 0) {
      throw ValidationError.invalidField('maxDistance', 'must be a positive number');
    }
    
    // Cap max distance at a reasonable value (e.g., 100 miles)
    validatedParams.maxDistance = Math.min(validatedParams.maxDistance, 100);
  }
  
  // Validate status
  if (validatedParams.status !== undefined) {
    if (!Array.isArray(validatedParams.status)) {
      throw ValidationError.invalidType('status', 'array');
    }
    
    // Check each status is valid
    for (const status of validatedParams.status) {
      if (!Object.values(TribeStatus).includes(status)) {
        throw ValidationError.invalidEnum('status items', Object.values(TribeStatus));
      }
    }
  }
  
  // Validate privacy
  if (validatedParams.privacy !== undefined) {
    if (!Object.values(TribePrivacy).includes(validatedParams.privacy)) {
      throw ValidationError.invalidEnum('privacy', Object.values(TribePrivacy));
    }
  }
  
  // Set default values for pagination
  if (validatedParams.page === undefined || validatedParams.page < 1) {
    validatedParams.page = 1;
  }
  
  if (validatedParams.limit === undefined || validatedParams.limit < 1) {
    validatedParams.limit = 20;
  } else {
    // Cap limit at a reasonable value
    validatedParams.limit = Math.min(validatedParams.limit, 100);
  }
  
  return validatedParams;
}

/**
 * Generates a URL-friendly slug for a tribe name
 * 
 * @param tribeName The tribe name to convert to a slug
 * @returns URL-friendly slug
 */
export function generateTribeSlug(tribeName: string): string {
  return tribeName
    .toLowerCase()
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')      // Remove all non-word chars
    .replace(/\-\-+/g, '-')        // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')            // Trim hyphens from start
    .replace(/-+$/, '');           // Trim hyphens from end
}

/**
 * Calculates compatibility score between a user and a tribe
 * 
 * @param userProfile User profile with interests
 * @param tribe Tribe data
 * @returns Compatibility score (0-100)
 */
export function calculateTribeCompatibility(
  userProfile: { interests: Array<{category: InterestCategory}> },
  tribe: ITribe
): number {
  // Extract user interests
  const userInterests = userProfile.interests.map(interest => interest.category);
  
  // Extract tribe interests, separating primary and secondary
  const tribePrimaryInterests = tribe.interests
    .filter(interest => interest.isPrimary)
    .map(interest => interest.category);
    
  const tribeSecondaryInterests = tribe.interests
    .filter(interest => !interest.isPrimary)
    .map(interest => interest.category);
  
  // Calculate interest overlap
  let compatibilityScore = 0;
  let maxPossibleScore = 0;
  
  // Primary interests have higher weight (e.g., 2.0)
  const primaryWeight = 2.0;
  const secondaryWeight = 1.0;
  
  // Calculate primary interest overlap
  for (const primaryInterest of tribePrimaryInterests) {
    maxPossibleScore += primaryWeight;
    if (userInterests.includes(primaryInterest)) {
      compatibilityScore += primaryWeight;
    }
  }
  
  // Calculate secondary interest overlap
  for (const secondaryInterest of tribeSecondaryInterests) {
    maxPossibleScore += secondaryWeight;
    if (userInterests.includes(secondaryInterest)) {
      compatibilityScore += secondaryWeight;
    }
  }
  
  // Normalize score to 0-100 range
  let normalizedScore = maxPossibleScore > 0 
    ? Math.round((compatibilityScore / maxPossibleScore) * 100)
    : 0;
  
  // Optionally, consider other factors like location proximity
  // This is a simple implementation; in practice, this would be more sophisticated
  
  return normalizedScore;
}

/**
 * Calculates distance between two geographic coordinates using Haversine formula
 * 
 * @param coords1 First coordinate pair
 * @param coords2 Second coordinate pair
 * @returns Distance in kilometers
 */
export function calculateDistance(coords1: ICoordinates, coords2: ICoordinates): number {
  // Ensure coordinates are valid
  if (!coords1 || !coords2 || 
      typeof coords1.latitude !== 'number' || 
      typeof coords1.longitude !== 'number' ||
      typeof coords2.latitude !== 'number' || 
      typeof coords2.longitude !== 'number') {
    return Infinity;
  }

  // Earth's radius in kilometers
  const R = 6371;
  
  // Convert latitude and longitude from degrees to radians
  const lat1 = coords1.latitude * Math.PI / 180;
  const lon1 = coords1.longitude * Math.PI / 180;
  const lat2 = coords2.latitude * Math.PI / 180;
  const lon2 = coords2.longitude * Math.PI / 180;
  
  // Haversine formula
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1) * Math.cos(lat2) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

/**
 * Checks if a location is within a specified radius of another location
 * 
 * @param coords1 First coordinate pair
 * @param coords2 Second coordinate pair
 * @param radiusKm Radius in kilometers
 * @returns True if within radius, false otherwise
 */
export function isWithinRadius(coords1: ICoordinates, coords2: ICoordinates, radiusKm: number): boolean {
  const distance = calculateDistance(coords1, coords2);
  return distance <= radiusKm;
}

/**
 * Formats tribe description for display, applying length limits and formatting
 * 
 * @param description Original description
 * @param maxLength Maximum length for the formatted description
 * @returns Formatted description
 */
export function formatTribeDescription(description: string, maxLength: number = 150): string {
  if (!description) {
    return '';
  }
  
  // Trim whitespace
  let formatted = description.trim();
  
  // Truncate if longer than maxLength
  if (formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength) + '...';
  }
  
  return formatted;
}

/**
 * Gets human-readable text for a tribe status
 * 
 * @param status Tribe status enum value
 * @returns Human-readable status text
 */
export function getTribeStatusText(status: TribeStatus): string {
  switch (status) {
    case TribeStatus.FORMING:
      return 'Forming';
    case TribeStatus.ACTIVE:
      return 'Active';
    case TribeStatus.AT_RISK:
      return 'At Risk';
    case TribeStatus.INACTIVE:
      return 'Inactive';
    case TribeStatus.DISSOLVED:
      return 'Dissolved';
    default:
      return 'Unknown';
  }
}

/**
 * Gets human-readable text for a tribe privacy setting
 * 
 * @param privacy Tribe privacy enum value
 * @returns Human-readable privacy text
 */
export function getTribePrivacyText(privacy: TribePrivacy): string {
  switch (privacy) {
    case TribePrivacy.PUBLIC:
      return 'Public';
    case TribePrivacy.PRIVATE:
      return 'Private';
    default:
      return 'Unknown';
  }
}

/**
 * Gets human-readable text for a member role
 * 
 * @param role Member role enum value
 * @returns Human-readable role text
 */
export function getMemberRoleText(role: MemberRole): string {
  switch (role) {
    case MemberRole.CREATOR:
      return 'Creator';
    case MemberRole.MEMBER:
      return 'Member';
    default:
      return 'Unknown';
  }
}

/**
 * Gets human-readable text for a membership status
 * 
 * @param status Membership status enum value
 * @returns Human-readable status text
 */
export function getMembershipStatusText(status: MembershipStatus): string {
  switch (status) {
    case MembershipStatus.PENDING:
      return 'Pending';
    case MembershipStatus.ACTIVE:
      return 'Active';
    case MembershipStatus.INACTIVE:
      return 'Inactive';
    case MembershipStatus.REMOVED:
      return 'Removed';
    case MembershipStatus.LEFT:
      return 'Left';
    default:
      return 'Unknown';
  }
}

/**
 * Gets human-readable text for an activity type
 * 
 * @param activityType Activity type enum value
 * @returns Human-readable activity type text
 */
export function getActivityTypeText(activityType: ActivityType): string {
  switch (activityType) {
    case ActivityType.TRIBE_CREATED:
      return 'Tribe Created';
    case ActivityType.MEMBER_JOINED:
      return 'Member Joined';
    case ActivityType.MEMBER_LEFT:
      return 'Member Left';
    case ActivityType.EVENT_CREATED:
      return 'Event Created';
    case ActivityType.EVENT_COMPLETED:
      return 'Event Completed';
    case ActivityType.AI_SUGGESTION:
      return 'AI Suggestion';
    case ActivityType.CHALLENGE_CREATED:
      return 'Challenge Created';
    case ActivityType.CHALLENGE_COMPLETED:
      return 'Challenge Completed';
    default:
      return 'Unknown';
  }
}

/**
 * Checks if a user can join a tribe based on membership limits
 * 
 * @param currentTribeCount Number of tribes the user is currently in
 * @param currentMemberCount Current number of members in the tribe
 * @param maxMembers Maximum allowed members in the tribe
 * @returns Object indicating whether the user can join and reason if they cannot
 */
export function canUserJoinTribe(
  currentTribeCount: number,
  currentMemberCount: number,
  maxMembers: number = DEFAULT_MAX_MEMBERS
): { canJoin: boolean; reason: string | null } {
  // Check if user has reached their tribe limit
  if (currentTribeCount >= MAX_USER_TRIBES) {
    return {
      canJoin: false,
      reason: `You can join a maximum of ${MAX_USER_TRIBES} Tribes. Please leave a Tribe before joining a new one.`
    };
  }
  
  // Check if tribe has reached its member capacity
  if (currentMemberCount >= maxMembers) {
    return {
      canJoin: false,
      reason: `This Tribe has reached its maximum capacity of ${maxMembers} members.`
    };
  }
  
  // User can join
  return {
    canJoin: true,
    reason: null
  };
}

/**
 * Determines if tribe status should be updated based on activity and membership
 * 
 * @param currentStatus Current tribe status
 * @param activeMemberCount Number of active members
 * @param lastActivityDate Date of the last tribe activity
 * @returns Object indicating whether status should update and the new status
 */
export function shouldUpdateTribeStatus(
  currentStatus: TribeStatus,
  activeMemberCount: number,
  lastActivityDate: Date
): { shouldUpdate: boolean; newStatus: TribeStatus | null } {
  // Calculate days since last activity
  const now = new Date();
  const daysSinceLastActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Check if membership falls below minimum
  const isBelowMinimumMembers = activeMemberCount < MIN_TRIBE_MEMBERS;
  
  // Define status transition rules based on current status
  switch (currentStatus) {
    case TribeStatus.FORMING:
      // Transition to ACTIVE if enough members
      if (activeMemberCount >= MIN_TRIBE_MEMBERS) {
        return { shouldUpdate: true, newStatus: TribeStatus.ACTIVE };
      }
      // Transition to DISSOLVED if forming for too long without enough members
      if (daysSinceLastActivity > 14 && isBelowMinimumMembers) {
        return { shouldUpdate: true, newStatus: TribeStatus.DISSOLVED };
      }
      break;
      
    case TribeStatus.ACTIVE:
      // Transition to AT_RISK if no activity for 14+ days
      if (daysSinceLastActivity > 14) {
        return { shouldUpdate: true, newStatus: TribeStatus.AT_RISK };
      }
      // Transition to AT_RISK if membership falls below minimum
      if (isBelowMinimumMembers) {
        return { shouldUpdate: true, newStatus: TribeStatus.AT_RISK };
      }
      break;
      
    case TribeStatus.AT_RISK:
      // Transition back to ACTIVE if recent activity and enough members
      if (daysSinceLastActivity <= 7 && activeMemberCount >= MIN_TRIBE_MEMBERS) {
        return { shouldUpdate: true, newStatus: TribeStatus.ACTIVE };
      }
      // Transition to INACTIVE if no activity for 30+ days
      if (daysSinceLastActivity > 30) {
        return { shouldUpdate: true, newStatus: TribeStatus.INACTIVE };
      }
      break;
      
    case TribeStatus.INACTIVE:
      // Transition back to ACTIVE if activity resumed and enough members
      if (daysSinceLastActivity <= 3 && activeMemberCount >= MIN_TRIBE_MEMBERS) {
        return { shouldUpdate: true, newStatus: TribeStatus.ACTIVE };
      }
      // Transition to DISSOLVED if inactive for 90+ days
      if (daysSinceLastActivity > 90) {
        return { shouldUpdate: true, newStatus: TribeStatus.DISSOLVED };
      }
      break;
      
    case TribeStatus.DISSOLVED:
      // No transitions from DISSOLVED state
      break;
      
    default:
      logger.error(`Unknown tribe status: ${currentStatus}`);
      break;
  }
  
  // No status change needed
  return { shouldUpdate: false, newStatus: null };
}

/**
 * Formats tribe data for API response
 * 
 * @param tribe Tribe data to format
 * @param options Additional options for formatting (user membership, compatibility score)
 * @returns Formatted tribe response
 */
export function formatTribeForResponse(
  tribe: ITribe,
  options: { userMembership?: any; compatibilityScore?: number } = {}
): ITribeResponse {
  // Extract member count
  const memberCount = tribe.members ? tribe.members.length : 0;
  
  // Format interests for response
  const interests = tribe.interests.map(interest => ({
    category: interest.category,
    name: interest.name,
    isPrimary: interest.isPrimary
  }));
  
  // Format user's membership if provided
  const userMembership = options.userMembership ? {
    role: options.userMembership.role,
    status: options.userMembership.status,
    joinedAt: options.userMembership.joinedAt
  } : null;
  
  // Build response object
  const response: ITribeResponse = {
    id: tribe.id,
    name: tribe.name,
    description: formatTribeDescription(tribe.description, 200),
    location: tribe.location,
    imageUrl: tribe.imageUrl,
    status: tribe.status,
    privacy: tribe.privacy,
    memberCount,
    maxMembers: tribe.maxMembers,
    interests,
    userMembership,
    createdAt: tribe.createdAt,
    lastActive: tribe.lastActive,
    compatibilityScore: options.compatibilityScore !== undefined ? options.compatibilityScore : 0
  };
  
  return response;
}