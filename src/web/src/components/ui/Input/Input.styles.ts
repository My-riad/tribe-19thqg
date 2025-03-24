import styled from 'styled-components/native';
import { Animated, TextInput, View, Text } from 'react-native';
import { theme } from '../../../theme';

// Define available input sizes and variants
type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'text' | 'number' | 'email' | 'password' | 'search';

// Interface for size-related style properties
interface InputSizeStyles {
  height: number;
  paddingHorizontal: number;
  fontSize: number;
}

// Interface for state-related style properties
interface InputStateStyles {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
}

// Interface for input variant configuration
interface InputVariantConfig {
  keyboardType: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry: boolean;
}

/**
 * Returns the appropriate size-related styles for an input based on its size
 */
const getInputSizeStyles = (size: InputSize = 'md'): InputSizeStyles => {
  switch (size) {
    case 'sm':
      return {
        height: 36,
        paddingHorizontal: theme.spacing.xs,
        fontSize: theme.typography.fontSize.sm,
      };
    case 'lg':
      return {
        height: 56,
        paddingHorizontal: theme.spacing.md,
        fontSize: theme.typography.fontSize.lg,
      };
    case 'md':
    default:
      return {
        height: 48,
        paddingHorizontal: theme.spacing.sm,
        fontSize: theme.typography.fontSize.md,
      };
  }
};

/**
 * Returns the appropriate styles for an input based on its state
 * (normal, focused, error, disabled)
 */
const getInputStateStyles = (
  focused: boolean = false,
  hasError: boolean = false,
  disabled: boolean = false
): InputStateStyles => {
  // Handle disabled state
  if (disabled) {
    return {
      borderColor: theme.colors.border.light,
      backgroundColor: theme.colors.background.disabled,
      textColor: theme.colors.text.disabled,
    };
  }

  // Handle error state
  if (hasError) {
    return {
      borderColor: theme.colors.error.main,
      backgroundColor: theme.colors.background.default,
      textColor: theme.colors.text.primary,
    };
  }

  // Handle focused state
  if (focused) {
    return {
      borderColor: theme.colors.primary.main,
      backgroundColor: theme.colors.background.default,
      textColor: theme.colors.text.primary,
    };
  }

  // Default state
  return {
    borderColor: theme.colors.border.main,
    backgroundColor: theme.colors.background.default,
    textColor: theme.colors.text.primary,
  };
};

// Styled container component for the input field and its associated elements
const InputContainer = styled(View)`
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  margin-bottom: ${theme.spacing.md}px;
  opacity: ${props => props.disabled ? 0.6 : 1};
`;

// Styled wrapper for the input field and icons with dynamic styling based on input state
const InputWrapper = styled(View)`
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-radius: ${theme.spacing.xs}px;
  border-color: ${props => getInputStateStyles(props.focused, props.hasError, props.disabled).borderColor};
  background-color: ${props => getInputStateStyles(props.focused, props.hasError, props.disabled).backgroundColor};
  padding-horizontal: ${theme.spacing.sm}px;
  height: ${props => getInputSizeStyles(props.size).height}px;
  ${props => props.focused && !props.hasError ? theme.shadows.sm : 'box-shadow: none;'}
`;

// Styled text input component with support for different states, sizes, and multiline input
const StyledTextInput = styled(TextInput)`
  flex: 1;
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${props => getInputSizeStyles(props.size).fontSize}px;
  color: ${props => getInputStateStyles(props.focused, props.hasError, props.disabled).textColor};
  padding-vertical: 0;
  padding-horizontal: ${theme.spacing.xs}px;
  min-height: ${props => props.multiline ? getInputSizeStyles(props.size).height * 2 : getInputSizeStyles(props.size).height}px;
  text-align-vertical: ${props => props.multiline ? 'top' : 'center'};
`;

// Styled label component for the input field with error state support
const InputLabel = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${props => props.hasError ? theme.colors.error.main : theme.colors.text.primary};
  margin-bottom: ${theme.spacing.xs}px;
`;

// Styled error message component for the input field
const InputError = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.xs}px;
  color: ${theme.colors.error.main};
  margin-top: ${theme.spacing.xs}px;
`;

// Styled container for input icons with appropriate spacing based on position
const InputIcon = styled(View)`
  margin-right: ${props => props.position === 'left' ? theme.spacing.xs : 0}px;
  margin-left: ${props => props.position === 'right' ? theme.spacing.xs : 0}px;
`;

// Configuration for different input variants with appropriate keyboard types and security settings
const inputVariants = {
  text: {
    keyboardType: 'default',
    autoCapitalize: 'sentences',
    secureTextEntry: false
  },
  number: {
    keyboardType: 'numeric',
    autoCapitalize: 'none',
    secureTextEntry: false
  },
  email: {
    keyboardType: 'email-address',
    autoCapitalize: 'none',
    secureTextEntry: false
  },
  password: {
    keyboardType: 'default',
    autoCapitalize: 'none',
    secureTextEntry: true
  },
  search: {
    keyboardType: 'default',
    autoCapitalize: 'none',
    secureTextEntry: false
  }
};

export {
  InputContainer,
  InputWrapper,
  StyledTextInput,
  InputLabel,
  InputError,
  InputIcon,
  inputVariants,
  getInputSizeStyles,
  getInputStateStyles,
};

export type {
  InputSize,
  InputVariant,
  InputSizeStyles,
  InputStateStyles,
  InputVariantConfig,
};