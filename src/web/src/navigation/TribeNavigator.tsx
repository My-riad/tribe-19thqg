import React from 'react'; // react v18.0.0
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack'; // @react-navigation/stack v6.0.0
import { TribeStackParamList } from '../types/navigation.types';
import { ROUTES } from '../constants/navigationRoutes';
import TribeDetailScreen from '../screens/tribe/TribeDetailScreen';
import TribeChatScreen from '../screens/tribe/TribeChatScreen';
import MemberListScreen from '../screens/tribe/MemberListScreen';
import CreateTribeScreen from '../screens/tribe/CreateTribeScreen';
import { theme } from '../theme';

// Create a stack navigator for tribe-related screens
const Stack = createStackNavigator<TribeStackParamList>();

// Default screen options for the tribe stack navigator
const screenOptions = {
  headerShown: false,
  presentation: 'card',
  gestureEnabled: true,
  cardStyle: {
    backgroundColor: theme.colors.background.default,
  },
  ...TransitionPresets.SlideFromRightIOS,
};

/**
 * Stack navigator component for tribe-related screens
 */
const TribeNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {/* Define the TribeDetail screen with appropriate options */}
      <Stack.Screen
        name={ROUTES.TRIBE.TRIBE_DETAIL}
        component={TribeDetailScreen}
        options={{
          title: 'Tribe Details',
        }}
      />

      {/* Define the TribeChat screen with appropriate options */}
      <Stack.Screen
        name={ROUTES.TRIBE.TRIBE_CHAT}
        component={TribeChatScreen}
        options={{
          title: 'Tribe Chat',
        }}
      />

      {/* Define the MemberList screen with appropriate options */}
      <Stack.Screen
        name={ROUTES.TRIBE.MEMBER_LIST}
        component={MemberListScreen}
        options={{
          title: 'Members',
        }}
      />

      {/* Define the CreateTribe screen with appropriate options */}
      <Stack.Screen
        name={ROUTES.TRIBE.CREATE_TRIBE}
        component={CreateTribeScreen}
        options={{
          title: 'Create Tribe',
        }}
      />
    </Stack.Navigator>
  );
};

// Export the tribe stack navigator for use in the main navigation structure
export default TribeNavigator;