import React, { useCallback } from 'react'; // react v18.0.0
import { StyleSheet, View, Platform } from 'react-native'; // react-native 0.72+
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // @react-navigation/bottom-tabs v6.0.0
import { ParamListBase, RouteProp, useNavigation, useRoute } from '@react-navigation/native'; // @react-navigation/native v6.0.0

import { ROUTES } from '../constants/navigationRoutes';
import { MainTabParamList } from '../types/navigation.types';
import HomeScreen from '../screens/main/HomeScreen';
import DiscoverScreen from '../screens/main/DiscoverScreen';
import EventsScreen from '../screens/main/EventsScreen';
import ChatScreen from '../screens/main/ChatScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import TabBar from '../components/ui/TabBar';
import { theme } from '../theme';
import {
  HomeIcon,
  DiscoverIcon,
  EventsIcon,
  ChatIcon,
  ProfileIcon,
} from '../assets/icons';
import { NavigationService } from './NavigationService';

// Create a bottom tab navigator instance
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Helper function to get the appropriate icon component for a tab based on its route name
 * @param routeName The name of the route
 * @param focused Whether the tab is focused
 * @returns The icon component with appropriate styling based on focus state
 */
const getTabBarIcon = (routeName: string, focused: boolean) => {
  let iconComponent;

  // Determine which icon to use based on the route name
  switch (routeName) {
    case ROUTES.MAIN.HOME:
      iconComponent = <HomeIcon width={24} height={24} color={focused ? theme.colors.primary.main : theme.colors.text.secondary} />;
      break;
    case ROUTES.MAIN.DISCOVER:
      iconComponent = <DiscoverIcon width={24} height={24} color={focused ? theme.colors.primary.main : theme.colors.text.secondary} />;
      break;
    case ROUTES.MAIN.EVENTS:
      iconComponent = <EventsIcon width={24} height={24} color={focused ? theme.colors.primary.main : theme.colors.text.secondary} />;
      break;
    case ROUTES.MAIN.CHAT:
      iconComponent = <ChatIcon width={24} height={24} color={focused ? theme.colors.primary.main : theme.colors.text.secondary} />;
      break;
    case ROUTES.MAIN.PROFILE:
      iconComponent = <ProfileIcon width={24} height={24} color={focused ? theme.colors.primary.main : theme.colors.text.secondary} />;
      break;
    default:
      return null;
  }

  return iconComponent;
};

/**
 * Custom tab bar component that wraps the TabBar UI component with navigation functionality
 * @param props Tab navigator props
 * @returns The rendered custom tab bar component
 */
const CustomTabBar = (props: any) => {
  // Extract state and descriptors from tab navigator props
  const { state, descriptors, navigation } = props;

  // Create tab items array with icons, labels, and badge counts
  const tabItems = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
        ? options.title
        : route.name;

    const icon = getTabBarIcon(route.name, index === state.index);

    return {
      key: route.key,
      icon: icon,
      label: typeof label === 'string' ? label : '',
      badgeCount: 0, // Replace with actual badge count if needed
    };
  });

  // Handle tab press events by navigating to the selected tab
  const handleTabPress = (index: number) => {
    const route = state.routes[index];
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  // Render the TabBar component with the configured props
  return (
    <TabBar
      tabs={tabItems}
      activeIndex={state.index}
      onTabPress={handleTabPress}
      variant="bottom"
      showLabels={true}
      showIndicator={true}
    />
  );
};

/**
 * Main tab navigator component that provides navigation between the primary screens of the application
 * @returns The rendered tab navigator component
 */
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName={ROUTES.MAIN.HOME}
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name={ROUTES.MAIN.HOME}
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.DISCOVER}
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.EVENTS}
        component={EventsScreen}
        options={{
          tabBarLabel: 'Events',
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.CHAT}
        component={ChatScreen}
        options={{
          tabBarLabel: 'Chat',
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.PROFILE}
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;