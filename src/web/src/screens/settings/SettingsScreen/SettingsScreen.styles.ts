import styled from 'styled-components/native';
import { View, ScrollView, Text } from 'react-native';
import { theme, colors, spacing, typography, getResponsiveSpacing } from '../../../theme';

/**
 * Main container for the settings screen with full height and default background color
 */
const Container = styled(View)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

/**
 * Scrollable container for settings content with top padding
 */
const ScrollContainer = styled(ScrollView)`
  flex: 1;
  padding-top: ${theme.spacing.md}px;
`;

/**
 * Container for grouping related settings with card-like appearance and rounded corners
 */
const SectionContainer = styled(View)`
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.spacing.xs}px;
  margin-horizontal: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.md}px;
  overflow: hidden;
`;

/**
 * Section title text with appropriate spacing, color, and typography
 */
const SectionTitle = styled(Text)`
  padding-horizontal: ${theme.spacing.lg}px;
  padding-vertical: ${theme.spacing.sm}px;
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.sm}px;
  font-weight: ${theme.typography.fontWeight.medium};
  margin-top: ${theme.spacing.md}px;
`;

/**
 * Container for the logout button with centered alignment and responsive bottom margin
 */
const LogoutButtonContainer = styled(View)`
  padding-horizontal: ${theme.spacing.lg}px;
  padding-vertical: ${theme.spacing.lg}px;
  margin-bottom: ${getResponsiveSpacing(theme.spacing.xl)}px;
  align-items: center;
`;

export {
  Container,
  ScrollContainer,
  SectionContainer,
  SectionTitle,
  LogoutButtonContainer
};