import { User } from '../types/auth.types';
import { Tribe, TribeMember, MemberRole, MemberStatus } from '../types/tribe.types';
import { Event, EventAttendee, RSVPStatus } from '../types/event.types';
import { Profile } from '../types/profile.types';

/**
 * Checks if a user is authenticated
 * @param user The user object or null
 * @returns True if the user is authenticated, false otherwise
 */
export const isAuthenticated = (user: User | null): boolean => {
  return !!user;
};

/**
 * Checks if a user is a member of a specific tribe
 * @param user The user object or null
 * @param tribe The tribe to check membership for
 * @returns True if the user is a member of the tribe, false otherwise
 */
export const isTribeMember = (user: User | null, tribe: Tribe): boolean => {
  if (!isAuthenticated(user)) return false;
  
  const membership = tribe.members.find(
    member => member.userId === user!.id && member.status === MemberStatus.ACTIVE
  );
  
  return !!membership;
};

/**
 * Checks if a user is an admin of a specific tribe
 * @param user The user object or null
 * @param tribe The tribe to check admin status for
 * @returns True if the user is an admin of the tribe, false otherwise
 */
export const isTribeAdmin = (user: User | null, tribe: Tribe): boolean => {
  if (!isAuthenticated(user)) return false;
  
  const membership = tribe.members.find(
    member => member.userId === user!.id && member.status === MemberStatus.ACTIVE
  );
  
  return !!membership && (membership.role === MemberRole.ADMIN || membership.role === MemberRole.CREATOR);
};

/**
 * Checks if a user is the creator of a specific tribe
 * @param user The user object or null
 * @param tribe The tribe to check creator status for
 * @returns True if the user is the creator of the tribe, false otherwise
 */
export const isTribeCreator = (user: User | null, tribe: Tribe): boolean => {
  if (!isAuthenticated(user)) return false;
  return tribe.createdBy === user!.id;
};

/**
 * Checks if a user can manage a specific tribe (admin or creator)
 * @param user The user object or null
 * @param tribe The tribe to check management permissions for
 * @returns True if the user can manage the tribe, false otherwise
 */
export const canManageTribe = (user: User | null, tribe: Tribe): boolean => {
  return isTribeAdmin(user, tribe);
};

/**
 * Checks if a user can edit a specific tribe
 * @param user The user object or null
 * @param tribe The tribe to check edit permissions for
 * @returns True if the user can edit the tribe, false otherwise
 */
export const canEditTribe = (user: User | null, tribe: Tribe): boolean => {
  return isTribeAdmin(user, tribe);
};

/**
 * Checks if a user can remove a member from a tribe
 * @param user The user object or null
 * @param tribe The tribe to check removal permissions for
 * @param memberId The ID of the member to be removed
 * @returns True if the user can remove the member, false otherwise
 */
export const canRemoveMember = (user: User | null, tribe: Tribe, memberId: string): boolean => {
  if (!isTribeAdmin(user, tribe)) return false;
  
  // User can always remove themselves
  if (user!.id === memberId) return true;
  
  // Creator can remove anyone
  if (isTribeCreator(user, tribe)) return true;
  
  // Admin can remove regular members but not other admins or the creator
  const memberToRemove = tribe.members.find(member => member.userId === memberId);
  if (!memberToRemove) return false;
  
  return memberToRemove.role === MemberRole.MEMBER;
};

/**
 * Checks if a user can create an event for a tribe
 * @param user The user object or null
 * @param tribe The tribe to check event creation permissions for
 * @returns True if the user can create an event, false otherwise
 */
export const canCreateEvent = (user: User | null, tribe: Tribe): boolean => {
  return isTribeMember(user, tribe);
};

/**
 * Checks if a user can edit a specific event
 * @param user The user object or null
 * @param event The event to check edit permissions for
 * @param tribe The tribe the event belongs to
 * @returns True if the user can edit the event, false otherwise
 */
export const canEditEvent = (user: User | null, event: Event, tribe: Tribe): boolean => {
  if (!isAuthenticated(user)) return false;
  
  // Event creator can edit their own events
  if (event.createdBy === user!.id) return true;
  
  // Tribe admins can edit any event in their tribe
  return isTribeAdmin(user, tribe);
};

/**
 * Checks if a user can cancel a specific event
 * @param user The user object or null
 * @param event The event to check cancellation permissions for
 * @param tribe The tribe the event belongs to
 * @returns True if the user can cancel the event, false otherwise
 */
export const canCancelEvent = (user: User | null, event: Event, tribe: Tribe): boolean => {
  return canEditEvent(user, event, tribe);
};

