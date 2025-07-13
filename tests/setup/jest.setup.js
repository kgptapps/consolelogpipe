// Global Jest setup for all packages

// Extend Jest matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Global test timeout
jest.setTimeout(10000);

// Mock console methods for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  // Keep error and warn for debugging
  error: originalConsole.error,
  warn: originalConsole.warn,
  // Mock info, log, debug to reduce noise
  info: jest.fn(),
  log: jest.fn(),
  debug: jest.fn(),
};

// Global beforeEach
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Global afterEach
afterEach(() => {
  // Restore all mocks after each test
  jest.restoreAllMocks();
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Fail the test if there's an unhandled rejection
  throw reason;
});

// Global test utilities
global.testUtils = {
  // Wait for a specified time
  wait: ms => new Promise(resolve => setTimeout(resolve, ms)),

  // Create a mock function with specific behavior
  createMockFn: returnValue => jest.fn().mockReturnValue(returnValue),

  // Create a mock promise
  createMockPromise: (resolveValue, rejectValue) => {
    if (rejectValue) {
      return Promise.reject(rejectValue);
    }
    return Promise.resolve(resolveValue);
  },
};
