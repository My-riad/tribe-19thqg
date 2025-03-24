import React from 'react'; // React library for building user interfaces // react ^18.2.0
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack'; // @react-navigation/stack ^6.0.0
import WelcomeScreen from '../screens/auth/WelcomeScreen'; // Welcome screen component for the authentication flow
import LoginScreen from '../screens/auth/LoginScreen'; // Login screen component for user authentication
import RegistrationScreen from '../screens/auth/RegistrationScreen'; // Registration screen component for new user sign-up
import { ROUTES } from '../constants/navigationRoutes'; // Navigation route constants
import { AuthStackParamList } from '../types/navigation.types'; // Type definition for authentication stack parameters

/**
 * Stack navigator for the authentication flow
 */
const Stack = createStackNavigator<AuthStackParamList>();

/**
 * Default screen options for the authentication navigator
 */
const screenOptions = {
  headerShown: false,
  gestureEnabled: true,
  cardOverlayEnabled: true,
  presentation: 'card',
  animationEnabled: true,
  ...TransitionPresets.SlideFromRightIOS,
};

/**
 * Component that defines the authentication navigation stack
 * @returns Rendered authentication navigator component
 */
const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={screenOptions} initialRouteName={ROUTES.AUTH.WELCOME}>
      <Stack.Screen name={ROUTES.AUTH.WELCOME} component={WelcomeScreen} />
      <Stack.Screen name={ROUTES.AUTH.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.AUTH.REGISTRATION} component={RegistrationScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;