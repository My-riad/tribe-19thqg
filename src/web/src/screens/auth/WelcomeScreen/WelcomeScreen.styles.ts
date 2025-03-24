import styled from 'styled-components/native';
import { View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import { theme, colors, typography, spacing, isSmallDevice } from '../../../theme';

/**
 * Main container for the welcome screen with appropriate background color and padding
 */
const Container = styled(View)`
  flex: 1;
  background-color: ${theme.colors.background.default};
  padding-top: ${Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.lg}px;
`;

/**
 * Container for the main content with centered alignment and appropriate padding
 */
const ContentContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding-horizontal: ${theme.spacing.lg}px;
`;

/**
 * Container for the app logo with centered alignment and appropriate spacing
 */
const LogoContainer = styled(View)`
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing.xl}px;
`;

/**
 * Styled logo component with responsive sizing based on device size
 */
const Logo = styled(Image)`
  width: ${isSmallDevice() ? 100 : 120}px;
  height: ${isSmallDevice() ? 100 : 120}px;
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Container for the title and tagline with centered alignment and appropriate spacing
 */
const TitleContainer = styled(View)`
  align-items: center;
  margin-bottom: ${theme.spacing.xl}px;
`;

/**
 * Styled app title component with appropriate typography and color
 */
const AppTitle = styled(Text)`
  ${theme.typography.textStyles.h1};
  color: ${theme.colors.primary.main};
  text-align: center;
  margin-bottom: ${theme.spacing.xs}px;
`;

/**
 * Styled app tagline component with appropriate typography, color, and width constraint
 */
const AppTagline = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.secondary};
  text-align: center;
  max-width: 80%;
`;

/**
 * Container for action buttons with full width and appropriate spacing
 */
const ButtonsContainer = styled(View)`
  width: 100%;
  align-items: center;
  margin-bottom: ${theme.spacing.xl}px;
`;

/**
 * Spacer component to create vertical space between buttons
 */
const ButtonSpacer = styled(View)`
  height: ${theme.spacing.md}px;
`;

/**
 * Container for the footer with centered alignment and appropriate spacing
 */
const FooterContainer = styled(View)`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: ${Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.lg}px;
`;

/**
 * Styled text for the footer with appropriate typography and color
 */
const FooterText = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.secondary};
`;

/**
 * Styled touchable component for the footer link with appropriate spacing
 */
const FooterLink = styled(TouchableOpacity)`
  margin-left: ${theme.spacing.xs}px;
`;

export {
  Container,
  ContentContainer,
  LogoContainer,
  Logo,
  TitleContainer,
  AppTitle,
  AppTagline,
  ButtonsContainer,
  ButtonSpacer,
  FooterContainer,
  FooterText,
  FooterLink
};