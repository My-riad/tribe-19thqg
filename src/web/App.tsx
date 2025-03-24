import React, { useEffect, useState } from 'react'; // React library for building user interfaces // react ^18.2.0
import { StatusBar, LogBox, Platform } from 'react-native'; // React Native components and utilities for platform integration // 0.72.3
import { Provider } from 'react-redux'; // react-redux ^8.1.1
import { PersistGate } from 'redux-persist/integration/react'; // redux-persist/integration/react ^6.0.0
import { ThemeProvider } from 'styled-components/native'; // styled-components/native ^6.0.1
import { SafeAreaProvider } from 'react-native-safe-area-context'; // react-native-safe-area-context ^4.6.3
import AppNavigator from './src/navigation/AppNavigator'; // Root navigation component that manages the app's navigation structure
import theme from './src/theme'; // Application theme containing colors, typography, spacing, and other design tokens
import { store, persistor } from './src/store/store'; // Configured Redux store for state management
import { notificationService } from './src/services/notificationService'; // Service for handling push notifications and in-app alerts
import { analyticsService } from './src/services/analyticsService'; // Service for tracking user interactions and app performance
import SplashScreen from 'react-native-splash-screen'; // Control the native splash screen // ^3.3.0

/**
 * Root component of the Tribe application
 * @returns Rendered application with all providers and navigation structure
 */
const App: React.FC = () => {
  // Initialize state for app loading status
  const [appIsReady, setAppIsReady] = useState(false);

  /**
   * Initializes all required services for the application
   * @returns Promise that resolves when all services are initialized
   */
  const initializeServices = async (): Promise<void> => {
    try {
      // Initialize notification service
      await notificationService.initialize();

      // Initialize analytics service
      await analyticsService.initialize();
    } catch (error) {
      // Handle any errors during initialization
      console.error('Failed to initialize services:', error);
    } finally {
      // Return a resolved promise when complete
      setAppIsReady(true);
    }
  };

  // Initialize services (notifications, analytics) on component mount
  useEffect(() => {
    initializeServices();
  }, []);

  // Hide splash screen once initialization is complete
  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hide();
    }
  }, [appIsReady]);

  // Ignore specific LogBox warnings for development
  useEffect(() => {
    LogBox.ignoreLogs(['EventEmitter.removeListener']);
  }, []);

  // Render the application with all required providers
  return (
    <Provider store={store}>
      {/* Wrap the app with Redux Provider for state management */}
      <PersistGate loading={null} persistor={persistor}>
        {/* Wrap with PersistGate to ensure persisted state is loaded before rendering */}
        <ThemeProvider theme={theme}>
          {/* Wrap with ThemeProvider to provide theme throughout the app */}
          <SafeAreaProvider>
            {/* Wrap with SafeAreaProvider for handling safe area insets */}
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            {/* Configure StatusBar appearance */}
            <AppNavigator />
            {/* Render AppNavigator as the root navigation component */}
          </SafeAreaProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;