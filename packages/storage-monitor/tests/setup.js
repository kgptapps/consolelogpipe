/**
 * Test setup for storage-monitor package
 */

// Mock browser APIs that are not available in test environment
global.WebSocket = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1, // OPEN
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};
global.sessionStorage = sessionStorageMock;

// Mock document
global.document = {
  cookie: '',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock window
global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Reset localStorage mock
  localStorageMock.length = 0;
  localStorageMock.getItem.mockReturnValue(null);

  // Reset sessionStorage mock
  sessionStorageMock.length = 0;
  sessionStorageMock.getItem.mockReturnValue(null);

  // Reset document cookie
  global.document.cookie = '';
});
