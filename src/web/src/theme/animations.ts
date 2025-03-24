import { Animated, Easing, Platform, AccessibilityInfo } from 'react-native';

// Standard animation durations (in milliseconds)
export const timings = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Easing function presets
export const easings = {
  standard: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design standard easing
  accelerate: Easing.bezier(0.4, 0.0, 1.0, 1.0), // Accelerate easing
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1.0), // Decelerate easing
  sharp: Easing.bezier(0.4, 0.0, 0.6, 1.0), // Sharp curve for quick animations
  elastic: Easing.elastic(0.7), // Elastic bounce effect
  bounce: Easing.bounce, // Bouncy feel for playful animations
};

/**
 * Checks if the user has enabled reduced motion accessibility setting
 * @returns Promise that resolves to true if reduced motion is enabled
 */
export const checkReducedMotion = async (): Promise<boolean> => {
  return await AccessibilityInfo.isReduceMotionEnabled();
};

// Minimum duration for reduced motion (very quick but not 0)
const REDUCED_MOTION_DURATION = 10;

/**
 * Helper to adjust duration based on reduced motion preference
 */
const getAdjustedDuration = (duration: number, isReducedMotion: boolean): number => {
  return isReducedMotion ? REDUCED_MOTION_DURATION : duration;
};

/**
 * Creates a fade-in animation that transitions opacity from 0 to 1
 * @param animatedValue - Animated value to be used for the animation
 * @param options - Configuration options for the animation
 * @returns Animation object that can be started, stopped, or reset
 */
export const fadeIn = (
  animatedValue: Animated.Value,
  options: { 
    duration?: number; 
    easing?: Easing.EasingFunction; 
    useNativeDriver?: boolean;
    isReducedMotion?: boolean;
  } = {}
): Animated.CompositeAnimation => {
  const { 
    duration = timings.normal, 
    easing = easings.standard,
    useNativeDriver = true,
    isReducedMotion = false
  } = options;
  
  const adjustedDuration = getAdjustedDuration(duration, isReducedMotion);
  
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration: adjustedDuration,
    easing,
    useNativeDriver,
  });
};

/**
 * Creates a fade-out animation that transitions opacity from 1 to 0
 * @param animatedValue - Animated value to be used for the animation
 * @param options - Configuration options for the animation
 * @returns Animation object that can be started, stopped, or reset
 */
export const fadeOut = (
  animatedValue: Animated.Value,
  options: { 
    duration?: number; 
    easing?: Easing.EasingFunction; 
    useNativeDriver?: boolean;
    isReducedMotion?: boolean;
  } = {}
): Animated.CompositeAnimation => {
  const { 
    duration = timings.normal, 
    easing = easings.standard,
    useNativeDriver = true,
    isReducedMotion = false
  } = options;
  
  const adjustedDuration = getAdjustedDuration(duration, isReducedMotion);
  
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration: adjustedDuration,
    easing,
    useNativeDriver,
  });
};

/**
 * Creates a scale-in animation that transitions scale from a smaller value to 1
 * @param animatedValue - Animated value to be used for the animation
 * @param options - Configuration options for the animation
 * @returns Animation object that can be started, stopped, or reset
 */
export const scaleIn = (
  animatedValue: Animated.Value,
  options: { 
    duration?: number; 
    easing?: Easing.EasingFunction; 
    fromValue?: number;
    useNativeDriver?: boolean;
    isReducedMotion?: boolean;
  } = {}
): Animated.CompositeAnimation => {
  const { 
    duration = timings.normal, 
    easing = easings.standard,
    fromValue = 0.8,
    useNativeDriver = true,
    isReducedMotion = false
  } = options;
  
  const adjustedDuration = getAdjustedDuration(duration, isReducedMotion);
  
  // If reduced motion, start closer to the final value
  animatedValue.setValue(isReducedMotion ? 0.95 : fromValue);
  
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration: adjustedDuration,
    easing,
    useNativeDriver,
  });
};

/**
 * Creates a scale-out animation that transitions scale from 1 to a smaller value
 * @param animatedValue - Animated value to be used for the animation
 * @param options - Configuration options for the animation
 * @returns Animation object that can be started, stopped, or reset
 */
export const scaleOut = (
  animatedValue: Animated.Value,
  options: { 
    duration?: number; 
    easing?: Easing.EasingFunction; 
    toValue?: number;
    useNativeDriver?: boolean;
    isReducedMotion?: boolean;
  } = {}
): Animated.CompositeAnimation => {
  const { 
    duration = timings.normal, 
    easing = easings.standard,
    toValue = 0.8,
    useNativeDriver = true,
    isReducedMotion = false
  } = options;
  
  const adjustedDuration = getAdjustedDuration(duration, isReducedMotion);
  // If reduced motion, animate to a value closer to the starting value
  const adjustedToValue = isReducedMotion ? 0.95 : toValue;
  
  return Animated.timing(animatedValue, {
    toValue: adjustedToValue,
    duration: adjustedDuration,
    easing,
    useNativeDriver,
  });
};

