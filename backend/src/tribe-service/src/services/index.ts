import { ActivityService } from './activity.service';
import { ChatService } from './chat.service';
import { MemberService } from './member.service';
import { TribeService } from './tribe.service';

/**
 * Export the ActivityService class for tribe activity operations
 */
export { ActivityService };

/**
 * Export the ChatService class for tribe chat operations
 */
export { ChatService };

/**
 * Export the MemberService class for tribe membership operations
 */
export { MemberService };

/**
 * Export the TribeService class for tribe operations
 */
export { TribeService };

/**
 * Default export of all service classes as a single object for convenient importing
 */
export default {
  ActivityService,
  ChatService,
  MemberService,
  TribeService,
};