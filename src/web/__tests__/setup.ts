import '@testing-library/jest-native/extend-expect'; // version 5.4.2
import { enableFetchMocks } from 'jest-fetch-mock'; // version 3.0.3

// Enable fetch mocks
enableFetchMocks();

// Mock react-native modules that aren't available in the test environment
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
  __esModule: true,
  default: {
    startOperationBatch: jest.fn(),
    finishOperationBatch: jest.fn(),
    createAnimatedNode: jest.fn(),
    setValue: jest.fn(),
    setOffset: jest.fn(),
    flattenAnimatedNodeOffset: jest.fn(),
    extractAnimatedNodeOffset: jest.fn(),
    connectAnimatedNodes: jest.fn(),
    disconnectAnimatedNodes: jest.fn(),
    startAnimatingNode: jest.fn(),
    stopAnimation: jest.fn(),
    removeAnimatedNode: jest.fn(),
  },
}));

// Mock StatusBar to prevent native module errors
jest.mock('react-native/Libraries/Components/StatusBar/StatusBar', () => ({
  setBarStyle: jest.fn(),
  setBackgroundColor: jest.fn(),
  setTranslucent: jest.fn(),
  setHidden: jest.fn(),
}));

// Mock gesture handler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: 'PanGestureHandler',
  TapGestureHandler: 'TapGestureHandler',
  ScrollView: 'ScrollView',
  State: {
    ACTIVE: 'ACTIVE',
    END: 'END',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve(null)),
    clear: jest.fn(() => Promise.resolve(null)),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve(null)),
    multiRemove: jest.fn(() => Promise.resolve(null)),
  },
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => 
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() => 
    Promise.resolve({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 0,
        accuracy: 5,
        altitudeAccuracy: 5,
        heading: 0,
        speed: 0,
      },
      timestamp: 1612156800000,
    })
  ),
  watchPositionAsync: jest.fn(() => 
    Promise.resolve({
      remove: jest.fn(),
    })
  ),
}));

// Mock React Native APIs
jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');

  return {
    ...ReactNative,
    Dimensions: {
      ...ReactNative.Dimensions,
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
    Platform: {
      ...ReactNative.Platform,
      OS: 'ios',
      select: jest.fn(obj => obj.ios),
    },
    Alert: {
      ...ReactNative.Alert,
      alert: jest.fn(),
    },
    Linking: {
      ...ReactNative.Linking,
      openURL: jest.fn(),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
    },
  };
});

// Configure Jest to use fake timers
jest.useFakeTimers();

// Mock console methods to prevent test output noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  // Suppress console output during tests to reduce noise
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    // Allow specific errors to pass through if needed for debugging
    if (args[0]?.includes('Critical error:')) {
      originalConsoleError(...args);
    }
  });
  
  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    // Allow specific warnings to pass through if needed for debugging
    if (args[0]?.includes('Important warning:')) {
      originalConsoleWarn(...args);
    }
  });
  
  jest.spyOn(console, 'log').mockImplementation(() => {
    // Completely suppress console.log during tests
  });

  // Configure global fetch mock
  global.fetch = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
  
  // Clean up any other global mocks
  jest.restoreAllMocks();
});