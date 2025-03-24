import { 
  NotificationType, 
  NotificationPriority, 
  INotificationCreate 
} from '../../../shared/src/types/notification.types';
import { InterestCategory } from '../../../shared/src/types/profile.types';

/**
 * Creates a notification for an AI-generated tribe match
 * 
 * @param userId - The ID of the user to notify
 * @param tribeId - The ID of the matched tribe
 * @param tribeName - The name of the matched tribe
 * @param compatibilityScore - The compatibility score (0-1)
 * @param tribeDescription - The description of the tribe
 * @param matchReasons - Array of reasons for the match with details
 * @param metadata - Additional metadata for UI rendering
 * @returns Notification creation payload
 */
export const createTribeMatchNotification = (
  userId: string,
  tribeId: string,
  tribeName: string,
  compatibilityScore: number,
  tribeDescription: string,
  matchReasons: Array<{ reason: string, detail: string }>,
  metadata: Record<string, any> = {}
): INotificationCreate => {
  const formattedScore = formatCompatibilityScore(compatibilityScore);
  
  return {
    userId,
    type: NotificationType.TRIBE_MATCH,
    title: `New Tribe Match: ${tribeName}`,
    body: `"${tribeDescription}"\n\n${formattedScore} compatibility match. ${matchReasons.length > 0 ? 'Here\'s why this tribe might be a good fit for you:' : ''}`,
    priority: NotificationPriority.HIGH,
    expiresAt: null,
    tribeId,
    eventId: null,
    actionUrl: `/tribes/${tribeId}?source=match_notification`,
    imageUrl: null,
    metadata: {
      compatibilityScore,
      formattedScore,
      matchReasons,
      tribeName,
      tribeDescription,
      ...metadata
    }
  };
};

/**
 * Creates a notification for a tribe invitation from another user
 * 
 * @param userId - The ID of the user to notify
 * @param tribeId - The ID of the tribe
 * @param tribeName - The name of the tribe
 * @param inviterName - The name of the user who sent the invitation
 * @param tribeDescription - The description of the tribe
 * @param metadata - Additional metadata for UI rendering
 * @returns Notification creation payload
 */
export const createTribeInvitationNotification = (
  userId: string,
  tribeId: string,
  tribeName: string,
  inviterName: string,
  tribeDescription: string,
  metadata: Record<string, any> = {}
): INotificationCreate => {
  return {
    userId,
    type: NotificationType.TRIBE_INVITATION,
    title: `${inviterName} invited you to join ${tribeName}`,
    body: `"${tribeDescription}"\n\nTap to view details and respond to this invitation.`,
    priority: NotificationPriority.HIGH,
    expiresAt: null,
    tribeId,
    eventId: null,
    actionUrl: `/tribes/${tribeId}?source=invitation&action=respond`,
    imageUrl: null,
    metadata: {
      inviterName,
      tribeName,
      tribeDescription,
      invitationType: 'direct_invitation',
      ...metadata
    }
  };
};

/**
 * Creates a notification for tribe creators when a user requests to join their tribe
 * 
 * @param userId - The ID of the tribe creator to notify
 * @param tribeId - The ID of the tribe
 * @param tribeName - The name of the tribe
 * @param requesterName - The name of the user requesting to join
 * @param metadata - Additional metadata for UI rendering
 * @returns Notification creation payload
 */
export const createTribeJoinRequestNotification = (
  userId: string,
  tribeId: string,
  tribeName: string,
  requesterName: string,
  metadata: Record<string, any> = {}
): INotificationCreate => {
  return {
    userId,
    type: NotificationType.TRIBE_INVITATION,
    title: `${requesterName} requested to join ${tribeName}`,
    body: `Review this request and approve or decline membership.`,
    priority: NotificationPriority.MEDIUM,
    expiresAt: null,
    tribeId,
    eventId: null,
    actionUrl: `/tribes/${tribeId}/members?action=review_request&requesterId=${metadata.requesterId || ''}`,
    imageUrl: null,
    metadata: {
      requesterName,
      tribeName,
      requestType: 'join_request',
      ...metadata
    }
  };
};

/**
 * Creates a notification when a user's request to join a tribe is approved
 * 
 * @param userId - The ID of the user to notify
 * @param tribeId - The ID of the tribe
 * @param tribeName - The name of the tribe
 * @param approverName - The name of the user who approved the request
 * @param metadata - Additional metadata for UI rendering
 * @returns Notification creation payload
 */
export const createTribeJoinApprovedNotification = (
  userId: string,
  tribeId: string,
  tribeName: string,
  approverName: string,
  metadata: Record<string, any> = {}
): INotificationCreate => {
  return {
    userId,
    type: NotificationType.TRIBE_INVITATION,
    title: `You've been approved to join ${tribeName}`,
    body: `${approverName} has approved your request to join. Welcome to the tribe!`,
    priority: NotificationPriority.HIGH,
    expiresAt: null,
    tribeId,
    eventId: null,
    actionUrl: `/tribes/${tribeId}?source=approval`,
    imageUrl: null,
    metadata: {
      approverName,
      tribeName,
      requestStatus: 'approved',
      ...metadata
    }
  };
};

/**
 * Creates a notification when a user's request to join a tribe is rejected
 * 
 * @param userId - The ID of the user to notify
 * @param tribeId - The ID of the tribe
 * @param tribeName - The name of the tribe
 * @param rejectionReason - Optional reason for rejection
 * @param metadata - Additional metadata for UI rendering
 * @returns Notification creation payload
 */
export const createTribeJoinRejectedNotification = (
  userId: string,
  tribeId: string,
  tribeName: string,
  rejectionReason: string = '',
  metadata: Record<string, any> = {}
): INotificationCreate => {
  let body = `Your request to join this tribe was not approved.`;
  if (rejectionReason) {
    body += ` Reason: ${rejectionReason}`;
  }
  body += ` You can explore other tribes that might be a better fit.`;

  return {
    userId,
    type: NotificationType.TRIBE_INVITATION,
    title: `Your request to join ${tribeName} was not approved`,
    body,
    priority: NotificationPriority.MEDIUM,
    expiresAt: null,
    tribeId,
    eventId: null,
    actionUrl: `/discover?source=find_alternative`,
    imageUrl: null,
    metadata: {
      tribeName,
      rejectionReason,
      requestStatus: 'rejected',
      ...metadata
    }
  };
};

/**
 * Helper function to format match reasons into a readable string
 * 
 * @param matchReasons - Array of match reasons with details
 * @returns Formatted match reasons string
 */
export const formatMatchReasons = (
  matchReasons: Array<{ reason: string, detail: string }>
): string => {
  // Take up to 3 reasons to avoid overly long messages
  const topReasons = matchReasons.slice(0, 3);
  
  if (topReasons.length === 0) {
    return '';
  }
  
  return topReasons
    .map(reason => `• ${reason.reason}: ${reason.detail}`)
    .join('\n');
};

/**
 * Helper function to format compatibility score as a percentage
 * 
 * @param score - Compatibility score (0-1)
 * @returns Formatted percentage string
 */
export const formatCompatibilityScore = (score: number): string => {
  const percentage = Math.round(score * 100);
  return `${percentage}%`;
};