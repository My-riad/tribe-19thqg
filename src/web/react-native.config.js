/**
 * React Native CLI Configuration
 * This file configures the React Native CLI to properly integrate native modules
 * and manage project settings for the Tribe mobile application.
 * 
 * It defines platform-specific configurations, native dependencies, and asset paths
 * to ensure consistent behavior across iOS and Android platforms.
 */

module.exports = {
  // Project configuration for iOS and Android platforms
  project: {
    // iOS-specific project configuration
    ios: {
      sourceDir: './ios',
      podfile: './ios/Podfile',
      xcodeProject: './ios/TribeMobile.xcodeproj',
      automaticPodsInstallation: true,
    },
    // Android-specific project configuration
    android: {
      sourceDir: './android',
      manifestPath: './android/app/src/main/AndroidManifest.xml',
      packageName: 'com.tribemobile',
      buildGradlePath: './android/build.gradle',
      settingsGradlePath: './android/settings.gradle',
      assetsPath: './android/app/src/main/assets',
    },
  },
  
  // Native module dependencies configuration
  dependencies: {
    // Maps integration for location-based features
    'react-native-maps': {
      platforms: {
        ios: {
          podspecPath: '../node_modules/react-native-maps',
        },
        android: {
          sourceDir: '../node_modules/react-native-maps/android',
          packageImportPath: 'import com.airbnb.android.react.maps.MapsPackage;',
          packageInstance: 'new MapsPackage()',
        },
      },
    },
    // Gesture handling for interactive UI elements
    'react-native-gesture-handler': {
      platforms: {
        ios: null,
        android: null,
      },
    },
    // Animation library for smooth UI transitions
    'react-native-reanimated': {
      platforms: {
        ios: null,
        android: null,
      },
    },
    // Firebase core functionality
    '@react-native-firebase/app': {
      platforms: {
        ios: null,
        android: null,
      },
    },
    // Push notifications via Firebase
    '@react-native-firebase/messaging': {
      platforms: {
        ios: null,
        android: null,
      },
    },
    // Native date and time picker
    '@react-native-community/datetimepicker': {
      platforms: {
        ios: null,
        android: null,
      },
    },
    // SVG support for vector graphics
    'react-native-svg': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
  
  // Asset paths for fonts and images
  assets: [
    './src/assets/fonts/',
    './src/assets/images/',
  ],
};