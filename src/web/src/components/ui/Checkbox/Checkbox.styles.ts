import styled from 'styled-components/native';
import { TouchableOpacity, View, Text, Animated } from 'react-native';
import { colors, typography, spacing } from '../../../theme';

// Type definition for checkbox sizes
type CheckboxSize = 'sm' | 'md' | 'lg';

// Interface for checkbox style props used in styled components
interface CheckboxStyleProps {
  checked?: boolean;
  disabled?: boolean;
  size?: CheckboxSize;
  error?: boolean;
}

// Interface for checkbox color configuration
interface CheckboxColors {
  background: string;
  border: string;
  checkmark: string;
  label: string;
}

// Interface for checkbox size-related style properties
interface CheckboxSizeStyles {
  size: number;
  borderRadius: number;
  borderWidth: number;
  iconSize: number;
}

// Defines size configurations for different checkbox sizes
const checkboxSizes = {
  sm: {
    size: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    iconSize: 12
  },
  md: {
    size: 20,
    borderRadius: 4,
    borderWidth: 2,
    iconSize: 16
  },
  lg: {
    size: 24,
    borderRadius: 6,
    borderWidth: 2,
    iconSize: 18
  }
};

/**
 * Returns the appropriate colors for a checkbox based on its state
 * @param props Checkbox style props
 * @returns Color configuration for box, border, checkmark, and label
 */
const getCheckboxColors = (props: CheckboxStyleProps): CheckboxColors => {
  const { checked, disabled, error } = props;

  if (error) {
    return {
      background: checked ? colors.error.main : colors.background.default,
      border: colors.error.main,
      checkmark: colors.error.contrast,
      label: disabled ? colors.text.disabled : colors.text.primary
    };
  }

  if (disabled) {
    return {
      background: checked ? colors.neutral[400] : colors.background.disabled,
      border: colors.neutral[400],
      checkmark: colors.background.default,
      label: colors.text.disabled
    };
  }

  return {
    background: checked ? colors.primary.main : colors.background.default,
    border: checked ? colors.primary.main : colors.border.main,
    checkmark: colors.primary.contrast,
    label: colors.text.primary
  };
};

/**
 * Returns the appropriate size-related styles for a checkbox based on its size prop
 * @param props Checkbox style props
 * @returns Size-related styles including dimensions and border properties
 */
const getCheckboxSizeStyles = (props: CheckboxStyleProps): CheckboxSizeStyles => {
  const { size = 'md' } = props;
  return checkboxSizes[size];
};

// Styled container component for the checkbox with horizontal layout
const CheckboxContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-vertical: ${spacing.xs}px;
`;

// Styled touchable component for the checkbox with appropriate opacity for disabled state
const CheckboxTouchable = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  opacity: ${props => props.disabled ? 0.6 : 1};
`;

// Styled component for the visual checkbox box with dynamic styling based on state and size
const CheckboxBox = styled(View)<CheckboxStyleProps>`
  width: ${props => getCheckboxSizeStyles(props).size}px;
  height: ${props => getCheckboxSizeStyles(props).size}px;
  border-radius: ${props => getCheckboxSizeStyles(props).borderRadius}px;
  border-width: ${props => getCheckboxSizeStyles(props).borderWidth}px;
  border-color: ${props => getCheckboxColors(props).border};
  background-color: ${props => getCheckboxColors(props).background};
  justify-content: center;
  align-items: center;
`;

// Styled animated component for the checkmark icon with centered alignment
const CheckboxIcon = styled(Animated.View)`
  justify-content: center;
  align-items: center;
`;

// Styled component for the checkbox label text with appropriate spacing and typography
const CheckboxLabel = styled(Text)<CheckboxStyleProps>`
  margin-left: ${spacing.sm}px;
  font-family: ${typography.fontFamily.primary};
  font-size: ${props => 
    props.size === 'sm' 
      ? typography.fontSize.sm 
      : props.size === 'lg' 
        ? typography.fontSize.lg 
        : typography.fontSize.md
  }px;
  color: ${props => getCheckboxColors(props).label};
`;

export {
  CheckboxSize,
  CheckboxStyleProps,
  CheckboxColors,
  CheckboxSizeStyles,
  checkboxSizes,
  getCheckboxColors,
  getCheckboxSizeStyles,
  CheckboxContainer,
  CheckboxTouchable,
  CheckboxBox,
  CheckboxIcon,
  CheckboxLabel
};