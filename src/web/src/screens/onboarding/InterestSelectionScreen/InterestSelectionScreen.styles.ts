import styled from 'styled-components/native';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { theme } from '../../../theme';

/**
 * Main container for the interest selection screen with safe area insets
 * and default background color
 */
export const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

/**
 * Container for the main content with appropriate padding
 */
export const ContentContainer = styled(View)`
  flex: 1;
  padding: ${theme.spacing.lg}px;
`;

/**
 * Header container with row layout for back button and title
 */
export const Header = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Main title for the interest selection screen using h1 text style
 */
export const Title = styled(Text)`
  ${theme.typography.textStyles.h1};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.sm}px;
`;

/**
 * Description text explaining the interest selection process and requirements
 */
export const Description = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.lg}px;
`;

/**
 * Wrapper for the interest selection component with appropriate margins
 */
export const InterestsWrapper = styled(View)`
  flex: 1;
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Container for the progress bar with vertical margins
 */
export const ProgressContainer = styled(View)`
  margin-vertical: ${theme.spacing.lg}px;
`;

/**
 * Container for the continue button with appropriate vertical margins
 */
export const ButtonContainer = styled(View)`
  margin-top: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.lg}px;
`;

/**
 * Touchable component for the back button with appropriate padding and margin
 */
export const BackButton = styled(TouchableOpacity)`
  padding: ${theme.spacing.sm}px;
  margin-right: ${theme.spacing.sm}px;
`;

/**
 * Text component for the back button with primary color
 */
export const BackButtonText = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.primary.main};
`;