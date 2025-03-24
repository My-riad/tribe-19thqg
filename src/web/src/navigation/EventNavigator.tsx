import React from 'react'; // react ^18.2.0
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack'; // @react-navigation/stack ^6.0.0
import { EventStackParamList } from '../types/navigation.types'; // Import type definition for the event stack navigator parameter list
import EventDetailScreen from '../screens/event/EventDetailScreen/EventDetailScreen.tsx'; // Import the EventDetailScreen component
import EventPlanningScreen from '../screens/event/EventPlanningScreen/EventPlanningScreen.tsx'; // Import the EventPlanningScreen component
import EventSuggestionScreen from '../screens/event/EventSuggestionScreen/EventSuggestionScreen.tsx'; // Import the EventSuggestionScreen component
import EventCheckInScreen from '../screens/event/EventCheckInScreen/EventCheckInScreen.tsx'; // Import the EventCheckInScreen component
import { ROUTES } from '../constants/navigationRoutes'; // Import navigation route constants for the event navigator
import { theme } from '../theme'; // Import theme for consistent styling of the navigator

// Create a stack navigator using createStackNavigator with EventStackParamList type
const Stack = createStackNavigator<EventStackParamList>();

// Default screen options for the event navigator
const screenOptions = {
  headerShown: true,
  headerTitleAlign: 'center',
  headerTintColor: theme.colors.primary.main,
  headerStyle: {
    backgroundColor: theme.colors.background.default,
    elevation: 0, // remove shadow on Android
    shadowOpacity: 0, // remove shadow on iOS
  },
  cardStyle: {
    backgroundColor: theme.colors.background.default,
  },
  presentation: 'card',
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  ...TransitionPresets.SlideFromRightIOS,
};

/**
 * Creates and configures the event stack navigator
 * @returns Rendered EventNavigator component
 */
const EventNavigator = (): JSX.Element => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.EVENT.EVENT_DETAIL}
      screenOptions={screenOptions}
    >
      <Stack.Screen
        name={ROUTES.EVENT.EVENT_DETAIL}
        component={EventDetailScreen}
        options={{ title: 'Event Details' }}
      />
      <Stack.Screen
        name={ROUTES.EVENT.EVENT_PLANNING}
        component={EventPlanningScreen}
        options={{ title: 'Plan an Event' }}
      />
      <Stack.Screen
        name={ROUTES.EVENT.EVENT_SUGGESTION}
        component={EventSuggestionScreen}
        options={{ title: 'Event Suggestions' }}
      />
      <Stack.Screen
        name={ROUTES.EVENT.EVENT_CHECK_IN}
        component={EventCheckInScreen}
        options={{ title: 'Check In' }}
      />
    </Stack.Navigator>
  );
};

export default EventNavigator;