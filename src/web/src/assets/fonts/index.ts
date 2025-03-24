import { Asset } from 'react-native'; // Version ^0.72.0

// Type definitions
/**
 * Type definition for a font asset reference in React Native
 */
export type FontAsset = number;

/**
 * Type definition for a font family with different weights
 */
export type FontFamily = {
  regular: FontAsset;
  medium: FontAsset;
  semiBold?: FontAsset;
  bold: FontAsset;
};

/**
 * San Francisco font family assets for iOS devices
 */
export const sanFrancisco: FontFamily = {
  regular: require('./SanFrancisco-Regular.ttf'),
  medium: require('./SanFrancisco-Medium.ttf'),
  semiBold: require('./SanFrancisco-SemiBold.ttf'),
  bold: require('./SanFrancisco-Bold.ttf'),
};

/**
 * Roboto font family assets for Android devices
 */
export const roboto: FontFamily = {
  regular: require('./Roboto-Regular.ttf'),
  medium: require('./Roboto-Medium.ttf'),
  semiBold: require('./Roboto-SemiBold.ttf'),
  bold: require('./Roboto-Bold.ttf'),
};

/**
 * Monospace font family assets for code or technical content
 */
export const monospace: FontFamily = {
  regular: require('./RobotoMono-Regular.ttf'),
  medium: require('./RobotoMono-Medium.ttf'),
  bold: require('./RobotoMono-Bold.ttf'),
};

/**
 * Map of font family names to their file paths for asset loading
 */
export const fontPaths: Record<string, any> = {
  'SanFrancisco-Regular': sanFrancisco.regular,
  'SanFrancisco-Medium': sanFrancisco.medium,
  'SanFrancisco-SemiBold': sanFrancisco.semiBold,
  'SanFrancisco-Bold': sanFrancisco.bold,
  'Roboto-Regular': roboto.regular,
  'Roboto-Medium': roboto.medium,
  'Roboto-SemiBold': roboto.semiBold,
  'Roboto-Bold': roboto.bold,
  'RobotoMono-Regular': monospace.regular,
  'RobotoMono-Medium': monospace.medium,
  'RobotoMono-Bold': monospace.bold,
};

/**
 * Utility function to preload custom fonts for the application
 * @returns Promise that resolves when fonts are loaded
 */
export const loadFonts = async (): Promise<void> => {
  try {
    // Preload all font assets using Asset from react-native
    const fontAssets = Object.values(fontPaths).map(font => 
      Asset.fromModule(font).downloadAsync()
    );
    
    // Wait for all fonts to load
    await Promise.all(fontAssets);
    console.log('Fonts loaded successfully');
  } catch (error) {
    console.error('Failed to load fonts:', error);
    throw error; // Re-throw to allow calling code to handle the error
  }
};