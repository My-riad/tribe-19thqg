import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import {
  ProgressBarContainer,
  ProgressBarTrack,
  ProgressBarFill,
  AnimatedProgressBarFill
} from './ProgressBar.styles';

/**
 * Props for the ProgressBar component
 */
export interface ProgressBarProps {
  /** Progress value between 0 and 1 (0% to 100%) */
  progress: number;
  /** Visual style variant of the progress bar */
  variant?: 'default' | 'success' | 'warning' | 'error';
  /** Size of the progress bar */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to animate progress changes */
  animated?: boolean;
  /** Duration of the animation in milliseconds */
  animationDuration?: number;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Test ID for automated testing */
  testID?: string;
  /** Additional styles to apply to the container */
  style?: object;
}

/**
 * A customizable progress bar component that visualizes completion progress
 * 
 * @example
 * // Basic usage
 * <ProgressBar progress={0.5} />
 * 
 * // With custom variant and size
 * <ProgressBar progress={0.75} variant="success" size="lg" />
 * 
 * // Non-animated with custom duration
 * <ProgressBar progress={0.3} animated={false} />
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'default',
  size = 'md',
  animated = true,
  animationDuration = 300,
  accessibilityLabel = 'Progress indicator',
  testID,
  style,
}) => {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  // Animation value for the progress bar width
  const widthAnim = useRef(new Animated.Value(clampedProgress)).current;
  
  // Update animation when progress changes
  useEffect(() => {
    if (animated) {
      Animated.timing(widthAnim, {
        toValue: clampedProgress,
        duration: animationDuration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false, // Width animation isn't supported by native driver
      }).start();
    } else {
      // Immediately set value without animation
      widthAnim.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, animationDuration, widthAnim]);
  
  return (
    <ProgressBarContainer 
      style={style}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(clampedProgress * 100),
      }}
    >
      <ProgressBarTrack variant={variant} size={size}>
        {animated ? (
          <AnimatedProgressBarFill
            variant={variant}
            style={{
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        ) : (
          <ProgressBarFill
            variant={variant}
            width={clampedProgress}
          />
        )}
      </ProgressBarTrack>
    </ProgressBarContainer>
  );
};

export default ProgressBar;