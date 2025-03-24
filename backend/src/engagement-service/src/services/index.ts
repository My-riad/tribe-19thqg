import { ChallengeService } from './challenge.service';
import { EngagementService } from './engagement.service';
import { default as promptService } from './prompt.service';

/**
 * Exports all service classes from the engagement service module.
 * This file serves as a central export point for the ChallengeService,
 * EngagementService, and PromptService, making them available to
 * controllers and other modules in the application.
 */

export { ChallengeService }; // Export the challenge service for use in controllers and other modules
export { EngagementService }; // Export the engagement service for use in controllers and other modules
export { promptService }; // Export the prompt service singleton for use in controllers and other modules

export default new EngagementService(); // Default export of the engagement service for simplified imports