import styled from 'styled-components/native';
import { SafeAreaView, View, Text, ScrollView } from 'react-native';
import { theme } from '../../../theme';
import { colors, typography, spacing, shadows } from '../../../theme';

// Main container for the screen with safe area insets and default background color
export const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Container for the screen header with appropriate padding
export const HeaderContainer = styled(View)`
  padding-horizontal: ${theme.spacing.lg}px;
  padding-top: ${theme.spacing.lg}px;
  padding-bottom: ${theme.spacing.md}px;
`;

// Text component for the screen title with heading typography
export const Title = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.h1}px;
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.xs}px;
`;

// Text component for the screen subtitle with secondary text color
export const Subtitle = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.regular};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.md}px;
`;

// Scrollable container for the main content area with horizontal padding
export const ContentContainer = styled(ScrollView)`
  flex: 1;
  padding-horizontal: ${theme.spacing.lg}px;
`;

// Container for the back button positioned at the top left of the screen
export const BackButtonContainer = styled(View)`
  position: absolute;
  top: ${theme.spacing.lg}px;
  left: ${theme.spacing.md}px;
  z-index: 1;
`;

// Container for the progress indicator with appropriate margins
export const ProgressContainer = styled(View)`
  margin-top: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.lg}px;
  padding-horizontal: ${theme.spacing.lg}px;
`;

// Text component for the progress percentage with right alignment and secondary color
export const ProgressText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  font-weight: ${theme.typography.fontWeight.regular};
  color: ${theme.colors.text.secondary};
  text-align: right;
  margin-top: ${theme.spacing.xs}px;
`;

// Container for error messages with error background color and rounded corners
export const ErrorContainer = styled(View)`
  margin-top: ${theme.spacing.md}px;
  padding: ${theme.spacing.md}px;
  background-color: ${theme.colors.error.light};
  border-radius: ${theme.spacing.xs}px;
`;

// Text component for error messages with error text color and centered alignment
export const ErrorText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.error.dark};
  text-align: center;
`;