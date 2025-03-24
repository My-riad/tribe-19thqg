import styled from 'styled-components/native';
import { View, ScrollView, Text } from 'react-native';
import { theme, colors, spacing, typography, getResponsiveSpacing } from '../../../theme';

// Main container for the entire screen
export const Container = styled(View)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Scrollable container for screen content
export const ScrollContainer = styled(ScrollView)`
  flex: 1;
  padding-horizontal: ${theme.spacing.lg}px;
  padding-vertical: ${theme.spacing.md}px;
`;

// Styled component for section titles
export const SectionTitle = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.semiBold};
  color: ${theme.colors.text.primary};
  margin-top: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.sm}px;
`;

// Container for each preferences section
export const SectionContainer = styled(View)`
  margin-bottom: ${theme.spacing.lg}px;
  padding-vertical: ${theme.spacing.sm}px;
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.neutral[200]};
`;

// Container for toggle switches
export const ToggleContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-vertical: ${theme.spacing.sm}px;
`;

// Text for toggle switch labels
export const ToggleLabel = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.body}px;
  color: ${theme.colors.text.primary};
  flex: 1;
  margin-right: ${theme.spacing.md}px;
`;

// Container for checkboxes
export const CheckboxContainer = styled(View)`
  margin-vertical: ${theme.spacing.sm}px;
  margin-left: ${theme.spacing.md}px;
`;

// Container for sliders
export const SliderContainer = styled(View)`
  margin-vertical: ${theme.spacing.md}px;
`;

// Text for slider labels
export const SliderLabel = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.body}px;
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.xs}px;
`;

// Container for slider value indicators
export const SliderValueContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${theme.spacing.xs}px;
`;

// Text for slider values
export const SliderValueText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  color: ${theme.colors.text.secondary};
`;

// Container for radio button groups
export const RadioGroupContainer = styled(View)`
  margin-vertical: ${theme.spacing.md}px;
`;

// Container for individual radio buttons
export const RadioButtonContainer = styled(View)`
  margin-vertical: ${theme.spacing.xs}px;
  margin-left: ${theme.spacing.md}px;
`;

// Container for the save button
export const SaveButtonContainer = styled(View)`
  margin-top: ${theme.spacing.xl}px;
  margin-bottom: ${getResponsiveSpacing(theme.spacing.xl)}px;
  align-items: center;
`;

// Text for descriptive information
export const DescriptionText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  color: ${theme.colors.text.secondary};
  margin-vertical: ${theme.spacing.xs}px;
  margin-left: ${theme.spacing.md}px;
`;