import AppNavigator from './AppNavigator'; // Import the root navigation component
import AuthNavigator from './AuthNavigator'; // Import the authentication navigator component
import OnboardingNavigator from './OnboardingNavigator'; // Import the onboarding navigator component
import MainTabNavigator from './MainTabNavigator'; // Import the main tab navigator component
import TribeNavigator from './TribeNavigator'; // Import the tribe navigator component
import EventNavigator from './EventNavigator'; // Import the event navigator component
import SettingsNavigator from './SettingsNavigator'; // Import the settings navigator component
import { NavigationService } from './NavigationService'; // Import the navigation service for programmatic navigation

/**
 * Exports the root navigation component for use in the app entry point
 */
export { AppNavigator };

/**
 * Exports the authentication navigator for use in the root navigator
 */
export { AuthNavigator };

/**
 * Exports the onboarding navigator for use in the root navigator
 */
export { OnboardingNavigator };

/**
 * Exports the main tab navigator for use in the root navigator
 */
export { MainTabNavigator };

/**
 * Exports the tribe navigator for use in the root navigator
 */
export { TribeNavigator };

/**
 * Exports the event navigator for use in the root navigator
 */
export { EventNavigator };

/**
 * Exports the settings navigator for use in the root navigator
 */
export { SettingsNavigator };

/**
 * Exports the navigation service for programmatic navigation throughout the application
 */
export { NavigationService };