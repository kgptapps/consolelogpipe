// Jest setup file for Console Log Pipe tests

// Mock browser APIs that might not be available in test environment
global.XMLHttpRequest =
  global.XMLHttpRequest ||
  class XMLHttpRequest {
    constructor() {
      this.readyState = 0;
      this.status = 0;
      this.statusText = '';
      this.responseText = '';
      this.response = '';
    }

    open() {}
    send() {}
    setRequestHeader() {}
    addEventListener() {}
    removeEventListener() {}
  };

global.fetch =
  global.fetch ||
  jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    })
  );

// Mock WebSocket
global.WebSocket =
  global.WebSocket ||
  class WebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 1; // OPEN
      this.CONNECTING = 0;
      this.OPEN = 1;
      this.CLOSING = 2;
      this.CLOSED = 3;
    }

    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };

// Mock console methods to avoid interference with tests
const originalConsole = { ...console };
global.originalConsole = originalConsole;

// Suppress console output during tests unless explicitly needed
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Restore console for specific tests that need it
global.restoreConsole = () => {
  global.console = originalConsole;
};

// Mock process.exit to prevent tests from actually exiting
if (typeof process !== 'undefined') {
  const originalExit = process.exit;
  process.exit = jest.fn();

  // Restore process.exit after tests
  afterAll(() => {
    process.exit = originalExit;
  });
}

// Set up jsdom environment globals
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    port: '3000',
  },
  writable: true,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Environment)',
  },
  writable: true,
});

// Increase timeout for async tests
jest.setTimeout(10000);
