import styled from 'styled-components/native';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { theme } from '../../../theme';

// Main container for the profile creation screen with safe area insets and default background color
export const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Scrollable container for the main content with appropriate padding
export const ContentContainer = styled(ScrollView)`
  flex: 1;
  padding: ${theme.spacing.lg}px;
`;

// Header container with row layout for back button and title
export const Header = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing.md}px;
`;

// Main title for the profile creation screen using h1 text style
export const Title = styled(Text)`
  ${theme.typography.textStyles.h1};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.sm}px;
`;

// Container for the profile photo upload section with centered alignment
export const AvatarSection = styled(View)`
  align-items: center;
  margin-vertical: ${theme.spacing.lg}px;
`;

// Touchable container for the avatar with appropriate size, border radius, and shadow
export const AvatarContainer = styled(TouchableOpacity)`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  overflow: hidden;
  background-color: ${theme.colors.background.subtle};
  justify-content: center;
  align-items: center;
  margin-bottom: ${theme.spacing.md}px;
  shadow-color: #000000;
  shadow-offset: 0px 3px;
  shadow-opacity: 0.22;
  shadow-radius: 4px;
  elevation: 4;
`;

// Placeholder container shown when no profile photo is selected
export const AvatarPlaceholder = styled(View)`
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  background-color: ${theme.colors.background.subtle};
`;

// Text displayed in the avatar placeholder prompting user to add a photo
export const AvatarPlaceholderText = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.secondary};
  text-align: center;
  padding-horizontal: ${theme.spacing.sm}px;
`;

// Container for the form fields section with appropriate margin
export const FormSection = styled(View)`
  margin-bottom: ${theme.spacing.lg}px;
`;

// Container for each input field with bottom margin for spacing
export const InputContainer = styled(View)`
  margin-bottom: ${theme.spacing.md}px;
`;

// Error text displayed below input fields for validation errors
export const ErrorText = styled(Text)`
  ${theme.typography.textStyles.caption};
  color: ${theme.colors.error.main};
  margin-top: ${theme.spacing.xs}px;
`;

// Text displaying character count for the bio field
export const CharacterCount = styled(Text)`
  ${theme.typography.textStyles.caption};
  color: ${theme.colors.text.secondary};
  text-align: right;
  margin-top: ${theme.spacing.xs}px;
`;

// Container for the progress bar with vertical margins
export const ProgressContainer = styled(View)`
  margin-vertical: ${theme.spacing.lg}px;
`;

// Container for the complete profile button with appropriate vertical margins
export const ButtonContainer = styled(View)`
  margin-top: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.xl}px;
`;

// Touchable component for the back button with appropriate padding and margin
export const BackButton = styled(TouchableOpacity)`
  padding: ${theme.spacing.sm}px;
  margin-right: ${theme.spacing.sm}px;
`;

// Text component for the back button with primary color
export const BackButtonText = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.primary.main};
`;