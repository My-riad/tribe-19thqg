import styled from 'styled-components/native';
import { ScrollView, View, Text, Image, Platform } from 'react-native';
import { theme, colors, typography, spacing, isSmallDevice } from '../../../theme';

// Main container for the tribe detail screen with appropriate background color
const Container = styled(View)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Scrollable container for the tribe detail screen content with bottom padding
const ScrollContainer = styled(ScrollView).attrs({
  contentContainerStyle: {
    paddingBottom: theme.spacing.xl,
  },
  showsVerticalScrollIndicator: false,
})`
  flex: 1;
`;

// Container for the tribe header section with appropriate margin
const HeaderContainer = styled(View)`
  margin-bottom: ${theme.spacing.lg}px;
`;

// Styled image component for the tribe image with responsive height
const TribeImage = styled(Image)`
  width: 100%;
  height: ${isSmallDevice() ? 150 : 200}px;
  background-color: ${theme.colors.neutral[200]};
`;

// Container for tribe information with appropriate padding
const TribeInfo = styled(View)`
  padding-horizontal: ${theme.spacing.lg}px;
  padding-top: ${theme.spacing.md}px;
`;

// Styled text component for the tribe name with appropriate typography and color
const TribeName = styled(Text)`
  ${theme.typography.textStyles.h2};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.xs}px;
`;

// Styled text component for tribe metadata with appropriate typography and color
const TribeMeta = styled(Text)`
  ${theme.typography.textStyles.caption};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.md}px;
`;

// Styled text component for tribe description with appropriate typography and color
const TribeDescription = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.lg}px;
`;

// Styled text component for section titles with appropriate typography, color, and spacing
const SectionTitle = styled(Text)`
  ${theme.typography.textStyles.h3};
  color: ${theme.colors.text.primary};
  margin-horizontal: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.md}px;
  margin-top: ${theme.spacing.lg}px;
`;

// Container for action buttons with row layout and appropriate spacing
const ActionButtonsContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  padding-horizontal: ${theme.spacing.lg}px;
  margin-top: ${theme.spacing.lg}px;
  margin-bottom: ${Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.lg}px;
`;

export {
  Container,
  ScrollContainer,
  HeaderContainer,
  TribeImage,
  TribeInfo,
  TribeName,
  TribeMeta,
  TribeDescription,
  SectionTitle,
  ActionButtonsContainer,
};