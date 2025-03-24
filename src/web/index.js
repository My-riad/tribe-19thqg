import { AppRegistry } from 'react-native'; // react-native v0.72.3
import App from './src/index'; // Import the main App component from the application's entry point
import { name as appName } from './app.json'; // Import the application name from app.json configuration

// Import necessary modules and components
// Register the main App component with React Native's AppRegistry
AppRegistry.registerComponent(appName, () => App);

// Development-only console statements for debugging (removed in production)