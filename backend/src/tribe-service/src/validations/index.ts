/**
 * index.ts
 * 
 * Centralizes and exports all validation schemas and functions for the Tribe service.
 * This module serves as a single entry point for accessing all validation-related functionality,
 * organizing validation utilities by their domain area (activity, chat, member, tribe).
 */

// Import validation modules using namespace imports to organize by domain
import * as activityValidation from './activity.validation';
import * as chatValidation from './chat.validation';
import * as memberValidation from './member.validation';
import * as tribeValidation from './tribe.validation';

// Export all validation modules as namespaces
// This maintains the domain organization while providing a centralized export point
export {
  activityValidation,
  chatValidation,
  memberValidation,
  tribeValidation
};

// Usage example:
// import { tribeValidation, memberValidation } from '../validations';
// const validatedTribeData = tribeValidation.validateCreateTribe(tribeData);
// const validatedMembershipData = memberValidation.validateCreateMembership(membershipData);