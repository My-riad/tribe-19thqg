import styled from 'styled-components/native';
import { 
  View, 
  Text, 
  ScrollView, 
  SafeAreaView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { 
  theme, 
  isSmallDevice, 
  getResponsiveSpacing 
} from '../../../theme';

/**
 * Returns platform-specific styles for the event planning screen
 * to ensure native look and feel on different platforms
 */
const getPlatformSpecificStyles = () => {
  if (Platform.OS === 'ios') {
    return `
      box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
      border-radius: ${theme.spacing.small}px;
    `;
  } else if (Platform.OS === 'android') {
    return `
      elevation: 4;
      border-radius: ${theme.spacing.small}px;
    `;
  }
  return '';
};

/**
 * Main container for the event planning screen with safe area insets
 */
export const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

/**
 * Container for the screen header with title and back button
 */
export const Header = styled(View)`
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
export const Title = styled(Text)`
  ${theme.typography.heading2};
  color: ${theme.colors.text.primary};
  flex: 1;
  text-align: center;
`;

/**
 * Scrollable container for the main content of the event planning screen
 */
export const Content = styled(ScrollView)`
  flex: 1;
  padding: ${props => getResponsiveSpacing(theme.spacing.medium)}px;
`;

/**
 * Container for the event creation form
 */
export const FormContainer = styled(View)`
  width: 100%;
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.spacing.small}px;
  padding: ${theme.spacing.medium}px;
  ${getPlatformSpecificStyles()};
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
  ${theme.typography.body};
  color: ${theme.colors.error.main};
  text-align: center;
  margin-top: ${theme.spacing.medium}px;
`;

/**
 * Container for action buttons
 */
export const ButtonContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${theme.spacing.large}px;
  margin-bottom: ${theme.spacing.medium}px;
`;

/**
 * Banner for AI optimization suggestions
 */
export const AIOptimizationBanner = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: ${theme.spacing.small}px;
  background-color: ${theme.colors.primary.light}20;
  border-radius: ${theme.spacing.small}px;
  margin-vertical: ${theme.spacing.medium}px;
  ${getPlatformSpecificStyles()};
`;

/**
 * Text for AI optimization suggestions
 */
export const AIOptimizationText = styled(Text)`
  ${theme.typography.body};
  color: ${theme.colors.primary.dark};
  flex: 1;
  margin-left: ${theme.spacing.small}px;
`;