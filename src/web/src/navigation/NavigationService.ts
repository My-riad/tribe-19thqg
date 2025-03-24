import { 
  createNavigationContainerRef, 
  NavigationContainerRef, 
  CommonActions, 
  StackActions 
} from '@react-navigation/native'; // v6.0.0

import { ROUTES } from '../constants/navigationRoutes';
import { 
  RootStackParamList, 
  AuthStackParamList, 
  OnboardingStackParamList, 
  MainTabParamList, 
  TribeStackParamList, 
  EventStackParamList, 
  SettingsStackParamList, 
  NotificationStackParamList 
} from '../types/navigation.types';
import React from 'react';

// Create a navigation reference that can be used outside of React components
const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Sets the navigation reference to be used by the service
 * 
 * This function is provided as an alternative to the standard pattern
 * where navigationRef is passed directly to NavigationContainer.
 * 
 * It's useful in scenarios where:
 * 1. The NavigationContainer is created in a different part of the app
 * 2. You need to use a navigation ref from a component for testing
 * 3. You need to dynamically change the navigation reference
 * 
 * @param ref React reference to the navigation container
 */
const setNavigationRef = (ref: React.RefObject<NavigationContainerRef<RootStackParamList>>) => {
  if (ref && ref.current) {
    // Check if the provided reference is valid and has a current value
    // Then assign it to our navigationRef for use by the service
    // @ts-ignore - we're manually transferring the ref which isn't type-safe
    navigationRef.current = ref.current;
  }
};

/**
 * Generic navigation function to navigate to any screen in the application
 * @param routeName The name of the route to navigate to
 * @param params Optional parameters to pass to the route
 */
const navigate = (routeName: string, params?: object) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(routeName as never, params as never);
  } else {
    // Could add a queue mechanism here to handle navigation attempts before the ref is ready
    console.warn('Navigation attempted before navigation reference was ready');
  }
};

/**
 * Navigate to the authentication stack with optional screen and parameters
 * @param screenName The specific screen within the Auth stack to navigate to
 * @param params Optional parameters to pass to the screen
 */
const navigateToAuth = (screenName?: keyof AuthStackParamList, params?: object) => {
  if (navigationRef.isReady()) {
    // First navigate to the Auth stack
    navigationRef.navigate(ROUTES.ROOT.AUTH as never);
    
    // Then navigate to the specific screen if provided
    if (screenName) {
      navigationRef.navigate(screenName as never, params as never);
    }
  }
};

/**
 * Navigate to the onboarding stack with optional screen and parameters
 * @param screenName The specific screen within the Onboarding stack to navigate to
 * @param params Optional parameters to pass to the screen
 */
const navigateToOnboarding = (screenName?: keyof OnboardingStackParamList, params?: object) => {
  if (navigationRef.isReady()) {
    // First navigate to the Onboarding stack
    navigationRef.navigate(ROUTES.ROOT.ONBOARDING as never);
    
    // Then navigate to the specific screen if provided
    if (screenName) {
      navigationRef.navigate(screenName as never, params as never);
    }
  }
};

/**
 * Navigate to the main tab navigator with optional tab and parameters
 * @param tabName The specific tab within the Main navigator to navigate to
 * @param params Optional parameters to pass to the tab
 */
const navigateToMain = (tabName?: keyof MainTabParamList, params?: object) => {
  if (navigationRef.isReady()) {
    // First navigate to the Main navigator
    navigationRef.navigate(ROUTES.ROOT.MAIN as never);
    
    // Then navigate to the specific tab if provided
    if (tabName) {
      navigationRef.navigate(tabName as never, params as never);
    }
  }
};

/**
 * Navigate to the tribe stack with required screen and parameters
 * @param screenName The specific screen within the Tribe stack to navigate to
 * @param params Required parameters to pass to the screen (like tribeId)
 */
const navigateToTribe = (screenName: keyof TribeStackParamList, params: object) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(screenName as never, params as never);
  }
};

/**
 * Navigate to the event stack with required screen and parameters
 * @param screenName The specific screen within the Event stack to navigate to
 * @param params Required parameters to pass to the screen (like eventId)
 */
const navigateToEvent = (screenName: keyof EventStackParamList, params: object) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(screenName as never, params as never);
  }
};

/**
 * Navigate to the settings stack with optional screen and parameters
 * @param screenName The specific screen within the Settings stack to navigate to
 * @param params Optional parameters to pass to the screen
 */
const navigateToSettings = (screenName: keyof SettingsStackParamList, params?: object) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(screenName as never, params as never);
  }
};

/**
 * Navigate to the notification screen with optional parameters
 * @param params Optional parameters to pass to the screen
 */
const navigateToNotification = (params?: object) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(ROUTES.NOTIFICATION.NOTIFICATION as never, params as never);
  }
};

/**
 * Navigate back to the previous screen
 */
const goBack = () => {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
};

/**
 * Reset the navigation state to a new state
 * @param state The new navigation state
 */
const reset = (state: object) => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset(state)
    );
  }
};

/**
 * Replace the current screen with a new one
 * @param routeName The name of the route to replace with
 * @param params Optional parameters to pass to the route
 */
const replace = (routeName: string, params?: object) => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      StackActions.replace(routeName, params)
    );
  }
};

/**
 * Push a new screen onto the stack
 * @param routeName The name of the route to push
 * @param params Optional parameters to pass to the route
 */
const push = (routeName: string, params?: object) => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      StackActions.push(routeName, params)
    );
  }
};

/**
 * Pop back to the first screen in the stack
 */
const popToTop = () => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      StackActions.popToTop()
    );
  }
};

/**
 * Get the currently active route information
 * @returns The current route object or undefined if not available
 */
const getCurrentRoute = () => {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute();
  }
  return undefined;
};

export const NavigationService = {
  setNavigationRef,
  navigate,
  navigateToAuth,
  navigateToOnboarding,
  navigateToMain,
  navigateToTribe,
  navigateToEvent,
  navigateToSettings,
  navigateToNotification,
  goBack,
  reset,
  replace,
  push,
  popToTop,
  getCurrentRoute
};