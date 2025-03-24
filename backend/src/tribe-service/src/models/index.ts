/**
 * Barrel file for tribe service models
 * 
 * This file aggregates and re-exports all model classes from the tribe service
 * to provide a centralized access point for tribe-related data models.
 */

// Import model classes
import { ActivityModel } from './activity.model';
import { ChatModel } from './chat.model';
import { MemberModel } from './member.model';
import { TribeModel } from './tribe.model';

// Named exports for individual model classes
export { ActivityModel } from './activity.model';
export { ChatModel } from './chat.model';
export { MemberModel } from './member.model';
export { TribeModel } from './tribe.model';

// Default export of all model classes as a single object
export default {
  ActivityModel,
  ChatModel,
  MemberModel,
  TribeModel
};