/**
 * Creates a slide-in-up animation that transitions translateY from a positive value to 0
 * @param animatedValue - Animated value to be used for the animation
 * @param options - Configuration options for the animation
 * @returns Animation object that can be started, stopped, or reset
 */
export const slideInUp = (
  animatedValue: Animated.Value,
  options: { 
    duration?: number; 
    easing?: Easing.EasingFunction; 
    fromValue?: number;
    useNativeDriver?: boolean;
    isReducedMotion?: boolean;
  } = {}
): Animated.CompositeAnimation => {
  const { 
    duration = timings.normal, 
    easing = easings.standard,
    fromValue = 100, // Default 100 pixels from bottom
    useNativeDriver = true,
    isReducedMotion = false
  } = options;
  
  const adjustedDuration = getAdjustedDuration(duration, isReducedMotion);
  // If reduced motion, start closer to the final position
  const adjustedFromValue = isReducedMotion ? 10 : fromValue;
  
  animatedValue.setValue(adjustedFromValue);
  
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration: adjustedDuration,
    easing,
    useNativeDriver,
  });
};

/**
 * Creates a slide-out-down animation that transitions translateY from 0 to a positive value
 * @param animatedValue - Animated value to be used for the animation
 * @param options - Configuration options for the animation
 * @returns Animation object that can be started, stopped, or reset
 */
export const slideOutDown = (
  animatedValue: Animated.Value,
  options: { 
    duration?: number; 
    easing?: Easing.EasingFunction; 
    toValue?: number;
    useNativeDriver?: boolean;
    isReducedMotion?: boolean;
  } = {}
): Animated.CompositeAnimation => {
  const { 
    duration = timings.normal, 
    easing = easings.standard,
    toValue = 100, // Default 100 pixels down
    useNativeDriver = true,
    isReducedMotion = false
  } = options;
  
  const adjustedDuration = getAdjustedDuration(duration, isReducedMotion);
  // If reduced motion, animate to a position closer to the starting position
  const adjustedToValue = isReducedMotion ? 10 : toValue;
  
  return Animated.timing(animatedValue, {
    toValue: adjustedToValue,
    duration: adjustedDuration,
    easing,
    useNativeDriver,
  });
};

/**
 * Creates a button press animation that slightly scales down on press and returns to normal on release
 * @param animatedValue - Animated value to be used for the animation
 * @param options - Configuration options for the animation
 * @returns Object containing pressIn and pressOut animation functions
 */
export const buttonPress = (
  animatedValue: Animated.Value,
  options: { 
    scaleFactor?: number; 
    duration?: number;
    useNativeDriver?: boolean;
    isReducedMotion?: boolean;
  } = {}
) => {
  const { 
    scaleFactor = 0.95, 
    duration = timings.fast, 
    useNativeDriver = true,
    isReducedMotion = false
  } = options;
  
  const adjustedDuration = getAdjustedDuration(duration, isReducedMotion);
  // For button press feedback, provide subtle feedback even with reduced motion
  const adjustedScaleFactor = isReducedMotion ? 0.98 : scaleFactor;
  
  const pressIn = () => {
    return Animated.timing(animatedValue, {
      toValue: adjustedScaleFactor,
      duration: adjustedDuration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver,
    });
  };
  
  const pressOut = () => {
    return Animated.timing(animatedValue, {
      toValue: 1,
      duration: adjustedDuration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver,
    });
  };
  
  return {
    pressIn,
    pressOut,
  };
};

/**
 * Creates a continuous rotation animation for loading spinners
 * @param animatedValue - Animated value to be used for the animation
 * @param options - Configuration options for the animation
 * @returns Animation object that can be started, stopped, or reset
 */
export const loadingSpinner = (
  animatedValue: Animated.Value,
  options: { 
    duration?: number;
    useNativeDriver?: boolean;
    isReducedMotion?: boolean;
  } = {}
): Animated.CompositeAnimation => {
  const { 
    duration = 1500, 
    useNativeDriver = true,
    isReducedMotion = false
  } = options;
  
  // For loading indicators, slow them down for reduced motion but don't eliminate animation
  const adjustedDuration = isReducedMotion ? duration * 1.5 : duration;
  
  // Reset the value
  animatedValue.setValue(0);
  
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: adjustedDuration,
      easing: Easing.linear,
      useNativeDriver,
    })
  );
};

/**
 * Utility function to create animated style objects for React Native components
 * @param animatedValues - Object containing animated values
 * @param styleConfig - Configuration for mapping animated values to styles
 * @returns Animated style object that can be applied to React Native components
 */
export const createAnimatedStyle = (
  animatedValues: Record<string, Animated.Value>,
  styleConfig: Record<string, any>
) => {
  const animatedStyle: Record<string, any> = {};
  
  Object.keys(styleConfig).forEach(key => {
    const config = styleConfig[key];
    const animValue = animatedValues[key];
    
    if (!animValue) return;
    
    if (config.interpolate) {
      animatedStyle[config.property || key] = animValue.interpolate(config.interpolate);
    } else {
      animatedStyle[config.property || key] = animValue;
    }
  });
  
  return animatedStyle;
};