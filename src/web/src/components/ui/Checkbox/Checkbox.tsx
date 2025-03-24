import React, { useState, useEffect, useRef } from 'react';
import { Animated, Easing, AccessibilityProps } from 'react-native';
import {
  CheckboxContainer,
  CheckboxTouchable,
  CheckboxBox,
  CheckboxIcon,
  CheckboxLabel,
  CheckboxSize,
  checkboxSizes
} from './Checkbox.styles';
import { CheckIcon } from '../../assets/icons';

// Duration of the checkbox state change animation in milliseconds
const ANIMATION_DURATION = 200;

/**
 * Props interface for the Checkbox component
 */
interface CheckboxProps {
  checked?: boolean;
  disabled?: boolean;
  error?: boolean;
  size?: CheckboxSize;
  label?: string;
  onPress?: (checked: boolean) => void;
  testID?: string;
}

/**
 * A customizable checkbox component that supports different states and sizes
 */
const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  disabled = false,
  error = false,
  size = 'md',
  label,
  onPress,
  testID
}) => {
  // Animated value for the checkbox state
  const animatedValue = useRef(new Animated.Value(checked ? 1 : 0)).current;
  
  // Internal state for the checkbox
  const [isChecked, setIsChecked] = useState(checked);
  
  // Update animation value when checked state changes
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isChecked ? 1 : 0,
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true
    }).start();
  }, [isChecked, animatedValue]);
  
  // Update internal state when external checked prop changes
  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);
  
  // Handle checkbox press
  const handlePress = () => {
    if (disabled) return;
    
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    
    if (onPress) {
      onPress(newCheckedState);
    }
  };
  
  // Create accessibility props
  const accessibilityProps: AccessibilityProps = {
    accessible: true,
    accessibilityRole: 'checkbox',
    accessibilityState: {
      checked: isChecked,
      disabled: disabled
    },
    accessibilityLabel: label 
      ? `${label}, checkbox, ${isChecked ? 'checked' : 'unchecked'}`
      : undefined
  };
  
  // Calculate icon opacity based on animation value
  const iconOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  // Calculate icon scale based on animation value
  const iconScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1]
  });
  
  return (
    <CheckboxContainer testID={testID}>
      <CheckboxTouchable
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
        {...accessibilityProps}
      >
        <CheckboxBox
          checked={isChecked}
          disabled={disabled}
          error={error}
          size={size}
        >
          <CheckboxIcon
            style={{
              opacity: iconOpacity,
              transform: [{ scale: iconScale }]
            }}
          >
            <CheckIcon
              width={checkboxSizes[size].iconSize}
              height={checkboxSizes[size].iconSize}
            />
          </CheckboxIcon>
        </CheckboxBox>
        
        {label && (
          <CheckboxLabel
            disabled={disabled}
            error={error}
            size={size}
          >
            {label}
          </CheckboxLabel>
        )}
      </CheckboxTouchable>
    </CheckboxContainer>
  );
};

export type { CheckboxProps };
export default Checkbox;