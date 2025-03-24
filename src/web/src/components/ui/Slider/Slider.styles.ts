import styled from 'styled-components/native';
import { Animated, View, Text } from 'react-native';
import { theme } from '../../../theme';

// Types
type SliderVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';
type SliderSize = 'sm' | 'md' | 'lg';

interface SliderColors {
  track: string;
  fill: string;
  thumb: string;
  label: string;
}

interface SliderSizeStyles {
  trackHeight: number;
  thumbSize: number;
  labelFontSize: number;
}

// Helper function to get appropriate colors based on variant and disabled state
const getSliderColors = (variant: SliderVariant = 'default', disabled: boolean = false): SliderColors => {
  if (disabled) {
    return {
      track: theme.colors.neutral[300],
      fill: theme.colors.neutral[400],
      thumb: theme.colors.neutral[500],
      label: theme.colors.text.disabled,
    };
  }

  switch (variant) {
    case 'primary':
      return {
        track: theme.colors.neutral[300],
        fill: theme.colors.primary.main,
        thumb: theme.colors.primary.main,
        label: theme.colors.text.primary,
      };
    case 'success':
      return {
        track: theme.colors.neutral[300],
        fill: theme.colors.success.main,
        thumb: theme.colors.success.main,
        label: theme.colors.text.primary,
      };
    case 'warning':
      return {
        track: theme.colors.neutral[300],
        fill: theme.colors.warning.main,
        thumb: theme.colors.warning.main,
        label: theme.colors.text.primary,
      };
    case 'error':
      return {
        track: theme.colors.neutral[300],
        fill: theme.colors.error.main,
        thumb: theme.colors.error.main,
        label: theme.colors.text.primary,
      };
    case 'default':
    default:
      return {
        track: theme.colors.neutral[300],
        fill: theme.colors.neutral[500],
        thumb: theme.colors.neutral[700],
        label: theme.colors.text.primary,
      };
  }
};

// Helper function to get size-related styles
const getSliderSizeStyles = (size: SliderSize = 'md'): SliderSizeStyles => {
  switch (size) {
    case 'sm':
      return {
        trackHeight: 4,
        thumbSize: 16,
        labelFontSize: 12,
      };
    case 'lg':
      return {
        trackHeight: 8,
        thumbSize: 28,
        labelFontSize: 16,
      };
    case 'md':
    default:
      return {
        trackHeight: 6,
        thumbSize: 24,
        labelFontSize: 14,
      };
  }
};

// Styled Components
const SliderContainer = styled(View)`
  width: 100%;
  padding-vertical: ${theme.spacing.md}px;
  opacity: ${props => props.disabled ? 0.6 : 1};
`;

const SliderTrack = styled(View)`
  height: ${props => getSliderSizeStyles(props.size).trackHeight}px;
  background-color: ${props => getSliderColors(props.variant, props.disabled).track};
  border-radius: ${props => getSliderSizeStyles(props.size).trackHeight / 2}px;
  overflow: visible;
  position: relative;
`;

const SliderFill = styled(View)`
  position: absolute;
  height: 100%;
  background-color: ${props => getSliderColors(props.variant, props.disabled).fill};
  border-radius: ${props => getSliderSizeStyles(props.size).trackHeight / 2}px;
  left: 0;
`;

const SliderThumb = styled(Animated.View)`
  width: ${props => getSliderSizeStyles(props.size).thumbSize}px;
  height: ${props => getSliderSizeStyles(props.size).thumbSize}px;
  border-radius: ${props => getSliderSizeStyles(props.size).thumbSize / 2}px;
  background-color: ${props => getSliderColors(props.variant, props.disabled).thumb};
  position: absolute;
  top: 50%;
  margin-left: ${props => -getSliderSizeStyles(props.size).thumbSize / 2}px;
  margin-top: ${props => -getSliderSizeStyles(props.size).thumbSize / 2}px;
  ${props => !props.disabled ? theme.shadows.sm : ''}
`;

const SliderLabel = styled(Text)`
  font-size: ${props => getSliderSizeStyles(props.size).labelFontSize}px;
  color: ${props => getSliderColors(props.variant, props.disabled).label};
  margin-top: ${theme.spacing.xs}px;
  text-align: ${props => props.align || 'center'};
`;

const SliderMarker = styled(View)`
  position: absolute;
  width: 2px;
  height: ${props => getSliderSizeStyles(props.size).trackHeight * 1.5}px;
  background-color: ${props => getSliderColors(props.variant, props.disabled).track};
  top: ${props => -getSliderSizeStyles(props.size).trackHeight * 0.25}px;
`;

export {
  SliderContainer,
  SliderTrack,
  SliderFill,
  SliderThumb,
  SliderLabel,
  SliderMarker,
  getSliderColors,
  getSliderSizeStyles
};

export type { SliderVariant, SliderSize, SliderColors, SliderSizeStyles };