import styled from 'styled-components/native';
import { View, Text, FlatList, SafeAreaView, Platform } from 'react-native';
import { theme, isSmallDevice, getResponsiveSpacing } from '../../../theme';
import { colors, spacing, typography, shadows } from '../../../theme';

/**
 * Returns platform-specific styles for the event suggestion screen
 * to match native look and feel
 */
const getPlatformSpecificStyles = () => {
  if (Platform.OS === 'ios') {
    return `
      border-radius: 8px;
      shadow-color: ${theme.colors.neutral[900]};
      shadow-offset: 0px 2px;
      shadow-opacity: 0.2;
      shadow-radius: 4px;
    `;
  } else {
    return `
      border-radius: 4px;
      elevation: 4;
    `;
  }
};

// Main container for the event suggestion screen
export const EventSuggestionScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Styled FlatList for displaying event suggestions
export const SuggestionList = styled(FlatList)`
  flex: 1;
  padding-horizontal: ${props => getResponsiveSpacing(theme.spacing.medium)}px;
`;

// Header container for the suggestion screen
export const SuggestionHeader = styled(View)`
  padding-horizontal: ${theme.spacing.medium}px;
  padding-vertical: ${theme.spacing.medium}px;
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border.light};
  background-color: ${theme.colors.background.paper};
`;

// Title text for the suggestion screen
export const SuggestionTitle = styled(Text)`
  ${theme.typography.textStyles.h2};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.small}px;
`;

// Description text for the suggestion screen
export const SuggestionDescription = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.secondary};
`;

// Container for empty state when no suggestions available
export const EmptyStateContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.large}px;
`;

// Text for empty state message
export const EmptyStateText = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.secondary};
  text-align: center;
  margin-top: ${theme.spacing.medium}px;
`;

// Container for loading indicator
export const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

// Container for the detailed view of a selected suggestion
export const DetailViewContainer = styled(View)`
  flex: 1;
  padding: ${theme.spacing.medium}px;
  background-color: ${theme.colors.background.paper};
  ${getPlatformSpecificStyles()};
`;

// Header for the detailed suggestion view
export const DetailHeader = styled(View)`
  margin-bottom: ${theme.spacing.medium}px;
`;

// Content container for the detailed suggestion view
export const DetailContent = styled(View)`
  flex: 1;
  margin-bottom: ${theme.spacing.medium}px;
`;

// Styled component for displaying compatibility score
export const CompatibilityScore = styled(Text)`
  ${theme.typography.textStyles.h3};
  color: ${theme.colors.primary.main};
  margin-bottom: ${theme.spacing.small}px;
`;

// Styled component for displaying AI recommendation reasons
export const RecommendationReason = styled(View)`
  background-color: ${theme.colors.background.subtle};
  padding: ${theme.spacing.small}px;
  border-radius: 8px;
  margin-bottom: ${theme.spacing.small}px;
`;

// Container for action buttons like Create Event and Back
export const ActionButtonsContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${theme.spacing.medium}px;
`;

// Horizontal divider between content sections
export const SeparatorLine = styled(View)`
  height: 1px;
  background-color: ${theme.colors.border.light};
  margin-vertical: ${theme.spacing.medium}px;
`;