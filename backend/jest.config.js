/**
 * Jest configuration file for the Tribe platform backend
 * 
 * This file configures Jest for running unit tests across all microservices,
 * handling TypeScript files, setting up path mappings, and configuring coverage reporting.
 */

module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Set Node.js as the test environment
  testEnvironment: 'node',
  
  // Define root directories for test discovery
  roots: ['<rootDir>/src'],
  
  // Specify patterns for test files
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Configure TypeScript transformation
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  // Supported file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Path mapping aliases to mirror tsconfig paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1'
  },
  
  // Setup files to run after Jest is initialized
  setupFilesAfterEnv: ['<rootDir>/src/config/jest-setup.ts'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/tests/'
  ],
  
  // Patterns to ignore during test discovery
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // TypeScript configuration for ts-jest
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  
  // Additional test options
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
  maxWorkers: '50%',
  
  // Reporters for test results
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports',
      outputName: 'junit.xml'
    }]
  ],
  
  // Don't stop after first test failure
  bail: 0,
  
  // Detect open handles (like unfinished async operations)
  detectOpenHandles: true,
  
  // Show errors for deprecated Jest usage
  errorOnDeprecated: true,
  
  // Multi-project configuration for all microservices
  projects: [
    '<rootDir>/src/shared',
    '<rootDir>/src/api-gateway',
    '<rootDir>/src/auth-service',
    '<rootDir>/src/profile-service',
    '<rootDir>/src/tribe-service',
    '<rootDir>/src/matching-service',
    '<rootDir>/src/event-service',
    '<rootDir>/src/engagement-service',
    '<rootDir>/src/planning-service',
    '<rootDir>/src/payment-service',
    '<rootDir>/src/notification-service',
    '<rootDir>/src/ai-orchestration-service'
  ]
};