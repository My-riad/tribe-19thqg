import React, { useRef, useEffect, useState } from 'react';
import { Animated, Image, ImageSourcePropType } from 'react-native';
import { 
  Container, 
  Spinner, 
  AnimatedSpinner, 
  LoadingText 
} from './LoadingIndicator.styles';
import { loadingSpinner, checkReducedMotion } from '../../theme';

/**
 * Props for the LoadingIndicator component
 */
export interface LoadingIndicatorProps {
  /** Size of the loading indicator */
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  /** Color theme of the loading indicator */
  color?: 'primary' | 'secondary' | 'white' | 'neutral';
  /** Whether to display the loading indicator fullscreen */
  fullscreen?: boolean;
  /** Whether to show a semi-transparent background overlay */
  overlay?: boolean;
  /** Whether to use a transparent background */
  transparent?: boolean;
  /** Optional text to display below the spinner */
  text?: string;
  /** Test ID for component testing */
  testID?: string;
  /** Whether to use custom animation instead of native ActivityIndicator */
  useCustomAnimation?: boolean;
  /** Custom image to use for the spinner (requires useCustomAnimation=true) */
  customSpinnerImage?: ImageSourcePropType;
}

/**
 * A customizable loading indicator component that displays a spinner with optional text.
 * Supports different sizes, colors, fullscreen mode, overlay mode, and custom animations.
 * Respects reduced motion accessibility preferences.
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'medium',
  color = 'primary',
  fullscreen = false,
  overlay = false,
  transparent = false,
  text,
  testID = 'loading-indicator',
  useCustomAnimation = false,
  customSpinnerImage
}) => {
  // Create a ref for the animated rotation value
  const rotationValue = useRef(new Animated.Value(0)).current;
  
  // State to track reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // Check for reduced motion preference
  useEffect(() => {
    const checkMotionPreference = async () => {
      const isReducedMotion = await checkReducedMotion();
      setReducedMotion(isReducedMotion);
    };
    
    checkMotionPreference();
  }, []);
  
  // Start the animation when the component mounts
  useEffect(() => {
    const animation = loadingSpinner(rotationValue, { isReducedMotion: reducedMotion });
    animation.start();
    
    // Clean up the animation when the component unmounts
    return () => {
      animation.stop();
    };
  }, [rotationValue, reducedMotion]);
  
  // Interpolate the rotation value to create a spin animation
  const spin = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  return (
    <Container 
      fullscreen={fullscreen} 
      overlay={overlay} 
      transparent={transparent}
      testID={testID}
      accessibilityRole="progressbar"
    >
      {useCustomAnimation ? (
        <AnimatedSpinner size={size} style={{ transform: [{ rotate: spin }] }}>
          {customSpinnerImage ? (
            <Image 
              source={customSpinnerImage} 
              resizeMode="contain"
              accessibilityLabel="Loading"
            />
          ) : null}
        </AnimatedSpinner>
      ) : (
        <Spinner 
          size={size} 
          color={color}
          accessibilityLabel="Loading" 
        />
      )}
      
      {text ? (
        <LoadingText color={color}>
          {text}
        </LoadingText>
      ) : null}
    </Container>
  );
};

export default LoadingIndicator;