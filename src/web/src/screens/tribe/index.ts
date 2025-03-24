// Import the CreateTribeScreen component for re-export
import CreateTribeScreen from './CreateTribeScreen';
// Import the MemberListScreen component for re-export
import MemberListScreen from './MemberListScreen';
// Import the TribeChatScreen component for re-export
import TribeChatScreen from './TribeChatScreen';
// Import the TribeDetailScreen component for re-export
import TribeDetailScreen from './TribeDetailScreen';

/**
 * @file src/web/src/screens/tribe/index.ts
 * @description Barrel file that exports all tribe-related screen components from a single entry point, simplifying imports throughout the application. This file aggregates and re-exports the CreateTribeScreen, MemberListScreen, TribeChatScreen, and TribeDetailScreen components.
 */

/**
 * @exports CreateTribeScreen
 * @type {React.ComponentType}
 * @description The CreateTribeScreen component, providing the UI for creating a new tribe.
 */
export { CreateTribeScreen };

/**
 * @exports MemberListScreen
 * @type {React.ComponentType}
 * @description The MemberListScreen component, providing the UI for displaying a list of tribe members.
 */
export { MemberListScreen };

/**
 * @exports TribeChatScreen
 * @type {React.ComponentType}
 * @description The TribeChatScreen component, providing the UI for tribe chat functionality.
 */
export { TribeChatScreen };

/**
 * @exports TribeDetailScreen
 * @type {React.ComponentType}
 * @description The TribeDetailScreen component, providing the UI for displaying detailed tribe information.
 */
export { TribeDetailScreen };