import React from 'react'; // React library for building user interfaces // ^18.2.0
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack'; // Create a stack navigator for the onboarding flow // ^6.0.0

import PersonalityAssessmentScreen from '../screens/onboarding/PersonalityAssessmentScreen'; // Personality assessment screen component for the onboarding flow
import InterestSelectionScreen from '../screens/onboarding/InterestSelectionScreen'; // Interest selection screen component for the onboarding flow
import LocationSetupScreen from '../screens/onboarding/LocationSetupScreen'; // Location setup screen component for the onboarding flow
import ProfileCreationScreen from '../screens/onboarding/ProfileCreationScreen'; // Profile creation screen component for the onboarding flow
import { ROUTES } from '../constants/navigationRoutes'; // Navigation route constants for consistent route naming
import { OnboardingStackParamList } from '../types/navigation.types'; // Type definition for onboarding stack parameters

// Create a Stack navigator for the onboarding flow
const Stack = createStackNavigator<OnboardingStackParamList>();

// Default screen options for the onboarding navigator
const screenOptions = {
  headerShown: false, // Hide header for all screens in the stack
  gestureEnabled: true, // Enable swipe gestures for back navigation
  cardOverlayEnabled: true, // Enable card overlay for modal transitions
  presentation: 'card', // Use card-style transitions
  animationEnabled: true, // Enable animations
  ...TransitionPresets.SlideFromRightIOS, // Use slide-from-right transition on iOS
};

/**
 * Component that defines the onboarding navigation stack
 * @returns Rendered onboarding navigator component
 */
const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {/* Add Stack.Screen for the PersonalityAssessment screen as the initial screen */}
      <Stack.Screen
        name={ROUTES.ONBOARDING.PERSONALITY_ASSESSMENT}
        component={PersonalityAssessmentScreen}
      />

      {/* Add Stack.Screen for the InterestSelection screen */}
      <Stack.Screen
        name={ROUTES.ONBOARDING.INTEREST_SELECTION}
        component={InterestSelectionScreen}
      />

      {/* Add Stack.Screen for the LocationSetup screen */}
      <Stack.Screen
        name={ROUTES.ONBOARDING.LOCATION_SETUP}
        component={LocationSetupScreen}
      />

      {/* Add Stack.Screen for the ProfileCreation screen */}
      <Stack.Screen
        name={ROUTES.ONBOARDING.PROFILE_CREATION}
        component={ProfileCreationScreen}
      />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;