/**
 * Checks if a user can view detailed information about a tribe
 * @param user The user object or null
 * @param tribe The tribe to check view permissions for
 * @returns True if the user can view tribe details, false otherwise
 */
export const canViewTribeDetails = (user: User | null, tribe: Tribe): boolean => {
  // Public tribes can be viewed by anyone
  if (tribe.privacy === 'PUBLIC') return true;
  
  // Private tribes can only be viewed by members
  return isTribeMember(user, tribe);
};

/**
 * Checks if a user can join a specific tribe
 * @param user The user object or null
 * @param tribe The tribe to check join permissions for
 * @param userTribes Array of tribes the user is currently a member of
 * @returns True if the user can join the tribe, false otherwise
 */
export const canJoinTribe = (user: User | null, tribe: Tribe, userTribes: Tribe[]): boolean => {
  if (!isAuthenticated(user)) return false;
  
  // Can't join if already a member
  if (isTribeMember(user, tribe)) return false;
  
  // Can't join if tribe is at max capacity
  if (tribe.memberCount >= tribe.maxMembers) return false;
  
  // Users can only join a maximum of 3 tribes (per technical specifications)
  if (userTribes.length >= 3) return false;
  
  return true;
};

/**
 * Checks if a user can leave a specific tribe
 * @param user The user object or null
 * @param tribe The tribe to check leave permissions for
 * @returns True if the user can leave the tribe, false otherwise
 */
export const canLeaveTribe = (user: User | null, tribe: Tribe): boolean => {
  if (!isTribeMember(user, tribe)) return false;
  
  // Creator can only leave if there are other members or they're the last one
  if (isTribeCreator(user, tribe)) {
    const otherActiveMembers = tribe.members.filter(
      member => member.userId !== user!.id && member.status === MemberStatus.ACTIVE
    );
    
    // Creator can leave if there are other active members or they're the only one left
    return otherActiveMembers.length > 0 || tribe.members.length === 1;
  }
  
  // Regular members and admins can always leave
  return true;
};

/**
 * Checks if a user can view another user's profile
 * @param user The user object or null
 * @param profile The profile to check view permissions for
 * @returns True if the user can view the profile, false otherwise
 */
export const canViewProfile = (user: User | null, profile: Profile): boolean => {
  if (!isAuthenticated(user)) return false;
  
  // Users can always view their own profile
  if (user!.id === profile.userId) return true;
  
  // For now, all authenticated users can view other profiles
  // This could be extended with privacy settings in the future
  return true;
};

/**
 * Checks if a user can edit a profile
 * @param user The user object or null
 * @param profile The profile to check edit permissions for
 * @returns True if the user can edit the profile, false otherwise
 */
export const canEditProfile = (user: User | null, profile: Profile): boolean => {
  if (!isAuthenticated(user)) return false;
  
  // Users can only edit their own profile
  return user!.id === profile.userId;
};

/**
 * Checks if a user can attend a specific event
 * @param user The user object or null
 * @param event The event to check attendance permissions for
 * @param tribe The tribe the event belongs to
 * @returns True if the user can attend the event, false otherwise
 */
export const canAttendEvent = (user: User | null, event: Event, tribe: Tribe): boolean => {
  // Must be a tribe member to attend events
  if (!isTribeMember(user, tribe)) return false;
  
  // Can't attend if event is at max capacity
  if (event.attendeeCount >= event.maxAttendees) return false;
  
  return true;
};

/**
 * Checks if a user has completed the onboarding process
 * @param user The user object or null
 * @returns True if the user has completed onboarding, false otherwise
 */
export const hasCompletedOnboarding = (user: User | null): boolean => {
  if (!isAuthenticated(user)) return false;
  return user!.hasCompletedOnboarding;
};

/**
 * Checks if a user has completed their profile
 * @param user The user object or null
 * @returns True if the user has completed their profile, false otherwise
 */
export const hasCompletedProfile = (user: User | null): boolean => {
  if (!isAuthenticated(user)) return false;
  return user!.profileCompleted;
};

/**
 * Gets the role of a user in a specific tribe
 * @param user The user object or null
 * @param tribe The tribe to get the user's role for
 * @returns The user's role in the tribe, or null if not a member
 */
export const getUserRole = (user: User | null, tribe: Tribe): MemberRole | null => {
  if (!isAuthenticated(user)) return null;
  
  const membership = tribe.members.find(
    member => member.userId === user!.id && member.status === MemberStatus.ACTIVE
  );
  
  return membership ? membership.role : null;
};