import React from 'react'; // react ^18.0.0
import { createStackNavigator } from '@react-navigation/stack'; // @react-navigation/stack ^6.0.0

import { ROUTES } from '../constants/navigationRoutes'; // Import navigation route constants for the settings navigator
import { SettingsStackParamList } from '../types/navigation.types'; // Import type definitions for the settings navigator
import SettingsScreen from '../screens/settings/SettingsScreen'; // Import the main Settings screen component
import AutoMatchingPreferencesScreen from '../screens/settings/AutoMatchingPreferencesScreen'; // Import the AutoMatchingPreferences screen component
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen'; // Import the NotificationSettings screen component
import PrivacySettingsScreen from '../screens/settings/PrivacySettingsScreen'; // Import the PrivacySettings screen component
import { theme } from '../theme'; // Import theme variables for consistent styling

// Stack navigator for the settings navigation structure
const Stack = createStackNavigator<SettingsStackParamList>();

// Default screen options for the settings navigator
const screenOptions = {
  headerStyle: {
    backgroundColor: theme.colors.background.default,
    elevation: 0, // remove shadow on Android
    shadowOpacity: 0, // remove shadow on iOS
  },
  headerTintColor: theme.colors.text.primary,
  headerTitleStyle: {
    fontWeight: '600',
  },
  cardStyle: {
    backgroundColor: theme.colors.background.default,
  },
};

/**
 * Stack navigator component for settings screens
 * @returns Rendered settings navigator component
 */
const SettingsNavigator: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName={ROUTES.SETTINGS.SETTINGS} screenOptions={screenOptions}>
      {/* Define the Settings screen as the initial route */}
      <Stack.Screen
        name={ROUTES.SETTINGS.SETTINGS}
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      {/* Define routes for AutoMatchingPreferences, NotificationSettings, and PrivacySettings screens */}
      <Stack.Screen
        name={ROUTES.SETTINGS.AUTO_MATCHING_PREFERENCES}
        component={AutoMatchingPreferencesScreen}
        options={{ title: 'Auto-Matching Preferences' }}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS.NOTIFICATION_SETTINGS}
        component={NotificationSettingsScreen}
        options={{ title: 'Notification Settings' }}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS.PRIVACY_SETTINGS}
        component={PrivacySettingsScreen}
        options={{ title: 'Privacy Settings' }}
      />
    </Stack.Navigator>
  );
};

export default SettingsNavigator;