import styled from 'styled-components/native';
import { 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity
} from 'react-native';
import { colors, typography, spacing, isSmallDevice } from '../../../theme';

/**
 * Main container for the login screen with appropriate background color and padding
 */
export const Container = styled(View)`
  flex: 1;
  background-color: ${colors.background.default};
  padding-top: ${Platform.OS === 'ios' ? spacing.xl : spacing.md}px;
`;

/**
 * Scrollable container for the login screen content with keyboard handling
 */
export const ScrollContainer = styled(ScrollView).attrs({
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  keyboardShouldPersistTaps: 'handled',
})`
  flex: 1;
`;

/**
 * Container that adjusts its layout when the keyboard appears
 */
export const KeyboardAwareContainer = styled(KeyboardAvoidingView).attrs({
  behavior: Platform.OS === 'ios' ? 'padding' : 'height',
  keyboardVerticalOffset: Platform.OS === 'ios' ? 40 : 0,
})`
  flex: 1;
`;

/**
 * Container for the app logo with centered alignment and appropriate spacing
 */
export const LogoContainer = styled(View)`
  align-items: center;
  justify-content: center;
  margin-bottom: ${spacing.xl}px;
  padding-horizontal: ${spacing.lg}px;
`;

/**
 * Styled logo component with responsive sizing based on device size
 */
export const Logo = styled(Image)`
  width: ${isSmallDevice() ? 80 : 100}px;
  height: ${isSmallDevice() ? 80 : 100}px;
  margin-bottom: ${spacing.md}px;
`;

/**
 * Styled app title component with appropriate typography and color
 */
export const AppTitle = styled(Text)`
  ${typography.textStyles.h1};
  color: ${colors.primary.main};
  text-align: center;
  margin-bottom: ${spacing.xs}px;
`;

/**
 * Styled app tagline component with appropriate typography and color
 */
export const AppTagline = styled(Text)`
  ${typography.textStyles.body};
  color: ${colors.text.secondary};
  text-align: center;
  margin-bottom: ${spacing.lg}px;
`;

/**
 * Container for the login form with appropriate padding and margin
 */
export const FormContainer = styled(View)`
  padding-horizontal: ${spacing.lg}px;
  margin-bottom: ${spacing.xl}px;
`;

/**
 * Container for the footer with centered alignment and appropriate spacing
 */
export const FooterContainer = styled(View)`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding-horizontal: ${spacing.lg}px;
  margin-bottom: ${Platform.OS === 'ios' ? spacing.xl : spacing.lg}px;
`;

/**
 * Styled text for the footer with appropriate typography and color
 */
export const FooterText = styled(Text)`
  ${typography.textStyles.body};
  color: ${colors.text.secondary};
`;

/**
 * Styled touchable component for the footer link with appropriate spacing
 */
export const FooterLink = styled(TouchableOpacity)`
  margin-left: ${spacing.xs}px;
`;