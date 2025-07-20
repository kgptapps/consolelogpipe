/**
 * Storage Monitor Index Test Suite
 */

const StorageMonitor = require('../src/StorageMonitor');

// Mock the StorageMonitor class
jest.mock('../src/StorageMonitor');

// Import the main module after mocking
const ConsoleLogPipeStorage = require('../src/index');

describe('ConsoleLogPipeStorage Index Module', () => {
  let storage;
  let mockMonitor;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock monitor instance
    mockMonitor = {
      init: jest.fn().mockResolvedValue({}),
      start: jest.fn().mockResolvedValue({}),
      stop: jest.fn(),
      getCurrentState: jest.fn().mockReturnValue({}),
      isMonitoring: jest.fn().mockReturnValue(false),
      isConnected: jest.fn().mockReturnValue(false),
      getSession: jest.fn().mockReturnValue({}),
      checkNow: jest.fn(),
    };

    StorageMonitor.mockImplementation(() => mockMonitor);

    storage = new ConsoleLogPipeStorage();
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      expect(storage.version).toBeDefined();
      expect(storage.monitor).toBeNull();
      expect(storage.config.serverHost).toBe('localhost');
      expect(storage.config.serverPort).toBe(3002);
      expect(storage.config.enableCookies).toBe(true);
      expect(storage.config.enableLocalStorage).toBe(true);
      expect(storage.config.enableSessionStorage).toBe(true);
      expect(storage.config.enableIndexedDB).toBe(true);
      expect(storage.config.pollInterval).toBe(1000);
      expect(storage.config.autoConnect).toBe(true);
    });

    test('should accept custom configuration', () => {
      const customStorage = new ConsoleLogPipeStorage({
        serverHost: 'example.com',
        serverPort: 4000,
        enableCookies: false,
        pollInterval: 500,
        autoConnect: false,
      });

      expect(customStorage.config.serverHost).toBe('example.com');
      expect(customStorage.config.serverPort).toBe(4000);
      expect(customStorage.config.enableCookies).toBe(false);
      expect(customStorage.config.pollInterval).toBe(500);
      expect(customStorage.config.autoConnect).toBe(false);
    });

    test('should have version information', () => {
      expect(storage.version).toBeDefined();
      expect(typeof storage.version).toBe('string');
    });
  });

  describe('Initialization', () => {
    test('should initialize with default options', async () => {
      const result = await storage.init();

      expect(StorageMonitor).toHaveBeenCalledWith(storage.config);
      expect(mockMonitor.init).toHaveBeenCalled();
      expect(storage.monitor).toBe(mockMonitor);
      expect(result).toBe(storage);
    });

    test('should merge initialization options with config', async () => {
      const initOptions = {
        serverPort: 5000,
        enableCookies: false,
      };

      await storage.init(initOptions);

      expect(storage.config.serverPort).toBe(5000);
      expect(storage.config.enableCookies).toBe(false);
      expect(storage.config.serverHost).toBe('localhost'); // Should keep default
    });

    test('should auto-connect when autoConnect is true', async () => {
      storage.config.autoConnect = true;
      await storage.init();

      expect(mockMonitor.init).toHaveBeenCalled();
    });

    test('should not auto-connect when autoConnect is false', async () => {
      storage.config.autoConnect = false;
      await storage.init();

      expect(mockMonitor.init).not.toHaveBeenCalled();
    });

    test('should handle initialization errors', async () => {
      mockMonitor.init.mockRejectedValue(new Error('Init failed'));

      await expect(storage.init()).rejects.toThrow('Init failed');
    });

    test('should call StorageMonitor constructor with config', async () => {
      await storage.init();

      expect(StorageMonitor).toHaveBeenCalledWith(storage.config);
      expect(storage.monitor).toBeDefined();
    });
  });

  describe('Control Methods', () => {
    beforeEach(async () => {
      await storage.init();
    });

    test('should start monitoring when not connected', async () => {
      mockMonitor.isConnected = false;
      const result = await storage.start();

      expect(mockMonitor.init).toHaveBeenCalled();
      expect(result).toBe(storage);
    });

    test('should not reinitialize when already connected', async () => {
      mockMonitor.isConnected = true;
      const result = await storage.start();

      expect(result).toBe(storage);
    });

    test('should stop monitoring', () => {
      const result = storage.stop();

      expect(mockMonitor.stop).toHaveBeenCalled();
      expect(result).toBe(storage);
    });

    test('should throw error when starting without initialization', async () => {
      const uninitializedStorage = new ConsoleLogPipeStorage();

      await expect(uninitializedStorage.start()).rejects.toThrow(
        'Storage monitor not initialized'
      );
    });

    test('should not throw error when stopping without initialization', () => {
      const uninitializedStorage = new ConsoleLogPipeStorage();

      expect(() => uninitializedStorage.stop()).not.toThrow();
    });
  });

  describe('State Methods', () => {
    beforeEach(async () => {
      await storage.init();
    });

    test('should get current state', () => {
      const mockState = { cookies: [], localStorage: [] };
      mockMonitor.getCurrentState.mockReturnValue(mockState);

      const result = storage.getCurrentState();

      expect(mockMonitor.getCurrentState).toHaveBeenCalled();
      expect(result).toBe(mockState);
    });

    test('should check if monitoring', () => {
      mockMonitor.isMonitoring = true;

      const result = storage.isMonitoring();

      expect(result).toBe(true);
    });

    test('should check if connected', () => {
      mockMonitor.isConnected = true;

      const result = storage.isConnected();

      expect(result).toBe(true);
    });

    test('should get session info', () => {
      const result = storage.getSession();

      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('serverPort');
      expect(result).toHaveProperty('isConnected');
      expect(result).toHaveProperty('isMonitoring');
      expect(result).toHaveProperty('enabledFeatures');
    });

    test('should trigger immediate check when monitoring', () => {
      mockMonitor.isMonitoring = true;
      mockMonitor._sendStorageUpdate = jest.fn();

      const result = storage.checkNow();

      expect(mockMonitor.getCurrentState).toHaveBeenCalled();
      expect(result).toBe(storage);
    });

    test('should return null when getting state without initialization', () => {
      const uninitializedStorage = new ConsoleLogPipeStorage();

      const result = uninitializedStorage.getCurrentState();
      expect(result).toBeNull();
    });

    test('should return false when checking monitoring status without initialization', () => {
      const uninitializedStorage = new ConsoleLogPipeStorage();

      const result = uninitializedStorage.isMonitoring();
      expect(result).toBe(false);
    });

    test('should return false when checking connection status without initialization', () => {
      const uninitializedStorage = new ConsoleLogPipeStorage();

      const result = uninitializedStorage.isConnected();
      expect(result).toBe(false);
    });

    test('should return session info even without initialization', () => {
      const uninitializedStorage = new ConsoleLogPipeStorage();

      const result = uninitializedStorage.getSession();
      expect(result).toHaveProperty('sessionId');
      expect(result.isConnected).toBe(false);
      expect(result.isMonitoring).toBe(false);
    });

    test('should not crash when triggering check without initialization', () => {
      const uninitializedStorage = new ConsoleLogPipeStorage();

      expect(() => uninitializedStorage.checkNow()).not.toThrow();
    });
  });

  describe('Static Methods', () => {
    test('should have static init method', async () => {
      const result = await ConsoleLogPipeStorage.init();

      expect(result).toBeInstanceOf(ConsoleLogPipeStorage);
      expect(result.monitor).toBeDefined();
    });

    test('should pass options to static init', async () => {
      const options = { serverPort: 4000 };
      const result = await ConsoleLogPipeStorage.init(options);

      expect(result.config.serverPort).toBe(4000);
    });

    test('should have static create method', () => {
      const options = { serverPort: 5000 };
      const result = ConsoleLogPipeStorage.create(options);

      expect(result).toBeInstanceOf(ConsoleLogPipeStorage);
      expect(result.config.serverPort).toBe(5000);
      expect(result.monitor).toBeNull(); // Should not be initialized
    });
  });

  describe('Error Handling', () => {
    test('should handle start errors gracefully', async () => {
      await storage.init();
      mockMonitor.init.mockRejectedValue(new Error('Start failed'));
      mockMonitor.isConnected = false;

      await expect(storage.start()).rejects.toThrow('Start failed');
    });

    test('should handle state retrieval errors gracefully', async () => {
      await storage.init();
      mockMonitor.getCurrentState.mockImplementation(() => {
        throw new Error('State retrieval failed');
      });

      expect(() => storage.getCurrentState()).toThrow('State retrieval failed');
    });
  });

  describe('Configuration Management', () => {
    test('should preserve original config after init with options', async () => {
      const originalConfig = { ...storage.config };
      await storage.init({ serverPort: 9999 });

      // Config should be updated
      expect(storage.config.serverPort).toBe(9999);
      // But other values should remain
      expect(storage.config.serverHost).toBe(originalConfig.serverHost);
    });

    test('should handle empty options object', async () => {
      const originalConfig = { ...storage.config };
      await storage.init({});

      expect(storage.config).toEqual(originalConfig);
    });

    test('should handle null options', async () => {
      const originalConfig = { ...storage.config };
      await storage.init(null);

      expect(storage.config).toEqual(originalConfig);
    });
  });
});
