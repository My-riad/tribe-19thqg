import styled from 'styled-components/native';
import { Animated, TouchableOpacity, View, Text } from 'react-native';
import { theme } from '../../../theme';

/**
 * Available radio button size options
 */
type RadioButtonSize = 'sm' | 'md' | 'lg';

/**
 * Interface for radio button size-related values
 */
interface RadioButtonSizeValues {
  outer: number;
  inner: number;
  touchArea: number;
}

/**
 * Returns the appropriate size values for a radio button based on its size prop
 * @param size The size of the radio button (sm, md, lg)
 * @returns Object containing outer size, inner size, and touch area size values
 */
function getRadioButtonSize(size?: RadioButtonSize): RadioButtonSizeValues {
  switch (size) {
    case 'sm':
      return {
        outer: 16,
        inner: 8,
        touchArea: 32, // Minimum touch target size for accessibility
      };
    case 'lg':
      return {
        outer: 24,
        inner: 12,
        touchArea: 44, // Larger touch area for easier interaction
      };
    case 'md':
    default:
      return {
        outer: 20,
        inner: 10,
        touchArea: 40, // Standard touch target size
      };
  }
}

/**
 * Styled container component that arranges the radio button and label in a row
 */
const RadioButtonContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-vertical: ${theme.spacing.xs}px;
`;

/**
 * Styled touchable component that handles press events and shows reduced opacity when disabled
 */
const RadioButtonTouchable = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  opacity: ${props => props.disabled ? 0.6 : 1};
`;

/**
 * Styled component for the outer circle of the radio button with support for different states
 */
const RadioButtonOuter = styled(View)`
  width: ${props => getRadioButtonSize(props.size).outer}px;
  height: ${props => getRadioButtonSize(props.size).outer}px;
  border-radius: ${props => getRadioButtonSize(props.size).outer / 2}px;
  border-width: 2px;
  border-color: ${props => 
    props.error 
      ? theme.colors.error.main 
      : props.disabled 
        ? theme.colors.neutral[400] 
        : props.selected 
          ? theme.colors.primary.main 
          : theme.colors.neutral[500]
  };
  align-items: center;
  justify-content: center;
  background-color: ${theme.colors.background.default};
`;

/**
 * Styled animated component for the inner circle of the radio button when selected
 */
const RadioButtonInner = styled(Animated.View)`
  width: ${props => getRadioButtonSize(props.size).inner}px;
  height: ${props => getRadioButtonSize(props.size).inner}px;
  border-radius: ${props => getRadioButtonSize(props.size).inner / 2}px;
  background-color: ${props => props.error ? theme.colors.error.main : theme.colors.primary.main};
`;

/**
 * Styled component for the radio button label with support for different states
 */
const RadioButtonLabel = styled(Text)`
  margin-left: ${theme.spacing.sm}px;
  color: ${props => 
    props.disabled 
      ? theme.colors.text.disabled 
      : props.error 
        ? theme.colors.error.main 
        : theme.colors.text.primary
  };
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.body}px;
  font-weight: ${theme.typography.fontWeight.regular};
`;

export {
  RadioButtonContainer,
  RadioButtonTouchable,
  RadioButtonOuter,
  RadioButtonInner,
  RadioButtonLabel,
};

export type { RadioButtonSize, RadioButtonSizeValues };