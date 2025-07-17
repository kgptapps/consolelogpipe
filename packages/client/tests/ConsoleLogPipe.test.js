/**
 * ConsoleLogPipe Tests
 *
 * Comprehensive test suite for the main ConsoleLogPipe API class
 */

const ConsoleLogPipe = require('../src/ConsoleLogPipe');

// Mock all dependencies
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

describe('ConsoleLogPipe', () => {
  let consoleLogPipe;
  let mockConsoleLog;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console.log
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

    consoleLogPipe = new ConsoleLogPipe({
      applicationName: 'test-app',
      sessionId: 'test-session-123',
    });
  });

  afterEach(() => {
    if (consoleLogPipe) {
      consoleLogPipe.destroy();
    }
    mockConsoleLog.mockRestore();
  });

  describe('constructor', () => {
    it('should use default port when not provided', () => {
      const clp = new ConsoleLogPipe();
      expect(clp.config.serverPort).toBe(3001);
    });

    it('should initialize with default configuration', () => {
      const clp = new ConsoleLogPipe({ port: 3001 });

      expect(clp.config.serverPort).toBe(3001);
      expect(clp.config.enableLogCapture).toBe(true);
      expect(clp.config.enableErrorCapture).toBe(true);
      expect(clp.config.enableNetworkCapture).toBe(true);
      expect(clp.config.serverHost).toBe('localhost');
      expect(clp.config.batchSize).toBe(10);
    });

    it('should merge custom configuration', () => {
      const clp = new ConsoleLogPipe({
        port: 3002,
        serverHost: 'custom-host',
        batchSize: 20,
        enableNetworkCapture: false,
      });

      expect(clp.config.serverPort).toBe(3002);
      expect(clp.config.serverHost).toBe('custom-host');
      expect(clp.config.batchSize).toBe(20);
      expect(clp.config.enableNetworkCapture).toBe(false);
    });

    it('should generate session ID if not provided', () => {
      const clp = new ConsoleLogPipe({ port: 3001 });

      expect(clp.config.sessionId).toMatch(/^clp_\d+_[a-z0-9]+$/);
    });

    it('should detect environment', () => {
      // Mock window.location for browser environment
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
      });

      const clp = new ConsoleLogPipe({ applicationName: 'test' });

      expect(clp.config.environment).toBe('development');
    });

    it('should use specified port', () => {
      const clp1 = new ConsoleLogPipe({ port: 3005 });
      const clp2 = new ConsoleLogPipe({ port: 3010 });

      expect(clp1.config.serverPort).toBe(3005);
      expect(clp2.config.serverPort).toBe(3010);
      expect(clp1.config.serverPort).not.toBe(clp2.config.serverPort);
    });
  });

  describe('init', () => {
    it('should initialize all enabled components', async () => {
      const { LogCapture } = require('../src/core/log');
      const { NetworkCapture } = require('../src/core/network');
      const ErrorCapture = require('../src/core/ErrorCapture');

      await consoleLogPipe.init();

      expect(LogCapture).toHaveBeenCalled();
      expect(ErrorCapture).toHaveBeenCalled();
      expect(NetworkCapture).toHaveBeenCalled();
      expect(consoleLogPipe.isInitialized).toBe(true);
    });

    it('should skip disabled components', async () => {
      const clp = new ConsoleLogPipe({
        applicationName: 'test',
        enableLogCapture: false,
        enableErrorCapture: false,
        enableNetworkCapture: false,
        enableRemoteLogging: false,
      });

      await clp.init();

      expect(clp.components.logCapture).toBeUndefined();
      expect(clp.components.errorCapture).toBeUndefined();
      expect(clp.components.networkCapture).toBeUndefined();
    });

    it('should initialize without logging to prevent recursion', async () => {
      await consoleLogPipe.init();

      // Session logging is disabled to prevent recursion issues
      // The initialization should complete successfully without logging
      expect(consoleLogPipe.isInitialized).toBe(true);
      expect(consoleLogPipe.config.sessionId).toBe('test-session-123');
    });

    it('should not initialize twice', async () => {
      await consoleLogPipe.init();
      const firstInitTime = consoleLogPipe.stats.startTime;

      await consoleLogPipe.init();

      expect(consoleLogPipe.stats.startTime).toBe(firstInitTime);
    });

    it('should handle initialization errors', async () => {
      const { LogCapture } = require('../src/core/log');
      LogCapture.mockImplementationOnce(() => {
        throw new Error('LogCapture initialization failed');
      });

      // Mock console.error to avoid noise in test output
      const mockConsoleError = jest
        .spyOn(console, 'error')
        .mockImplementation();

      await expect(consoleLogPipe.init()).rejects.toThrow(
        'LogCapture initialization failed'
      );

      mockConsoleError.mockRestore();
    });
  });

  describe('start', () => {
    beforeEach(async () => {
      await consoleLogPipe.init();
    });

    it('should start all components', () => {
      consoleLogPipe.start();

      expect(consoleLogPipe.components.logCapture.start).toHaveBeenCalled();
      expect(consoleLogPipe.components.errorCapture.start).toHaveBeenCalled();
      expect(consoleLogPipe.components.networkCapture.start).toHaveBeenCalled();
      expect(consoleLogPipe.isCapturing).toBe(true);
    });

    it('should throw if not initialized', () => {
      const clp = new ConsoleLogPipe({ applicationName: 'test' });

      expect(() => clp.start()).toThrow('must be initialized before starting');
    });

    it('should not start twice', () => {
      consoleLogPipe.start();
      const logCaptureSpy = consoleLogPipe.components.logCapture.start;
      logCaptureSpy.mockClear();

      consoleLogPipe.start();

      expect(logCaptureSpy).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      await consoleLogPipe.init();
      consoleLogPipe.start();
    });

    it('should stop all components', () => {
      consoleLogPipe.stop();

      expect(consoleLogPipe.components.logCapture.stop).toHaveBeenCalled();
      expect(consoleLogPipe.components.errorCapture.stop).toHaveBeenCalled();
      expect(consoleLogPipe.components.networkCapture.stop).toHaveBeenCalled();
      expect(consoleLogPipe.isCapturing).toBe(false);
    });

    it('should not stop if not capturing', () => {
      consoleLogPipe.stop();
      const logCaptureSpy = consoleLogPipe.components.logCapture.stop;
      logCaptureSpy.mockClear();

      consoleLogPipe.stop();

      expect(logCaptureSpy).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    beforeEach(async () => {
      await consoleLogPipe.init();
      consoleLogPipe.start();
    });

    it('should destroy all components and clean up', async () => {
      await consoleLogPipe.destroy();

      if (consoleLogPipe.components.transport) {
        expect(consoleLogPipe.components.transport.flush).toHaveBeenCalled();
        expect(consoleLogPipe.components.transport.destroy).toHaveBeenCalled();
      }
      expect(consoleLogPipe.isInitialized).toBe(false);
      expect(consoleLogPipe.isCapturing).toBe(false);
      expect(Object.keys(consoleLogPipe.components)).toHaveLength(0);
    });
  });

  describe('listeners', () => {
    beforeEach(async () => {
      await consoleLogPipe.init();
    });

    it('should add and remove listeners', () => {
      const listener = jest.fn();

      consoleLogPipe.addListener(listener);
      expect(consoleLogPipe.listeners.has(listener)).toBe(true);

      consoleLogPipe.removeListener(listener);
      expect(consoleLogPipe.listeners.has(listener)).toBe(false);
    });

    it('should validate listener is a function', () => {
      expect(() => consoleLogPipe.addListener('not a function')).toThrow(
        'Listener must be a function'
      );
    });

    it('should notify listeners on log data', () => {
      const listener = jest.fn();
      consoleLogPipe.addListener(listener);

      const logData = { level: 'info', message: 'test' };
      consoleLogPipe._handleLogData(logData);

      expect(listener).toHaveBeenCalledWith({
        type: 'log',
        data: expect.objectContaining({
          level: 'info',
          message: 'test',
        }),
      });
      expect(consoleLogPipe.stats.totalLogs).toBe(1);
    });

    it('should notify listeners on error data', () => {
      const listener = jest.fn();
      consoleLogPipe.addListener(listener);

      const errorData = { message: 'test error' };
      consoleLogPipe._handleErrorData(errorData);

      expect(listener).toHaveBeenCalledWith({ type: 'error', data: errorData });
      expect(consoleLogPipe.stats.totalErrors).toBe(1);
    });

    it('should notify listeners on network data', () => {
      const listener = jest.fn();
      consoleLogPipe.addListener(listener);

      const networkData = { url: 'https://example.com' };
      consoleLogPipe._handleNetworkData(networkData);

      expect(listener).toHaveBeenCalledWith({
        type: 'network',
        data: networkData,
      });
      expect(consoleLogPipe.stats.totalNetworkRequests).toBe(1);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      // Mock console.error to avoid noise in test output
      const mockConsoleError = jest
        .spyOn(console, 'error')
        .mockImplementation();

      consoleLogPipe.addListener(errorListener);
      consoleLogPipe.addListener(goodListener);

      const logData = { level: 'info', message: 'test' };
      consoleLogPipe._handleLogData(logData);

      expect(goodListener).toHaveBeenCalled();

      mockConsoleError.mockRestore();
    });
  });

  describe('configuration management', () => {
    it('should return configuration copy', () => {
      const config = consoleLogPipe.getConfig();

      expect(config.applicationName).toBe('test-app');

      // Verify it's a copy
      config.applicationName = 'modified';
      expect(consoleLogPipe.config.applicationName).toBe('test-app');
    });

    it('should update configuration', () => {
      consoleLogPipe.updateConfig({ batchSize: 50 });

      expect(consoleLogPipe.config.batchSize).toBe(50);
    });
  });

  describe('statistics and session info', () => {
    beforeEach(async () => {
      await consoleLogPipe.init();
    });

    it('should return statistics', () => {
      const stats = consoleLogPipe.getStats();

      expect(stats.totalLogs).toBe(0);
      expect(stats.totalErrors).toBe(0);
      expect(stats.totalNetworkRequests).toBe(0);
      expect(stats.startTime).toBeDefined();
      expect(stats.transport).toBeDefined();
    });

    it('should return session information', () => {
      const session = consoleLogPipe.getSession();

      expect(session.sessionId).toBe('test-session-123');
      expect(session.sessionId).toBe('test-session-123');
      expect(session.startTime).toBeDefined();
      expect(session.isCapturing).toBe(false);
    });
  });

  describe('flush', () => {
    beforeEach(async () => {
      await consoleLogPipe.init();
    });

    it('should flush transport', async () => {
      // Mock the flush method as a Jest function
      consoleLogPipe.components.transport.flush = jest.fn().mockResolvedValue();

      await consoleLogPipe.flush();

      expect(consoleLogPipe.components.transport.flush).toHaveBeenCalled();
    });

    it('should handle flush without transport', async () => {
      const clp = new ConsoleLogPipe({
        applicationName: 'test',
        enableRemoteLogging: false,
      });
      await clp.init();

      // Should not throw
      await clp.flush();
    });
  });

  describe('environment detection', () => {
    it('should detect staging environment', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'staging.example.com' },
        writable: true,
      });

      const clp = new ConsoleLogPipe({ applicationName: 'test' });
      expect(clp.config.environment).toBe('staging');
    });

    it('should detect production environment', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true,
      });

      const clp = new ConsoleLogPipe({ applicationName: 'test' });
      expect(clp.config.environment).toBe('production');
    });

    it('should handle non-browser environment', () => {
      const originalWindow = global.window;
      delete global.window;

      const clp = new ConsoleLogPipe({ applicationName: 'test' });
      expect(clp.config.environment).toBe('development');

      global.window = originalWindow;
    });
  });

  describe('data handlers', () => {
    beforeEach(async () => {
      await consoleLogPipe.init();
    });

    it('should send data to transport', () => {
      // Mock the send method as a Jest function
      consoleLogPipe.components.transport.send = jest.fn();

      const logData = { level: 'info', message: 'test' };
      consoleLogPipe._handleLogData(logData);

      expect(consoleLogPipe.components.transport.send).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: 'test',
        })
      );
    });

    it('should handle data without transport', () => {
      const clp = new ConsoleLogPipe({
        applicationName: 'test',
        enableRemoteLogging: false,
      });

      // Should not throw
      clp._handleLogData({ level: 'info', message: 'test' });
      clp._handleErrorData({ message: 'error' });
      clp._handleNetworkData({ url: 'https://example.com' });
    });
  });

  describe('edge cases', () => {
    it('should handle missing console', () => {
      const originalConsole = global.console;
      delete global.console;

      const clp = new ConsoleLogPipe({ applicationName: 'test' });

      // Should not throw during session info logging
      clp._logSessionInfo();

      global.console = originalConsole;
    });

    it('should handle component without destroy method', async () => {
      const clp = new ConsoleLogPipe({
        applicationName: 'test',
        enableRemoteLogging: false,
      });
      await clp.init();

      // Add a component without destroy method
      clp.components.mockComponent = { someMethod: jest.fn() };

      // Should not throw
      await clp.destroy();
    });
  });
});
