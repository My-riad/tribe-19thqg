import styled from 'styled-components/native';
import { Animated, View } from 'react-native';
import { colors, spacing } from '../../../theme';

// Types
export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'error';
export type ProgressBarSize = 'sm' | 'md' | 'lg';

export interface ProgressBarColors {
  track: string;
  fill: string;
}

export interface StyledProgressBarProps {
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  width?: number;
}

// Utility functions
export const getProgressBarColors = (variant?: ProgressBarVariant): ProgressBarColors => {
  switch (variant) {
    case 'success':
      return {
        track: colors.success.light,
        fill: colors.success.main,
      };
    case 'warning':
      return {
        track: colors.warning.light,
        fill: colors.warning.main,
      };
    case 'error':
      return {
        track: colors.error.light,
        fill: colors.error.main,
      };
    case 'default':
    default:
      return {
        track: colors.primary.light,
        fill: colors.primary.main,
      };
  }
};

export const getProgressBarHeight = (size?: ProgressBarSize): number => {
  switch (size) {
    case 'sm':
      return 4;
    case 'lg':
      return 12;
    case 'md':
    default:
      return 8;
  }
};

// Styled components
export const ProgressBarContainer = styled(View)`
  width: 100%;
  overflow: hidden;
  border-radius: ${spacing.xs}px;
  background-color: transparent;
  ${props => props.style || ''}
`;

export const ProgressBarTrack = styled(View)<StyledProgressBarProps>`
  width: 100%;
  height: ${props => getProgressBarHeight(props.size)}px;
  background-color: ${props => getProgressBarColors(props.variant).track};
  border-radius: ${spacing.xs}px;
  overflow: hidden;
`;

export const ProgressBarFill = styled(View)<StyledProgressBarProps>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: ${props => getProgressBarColors(props.variant).fill};
  border-radius: ${spacing.xs}px;
  width: ${props => `${props.width * 100}%`};
`;

export const AnimatedProgressBarFill = styled(Animated.View)<StyledProgressBarProps>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: ${props => getProgressBarColors(props.variant).fill};
  border-radius: ${spacing.xs}px;
`;