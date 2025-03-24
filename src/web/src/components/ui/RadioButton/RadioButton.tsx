import React, { useState, useEffect, useRef } from 'react';
import { Animated, Easing, AccessibilityProps } from 'react-native';
import {
  RadioButtonContainer,
  RadioButtonTouchable,
  RadioButtonOuter,
  RadioButtonInner,
  RadioButtonLabel,
  RadioButtonSize
} from './RadioButton.styles';

// Animation duration constant
const ANIMATION_DURATION = 200;

/**
 * Props interface for the RadioButton component
 */
export interface RadioButtonProps {
  /**
   * Whether the radio button is selected
   */
  selected?: boolean;
  
  /**
   * Whether the radio button is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether the radio button is in an error state
   */
  error?: boolean;
  
  /**
   * Size of the radio button (sm, md, lg)
   */
  size?: RadioButtonSize;
  
  /**
   * Label text to display next to the radio button
   */
  label?: string;
  
  /**
   * Function called when radio button is pressed
   */
  onPress?: (value: any) => void;
  
  /**
   * Value associated with this radio button
   */
  value?: any;
  
  /**
   * Test ID for automated testing
   */
  testID?: string;
  
  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;
}

/**
 * A customizable radio button component that supports different states and sizes
 */
const RadioButton: React.FC<RadioButtonProps> = ({
  selected = false,
  disabled = false,
  error = false,
  size = 'md',
  label,
  onPress,
  value,
  testID,
  accessibilityLabel,
}) => {
  // Animation value for the radio button state
  const animationValue = useRef(new Animated.Value(selected ? 1 : 0)).current;
  
  // Keep track of internal selected state for smooth transitions
  const [isSelected, setIsSelected] = useState(selected);

  // Update animation when selected state changes
  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: selected ? 1 : 0,
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Standard material easing
      useNativeDriver: true,
    }).start();
  }, [selected, animationValue]);

  // Update internal selected state when external prop changes
  useEffect(() => {
    setIsSelected(selected);
  }, [selected]);
  
  // Handle press events
  const handlePress = () => {
    if (!disabled) {
      if (onPress) {
        onPress(value);
      }
    }
  };
  
  // Accessibility props
  const accessibilityProps: AccessibilityProps = {
    accessibilityRole: 'radio',
    accessibilityState: {
      disabled,
      checked: selected,
    },
    accessibilityLabel: accessibilityLabel || label,
  };
  
  return (
    <RadioButtonContainer>
      <RadioButtonTouchable
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
        testID={testID}
        {...accessibilityProps}
      >
        <RadioButtonOuter
          size={size}
          selected={selected}
          disabled={disabled}
          error={error}
        >
          <RadioButtonInner
            size={size}
            error={error}
            as={Animated.View}
            style={{
              opacity: animationValue,
              transform: [
                {
                  scale: animationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            }}
          />
        </RadioButtonOuter>
        
        {label && (
          <RadioButtonLabel
            disabled={disabled}
            error={error}
          >
            {label}
          </RadioButtonLabel>
        )}
      </RadioButtonTouchable>
    </RadioButtonContainer>
  );
};

export default RadioButton;
export { RadioButtonProps };