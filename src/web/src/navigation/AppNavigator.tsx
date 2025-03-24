import React, { useEffect, useRef, lazy } from 'react'; // React library for building user interfaces // react ^18.2.0
import { StatusBar, useColorScheme } from 'react-native'; // React Native components and hooks for platform integration // 0.72+
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'; // Root navigation container and theme objects from React Navigation // ^6.0.0
import { createStackNavigator } from '@react-navigation/stack'; // Create stack navigators for the root and notification stacks // ^6.0.0

import AuthNavigator from './AuthNavigator'; // Authentication flow navigator component
import OnboardingNavigator from './OnboardingNavigator'; // Onboarding flow navigator component
import MainTabNavigator from './MainTabNavigator'; // Main application tab navigator component
import TribeNavigator from './TribeNavigator'; // Tribe-related screens navigator component
import EventNavigator from './EventNavigator'; // Event-related screens navigator component
import SettingsNavigator from './SettingsNavigator'; // Settings screens navigator component
import { NavigationService } from './NavigationService'; // Service for programmatic navigation throughout the app
import { ROUTES } from '../constants/navigationRoutes'; // Navigation route constants for consistent route naming
import { RootStackParamList, NotificationStackParamList } from '../types/navigation.types'; // Type definition for root navigation stack parameters
import { useAuth } from '../hooks/useAuth'; // Custom hook for authentication state and operations
import { useProfile } from '../hooks/useProfile'; // Custom hook for profile state and operations

// Stack navigator for the root navigation structure
const Stack = createStackNavigator<RootStackParamList>();

// Stack navigator for notification screens
const NotificationStack = createStackNavigator<NotificationStackParamList>();

// Default screen options for the root navigator
const screenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: 'transparent' },
  presentation: 'modal'
};

// Screen options for the notification screen
const notificationScreenOptions = {
  headerShown: true,
  headerTitle: 'Notifications',
  headerTitleAlign: 'center'
};

// Lazily loaded NotificationScreen component to avoid circular dependency
const LazyNotificationScreen = lazy(() => import('../screens/notifications/NotificationScreen'));

// Custom theme extending the default React Navigation theme
const customTheme = {
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent'
  }
};

// Custom dark theme extending the default React Navigation dark theme
const customDarkTheme = {
  dark: true,
  colors: {
    ...DarkTheme.colors,
    background: 'transparent'
  }
};

/**
 * Stack navigator for notification screens
 * @returns Rendered notification stack navigator
 */
const NotificationNavigator: React.FC = () => {
  return (
    <NotificationStack.Navigator screenOptions={notificationScreenOptions}>
      <NotificationStack.Screen
        name={ROUTES.NOTIFICATION.NOTIFICATION}
        component={LazyNotificationScreen}
      />
    </NotificationStack.Navigator>
  );
};

/**
 * Root navigation component that manages the entire navigation structure of the application
 * @returns Rendered navigation container with appropriate navigator based on auth state
 */
const AppNavigator: React.FC = () => {
  // Create a navigation reference using useRef
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Get the device color scheme using useColorScheme
  const colorScheme = useColorScheme();

  // Get authentication state using useAuth hook
  const { isAuthenticated } = useAuth();

  // Get profile state using useProfile hook
  const { profile } = useProfile();

  // Set up the navigation reference in NavigationService on mount
  useEffect(() => {
    NavigationService.setNavigationRef(navigationRef);
  }, []);

  // Determine which navigator to render based on authentication and onboarding status
  let initialRouteName = ROUTES.ROOT.AUTH;
  if (isAuthenticated) {
    initialRouteName = profile?.hasCompletedOnboarding ? ROUTES.ROOT.MAIN : ROUTES.ROOT.ONBOARDING;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={colorScheme === 'dark' ? customDarkTheme : customTheme}
      onReady={() => {
        // Configure StatusBar appearance based on theme
        StatusBar.setBarStyle(colorScheme === 'dark' ? 'light-content' : 'dark-content');
      }}
    >
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={screenOptions}
      >
        {/* Define the Auth navigator for authentication flow */}
        <Stack.Screen name={ROUTES.ROOT.AUTH} component={AuthNavigator} />

        {/* Define the Onboarding navigator for new user onboarding */}
        <Stack.Screen name={ROUTES.ROOT.ONBOARDING} component={OnboardingNavigator} />

        {/* Define the Main navigator for the main application flow */}
        <Stack.Screen name={ROUTES.ROOT.MAIN} component={MainTabNavigator} />

        {/* Define the Tribe navigator for tribe-related screens */}
        <Stack.Screen name="Tribe" component={TribeNavigator} />

        {/* Define the Event navigator for event-related screens */}
        <Stack.Screen name="Event" component={EventNavigator} />

        {/* Define the Settings navigator for settings-related screens */}
        <Stack.Screen name="Settings" component={SettingsNavigator} />

        {/* Define the Notification navigator for notification screens */}
        <Stack.Screen name="Notification" component={NotificationNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;