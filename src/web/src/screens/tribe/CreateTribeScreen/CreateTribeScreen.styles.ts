import styled from 'styled-components/native';
import { View, Text, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { theme, colors, spacing, typography, shadows, getResponsiveSpacing } from '../../../theme';

/**
 * Main container for the Create Tribe screen
 */
const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

/**
 * Container for the main content with responsive horizontal padding
 */
const ScreenContent = styled(View)`
  flex: 1;
  padding-horizontal: ${getResponsiveSpacing('lg')}px;
`;

/**
 * Container for the header section with title and back button
 */
const HeaderContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-vertical: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Styled component for the header title
 */
const HeaderTitle = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.xl}px;
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  flex: 1;
  text-align: center;
`;

/**
 * Container for the back button positioned at the left side of header
 */
const BackButtonContainer = styled(View)`
  position: absolute;
  left: 0;
  padding: ${theme.spacing.sm}px;
  z-index: 1;
`;

/**
 * Scrollable container for the tribe creation form
 */
const FormContainer = styled(ScrollView)`
  flex: 1;
`;

/**
 * Overlay for displaying loading state when creating a tribe
 */
const LoadingOverlay = styled(View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${theme.colors.background.overlay};
  justify-content: center;
  align-items: center;
  z-index: 10;
`;

/**
 * Styled component for displaying error messages
 */
const ErrorMessage = styled(Text)`
  color: ${theme.colors.status.error};
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  margin-top: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.md}px;
  text-align: center;
`;

export {
  Container,
  ScreenContent,
  HeaderContainer,
  HeaderTitle,
  BackButtonContainer,
  FormContainer,
  LoadingOverlay,
  ErrorMessage
};