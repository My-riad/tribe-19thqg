/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * This configuration handles JavaScript/TypeScript module resolution,
 * asset transformations, and bundling optimizations for the Tribe application.
 * 
 * @format
 */

// Get the default Metro configuration from Expo and core metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Create a custom configuration by extending the default config
module.exports = (async () => {
  // Get the default Expo configuration
  const defaultConfig = await getDefaultConfig(__dirname);
  
  // Define the asset extensions that Metro should handle
  const assetExts = defaultConfig.resolver.assetExts || [];
  // Define the source file extensions that Metro should process
  const sourceExts = defaultConfig.resolver.sourceExts || [];
  
  return {
    transformer: {
      // Use react-native-svg-transformer to handle SVG files as React components
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
      // Use Expo's asset plugins for file hashing
      assetPlugins: ['expo-asset/tools/hashAssetFiles'],
      // Preserve class names and function names during minification
      // Important for proper function of libraries that rely on function names
      minifierConfig: {
        keep_classnames: true,
        keep_fnames: true,
        mangle: {
          keep_classnames: true,
          keep_fnames: true,
        },
      },
    },
    
    resolver: {
      // Asset extensions that can be loaded via the asset system
      assetExts: [
        ...assetExts.filter(ext => ext !== 'svg'),
        'bmp',
        'gif',
        'jpg',
        'jpeg',
        'png',
        'webp',
        'ttf',
        'otf',
        'json',
        'lottie',
      ],
      
      // Source file extensions to resolve
      sourceExts: [...sourceExts, 'svg'],
      
      // Path aliases for cleaner imports
      extraNodeModules: {
        '@components': path.resolve(__dirname, 'src/components'),
        '@screens': path.resolve(__dirname, 'src/screens'),
        '@navigation': path.resolve(__dirname, 'src/navigation'),
        '@api': path.resolve(__dirname, 'src/api'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@constants': path.resolve(__dirname, 'src/constants'),
        '@theme': path.resolve(__dirname, 'src/theme'),
        '@types': path.resolve(__dirname, 'src/types'),
      },
    },
    
    // Additional folders to watch for changes
    watchFolders: [path.resolve(__dirname, 'src')],
    
    // Limit parallelization to avoid excessive CPU usage
    maxWorkers: 4,
    
    // Do not reset cache by default to improve build performance
    resetCache: false,
    
    // Server configuration
    server: {
      port: 8081, // Default Metro bundler port
    },
  };
})();