import styled from 'styled-components/native';
import { View, Text, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';

/**
 * Props interface for the SocialButton component
 */
interface SocialButtonProps {
  provider: 'google' | 'apple' | 'facebook';
  onPress: () => void;
  loading?: boolean;
}

/**
 * Props interface for the SocialButtonText component
 */
interface SocialButtonTextProps {
  provider: 'google' | 'apple' | 'facebook';
}

/**
 * Container component that holds all social authentication buttons
 */
export const SocialButtonContainer = styled(View)`
  width: 100%;
  margin-vertical: ${theme.spacing.md}px;
`;

/**
 * Button component for social authentication providers with provider-specific styling
 */
export const SocialButton = styled(TouchableOpacity)<{ provider: string }>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.provider === 'google' ? '#FFFFFF' : props.provider === 'apple' ? '#000000' : '#1877F2'};
  border-radius: ${theme.spacing.sm}px;
  padding-vertical: ${theme.spacing.sm}px;
  padding-horizontal: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.sm}px;
  min-height: 48px;
  ${theme.shadows.sm}
  ${props => props.provider === 'google' ? `border-width: 1px; border-color: ${theme.colors.neutral[300]};` : ''}
`;

/**
 * Text component for social button labels with provider-specific styling
 */
export const SocialButtonText = styled(Text)<SocialButtonTextProps>`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${props => props.provider === 'google' ? theme.colors.neutral[900] : theme.colors.text.contrast};
  margin-left: ${theme.spacing.sm}px;
`;

/**
 * Container for social provider icons with consistent sizing
 */
export const SocialButtonIcon = styled(View)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

/**
 * Vertical spacing component between social buttons
 */
export const SocialButtonSeparator = styled(View)`
  height: ${theme.spacing.sm}px;
`;

/**
 * Separator component with horizontal lines and 'OR' text between social login and email login options
 */
export const OrSeparator = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-vertical: ${theme.spacing.md}px;
  width: 100%;

  &:before, &:after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: ${theme.colors.neutral[300]};
  }

  & Text {
    margin-horizontal: ${theme.spacing.sm}px;
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.sm}px;
    font-weight: ${theme.typography.fontWeight.medium};
  }
`;