import 'react-native-gesture-handler/jestSetup';

// Mock react-native modules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  LocationAccuracy: {
    High: 'high',
    Balanced: 'balanced',
    Low: 'low',
  },
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => (
      React.createElement(View, { ...props, ref, testID: 'map-view' })
    )),
    Marker: (props) => React.createElement(View, { ...props, testID: 'marker' }),
    Callout: (props) => React.createElement(View, { ...props, testID: 'callout' }),
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock locationAlertsService
jest.mock('./src/services/locationAlertsService', () => ({
  __esModule: true,
  default: {
    checkSafeZoneViolations: jest.fn(),
    checkBatteryLevel: jest.fn(),
    checkSignalStatus: jest.fn(),
  },
}));

// Mock Supabase
jest.mock('./src/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Global test utilities
global.console = {
  ...console,
  // Uncomment to ignore specific log levels
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Animated for tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Silence the warning about act() calls
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    return originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
