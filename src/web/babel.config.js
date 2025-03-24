module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      '@babel/preset-typescript',
      'module:metro-react-native-babel-preset',
    ],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@api': './src/api',
          '@store': './src/store',
          '@utils': './src/utils',
          '@hooks': './src/hooks',
          '@services': './src/services',
          '@assets': './src/assets',
          '@constants': './src/constants',
          '@theme': './src/theme',
          '@types': './src/types',
        },
      }],
      'react-native-reanimated/plugin',
    ],
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
      test: {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
        ],
        plugins: [
          ['module-resolver', {
            root: ['./src'],
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
            alias: {
              '@components': './src/components',
              '@screens': './src/screens',
              '@navigation': './src/navigation',
              '@api': './src/api',
              '@store': './src/store',
              '@utils': './src/utils',
              '@hooks': './src/hooks',
              '@services': './src/services',
              '@assets': './src/assets',
              '@constants': './src/constants',
              '@theme': './src/theme',
              '@types': './src/types',
            },
          }],
        ],
      },
    },
  };
};