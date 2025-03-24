import PersonalityAssessmentScreen from './PersonalityAssessmentScreen'; // Import from ./PersonalityAssessmentScreen/index.ts
import InterestSelectionScreen from './InterestSelectionScreen'; // Import from ./InterestSelectionScreen/index.ts
import LocationSetupScreen from './LocationSetupScreen'; // Import from ./LocationSetupScreen/index.ts
import ProfileCreationScreen from './ProfileCreationScreen'; // Import from ./ProfileCreationScreen/index.ts

/**
 * @file
 * Export file for the onboarding screen components, providing a centralized module for accessing the screens used in the onboarding flow.
 * @requirements_addressed
 * Onboarding Flow: Technical Specifications/User Interface Design/7.4 INTERACTION PATTERNS/7.4.1 Navigation Flow Provides a centralized export of all screens in the user onboarding process, supporting the defined navigation flow
 * Personality-Based Matching & User Profiling: Technical Specifications/Product Requirements/Feature Catalog/2.1.2 Exports the screens that collect user personality traits, interests, and profile information for effective matchmaking
 * Mobile-first approach: Technical Specifications/1. INTRODUCTION/1.2 SYSTEM OVERVIEW/1.2.1 Project Context Supports the mobile-first approach by organizing screen components for the React Native application
 */

/**
 * Export the PersonalityAssessmentScreen component for use in the onboarding navigation stack
 * @component
 * @exports PersonalityAssessmentScreen
 */
export { PersonalityAssessmentScreen };

/**
 * Export the InterestSelectionScreen component for use in the onboarding navigation stack
 * @component
 * @exports InterestSelectionScreen
 */
export { InterestSelectionScreen };

/**
 * Export the LocationSetupScreen component for use in the onboarding navigation stack
 * @component
 * @exports LocationSetupScreen
 */
export { LocationSetupScreen };

/**
 * Export the ProfileCreationScreen component for use in the onboarding navigation stack
 * @component
 * @exports ProfileCreationScreen
 */
export { ProfileCreationScreen };