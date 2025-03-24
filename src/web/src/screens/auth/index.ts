// Import the LoginScreen component
import LoginScreen from './LoginScreen'; // Import the LoginScreen component for re-export

// Import the RegistrationScreen component
import RegistrationScreen from './RegistrationScreen';

// Import the WelcomeScreen component
import WelcomeScreen from './WelcomeScreen';

/**
 * Index file that exports all authentication-related screen components from the auth directory.
 * This file serves as a centralized entry point for importing authentication screens throughout the application,
 * simplifying imports by allowing consumers to import from a single location rather than from individual screen directories.
 */
export { LoginScreen, RegistrationScreen, WelcomeScreen };