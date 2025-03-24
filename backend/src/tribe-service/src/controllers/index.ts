import { router as tribeRouter } from './tribe.controller'; // Import the tribe controller router for tribe-related endpoints
import * as memberController from './member.controller'; // Import all member controller functions for tribe membership operations
import { router as chatRouter } from './chat.controller'; // Import the chat controller router for tribe chat functionality
import activityRouter from './activity.controller'; // Import the activity controller router for tribe activity tracking

/**
 * Export the tribe controller router for tribe-related endpoints
 */
export { tribeRouter };

/**
 * Export all member controller functions for tribe membership operations
 */
export { memberController };

/**
 * Export the chat controller router for tribe chat functionality
 */
export { chatRouter };

/**
 * Export the activity controller router for tribe activity tracking
 */
export { activityRouter };