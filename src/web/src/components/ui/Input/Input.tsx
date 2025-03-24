import React, { useState, useRef } from 'react';
import { TextInput, TouchableOpacity, View, TextInputProps } from 'react-native';
import { theme } from '../../../theme';
import {
  InputContainer,
  InputWrapper,
  StyledTextInput,
  InputLabel,
  InputError,
  InputIcon,
  inputVariants
} from './Input.styles';

/**
 * Available input variant options
 */
type InputVariant = 'text' | 'number' | 'email' | 'password' | 'search';

/**
 * Available input size options
 */
type InputSize = 'sm' | 'md' | 'lg';

/**
 * Props for the Input component
 */
interface InputProps extends Omit<TextInputProps, 'onChange'> {
  /** Label text to display above the input */
  label?: string;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Current value of the input */
  value?: string;
  /** Function called when input text changes */
  onChangeText?: (text: string) => void;
  /** Input style variant (text, number, email, password, search) */
  variant?: InputVariant;
  /** Input size (sm, md, lg) */
  size?: InputSize;
  /** Error message to display below the input */
  error?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Icon to display on the left side of the input */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right side of the input */
  rightIcon?: React.ReactNode;
  /** Whether to show a clear button when input has value */
  clearable?: boolean;
  /** Whether to hide the input text (for passwords) */
  secureTextEntry?: boolean;
  /** Whether the input can have multiple lines */
  multiline?: boolean;
  /** Number of lines for multiline input */
  numberOfLines?: number;
  /** Whether the input should take up the full width of its container */
  fullWidth?: boolean;
  /** Auto-capitalization behavior */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Whether to enable auto-correction */
  autoCorrect?: boolean;
  /** Keyboard type to display */
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  /** Return key label */
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  /** Function called when input is focused */
  onFocus?: () => void;
  /** Function called when input loses focus */
  onBlur?: () => void;
  /** Function called when return key is pressed */
  onSubmitEditing?: () => void;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint for screen readers */
  accessibilityHint?: string;
  /** Test ID for automated testing */
  testID?: string;
  /** Additional styles to apply to the input container */
  style?: object;
}

/**
 * A versatile input component that supports multiple variants, sizes, and states
 */
const Input = (props: InputProps): JSX.Element => {
  // Destructure props with default values
  const {
    label,
    placeholder,
    value = '',
    onChangeText,
    variant = 'text',
    size = 'md',
    error,
    disabled = false,
    leftIcon,
    rightIcon,
    clearable = false,
    secureTextEntry: propSecureTextEntry,
    multiline = false,
    numberOfLines = 1,
    fullWidth = false,
    autoCapitalize,
    autoCorrect = true,
    keyboardType: propKeyboardType,
    returnKeyType,
    onFocus,
    onBlur,
    onSubmitEditing,
    accessibilityLabel,
    accessibilityHint,
    testID,
    style,
    ...restProps
  } = props;

  // State for tracking focus
  const [isFocused, setIsFocused] = useState(false);

  // Reference to the TextInput
  const inputRef = useRef<TextInput>(null);

  // Get the variant configuration
  const variantConfig = inputVariants[variant];

  // Determine if secureTextEntry based on variant and prop
  const secureTextEntry = propSecureTextEntry !== undefined 
    ? propSecureTextEntry 
    : variantConfig.secureTextEntry;

  // Determine keyboardType based on variant and prop
  const keyboardType = propKeyboardType || variantConfig.keyboardType;

  // Determine autoCapitalize based on variant and prop
  const defaultAutoCapitalize = autoCapitalize || variantConfig.autoCapitalize;

  // Handle text change events
  const handleChangeText = (text: string) => {
    if (onChangeText && !disabled) {
      onChangeText(text);
    }
  };

  // Handle focus events
  const handleFocus = () => {
    setIsFocused(true);
    onFocus && onFocus();
  };

  // Handle blur events
  const handleBlur = () => {
    setIsFocused(false);
    onBlur && onBlur();
  };

  // Handle clear button press
  const handleClear = () => {
    handleChangeText('');
    inputRef.current?.focus();
  };

  // Handle submit editing
  const handleSubmitEditing = () => {
    onSubmitEditing && onSubmitEditing();
  };

  return (
    <InputContainer 
      fullWidth={fullWidth} 
      disabled={disabled}
      style={style}
    >
      {/* Render label if provided */}
      {label && (
        <InputLabel 
          hasError={!!error}
          accessibilityRole="text"
        >
          {label}
        </InputLabel>
      )}

      <InputWrapper 
        focused={isFocused}
        hasError={!!error}
        disabled={disabled}
        size={size}
      >
        {/* Render left icon if provided */}
        {leftIcon && (
          <InputIcon position="left">
            {leftIcon}
          </InputIcon>
        )}

        <StyledTextInput
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmitEditing}
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          keyboardType={keyboardType}
          autoCapitalize={defaultAutoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          size={size}
          focused={isFocused}
          hasError={!!error}
          disabled={disabled}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
          accessibilityState={{
            disabled: disabled,
            selected: isFocused,
          }}
          testID={testID}
          {...restProps}
        />

        {/* Render clear button if clearable and has value */}
        {clearable && value.length > 0 && !disabled && (
          <TouchableOpacity 
            onPress={handleClear}
            accessibilityLabel="Clear text"
            accessibilityRole="button"
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <InputIcon position="right">
              {/* X icon - could be replaced with a proper icon component */}
              <View style={{ width: 16, height: 16, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ 
                  width: 10, 
                  height: 1.5, 
                  backgroundColor: theme.colors.neutral[500], 
                  transform: [{ rotate: '45deg' }] 
                }} />
                <View style={{ 
                  width: 10, 
                  height: 1.5, 
                  backgroundColor: theme.colors.neutral[500], 
                  transform: [{ rotate: '-45deg' }],
                  position: 'absolute'
                }} />
              </View>
            </InputIcon>
          </TouchableOpacity>
        )}

        {/* Render right icon if provided */}
        {rightIcon && (
          <InputIcon position="right">
            {rightIcon}
          </InputIcon>
        )}
      </InputWrapper>

      {/* Render error message if error prop is provided */}
      {error && (
        <InputError 
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          {error}
        </InputError>
      )}
    </InputContainer>
  );
};

export type { InputVariant, InputSize, InputProps };
export default Input;