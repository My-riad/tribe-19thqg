import styled from 'styled-components/native';
import { View, Text, ScrollView, SafeAreaView, Platform } from 'react-native';
import { theme, isSmallDevice, getResponsiveSpacing } from '../../../theme';

/**
 * Returns platform-specific styles for the event detail screen to match native look and feel
 * @param props Component props
 * @returns Platform-specific style adjustments
 */
const getPlatformSpecificStyles = (props) => {
  if (Platform.OS === 'ios') {
    return `
      shadow-opacity: 0.1;
      shadow-radius: 5px;
      shadow-color: ${theme.colors.neutral[900]};
      shadow-offset: 0px 2px;
    `;
  } else if (Platform.OS === 'android') {
    return `
      elevation: 3;
    `;
  }
  return '';
};

/**
 * Main container for the event detail screen with safe area insets
 */
export const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

/**
 * Scrollable container for the event detail content
 */
export const ScrollContainer = styled(ScrollView)`
  flex: 1;
`;

/**
 * Container for the screen header with title and back button
 */
export const HeaderContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-horizontal: ${theme.spacing.medium}px;
  padding-vertical: ${theme.spacing.small}px;
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border.light};
`;

/**
 * Styled text component for the screen title
 */
export const HeaderTitle = styled(Text)`
  ${theme.typography.textStyles.h3};
  color: ${theme.colors.text.primary};
  flex: 1;
  text-align: center;
`;

/**
 * Styled button for navigating back from the event detail screen
 */
export const BackButton = styled(View)`
  padding: ${theme.spacing.small}px;
`;

/**
 * Container for the main content of the event detail screen
 */
export const ContentContainer = styled(View)`
  flex: 1;
  padding: ${props => getResponsiveSpacing(theme.spacing.medium)}px;
`;

/**
 * Container for individual content sections
 */
export const SectionContainer = styled(View)`
  margin-bottom: ${theme.spacing.large}px;
`;

/**
 * Styled text component for section titles
 */
export const SectionTitle = styled(Text)`
  ${theme.typography.textStyles.h3};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.small}px;
`;

/**
 * Horizontal divider between content sections
 */
export const Divider = styled(View)`
  height: 1px;
  background-color: ${theme.colors.border.light};
  margin-vertical: ${theme.spacing.medium}px;
`;

/**
 * Container for loading indicator
 */
export const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

/**
 * Container for error messages
 */
export const ErrorContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.large}px;
`;

/**
 * Styled text for error messages
 */
export const ErrorText = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.error.main};
  text-align: center;
  margin-top: ${theme.spacing.medium}px;
`;

/**
 * Container for action buttons like Get Directions and Chat
 */
export const ActionButtonsContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${theme.spacing.medium}px;
  margin-bottom: ${theme.spacing.large}px;
`;

/**
 * Container for RSVP buttons
 */
export const RSVPContainer = styled(View)`
  margin-top: ${theme.spacing.medium}px;
  margin-bottom: ${theme.spacing.medium}px;
  align-items: center;
`;

/**
 * Container for weather information widget
 */
export const WeatherContainer = styled(View)`
  margin-bottom: ${theme.spacing.medium}px;
  padding: ${theme.spacing.small}px;
  background-color: ${theme.colors.background.subtle};
  border-radius: ${theme.borderRadius.small}px;
  ${getPlatformSpecificStyles()};
`;

/**
 * Container for the attendees list
 */
export const AttendeesContainer = styled(View)`
  margin-bottom: ${theme.spacing.large}px;
`;