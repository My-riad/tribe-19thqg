import { Asset, ImageSourcePropType } from 'react-native';

// Logo Images
export const logoImage: ImageSourcePropType = require('./logo/logo.png');
export const logoImageWhite: ImageSourcePropType = require('./logo/logo-white.png');
export const logoImageSmall: ImageSourcePropType = require('./logo/logo-small.png');

// Default Avatars and Placeholders
export const defaultUserAvatar: ImageSourcePropType = require('./placeholders/default-user-avatar.png');
export const defaultTribeAvatar: ImageSourcePropType = require('./placeholders/default-tribe-avatar.png');
export const defaultEventImage: ImageSourcePropType = require('./placeholders/default-event-image.png');

// Onboarding Images
export const onboardingImages = {
  welcome: require('./onboarding/welcome.png'),
  personality: require('./onboarding/personality.png'),
  interests: require('./onboarding/interests.png'),
  location: require('./onboarding/location.png'),
};

// Background Images
export const backgroundImages = {
  welcome: require('./backgrounds/welcome-bg.png'),
  auth: require('./backgrounds/auth-bg.png'),
  profile: require('./backgrounds/profile-bg.png'),
};

// Illustration Images
export const illustrationImages = {
  emptyState: require('./illustrations/empty-state.png'),
  noEvents: require('./illustrations/no-events.png'),
  noTribes: require('./illustrations/no-tribes.png'),
  noNotifications: require('./illustrations/no-notifications.png'),
  matchSuccess: require('./illustrations/match-success.png'),
};

// Activity Category Images
export const activityImages = {
  outdoor: require('./activities/outdoor.png'),
  food: require('./activities/food.png'),
  arts: require('./activities/arts.png'),
  sports: require('./activities/sports.png'),
  games: require('./activities/games.png'),
  learning: require('./activities/learning.png'),
  technology: require('./activities/technology.png'),
  wellness: require('./activities/wellness.png'),
};

// Achievement Badge Images
export const achievementBadges = {
  socialButterfly: require('./badges/social-butterfly.png'),
  explorer: require('./badges/explorer.png'),
  consistent: require('./badges/consistent.png'),
  organizer: require('./badges/organizer.png'),
  photographer: require('./badges/photographer.png'),
};

// Social Media Icons
export const socialIcons = {
  google: require('./social/google.png'),
  apple: require('./social/apple.png'),
  facebook: require('./social/facebook.png'),
};

/**
 * Preloads commonly used images for better performance
 * @returns Promise that resolves when images are loaded
 */
export const preloadImages = async (): Promise<void> => {
  try {
    // Preload critical images that should be available immediately
    await Asset.loadAsync([
      logoImage,
      defaultUserAvatar,
      defaultTribeAvatar,
      onboardingImages.welcome,
      backgroundImages.welcome,
      socialIcons.google,
      socialIcons.apple,
      socialIcons.facebook,
    ]);
    console.log('Images preloaded successfully');
  } catch (error) {
    console.error('Failed to preload images', error);
  }
};