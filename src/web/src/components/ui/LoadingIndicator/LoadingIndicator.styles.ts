import styled from 'styled-components/native';
import { View, ActivityIndicator, Text, Animated } from 'react-native';
import { colors, spacing, typography } from '../../theme';

/**
 * Helper function to convert size prop to numeric values for the spinner
 * @param size - Size category (small, medium, large, xlarge)
 * @returns Numeric size value in pixels
 */
const getSizeValue = (size: 'small' | 'medium' | 'large' | 'xlarge'): number => {
  switch (size) {
    case 'small':
      return 16;
    case 'medium':
      return 24;
    case 'large':
      return 36;
    case 'xlarge':
      return 48;
    default:
      return 24; // Default to medium
  }
};

/**
 * Helper function to convert color prop to actual color values from the theme
 * @param colorProp - Color category (primary, secondary, white, neutral)
 * @returns Actual color value from theme
 */
const getColorValue = (colorProp: 'primary' | 'secondary' | 'white' | 'neutral'): string => {
  switch (colorProp) {
    case 'primary':
      return colors.primary.main;
    case 'secondary':
      return colors.secondary.main;
    case 'white':
      return colors.text.contrast;
    case 'neutral':
      return colors.neutral[500];
    default:
      return colors.primary.main; // Default to primary
  }
};

/**
 * Container component for the loading indicator
 * Props:
 * - fullscreen: Expands to fill the entire screen
 * - overlay: Adds a semi-transparent background
 * - transparent: Makes the background transparent
 */
const Container = styled(View)<{ 
  fullscreen?: boolean; 
  overlay?: boolean; 
  transparent?: boolean;
}>`
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${spacing.md}px;
  
  ${({ fullscreen }) => fullscreen && `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
  `}
  
  ${({ overlay }) => overlay && `
    background-color: rgba(0, 0, 0, 0.5);
  `}
  
  ${({ transparent }) => transparent && `
    background-color: transparent;
  `}
`;

/**
 * Spinner component based on ActivityIndicator
 * Props:
 * - size: Spinner size (small, medium, large, xlarge)
 * - color: Spinner color (primary, secondary, white, neutral)
 */
const Spinner = styled(ActivityIndicator)<{
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  color?: 'primary' | 'secondary' | 'white' | 'neutral';
}>`
  ${({ size }) => size && `
    width: ${getSizeValue(size)}px;
    height: ${getSizeValue(size)}px;
  `}
  
  margin: ${spacing.sm}px 0;
`;

/**
 * Animated spinner for custom rotation animations
 * Props:
 * - size: Spinner size (small, medium, large, xlarge)
 */
const AnimatedSpinner = styled(Animated.View)<{
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}>`
  ${({ size }) => size && `
    width: ${getSizeValue(size)}px;
    height: ${getSizeValue(size)}px;
  `}
  
  align-items: center;
  justify-content: center;
  margin: ${spacing.sm}px 0;
`;

/**
 * Text component for loading message
 * Props:
 * - color: Text color (primary, secondary, white, neutral)
 */
const LoadingText = styled(Text)<{
  color?: 'primary' | 'secondary' | 'white' | 'neutral';
}>`
  font-family: ${typography.textStyles.caption.fontFamily};
  font-size: ${typography.textStyles.caption.fontSize}px;
  font-weight: ${typography.textStyles.caption.fontWeight};
  line-height: ${typography.textStyles.caption.lineHeight}px;
  color: ${({ color }) => color ? getColorValue(color) : colors.text.primary};
  margin-top: ${spacing.sm}px;
  text-align: center;
`;

export {
  Container,
  Spinner,
  AnimatedSpinner,
  LoadingText
};