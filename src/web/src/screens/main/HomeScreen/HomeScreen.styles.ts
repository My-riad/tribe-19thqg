import styled from 'styled-components/native';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../theme';

// Main container for the Home screen with safe area insets and background color
export const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Scrollable container for the Home screen content with horizontal padding
export const ScrollContainer = styled(ScrollView)`
  flex: 1;
  padding-horizontal: ${theme.spacing.md}px;
`;

// Header section containing greeting and notification icon with appropriate spacing
export const Header = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.sm}px;
`;

// Styled text for user greeting with appropriate typography
export const GreetingText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.xl}px;
  font-weight: ${theme.typography.fontWeight.semiBold};
  color: ${theme.colors.text.primary};
`;

// Banner for important notifications with distinctive background color and rounded corners
export const NotificationBanner = styled(View)`
  background-color: ${theme.colors.primary.light};
  border-radius: ${theme.spacing.sm}px;
  padding: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.md}px;
  flex-direction: row;
  align-items: center;
`;

// Styled text for notification content with appropriate typography and color
export const NotificationText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  color: ${theme.colors.text.contrast};
  flex: 1;
  margin-left: ${theme.spacing.sm}px;
`;

// Styled component for section titles with uppercase text and appropriate spacing
export const SectionTitle = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.lg}px;
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin-top: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.sm}px;
  text-transform: uppercase;
`;

// Container for the list of user's tribes with bottom margin
export const TribeListContainer = styled(View)`
  margin-bottom: ${theme.spacing.md}px;
`;

// Container for suggested tribes section with bottom margin
export const SuggestedTribesContainer = styled(View)`
  margin-bottom: ${theme.spacing.md}px;
`;

// Container for upcoming events section with bottom margin
export const EventsContainer = styled(View)`
  margin-bottom: ${theme.spacing.xl}px;
`;

// Container for empty state when no tribes or events are available, centered content with padding
export const EmptyStateContainer = styled(View)`
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl}px;
  margin-vertical: ${theme.spacing.lg}px;
`;

// Styled text for empty state messages with centered alignment and secondary text color
export const EmptyStateText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  color: ${theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${theme.spacing.md}px;
`;

// Styled button for primary actions with appropriate colors, padding, and shadow
export const ActionButton = styled(TouchableOpacity)`
  background-color: ${theme.colors.primary.main};
  border-radius: ${theme.spacing.sm}px;
  padding-vertical: ${theme.spacing.sm}px;
  padding-horizontal: ${theme.spacing.lg}px;
  align-items: center;
  justify-content: center;
  margin-top: ${theme.spacing.sm}px;
  ${theme.shadows.sm}
`;

// Styled text for action buttons with appropriate typography and contrast color
export const ActionButtonText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.contrast};
`;

// Container for AI-generated prompts with distinctive styling including left border and subtle background
export const AIPromptContainer = styled(View)`
  background-color: ${theme.colors.background.subtle};
  border-radius: ${theme.spacing.sm}px;
  padding: ${theme.spacing.md}px;
  margin-vertical: ${theme.spacing.md}px;
  border-left-width: 3px;
  border-left-color: ${theme.colors.primary.main};
  ${theme.shadows.sm}
`;

// Container for loading state, centered in the screen with appropriate padding
export const LoadingContainer = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl}px;
`;