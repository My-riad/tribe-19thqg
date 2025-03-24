import { Asset } from 'react-native';

/**
 * Loading spinner animation - used for loading states throughout the app
 */
export const loadingSpinner = {
  source: require('./loading-spinner.json')
};

/**
 * Empty state animation - used when lists have no content
 */
export const emptyState = {
  source: require('./empty-state.json')
};

/**
 * Success check animation - used for confirming successful actions
 */
export const successCheck = {
  source: require('./success-check.json')
};

/**
 * Error animation - used to indicate error states
 */
export const errorAnimation = {
  source: require('./error-animation.json')
};

/**
 * Confetti animation - used for celebrations and achievements
 */
export const confetti = {
  source: require('./confetti.json')
};

/**
 * Match animation - displayed when a user is successfully matched with a tribe
 */
export const matchAnimation = {
  source: require('./match-animation.json')
};

/**
 * Pulse animation - used for highlighting elements that need attention
 */
export const pulseAnimation = {
  source: require('./pulse-animation.json')
};

/**
 * Typing indicator animation - shows when someone is typing in chat
 */
export const typingIndicator = {
  source: require('./typing-indicator.json')
};

/**
 * Location pin animation - used when dropping pins on maps
 */
export const locationPin = {
  source: require('./location-pin.json')
};

/**
 * Collection of animations used in the onboarding flow
 */
export const onboardingAnimations = {
  welcome: {
    source: require('./onboarding/welcome.json')
  },
  personality: {
    source: require('./onboarding/personality.json')
  },
  location: {
    source: require('./onboarding/location.json')
  },
  tribes: {
    source: require('./onboarding/tribes.json')
  }
};

/**
 * Default configuration options for Lottie animations
 * Can be overridden when needed for specific animations
 */
export const animationConfig = {
  loop: true,
  autoplay: true,
  renderMode: 'AUTOMATIC' as const
};

/**
 * Preloads commonly used animations for better performance
 * Call this function during app initialization to prevent animation jank
 * when they're first displayed
 * 
 * @returns Promise that resolves when all animations are loaded
 */
export const preloadAnimations = (): Promise<void[]> => {
  // List of animations that should be preloaded for better performance
  const animationsToPreload = [
    loadingSpinner.source,
    successCheck.source,
    errorAnimation.source,
    // Add more animations as needed based on frequency of use
  ];

  // Using React Native's Asset API to preload the animations
  return Promise.all(
    animationsToPreload.map(animation => 
      Asset.fromModule(animation).downloadAsync()
    )
  );
};