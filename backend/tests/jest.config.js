/**
 * Jest configuration for Tribe platform backend tests
 * 
 * This configuration is specifically designed for integration and end-to-end tests
 * that run across multiple microservices. It includes settings for TypeScript support,
 * path mappings to all services, coverage reporting, and test execution parameters.
 */

module.exports = {
  // Use ts-jest for TypeScript support
  preset: 'ts-jest',
  
  // Node environment for backend tests
  testEnvironment: 'node',
  
  // Test file locations
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // TypeScript transformation
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Path mappings for services and shared modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
    '^@shared/(.*)$': '<rootDir>/../src/shared/src/$1',
    '^@config/(.*)$': '<rootDir>/../src/config/$1',
    '^@auth/(.*)$': '<rootDir>/../src/auth-service/src/$1',
    '^@profile/(.*)$': '<rootDir>/../src/profile-service/src/$1',
    '^@tribe/(.*)$': '<rootDir>/../src/tribe-service/src/$1',
    '^@event/(.*)$': '<rootDir>/../src/event-service/src/$1',
    '^@matching/(.*)$': '<rootDir>/../src/matching-service/src/$1',
    '^@engagement/(.*)$': '<rootDir>/../src/engagement-service/src/$1',
    '^@planning/(.*)$': '<rootDir>/../src/planning-service/src/$1',
    '^@payment/(.*)$': '<rootDir>/../src/payment-service/src/$1',
    '^@notification/(.*)$': '<rootDir>/../src/notification-service/src/$1',
    '^@ai-orchestration/(.*)$': '<rootDir>/../src/ai-orchestration-service/src/$1'
  },
  
  // Setup files to run after environment is set up
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  
  // Code coverage configuration
  collectCoverage: true,
  coverageDirectory: '../coverage/tests',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Test execution configuration
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  globals: {
    'ts-jest': {
      tsconfig: '../tsconfig.json'
    }
  },
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
  maxWorkers: '50%',
  
  // Custom test sequencer for controlling test execution order
  testSequencer: '<rootDir>/testSequencer.js',
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  
  // Reporters for test results
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '../reports/tests',
      outputName: 'junit.xml'
    }]
  ],
  
  // Additional configuration
  bail: 0,
  detectOpenHandles: true,
  errorOnDeprecated: true
};