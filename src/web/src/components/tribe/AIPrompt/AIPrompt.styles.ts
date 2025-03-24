import styled from 'styled-components/native';
import { Animated, View, Text, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';

// Types for prompt styling
export type PromptType = 'conversation' | 'challenge' | 'activity' | 'suggestion';

interface PromptTypeStyles {
  backgroundColor: string;
  borderColor: string;
  iconColor: string;
}

// Function to get styles based on prompt type
const getPromptTypeStyles = (promptType?: PromptType): PromptTypeStyles => {
  switch (promptType) {
    case 'challenge':
      return {
        backgroundColor: `${theme.colors.primary.light}20`, // Using 20% opacity
        borderColor: theme.colors.primary.light,
        iconColor: theme.colors.primary.main,
      };
    case 'activity':
      return {
        backgroundColor: `${theme.colors.secondary.light}20`, // Using 20% opacity
        borderColor: theme.colors.secondary.light,
        iconColor: theme.colors.secondary.main,
      };
    case 'suggestion':
      return {
        backgroundColor: `${theme.colors.success.light}20`, // Using 20% opacity
        borderColor: theme.colors.success.light,
        iconColor: theme.colors.success.main,
      };
    case 'conversation':
    default:
      return {
        backgroundColor: theme.colors.neutral[100],
        borderColor: theme.colors.border.light,
        iconColor: theme.colors.primary.main,
      };
  }
};

// Styled components
export const Container = styled(View)`
  margin: ${theme.spacing.md}px 0;
  width: 100%;
`;

export const AnimatedContainer = styled(Animated.View)`
  width: 100%;
`;

export const PromptContainer = styled(View)`
  background-color: ${props => getPromptTypeStyles(props.promptType).backgroundColor};
  border-radius: ${theme.borderRadius.md}px;
  border-width: 1px;
  border-color: ${props => getPromptTypeStyles(props.promptType).borderColor};
  overflow: hidden;
  ${theme.shadows.md}
`;

export const PromptHeader = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: ${theme.spacing.sm}px ${theme.spacing.md}px;
  border-bottom-width: 1px;
  border-bottom-color: ${props => getPromptTypeStyles(props.promptType).borderColor};
`;

export const AIIndicator = styled(View)`
  flex-direction: row;
  align-items: center;
`;

export const PromptTitle = styled(Text)`
  ${theme.typography.textStyles.h3}
  font-weight: bold;
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.xs}px;
`;

export const PromptContent = styled(Text)`
  ${theme.typography.textStyles.body}
  color: ${theme.colors.text.primary};
  padding: ${theme.spacing.md}px;
`;

export const PromptActions = styled(View)`
  flex-direction: row;
  justify-content: flex-end;
  padding: ${theme.spacing.sm}px;
  border-top-width: 1px;
  border-top-color: ${props => getPromptTypeStyles(props.promptType).borderColor};
`;

export const ActionButton = styled(TouchableOpacity)`
  background-color: ${props => props.primary ? theme.colors.primary.main : 'transparent'};
  padding: ${theme.spacing.xs}px ${theme.spacing.sm}px;
  border-radius: ${theme.borderRadius.sm}px;
  margin-left: ${theme.spacing.xs}px;
`;

export const ActionButtonText = styled(Text)`
  ${theme.typography.textStyles.button}
  color: ${props => props.primary ? theme.colors.primary.contrast : theme.colors.primary.main};
`;