import styled from 'styled-components/native';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { theme } from '../../../theme';

// Main container for the location setup screen with safe area insets and default background color
export const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Container for the main content with appropriate padding
export const ContentContainer = styled(View)`
  flex: 1;
  padding: ${theme.spacing.lg}px;
`;

// Header container with row layout for back button and title
export const Header = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing.md}px;
`;

// Main title for the location setup screen using h1 text style
export const Title = styled(Text)`
  ${theme.typography.textStyles.h1};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.sm}px;
`;

// Description text explaining the location setup process
export const Description = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.lg}px;
`;

// Button for enabling location services with primary color background
export const LocationServicesButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${theme.colors.primary.main};
  padding: ${theme.spacing.md}px;
  border-radius: 8px;
  margin-bottom: ${theme.spacing.md}px;
`;

// Text divider showing 'Or' between location options
export const OrDivider = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.secondary};
  text-align: center;
  margin-vertical: ${theme.spacing.md}px;
`;

// Container for the manual location input field
export const InputContainer = styled(View)`
  margin-bottom: ${theme.spacing.lg}px;
`;

// Container for the distance preference slider
export const SliderContainer = styled(View)`
  margin-top: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.xl}px;
`;

// Label text for the distance slider
export const SliderLabel = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.sm}px;
`;

// Container for displaying min and max distance values
export const SliderValues = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${theme.spacing.sm}px;
`;

// Text component for displaying distance values
export const SliderValue = styled(Text)`
  ${theme.typography.textStyles.caption};
  color: ${theme.colors.text.secondary};
`;

// Container for the onboarding progress bar
export const ProgressContainer = styled(View)`
  margin-vertical: ${theme.spacing.lg}px;
`;

// Container for the continue button, pushed to bottom with margin-top: auto
export const ButtonContainer = styled(View)`
  margin-top: auto;
  margin-bottom: ${theme.spacing.lg}px;
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