import styled from 'styled-components/native';
import { Animated, ActivityIndicator, View, Text } from 'react-native';
import { theme } from '../../../theme';

// Types
type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonColors {
  background: string;
  text: string;
  border: string;
}

interface ButtonSizeStyles {
  height: number;
  paddingHorizontal: number;
  borderRadius: number;
  size?: number; // For icon buttons
}

/**
 * Returns the appropriate colors for a button based on its variant and state
 */
const getButtonColors = (variant: ButtonVariant, disabled: boolean): ButtonColors => {
  if (disabled) {
    // Return disabled colors regardless of variant
    return {
      background: theme.colors.background.disabled,
      text: theme.colors.text.disabled,
      border: theme.colors.border.light,
    };
  }

  // Return colors based on variant
  switch (variant) {
    case 'primary':
      return {
        background: theme.colors.primary.main,
        text: theme.colors.primary.contrast,
        border: theme.colors.primary.main,
      };
    case 'secondary':
      return {
        background: theme.colors.secondary.main,
        text: theme.colors.secondary.contrast,
        border: theme.colors.secondary.main,
      };
    case 'tertiary':
      return {
        background: 'transparent',
        text: theme.colors.primary.main,
        border: theme.colors.primary.main,
      };
    case 'icon':
      return {
        background: 'transparent',
        text: theme.colors.text.primary,
        border: 'transparent',
      };
    default:
      return {
        background: theme.colors.primary.main,
        text: theme.colors.primary.contrast,
        border: theme.colors.primary.main,
      };
  }
};

/**
 * Returns the appropriate size-related styles for a button based on its size and type
 */
const getButtonSizeStyles = (size: ButtonSize, isIconButton: boolean): ButtonSizeStyles => {
  if (isIconButton) {
    // Return circular dimensions for icon buttons
    switch (size) {
      case 'sm':
        return {
          size: 32,
          borderRadius: 16,
          height: 32,
          paddingHorizontal: 0,
        };
      case 'lg':
        return {
          size: 48,
          borderRadius: 24,
          height: 48,
          paddingHorizontal: 0,
        };
      case 'md':
      default:
        return {
          size: 40,
          borderRadius: 20,
          height: 40,
          paddingHorizontal: 0,
        };
    }
  }

  // Return rectangular dimensions for regular buttons
  switch (size) {
    case 'sm':
      return {
        height: 32,
        paddingHorizontal: theme.spacing.md,
        borderRadius: 8,
      };
    case 'lg':
      return {
        height: 48,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: 12,
      };
    case 'md':
    default:
      return {
        height: 40,
        paddingHorizontal: theme.spacing.md,
        borderRadius: 8,
      };
  }
};

/**
 * Styled container component for the button with support for different variants, sizes, and states
 */
const ButtonContainer = styled(Animated.View)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${props => getButtonColors(props.variant, props.disabled).background};
  border-width: ${props => props.variant === 'tertiary' ? 1 : 0}px;
  border-color: ${props => getButtonColors(props.variant, props.disabled).border};
  border-radius: ${props => getButtonSizeStyles(props.size, false).borderRadius}px;
  padding-horizontal: ${props => getButtonSizeStyles(props.size, false).paddingHorizontal}px;
  height: ${props => getButtonSizeStyles(props.size, false).height}px;
  opacity: ${props => props.disabled ? 0.6 : 1};
  ${props => props.fullWidth ? 'width: 100%;' : ''}
  ${props => props.variant === 'primary' ? theme.shadows.sm : theme.shadows.none}
`;

/**
 * Styled text component for the button label with support for different sizes and colors
 */
const ButtonText = styled(Text)`
  color: ${props => getButtonColors(props.variant, props.disabled).text};
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${props => props.size === 'sm' ? theme.typography.fontSize.sm : props.size === 'lg' ? theme.typography.fontSize.lg : theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.medium};
  text-align: center;
`;

/**
 * Styled container for button icons with appropriate spacing based on position
 */
const ButtonIcon = styled(View)`
  margin-right: ${props => props.position === 'left' ? theme.spacing.xs : 0}px;
  margin-left: ${props => props.position === 'right' ? theme.spacing.xs : 0}px;
`;

/**
 * Styled container for icon-only buttons with circular shape and appropriate sizing
 */
const IconButtonContainer = styled(Animated.View)`
  align-items: center;
  justify-content: center;
  background-color: ${props => getButtonColors(props.variant, props.disabled).background};
  border-radius: ${props => getButtonSizeStyles(props.size, true).borderRadius}px;
  width: ${props => getButtonSizeStyles(props.size, true).size}px;
  height: ${props => getButtonSizeStyles(props.size, true).size}px;
  opacity: ${props => props.disabled ? 0.6 : 1};
  ${props => props.variant === 'primary' ? theme.shadows.sm : theme.shadows.none}
`;

/**
 * Styled activity indicator for button loading state with appropriate spacing
 */
const ButtonLoadingIndicator = styled(ActivityIndicator)`
  margin-right: ${props => props.standalone ? 0 : theme.spacing.xs}px;
`;

export {
  ButtonContainer,
  ButtonText,
  ButtonIcon,
  IconButtonContainer,
  ButtonLoadingIndicator
};

export type { ButtonVariant, ButtonSize, ButtonColors, ButtonSizeStyles };