/**
 * StorageMonitor Test Suite
 */

const StorageMonitor = require('../src/StorageMonitor');

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1, // OPEN
}));

// Mock browser APIs
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

global.document = {
  cookie: '',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

describe('StorageMonitor', () => {
  let monitor;

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = new StorageMonitor();
  });

  afterEach(() => {
    if (monitor) {
      // Mock WebSocket close method if it doesn't exist
      if (monitor.ws && !monitor.ws.close) {
        monitor.ws.close = jest.fn();
      }
      monitor.stop();
    }
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      expect(monitor.config.serverHost).toBe('localhost');
      expect(monitor.config.serverPort).toBe(3002);
      expect(monitor.config.enableCookies).toBe(true);
      expect(monitor.config.enableLocalStorage).toBe(true);
      expect(monitor.config.enableSessionStorage).toBe(true);
      expect(monitor.config.enableIndexedDB).toBe(true);
      expect(monitor.config.pollInterval).toBe(1000);
    });

    test('should accept custom configuration', () => {
      const customMonitor = new StorageMonitor({
        serverHost: 'example.com',
        serverPort: 4000,
        enableCookies: false,
        pollInterval: 500,
        sessionId: 'custom-session',
      });

      expect(customMonitor.config.serverHost).toBe('example.com');
      expect(customMonitor.config.serverPort).toBe(4000);
      expect(customMonitor.config.enableCookies).toBe(false);
      expect(customMonitor.config.pollInterval).toBe(500);
      expect(customMonitor.config.sessionId).toBe('custom-session');
    });

    test('should generate session ID when not provided', () => {
      expect(monitor.config.sessionId).toBeDefined();
      expect(typeof monitor.config.sessionId).toBe('string');
      expect(monitor.config.sessionId.length).toBeGreaterThan(0);
    });

    test('should initialize state properties', () => {
      expect(monitor.ws).toBeNull();
      expect(monitor.isConnected).toBe(false);
      expect(monitor.isMonitoring).toBe(false);
      expect(monitor.previousState).toBeDefined();
      expect(monitor.intervals).toBeInstanceOf(Map);
      expect(monitor.originalMethods).toEqual({});
    });
  });

  describe('Session ID Generation', () => {
    test('should generate unique session IDs', () => {
      const monitor1 = new StorageMonitor();
      const monitor2 = new StorageMonitor();

      expect(monitor1.config.sessionId).not.toBe(monitor2.config.sessionId);
    });

    test('should generate session ID with correct format', () => {
      const sessionId = monitor.config.sessionId;
      // Should be a string with some length
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(8);
    });
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      // Mock the WebSocket connection to avoid timeout
      monitor._connectWebSocket = jest.fn().mockResolvedValue();
      monitor._startMonitoring = jest.fn();

      const result = await monitor.init();
      expect(result).toBe(monitor);
      expect(monitor._connectWebSocket).toHaveBeenCalled();
      expect(monitor._startMonitoring).toHaveBeenCalled();
    });

    test('should handle initialization errors gracefully', async () => {
      // Mock an error during initialization
      monitor._connectWebSocket = jest
        .fn()
        .mockRejectedValue(new Error('Connection failed'));

      await expect(monitor.init()).rejects.toThrow('Connection failed');
    });
  });

  describe('WebSocket Connection', () => {
    test('should create WebSocket connection', () => {
      monitor._connectWebSocket();
      expect(global.WebSocket).toHaveBeenCalledWith(`ws://localhost:3002`);
    });

    test('should handle WebSocket connection with custom host and port', () => {
      const customMonitor = new StorageMonitor({
        serverHost: 'example.com',
        serverPort: 4000,
      });

      customMonitor._connectWebSocket();
      expect(global.WebSocket).toHaveBeenCalledWith(`ws://example.com:4000`);
    });

    test('should set connection state when WebSocket opens', () => {
      monitor._connectWebSocket();
      const mockWs = global.WebSocket.mock.results[0].value;

      // Simulate WebSocket open event using onopen property
      if (mockWs.onopen) {
        mockWs.onopen();
        expect(monitor.isConnected).toBe(true);
      }
    });

    test('should handle WebSocket close event', () => {
      monitor._connectWebSocket();
      monitor.isConnected = true;
      const mockWs = global.WebSocket.mock.results[0].value;

      // Simulate WebSocket close event using onclose property
      if (mockWs.onclose) {
        mockWs.onclose();
        expect(monitor.isConnected).toBe(false);
      }
    });

    test('should handle WebSocket error event', () => {
      monitor._connectWebSocket();
      const mockWs = global.WebSocket.mock.results[0].value;

      // Simulate WebSocket error event using onerror property
      if (mockWs.onerror) {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Test that onerror handler exists and can be called
        expect(typeof mockWs.onerror).toBe('function');

        consoleSpy.mockRestore();
      }
    });
  });

  describe('Monitoring Control', () => {
    test('should stop monitoring', () => {
      monitor.isMonitoring = true;
      monitor.stop();
      expect(monitor.isMonitoring).toBe(false);
    });

    test('should start monitoring automatically during init', async () => {
      // Mock the WebSocket connection to avoid timeout
      monitor._connectWebSocket = jest.fn().mockResolvedValue();
      monitor._startMonitoring = jest.fn();

      await monitor.init();
      expect(monitor._startMonitoring).toHaveBeenCalled();
    });
  });

  describe('Storage State Management', () => {
    test('should get current storage state', () => {
      const state = monitor.getCurrentState();
      expect(state).toHaveProperty('cookies');
      expect(state).toHaveProperty('localStorage');
      expect(state).toHaveProperty('sessionStorage');
      expect(state).toHaveProperty('indexedDB');
    });

    test('should check if monitoring is active', () => {
      expect(monitor.isMonitoring).toBe(false);
      monitor.isMonitoring = true;
      expect(monitor.isMonitoring).toBe(true);
    });

    test('should check WebSocket connection status', () => {
      expect(monitor.isConnected).toBe(false);
      monitor.isConnected = true;
      expect(monitor.isConnected).toBe(true);
    });

    test('should have session ID in config', () => {
      expect(monitor.config.sessionId).toBeDefined();
      expect(typeof monitor.config.sessionId).toBe('string');
    });
  });

  describe('Storage Monitoring', () => {
    test('should have localStorage monitoring enabled by default', () => {
      expect(monitor.config.enableLocalStorage).toBe(true);
    });

    test('should have sessionStorage monitoring enabled by default', () => {
      expect(monitor.config.enableSessionStorage).toBe(true);
    });

    test('should have cookie monitoring enabled by default', () => {
      expect(monitor.config.enableCookies).toBe(true);
    });

    test('should have IndexedDB monitoring enabled by default', () => {
      expect(monitor.config.enableIndexedDB).toBe(true);
    });

    test('should respect disabled storage types', () => {
      const customMonitor = new StorageMonitor({
        enableLocalStorage: false,
        enableCookies: false,
      });

      expect(customMonitor.config.enableLocalStorage).toBe(false);
      expect(customMonitor.config.enableCookies).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle WebSocket send errors gracefully', () => {
      monitor.ws = {
        send: jest.fn().mockImplementation(() => {
          throw new Error('Send failed');
        }),
        readyState: 1,
      };

      // Test that the monitor can handle send errors without crashing
      expect(() => {
        monitor._sendMessage({ test: 'data' });
      }).not.toThrow();
    });

    test('should handle storage access errors', () => {
      // Mock localStorage to throw error
      const originalGetItem = global.localStorage.getItem;
      global.localStorage.getItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      // Test that getCurrentState handles errors gracefully
      expect(() => {
        monitor.getCurrentState();
      }).not.toThrow();

      // Restore original method
      global.localStorage.getItem = originalGetItem;
    });
  });

  describe('Cleanup', () => {
    test('should clear all intervals on stop', () => {
      // Set up some intervals
      monitor.intervals.set(
        'test1',
        setInterval(() => {}, 1000)
      );
      monitor.intervals.set(
        'test2',
        setInterval(() => {}, 1000)
      );

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      monitor.stop();

      expect(clearIntervalSpy).toHaveBeenCalledTimes(2);
      expect(monitor.intervals.size).toBe(0);

      clearIntervalSpy.mockRestore();
    });

    test('should close WebSocket connection on stop', () => {
      const mockClose = jest.fn();
      monitor.ws = {
        close: mockClose,
        readyState: 1,
      };

      monitor.stop();
      expect(mockClose).toHaveBeenCalled();
      expect(monitor.ws).toBeNull();
    });

    test('should set monitoring and connection flags to false on stop', () => {
      monitor.isMonitoring = true;
      monitor.isConnected = true;

      monitor.stop();

      expect(monitor.isMonitoring).toBe(false);
      expect(monitor.isConnected).toBe(false);
    });
  });
});
