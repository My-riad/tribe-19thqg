import React from 'react';
import { 
  Animated, 
  TouchableWithoutFeedback, 
  GestureResponderEvent,
  ActivityIndicator
} from 'react-native';

import { colors, typography, buttonPress } from '../../../theme';
import { 
  ButtonContainer, 
  ButtonText, 
  ButtonIcon, 
  IconButtonContainer,
  ButtonLoadingIndicator
} from './Button.styles';

// Types for button variants and sizes
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Props interface for the Button component
export interface ButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: object;
}

/**
 * A versatile button component that supports multiple variants, sizes, and states
 * 
 * Features:
 * - Multiple variants: primary, secondary, tertiary, icon
 * - Different sizes: sm, md, lg
 * - Support for disabled and loading states
 * - Left and right icon support
 * - Animation feedback on press
 * - Full width option
 * - Accessibility support
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  accessibilityLabel,
  testID,
  style,
}: ButtonProps) => {
  // Animation scale value for button press effect
  const scale = new Animated.Value(1);
  const { pressIn, pressOut } = buttonPress(scale);

  // Handle press in animation
  const handlePressIn = () => {
    if (!disabled && !isLoading) {
      pressIn().start();
    }
  };

  // Handle press out animation
  const handlePressOut = () => {
    if (!disabled && !isLoading) {
      pressOut().start();
    }
  };

  // Determine if this is an icon-only button
  const isIconButton = variant === 'icon';

  // Determine loading indicator color based on button variant
  const getLoadingColor = () => {
    if (isIconButton) return colors.text.primary;
    return variant === 'primary' ? colors.primary.contrast : colors.primary.main;
  };

  // Construct accessibility props
  const accessibilityProps = {
    accessibilityLabel: accessibilityLabel || (typeof children === 'string' ? children : undefined),
    accessibilityRole: 'button' as const,
    accessibilityState: { 
      disabled: disabled || isLoading 
    }
  };

  // Render icon button
  if (isIconButton) {
    return (
      <TouchableWithoutFeedback
        onPress={!disabled && !isLoading ? onPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={testID}
        disabled={disabled || isLoading}
        {...accessibilityProps}
      >
        <IconButtonContainer
          variant={variant}
          size={size}
          disabled={disabled}
          style={[{ transform: [{ scale }] }, style]}
        >
          {isLoading ? (
            <ButtonLoadingIndicator
              size="small"
              color={getLoadingColor()}
              standalone
            />
          ) : (
            children
          )}
        </IconButtonContainer>
      </TouchableWithoutFeedback>
    );
  }

  // Render standard button
  return (
    <TouchableWithoutFeedback
      onPress={!disabled && !isLoading ? onPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={testID}
      disabled={disabled || isLoading}
      {...accessibilityProps}
    >
      <ButtonContainer
        variant={variant}
        size={size}
        disabled={disabled}
        fullWidth={fullWidth}
        style={[{ transform: [{ scale }] }, style]}
      >
        {isLoading ? (
          <ButtonLoadingIndicator
            size="small"
            color={getLoadingColor()}
          />
        ) : leftIcon ? (
          <ButtonIcon position="left">
            {leftIcon}
          </ButtonIcon>
        ) : null}
        
        {children && (
          <ButtonText
            variant={variant}
            size={size}
            disabled={disabled}
          >
            {children}
          </ButtonText>
        )}
        
        {rightIcon && (
          <ButtonIcon position="right">
            {rightIcon}
          </ButtonIcon>
        )}
      </ButtonContainer>
    </TouchableWithoutFeedback>
  );
};

export default Button;
export type { ButtonProps };