import { NavigationProp, RouteProp } from '@react-navigation/native'; // v6.0.0
import { StackNavigationProp } from '@react-navigation/stack'; // v6.0.0
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'; // v6.0.0

/**
 * Parameter list for the root navigation stack
 */
export interface RootStackParamList {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
}

/**
 * Parameter list for the authentication navigation stack
 */
export interface AuthStackParamList {
  Welcome: undefined;
  Login: { email?: string };
  Registration: undefined;
}

/**
 * Parameter list for the onboarding navigation stack
 */
export interface OnboardingStackParamList {
  PersonalityAssessment: undefined;
  InterestSelection: undefined;
  LocationSetup: undefined;
  ProfileCreation: undefined;
}

/**
 * Parameter list for the main tab navigation
 */
export interface MainTabParamList {
  Home: undefined;
  Discover: undefined;
  Events: undefined;
  Chat: undefined;
  Profile: undefined;
}

/**
 * Parameter list for the tribe navigation stack
 */
export interface TribeStackParamList {
  TribeDetail: { tribeId: string };
  TribeChat: { tribeId: string };
  MemberList: { tribeId: string };
  CreateTribe: undefined;
}

/**
 * Parameter list for the event navigation stack
 */
export interface EventStackParamList {
  EventDetail: { eventId: string };
  EventPlanning: { tribeId: string; eventId?: string };
  EventSuggestion: { tribeId: string };
  EventCheckIn: { eventId: string };
}

/**
 * Parameter list for the settings navigation stack
 */
export interface SettingsStackParamList {
  Settings: undefined;
  AutoMatchingPreferences: undefined;
  NotificationSettings: undefined;
  PrivacySettings: undefined;
}

/**
 * Parameter list for the notification navigation stack
 */
export interface NotificationStackParamList {
  Notification: undefined;
}

/**
 * Navigation prop type for the root navigator
 */
export type RootNavigationProp = NavigationProp<RootStackParamList>;

/**
 * Navigation prop type for the auth navigator
 */
export type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;

/**
 * Navigation prop type for the onboarding navigator
 */
export type OnboardingNavigationProp = StackNavigationProp<OnboardingStackParamList>;

/**
 * Navigation prop type for the main tab navigator
 */
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

/**
 * Navigation prop type for the tribe navigator
 */
export type TribeNavigationProp = StackNavigationProp<TribeStackParamList>;

/**
 * Navigation prop type for the event navigator
 */
export type EventNavigationProp = StackNavigationProp<EventStackParamList>;

/**
 * Navigation prop type for the settings navigator
 */
export type SettingsNavigationProp = StackNavigationProp<SettingsStackParamList>;

/**
 * Navigation prop type for the notification navigator
 */
export type NotificationNavigationProp = StackNavigationProp<NotificationStackParamList>;