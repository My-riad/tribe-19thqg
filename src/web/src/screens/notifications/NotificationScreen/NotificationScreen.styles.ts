import styled from 'styled-components/native';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../theme';

// Main container for the notification screen with safe area insets and background color
const NotificationScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Container for the screen header with title and actions, with bottom border
const HeaderContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-horizontal: ${theme.spacing.md}px;
  padding-vertical: ${theme.spacing.md}px;
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border.light};
`;

// Styled text for the screen title with appropriate typography
const HeaderTitle = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.xl}px;
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
`;

// Styled button for marking all notifications as read with appropriate padding
const MarkAllButton = styled(TouchableOpacity)`
  padding-vertical: ${theme.spacing.xs}px;
  padding-horizontal: ${theme.spacing.sm}px;
`;

// Styled text for the mark all button with primary color
const MarkAllButtonText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.primary.main};
`;

// Styled FlatList component for rendering the list of notifications with horizontal padding
const NotificationList = styled(FlatList)`
  flex: 1;
  padding-horizontal: ${theme.spacing.md}px;
`;

// Styled component for date section headers in the notification list with appropriate spacing and typography
const NotificationHeader = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.semiBold};
  color: ${theme.colors.text.secondary};
  margin-top: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.sm}px;
  padding-horizontal: ${theme.spacing.xs}px;
`;

// Container for individual notification items with card-like styling and subtle shadow
const NotificationItemContainer = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding-vertical: ${theme.spacing.md}px;
  padding-horizontal: ${theme.spacing.sm}px;
  margin-bottom: ${theme.spacing.sm}px;
  background-color: ${theme.colors.background.card};
  border-radius: ${theme.spacing.sm}px;
  ${theme.shadows.xs}
`;

// Container for notification content (icon, title, message) with row layout
const NotificationContent = styled(View)`
  flex: 1;
  flex-direction: row;
  align-items: center;
`;

// Container for notification type icon with circular background
const NotificationIconContainer = styled(View)`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${theme.colors.background.subtle};
  align-items: center;
  justify-content: center;
  margin-right: ${theme.spacing.sm}px;
`;

// Styled text for notification title with appropriate typography
const NotificationTitle = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.semiBold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.xs}px;
`;

// Styled text for notification message with secondary color and ability to shrink
const NotificationMessage = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  color: ${theme.colors.text.secondary};
  flex-shrink: 1;
`;

// Styled text for notification timestamp with tertiary color and small font size
const NotificationTime = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.xs}px;
  color: ${theme.colors.text.tertiary};
  margin-top: ${theme.spacing.xs}px;
`;

// Styled component for indicating unread notifications with a small colored dot
const UnreadIndicator = styled(View)`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${theme.colors.primary.main};
  margin-right: ${theme.spacing.sm}px;
`;

// Container for empty state when no notifications exist, centered in the screen
const EmptyStateContainer = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl}px;
`;

// Styled text for empty state message with centered alignment and secondary color
const EmptyStateText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  color: ${theme.colors.text.secondary};
  text-align: center;
  margin-top: ${theme.spacing.md}px;
`;

// Container for swipeable delete action with error color background
const DeleteActionContainer = styled(TouchableOpacity)`
  background-color: ${theme.colors.error.main};
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 100%;
  border-top-right-radius: ${theme.spacing.sm}px;
  border-bottom-right-radius: ${theme.spacing.sm}px;
`;

// Styled text for delete action with contrast color for visibility
const DeleteActionText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.contrast};
`;

export {
  NotificationScreenContainer,
  HeaderContainer,
  HeaderTitle,
  MarkAllButton,
  MarkAllButtonText,
  NotificationList,
  NotificationHeader,
  NotificationItemContainer,
  NotificationContent,
  NotificationIconContainer,
  NotificationTitle,
  NotificationMessage,
  NotificationTime,
  UnreadIndicator,
  EmptyStateContainer,
  EmptyStateText,
  DeleteActionContainer,
  DeleteActionText
};