/**
 * Jest configuration file for Tribe mobile application
 * This file configures the Jest testing environment for the React Native application.
 * 
 * @version 1.0.0
 */

module.exports = {
  // Use the Jest Expo preset for React Native testing
  preset: 'jest-expo',

  // Transform all files except specific node_modules that should be transformed
  // This is necessary because some React Native libraries require transformation
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-native-.*|@react-navigation/.*|@rneui/.*|expo-.*)'
  ],

  // Setup files to run before each test suite
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  // Configure which files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/mocks/**',
    '!src/assets/**',
    '!src/index.ts',
    '!src/**/*.styles.ts'
  ],

  // Module name mappers for assets and path aliases
  moduleNameMapper: {
    // Asset file mocks
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    
    // Path aliases for cleaner imports
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1'
  },

  // Set test environment
  testEnvironment: 'node',

  // Paths to ignore while testing
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/'
  ],

  // Detailed output during test runs
  verbose: true,

  // File extensions to consider for tests
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],

  // Global variables to define in the test environment
  globals: {
    __DEV__: true
  },

  // Coverage thresholds to enforce
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  },

  // Watch plugins for better developer experience during test watching
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
};