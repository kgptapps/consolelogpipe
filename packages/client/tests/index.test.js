/**
 * index.test.js - Tests for the main entry point
 */

const ConsoleLogPipeAPI = require('../src/index');

// Mock all dependencies to avoid actual initialization
// Mock WebSocket to prevent actual connections during tests
let mockWebSocketInstance;
global.WebSocket = jest.fn().mockImplementation(() => {
  mockWebSocketInstance = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
    readyState: 1, // OPEN
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null,
  };

  // Simulate immediate connection
  setTimeout(() => {
    if (mockWebSocketInstance.onopen) {
      mockWebSocketInstance.onopen({ type: 'open' });
    }
    // Trigger any 'open' event listeners
    const openListeners = mockWebSocketInstance.addEventListener.mock.calls
      .filter(call => call[0] === 'open')
      .map(call => call[1]);
    openListeners.forEach(listener => listener({ type: 'open' }));
  }, 0);

  return mockWebSocketInstance;
});

global.WebSocket.CONNECTING = 0;
global.WebSocket.OPEN = 1;
global.WebSocket.CLOSING = 2;
global.WebSocket.CLOSED = 3;

jest.mock('../src/core/log', () => ({
  LogCapture: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  })),
}));

jest.mock('../src/core/network', () => ({
  NetworkCapture: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  })),
}));

jest.mock('../src/core/ErrorCapture', () => {
  return jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  }));
});

describe('Index Module', () => {
  describe('Exports', () => {
    it('should export main API object', () => {
      expect(ConsoleLogPipeAPI).toBeDefined();
      // ConsoleLogPipeAPI is a function that can be called to create instances
      expect(typeof ConsoleLogPipeAPI).toBe('function');
    });

    it('should export init function', () => {
      expect(ConsoleLogPipeAPI.init).toBeDefined();
      expect(typeof ConsoleLogPipeAPI.init).toBe('function');
    });

    it('should export create function', () => {
      expect(ConsoleLogPipeAPI.create).toBeDefined();
      expect(typeof ConsoleLogPipeAPI.create).toBe('function');
    });

    it('should export ConsoleLogPipe class', () => {
      expect(ConsoleLogPipeAPI.ConsoleLogPipe).toBeDefined();
      expect(typeof ConsoleLogPipeAPI.ConsoleLogPipe).toBe('function');
    });

    it('should export version', () => {
      expect(ConsoleLogPipeAPI.version).toBeDefined();
      expect(ConsoleLogPipeAPI.version).toBe('2.4.8');
    });

    it('should export individual components', () => {
      expect(ConsoleLogPipeAPI.LogCapture).toBeDefined();
      expect(ConsoleLogPipeAPI.NetworkCapture).toBeDefined();
      expect(ConsoleLogPipeAPI.ErrorCapture).toBeDefined();
      // HttpTransport was removed - now using WebSocket directly in ConsoleLogPipe
    });
  });

  describe('create', () => {
    it('should create a ConsoleLogPipe instance', () => {
      const clp = ConsoleLogPipeAPI.create({ port: 3001 });

      expect(clp).toBeInstanceOf(ConsoleLogPipeAPI.ConsoleLogPipe);
      expect(clp.config.serverPort).toBe(3001);
    });

    it('should use default port when create called without it', () => {
      const instance = ConsoleLogPipeAPI.create();
      expect(instance.config.serverPort).toBe(3001);
    });
  });

  describe('init', () => {
    let clp;

    beforeEach(() => {
      // Mock console.log to avoid noise in test output
      jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(async () => {
      if (clp) {
        await clp.destroy();
      }
      jest.restoreAllMocks();
    });

    it('should create, initialize and start a ConsoleLogPipe instance', async () => {
      // Mock WebSocket to prevent timeout and simulate immediate connection
      global.WebSocket = jest.fn().mockImplementation(() => {
        const mockWs = {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          send: jest.fn(),
          close: jest.fn(),
          readyState: 1, // OPEN
          onopen: null,
          onclose: null,
          onerror: null,
          onmessage: null,
        };

        // Simulate immediate connection
        setTimeout(() => {
          if (mockWs.onopen) {
            mockWs.onopen({ type: 'open' });
          }
        }, 0);

        return mockWs;
      });

      clp = await ConsoleLogPipeAPI.init({ serverPort: 3002 });

      expect(clp).toBeInstanceOf(ConsoleLogPipeAPI.ConsoleLogPipe);
      expect(clp.config.serverPort).toBe(3002);
      expect(clp.isInitialized).toBe(true);
      expect(clp.isCapturing).toBe(true);
    }, 5000); // 5 second timeout should be enough
  });
});
